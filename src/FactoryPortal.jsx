import React, { useState, useEffect, useRef } from 'react';
import {
  UserCog, Edit3, TrendingUp, AlertTriangle, CheckCircle, RotateCcw,
  Save, Power, Settings2, Archive, CalendarDays, List, BarChart3, RefreshCw,
  Sliders, Trash2, Clock, Settings, X, UploadCloud, History,
  ShieldAlert, Key, Eye, Layers, Wrench, ArrowLeftRight,
  FileSpreadsheet, FileText, Inbox, Check, XCircle, Hourglass,
  Cpu, PlusCircle, Building2, FileSignature
} from 'lucide-react';
import { signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { doc, setDoc, onSnapshot } from 'firebase/firestore';
import { auth, db } from './App';

/* ======================================================
   1. الثوابت الإعدادية وبناء الستاندات الديناميكي
   ====================================================== */
const DEFAULT_STANDS_CONFIG = [
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

const SHIFTS_NORMAL = ['الوردية الأولى', 'الوردية الثانية', 'الوردية الثالثة'];
const SHIFTS_FRIDAY = ['الوردية الأولى (12 ساعة)', 'الوردية الثانية (12 ساعة)'];
const shiftsFor = (isFri) => (isFri ? SHIFTS_FRIDAY : SHIFTS_NORMAL);

const createPassesArray = (count, activePassNum = 1, initialTons = 0) =>
  Array.from({ length: count }, (_, idx) => {
    const pNum = idx + 1;
    const isCurrent = pNum === activePassNum;
    return {
      passNumber: pNum,
      status: isCurrent ? 'active' : 'unused',
      tons: isCurrent ? initialTons : 0,
      order: isCurrent ? 1 : null,
      sizeLabel: ''
    };
  });

const buildStand = (cfg) => {
  const todayGB = new Date().toLocaleDateString('en-GB');
  const totalPasses = Number(cfg.totalPasses) || 12;
  return {
    id: String(cfg.id),
    name: cfg.name || `ستاند ${cfg.id}`,
    type: cfg.type ?? '',
    rollCode: cfg.rollCode ?? '',
    diameter: cfg.diameter ?? '',
    hardness: cfg.hardness ?? '',
    entryDate: todayGB,
    totalPasses,
    activePass: 1,
    passes: createPassesArray(totalPasses, 1, 0),
    isActive: true,
    accumulatedTons: 0,
    maxLimit: Number(cfg.maxLimit) || 1500,
    lastResetDate: todayGB
  };
};

const buildInitialStands = () => DEFAULT_STANDS_CONFIG.map(buildStand);

// يدعم أي عدد من الستاندات يحدده المصنع (1 إلى 30 ستاند)
const normalizeStand = (stand, fallbackIndex) => {
  const cfg = DEFAULT_STANDS_CONFIG[fallbackIndex] || {
    id: String(fallbackIndex + 1),
    name: `ستاند ${fallbackIndex + 1}`,
    type: '',
    rollCode: '',
    diameter: '',
    hardness: '',
    totalPasses: 12,
    maxLimit: 1500
  };
  const id = String(stand?.id || cfg.id);
  const totalPasses = Number(stand?.totalPasses) || cfg.totalPasses || 12;
  const activePass = Number(stand?.activePass) || 1;
  const currentTons = Number(stand?.accumulatedTons) || 0;
  let passes = stand?.passes;
  if (!Array.isArray(passes) || passes.length !== totalPasses) {
    passes = createPassesArray(totalPasses, activePass, currentTons);
  } else {
    passes = passes.map((p) =>
      p.passNumber === activePass ? { ...p, status: 'active', tons: currentTons, order: p.order || 1 } : p
    );
  }
  return {
    ...stand,
    id,
    name: stand?.name || `ستاند ${id}`,
    type: stand?.type ?? cfg.type,
    rollCode: stand?.rollCode ?? cfg.rollCode,
    diameter: stand?.diameter ?? cfg.diameter,
    hardness: stand?.hardness ?? cfg.hardness,
    entryDate: stand?.entryDate || stand?.lastResetDate || new Date().toLocaleDateString('en-GB'),
    maxLimit: Number(stand?.maxLimit) || cfg.maxLimit || 1500,
    isActive: stand?.isActive !== undefined ? stand.isActive : true,
    accumulatedTons: currentTons,
    totalPasses,
    activePass,
    passes
  };
};

const normalizeList = (raw) => {
  if (!Array.isArray(raw) || raw.length === 0) return buildInitialStands();
  return raw.map((st, idx) => normalizeStand(st, idx));
};

const LiveClock = () => {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="flex bg-slate-800 border border-slate-700 rounded px-2 py-0.5 items-center gap-1.5 shadow-inner">
      <Clock className="w-3 h-3 text-blue-400" />
      <div className="flex flex-col items-center leading-none mt-0.5">
        <span className="text-[10px] font-mono font-bold text-slate-100" dir="ltr">
          {time.toLocaleTimeString('en-US', { hour12: true, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
        </span>
        <span className="text-[7px] text-slate-400 mt-0.5">
          {time.toLocaleDateString('ar-EG', { weekday: 'short', day: 'numeric', month: 'short' })}
        </span>
      </div>
    </div>
  );
};

/* دوال التاريخ */
const formatDateToISO = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const formatDateToGB = (iso) => {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
};
const convertGBToISO = (gb) => {
  if (!gb || !gb.includes('/')) return formatDateToISO(new Date());
  const p = gb.split('/');
  if (p.length !== 3) return formatDateToISO(new Date());
  return `${p[2]}-${p[1].padStart(2, '0')}-${p[0].padStart(2, '0')}`;
};

/* ======================================================
   2. التصدير (Excel / PDF) الشامل لكل أقسام المصنع
   ====================================================== */
const esc = (s) => String(s ?? '').replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));

const buildReportHTML = ({ factoryName, stands, archive, changes, downtimes, motors, billetWeight }) => {
  const now = new Date().toLocaleString('ar-EG');
  const th = (arr) => `<tr>${arr.map((h) => `<th>${esc(h)}</th>`).join('')}</tr>`;
  const td = (arr) => `<tr>${arr.map((c) => `<td>${esc(c)}</td>`).join('')}</tr>`;

  const standsRows = stands
    .map((s) => {
      const total = s.passes.reduce((a, p) => a + (Number(p.tons) || 0), 0);
      return td([
        s.name,
        s.type,
        s.diameter,
        s.entryDate,
        `${s.activePass} / ${s.totalPasses}`,
        s.accumulatedTons.toFixed(0),
        s.maxLimit,
        `${Math.round((s.accumulatedTons / s.maxLimit) * 100)}%`,
        total.toFixed(0)
      ]);
    })
    .join('');

  const logs = [...archive].sort((a, b) => b.timestamp - a.timestamp);
  const archiveRows = logs
    .map((l) => td([l.date, l.dayName, l.shift, l.productSize || '', l.billets, l.tons.toFixed(1), l.time]))
    .join('');
  const sumT = logs.reduce((a, l) => a + l.tons, 0).toFixed(1);
  const sumB = logs.reduce((a, l) => a + l.billets, 0);

  const changeRows = changes
    .map((c) =>
      td([
        c.date,
        c.shift,
        c.standName,
        c.kind === 'newRoll' ? 'تركيب درفيل جديد' : `ممر ${c.fromPass} ← ممر ${c.toPass}`,
        Number(c.tons).toFixed(1),
        c.billetsAtChange || 0,
        c.productSize || '',
        c.notes || ''
      ])
    )
    .join('');

  const downRows = (downtimes || [])
    .map((d) => td([d.date, d.shift, d.category, d.standName || 'عام', `${d.durationMins} ق`, d.reason, d.actionTaken || '', d.by || '']))
    .join('');
  const sumDownMins = (downtimes || []).reduce((a, d) => a + (Number(d.durationMins) || 0), 0);

  const motorRows = (motors || [])
    .map((m) => td([`ستاند ${m.stand}`, m.code, m.brand || '', `${m.kw} kW`, m.rpm, m.amps || '-', m.gearRatio || '-', m.dateAdded]))
    .join('');

  return `<html dir="rtl" lang="ar" xmlns:x="urn:schemas-microsoft-com:office:excel"><head><meta charset="UTF-8">
<title>تقرير ${esc(factoryName)}</title>
<style>
  body{font-family:Tahoma,Arial,sans-serif;color:#0f172a;padding:16px}
  h1{font-size:20px;margin:0} h2{font-size:14px;margin:22px 0 6px;border-right:4px solid #2563eb;padding-right:8px}
  .meta{color:#64748b;font-size:11px;margin-top:4px}
  table{border-collapse:collapse;width:100%;font-size:11px;margin-bottom:8px}
  th{background:#0f172a;color:#fff;padding:6px;border:1px solid #334155}
  td{padding:5px;border:1px solid #cbd5e1;text-align:center}
  tr:nth-child(even) td{background:#f1f5f9}
  .tot td{font-weight:bold;background:#dbeafe!important}
  @media print{ body{padding:0} h2{break-after:avoid} tr{break-inside:avoid} }
</style></head><body>
<h1>${esc(factoryName)} - تقرير يوميات التشغيل والدرافيل والتوقفات</h1>
<div class="meta">تاريخ التقرير: ${esc(now)} | عدد الستاندات: ${stands.length} | وزن البليت: ${esc(billetWeight)} طن</div>
<h2>1. حالة الستاندات والممرات (${stands.length} ستاند)</h2>
<table>${th(['الستاند', 'الشكل', 'القطر', 'تاريخ دخول الدرفيل', 'الممر الحالي', 'إنتاج الممر الحالي (طن)', 'الحد الأقصى', 'النسبة', 'إجمالي إنتاج الدرفيل (طن)'])}${standsRows}</table>
<h2>2. سجل الإنتاج اليومي للورديات</h2>
<table>${th(['التاريخ', 'اليوم', 'الوردية', 'المقاس', 'البليت', 'الطن', 'وقت التسجيل'])}${archiveRows}
<tr class="tot"><td colspan="4">الإجمالي</td><td>${sumB}</td><td>${sumT}</td><td></td></tr></table>
<h2>3. سجل الأعطال والتوقفات بالورديات (Downtime Log)</h2>
<table>${th(['التاريخ', 'الوردية', 'التصنيف', 'الستاند/المعدة', 'مدة التوقف', 'سبب العطل/التوقف', 'الإجراء المتخذ', 'بواسطة'])}${downRows}
<tr class="tot"><td colspan="4">إجمالي وقت التوقفات</td><td>${sumDownMins} دقيقة</td><td colspan="3"></td></tr></table>
<h2>4. سجل تغيير الممرات والدرافيل</h2>
<table>${th(['التاريخ', 'الوردية', 'الستاند', 'التغيير', 'إنتاج الممر (طن)', 'بليت', 'المقاس', 'ملاحظات'])}${changeRows}</table>
<h2>5. سجل المواتير والدرايفات</h2>
<table>${th(['الستاند', 'كود/سيريال الموتور', 'النوع/الدرايف', 'القدرة', 'RPM', 'الأمبير', 'الجيربوكس', 'تاريخ التركيب'])}${motorRows}</table>
</body></html>`;
};

const downloadExcel = (data) => {
  const html = '\ufeff' + buildReportHTML(data);
  const blob = new Blob([html], { type: 'application/vnd.ms-excel;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `تقرير-${data.factoryName || 'المصنع'}-${formatDateToISO(new Date())}.xls`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
};

const printPDF = (data, onBlocked) => {
  const w = window.open('', '_blank');
  if (!w) {
    onBlocked && onBlocked();
    return;
  }
  w.document.open();
  w.document.write(
    buildReportHTML(data) +
      '<script>window.onload=function(){setTimeout(function(){window.print()},400)}<\/script>'
  );
  w.document.close();
};

/* ======================================================
   3. تطبيق تغيير ممر / درفيل على قائمة الستاندات
   ====================================================== */
const applyPassChange = (list, req, billetWeight, approver) => {
  const idx = list.findIndex((s) => String(s.id) === String(req.standId));
  if (idx < 0) return null;
  const st = { ...list[idx] };
  const prev = st.activePass;
  const base = {
    id: Date.now() + Math.floor(Math.random() * 1000),
    standId: st.id,
    standName: st.name,
    date: req.date,
    time: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
    shift: req.shift,
    productSize: req.productSize,
    requestedBy: req.requestedBy || approver,
    approvedBy: approver
  };
  let log;

  if (req.kind === 'newRoll') {
    const total = st.passes.reduce((a, p) => a + (Number(p.tons) || 0), 0);
    st.entryDate = req.date;
    st.lastResetDate = req.date;
    st.activePass = 1;
    st.accumulatedTons = 0;
    st.passes = createPassesArray(st.totalPasses, 1, 0);
    log = {
      ...base,
      kind: 'newRoll',
      fromPass: prev,
      toPass: 1,
      tons: total,
      billetsAtChange: 0,
      notes: req.notes || 'تركيب درفيل جديد'
    };
  } else {
    const target = Number(req.targetPass) || prev;
    const oldBillets = Number(req.billets) || 0;
    const totalNow = st.accumulatedTons;
    const finalOld = oldBillets > 0 ? oldBillets * billetWeight : totalNow;
    const opening = Math.max(0, totalNow - finalOld);
    const maxOrder = Math.max(0, ...st.passes.map((p) => p.order || 0));
    st.passes = st.passes.map((p) => {
      if (p.passNumber === prev && prev !== target)
        return { ...p, status: 'used', tons: finalOld, order: p.order || Math.max(1, maxOrder) };
      if (p.passNumber === target)
        return {
          ...p,
          status: 'active',
          tons: opening,
          order: prev === target ? p.order || 1 : p.order ? p.order : maxOrder + 1
        };
      return p;
    });
    st.activePass = target;
    st.accumulatedTons = opening;
    st.lastResetDate = req.date;
    log = {
      ...base,
      kind: 'pass',
      fromPass: prev,
      toPass: target,
      tons: finalOld,
      billetsAtChange: oldBillets,
      notes: req.notes || `نقل من ممر ${prev} إلى ممر ${target}`
    };
  }
  const newList = [...list];
  newList[idx] = st;
  return { list: newList, log };
};

const Overlay = ({ z = 50, children }) => (
  <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-3 backdrop-blur-sm" style={{ zIndex: z }}>
    {children}
  </div>
);

/* ======================================================
   4. المكون الرئيسي لبوابة المصانع (FactoryPortal)
   ====================================================== */
export default function FactoryPortal({ onBack, factoryConfig, factoriesList = [], onSelectFactory }) {
  const [currentUser, setCurrentUser] = useState('none'); // 'none' | 'tech' | 'manager' | 'admin'
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [userAuth, setUserAuth] = useState(null);

  const appId = factoryConfig?.id || 'al-gioshy-steel-rolls';
  const factoryName = factoryConfig?.name || 'شركة الجيوشي للصلب';

  const isManagerLike = currentUser === 'manager' || currentUser === 'admin';
  const roleLabel = currentUser === 'tech' ? 'فني تشغيل' : currentUser === 'manager' ? 'مدير الإنتاج' : 'أدمن';

  const secretTapCount = useRef(0);
  const secretTapTimer = useRef(null);
  const handleSecretAdminTrigger = () => {
    secretTapCount.current += 1;
    if (secretTapTimer.current) clearTimeout(secretTapTimer.current);
    if (secretTapCount.current >= 5) {
      secretTapCount.current = 0;
      if (isSuperAdmin) {
        setCurrentUser('admin');
        setActiveTab('admin');
      } else setLoginPrompt({ isOpen: true, role: 'admin', codeInput: '', error: '' });
    } else {
      secretTapTimer.current = setTimeout(() => {
        secretTapCount.current = 0;
      }, 1500);
    }
  };

  const [stands, setStands] = useState(buildInitialStands);
  const [shiftBillets, setShiftBillets] = useState('');
  const [productionArchive, setProductionArchive] = useState([]);
  const [passChanges, setPassChanges] = useState([]);
  const [pendingList, setPendingList] = useState([]);
  const [downtimesList, setDowntimesList] = useState([]); // سجل التوقفات والأعطال بالورديات
  const [handoverNotesList, setHandoverNotesList] = useState([]); // ملاحظات تسليم الورديات
  const [motorsList, setMotorsList] = useState([]); // سجل المواتير والدرايفات
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  const [billetWeight, setBilletWeight] = useState(0.75);
  const [selectedProductSize, setSelectedProductSize] = useState('16');
  const [customLogo, setCustomLogo] = useState('');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [tempLogoUrl, setTempLogoUrl] = useState('');

  // نافذة إضافة ستاند جديد أو تعديل عدد الستاندات
  const [addStandOpen, setAddStandOpen] = useState(false);
  const [newStandForm, setNewStandForm] = useState({
    name: '',
    type: 'بيضاوي',
    rollCode: '',
    diameter: '340',
    hardness: '48 HRC',
    totalPasses: 12,
    maxLimit: 1500
  });
  const [targetStandsCount, setTargetStandsCount] = useState(12);

  // فورم تسجيل عطل / توقف بالوردية
  const [downForm, setDownForm] = useState({
    category: 'كهرباء وكنترول',
    standName: 'عام / الخط بالكامل',
    durationMins: '',
    reason: '',
    actionTaken: ''
  });
  const [handoverText, setHandoverText] = useState('');

  // فورم إضافة موتور جديد
  const [newMotor, setNewMotor] = useState({
    stand: '1',
    code: '',
    brand: 'Siemens SINAMICS',
    kw: '',
    rpm: '',
    amps: '',
    gearRatio: ''
  });

  const [adminState, setAdminState] = useState({
    isMaintenance: false,
    maintenanceMessage: 'الموقع مغلق حالياً لإجراء تحديثات وصيانة للنظام.. يرجى المحاولة لاحقاً.',
    techCode: factoryConfig?.techCode || '1111',
    managerCode: factoryConfig?.managerCode || '2222',
    adminCode: factoryConfig?.adminCode || '9999',
    visitsCount: 0,
    lastVisit: ''
  });
  const [loginPrompt, setLoginPrompt] = useState({ isOpen: false, role: '', codeInput: '', error: '' });
  const [visitLogged, setVisitLogged] = useState(false);

  const [rollModal, setRollModal] = useState({ isOpen: false, standIndex: null, isEditingInfo: false });
  const [rollEditForm, setRollEditForm] = useState({
    name: '',
    rollCode: '',
    diameter: '',
    hardness: '',
    type: '',
    entryDate: '',
    totalPasses: 6
  });

  const [resetModal, setResetModal] = useState({ isOpen: false, standIndex: null });
  const [resetBillets, setResetBillets] = useState('');
  const [resetNotes, setResetNotes] = useState('');
  const [resetDateInput, setResetDateInput] = useState('');
  const [resetShiftInput, setResetShiftInput] = useState('');
  const [resetTargetPass, setResetTargetPass] = useState(null);

  const [historyModal, setHistoryModal] = useState({ isOpen: false, standId: null });
  const [approvalsOpen, setApprovalsOpen] = useState(false);
  const [reqEdits, setReqEdits] = useState({});
  const [dupModal, setDupModal] = useState(false);

  const [modal, setModal] = useState({ isOpen: false, type: '', title: '', message: '', onConfirm: null });
  const closeBox = () => setModal((m) => ({ ...m, isOpen: false }));
  const showAlert = (title, message) => setModal({ isOpen: true, type: 'alert', title, message, onConfirm: null });
  const showConfirm = (title, message, onConfirm) =>
    setModal({ isOpen: true, type: 'confirm', title, message, onConfirm });

  /* ---------- الاتصال وجلب بيانات المصنع من Firebase ---------- */
  useEffect(() => {
    if (!auth) {
      setIsDataLoaded(true);
      return;
    }
    signInAnonymously(auth).catch((e) => console.error(e));
    const unsub = onAuthStateChanged(auth, setUserAuth);
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!userAuth || !db) return;
    const ref = (name) => doc(db, 'factory', appId, 'data', name);
    const standsRef = ref('standsState'),
      archiveRef = ref('archiveState'),
      passChangesRef = ref('passChangesState'),
      settingsRef = ref('settingsState'),
      adminRef = ref('adminState'),
      pendingRef = ref('pendingState'),
      downtimesRef = ref('downtimesState'),
      motorsRef = ref('motorsState');

    const u1 = onSnapshot(standsRef, (snap) => {
      if (snap.exists() && snap.data().standsList) {
        const list = normalizeList(snap.data().standsList);
        setStands(list);
        setTargetStandsCount(list.length);
      } else {
        const init = buildInitialStands();
        setDoc(standsRef, { standsList: init });
        setStands(init);
        setTargetStandsCount(init.length);
      }
      setIsDataLoaded(true);
    });
    const u2 = onSnapshot(archiveRef, (snap) => {
      if (snap.exists()) setProductionArchive(snap.data().archiveList || []);
      else setDoc(archiveRef, { archiveList: [] });
    });
    const u3 = onSnapshot(passChangesRef, (snap) => {
      if (snap.exists()) setPassChanges(snap.data().passChangesList || []);
      else setDoc(passChangesRef, { passChangesList: [] });
    });
    const u4 = onSnapshot(settingsRef, (snap) => {
      if (snap.exists()) {
        const d = snap.data();
        if (d.billetWeight) setBilletWeight(d.billetWeight);
        if (d.logoUrl) setCustomLogo(d.logoUrl);
        if (d.selectedProductSize) setSelectedProductSize(d.selectedProductSize);
      } else setDoc(settingsRef, { billetWeight: 0.75, logoUrl: '', selectedProductSize: '16' }, { merge: true });
    });
    const u5 = onSnapshot(adminRef, (snap) => {
      if (snap.exists()) setAdminState((prev) => ({ ...prev, ...snap.data() }));
      else {
        const def = {
          isMaintenance: false,
          maintenanceMessage: 'الموقع مغلق حالياً لإجراء تحديثات وصيانة للنظام.. يرجى المحاولة لاحقاً.',
          techCode: factoryConfig?.techCode || '1111',
          managerCode: factoryConfig?.managerCode || '2222',
          adminCode: factoryConfig?.adminCode || '9999',
          visitsCount: 1,
          lastVisit: new Date().toLocaleString('ar-EG')
        };
        setDoc(adminRef, def);
        setAdminState(def);
      }
    });
    const u6 = onSnapshot(pendingRef, (snap) => {
      if (snap.exists()) setPendingList(snap.data().pendingList || []);
      else setDoc(pendingRef, { pendingList: [] });
    });
    const u7 = onSnapshot(downtimesRef, (snap) => {
      if (snap.exists()) {
        setDowntimesList(snap.data().downtimes || []);
        setHandoverNotesList(snap.data().handovers || []);
      } else setDoc(downtimesRef, { downtimes: [], handovers: [] });
    });
    const u8 = onSnapshot(motorsRef, (snap) => {
      if (snap.exists()) setMotorsList(snap.data().motors || []);
      else setDoc(motorsRef, { motors: [] });
    });

    return () => {
      u1();
      u2();
      u3();
      u4();
      u5();
      u6();
      u7();
      u8();
    };
  }, [userAuth, appId]);

  useEffect(() => {
    if (isDataLoaded && userAuth && db && !visitLogged) {
      setVisitLogged(true);
      setDoc(
        doc(db, 'factory', appId, 'data', 'adminState'),
        { visitsCount: (adminState.visitsCount || 0) + 1, lastVisit: new Date().toLocaleString('ar-EG') },
        { merge: true }
      ).catch((e) => console.error(e));
    }
  }, [isDataLoaded, userAuth, visitLogged, appId]);

  /* ---------- اليوم الإنتاجي والورديات ---------- */
  const getInitialProductionState = () => {
    const now = new Date();
    const hour = now.getHours();
    const prodDate = new Date(now);
    if (hour < 8) prodDate.setDate(prodDate.getDate() - 1);
    const fri = prodDate.getDay() === 5;
    let initialShift = '';
    if (fri) initialShift = hour >= 8 && hour < 20 ? SHIFTS_FRIDAY[0] : SHIFTS_FRIDAY[1];
    else if (hour >= 8 && hour < 16) initialShift = SHIFTS_NORMAL[0];
    else if (hour >= 16 && hour < 24) initialShift = SHIFTS_NORMAL[1];
    else initialShift = SHIFTS_NORMAL[2];
    return { prodDate, initialShift };
  };
  const initState = getInitialProductionState();
  const [currentProdDate, setCurrentProdDate] = useState(initState.prodDate);
  const [selectedShift, setSelectedShift] = useState(initState.initialShift);

  const isFriday = currentProdDate.getDay() === 5;
  const availableShifts = shiftsFor(isFriday);
  useEffect(() => {
    if (!availableShifts.includes(selectedShift)) setSelectedShift(availableShifts[0]);
  }, [isFriday]);

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

  /* ---------- الحفظ السحابي الموحد ---------- */
  const save = async ({
    stands: s,
    archive,
    weight,
    logo,
    changes,
    productSize,
    admin,
    pending,
    downtimes,
    handovers,
    motors
  } = {}) => {
    if (userAuth && db) {
      try {
        const ref = (name) => doc(db, 'factory', appId, 'data', name);
        if (s !== undefined) await setDoc(ref('standsState'), { standsList: s });
        if (archive !== undefined) await setDoc(ref('archiveState'), { archiveList: archive });
        if (changes !== undefined) await setDoc(ref('passChangesState'), { passChangesList: changes });
        if (pending !== undefined) await setDoc(ref('pendingState'), { pendingList: pending });
        if (admin !== undefined) await setDoc(ref('adminState'), admin, { merge: true });
        if (downtimes !== undefined || handovers !== undefined) {
          await setDoc(
            ref('downtimesState'),
            {
              downtimes: downtimes !== undefined ? downtimes : downtimesList,
              handovers: handovers !== undefined ? handovers : handoverNotesList
            },
            { merge: true }
          );
        }
        if (motors !== undefined) await setDoc(ref('motorsState'), { motors });
        const upd = {};
        if (weight !== undefined) upd.billetWeight = weight;
        if (logo !== undefined) upd.logoUrl = logo;
        if (productSize !== undefined) upd.selectedProductSize = productSize;
        if (Object.keys(upd).length) await setDoc(ref('settingsState'), upd, { merge: true });
      } catch (e) {
        console.error('Save error:', e);
      }
    } else {
      if (s !== undefined) setStands(s);
      if (archive !== undefined) setProductionArchive(archive);
      if (weight !== undefined) setBilletWeight(weight);
      if (logo !== undefined) setCustomLogo(logo);
      if (changes !== undefined) setPassChanges(changes);
      if (pending !== undefined) setPendingList(pending);
      if (productSize !== undefined) setSelectedProductSize(productSize);
      if (admin !== undefined) setAdminState((prev) => ({ ...prev, ...admin }));
      if (downtimes !== undefined) setDowntimesList(downtimes);
      if (handovers !== undefined) setHandoverNotesList(handovers);
      if (motors !== undefined) setMotorsList(motors);
    }
  };

  /* ---------- إضافة / حذف / تغيير عدد الستاندات للمصنع ---------- */
  const handleAddSingleStand = (e) => {
    e.preventDefault();
    const nextNum = stands.length + 1;
    const created = buildStand({
      id: String(nextNum),
      name: newStandForm.name.trim() || `ستاند ${nextNum}`,
      type: newStandForm.type,
      rollCode: newStandForm.rollCode,
      diameter: newStandForm.diameter,
      hardness: newStandForm.hardness,
      totalPasses: Number(newStandForm.totalPasses) || 12,
      maxLimit: Number(newStandForm.maxLimit) || 1500
    });
    const updated = [...stands, created];
    save({ stands: updated });
    setTargetStandsCount(updated.length);
    setAddStandOpen(false);
    setNewStandForm({ name: '', type: 'بيضاوي', rollCode: '', diameter: '340', hardness: '48 HRC', totalPasses: 12, maxLimit: 1500 });
    showAlert('تمت الإضافة', `تم إضافة (${created.name}) بنجاح. إجمالي الستاندات الآن: ${updated.length}`);
  };

  const handleResizeStandsCount = () => {
    const count = Math.max(1, Math.min(30, Number(targetStandsCount) || 12));
    if (count === stands.length) return;
    showConfirm(
      'تعديل عدد قوائم الخط',
      `سيتم ضبط عدد الستاندات في المصنع إلى (${count}) ستاند مع الحفاظ على بيانات الستاندات الحالية. هل أنت متأكد؟`,
      () => {
        let updated = [...stands];
        if (count > stands.length) {
          for (let i = stands.length; i < count; i++) {
            const cfg = DEFAULT_STANDS_CONFIG[i] || {
              id: String(i + 1),
              name: `ستاند ${i + 1}`,
              type: 'دائري',
              rollCode: `R-${i + 1}`,
              diameter: '330',
              hardness: '50 HRC',
              totalPasses: 16,
              maxLimit: 1200
            };
            updated.push(buildStand(cfg));
          }
        } else {
          updated = updated.slice(0, count);
        }
        save({ stands: updated });
        setAddStandOpen(false);
      }
    );
  };

  const handleDeleteStand = (standIndex) => {
    if (stands.length <= 1) return;
    const st = stands[standIndex];
    showConfirm('حذف ستاند', `هل أنت متأكد من حذف (${st.name}) من خط الإنتاج؟`, () => {
      const updated = stands.filter((_, i) => i !== standIndex);
      save({ stands: updated });
      setRollModal({ isOpen: false, standIndex: null, isEditingInfo: false });
    });
  };

  const handleProductSizeChange = (size) => {
    setSelectedProductSize(size);
    save({ stands: stands.map((s) => ({ ...s, isActive: true })), productSize: size });
  };

  const getStandStatus = (tons, limit) => {
    const pct = Math.max(0, (tons / limit) * 100);
    if (pct >= 100) return { color: 'danger', bg: 'bg-red-100', border: 'border-red-500', bar: 'bg-red-600', text: 'text-red-700', hex: '#dc2626' };
    if (pct >= 80) return { color: 'warning', bg: 'bg-yellow-100', border: 'border-yellow-400', bar: 'bg-yellow-500', text: 'text-yellow-700', hex: '#eab308' };
    return { color: 'good', bg: 'bg-slate-50', border: 'border-slate-300', bar: 'bg-green-500', text: 'text-slate-700', hex: '#22c55e' };
  };

  const openSettingsModal = () => {
    setTempLogoUrl(customLogo);
    setIsSettingsOpen(true);
  };
  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 1024 * 1024) {
      showAlert('خطأ', 'حجم الصورة كبير جداً. يرجى اختيار صورة أقل من 1 ميجابايت.');
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => setTempLogoUrl(reader.result);
    reader.readAsDataURL(file);
  };
  const handleSaveSettings = () => {
    if (tempLogoUrl && tempLogoUrl.trim() !== '') save({ logo: tempLogoUrl.trim() });
    setIsSettingsOpen(false);
  };

  const handleToggleActive = (index, e) => {
    if (e) e.stopPropagation();
    const ns = stands.map((s, i) => (i === index ? { ...s, isActive: !s.isActive } : s));
    save({ stands: ns });
  };

  /* ---------- صفحة الدرفيل ---------- */
  const openStandRollPage = (index) => {
    const st = stands[index];
    setRollEditForm({
      name: st.name || `ستاند ${st.id}`,
      rollCode: st.rollCode || '',
      diameter: st.diameter || '',
      hardness: st.hardness || '',
      type: st.type || '',
      entryDate: convertGBToISO(st.entryDate),
      totalPasses: st.totalPasses || 6
    });
    setRollModal({ isOpen: true, standIndex: index, isEditingInfo: false });
  };

  const handleSaveRollMetadata = () => {
    const idx = rollModal.standIndex;
    if (idx === null) return;
    const ns = [...stands];
    const st = { ...ns[idx] };
    const newTotal = Math.max(1, Math.min(40, Number(rollEditForm.totalPasses) || st.totalPasses));
    st.name = rollEditForm.name.trim() || st.name;
    st.rollCode = rollEditForm.rollCode;
    st.diameter = rollEditForm.diameter;
    st.hardness = rollEditForm.hardness;
    st.type = rollEditForm.type;
    st.entryDate = formatDateToGB(rollEditForm.entryDate) || st.entryDate;
    if (newTotal !== st.totalPasses) {
      st.passes = Array.from({ length: newTotal }, (_, i) => {
        const n = i + 1;
        const ex = st.passes.find((p) => p.passNumber === n);
        if (ex) return ex;
        return {
          passNumber: n,
          status: n === st.activePass ? 'active' : 'unused',
          tons: n === st.activePass ? st.accumulatedTons : 0,
          order: n === st.activePass ? 1 : null,
          sizeLabel: ''
        };
      });
      st.totalPasses = newTotal;
      if (st.activePass > newTotal) st.activePass = 1;
    }
    ns[idx] = st;
    save({ stands: ns });
    setRollModal((prev) => ({ ...prev, isEditingInfo: false }));
    showAlert('تم الحفظ', 'تم تحديث بيانات الدرفيل والممرات بنجاح.');
  };

  const pendingFor = (standId) => pendingList.filter((r) => String(r.standId) === String(standId) && r.status === 'pending');

  const buildRequest = (st, kind, extra = {}) => ({
    id: Date.now() + Math.floor(Math.random() * 1000),
    kind,
    status: 'pending',
    standId: st.id,
    standName: st.name,
    fromPass: st.activePass,
    currentTons: st.accumulatedTons,
    productSize: selectedProductSize,
    requestedBy: roleLabel,
    createdAt: new Date().toLocaleString('ar-EG'),
    date: new Date().toLocaleDateString('en-GB'),
    shift: selectedShift,
    ...extra
  });

  const submitChange = (req) => {
    if (isManagerLike) {
      const r = applyPassChange(stands, req, billetWeight, roleLabel);
      if (!r) return;
      save({ stands: r.list, changes: [r.log, ...passChanges] });
      return;
    }
    save({ pending: [req, ...pendingList] });
    showAlert('تم إرسال الطلب', 'تم إرسال طلب التغيير للمدير. هيتنفذ بعد موافقته، وتقدر تتابع حالته من كارت الستاند.');
  };

  const handleInstallNewRoll = () => {
    const idx = rollModal.standIndex;
    if (idx === null) return;
    const st = stands[idx];
    if (!isManagerLike && pendingFor(st.id).length) {
      showAlert('يوجد طلب معلّق', 'فيه طلب لهذا الستاند بانتظار موافقة المدير.');
      return;
    }
    showConfirm(
      'تركيب درفيل جديد',
      isManagerLike
        ? 'سيتم تصفير جميع الممرات والبدء من الممر 1 بتاريخ اليوم.'
        : 'سيتم إرسال طلب تركيب درفيل جديد للمدير. لن يتغير شيء قبل موافقته.',
      () => submitChange(buildRequest(st, 'newRoll', { notes: 'تركيب درفيل جديد' }))
    );
  };

  const handleDirectPassStatusChange = (standIdx, passNum, newStatus, customTons) => {
    const ns = [...stands];
    const st = { ...ns[standIdx] };
    const maxOrder = Math.max(0, ...st.passes.map((p) => p.order || 0));
    st.passes = st.passes.map((p) => {
      if (p.passNumber !== passNum) return p;
      if (newStatus === 'unused') return { ...p, status: 'unused', tons: 0, order: null };
      return { ...p, status: 'used', tons: customTons !== undefined ? Number(customTons) : p.tons, order: p.order || maxOrder + 1 };
    });
    ns[standIdx] = st;
    save({ stands: ns });
  };

  const initiateResetStand = (index, preselectedPassNum = null, e = null) => {
    if (e) e.stopPropagation();
    const st = stands[index];
    if (!isManagerLike && pendingFor(st.id).length) {
      showAlert('يوجد طلب معلّق', 'فيه طلب لهذا الستاند بانتظار موافقة المدير.');
      return;
    }
    setResetBillets('');
    setResetNotes('');
    setResetDateInput(formatDateToISO(currentProdDate));
    setResetShiftInput(selectedShift);
    if (preselectedPassNum) setResetTargetPass(preselectedPassNum);
    else {
      const next = st.passes.find((p) => p.status === 'unused' && p.passNumber !== st.activePass);
      setResetTargetPass(next ? next.passNumber : st.activePass);
    }
    setResetModal({ isOpen: true, standIndex: index });
  };

  const handleResetDateChange = (e) => {
    const nd = e.target.value;
    setResetDateInput(nd);
    const valid = shiftsFor(new Date(nd).getDay() === 5);
    if (!valid.includes(resetShiftInput)) setResetShiftInput(valid[0]);
  };

  const confirmResetStand = () => {
    const index = resetModal.standIndex;
    if (index === null) return;
    const st = stands[index];
    const req = buildRequest(st, 'pass', {
      targetPass: Number(resetTargetPass) || st.activePass,
      billets: Number(resetBillets) || 0,
      notes: resetNotes,
      date: formatDateToGB(resetDateInput) || new Date().toLocaleDateString('en-GB'),
      shift: resetShiftInput
    });
    submitChange(req);
    setResetModal({ isOpen: false, standIndex: null });
  };

  /* ---------- موافقات المدير ---------- */
  const getEdit = (r) => ({ targetPass: r.targetPass, billets: r.billets, notes: r.notes, ...(reqEdits[r.id] || {}) });
  const setEdit = (id, patch) => setReqEdits((prev) => ({ ...prev, [id]: { ...(prev[id] || {}), ...patch } }));

  const approveRequest = (r) => {
    const merged = { ...r, ...(r.kind === 'pass' ? getEdit(r) : {}) };
    const res = applyPassChange(stands, merged, billetWeight, roleLabel);
    if (!res) {
      showAlert('خطأ', 'تعذر تنفيذ الطلب: الستاند غير موجود.');
      return;
    }
    const edited = JSON.stringify(getEdit(r)) !== JSON.stringify({ targetPass: r.targetPass, billets: r.billets, notes: r.notes });
    if (edited && r.kind === 'pass') res.log.notes = `${res.log.notes} (عُدّل بواسطة المدير)`;
    save({ stands: res.list, changes: [res.log, ...passChanges], pending: pendingList.filter((x) => x.id !== r.id) });
  };
  const rejectRequest = (r) => {
    save({
      pending: pendingList.map((x) => (x.id === r.id ? { ...x, status: 'rejected', rejectedAt: new Date().toLocaleString('ar-EG') } : x))
    });
  };
  const dismissRequest = (id) => save({ pending: pendingList.filter((x) => x.id !== id) });

  const handleResetAllStands = () => {
    showConfirm('تحذير شديد', 'هل أنت متأكد من تصفير كافة الستاندات والممرات بالكامل والبدء من ممر 1؟', () => {
      const today = new Date().toLocaleDateString('en-GB');
      save({
        stands: stands.map((s) => ({
          ...s,
          activePass: 1,
          accumulatedTons: 0,
          lastResetDate: today,
          passes: createPassesArray(s.totalPasses, 1, 0)
        }))
      });
    });
  };
  const handleClearArchive = () => {
    showConfirm('تحذير نهائي', 'هل أنت متأكد من مسح جميع بيانات الأرشيف القديمة وسجل الممرات بالكامل والبدء من جديد؟', () => {
      save({ archive: [], changes: [] });
      showAlert('تمت العملية', 'تم مسح الأرشيف وسجل الممرات بنجاح.');
    });
  };
  const handleLimitChange = (index, v) => {
    const val = Number(v);
    if (val > 0) save({ stands: stands.map((s, i) => (i === index ? { ...s, maxLimit: val } : s)) });
  };
  const handleWeightChange = (v) => {
    const val = Number(v);
    if (val > 0) save({ weight: val });
  };

  /* ---------- إنتاج الوردية ---------- */
  const currentDateStr = currentProdDate.toLocaleDateString('en-GB');
  const existingShiftLog = productionArchive.find((l) => l.date === currentDateStr && l.shift === selectedShift);

  const handleAddShiftProduction = () => {
    const n = Number(shiftBillets);
    if (n <= 0 || isNaN(n)) return;
    if (existingShiftLog) {
      setDupModal(true);
      return;
    }
    commitShift('add');
  };

  const commitShift = (mode) => {
    setDupModal(false);
    const n = Number(shiftBillets);
    if (n <= 0 || isNaN(n)) return;
    const newTons = n * billetWeight;
    const existing = productionArchive.find((l) => l.date === currentDateStr && l.shift === selectedShift);
    const delta = mode === 'replace' && existing ? newTons - existing.tons : newTons;

    const now = new Date();
    const saveTime = now.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
    const dayName = currentProdDate.toLocaleDateString('ar-EG', { weekday: 'long' });

    const newStands = stands.map((s) => {
      if (!s.isActive) return s;
      const tons = Math.max(0, s.accumulatedTons + delta);
      return {
        ...s,
        accumulatedTons: tons,
        passes: s.passes.map((p) => (p.passNumber === s.activePass ? { ...p, status: 'active', tons, order: p.order || 1 } : p))
      };
    });

    let archive;
    if (existing) {
      archive = productionArchive.map((l) =>
        l === existing
          ? {
              ...l,
              billets: mode === 'replace' ? n : l.billets + n,
              tons: mode === 'replace' ? newTons : l.tons + newTons,
              time: saveTime,
              productSize: selectedProductSize,
              timestamp: now.getTime()
            }
          : l
      );
    } else {
      archive = [
        {
          id: Date.now(),
          date: currentDateStr,
          dayName,
          time: saveTime,
          shift: selectedShift,
          billets: n,
          tons: newTons,
          productSize: selectedProductSize,
          timestamp: now.getTime()
        },
        ...productionArchive
      ];
    }
    save({ stands: newStands, archive });

    const dayShifts = shiftsFor(currentProdDate.getDay() === 5);
    const i = dayShifts.indexOf(selectedShift);
    if (i === dayShifts.length - 1) {
      const nd = new Date(currentProdDate);
      nd.setDate(nd.getDate() + 1);
      setCurrentProdDate(nd);
      setSelectedShift(shiftsFor(nd.getDay() === 5)[0]);
      showAlert('تم الإقفال', `تم إقفال يوم ${dayName} وتسجيل إنتاج ${selectedShift} بنجاح!\n\nتم فتح يوم جديد تلقائياً.`);
    } else setSelectedShift(dayShifts[i >= 0 ? i + 1 : 0]);
    setShiftBillets('');
  };

  /* ---------- تسجيل التوقفات والأعطال بنظام الورديات (Shift Downtime & Handover) ---------- */
  const handleAddDowntime = (e) => {
    e.preventDefault();
    if (!downForm.reason.trim() || !downForm.durationMins) return;
    const item = {
      id: Date.now(),
      date: currentDateStr,
      dayName: currentProdDate.toLocaleDateString('ar-EG', { weekday: 'long' }),
      shift: selectedShift,
      time: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
      category: downForm.category,
      standName: downForm.standName,
      durationMins: Number(downForm.durationMins) || 0,
      reason: downForm.reason.trim(),
      actionTaken: downForm.actionTaken.trim(),
      productSize: selectedProductSize,
      by: roleLabel
    };
    save({ downtimes: [item, ...downtimesList] });
    setDownForm({ ...downForm, durationMins: '', reason: '', actionTaken: '' });
  };

  const handleDeleteDowntime = (id) => {
    save({ downtimes: downtimesList.filter((d) => d.id !== id) });
  };

  const handleAddHandoverNote = () => {
    if (!handoverText.trim()) return;
    const item = {
      id: Date.now(),
      date: currentDateStr,
      shift: selectedShift,
      time: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
      text: handoverText.trim(),
      by: roleLabel
    };
    save({ handovers: [item, ...handoverNotesList] });
    setHandoverText('');
  };

  /* ---------- سجل المواتير ---------- */
  const handleAddMotor = (e) => {
    e.preventDefault();
    if (!newMotor.code.trim() || !newMotor.kw) return;
    const m = {
      id: Date.now(),
      ...newMotor,
      dateAdded: new Date().toLocaleDateString('en-GB')
    };
    save({ motors: [m, ...motorsList] });
    setNewMotor({ stand: '1', code: '', brand: 'Siemens SINAMICS', kw: '', rpm: '', amps: '', gearRatio: '' });
  };

  const handleDeleteMotor = (id) => {
    save({ motors: motorsList.filter((m) => m.id !== id) });
  };

  /* ---------- الدخول والأدمن ---------- */
  const openLoginModal = (role) => setLoginPrompt({ isOpen: true, role, codeInput: '', error: '' });
  const closeLogin = () => setLoginPrompt({ isOpen: false, role: '', codeInput: '', error: '' });

  const handleVerifyAccessCode = (e) => {
    e.preventDefault();
    const { role, codeInput } = loginPrompt;
    const code = codeInput.trim();
    if (code === adminState.adminCode) {
      setIsSuperAdmin(true);
      setCurrentUser(role === 'admin' ? 'admin' : role);
      setActiveTab(role === 'admin' ? 'admin' : 'dashboard');
      closeLogin();
      return;
    }
    const ok = (role === 'tech' && code === adminState.techCode) || (role === 'manager' && code === adminState.managerCode);
    if (!ok) {
      setLoginPrompt((p) => ({ ...p, error: 'الكود غير صحيح! حاول مرة أخرى.' }));
      return;
    }
    if (adminState.isMaintenance) {
      setLoginPrompt((p) => ({ ...p, error: 'الموقع في وضع الصيانة والتحديث حالياً!' }));
      return;
    }
    setIsSuperAdmin(false);
    setCurrentUser(role);
    setActiveTab('dashboard');
    closeLogin();
  };

  const handleSuperAdminSwitchRole = (role) => {
    if (!isSuperAdmin) return;
    setCurrentUser(role);
    if (role === 'admin') setActiveTab('admin');
    else if (activeTab === 'admin') setActiveTab('dashboard');
  };
  const handleLogout = () => {
    setCurrentUser('none');
    setIsSuperAdmin(false);
    setActiveTab('dashboard');
  };
  const handleSaveAdminSettings = (updated) => {
    setAdminState(updated);
    save({ admin: updated });
    showAlert('تم الحفظ', 'تم تحديث إعدادات الأدمن والأكواد بنجاح.');
  };

  /* ---------- تجميع الأرشيف والتقارير ---------- */
  const groupedArchive = productionArchive.reduce((acc, log) => {
    if (!acc[log.date]) acc[log.date] = { dayName: log.dayName, totalBillets: 0, totalTons: 0, shiftsList: [], timestamp: log.timestamp };
    acc[log.date].totalBillets += log.billets;
    acc[log.date].totalTons += log.tons;
    acc[log.date].shiftsList.push(log);
    return acc;
  }, {});
  const shiftOrder = {
    'الوردية الأولى': 1,
    'الوردية الأولى (12 ساعة)': 1,
    'الوردية الثانية': 2,
    'الوردية الثانية (12 ساعة)': 2,
    'الوردية الثالثة': 3
  };
  Object.keys(groupedArchive).forEach((k) =>
    groupedArchive[k].shiftsList.sort((a, b) => (shiftOrder[a.shift] || 9) - (shiftOrder[b.shift] || 9))
  );
  const sortedDates = Object.keys(groupedArchive).sort((a, b) => groupedArchive[b].timestamp - groupedArchive[a].timestamp);
  const aggregatedLogs = Object.values(groupedArchive)
    .flatMap((d) => d.shiftsList)
    .sort((a, b) => b.timestamp - a.timestamp);

  const reportData = {
    factoryName,
    stands,
    archive: productionArchive,
    changes: passChanges,
    downtimes: downtimesList,
    motors: motorsList,
    billetWeight
  };

  const exportButtons = (
    <div className="flex gap-1.5">
      <button
        onClick={() => downloadExcel(reportData)}
        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-1.5 px-3 rounded text-[10px] flex items-center gap-1 shadow active:scale-95 transition-colors"
      >
        <FileSpreadsheet className="w-3.5 h-3.5" /> تصدير Excel
      </button>
      <button
        onClick={() =>
          printPDF(reportData, () =>
            showAlert('تعذر الفتح', 'المتصفح منع النافذة. اسمح بالنوافذ المنبثقة لهذا الموقع وجرّب تاني.')
          )
        }
        className="bg-rose-600 hover:bg-rose-700 text-white font-bold py-1.5 px-3 rounded text-[10px] flex items-center gap-1 shadow active:scale-95 transition-colors"
      >
        <FileText className="w-3.5 h-3.5" /> طباعة / PDF
      </button>
    </div>
  );

  const pendingCount = pendingList.filter((r) => r.status === 'pending').length;

  /* ======================================================
     الواجهة: صيانة + شاشة الدخول
     ====================================================== */
  if (adminState.isMaintenance && !isSuperAdmin && currentUser !== 'none') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 text-white p-4 text-center" dir="rtl">
        <div className="bg-slate-800 p-8 rounded-2xl max-w-md w-full border-2 border-amber-500 shadow-2xl flex flex-col items-center gap-4">
          <div className="bg-amber-500/20 p-4 rounded-full border border-amber-500/40 animate-pulse">
            <Wrench className="w-14 h-14 text-amber-400" />
          </div>
          <h1 className="text-2xl font-black text-amber-400">جاري التعديل والتحديث</h1>
          <p className="text-sm text-slate-300 leading-relaxed font-bold">{adminState.maintenanceMessage}</p>
          <button onClick={handleLogout} className="mt-4 bg-slate-700 hover:bg-slate-600 text-white font-bold px-6 py-2.5 rounded-lg text-xs">
            العودة لشاشة الدخول
          </button>
        </div>
      </div>
    );
  }

  const loginModalJSX = loginPrompt.isOpen && (
    <Overlay z={90}>
      <form onSubmit={handleVerifyAccessCode} className="bg-slate-800 border border-slate-600 rounded-xl max-w-xs w-full p-5 shadow-2xl flex flex-col gap-3 text-white">
        <div className="flex justify-between items-center border-b border-slate-700 pb-2">
          <h3 className="font-bold text-sm flex items-center gap-1.5">
            <Key className="w-4 h-4 text-blue-400" />
            {loginPrompt.role === 'tech' && 'كود دخول فني الإنتاج'}
            {loginPrompt.role === 'manager' && 'كود دخول إدارة المصنع'}
            {loginPrompt.role === 'admin' && 'بوابة مسؤول النظام (Admin)'}
          </h3>
          <button type="button" onClick={closeLogin} className="text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
        <input
          type="password"
          autoFocus
          value={loginPrompt.codeInput}
          onChange={(e) => setLoginPrompt((p) => ({ ...p, codeInput: e.target.value, error: '' }))}
          placeholder="أدخل الكود السري..."
          className="w-full bg-slate-900 border border-slate-600 rounded-lg p-2.5 text-center font-mono text-lg tracking-widest text-white focus:border-blue-500 outline-none"
        />
        {loginPrompt.error && (
          <p className="text-red-400 text-xs font-bold text-center bg-red-950/50 border border-red-800 p-1.5 rounded">
            {loginPrompt.error}
          </p>
        )}
        <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-lg shadow-lg text-sm">
          تأكيد الدخول
        </button>
      </form>
    </Overlay>
  );

  if (currentUser === 'none') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 text-white p-4 select-none" dir="rtl">
        {loginModalJSX}
        <div className="bg-slate-800 p-8 rounded-2xl max-w-sm w-full text-center border border-slate-700 shadow-2xl relative">
          {/* اختيار المصنع إذا كان هناك أكثر من مصنع */}
          {factoriesList.length > 1 && onSelectFactory && (
            <div className="mb-4">
              <label className="text-[10px] text-slate-400 font-bold block mb-1">اختر المصنع (SaaS Workspace):</label>
              <select
                value={appId}
                onChange={(e) => {
                  const found = factoriesList.find((f) => f.id === e.target.value);
                  if (found) onSelectFactory(found);
                }}
                className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs font-bold text-emerald-400 outline-none"
              >
                {factoriesList.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div onClick={handleSecretAdminTrigger} className="cursor-pointer inline-block w-full">
            {customLogo ? (
              <div className="w-full flex justify-center mb-5 bg-white p-2 rounded-lg shadow-sm">
                <img src={customLogo} alt="Factory Logo" className="h-16 object-contain drop-shadow-md" />
              </div>
            ) : (
              <Building2 className="w-16 h-16 mx-auto text-emerald-500 mb-4 active:scale-95 transition-transform" />
            )}
          </div>
          <h1 onClick={handleSecretAdminTrigger} className="text-2xl font-black mb-1 text-slate-100 cursor-pointer">
            تتبع درافيل ويوميات التشغيل
          </h1>
          <p className="text-xs text-emerald-400 mb-3 font-bold">{factoryName}</p>
          {adminState.isMaintenance ? (
            <div className="bg-amber-500/20 border border-amber-500 text-amber-300 p-3 rounded-lg mb-6 text-xs font-bold flex flex-col items-center gap-1.5">
              <Wrench className="w-5 h-5 text-amber-400 animate-bounce" />
              <span>{adminState.maintenanceMessage}</span>
            </div>
          ) : (
            <p className="text-blue-400 mb-6 text-xs flex items-center justify-center gap-1 font-bold">
              <CheckCircle className="w-4 h-4" /> نظام سحابي متصل لحظياً ({stands.length} ستاند)
            </p>
          )}
          {!isDataLoaded ? (
            <div className="text-slate-400 animate-pulse text-sm font-bold">جاري الاتصال بقاعدة البيانات...</div>
          ) : (
            <div className="space-y-3">
              <button
                onClick={() => openLoginModal('tech')}
                disabled={adminState.isMaintenance}
                className={`w-full flex items-center justify-center gap-2 p-3.5 rounded-lg font-bold transition-colors shadow-lg ${
                  adminState.isMaintenance ? 'bg-slate-700 text-slate-500 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 text-white'
                }`}
              >
                <Edit3 className="w-5 h-5" /> دخول فني الإنتاج
              </button>
              <button
                onClick={() => openLoginModal('manager')}
                disabled={adminState.isMaintenance}
                className={`w-full flex items-center justify-center gap-2 p-3.5 rounded-lg font-bold transition-colors shadow-lg ${
                  adminState.isMaintenance ? 'bg-slate-700 text-slate-500 cursor-not-allowed' : 'bg-slate-700 hover:bg-slate-600 text-white'
                }`}
              >
                <TrendingUp className="w-5 h-5" /> دخول إدارة المصنع
              </button>
              {onBack && (
                <button
                  onClick={onBack}
                  className="w-full pt-3 text-slate-400 hover:text-white text-xs font-bold flex items-center justify-center gap-1"
                >
                  <RotateCcw className="w-3.5 h-3.5" /> العودة للبوابة الرئيسية
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  const isResetDateFriday = resetDateInput ? new Date(resetDateInput).getDay() === 5 : false;
  const resetModalShifts = shiftsFor(isResetDateFriday);
  const selectedRollStand = rollModal.standIndex !== null ? stands[rollModal.standIndex] : null;
  const resetStandObj = resetModal.standIndex !== null ? stands[resetModal.standIndex] : null;

  // إحصائيات توقفات الوردية الحالية
  const currentShiftDowntimes = downtimesList.filter((d) => d.date === currentDateStr && d.shift === selectedShift);
  const currentShiftDownMins = currentShiftDowntimes.reduce((a, d) => a + (Number(d.durationMins) || 0), 0);

  return (
    <div className="h-dvh bg-slate-200 text-slate-900 font-sans flex flex-col p-1 gap-1 overflow-hidden" dir="rtl">
      {/* تنبيه / تأكيد */}
      {modal.isOpen && (
        <Overlay z={100}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden border border-slate-200">
            <div className="p-5">
              <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2">
                {modal.type === 'alert' ? <CheckCircle className="text-green-500 w-5 h-5" /> : <AlertTriangle className="text-orange-500 w-5 h-5" />}
                {modal.title}
              </h3>
              <p className="text-sm text-slate-600 mt-2 leading-relaxed whitespace-pre-line">{modal.message}</p>
            </div>
            <div className="bg-slate-50 p-3 flex justify-end gap-2 border-t border-slate-100">
              {modal.type === 'confirm' && (
                <button onClick={closeBox} className="px-4 py-2 bg-slate-200 hover:bg-slate-300 rounded-lg font-bold text-slate-700 text-xs">
                  إلغاء
                </button>
              )}
              <button
                onClick={() => {
                  const cb = modal.onConfirm;
                  closeBox();
                  if (cb) cb();
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-xs shadow"
              >
                موافق
              </button>
            </div>
          </div>
        </Overlay>
      )}

      {loginModalJSX}

      {/* نافذة إضافة ستاند أو تعديل عدد الستاندات في المصنع */}
      {addStandOpen && isManagerLike && (
        <Overlay z={85}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-300">
            <div className="bg-slate-900 text-white p-3.5 flex justify-between items-center">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <PlusCircle className="w-4 h-4 text-emerald-400" /> إدارة عدد وإضافة قوائم الخط (Stands)
              </h3>
              <button onClick={() => setAddStandOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 space-y-4 text-xs">
              {/* ضبط العدد الإجمالي */}
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 space-y-2">
                <label className="font-black text-blue-900 block">
                  ضبط إجمالي عدد الستاندات بالمصنع (الحالي: {stands.length} ستاند):
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    min="1"
                    max="30"
                    value={targetStandsCount}
                    onChange={(e) => setTargetStandsCount(e.target.value)}
                    className="w-24 border border-blue-300 rounded-lg p-2 text-center font-mono font-bold bg-white"
                  />
                  <button
                    type="button"
                    onClick={handleResizeStandsCount}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg py-2 shadow"
                  >
                    تطبيق العدد الجديد
                  </button>
                </div>
              </div>

              {/* أو إضافة ستاند مفصل */}
              <form onSubmit={handleAddSingleStand} className="space-y-2.5 border-t border-slate-200 pt-3">
                <h4 className="font-black text-slate-800">أو إضافة ستاند جديد بمواصفات مخصصة:</h4>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="font-bold text-slate-600 block mb-1">اسم الستاند:</label>
                    <input
                      type="text"
                      placeholder={`ستاند ${stands.length + 1}`}
                      value={newStandForm.name}
                      onChange={(e) => setNewStandForm({ ...newStandForm, name: e.target.value })}
                      className="w-full border border-slate-300 rounded p-1.5"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-600 block mb-1">شكل الممر (Type):</label>
                    <input
                      type="text"
                      placeholder="بيضاوي / مربع / دائري"
                      value={newStandForm.type}
                      onChange={(e) => setNewStandForm({ ...newStandForm, type: e.target.value })}
                      className="w-full border border-slate-300 rounded p-1.5"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-600 block mb-1">القطر (مم):</label>
                    <input
                      type="text"
                      value={newStandForm.diameter}
                      onChange={(e) => setNewStandForm({ ...newStandForm, diameter: e.target.value })}
                      className="w-full border border-slate-300 rounded p-1.5 font-mono"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-600 block mb-1">عدد الممرات بالدرفيل:</label>
                    <input
                      type="number"
                      value={newStandForm.totalPasses}
                      onChange={(e) => setNewStandForm({ ...newStandForm, totalPasses: e.target.value })}
                      className="w-full border border-slate-300 rounded p-1.5 font-mono"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-600 block mb-1">كود الدرفيل:</label>
                    <input
                      type="text"
                      value={newStandForm.rollCode}
                      onChange={(e) => setNewStandForm({ ...newStandForm, rollCode: e.target.value })}
                      className="w-full border border-slate-300 rounded p-1.5 font-mono"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-600 block mb-1">الحد الأقصى للممر (طن):</label>
                    <input
                      type="number"
                      value={newStandForm.maxLimit}
                      onChange={(e) => setNewStandForm({ ...newStandForm, maxLimit: e.target.value })}
                      className="w-full border border-slate-300 rounded p-1.5 font-mono"
                    />
                  </div>
                </div>
                <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-lg shadow">
                  + إضافة الستاند للخط
                </button>
              </form>
            </div>
          </div>
        </Overlay>
      )}

      {/* نافذة: الوردية مسجلة قبل كده */}
      {dupModal && existingShiftLog && (
        <Overlay z={95}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden border border-amber-300">
            <div className="bg-amber-500 text-slate-950 p-3 font-black text-sm flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" /> الوردية دي مسجلة قبل كده
            </div>
            <div className="p-4 flex flex-col gap-3 text-xs">
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 grid grid-cols-2 gap-2 font-bold">
                <div className="text-slate-500">{existingShiftLog.date} - {existingShiftLog.shift}</div>
                <div className="text-slate-500 text-left" dir="ltr">{existingShiftLog.time}</div>
                <div>المسجل: <span className="font-mono text-blue-700">{existingShiftLog.billets} بليت</span></div>
                <div className="font-mono text-green-700">{existingShiftLog.tons.toFixed(1)} طن</div>
                <div className="col-span-2 border-t border-slate-200 pt-2">
                  الجديد: <span className="font-mono text-amber-700">{Number(shiftBillets)} بليت</span>{' '}
                  <span className="font-mono text-slate-500">({(Number(shiftBillets) * billetWeight).toFixed(1)} طن)</span>
                </div>
              </div>
              <button onClick={() => commitShift('replace')} className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 rounded-lg shadow">
                استبدال الرقم المسجل بالجديد ({Number(shiftBillets)} بليت)
              </button>
              <button onClick={() => commitShift('add')} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-lg shadow">
                إضافته على المسجل (المجموع {existingShiftLog.billets + Number(shiftBillets)} بليت)
              </button>
              <button onClick={() => setDupModal(false)} className="w-full bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold py-2 rounded-lg">
                إلغاء
              </button>
            </div>
          </div>
        </Overlay>
      )}

      {/* ===== صفحة الدرفيل ===== */}
      {rollModal.isOpen && selectedRollStand && (() => {
        const st = selectedRollStand;
        const stat = getStandStatus(st.accumulatedTons, st.maxLimit);
        const pct = Math.min(100, Math.max(0, (st.accumulatedTons / st.maxLimit) * 100));
        const rollTotal = st.passes.reduce((a, p) => a + (Number(p.tons) || 0), 0);
        const usedCount = st.passes.filter((p) => p.status === 'used' || p.status === 'active').length;
        const ordered = st.passes.filter((p) => p.order !== null && p.order !== undefined).sort((a, b) => a.order - b.order);
        const myPending = pendingList.filter((r) => String(r.standId) === String(st.id));
        const kpi = (label, value, unit, cls = 'text-slate-900') => (
          <div className="bg-white rounded-xl border border-slate-200 p-3 flex flex-col gap-0.5">
            <span className="text-[10px] font-bold text-slate-500">{label}</span>
            <span className={`font-mono font-black text-xl leading-tight ${cls}`}>
              {value}
              <span className="text-[10px] font-bold text-slate-400 mr-1">{unit}</span>
            </span>
          </div>
        );
        return (
          <Overlay z={50}>
            <div className="bg-slate-100 rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden border border-slate-300 flex flex-col max-h-[94vh]">
              <div className="bg-slate-900 text-white p-4 shrink-0">
                <div className="flex justify-between items-start gap-3">
                  <div className="flex items-center gap-3">
                    <div className="bg-amber-400 text-slate-950 font-black rounded-xl w-14 h-14 flex flex-col items-center justify-center leading-none shadow">
                      <span className="text-[9px] font-bold">ستاند</span>
                      <span className="text-2xl">{st.id}</span>
                    </div>
                    <div>
                      <h3 className="font-black text-lg leading-tight">{st.name}</h3>
                      <div className="flex flex-wrap gap-1.5 mt-1.5 text-[10px] font-bold">
                        {st.type && <span className="bg-slate-800 border border-slate-700 px-2 py-0.5 rounded">شكل الممر: {st.type}</span>}
                        {st.diameter && (
                          <span className="bg-slate-800 border border-slate-700 px-2 py-0.5 rounded">
                            القطر: <span className="font-mono text-amber-300">{st.diameter}</span> مم
                          </span>
                        )}
                        {st.hardness && (
                          <span className="bg-slate-800 border border-slate-700 px-2 py-0.5 rounded">
                            الصلابة: <span className="font-mono">{st.hardness}</span>
                          </span>
                        )}
                        {st.rollCode && (
                          <span className="bg-slate-800 border border-slate-700 px-2 py-0.5 rounded">
                            كود الدرفيل: <span className="font-mono">{st.rollCode}</span>
                          </span>
                        )}
                        <span className="bg-slate-800 border border-slate-700 px-2 py-0.5 rounded">
                          دخل الخدمة: <span className="font-mono text-green-400">{st.entryDate}</span>
                        </span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => setRollModal({ isOpen: false, standIndex: null, isEditingInfo: false })}
                    className="text-slate-300 hover:text-white bg-slate-800 p-1.5 rounded-lg shrink-0"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="mt-4">
                  <div className="flex justify-between text-[10px] font-bold text-slate-300 mb-1">
                    <span>إنتاج الممر الحالي مقابل الحد الأقصى</span>
                    <span className="font-mono">{pct.toFixed(0)}%</span>
                  </div>
                  <div className="h-2.5 bg-slate-700 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: stat.hex }} />
                  </div>
                </div>
              </div>

              <div className="p-3 sm:p-4 overflow-y-auto flex-1 flex flex-col gap-3">
                {myPending.map((r) => (
                  <div
                    key={r.id}
                    className={`rounded-xl border p-2.5 text-xs font-bold flex items-center justify-between gap-2 ${
                      r.status === 'pending' ? 'bg-amber-50 border-amber-300 text-amber-900' : 'bg-red-50 border-red-300 text-red-800'
                    }`}
                  >
                    <span className="flex items-center gap-1.5">
                      {r.status === 'pending' ? <Hourglass className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                      {r.status === 'pending' ? 'بانتظار موافقة المدير: ' : 'المدير رفض الطلب: '}
                      {r.kind === 'newRoll' ? 'تركيب درفيل جديد' : `نقل من ممر ${r.fromPass} إلى ممر ${r.targetPass}`}
                    </span>
                    {r.status === 'rejected' && (
                      <button onClick={() => dismissRequest(r.id)} className="bg-white border border-red-300 px-2 py-0.5 rounded text-[10px]">
                        حسناً
                      </button>
                    )}
                  </div>
                ))}

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {kpi('الممر الشغال حالياً', `${st.activePass} / ${st.totalPasses}`, 'ممر', 'text-blue-700')}
                  {kpi('إنتاج الممر الحالي', st.accumulatedTons.toFixed(0), 'طن', stat.text)}
                  {kpi('إجمالي إنتاج الدرفيل', rollTotal.toFixed(0), 'طن', 'text-emerald-700')}
                  {kpi('ممرات استُهلكت', usedCount, `من ${st.totalPasses}`, 'text-purple-700')}
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 bg-white p-2.5 rounded-xl border border-slate-200">
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => initiateResetStand(rollModal.standIndex)}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2 rounded-lg text-xs flex items-center gap-1.5 shadow"
                    >
                      <ArrowLeftRight className="w-3.5 h-3.5" /> {isManagerLike ? 'تغيير الممر' : 'طلب تغيير ممر'}
                    </button>
                    <button
                      onClick={handleInstallNewRoll}
                      className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold px-3 py-2 rounded-lg text-xs flex items-center gap-1.5 border border-emerald-300"
                    >
                      <RefreshCw className="w-3.5 h-3.5" /> {isManagerLike ? 'تركيب درفيل جديد' : 'طلب تركيب درفيل جديد'}
                    </button>
                    <button
                      onClick={() => setHistoryModal({ isOpen: true, standId: st.id })}
                      className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold px-3 py-2 rounded-lg text-xs flex items-center gap-1.5 border border-slate-300"
                    >
                      <History className="w-3.5 h-3.5" /> السجل
                    </button>
                  </div>
                  {isManagerLike && (
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => setRollModal((prev) => ({ ...prev, isEditingInfo: !prev.isEditingInfo }))}
                        className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold px-3 py-2 rounded-lg text-xs flex items-center gap-1.5 border border-slate-300"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-blue-600" /> {rollModal.isEditingInfo ? 'إخفاء التعديل' : 'تعديل بيانات الدرفيل'}
                      </button>
                      {stands.length > 1 && (
                        <button
                          onClick={() => handleDeleteStand(rollModal.standIndex)}
                          className="bg-red-50 hover:bg-red-100 text-red-700 font-bold px-2.5 py-2 rounded-lg text-xs border border-red-200"
                          title="حذف هذا الستاند"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {isManagerLike && rollModal.isEditingInfo && (
                  <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-3 grid grid-cols-2 sm:grid-cols-4 gap-2.5 items-end">
                    {[
                      ['اسم الستاند', 'name', 'text'],
                      ['كود الدرفيل', 'rollCode', 'text'],
                      ['القطر (مم)', 'diameter', 'text'],
                      ['الصلابة', 'hardness', 'text'],
                      ['شكل الممر', 'type', 'text'],
                      ['تاريخ الدخول', 'entryDate', 'date'],
                      ['عدد الممرات', 'totalPasses', 'number']
                    ].map(([label, key, type]) => (
                      <div key={key}>
                        <label className="text-[10px] font-bold text-slate-700 block mb-1">{label}:</label>
                        <input
                          type={type}
                          min={type === 'number' ? 1 : undefined}
                          max={type === 'number' ? 40 : undefined}
                          value={rollEditForm[key]}
                          onChange={(e) => setRollEditForm({ ...rollEditForm, [key]: e.target.value })}
                          className="w-full p-1.5 rounded border border-slate-300 text-xs font-mono bg-white"
                        />
                      </div>
                    ))}
                    <div className="flex justify-end">
                      <button
                        onClick={handleSaveRollMetadata}
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-1.5 rounded-lg text-xs flex items-center justify-center gap-1 shadow"
                      >
                        <Save className="w-3.5 h-3.5" /> حفظ
                      </button>
                    </div>
                  </div>
                )}

                <div className="bg-white p-3 rounded-xl border border-slate-200">
                  <h4 className="text-xs font-black text-slate-800 mb-2 flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-blue-600" /> تسلسل تشغيل الممرات
                  </h4>
                  {ordered.length === 0 ? (
                    <p className="text-[11px] text-slate-400 font-bold">لم يبدأ التشغيل بعد.</p>
                  ) : (
                    <div className="flex flex-wrap items-center gap-1.5">
                      {ordered.map((p, i) => (
                        <div key={p.passNumber} className="flex items-center gap-1.5">
                          <div
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1.5 border ${
                              p.status === 'active'
                                ? 'bg-slate-900 text-amber-400 border-amber-500'
                                : 'bg-blue-50 text-blue-900 border-blue-200'
                            }`}
                          >
                            <span className="bg-amber-400 text-slate-950 font-black px-1.5 rounded text-[10px]">{p.order}</span>
                            ممر {p.passNumber}
                            <span className="font-mono text-[10px] opacity-75">{Number(p.tons).toFixed(0)}ط</span>
                          </div>
                          {i < ordered.length - 1 && <span className="text-slate-300 text-xs">←</span>}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-6 gap-2">
                  {st.passes.map((p) => {
                    const isCurrent = p.status === 'active' || p.passNumber === st.activePass;
                    const isUsed = !isCurrent && p.status === 'used';
                    return (
                      <div
                        key={p.passNumber}
                        onClick={() => {
                          if (!isCurrent) initiateResetStand(rollModal.standIndex, p.passNumber);
                        }}
                        className={`rounded-xl border-2 p-2 flex flex-col gap-1.5 transition-all relative ${
                          isCurrent
                            ? 'bg-slate-900 text-white border-amber-400 shadow-lg'
                            : isUsed
                            ? 'bg-blue-50 text-blue-950 border-blue-300 hover:bg-blue-100 cursor-pointer'
                            : 'bg-white text-slate-700 border-slate-200 hover:border-blue-400 cursor-pointer'
                        }`}
                      >
                        <div className="flex justify-between items-center">
                          <span className="font-black text-xs">ممر {p.passNumber}</span>
                          {p.order && <span className="bg-amber-400 text-slate-950 font-black text-[9px] px-1.5 rounded">#{p.order}</span>}
                        </div>
                        <div className="text-center">
                          <span
                            className={`font-mono font-black text-xl leading-none ${
                              isCurrent ? 'text-amber-400' : isUsed ? 'text-blue-900' : 'text-slate-300'
                            }`}
                          >
                            {Number(p.tons || 0).toFixed(0)}
                          </span>
                          <span className="text-[9px] font-bold opacity-70 mr-1">طن</span>
                        </div>
                        <span
                          className={`text-center text-[9px] font-bold py-0.5 rounded ${
                            isCurrent ? 'bg-amber-400 text-slate-950' : isUsed ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          {isCurrent ? 'شغال حالياً' : isUsed ? 'منتهي' : 'جديد'}
                        </span>
                        {isManagerLike && !isCurrent && (
                          <div className="flex gap-1 pt-1 border-t border-slate-300/60" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => {
                                const v = prompt(`أدخل الإنتاج التراكمي للممر رقم ${p.passNumber} (بالطن):`, p.tons || 0);
                                if (v !== null)
                                  handleDirectPassStatusChange(
                                    rollModal.standIndex,
                                    p.passNumber,
                                    Number(v) > 0 ? 'used' : 'unused',
                                    Number(v)
                                  );
                              }}
                              className="text-[9px] bg-slate-200 hover:bg-slate-300 text-slate-800 px-1.5 py-0.5 rounded font-bold flex-1"
                            >
                              تعديل
                            </button>
                            {isUsed && (
                              <button
                                onClick={() => handleDirectPassStatusChange(rollModal.standIndex, p.passNumber, 'unused', 0)}
                                className="text-[9px] bg-red-100 hover:bg-red-200 text-red-700 px-1.5 py-0.5 rounded font-bold"
                              >
                                تصفير
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </Overlay>
        );
      })()}

      {/* ===== نافذة تغيير الممر ===== */}
      {resetModal.isOpen && resetStandObj && (
        <Overlay z={60}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-300 flex flex-col max-h-[90vh]">
            <div className="bg-slate-900 p-3 flex justify-between items-center text-white shrink-0">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <RotateCcw className="w-4 h-4 text-amber-400" /> {isManagerLike ? 'تغيير ممر' : 'طلب تغيير ممر'} - {resetStandObj.name}
              </h3>
              <button onClick={() => setResetModal({ isOpen: false, standIndex: null })} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 flex flex-col gap-3 overflow-y-auto">
              <div className="bg-blue-50 border border-blue-200 p-2.5 rounded-lg flex justify-between items-center text-xs font-bold text-blue-900">
                <span>
                  الممر الشغال: <strong className="bg-slate-900 text-amber-400 px-2 py-0.5 rounded font-mono">ممر {resetStandObj.activePass}</strong>
                </span>
                <span>
                  الإنتاج: <strong className="font-mono text-blue-700">{resetStandObj.accumulatedTons.toFixed(0)} طن</strong>
                </span>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-black text-slate-800 flex items-center gap-1">
                  <Layers className="w-4 h-4 text-blue-600" /> 1. اختر الممر الجديد:
                </label>
                <div className="grid grid-cols-6 sm:grid-cols-8 gap-1.5 bg-slate-100 p-2 rounded-xl border border-slate-200 max-h-40 overflow-y-auto">
                  {resetStandObj.passes.map((p) => {
                    const sel = Number(resetTargetPass) === p.passNumber;
                    const cur = p.passNumber === resetStandObj.activePass;
                    const used = p.status === 'used' && !cur;
                    return (
                      <button
                        type="button"
                        key={p.passNumber}
                        onClick={() => setResetTargetPass(p.passNumber)}
                        className={`p-1.5 rounded-lg font-mono text-xs font-black border-2 flex flex-col items-center transition-all ${
                          sel
                            ? 'bg-emerald-600 text-white border-emerald-900 shadow-md scale-105'
                            : cur
                            ? 'bg-slate-900 text-amber-400 border-amber-400'
                            : used
                            ? 'bg-blue-100 text-blue-900 border-blue-300 opacity-80'
                            : 'bg-white text-slate-800 border-slate-300 hover:border-blue-500'
                        }`}
                      >
                        <span>{p.passNumber}</span>
                        <span className="text-[8px] font-normal opacity-80">
                          {cur ? 'الحالي' : used ? `${Number(p.tons).toFixed(0)}ط` : 'جديد'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-slate-700">تاريخ التغيير:</label>
                  <input
                    type="date"
                    value={resetDateInput}
                    onChange={handleResetDateChange}
                    className="w-full border border-slate-300 rounded p-1.5 font-mono text-xs"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-slate-700">الوردية:</label>
                  <select
                    value={resetShiftInput}
                    onChange={(e) => setResetShiftInput(e.target.value)}
                    className="w-full bg-white border border-slate-300 text-[10px] font-bold p-1.5 rounded"
                  >
                    {resetModalShifts.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-700">عدد بليت الممر القديم قبل التغيير:</label>
                <input
                  type="number"
                  value={resetBillets}
                  onChange={(e) => setResetBillets(e.target.value)}
                  className="w-full border border-slate-300 rounded p-2 font-mono text-xs"
                  placeholder="اتركه فارغاً لحساب كامل الإنتاج الحالي للممر القديم"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-700">ملاحظات أو سبب التغيير:</label>
                <textarea
                  rows="2"
                  value={resetNotes}
                  onChange={(e) => setResetNotes(e.target.value)}
                  className="w-full border border-slate-300 rounded p-2 text-xs resize-none"
                  placeholder="تآكل ممر، خشونة، كسر، تغيير مقاس..."
                />
              </div>
              <button
                onClick={confirmResetStand}
                className="w-full bg-blue-600 text-white font-bold py-2.5 rounded-lg hover:bg-blue-700 shadow text-xs sm:text-sm"
              >
                {isManagerLike
                  ? `تأكيد قفل ممر ${resetStandObj.activePass} وتشغيل ممر ${resetTargetPass}`
                  : `إرسال الطلب للمدير (ممر ${resetStandObj.activePass} ← ممر ${resetTargetPass})`}
              </button>
            </div>
          </div>
        </Overlay>
      )}

      {/* ===== نافذة موافقات المدير ===== */}
      {approvalsOpen && isManagerLike && (
        <Overlay z={70}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-300 flex flex-col max-h-[90vh]">
            <div className="bg-slate-900 p-3 flex justify-between items-center text-white shrink-0">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <Inbox className="w-4 h-4 text-amber-400" /> طلبات بانتظار الموافقة ({pendingCount})
              </h3>
              <button onClick={() => setApprovalsOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-3 overflow-y-auto flex flex-col gap-3 bg-slate-50">
              {pendingCount === 0 && <div className="text-center py-10 text-slate-400 font-bold text-sm">مفيش طلبات معلّقة.</div>}
              {pendingList
                .filter((r) => r.status === 'pending')
                .map((r) => {
                  const st = stands.find((s) => String(s.id) === String(r.standId));
                  const ed = getEdit(r);
                  return (
                    <div key={r.id} className="bg-white border border-slate-200 rounded-xl p-3 flex flex-col gap-2 shadow-sm">
                      <div className="flex justify-between items-center">
                        <span className="font-black text-sm text-slate-900">{r.standName}</span>
                        <span
                          className={`text-[10px] font-black px-2 py-0.5 rounded ${
                            r.kind === 'newRoll' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {r.kind === 'newRoll' ? 'تركيب درفيل جديد' : 'تغيير ممر'}
                        </span>
                      </div>
                      <div className="text-[10px] text-slate-500 font-bold">
                        من: {r.requestedBy} | {r.createdAt} | {r.date} - {r.shift}
                      </div>
                      {r.kind === 'pass' && (
                        <div className="grid grid-cols-3 gap-2 text-[10px] font-bold">
                          <div>
                            <label className="block text-slate-600 mb-0.5">من ممر {r.fromPass} إلى:</label>
                            <select
                              value={ed.targetPass}
                              onChange={(e) => setEdit(r.id, { targetPass: Number(e.target.value) })}
                              className="w-full border border-slate-300 rounded p-1.5 font-mono bg-white"
                            >
                              {st &&
                                st.passes.map((p) => (
                                  <option key={p.passNumber} value={p.passNumber}>
                                    ممر {p.passNumber}
                                  </option>
                                ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-slate-600 mb-0.5">بليت الممر القديم:</label>
                            <input
                              type="number"
                              value={ed.billets}
                              onChange={(e) => setEdit(r.id, { billets: e.target.value })}
                              className="w-full border border-slate-300 rounded p-1.5 font-mono"
                            />
                          </div>
                          <div>
                            <label className="block text-slate-600 mb-0.5">ملاحظات:</label>
                            <input
                              type="text"
                              value={ed.notes || ''}
                              onChange={(e) => setEdit(r.id, { notes: e.target.value })}
                              className="w-full border border-slate-300 rounded p-1.5"
                            />
                          </div>
                        </div>
                      )}
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => rejectRequest(r)}
                          className="bg-red-50 hover:bg-red-100 text-red-700 border border-red-300 font-bold px-4 py-1.5 rounded-lg text-xs flex items-center gap-1"
                        >
                          <XCircle className="w-3.5 h-3.5" /> رفض
                        </button>
                        <button
                          onClick={() => approveRequest(r)}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-1.5 rounded-lg text-xs flex items-center gap-1 shadow"
                        >
                          <Check className="w-3.5 h-3.5" /> اعتماد
                        </button>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </Overlay>
      )}

      {/* ===== سجل الستاند ===== */}
      {historyModal.isOpen && (
        <Overlay z={80}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-300 flex flex-col max-h-[80vh]">
            <div className="bg-slate-800 p-3 flex justify-between items-center text-white shrink-0">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <History className="w-4 h-4" /> سجل تغييرات ستاند {historyModal.standId}
              </h3>
              <button onClick={() => setHistoryModal({ isOpen: false, standId: null })} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-3 overflow-y-auto flex-1 flex flex-col gap-2 bg-slate-50">
              {passChanges.filter((c) => String(c.standId) === String(historyModal.standId)).length === 0 ? (
                <div className="text-center py-8 text-slate-400 font-bold text-xs">لا يوجد سجل تغييرات لهذا الستاند.</div>
              ) : (
                passChanges
                  .filter((c) => String(c.standId) === String(historyModal.standId))
                  .map((c) => (
                    <div key={c.id} className="bg-white p-2.5 rounded-lg border border-slate-200 shadow-sm flex flex-col gap-1.5">
                      <div className="flex justify-between items-center border-b border-slate-100 pb-1">
                        <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
                          {c.date} | <span className="text-blue-700">{c.shift}</span>
                        </span>
                        <span className="text-[11px] font-black text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">
                          إنتاج: {Number(c.tons).toFixed(1)} طن
                        </span>
                      </div>
                      <div className="flex justify-between text-[10px] text-slate-600 font-bold">
                        <span>مقاس: {c.productSize} مم</span>
                        <span>{c.kind === 'newRoll' ? 'تركيب درفيل جديد' : `من ممر ${c.fromPass} ← ممر ${c.toPass}`}</span>
                        <span>بليت: {c.billetsAtChange || 0}</span>
                      </div>
                      <p className="text-[10px] text-slate-700 bg-orange-50 p-1.5 rounded border border-orange-100">
                        <span className="font-bold text-orange-700">ملاحظات:</span> {c.notes}
                      </p>
                    </div>
                  ))
              )}
            </div>
          </div>
        </Overlay>
      )}

      {/* إعدادات الشعار */}
      {isSettingsOpen && (
        <Overlay z={50}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden border border-slate-300">
            <div className="bg-slate-800 p-3 flex justify-between items-center text-white">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <Settings className="w-4 h-4" /> إعدادات شعار المصنع
              </h3>
              <button onClick={() => setIsSettingsOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                  <UploadCloud className="w-4 h-4 text-blue-600" /> رفع لوجو المصنع:
                </label>
                <input
                  type="file"
                  accept="image/png, image/jpeg, image/webp"
                  onChange={handleLogoUpload}
                  className="w-full border border-slate-300 rounded p-1.5 text-xs cursor-pointer"
                />
              </div>
              {tempLogoUrl && (
                <div className="bg-slate-100 p-3 rounded-lg border border-slate-200 flex flex-col items-center gap-2">
                  <div className="bg-white p-2 rounded shadow-sm">
                    <img src={tempLogoUrl} alt="Preview" className="h-16 object-contain" />
                  </div>
                </div>
              )}
              <button
                onClick={handleSaveSettings}
                className="w-full bg-blue-600 text-white font-bold py-2.5 rounded-lg hover:bg-blue-700 flex justify-center items-center gap-2 shadow-md"
              >
                <Save className="w-4 h-4" /> تطبيق الشعار
              </button>
            </div>
          </div>
        </Overlay>
      )}

      {/* شريط الأدمن */}
      {isSuperAdmin && (
        <div className="bg-amber-500 text-slate-950 px-3 py-1 rounded flex flex-wrap justify-between items-center gap-2 shadow-sm flex-none">
          <div className="flex items-center gap-1.5 text-xs font-black">
            <ShieldAlert className="w-4 h-4" />
            <span>وضع الأدمن الشامل ({factoryName}):</span>
          </div>
          <div className="flex items-center gap-1">
            {[
              ['tech', 'عرض كـ فني', Edit3],
              ['manager', 'عرض كـ مدير', UserCog]
            ].map(([r, label, Icon]) => (
              <button
                key={r}
                onClick={() => handleSuperAdminSwitchRole(r)}
                className={`px-2.5 py-1 rounded text-[10px] font-black flex items-center gap-1 ${
                  currentUser === r ? 'bg-slate-900 text-amber-400 shadow' : 'bg-amber-400/60 hover:bg-amber-400 text-slate-900'
                }`}
              >
                <Icon className="w-3 h-3" /> {label}
              </button>
            ))}
            <button
              onClick={() => handleSuperAdminSwitchRole('admin')}
              className={`px-2.5 py-1 rounded text-[10px] font-black flex items-center gap-1 ${
                currentUser === 'admin' && activeTab === 'admin'
                  ? 'bg-slate-900 text-amber-400 shadow'
                  : 'bg-amber-400/60 hover:bg-amber-400 text-slate-900'
              }`}
            >
              <Settings2 className="w-3 h-3" /> إعدادات الأدمن
            </button>
          </div>
        </div>
      )}

      {/* الشريط العلوي */}
      <nav className="bg-slate-900 text-white p-2 rounded flex flex-col gap-2 flex-none shadow-sm select-none">
        <div className="flex justify-between items-center relative h-10">
          <div onClick={handleSecretAdminTrigger} className="flex items-center gap-2 z-10 cursor-pointer">
            {customLogo && (
              <div className="bg-white p-1 rounded shadow-sm flex shrink-0">
                <img src={customLogo} alt="Logo" className="h-5 sm:h-7 w-auto max-w-[70px] sm:max-w-[120px] object-contain" />
              </div>
            )}
            <span className="font-bold text-xs sm:text-sm text-slate-100 truncate max-w-[140px] sm:max-w-none">
              {factoryName}
            </span>
          </div>
          <div className="absolute left-1/2 -translate-x-1/2 z-0 hidden sm:block">
            <LiveClock />
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2 z-10">
            {isManagerLike && (
              <button
                onClick={() => setAddStandOpen(true)}
                className="bg-emerald-600 hover:bg-emerald-500 text-white px-2.5 py-1 rounded text-[10px] font-bold flex items-center gap-1 shadow-sm"
                title="إضافة ستاند أو تعديل عدد القوائم"
              >
                <PlusCircle className="w-3.5 h-3.5" />
                <span>الستاندات ({stands.length})</span>
              </button>
            )}
            {isManagerLike && (
              <button
                onClick={() => setApprovalsOpen(true)}
                className="relative bg-amber-500 hover:bg-amber-400 text-slate-950 p-1.5 rounded shadow-sm"
                title="طلبات الموافقة"
              >
                <Inbox className="w-3.5 h-3.5" />
                {pendingCount > 0 && (
                  <span className="absolute -top-1.5 -left-1.5 bg-red-600 text-white text-[9px] font-black rounded-full min-w-[16px] h-4 px-1 flex items-center justify-center">
                    {pendingCount}
                  </span>
                )}
              </button>
            )}
            {(isManagerLike || isSuperAdmin) && (
              <button onClick={openSettingsModal} className="bg-slate-700 p-1.5 rounded hover:bg-slate-600 shadow-sm" title="رفع شعار المصنع">
                <Settings className="w-3.5 h-3.5 text-blue-300" />
              </button>
            )}
            <span className="bg-slate-800 px-2 py-1 rounded text-[10px] font-bold text-blue-300 flex items-center gap-1 border border-slate-700">
              <span className={`w-2 h-2 rounded-full ${auth ? 'bg-green-500 shadow-[0_0_5px_#22c55e]' : 'bg-slate-400'}`} />
              {roleLabel}
            </span>
            <button onClick={handleLogout} className="text-red-400 hover:text-red-300 text-xs font-bold">
              خروج
            </button>
            {onBack && (
              <button onClick={onBack} className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-2 py-1 rounded text-[10px] font-bold">
                الرئيسية
              </button>
            )}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 bg-slate-800 p-1.5 rounded-lg justify-between items-center z-10 relative">
          <div className="flex gap-1.5 w-full sm:w-auto overflow-x-auto">
            {[
              ['dashboard', 'التشغيل والممرات', TrendingUp],
              ['downtime', 'أعطال ويوميات الوردية', Wrench],
              ['motors', 'سجل المواتير', Cpu],
              ['analytics', 'الإحصائيات', BarChart3],
              ['archive', 'الأرشيف', Archive]
            ].map(([k, label, Icon]) => (
              <button
                key={k}
                onClick={() => setActiveTab(k)}
                className={`flex-1 sm:flex-none px-3 py-1.5 text-xs font-bold rounded flex justify-center items-center gap-1 whitespace-nowrap transition-all ${
                  activeTab === k ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:bg-slate-700'
                }`}
              >
                <Icon className="w-3.5 h-3.5" /> {label}
              </button>
            ))}
            {isSuperAdmin && (
              <button
                onClick={() => {
                  setCurrentUser('admin');
                  setActiveTab('admin');
                }}
                className={`flex-1 sm:flex-none px-3 py-1.5 text-xs font-bold rounded flex justify-center items-center gap-1 whitespace-nowrap ${
                  activeTab === 'admin' ? 'bg-amber-500 text-slate-950 shadow' : 'text-amber-400 hover:bg-slate-700'
                }`}
              >
                <ShieldAlert className="w-3.5 h-3.5" /> الأدمن
              </button>
            )}
          </div>
          {activeTab === 'dashboard' && (
            <div className="flex items-center gap-2 w-full sm:w-auto bg-slate-700 px-2 py-1 rounded border border-slate-600">
              <span className="text-white text-xs font-bold whitespace-nowrap">مقاس المنتج:</span>
              <select
                value={selectedProductSize}
                onChange={(e) => handleProductSizeChange(e.target.value)}
                className="bg-white text-slate-900 text-xs font-bold px-2 py-1 rounded outline-none w-full sm:w-auto cursor-pointer"
              >
                {['10', '12', '14', '16', '18', '20', '22', '25', '32', 'خوصة 50×10', 'خوصة 40×10'].map((s) => (
                  <option key={s} value={s}>
                    {s} مم
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </nav>

      {/* ===== 1. لوحة التشغيل والممرات ===== */}
      {activeTab === 'dashboard' && (
        <div className="flex flex-col gap-2 flex-1 overflow-hidden p-1">
          {isManagerLike && (
            <div className="flex flex-col gap-1.5 flex-none bg-white p-2 rounded-lg border border-slate-300 shadow-sm">
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-green-100 p-1.5 border border-green-300 rounded-lg">
                  <p className="text-[10px] font-bold text-green-800">أقل من 80%</p>
                  <p className="font-black text-lg text-green-700">{stands.filter((s) => s.accumulatedTons / s.maxLimit < 0.8).length}</p>
                </div>
                <div className="bg-yellow-100 p-1.5 border border-yellow-400 rounded-lg">
                  <p className="text-[10px] font-bold text-yellow-800">إنذار (+80%)</p>
                  <p className="font-black text-lg text-yellow-700">
                    {stands.filter((s) => s.accumulatedTons / s.maxLimit >= 0.8 && s.accumulatedTons / s.maxLimit < 1).length}
                  </p>
                </div>
                <div className="bg-red-100 p-1.5 border border-red-500 rounded-lg">
                  <p className="text-[10px] font-bold text-red-800">خطر (+100%)</p>
                  <p className="font-black text-lg text-red-700">{stands.filter((s) => s.accumulatedTons / s.maxLimit >= 1).length}</p>
                </div>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200 mt-1">
                <div className="flex items-center gap-1.5 shrink-0">
                  <Sliders className="w-4 h-4 text-blue-600" />
                  <span className="text-xs font-bold text-slate-700">وزن البليت (طن):</span>
                  <input
                    type="number"
                    step="0.01"
                    value={billetWeight}
                    onChange={(e) => handleWeightChange(e.target.value)}
                    className="w-16 p-1 border border-slate-300 rounded text-center font-mono font-bold text-xs bg-slate-50"
                  />
                </div>
                <div className="flex flex-wrap gap-2">
                  {exportButtons}
                  <button
                    onClick={() => setAddStandOpen(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-1.5 px-3 rounded text-[10px] flex items-center gap-1 shadow"
                  >
                    <PlusCircle className="w-3.5 h-3.5" /> + إضافة / تعديل عدد الستاندات
                  </button>
                  <button
                    onClick={handleResetAllStands}
                    className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-1.5 px-3 rounded text-[10px] flex items-center gap-1 shadow"
                  >
                    <RefreshCw className="w-3 h-3" /> تصفير الكل
                  </button>
                  <button
                    onClick={handleClearArchive}
                    className="bg-red-600 hover:bg-red-700 text-white font-bold py-1.5 px-3 rounded text-[10px] flex items-center gap-1 shadow"
                  >
                    <Trash2 className="w-3 h-3" /> مسح الأرشيف
                  </button>
                </div>
              </div>
            </div>
          )}

          {(currentUser === 'tech' || currentUser === 'admin') && (
            <div className="bg-white p-2 rounded-lg shadow-sm flex flex-col flex-none border border-slate-300 gap-2">
              <div className="bg-blue-50 border border-blue-200 text-blue-800 text-[10px] font-bold p-1.5 rounded flex justify-between items-center">
                <button onClick={() => handleDateChange(-1)} className="px-3 py-1 bg-blue-200 hover:bg-blue-300 rounded text-blue-900">
                  يوم سابق
                </button>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleGoToToday}
                    className="px-2 py-1 bg-green-500 hover:bg-green-600 rounded text-white shadow-sm text-[9px] font-bold flex gap-1 items-center"
                  >
                    الآن <RotateCcw className="w-3 h-3" />
                  </button>
                  <div className="flex flex-col items-center">
                    <span>
                      تسجيل لـ: {currentProdDate.toLocaleDateString('ar-EG', { weekday: 'long' })} (الوزن: {billetWeight} طن)
                    </span>
                    <span className="font-mono text-[11px] text-blue-600">{currentDateStr}</span>
                  </div>
                </div>
                <button onClick={() => handleDateChange(1)} className="px-3 py-1 bg-blue-200 hover:bg-blue-300 rounded text-blue-900">
                  يوم تالي
                </button>
              </div>

              <div className="flex flex-row gap-1 items-stretch w-full">
                <input
                  type="number"
                  value={shiftBillets}
                  onChange={(e) => setShiftBillets(e.target.value)}
                  className="flex-1 min-w-0 p-2 border border-slate-400 rounded text-center text-sm font-bold bg-slate-50"
                  placeholder="عدد البليت بالوردية"
                />
                <select
                  value={selectedShift}
                  onChange={(e) => setSelectedShift(e.target.value)}
                  className="flex-1 min-w-0 bg-slate-100 border border-slate-400 text-xs font-bold p-1 rounded cursor-pointer"
                >
                  {availableShifts.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
                <button
                  onClick={handleAddShiftProduction}
                  className="flex-1 min-w-0 bg-blue-600 hover:bg-blue-700 text-white font-bold p-1 rounded flex justify-center items-center gap-1 shadow-sm text-[11px] sm:text-sm"
                >
                  <Save className="w-3.5 h-3.5" /> حفظ وإغلاق الوردية
                </button>
              </div>
            </div>
          )}

          {/* شبكة الستاندات الديناميكية */}
          <div className="flex-1 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 overflow-y-auto pr-1 pb-1 content-start">
            {stands.map((stand, idx) => {
              const percentage = Math.max(0, Math.min((stand.accumulatedTons / stand.maxLimit) * 100, 100));
              const status = getStandStatus(stand.accumulatedTons, stand.maxLimit);
              const usedCount = stand.passes ? stand.passes.filter((p) => p.status === 'used' || p.status === 'active').length : 1;
              const sp = pendingList.filter((r) => String(r.standId) === String(stand.id));
              const hasPending = sp.some((r) => r.status === 'pending');
              const hasRejected = sp.some((r) => r.status === 'rejected');
              return (
                <div
                  key={stand.id}
                  onClick={() => openStandRollPage(idx)}
                  className={`min-h-[155px] sm:min-h-[168px] rounded-xl flex flex-col justify-between border-2 cursor-pointer ${
                    stand.isActive ? status.bg : 'bg-slate-300 opacity-60'
                  } ${status.border} p-2 relative overflow-hidden shadow-sm hover:shadow-md transition-all`}
                >
                  <div className="absolute bottom-0 left-0 w-full h-1.5 bg-slate-300/50">
                    <div className={`h-full ${status.bar}`} style={{ width: `${percentage}%`, transition: 'width 0.5s ease-in-out' }} />
                  </div>

                  <div className="flex justify-between items-start z-10">
                    <div className="flex flex-col">
                      <span className="font-black text-sm sm:text-base text-slate-900">{stand.name}</span>
                      <span className="text-[9px] text-slate-500 font-bold">
                        {[stand.type, stand.diameter && `قطر ${stand.diameter}`].filter(Boolean).join(' | ')}
                      </span>
                    </div>
                    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => setHistoryModal({ isOpen: true, standId: stand.id })}
                        className="p-1 text-blue-600 bg-blue-100 hover:bg-blue-200 rounded"
                        title="سجل الممر"
                      >
                        <History className="w-3.5 h-3.5" />
                      </button>
                      {currentUser === 'tech' || currentUser === 'admin' ? (
                        <button
                          onClick={(e) => handleToggleActive(idx, e)}
                          className={`p-1 rounded ${stand.isActive ? 'text-green-600 bg-white/80 hover:bg-white' : 'text-slate-500 bg-black/10'}`}
                        >
                          <Power className="w-3.5 h-3.5" />
                        </button>
                      ) : (
                        status.color === 'danger' && <AlertTriangle className="w-4 h-4 text-red-500 animate-ping" />
                      )}
                    </div>
                  </div>

                  {(hasPending || hasRejected) && (
                    <span
                      className={`z-10 self-start text-[9px] font-black px-1.5 py-0.5 rounded flex items-center gap-1 ${
                        hasPending ? 'bg-amber-400 text-slate-950' : 'bg-red-600 text-white'
                      }`}
                    >
                      {hasPending ? (
                        <>
                          <Hourglass className="w-3 h-3" /> بانتظار المدير
                        </>
                      ) : (
                        <>
                          <XCircle className="w-3 h-3" /> طلب مرفوض
                        </>
                      )}
                    </span>
                  )}

                  <div className="flex flex-col items-center justify-center flex-1 z-10 py-1">
                    <span className={`font-mono font-black text-3xl sm:text-4xl leading-none tracking-tighter ${status.text}`}>
                      {stand.accumulatedTons.toFixed(0)}
                    </span>
                    <div className="flex items-center gap-1 mt-1.5">
                      <span className="bg-slate-900 text-amber-400 text-[10px] font-black px-2 py-0.5 rounded shadow-sm">
                        ممر {stand.activePass} / {stand.totalPasses}
                      </span>
                      <span className="text-[9px] font-bold text-slate-600 bg-white/80 px-1.5 py-0.5 rounded border border-slate-200">
                        استُهلك {usedCount}
                      </span>
                    </div>
                    <span className="text-[9px] font-bold opacity-75 mt-1 text-slate-600">الهدف: {stand.maxLimit} طن</span>
                  </div>

                  {currentUser === 'tech' ? (
                    <div className="grid grid-cols-2 gap-1 z-10 mt-auto" onClick={(e) => e.stopPropagation()}>
                      <button onClick={() => openStandRollPage(idx)} className="py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-bold rounded-md shadow">
                        الممرات ({stand.totalPasses})
                      </button>
                      <button onClick={(e) => initiateResetStand(idx, null, e)} className="py-1.5 bg-slate-800 hover:bg-slate-900 text-white text-[10px] font-bold rounded-md shadow">
                        طلب نقل ممر
                      </button>
                    </div>
                  ) : (
                    <div className="mt-auto pt-1.5 border-t border-black/10 flex items-center justify-between gap-1 z-10 w-full" onClick={(e) => e.stopPropagation()}>
                      <button onClick={(e) => initiateResetStand(idx, null, e)} className="bg-red-500 hover:bg-red-600 text-white text-[9px] sm:text-[10px] px-2 py-0.5 rounded font-bold shadow-sm shrink-0">
                        تغيير ممر
                      </button>
                      <button onClick={() => openStandRollPage(idx)} className="bg-blue-600 hover:bg-blue-700 text-white text-[9px] px-1.5 py-0.5 rounded font-bold">
                        الممرات
                      </button>
                      <input
                        type="number"
                        value={stand.maxLimit}
                        onChange={(e) => handleLimitChange(idx, e.target.value)}
                        className="w-12 text-[10px] text-center border border-slate-300 rounded font-mono font-bold bg-white p-0.5 shadow-inner"
                      />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ===== 2. نظام الأعطال والتوقفات ويوميات التشغيل بالورديات (Shift Downtime & Handover) ===== */}
      {activeTab === 'downtime' && (
        <div className="flex-1 bg-white rounded-lg shadow border border-slate-300 p-3 sm:p-4 overflow-y-auto flex flex-col gap-4">
          {/* شريط اختيار اليوم والوردية + أزرار التصدير */}
          <div className="bg-slate-900 text-white p-3 rounded-xl flex flex-wrap justify-between items-center gap-3">
            <div>
              <h2 className="font-black text-sm sm:text-base flex items-center gap-2">
                <Wrench className="w-5 h-5 text-amber-400" /> إدارة يوميات التشغيل وأعطال وتوقفات الورديات
              </h2>
              <p className="text-[11px] text-slate-300 font-bold mt-0.5">
                اليوم: {currentProdDate.toLocaleDateString('ar-EG', { weekday: 'long' })} ({currentDateStr}) — {selectedShift}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={selectedShift}
                onChange={(e) => setSelectedShift(e.target.value)}
                className="bg-slate-800 border border-slate-700 text-amber-400 text-xs font-bold px-3 py-1.5 rounded-lg"
              >
                {availableShifts.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
              {exportButtons}
            </div>
          </div>

          {/* ملخص توقفات الوردية الحالية */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center">
            <div className="bg-red-50 border border-red-200 p-3 rounded-xl">
              <span className="text-[10px] font-bold text-red-700 block">توقفات الوردية الحالية</span>
              <span className="font-mono font-black text-2xl text-red-800">{currentShiftDownMins} ق</span>
            </div>
            <div className="bg-amber-50 border border-amber-200 p-3 rounded-xl">
              <span className="text-[10px] font-bold text-amber-800 block">عدد أعطال الوردية</span>
              <span className="font-mono font-black text-2xl text-amber-900">{currentShiftDowntimes.length}</span>
            </div>
            <div className="bg-blue-50 border border-blue-200 p-3 rounded-xl">
              <span className="text-[10px] font-bold text-blue-800 block">إجمالي التوقفات الكلي</span>
              <span className="font-mono font-black text-2xl text-blue-900">
                {downtimesList.reduce((a, d) => a + (Number(d.durationMins) || 0), 0)} ق
              </span>
            </div>
            <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-xl">
              <span className="text-[10px] font-bold text-emerald-800 block">إتاحية الوردية (480 ق)</span>
              <span className="font-mono font-black text-2xl text-emerald-900">
                {Math.max(0, Math.round(((480 - currentShiftDownMins) / 480) * 100))}%
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            {/* فورم تسجيل عطل / توقف في الوردية */}
            <form onSubmit={handleAddDowntime} className="lg:col-span-5 bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3 h-fit">
              <h3 className="font-black text-sm text-slate-800 border-b border-slate-200 pb-2">
                تسجيل عطل أو توقف في ({selectedShift})
              </h3>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div>
                  <label className="font-bold text-slate-600 block mb-1">تصنيف التوقف:</label>
                  <select
                    value={downForm.category}
                    onChange={(e) => setDownForm({ ...downForm, category: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2 bg-white font-bold"
                  >
                    <option>كهرباء وكنترول</option>
                    <option>ميكانيكا ودرافيل</option>
                    <option>تشغيل وكعبلة (Cobble)</option>
                    <option>تغيير ممر / ضبط خلوص</option>
                    <option>هيدروليك ومياه تبريد</option>
                    <option>فرن التسخين / غاز</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-600 block mb-1">الستاند / المعدة:</label>
                  <select
                    value={downForm.standName}
                    onChange={(e) => setDownForm({ ...downForm, standName: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2 bg-white font-bold"
                  >
                    <option value="عام / الخط بالكامل">عام / الخط بالكامل</option>
                    {stands.map((s) => (
                      <option key={s.id} value={s.name}>
                        {s.name}
                      </option>
                    ))}
                    <option value="المقص الطائر / اللوابر">المقص الطائر / اللوابر</option>
                    <option value="الأبرون وسرير التبريد">الأبرون وسرير التبريد</option>
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="font-bold text-slate-600 block mb-1">مدة التوقف (بالدقائق):</label>
                  <input
                    type="number"
                    placeholder="مثلاً: 20 دقيقة"
                    value={downForm.durationMins}
                    onChange={(e) => setDownForm({ ...downForm, durationMins: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2 font-mono font-bold bg-white"
                  />
                </div>
                <div className="col-span-2">
                  <label className="font-bold text-slate-600 block mb-1">سبب التوقف / وصف العطل:</label>
                  <input
                    type="text"
                    placeholder="مثال: فصل درايف ستاند 4 Overcurrent أو كعبلة في دليل الدخول..."
                    value={downForm.reason}
                    onChange={(e) => setDownForm({ ...downForm, reason: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2 bg-white"
                  />
                </div>
                <div className="col-span-2">
                  <label className="font-bold text-slate-600 block mb-1">الإجراء المتخذ والحل:</label>
                  <input
                    type="text"
                    placeholder="مثال: تغيير دليل الدخول وضبط السرعة..."
                    value={downForm.actionTaken}
                    onChange={(e) => setDownForm({ ...downForm, actionTaken: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2 bg-white"
                  />
                </div>
              </div>
              <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-lg text-xs shadow">
                حفظ التوقف في سجل الوردية
              </button>

              {/* ملاحظات تسليم الوردية */}
              <div className="pt-3 border-t border-slate-200 space-y-2">
                <label className="font-black text-xs text-slate-800 block">
                  تقرير وملاحظات تسليم الوردية (Shift Handover Note):
                </label>
                <textarea
                  rows="2"
                  value={handoverText}
                  onChange={(e) => setHandoverText(e.target.value)}
                  placeholder="اكتب ملاحظات تسليم الوردية للوردية التالية..."
                  className="w-full border border-slate-300 rounded-lg p-2 text-xs bg-white resize-none"
                />
                <button
                  type="button"
                  onClick={handleAddHandoverNote}
                  className="w-full bg-slate-800 hover:bg-slate-900 text-white font-bold py-2 rounded-lg text-xs"
                >
                  حفظ ملاحظة تسليم الوردية
                </button>
              </div>
            </form>

            {/* قائمة التوقفات والملاحظات المسجلة */}
            <div className="lg:col-span-7 space-y-4">
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-2">
                <h3 className="font-black text-xs text-slate-800">سجل أعطال وتوقفات الورديات ({downtimesList.length})</h3>
                {downtimesList.length === 0 ? (
                  <p className="text-center py-6 text-xs text-slate-400 font-bold">لا توجد توقفات مسجلة حتى الآن.</p>
                ) : (
                  <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
                    {downtimesList.map((d) => (
                      <div key={d.id} className="bg-white border border-slate-200 rounded-xl p-3 shadow-sm flex flex-col gap-1.5 text-xs">
                        <div className="flex justify-between items-center border-b border-slate-100 pb-1.5">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="bg-red-100 text-red-800 font-black px-2 py-0.5 rounded">{d.durationMins} دقيقة</span>
                            <span className="bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded">{d.category}</span>
                            <span className="font-black text-slate-800">{d.standName}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-slate-500 font-mono">
                              {d.date} | {d.shift} ({d.time})
                            </span>
                            {isManagerLike && (
                              <button onClick={() => handleDeleteDowntime(d.id)} className="text-red-500 hover:text-red-700">
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </div>
                        <p className="font-bold text-slate-800">السبب: {d.reason}</p>
                        {d.actionTaken && <p className="text-emerald-700 font-bold text-[11px]">الإجراء: {d.actionTaken}</p>}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {handoverNotesList.length > 0 && (
                <div className="bg-amber-50/60 border border-amber-200 rounded-xl p-3 space-y-2">
                  <h3 className="font-black text-xs text-amber-900 flex items-center gap-1.5">
                    <FileSignature className="w-4 h-4" /> ملاحظات تسليم الورديات
                  </h3>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {handoverNotesList.map((h) => (
                      <div key={h.id} className="bg-white border border-amber-200 rounded-lg p-2.5 text-xs">
                        <div className="flex justify-between text-[10px] text-slate-500 font-bold mb-1">
                          <span>
                            {h.date} — {h.shift} (بواسطة: {h.by})
                          </span>
                          <span>{h.time}</span>
                        </div>
                        <p className="text-slate-800 font-bold">{h.text}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ===== 3. صفحة سجل المواتير والدرايفات ===== */}
      {activeTab === 'motors' && (
        <div className="flex-1 bg-white rounded-lg shadow border border-slate-300 p-3 sm:p-4 overflow-y-auto flex flex-col gap-4">
          <div className="flex justify-between items-center border-b border-slate-200 pb-2 flex-wrap gap-2">
            <h2 className="font-black text-sm sm:text-base text-slate-800 flex items-center gap-2">
              <Cpu className="w-5 h-5 text-blue-600" /> سجل المواتير والدرايفات والجيربوكس للقوائم (1 إلى {stands.length})
            </h2>
            {exportButtons}
          </div>

          <form
            onSubmit={handleAddMotor}
            className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5 items-end text-xs"
          >
            <div>
              <label className="font-bold text-slate-700 block mb-1">الستاند:</label>
              <select
                value={newMotor.stand}
                onChange={(e) => setNewMotor({ ...newMotor, stand: e.target.value })}
                className="w-full border border-slate-300 rounded-lg p-2 bg-white font-bold"
              >
                {stands.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">كود / سيريال الموتور:</label>
              <input
                type="text"
                placeholder="M-101"
                value={newMotor.code}
                onChange={(e) => setNewMotor({ ...newMotor, code: e.target.value })}
                className="w-full border border-slate-300 rounded-lg p-2 bg-white font-mono"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">نوع الدرايف:</label>
              <input
                type="text"
                placeholder="Siemens / Parker"
                value={newMotor.brand}
                onChange={(e) => setNewMotor({ ...newMotor, brand: e.target.value })}
                className="w-full border border-slate-300 rounded-lg p-2 bg-white"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">القدرة (kW):</label>
              <input
                type="number"
                placeholder="600"
                value={newMotor.kw}
                onChange={(e) => setNewMotor({ ...newMotor, kw: e.target.value })}
                className="w-full border border-slate-300 rounded-lg p-2 bg-white font-mono"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">السرعة (RPM):</label>
              <input
                type="number"
                placeholder="1500"
                value={newMotor.rpm}
                onChange={(e) => setNewMotor({ ...newMotor, rpm: e.target.value })}
                className="w-full border border-slate-300 rounded-lg p-2 bg-white font-mono"
              />
            </div>
            <div>
              <label className="font-bold text-slate-700 block mb-1">الأمبير / الجيربوكس:</label>
              <input
                type="text"
                placeholder="950A / i=3.4"
                value={newMotor.gearRatio}
                onChange={(e) => setNewMotor({ ...newMotor, gearRatio: e.target.value })}
                className="w-full border border-slate-300 rounded-lg p-2 bg-white font-mono"
              />
            </div>
            <button type="submit" className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-3 rounded-lg shadow">
              + تسجيل الموتور
            </button>
          </form>

          <div className="border border-slate-200 rounded-xl overflow-x-auto">
            <table className="w-full text-right text-xs min-w-[600px]">
              <thead className="bg-slate-900 text-white">
                <tr>
                  <th className="p-3">الستاند</th>
                  <th className="p-3">كود الموتور</th>
                  <th className="p-3">نوع الدرايف</th>
                  <th className="p-3">القدرة (kW)</th>
                  <th className="p-3">Max RPM</th>
                  <th className="p-3">الأمبير / الجيربوكس</th>
                  <th className="p-3">تاريخ التسجيل</th>
                  {isManagerLike && <th className="p-3">حذف</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-mono">
                {motorsList.map((m) => (
                  <tr key={m.id} className="hover:bg-slate-50">
                    <td className="p-3 font-sans font-black text-slate-900">ستاند {m.stand}</td>
                    <td className="p-3 font-bold text-blue-700">{m.code}</td>
                    <td className="p-3 font-sans">{m.brand}</td>
                    <td className="p-3 font-bold text-emerald-700">{m.kw} kW</td>
                    <td className="p-3 font-bold text-amber-700">{m.rpm} RPM</td>
                    <td className="p-3">{m.gearRatio || '-'}</td>
                    <td className="p-3 text-slate-500">{m.dateAdded}</td>
                    {isManagerLike && (
                      <td className="p-3">
                        <button onClick={() => handleDeleteMotor(m.id)} className="text-red-500 hover:text-red-700">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
                {motorsList.length === 0 && (
                  <tr>
                    <td colSpan="8" className="p-8 text-center font-sans font-bold text-slate-400">
                      لم يتم تسجيل أي مواتير بعد. يمكنك إضافة مواتير جميع الستاندات من النموذج أعلاه.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ===== 4. الإحصائيات ===== */}
      {activeTab === 'analytics' && (
        <div className="flex-1 bg-white rounded-lg shadow border border-slate-300 p-3 overflow-y-auto flex flex-col gap-4">
          <div className="flex items-center justify-between border-b pb-2 flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-blue-600" />
              <h2 className="font-black text-sm text-slate-800">لوحة الإحصائيات وتحليل الإنتاجية</h2>
            </div>
            {exportButtons}
          </div>
          {aggregatedLogs.length === 0 && passChanges.length === 0 ? (
            <div className="text-center py-12 text-slate-400 flex flex-col items-center gap-2">
              <BarChart3 className="w-10 h-10 opacity-30" />
              <p className="text-sm font-bold">لا توجد بيانات إنتاجية مسجلة بعد.</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-blue-50 p-2.5 rounded-lg border border-blue-200 text-center">
                  <p className="text-[10px] font-bold text-blue-800">إجمالي الأطنان</p>
                  <p className="font-mono font-black text-lg sm:text-xl text-blue-900">
                    {aggregatedLogs.reduce((a, c) => a + c.tons, 0).toFixed(1)} <span className="text-xs font-normal">طن</span>
                  </p>
                </div>
                <div className="bg-green-50 p-2.5 rounded-lg border border-green-200 text-center">
                  <p className="text-[10px] font-bold text-green-800">إجمالي البليت</p>
                  <p className="font-mono font-black text-lg sm:text-xl text-green-900">
                    {aggregatedLogs.reduce((a, c) => a + c.billets, 0)} <span className="text-xs font-normal">بليت</span>
                  </p>
                </div>
                <div className="bg-purple-50 p-2.5 rounded-lg border border-purple-200 text-center">
                  <p className="text-[10px] font-bold text-purple-800">الورديات المسجلة</p>
                  <p className="font-mono font-black text-lg sm:text-xl text-purple-900">{aggregatedLogs.length}</p>
                </div>
              </div>

              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex flex-col gap-2">
                <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
                  <RotateCcw className="w-4 h-4 text-orange-500" />
                  <h3 className="font-bold text-xs text-slate-700">سجل تغيير الممرات والدرافيل</h3>
                </div>
                {passChanges.length === 0 ? (
                  <p className="text-[10px] text-slate-500 text-center py-4 font-bold">لم يتم تسجيل أي تغيير بعد.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 max-h-60 overflow-y-auto pr-1">
                    {passChanges.map((c) => (
                      <div key={c.id} className="bg-white p-2.5 rounded-lg border border-slate-200 shadow-sm flex flex-col gap-1.5">
                        <div className="flex justify-between items-center border-b border-slate-100 pb-1">
                          <span className="font-bold text-xs text-slate-800">{c.standName || `ستاند ${c.standId}`}</span>
                          <span className="text-[10px] font-black text-orange-700 bg-orange-50 px-2 py-0.5 rounded border border-orange-100">
                            {Number(c.tons).toFixed(1)} طن
                          </span>
                        </div>
                        <div className="flex justify-between text-[9px] text-slate-600 font-bold">
                          <span>{c.productSize} مم</span>
                          <span className="text-blue-700">{c.kind === 'newRoll' ? 'درفيل جديد' : `ممر ${c.fromPass} ← ${c.toPass}`}</span>
                        </div>
                        <p className="text-[10px] text-slate-700 bg-slate-50 p-1.5 rounded border border-slate-100">
                          <span className="font-bold text-blue-600">ملاحظات:</span> {c.notes}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* ===== 5. الأرشيف ===== */}
      {activeTab === 'archive' && (
        <div className="flex-1 bg-slate-100 rounded-lg shadow border border-slate-300 p-2 overflow-y-auto">
          <div className="flex justify-end mb-2">{exportButtons}</div>
          {sortedDates.length === 0 ? (
            <div className="text-center py-10 text-slate-400 flex flex-col items-center gap-2">
              <List className="w-8 h-8 opacity-50" />
              <p className="text-sm font-bold">لا يوجد إنتاج بعد.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2 pb-4">
              {sortedDates.map((date) => {
                const day = groupedArchive[date];
                return (
                  <div key={date} className="bg-white border border-slate-200 rounded-lg shadow-sm flex flex-col overflow-hidden">
                    <div className="bg-slate-800 text-white p-2 flex justify-between items-center">
                      <div className="flex items-center gap-1.5">
                        <CalendarDays className="w-3.5 h-3.5 text-blue-400" />
                        <span className="font-bold text-xs">يوم {day.dayName}</span>
                      </div>
                      <span className="text-[10px] font-mono text-slate-300 bg-slate-900 px-1.5 py-0.5 rounded">{date}</span>
                    </div>
                    <div className="bg-blue-50 p-2 flex justify-between items-center border-b border-blue-100 text-[10px] font-bold">
                      <span className="text-blue-900">إجمالي اليوم:</span>
                      <div className="flex gap-1.5">
                        <span className="bg-white text-blue-800 px-2 py-0.5 rounded border border-blue-200">{day.totalBillets} بليت</span>
                        <span className="bg-green-500 text-white px-2 py-0.5 rounded">{day.totalTons.toFixed(1)} طن</span>
                      </div>
                    </div>
                    <div className="p-1.5 flex-1 flex flex-col gap-1.5 bg-white">
                      {day.shiftsList.map((log, i) => (
                        <div key={i} className="flex justify-between items-center p-1.5 bg-slate-50 rounded border border-slate-100 text-[10px]">
                          <div>
                            <span className="font-bold text-slate-800 block">
                              {log.shift} (مقاس {log.productSize || '16'})
                            </span>
                            <span className="text-[8px] text-slate-400 font-mono">{log.time}</span>
                          </div>
                          <div className="font-mono bg-white px-2 py-0.5 rounded border border-slate-200">
                            <span className="font-bold text-slate-700">{log.billets} ب</span>
                            <span className="mx-1 text-slate-300">|</span>
                            <span className="font-bold text-green-600">{log.tons.toFixed(1)} ط</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ===== 6. لوحة الأدمن ===== */}
      {activeTab === 'admin' && isSuperAdmin && (
        <div className="flex-1 bg-white rounded-lg shadow border border-slate-300 p-4 overflow-y-auto flex flex-col gap-4">
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 flex flex-col gap-3">
            <h3 className="font-bold text-sm text-slate-800 flex items-center gap-1.5">
              <Key className="w-4 h-4 text-blue-600" /> إدارة أكواد الدخول للمصنع ({factoryName})
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {[
                ['كود فني الإنتاج', 'techCode', 'text-blue-700'],
                ['كود مدير المصنع', 'managerCode', 'text-emerald-700'],
                ['كود الأدمن (Admin)', 'adminCode', 'text-amber-700']
              ].map(([label, key, cls]) => (
                <div key={key} className="bg-white p-3 rounded-lg border border-slate-200">
                  <label className={`text-xs font-bold block mb-1 ${cls}`}>{label}:</label>
                  <input
                    type="text"
                    value={adminState[key]}
                    onChange={(e) => setAdminState({ ...adminState, [key]: e.target.value })}
                    className="w-full p-2 border border-slate-300 rounded font-mono text-sm font-bold text-center"
                  />
                </div>
              ))}
            </div>
            <div className="flex justify-end">
              <button
                onClick={() => handleSaveAdminSettings(adminState)}
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-2 rounded-lg text-xs flex items-center gap-1.5 shadow"
              >
                <Save className="w-4 h-4" /> حفظ الأكواد والإعدادات
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}