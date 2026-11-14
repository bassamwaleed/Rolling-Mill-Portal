import React, { useState, useEffect, useRef } from 'react';
import {
  UserCog, Edit3, TrendingUp, AlertTriangle, CheckCircle, RotateCcw,
  Save, Power, Settings2, Archive, CalendarDays, List, BarChart3, RefreshCw,
  Sliders, Trash2, Clock, Settings, X, UploadCloud, History,
  ShieldAlert, Key, Eye, Layers, Wrench, ArrowLeftRight,
  FileSpreadsheet, FileText, Inbox, Check, XCircle, Hourglass,
  Calculator, Zap, Gauge, Circle, Maximize2, Activity, Cpu,
  MessageCircle, ThumbsUp, PlusCircle, Search, Building2,
  ArrowRight, Boxes, Flame, Ruler, Scissors, ClipboardList
} from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, setDoc, onSnapshot } from 'firebase/firestore';

/* ============================================================================
  1. إعدادات قاعدة البيانات (Firebase)
============================================================================ */
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

/* ============================================================================
  2. البيانات الأولية للكميونتي، الأعطال، المواصفات، والمواتير
============================================================================ */
const INITIAL_POSTS = [
  {
    id: 'p1',
    author: 'م. بسام وليد',
    role: 'مشغل أول غرفة تحكم رئيسية & مؤسس المنصة',
    badge: 'Admin',
    time: 'منذ ساعتين',
    category: 'فنيات تشغيل الكنترول',
    title: 'إزاي تعرف فيه شد (Tension) ولا انضغاط (Loop) بين قائمين في التخشين من شاشة الأمبير؟',
    content:
      'طريقة عملية من غرفة التحكم الرئيسية (HMI): لو فرضنا إن أمبير قائم (2) كان 1500 أمبير أول ما المعدن دخل فيه، ولما رأس البيليت دخلت في قائم (3) لاحظت إن أمبير قائم (2) نزل فجأة لـ 1200 أمبير.. ده معناه وجود شد (Tension) بين القائمين ولازم نهدي سرعة قائم 3 أو نرفع سرعة قائم 1 و 2. العكس لو الأمبير زاد لـ 1700 أمبير فده معناه انضغاط (Compression) وبداية تكوين لوب!',
    likes: 28,
    liked: false,
    comments: [
      {
        id: 'c101',
        user: 'م. إسلام عرفات',
        role: 'مهندس درفلة',
        text: 'شرح ممتاز يا هندسة، وده اللي بنسميه في الأوتوميشن Minimum Tension Control (MTC) في منطقة الرفنج.',
        time: 'منذ ساعة'
      },
      {
        id: 'c102',
        user: 'فني تشغيل أول',
        role: 'غرفة التحكم',
        text: 'فعلاً متابعة أمبير ق12 وق13 مهمة جداً خصوصاً في مقاس 10 مم و 12 مم لضبط الجاب.',
        time: 'منذ 45 دقيقة'
      }
    ]
  },
  {
    id: 'p2',
    author: 'م. عادل عزالدين',
    role: 'مهندس أتمتة وتحكم صناعي',
    badge: 'خبير',
    time: 'منذ 5 ساعات',
    category: 'أسرار الدرفلة والـ Tempcore',
    title: 'ليه بننقل أسياخ الحديد على سرير التبريد (Cooling Bed) سيخ ورا سيخ مش مجموعة مع بعض؟',
    content:
      'بعد خروج السيخ من صندوق التبريد (Quenching Box) عند حرارة حوالي 700 درجة، القلب الداخلي الساخن بيعمل مراجعة ذاتية للسطح (Self-Tempering) عشان يكون طبقة Tempered Martensite الصلبة. لو الأسياخ اتنقلت فوق بعضها كمجموعة هيحصل انتقال حرارة بالتوصيل بينهم وتبوظ عملية الـ Tempcore وتقل رتبة وإجهاد الحديد!',
    likes: 42,
    liked: false,
    comments: [
      {
        id: 'c103',
        user: 'م. أحمد طارق',
        role: 'مهندس جودة',
        text: 'معلومة ذهبية! وعشان كدا ضبط عدد العلب المغلقة في الأبرون بيفرق جداً في مسافة الرمي.',
        time: 'منذ 3 ساعات'
      }
    ]
  }
];

const INITIAL_FAULTS = [
  {
    id: 'f1',
    code: 'LAPS / قشرة',
    brand: 'عيوب الدرفلة والمنتج',
    title: 'ظهور شرخ ظاهري أو قشرة بطول السيخ (Laps Defect)',
    cause: 'حدوث امتلاء زائد (Overfill) في أحد الممرات مع دخول المعدن للممر التالي بزاوية غير مضبوطة فيتم طي الشنب ودرفلته.',
    solution: 'افحص خلوص الممر السابق، راجع سنترية دليل الدخول (Entry Guide)، واعمل اختبار ثني (Bending Test) للعينة.'
  },
  {
    id: 'f2',
    code: 'FINS / شنب',
    brand: 'عيوب الدرفلة والمنتج',
    title: 'ظهور نتوء طولي أكبر من المسموح (من جانب واحد أو جانبين)',
    cause: 'من الجانبين: غلق جاب القائم النهائي زيادة عن اللزوم أو زيادة معدن من القوائم السابقة. من جانب واحد: عدم سنترية دليل الدخول أو انهيار رولمان بلي الدليل البكري.',
    solution: 'افحص Core Dimension ووزن المتر الطولي؛ لو القلب أقل من الطبيعي افتح جاب القائم النهائي، وراجع سنترية وبكر دليل الدخول.'
  },
  {
    id: 'f3',
    code: 'NO-RIB / أملس',
    brand: 'عيوب الدرفلة والمنتج',
    title: 'اختفاء النتوء الطولي (الشنب) أو نقص وزن المتر الطولي',
    cause: 'انخفاض تدفق المعدن من القوائم السابقة، فتح جاب القائم النهائي زيادة عن اللزوم، أو وجود شد عالي (High Tension) بين القوائم.',
    solution: 'راجع ارتفاع اللوابر لمنع الشد، واضبط جاب القائم النهائي وما قبل النهائي.'
  },
  {
    id: 'f4',
    code: 'F0001 / Overcurrent',
    brand: 'Siemens SINAMICS Drives',
    title: 'فصل الإنفرتر تيار زائد مفاجئ أثناء دخول المعدن',
    cause: 'دخول بيليت بارد، نسبة تخفيض عالية جداً، أو زاوية عض أكبر من الحد المسموح.',
    solution: 'راجع حرارة البيليت، تأكد من تفعيل الـ Lead/Over Speed (2% - 5%) لتحسين عض مقدمة المعدن، وافحص كابلات الموتور.'
  }
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

const INITIAL_MOTORS = [
  ...Array.from({ length: 12 }, (_, i) => ({
    id: `m-st-${i + 1}`,
    location: `ستاند ${i + 1}`,
    category: i < 4 ? 'تخشين' : i < 8 ? 'متوسط' : 'تشطيب',
    serial: `MTR-G${101 + i}`,
    brand: 'Siemens / ABB',
    kw: i < 4 ? 450 : i < 8 ? 550 : 650,
    voltage: 400,
    ratedAmp: i < 4 ? 810 : i < 8 ? 980 : 1150,
    baseRpm: 1000,
    maxRpm: 1750,
    gearRatio: (4.2 - i * 0.25).toFixed(2),
    installDate: '01/01/2026',
    status: 'يعمل بالخط',
    notes: 'حالة ممتازة - تبريد قسري'
  })),
  {
    id: 'm-sh-1', location: 'مقص طائر 1 (Crop Shear)', category: 'مقصات',
    serial: 'SH-MTR-01', brand: 'Siemens DC/AC', kw: 250, voltage: 400, ratedAmp: 460,
    baseRpm: 1200, maxRpm: 2000, gearRatio: '3.50', installDate: '15/02/2026', status: 'يعمل بالخط', notes: 'قص الرأس والذيل'
  },
  {
    id: 'm-sh-2', location: 'مقص الديفايدنج (Dividing Shear)', category: 'مقصات',
    serial: 'SH-MTR-02', brand: 'Siemens', kw: 315, voltage: 400, ratedAmp: 580,
    baseRpm: 1500, maxRpm: 2200, gearRatio: '2.80', installDate: '10/03/2026', status: 'يعمل بالخط', notes: 'تقسيم أطوال سرير التبريد'
  },
  {
    id: 'm-pr-1', location: 'بنش رول 1 (Pinch Roll 1)', category: 'تشطيب وسرير تبريد',
    serial: 'PR-MTR-01', brand: 'ABB', kw: 75, voltage: 380, ratedAmp: 145,
    baseRpm: 1480, maxRpm: 2400, gearRatio: '1.50', installDate: '20/01/2026', status: 'يعمل بالخط', notes: 'سحب السيخ قبل المقص'
  },
  {
    id: 'm-pr-2', location: 'بنش رول 2 (Pinch Roll 2)', category: 'تشطيب وسرير تبريد',
    serial: 'PR-MTR-02', brand: 'ABB', kw: 75, voltage: 380, ratedAmp: 145,
    baseRpm: 1480, maxRpm: 2400, gearRatio: '1.50', installDate: '20/01/2026', status: 'يعمل بالخط', notes: 'فرملة ورمي على الأبرون'
  }
];

const INITIAL_REPORTS = [
  {
    id: 'rep-1',
    date: '14/11/2026',
    time: '04:00 م',
    shift: 'الوردية الأولى',
    author: 'م. بسام وليد',
    category: 'تقرير تشغيل وكنترول',
    productSize: '16',
    status: 'تم الحل',
    title: 'ضبط سرعات منطقة التشطيب ومنع الشد بين ق10 وق11',
    details: 'تم ملاحظة انخفاض أمبير ستاند 10 بمقدار 180 أمبير لحظة دخول المعدن في ستاند 11، تم تقليل سرعة ستاند 11 بنسبة 1.5% وضبط ارتفاع اللوبر، واستقر الوزن على 1.580 كجم/م.'
  }
];

/* ============================================================================
  3. إعدادات الـ 12 ستاند ودوال المصنع (من ملفك الأصلي بالكامل)
============================================================================ */
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
  { type: 'بيضاوي تشطيب', rollCode: '1101', diameter: '320', hardness: '52 HRC', totalPasses: 24, maxLimit: 1000 },
  { type: 'مشرشر نهائي', rollCode: 'F12-K1', diameter: '310', hardness: '54 HRC', totalPasses: 24, maxLimit: 1000 }
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
  return {
    id: cfg.id, name: cfg.name, type: cfg.type, rollCode: cfg.rollCode,
    diameter: cfg.diameter, hardness: cfg.hardness, entryDate: todayGB,
    totalPasses: cfg.totalPasses, activePass: 1,
    passes: createPassesArray(cfg.totalPasses, 1, 0),
    isActive: true, accumulatedTons: 0, maxLimit: cfg.maxLimit, lastResetDate: todayGB
  };
};
const buildInitialStands = () => DEFAULT_STANDS_CONFIG.map(buildStand);

const normalizeStand = (stand, cfg) => {
  const totalPasses = stand.totalPasses || cfg.totalPasses || 10;
  const activePass = stand.activePass || 1;
  const currentTons = stand.accumulatedTons || 0;
  let passes = stand.passes;
  if (!Array.isArray(passes) || passes.length !== totalPasses) {
    passes = createPassesArray(totalPasses, activePass, currentTons);
  } else {
    passes = passes.map(p => p.passNumber === activePass
      ? { ...p, status: 'active', tons: currentTons, order: p.order || 1 } : p);
  }
  return {
    ...stand,
    id: cfg.id,
    name: cfg.name,
    type: stand.type ?? cfg.type,
    rollCode: stand.rollCode ?? cfg.rollCode,
    diameter: stand.diameter ?? cfg.diameter,
    hardness: stand.hardness ?? cfg.hardness,
    entryDate: stand.entryDate || stand.lastResetDate || new Date().toLocaleDateString('en-GB'),
    maxLimit: stand.maxLimit || cfg.maxLimit,
    totalPasses, activePass, passes
  };
};

const normalizeList = (raw) =>
  DEFAULT_STANDS_CONFIG.map(cfg => {
    const found = (raw || []).find(s => String(s.id) === cfg.id);
    return found ? normalizeStand(found, cfg) : buildStand(cfg);
  });

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

const formatDateToISO = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
const formatDateToGB = (iso) => { if (!iso) return ''; const [y, m, d] = iso.split('-'); return `${d}/${m}/${y}`; };
const convertGBToISO = (gb) => {
  if (!gb || !gb.includes('/')) return formatDateToISO(new Date());
  const p = gb.split('/');
  if (p.length !== 3) return formatDateToISO(new Date());
  return `${p[2]}-${p[1].padStart(2, '0')}-${p[0].padStart(2, '0')}`;
};

const esc = (s) => String(s ?? '').replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));

const buildReportHTML = ({ stands, archive, changes, billetWeight, motors = [], reports = [] }) => {
  const now = new Date().toLocaleString('ar-EG');
  const th = (arr) => `<tr>${arr.map(h => `<th>${esc(h)}</th>`).join('')}</tr>`;
  const td = (arr) => `<tr>${arr.map(c => `<td>${esc(c)}</td>`).join('')}</tr>`;

  const standsRows = stands.map(s => {
    const total = s.passes.reduce((a, p) => a + (Number(p.tons) || 0), 0);
    return td([s.name, s.type, s.diameter, s.entryDate, `${s.activePass} / ${s.totalPasses}`,
      s.accumulatedTons.toFixed(0), s.maxLimit, `${Math.round((s.accumulatedTons / s.maxLimit) * 100)}%`, total.toFixed(0)]);
  }).join('');

  const logs = [...archive].sort((a, b) => b.timestamp - a.timestamp);
  const archiveRows = logs.map(l => td([l.date, l.dayName, l.shift, l.productSize || '', l.billets, l.tons.toFixed(1), l.time])).join('');
  const sumT = logs.reduce((a, l) => a + l.tons, 0).toFixed(1);
  const sumB = logs.reduce((a, l) => a + l.billets, 0);

  const changeRows = changes.map(c => td([c.date, c.shift, c.standName,
    c.kind === 'newRoll' ? 'تركيب درفيل جديد' : `ممر ${c.fromPass} ← ممر ${c.toPass}`,
    Number(c.tons).toFixed(1), c.billetsAtChange || 0, c.productSize || '', c.notes || ''])).join('');

  const motorRows = motors.map(m => td([m.location, m.serial, `${m.kw} kW`, `${m.ratedAmp} A`, `${m.baseRpm}/${m.maxRpm}`, m.gearRatio, m.installDate, m.status])).join('');
  const reportRows = reports.map(r => td([r.date, r.shift, r.author, r.category, r.title, r.details, r.status])).join('');

  return `<html dir="rtl" lang="ar" xmlns:x="urn:schemas-microsoft-com:office:excel"><head><meta charset="UTF-8">
<title>تقرير الجيوشي للصلب الشامل</title>
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
<h1>شركة الجيوشي للصلب - التقرير الهندسي الشامل</h1>
<div class="meta">تاريخ التقرير: ${esc(now)} | وزن البليت: ${esc(billetWeight)} طن</div>
<h2>حالة الستاندات والدرافيل</h2>
<table>${th(['الستاند', 'الشكل', 'القطر', 'تاريخ دخول الدرفيل', 'الممر الحالي', 'إنتاج الممر الحالي (طن)', 'الحد الأقصى', 'النسبة', 'إجمالي إنتاج الدرفيل (طن)'])}${standsRows}</table>
<h2>سجل الإنتاج اليومي</h2>
<table>${th(['التاريخ', 'اليوم', 'الوردية', 'المقاس', 'البليت', 'الطن', 'وقت التسجيل'])}${archiveRows}
<tr class="tot"><td colspan="4">الإجمالي</td><td>${sumB}</td><td>${sumT}</td><td></td></tr></table>
<h2>سجل تغيير الممرات والدرافيل</h2>
<table>${th(['التاريخ', 'الوردية', 'الستاند', 'التغيير', 'إنتاج الممر (طن)', 'بليت', 'المقاس', 'ملاحظات'])}${changeRows}</table>
<h2>سجل المواتير والمعدات</h2>
<table>${th(['المكان', 'السيريال', 'القدرة', 'الأمبير', 'RPM', 'الجيربوكس', 'تاريخ التركيب', 'الحالة'])}${motorRows}</table>
<h2>التقارير الفنية للورديات</h2>
<table>${th(['التاريخ', 'الوردية', 'المهندس', 'التصنيف', 'العنوان', 'التفاصيل', 'الحالة'])}${reportRows}</table>
</body></html>`;
};

