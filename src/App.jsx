import React, { useState, useEffect, useRef } from 'react';
import {
  UserCog, Edit3, TrendingUp, AlertTriangle, CheckCircle, RotateCcw,
  Save, Power, Settings2, Archive, CalendarDays, List, BarChart3, RefreshCw,
  Sliders, Trash2, Clock, Settings, X, UploadCloud, History,
  ShieldAlert, Key, Eye, Layers, Wrench, ArrowLeftRight,
  FileSpreadsheet, FileText, Inbox, Check, XCircle, Hourglass,
  Calculator, Zap, Gauge, Circle, Maximize2, Activity, DivideSquare, FileSignature, Cpu,
  MessageCircle, PlusCircle, ThumbsUp, Building2, Boxes, Ruler, Scissors, Flame
} from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, setDoc, onSnapshot, collection, addDoc, serverTimestamp } from 'firebase/firestore';

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
} catch (error) {
  console.error("Firebase init error:", error);
}

/* ======================================================
  2. البيانات الأولية (مجتمع المهندسين، الحاسبات، الجداول)
  ====================================================== */
const INITIAL_POSTS = [
  {
    id: 'p1', author: 'م. بسام وليد', role: 'مشغل أول غرفة تحكم رئيسية', badge: 'Admin', time: 'منذ ساعتين', category: 'فنيات تشغيل الكنترول',
    title: 'إزاي تعرف فيه شد (Tension) ولا انضغاط (Loop) بين قائمين في التخشين من شاشة الأمبير؟',
    content: 'طريقة عملية من غرفة التحكم الرئيسية (HMI): لو فرضنا إن أمبير قائم (2) كان 1500 أمبير أول ما المعدن دخل فيه، ولما رأس البيليت دخلت في قائم (3) لاحظت إن أمبير قائم (2) نزل فجأة لـ 1200 أمبير.. ده معناه وجود شد (Tension) بين القائمين ولازم نهدي سرعة قائم 3 أو نرفع سرعة قائم 1 و 2. العكس لو الأمبير زاد لـ 1700 أمبير فده معناه انضغاط (Compression) وبداية تكوين لوب!',
    likes: 28, liked: false,
    comments: [
      { id: 'c101', user: 'م. إسلام عرفات', role: 'مهندس درفلة', text: 'شرح ممتاز يا هندسة، وده اللي بنسميه في الأوتوميشن Minimum Tension Control (MTC).', time: 'منذ ساعة' },
      { id: 'c102', user: 'فني تشغيل أول', role: 'غرفة التحكم', text: 'فعلاً متابعة أمبير ق12 وق13 مهمة جداً خصوصاً في مقاس 10 مم و 12 مم لضبط الجاب.', time: 'منذ 45 دقيقة' }
    ]
  },
  {
    id: 'p2', author: 'م. عادل عزالدين', role: 'مهندس أتمتة وتحكم صناعي', badge: 'خبير', time: 'منذ 5 ساعات', category: 'أسرار الدرفلة والـ Tempcore',
    title: 'ليه بننقل أسياخ الحديد على سرير التبريد (Cooling Bed) سيخ ورا سيخ مش مجموعة مع بعض؟',
    content: 'بعد خروج السيخ من صندوق التبريد (Quenching Box) عند حرارة حوالي 700 درجة، القلب الداخلي الساخن بيعمل مراجعة ذاتية للسطح (Self-Tempering) عشان يكون طبقة Tempered Martensite الصلبة. لو الأسياخ اتنقلت فوق بعضها كمجموعة هيحصل انتقال حرارة بالتوصيل بينهم وتبوظ عملية الـ Tempcore وتقل رتبة وإجهاد الحديد!',
    likes: 42, liked: false,
    comments: [
      { id: 'c103', user: 'م. أحمد طارق', role: 'مهندس جودة', text: 'معلومة ذهبية! وعشان كدا ضبط عدد العلب المغلقة في الأبرون (X = V² / 8) بيفرق جداً في مسافة الرمي.', time: 'منذ 3 ساعات' }
    ]
  }
];

const INITIAL_FAULTS = [
  { id: 'f1', code: 'LAPS / قشرة', brand: 'عيوب الدرفلة والمنتج', title: 'ظهور شرخ ظاهري أو قشرة بطول السيخ (Laps Defect)', cause: 'حدوث امتلاء زائد (Overfill) في أحد الممرات مع دخول المعدن للممر التالي بزاوية غير مضبوطة فيتم طي الشنب ودرفلته.', solution: 'افحص خلوص الممر السابق، راجع سنترية دليل الدخول (Entry Guide)، واعمل اختبار ثني (Bending Test) للعينة.' },
  { id: 'f2', code: 'FINS / شنب', brand: 'عيوب الدرفلة والمنتج', title: 'ظهور نتوء طولي أكبر من المسموح', cause: 'من الجانبين: غلق جاب القائم النهائي زيادة عن اللزوم أو زيادة معدن من القوائم السابقة. من جانب واحد: عدم سنترية دليل الدخول أو انهيار رولمان بلي الدليل البكري.', solution: 'افحص Core Dimension ووزن المتر الطولي؛ لو القلب أقل من الطبيعي افتح جاب القائم النهائي، وراجع سنترية وبكر دليل الدخول.' },
  { id: 'f3', code: 'F0001', brand: 'Siemens SINAMICS Drives', title: 'فصل الإنفرتر تيار زائد مفاجئ أثناء دخول المعدن', cause: 'دخول بيليت بارد، نسبة تخفيض عالية جداً، أو زاوية عض أكبر من الحد المسموح.', solution: 'راجع حرارة البيليت، تأكد من تفعيل الـ Lead/Over Speed (2% - 5%) لتحسين عض مقدمة المعدن، وافحص كابلات الموتور.' }
];

const REBAR_SPECS = [
  { size: 10, area: 78.5, minW: 0.580, nomW: 0.617, maxW: 0.654, color: 'بدون لون' },
  { size: 12, area: 113.0, minW: 0.835, nomW: 0.888, maxW: 0.941, color: 'أحمر' },
  { size: 14, area: 154.0, minW: 1.150, nomW: 1.210, maxW: 1.271, color: 'أبيض' },
  { size: 16, area: 201.0, minW: 1.501, nomW: 1.580, maxW: 1.659, color: 'أزرق' },
  { size: 18, area: 254.0, minW: 1.900, nomW: 2.000, maxW: 2.100, color: 'أصفر' },
  { size: 20, area: 314.0, minW: 2.340, nomW: 2.470, maxW: 2.590, color: 'بني' },
  { size: 22, area: 380.0, minW: 2.836, nomW: 2.986, maxW: 3.135, color: 'رمادي' },
  { size: 25, area: 491.0, minW: 3.696, nomW: 3.850, maxW: 4.004, color: 'أسود' },
  { size: 32, area: 804.0, minW: 6.057, nomW: 6.310, maxW: 6.562, color: 'أخضر' }
];

const UNIT_GROUPS = {
  speed: { label: 'السرعة الخطية', units: [['m/s', 1], ['m/min', 1 / 60], ['km/h', 1 / 3.6]] },
  rot: { label: 'السرعة الدورانية', units: [['RPM', 1], ['rad/s', 60 / (2 * Math.PI)]] },
  length: { label: 'الطول والأبعاد', units: [['mm', 1], ['cm', 10], ['m', 1000], ['in', 25.4]] },
  mass: { label: 'الوزن', units: [['kg', 1], ['ton', 1000], ['lb', 0.45359237]] },
  power: { label: 'القدرة', units: [['kW', 1], ['hp', 0.745700]] },
  temp: { label: 'درجة الحرارة', temp: true, units: [['°C', 1], ['°F', 1], ['K', 1]] }
};

