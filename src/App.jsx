import React, { useState, useEffect, useRef } from 'react';
import {
  UserCog, Edit3, TrendingUp, AlertTriangle, CheckCircle, RotateCcw,
  Save, Power, Settings2, Archive, CalendarDays, List, BarChart3, RefreshCw,
  Sliders, Trash2, Clock, Settings, X, UploadCloud, History,
  ShieldAlert, Key, Eye, Layers, Wrench, ArrowLeftRight,
  FileSpreadsheet, FileText, Inbox, Check, XCircle, Hourglass,
  Calculator, Zap, Gauge, Circle, Maximize2, DivideSquare, FileSignature, Cpu,
  MessageCircle, PlusCircle, ThumbsUp, Users
} from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, setDoc, onSnapshot, collection, addDoc, serverTimestamp, query, orderBy } from 'firebase/firestore';

/* ======================================================
  1. إعدادات قاعدة البيانات (Firebase)
  ====================================================== */
const firebaseConfig = {
  apiKey: "AIzaSyDrSPpzOlaC1CYRURzLWeI9crZwF5jV_QY",
  authDomain: "rolling-mill-tracker.firebaseapp.com",
  databaseURL: "https://rolling-mill-tracker-default-rtdb.firebaseio.com",
  projectId: "rolling-mill-tracker",
  storageBucket: "rolling-mill-tracker.firebasestorage.app",
  messagingSenderId: "528405881772",
  appId: "1:528405881772:web:30498fd387894331fb9009",
  measurementId: "G-3XR8MT7T3S"
};

let app, auth, db;
try {
  if (Object.keys(firebaseConfig).length > 0) {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
  }
} catch (error) { console.error("Firebase init error:", error); }

/* ======================================================
  2. ثوابت وبيانات المصنع والمجتمع
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
  { type: '', rollCode: '', diameter: '', hardness: '', totalPasses: 24, maxLimit: 1000 },
  { type: '', rollCode: '', diameter: '', hardness: '', totalPasses: 24, maxLimit: 1000 }
].map((c, i) => ({ ...c, id: String(i + 1), name: `ستاند ${i + 1}` }));

const SHIFTS_NORMAL = ['الوردية الأولى', 'الوردية الثانية', 'الوردية الثالثة'];
const SHIFTS_FRIDAY = ['الوردية الأولى (12 ساعة)', 'الوردية الثانية (12 ساعة)'];
const shiftsFor = (isFri) => (isFri ? SHIFTS_FRIDAY : SHIFTS_NORMAL);

const createPassesArray = (count, activePassNum = 1, initialTons = 0) =>
  Array.from({ length: count }, (_, idx) => {
    const pNum = idx + 1;
    return { passNumber: pNum, status: pNum === activePassNum ? 'active' : 'unused', tons: pNum === activePassNum ? initialTons : 0, order: pNum === activePassNum ? 1 : null };
  });

const buildStand = (cfg) => {
  const todayGB = new Date().toLocaleDateString('en-GB');
  return { ...cfg, entryDate: todayGB, activePass: 1, passes: createPassesArray(cfg.totalPasses, 1, 0), isActive: true, accumulatedTons: 0, lastResetDate: todayGB };
};
const buildInitialStands = () => DEFAULT_STANDS_CONFIG.map(buildStand);

const normalizeStand = (stand, cfg) => {
  const totalPasses = stand.totalPasses || cfg.totalPasses || 10;
  const activePass = stand.activePass || 1;
  const currentTons = stand.accumulatedTons || 0;
  let passes = Array.isArray(stand.passes) && stand.passes.length === totalPasses ? stand.passes : createPassesArray(totalPasses, activePass, currentTons);
  passes = passes.map(p => p.passNumber === activePass ? { ...p, status: 'active', tons: currentTons, order: p.order || 1 } : p);
  return { ...stand, ...cfg, entryDate: stand.entryDate || stand.lastResetDate || new Date().toLocaleDateString('en-GB'), totalPasses, activePass, passes };
};

const normalizeList = (raw) => DEFAULT_STANDS_CONFIG.map(cfg => {
  const found = (raw || []).find(s => String(s.id) === cfg.id);
  return found ? normalizeStand(found, cfg) : buildStand(cfg);
});

// --- دوال مساعدة للتاريخ والوقت ---
const formatDateToISO = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const formatDateToGB = (iso) => { if (!iso) return ''; const [y, m, d] = iso.split('-'); return `${d}/${m}/${y}`; };
const convertGBToISO = (gb) => {
  if (!gb || !gb.includes('/')) return formatDateToISO(new Date());
  const p = gb.split('/'); return `${p[2]}-${p[1].padStart(2, '0')}-${p[0].padStart(2, '0')}`;
};

const LiveClock = () => {
  const [time, setTime] = useState(new Date());
  useEffect(() => { const t = setInterval(() => setTime(new Date()), 1000); return () => clearInterval(t); }, []);
  return (
    <div className="flex bg-slate-800 border border-slate-700 rounded px-2 py-0.5 items-center gap-1.5 shadow-inner">
      <Clock className="w-3 h-3 text-blue-400" />
      <div className="flex flex-col items-center leading-none mt-0.5">
        <span className="text-[10px] font-mono font-bold text-slate-100" dir="ltr">{time.toLocaleTimeString('en-US', { hour12: true, hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
        <span className="text-[7px] text-slate-400 mt-0.5">{time.toLocaleDateString('ar-EG', { weekday: 'short', day: 'numeric', month: 'short' })}</span>
      </div>
    </div>
  );
};

const Overlay = ({ z = 50, children }) => (
  <div className={`fixed inset-0 bg-black/70 flex items-center justify-center p-3 backdrop-blur-sm`} style={{ zIndex: z }}>{children}</div>
);

const getStandStatus = (tons, limit) => {
  const pct = Math.max(0, (tons / limit) * 100);
  if (pct >= 100) return { color: 'danger', bg: 'bg-red-100', border: 'border-red-500', bar: 'bg-red-600', text: 'text-red-700', hex: '#dc2626' };
  if (pct >= 80) return { color: 'warning', bg: 'bg-yellow-100', border: 'border-yellow-400', bar: 'bg-yellow-500', text: 'text-yellow-700', hex: '#eab308' };
  return { color: 'good', bg: 'bg-slate-50', border: 'border-slate-300', bar: 'bg-green-500', text: 'text-slate-700', hex: '#22c55e' };
};

/* ======================================================
  3. بيانات المجتمع (الابتدائية والأعطال)
  ====================================================== */