const downloadExcel = (data) => {
  const html = '\ufeff' + buildReportHTML(data);
  const blob = new Blob([html], { type: 'application/vnd.ms-excel;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `تقرير-الجيوشي-${formatDateToISO(new Date())}.xls`;
  document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
};

const printPDF = (data, onBlocked) => {
  const w = window.open('', '_blank');
  if (!w) { onBlocked && onBlocked(); return; }
  w.document.open();
  w.document.write(buildReportHTML(data) + '<script>window.onload=function(){setTimeout(function(){window.print()},400)}<\/script>');
  w.document.close();
};

const applyPassChange = (list, req, billetWeight, approver) => {
  const idx = list.findIndex(s => String(s.id) === String(req.standId));
  if (idx < 0) return null;
  const st = { ...list[idx] };
  const prev = st.activePass;
  const base = {
    id: Date.now() + Math.floor(Math.random() * 1000),
    standId: st.id, standName: st.name, date: req.date,
    time: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
    shift: req.shift, productSize: req.productSize,
    requestedBy: req.requestedBy || approver, approvedBy: approver
  };
  let log;

  if (req.kind === 'newRoll') {
    const total = st.passes.reduce((a, p) => a + (Number(p.tons) || 0), 0);
    st.entryDate = req.date; st.lastResetDate = req.date;
    st.activePass = 1; st.accumulatedTons = 0;
    st.passes = createPassesArray(st.totalPasses, 1, 0);
    log = { ...base, kind: 'newRoll', fromPass: prev, toPass: 1, tons: total, billetsAtChange: 0,
      notes: req.notes || 'تركيب درفيل جديد' };
  } else {
    const target = Number(req.targetPass) || prev;
    const oldBillets = Number(req.billets) || 0;
    const totalNow = st.accumulatedTons;
    const finalOld = oldBillets > 0 ? oldBillets * billetWeight : totalNow;
    const opening = Math.max(0, totalNow - finalOld);
    const maxOrder = Math.max(0, ...st.passes.map(p => p.order || 0));
    st.passes = st.passes.map(p => {
      if (p.passNumber === prev && prev !== target)
        return { ...p, status: 'used', tons: finalOld, order: p.order || Math.max(1, maxOrder) };
      if (p.passNumber === target)
        return { ...p, status: 'active', tons: opening,
          order: prev === target ? (p.order || 1) : (p.order ? p.order : maxOrder + 1) };
      return p;
    });
    st.activePass = target; st.accumulatedTons = opening; st.lastResetDate = req.date;
    log = { ...base, kind: 'pass', fromPass: prev, toPass: target, tons: finalOld, billetsAtChange: oldBillets,
      notes: req.notes || `نقل من ممر ${prev} إلى ممر ${target}` };
  }
  const newList = [...list]; newList[idx] = st;
  return { list: newList, log };
};

const Overlay = ({ z = 50, children }) => (
  <div className="fixed inset-0 bg-black/75 flex items-center justify-center p-3 backdrop-blur-sm" style={{ zIndex: z }}>{children}</div>
);

/* ============================================================================
  4. الحاسبات الهندسية (كل حاسبة بأيقونة مستقلة + حاسبة الأسياخ التفصيلية)
============================================================================ */
const num = (v) => (Number.isFinite(Number(v)) ? Number(v) : 0);
const fmt = (n, d = 2) => (Number.isFinite(n) ? n.toFixed(d) : '0.00');

const INDIVIDUAL_CALCS = [
  // ================= حاسبات الدرفلة المطلوبة =================
  {
    id: 'linear_speed',
    group: 'rolling',
    title: 'حاسبة السرعة الخطية',
    sub: 'حساب سرعة المعدن (m/s) من قطر ولفات الدرفيل',
    icon: Activity,
    color: 'from-blue-600 to-cyan-500',
    formula: 'V (m/s) = (π × Dw × N_roll) / 60000',
    inputs: [
      { k: 'dw', label: 'القطر الفعال للدرفيل Dw (mm)', def: 380 },
      { k: 'n', label: 'عدد لفات الدرفيل N_roll (RPM)', def: 450 }
    ],
    calc: (v) => {
      const ms = (Math.PI * v.dw * v.n) / 60000;
      return [
        { label: 'السرعة الخطية (m/s)', val: fmt(ms, 3), unit: 'm/s', main: true },
        { label: 'السرعة بالدقيقة (m/min)', val: fmt(ms * 60, 1), unit: 'm/min' },
        { label: 'السرعة (km/h)', val: fmt(ms * 3.6, 2), unit: 'km/h' },
        { label: 'محيط الدرفيل الفعال', val: fmt(Math.PI * v.dw, 1), unit: 'mm' }
      ];
    }
  },
  {
    id: 'roll_rpm',
    group: 'rolling',
    title: 'حاسبة عدد لفات الدرفيل',
    sub: 'حساب RPM الدرفيل من السرعة الخطية والقطر الفعال',
    icon: RotateCcw,
    color: 'from-indigo-600 to-blue-500',
    formula: 'N_roll (RPM) = (V × 60000) / (π × Dw)',
    inputs: [
      { k: 'v', label: 'السرعة الخطية V (m/s)', def: 9.0, step: 0.1 },
      { k: 'dw', label: 'القطر الفعال للدرفيل Dw (mm)', def: 380 }
    ],
    calc: (v) => {
      const rpm = v.dw > 0 ? (v.v * 60000) / (Math.PI * v.dw) : 0;
      return [
        { label: 'عدد لفات الدرفيل', val: fmt(rpm, 1), unit: 'RPM', main: true },
        { label: 'عدد اللفات في الثانية', val: fmt(rpm / 60, 2), unit: 'RPS' },
        { label: 'السرعة الزاوية (ω)', val: fmt((rpm * 2 * Math.PI) / 60, 2), unit: 'rad/s' }
      ];
    }
  },
  {
    id: 'motor_rpm',
    group: 'rolling',
    title: 'حاسبة عدد لفات الموتور',
    sub: 'حساب RPM الموتور من لفات الدرفيل أو السرعة ونسبة الجيربوكس',
    icon: Gauge,
    color: 'from-violet-600 to-purple-500',
    formula: 'N_motor = N_roll × Gear_Ratio',
    inputs: [
      { k: 'v', label: 'السرعة الخطية V (m/s)', def: 9.0, step: 0.1 },
      { k: 'dw', label: 'القطر الفعال للدرفيل Dw (mm)', def: 380 },
      { k: 'gr', label: 'نسبة تخفيض الجيربوكس (Gear Ratio)', def: 3.2, step: 0.05 }
    ],
    calc: (v) => {
      const rollRpm = v.dw > 0 ? (v.v * 60000) / (Math.PI * v.dw) : 0;
      const motorRpm = rollRpm * v.gr;
      return [
        { label: 'عدد لفات الموتور', val: fmt(motorRpm, 0), unit: 'RPM', main: true },
        { label: 'عدد لفات الدرفيل', val: fmt(rollRpm, 1), unit: 'RPM' },
        { label: 'نسبة التخفيض المطبقة', val: fmt(v.gr, 2), unit: ': 1' }
      ];
    }
  },
  {
    id: 'reduction_ratio',
    group: 'rolling',
    title: 'إيجاد نسبة التخفيض',
    sub: 'نسبة التخفيض في مساحة المقطع + نسبة تخفيض الجيربوكس',
    icon: Layers,
    color: 'from-emerald-600 to-teal-500',
    formula: 'Reduction % = ((A1 - A2) / A1) × 100  |  GR = N_motor / N_roll',
    inputs: [
      { k: 'a1', label: 'مساحة مقطع الدخول A1 (mm²)', def: 1200 },
      { k: 'a2', label: 'مساحة مقطع الخروج A2 (mm²)', def: 900 },
      { k: 'nm', label: 'لفات الموتور أو ترس منقاد (اختياري للجيربوكس)', def: 1450 },
      { k: 'nr', label: 'لفات الدرفيل أو ترس قائد (اختياري للجيربوكس)', def: 425 }
    ],
    calc: (v) => {
      const redPct = v.a1 > 0 ? ((v.a1 - v.a2) / v.a1) * 100 : 0;
      const gr = v.nr > 0 ? v.nm / v.nr : 0;
      return [
        { label: 'نسبة التخفيض في المساحة', val: fmt(redPct, 2), unit: '%', main: true },
        { label: 'المساحة المخفضة (ΔA)', val: fmt(v.a1 - v.a2, 1), unit: 'mm²' },
        { label: 'نسبة تخفيض الجيربوكس (GR)', val: fmt(gr, 3), unit: ': 1' },
        { label: 'معامل الاستطالة المقابل (λ)', val: fmt(v.a2 > 0 ? v.a1 / v.a2 : 0, 3), unit: '' }
      ];
    }
  },
  {
    id: 'volume_constancy',
    group: 'rolling',
    title: 'قانون ثبات الحجم',
    sub: 'حساب سرعة الخروج وثابت الدرفلة من (A1 × V1 = A2 × V2)',
    icon: Boxes,
    color: 'from-amber-600 to-orange-500',
    formula: 'A1 × V1 = A2 × V2 = Q (ثابت الدرفلة)',
    inputs: [
      { k: 'a1', label: 'مساحة الدخول A1 (mm²)', def: 1200 },
      { k: 'v1', label: 'سرعة الدخول V1 (m/s)', def: 2.5, step: 0.1 },
      { k: 'a2', label: 'مساحة الخروج A2 (mm²)', def: 900 }
    ],
    calc: (v) => {
      const q = v.a1 * v.v1;
      const v2 = v.a2 > 0 ? q / v.a2 : 0;
      const tonPerHour = q * 0.00785 * 3.6;
      return [
        { label: 'سرعة الخروج V2', val: fmt(v2, 3), unit: 'm/s', main: true },
        { label: 'ثابت الدرفلة (Q = A×V)', val: fmt(q, 0), unit: 'mm²·m/s' },
        { label: 'معدل تدفق المعدن', val: fmt(tonPerHour, 2), unit: 'طن/ساعة' },
        { label: 'زيادة السرعة', val: fmt(v.v1 > 0 ? ((v2 - v.v1) / v.v1) * 100 : 0, 1), unit: '%' }
      ];
    }
  },
  {
    id: 'elongation_calc',
    group: 'rolling',
    title: 'حساب نسبة الاستطالة',
    sub: 'حساب معامل ونسبة الاستطالة من خلال السرعات والمساحات',
    icon: Maximize2,
    color: 'from-teal-600 to-cyan-500',
    formula: 'λ_speed = V2 / V1  |  λ_area = A1 / A2  |  Elongation % = (λ - 1) × 100',
    inputs: [
      { k: 'v1', label: 'سرعة الدخول V1 (m/s)', def: 3.0, step: 0.1 },
      { k: 'v2', label: 'سرعة الخروج V2 (m/s)', def: 4.05, step: 0.1 },
      { k: 'a1', label: 'مساحة الدخول A1 (mm²)', def: 1000 },
      { k: 'a2', label: 'مساحة الخروج A2 (mm²)', def: 740 }
    ],
    calc: (v) => {
      const lamV = v.v1 > 0 ? v.v2 / v.v1 : 0;
      const lamA = v.a2 > 0 ? v.a1 / v.a2 : 0;
      const pctV = (lamV - 1) * 100;
      const diff = lamA > 0 ? ((lamV - lamA) / lamA) * 100 : 0;
      return [
        { label: 'معامل الاستطالة من السرعات (λv)', val: fmt(lamV, 3), unit: 'مرة', main: true },
        { label: 'نسبة الاستطالة المئوية (%)', val: fmt(pctV, 1), unit: '%' },
        { label: 'معامل الاستطالة من المساحات (λa)', val: fmt(lamA, 3), unit: 'مرة' },
        { label: 'حالة الشد / الانضغاط', val: Math.abs(diff) < 1 ? 'متعادل' : diff > 0 ? `شد +${fmt(diff, 1)}%` : `لوب ${fmt(diff, 1)}%`, unit: '' }
      ];
    }
  },
  {
    id: 'prev_stand_speed',
    group: 'rolling',
    title: 'حساب سرعة القائم السابق',
    sub: 'حساب سرعة ولفات القائم السابق من القائم الحالي (Backward Cascade)',
    icon: ArrowLeftRight,
    color: 'from-rose-600 to-pink-500',
    formula: 'V_prev = (A_curr × V_curr) / A_prev',
    inputs: [
      { k: 'a2', label: 'مساحة القائم الحالي A_curr (mm²)', def: 500 },
      { k: 'v2', label: 'سرعة القائم الحالي V_curr (m/s)', def: 8.0, step: 0.1 },
      { k: 'a1', label: 'مساحة القائم السابق A_prev (mm²)', def: 660 },
      { k: 'dw1', label: 'قطر درفيل القائم السابق Dw (mm)', def: 350 },
      { k: 'gr1', label: 'جيربوكس القائم السابق GR', def: 2.5, step: 0.1 }
    ],
    calc: (v) => {
      const v1 = v.a1 > 0 ? (v.a2 * v.v2) / v.a1 : 0;
      const roll1 = v.dw1 > 0 ? (v1 * 60000) / (Math.PI * v.dw1) : 0;
      const mot1 = roll1 * v.gr1;
      return [
        { label: 'سرعة القائم السابق المطلوبة', val: fmt(v1, 3), unit: 'm/s', main: true },
        { label: 'لفات درفيل القائم السابق', val: fmt(roll1, 1), unit: 'RPM' },
        { label: 'لفات موتور القائم السابق', val: fmt(mot1, 0), unit: 'RPM' },
        { label: 'فرق السرعة عن القائم الحالي', val: fmt(v.v2 - v1, 2), unit: 'm/s' }
      ];
    }
  },
  // حاسبات مخصصة بنوافذ تفصيلية (مساحة المقطع + عدد الأسياخ التفصيلي)
  {
    id: 'cross_section_area',
    group: 'rolling',
    title: 'حساب مساحة المقطع',
    sub: 'حساب مساحة ووزن المتر للمقاطع (دائري، مربع، بيضاوي، مستطيل)',
    icon: Circle,
    color: 'from-cyan-600 to-blue-600',
    custom: 'area_calc'
  },
  {
    id: 'billet_bars_detailed',
    group: 'rolling',
    title: 'عدد الأسياخ من وزن وحجم البيلت',
    sub: 'تحليل شامل: الحجم، الوزن، الفاقد، الـ Slitting، قطعيات المقص، والهالك',
    icon: List,
    color: 'from-emerald-600 to-green-500',
    custom: 'bars_detailed'
  },

  // ================= حاسبات الكهرباء الصناعية =================
  {
    id: 'elec_w_kw',
    group: 'electrical',
    title: 'تحويل الوات والكيلووات',
    sub: 'تحويل فوري بين (Watt) و (kW) و (MW) والحصان',
    icon: Zap,
    color: 'from-amber-500 to-yellow-500',
    formula: 'kW = Watt / 1000  |  HP = kW / 0.7457',
    inputs: [
      { k: 'watt', label: 'القدرة بالوات (Watt)', def: 75000 },
      { k: 'kw_in', label: 'أو أدخل القدرة بالكيلووات (kW)', def: 75 }
    ],
    calc: (v) => [
      { label: 'من وات إلى كيلووات', val: fmt(v.watt / 1000, 3), unit: 'kW', main: true },
      { label: 'من كيلووات إلى وات', val: fmt(v.kw_in * 1000, 0), unit: 'Watt' },
      { label: 'المقابل بالحصان الميكانيكي', val: fmt(v.kw_in / 0.7457, 2), unit: 'HP' },
      { label: 'المقابل بالميجاوات', val: fmt(v.kw_in / 1000, 4), unit: 'MW' }
    ]
  },
  {
    id: 'elec_hp_kw',
    group: 'electrical',
    title: 'تحويل الحصان (HP) والكيلووات',
    sub: 'تحويل قدرة المواتير من حصان إلى كيلووات والعكس',
    icon: Flame,
    color: 'from-orange-600 to-red-500',
    formula: 'kW = HP × 0.7457  |  HP = kW × 1.341',
    inputs: [
      { k: 'hp', label: 'القدرة بالحصان (HP)', def: 100 },
      { k: 'kw', label: 'القدرة بالكيلووات (kW)', def: 75 }
    ],
    calc: (v) => [
      { label: 'من حصان (HP) إلى كيلووات', val: fmt(v.hp * 0.7457, 2), unit: 'kW', main: true },
      { label: 'من كيلووات (kW) إلى حصان', val: fmt(v.kw / 0.7457, 2), unit: 'HP' },
      { label: 'بالوات (Watt) من الحصان', val: fmt(v.hp * 745.7, 0), unit: 'W' }
    ]
  },
  {
    id: 'elec_kw_to_amp',
    group: 'electrical',
    title: 'حساب أمبير الموتور (3 فاز)',
    sub: 'حساب التيار المسحوب (Ampere) من القدرة (kW) والجهد ومعامل القدرة',
    icon: Cpu,
    color: 'from-blue-600 to-indigo-600',
    formula: 'I (A) = (P_kW × 1000) / (√3 × V × cos φ × η)',
    inputs: [
      { k: 'kw', label: 'قدرة الموتور (kW)', def: 450 },
      { k: 'volt', label: 'الجهد الكهربائي (Volt)', def: 400 },
      { k: 'pf', label: 'معامل القدرة (cos φ)', def: 0.86, step: 0.01 },
      { k: 'eff', label: 'كفاءة الموتور (η %)', def: 94, step: 1 }
    ],
    calc: (v) => {
      const denom = Math.sqrt(3) * v.volt * v.pf * (v.eff / 100);
      const amp = denom > 0 ? (v.kw * 1000) / denom : 0;
      return [
        { label: 'التيار الاسمي للموتور', val: fmt(amp, 1), unit: 'Ampere', main: true },
        { label: 'تيار اللاحمل التقريبي (35%)', val: fmt(amp * 0.35, 1), unit: 'A' },
        { label: 'ضبط أوفرلود الحماية (105%)', val: fmt(amp * 1.05, 1), unit: 'A' },
        { label: 'القدرة الظاهرية (kVA)', val: fmt((Math.sqrt(3) * v.volt * amp) / 1000, 1), unit: 'kVA' }
      ];
    }
  },
  {
    id: 'elec_amp_to_kw',
    group: 'electrical',
    title: 'حساب الكيلووات من الأمبير الفعلي',
    sub: 'اعرف القدرة الفعلية المسحوبة (kW) من قراءة شاشة الأمبير',
    icon: Gauge,
    color: 'from-emerald-600 to-teal-600',
    formula: 'P (kW) = (√3 × V × I × cos φ × η) / 1000',
    inputs: [
      { k: 'amp', label: 'قراءة الأمبير الفعلية (Ampere)', def: 650 },
      { k: 'volt', label: 'الجهد الكهربائي (Volt)', def: 400 },
      { k: 'pf', label: 'معامل القدرة (cos φ)', def: 0.86, step: 0.01 },
      { k: 'eff', label: 'كفاءة الموتور (η %)', def: 94, step: 1 }
    ],
    calc: (v) => {
      const kw = (Math.sqrt(3) * v.volt * v.amp * v.pf * (v.eff / 100)) / 1000;
      return [
        { label: 'القدرة الفعلية المسحوبة', val: fmt(kw, 2), unit: 'kW', main: true },
        { label: 'المقابل بالحصان (HP)', val: fmt(kw / 0.7457, 1), unit: 'HP' },
        { label: 'المقابل بالوات (Watt)', val: fmt(kw * 1000, 0), unit: 'W' }
      ];
    }
  },
  {
    id: 'elec_torque',
    group: 'electrical',
    title: 'حساب عزم الموتور والدرفيل',
    sub: 'حساب العزم (Torque N.m) من القدرة (kW) وعدد اللفات (RPM)',
    icon: Wrench,
    color: 'from-purple-600 to-pink-600',
    formula: 'T (N.m) = (9550 × P_kW) / RPM',
    inputs: [
      { k: 'kw', label: 'القدرة (kW)', def: 450 },
      { k: 'rpm', label: 'عدد لفات الموتور (RPM)', def: 1480 },
      { k: 'gr', label: 'نسبة الجيربوكس (لحساب عزم الدرفيل)', def: 3.2, step: 0.1 }
    ],
    calc: (v) => {
      const tMotor = v.rpm > 0 ? (9550 * v.kw) / v.rpm : 0;
      const tRoll = tMotor * v.gr * 0.96; // كفاءة جيربوكس 96%
      return [
        { label: 'عزم الموتور (Motor Torque)', val: fmt(tMotor, 1), unit: 'N.m', main: true },
        { label: 'عزم الموتور بالكيلونيوتن.متر', val: fmt(tMotor / 1000, 3), unit: 'kN.m' },
        { label: 'عزم الدرفيل بعد الجيربوكس', val: fmt(tRoll / 1000, 2), unit: 'kN.m' }
      ];
    }
  },
  {
    id: 'elec_freq_rpm',
    group: 'electrical',
    title: 'حاسبة التردد (Hz) والسرعة التزامنية',
    sub: 'علاقة تردد الإنفرتر (Hz) وعدد الأقطاب بسرعة الموتور والانزلاق',
    icon: Sliders,
    color: 'from-sky-600 to-blue-600',
    formula: 'N_sync = (120 × f) / Poles',
    inputs: [
      { k: 'hz', label: 'تردد الإنفرتر (Hz)', def: 50, step: 0.5 },
      { k: 'poles', label: 'عدد أقطاب الموتور (مثلاً 4 أو 6)', def: 4, step: 2 },
      { k: 'actual', label: 'سرعة الموتور الفعلية على الشاشة (RPM)', def: 1475 }
    ],
    calc: (v) => {
      const ns = v.poles > 0 ? (120 * v.hz) / v.poles : 0;
      const slip = ns > 0 ? ((ns - v.actual) / ns) * 100 : 0;
      return [
        { label: 'السرعة التزامنية (N_sync)', val: fmt(ns, 0), unit: 'RPM', main: true },
        { label: 'نسبة انزلاق الموتور (Slip %)', val: fmt(slip, 2), unit: '%' },
        { label: 'عدد أزواج الأقطاب', val: fmt(v.poles / 2, 0), unit: 'زوج' }
      ];
    }
  }
];

/* -------- حاسبة مساحة المقطع التفصيلية -------- */
const CrossSectionAreaCalc = () => {
  const [shape, setShape] = useState('circle'); // circle | square | rect | oval
  const [d, setD] = useState(16);
  const [side, setSide] = useState(130);
  const [rCorner, setRCorner] = useState(8);
  const [w, setW] = useState(55);
  const [h, setH] = useState(24);

  let area = 0;
  let perim = 0;
  let formula = '';

  if (shape === 'circle') {
    area = (Math.PI * num(d) * num(d)) / 4;
    perim = Math.PI * num(d);
    formula = 'Area = (π × D²) / 4';
  } else if (shape === 'square') {
    const cornerLoss = (4 - Math.PI) * num(rCorner) * num(rCorner);
    area = Math.max(0, num(side) * num(side) - cornerLoss);
    perim = 4 * num(side);
    formula = 'Area = S² - (4 - π) × r²';
  } else if (shape === 'oval') {
    // تقريب هندسي لممر البيضاوي في الدرفلة (2/3 × العرض × الارتفاع أو π/4 × W × H)
    area = (Math.PI / 4) * num(w) * num(h);
    perim = Math.PI * (3 * (num(w) / 2 + num(h) / 2) - Math.sqrt((3 * num(w) / 2 + num(h) / 2) * (num(w) / 2 + 3 * num(h) / 2)));
    formula = 'Area_oval ≈ (π / 4) × Width × Height';
  } else {
    area = num(w) * num(h);
    perim = 2 * (num(w) + num(h));
    formula = 'Area = Width × Height';
  }

  const weightPerMeter = area * 0.00785; // كجم/متر للصلب

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
      <div className="lg:col-span-7 bg-slate-900 p-5 rounded-3xl border border-slate-800 space-y-4">
        <h3 className="text-lg font-black text-white border-b border-slate-800 pb-3">اختر شكل المقطع وأدخل الأبعاد</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {[
            ['circle', 'مقطع دائري / سيخ'],
            ['square', 'مربع / بيلت'],
            ['oval', 'ممر بيضاوي (Oval)'],
            ['rect', 'مستطيل / خوصة']
          ].map(([id, label]) => (
            <button
              key={id}
              onClick={() => setShape(id)}
              className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition-all ${
                shape === id ? 'bg-blue-600 text-white border-blue-500' : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {shape === 'circle' && (
          <div>
            <label className="text-xs text-slate-400 block mb-1">القطر (D) بالمم (mm)</label>
            <input type="number" step="0.1" value={d} onChange={(e) => setD(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white font-mono" />
          </div>
        )}

        {shape === 'square' && (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-400 block mb-1">ضلع المربع / البيلت (mm)</label>
              <input type="number" step="1" value={side} onChange={(e) => setSide(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white font-mono" />
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">نصف قطر دوران الزاوية r (mm)</label>
              <input type="number" step="0.5" value={rCorner} onChange={(e) => setRCorner(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white font-mono" />
            </div>
          </div>
        )}

        {(shape === 'oval' || shape === 'rect') && (
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-slate-400 block mb-1">العرض W (mm)</label>
              <input type="number" step="0.5" value={w} onChange={(e) => setW(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white font-mono" />
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">الارتفاع H (mm)</label>
              <input type="number" step="0.5" value={h} onChange={(e) => setH(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white font-mono" />
            </div>
          </div>
        )}
      </div>

      <div className="lg:col-span-5 bg-slate-900 p-5 rounded-3xl border border-cyan-500/30 space-y-4">
        <h3 className="text-lg font-black text-cyan-400 border-b border-slate-800 pb-3">نتائج مساحة المقطع</h3>
        <div className="bg-slate-950 p-4 rounded-2xl border border-cyan-500/30">
          <span className="text-xs text-slate-400 block mb-1">مساحة المقطع (Cross-Section Area)</span>
          <span className="text-3xl font-extrabold font-mono text-cyan-400">{fmt(area, 2)} <span className="text-sm text-slate-400">mm²</span></span>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800">
            <span className="text-xs text-slate-400 block">وزن المتر الطولي</span>
            <span className="text-lg font-bold font-mono text-emerald-400">{fmt(weightPerMeter, 3)} كجم/م</span>
          </div>
          <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800">
            <span className="text-xs text-slate-400 block">المساحة بالـ cm²</span>
            <span className="text-lg font-bold font-mono text-white">{fmt(area / 100, 2)} cm²</span>
          </div>
          <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 col-span-2">
            <span className="text-xs text-slate-400 block">محيط المقطع التقريبي</span>
            <span className="text-lg font-bold font-mono text-amber-400">{fmt(perim, 1)} mm</span>
          </div>
        </div>
        <p dir="ltr" className="text-xs font-mono text-slate-500 text-left">{formula} | Weight = Area × 0.00785</p>
      </div>
    </div>
  );
};

/* -------- الحاسبة التفصيلية لعدد الأسياخ من وزن وحجم البيلت مع تحديد كل جزء -------- */
const DetailedBilletBarsCalc = () => {
  const [inputMode, setInputMode] = useState('dims'); // dims | directWeight
  const [side, setSide] = useState(130);
  const [billetLen, setBilletLen] = useState(12);
  const [directKg, setDirectKg] = useState(1592);
  const [density, setDensity] = useState(7.85);
  const [yieldPct, setYieldPct] = useState(97.5);
  const [rebarSize, setRebarSize] = useState('16');
  const [strands, setStrands] = useState('1');
  const [coolingCutLen, setCoolingCutLen] = useState(48);
  const [commBarLen, setCommBarLen] = useState(12);

  const spec = REBAR_SPECS.find((r) => String(r.size) === rebarSize) || REBAR_SPECS[3];
  const k = Math.max(1, Number(strands) || 1);

  // 1. حساب حجم ووزن البيلت
  const billetAreaMm2 = num(side) * num(side);
  const billetVolCm3 = (billetAreaMm2 / 100) * (num(billetLen) * 100);
  const billetVolM3 = billetVolCm3 / 1e6;
  const calcWeightKg = (billetVolCm3 * num(density)) / 1000;
  const rawBilletKg = inputMode === 'dims' ? calcWeightKg : num(directKg);
  const effectiveVolM3 = num(density) > 0 ? rawBilletKg / (num(density) * 1000) : 0;

  // 2. الفاقد والوزن الصافي (Scale + Crop Ends)
  const netRolledKg = (rawBilletKg * num(yieldPct)) / 100;
  const lossKg = rawBilletKg - netRolledKg;

  // 3. الأطوال الكلية وتقسيم الخيوط (Slitting)
  const totalRolledLengthM = spec.nomW > 0 ? netRolledKg / spec.nomW : 0;
  const lengthPerStrandM = totalRolledLengthM / k;

  // 4. تقسيم المقص الطائر (Dividing Shear على سرير التبريد)
  const fullCoolingCutsPerStrand = num(coolingCutLen) > 0 ? Math.floor(lengthPerStrandM / num(coolingCutLen)) : 0;
  const remainderAfterCoolingCutM = lengthPerStrandM - fullCoolingCutsPerStrand * num(coolingCutLen);

  // 5. تقسيم المقص البارد للأسياخ التجارية (مثلاً 12 متر)
  const barsPerCoolingCut = num(commBarLen) > 0 ? Math.floor(num(coolingCutLen) / num(commBarLen)) : 0;
  const scrapPerCoolingCutM = num(coolingCutLen) - barsPerCoolingCut * num(commBarLen);
  const barsFromRemainderPerStrand = num(commBarLen) > 0 ? Math.floor(remainderAfterCoolingCutM / num(commBarLen)) : 0;
  const finalShortTailPerStrandM = remainderAfterCoolingCutM - barsFromRemainderPerStrand * num(commBarLen);

  // 6. الإجماليات النهائية للبيلت بالكامل
  const totalBarsFromFullCuts = k * fullCoolingCutsPerStrand * barsPerCoolingCut;
  const totalBarsFromRemainders = k * barsFromRemainderPerStrand;
  const totalCommercialBars = totalBarsFromFullCuts + totalBarsFromRemainders;

  const singleBarWeightKg = num(commBarLen) * spec.nomW;
  const totalGoodBarsWeightKg = totalCommercialBars * singleBarWeightKg;
  const totalScrapEndLengthM = k * (fullCoolingCutsPerStrand * scrapPerCoolingCutM + finalShortTailPerStrandM);
  const totalScrapEndWeightKg = totalScrapEndLengthM * spec.nomW;
  const barsPerTon = singleBarWeightKg > 0 ? 1000 / singleBarWeightKg : 0;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        <div className="lg:col-span-6 bg-slate-900 p-5 rounded-3xl border border-slate-800 space-y-4">
          <div className="flex justify-between items-center border-b border-slate-800 pb-3">
            <h3 className="text-lg font-black text-white">بيانات البيلت والمنتج والمقصات</h3>
            <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
              <button onClick={() => setInputMode('dims')} className={`px-3 py-1 rounded-lg font-bold ${inputMode === 'dims' ? 'bg-emerald-600 text-white' : 'text-slate-400'}`}>بالأبعاد والحجم</button>
              <button onClick={() => setInputMode('directWeight')} className={`px-3 py-1 rounded-lg font-bold ${inputMode === 'directWeight' ? 'bg-emerald-600 text-white' : 'text-slate-400'}`}>بالوزن المباشر</button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {inputMode === 'dims' ? (
              <>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">ضلع البيلت المربع (mm)</label>
                  <input type="number" value={side} onChange={(e) => setSide(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white font-mono text-sm" />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">طول البيلت (متر)</label>
                  <input type="number" step="0.1" value={billetLen} onChange={(e) => setBilletLen(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white font-mono text-sm" />
                </div>
              </>
            ) : (
              <div className="col-span-2">
                <label className="text-xs text-slate-400 block mb-1">وزن البيلت الواحد المباشر (كجم)</label>
                <input type="number" value={directKg} onChange={(e) => setDirectKg(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white font-mono text-sm" />
              </div>
            )}

            <div>
              <label className="text-xs text-slate-400 block mb-1">مقاس السيخ النهائي (mm)</label>
              <select value={rebarSize} onChange={(e) => setRebarSize(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white font-mono text-sm">
                {REBAR_SPECS.map((r) => (
                  <option key={r.size} value={String(r.size)}>{r.size} مم ({r.nomW} كجم/م)</option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs text-slate-400 block mb-1">عدد الخيوط (Slitting)</label>
              <select value={strands} onChange={(e) => setStrands(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white font-mono text-sm">
                <option value="1">1 خيط (Single)</option>
                <option value="2">2 خيط (Two-Slit)</option>
                <option value="3">3 خيط (Three-Slit)</option>
                <option value="4">4 خيط (Four-Slit)</option>
              </select>
            </div>

            <div>
              <label className="text-xs text-slate-400 block mb-1">طول قطعية سرير التبريد (متر)</label>
              <input type="number" step="1" value={coolingCutLen} onChange={(e) => setCoolingCutLen(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white font-mono text-sm" />
            </div>

            <div>
              <label className="text-xs text-slate-400 block mb-1">طول السيخ التجاري النهائي (متر)</label>
              <input type="number" step="0.5" value={commBarLen} onChange={(e) => setCommBarLen(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white font-mono text-sm" />
            </div>

            <div>
              <label className="text-xs text-slate-400 block mb-1">نسبة الإدرار الصافي Yield (%)</label>
              <input type="number" step="0.1" value={yieldPct} onChange={(e) => setYieldPct(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white font-mono text-sm" />
            </div>

            <div>
              <label className="text-xs text-slate-400 block mb-1">كثافة الصلب (g/cm³)</label>
              <input type="number" step="0.01" value={density} onChange={(e) => setDensity(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white font-mono text-sm" />
            </div>
          </div>
        </div>

        {/* النتائج التفصيلية لكل جزء */}
        <div className="lg:col-span-6 bg-slate-900 p-5 rounded-3xl border border-emerald-500/30 space-y-4">
          <h3 className="text-lg font-black text-emerald-400 border-b border-slate-800 pb-3">التشريح الكامل للبيلت والأسياخ الناتجة</h3>

          <div className="bg-gradient-to-br from-emerald-950/60 to-slate-950 p-4 rounded-2xl border border-emerald-500/40 flex justify-between items-center">
            <div>
              <span className="text-xs text-slate-300 block">إجمالي الأسياخ التجارية السليمة ({commBarLen}م)</span>
              <span className="text-3xl font-extrabold font-mono text-emerald-400">{totalCommercialBars} <span className="text-sm font-sans text-slate-300">سيخ / بيلت</span></span>
            </div>
            <div className="text-left font-mono">
              <span className="text-xs text-slate-400 block">عدد الأسياخ في الطن</span>
              <span className="text-xl font-bold text-amber-400">{fmt(barsPerTon, 1)} سيخ</span>
            </div>
          </div>

          <div className="space-y-2.5 text-xs">
            {/* الجزء 1: البيلت الخام */}
            <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 space-y-1.5">
              <div className="text-blue-400 font-bold mb-1">1. بيانات البيلت الخام (الحجم والوزن):</div>
              <div className="flex justify-between"><span className="text-slate-400">حجم البيلت الهندسي:</span><span className="font-mono font-bold text-white">{fmt(effectiveVolM3, 4)} m³ ({fmt(effectiveVolM3 * 1e6, 0)} cm³)</span></div>
              <div className="flex justify-between"><span className="text-slate-400">وزن البيلت الخام الكلي:</span><span className="font-mono font-bold text-white">{fmt(rawBilletKg, 1)} كجم ({fmt(rawBilletKg / 1000, 3)} طن)</span></div>
              <div className="flex justify-between"><span className="text-slate-400">الفاقد (قشور + قص رأس وذيل):</span><span className="font-mono font-bold text-red-400">{fmt(lossKg, 1)} كجم</span></div>
              <div className="flex justify-between"><span className="text-slate-400">الوزن الصافي المدرفل:</span><span className="font-mono font-bold text-emerald-400">{fmt(netRolledKg, 1)} كجم</span></div>
            </div>

            {/* الجزء 2: الخيوط والمقص الطائر */}
            <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 space-y-1.5">
              <div className="text-amber-400 font-bold mb-1">2. تفصيل الخيوط (Slitting) وقطعيات المقص الطائر:</div>
              <div className="flex justify-between"><span className="text-slate-400">الطول الكلي للسيخ الناتج:</span><span className="font-mono font-bold text-white">{fmt(totalRolledLengthM, 1)} متر</span></div>
              <div className="flex justify-between"><span className="text-slate-400">طول الخيط الواحد (لكل خط من {k}):</span><span className="font-mono font-bold text-sky-400">{fmt(lengthPerStrandM, 1)} متر</span></div>
              <div className="flex justify-between"><span className="text-slate-400">قطعيات المقص الكاملة ({coolingCutLen}م) للخيط:</span><span className="font-mono font-bold text-white">{fullCoolingCutsPerStrand} قطعية × {barsPerCoolingCut} سيخ</span></div>
              <div className="flex justify-between"><span className="text-slate-400">البار الأخير (فضلة المقص الطائر للخيط):</span><span className="font-mono font-bold text-amber-400">{fmt(remainderAfterCoolingCutM, 2)} متر (يعطي {barsFromRemainderPerStrand} سيخ)</span></div>
            </div>

            {/* الجزء 3: الأسياخ والهالك */}
            <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 space-y-1.5">
              <div className="text-emerald-400 font-bold mb-1">3. المحصلة النهائية والهالك (Short Bars / Scrap):</div>
              <div className="flex justify-between"><span className="text-slate-400">وزن السيخ التجاري الواحد ({commBarLen}م):</span><span className="font-mono font-bold text-white">{fmt(singleBarWeightKg, 2)} كجم</span></div>
              <div className="flex justify-between"><span className="text-slate-400">إجمالي وزن الأسياخ السليمة:</span><span className="font-mono font-bold text-emerald-400">{fmt(totalGoodBarsWeightKg, 1)} كجم</span></div>
              <div className="flex justify-between"><span className="text-slate-400">طول الفضلة النهائية غير التجارية للخيط:</span><span className="font-mono font-bold text-rose-400">{fmt(finalShortTailPerStrandM, 2)} متر</span></div>
              <div className="flex justify-between"><span className="text-slate-400">إجمالي هالك القص لكل الخيوط:</span><span className="font-mono font-bold text-rose-400">{fmt(totalScrapEndLengthM, 2)} م ({fmt(totalScrapEndWeightKg, 1)} كجم)</span></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

/* ============================================================================
  5. بوابة المهندسين العامة (الحاسبات المنفصلة + الكميونتي + جدول المواصفات)
============================================================================ */
const PublicEngineersPortal = ({ onSwitchToFactory, posts, setPosts, faults, setFaults, saveCloudData }) => {
  const [publicTab, setPublicTab] = useState('calculators'); // calculators | community | specs
  const [selectedCalcId, setSelectedCalcId] = useState(null);
  const [calcInputs, setCalcInputs] = useState({});
  const [searchQ, setSearchQ] = useState('');

  // حالات الكميونتي والأعطال
  const [subCommMode, setSubCommMode] = useState('feed'); // feed | faults
  const [postAuthor, setPostAuthor] = useState('');
  const [postRole, setPostRole] = useState('مشغل أول غرفة تحكم (MCR)');
  const [postCategory, setPostCategory] = useState('فنيات تشغيل الكنترول');
  const [postTitle, setPostTitle] = useState('');
  const [postContent, setPostContent] = useState('');
  const [commentAuthor, setCommentAuthor] = useState('');
  const [commentTexts, setCommentTexts] = useState({});
  const [faultSearch, setFaultSearch] = useState('');
  const [newFault, setNewFault] = useState({ code: '', brand: 'عيوب الدرفلة والمنتج', title: '', cause: '', solution: '' });
  const [showAddFault, setShowAddFault] = useState(false);

  const selectedCalc = INDIVIDUAL_CALCS.find((c) => c.id === selectedCalcId);

  const handleCreatePost = (e) => {
    e.preventDefault();
    if (!postTitle.trim() || !postContent.trim()) return;
    const newPost = {
      id: 'p-' + Date.now(),
      author: postAuthor.trim() || 'مهندس / فني درفلة',
      role: postRole,
      badge: 'عضو نشط',
      time: new Date().toLocaleString('ar-EG', { hour: '2-digit', minute: '2-digit', day: 'numeric', month: 'short' }),
      category: postCategory,
      title: postTitle.trim(),
      content: postContent.trim(),
      likes: 1,
      liked: false,
      comments: []
    };
    const updated = [newPost, ...posts];
    setPosts(updated);
    saveCloudData({ posts: updated });
    setPostTitle('');
    setPostContent('');
  };

  const handleToggleLike = (postId) => {
    const updated = posts.map((p) =>
      p.id === postId ? { ...p, liked: !p.liked, likes: p.liked ? p.likes - 1 : p.likes + 1 } : p
    );
    setPosts(updated);
    saveCloudData({ posts: updated });
  };

  const handleAddComment = (postId) => {
    const txt = commentTexts[postId];
    if (!txt || !txt.trim()) return;
    const cObj = {
      id: 'c-' + Date.now(),
      user: commentAuthor.trim() || 'مهندس بالخط',
      role: 'عضو المجتمع',
      text: txt.trim(),
      time: 'الآن'
    };
    const updated = posts.map((p) => (p.id === postId ? { ...p, comments: [...(p.comments || []), cObj] } : p));
    setPosts(updated);
    saveCloudData({ posts: updated });
    setCommentTexts({ ...commentTexts, [postId]: '' });
  };

  const handleAddFault = (e) => {
    e.preventDefault();
    if (!newFault.code.trim() || !newFault.title.trim()) return;
    const fObj = { id: 'f-' + Date.now(), ...newFault };
    const updated = [fObj, ...faults];
    setFaults(updated);
    saveCloudData({ faults: updated });
    setNewFault({ code: '', brand: 'عيوب الدرفلة والمنتج', title: '', cause: '', solution: '' });
    setShowAddFault(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans" dir="rtl">
      {/* الهيدر */}
      <header className="sticky top-0 z-40 bg-slate-950/95 backdrop-blur-md border-b border-slate-800">
        <div className="max-w-6xl mx-auto px-4 py-3 flex flex-wrap justify-between items-center gap-3">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-blue-600 to-indigo-600 p-2.5 rounded-2xl shadow-lg shadow-blue-600/30">
              <Zap className="text-white w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-extrabold text-white">
                Steel<span className="text-blue-500">Portal</span>
              </h1>
              <p className="text-[11px] text-slate-400">حاسبات الدرفلة والكهرباء ومجتمع المهندسين</p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex bg-slate-900 p-1 rounded-2xl border border-slate-800 gap-1">
              {[
                ['calculators', 'الحاسبات الهندسية', Calculator],
                ['community', `الكميونتي والأعطال (${posts.length})`, MessageCircle],
                ['specs', 'جدول المواصفات', Ruler]
              ].map(([id, label, Icon]) => (
                <button
                  key={id}
                  onClick={() => { setPublicTab(id); setSelectedCalcId(null); }}
                  className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all ${
                    publicTab === id ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{label}</span>
                </button>
              ))}
            </div>

            <button
              onClick={onSwitchToFactory}
              className="bg-emerald-600 hover:bg-emerald-500 text-white px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-lg shadow-emerald-600/20"
            >
              <Building2 className="w-4 h-4" />
              <span>دخول المصانع</span>
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        {/* ================= تبويب الحاسبات ================= */}
        {publicTab === 'calculators' && (
          <div className="space-y-6">
            {selectedCalc ? (
              <div className="space-y-5">
                <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setSelectedCalcId(null)}
                      className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5"
                    >
                      <ArrowRight className="w-4 h-4" /> رجوع لكل الحاسبات
                    </button>
                    <div>
                      <h2 className="text-base sm:text-lg font-extrabold text-white">{selectedCalc.title}</h2>
                      <p className="text-xs text-slate-400">{selectedCalc.sub}</p>
                    </div>
                  </div>
                </div>

                {selectedCalc.custom === 'area_calc' ? (
                  <CrossSectionAreaCalc />
                ) : selectedCalc.custom === 'bars_detailed' ? (
                  <DetailedBilletBarsCalc />
                ) : (
                  (() => {
                    const currentVals = {};
                    selectedCalc.inputs.forEach((inp) => {
                      const raw = calcInputs[`${selectedCalc.id}_${inp.k}`];
                      currentVals[inp.k] = raw !== undefined ? num(raw) : inp.def;
                    });
                    const results = selectedCalc.calc(currentVals);
                    const mainRes = results.find((r) => r.main) || results[0];
                    const otherRes = results.filter((r) => r !== mainRes);

                    return (
                      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                        <div className="lg:col-span-7 bg-slate-900 p-5 rounded-3xl border border-slate-800 space-y-4">
                          <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                            <h3 className="text-base font-bold text-white">المدخلات</h3>
                            <button
                              onClick={() => setCalcInputs({})}
                              className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded-lg flex items-center gap-1"
                            >
                              <RotateCcw className="w-3.5 h-3.5" /> إعادة ضبط
                            </button>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                            {selectedCalc.inputs.map((inp) => {
                              const key = `${selectedCalc.id}_${inp.k}`;
                              const val = calcInputs[key] !== undefined ? calcInputs[key] : inp.def;
                              return (
                                <div key={inp.k}>
                                  <label className="text-xs text-slate-400 block mb-1.5 font-bold">{inp.label}</label>
                                  <input
                                    type="number"
                                    step={inp.step || 'any'}
                                    value={val}
                                    onChange={(e) => setCalcInputs({ ...calcInputs, [key]: e.target.value })}
                                    className="w-full bg-slate-950 border border-slate-700 focus:border-blue-500 rounded-xl p-3 text-white font-mono text-sm outline-none"
                                  />
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        <div className="lg:col-span-5 bg-slate-900 p-5 rounded-3xl border border-blue-500/30 space-y-4">
                          <h3 className="text-base font-bold text-blue-400 border-b border-slate-800 pb-3">النتائج الهندسية</h3>
                          <div className="bg-gradient-to-br from-blue-950/60 to-slate-950 p-4 rounded-2xl border border-blue-500/40">
                            <span className="text-xs text-slate-400 block mb-1">{mainRes.label}</span>
                            <span className="text-3xl font-extrabold font-mono text-blue-400">
                              {mainRes.val} <span className="text-sm text-slate-300">{mainRes.unit}</span>
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-3">
                            {otherRes.map((r, i) => (
                              <div key={i} className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800">
                                <span className="text-xs text-slate-400 block">{r.label}</span>
                                <span className="text-lg font-bold font-mono text-white">
                                  {r.val} <span className="text-xs text-slate-400">{r.unit}</span>
                                </span>
                              </div>
                            ))}
                          </div>
                          {selectedCalc.formula && (
                            <p dir="ltr" className="text-xs font-mono text-slate-500 text-left pt-2 border-t border-slate-800">
                              {selectedCalc.formula}
                            </p>
                          )}
                        </div>
                      </div>
                    );
                  })()
                )}
              </div>
            ) : (
              <>
                {/* شريط البحث في الحاسبات */}
                <div className="relative">
                  <Search className="absolute right-4 top-3.5 text-slate-500 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="ابحث عن حاسبة (سرعة خطية، لفات درفيل، استطالة، أمبير، كيلووات، أسياخ...)"
                    value={searchQ}
                    onChange={(e) => setSearchQ(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-800 focus:border-blue-500 rounded-2xl pr-12 pl-4 py-3.5 text-white text-sm outline-none"
                  />
                </div>

                {/* مجموعة حاسبات الدرفلة */}
                {[
                  { id: 'rolling', title: 'حاسبات الدرفلة وتشكيل المعادن (كل حاسبة مستقلة)', badge: '9 حاسبات أساسية' },
                  { id: 'electrical', title: 'حاسبات الكهرباء والمواتير الصناعية', badge: '6 حاسبات كهربائية' }
                ].map((grp) => {
                  const list = INDIVIDUAL_CALCS.filter(
                    (c) =>
                      c.group === grp.id &&
                      (!searchQ.trim() ||
                        c.title.toLowerCase().includes(searchQ.toLowerCase()) ||
                        c.sub.toLowerCase().includes(searchQ.toLowerCase()))
                  );
                  if (list.length === 0) return null;
                  return (
                    <div key={grp.id} className="space-y-3.5">
                      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                        <h2 className="text-lg font-extrabold text-white">{grp.title}</h2>
                        <span className="text-xs bg-slate-900 border border-slate-800 text-blue-400 px-3 py-1 rounded-full font-bold">
                          {grp.badge}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {list.map((c) => {
                          const Icon = c.icon;
                          return (
                            <button
                              key={c.id}
                              onClick={() => setSelectedCalcId(c.id)}
                              className="group text-right bg-slate-900 hover:bg-slate-900/90 border border-slate-800 hover:border-blue-500/60 rounded-3xl p-5 transition-all hover:-translate-y-1 flex flex-col justify-between shadow-lg"
                            >
                              <div>
                                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${c.color} flex items-center justify-center shadow-md mb-4 group-hover:scale-110 transition-transform`}>
                                  <Icon className="text-white w-6 h-6" />
                                </div>
                                <h3 className="text-base font-extrabold text-white group-hover:text-blue-400 transition-colors">
                                  {c.title}
                                </h3>
                                <p className="text-xs text-slate-400 mt-1.5 leading-relaxed">{c.sub}</p>
                              </div>
                              <div className="mt-4 pt-3 border-t border-slate-800/80 flex justify-between items-center text-[11px] text-blue-400 font-bold">
                                <span>افتح الحاسبة الآن</span>
                                <span>←</span>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </>
            )}
          </div>
        )}

        {/* ================= تبويب الكميونتي وموسوعة الأعطال ================= */}
        {publicTab === 'community' && (
          <div className="space-y-5">
            <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl flex flex-wrap justify-between items-center gap-4">
              <div>
                <h2 className="text-xl font-extrabold text-white">مجتمع صناع الحديد وموسوعة الأعطال</h2>
                <p className="text-xs text-slate-400 mt-1">شارك خبراتك وأسئلتك الفنية مع مهندسي الدرفلة والكنترول، أو ابحث في تشخيص الأعطال</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setSubCommMode('feed')}
                  className={`px-4 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-2 ${
                    subCommMode === 'feed' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-300'
                  }`}
                >
                  <MessageCircle className="w-4 h-4" /> المنشورات والنقاشات ({posts.length})
                </button>
                <button
                  onClick={() => setSubCommMode('faults')}
                  className={`px-4 py-2.5 rounded-2xl text-xs font-bold flex items-center gap-2 ${
                    subCommMode === 'faults' ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-300'
                  }`}
                >
                  <Wrench className="w-4 h-4" /> موسوعة الأعطال ({faults.length})
                </button>
              </div>
            </div>

            {subCommMode === 'feed' ? (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
                {/* فورم نشر بوست */}
                <div className="lg:col-span-4">
                  <form onSubmit={handleCreatePost} className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-3 lg:sticky lg:top-24">
                    <h3 className="text-base font-extrabold text-white flex items-center gap-2">
                      <PlusCircle className="text-blue-400 w-5 h-5" /> نشر بوست أو معلومة فنية
                    </h3>
                    <input
                      type="text"
                      placeholder="اسمك (مثلاً: م. بسام وليد)"
                      value={postAuthor}
                      onChange={(e) => setPostAuthor(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white"
                    />
                    <select
                      value={postRole}
                      onChange={(e) => setPostRole(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white"
                    >
                      <option>مشغل أول غرفة تحكم (MCR)</option>
                      <option>مهندس درفلة وباس ديزاين</option>
                      <option>مهندس كهرباء وأتمتة صناعية</option>
                      <option>مهندس جودة وإنتاج</option>
                      <option>فني صيانة ميكانيكية</option>
                    </select>
                    <select
                      value={postCategory}
                      onChange={(e) => setPostCategory(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white"
                    >
                      <option>فنيات تشغيل الكنترول</option>
                      <option>أسرار الدرفلة والـ Tempcore</option>
                      <option>أعطال الدرايفات والمواتير</option>
                      <option>سؤال فني للزملاء</option>
                    </select>
                    <input
                      type="text"
                      placeholder="عنوان المنشور أو السؤال..."
                      value={postTitle}
                      onChange={(e) => setPostTitle(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white font-bold"
                    />
                    <textarea
                      rows={4}
                      placeholder="اكتب التفاصيل الفنية هنا..."
                      value={postContent}
                      onChange={(e) => setPostContent(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white"
                    />
                    <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-xl font-bold text-xs shadow-lg">
                      نشر البوست في المجتمع
                    </button>
                  </form>
                </div>

                {/* قائمة البوستات */}
                <div className="lg:col-span-8 space-y-4">
                  {posts.map((post) => (
                    <div key={post.id} className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4">
                      <div className="flex justify-between items-start gap-2">
                        <div className="flex items-center gap-3">
                          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-extrabold text-lg">
                            {post.author ? post.author.charAt(0) : 'م'}
                          </div>
                          <div>
                            <div className="flex items-center gap-2 flex-wrap">
                              <h4 className="font-bold text-white text-sm">{post.author}</h4>
                              <span className="text-[10px] bg-blue-500/20 text-blue-400 border border-blue-500/30 px-2 py-0.5 rounded-full font-bold">
                                {post.badge || 'عضو'}
                              </span>
                            </div>
                            <p className="text-[11px] text-slate-400">{post.role} • {post.time}</p>
                          </div>
                        </div>
                        <span className="text-[11px] bg-slate-800 text-slate-300 px-3 py-1 rounded-full">{post.category}</span>
                      </div>

                      <div>
                        <h3 className="text-base font-bold text-blue-300 mb-1.5">{post.title}</h3>
                        <p className="text-xs sm:text-sm text-slate-200 leading-relaxed whitespace-pre-line">{post.content}</p>
                      </div>

                      <div className="flex items-center gap-4 pt-3 border-t border-slate-800 text-xs">
                        <button
                          onClick={() => handleToggleLike(post.id)}
                          className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl font-bold transition-colors ${
                            post.liked ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30' : 'bg-slate-800 text-slate-300'
                          }`}
                        >
                          <ThumbsUp className="w-4 h-4" />
                          <span>أعجبني ({post.likes || 0})</span>
                        </button>
                        <span className="text-slate-400 font-bold">
                          {(post.comments || []).length} تعليقات
                        </span>
                      </div>

                      {/* التعليقات */}
                      <div className="bg-slate-950 rounded-2xl p-3.5 border border-slate-800 space-y-2.5">
                        {(post.comments || []).map((c) => (
                          <div key={c.id} className="bg-slate-900 p-2.5 rounded-xl border border-slate-800/80">
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-xs font-bold text-emerald-400">{c.user}</span>
                              <span className="text-[10px] text-slate-500">{c.time}</span>
                            </div>
                            <p className="text-xs text-slate-200">{c.text}</p>
                          </div>
                        ))}
                        <div className="flex flex-col sm:flex-row gap-2 pt-1">
                          <input
                            type="text"
                            placeholder="اسمك..."
                            value={commentAuthor}
                            onChange={(e) => setCommentAuthor(e.target.value)}
                            className="sm:w-36 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                          />
                          <input
                            type="text"
                            placeholder="اكتب تعليقك الفني..."
                            value={commentTexts[post.id] || ''}
                            onChange={(e) => setCommentTexts({ ...commentTexts, [post.id]: e.target.value })}
                            className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                          />
                          <button
                            onClick={() => handleAddComment(post.id)}
                            className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl text-xs font-bold"
                          >
                            إرسال
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2 justify-between items-center">
                  <div className="relative flex-1 min-w-[240px]">
                    <Search className="absolute right-4 top-3 text-slate-500 w-4 h-4" />
                    <input
                      type="text"
                      placeholder="ابحث عن عيب (قشرة، شنب) أو كود عطل درايف (F0001)..."
                      value={faultSearch}
                      onChange={(e) => setFaultSearch(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-800 rounded-2xl pr-10 pl-4 py-2.5 text-white text-xs"
                    />
                  </div>
                  <button
                    onClick={() => setShowAddFault(!showAddFault)}
                    className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-2.5 rounded-2xl text-xs flex items-center gap-1.5"
                  >
                    <PlusCircle className="w-4 h-4" /> إضافة عطل أو عيب جديد
                  </button>
                </div>

                {showAddFault && (
                  <form onSubmit={handleAddFault} className="bg-slate-900 border border-amber-500/40 rounded-3xl p-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <input
                      type="text"
                      placeholder="كود أو اسم العيب (مثلاً: F0002 / Overvoltage)"
                      value={newFault.code}
                      onChange={(e) => setNewFault({ ...newFault, code: e.target.value })}
                      className="bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white"
                    />
                    <input
                      type="text"
                      placeholder="التصنيف (عيوب الدرفلة / Siemens / ABB)"
                      value={newFault.brand}
                      onChange={(e) => setNewFault({ ...newFault, brand: e.target.value })}
                      className="bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white"
                    />
                    <input
                      type="text"
                      placeholder="عنوان المشكلة..."
                      value={newFault.title}
                      onChange={(e) => setNewFault({ ...newFault, title: e.target.value })}
                      className="sm:col-span-2 bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white font-bold"
                    />
                    <textarea
                      rows={2}
                      placeholder="السبب الفني..."
                      value={newFault.cause}
                      onChange={(e) => setNewFault({ ...newFault, cause: e.target.value })}
                      className="bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white"
                    />
                    <textarea
                      rows={2}
                      placeholder="خطوات الحل والإجراء..."
                      value={newFault.solution}
                      onChange={(e) => setNewFault({ ...newFault, solution: e.target.value })}
                      className="bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-xs text-white"
                    />
                    <button type="submit" className="sm:col-span-2 bg-emerald-600 text-white font-bold py-2.5 rounded-xl text-xs">
                      حفظ في موسوعة الأعطال
                    </button>
                  </form>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {faults
                    .filter(
                      (f) =>
                        !faultSearch.trim() ||
                        f.code.toLowerCase().includes(faultSearch.toLowerCase()) ||
                        f.title.toLowerCase().includes(faultSearch.toLowerCase()) ||
                        f.brand.toLowerCase().includes(faultSearch.toLowerCase())
                    )
                    .map((f) => (
                      <div key={f.id} className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-2.5">
                        <div className="flex justify-between items-center">
                          <span className="px-3 py-1 bg-red-500/20 text-red-400 border border-red-500/30 rounded-xl font-mono font-bold text-xs">
                            {f.code}
                          </span>
                          <span className="text-xs bg-slate-800 text-slate-300 px-3 py-1 rounded-xl">{f.brand}</span>
                        </div>
                        <h3 className="text-sm font-bold text-white">{f.title}</h3>
                        <p className="text-xs text-slate-400 leading-relaxed">
                          <strong className="text-amber-400">السبب الفني: </strong> {f.cause}
                        </p>
                        <div className="bg-slate-950 p-3 rounded-2xl border border-emerald-900/40 text-xs text-emerald-300 leading-relaxed">
                          <strong>الإجراء والحل: </strong> {f.solution}
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ================= تبويب جدول المواصفات القياسية ================= */}
        {publicTab === 'specs' && (
          <div className="bg-slate-900 p-5 rounded-3xl border border-slate-800 space-y-4 overflow-x-auto">
            <h3 className="text-lg font-extrabold text-white">الأوزان القياسية والتجاوزات المسموحة لحديد التسليح (ES 262 / ISO 6935-2)</h3>
            <table className="w-full text-right border-collapse text-sm min-w-[520px]">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 text-xs">
                  <th className="p-3">المقاس (mm)</th>
                  <th className="p-3">المساحة (mm²)</th>
                  <th className="p-3">أقل وزن (كجم/م)</th>
                  <th className="p-3">الاسمي (كجم/م)</th>
                  <th className="p-3">أقصى وزن (كجم/م)</th>
                  <th className="p-3">كود اللون</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {REBAR_SPECS.map((row) => (
                  <tr key={row.size} className="hover:bg-slate-800/40">
                    <td className="p-3 font-bold text-white">{row.size} مم</td>
                    <td className="p-3 text-slate-300">{row.area}</td>
                    <td className="p-3 text-red-400">{row.minW}</td>
                    <td className="p-3 text-emerald-400 font-bold">{row.nomW}</td>
                    <td className="p-3 text-amber-400">{row.maxW}</td>
                    <td className="p-3 font-sans text-xs text-blue-300">{row.color}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
};

/* ============================================================================
  6. التطبيق الرئيسي الموحد (بوابة الاختيار + بوابة المهندسين + بوابة المصنع الكاملة)
============================================================================ */
export default function App() {
  // وضع البوابة: 'gateway' | 'public' | 'factory'
  const [portalMode, setPortalMode] = useState('gateway');

  // صلاحيات وحالات المصنع (من ملفك الأصلي بالكامل)
  const [currentUser, setCurrentUser] = useState('none'); // 'none' | 'tech' | 'manager' | 'admin'
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [userAuth, setUserAuth] = useState(null);
  const appId = 'al-gioshy-steel-rolls';

  const isManagerLike = currentUser === 'manager' || currentUser === 'admin';
  const roleLabel = currentUser === 'tech' ? 'فني إنتاج' : currentUser === 'manager' ? 'مدير المصنع' : 'مسؤول النظام (Admin)';

  const secretTapCount = useRef(0);
  const secretTapTimer = useRef(null);
  const handleSecretAdminTrigger = () => {
    secretTapCount.current += 1;
    if (secretTapTimer.current) clearTimeout(secretTapTimer.current);
    if (secretTapCount.current >= 5) {
      secretTapCount.current = 0;
      if (isSuperAdmin) { setCurrentUser('admin'); setActiveTab('admin'); }
      else setLoginPrompt({ isOpen: true, role: 'admin', codeInput: '', error: '' });
    } else {
      secretTapTimer.current = setTimeout(() => { secretTapCount.current = 0; }, 1500);
    }
  };

  // حالات الدرافيل والممرات والأرشيف والموافقات
  const [stands, setStands] = useState(buildInitialStands);
  const [shiftBillets, setShiftBillets] = useState('');
  const [productionArchive, setProductionArchive] = useState([]);
  const [passChanges, setPassChanges] = useState([]);
  const [pendingList, setPendingList] = useState([]);
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  // حالات المواتير والتقارير الفنية والكميونتي
  const [motors, setMotors] = useState(INITIAL_MOTORS);
  const [motorLogs, setMotorLogs] = useState([]);
  const [reports, setReports] = useState(INITIAL_REPORTS);
  const [posts, setPosts] = useState(INITIAL_POSTS);
  const [faults, setFaults] = useState(INITIAL_FAULTS);

  const [billetWeight, setBilletWeight] = useState(0.75);
  const [selectedProductSize, setSelectedProductSize] = useState('16');
  const [customLogo, setCustomLogo] = useState("");
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [tempLogoUrl, setTempLogoUrl] = useState('');

  const [adminState, setAdminState] = useState({
    isMaintenance: false,
    maintenanceMessage: 'الموقع مغلق حالياً لإجراء تحديثات وصيانة للنظام.. يرجى المحاولة لاحقاً.',
    techCode: '1111', managerCode: '2222', adminCode: '9999', visitsCount: 0, lastVisit: ''
  });
  const [loginPrompt, setLoginPrompt] = useState({ isOpen: false, role: '', codeInput: '', error: '' });
  const [visitLogged, setVisitLogged] = useState(false);

  // نوافذ الدرفيل وتغيير الممر والموافقات
  const [rollModal, setRollModal] = useState({ isOpen: false, standIndex: null, isEditingInfo: false });
  const [rollEditForm, setRollEditForm] = useState({ rollCode: '', diameter: '', hardness: '', type: '', entryDate: '', totalPasses: 6 });

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

  // حالات إضافة/تبديل موتور وكتابة تقرير
  const [motorForm, setMotorForm] = useState({
    location: 'ستاند 1', category: 'تخشين', serial: '', brand: 'Siemens',
    kw: 450, voltage: 400, ratedAmp: 810, baseRpm: 1000, maxRpm: 1750, gearRatio: '3.20', notes: ''
  });
  const [swapModal, setSwapModal] = useState({ isOpen: false, motorIndex: null, newSerial: '', newKw: '', newRpm: '', reason: '' });

  const [reportForm, setReportForm] = useState({
    author: '', category: 'تقرير تشغيل وكنترول', status: 'تم الحل', title: '', details: ''
  });
  const [reportFilter, setReportFilter] = useState('الكل');

  const [modal, setModal] = useState({ isOpen: false, type: '', title: '', message: '', onConfirm: null });
  const closeBox = () => setModal(m => ({ ...m, isOpen: false }));
  const showAlert = (title, message) => setModal({ isOpen: true, type: 'alert', title, message, onConfirm: null });
  const showConfirm = (title, message, onConfirm) => setModal({ isOpen: true, type: 'confirm', title, message, onConfirm });

  /* ---------- الاتصال اللحظي بـ Firebase ---------- */
  useEffect(() => {
    if (!auth) { setIsDataLoaded(true); return; }
    signInAnonymously(auth).catch(e => console.error(e));
    const unsub = onAuthStateChanged(auth, setUserAuth);
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!userAuth || !db) return;
    const ref = (name) => doc(db, 'factory', appId, 'data', name);

    const u1 = onSnapshot(ref('standsState'), (snap) => {
      if (snap.exists() && snap.data().standsList) setStands(normalizeList(snap.data().standsList));
      else { const init = buildInitialStands(); setDoc(ref('standsState'), { standsList: init }); setStands(init); }
      setIsDataLoaded(true);
    });
    const u2 = onSnapshot(ref('archiveState'), (snap) => {
      if (snap.exists()) setProductionArchive(snap.data().archiveList || []);
      else setDoc(ref('archiveState'), { archiveList: [] });
    });
    const u3 = onSnapshot(ref('passChangesState'), (snap) => {
      if (snap.exists()) setPassChanges(snap.data().passChangesList || []);
      else setDoc(ref('passChangesState'), { passChangesList: [] });
    });
    const u4 = onSnapshot(ref('settingsState'), (snap) => {
      if (snap.exists()) {
        const d = snap.data();
        if (d.billetWeight) setBilletWeight(d.billetWeight);
        if (d.logoUrl) setCustomLogo(d.logoUrl);
        if (d.selectedProductSize) setSelectedProductSize(d.selectedProductSize);
      } else setDoc(ref('settingsState'), { billetWeight: 0.75, logoUrl: "", selectedProductSize: '16' }, { merge: true });
    });
    const u5 = onSnapshot(ref('adminState'), (snap) => {
      if (snap.exists()) setAdminState(prev => ({ ...prev, ...snap.data() }));
      else {
        const def = {
          isMaintenance: false,
          maintenanceMessage: 'الموقع مغلق حالياً لإجراء تحديثات وصيانة للنظام.. يرجى المحاولة لاحقاً.',
          techCode: '1111', managerCode: '2222', adminCode: '9999', visitsCount: 1, lastVisit: new Date().toLocaleString('ar-EG')
        };
        setDoc(ref('adminState'), def); setAdminState(def);
      }
    });
    const u6 = onSnapshot(ref('pendingState'), (snap) => {
      if (snap.exists()) setPendingList(snap.data().pendingList || []);
      else setDoc(ref('pendingState'), { pendingList: [] });
    });
    const u7 = onSnapshot(ref('motorsState'), (snap) => {
      if (snap.exists() && snap.data().motorsList) {
        setMotors(snap.data().motorsList);
        setMotorLogs(snap.data().motorLogsList || []);
      } else {
        setDoc(ref('motorsState'), { motorsList: INITIAL_MOTORS, motorLogsList: [] });
      }
    });
    const u8 = onSnapshot(ref('reportsState'), (snap) => {
      if (snap.exists() && snap.data().reportsList) setReports(snap.data().reportsList);
      else setDoc(ref('reportsState'), { reportsList: INITIAL_REPORTS });
    });
    const u9 = onSnapshot(ref('communityState'), (snap) => {
      if (snap.exists()) {
        if (snap.data().postsList) setPosts(snap.data().postsList);
        if (snap.data().faultsList) setFaults(snap.data().faultsList);
      } else {
        setDoc(ref('communityState'), { postsList: INITIAL_POSTS, faultsList: INITIAL_FAULTS });
      }
    });

    return () => { u1(); u2(); u3(); u4(); u5(); u6(); u7(); u8(); u9(); };
  }, [userAuth]);

  useEffect(() => {
    if (isDataLoaded && userAuth && db && !visitLogged) {
      setVisitLogged(true);
      setDoc(doc(db, 'factory', appId, 'data', 'adminState'),
        { visitsCount: (adminState.visitsCount || 0) + 1, lastVisit: new Date().toLocaleString('ar-EG') },
        { merge: true }).catch(e => console.error(e));
    }
  }, [isDataLoaded, userAuth, visitLogged]);

  /* ---------- اليوم الإنتاجي والورديات ---------- */
  const getInitialProductionState = () => {
    const now = new Date();
    const hour = now.getHours();
    const prodDate = new Date(now);
    if (hour < 8) prodDate.setDate(prodDate.getDate() - 1);
    const fri = prodDate.getDay() === 5;
    let initialShift = '';
    if (fri) initialShift = (hour >= 8 && hour < 20) ? SHIFTS_FRIDAY[0] : SHIFTS_FRIDAY[1];
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

  /* ---------- دالة الحفظ السحابي الشاملة ---------- */
  const save = async ({ stands: s, archive, weight, logo, changes, productSize, admin, pending, motors: mList, motorLogs: mLogs, reports: rList, posts: pList, faults: fList } = {}) => {
    if (userAuth && db) {
      try {
        const ref = (name) => doc(db, 'factory', appId, 'data', name);
        if (s !== undefined) await setDoc(ref('standsState'), { standsList: s });
        if (archive !== undefined) await setDoc(ref('archiveState'), { archiveList: archive });
        if (changes !== undefined) await setDoc(ref('passChangesState'), { passChangesList: changes });
        if (pending !== undefined) await setDoc(ref('pendingState'), { pendingList: pending });
        if (admin !== undefined) await setDoc(ref('adminState'), admin, { merge: true });
        if (mList !== undefined || mLogs !== undefined) {
          await setDoc(ref('motorsState'), {
            motorsList: mList !== undefined ? mList : motors,
            motorLogsList: mLogs !== undefined ? mLogs : motorLogs
          }, { merge: true });
        }
        if (rList !== undefined) await setDoc(ref('reportsState'), { reportsList: rList });
        if (pList !== undefined || fList !== undefined) {
          await setDoc(ref('communityState'), {
            postsList: pList !== undefined ? pList : posts,
            faultsList: fList !== undefined ? fList : faults
          }, { merge: true });
        }
        const upd = {};
        if (weight !== undefined) upd.billetWeight = weight;
        if (logo !== undefined) upd.logoUrl = logo;
        if (productSize !== undefined) upd.selectedProductSize = productSize;
        if (Object.keys(upd).length) await setDoc(ref('settingsState'), upd, { merge: true });
      } catch (e) { console.error("Save error:", e); }
    } else {
      if (s !== undefined) setStands(s);
      if (archive !== undefined) setProductionArchive(archive);
      if (weight !== undefined) setBilletWeight(weight);
      if (logo !== undefined) setCustomLogo(logo);
      if (changes !== undefined) setPassChanges(changes);
      if (pending !== undefined) setPendingList(pending);
      if (productSize !== undefined) setSelectedProductSize(productSize);
      if (admin !== undefined) setAdminState(prev => ({ ...prev, ...admin }));
      if (mList !== undefined) setMotors(mList);
      if (mLogs !== undefined) setMotorLogs(mLogs);
      if (rList !== undefined) setReports(rList);
      if (pList !== undefined) setPosts(pList);
      if (fList !== undefined) setFaults(fList);
    }
  };

  const handleProductSizeChange = (size) => {
    setSelectedProductSize(size);
    save({ stands: stands.map(s => ({ ...s, isActive: true })), productSize: size });
  };

  const getStandStatus = (tons, limit) => {
    const pct = Math.max(0, (tons / limit) * 100);
    if (pct >= 100) return { color: 'danger', bg: 'bg-red-100', border: 'border-red-500', bar: 'bg-red-600', text: 'text-red-700', hex: '#dc2626' };
    if (pct >= 80) return { color: 'warning', bg: 'bg-yellow-100', border: 'border-yellow-400', bar: 'bg-yellow-500', text: 'text-yellow-700', hex: '#eab308' };
    return { color: 'good', bg: 'bg-slate-50', border: 'border-slate-300', bar: 'bg-green-500', text: 'text-slate-700', hex: '#22c55e' };
  };

  const openSettingsModal = () => { setTempLogoUrl(customLogo); setIsSettingsOpen(true); };
  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 1024 * 1024) { showAlert("خطأ", "حجم الصورة كبير جداً. يرجى اختيار صورة أقل من 1 ميجابايت."); return; }
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
    const ns = stands.map((s, i) => i === index ? { ...s, isActive: !s.isActive } : s);
    save({ stands: ns });
  };

  /* ---------- إدارة الدرفيل والممرات ---------- */
  const openStandRollPage = (index) => {
    const st = stands[index];
    setRollEditForm({
      rollCode: st.rollCode || '', diameter: st.diameter || '', hardness: st.hardness || '',
      type: st.type || '', entryDate: convertGBToISO(st.entryDate), totalPasses: st.totalPasses || 6
    });
    setRollModal({ isOpen: true, standIndex: index, isEditingInfo: false });
  };

  const handleSaveRollMetadata = () => {
    const idx = rollModal.standIndex;
    if (idx === null) return;
    const ns = [...stands];
    const st = { ...ns[idx] };
    const newTotal = Math.max(1, Math.min(40, Number(rollEditForm.totalPasses) || st.totalPasses));
    st.rollCode = rollEditForm.rollCode; st.diameter = rollEditForm.diameter;
    st.hardness = rollEditForm.hardness; st.type = rollEditForm.type;
    st.entryDate = formatDateToGB(rollEditForm.entryDate) || st.entryDate;
    if (newTotal !== st.totalPasses) {
      st.passes = Array.from({ length: newTotal }, (_, i) => {
        const n = i + 1;
        const ex = st.passes.find(p => p.passNumber === n);
        if (ex) return ex;
        return { passNumber: n, status: n === st.activePass ? 'active' : 'unused',
          tons: n === st.activePass ? st.accumulatedTons : 0, order: n === st.activePass ? 1 : null, sizeLabel: '' };
      });
      st.totalPasses = newTotal;
      if (st.activePass > newTotal) st.activePass = 1;
    }
    ns[idx] = st;
    save({ stands: ns });
    setRollModal(prev => ({ ...prev, isEditingInfo: false }));
    showAlert("تم الحفظ", "تم تحديث بيانات الدرفيل والممرات بنجاح.");
  };

  const pendingFor = (standId) => pendingList.filter(r => String(r.standId) === String(standId) && r.status === 'pending');

  const buildRequest = (st, kind, extra = {}) => ({
    id: Date.now() + Math.floor(Math.random() * 1000),
    kind, status: 'pending', standId: st.id, standName: st.name,
    fromPass: st.activePass, currentTons: st.accumulatedTons,
    productSize: selectedProductSize, requestedBy: roleLabel,
    createdAt: new Date().toLocaleString('ar-EG'),
    date: new Date().toLocaleDateString('en-GB'), shift: selectedShift, ...extra
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
    if (!isManagerLike && pendingFor(st.id).length) { showAlert('يوجد طلب معلّق', 'فيه طلب لهذا الستاند بانتظار موافقة المدير.'); return; }
    showConfirm(
      "تركيب درفيل جديد",
      isManagerLike
        ? "سيتم تصفير جميع الممرات والبدء من الممر 1 بتاريخ اليوم."
        : "سيتم إرسال طلب تركيب درفيل جديد للمدير. لن يتغير شيء قبل موافقته.",
      () => submitChange(buildRequest(st, 'newRoll', { notes: 'تركيب درفيل جديد' }))
    );
  };

  const handleDirectPassStatusChange = (standIdx, passNum, newStatus, customTons) => {
    const ns = [...stands];
    const st = { ...ns[standIdx] };
    const maxOrder = Math.max(0, ...st.passes.map(p => p.order || 0));
    st.passes = st.passes.map(p => {
      if (p.passNumber !== passNum) return p;
      if (newStatus === 'unused') return { ...p, status: 'unused', tons: 0, order: null };
      return { ...p, status: 'used', tons: customTons !== undefined ? Number(customTons) : p.tons, order: p.order || (maxOrder + 1) };
    });
    ns[standIdx] = st;
    save({ stands: ns });
  };

  const initiateResetStand = (index, preselectedPassNum = null, e = null) => {
    if (e) e.stopPropagation();
    const st = stands[index];
    if (!isManagerLike && pendingFor(st.id).length) { showAlert('يوجد طلب معلّق', 'فيه طلب لهذا الستاند بانتظار موافقة المدير. استنى الرد عليه الأول.'); return; }
    setResetBillets(''); setResetNotes('');
    setResetDateInput(formatDateToISO(currentProdDate));
    setResetShiftInput(selectedShift);
    if (preselectedPassNum) setResetTargetPass(preselectedPassNum);
    else {
      const next = st.passes.find(p => p.status === 'unused' && p.passNumber !== st.activePass);
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
  const setEdit = (id, patch) => setReqEdits(prev => ({ ...prev, [id]: { ...(prev[id] || {}), ...patch } }));

  const approveRequest = (r) => {
    const merged = { ...r, ...(r.kind === 'pass' ? getEdit(r) : {}) };
    const res = applyPassChange(stands, merged, billetWeight, roleLabel);
    if (!res) { showAlert('خطأ', 'تعذر تنفيذ الطلب: الستاند غير موجود.'); return; }
    const edited = JSON.stringify(getEdit(r)) !== JSON.stringify({ targetPass: r.targetPass, billets: r.billets, notes: r.notes });
    if (edited && r.kind === 'pass') res.log.notes = `${res.log.notes} (عُدّل بواسطة المدير)`;
    save({ stands: res.list, changes: [res.log, ...passChanges], pending: pendingList.filter(x => x.id !== r.id) });
  };
  const rejectRequest = (r) => {
    save({ pending: pendingList.map(x => x.id === r.id ? { ...x, status: 'rejected', rejectedAt: new Date().toLocaleString('ar-EG') } : x) });
  };
  const dismissRequest = (id) => save({ pending: pendingList.filter(x => x.id !== id) });

  const handleResetAllStands = () => {
    showConfirm('تحذير شديد', 'هل أنت متأكد من تصفير كافة الستاندات والممرات بالكامل والبدء من ممر 1؟', () => {
      const today = new Date().toLocaleDateString('en-GB');
      save({ stands: stands.map(s => ({ ...s, activePass: 1, accumulatedTons: 0, lastResetDate: today, passes: createPassesArray(s.totalPasses, 1, 0) })) });
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
    if (val > 0) save({ stands: stands.map((s, i) => i === index ? { ...s, maxLimit: val } : s) });
  };
  const handleWeightChange = (v) => { const val = Number(v); if (val > 0) save({ weight: val }); };

  /* ---------- إنتاج الوردية ---------- */
  const currentDateStr = currentProdDate.toLocaleDateString('en-GB');
  const existingShiftLog = productionArchive.find(l => l.date === currentDateStr && l.shift === selectedShift);

  const handleAddShiftProduction = () => {
    const n = Number(shiftBillets);
    if (n <= 0 || isNaN(n)) return;
    if (existingShiftLog) { setDupModal(true); return; }
    commitShift('add');
  };

  const commitShift = (mode) => {
    setDupModal(false);
    const n = Number(shiftBillets);
    if (n <= 0 || isNaN(n)) return;
    const newTons = n * billetWeight;
    const existing = productionArchive.find(l => l.date === currentDateStr && l.shift === selectedShift);
    const delta = mode === 'replace' && existing ? newTons - existing.tons : newTons;

    const now = new Date();
    const saveTime = now.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
    const dayName = currentProdDate.toLocaleDateString('ar-EG', { weekday: 'long' });

    const newStands = stands.map(s => {
      if (!s.isActive) return s;
      const tons = Math.max(0, s.accumulatedTons + delta);
      return { ...s, accumulatedTons: tons,
        passes: s.passes.map(p => p.passNumber === s.activePass ? { ...p, status: 'active', tons, order: p.order || 1 } : p) };
    });

    let archive;
    if (existing) {
      archive = productionArchive.map(l => l === existing ? {
        ...l,
        billets: mode === 'replace' ? n : l.billets + n,
        tons: mode === 'replace' ? newTons : l.tons + newTons,
        time: saveTime, productSize: selectedProductSize, timestamp: now.getTime()
      } : l);
    } else {
      archive = [{ id: Date.now(), date: currentDateStr, dayName, time: saveTime, shift: selectedShift,
        billets: n, tons: newTons, productSize: selectedProductSize, timestamp: now.getTime() }, ...productionArchive];
    }
    save({ stands: newStands, archive });

    const dayShifts = shiftsFor(currentProdDate.getDay() === 5);
    const i = dayShifts.indexOf(selectedShift);
    if (i === dayShifts.length - 1) {
      const nd = new Date(currentProdDate); nd.setDate(nd.getDate() + 1);
      setCurrentProdDate(nd);
      setSelectedShift(shiftsFor(nd.getDay() === 5)[0]);
      showAlert('تم الإقفال', `تم إقفال يوم ${dayName} وتسجيل إنتاج ${selectedShift} بنجاح!\n\nتم فتح يوم جديد تلقائياً.`);
    } else setSelectedShift(dayShifts[i >= 0 ? i + 1 : 0]);
    setShiftBillets('');
  };

  /* ---------- إدارة المواتير والتقارير ---------- */
  const handleAddMotor = (e) => {
    e.preventDefault();
    if (!motorForm.serial.trim()) { showAlert('تنبيه', 'أدخل السيريال أو كود الموتور أولاً.'); return; }
    const newM = {
      id: 'm-' + Date.now(),
      ...motorForm,
      installDate: new Date().toLocaleDateString('en-GB'),
      status: 'يعمل بالخط'
    };
    const logItem = {
      id: 'ml-' + Date.now(),
      date: new Date().toLocaleDateString('en-GB'),
      location: motorForm.location,
      action: `إضافة موتور جديد (${motorForm.serial} - ${motorForm.kw} kW)`,
      by: roleLabel
    };
    save({ motors: [newM, ...motors], motorLogs: [logItem, ...motorLogs] });
    setMotorForm({ ...motorForm, serial: '', notes: '' });
    showAlert('تم الحفظ', 'تم تسجيل الموتور الجديد في سجل المصنع.');
  };

  const handleConfirmSwapMotor = (e) => {
    e.preventDefault();
    const idx = swapModal.motorIndex;
    if (idx === null || !swapModal.newSerial.trim()) return;
    const oldMotor = motors[idx];
    const updatedMotors = [...motors];
    updatedMotors[idx] = {
      ...oldMotor,
      serial: swapModal.newSerial.trim(),
      kw: Number(swapModal.newKw) || oldMotor.kw,
      maxRpm: Number(swapModal.newRpm) || oldMotor.maxRpm,
      installDate: new Date().toLocaleDateString('en-GB'),
      notes: swapModal.reason || 'تم التبديل'
    };
    const logItem = {
      id: 'ml-' + Date.now(),
      date: new Date().toLocaleDateString('en-GB'),
      location: oldMotor.location,
      action: `تبديل موتور: خروج (${oldMotor.serial}) ← تركيب (${swapModal.newSerial}) | السبب: ${swapModal.reason || 'صيانة'}`,
      by: roleLabel
    };
    save({ motors: updatedMotors, motorLogs: [logItem, ...motorLogs] });
    setSwapModal({ isOpen: false, motorIndex: null, newSerial: '', newKw: '', newRpm: '', reason: '' });
  };

  const handleAddReport = (e) => {
    e.preventDefault();
    if (!reportForm.title.trim() || !reportForm.details.trim()) {
      showAlert('تنبيه', 'يرجى كتابة عنوان وتفاصيل التقرير الفني.');
      return;
    }
    const newRep = {
      id: 'rep-' + Date.now(),
      date: currentDateStr,
      time: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
      shift: selectedShift,
      author: reportForm.author.trim() || roleLabel,
      category: reportForm.category,
      productSize: selectedProductSize,
      status: reportForm.status,
      title: reportForm.title.trim(),
      details: reportForm.details.trim()
    };
    save({ reports: [newRep, ...reports] });
    setReportForm({ ...reportForm, title: '', details: '' });
    showAlert('تم الحفظ', 'تم حفظ التقرير الفني في سجل الورديات بنجاح.');
  };

  /* ---------- الدخول والأدمن ---------- */
  const openLoginModal = (role) => setLoginPrompt({ isOpen: true, role, codeInput: '', error: '' });
  const closeLogin = () => setLoginPrompt({ isOpen: false, role: '', codeInput: '', error: '' });

  const handleVerifyAccessCode = (e) => {
    e.preventDefault();
    const { role, codeInput } = loginPrompt;
    const code = codeInput.trim();
    if (code === adminState.adminCode) {
      setIsSuperAdmin(true); setCurrentUser(role === 'admin' ? 'admin' : role);
      setActiveTab(role === 'admin' ? 'admin' : 'dashboard'); closeLogin(); return;
    }
    const ok = (role === 'tech' && code === adminState.techCode) || (role === 'manager' && code === adminState.managerCode);
    if (!ok) { setLoginPrompt(p => ({ ...p, error: 'الكود غير صحيح! حاول مرة أخرى.' })); return; }
    if (adminState.isMaintenance) { setLoginPrompt(p => ({ ...p, error: 'الموقع في وضع الصيانة والتحديث حالياً!' })); return; }
    setIsSuperAdmin(false); setCurrentUser(role); setActiveTab('dashboard'); closeLogin();
  };

  const handleSuperAdminSwitchRole = (role) => {
    if (!isSuperAdmin) return;
    setCurrentUser(role);
    if (role === 'admin') setActiveTab('admin'); else if (activeTab === 'admin') setActiveTab('dashboard');
  };
  const handleLogout = () => { setCurrentUser('none'); setIsSuperAdmin(false); setActiveTab('dashboard'); };
  const handleSaveAdminSettings = (updated) => {
    setAdminState(updated); save({ admin: updated });
    showAlert("تم الحفظ", "تم تحديث إعدادات الأدمن والأكواد بنجاح.");
  };

  /* ---------- تجميع الأرشيف والتقارير ---------- */
  const groupedArchive = productionArchive.reduce((acc, log) => {
    if (!acc[log.date]) acc[log.date] = { dayName: log.dayName, totalBillets: 0, totalTons: 0, shiftsList: [], timestamp: log.timestamp };
    acc[log.date].totalBillets += log.billets;
    acc[log.date].totalTons += log.tons;
    acc[log.date].shiftsList.push(log);
    return acc;
  }, {});
  const shiftOrder = { 'الوردية الأولى': 1, 'الوردية الأولى (12 ساعة)': 1, 'الوردية الثانية': 2, 'الوردية الثانية (12 ساعة)': 2, 'الوردية الثالثة': 3 };
  Object.keys(groupedArchive).forEach(k => groupedArchive[k].shiftsList.sort((a, b) => shiftOrder[a.shift] - shiftOrder[b.shift]));
  const sortedDates = Object.keys(groupedArchive).sort((a, b) => groupedArchive[b].timestamp - groupedArchive[a].timestamp);
  const aggregatedLogs = Object.values(groupedArchive).flatMap(d => d.shiftsList).sort((a, b) => b.timestamp - a.timestamp);

  const reportData = { stands, archive: productionArchive, changes: passChanges, billetWeight, motors, reports };
  const exportButtons = isManagerLike && (
    <div className="flex gap-1.5">
      <button onClick={() => downloadExcel(reportData)} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-1.5 px-3 rounded text-[10px] flex items-center gap-1 shadow active:scale-95 transition-colors">
        <FileSpreadsheet className="w-3.5 h-3.5" /> تصدير Excel الشامل
      </button>
      <button onClick={() => printPDF(reportData, () => showAlert('تعذر الفتح', 'المتصفح منع النافذة. اسمح بالنوافذ المنبثقة لهذا الموقع وجرّب تاني.'))} className="bg-rose-600 hover:bg-rose-700 text-white font-bold py-1.5 px-3 rounded text-[10px] flex items-center gap-1 shadow active:scale-95 transition-colors">
        <FileText className="w-3.5 h-3.5" /> طباعة / PDF
      </button>
    </div>
  );

  const pendingCount = pendingList.filter(r => r.status === 'pending').length;

  /* ============================================================================
    شاشة البوابة الرئيسية (Gateway Mode: اختيار المستخدم العادي أو بوابة المصنع)
  ============================================================================ */
  if (portalMode === 'gateway') {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col justify-between p-4 sm:p-8 select-none" dir="rtl">
        <div className="max-w-5xl w-full mx-auto my-auto space-y-8">
          <div className="text-center space-y-3">
            <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/30 text-blue-400 px-4 py-1.5 rounded-full text-xs font-bold">
              <Zap className="w-4 h-4" /> المنصة الهندسية المتكاملة لصناعة الصلب والدرفلة
            </div>
            <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white">
              Steel<span className="text-blue-500">Portal</span> & Roll<span className="text-emerald-500">Tracker</span>
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 max-w-xl mx-auto leading-relaxed">
              اختر طريقة الدخول المناسبة لك: البوابة العامة للمهندسين والفنيين (الحاسبات والكميونتي) أو البوابة الخاصة بالمصانع لإدارة الدرافيل والورادي والمواتير والتقارير.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* كارت دخول المهندس / المستخدم العادي */}
            <div className="bg-slate-900 border-2 border-slate-800 hover:border-blue-500 rounded-3xl p-6 sm:p-8 flex flex-col justify-between transition-all hover:-translate-y-1 shadow-2xl">
              <div className="space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-600/30">
                  <Calculator className="w-8 h-8 text-white" />
                </div>
                <div>
                  <span className="text-[11px] bg-blue-500/20 text-blue-400 px-3 py-1 rounded-full font-bold">دخول فوري مجاني</span>
                  <h2 className="text-2xl font-black text-white mt-2">بوابة المهندسين والحاسبات</h2>
                  <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                    مخصصة للمهندسين والفنيين لإجراء الحسابات الفورية والتفاعل في المجتمع الفني بدون كود مصنع.
                  </p>
                </div>
                <ul className="space-y-2 text-xs text-slate-300 pt-2 border-t border-slate-800">
                  <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-blue-400 shrink-0" /> 9 حاسبات درفلة منفصلة (سرعة، لفات، تخفيض، ثبات حجم، استطالة، مساحة مقطع)</li>
                  <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-blue-400 shrink-0" /> الحاسبة التفصيلية لعدد الأسياخ من وزن وحجم البيلت والهالك</li>
                  <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-blue-400 shrink-0" /> 6 حاسبات كهرباء صناعية (وات، كيلووات، حصان، أمبير، عزم، تردد)</li>
                  <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-blue-400 shrink-0" /> مجتمع صناع الحديد لنشر البوستات وموسوعة تشخيص الأعطال</li>
                </ul>
              </div>
              <button
                onClick={() => setPortalMode('public')}
                className="mt-6 w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3.5 rounded-2xl shadow-lg shadow-blue-600/25 flex items-center justify-center gap-2 text-sm transition-all"
              >
                <span>دخول بوابة المهندسين والكميونتي</span>
                <span>←</span>
              </button>
            </div>

            {/* كارت دخول المصانع */}
            <div className="bg-slate-900 border-2 border-slate-800 hover:border-emerald-500 rounded-3xl p-6 sm:p-8 flex flex-col justify-between transition-all hover:-translate-y-1 shadow-2xl">
              <div className="space-y-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-600 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-600/30">
                  <Building2 className="w-8 h-8 text-white" />
                </div>
                <div>
                  <span className="text-[11px] bg-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full font-bold">دخول مخصص بكود المصنع</span>
                  <h2 className="text-2xl font-black text-white mt-2">بوابة إدارة المصانع (Roll Tracker)</h2>
                  <p className="text-xs text-slate-400 mt-2 leading-relaxed">
                    منظومة التشغيل السحابية الكاملة لمتابعة القوائم (1 - 12)، الممرات، الأقطار، الورادي، المواتير، والتقارير.
                  </p>
                </div>
                <ul className="space-y-2 text-xs text-slate-300 pt-2 border-t border-slate-800">
                  <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" /> تتبع لحظي للـ 12 ستاند، الأقطار، حالة الممرات، وطلبات موافقة المدير</li>
                  <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" /> تسجيل إنتاج الورادي، الأرشيف اليومي، وتصدير تقارير Excel و PDF</li>
                  <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" /> سجل المواتير الصناعية (السيريال، القدرة، الـ RPM، وتاريخ التبديل)</li>
                  <li className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" /> صفحة كتابة التقارير الفنية للورديات وأعطال الخط</li>
                </ul>
              </div>
              <button
                onClick={() => setPortalMode('factory')}
                className="mt-6 w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3.5 rounded-2xl shadow-lg shadow-emerald-600/25 flex items-center justify-center gap-2 text-sm transition-all"
              >
                <span>دخول منظومة المصنع</span>
                <span>←</span>
              </button>
            </div>
          </div>
        </div>

        <footer className="text-center text-xs text-slate-500 pt-6">
          تطوير وإشراف: م. بسام وليد • جميع البيانات متصلة لحظياً بقاعدة البيانات السحابية
        </footer>
      </div>
    );
  }

  /* ============================================================================
    عرض بوابة المهندسين العامة (الحاسبات + الكميونتي)
  ============================================================================ */
  if (portalMode === 'public') {
    return (
      <PublicEngineersPortal
        onSwitchToFactory={() => setPortalMode('factory')}
        posts={posts}
        setPosts={setPosts}
        faults={faults}
        setFaults={setFaults}
        saveCloudData={save}
      />
    );
  }

  /* ============================================================================
    عرض بوابة المصنع (من ملفك الأصلي بالكامل + المواتير + التقارير)
  ============================================================================ */
  if (adminState.isMaintenance && !isSuperAdmin && currentUser !== 'none') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 text-white p-4 text-center" dir="rtl">
        <div className="bg-slate-800 p-8 rounded-2xl max-w-md w-full border-2 border-amber-500 shadow-2xl flex flex-col items-center gap-4">
          <div className="bg-amber-500/20 p-4 rounded-full border border-amber-500/40 animate-pulse"><Wrench className="w-14 h-14 text-amber-400" /></div>
          <h1 className="text-2xl font-black text-amber-400">جاري التعديل والتحديث</h1>
          <p className="text-sm text-slate-300 leading-relaxed font-bold">{adminState.maintenanceMessage}</p>
          <button onClick={handleLogout} className="mt-4 bg-slate-700 hover:bg-slate-600 text-white font-bold px-6 py-2.5 rounded-lg text-xs transition-colors">العودة لشاشة الدخول</button>
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
          <button type="button" onClick={closeLogin} className="text-slate-400 hover:text-white"><X className="w-4 h-4" /></button>
        </div>
        <input type="password" autoFocus value={loginPrompt.codeInput}
          onChange={(e) => setLoginPrompt(p => ({ ...p, codeInput: e.target.value, error: '' }))}
          placeholder="أدخل الكود السري..."
          className="w-full bg-slate-900 border border-slate-600 rounded-lg p-2.5 text-center font-mono text-lg tracking-widest text-white focus:border-blue-500 outline-none" />
        {loginPrompt.error && <p className="text-red-400 text-xs font-bold text-center bg-red-950/50 border border-red-800 p-1.5 rounded">{loginPrompt.error}</p>}
        <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-lg transition-colors shadow-lg text-sm">تأكيد الدخول</button>
      </form>
    </Overlay>
  );

  // شاشة تسجيل الدخول الخاصة بالمصنع
  if (currentUser === 'none') {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 text-white p-4 select-none" dir="rtl">
        {loginModalJSX}
        <div className="bg-slate-800 p-8 rounded-2xl max-w-sm w-full text-center border border-slate-700 shadow-2xl relative">
          <div onClick={handleSecretAdminTrigger} className="cursor-pointer inline-block w-full">
            {customLogo ? (
              <div className="w-full flex justify-center mb-6 bg-white p-2 rounded-lg shadow-sm">
                <img src={customLogo} alt="Factory Logo" className="h-16 object-contain drop-shadow-md" />
              </div>
            ) : <Settings2 className="w-16 h-16 mx-auto text-emerald-500 mb-4 active:scale-95 transition-transform" />}
          </div>
          <h1 onClick={handleSecretAdminTrigger} className="text-2xl font-black mb-1 text-slate-100 cursor-pointer">تتبع درافيل وممرات الإنتاج</h1>
          <p className="text-xs text-slate-400 mb-3 font-bold">شركة الجيوشي للصلب - ALGIOSHY STEEL</p>
          {adminState.isMaintenance ? (
            <div className="bg-amber-500/20 border border-amber-500 text-amber-300 p-3 rounded-lg mb-6 text-xs font-bold flex flex-col items-center gap-1.5">
              <Wrench className="w-5 h-5 text-amber-400 animate-bounce" /><span>{adminState.maintenanceMessage}</span>
            </div>
          ) : (
            <p className="text-emerald-400 mb-6 text-xs flex items-center justify-center gap-1 font-bold"><CheckCircle className="w-4 h-4" /> نظام المصنع متصل بالسحابة لحظياً</p>
          )}
          {!isDataLoaded ? (
            <div className="text-slate-400 animate-pulse text-sm font-bold">جاري الاتصال بقاعدة البيانات...</div>
          ) : (
            <div className="space-y-3">
              <button onClick={() => openLoginModal('tech')} disabled={adminState.isMaintenance}
                className={`w-full flex items-center justify-center gap-2 p-3.5 rounded-xl font-bold transition-colors shadow-lg ${adminState.isMaintenance ? 'bg-slate-700 text-slate-500 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}>
                <Edit3 className="w-5 h-5" /> دخول فني الإنتاج
              </button>
              <button onClick={() => openLoginModal('manager')} disabled={adminState.isMaintenance}
                className={`w-full flex items-center justify-center gap-2 p-3.5 rounded-xl font-bold transition-colors shadow-lg ${adminState.isMaintenance ? 'bg-slate-700 text-slate-500 cursor-not-allowed' : 'bg-emerald-600 hover:bg-emerald-700 text-white'}`}>
                <TrendingUp className="w-5 h-5" /> دخول إدارة المصنع
              </button>
              <div className="pt-4 border-t border-slate-700 flex flex-col gap-2">
                <button onClick={() => setPortalMode('public')} className="w-full bg-slate-900 hover:bg-slate-950 text-blue-400 border border-slate-700 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5">
                  <Calculator className="w-4 h-4" /> الذهاب للحاسبات الهندسية والكميونتي
                </button>
                <button onClick={() => setPortalMode('gateway')} className="text-xs text-slate-400 hover:text-white font-bold pt-1">
                  ← العودة للبوابة الرئيسية
                </button>
              </div>
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

  /* ============================================================================
    الواجهة الداخلية الكاملة للمصنع
  ============================================================================ */
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
              {modal.type === 'confirm' && <button onClick={closeBox} className="px-4 py-2 bg-slate-200 hover:bg-slate-300 rounded-lg font-bold text-slate-700 text-xs">إلغاء</button>}
              <button onClick={() => { const cb = modal.onConfirm; closeBox(); if (cb) cb(); }} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-xs shadow">موافق</button>
            </div>
          </div>
        </Overlay>
      )}

      {loginModalJSX}

      {/* نافذة: الوردية مسجلة قبل كده */}
      {dupModal && existingShiftLog && (
        <Overlay z={95}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden border border-amber-300">
            <div className="bg-amber-500 text-slate-950 p-3 font-black text-sm flex items-center gap-2"><AlertTriangle className="w-5 h-5" /> الوردية دي مسجلة قبل كده</div>
            <div className="p-4 flex flex-col gap-3 text-xs">
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 grid grid-cols-2 gap-2 font-bold">
                <div className="text-slate-500">{existingShiftLog.date} - {existingShiftLog.shift}</div>
                <div className="text-slate-500 text-left" dir="ltr">{existingShiftLog.time}</div>
                <div>المسجل: <span className="font-mono text-blue-700">{existingShiftLog.billets} بليت</span></div>
                <div className="font-mono text-green-700">{existingShiftLog.tons.toFixed(1)} طن</div>
                <div className="col-span-2 border-t border-slate-200 pt-2">الجديد: <span className="font-mono text-amber-700">{Number(shiftBillets)} بليت</span> <span className="font-mono text-slate-500">({(Number(shiftBillets) * billetWeight).toFixed(1)} طن)</span></div>
              </div>
              <button onClick={() => commitShift('replace')} className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 rounded-lg shadow">
                استبدال الرقم المسجل بالجديد ({Number(shiftBillets)} بليت)
              </button>
              <button onClick={() => commitShift('add')} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-lg shadow">
                إضافته على المسجل (المجموع {existingShiftLog.billets + Number(shiftBillets)} بليت)
              </button>
              <button onClick={() => setDupModal(false)} className="w-full bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold py-2 rounded-lg">إلغاء</button>
            </div>
          </div>
        </Overlay>
      )}

      {/* ===== نافذة تبديل موتور ===== */}
      {swapModal.isOpen && swapModal.motorIndex !== null && (
        <Overlay z={85}>
          <form onSubmit={handleConfirmSwapMotor} className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-300">
            <div className="bg-slate-900 text-white p-3 flex justify-between items-center">
              <h3 className="font-bold text-sm flex items-center gap-2"><Cpu className="w-4 h-4 text-amber-400" /> تبديل موتور ({motors[swapModal.motorIndex]?.location})</h3>
              <button type="button" onClick={() => setSwapModal({ isOpen: false, motorIndex: null, newSerial: '', newKw: '', newRpm: '', reason: '' })}><X className="w-4 h-4 text-slate-400" /></button>
            </div>
            <div className="p-4 space-y-3 text-xs">
              <div className="bg-slate-100 p-2.5 rounded-lg font-bold text-slate-700">
                الموتور الحالي: <span className="font-mono text-blue-700">{motors[swapModal.motorIndex]?.serial}</span> ({motors[swapModal.motorIndex]?.kw} kW)
              </div>
              <div>
                <label className="font-bold block mb-1">سيريال / كود الموتور البديل:</label>
                <input type="text" required value={swapModal.newSerial} onChange={e => setSwapModal({ ...swapModal, newSerial: e.target.value })} className="w-full border border-slate-300 rounded p-2 font-mono" placeholder="مثلاً: MTR-SPARE-04" />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold block mb-1">القدرة الجديدة (kW):</label>
                  <input type="number" value={swapModal.newKw} onChange={e => setSwapModal({ ...swapModal, newKw: e.target.value })} className="w-full border border-slate-300 rounded p-2 font-mono" />
                </div>
                <div>
                  <label className="font-bold block mb-1">أقصى لفات (Max RPM):</label>
                  <input type="number" value={swapModal.newRpm} onChange={e => setSwapModal({ ...swapModal, newRpm: e.target.value })} className="w-full border border-slate-300 rounded p-2 font-mono" />
                </div>
              </div>
              <div>
                <label className="font-bold block mb-1">سبب التغيير (صيانة رولمان بلي، شورت، عزل...):</label>
                <input type="text" value={swapModal.reason} onChange={e => setSwapModal({ ...swapModal, reason: e.target.value })} className="w-full border border-slate-300 rounded p-2" placeholder="اكتب سبب التغيير..." />
              </div>
              <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-lg shadow">تأكيد التبديل وحفظ في السجل</button>
            </div>
          </form>
        </Overlay>
      )}

      {/* ===== صفحة الدرفيل التفصيلية ===== */}
      {rollModal.isOpen && selectedRollStand && (() => {
        const st = selectedRollStand;
        const stat = getStandStatus(st.accumulatedTons, st.maxLimit);
        const pct = Math.min(100, Math.max(0, (st.accumulatedTons / st.maxLimit) * 100));
        const rollTotal = st.passes.reduce((a, p) => a + (Number(p.tons) || 0), 0);
        const usedCount = st.passes.filter(p => p.status === 'used' || p.status === 'active').length;
        const ordered = st.passes.filter(p => p.order !== null && p.order !== undefined).sort((a, b) => a.order - b.order);
        const myPending = pendingList.filter(r => String(r.standId) === String(st.id));
        const kpi = (label, value, unit, cls = 'text-slate-900') => (
          <div className="bg-white rounded-xl border border-slate-200 p-3 flex flex-col gap-0.5">
            <span className="text-[10px] font-bold text-slate-500">{label}</span>
            <span className={`font-mono font-black text-xl leading-tight ${cls}`}>{value}<span className="text-[10px] font-bold text-slate-400 mr-1">{unit}</span></span>
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
                        {st.diameter && <span className="bg-slate-800 border border-slate-700 px-2 py-0.5 rounded">القطر: <span className="font-mono text-amber-300">{st.diameter}</span> مم</span>}
                        {st.hardness && <span className="bg-slate-800 border border-slate-700 px-2 py-0.5 rounded">الصلابة: <span className="font-mono">{st.hardness}</span></span>}
                        {st.rollCode && <span className="bg-slate-800 border border-slate-700 px-2 py-0.5 rounded">كود الدرفيل: <span className="font-mono">{st.rollCode}</span></span>}
                        <span className="bg-slate-800 border border-slate-700 px-2 py-0.5 rounded">دخل الخدمة: <span className="font-mono text-green-400">{st.entryDate}</span></span>
                      </div>
                    </div>
                  </div>
                  <button onClick={() => setRollModal({ isOpen: false, standIndex: null, isEditingInfo: false })} className="text-slate-300 hover:text-white bg-slate-800 p-1.5 rounded-lg shrink-0"><X className="w-5 h-5" /></button>
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
                {myPending.map(r => (
                  <div key={r.id} className={`rounded-xl border p-2.5 text-xs font-bold flex items-center justify-between gap-2 ${r.status === 'pending' ? 'bg-amber-50 border-amber-300 text-amber-900' : 'bg-red-50 border-red-300 text-red-800'}`}>
                    <span className="flex items-center gap-1.5">
                      {r.status === 'pending' ? <Hourglass className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                      {r.status === 'pending' ? 'بانتظار موافقة المدير: ' : 'المدير رفض الطلب: '}
                      {r.kind === 'newRoll' ? 'تركيب درفيل جديد' : `نقل من ممر ${r.fromPass} إلى ممر ${r.targetPass}`}
                    </span>
                    {r.status === 'rejected' && <button onClick={() => dismissRequest(r.id)} className="bg-white border border-red-300 px-2 py-0.5 rounded text-[10px]">حسناً</button>}
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
                    <button onClick={() => initiateResetStand(rollModal.standIndex)} className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-2 rounded-lg text-xs flex items-center gap-1.5 shadow">
                      <ArrowLeftRight className="w-3.5 h-3.5" /> {isManagerLike ? 'تغيير الممر' : 'طلب تغيير ممر'}
                    </button>
                    <button onClick={handleInstallNewRoll} className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold px-3 py-2 rounded-lg text-xs flex items-center gap-1.5 border border-emerald-300">
                      <RefreshCw className="w-3.5 h-3.5" /> {isManagerLike ? 'تركيب درفيل جديد' : 'طلب تركيب درفيل جديد'}
                    </button>
                    <button onClick={() => setHistoryModal({ isOpen: true, standId: st.id })} className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold px-3 py-2 rounded-lg text-xs flex items-center gap-1.5 border border-slate-300">
                      <History className="w-3.5 h-3.5" /> السجل
                    </button>
                  </div>
                  {isManagerLike && (
                    <button onClick={() => setRollModal(prev => ({ ...prev, isEditingInfo: !prev.isEditingInfo }))} className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold px-3 py-2 rounded-lg text-xs flex items-center gap-1.5 border border-slate-300">
                      <Edit3 className="w-3.5 h-3.5 text-blue-600" /> {rollModal.isEditingInfo ? 'إخفاء التعديل' : 'تعديل بيانات الدرفيل'}
                    </button>
                  )}
                </div>

                {isManagerLike && rollModal.isEditingInfo && (
                  <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-3 grid grid-cols-2 sm:grid-cols-6 gap-2.5 items-end">
                    {[['كود الدرفيل', 'rollCode', 'text'], ['القطر (مم)', 'diameter', 'text'], ['الصلابة', 'hardness', 'text'], ['شكل الممر', 'type', 'text'], ['تاريخ الدخول', 'entryDate', 'date'], ['عدد الممرات', 'totalPasses', 'number']].map(([label, key, type]) => (
                      <div key={key}>
                        <label className="text-[10px] font-bold text-slate-700 block mb-1">{label}:</label>
                        <input type={type} min={type === 'number' ? 1 : undefined} max={type === 'number' ? 40 : undefined} value={rollEditForm[key]}
                          onChange={e => setRollEditForm({ ...rollEditForm, [key]: e.target.value })}
                          className="w-full p-1.5 rounded border border-slate-300 text-xs font-mono bg-white" />
                      </div>
                    ))}
                    <div className="col-span-2 sm:col-span-6 flex justify-end">
                      <button onClick={handleSaveRollMetadata} className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-5 py-1.5 rounded-lg text-xs flex items-center gap-1 shadow"><Save className="w-3.5 h-3.5" /> حفظ التعديلات</button>
                    </div>
                  </div>
                )}

                <div className="bg-white p-3 rounded-xl border border-slate-200">
                  <h4 className="text-xs font-black text-slate-800 mb-2 flex items-center gap-1.5"><Layers className="w-4 h-4 text-blue-600" /> تسلسل تشغيل الممرات</h4>
                  {ordered.length === 0 ? <p className="text-[11px] text-slate-400 font-bold">لم يبدأ التشغيل بعد.</p> : (
                    <div className="flex flex-wrap items-center gap-1.5">
                      {ordered.map((p, i) => (
                        <div key={p.passNumber} className="flex items-center gap-1.5">
                          <div className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1.5 border ${p.status === 'active' ? 'bg-slate-900 text-amber-400 border-amber-500' : 'bg-blue-50 text-blue-900 border-blue-200'}`}>
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
                  {st.passes.map(p => {
                    const isCurrent = p.status === 'active' || p.passNumber === st.activePass;
                    const isUsed = !isCurrent && p.status === 'used';
                    return (
                      <div key={p.passNumber} onClick={() => { if (!isCurrent) initiateResetStand(rollModal.standIndex, p.passNumber); }}
                        className={`rounded-xl border-2 p-2 flex flex-col gap-1.5 transition-all relative ${isCurrent ? 'bg-slate-900 text-white border-amber-400 shadow-lg' : isUsed ? 'bg-blue-50 text-blue-950 border-blue-300 hover:bg-blue-100 cursor-pointer' : 'bg-white text-slate-700 border-slate-200 hover:border-blue-400 cursor-pointer'}`}>
                        <div className="flex justify-between items-center">
                          <span className="font-black text-xs">ممر {p.passNumber}</span>
                          {p.order && <span className="bg-amber-400 text-slate-950 font-black text-[9px] px-1.5 rounded">#{p.order}</span>}
                        </div>
                        <div className="text-center">
                          <span className={`font-mono font-black text-xl leading-none ${isCurrent ? 'text-amber-400' : isUsed ? 'text-blue-900' : 'text-slate-300'}`}>{Number(p.tons || 0).toFixed(0)}</span>
                          <span className="text-[9px] font-bold opacity-70 mr-1">طن</span>
                        </div>
                        <span className={`text-center text-[9px] font-bold py-0.5 rounded ${isCurrent ? 'bg-amber-400 text-slate-950' : isUsed ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'}`}>
                          {isCurrent ? 'شغال حالياً' : isUsed ? 'منتهي' : 'جديد'}
                        </span>
                        {isManagerLike && !isCurrent && (
                          <div className="flex gap-1 pt-1 border-t border-slate-300/60" onClick={e => e.stopPropagation()}>
                            <button onClick={() => { const v = prompt(`أدخل الإنتاج التراكمي للممر رقم ${p.passNumber} (بالطن):`, p.tons || 0); if (v !== null) handleDirectPassStatusChange(rollModal.standIndex, p.passNumber, Number(v) > 0 ? 'used' : 'unused', Number(v)); }}
                              className="text-[9px] bg-slate-200 hover:bg-slate-300 text-slate-800 px-1.5 py-0.5 rounded font-bold flex-1">تعديل</button>
                            {isUsed && <button onClick={() => handleDirectPassStatusChange(rollModal.standIndex, p.passNumber, 'unused', 0)} className="text-[9px] bg-red-100 hover:bg-red-200 text-red-700 px-1.5 py-0.5 rounded font-bold">تصفير</button>}
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
              <h3 className="font-bold text-sm flex items-center gap-2"><RotateCcw className="w-4 h-4 text-amber-400" /> {isManagerLike ? 'تغيير ممر' : 'طلب تغيير ممر'} - {resetStandObj.name}</h3>
              <button onClick={() => setResetModal({ isOpen: false, standIndex: null })} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-4 flex flex-col gap-3 overflow-y-auto">
              <div className="bg-blue-50 border border-blue-200 p-2.5 rounded-lg flex justify-between items-center text-xs font-bold text-blue-900">
                <span>الممر الشغال: <strong className="bg-slate-900 text-amber-400 px-2 py-0.5 rounded font-mono">ممر {resetStandObj.activePass}</strong></span>
                <span>الإنتاج: <strong className="font-mono text-blue-700">{resetStandObj.accumulatedTons.toFixed(0)} طن</strong></span>
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-black text-slate-800 flex items-center gap-1"><Layers className="w-4 h-4 text-blue-600" /> 1. اختر الممر الجديد:</label>
                <div className="grid grid-cols-6 sm:grid-cols-8 gap-1.5 bg-slate-100 p-2 rounded-xl border border-slate-200 max-h-40 overflow-y-auto">
                  {resetStandObj.passes.map(p => {
                    const sel = Number(resetTargetPass) === p.passNumber;
                    const cur = p.passNumber === resetStandObj.activePass;
                    const used = p.status === 'used' && !cur;
                    return (
                      <button type="button" key={p.passNumber} onClick={() => setResetTargetPass(p.passNumber)}
                        className={`p-1.5 rounded-lg font-mono text-xs font-black border-2 flex flex-col items-center transition-all ${sel ? 'bg-emerald-600 text-white border-emerald-900 shadow-md scale-105' : cur ? 'bg-slate-900 text-amber-400 border-amber-400' : used ? 'bg-blue-100 text-blue-900 border-blue-300 opacity-80' : 'bg-white text-slate-800 border-slate-300 hover:border-blue-500'}`}>
                        <span>{p.passNumber}</span>
                        <span className="text-[8px] font-normal opacity-80">{cur ? 'الحالي' : used ? `${Number(p.tons).toFixed(0)}ط` : 'جديد'}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-slate-700">تاريخ التغيير:</label>
                  <input type="date" value={resetDateInput} onChange={handleResetDateChange} className="w-full border border-slate-300 rounded p-1.5 font-mono text-xs focus:border-blue-500 outline-none" />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold text-slate-700">الوردية:</label>
                  <select value={resetShiftInput} onChange={(e) => setResetShiftInput(e.target.value)} className="w-full bg-white border border-slate-300 text-[10px] font-bold p-1.5 rounded outline-none focus:border-blue-500">
                    {resetModalShifts.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-700">عدد بليت الممر القديم (ممر {resetStandObj.activePass}) قبل التغيير:</label>
                <input type="number" value={resetBillets} onChange={e => setResetBillets(e.target.value)} className="w-full border border-slate-300 rounded p-2 font-mono text-xs focus:border-blue-500 outline-none" placeholder="اتركه فارغاً لحساب كامل الإنتاج الحالي للممر القديم" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold text-slate-700">ملاحظات أو سبب التغيير:</label>
                <textarea rows="2" value={resetNotes} onChange={e => setResetNotes(e.target.value)} className="w-full border border-slate-300 rounded p-2 text-xs focus:border-blue-500 outline-none resize-none" placeholder="تآكل ممر، خشونة، كسر، تغيير مقاس..."></textarea>
              </div>
              <button onClick={confirmResetStand} className="w-full bg-blue-600 text-white font-bold py-2.5 rounded-lg hover:bg-blue-700 active:scale-95 transition-all shadow text-xs sm:text-sm">
                {isManagerLike ? `تأكيد قفل ممر ${resetStandObj.activePass} وتشغيل ممر ${resetTargetPass}` : `إرسال الطلب للمدير (ممر ${resetStandObj.activePass} ← ممر ${resetTargetPass})`}
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
              <h3 className="font-bold text-sm flex items-center gap-2"><Inbox className="w-4 h-4 text-amber-400" /> طلبات بانتظار الموافقة ({pendingCount})</h3>
              <button onClick={() => setApprovalsOpen(false)} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-3 overflow-y-auto flex flex-col gap-3 bg-slate-50">
              {pendingCount === 0 && <div className="text-center py-10 text-slate-400 font-bold text-sm">مفيش طلبات معلّقة.</div>}
              {pendingList.filter(r => r.status === 'pending').map(r => {
                const st = stands.find(s => String(s.id) === String(r.standId));
                const ed = getEdit(r);
                return (
                  <div key={r.id} className="bg-white border border-slate-200 rounded-xl p-3 flex flex-col gap-2 shadow-sm">
                    <div className="flex justify-between items-center flex-wrap gap-1">
                      <span className="font-black text-sm text-slate-900">{r.standName}</span>
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded ${r.kind === 'newRoll' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'}`}>{r.kind === 'newRoll' ? 'تركيب درفيل جديد' : 'تغيير ممر'}</span>
                    </div>
                    <div className="text-[10px] text-slate-500 font-bold">من: {r.requestedBy} | {r.createdAt} | {r.date} - {r.shift} | مقاس {r.productSize}</div>
                    {r.kind === 'pass' ? (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[10px] font-bold">
                        <div><label className="block text-slate-600 mb-0.5">من ممر {r.fromPass} إلى ممر:</label>
                          <select value={ed.targetPass} onChange={e => setEdit(r.id, { targetPass: Number(e.target.value) })} className="w-full border border-slate-300 rounded p-1.5 font-mono bg-white">
                            {st && st.passes.map(p => <option key={p.passNumber} value={p.passNumber}>ممر {p.passNumber}</option>)}
                          </select></div>
                        <div><label className="block text-slate-600 mb-0.5">بليت الممر القديم:</label>
                          <input type="number" value={ed.billets} onChange={e => setEdit(r.id, { billets: e.target.value })} className="w-full border border-slate-300 rounded p-1.5 font-mono" /></div>
                        <div className="col-span-2 sm:col-span-1"><label className="block text-slate-600 mb-0.5">ملاحظات:</label>
                          <input type="text" value={ed.notes || ''} onChange={e => setEdit(r.id, { notes: e.target.value })} className="w-full border border-slate-300 rounded p-1.5" /></div>
                      </div>
                    ) : (
                      <p className="text-[11px] text-slate-600 font-bold bg-slate-50 border border-slate-200 rounded p-2">هيتم تصفير كل ممرات {r.standName} والبدء من ممر 1 بتاريخ {r.date}.</p>
                    )}
                    <div className="flex gap-2 justify-end">
                      <button onClick={() => rejectRequest(r)} className="bg-red-50 hover:bg-red-100 text-red-700 border border-red-300 font-bold px-4 py-1.5 rounded-lg text-xs flex items-center gap-1"><XCircle className="w-3.5 h-3.5" /> رفض</button>
                      <button onClick={() => approveRequest(r)} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-1.5 rounded-lg text-xs flex items-center gap-1 shadow"><Check className="w-3.5 h-3.5" /> اعتماد</button>
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
              <h3 className="font-bold text-sm flex items-center gap-2"><History className="w-4 h-4" /> سجل تغييرات ستاند {historyModal.standId}</h3>
              <button onClick={() => setHistoryModal({ isOpen: false, standId: null })} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-3 overflow-y-auto flex-1 flex flex-col gap-2 bg-slate-50">
              {passChanges.filter(c => String(c.standId) === String(historyModal.standId)).length === 0 ? (
                <div className="text-center py-8 text-slate-400 font-bold text-xs">لا يوجد سجل تغييرات لهذا الستاند.</div>
              ) : passChanges.filter(c => String(c.standId) === String(historyModal.standId)).map(c => (
                <div key={c.id} className="bg-white p-2.5 rounded-lg border border-slate-200 shadow-sm flex flex-col gap-1.5">
                  <div className="flex justify-between items-center border-b border-slate-100 pb-1">
                    <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">{c.date} | <span className="text-blue-700">{c.shift}</span></span>
                    <span className="text-[11px] font-black text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-100">إنتاج: {Number(c.tons).toFixed(1)} طن</span>
                  </div>
                  <div className="flex justify-between text-[10px] text-slate-600 font-bold">
                    <span>مقاس: {c.productSize} مم</span>
                    <span>{c.kind === 'newRoll' ? 'تركيب درفيل جديد' : `من ممر ${c.fromPass} ← ممر ${c.toPass}`}</span>
                    <span>بليت: {c.billetsAtChange || 0}</span>
                  </div>
                  <p className="text-[10px] text-slate-700 bg-orange-50 p-1.5 rounded border border-orange-100"><span className="font-bold text-orange-700">ملاحظات:</span> {c.notes}</p>
                </div>
              ))}
            </div>
          </div>
        </Overlay>
      )}

      {/* إعدادات الشعار */}
      {isSettingsOpen && (
        <Overlay z={50}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden border border-slate-300">
            <div className="bg-slate-800 p-3 flex justify-between items-center text-white">
              <h3 className="font-bold text-sm flex items-center gap-2"><Settings className="w-4 h-4" /> إعدادات الشعار</h3>
              <button onClick={() => setIsSettingsOpen(false)} className="text-slate-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-4 flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1"><UploadCloud className="w-4 h-4 text-blue-600" /> رفع لوجو المصنع (من الجهاز):</label>
                <input type="file" accept="image/png, image/jpeg, image/webp" onChange={handleLogoUpload}
                  className="w-full border border-slate-300 rounded p-1.5 text-xs cursor-pointer" />
              </div>
              {tempLogoUrl && (
                <div className="bg-slate-100 p-3 rounded-lg border border-slate-200 flex flex-col items-center gap-2">
                  <div className="bg-white p-2 rounded shadow-sm"><img src={tempLogoUrl} alt="Preview" className="h-16 object-contain" /></div>
                </div>
              )}
              <button onClick={handleSaveSettings} className="w-full bg-blue-600 text-white font-bold py-2.5 rounded-lg hover:bg-blue-700 flex justify-center items-center gap-2 shadow-md"><Save className="w-4 h-4" /> تطبيق الشعار</button>
            </div>
          </div>
        </Overlay>
      )}

      {/* شريط الأدمن */}
      {isSuperAdmin && (
        <div className="bg-amber-500 text-slate-950 px-3 py-1 rounded flex flex-wrap justify-between items-center gap-2 shadow-sm flex-none">
          <div className="flex items-center gap-1.5 text-xs font-black">
            <ShieldAlert className="w-4 h-4" /><span>وضع الأدمن الشامل:</span>
            {adminState.isMaintenance && <span className="bg-red-700 text-white text-[9px] px-1.5 py-0.5 rounded">الموقع مغلق للزوار</span>}
          </div>
          <div className="flex items-center gap-1">
            {[['tech', 'عرض كـ فني', Edit3], ['manager', 'عرض كـ مدير', UserCog]].map(([r, label, Icon]) => (
              <button key={r} onClick={() => handleSuperAdminSwitchRole(r)} className={`px-2.5 py-1 rounded text-[10px] font-black flex items-center gap-1 ${currentUser === r ? 'bg-slate-900 text-amber-400 shadow' : 'bg-amber-400/60 hover:bg-amber-400 text-slate-900'}`}><Icon className="w-3 h-3" /> {label}</button>
            ))}
            <button onClick={() => handleSuperAdminSwitchRole('admin')} className={`px-2.5 py-1 rounded text-[10px] font-black flex items-center gap-1 ${currentUser === 'admin' && activeTab === 'admin' ? 'bg-slate-900 text-amber-400 shadow' : 'bg-amber-400/60 hover:bg-amber-400 text-slate-900'}`}><Settings2 className="w-3 h-3" /> إعدادات الأدمن</button>
          </div>
        </div>
      )}

      {/* الشريط العلوي للمصنع */}
      <nav className="bg-slate-900 text-white p-2 rounded flex flex-col gap-2 flex-none shadow-sm select-none">
        <div className="flex justify-between items-center relative h-10">
          <div onClick={handleSecretAdminTrigger} className="flex items-center gap-2 z-10 cursor-pointer">
            {customLogo && <div className="bg-white p-1 rounded shadow-sm flex shrink-0"><img src={customLogo} alt="Logo" className="h-5 sm:h-7 w-auto max-w-[70px] sm:max-w-[120px] object-contain" /></div>}
            <span className