const toCelsius = (v, u) => (u === '°F' ? ((v - 32) * 5) / 9 : u === 'K' ? v - 273.15 : v);
const fromCelsius = (c, u) => (u === '°F' ? (c * 9) / 5 + 32 : u === 'K' ? c + 273.15 : c);

/* ======================================================
  3. ثوابت المصنع (SaaS)
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

/* ======================================================
  4. مكونات وعناصر مساعدة (UI Components)
  ====================================================== */
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
  <div className={`fixed inset-0 bg-black/70 flex items-center justify-center p-3 backdrop-blur-sm overflow-y-auto`} style={{ zIndex: z }}>{children}</div>
);

const num = (v) => (Number.isFinite(Number(v)) ? Number(v) : 0);
const fmt = (n, d = 2) => (Number.isFinite(n) ? n.toFixed(d) : '—');
const inputCls = 'w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white font-mono text-sm focus:border-blue-500 outline-none';

const Field = ({ label, value, onChange, step, className = '' }) => (
  <div className={className}>
    <label className="text-xs text-slate-400 block mb-1">{label}</label>
    <input type="number" step={step} value={value} onChange={(e) => onChange(e.target.value)} className={inputCls} />
  </div>
);

const SelectField = ({ label, value, onChange, options, className = '' }) => (
  <div className={className}>
    <label className="text-xs text-slate-400 block mb-1">{label}</label>
    <select value={value} onChange={(e) => onChange(e.target.value)} className={inputCls}>
      {options.map((o) => (<option key={o[0]} value={o[0]}>{o[1]}</option>))}
    </select>
  </div>
);

const Stat = ({ label, value, unit, color = 'text-white', big = false }) => (
  <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800">
    <span className="text-xs text-slate-400 block mb-1">{label}</span>
    <span className={`font-bold font-mono ${big ? 'text-xl' : 'text-lg'} ${color}`}>
      {value} {unit && <span className="text-sm text-slate-500 ml-1">{unit}</span>}
    </span>
  </div>
);

const Shell = ({ inputs, results, border = 'border-blue-500/30' }) => (
  <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
    <div className="lg:col-span-6 bg-slate-900 p-4 sm:p-6 rounded-3xl border border-slate-800 space-y-4">{inputs}</div>
    <div className={`lg:col-span-6 bg-slate-900 p-4 sm:p-6 rounded-3xl border ${border} space-y-4`}>{results}</div>
  </div>
);

/* ======================================================
  5. الحاسبات المتقدمة (تصميم الممرات - عدد الأسياخ - الجداول)
  ====================================================== */
