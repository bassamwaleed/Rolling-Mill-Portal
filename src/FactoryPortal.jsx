import React, { useState, useEffect, useRef } from 'react';
import {
  AlertTriangle, CheckCircle, RotateCcw, RefreshCw, Trash2, Clock,
  X, History, Lock, ArrowLeftRight, FileSpreadsheet, FileText, Inbox,
  Cpu, Building2, Disc, Share2, Copy, Users, Link2, Database
} from 'lucide-react';
import { signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc, setDoc, onSnapshot } from 'firebase/firestore';
import { auth, db } from './firebase';

import ElectricityPage from './ElectricityPage';
import RollingPage from './RollingPage';
import ReportsPage, {
  downloadExcel,
  printPDF,
  openPrintHTML,
  buildTempReportHTML,
  buildMaintReportHTML
} from './ReportsPage';

const ALGIOSHY_STANDS_CONFIG = [
  { type: 'بيضاوي', rollCode: '111', diameter: '380', hardness: '42 HRC', totalPasses: 6, maxLimit: 2500 },
  { type: 'مربع', rollCode: '207', diameter: '374', hardness: '45 HRC', totalPasses: 9, maxLimit: 2500 },
  { type: 'بيضاوي', rollCode: '307', diameter: '356', hardness: '46 HRC', totalPasses: 10, maxLimit: 2000 },
  { type: 'مربع', rollCode: '404', diameter: '400', hardness: '47 HRC', totalPasses: 15, maxLimit: 2000 },
  { type: 'بيضاوي', rollCode: '505', diameter: '371', hardness: '46 HRC', totalPasses: 14, maxLimit: 2000 },
  { type: 'مربع', rollCode: '604', diameter: '394', hardness: '47 HRC', totalPasses: 18, maxLimit: 2000 },
  { type: 'بيضاوي', rollCode: '70/ov', diameter: '340', hardness: '48 HRC', totalPasses: 15, maxLimit: 1500 },
  { type: 'دائري', rollCode: '804', diameter: '315', hardness: '45 HRC', totalPasses: 20, maxLimit: 1500 },
  { type: 'بيضاوي', rollCode: '90/ov', diameter: '345', hardness: '48 HRC', totalPasses: 19, maxLimit: 1000 },
  { type: '16 mm', rollCode: 'F16/15', diameter: '332', hardness: '51 HRC', totalPasses: 24, maxLimit: 1000 },
  { type: '16 mm', rollCode: 'F16/16', diameter: '332', hardness: '51 HRC', totalPasses: 24, maxLimit: 1000 },
  { type: '16 mm', rollCode: 'F16/17', diameter: '332', hardness: '51 HRC', totalPasses: 24, maxLimit: 1000 }
].map((c, i) => ({ ...c, id: String(i + 1), name: `ستاند ${i + 1}` }));

const CLEAN_NEW_FACTORY_STANDS_CONFIG = Array.from({ length: 12 }, (_, i) => ({
  id: String(i + 1),
  name: `ستاند ${i + 1}`,
  type: i % 2 === 0 ? 'بيضاوي' : 'دائري / مربع',
  rollCode: `R-${i + 1}`,
  diameter: i < 4 ? '400' : i < 8 ? '350' : '320',
  hardness: '48 HRC',
  totalPasses: i < 4 ? 8 : i < 8 ? 14 : 20,
  maxLimit: i < 6 ? 2000 : 1200
}));

const SHIFTS_NORMAL = ['الوردية الأولى', 'الوردية الثانية', 'الوردية الثالثة'];
const SHIFTS_FRIDAY = ['الوردية الأولى (12 ساعة)', 'الوردية الثانية (12 ساعة)'];
const shiftsFor = (isFri) => (isFri ? SHIFTS_FRIDAY : SHIFTS_NORMAL);

const FACTORY_TABS = [
  ['rolling', 'قسم الدرافيل والتشغيل', Disc],
  ['electricity', 'قسم الكهرباء والمواتير', Cpu],
  ['reports', 'التقارير والأرشيف', FileText],
  ['staff', 'الموظفين والأكواد', Users]
];
const ASSIGNABLE_TABS = FACTORY_TABS.filter(([k]) => k !== 'staff');
const ASSIGNABLE_TAB_KEYS = ASSIGNABLE_TABS.map(([k]) => k);

const LEGACY_TAB_MAP = {
  dashboard: 'rolling',
  rollshop: 'rolling',
  recipes: 'rolling',
  downtime: 'rolling',
  motors: 'electricity',
  archive: 'reports'
};

const normalizeTab = (t) => LEGACY_TAB_MAP[t] || (FACTORY_TABS.some(([k]) => k === t) ? t : 'rolling');
const normalizeAccess = (arr) => {
  if (!Array.isArray(arr)) return null;
  return [...new Set(arr.map((k) => LEGACY_TAB_MAP[k] || k).filter((k) => ASSIGNABLE_TAB_KEYS.includes(k)))];
};
const accessFor = (emp) => (emp.role === 'manager' || !Array.isArray(emp.access) ? null : normalizeAccess(emp.access));
const firstTabOf = (access) => (access ? (FACTORY_TABS.find(([k]) => access.includes(k)) || [])[0] || 'rolling' : 'rolling');

const formatDateToISO = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const formatDateToGB = (iso) => {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
};
const getMonthKey = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;

const createPassesArray = (count, activePassNum = 1, initialTons = 0) =>
  Array.from({ length: count }, (_, idx) => {
    const pNum = idx + 1;
    const isCurrent = pNum === activePassNum;
    return { passNumber: pNum, status: isCurrent ? 'active' : 'unused', tons: isCurrent ? initialTons : 0, order: isCurrent ? 1 : null, sizeLabel: '' };
  });

const buildStand = (cfg) => {
  const todayGB = new Date().toLocaleDateString('en-GB');
  const totalPasses = Number(cfg.totalPasses) || 12;
  return {
    id: String(cfg.id), name: cfg.name || `ستاند ${cfg.id}`, type: cfg.type ?? '', rollCode: cfg.rollCode ?? '',
    diameter: cfg.diameter ?? '', hardness: cfg.hardness ?? '', entryDate: todayGB, totalPasses, activePass: 1,
    passes: createPassesArray(totalPasses, 1, 0), isActive: true, accumulatedTons: 0,
    creditedShiftKey: '', creditedShiftTons: 0, creditedShiftBillets: 0, maxLimit: Number(cfg.maxLimit) || 1500, lastResetDate: todayGB
  };
};

const buildInitialStandsForFactory = (factoryId) =>
  (factoryId === 'al-gioshy-steel-rolls' ? ALGIOSHY_STANDS_CONFIG : CLEAN_NEW_FACTORY_STANDS_CONFIG).map(buildStand);

const normalizeStand = (stand, fallbackIndex, factoryId) => {
  const baseCfg = factoryId === 'al-gioshy-steel-rolls' ? ALGIOSHY_STANDS_CONFIG : CLEAN_NEW_FACTORY_STANDS_CONFIG;
  const cfg = baseCfg[fallbackIndex] || {
    id: String(fallbackIndex + 1), name: `ستاند ${fallbackIndex + 1}`, type: '', rollCode: '', diameter: '', hardness: '', totalPasses: 12, maxLimit: 1500
  };
  const id = String(stand?.id || cfg.id);
  const totalPasses = Number(stand?.totalPasses) || cfg.totalPasses || 12;
  const activePass = Number(stand?.activePass) || 1;
  const currentTons = Number(stand?.accumulatedTons) || 0;
  let passes = stand?.passes;
  if (!Array.isArray(passes) || passes.length !== totalPasses) {
    passes = createPassesArray(totalPasses, activePass, currentTons);
  } else {
    passes = passes.map((p) => (p.passNumber === activePass ? { ...p, status: 'active', tons: currentTons, order: p.order || 1 } : p));
  }
  return {
    ...stand, id, name: stand?.name || `ستاند ${id}`, type: stand?.type ?? cfg.type, rollCode: stand?.rollCode ?? cfg.rollCode,
    diameter: stand?.diameter ?? cfg.diameter, hardness: stand?.hardness ?? cfg.hardness,
    entryDate: stand?.entryDate || stand?.lastResetDate || new Date().toLocaleDateString('en-GB'),
    maxLimit: Number(stand?.maxLimit) || cfg.maxLimit || 1500, isActive: stand?.isActive !== undefined ? stand.isActive : true,
    accumulatedTons: currentTons, creditedShiftKey: stand?.creditedShiftKey || '', creditedShiftTons: Number(stand?.creditedShiftTons) || 0,
    creditedShiftBillets: Number(stand?.creditedShiftBillets) || 0, totalPasses, activePass, passes
  };
};