const INITIAL_POSTS = [
  { id: 'p1', author: 'م. بسام وليد', role: 'مشغل أول غرفة تحكم رئيسية', badge: 'Admin', time: 'منذ ساعتين', category: 'فنيات الكنترول', title: 'إزاي تعرف فيه شد (Tension) ولا انضغاط (Loop) بين قائمين من شاشة الأمبير؟', content: 'لو فرضنا إن أمبير قائم (2) كان 1500 وأول ما المعدن دخل في قائم (3) الأمبير نزل فجأة لـ 1200.. ده معناه وجود شد ولازم نهدي سرعة قائم 3. العكس لو الأمبير زاد فده معناه انضغاط!', likes: 28, liked: false, comments: [] }
];
const INITIAL_FAULTS = [
  { id: 'f1', code: 'LAPS / قشرة', brand: 'عيوب درفلة', title: 'ظهور شرخ ظاهري بطول السيخ', cause: 'حدوث امتلاء زائد (Overfill) في أحد الممرات مع دخول المعدن للممر التالي بزاوية غير مضبوطة.', solution: 'افحص خلوص الممر السابق، راجع سنترية دليل الدخول.' },
  { id: 'f2', code: 'FINS / شنب', brand: 'عيوب درفلة', title: 'ظهور نتوء طولي', cause: 'غلق جاب القائم النهائي زيادة عن اللزوم أو زيادة معدن من القوائم السابقة.', solution: 'افحص وزن المتر الطولي وافتح جاب القائم النهائي.' },
  { id: 'f4', code: 'F0001 / Overcurrent', brand: 'Siemens Drives', title: 'فصل الإنفرتر تيار زائد', cause: 'دخول بيليت بارد، نسبة تخفيض عالية جداً، أو زاوية عض أكبر من الحد المسموح.', solution: 'راجع حرارة البيليت، وفعل الـ Over Speed.' }
];

/* ======================================================
  4. الحاسبات العامة (بدون تسجيل دخول)
  ====================================================== */
const PUBLIC_CALCULATORS = [
  { id: 'c1', title: 'السرعة الخطية', icon: Activity, group: 'درفلة', inputs: [{ k: 'd', l: 'قطر الدرفيل (mm)' }, { k: 'n', l: 'لفات الدرفيل (RPM)' }], calc: v => ({ 'السرعة (m/s)': ((Math.PI * (v.d||0) * (v.n||0)) / 60000).toFixed(2) }) },
  { id: 'c2', title: 'لفات الدرفيل', icon: RotateCcw, group: 'درفلة', inputs: [{ k: 'v', l: 'السرعة (m/s)' }, { k: 'd', l: 'قطر الدرفيل (mm)' }], calc: v => ({ 'لفات الدرفيل (RPM)': ((v.v||0) * 60000 / (Math.PI * (v.d||1))).toFixed(1) }) },
  { id: 'c3', title: 'لفات الموتور', icon: Gauge, group: 'درفلة', inputs: [{ k: 'nr', l: 'لفات الدرفيل (RPM)' }, { k: 'gr', l: 'نسبة الجيربوكس' }], calc: v => ({ 'لفات الموتور (RPM)': ((v.nr||0) * (v.gr||1)).toFixed(1) }) },
  { id: 'c4', title: 'نسبة التخفيض', icon: DivideSquare, group: 'درفلة', inputs: [{ k: 'a1', l: 'مساحة الدخول (mm²)' }, { k: 'a2', l: 'مساحة الخروج (mm²)' }], calc: v => ({ 'نسبة التخفيض (%)': (((v.a1||0) - (v.a2||0)) / (v.a1||1) * 100).toFixed(1) }) },
  { id: 'c5', title: 'قانون ثبات الحجم', icon: Layers, group: 'درفلة', inputs: [{ k: 'a1', l: 'مساحة 1 (mm²)' }, { k: 'v1', l: 'سرعة 1 (m/s)' }, { k: 'a2', l: 'مساحة 2 (mm²)' }], calc: v => ({ 'سرعة الخروج V2': (((v.a1||0) * (v.v1||0)) / (v.a2||1)).toFixed(2) }) },
  { id: 'c6', title: 'نسبة الاستطالة', icon: Maximize2, group: 'درفلة', inputs: [{ k: 'v1', l: 'سرعة الدخول (m/s)' }, { k: 'v2', l: 'سرعة الخروج (m/s)' }], calc: v => ({ 'الاستطالة (λ)': ((v.v2||0) / (v.v1||1)).toFixed(2) }) },
  { id: 'c7', title: 'مساحة المقطع', icon: Circle, group: 'درفلة', inputs: [{ k: 'd', l: 'القطر (mm)' }], calc: v => ({ 'المساحة (mm²)': (Math.PI * Math.pow((v.d||0)/2, 2)).toFixed(2) }) },
  { id: 'c8', title: 'سرعة القائم السابق', icon: ArrowLeftRight, group: 'درفلة', inputs: [{ k: 'a2', l: 'مساحة الحالي (mm²)' }, { k: 'v2', l: 'سرعة الحالي (m/s)' }, { k: 'a1', l: 'مساحة السابق (mm²)' }], calc: v => ({ 'السرعة السابقة': (((v.a2||0) * (v.v2||0)) / (v.a1||1)).toFixed(2) }) },
  { id: 'c9', title: 'عدد الأسياخ من البليت', icon: List, group: 'درفلة', inputs: [{ k: 'wb', l: 'وزن البليت (كجم)' }, { k: 'wm', l: 'وزن المتر الطولي (كجم/م)' }, { k: 'l', l: 'طول السيخ (متر)' }], calc: v => { const bars = (v.wb||0) / ((v.wm||1) * (v.l||1)); return { 'عدد الأسياخ': Math.floor(bars), 'طول الهالك (متر)': ((bars % 1) * (v.l||1)).toFixed(1) }; } },
  { id: 'e1', title: 'من وات لكيلووات', icon: Zap, group: 'كهرباء', inputs: [{ k: 'w', l: 'القدرة (Watt)' }], calc: v => ({ 'الكيلووات (kW)': ((v.w||0) / 1000).toFixed(2) }) },
  { id: 'e2', title: 'من حصان لكيلووات', icon: Zap, group: 'كهرباء', inputs: [{ k: 'hp', l: 'القدرة (HP)' }], calc: v => ({ 'الكيلووات (kW)': ((v.hp||0) * 0.7457).toFixed(2) }) },
  { id: 'e3', title: 'حساب أمبير موتور', icon: Cpu, group: 'كهرباء', inputs: [{ k: 'kw', l: 'القدرة (kW)' }, { k: 'v', l: 'الجهد (Volt) 380' }], calc: v => ({ 'التيار (Ampere)': ((v.kw||0) * 1000 / (Math.sqrt(3) * (v.v||1) * 0.85)).toFixed(1) }) }
];