const PassDesignCalc = () => {
  const [side, setSide] = useState(130);
  const [size, setSize] = useState('12');
  const [strands, setStrands] = useState('2');
  const [stands, setStands] = useState(15);
  const [vFinal, setVFinal] = useState(14);
  const [dwFirst, setDwFirst] = useState(560);
  const [dwLast, setDwLast] = useState(330);
  const [gr, setGr] = useState(3.4);
  const [maxRpm, setMaxRpm] = useState(1750);
  const [billetLen, setBilletLen] = useState(12);
  const [cutLen, setCutLen] = useState(48);

  const spec = REBAR_SPECS.find((r) => String(r.size) === size) || REBAR_SPECS[1];
  const N = Math.max(1, Math.min(30, Math.round(num(stands)) || 1));
  const k = Number(strands) || 1;
  const A0 = num(side) * num(side);
  const Aout = spec.area * k;
  const lamTotal = Aout > 0 ? A0 / Aout : 0;
  const lamPass = lamTotal > 1 ? Math.pow(lamTotal, 1 / N) : 1;
  const Q = Aout * num(vFinal);
  
  const rpmFromV = (v, dw) => (dw > 0 ? (v * 60000) / (Math.PI * dw) : 0);
  
  const rows = Array.from({ length: N }, (_, i) => {
    const A = A0 / Math.pow(lamPass, i + 1);
    const prev = A0 / Math.pow(lamPass, i);
    const V = A > 0 ? Q / A : 0;
    const dw = N > 1 ? num(dwFirst) + ((num(dwLast) - num(dwFirst)) * i) / (N - 1) : num(dwFirst);
    const roll = rpmFromV(V, dw);
    const motor = roll * num(gr);
    return { idx: i + 1, A, red: prev > 0 ? ((prev - A) / prev) * 100 : 0, V, dw, roll, motor, over: motor > num(maxRpm) };
  });

  const V0 = A0 > 0 ? Q / A0 : 0;
  const passTime = V0 > 0 ? num(billetLen) / V0 : 0;
  const lenStrand = num(billetLen) * lamTotal;
  const cuts = num(cutLen) > 0 ? Math.floor(lenStrand / num(cutLen)) : 0;
  const shortBar = lenStrand - cuts * num(cutLen);
  const billetKg = A0 * 0.00785 * num(billetLen);

  return (
    <div className="space-y-5 animate-in fade-in zoom-in duration-300">
      <Shell border="border-teal-500/30"
        inputs={<>
          <h3 className="text-xl font-bold text-white border-b border-slate-800 pb-3">مدخلات تصميم الممرات</h3>
          <div className="grid grid-cols-2 gap-3">
            <Field label="ضلع البليت (mm)" value={side} onChange={setSide} />
            <Field label="طول البليت (m)" value={billetLen} onChange={setBilletLen} step="0.5" />
            <SelectField label="مقاس المنتج" value={size} onChange={setSize} options={REBAR_SPECS.map(r => [String(r.size), `${r.size} مم`])} />
            <SelectField label="البارات (Strands)" value={strands} onChange={setStrands} options={[['1', '1'], ['2', '2'], ['3', '3'], ['4', '4']]} />
            <Field label="عدد القوائم" value={stands} onChange={setStands} />
            <Field label="سرعة الخروج (m/s)" value={vFinal} onChange={setVFinal} step="0.5" />
            <Field label="Dw أول قائم (mm)" value={dwFirst} onChange={setDwFirst} />
            <Field label="Dw آخر قائم (mm)" value={dwLast} onChange={setDwLast} />
            <Field label="Gear Ratio ثابت" value={gr} onChange={setGr} step="0.1" />
            <Field label="Max RPM للموتور" value={maxRpm} onChange={setMaxRpm} />
            <Field label="طول القطعية (m)" value={cutLen} onChange={setCutLen} step="1" className="col-span-2" />
          </div>
        </>}
        results={<>
          <h3 className="text-xl font-bold text-teal-400 border-b border-slate-800 pb-3">ملخص التصميم</h3>
          <div className="grid grid-cols-2 gap-3 mb-4">
            <Stat label="الاستطالة الكلية" value={fmt(lamTotal, 1)} color="text-teal-400" big />
            <Stat label="λ لكل ممر" value={fmt(lamPass, 3)} />
            <Stat label="تخفيض الممر" value={fmt((1 - 1 / lamPass) * 100, 1)} unit="%" />
            <Stat label="سرعة دخول ق1" value={fmt(V0, 3)} unit="m/s" />
          </div>
          <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2 text-sm">
            <div className="flex justify-between"><span className="text-slate-400">مساحة البليت ← المنتج:</span><span className="font-mono text-white font-bold">{fmt(A0, 0)} → {fmt(Aout, 1)} mm²</span></div>
            <div className="flex justify-between"><span className="text-slate-400">وزن البليت:</span><span className="font-mono text-white font-bold">{fmt(billetKg, 0)} كجم</span></div>
            <div className="flex justify-between"><span className="text-slate-400">زمن الدرفلة:</span><span className="font-mono text-white font-bold">{fmt(passTime, 1)} ث</span></div>
            <div className="flex justify-between border-t border-slate-800 pt-2"><span className="text-slate-400">القطعيات + البار الأخير:</span><span className="font-mono text-amber-400 font-bold">{cuts} قطعية + {fmt(shortBar, 1)} م</span></div>
          </div>
        </>}
      />
      <div className="bg-slate-900 p-4 rounded-3xl border border-slate-800 overflow-x-auto">
        <h3 className="text-lg font-bold text-white mb-3">جدول القوائم المبدئي</h3>
        <table className="w-full text-right text-sm min-w-[600px]">
          <thead className="bg-slate-950 text-slate-400 text-xs"><tr><th className="p-2 rounded-r-lg">قائم</th><th className="p-2">المساحة mm²</th><th className="p-2">تخفيض %</th><th className="p-2">السرعة m/s</th><th className="p-2">Dw mm</th><th className="p-2">درفيل RPM</th><th className="p-2 rounded-l-lg">موتور RPM</th></tr></thead>
          <tbody className="divide-y divide-slate-800 font-mono">
            {rows.map(r => (
              <tr key={r.idx} className={r.over ? 'bg-red-500/10' : 'hover:bg-slate-800/40'}>
                <td className="p-2 font-bold text-white">{r.idx}</td><td className="p-2 text-slate-300">{fmt(r.A, 1)}</td><td className="p-2 text-slate-300">{fmt(r.red, 1)}</td>
                <td className="p-2 text-sky-400 font-bold">{fmt(r.V, 3)}</td><td className="p-2 text-slate-300">{fmt(r.dw, 0)}</td><td className="p-2 text-slate-300">{fmt(r.roll, 1)}</td>
                <td className={`p-2 font-bold ${r.over ? 'text-red-400' : 'text-amber-400'}`}>{fmt(r.motor, 0)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const BarsCountCalc = () => {
  const [side, setSide] = useState(130);
  const [billetLen, setBilletLen] = useState(12);
  const [size, setSize] = useState('12');
  const [yieldPct, setYieldPct] = useState(98);
  const [strands, setStrands] = useState('2');
  const [cutLen, setCutLen] = useState(48);
  const [commLen, setCommLen] = useState(12);
  const [billetsShift, setBilletsShift] = useState(500);

  const spec = REBAR_SPECS.find((r) => String(r.size) === size) || REBAR_SPECS[1];
  const k = Number(strands) || 1;
  const billetKg = num(side) * num(side) * 0.00785 * num(billetLen);
  const prodKg = (billetKg * num(yieldPct)) / 100;
  const totalLen = spec.nomW > 0 ? prodKg / spec.nomW : 0;
  const perStrand = totalLen / k;
  const cuts = num(cutLen) > 0 ? Math.floor(perStrand / num(cutLen)) : 0;
  const rem = perStrand - cuts * num(cutLen);
  const bpc = num(commLen) > 0 ? Math.floor(num(cutLen) / num(commLen)) : 0;
  const leftPerCut = num(cutLen) - bpc * num(commLen);
  const remBars = num(commLen) > 0 ? Math.floor(rem / num(commLen)) : 0;
  const remScrap = rem - remBars * num(commLen);
  const barsPerBillet = k * (cuts * bpc + remBars);
  const barKg = num(commLen) * spec.nomW;
  const perTon = prodKg > 0 ? barsPerBillet / (prodKg / 1000) : 0;

  return (
    <Shell border="border-emerald-500/30"
      inputs={<>
        <h3 className="text-xl font-bold text-white border-b border-slate-800 pb-3">مدخلات حساب الأسياخ</h3>
        <div className="grid grid-cols-2 gap-3">
          <Field label="ضلع البليت (mm)" value={side} onChange={setSide} />
          <Field label="طول البليت (m)" value={billetLen} onChange={setBilletLen} step="0.5" />
          <SelectField label="مقاس السيخ" value={size} onChange={setSize} options={REBAR_SPECS.map(r => [String(r.size), `${r.size} مم`])} />
          <SelectField label="البارات (Strands)" value={strands} onChange={setStrands} options={[['1', '1'], ['2', '2'], ['3', '3'], ['4', '4']]} />
          <Field label="طول قطعية المقص (m)" value={cutLen} onChange={setCutLen} step="1" />
          <Field label="السيخ التجاري (m)" value={commLen} onChange={setCommLen} step="0.5" />
          <Field label="نسبة الإدرار (%)" value={yieldPct} onChange={setYieldPct} step="0.5" />
          <Field label="بليت الوردية" value={billetsShift} onChange={setBilletsShift} />
        </div>
      </>}
      results={<>
        <h3 className="text-xl font-bold text-emerald-400 border-b border-slate-800 pb-3">النتائج</h3>
        <div className="bg-emerald-900/30 p-4 rounded-2xl border border-emerald-500/40 mb-4 text-center">
          <span className="text-xs text-emerald-200 block mb-1">عدد الأسياخ من البليت الواحد</span>
          <span className="text-4xl font-black font-mono text-emerald-400">{barsPerBillet} <span className="text-sm">سيخ</span></span>
        </div>
        <div className="grid grid-cols-2 gap-3 mb-4">
          <Stat label="وزن البليت" value={fmt(billetKg, 0)} unit="كجم" />
          <Stat label="وزن السيخ" value={fmt(barKg, 2)} unit="كجم" />
          <Stat label="طول البار / ستراند" value={fmt(perStrand, 0)} unit="متر" />
          <Stat label="أسياخ في الطن" value={fmt(perTon, 1)} />
        </div>
        <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2 text-sm font-bold">
          <div className="flex justify-between"><span className="text-slate-400">القطعيات لكل ستراند:</span><span className="text-white font-mono">{cuts} قطعية (طول {cutLen}م)</span></div>
          <div className="flex justify-between"><span className="text-slate-400">أسياخ من كل قطعية:</span><span className="text-white font-mono">{bpc} سيخ {leftPerCut>0 && <span className="text-amber-500 text-xs">(يهدر {fmt(leftPerCut,1)}م)</span>}</span></div>
          <div className="flex justify-between text-amber-400"><span className="">بواقي البار الأخير:</span><span className="font-mono">{fmt(rem, 1)}م ← {remBars} سيخ و {fmt(remScrap, 1)}م هالك</span></div>
          <div className="flex justify-between border-t border-slate-800 pt-2 mt-2"><span className="text-emerald-400">إنتاج الوردية:</span><span className="text-emerald-400 font-mono text-lg">{fmt(num(billetsShift) * barsPerBillet, 0)} سيخ | {fmt((num(billetsShift) * prodKg) / 1000, 1)} طن</span></div>
        </div>
      </>}
    />
  );
};

const UnitConverterTool = () => {
  const [cat, setCat] = useState('speed');
  const [unit, setUnit] = useState('m/s');
  const [val, setVal] = useState(1);
  const g = UNIT_GROUPS[cat];
  const all = g.temp ? g.units.map(([u]) => [u, fromCelsius(toCelsius(num(val), unit), u)]) : (() => {
    const from = g.units.find(x => x[0] === unit);
    const base = num(val) * (from ? from[1] : 1);
    return g.units.map(([u, f]) => [u, base / f]);
  })();
  return (
    <Shell border="border-rose-500/30"
      inputs={<>
        <h3 className="text-xl font-bold text-white border-b border-slate-800 pb-3">أدخل القيمة والوحدة</h3>
        <div className="grid grid-cols-2 gap-3">
          <SelectField label="النوع" value={cat} onChange={v => { setCat(v); setUnit(UNIT_GROUPS[v].units[0][0]); }} className="col-span-2" options={Object.keys(UNIT_GROUPS).map(k => [k, UNIT_GROUPS[k].label])} />
          <Field label="القيمة" value={val} onChange={setVal} step="any" />
          <SelectField label="الوحدة الأساسية" value={unit} onChange={setUnit} options={g.units.map(u => [u[0], u[0]])} />
        </div>
      </>}
      results={<>
        <h3 className="text-xl font-bold text-rose-400 border-b border-slate-800 pb-3">النتائج والتحويلات</h3>
        <div className="grid grid-cols-2 gap-3">
          {all.map(([u, v]) => (
            <Stat key={u} label={u} value={Math.abs(v) >= 1e6 || (Math.abs(v) < 1e-3 && v !== 0) ? v.toExponential(3) : fmt(v, 4)} color={u === unit ? 'text-rose-400' : 'text-white'} />
          ))}
        </div>
      </>}
    />
  );
};

const RebarTable = () => (
  <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 overflow-x-auto animate-in fade-in zoom-in duration-300">
    <h3 className="text-xl font-bold text-white mb-4">الأوزان القياسية لحديد التسليح (ISO 6935-2 / ES 262)</h3>
    <table className="w-full text-right text-sm min-w-[500px]">
      <thead className="bg-slate-950 text-slate-400 text-xs"><tr><th className="p-3 rounded-r-lg">المقاس (mm)</th><th className="p-3">المساحة (mm²)</th><th className="p-3">أقل وزن</th><th className="p-3">الاسمي (كجم/م)</th><th className="p-3">أقصى وزن</th><th className="p-3 rounded-l-lg">اللون</th></tr></thead>
      <tbody className="divide-y divide-slate-800/60 font-mono">
        {REBAR_SPECS.map((r) => (
          <tr key={r.size} className="hover:bg-slate-800/50">
            <td className="p-3 font-bold text-white">{r.size} مم</td><td className="p-3 text-slate-300">{r.area}</td>
            <td className="p-3 text-red-400">{r.minW}</td><td className="p-3 text-emerald-400 font-bold text-base">{r.nomW}</td><td className="p-3 text-amber-400">{r.maxW}</td>
            <td className="p-3 font-sans text-xs text-blue-300">{r.color}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

/* ======================================================
  6. مجتمع المهندسين (Posts & Faults)
  ====================================================== */
const SocialFeedAndFaults = () => {
  const [subMode, setSubMode] = useState('feed');
  const [posts, setPosts] = useState(INITIAL_POSTS);
  const [faults] = useState(INITIAL_FAULTS);
  const [newPostAuthor, setNewPostAuthor] = useState('');
  const [newPostTitle, setNewPostTitle] = useState('');
  const [newPostContent, setNewPostContent] = useState('');
  const [commentInputs, setCommentInputs] = useState({});
  const [commentAuthor, setCommentAuthor] = useState('');
  const [faultSearch, setFaultSearch] = useState('');

  const handleCreatePost = (e) => {
    e.preventDefault();
    if (!newPostTitle.trim() || !newPostContent.trim()) return;
    const postObj = {
      id: Date.now().toString(), author: newPostAuthor || 'مهندس / فني مجهول', role: 'عضو المنصة', badge: 'جديد',
      time: 'الآن', category: 'مناقشة فنية', title: newPostTitle, content: newPostContent, likes: 0, liked: false, comments: []
    };
    setPosts([postObj, ...posts]);
    setNewPostTitle(''); setNewPostContent('');
  };

  const handleToggleLike = (postId) => {
    setPosts(prev => prev.map(p => p.id === postId ? { ...p, liked: !p.liked, likes: p.liked ? p.likes - 1 : p.likes + 1 } : p));
  };

  const handleAddComment = (postId) => {
    const text = commentInputs[postId];
    if (!text || !text.trim()) return;
    const newComment = { id: Date.now().toString(), user: commentAuthor || 'عضو بالمنصة', role: 'متابع', text: text.trim(), time: 'الآن' };
    setPosts(prev => prev.map(p => p.id === postId ? { ...p, comments: [...p.comments, newComment] } : p));
    setCommentInputs({ ...commentInputs, [postId]: '' });
  };

  const filteredFaults = faults.filter(f => f.code.toLowerCase().includes(faultSearch.toLowerCase()) || f.title.toLowerCase().includes(faultSearch.toLowerCase()));

  return (
    <div className="space-y-6 animate-in slide-in-from-bottom-4 duration-500">
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl flex flex-col sm:flex-row justify-between items-center gap-4 shadow-lg">
        <div>
          <h2 className="text-2xl font-extrabold text-white flex items-center gap-2"><MessageCircle className="text-blue-500" /> مجتمع صناع الحديد</h2>
          <p className="text-sm text-slate-400 mt-1">تفاعل مع زملائك، اطرح أسئلتك، وابحث في موسوعة الأعطال.</p>
        </div>
        <div className="flex bg-slate-950 p-1.5 rounded-2xl border border-slate-800 shrink-0">
          <button onClick={() => setSubMode('feed')} className={`px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all ${subMode === 'feed' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}><MessageCircle size={18}/> المنشورات</button>
          <button onClick={() => setSubMode('faults')} className={`px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all ${subMode === 'faults' ? 'bg-amber-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'}`}><Wrench size={18}/> موسوعة العيوب</button>
        </div>
      </div>

      {subMode === 'feed' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-4">
            <form onSubmit={handleCreatePost} className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4 shadow-lg lg:sticky lg:top-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-2"><PlusCircle className="text-blue-400" /> نشر بوست جديد</h3>
              <input type="text" placeholder="اسمك / صفتك..." value={newPostAuthor} onChange={e => setNewPostAuthor(e.target.value)} className={inputCls} />
              <input type="text" placeholder="عنوان المنشور..." value={newPostTitle} onChange={e => setNewPostTitle(e.target.value)} className={inputCls + " font-bold"} />
              <textarea rows="4" placeholder="اكتب المعلومة أو السؤال هنا..." value={newPostContent} onChange={e => setNewPostContent(e.target.value)} className={inputCls + " resize-none"} />
              <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl shadow-md transition-transform active:scale-95">نشر الآن</button>
            </form>
          </div>
          <div className="lg:col-span-8 space-y-5">
            {posts.map(post => (
              <div key={post.id} className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-lg">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-black text-xl shadow-inner">{post.author.charAt(0)}</div>
                    <div>
                      <h4 className="font-bold text-white text-base flex items-center gap-2">{post.author} <span className="text-[10px] bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full">{post.badge}</span></h4>
                      <p className="text-xs text-slate-400">{post.role} • {post.time}</p>
                    </div>
                  </div>
                  <span className="text-xs bg-slate-800 text-slate-300 px-3 py-1 rounded-full">{post.category}</span>
                </div>
                <h3 className="text-lg font-bold text-blue-300 mb-2">{post.title}</h3>
                <p className="text-sm text-slate-200 leading-relaxed whitespace-pre-line mb-4">{post.content}</p>
                <div className="flex items-center gap-4 pt-4 border-t border-slate-800 mb-4">
                  <button onClick={() => handleToggleLike(post.id)} className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold transition-colors ${post.liked ? 'bg-blue-600 text-white shadow-md' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'}`}><ThumbsUp size={16} /> أعجبني ({post.likes})</button>
                  <span className="text-sm text-slate-400 font-bold flex items-center gap-1.5"><MessageCircle size={16}/> {post.comments.length} تعليقات</span>
                </div>
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
                  {post.comments.map(c => (
                    <div key={c.id} className="bg-slate-900 p-3 rounded-xl border border-slate-700/50">
                      <div className="flex justify-between items-center mb-1"><span className="text-xs font-bold text-emerald-400">{c.user}</span><span className="text-[10px] text-slate-500">{c.time}</span></div>
                      <p className="text-xs text-slate-300 leading-relaxed">{c.text}</p>
                    </div>
                  ))}
                  <div className="flex flex-col sm:flex-row gap-2 mt-3 pt-3 border-t border-slate-800">
                    <input type="text" placeholder="اسمك..." value={commentAuthor} onChange={e => setCommentAuthor(e.target.value)} className="sm:w-1/4 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-emerald-500" />
                    <input type="text" placeholder="اكتب تعليقك..." value={commentInputs[post.id] || ''} onChange={e => setCommentInputs({...commentInputs, [post.id]: e.target.value})} className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-emerald-500" />
                    <button onClick={() => handleAddComment(post.id)} className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-md">تعليق</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          <input type="text" placeholder="ابحث عن عطل أو عيب (مثلاً: شنب، F0001)..." value={faultSearch} onChange={e => setFaultSearch(e.target.value)} className="w-full bg-slate-900 border border-slate-800 rounded-2xl px-5 py-4 text-white font-bold shadow-lg outline-none focus:border-amber-500" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredFaults.map(f => (
              <div key={f.id} className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-lg flex flex-col">
                <div className="flex justify-between items-center mb-3">
                  <span className="bg-red-500/20 text-red-400 font-black px-3 py-1 rounded-lg text-sm border border-red-500/30">{f.code}</span>
                  <span className="text-xs bg-slate-800 text-slate-300 px-3 py-1 rounded-full">{f.brand}</span>
                </div>
                <h3 className="text-base font-bold text-white mb-3">{f.title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed mb-4 flex-1"><strong className="text-amber-400 block mb-1">السبب الفني:</strong> {f.cause}</p>
                <div className="bg-slate-950 p-4 rounded-xl border border-emerald-900/40 text-xs text-emerald-300 leading-relaxed font-bold"><strong className="block mb-1 text-emerald-400">الحل المقترح:</strong> {f.solution}</div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

/* ======================================================
  7. الحاسبات الأساسية (العامة)
  ====================================================== */
const PUBLIC_CALCULATORS = [
  { id: 'c1', title: 'السرعة الخطية', icon: Activity, group: 'درفلة', inputs: [{ k: 'd', l: 'قطر الدرفيل (mm)' }, { k: 'n', l: 'لفات الدرفيل (RPM)' }], calc: v => ({ 'السرعة الخطية (m/s)': ((Math.PI * (v.d||0) * (v.n||0)) / 60000).toFixed(2) }) },
  { id: 'c2', title: 'عدد لفات الدرفيل', icon: RotateCcw, group: 'درفلة', inputs: [{ k: 'v', l: 'السرعة (m/s)' }, { k: 'd', l: 'قطر الدرفيل (mm)' }], calc: v => ({ 'لفات الدرفيل (RPM)': ((v.v||0) * 60000 / (Math.PI * (v.d||1))).toFixed(1) }) },
  { id: 'c3', title: 'عدد لفات الموتور', icon: Gauge, group: 'درفلة', inputs: [{ k: 'nr', l: 'لفات الدرفيل (RPM)' }, { k: 'gr', l: 'نسبة الجيربوكس' }], calc: v => ({ 'لفات الموتور (RPM)': ((v.nr||0) * (v.gr||1)).toFixed(1) }) },
  { id: 'c4', title: 'إيجاد نسبة التخفيض', icon: DivideSquare, group: 'درفلة', inputs: [{ k: 'a1', l: 'مساحة الدخول (mm²)' }, { k: 'a2', l: 'مساحة الخروج (mm²)' }], calc: v => ({ 'نسبة التخفيض (%)': (((v.a1||0) - (v.a2||0)) / (v.a1||1) * 100).toFixed(1) }) },
  { id: 'c5', title: 'قانون ثبات الحجم', icon: Layers, group: 'درفلة', inputs: [{ k: 'a1', l: 'مساحة 1 (mm²)' }, { k: 'v1', l: 'سرعة 1 (m/s)' }, { k: 'a2', l: 'مساحة 2 (mm²)' }], calc: v => ({ 'سرعة الخروج V2 (m/s)': (((v.a1||0) * (v.v1||0)) / (v.a2||1)).toFixed(2) }) },
  { id: 'c6', title: 'حساب الاستطالة', icon: Maximize2, group: 'درفلة', inputs: [{ k: 'v1', l: 'سرعة الدخول (m/s)' }, { k: 'v2', l: 'سرعة الخروج (m/s)' }], calc: v => ({ 'نسبة الاستطالة (λ)': ((v.v2||0) / (v.v1||1)).toFixed(2) }) },
  { id: 'c7', title: 'مساحة مقطع دائري', icon: Circle, group: 'درفلة', inputs: [{ k: 'd', l: 'القطر (mm)' }], calc: v => ({ 'المساحة (mm²)': (Math.PI * Math.pow((v.d||0)/2, 2)).toFixed(2) }) },
  { id: 'c8', title: 'سرعة القائم السابق', icon: ArrowLeftRight, group: 'درفلة', inputs: [{ k: 'a2', l: 'مساحة الحالي (mm²)' }, { k: 'v2', l: 'سرعة الحالي (m/s)' }, { k: 'a1', l: 'مساحة السابق (mm²)' }], calc: v => ({ 'السرعة السابقة (m/s)': (((v.a2||0) * (v.v2||0)) / (v.a1||1)).toFixed(2) }) },
  { id: 'e1', title: 'وات (W) ← كيلووات (kW)', icon: Zap, group: 'كهرباء', inputs: [{ k: 'w', l: 'القدرة (Watt)' }], calc: v => ({ 'الكيلووات (kW)': ((v.w||0) / 1000).toFixed(2) }) },
  { id: 'e2', title: 'حصان (HP) ← كيلووات', icon: Zap, group: 'كهرباء', inputs: [{ k: 'hp', l: 'القدرة (HP)' }], calc: v => ({ 'الكيلووات (kW)': ((v.hp||0) * 0.7457).toFixed(2) }) },
  { id: 'e3', title: 'حساب أمبير موتور', icon: Cpu, group: 'كهرباء', inputs: [{ k: 'kw', l: 'القدرة (kW)' }, { k: 'v', l: 'الجهد (Volt) مثلا 380' }], calc: v => ({ 'التيار التقريبي (A)': ((v.kw||0) * 1000 / (Math.sqrt(3) * (v.v||1) * 0.85)).toFixed(1) }) }
];

const BasicCalculatorsGrid = () => {
  const [activeCalc, setActiveCalc] = useState(null);
  const [vals, setVals] = useState({});

  if (activeCalc) {
    const c = PUBLIC_CALCULATORS.find(x => x.id === activeCalc);
    const res = c.calc(vals);
    return (
      <div className="animate-in fade-in zoom-in duration-300">
        <button onClick={() => { setActiveCalc(null); setVals({}); }} className="mb-4 bg-slate-800 text-slate-300 px-5 py-2 rounded-xl text-sm font-bold hover:bg-slate-700 flex items-center gap-2"><RotateCcw size={16}/> العودة للقائمة</button>
        <div className="bg-slate-900 p-6 md:p-8 rounded-3xl border border-slate-800 max-w-2xl mx-auto shadow-2xl">
          <div className="flex items-center gap-3 mb-6 border-b border-slate-800 pb-5">
            <div className="bg-blue-600/20 p-3 rounded-2xl"><c.icon className="w-8 h-8 text-blue-500" /></div>
            <h2 className="text-2xl font-black text-white">{c.title}</h2>
          </div>
          <div className="space-y-5">
            {c.inputs.map(inp => (
              <div key={inp.k}>
                <label className="block text-sm font-bold text-slate-400 mb-2">{inp.l}</label>
                <input type="number" step="any" value={vals[inp.k] || ''} onChange={e => setVals({...vals, [inp.k]: Number(e.target.value)})} className="w-full bg-slate-950 border border-slate-700 rounded-xl p-4 text-white font-mono text-lg outline-none focus:border-blue-500 transition-colors shadow-inner" />
              </div>
            ))}
          </div>
          <div className="mt-8 bg-slate-950 p-6 rounded-2xl border border-blue-500/40 shadow-lg">
            {Object.entries(res).map(([k, v]) => (
              <div key={k} className="flex justify-between items-center">
                <span className="text-slate-300 font-bold text-lg">{k}</span>
                <span className="text-blue-400 font-black font-mono text-3xl">{v}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {['درفلة', 'كهرباء'].map(group => (
        <div key={group} className="bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-lg">
          <h3 className="text-xl font-black text-white mb-5 flex items-center gap-2"><div className="w-2 h-6 bg-blue-500 rounded-full"></div> حاسبات الـ {group}</h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {PUBLIC_CALCULATORS.filter(c => c.group === group).map(c => (
              <button key={c.id} onClick={() => setActiveCalc(c.id)} className="bg-slate-950 hover:bg-slate-800 border border-slate-800 hover:border-blue-500 p-5 rounded-2xl flex flex-col items-center gap-3 transition-all text-center group shadow-md hover:shadow-blue-900/20">
                <div className="bg-slate-800 p-4 rounded-2xl group-hover:scale-110 transition-transform"><c.icon className="w-7 h-7 text-blue-400" /></div>
                <span className="text-sm font-bold text-slate-200">{c.title}</span>
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

/* ======================================================
  8. البوابة العامة المجمعة (Public App)
  ====================================================== */
const PublicApp = ({ onBack }) => {
  const [activeTab, setActiveTab] = useState('basic');
  const tabs = [
    { id: 'basic', label: 'حاسبات سريعة', icon: Calculator },
    { id: 'advanced', label: 'حاسبات متقدمة', icon: Layers },
    { id: 'tables', label: 'الجداول والتحويلات', icon: Ruler },
    { id: 'community', label: 'مجتمع المهندسين', icon: MessageCircle }
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans p-2 sm:p-4" dir="rtl">
      <header className="max-w-6xl mx-auto mb-6 bg-slate-900 border border-slate-800 p-4 rounded-3xl flex flex-col md:flex-row justify-between items-center gap-4 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 p-2 rounded-xl shadow-lg"><Calculator className="text-white" size={24} /></div>
          <div><h1 className="text-xl font-black text-white leading-tight">بوابة المهندسين العامة</h1><p className="text-xs text-slate-400 font-bold">أدوات، حسابات، ومجتمع الدرفلة</p></div>
        </div>
        <div className="flex bg-slate-950 p-1.5 rounded-2xl border border-slate-800 overflow-x-auto max-w-full">
          {tabs.map(t => (
            <button key={t.id} onClick={() => setActiveTab(t.id)} className={`px-4 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 whitespace-nowrap transition-all ${activeTab === t.id ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}>
              <t.icon size={16} /> <span className="hidden sm:inline">{t.label}</span>
            </button>
          ))}
        </div>
        <button onClick={onBack} className="bg-red-500/10 text-red-400 hover:bg-red-500/20 font-bold px-5 py-2.5 rounded-xl text-sm transition-colors border border-red-500/20 flex-shrink-0">خروج</button>
      </header>
      <main className="max-w-6xl mx-auto">
        {activeTab === 'basic' && <BasicCalculatorsGrid />}
        {activeTab === 'advanced' && (
          <div className="space-y-6">
            <PassDesignCalc />
            <BarsCountCalc />
          </div>
        )}
        {activeTab === 'tables' && (
          <div className="space-y-6">
            <UnitConverterTool />
            <RebarTable />
          </div>
        )}
        {activeTab === 'community' && <SocialFeedAndFaults />}
      </main>
    </div>
  );
};

/* ======================================================
  9. بوابة المصنع المغلقة (Factory SaaS App)
  ====================================================== */
const FactoryApp = ({ onBack }) => {
  const [currentUser, setCurrentUser] = useState('none');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [userAuth, setUserAuth] = useState(null);
  const appId = 'al-gioshy-steel-rolls';

  const isManagerLike = currentUser === 'manager' || currentUser === 'admin';
  const roleLabel = currentUser === 'tech' ? 'مهندس إنتاج' : currentUser === 'manager' ? 'مدير المصنع' : 'أدمن';

  const [stands, setStands] = useState(buildInitialStands);
  const [reportsList, setReportsList] = useState([]);
  const [motorsList, setMotorsList] = useState([]);
  const [adminState, setAdminState] = useState({ techCode: '1111', managerCode: '2222', adminCode: '9999' });
  const [loginPrompt, setLoginPrompt] = useState({ isOpen: false, role: '', codeInput: '', error: '' });

  const [newReport, setNewReport] = useState('');
  const [newMotor, setNewMotor] = useState({ stand: '1', code: '', kw: '', rpm: '' });

  useEffect(() => {
    if (!auth) return;
    signInAnonymously(auth).catch(e => console.error(e));
    const unsub = onAuthStateChanged(auth, setUserAuth);
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!userAuth || !db) return;
    const ref = (name) => doc(db, 'factory', appId, 'data', name);
    const u1 = onSnapshot(ref('standsState'), snap => { if (snap.exists()) setStands(normalizeList(snap.data().standsList)); });
    const u2 = onSnapshot(ref('adminState'), snap => { if (snap.exists()) setAdminState(prev => ({ ...prev, ...snap.data() })); });
    const u3 = onSnapshot(ref('reportsState'), snap => { if (snap.exists()) setReportsList(snap.data().reports || []); });
    const u4 = onSnapshot(ref('motorsState'), snap => { if (snap.exists()) setMotorsList(snap.data().motors || []); });
    return () => { u1(); u2(); u3(); u4(); };
  }, [userAuth]);

  const save = async (updates) => {
    if (userAuth && db) {
      const ref = (name) => doc(db, 'factory', appId, 'data', name);
      if (updates.reports) await setDoc(ref('reportsState'), { reports: updates.reports });
      if (updates.motors) await setDoc(ref('motorsState'), { motors: updates.motors });
      if (updates.stands) await setDoc(ref('standsState'), { standsList: updates.stands });
    } else {
      if (updates.reports) setReportsList(updates.reports);
      if (updates.motors) setMotorsList(updates.motors);
      if (updates.stands) setStands(updates.stands);
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

  const handleAddReport = () => {
    if (!newReport.trim()) return;
    const rep = { id: Date.now(), text: newReport, date: new Date().toLocaleString('ar-EG'), by: roleLabel };
    save({ reports: [rep, ...reportsList] });
    setNewReport('');
  };

  const handleAddMotor = () => {
    if (!newMotor.code || !newMotor.kw) return;
    const m = { id: Date.now(), ...newMotor, dateAdded: new Date().toLocaleDateString('ar-EG') };
    save({ motors: [m, ...motorsList] });
    setNewMotor({ stand: '1', code: '', kw: '', rpm: '' });
  };

  const addPassTonnage = (id, tons) => {
    const ns = stands.map(s => String(s.id) === String(id) ? { 
      ...s, accumulatedTons: s.accumulatedTons + tons, 
      passes: s.passes.map(p => p.passNumber === s.activePass ? { ...p, tons: p.tons + tons } : p) 
    } : s);
    save({ stands: ns });
  };

  const nextPass = (id) => {
    const ns = stands.map(s => {
      if (String(s.id) !== String(id)) return s;
      const next = s.activePass < s.totalPasses ? s.activePass + 1 : 1;
      return { 
        ...s, activePass: next, accumulatedTons: 0,
        passes: s.passes.map(p => p.passNumber === s.activePass ? { ...p, status: 'used' } : p.passNumber === next ? { ...p, status: 'active', tons: 0 } : p)
      };
    });
    save({ stands: ns });
  };

  if (currentUser === 'none') {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 animate-in fade-in zoom-in duration-500" dir="rtl">
        {loginPrompt.isOpen && (
          <Overlay z={90}>
            <form onSubmit={handleVerifyAccessCode} className="bg-slate-800 border border-slate-600 rounded-2xl max-w-xs w-full p-6 shadow-2xl flex flex-col gap-4 text-white">
              <div className="flex justify-between items-center border-b border-slate-700 pb-3">
                <h3 className="font-bold text-base flex items-center gap-2"><Key size={18} className="text-emerald-400" /> كود دخول ({loginPrompt.role === 'tech' ? 'الإنتاج' : 'الإدارة'})</h3>
                <button type="button" onClick={() => setLoginPrompt({ isOpen: false })}><X className="w-5 h-5 text-slate-400 hover:text-white" /></button>
              </div>
              <input type="password" autoFocus value={loginPrompt.codeInput} onChange={(e) => setLoginPrompt(p => ({ ...p, codeInput: e.target.value, error: '' }))} className="w-full bg-slate-900 border border-slate-600 rounded-xl p-3 text-center font-mono text-xl tracking-widest text-white outline-none focus:border-emerald-500 shadow-inner" placeholder="****" />
              {loginPrompt.error && <p className="text-red-400 text-xs font-bold text-center bg-red-950/50 p-2 rounded-lg border border-red-900">{loginPrompt.error}</p>}
              <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl shadow-lg transition-transform active:scale-95 text-sm">تأكيد الدخول</button>
            </form>
          </Overlay>
        )}
        <div className="bg-slate-900 p-10 rounded-3xl border border-slate-800 text-center max-w-md w-full shadow-2xl">
          <div className="bg-emerald-950 border border-emerald-800 p-4 rounded-2xl inline-block mb-6 shadow-inner"><Building2 className="w-14 h-14 text-emerald-500" /></div>
          <h1 className="text-3xl font-black text-white mb-2">بوابة الجيوشي للصلب</h1>
          <p className="text-slate-400 text-sm font-bold mb-8">إدارة كاملة للممرات وسجلات الصيانة</p>
          <button onClick={() => setLoginPrompt({ isOpen: true, role: 'tech' })} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3.5 rounded-xl mb-3 flex items-center justify-center gap-2 shadow-lg transition-transform active:scale-95"><Edit3 className="w-5 h-5"/> تسجيل فني إنتاج</button>
          <button onClick={() => setLoginPrompt({ isOpen: true, role: 'manager' })} className="w-full bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white font-bold py-3.5 rounded-xl mb-6 flex items-center justify-center gap-2 shadow-lg transition-transform active:scale-95"><TrendingUp className="w-5 h-5"/> تسجيل إدارة المصنع</button>
          <button onClick={onBack} className="text-slate-500 hover:text-white text-xs font-bold flex items-center justify-center gap-1 mx-auto"><RotateCcw size={14}/> العودة للقائمة الرئيسية</button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-dvh bg-slate-950 text-slate-200 font-sans flex flex-col p-2 gap-2 overflow-hidden animate-in fade-in duration-500" dir="rtl">
      <nav className="bg-slate-900 text-white p-3 rounded-2xl flex flex-col sm:flex-row justify-between items-center gap-3 border border-slate-800 shadow-lg flex-none">
        <div className="flex justify-between items-center w-full sm:w-auto">
          <div className="flex items-center gap-3">
            <div className="bg-emerald-600/20 p-2 rounded-xl"><Building2 className="w-6 h-6 text-emerald-500" /></div>
            <div><span className="font-black text-lg block leading-tight">الجيوشي للصلب</span><span className="text-[10px] text-slate-400 font-bold">بوابة المصنع الخاصة</span></div>
          </div>
        </div>
        <div className="flex gap-2 overflow-x-auto bg-slate-950 p-1.5 rounded-xl border border-slate-800 w-full sm:w-auto">
          {[
            ['dashboard', 'شاشة الممرات', Layers],
            ['reports', 'تقارير الورديات', FileSignature],
            ['motors', 'سجل المواتير', Cpu],
          ].map(([k, label, Icon]) => (
            <button key={k} onClick={() => setActiveTab(k)} className={`flex-1 sm:flex-none min-w-[110px] px-3 py-2 text-xs font-bold rounded-lg flex justify-center items-center gap-1.5 transition-all ${activeTab === k ? 'bg-emerald-600 text-white shadow' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}><Icon className="w-4 h-4" /> {label}</button>
          ))}
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
          <span className="bg-slate-800 border border-slate-700 px-3 py-1.5 rounded-lg text-xs text-emerald-400 font-bold flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_5px_#10b981]"></div> {roleLabel}</span>
          <button onClick={() => { setCurrentUser('none'); onBack(); }} className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-red-500/20 transition-colors">خروج</button>
        </div>
      </nav>

      {/* شاشة الدرافيل */}
      {activeTab === 'dashboard' && (
        <div className="flex-1 bg-slate-900 rounded-2xl border border-slate-800 p-4 overflow-y-auto">
          <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
            <h2 className="text-xl font-black text-white flex items-center gap-2"><Layers className="text-emerald-500"/> متابعة الممرات والدرافيل الحية</h2>
            <LiveClock />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-10">
            {stands.map((st) => {
              const usagePct = Math.min(100, Math.max(0, (st.accumulatedTons / st.maxLimit) * 100));
              const isDanger = usagePct >= 95;
              return (
                <div key={st.id} className="bg-slate-950 border border-slate-800 rounded-2xl p-4 flex flex-col shadow-lg hover:border-emerald-500/50 transition-colors">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="text-lg font-black text-white">{st.name}</h3>
                      <span className="text-xs text-slate-400 font-bold">{st.type} | {st.diameter} مم</span>
                    </div>
                    <span className="text-xs font-mono font-black bg-emerald-900/40 text-emerald-400 border border-emerald-500/30 px-2 py-1 rounded-lg">ممر {st.activePass}/{st.totalPasses}</span>
                  </div>
                  <div className="flex-1 flex flex-col justify-center items-center py-4 bg-slate-900 rounded-xl border border-slate-800 mb-3 relative overflow-hidden">
                     <div className="absolute bottom-0 left-0 w-full h-1.5 bg-slate-800">
                        <div className={`h-full ${isDanger ? 'bg-red-500' : 'bg-emerald-500'}`} style={{ width: `${usagePct}%` }} />
                     </div>
                     <span className={`font-mono font-black text-4xl ${isDanger ? 'text-red-400' : 'text-white'}`}>{st.accumulatedTons.toFixed(0)}</span>
                     <span className="text-[10px] text-slate-500 font-bold mt-1">طن منتج على الممر الحالي (أقصى: {st.maxLimit})</span>
                  </div>
                  {isManagerLike && (
                    <div className="grid grid-cols-2 gap-2 mt-auto">
                      <button onClick={() => addPassTonnage(st.id, 50)} className="bg-slate-800 hover:bg-slate-700 text-white py-2 rounded-xl text-xs font-bold shadow">+ 50 طن</button>
                      <button onClick={() => nextPass(st.id)} className="bg-emerald-600/20 hover:bg-emerald-600/30 border border-emerald-500/30 text-emerald-400 py-2 rounded-xl text-xs font-bold shadow">نقل للممر التالي</button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* شاشة التقارير */}
      {activeTab === 'reports' && (
        <div className="flex-1 bg-slate-900 rounded-2xl border border-slate-800 p-4 sm:p-6 overflow-y-auto flex flex-col gap-5">
          <h2 className="text-xl font-black text-white flex items-center gap-2 border-b border-slate-800 pb-3"><FileSignature className="text-blue-500" /> التقارير الفنية للورديات</h2>
          <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 shadow-lg">
            <label className="block text-sm font-bold text-slate-300 mb-2">إضافة تقرير جديد:</label>
            <textarea value={newReport} onChange={e => setNewReport(e.target.value)} rows="3" placeholder="اكتب تقرير الوردية (أعطال، توقفات، ملاحظات فنية)..." className={inputCls + " resize-none mb-3"}></textarea>
            <div className="flex justify-end"><button onClick={handleAddReport} className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-8 py-2.5 rounded-xl shadow text-sm">حفظ في الأرشيف</button></div>
          </div>
          <div className="space-y-4">
            {reportsList.map(rep => (
              <div key={rep.id} className="bg-slate-950 p-5 rounded-2xl border border-slate-800 shadow-md">
                <div className="flex justify-between text-xs text-slate-400 font-bold mb-3 border-b border-slate-800 pb-2">
                  <span className="flex items-center gap-1.5"><UserCog size={14} className="text-blue-400"/> بواسطة: {rep.by}</span><span dir="ltr" className="font-mono bg-slate-900 px-2 py-1 rounded-md">{rep.date}</span>
                </div>
                <p className="text-sm text-slate-200 whitespace-pre-line leading-relaxed">{rep.text}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* شاشة المواتير */}
      {activeTab === 'motors' && (
        <div className="flex-1 bg-slate-900 rounded-2xl border border-slate-800 p-4 sm:p-6 overflow-y-auto flex flex-col gap-5">
          <h2 className="text-xl font-black text-white flex items-center gap-2 border-b border-slate-800 pb-3"><Cpu className="text-emerald-500" /> سجل المواتير والدرايفات (Motors Log)</h2>
          {isManagerLike && (
            <div className="bg-slate-950 p-5 rounded-2xl border border-slate-800 shadow-lg grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-4 items-end">
              <div><label className="block text-xs font-bold text-slate-400 mb-1.5">اختر الستاند:</label><select value={newMotor.stand} onChange={e=>setNewMotor({...newMotor, stand: e.target.value})} className={inputCls}>{stands.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
              <div><label className="block text-xs font-bold text-slate-400 mb-1.5">كود/سيريال:</label><input type="text" value={newMotor.code} onChange={e=>setNewMotor({...newMotor, code: e.target.value})} className={inputCls} placeholder="مثال: SIEMENS-X1"/></div>
              <div><label className="block text-xs font-bold text-slate-400 mb-1.5">القدرة (kW):</label><input type="number" value={newMotor.kw} onChange={e=>setNewMotor({...newMotor, kw: e.target.value})} className={inputCls} placeholder="مثال: 600"/></div>
              <div><label className="block text-xs font-bold text-slate-400 mb-1.5">Max RPM:</label><input type="number" value={newMotor.rpm} onChange={e=>setNewMotor({...newMotor, rpm: e.target.value})} className={inputCls} placeholder="مثال: 1500"/></div>
              <button onClick={handleAddMotor} className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl shadow md:col-span-1 text-sm">تسجيل الموتور</button>
            </div>
          )}
          <div className="bg-slate-950 rounded-2xl border border-slate-800 overflow-x-auto shadow-lg">
            <table className="w-full text-right text-sm min-w-[600px]">
              <thead className="bg-slate-900 border-b border-slate-800 text-slate-400 text-xs"><tr><th className="p-4 rounded-tr-xl">الستاند</th><th className="p-4">سيريال الموتور</th><th className="p-4">القدرة (kW)</th><th className="p-4">Max RPM</th><th className="p-4 rounded-tl-xl">تاريخ التركيب</th></tr></thead>
              <tbody className="divide-y divide-slate-800/50 font-mono">
                {motorsList.map(m => (
                  <tr key={m.id} className="hover:bg-slate-900/50 transition-colors">
                    <td className="p-4 font-bold text-white flex items-center gap-2"><div className="w-2 h-2 bg-emerald-500 rounded-full"></div> ستاند {m.stand}</td>
                    <td className="p-4 text-slate-300">{m.code}</td><td className="p-4 text-emerald-400 font-bold text-base">{m.kw} kW</td><td className="p-4 text-amber-400 font-bold">{m.rpm}</td><td className="p-4 text-slate-500 text-xs">{m.dateAdded}</td>
                  </tr>
                ))}
                {motorsList.length === 0 && <tr><td colSpan="5" className="p-8 text-center text-slate-500 font-bold">لم يتم تسجيل أي مواتير حتى الآن.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

/* ======================================================
  10. المدخل الرئيسي (App Gateway)
  ====================================================== */
export default function App() {
  const [appMode, setAppMode] = useState('select'); // 'select' | 'public' | 'factory'

  if (appMode === 'public') return <PublicApp onBack={() => setAppMode('select')} />;
  if (appMode === 'factory') return <FactoryApp onBack={() => setAppMode('select')} />;

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden" dir="rtl">
      {/* Background Decorative Elements */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-600/10 blur-[120px] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-emerald-600/10 blur-[120px] rounded-full pointer-events-none"></div>
      
      <div className="max-w-4xl w-full z-10">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-black text-white mb-4 tracking-tight">Steel<span className="text-blue-500">Portal</span> Gateway</h1>
          <p className="text-slate-400 font-bold text-sm md:text-base">اختر بيئة العمل المناسبة لاحتياجاتك</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
          <div onClick={() => setAppMode('public')} className="group bg-slate-900 border-2 border-slate-800 hover:border-blue-500 p-8 sm:p-10 rounded-[2rem] text-center flex flex-col items-center cursor-pointer transition-all hover:shadow-[0_0_40px_rgba(59,130,246,0.15)] hover:-translate-y-2">
            <div className="w-24 h-24 bg-gradient-to-br from-blue-900/40 to-blue-600/20 rounded-3xl flex items-center justify-center mb-6 border border-blue-500/20 group-hover:scale-110 transition-transform duration-300">
              <Calculator className="w-12 h-12 text-blue-400" />
            </div>
            <h2 className="text-3xl font-black text-white mb-4">بوابة المهندسين</h2>
            <p className="text-sm text-slate-400 mb-8 leading-relaxed font-bold">تضم أقوى حاسبات الدرفلة، الكهرباء، حساب أطوال الأسياخ وتصميم الممرات بجانب مجتمع فني تفاعلي للمهندسين.</p>
            <div className="mt-auto w-full bg-blue-600 group-hover:bg-blue-500 text-white font-black py-4 rounded-2xl transition-colors shadow-lg shadow-blue-900/20">دخول مجاني (Public)</div>
          </div>

          <div onClick={() => setAppMode('factory')} className="group bg-slate-900 border-2 border-slate-800 hover:border-emerald-500 p-8 sm:p-10 rounded-[2rem] text-center flex flex-col items-center cursor-pointer transition-all hover:shadow-[0_0_40px_rgba(16,185,129,0.15)] hover:-translate-y-2">
            <div className="w-24 h-24 bg-gradient-to-br from-emerald-900/40 to-emerald-600/20 rounded-3xl flex items-center justify-center mb-6 border border-emerald-500/20 group-hover:scale-110 transition-transform duration-300">
              <Building2 className="w-12 h-12 text-emerald-400" />
            </div>
            <h2 className="text-3xl font-black text-white mb-4">نظام المصانع SaaS</h2>
            <p className="text-sm text-slate-400 mb-8 leading-relaxed font-bold">بوابة مغلقة ومؤمنة للمصانع، لإدارة عمر الدرافيل والممرات، تسجيل الورديات، ومتابعة سجلات المواتير الحية.</p>
            <div className="mt-auto w-full bg-emerald-600 group-hover:bg-emerald-500 text-white font-black py-4 rounded-2xl transition-colors shadow-lg shadow-emerald-900/20">تسجيل الدخول (Enterprise)</div>
          </div>
        </div>
        
        <div className="mt-12 text-center text-slate-500 text-xs font-bold">
          تم تصميم وتطوير النظام بواسطة <span className="text-blue-400">م. بسام وليد</span> © 2026
        </div>
      </div>
    </div>
  );
}