const normalizeList = (raw, factoryId) =>
  !Array.isArray(raw) || raw.length === 0 ? buildInitialStandsForFactory(factoryId) : raw.map((st, idx) => normalizeStand(st, idx, factoryId));

const applyPassChange = (list, req, billetWeight, approver, archiveList = []) => {
  const idx = list.findIndex((s) => String(s.id) === String(req.standId));
  if (idx < 0) return null;
  const st = { ...list[idx] };
  const prev = st.activePass;
  const shiftKey = `${req.date}__${req.shift}`;
  const existingShiftLog = (archiveList || []).find((l) => l.date === req.date && l.shift === req.shift);
  const base = {
    id: Date.now() + Math.floor(Math.random() * 1000),
    standId: st.id, standName: st.name, date: req.date,
    time: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
    shift: req.shift, productSize: req.productSize, requestedBy: req.requestedBy || approver, approvedBy: approver
  };
  let log;
  if (req.kind === 'newRoll') {
    const total = st.passes.reduce((a, p) => a + (Number(p.tons) || 0), 0);
    st.entryDate = req.date; st.lastResetDate = req.date; st.activePass = 1; st.accumulatedTons = 0;
    st.creditedShiftKey = ''; st.creditedShiftTons = 0; st.creditedShiftBillets = 0;
    st.passes = createPassesArray(st.totalPasses, 1, 0);
    log = { ...base, kind: 'newRoll', fromPass: prev, toPass: 1, tons: total, billetsAtChange: 0, notes: req.notes || 'تركيب درفيل جديد' };
  } else {
    const target = Number(req.targetPass) || prev;
    const billetsOnOld = Math.max(0, Number(req.billets) || 0);
    const tonsOnOld = billetsOnOld * billetWeight;
    const curAcc = Number(st.accumulatedTons) || 0;
    let finalOldPassTons = curAcc;
    let newPassOpeningTons = 0;
    if (billetsOnOld > 0) {
      if (existingShiftLog) {
        const shiftTotalTons = Number(existingShiftLog.tons) || 0;
        finalOldPassTons = Math.max(0, curAcc - shiftTotalTons) + tonsOnOld;
        newPassOpeningTons = Math.max(0, shiftTotalTons - tonsOnOld);
        st.creditedShiftKey = ''; st.creditedShiftTons = 0; st.creditedShiftBillets = 0;
      } else {
        finalOldPassTons = curAcc + tonsOnOld;
        st.creditedShiftKey = shiftKey;
        st.creditedShiftTons = (st.creditedShiftKey === shiftKey ? Number(st.creditedShiftTons) || 0 : 0) + tonsOnOld;
        st.creditedShiftBillets = (st.creditedShiftKey === shiftKey ? Number(st.creditedShiftBillets) || 0 : 0) + billetsOnOld;
      }
    } else {
      st.creditedShiftKey = ''; st.creditedShiftTons = 0; st.creditedShiftBillets = 0;
    }
    const maxOrder = Math.max(0, ...st.passes.map((p) => p.order || 0));
    st.passes = st.passes.map((p) => {
      if (p.passNumber === prev && prev !== target) return { ...p, status: 'used', tons: finalOldPassTons, order: p.order || Math.max(1, maxOrder) };
      if (p.passNumber === target) return { ...p, status: 'active', tons: newPassOpeningTons, order: prev === target ? p.order || 1 : p.order ? p.order : maxOrder + 1 };
      return p;
    });
    st.activePass = target; st.accumulatedTons = newPassOpeningTons; st.lastResetDate = req.date;
    log = {
      ...base, kind: 'pass', fromPass: prev, toPass: target, tons: finalOldPassTons, billetsAtChange: billetsOnOld,
      notes: req.notes || (billetsOnOld > 0 ? `نقل من ممر ${prev} إلى ممر ${target} بعد سحب ${billetsOnOld} كتلة` : `نقل من ممر ${prev} إلى ممر ${target}`)
    };
  }
  const newList = [...list];
  newList[idx] = st;
  return { list: newList, log };
};