const PublicCalculatorsView = ({ onBack }) => {
  const [activeCalc, setActiveCalc] = useState(null);
  const [vals, setVals] = useState({});

  if (activeCalc) {
    const c = PUBLIC_CALCULATORS.find(x => x.id === activeCalc);
    const res = c.calc(vals);
    return (
      <div className="p-4 bg-slate-950 min-h-screen text-white" dir="rtl">
        <button onClick={() => { setActiveCalc(null); setVals({}); }} className="mb-4 bg-slate-800 text-slate-300 px-4 py-2 rounded-lg text-sm font-bold hover:bg-slate-700">← العودة للقائمة</button>
        <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 max-w-lg mx-auto shadow-2xl">
          <div className="flex items-center gap-3 mb-6 border-b border-slate-800 pb-4">
            <c.icon className="w-8 h-8 text-blue-500" />
            <h2 className="text-xl font-black">{c.title}</h2>
          </div>
          <div className="space-y-4">
            {c.inputs.map(inp => (
              <div key={inp.k}>
                <label className="block text-sm text-slate-400 mb-1">{inp.l}</label>
                <input type="number" step="any" value={vals[inp.k] || ''} onChange={e => setVals({...vals, [inp.k]: Number(e.target.value)})}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white font-mono outline-none focus:border-blue-500" />
              </div>
            ))}
          </div>
          <div className="mt-6 bg-slate-950 p-4 rounded-2xl border border-blue-500/30">
            {Object.entries(res).map(([k, v]) => (
              <div key={k} className="flex justify-between items-center text-lg">
                <span className="text-slate-300 font-bold">{k}</span>
                <span className="text-blue-400 font-black font-mono">{v}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 bg-slate-950 min-h-screen text-white" dir="rtl">
      <div className="flex justify-between items-center mb-6 max-w-5xl mx-auto">
        <h1 className="text-2xl font-black text-white flex items-center gap-2"><Calculator className="text-blue-500" /> حاسبات هندسية وكهربائية</h1>
        <button onClick={onBack} className="text-red-400 hover:text-red-300 font-bold text-sm bg-red-500/10 px-4 py-2 rounded-lg">خروج</button>
      </div>
      <div className="max-w-5xl mx-auto space-y-8">
        {['درفلة', 'كهرباء'].map(group => (
          <div key={group}>
            <h3 className="text-lg font-bold text-slate-400 mb-4 border-b border-slate-800 pb-2">قسم الـ {group}</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {PUBLIC_CALCULATORS.filter(c => c.group === group).map(c => (
                <button key={c.id} onClick={() => setActiveCalc(c.id)} className="bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-blue-500 p-5 rounded-3xl flex flex-col items-center gap-3 transition-all text-center group">
                  <div className="bg-slate-950 p-4 rounded-2xl group-hover:scale-110 transition-transform"><c.icon className="w-8 h-8 text-blue-400" /></div>
                  <span className="text-sm font-bold text-slate-200">{c.title}</span>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

/* ======================================================
  5. مجتمع صناع الحديد (Community View)
  ====================================================== */
const CommunityView = ({ onBack }) => {
  const [subMode, setSubMode] = useState('feed');
  const [posts, setPosts] = useState(INITIAL_POSTS);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');

  const handlePost = () => {
    if (!newTitle.trim() || !newContent.trim()) return;
    const p = { id: Date.now().toString(), author: 'عضو مجتمع', role: 'فني / مهندس', badge: 'جديد', time: 'الآن', category: 'مناقشة', title: newTitle, content: newContent, likes: 0, liked: false, comments: [] };
    setPosts([p, ...posts]); setNewTitle(''); setNewContent('');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 p-4" dir="rtl">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-black text-white flex items-center gap-2"><Users className="text-blue-500" /> مجتمع صناع الحديد وموسوعة الأعطال</h1>
          <button onClick={onBack} className="text-red-400 hover:text-red-300 font-bold text-sm bg-red-500/10 px-4 py-2 rounded-lg">خروج</button>
        </div>
        
        <div className="grid grid-cols-2 gap-2 max-w-sm">
          <button onClick={() => setSubMode('feed')} className={`py-3 rounded-2xl font-bold flex justify-center gap-2 ${subMode === 'feed' ? 'bg-blue-600 text-white' : 'bg-slate-900 text-slate-400'}`}><MessageCircle className="w-5 h-5"/> المنشورات</button>
          <button onClick={() => setSubMode('faults')} className={`py-3 rounded-2xl font-bold flex justify-center gap-2 ${subMode === 'faults' ? 'bg-amber-500 text-slate-950' : 'bg-slate-900 text-slate-400'}`}><Wrench className="w-5 h-5"/> موسوعة العيوب</button>
        </div>

        {subMode === 'feed' ? (
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            <div className="md:col-span-4 bg-slate-900 border border-slate-800 p-5 rounded-3xl space-y-4 self-start">
              <h3 className="font-bold text-white flex gap-2"><PlusCircle className="text-blue-400"/> نشر استفسار فني</h3>
              <input type="text" placeholder="عنوان المنشور..." value={newTitle} onChange={e=>setNewTitle(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-sm text-white" />
              <textarea rows="4" placeholder="التفاصيل..." value={newContent} onChange={e=>setNewContent(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-sm text-white resize-none" />
              <button onClick={handlePost} className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700">نشر</button>
            </div>
            <div className="md:col-span-8 space-y-4">
              {posts.map(p => (
                <div key={p.id} className="bg-slate-900 border border-slate-800 p-6 rounded-3xl">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h4 className="font-black text-white text-lg">{p.author} <span className="text-xs bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded ml-2">{p.badge}</span></h4>
                      <p className="text-xs text-slate-400">{p.role} • {p.time}</p>
                    </div>
                  </div>
                  <h3 className="text-lg font-bold text-blue-300 mb-2">{p.title}</h3>
                  <p className="text-sm text-slate-300 leading-relaxed mb-4">{p.content}</p>
                  <div className="flex gap-4 border-t border-slate-800 pt-4">
                    <button className="flex items-center gap-1 text-xs font-bold text-slate-400 hover:text-blue-400"><ThumbsUp className="w-4 h-4"/> إعجاب ({p.likes})</button>
                    <span className="flex items-center gap-1 text-xs font-bold text-slate-400"><MessageCircle className="w-4 h-4"/> {p.comments.length} تعليقات</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {INITIAL_FAULTS.map(f => (
              <div key={f.id} className="bg-slate-900 border border-slate-800 p-6 rounded-3xl">
                <span className="px-3 py-1 bg-red-500/20 text-red-400 border border-red-500/30 rounded-xl font-mono font-bold text-xs mb-3 inline-block">{f.code}</span>
                <h3 className="text-lg font-bold text-white mb-2">{f.title}</h3>
                <p className="text-sm text-slate-400 mb-3"><strong className="text-amber-400">السبب:</strong> {f.cause}</p>
                <div className="bg-slate-950 p-3 rounded-xl border border-emerald-900/40 text-sm text-emerald-400"><strong className="text-emerald-500">الحل:</strong> {f.solution}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

/* ======================================================
  6. المكون الأساسي (App) - بوابة المصانع والحالة الشاملة
  ====================================================== */
export default function App() {
  const [appMode, setAppMode] = useState('select'); // 'select' | 'public' | 'community' | 'factory'

  // --- حالات بوابة المصنع ---
  const [currentUser, setCurrentUser] = useState('none');
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [userAuth, setUserAuth] = useState(null);
  const appId = 'al-gioshy-steel-rolls';

  const isManagerLike = currentUser === 'manager' || currentUser === 'admin';
  const roleLabel = currentUser === 'tech' ? 'فني' : currentUser === 'manager' ? 'مدير' : 'أدمن';

  const [stands, setStands] = useState(buildInitialStands);
  const [shiftBillets, setShiftBillets] = useState('');
  const [productionArchive, setProductionArchive] = useState([]);
  const [passChanges, setPassChanges] = useState([]);
  const [pendingList, setPendingList] = useState([]);
  const [reportsList, setReportsList] = useState([]);
  const [motorsList, setMotorsList] = useState([]);
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  const [billetWeight, setBilletWeight] = useState(0.75);
  const [selectedProductSize, setSelectedProductSize] = useState('16');
  const [loginPrompt, setLoginPrompt] = useState({ isOpen: false, role: '', codeInput: '', error: '' });
  const [adminState, setAdminState] = useState({ isMaintenance: false, techCode: '1111', managerCode: '2222', adminCode: '9999' });

  // حالات الإضافات وتغيير الممرات
  const [newReport, setNewReport] = useState('');
  const [newMotor, setNewMotor] = useState({ stand: '1', code: '', kw: '', rpm: '' });
  const [currentProdDate, setCurrentProdDate] = useState(new Date());
  const [selectedShift, setSelectedShift] = useState(SHIFTS_NORMAL[0]);
  const [rollModal, setRollModal] = useState({ isOpen: false, standIndex: null });
  const [resetModal, setResetModal] = useState({ isOpen: false, standIndex: null });
  const [resetTargetPass, setResetTargetPass] = useState(null);

  useEffect(() => {
    if (appMode !== 'factory') return;
    if (!auth) { setIsDataLoaded(true); return; }
    signInAnonymously(auth).catch(e => console.error(e));
    const unsub = onAuthStateChanged(auth, setUserAuth);
    return () => unsub();
  }, [appMode]);

  useEffect(() => {
    if (appMode !== 'factory' || !userAuth || !db) return;
    const ref = (name) => doc(db, 'factory', appId, 'data', name);
    const unsubList = [
      onSnapshot(ref('standsState'), snap => { if (snap.exists()) setStands(normalizeList(snap.data().standsList)); setIsDataLoaded(true); }),
      onSnapshot(ref('archiveState'), snap => { if (snap.exists()) setProductionArchive(snap.data().archiveList || []); }),
      onSnapshot(ref('passChangesState'), snap => { if (snap.exists()) setPassChanges(snap.data().passChangesList || []); }),
      onSnapshot(ref('settingsState'), snap => { if (snap.exists()) { const d = snap.data(); if (d.billetWeight) setBilletWeight(d.billetWeight); } }),
      onSnapshot(ref('adminState'), snap => { if (snap.exists()) setAdminState(prev => ({ ...prev, ...snap.data() })); }),
      onSnapshot(ref('reportsState'), snap => { if (snap.exists()) setReportsList(snap.data().reports || []); }),
      onSnapshot(ref('motorsState'), snap => { if (snap.exists()) setMotorsList(snap.data().motors || []); })
    ];
    return () => unsubList.forEach(u => u());
  }, [appMode, userAuth]);

  const save = async (updates) => {
    if (userAuth && db) {
      const ref = (name) => doc(db, 'factory', appId, 'data', name);
      if (updates.stands !== undefined) await setDoc(ref('standsState'), { standsList: updates.stands });
      if (updates.archive !== undefined) await setDoc(ref('archiveState'), { archiveList: updates.archive });
      if (updates.reports !== undefined) await setDoc(ref('reportsState'), { reports: updates.reports });
      if (updates.motors !== undefined) await setDoc(ref('motorsState'), { motors: updates.motors });
      if (updates.weight !== undefined) await setDoc(ref('settingsState'), { billetWeight: updates.weight }, { merge: true });
    } else {
      if (updates.stands) setStands(updates.stands);
      if (updates.archive) setProductionArchive(updates.archive);
      if (updates.reports) setReportsList(updates.reports);
      if (updates.motors) setMotorsList(updates.motors);
    }
  };

  const handleVerifyAccessCode = (e) => {
    e.preventDefault();
    const { role, codeInput } = loginPrompt;
    if (codeInput === adminState.adminCode) { setIsSuperAdmin(true); setCurrentUser('admin'); setLoginPrompt({ isOpen: false }); return; }
    if ((role === 'tech' && codeInput === adminState.techCode) || (role === 'manager' && codeInput === adminState.managerCode)) {
      setCurrentUser(role); setLoginPrompt({ isOpen: false }); return;
    }
    setLoginPrompt(p => ({ ...p, error: 'الكود غير صحيح!' }));
  };

  const commitShift = () => {
    const n = Number(shiftBillets);
    if (n <= 0) return;
    const newTons = n * billetWeight;
    const newStands = stands.map(s => {
      if (!s.isActive) return s;
      const tons = Math.max(0, s.accumulatedTons + newTons);
      return { ...s, accumulatedTons: tons, passes: s.passes.map(p => p.passNumber === s.activePass ? { ...p, status: 'active', tons, order: p.order || 1 } : p) };
    });
    const log = { id: Date.now(), date: currentProdDate.toLocaleDateString('en-GB'), shift: selectedShift, billets: n, tons: newTons, timestamp: Date.now() };
    save({ stands: newStands, archive: [log, ...productionArchive] });
    setShiftBillets('');
    alert('تم تسجيل الوردية بنجاح!');
  };

  const confirmResetStand = () => {
    const idx = resetModal.standIndex;
    if (idx === null) return;
    const st = { ...stands[idx] };
    const prev = st.activePass;
    const target = Number(resetTargetPass);
    st.passes = st.passes.map(p => {
      if (p.passNumber === prev) return { ...p, status: 'used', tons: st.accumulatedTons, order: p.order || 1 };
      if (p.passNumber === target) return { ...p, status: 'active', tons: 0, order: 2 };
      return p;
    });
    st.activePass = target;
    st.accumulatedTons = 0;
    const ns = [...stands]; ns[idx] = st;
    save({ stands: ns });
    setResetModal({ isOpen: false, standIndex: null });
    alert(`تم تغيير الستاند ${st.id} ليعمل على ممر ${target}`);
  };

  // ==================== واجهة اختيار النظام ====================
  if (appMode === 'select') {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden" dir="rtl">
        {/* خلفية جمالية */}
        <div className="absolute top-[-20%] left-[-10%] w-96 h-96 bg-blue-600/20 blur-[120px] rounded-full"></div>
        <div className="absolute bottom-[-20%] right-[-10%] w-96 h-96 bg-emerald-600/20 blur-[120px] rounded-full"></div>
        
        <div className="text-center mb-10 z-10">
          <h1 className="text-4xl md:text-5xl font-black text-white mb-3">Steel<span className="text-blue-500">Portal</span></h1>
          <p className="text-slate-400 font-bold">المنصة الشاملة لمهندسي وفنيي الدرفلة وصناعة الصلب</p>
        </div>

        <div className="max-w-5xl w-full grid grid-cols-1 md:grid-cols-3 gap-6 z-10">
          <div onClick={() => setAppMode('public')} className="bg-slate-900 border border-slate-800 p-8 rounded-3xl text-center flex flex-col items-center hover:border-blue-500 transition-all shadow-2xl cursor-pointer hover:-translate-y-2 group">
            <div className="w-20 h-20 bg-blue-600/20 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform"><Calculator className="w-10 h-10 text-blue-500" /></div>
            <h2 className="text-xl font-black text-white mb-2">حاسبات المهندسين</h2>
            <p className="text-sm text-slate-400 mb-8">أدوات هندسية سريعة لحساب السرعات، الأقطار، الكهرباء، ونسب التخفيض والاستطالة.</p>
            <button className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl group-hover:bg-blue-500">دخول سريع</button>
          </div>

          <div onClick={() => setAppMode('community')} className="bg-slate-900 border border-slate-800 p-8 rounded-3xl text-center flex flex-col items-center hover:border-amber-500 transition-all shadow-2xl cursor-pointer hover:-translate-y-2 group">
            <div className="w-20 h-20 bg-amber-500/20 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform"><Users className="w-10 h-10 text-amber-500" /></div>
            <h2 className="text-xl font-black text-white mb-2">مجتمع وموسوعة الأعطال</h2>
            <p className="text-sm text-slate-400 mb-8">تبادل الخبرات، نشر الاستفسارات الفنية، والبحث في موسوعة أعطال وعيوب الدرفلة.</p>
            <button className="w-full bg-amber-600 text-white font-bold py-3 rounded-xl group-hover:bg-amber-500">تصفح المجتمع</button>
          </div>

          <div onClick={() => setAppMode('factory')} className="bg-slate-900 border border-slate-800 p-8 rounded-3xl text-center flex flex-col items-center hover:border-emerald-500 transition-all shadow-2xl cursor-pointer hover:-translate-y-2 group">
            <div className="w-20 h-20 bg-emerald-600/20 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform"><Settings2 className="w-10 h-10 text-emerald-500" /></div>
            <h2 className="text-xl font-black text-white mb-2">نظام إدارة المصانع</h2>
            <p className="text-sm text-slate-400 mb-8">إدارة كاملة للممرات، الدرافيل، سجل المواتير، التقارير الفنية، وأرشيف الإنتاج (SaaS).</p>
            <button className="w-full bg-emerald-600 text-white font-bold py-3 rounded-xl group-hover:bg-emerald-500">تسجيل الدخول للمصنع</button>
          </div>
        </div>
      </div>
    );
  }

  // ==================== البوابة العامة أو المجتمع ====================
  if (appMode === 'public') return <PublicCalculatorsView onBack={() => setAppMode('select')} />;
  if (appMode === 'community') return <CommunityView onBack={() => setAppMode('select')} />;

  // ==================== بوابة المصنع (تسجيل الدخول) ====================
  if (appMode === 'factory' && currentUser === 'none') {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4" dir="rtl">
        {loginPrompt.isOpen && (
          <Overlay z={90}>
            <form onSubmit={handleVerifyAccessCode} className="bg-slate-800 border border-slate-600 rounded-xl max-w-xs w-full p-6 shadow-2xl flex flex-col gap-4 text-white">
              <div className="flex justify-between items-center border-b border-slate-700 pb-3">
                <h3 className="font-bold text-sm">كود الدخول ({loginPrompt.role === 'tech' ? 'فني إنتاج' : 'إدارة المصنع'})</h3>
                <button type="button" onClick={() => setLoginPrompt({ isOpen: false })}><X className="w-5 h-5 text-slate-400 hover:text-white" /></button>
              </div>
              <input type="password" autoFocus value={loginPrompt.codeInput} onChange={(e) => setLoginPrompt(p => ({ ...p, codeInput: e.target.value, error: '' }))} className="w-full bg-slate-900 border border-slate-600 rounded-xl p-3 text-center font-mono text-xl text-white outline-none focus:border-blue-500" placeholder="أدخل الكود (مثال: 1111)" />
              {loginPrompt.error && <p className="text-red-400 text-xs text-center font-bold">{loginPrompt.error}</p>}
              <button type="submit" className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-500">تأكيد الدخول</button>
            </form>
          </Overlay>
        )}
        <div className="bg-slate-900 p-8 rounded-3xl border border-slate-800 text-center max-w-md w-full shadow-2xl">
          <Settings2 className="w-16 h-16 text-emerald-500 mx-auto mb-4" />
          <h1 className="text-2xl font-black text-white mb-2">Roll Tracker SaaS</h1>
          <p className="text-slate-400 text-sm mb-8">نظام السحابة المتقدم لإدارة درافيل الدرفلة</p>
          <button onClick={() => setLoginPrompt({ isOpen: true, role: 'tech' })} className="w-full bg-blue-600 text-white font-bold py-3.5 rounded-xl mb-3 flex items-center justify-center gap-2 hover:bg-blue-700"><Edit3 className="w-5 h-5"/> دخول فني / مهندس التشغيل</button>
          <button onClick={() => setLoginPrompt({ isOpen: true, role: 'manager' })} className="w-full bg-slate-700 text-white font-bold py-3.5 rounded-xl mb-6 flex items-center justify-center gap-2 hover:bg-slate-600"><TrendingUp className="w-5 h-5"/> دخول الإدارة واعتماد التقارير</button>
          <button onClick={() => setAppMode('select')} className="text-slate-400 hover:text-white text-sm font-bold">← العودة للقائمة الرئيسية</button>
        </div>
      </div>
    );
  }

  // ==================== بوابة المصنع (لوحة التحكم من الداخل) ====================
  return (
    <div className="h-dvh bg-slate-200 text-slate-900 font-sans flex flex-col p-1 gap-1 overflow-hidden" dir="rtl">
      
      {/* نوافذ المودال لبوابة المصنع */}
      {rollModal.isOpen && (
        <Overlay z={60}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-300">
            <div className="bg-slate-900 text-white p-4 flex justify-between items-center">
              <h2 className="font-bold text-lg">تفاصيل الممرات - {stands[rollModal.standIndex].name}</h2>
              <button onClick={() => setRollModal({ isOpen: false, standIndex: null })}><X className="text-slate-400 hover:text-white w-5 h-5" /></button>
            </div>
            <div className="p-4 grid grid-cols-4 md:grid-cols-6 gap-3">
              {stands[rollModal.standIndex].passes.map(p => {
                const isCurrent = p.passNumber === stands[rollModal.standIndex].activePass;
                const isUsed = p.status === 'used';
                return (
                  <div key={p.passNumber} onClick={() => { if (!isCurrent && isManagerLike) { setResetModal({ isOpen: true, standIndex: rollModal.standIndex }); setResetTargetPass(p.passNumber); setRollModal({ isOpen: false, standIndex: null }); } }} className={`p-3 rounded-xl border-2 text-center cursor-pointer transition-all ${isCurrent ? 'bg-slate-900 text-amber-400 border-amber-500 shadow-lg scale-105' : isUsed ? 'bg-blue-50 border-blue-300 text-blue-900' : 'bg-white border-slate-200 hover:border-blue-400 text-slate-700'}`}>
                    <span className="block font-black text-xs mb-1">ممر {p.passNumber}</span>
                    <span className="block font-mono font-bold text-lg leading-none">{Number(p.tons || 0).toFixed(0)}</span>
                    <span className="text-[9px] opacity-70">طن</span>
                  </div>
                );
              })}
            </div>
          </div>
        </Overlay>
      )}

      {resetModal.isOpen && (
        <Overlay z={70}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden border border-slate-300">
            <div className="bg-slate-900 text-white p-4 flex justify-between items-center">
              <h2 className="font-bold">تغيير মمر - {stands[resetModal.standIndex].name}</h2>
              <button onClick={() => setResetModal({ isOpen: false, standIndex: null })}><X className="text-slate-400 hover:text-white w-5 h-5" /></button>
            </div>
            <div className="p-4 space-y-4">
              <div className="bg-blue-50 border border-blue-200 p-3 rounded-xl text-sm font-bold text-blue-900">
                أنت على وشك نقل التشغيل إلى <span className="bg-slate-900 text-amber-400 px-2 py-1 rounded">ممر {resetTargetPass}</span> وتصفير العداد.
              </div>
              <button onClick={confirmResetStand} className="w-full bg-blue-600 text-white font-bold py-3 rounded-xl shadow-lg hover:bg-blue-700">تأكيد التغيير الآن</button>
            </div>
          </div>
        </Overlay>
      )}

      {/* شريط التنقل العلوي للمصنع */}
      <nav className="bg-slate-900 text-white p-2 rounded flex flex-col gap-2 flex-none shadow-sm select-none">
        <div className="flex justify-between items-center h-10 px-2">
          <div className="flex items-center gap-3">
            <Settings2 className="w-6 h-6 text-emerald-500" />
            <span className="font-black text-sm md:text-base">الجيوشي للصلب - بوابة المصنع</span>
          </div>
          <div className="absolute left-1/2 -translate-x-1/2 hidden md:block"><LiveClock /></div>
          <div className="flex items-center gap-3">
            <span className="bg-slate-800 border border-slate-700 px-3 py-1 rounded-lg text-xs text-blue-400 font-bold">{roleLabel}</span>
            <button onClick={() => { setCurrentUser('none'); setAppMode('select'); }} className="text-red-400 text-xs font-bold hover:text-red-300 bg-red-500/10 px-3 py-1 rounded-lg">خروج</button>
          </div>
        </div>
        <div className="flex gap-2 overflow-x-auto bg-slate-800 p-1.5 rounded-xl border border-slate-700">
          {[
            ['dashboard', 'التشغيل والممرات', TrendingUp],
            ['reports', 'التقارير الفنية', FileSignature],
            ['motors', 'سجل المواتير', Cpu],
            ['archive', 'أرشيف الورديات', Archive],
            ['analytics', 'الإحصائيات', BarChart3]
          ].map(([k, label, Icon]) => (
            <button key={k} onClick={() => setActiveTab(k)} className={`flex-1 min-w-[110px] px-3 py-2 text-xs font-bold rounded-lg flex justify-center items-center gap-1.5 transition-all ${activeTab === k ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-700 hover:text-white'}`}><Icon className="w-4 h-4" /> {label}</button>
          ))}
        </div>
      </nav>

      {/* =========================================
          محتوى التبويبات الداخلية للمصنع
          ========================================= */}

      {/* 1. التشغيل والممرات (Dashboard) */}
      {activeTab === 'dashboard' && (
        <div className="flex flex-col gap-2 flex-1 overflow-hidden p-1">
          {/* شريط تسجيل الوردية */}
          <div className="bg-white p-3 rounded-xl shadow-sm flex flex-col md:flex-row flex-none border border-slate-300 gap-3 items-center">
            <div className="bg-blue-50 border border-blue-200 text-blue-900 text-xs font-bold p-2 rounded-lg flex items-center justify-between gap-4 w-full md:w-auto">
              <span>تسجيل إنتاج: {currentProdDate.toLocaleDateString('ar-EG', { weekday: 'long' })}</span>
              <span className="bg-white px-2 py-1 rounded shadow-sm border border-blue-100">{currentProdDate.toLocaleDateString('en-GB')}</span>
            </div>
            <div className="flex flex-row gap-2 items-stretch w-full md:w-auto flex-1">
              <input type="number" value={shiftBillets} onChange={(e) => setShiftBillets(e.target.value)} className="flex-1 min-w-0 p-2.5 border border-slate-300 rounded-lg text-center text-sm font-bold outline-none focus:border-blue-500 bg-slate-50" placeholder="عدد البليت المُنتج" />
              <select value={selectedShift} onChange={(e) => setSelectedShift(e.target.value)} className="flex-1 min-w-0 bg-white border border-slate-300 text-xs font-bold p-2.5 rounded-lg outline-none focus:border-blue-500">
                {SHIFTS_NORMAL.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              <button onClick={commitShift} className="flex-1 min-w-0 bg-blue-600 hover:bg-blue-700 text-white font-bold p-2.5 rounded-lg shadow flex justify-center items-center gap-2"><Save className="w-4 h-4" /> حفظ الوردية</button>
            </div>
            {isManagerLike && (
              <div className="flex items-center gap-2 bg-slate-100 p-2 rounded-lg border border-slate-200">
                <span className="text-xs font-bold text-slate-700">وزن البليت:</span>
                <input type="number" step="0.01" value={billetWeight} onChange={(e) => { const v = Number(e.target.value); if (v > 0) save({ weight: v }); }} className="w-16 p-1.5 border border-slate-300 rounded-md text-center font-mono font-bold text-xs outline-none focus:border-blue-500" />
              </div>
            )}
          </div>

          {/* شبكة الـ 12 ستاند */}
          <div className="flex-1 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 overflow-y-auto content-start pr-1">
            {stands.map((stand, idx) => {
              const status = getStandStatus(stand.accumulatedTons, stand.maxLimit);
              const percentage = Math.max(0, Math.min((stand.accumulatedTons / stand.maxLimit) * 100, 100));
              return (
                <div key={stand.id} onClick={() => setRollModal({ isOpen: true, standIndex: idx })} className={`min-h-[160px] rounded-2xl flex flex-col border-2 cursor-pointer bg-white ${status.border} p-3 relative overflow-hidden shadow-sm hover:shadow-md transition-transform hover:-translate-y-1`}>
                  {/* Progress Bar Background */}
                  <div className="absolute bottom-0 left-0 w-full h-1.5 bg-slate-200"><div className={`h-full ${status.bar}`} style={{ width: `${percentage}%` }}></div></div>
                  
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-black text-sm text-slate-900">{stand.name}</h3>
                      <p className="text-[10px] text-slate-500 font-bold mt-0.5">{stand.type} | {stand.diameter} mm</p>
                    </div>
                  </div>

                  <div className="flex flex-col items-center justify-center flex-1 my-2">
                    <span className={`font-mono font-black text-4xl leading-none ${status.text}`}>{stand.accumulatedTons.toFixed(0)}</span>
                    <span className="bg-slate-900 text-amber-400 text-[10px] font-black px-2 py-1 rounded shadow-sm mt-2">ممر {stand.activePass} / {stand.totalPasses}</span>
                  </div>

                  {isManagerLike && (
                    <button onClick={(e) => { e.stopPropagation(); setResetTargetPass(null); setResetModal({ isOpen: true, standIndex: idx }); }} className="mt-auto w-full bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 text-[10px] font-bold py-1.5 rounded-lg flex items-center justify-center gap-1"><RotateCcw className="w-3 h-3"/> تغيير ممر</button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 2. التقارير الفنية */}
      {activeTab === 'reports' && (
        <div className="flex-1 bg-slate-100 rounded-xl shadow border border-slate-300 p-4 overflow-y-auto flex flex-col gap-4 m-1">
          <h2 className="text-xl font-black text-slate-800 flex items-center gap-2"><FileSignature className="text-blue-600" /> التقارير الفنية للورديات (تسليم وتسلم)</h2>
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
            <textarea value={newReport} onChange={e => setNewReport(e.target.value)} rows="3" placeholder="اكتب تقرير الوردية هنا (حالة المعدات، الأعطال، التوقفات، ملاحظات الإنتاج)..." className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-sm focus:border-blue-500 outline-none resize-none mb-3"></textarea>
            <button onClick={() => { if(newReport.trim()){ save({ reports: [{ id: Date.now(), text: newReport, date: new Date().toLocaleString('ar-EG'), by: roleLabel }, ...reportsList] }); setNewReport(''); } }} className="bg-blue-600 text-white font-bold px-6 py-2.5 rounded-xl text-sm hover:bg-blue-700 shadow-md">حفظ التقرير وإضافته للأرشيف</button>
          </div>
          <div className="space-y-3">
            {reportsList.map(rep => (
              <div key={rep.id} className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200">
                <div className="flex justify-between items-center text-xs text-slate-500 mb-3 font-bold border-b border-slate-100 pb-2">
                  <span className="bg-slate-100 px-3 py-1 rounded-lg">بواسطة: {rep.by}</span>
                  <span dir="ltr" className="font-mono">{rep.date}</span>
                </div>
                <p className="text-sm text-slate-800 whitespace-pre-line leading-relaxed">{rep.text}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. سجل المواتير */}
      {activeTab === 'motors' && (
        <div className="flex-1 bg-slate-100 rounded-xl shadow border border-slate-300 p-4 overflow-y-auto flex flex-col gap-4 m-1">
          <h2 className="text-xl font-black text-slate-800 flex items-center gap-2"><Cpu className="text-blue-600" /> سجل بيانات المواتير (Motors Log)</h2>
          {isManagerLike && (
            <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 grid grid-cols-2 md:grid-cols-5 gap-4 items-end">
              <div><label className="block text-xs font-bold text-slate-700 mb-1.5">الستاند:</label><select value={newMotor.stand} onChange={e=>setNewMotor({...newMotor, stand: e.target.value})} className="w-full border border-slate-300 p-2.5 rounded-xl text-sm bg-slate-50">{stands.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
              <div><label className="block text-xs font-bold text-slate-700 mb-1.5">كود/سيريال الموتور:</label><input type="text" value={newMotor.code} onChange={e=>setNewMotor({...newMotor, code: e.target.value})} className="w-full border border-slate-300 p-2.5 rounded-xl text-sm bg-slate-50 outline-none focus:border-blue-500" /></div>
              <div><label className="block text-xs font-bold text-slate-700 mb-1.5">القدرة (kW):</label><input type="number" value={newMotor.kw} onChange={e=>setNewMotor({...newMotor, kw: e.target.value})} className="w-full border border-slate-300 p-2.5 rounded-xl text-sm bg-slate-50 outline-none focus:border-blue-500" /></div>
              <div><label className="block text-xs font-bold text-slate-700 mb-1.5">Max RPM:</label><input type="number" value={newMotor.rpm} onChange={e=>setNewMotor({...newMotor, rpm: e.target.value})} className="w-full border border-slate-300 p-2.5 rounded-xl text-sm bg-slate-50 outline-none focus:border-blue-500" /></div>
              <button onClick={() => { if(newMotor.code && newMotor.kw) { save({ motors: [{ id: Date.now(), ...newMotor, dateAdded: new Date().toLocaleDateString('ar-EG') }, ...motorsList] }); setNewMotor({ stand: '1', code: '', kw: '', rpm: '' }); } }} className="bg-emerald-600 text-white font-bold py-2.5 rounded-xl text-sm hover:bg-emerald-700 col-span-2 md:col-span-1 shadow-md">إضافة / تحديث الموتور</button>
            </div>
          )}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
            <table className="w-full text-right text-sm">
              <thead className="bg-slate-800 text-white"><tr><th className="p-4">الستاند</th><th className="p-4">السيريال</th><th className="p-4">القدرة (kW)</th><th className="p-4">Max RPM</th><th className="p-4">تاريخ التركيب</th></tr></thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {motorsList.map(m => (
                  <tr key={m.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4 font-bold text-blue-700">ستاند {m.stand}</td><td className="p-4">{m.code}</td>
                    <td className="p-4 text-emerald-600 font-bold">{m.kw} kW</td><td className="p-4 text-amber-600 font-bold">{m.rpm}</td><td className="p-4 text-slate-400 text-xs">{m.dateAdded}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 4. الأرشيف (ورديات الإنتاج) */}
      {activeTab === 'archive' && (
        <div className="flex-1 bg-slate-100 rounded-xl shadow border border-slate-300 p-4 overflow-y-auto m-1">
           <h2 className="text-xl font-black text-slate-800 flex items-center gap-2 mb-4"><Archive className="text-blue-600" /> أرشيف إنتاج الورديات</h2>
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {productionArchive.map(log => (
                <div key={log.id} className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 hover:border-blue-300 transition-colors">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-3 mb-3">
                    <span className="font-bold text-slate-700">{log.shift}</span>
                    <span className="text-xs bg-slate-100 px-2 py-1 rounded-lg text-slate-500 font-mono">{log.date}</span>
                  </div>
                  <div className="flex justify-between items-center text-center">
                    <div className="bg-blue-50 rounded-xl p-3 flex-1 ml-2 border border-blue-100">
                      <span className="block text-xs font-bold text-blue-800 mb-1">البيليت</span>
                      <span className="font-mono font-black text-xl text-blue-600">{log.billets}</span>
                    </div>
                    <div className="bg-emerald-50 rounded-xl p-3 flex-1 border border-emerald-100">
                      <span className="block text-xs font-bold text-emerald-800 mb-1">الإنتاج (طن)</span>
                      <span className="font-mono font-black text-xl text-emerald-600">{log.tons.toFixed(1)}</span>
                    </div>
                  </div>
                </div>
              ))}
           </div>
        </div>
      )}

      {/* 5. الإحصائيات */}
      {activeTab === 'analytics' && (
        <div className="flex-1 bg-slate-100 rounded-xl shadow border border-slate-300 p-4 overflow-y-auto flex flex-col gap-4 m-1">
          <h2 className="text-xl font-black text-slate-800 flex items-center gap-2"><BarChart3 className="text-blue-600" /> لوحة الإحصائيات وتحليل الإنتاج</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm text-center">
              <p className="text-xs font-bold text-blue-800 mb-2">إجمالي الأطنان المسجلة</p>
              <p className="font-mono font-black text-4xl text-blue-600">{productionArchive.reduce((acc, l) => acc + l.tons, 0).toFixed(1)} <span className="text-base text-slate-400">طن</span></p>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm text-center">
              <p className="text-xs font-bold text-emerald-800 mb-2">إجمالي البيليت</p>
              <p className="font-mono font-black text-4xl text-emerald-600">{productionArchive.reduce((acc, l) => acc + l.billets, 0)} <span className="text-base text-slate-400">قطعة</span></p>
            </div>
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm text-center">
              <p className="text-xs font-bold text-purple-800 mb-2">إجمالي الورديات في الأرشيف</p>
              <p className="font-mono font-black text-4xl text-purple-600">{productionArchive.length}</p>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