const LiveClock = () => {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="flex bg-slate-800 border border-slate-700 rounded-lg px-2 py-0.5 items-center gap-1.5 shadow-inner">
      <Clock className="w-3 h-3 text-blue-400" />
      <span className="text-[10px] font-mono font-bold text-slate-100" dir="ltr">
        {time.toLocaleTimeString('en-US', { hour12: true, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
      </span>
    </div>
  );
};

const Overlay = ({ z = 50, children }) => (
  <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-2.5 sm:p-4 backdrop-blur-sm" style={{ zIndex: z }}>
    {children}
  </div>
);

export default function FactoryPortal({ onBack, factoryConfig }) {
  const appId = factoryConfig?.id || 'al-gioshy-steel-rolls';
  const factoryName = factoryConfig?.name || 'شركة الجيوشي للصلب';

  const [currentUser, setCurrentUser] = useState('none');
  const [loggedEmployeeName, setLoggedEmployeeName] = useState('');
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [loggedEmployeeId, setLoggedEmployeeId] = useState('');
  const [isLinkEntry] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('via') === 'link' || (!!params.get('f') && window.history.state === null);
  });
  const [activeTab, setActiveTabState] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return normalizeTab(params.get('tab') || 'rolling');
  });
  const [userAuth, setUserAuth] = useState(null);
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  const getInitialProductionState = () => {
    const now = new Date();
    const hour = now.getHours();
    const prodDate = new Date(now);
    if (hour < 8) prodDate.setDate(prodDate.getDate() - 1);
    const fri = prodDate.getDay() === 5;
    const initialShift = fri
      ? hour >= 8 && hour < 20 ? SHIFTS_FRIDAY[0] : SHIFTS_FRIDAY[1]
      : hour >= 8 && hour < 16 ? SHIFTS_NORMAL[0] : hour >= 16 && hour < 24 ? SHIFTS_NORMAL[1] : SHIFTS_NORMAL[2];
    return { prodDate, initialShift };
  };
  const initState = getInitialProductionState();
  const [currentProdDate, setCurrentProdDate] = useState(initState.prodDate);
  const [selectedShift, setSelectedShift] = useState(initState.initialShift);
  const isFriday = currentProdDate.getDay() === 5;
  const availableShifts = shiftsFor(isFriday);
  const activeMonthKey = getMonthKey(currentProdDate);
  const currentDateStr = currentProdDate.toLocaleDateString('en-GB');

  const [stands, setStands] = useState(() => buildInitialStandsForFactory(appId));
  const [customLogo, setCustomLogo] = useState('');
  const [billetWeight, setBilletWeight] = useState(0.75);
  const [selectedProductSize, setSelectedProductSize] = useState('16');
  const [staffList, setStaffList] = useState([]);
  const [pendingList, setPendingList] = useState([]);
  const [motorsList, setMotorsList] = useState([]);
  const [recipesList, setRecipesList] = useState([]);
  const [rollShopList, setRollShopList] = useState([]);

  const [productionArchive, setProductionArchive] = useState([]);
  const [passChanges, setPassChanges] = useState([]);
  const [downtimesList, setDowntimesList] = useState([]);
  const [tempShiftLogs, setTempShiftLogs] = useState([]);
  const [shiftMaintLogs, setShiftMaintLogs] = useState([]);

  const [adminState, setAdminState] = useState({
    isMaintenance: false,
    maintenanceMessage: 'الموقع مغلق حالياً لإجراء تحديثات وصيانة للنظام.. يرجى المحاولة لاحقاً.',
    techCode: factoryConfig?.techCode || '1111',
    managerCode: factoryConfig?.managerCode || '2222',
    adminCode: factoryConfig?.adminCode || '9999',
    visitsCount: 0,
    lastVisit: ''
  });

  const [shiftBillets, setShiftBillets] = useState('');
  const [whatsappModalOpen, setWhatsappModalOpen] = useState(false);
  const [addStandOpen, setAddStandOpen] = useState(false);
  const [rollModal, setRollModal] = useState({ isOpen: false, standIndex: null, isEditingInfo: false });
  const [resetModal, setResetModal] = useState({ isOpen: false, standIndex: null });
  const [resetBillets, setResetBillets] = useState('');
  const [resetNotes, setResetNotes] = useState('');
  const [resetDateInput, setResetDateInput] = useState('');
  const [resetShiftInput, setResetShiftInput] = useState('');
  const [resetTargetPass, setResetTargetPass] = useState(null);
  const [historyModal, setHistoryModal] = useState({ isOpen: false, standId: null });
  const [approvalsOpen, setApprovalsOpen] = useState(false);
  const [dupModal, setDupModal] = useState(false);
  const [quickPinInput, setQuickPinInput] = useState('');
  const [quickPinError, setQuickPinError] = useState('');
  const [newStaffForm, setNewStaffForm] = useState({ name: '', pin: '', role: 'tech', jobTitle: 'مشغل غرفة تحكم', access: [...ASSIGNABLE_TAB_KEYS] });
  const [modal, setModal] = useState({ isOpen: false, type: '', title: '', message: '', onConfirm: null });

  const closeBox = () => setModal((m) => ({ ...m, isOpen: false }));
  const showAlert = (title, message) => setModal({ isOpen: true, type: 'alert', title, message, onConfirm: null });
  const showConfirm = (title, message, onConfirm) => setModal({ isOpen: true, type: 'confirm', title, message, onConfirm });

  const isManagerLike = currentUser === 'manager' || currentUser === 'admin';
  const roleLabel = loggedEmployeeName || (currentUser === 'tech' ? 'فني تشغيل' : currentUser === 'manager' ? 'مدير المصنع' : 'أدمن');
  const loggedEmployee = loggedEmployeeId ? staffList.find((emp) => emp.id === loggedEmployeeId) : null;
  const allowedTabs = loggedEmployeeId ? (loggedEmployee ? accessFor(loggedEmployee) : []) : null;
  const canAccessTab = (tab) => !allowedTabs || allowedTabs.includes(tab);
  const isSupervisorLogin = !!loggedEmployee && loggedEmployee.role === 'supervisor';

  useEffect(() => {
    document.title = `SteelPortal - ${factoryName}`;
  }, [factoryName]);

  useEffect(() => {
    if (!availableShifts.includes(selectedShift)) setSelectedShift(availableShifts[0]);
  }, [isFriday]);

  const setActiveTab = (newTab) => {
    setActiveTabState(newTab);
    const params = new URLSearchParams(window.location.search);
    params.set('mode', 'factory');
    params.set('f', appId);
    params.set('tab', newTab);
    window.history.pushState({ mode: 'factory', f: appId, tab: newTab }, '', `?${params.toString()}`);
  };

  useEffect(() => {
    if (!auth) { setIsDataLoaded(true); return; }
    signInAnonymously(auth).catch((e) => console.error(e));
    return onAuthStateChanged(auth, setUserAuth);
  }, []);

  // 1. البيانات الأساسية لشاشة الدخول
  useEffect(() => {
    if (!userAuth || !db) return;
    const ref = (name) => doc(db, 'factory', appId, 'data', name);
    const u1 = onSnapshot(ref('settingsState'), (snap) => {
      if (snap.exists()) {
        const d = snap.data();
        setBilletWeight(d.billetWeight || 0.75);
        setCustomLogo(d.logoUrl || '');
        setSelectedProductSize(d.selectedProductSize || '16');
      }
      setIsDataLoaded(true);
    });
    const u2 = onSnapshot(ref('adminState'), (snap) => snap.exists() && setAdminState((prev) => ({ ...prev, ...snap.data() })));
    const u3 = onSnapshot(ref('staffState'), (snap) => snap.exists() && Array.isArray(snap.data().staff) && setStaffList(snap.data().staff));
    return () => { u1(); u2(); u3(); };
  }, [userAuth, appId]);

  // 2. تحميل البيانات + استرداد الداتا القديمة تلقائياً لو مستند الشهر لسه جديد
  useEffect(() => {
    if (!userAuth || !db || currentUser === 'none') return;
    const ref = (name) => doc(db, 'factory', appId, 'data', name);
    const unsubs = [];

    unsubs.push(
      onSnapshot(ref('standsState'), (snap) => {
        if (snap.exists() && Array.isArray(snap.data().standsList)) {
          setStands(normalizeList(snap.data().standsList, appId));
        } else {
          const init = buildInitialStandsForFactory(appId);
          setDoc(ref('standsState'), { factoryId: appId, factoryName, standsList: init });
          setStands(init);
        }
      })
    );

    if (activeTab === 'rolling' || activeTab === 'reports') {
      unsubs.push(onSnapshot(ref('pendingState'), (snap) => snap.exists() && setPendingList(snap.data().pendingList || [])));
      unsubs.push(
        onSnapshot(doc(db, 'factory', appId, 'ops_months', activeMonthKey), async (snap) => {
          if (snap.exists()) {
            const d = snap.data();
            setProductionArchive(d.archiveList || []);
            setPassChanges(d.passChangesList || []);
            setDowntimesList(d.downtimes || []);
          } else {
            // استرداد الداتا القديمة تلقائياً من المسارات السابقة
            try {
              const [aSnap, pSnap, dSnap] = await Promise.all([
                getDoc(ref('archiveState')),
                getDoc(ref('passChangesState')),
                getDoc(ref('downtimesState'))
              ]);
              setProductionArchive(aSnap.exists() ? aSnap.data().archiveList || [] : []);
              setPassChanges(pSnap.exists() ? pSnap.data().passChangesList || [] : []);
              setDowntimesList(dSnap.exists() ? dSnap.data().downtimes || [] : []);
            } catch (e) {
              console.error('Legacy ops load error:', e);
            }
          }
        })
      );
    }

    if (activeTab === 'rolling') {
      unsubs.push(onSnapshot(ref('rollShopState'), (snap) => snap.exists() && setRollShopList(snap.data().rolls || [])));
      unsubs.push(onSnapshot(ref('recipesState'), (snap) => snap.exists() && setRecipesList(snap.data().recipes || [])));
    }

    if (activeTab === 'electricity' || activeTab === 'reports') {
      unsubs.push(onSnapshot(ref('motorsState'), (snap) => snap.exists() && setMotorsList(snap.data().motors || [])));
      unsubs.push(
        onSnapshot(doc(db, 'factory', appId, 'motor_months', activeMonthKey), async (snap) => {
          if (snap.exists()) {
            const d = snap.data();
            setTempShiftLogs(d.tempShiftLogs || []);
            setShiftMaintLogs(d.shiftMaintLogs || []);
          } else {
            // استرداد سجلات الحرارة والصيانة القديمة تلقائياً من motorsState
            try {
              const mSnap = await getDoc(ref('motorsState'));
              if (mSnap.exists()) {
                setTempShiftLogs(mSnap.data().tempShiftLogs || []);
                setShiftMaintLogs(mSnap.data().shiftMaintLogs || []);
              } else {
                setTempShiftLogs([]);
                setShiftMaintLogs([]);
              }
            } catch (e) {
              console.error('Legacy motors load error:', e);
            }
          }
        })
      );
    }

    return () => unsubs.forEach((u) => u && u());
  }, [userAuth, appId, factoryName, currentUser, activeTab, activeMonthKey]);

  const save = async (payload = {}) => {
    if (!userAuth || !db) return;
    const dataRef = (name) => doc(db, 'factory', appId, 'data', name);
    const opsMonthRef = doc(db, 'factory', appId, 'ops_months', activeMonthKey);
    const motorMonthRef = doc(db, 'factory', appId, 'motor_months', activeMonthKey);
    try {
      if (payload.stands !== undefined) await setDoc(dataRef('standsState'), { factoryId: appId, standsList: payload.stands }, { merge: true });
      if (payload.pending !== undefined) await setDoc(dataRef('pendingState'), { factoryId: appId, pendingList: payload.pending }, { merge: true });
      if (payload.admin !== undefined) await setDoc(dataRef('adminState'), { factoryId: appId, ...payload.admin }, { merge: true });
      if (payload.motors !== undefined) await setDoc(dataRef('motorsState'), { factoryId: appId, motors: payload.motors }, { merge: true });
      if (payload.recipes !== undefined) await setDoc(dataRef('recipesState'), { factoryId: appId, recipes: payload.recipes }, { merge: true });
      if (payload.rollShop !== undefined) await setDoc(dataRef('rollShopState'), { factoryId: appId, rolls: payload.rollShop }, { merge: true });
      if (payload.staff !== undefined) await setDoc(dataRef('staffState'), { factoryId: appId, staff: payload.staff }, { merge: true });

      const opsUpd = { factoryId: appId, month: activeMonthKey };
      if (payload.archive !== undefined) opsUpd.archiveList = payload.archive;
      if (payload.changes !== undefined) opsUpd.passChangesList = payload.changes;
      if (payload.downtimes !== undefined) opsUpd.downtimes = payload.downtimes;
      if (Object.keys(opsUpd).length > 2) await setDoc(opsMonthRef, opsUpd, { merge: true });

      const motUpd = { factoryId: appId, month: activeMonthKey };
      if (payload.tempLogs !== undefined) motUpd.tempShiftLogs = payload.tempLogs;
      if (payload.shiftMaint !== undefined) motUpd.shiftMaintLogs = payload.shiftMaint;
      if (Object.keys(motUpd).length > 2) await setDoc(motorMonthRef, motUpd, { merge: true });

      const setUpd = { factoryId: appId };
      if (payload.weight !== undefined) setUpd.billetWeight = payload.weight;
      if (payload.logo !== undefined) setUpd.logoUrl = payload.logo;
      if (payload.productSize !== undefined) setUpd.selectedProductSize = payload.productSize;
      if (Object.keys(setUpd).length > 1) await setDoc(dataRef('settingsState'), setUpd, { merge: true });
    } catch (e) {
      console.error('Save error:', e);
    }
  };

  // تعديل صلاحيات الأقسام لأي موظف (قديم أو جديد)
  const handleToggleStaffTab = (id, tab) => {
    const updated = staffList.map((emp) => {
      if (emp.id !== id) return emp;
      const current = accessFor(emp) || [...ASSIGNABLE_TAB_KEYS];
      const next = current.includes(tab) ? current.filter((k) => k !== tab) : [...current, tab];
      return { ...emp, access: next };
    });
    const target = updated.find((emp) => emp.id === id);
    if (target && target.access.length === 0) {
      showAlert('تنبيه', 'يجب أن يبقى للموظف قسم واحد على الأقل. لإيقاف دخوله بالكامل استخدم زر "إيقاف".');
      return;
    }
    save({ staff: updated });
  };

  const secretTapCount = useRef(0);
  const secretTapTimer = useRef(null);
  const handleSecretAdminTrigger = () => {
    secretTapCount.current += 1;
    if (secretTapTimer.current) clearTimeout(secretTapTimer.current);
    if (secretTapCount.current >= 5) {
      secretTapCount.current = 0;
      if (isSuperAdmin) { setCurrentUser('admin'); setActiveTab('staff'); }
    } else {
      secretTapTimer.current = setTimeout(() => { secretTapCount.current = 0; }, 1500);
    }
  };

  const handleQuickPinLogin = (e) => {
    e.preventDefault();
    const code = quickPinInput.trim();
    if (!code) return;
    if (code === adminState.adminCode) {
      setIsSuperAdmin(true); setLoggedEmployeeName('م. بسام (Admin)'); setCurrentUser('admin'); setActiveTab('rolling'); setQuickPinInput(''); return;
    }
    if (code === adminState.managerCode) {
      setIsSuperAdmin(false); setLoggedEmployeeName('مدير المصنع'); setCurrentUser('manager'); setActiveTab('rolling'); setQuickPinInput(''); return;
    }
    const foundEmp = staffList.find((emp) => emp.pin === code);
    if (foundEmp) {
      if (!foundEmp.active) { setQuickPinError('تم إيقاف هذا الحساب بواسطة مدير المصنع.'); return; }
      const access = accessFor(foundEmp);
      if (access && access.length === 0) { setQuickPinError('لا توجد أقسام مسموحة لهذا الحساب.'); return; }
      setIsSuperAdmin(false); setLoggedEmployeeName(foundEmp.name); setLoggedEmployeeId(foundEmp.id);
      setCurrentUser(foundEmp.role === 'manager' ? 'manager' : 'tech'); setActiveTab(firstTabOf(access)); setQuickPinInput(''); return;
    }
    if (code === adminState.techCode) {
      setIsSuperAdmin(false); setLoggedEmployeeName('فني الإنتاج'); setCurrentUser('tech'); setActiveTab('rolling'); setQuickPinInput(''); return;
    }
    setQuickPinError('الكود غير صحيح! تأكد من الكود الشخصي.');
  };

  const handleLogout = () => {
    setCurrentUser('none'); setLoggedEmployeeName(''); setLoggedEmployeeId(''); setIsSuperAdmin(false); setActiveTab('rolling');
  };

  const handleDateChange = (dir) => {
    const nd = new Date(currentProdDate);
    nd.setDate(nd.getDate() + dir);
    setCurrentProdDate(nd);
    setSelectedShift(shiftsFor(nd.getDay() === 5)[0]);
  };
  const handleGoToToday = () => {
    const s = getInitialProductionState();
    setCurrentProdDate(new Date(s.prodDate.getTime()));
    setSelectedShift(s.initialShift);
  };

  const existingShiftLog = productionArchive.find((l) => l.date === currentDateStr && l.shift === selectedShift);
  const currentShiftDowntimes = downtimesList.filter((d) => d.date === currentDateStr && d.shift === selectedShift);
  const currentShiftDownMins = currentShiftDowntimes.reduce((a, d) => a + (Number(d.durationMins) || 0), 0);
  const currentShiftPassChanges = passChanges.filter((c) => c.date === currentDateStr && c.shift === selectedShift);

  const buildWhatsAppSummaryText = () => {
    const dayName = currentProdDate.toLocaleDateString('ar-EG', { weekday: 'long' });
    const billets = existingShiftLog ? existingShiftLog.billets : Number(shiftBillets) || 0;
    const tons = existingShiftLog ? existingShiftLog.tons.toFixed(1) : (billets * billetWeight).toFixed(1);
    const changesStr = currentShiftPassChanges.length === 0 ? 'لا يوجد تغييرات ممرات' : currentShiftPassChanges.map((c) => `• ${c.standName}: ${c.kind === 'newRoll' ? 'درفيل جديد' : `ممر ${c.fromPass} ← ${c.toPass}`}`).join('\n');
    const downStr = currentShiftDowntimes.length === 0 ? 'تشغيل مستمر 100%' : currentShiftDowntimes.map((d) => `• ${d.standName} (${d.durationMins}ق): ${d.reason}`).join('\n');
    return `🏭 *تقرير وردية - ${factoryName}*\n📅 ${dayName} (${currentDateStr}) | ${selectedShift}\n📊 الإنتاج: *${billets} بيليت* (*${tons} طن*) | مقاس ${selectedProductSize} مم\n⏱️ التوقفات (${currentShiftDownMins}ق):\n${downStr}\n🔄 الممرات:\n${changesStr}`;
  };

  const commitShift = (mode) => {
    setDupModal(false);
    const n = Number(shiftBillets);
    if (n <= 0 || isNaN(n)) return;
    const newTons = n * billetWeight;
    const existing = productionArchive.find((l) => l.date === currentDateStr && l.shift === selectedShift);
    const shiftKey = `${currentDateStr}__${selectedShift}`;
    const now = new Date();
    const saveTime = now.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
    const dayName = currentProdDate.toLocaleDateString('ar-EG', { weekday: 'long' });

    const newStands = stands.map((s) => {
      if (!s.isActive) return s;
      const alreadyCredited = s.creditedShiftKey === shiftKey ? Number(s.creditedShiftTons) || 0 : 0;
      const deltaTons = mode === 'replace' && existing ? newTons - existing.tons : !existing && alreadyCredited > 0 ? Math.max(0, newTons - alreadyCredited) : newTons;
      const tons = Math.max(0, s.accumulatedTons + deltaTons);
      return { ...s, accumulatedTons: tons, creditedShiftKey: '', creditedShiftTons: 0, creditedShiftBillets: 0, passes: s.passes.map((p) => (p.passNumber === s.activePass ? { ...p, status: 'active', tons, order: p.order || 1 } : p)) };
    });

    const archive = existing
      ? productionArchive.map((l) => (l === existing ? { ...l, billets: mode === 'replace' ? n : l.billets + n, tons: mode === 'replace' ? newTons : l.tons + newTons, time: saveTime, by: roleLabel, productSize: selectedProductSize, timestamp: now.getTime() } : l))
      : [{ id: Date.now(), date: currentDateStr, dayName, time: saveTime, shift: selectedShift, billets: n, tons: newTons, by: roleLabel, productSize: selectedProductSize, timestamp: now.getTime() }, ...productionArchive];

    save({ stands: newStands, archive });
    setShiftBillets('');
  };

  const handleAddShiftProduction = () => {
    const n = Number(shiftBillets);
    if (n <= 0 || isNaN(n)) return;
    if (existingShiftLog) { setDupModal(true); return; }
    commitShift('add');
  };

  const openStandRollPage = (index) => setRollModal({ isOpen: true, standIndex: index, isEditingInfo: false });

  const initiateResetStand = (index, preselectedPassNum = null, e = null) => {
    if (e) e.stopPropagation();
    const st = stands[index];
    setResetBillets(''); setResetNotes(''); setResetDateInput(formatDateToISO(currentProdDate)); setResetShiftInput(selectedShift);
    const next = st.passes.find((p) => p.status === 'unused' && p.passNumber !== st.activePass);
    setResetTargetPass(preselectedPassNum || (next ? next.passNumber : st.activePass));
    setResetModal({ isOpen: true, standIndex: index });
  };

  const submitChange = (req) => {
    if (isManagerLike) {
      const r = applyPassChange(stands, req, billetWeight, roleLabel, productionArchive);
      if (r) save({ stands: r.list, changes: [r.log, ...passChanges] });
      return;
    }
    save({ pending: [req, ...pendingList] });
    showAlert('تم إرسال الطلب', 'تم إرسال طلب التغيير للمدير.');
  };

  const confirmResetStand = () => {
    const st = stands[resetModal.standIndex];
    if (!st) return;
    submitChange({
      id: Date.now(), kind: 'pass', status: 'pending', standId: st.id, standName: st.name, fromPass: st.activePass,
      targetPass: Number(resetTargetPass) || st.activePass, billets: Number(resetBillets) || 0, notes: resetNotes,
      date: formatDateToGB(resetDateInput) || currentDateStr, shift: resetShiftInput, productSize: selectedProductSize, requestedBy: roleLabel
    });
    setResetModal({ isOpen: false, standIndex: null });
  };

  const reportData = { factoryName, stands, archive: productionArchive, changes: passChanges, downtimes: downtimesList, motors: motorsList, tempShiftLogs, billetWeight };
  const blockedAlert = () => showAlert('تعذر الفتح', 'اسمح بالنوافذ المنبثقة لهذا الموقع وجرّب تاني.');

  const exportButtons = (
    <div className="flex flex-wrap gap-1">
      <button onClick={() => setWhatsappModalOpen(true)} className="bg-green-600 hover:bg-green-700 text-white font-bold py-1.5 px-2.5 rounded-lg text-[10px] flex items-center gap-1">
        <Share2 className="w-3 h-3" /> واتساب
      </button>
      <button onClick={() => downloadExcel(reportData)} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-1.5 px-2.5 rounded-lg text-[10px] flex items-center gap-1">
        <FileSpreadsheet className="w-3 h-3" /> Excel
      </button>
      <button onClick={() => printPDF(reportData, blockedAlert)} className="bg-rose-600 hover:bg-rose-700 text-white font-bold py-1.5 px-2.5 rounded-lg text-[10px] flex items-center gap-1">
        <FileText className="w-3 h-3" /> PDF
      </button>
    </div>
  );

  const pendingCount = pendingList.filter((r) => r.status === 'pending').length;
  const selectedRollStand = rollModal.standIndex !== null ? stands[rollModal.standIndex] : null;
  const resetStandObj = resetModal.standIndex !== null ? stands[resetModal.standIndex] : null;

  if (currentUser === 'none') {
    return (
      <div className="flex flex-col items-center justify-center min-h-dvh bg-slate-50 text-slate-900 p-3.5 sm:p-6 select-none font-sans" dir="rtl">
        <div className="bg-white p-5 sm:p-8 rounded-2xl sm:rounded-3xl max-w-sm w-full text-center border border-slate-200 shadow-lg space-y-4">
          <div onClick={handleSecretAdminTrigger} className="cursor-pointer inline-block w-full">
            {customLogo ? (
              <div className="w-full flex justify-center mb-2 bg-slate-50 p-2 rounded-xl border border-slate-200">
                <img src={customLogo} alt="Factory Logo" className="h-14 sm:h-16 object-contain" />
              </div>
            ) : (
              <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-center mb-1">
                <Building2 className="w-6 h-6 sm:w-9 sm:h-9 text-emerald-600" />
              </div>
            )}
          </div>
          <div>
            <h1 onClick={handleSecretAdminTrigger} className="text-lg sm:text-2xl font-black text-slate-900 cursor-pointer">{factoryName}</h1>
            <p className="text-[11px] sm:text-xs text-emerald-700 font-bold mt-1 flex items-center justify-center gap-1">
              <Database className="w-3.5 h-3.5" /> قاعدة بيانات مستقلة
            </p>
          </div>

          {!isDataLoaded ? (
            <div className="text-slate-400 animate-pulse text-xs sm:text-sm font-bold py-4">جاري الاتصال بقاعدة البيانات...</div>
          ) : (
            <form onSubmit={handleQuickPinLogin} className="space-y-3 pt-1">
              <input
                type="password"
                autoFocus
                value={quickPinInput}
                onChange={(e) => { setQuickPinInput(e.target.value); setQuickPinError(''); }}
                placeholder="أدخل الكود الشخصي..."
                className="w-full bg-slate-50 border-2 border-slate-300 focus:border-blue-600 focus:bg-white rounded-xl p-2.5 sm:p-3 text-center font-mono text-lg tracking-widest text-slate-900 outline-none"
              />
              {quickPinError && <p className="text-xs font-bold text-red-600 bg-red-50 border border-red-200 p-2 rounded-lg">{quickPinError}</p>}
              <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-3 rounded-xl shadow-md text-xs sm:text-sm">
                تسجيل الدخول للنظام
              </button>
            </form>
          )}

          {onBack && !isLinkEntry && (
            <button onClick={onBack} className="w-full pt-1 text-slate-400 hover:text-slate-700 text-xs font-bold flex items-center justify-center gap-1">
              <RotateCcw className="w-3.5 h-3.5" /> العودة للبوابة الرئيسية
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-slate-100 text-slate-900 font-sans flex flex-col p-1.5 sm:p-2.5 gap-2" dir="rtl">
      {modal.isOpen && (
        <Overlay z={100}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden border border-slate-200">
            <div className="p-4">
              <h3 className="font-bold text-base text-slate-800 flex items-center gap-2">
                {modal.type === 'alert' ? <CheckCircle className="text-green-500 w-5 h-5" /> : <AlertTriangle className="text-orange-500 w-5 h-5" />}
                {modal.title}
              </h3>
              <p className="text-xs text-slate-600 mt-2 leading-relaxed whitespace-pre-line">{modal.message}</p>
            </div>
            <div className="bg-slate-50 p-3 flex justify-end gap-2 border-t border-slate-100">
              {modal.type === 'confirm' && <button onClick={closeBox} className="px-4 py-2 bg-slate-200 rounded-lg font-bold text-slate-700 text-xs">إلغاء</button>}
              <button onClick={() => { const cb = modal.onConfirm; closeBox(); if (cb) cb(); }} className="px-4 py-2 bg-blue-600 text-white rounded-lg font-bold text-xs shadow">موافق</button>
            </div>
          </div>
        </Overlay>
      )}

      {whatsappModalOpen && (
        <Overlay z={95}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-300 flex flex-col max-h-[90vh]">
            <div className="bg-green-700 text-white p-3 flex justify-between items-center">
              <h3 className="font-black text-xs sm:text-sm flex items-center gap-2"><Share2 className="w-4 h-4" /> ملخص تقرير الوردية للواتساب</h3>
              <button onClick={() => setWhatsappModalOpen(false)}><X className="w-5 h-5" /></button>
            </div>
            <div className="p-3.5 space-y-3 overflow-y-auto">
              <pre className="bg-slate-900 text-emerald-300 p-3 rounded-xl text-xs font-sans whitespace-pre-wrap">{buildWhatsAppSummaryText()}</pre>
              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => { navigator.clipboard.writeText(buildWhatsAppSummaryText()); showAlert('تم النسخ', 'تم نسخ الملخص بنجاح.'); }} className="bg-slate-800 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5">
                  <Copy className="w-3.5 h-3.5" /> نسخ النص
                </button>
                <button onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(buildWhatsAppSummaryText())}`, '_blank')} className="bg-green-600 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5">
                  <Share2 className="w-3.5 h-3.5" /> إرسال لواتساب
                </button>
              </div>
            </div>
          </div>
        </Overlay>
      )}

      {dupModal && existingShiftLog && (
        <Overlay z={95}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden border border-amber-300">
            <div className="bg-amber-500 text-slate-950 p-3 font-black text-sm flex items-center gap-2"><AlertTriangle className="w-5 h-5" /> الوردية مسجلة مسبقاً</div>
            <div className="p-4 flex flex-col gap-2.5 text-xs">
              <button onClick={() => commitShift('replace')} className="w-full bg-red-600 text-white font-bold py-2.5 rounded-lg">استبدال الرقم المسجل ({Number(shiftBillets)} بليت)</button>
              <button onClick={() => commitShift('add')} className="w-full bg-blue-600 text-white font-bold py-2.5 rounded-lg">إضافة على المسجل ({existingShiftLog.billets + Number(shiftBillets)} بليت)</button>
              <button onClick={() => setDupModal(false)} className="w-full bg-slate-200 text-slate-700 font-bold py-2 rounded-lg">إلغاء</button>
            </div>
          </div>
        </Overlay>
      )}

      {rollModal.isOpen && selectedRollStand && (() => {
        const st = selectedRollStand;
        const pct = Math.min(100, Math.max(0, (st.accumulatedTons / st.maxLimit) * 100));
        return (
          <Overlay z={50}>
            <div className="bg-slate-100 rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden border border-slate-300 flex flex-col max-h-[92vh]">
              <div className="bg-slate-900 text-white p-3.5 flex justify-between items-center">
                <h3 className="font-black text-sm sm:text-lg">{st.name} — ممر {st.activePass}/{st.totalPasses} ({pct.toFixed(0)}%)</h3>
                <button onClick={() => setRollModal({ isOpen: false, standIndex: null, isEditingInfo: false })} className="bg-slate-800 p-1.5 rounded-lg"><X className="w-5 h-5" /></button>
              </div>
              <div className="p-3 overflow-y-auto flex-1 flex flex-col gap-2.5">
                <div className="flex flex-wrap gap-1.5 bg-white p-2 rounded-xl border border-slate-200">
                  <button onClick={() => initiateResetStand(rollModal.standIndex)} className="bg-blue-600 text-white font-bold px-3 py-1.5 rounded-lg text-xs flex items-center gap-1">
                    <ArrowLeftRight className="w-3.5 h-3.5" /> {isManagerLike ? 'تغيير الممر' : 'طلب تغيير ممر'}
                  </button>
                  <button onClick={() => showConfirm('تركيب درفيل جديد', 'تصفير جميع الممرات والبدء من ممر 1؟', () => submitChange({ id: Date.now(), kind: 'newRoll', status: 'pending', standId: st.id, standName: st.name, fromPass: st.activePass, date: currentDateStr, shift: selectedShift, productSize: selectedProductSize, requestedBy: roleLabel, notes: 'تركيب درفيل جديد' }))} className="bg-emerald-50 text-emerald-800 font-bold px-2.5 py-1.5 rounded-lg text-xs border border-emerald-300 flex items-center gap-1">
                    <RefreshCw className="w-3.5 h-3.5" /> درفيل جديد
                  </button>
                  <button onClick={() => setHistoryModal({ isOpen: true, standId: st.id })} className="bg-slate-100 text-slate-800 font-bold px-2.5 py-1.5 rounded-lg text-xs border border-slate-300 flex items-center gap-1">
                    <History className="w-3.5 h-3.5" /> السجل
                  </button>
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5">
                  {st.passes.map((p) => {
                    const isCurrent = p.status === 'active' || p.passNumber === st.activePass;
                    const isUsed = !isCurrent && p.status === 'used';
                    return (
                      <div
                        key={p.passNumber}
                        onClick={() => !isCurrent && initiateResetStand(rollModal.standIndex, p.passNumber)}
                        className={`rounded-xl border-2 p-2 flex flex-col gap-1 ${isCurrent ? 'bg-slate-900 text-white border-amber-400' : isUsed ? 'bg-blue-50 text-blue-950 border-blue-300 cursor-pointer' : 'bg-white text-slate-700 border-slate-200 cursor-pointer'}`}
                      >
                        <span className="font-black text-[11px]">ممر {p.passNumber}</span>
                        <span className={`font-mono font-black text-lg text-center ${isCurrent ? 'text-amber-400' : isUsed ? 'text-blue-900' : 'text-slate-300'}`}>{Number(p.tons || 0).toFixed(0)} ط</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </Overlay>
        );
      })()}

      {resetModal.isOpen && resetStandObj && (
        <Overlay z={60}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-300 flex flex-col max-h-[90vh]">
            <div className="bg-slate-900 p-3 flex justify-between items-center text-white">
              <h3 className="font-bold text-xs sm:text-sm">تغيير ممر - {resetStandObj.name}</h3>
              <button onClick={() => setResetModal({ isOpen: false, standIndex: null })}><X className="w-5 h-5" /></button>
            </div>
            <div className="p-3.5 flex flex-col gap-3 overflow-y-auto">
              <div className="grid grid-cols-6 gap-1.5 bg-slate-100 p-2 rounded-xl max-h-36 overflow-y-auto">
                {resetStandObj.passes.map((p) => (
                  <button key={p.passNumber} type="button" onClick={() => setResetTargetPass(p.passNumber)} className={`p-1.5 rounded-lg font-mono text-xs font-black border-2 ${Number(resetTargetPass) === p.passNumber ? 'bg-emerald-600 text-white border-emerald-900' : 'bg-white text-slate-800 border-slate-300'}`}>
                    {p.passNumber}
                  </button>
                ))}
              </div>
              <input type="number" value={resetBillets} onChange={(e) => setResetBillets(e.target.value)} className="w-full border border-amber-400 rounded-lg p-2 font-mono text-sm font-black" placeholder="عدد كتل الممر القديم بالوردية (0 لو أول الوردية)" />
              <input type="text" value={resetNotes} onChange={(e) => setResetNotes(e.target.value)} className="w-full border border-slate-300 rounded-lg p-2 text-xs" placeholder="ملاحظات..." />
              <button onClick={confirmResetStand} className="w-full bg-blue-600 text-white font-bold py-2.5 rounded-xl text-xs">تأكيد النقل إلى ممر {resetTargetPass}</button>
            </div>
          </div>
        </Overlay>
      )}

      {approvalsOpen && isManagerLike && (
        <Overlay z={70}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden border border-slate-300 flex flex-col max-h-[85vh]">
            <div className="bg-slate-900 p-3 flex justify-between items-center text-white">
              <h3 className="font-bold text-xs sm:text-sm">طلبات بانتظار الموافقة ({pendingCount})</h3>
              <button onClick={() => setApprovalsOpen(false)}><X className="w-5 h-5" /></button>
            </div>
            <div className="p-3 overflow-y-auto space-y-2 bg-slate-50">
              {pendingCount === 0 && <div className="text-center py-6 text-slate-400 font-bold text-xs">لا توجد طلبات معلقة.</div>}
              {pendingList.filter((r) => r.status === 'pending').map((r) => (
                <div key={r.id} className="bg-white border border-slate-200 rounded-xl p-3 flex justify-between items-center text-xs">
                  <div>
                    <span className="font-black text-slate-900">{r.standName}</span>
                    <p className="text-slate-500 font-bold">{r.kind === 'newRoll' ? 'درفيل جديد' : `ممر ${r.fromPass} ← ${r.targetPass}`} ({r.requestedBy})</p>
                  </div>
                  <div className="flex gap-1.5">
                    <button onClick={() => save({ pending: pendingList.filter((x) => x.id !== r.id) })} className="bg-red-50 text-red-700 border border-red-300 font-bold px-3 py-1 rounded-lg">رفض</button>
                    <button onClick={() => { const res = applyPassChange(stands, r, billetWeight, roleLabel, productionArchive); if (res) save({ stands: res.list, changes: [res.log, ...passChanges], pending: pendingList.filter((x) => x.id !== r.id) }); }} className="bg-emerald-600 text-white font-bold px-3 py-1 rounded-lg">اعتماد</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Overlay>
      )}

      <nav className="bg-slate-900 text-white p-2 sm:p-2.5 rounded-2xl flex flex-col gap-2 shadow-md select-none">
        <div className="flex justify-between items-center gap-1.5">
          <div onClick={handleSecretAdminTrigger} className="flex items-center gap-2 cursor-pointer min-w-0">
            {customLogo ? (
              <div className="bg-white p-1 rounded-lg flex shrink-0"><img src={customLogo} alt="Logo" className="h-5 sm:h-6 w-auto max-w-[70px] object-contain" /></div>
            ) : (
              <div className="bg-emerald-600 p-1.5 rounded-xl shrink-0"><Building2 className="w-4 h-4 text-white" /></div>
            )}
            <div className="truncate">
              <span className="font-black text-xs sm:text-sm text-white block truncate">{factoryName}</span>
              <span className="text-[10px] text-emerald-400 font-bold block truncate">{roleLabel} • شهر {activeMonthKey}</span>
            </div>
          </div>
          <div className="hidden md:block"><LiveClock /></div>
          <div className="flex items-center gap-1 shrink-0">
            <button onClick={() => setWhatsappModalOpen(true)} className="bg-green-600 hover:bg-green-500 text-white px-2 py-1.5 rounded-xl text-[10px] font-bold flex items-center gap-1">
              <Share2 className="w-3 h-3" /> واتساب
            </button>
            {isManagerLike && (
              <button onClick={() => setApprovalsOpen(true)} className="relative bg-amber-500 text-slate-950 p-1.5 rounded-xl">
                <Inbox className="w-3.5 h-3.5" />
                {pendingCount > 0 && <span className="absolute -top-1 -left-1 bg-red-600 text-white text-[9px] font-black rounded-full min-w-[15px] h-3.5 px-1 flex items-center justify-center">{pendingCount}</span>}
              </button>
            )}
            <button onClick={handleLogout} className="bg-red-500/20 text-red-300 border border-red-500/30 px-2 py-1.5 rounded-xl text-[10px] font-bold">خروج</button>
          </div>
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
          {FACTORY_TABS.filter(([k]) => (k !== 'staff' || isManagerLike) && canAccessTab(k)).map(([k, label, Icon]) => (
            <button
              key={k}
              onClick={() => setActiveTab(k)}
              className={`px-3 py-1.5 text-[11px] font-bold rounded-xl flex items-center gap-1.5 whitespace-nowrap shrink-0 transition-all ${
                activeTab === k ? 'bg-blue-600 text-white shadow-sm' : 'bg-slate-800/90 text-slate-300 hover:bg-slate-800'
              }`}
            >
              <Icon className="w-3.5 h-3.5 shrink-0" />
              <span>{label}</span>
            </button>
          ))}
        </div>
      </nav>

      {!canAccessTab(activeTab) && (
        <div className="flex-1 bg-white rounded-2xl border border-slate-200 p-6 flex flex-col items-center justify-center gap-2 text-center">
          <Lock className="w-8 h-8 text-slate-400" />
          <h2 className="font-black text-sm text-slate-800">هذا القسم مغلق</h2>
          <p className="text-xs text-slate-500 font-bold">ليس لديك صلاحية دخول هذا القسم.</p>
        </div>
      )}

      {activeTab === 'rolling' && canAccessTab('rolling') && (
        <RollingPage
          factoryName={factoryName}
          stands={stands}
          pendingList={pendingList}
          downtimesList={downtimesList}
          rollShopList={rollShopList}
          recipesList={recipesList}
          selectedProductSize={selectedProductSize}
          setSelectedProductSize={setSelectedProductSize}
          billetWeight={billetWeight}
          shiftBillets={shiftBillets}
          setShiftBillets={setShiftBillets}
          currentProdDate={currentProdDate}
          currentDateStr={currentDateStr}
          selectedShift={selectedShift}
          setSelectedShift={setSelectedShift}
          availableShifts={availableShifts}
          isManagerLike={isManagerLike}
          roleLabel={roleLabel}
          exportButtons={exportButtons}
          handleDateChange={handleDateChange}
          handleGoToToday={handleGoToToday}
          handleAddShiftProduction={handleAddShiftProduction}
          handleProductSizeChange={(sz) => { setSelectedProductSize(sz); save({ stands: stands.map((s) => ({ ...s, isActive: true })), productSize: sz }); }}
          handleWeightChange={(v) => Number(v) > 0 && save({ weight: Number(v) })}
          handleToggleActive={(idx, e) => { e?.stopPropagation(); save({ stands: stands.map((s, i) => (i === idx ? { ...s, isActive: !s.isActive } : s)) }); }}
          openStandRollPage={openStandRollPage}
          initiateResetStand={initiateResetStand}
          setAddStandOpen={setAddStandOpen}
          handleResetAllStands={() => showConfirm('تصفير الكل', 'تصفير كافة الستاندات والممرات؟', () => save({ stands: stands.map((s) => ({ ...s, activePass: 1, accumulatedTons: 0, passes: createPassesArray(s.totalPasses, 1, 0) })) }))}
          handleClearArchive={() => showConfirm('مسح الأرشيف', 'مسح أرشيف الشهر الحالي بالكامل؟', () => save({ archive: [], changes: [] }))}
          save={save}
          showAlert={showAlert}
          showConfirm={showConfirm}
        />
      )}

      {activeTab === 'electricity' && canAccessTab('electricity') && (
        <ElectricityPage
          factoryName={factoryName}
          stands={stands}
          motorsList={motorsList}
          tempShiftLogs={tempShiftLogs}
          shiftMaintLogs={shiftMaintLogs}
          selectedShift={selectedShift}
          setSelectedShift={setSelectedShift}
          availableShifts={availableShifts}
          currentDateStr={currentDateStr}
          currentProdDate={currentProdDate}
          roleLabel={roleLabel}
          isManagerLike={isManagerLike}
          isSupervisorLogin={isSupervisorLogin}
          save={save}
          showAlert={showAlert}
          showConfirm={showConfirm}
          onPrintTempNow={() => openPrintHTML(buildTempReportHTML({ factoryName, tempShiftLogs, from: formatDateToISO(currentProdDate), to: formatDateToISO(currentProdDate), shift: selectedShift }), blockedAlert)}
          onPrintMaintNow={() => openPrintHTML(buildMaintReportHTML({ factoryName, motors: motorsList, shiftMaintLogs, from: formatDateToISO(currentProdDate), to: formatDateToISO(currentProdDate), shift: selectedShift, types: [], status: 'all' }), blockedAlert)}
        />
      )}

      {activeTab === 'reports' && canAccessTab('reports') && (
        <ReportsPage
          factoryName={factoryName}
          productionArchive={productionArchive}
          motorsList={motorsList}
          tempShiftLogs={tempShiftLogs}
          shiftMaintLogs={shiftMaintLogs}
          exportButtons={exportButtons}
          showAlert={showAlert}
        />
      )}

      {activeTab === 'staff' && isManagerLike && (
        <div className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-200 p-3 sm:p-4 space-y-3">
          <div className="bg-slate-900 text-white p-3 rounded-2xl flex flex-wrap justify-between items-center gap-2">
            <h2 className="font-black text-xs sm:text-base flex items-center gap-1.5"><Users className="w-4 h-4 text-amber-400" /> إدارة الموظفين والأكواد ({factoryName})</h2>
            <button
              onClick={() => {
                const url = `${window.location.origin}${window.location.pathname}?mode=factory&f=${encodeURIComponent(appId)}&via=link`;
                navigator.clipboard.writeText(url);
                showAlert('تم النسخ', `تم نسخ رابط الموظفين:\n${url}`);
              }}
              className="bg-amber-500 text-slate-950 font-black px-3 py-1.5 rounded-xl text-xs flex items-center gap-1"
            >
              <Link2 className="w-3.5 h-3.5" /> نسخ رابط الموظفين
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!newStaffForm.name.trim() || !newStaffForm.pin.trim()) return;
                const item = { id: `emp-${Date.now()}`, name: newStaffForm.name.trim(), pin: newStaffForm.pin.trim(), role: newStaffForm.role, jobTitle: newStaffForm.jobTitle, access: newStaffForm.role === 'manager' ? [...ASSIGNABLE_TAB_KEYS] : newStaffForm.access, active: true };
                save({ staff: [item, ...staffList] });
                setNewStaffForm({ name: '', pin: '', role: 'tech', jobTitle: 'مشغل غرفة تحكم', access: [...ASSIGNABLE_TAB_KEYS] });
              }}
              className="lg:col-span-5 bg-slate-50 border border-slate-200 rounded-2xl p-3 space-y-2.5 text-xs"
            >
              <h3 className="font-black text-slate-800">+ إضافة موظف جديد بكود خاص</h3>
              <input type="text" placeholder="اسم الموظف" value={newStaffForm.name} onChange={(e) => setNewStaffForm({ ...newStaffForm, name: e.target.value })} className="w-full border border-slate-300 rounded-xl p-2 bg-white font-bold" />
              <div className="grid grid-cols-2 gap-2">
                <input type="text" placeholder="الكود (مثلاً 5544)" value={newStaffForm.pin} onChange={(e) => setNewStaffForm({ ...newStaffForm, pin: e.target.value })} className="border border-slate-300 rounded-xl p-2 bg-white font-mono font-bold text-center" />
                <select value={newStaffForm.role} onChange={(e) => setNewStaffForm({ ...newStaffForm, role: e.target.value })} className="border border-slate-300 rounded-xl p-2 bg-white font-bold">
                  <option value="tech">فني</option>
                  <option value="supervisor">ملاحظ</option>
                  <option value="manager">مهندس / مدير</option>
                </select>
              </div>
              {newStaffForm.role !== 'manager' && (
                <div className="flex flex-wrap gap-1.5">
                  {ASSIGNABLE_TABS.map(([k, label]) => {
                    const on = newStaffForm.access.includes(k);
                    return (
                      <button type="button" key={k} onClick={() => setNewStaffForm({ ...newStaffForm, access: on ? newStaffForm.access.filter((x) => x !== k) : [...newStaffForm.access, k] })} className={`px-2.5 py-1 rounded-lg font-bold border ${on ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-500 border-slate-300'}`}>
                        {label}
                      </button>
                    );
                  })}
                </div>
              )}
              <button type="submit" className="w-full bg-blue-600 text-white font-black py-2 rounded-xl">حفظ كود الموظف</button>
            </form>

            <div className="lg:col-span-7 space-y-2">
              {staffList.map((emp) => {
                const empAccess = accessFor(emp) || [...ASSIGNABLE_TAB_KEYS];
                return (
                  <div key={emp.id} className="p-3 rounded-xl border bg-white border-slate-200 flex justify-between items-start gap-2 text-xs">
                    <div className="flex-1">
                      <span className="font-black text-slate-900">{emp.name}</span>
                      {emp.role === 'supervisor' && (
                        <span className="mr-1.5 text-[10px] font-black bg-indigo-100 text-indigo-800 px-1.5 py-0.5 rounded">ملاحظ</span>
                      )}
                      <p className="text-slate-500 font-bold">الكود: <strong className="font-mono text-blue-700">{emp.pin}</strong></p>

                      {emp.role === 'manager' ? (
                        <p className="text-emerald-700 font-bold text-[10px] pt-1">صلاحية كاملة على كل الأقسام</p>
                      ) : (
                        <div className="flex flex-wrap gap-1 pt-1.5">
                          {ASSIGNABLE_TABS.map(([k, label]) => {
                            const on = empAccess.includes(k);
                            return (
                              <button
                                type="button"
                                key={k}
                                onClick={() => handleToggleStaffTab(emp.id, k)}
                                className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                                  on ? 'bg-blue-50 text-blue-700 border-blue-300' : 'bg-slate-50 text-slate-400 border-slate-200'
                                }`}
                              >
                                {on ? label : `🔒 ${label}`}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-1.5 shrink-0">
                      <button onClick={() => save({ staff: staffList.map((x) => (x.id === emp.id ? { ...x, active: !x.active } : x)) })} className="px-2.5 py-1 rounded-lg font-bold bg-amber-100 text-amber-900">
                        {emp.active ? 'إيقاف' : 'تفعيل'}
                      </button>
                      <button onClick={() => save({ staff: staffList.filter((x) => x.id !== emp.id) })} className="text-red-600 p-1"><Trash2 className="w-4 h-4" /></button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}