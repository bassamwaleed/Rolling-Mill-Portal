import React, { useState } from 'react';
import {
  Calculator, Wrench, Building2, Zap, Search,
  PlusCircle, Key, ArrowRight, ThumbsUp, MessageCircle,
  Gauge, Layers, Scissors, Flame, Activity, Ruler, Boxes, RotateCcw
} from 'lucide-react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';

// ============================================================================
// البيانات الأولية: المنشورات التفاعلية (Posts & Comments) + الأعطال + الشركات
// ============================================================================
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
        text: 'معلومة ذهبية! وعشان كدا ضبط عدد العلب المغلقة في الأبرون (X = V² / 8) بيفرق جداً في مسافة الرمي.',
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

const INITIAL_STANDS_PASSES = Array.from({ length: 12 }, (_, i) => ({
  id: i + 1,
  name: `قائم ${i + 1}`,
  zone: i < 4 ? 'تخشين (Roughing)' : i < 8 ? 'متوسط (Intermediate)' : 'تشطيب (Finishing)',
  rollCode: `RL-${201 + i}`,
  collarDia: 485 - i * 10,
  grooveFactor: 12,
  gapMm: 3.5,
  activePass: (i % 4) + 1,
  totalPasses: 5,
  passTons: 175 + ((i * 40) % 210),
  maxPassTons: 420,
  totalRollTons: 1650 + i * 130,
  minScrapDia: 420 - i * 10
}));

const INITIAL_COMPANIES = [
  {
    id: 'comp1',
    name: 'شركة الجيوشي للصلب (El Gioshy Steel)',
    code: 'GIOSHY-2026',
    plan: 'الباقة الاحترافية لإدارة الدرافيل والممرات',
    status: 'active'
  },
  {
    id: 'comp2',
    name: 'مصنع الدرفلة النموذجي (Demo Mill)',
    code: 'DEMO-2026',
    plan: 'الباقة التجريبية',
    status: 'active'
  }
];

// جدول مواصفة الأوزان القياسية لحديد التسليح (ECISP / ISO 6935-2)
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

// ============================================================================
// جداول تحويل الوحدات (القيمة = معامل التحويل للوحدة الأساسية لكل مجموعة)
// ============================================================================
const UNIT_GROUPS = {
  speed: {
    label: 'السرعة الخطية',
    units: [['m/s', 1], ['m/min', 1 / 60], ['km/h', 1 / 3.6], ['ft/min', 0.3048 / 60], ['ft/s', 0.3048], ['in/s', 0.0254]]
  },
  rot: {
    label: 'السرعة الدورانية',
    units: [['RPM', 1], ['rad/s', 60 / (2 * Math.PI)], ['Hz', 60], ['deg/s', 1 / 6]]
  },
  length: {
    label: 'الطول والأبعاد',
    units: [['mm', 1], ['cm', 10], ['m', 1000], ['in', 25.4], ['ft', 304.8]]
  },
  mass: {
    label: 'الوزن',
    units: [['kg', 1], ['ton', 1000], ['lb', 0.45359237], ['g', 0.001]]
  },
  linmass: {
    label: 'وزن المتر الطولي',
    units: [['kg/m', 1], ['lb/ft', 1.488164], ['g/m', 0.001]]
  },
  power: {
    label: 'القدرة',
    units: [['kW', 1], ['W', 0.001], ['MW', 1000], ['hp', 0.745700], ['PS', 0.735499]]
  },
  force: {
    label: 'القوة / حمل الدرفلة',
    units: [['kN', 1], ['N', 0.001], ['ton-f', 9.80665], ['kgf', 0.00980665], ['MN', 1000]]
  },
  torque: {
    label: 'عزم الدوران',
    units: [['kN.m', 1], ['N.m', 0.001], ['kgf.m', 0.00980665], ['ton-f.m', 9.80665]]
  },
  stress: {
    label: 'الإجهاد / الضغط',
    units: [['MPa', 1], ['kgf/cm²', 0.0980665], ['bar', 0.1], ['psi', 0.006894757]]
  },
  temp: {
    label: 'درجة الحرارة',
    temp: true,
    units: [['°C', 1], ['°F', 1], ['K', 1]]
  }
};

const toCelsius = (v, u) => (u === '°F' ? ((v - 32) * 5) / 9 : u === 'K' ? v - 273.15 : v);
const fromCelsius = (c, u) => (u === '°F' ? (c * 9) / 5 + 32 : u === 'K' ? c + 273.15 : c);

// ============================================================================
// عناصر واجهة موحدة (لتثبيت التصميم في كل الحاسبات)
// ============================================================================
const num = (v) => (Number.isFinite(Number(v)) ? Number(v) : 0);
const fmt = (n, d = 2) => (Number.isFinite(n) ? n.toFixed(d) : '—');

const inputCls =
  'w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white font-mono text-sm';

const Field = ({ label, value, onChange, step, className = '' }) => (
  <div className={className}>
    <label className="text-xs text-slate-400 block mb-1">{label}</label>
    <input
      type="number"
      inputMode="decimal"
      step={step}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={inputCls}
    />
  </div>
);

const SelectField = ({ label, value, onChange, options, className = '' }) => (
  <div className={className}>
    <label className="text-xs text-slate-400 block mb-1">{label}</label>
    <select value={value} onChange={(e) => onChange(e.target.value)} className={inputCls}>
      {options.map((o) => (
        <option key={o[0]} value={o[0]}>
          {o[1]}
        </option>
      ))}
    </select>
  </div>
);

const Stat = ({ label, value, unit, color = 'text-white', big = false }) => (
  <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800">
    <span className="text-xs text-slate-400 block">{label}</span>
    <span className={`font-bold font-mono ${big ? 'text-xl' : 'text-lg'} ${color}`}>
      {value}
      {unit ? ` ${unit}` : ''}
    </span>
  </div>
);

const Row = ({ label, value, color = 'text-white', top = false }) => (
  <div className={`flex justify-between gap-3 ${top ? 'pt-2 border-t border-slate-800' : ''}`}>
    <span className="text-slate-400">{label}</span>
    <span className={`font-mono font-bold whitespace-nowrap ${color}`}>{value}</span>
  </div>
);

const Box = ({ children }) => (
  <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2 text-sm">{children}</div>
);

const Title = ({ children, color = 'text-white' }) => (
  <h3 className={`text-lg sm:text-xl font-bold ${color} border-b border-slate-800 pb-3`}>{children}</h3>
);

const Formula = ({ children }) => (
  <p dir="ltr" className="text-[11px] text-slate-500 font-mono text-left leading-relaxed">
    {children}
  </p>
);

const Shell = ({ inputs, results, border = 'border-blue-500/30' }) => (
  <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
    <div className="lg:col-span-7 bg-slate-900 p-4 sm:p-6 rounded-3xl border border-slate-800 space-y-4">
      {inputs}
    </div>
    <div className={`lg:col-span-5 bg-slate-900 p-4 sm:p-6 rounded-3xl border ${border} space-y-4`}>
      {results}
    </div>
  </div>
);

// ============================================================================
// 1. مركز الحاسبات الهندسية: حاسبات منفصلة + حاسبات مجمّعة
// ============================================================================
const rpmFromV = (v, dw) => (dw > 0 ? (v * 60000) / (Math.PI * dw) : 0);
const vFromRpm = (n, dw) => (Math.PI * dw * n) / 60000;
const zoneOf = (rpm, base, max) => {
  if (rpm <= 0) return ['—', 'text-slate-400'];
  if (rpm < base) return ['أقل من Base Speed: فقد في العزم', 'text-red-400'];
  if (rpm <= 0.86 * max) return ['داخل النطاق الآمن', 'text-emerald-400'];
  if (rpm <= max) return ['منطقة حرجة (أعلى من 0.86×Max)', 'text-amber-400'];
  return ['تجاوز السرعة القصوى للموتور!', 'text-red-400'];
};

const DW = { k: 'dw', label: 'القطر الفعال Dw', unit: 'mm', def: 480 };
const GR = { k: 'gr', label: 'نسبة الجيربوكس', unit: '', def: 3.4, step: 0.1 };
const jogRollOf = (n) => (n.on === 'motor' ? (n.gr > 0 ? n.rpm / n.gr : 0) : n.rpm);

const GROUPS = [
  { id: 'speed', title: 'السرعات والدوران', icon: Gauge, color: 'from-sky-600 to-blue-500' },
  { id: 'pass', title: 'الممرات والتشكيل', icon: Layers, color: 'from-teal-600 to-emerald-500' },
  { id: 'load', title: 'الحمل والعزم والقدرة', icon: Flame, color: 'from-amber-600 to-orange-500' },
  { id: 'prod', title: 'الإنتاج والتشغيل', icon: Activity, color: 'from-indigo-600 to-blue-500' },
  { id: 'ctrl', title: 'التحكم والأتمتة', icon: Scissors, color: 'from-purple-600 to-pink-500' },
  { id: 'misc', title: 'أوزان وتحويلات ومواصفات', icon: Ruler, color: 'from-rose-600 to-pink-500' }
];

// كل حاسبة = عالم مستقل: مدخلاتها ومخرجاتها وقانونها
const CALCS = [
  // ---------------- السرعات والدوران ----------------
  {
    id: 'lin_speed', group: 'speed', title: 'السرعة الخطية',
    desc: 'تدخل السرعة الخطية (m/s) فتحصل على لفات الدرفيل والموتور.',
    inputs: [{ k: 'v', label: 'السرعة الخطية', unit: 'm/s', def: 12, step: 0.1 }, DW, GR],
    outputs: [
      { label: 'لفات الدرفيل', unit: 'RPM', d: 1, fn: (n) => rpmFromV(n.v, n.dw) },
      { label: 'لفات الموتور', unit: 'RPM', d: 1, fn: (n) => rpmFromV(n.v, n.dw) * n.gr },
      { label: 'السرعة', unit: 'm/min', d: 1, fn: (n) => n.v * 60 },
      { label: 'السرعة', unit: 'km/h', d: 2, fn: (n) => n.v * 3.6 },
      { label: 'ω الدرفيل', unit: 'rad/s', d: 2, fn: (n) => (rpmFromV(n.v, n.dw) * 2 * Math.PI) / 60 }
    ],
    formula: 'N_roll = 60000·V / (π·Dw)  |  N_mot = N_roll × GR'
  },
  {
    id: 'roll_speed', group: 'speed', title: 'سرعة دوران الدرفيل',
    desc: 'تدخل لفات الدرفيل فتحصل على السرعة الخطية ولفات الموتور.',
    inputs: [{ k: 'n', label: 'لفات الدرفيل', unit: 'RPM', def: 427 }, DW, GR],
    outputs: [
      { label: 'السرعة الخطية', unit: 'm/s', d: 3, fn: (n) => vFromRpm(n.n, n.dw) },
      { label: 'لفات الموتور', unit: 'RPM', d: 1, fn: (n) => n.n * n.gr },
      { label: 'السرعة', unit: 'm/min', d: 1, fn: (n) => vFromRpm(n.n, n.dw) * 60 },
      { label: 'السرعة', unit: 'km/h', d: 2, fn: (n) => vFromRpm(n.n, n.dw) * 3.6 },
      { label: 'ω الدرفيل', unit: 'rad/s', d: 2, fn: (n) => (n.n * 2 * Math.PI) / 60 }
    ],
    formula: 'V = π·Dw·N_roll / 60000'
  },
  {
    id: 'motor_speed', group: 'speed', title: 'سرعة دوران الموتور',
    desc: 'تدخل لفات الموتور فتحصل على لفات الدرفيل والسرعة الخطية.',
    inputs: [{ k: 'n', label: 'لفات الموتور', unit: 'RPM', def: 1450 }, DW, GR],
    outputs: [
      { label: 'السرعة الخطية', unit: 'm/s', d: 3, fn: (n) => vFromRpm(n.gr > 0 ? n.n / n.gr : 0, n.dw) },
      { label: 'لفات الدرفيل', unit: 'RPM', d: 1, fn: (n) => (n.gr > 0 ? n.n / n.gr : 0) },
      { label: 'السرعة', unit: 'm/min', d: 1, fn: (n) => vFromRpm(n.gr > 0 ? n.n / n.gr : 0, n.dw) * 60 },
      { label: 'السرعة', unit: 'km/h', d: 2, fn: (n) => vFromRpm(n.gr > 0 ? n.n / n.gr : 0, n.dw) * 3.6 }
    ],
    formula: 'N_roll = N_mot / GR'
  },
  {
    id: 'jog', group: 'speed', title: 'السرعة البطيئة (Jog)',
    desc: 'سرعة Jog على الموتور أو الدرفيل وما يقابلها من سرعة خطية.',
    inputs: [
      { k: 'rpm', label: 'سرعة Jog', unit: 'RPM', def: 100 },
      { k: 'on', label: 'مقاسة على', def: 'motor', options: [['motor', 'الموتور'], ['roll', 'الدرفيل']] },
      DW, GR
    ],
    outputs: [
      { label: 'السرعة الخطية', unit: 'm/s', d: 3, fn: (n) => vFromRpm(jogRollOf(n), n.dw) },
      { label: 'لفات الدرفيل', unit: 'RPM', d: 1, fn: (n) => jogRollOf(n) },
      { label: 'لفات الموتور', unit: 'RPM', d: 1, fn: (n) => jogRollOf(n) * n.gr },
      { label: 'السرعة', unit: 'm/min', d: 1, fn: (n) => vFromRpm(jogRollOf(n), n.dw) * 60 },
      { label: 'زمن قطع متر', unit: 'ث', d: 1, fn: (n) => (vFromRpm(jogRollOf(n), n.dw) > 0 ? 1 / vFromRpm(jogRollOf(n), n.dw) : 0) }
    ],
    formula: 'V_jog = π·Dw·N_roll / 60000'
  },
  {
    id: 'pass_speed', group: 'speed', title: 'سرعة المرور (ثابت الدرفلة)',
    desc: 'سرعة خروج المعدن من الممر من A1·V1 = A2·V2.',
    inputs: [
      { k: 'a1', label: 'مساحة الدخول A1', unit: 'mm²', def: 500 },
      { k: 'a2', label: 'مساحة الخروج A2', unit: 'mm²', def: 390 },
      { k: 'v1', label: 'سرعة الدخول V1', unit: 'm/s', def: 2, step: 0.1 }
    ],
    outputs: [
      { label: 'سرعة الخروج V2', unit: 'm/s', d: 3, fn: (n) => (n.a2 > 0 ? (n.v1 * n.a1) / n.a2 : 0) },
      { label: 'الاستطالة λ', unit: '', d: 3, fn: (n) => (n.a2 > 0 ? n.a1 / n.a2 : 0) },
      { label: 'زيادة السرعة', unit: '%', d: 1, fn: (n) => (n.a2 > 0 ? (n.a1 / n.a2 - 1) * 100 : 0) },
      { label: 'السرعة', unit: 'm/min', d: 1, fn: (n) => (n.a2 > 0 ? (n.v1 * n.a1 * 60) / n.a2 : 0) }
    ],
    formula: 'A1·V1 = A2·V2'
  },
  {
    id: 'next_stand', group: 'speed', title: 'لفات الموتور المطلوبة للقائم التالي',
    desc: 'Cascade: من سرعة القائم الحالي ومساحتي الممرين إلى RPM القائم التالي.',
    inputs: [
      { k: 'a1', label: 'مساحة القائم الحالي A1', unit: 'mm²', def: 500 },
      { k: 'v1', label: 'سرعة القائم الحالي V1', unit: 'm/s', def: 2, step: 0.1 },
      { k: 'a2', label: 'مساحة القائم التالي A2', unit: 'mm²', def: 390 },
      { k: 'slip', label: 'الانزلاق الأمامي', unit: '%', def: 0, step: 0.5 },
      { k: 'dw', label: 'Dw القائم التالي', unit: 'mm', def: 455 },
      { k: 'gr', label: 'Gear Ratio التالي', unit: '', def: 3.4, step: 0.1 }
    ],
    outputs: [
      { label: 'لفات الموتور المطلوبة', unit: 'RPM', d: 1, fn: (n) => rpmFromV(n.a2 > 0 ? ((n.v1 * n.a1) / n.a2) / (1 + n.slip / 100) : 0, n.dw) * n.gr },
      { label: 'لفات الدرفيل', unit: 'RPM', d: 1, fn: (n) => rpmFromV(n.a2 > 0 ? ((n.v1 * n.a1) / n.a2) / (1 + n.slip / 100) : 0, n.dw) },
      { label: 'سرعة المعدن V2', unit: 'm/s', d: 3, fn: (n) => (n.a2 > 0 ? (n.v1 * n.a1) / n.a2 : 0) },
      { label: 'سرعة محيط الدرفيل', unit: 'm/s', d: 3, fn: (n) => (n.a2 > 0 ? ((n.v1 * n.a1) / n.a2) / (1 + n.slip / 100) : 0) }
    ],
    formula: 'V2 = A1·V1/A2  |  V_roll = V2 / (1 + slip)  |  N_mot = 60000·V_roll·GR / (π·Dw)'
  },
  {
    id: 'mill_const', group: 'speed', title: 'ثابت الدرفلة (Q = A × V)',
    desc: 'ثابت الدرفلة وما يقابله من تدفق كتلة المعدن (طن/ساعة).',
    inputs: [
      { k: 'a', label: 'مساحة المقطع A', unit: 'mm²', def: 500 },
      { k: 'v', label: 'السرعة V', unit: 'm/s', def: 2, step: 0.1 }
    ],
    outputs: [
      { label: 'ثابت الدرفلة Q', unit: 'mm²·m/s', d: 0, fn: (n) => n.a * n.v },
      { label: 'تدفق الكتلة', unit: 'طن/س', d: 2, fn: (n) => n.a * n.v * 0.00785 * 3.6 },
      { label: 'تدفق الكتلة', unit: 'كجم/ث', d: 3, fn: (n) => n.a * n.v * 0.00785 }
    ],
    formula: 'Q = A·V  |  kg/s = A(mm²)·V(m/s)·0.00785'
  },
  {
    id: 'over_speed', group: 'speed', title: 'سرعة العض (Over Speed / Lead)',
    desc: 'لفات الموتور بعد إضافة نسبة Over Speed لتحسين عض المقدمة.',
    inputs: [{ k: 'rpm', label: 'لفات الموتور', unit: 'RPM', def: 1450 }, { k: 'p', label: 'نسبة Over Speed', unit: '%', def: 3, step: 0.5 }, DW, GR],
    outputs: [
      { label: 'لفات الموتور بعد Over Speed', unit: 'RPM', d: 1, fn: (n) => n.rpm * (1 + n.p / 100) },
      { label: 'الزيادة', unit: 'RPM', d: 1, fn: (n) => (n.rpm * n.p) / 100 },
      { label: 'السرعة الخطية الجديدة', unit: 'm/s', d: 3, fn: (n) => vFromRpm(n.gr > 0 ? (n.rpm * (1 + n.p / 100)) / n.gr : 0, n.dw) }
    ],
    formula: 'N_lead = N × (1 + OS%)   [المعتاد 2% – 5%]'
  },
  {
    id: 'fwd_slip', group: 'speed', title: 'الانزلاق الأمامي (Forward Slip)',
    desc: 'الفرق بين سرعة محيط الدرفيل وسرعة المعدن الخارج.',
    inputs: [
      { k: 'vr', label: 'سرعة محيط الدرفيل', unit: 'm/s', def: 2, step: 0.01 },
      { k: 'vm', label: 'سرعة المعدن الخارج', unit: 'm/s', def: 2.06, step: 0.01 }
    ],
    outputs: [
      { label: 'الانزلاق الأمامي', unit: '%', d: 2, fn: (n) => (n.vr > 0 ? ((n.vm - n.vr) / n.vr) * 100 : 0) },
      { label: 'فرق السرعة', unit: 'm/s', d: 3, fn: (n) => n.vm - n.vr }
    ],
    formula: 'Slip % = (V_metal − V_roll) / V_roll × 100'
  },
  {
    id: 'wear_speed', group: 'speed', title: 'أثر خراطة الدرفيل على السرعة',
    desc: 'لفات الموتور الجديدة بعد نقص القطر لنفس السرعة الخطية، مع فحص Base/Max.',
    inputs: [
      { k: 'rpm', label: 'لفات الموتور الحالية', unit: 'RPM', def: 1450 },
      { k: 'old', label: 'Dw الحالي', unit: 'mm', def: 480 },
      { k: 'nw', label: 'Dw بعد الخراطة', unit: 'mm', def: 440 },
      { k: 'base', label: 'Base RPM', unit: 'RPM', def: 750 },
      { k: 'max', label: 'Max RPM', unit: 'RPM', def: 1750 }
    ],
    outputs: [
      { label: 'لفات الموتور الجديدة', unit: 'RPM', d: 1, fn: (n) => (n.nw > 0 ? (n.rpm * n.old) / n.nw : 0) },
      { label: 'الزيادة', unit: '%', d: 1, fn: (n) => (n.nw > 0 ? (n.old / n.nw - 1) * 100 : 0) },
      { label: 'الحالة الآن', fn: (n) => zoneOf(n.rpm, n.base, n.max)[0], tone: (n) => zoneOf(n.rpm, n.base, n.max)[1], wide: true },
      { label: 'الحالة بعد الخراطة', fn: (n) => zoneOf(n.nw > 0 ? (n.rpm * n.old) / n.nw : 0, n.base, n.max)[0], tone: (n) => zoneOf(n.nw > 0 ? (n.rpm * n.old) / n.nw : 0, n.base, n.max)[1], wide: true }
    ],
    formula: 'N_new = N × Dw_old / Dw_new'
  },
  // ---------------- الممرات والتشكيل ----------------
  {
    id: 'work_dia', group: 'pass', title: 'القطر الفعال ومعامل الممر',
    desc: 'Groove Factor والقطر الفعال Dw من قطر الدرفيل ومساحة وعرض الممر.',
    inputs: [
      { k: 'de', label: 'القطر الخارجي De', unit: 'mm', def: 480 },
      { k: 'a', label: 'مساحة الممر', unit: 'mm²', def: 500 },
      { k: 'w', label: 'عرض الممر', unit: 'mm', def: 50 },
      { k: 'gap', label: 'الخلوص Gap', unit: 'mm', def: 3, step: 0.5 }
    ],
    outputs: [
      { label: 'القطر الفعال Dw', unit: 'mm', d: 2, fn: (n) => Math.max(1, n.de - (n.w > 0 ? n.a / n.w - n.gap : 0)) },
      { label: 'Groove Factor', unit: 'mm', d: 2, fn: (n) => (n.w > 0 ? n.a / n.w - n.gap : 0) }
    ],
    formula: 'GF = Area/Width − Gap  |  Dw = De − GF'
  },
  {
    id: 'elong', group: 'pass', title: 'الاستطالة ونسبة التخفيض',
    desc: 'الاستطالة وتخفيض المساحة بين مقطعين.',
    inputs: [
      { k: 'a1', label: 'مساحة الدخول A1', unit: 'mm²', def: 500 },
      { k: 'a2', label: 'مساحة الخروج A2', unit: 'mm²', def: 390 }
    ],
    outputs: [
      { label: 'الاستطالة λ = A1/A2', unit: '', d: 3, fn: (n) => (n.a2 > 0 ? n.a1 / n.a2 : 0) },
      { label: 'نسبة التخفيض', unit: '%', d: 2, fn: (n) => (n.a1 > 0 ? ((n.a1 - n.a2) / n.a1) * 100 : 0) },
      { label: 'الزيادة في الطول', unit: '%', d: 1, fn: (n) => (n.a2 > 0 ? (n.a1 / n.a2 - 1) * 100 : 0) },
      { label: 'المساحة المخفضة', unit: 'mm²', d: 1, fn: (n) => n.a1 - n.a2 }
    ],
    formula: 'λ = A1/A2  |  RR% = (A1 − A2)/A1 × 100'
  },
  {
    id: 'draft', group: 'pass', title: 'الضغطة (Draft)',
    desc: 'الضغطة المطلقة والنسبية من ارتفاعي الدخول والخروج.',
    inputs: [
      { k: 'h1', label: 'ارتفاع الدخول H1', unit: 'mm', def: 18, step: 0.5 },
      { k: 'h2', label: 'ارتفاع الخروج H2', unit: 'mm', def: 12, step: 0.5 }
    ],
    outputs: [
      { label: 'الضغطة المطلقة Δh', unit: 'mm', d: 2, fn: (n) => n.h1 - n.h2 },
      { label: 'الضغطة النسبية', unit: '%', d: 1, fn: (n) => (n.h1 > 0 ? ((n.h1 - n.h2) / n.h1) * 100 : 0) }
    ],
    formula: 'Δh = H1 − H2  |  Δh% = Δh / H1 × 100'
  },
  {
    id: 'bite', group: 'pass', title: 'زاوية العض وأقصى ضغطة',
    desc: 'شرط العض μ ≥ tan α لمنع الانزلاق (Slipping).',
    inputs: [
      { k: 'de', label: 'قطر الدرفيل De', unit: 'mm', def: 480 },
      { k: 'mu', label: 'معامل الاحتكاك μ', unit: '', def: 0.35, step: 0.02 },
      { k: 'h1', label: 'ارتفاع الدخول H1', unit: 'mm', def: 18, step: 0.5 },
      { k: 'h2', label: 'ارتفاع الخروج H2', unit: 'mm', def: 12, step: 0.5 }
    ],
    outputs: [
      { label: 'زاوية العض α', unit: '°', d: 1, fn: (n) => (Math.acos(Math.max(-1, Math.min(1, 1 - Math.max(0, n.h1 - n.h2) / Math.max(1, n.de)))) * 180) / Math.PI },
      { label: 'أقصى زاوية عض مسموحة', unit: '°', d: 1, fn: (n) => (Math.atan(n.mu) * 180) / Math.PI },
      { label: 'أقصى ضغطة Δh max', unit: 'mm', d: 1, fn: (n) => n.mu * n.mu * (n.de / 2) },
      {
        label: 'حالة العض',
        wide: true,
        fn: (n) => (n.mu >= Math.tan(Math.acos(Math.max(-1, Math.min(1, 1 - Math.max(0, n.h1 - n.h2) / Math.max(1, n.de))))) ? 'يقبل العض' : 'خطر انزلاق: قلّل الضغطة أو زد الخشونة'),
        tone: (n) => (n.mu >= Math.tan(Math.acos(Math.max(-1, Math.min(1, 1 - Math.max(0, n.h1 - n.h2) / Math.max(1, n.de))))) ? 'text-emerald-400' : 'text-red-400')
      }
    ],
    formula: 'cos α = 1 − Δh/De  |  μ ≥ tan α  |  Δh max = μ²·R'
  },
  {
    id: 'gear', group: 'pass', title: 'نسبة التخفيض (Gear Ratio)',
    desc: 'من عدد أسنان الترسين إلى نسبة التخفيض ولفات الخرج.',
    inputs: [
      { k: 'no', label: 'أسنان الترس المقاد', unit: '', def: 85 },
      { k: 'ni', label: 'أسنان الترس القائد', unit: '', def: 25 },
      { k: 'rpm', label: 'لفات الدخل (الموتور)', unit: 'RPM', def: 1450 }
    ],
    outputs: [
      { label: 'نسبة التخفيض GR', unit: '', d: 3, fn: (n) => (n.ni > 0 ? n.no / n.ni : 0) },
      { label: 'لفات الخرج (الدرفيل)', unit: 'RPM', d: 1, fn: (n) => (n.no > 0 ? (n.rpm * n.ni) / n.no : 0) }
    ],
    formula: 'GR = N_driven / N_driver  |  N_out = N_in / GR'
  },
  // ---------------- الحمل والعزم والقدرة ----------------
  {
    id: 'roll_load', group: 'load', title: 'حمل الدرفلة وقوس التلامس',
    desc: 'قوس التلامس Lp وحمل الدرفلة P = σ·w·Lp.',
    inputs: [
      { k: 'de', label: 'قطر الدرفيل De', unit: 'mm', def: 480 },
      { k: 'h1', label: 'ارتفاع الدخول H1', unit: 'mm', def: 18, step: 0.5 },
      { k: 'h2', label: 'ارتفاع الخروج H2', unit: 'mm', def: 12, step: 0.5 },
      { k: 'w', label: 'عرض المعدن W', unit: 'mm', def: 45 },
      { k: 's', label: 'مقاومة التشكيل σ', unit: 'MPa', def: 120 }
    ],
    outputs: [
      { label: 'حمل الدرفلة', unit: 'kN', d: 1, fn: (n) => (n.s * n.w * Math.sqrt((n.de / 2) * Math.max(0, n.h1 - n.h2))) / 1000 },
      { label: 'قوس التلامس Lp', unit: 'mm', d: 2, fn: (n) => Math.sqrt((n.de / 2) * Math.max(0, n.h1 - n.h2)) },
      { label: 'الحمل', unit: 'طن قوة', d: 2, fn: (n) => (n.s * n.w * Math.sqrt((n.de / 2) * Math.max(0, n.h1 - n.h2))) / 9806.65 }
    ],
    formula: 'Lp = √(R·Δh)  |  P = σ·w·Lp'
  },
  {
    id: 'torque_power', group: 'load', title: 'عزم الدرفلة والقدرة واستغلال الموتور',
    desc: 'العزم T والقدرة المطلوبة ونسبة استغلال الموتور.',
    inputs: [
      { k: 'p', label: 'حمل الدرفلة P', unit: 'kN', def: 160 },
      { k: 'lp', label: 'قوس التلامس Lp', unit: 'mm', def: 53.7, step: 0.1 },
      { k: 'a', label: 'ذراع العزم a', unit: '', def: 0.5, step: 0.05 },
      { k: 'n', label: 'لفات الدرفيل', unit: 'RPM', def: 427 },
      { k: 'av', label: 'قدرة الموتور المتاحة', unit: 'kW', def: 600 }
    ],
    outputs: [
      { label: 'القدرة المطلوبة', unit: 'kW', d: 1, fn: (n) => (2 * n.p * n.a * (n.lp / 1000) * 2 * Math.PI * n.n) / 60 },
      { label: 'عزم الدرفلة', unit: 'kN.m', d: 2, fn: (n) => 2 * n.p * n.a * (n.lp / 1000) },
      { label: 'استغلال الموتور', unit: '%', d: 1, fn: (n) => (n.av > 0 ? (((2 * n.p * n.a * (n.lp / 1000) * 2 * Math.PI * n.n) / 60) / n.av) * 100 : 0), tone: (n) => (n.av > 0 && ((2 * n.p * n.a * (n.lp / 1000) * 2 * Math.PI * n.n) / 60 / n.av) * 100 > 95 ? 'text-red-400' : 'text-amber-400') }
    ],
    formula: 'T = 2·P·a·Lp  |  Power = T·2π·N/60  |  Util = P_roll/P_avail'
  },
  // ---------------- الإنتاج والتشغيل ----------------
  {
    id: 'cycle', group: 'prod', title: 'الطاقة الإنتاجية (طن/ساعة)',
    desc: 'زمن دورة البيليت وعدد البيليت في الساعة والطاقة القصوى.',
    inputs: [
      { k: 'w', label: 'وزن البيليت', unit: 'كجم', def: 265 },
      { k: 'v', label: 'سرعة الخط النهائية', unit: 'm/s', def: 12, step: 0.5 },
      { k: 'kg', label: 'وزن المتر الطولي', unit: 'كجم/م', def: 0.888, step: 0.001 },
      { k: 'k', label: 'عدد البارات', def: '2', options: [['1', '1 (Single)'], ['2', '2 (Slit)'], ['3', '3 (Slit)'], ['4', '4 (Slit)']] },
      { k: 'gap', label: 'زمن الفجوة Gap', unit: 'ث', def: 4, step: 0.5 }
    ],
    outputs: [
      { label: 'الطاقة القصوى', unit: 'طن/س', d: 1, fn: (n) => { const t = n.v * n.kg * Number(n.k) > 0 ? n.w / (n.v * n.kg * Number(n.k)) + n.gap : 0; return t > 0 ? ((3600 / t) * n.w) / 1000 : 0; } },
      { label: 'زمن درفلة البيليت', unit: 'ث', d: 1, fn: (n) => (n.v * n.kg * Number(n.k) > 0 ? n.w / (n.v * n.kg * Number(n.k)) : 0) },
      { label: 'زمن الدورة مع الفجوة', unit: 'ث', d: 1, fn: (n) => (n.v * n.kg * Number(n.k) > 0 ? n.w / (n.v * n.kg * Number(n.k)) + n.gap : 0) },
      { label: 'بيليت / ساعة', unit: '', d: 1, fn: (n) => { const t = n.v * n.kg * Number(n.k) > 0 ? n.w / (n.v * n.kg * Number(n.k)) + n.gap : 0; return t > 0 ? 3600 / t : 0; } }
    ],
    formula: 't = W / (V·kg/m·strands) + Gap  |  Capacity = (3600/t)·W'
  },
  {
    id: 'gap_loss', group: 'prod', title: 'الوقت الضائع في الفجوات',
    desc: 'كم دقيقة تضيع في الوردية بسبب Gap Time بين البيليتات.',
    inputs: [
      { k: 'b', label: 'عدد بيليت الوردية', unit: '', def: 500 },
      { k: 'g', label: 'زمن الفجوة', unit: 'ث', def: 4, step: 0.5 },
      { k: 'h', label: 'مدة الوردية', unit: 'ساعة', def: 8 }
    ],
    outputs: [
      { label: 'الوقت الضائع', unit: 'دقيقة', d: 1, fn: (n) => (n.b * n.g) / 60 },
      { label: 'الوقت الضائع', unit: 'ساعة', d: 2, fn: (n) => (n.b * n.g) / 3600 },
      { label: 'من زمن الوردية', unit: '%', d: 1, fn: (n) => (n.h > 0 ? ((n.b * n.g) / 3600 / n.h) * 100 : 0) }
    ],
    formula: 'Lost = Billets × Gap'
  },
  {
    id: 'yield', group: 'prod', title: 'نسبة الإدرار (Yield)',
    desc: 'المنتج السليم إلى البيليت المشحون.',
    inputs: [
      { k: 'c', label: 'البيليت المشحون', unit: 'طن', def: 500 },
      { k: 'f', label: 'المنتج النهائي السليم', unit: 'طن', def: 482 }
    ],
    outputs: [
      { label: 'نسبة الإدرار', unit: '%', d: 2, fn: (n) => (n.c > 0 ? (n.f / n.c) * 100 : 0) },
      { label: 'الفاقد', unit: 'طن', d: 2, fn: (n) => n.c - n.f },
      { label: 'الفاقد لكل طن', unit: 'كجم', d: 1, fn: (n) => (n.c > 0 ? ((n.c - n.f) / n.c) * 1000 : 0) }
    ],
    formula: 'Yield = Finished / Charged × 100   [الأمثل ~98%]'
  },
  {
    id: 'avail', group: 'prod', title: 'الإتاحية ومعدل الاستغلال',
    desc: 'Availability و Mill Utilization من الأزمنة والتوقفات.',
    inputs: [
      { k: 'cal', label: 'الزمن التقويمي', unit: 'ساعة', def: 24 },
      { k: 'ps', label: 'توقفات مخططة', unit: 'ساعة', def: 2, step: 0.5 },
      { k: 'ud', label: 'توقفات غير مخططة', unit: 'ساعة', def: 2.5, step: 0.5 }
    ],
    outputs: [
      { label: 'الإتاحية', unit: '%', d: 1, fn: (n) => { const p = Math.max(0.1, n.cal - n.ps); return (Math.max(0, p - n.ud) / p) * 100; } },
      { label: 'معدل الاستغلال', unit: '%', d: 1, fn: (n) => (Math.max(0, Math.max(0.1, n.cal - n.ps) - n.ud) / Math.max(0.1, n.cal)) * 100 },
      { label: 'زمن الدرفلة الفعلي', unit: 'ساعة', d: 2, fn: (n) => Math.max(0, Math.max(0.1, n.cal - n.ps) - n.ud) }
    ],
    formula: 'Avail = Rolling / (Calendar − Planned)  |  Util = Rolling / Calendar'
  },
  {
    id: 'net_prod', group: 'prod', title: 'الإنتاجية الفعلية الصافية',
    desc: 'الطاقة × الإدرار × الإتاحية.',
    inputs: [
      { k: 'cap', label: 'الطاقة القصوى', unit: 'طن/س', def: 40 },
      { k: 'y', label: 'الإدرار', unit: '%', def: 96.4, step: 0.1 },
      { k: 'a', label: 'الإتاحية', unit: '%', def: 88, step: 0.5 }
    ],
    outputs: [
      { label: 'الإنتاجية الصافية', unit: 'طن/س', d: 2, fn: (n) => n.cap * (n.y / 100) * (n.a / 100) },
      { label: 'إنتاج 24 ساعة', unit: 'طن', d: 0, fn: (n) => n.cap * (n.y / 100) * (n.a / 100) * 24 }
    ],
    formula: 'Productivity = Capacity × Yield × Availability'
  },
  // ---------------- التحكم والأتمتة ----------------
  {
    id: 'shear_speed', group: 'ctrl', title: 'سرعة المقص الطائر',
    desc: 'السرعة الخطية للمقص ونسبة Shear Over Speed.',
    inputs: [
      { k: 'rpm', label: 'لفات موتور المقص', unit: 'RPM', def: 1200 },
      { k: 'gr', label: 'جيربوكس المقص', unit: '', def: 4, step: 0.1 },
      { k: 'r', label: 'نصف قطر المقص R', unit: 'm', def: 0.35, step: 0.05 },
      { k: 'v', label: 'سرعة القائم السابق', unit: 'm/s', def: 10, step: 0.2 }
    ],
    outputs: [
      { label: 'السرعة الخطية للمقص', unit: 'm/s', d: 2, fn: (n) => (n.gr > 0 ? ((2 * Math.PI * (n.rpm / n.gr)) / 60) * n.r : 0) },
      { label: 'Shear Over Speed', unit: '%', d: 1, fn: (n) => (n.v > 0 && n.gr > 0 ? ((((2 * Math.PI * (n.rpm / n.gr)) / 60) * n.r - n.v) / n.v) * 100 : 0) },
      { label: 'لفات المقص', unit: 'RPM', d: 1, fn: (n) => (n.gr > 0 ? n.rpm / n.gr : 0) }
    ],
    formula: 'V_cv = ω·R  |  OS% = (V_cv − V_stand)/V_stand × 100'
  },
  {
    id: 'shear_cut', group: 'ctrl', title: 'زمن أمر القطع للمقص',
    desc: 'T_cv من طول القطعية والمسافة من HMD وزاوية الاستعداد.',
    inputs: [
      { k: 'lcv', label: 'طول قطعية الهيد', unit: 'm', def: 0.25, step: 0.05 },
      { k: 'ls', label: 'المسافة HMD للمقص', unit: 'm', def: 4.5, step: 0.1 },
      { k: 'v', label: 'سرعة القائم السابق', unit: 'm/s', def: 10, step: 0.2 },
      { k: 'th', label: 'زاوية الاستعداد θ', unit: 'rad', def: 1.2, step: 0.1 },
      { k: 'rpm', label: 'لفات موتور المقص', unit: 'RPM', def: 1200 },
      { k: 'gr', label: 'جيربوكس المقص', unit: '', def: 4, step: 0.1 }
    ],
    outputs: [
      { label: 'زمن أمر القطع T_cv', unit: 'ث', d: 3, fn: (n) => { const w = n.gr > 0 ? (2 * Math.PI * (n.rpm / n.gr)) / 60 : 0; return n.v > 0 && w > 0 ? (n.lcv + n.ls) / n.v - n.th / w : 0; } },
      { label: 'زمن وصول المقدمة', unit: 'ث', d: 3, fn: (n) => (n.v > 0 ? (n.lcv + n.ls) / n.v : 0) },
      { label: 'زمن تحرك المقص', unit: 'ث', d: 3, fn: (n) => { const w = n.gr > 0 ? (2 * Math.PI * (n.rpm / n.gr)) / 60 : 0; return w > 0 ? n.th / w : 0; } }
    ],
    formula: 'T_cv = (Lcv + Ls)/V − θ/ω'
  },
  {
    id: 'looper', group: 'ctrl', title: 'ارتفاعات بكر اللوبر',
    desc: 'ارتفاع البكرة الثابتة H والمتحركة Y.',
    inputs: [
      { k: 'x', label: 'ارتفاع سنتر الدليل X', unit: 'mm', def: 150 },
      { k: 'r', label: 'نصف قطر البار R', unit: 'mm', def: 8 }
    ],
    outputs: [
      { label: 'البكرة الثابتة H', unit: 'mm', d: 1, fn: (n) => n.x + n.r },
      { label: 'البكرة المتحركة Y', unit: 'mm', d: 1, fn: (n) => (n.x + n.r) * (4 / 3) }
    ],
    formula: 'H = X + R  |  Y = H + H/3'
  },
  {
    id: 'apron', group: 'ctrl', title: 'علب الأبرون المغلقة (مسافة الرمي)',
    desc: 'عدد العلب المغلقة اللازمة لفرملة السيخ على الأبرون.',
    inputs: [{ k: 'v', label: 'سرعة آخر قائم', unit: 'm/s', def: 14, step: 0.5 }],
    outputs: [{ label: 'المسافة (علب بطول 1 م)', unit: 'م', d: 1, fn: (n) => (n.v * n.v) / 8 }],
    formula: 'X = V² / (2·g·f) = V² / 8'
  },
  {
    id: 'tension_amp', group: 'ctrl', title: 'شد أم انضغاط من الأمبير',
    desc: 'قارن أمبير القائم قبل وبعد دخول المعدن في القائم التالي.',
    inputs: [
      { k: 'a0', label: 'الأمبير قبل دخول القائم التالي', unit: 'A', def: 1500 },
      { k: 'a1', label: 'الأمبير بعد دخوله', unit: 'A', def: 1200 },
      { k: 'thr', label: 'حد التنبيه', unit: '%', def: 5, step: 1 }
    ],
    outputs: [
      { label: 'تغير الأمبير', unit: '%', d: 1, fn: (n) => (n.a0 > 0 ? ((n.a1 - n.a0) / n.a0) * 100 : 0) },
      {
        label: 'التشخيص', wide: true,
        fn: (n) => { const c = n.a0 > 0 ? ((n.a1 - n.a0) / n.a0) * 100 : 0; return c <= -n.thr ? 'شد (Tension): زد سرعة القائم السابق أو قلل سرعة التالي' : c >= n.thr ? 'انضغاط (Compression/Loop): قلل سرعة السابق أو زد سرعة التالي' : 'متعادل: لا يوجد شد أو انضغاط واضح'; },
        tone: (n) => { const c = n.a0 > 0 ? ((n.a1 - n.a0) / n.a0) * 100 : 0; return c <= -n.thr ? 'text-amber-400' : c >= n.thr ? 'text-red-400' : 'text-emerald-400'; }
      }
    ],
    formula: 'ΔI% = (I_after − I_before)/I_before × 100   [حد التنبيه قابل للتعديل]'
  },
  // ---------------- أوزان وتحويلات ومواصفات ----------------
  {
    id: 'weight_m', group: 'misc', title: 'وزن المتر من القطر',
    desc: 'وزن المتر الطولي لسيخ التسليح من قطره الاسمي.',
    inputs: [
      { k: 'd', label: 'القطر الاسمي', unit: 'mm', def: 12 },
      { k: 'len', label: 'طول السيخ', unit: 'm', def: 12 }
    ],
    outputs: [
      { label: 'وزن المتر', unit: 'كجم/م', d: 3, fn: (n) => (n.d * n.d) / 162 },
      { label: 'وزن السيخ', unit: 'كجم', d: 2, fn: (n) => ((n.d * n.d) / 162) * n.len },
      { label: 'المساحة الاسمية', unit: 'mm²', d: 1, fn: (n) => (Math.PI * n.d * n.d) / 4 },
      { label: 'عدد الأسياخ في الطن', unit: '', d: 1, fn: (n) => (n.d > 0 && n.len > 0 ? 1000 / (((n.d * n.d) / 162) * n.len) : 0) }
    ],
    formula: 'kg/m = d² / 162'
  },
  {
    id: 'billet_w', group: 'misc', title: 'وزن البيليت',
    desc: 'وزن البيليت المربع من الضلع والطول.',
    inputs: [
      { k: 's', label: 'ضلع البيليت', unit: 'mm', def: 130 },
      { k: 'l', label: 'طول البيليت', unit: 'm', def: 12, step: 0.5 }
    ],
    outputs: [
      { label: 'وزن البيليت', unit: 'كجم', d: 0, fn: (n) => n.s * n.s * 0.00785 * n.l },
      { label: 'وزن المتر', unit: 'كجم/م', d: 2, fn: (n) => n.s * n.s * 0.00785 },
      { label: 'المساحة', unit: 'mm²', d: 0, fn: (n) => n.s * n.s }
    ],
    formula: 'kg = Side² × 0.00785 × L'
  },
  {
    id: 'cut_count', group: 'misc', title: 'عدد القطعيات من طول بار',
    desc: 'كم قطعية ينتجها المقص من طول معين، وكم يتبقى كبار أخير.',
    inputs: [
      { k: 'len', label: 'طول البار الناتج', unit: 'm', def: 900 },
      { k: 'cut', label: 'طول القطعية', unit: 'm', def: 48, step: 1 }
    ],
    outputs: [
      { label: 'عدد القطعيات الكاملة', unit: '', d: 0, fn: (n) => (n.cut > 0 ? Math.floor(n.len / n.cut) : 0) },
      { label: 'البار الأخير (الباقي)', unit: 'م', d: 1, fn: (n) => (n.cut > 0 ? n.len - Math.floor(n.len / n.cut) * n.cut : 0) }
    ],
    formula: 'n = ⌊L / Lcut⌋  |  Short bar = L − n·Lcut'
  },
  { id: 'units', group: 'misc', title: 'محوّل الوحدات', desc: 'سرعة، لفات، طول، وزن، قدرة، قوة، عزم، إجهاد، حرارة.', custom: 'units' },
  { id: 'rebar', group: 'misc', title: 'جدول أوزان حديد التسليح', desc: 'الأوزان القياسية والتجاوزات (ES 262 / ISO 6935-2).', custom: 'rebar' }
];

// ---------------- مشغّل الحاسبة العام ----------------
const CalcRunner = ({ calc, vals, setVals }) => {
  const raw = {};
  const n = {};
  calc.inputs.forEach((i) => {
    raw[i.k] = vals[i.k] !== undefined ? vals[i.k] : i.def;
    n[i.k] = i.options ? raw[i.k] : num(raw[i.k]);
  });
  const set = (k) => (v) => setVals({ ...vals, [k]: v });
  const show = (o) => {
    const r = o.fn(n);
    return typeof r === 'string' ? r : `${fmt(r, o.d ?? 2)}`;
  };
  const [first, ...rest] = calc.outputs;
  return (
    <Shell
      inputs={
        <>
          <div className="flex justify-between items-center border-b border-slate-800 pb-3">
            <h3 className="text-lg font-bold text-white">المدخلات</h3>
            <button
              onClick={() => setVals({})}
              className="text-xs text-slate-300 bg-slate-800 hover:bg-slate-700 px-3 py-1.5 rounded-lg flex items-center gap-1.5"
            >
              <RotateCcw size={13} /> القيم الافتراضية
            </button>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {calc.inputs.map((i) =>
              i.options ? (
                <SelectField key={i.k} label={i.label} value={raw[i.k]} onChange={set(i.k)} options={i.options} className="col-span-2 sm:col-span-1" />
              ) : (
                <Field
                  key={i.k}
                  label={`${i.label}${i.unit ? ` (${i.unit})` : ''}`}
                  value={raw[i.k]}
                  onChange={set(i.k)}
                  step={i.step}
                  className="col-span-2 sm:col-span-1"
                />
              )
            )}
          </div>
        </>
      }
      results={
        <>
          <h3 className="text-lg font-bold text-blue-400 border-b border-slate-800 pb-3">النتائج</h3>
          <div className="bg-gradient-to-br from-blue-950/50 to-slate-950 p-4 rounded-2xl border border-blue-500/30">
            <span className="text-xs text-slate-400 block mb-1">{first.label}</span>
            <span className={`text-3xl font-extrabold font-mono ${first.tone ? first.tone(n) : 'text-blue-400'}`}>
              {show(first)}
              {first.unit ? <span className="text-sm text-slate-400 mr-2">{first.unit}</span> : null}
            </span>
          </div>
          {rest.length > 0 && (
            <div className="grid grid-cols-2 gap-3">
              {rest.map((o, idx) => (
                <div key={idx} className={o.wide ? 'col-span-2' : ''}>
                  <Stat label={o.label} value={show(o)} unit={o.unit} color={o.tone ? o.tone(n) : 'text-white'} />
                </div>
              ))}
            </div>
          )}
          {calc.formula && <Formula>{calc.formula}</Formula>}
        </>
      }
    />
  );
};

// ---------------- محوّل الوحدات ----------------
const UnitConverterTool = () => {
  const [cat, setCat] = useState('speed');
  const [unit, setUnit] = useState('m/s');
  const [val, setVal] = useState(1);
  const g = UNIT_GROUPS[cat];
  const all = g.temp
    ? g.units.map(([u]) => [u, fromCelsius(toCelsius(num(val), unit), u)])
    : (() => {
        const from = g.units.find((x) => x[0] === unit);
        const base = num(val) * (from ? from[1] : 1);
        return g.units.map(([u, f]) => [u, base / f]);
      })();
  return (
    <Shell
      border="border-rose-500/30"
      inputs={
        <>
          <Title>اختر نوع الوحدة والقيمة</Title>
          <div className="grid grid-cols-2 gap-3">
            <SelectField
              label="النوع"
              value={cat}
              onChange={(v) => {
                setCat(v);
                setUnit(UNIT_GROUPS[v].units[0][0]);
              }}
              className="col-span-2"
              options={Object.keys(UNIT_GROUPS).map((k) => [k, UNIT_GROUPS[k].label])}
            />
            <Field label="القيمة" value={val} onChange={setVal} step="any" />
            <SelectField label="الوحدة" value={unit} onChange={setUnit} options={g.units.map((u) => [u[0], u[0]])} />
          </div>
        </>
      }
      results={
        <>
          <Title color="text-rose-400">النتائج</Title>
          <div className="grid grid-cols-2 gap-3">
            {all.map(([u, v]) => (
              <Stat
                key={u}
                label={u}
                value={Math.abs(v) >= 1e6 || (Math.abs(v) < 1e-3 && v !== 0) ? v.toExponential(3) : fmt(v, 4)}
                color={u === unit ? 'text-rose-400' : 'text-white'}
              />
            ))}
          </div>
        </>
      }
    />
  );
};

const RebarTable = () => (
  <div className="bg-slate-900 p-4 sm:p-6 rounded-3xl border border-slate-800 space-y-4 overflow-x-auto">
    <h3 className="text-lg sm:text-xl font-bold text-white">الأوزان القياسية والتجاوزات المسموحة لحديد التسليح (ES 262 / ISO 6935-2)</h3>
    <table className="w-full text-right border-collapse text-sm min-w-[520px]">
      <thead>
        <tr className="border-b border-slate-800 text-slate-400 text-xs">
          <th className="p-3">المقاس (mm)</th>
          <th className="p-3">المساحة (mm²)</th>
          <th className="p-3">أقل وزن (كجم/م)</th>
          <th className="p-3">الاسمي (كجم/م)</th>
          <th className="p-3">أقصى وزن (كجم/م)</th>
          <th className="p-3">اللون</th>
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
);

const SIZE_OPTIONS = REBAR_SPECS.map((r) => [String(r.size), `${r.size} مم`]);

// ---------------- حاسبة مجمّعة 1: تصميم الممرات (Pass Design) ----------------
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
    <div className="space-y-5">
      <Shell
        border="border-teal-500/30"
        inputs={
          <>
            <Title>مدخلات تصميم الممرات</Title>
            <div className="grid grid-cols-2 gap-3">
              <Field label="ضلع البيليت (mm)" value={side} onChange={setSide} />
              <Field label="طول البيليت (m)" value={billetLen} onChange={setBilletLen} step="0.5" />
              <SelectField label="مقاس المنتج" value={size} onChange={setSize} options={SIZE_OPTIONS} />
              <SelectField label="عدد البارات (Slitting)" value={strands} onChange={setStrands} options={[['1', '1'], ['2', '2'], ['3', '3'], ['4', '4']]} />
              <Field label="عدد القوائم" value={stands} onChange={setStands} />
              <Field label="سرعة الخروج النهائية (m/s)" value={vFinal} onChange={setVFinal} step="0.5" />
              <Field label="Dw أول قائم (mm)" value={dwFirst} onChange={setDwFirst} />
              <Field label="Dw آخر قائم (mm)" value={dwLast} onChange={setDwLast} />
              <Field label="Gear Ratio" value={gr} onChange={setGr} step="0.1" />
              <Field label="Max RPM للموتور" value={maxRpm} onChange={setMaxRpm} />
              <Field label="طول قطعية المقص (m)" value={cutLen} onChange={setCutLen} step="1" className="col-span-2" />
            </div>
          </>
        }
        results={
          <>
            <Title color="text-teal-400">ملخص التصميم</Title>
            <div className="grid grid-cols-2 gap-3">
              <Stat label="الاستطالة الكلية" value={fmt(lamTotal, 1)} color="text-teal-400" big />
              <Stat label="λ لكل ممر (متساوي)" value={fmt(lamPass, 3)} />
              <Stat label="تخفيض كل ممر" value={fmt((1 - 1 / lamPass) * 100, 1)} unit="%" />
              <Stat label="سرعة دخول أول قائم" value={fmt(V0, 3)} unit="m/s" />
            </div>
            <Box>
              <Row label="مساحة البيليت / المنتج" value={`${fmt(A0, 0)} → ${fmt(Aout, 1)} mm²`} />
              <Row label="وزن البيليت" value={`${fmt(billetKg, 0)} كجم`} />
              <Row label="زمن مرور البيليت" value={`${fmt(passTime, 1)} ث`} />
              <Row label="طول البار (لكل ستراند)" value={`${fmt(lenStrand, 0)} m`} />
              <Row label="القطعيات + البار الأخير" value={`${cuts} + ${fmt(shortBar, 1)} م`} color="text-amber-400" top />
            </Box>
            <Formula>λ_pass = λ_total^(1/N) | A_i = A0/λ^i | V_i = Q/A_i | Q = A_out·V_final</Formula>
          </>
        }
      />
      <div className="bg-slate-900 p-4 sm:p-6 rounded-3xl border border-slate-800 space-y-3 overflow-x-auto">
        <h3 className="text-lg font-bold text-white">جدول القوائم (توزيع متساوٍ كنقطة بداية)</h3>
        <table className="w-full text-right border-collapse text-sm min-w-[560px]">
          <thead>
            <tr className="border-b border-slate-800 text-slate-400 text-xs">
              <th className="p-2">قائم</th>
              <th className="p-2">المساحة mm²</th>
              <th className="p-2">تخفيض %</th>
              <th className="p-2">السرعة m/s</th>
              <th className="p-2">Dw mm</th>
              <th className="p-2">درفيل RPM</th>
              <th className="p-2">موتور RPM</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-mono">
            {rows.map((r) => (
              <tr key={r.idx} className={r.over ? 'bg-red-500/10' : 'hover:bg-slate-800/40'}>
                <td className="p-2 font-bold text-white">{r.idx}</td>
                <td className="p-2 text-slate-300">{fmt(r.A, 1)}</td>
                <td className="p-2 text-slate-300">{fmt(r.red, 1)}</td>
                <td className="p-2 text-sky-400">{fmt(r.V, 3)}</td>
                <td className="p-2 text-slate-300">{fmt(r.dw, 0)}</td>
                <td className="p-2 text-slate-300">{fmt(r.roll, 1)}</td>
                <td className={`p-2 font-bold ${r.over ? 'text-red-400' : 'text-amber-400'}`}>{fmt(r.motor, 0)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="text-[11px] text-slate-500">الصفوف الحمراء = لفات الموتور أعلى من Max RPM. عدّل Dw وGear Ratio حسب خط المصنع الفعلي.</p>
      </div>
    </div>
  );
};

// ---------------- حاسبة مجمّعة 2: عدد الأسياخ من البيليت ----------------
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
    <Shell
      border="border-emerald-500/30"
      inputs={
        <>
          <Title>مدخلات عدد الأسياخ</Title>
          <div className="grid grid-cols-2 gap-3">
            <Field label="ضلع البيليت (mm)" value={side} onChange={setSide} />
            <Field label="طول البيليت (m)" value={billetLen} onChange={setBilletLen} step="0.5" />
            <SelectField label="مقاس السيخ" value={size} onChange={setSize} options={SIZE_OPTIONS} />
            <SelectField label="عدد البارات (Slitting)" value={strands} onChange={setStrands} options={[['1', '1'], ['2', '2'], ['3', '3'], ['4', '4']]} />
            <Field label="طول قطعية المقص (m)" value={cutLen} onChange={setCutLen} step="1" />
            <Field label="طول السيخ التجاري (m)" value={commLen} onChange={setCommLen} step="0.5" />
            <Field label="الإدرار (%)" value={yieldPct} onChange={setYieldPct} step="0.5" />
            <Field label="بيليت الوردية" value={billetsShift} onChange={setBilletsShift} />
          </div>
        </>
      }
      results={
        <>
          <Title color="text-emerald-400">النتائج</Title>
          <div className="bg-gradient-to-br from-emerald-950/50 to-slate-950 p-4 rounded-2xl border border-emerald-500/30">
            <span className="text-xs text-slate-400 block mb-1">عدد الأسياخ من البيليت الواحد</span>
            <span className="text-3xl font-extrabold font-mono text-emerald-400">{barsPerBillet}</span>
            <span className="text-sm text-slate-400 mr-2">سيخ</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Stat label="وزن البيليت" value={fmt(billetKg, 0)} unit="كجم" />
            <Stat label="وزن السيخ" value={fmt(barKg, 2)} unit="كجم" />
            <Stat label="طول البار / ستراند" value={fmt(perStrand, 0)} unit="m" />
            <Stat label="أسياخ / طن" value={fmt(perTon, 1)} />
          </div>
          <Box>
            <Row label="قطعيات المقص (لكل ستراند)" value={`${cuts} × ${fmt(num(cutLen), 0)} م`} />
            <Row label="أسياخ من كل قطعية" value={`${bpc}${leftPerCut > 0 ? ` (يتبقى ${fmt(leftPerCut, 1)} م)` : ''}`} />
            <Row label="البار الأخير" value={`${fmt(rem, 1)} م ← ${remBars} سيخ + ${fmt(remScrap, 1)} م هالك`} color="text-amber-400" />
            <Row label="إنتاج الوردية" value={`${fmt(num(billetsShift) * barsPerBillet, 0)} سيخ`} top />
            <Row label="طن الوردية" value={`${fmt((num(billetsShift) * prodKg) / 1000, 1)} طن`} color="text-emerald-400" />
          </Box>
          <Formula>L_strand = (W·Yield/kgm)/strands | n_cuts = ⌊L/Lcut⌋ | bars = strands·(n_cuts·⌊Lcut/Lbar⌋ + ⌊rem/Lbar⌋)</Formula>
        </>
      }
    />
  );
};

const COMBINED = [
  {
    id: 'pass_design', title: 'تصميم الممرات (Pass Design)', icon: Layers, color: 'from-teal-600 to-emerald-500',
    desc: 'من مقاس البيليت والمنتج وعدد البارات والقوائم: الاستطالة، المساحة والسرعة ولفات الدرفيل والموتور لكل قائم، وعدد قطعيات المقص.'
  },
  {
    id: 'bars_count', title: 'عدد الأسياخ من البيليت', icon: Boxes, color: 'from-emerald-600 to-teal-500',
    desc: 'حدد طول قطعية المقص والسيخ التجاري لتعرف عدد الأسياخ لكل بيليت وفي الطن والوردية، مع البار الأخير والهالك.'
  }
];

// ---------------- الواجهة الرئيسية لمركز الحاسبات ----------------
const SmartCalculatorsCenter = () => {
  const [section, setSection] = useState('single'); // single | combined
  const [open, setOpen] = useState(null);
  const [allVals, setAllVals] = useState({});
  const [q, setQ] = useState('');

  const switchSection = (s) => {
    setSection(s);
    setOpen(null);
  };

  const openCalc = CALCS.find((c) => c.id === open);
  const openCombined = COMBINED.find((c) => c.id === open);

  const header = (
    <div className="grid grid-cols-2 gap-2 bg-slate-900 border border-slate-800 p-1.5 rounded-2xl">
      {[
        ['single', 'حاسبات منفصلة', `${CALCS.length} حاسبة، كل واحدة لغرض واحد`],
        ['combined', 'حاسبات مجمّعة', 'تصميم الممرات وعدد الأسياخ']
      ].map(([id, label, sub]) => (
        <button
          key={id}
          onClick={() => switchSection(id)}
          className={`px-3 py-3 rounded-xl text-center transition-all ${section === id ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'}`}
        >
          <span className="block text-sm font-bold">{label}</span>
          <span className="block text-[10px] opacity-80 mt-0.5">{sub}</span>
        </button>
      ))}
    </div>
  );

  // ===== شاشة حاسبة مفتوحة =====
  if (open && (openCalc || openCombined)) {
    const title = openCalc ? openCalc.title : openCombined.title;
    return (
      <div className="space-y-5">
        {header}
        <div className="bg-slate-900 border border-slate-800 p-3 sm:p-4 rounded-2xl flex items-center gap-3">
          <button
            onClick={() => setOpen(null)}
            className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 shrink-0"
          >
            <ArrowRight size={17} />
            <span>رجوع</span>
          </button>
          <h2 className="text-base sm:text-lg font-bold text-white leading-tight">{title}</h2>
        </div>

        {openCombined && open === 'pass_design' && <PassDesignCalc />}
        {openCombined && open === 'bars_count' && <BarsCountCalc />}
        {openCalc && openCalc.custom === 'units' && <UnitConverterTool />}
        {openCalc && openCalc.custom === 'rebar' && <RebarTable />}
        {openCalc && !openCalc.custom && (
          <CalcRunner
            key={openCalc.id}
            calc={openCalc}
            vals={allVals[openCalc.id] || {}}
            setVals={(v) => setAllVals({ ...allVals, [openCalc.id]: v })}
          />
        )}
      </div>
    );
  }

  // ===== المجمّعة =====
  if (section === 'combined') {
    return (
      <div className="space-y-5">
        {header}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {COMBINED.map((c) => {
            const Icon = c.icon;
            return (
              <button
                key={c.id}
                onClick={() => setOpen(c.id)}
                className="group text-right bg-slate-900 hover:bg-slate-900 border border-slate-800 hover:border-blue-500/50 rounded-3xl p-5 transition-all hover:-translate-y-1"
              >
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${c.color} flex items-center justify-center shadow-lg mb-4`}>
                  <Icon className="text-white" size={28} />
                </div>
                <h3 className="text-lg font-bold text-white group-hover:text-blue-400 transition-colors">{c.title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed mt-2">{c.desc}</p>
              </button>
            );
          })}
        </div>
      </div>
    );
  }

  // ===== المنفصلة =====
  const ql = q.trim().toLowerCase();
  const matches = (c) => !ql || c.title.toLowerCase().includes(ql) || c.desc.toLowerCase().includes(ql);
  return (
    <div className="space-y-5">
      {header}
      <div className="relative">
        <Search className="absolute right-4 top-3.5 text-slate-500" size={18} />
        <input
          type="text"
          placeholder="ابحث عن حاسبة (سرعة، Jog، وزن، قطعية...)"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          className="w-full bg-slate-900 border border-slate-800 rounded-2xl pr-11 pl-4 py-3 text-white text-sm"
        />
      </div>
      {GROUPS.map((g) => {
        const list = CALCS.filter((c) => c.group === g.id && matches(c));
        if (list.length === 0) return null;
        const Icon = g.icon;
        return (
          <div key={g.id} className="space-y-3">
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${g.color} flex items-center justify-center`}>
                <Icon className="text-white" size={18} />
              </div>
              <h3 className="text-base font-bold text-white">{g.title}</h3>
              <span className="text-[11px] text-slate-500">({list.length})</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {list.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setOpen(c.id)}
                  className="text-right bg-slate-900 border border-slate-800 hover:border-blue-500/50 rounded-2xl p-4 transition-all"
                >
                  <h4 className="text-sm font-bold text-white">{c.title}</h4>
                  <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">{c.desc}</p>
                </button>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};

// ============================================================================
// 2. مجتمع صناع الحديد (منشورات بوستات + تعليقات + موسوعة الأعطال والعيوب)
// ============================================================================
const SocialFeedAndFaults = ({ posts, setPosts, faults }) => {
  const [subMode, setSubMode] = useState('feed'); // feed | faults
  const [newPostAuthor, setNewPostAuthor] = useState('');
  const [newPostRole, setNewPostRole] = useState('مشغل أول غرفة تحكم (MCR)'); // مطابقة أول خيار في القائمة (كانت غير متطابقة)
  const [newPostTitle, setNewPostTitle] = useState('');
  const [newPostContent, setNewPostContent] = useState('');
  const [commentInputs, setCommentInputs] = useState({});
  const [commentAuthor, setCommentAuthor] = useState('');
  const [faultSearch, setFaultSearch] = useState('');

  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!newPostTitle.trim() || !newPostContent.trim()) return;
    const postObj = {
      id: Date.now().toString(),
      author: newPostAuthor || 'مهندس / فني صناعة الصلب',
      role: newPostRole,
      badge: 'عضو نشط',
      time: 'الآن',
      category: 'مناقشة فنية',
      title: newPostTitle,
      content: newPostContent,
      likes: 1,
      liked: false,
      comments: []
    };
    setPosts([postObj, ...posts]);
    setNewPostTitle('');
    setNewPostContent('');
    try {
      await addDoc(collection(db, 'community_posts'), { ...postObj, createdAt: serverTimestamp() });
    } catch (err) {
      console.error(err);
    }
  };

  const handleToggleLike = (postId) => {
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId ? { ...p, liked: !p.liked, likes: p.liked ? p.likes - 1 : p.likes + 1 } : p
      )
    );
  };

  const handleAddComment = (postId) => {
    const text = commentInputs[postId];
    if (!text || !text.trim()) return;
    const newComment = {
      id: Date.now().toString(),
      user: commentAuthor || 'فني / مهندس بالخط',
      role: 'عضو المجتمع',
      text: text.trim(),
      time: 'الآن'
    };
    setPosts((prev) => prev.map((p) => (p.id === postId ? { ...p, comments: [...p.comments, newComment] } : p)));
    setCommentInputs({ ...commentInputs, [postId]: '' });
  };

  const q = faultSearch.toLowerCase();
  const filteredFaults = faults.filter(
    (f) => f.code.toLowerCase().includes(q) || f.title.toLowerCase().includes(q) || f.brand.toLowerCase().includes(q)
  );

  return (
    <div className="space-y-5">
      <div className="bg-slate-900 border border-slate-800 p-4 sm:p-5 rounded-3xl space-y-4">
        <div>
          <h2 className="text-2xl font-extrabold text-white">مجتمع صناع الحديد وموسوعة الأعطال</h2>
          <p className="text-xs text-slate-400 mt-1">
            انشر معلومة أو سؤالاً فنياً ليعلق عليه الزملاء، أو ابحث في تشخيص عيوب الدرفلة والدرايفات
          </p>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => setSubMode('feed')}
            className={`px-3 py-2.5 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 transition-all ${
              subMode === 'feed' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <MessageCircle size={17} /> المنشورات ({posts.length})
          </button>
          <button
            onClick={() => setSubMode('faults')}
            className={`px-3 py-2.5 rounded-2xl text-sm font-bold flex items-center justify-center gap-2 transition-all ${
              subMode === 'faults' ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Wrench size={17} /> تشخيص العيوب
          </button>
        </div>
      </div>

      {subMode === 'feed' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          <div className="lg:col-span-4">
            <form
              onSubmit={handleCreatePost}
              className="bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-5 space-y-3 lg:sticky lg:top-24"
            >
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <PlusCircle className="text-blue-400 shrink-0" size={20} /> نشر بوست أو سؤال فني
              </h3>
              <input
                type="text"
                placeholder="اسمك (مثلاً: م. بسام وليد)"
                value={newPostAuthor}
                onChange={(e) => setNewPostAuthor(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-sm text-white"
              />
              <select
                value={newPostRole}
                onChange={(e) => setNewPostRole(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-sm text-white"
              >
                <option>مشغل أول غرفة تحكم (MCR)</option>
                <option>مهندس درفلة وباس ديزاين</option>
                <option>مهندس / فني كهرباء وكنترول</option>
                <option>مهندس جودة وإنتاج</option>
              </select>
              <input
                type="text"
                placeholder="عنوان المنشور أو السؤال..."
                value={newPostTitle}
                onChange={(e) => setNewPostTitle(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-sm text-white font-bold"
              />
              <textarea
                rows={4}
                placeholder="اكتب المعلومة الفنية أو تفاصيل المشكلة هنا..."
                value={newPostContent}
                onChange={(e) => setNewPostContent(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-sm text-white"
              />
              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-xl font-bold text-sm"
              >
                نشر البوست الآن
              </button>
            </form>
          </div>

          <div className="lg:col-span-8 space-y-4">
            {posts.map((post) => (
              <div key={post.id} className="bg-slate-900 border border-slate-800 rounded-3xl p-4 sm:p-6 space-y-4">
                <div className="flex justify-between items-start gap-2">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-extrabold text-lg shrink-0">
                      {post.author.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="font-bold text-white text-base">{post.author}</h4>
                        <span className="text-[10px] bg-blue-500/20 text-blue-400 border border-blue-500/30 px-2 py-0.5 rounded-full font-bold">
                          {post.badge}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400">
                        {post.role} • {post.time}
                      </p>
                    </div>
                  </div>
                  <span className="text-xs bg-slate-800 text-slate-300 px-3 py-1 rounded-full hidden sm:block">
                    {post.category}
                  </span>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-blue-300 mb-2">{post.title}</h3>
                  <p className="text-sm text-slate-200 leading-relaxed whitespace-pre-line">{post.content}</p>
                </div>

                <div className="flex items-center gap-4 pt-3 border-t border-slate-800 text-xs">
                  <button
                    onClick={() => handleToggleLike(post.id)}
                    className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl font-bold transition-colors ${
                      post.liked
                        ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30'
                        : 'bg-slate-800/80 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <ThumbsUp size={15} />
                    <span>أعجبني ({post.likes})</span>
                  </button>
                  <div className="flex items-center gap-1.5 text-slate-400 font-medium">
                    <MessageCircle size={15} />
                    <span>{post.comments.length} تعليقات فنية</span>
                  </div>
                </div>

                <div className="bg-slate-950/80 rounded-2xl p-3 sm:p-4 border border-slate-800/80 space-y-3">
                  {post.comments.map((c) => (
                    <div key={c.id} className="bg-slate-900 p-3 rounded-xl border border-slate-800/70">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs font-bold text-emerald-400">{c.user}</span>
                        <span className="text-[10px] text-slate-500">{c.time}</span>
                      </div>
                      <p className="text-xs text-slate-200 leading-relaxed">{c.text}</p>
                    </div>
                  ))}

                  <div className="flex flex-col sm:flex-row gap-2 pt-2">
                    <input
                      type="text"
                      placeholder="اسمك..."
                      value={commentAuthor}
                      onChange={(e) => setCommentAuthor(e.target.value)}
                      className="sm:w-36 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                    />
                    <input
                      type="text"
                      placeholder="اكتب تعليقك أو ردك الفني على البوست..."
                      value={commentInputs[post.id] || ''}
                      onChange={(e) => setCommentInputs({ ...commentInputs, [post.id]: e.target.value })}
                      className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                    />
                    <button
                      onClick={() => handleAddComment(post.id)}
                      className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl text-xs font-bold"
                    >
                      تعليق
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute right-4 top-3.5 text-slate-500" size={18} />
            <input
              type="text"
              placeholder="ابحث عن عيب (قشرة، شنب) أو عطل (F0001)..."
              value={faultSearch}
              onChange={(e) => setFaultSearch(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-2xl pr-11 pl-4 py-3 text-white text-sm"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredFaults.map((f) => (
              <div key={f.id} className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-2.5">
                <div className="flex justify-between items-center gap-2">
                  <span className="px-3 py-1 bg-red-500/20 text-red-400 border border-red-500/30 rounded-xl font-mono font-bold text-xs">
                    {f.code}
                  </span>
                  <span className="text-xs bg-slate-800 text-slate-300 px-3 py-1 rounded-xl">{f.brand}</span>
                </div>
                <h3 className="text-base font-bold text-white">{f.title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  <strong className="text-amber-400">السبب الفني: </strong> {f.cause}
                </p>
                <div className="bg-slate-950 p-3.5 rounded-2xl border border-emerald-900/40 text-xs text-emerald-300 leading-relaxed">
                  <strong>الإجراء والحل: </strong> {f.solution}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// 3. بوابة الشركات: حسابات الدرافيل وإنتاجية الممرات (Enterprise Roll & Pass SaaS)
// ============================================================================
const EnterpriseCompaniesPortal = ({ companies, activeCompany, setActiveCompany, standsPasses, setStandsPasses }) => {
  const [companyCode, setCompanyCode] = useState('');

  const handleLogin = (e) => {
    e.preventDefault();
    const found = companies.find((c) => c.code.toUpperCase() === companyCode.trim().toUpperCase());
    if (!found) {
      alert('كود الشركة غير صحيح! جرب الكود GIOSHY-2026');
      return;
    }
    setActiveCompany(found);
    setCompanyCode('');
  };

  const addPassTonnage = (id, tons) => {
    setStandsPasses((prev) =>
      prev.map((s) => (s.id === id ? { ...s, passTons: s.passTons + tons, totalRollTons: s.totalRollTons + tons } : s))
    );
  };

  const switchNextPass = (id) => {
    setStandsPasses((prev) =>
      prev.map((s) =>
        s.id === id ? { ...s, activePass: s.activePass < s.totalPasses ? s.activePass + 1 : 1, passTons: 0 } : s
      )
    );
  };

  if (!activeCompany) {
    return (
      <div className="max-w-xl mx-auto bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 text-center space-y-5 mt-4">
        <div className="w-16 h-16 rounded-2xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center mx-auto">
          <Building2 className="text-blue-400" size={32} />
        </div>
        <h2 className="text-2xl font-extrabold text-white">بوابة الشركات وإدارة عمر الدرافيل والممرات (SaaS)</h2>
        <p className="text-xs text-slate-400 leading-relaxed">
          مخصصة للمصانع المشتركة لمتابعة الأقطار الفعالة للدرافيل (Dw)، إنتاجية كل ممر (Pass Tonnage)، والرصيد المتبقي قبل
          الخراطة. للتجربة الفورية أدخل كود: <strong className="text-emerald-400 font-mono">GIOSHY-2026</strong>
        </p>
        <form onSubmit={handleLogin} className="space-y-3">
          <input
            type="text"
            placeholder="أدخل كود تفعيل الشركة (GIOSHY-2026)"
            value={companyCode}
            onChange={(e) => setCompanyCode(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded-2xl p-3.5 text-center text-white font-mono uppercase text-lg"
          />
          <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white py-3.5 rounded-2xl font-bold">
            فتح منظومة الدرافيل والممرات
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="bg-slate-900 border border-slate-800 p-4 sm:p-5 rounded-3xl flex flex-wrap justify-between items-center gap-4">
        <div>
          <span className="text-xs bg-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full font-bold">
            {activeCompany.name} ({activeCompany.code})
          </span>
          <h2 className="text-xl sm:text-2xl font-extrabold text-white mt-1.5">
            إنتاجية الممرات والأقطار الفعالة للقوائم (Stands 1 – 12)
          </h2>
        </div>
        <button
          onClick={() => setActiveCompany(null)}
          className="bg-red-500/20 text-red-400 border border-red-500/30 px-4 py-2 rounded-xl text-xs font-bold"
        >
          تسجيل خروج الشركة
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {standsPasses.map((st) => {
          const workingDia = (st.collarDia - st.grooveFactor).toFixed(1);
          const usagePct = Math.min(100, Math.round((st.passTons / st.maxPassTons) * 100));
          return (
            <div key={st.id} className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-bold text-white">{st.name}</h3>
                  <span className="text-xs text-slate-400">
                    {st.zone} • {st.rollCode}
                  </span>
                </div>
                <span className="text-xs font-mono font-bold bg-blue-500/20 text-blue-400 px-2.5 py-1 rounded-lg">
                  ممر {st.activePass}/{st.totalPasses}
                </span>
              </div>

              <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">القطر الخارجي / الفعال Dw:</span>
                  <span className="text-white font-mono font-bold">
                    {st.collarDia} / {workingDia} mm
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">خلوص القائم (Gap):</span>
                  <span className="text-emerald-400 font-mono font-bold">{st.gapMm} mm</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">إنتاجية الممر الحالي:</span>
                  <span className="text-amber-400 font-mono font-bold">
                    {st.passTons} / {st.maxPassTons} طن
                  </span>
                </div>
              </div>

              <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                <div className={`h-full ${usagePct > 85 ? 'bg-red-500' : 'bg-blue-500'}`} style={{ width: `${usagePct}%` }} />
              </div>

              <div className="grid grid-cols-2 gap-2 pt-2">
                <button
                  onClick={() => addPassTonnage(st.id, 30)}
                  className="bg-slate-800 hover:bg-slate-700 text-white py-2 rounded-xl text-xs font-bold"
                >
                  +30 طن للممر
                </button>
                <button
                  onClick={() => switchNextPass(st.id)}
                  className="bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 py-2 rounded-xl text-xs font-bold"
                >
                  تغيير للممر التالي
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ============================================================================
// 4. لوحة تحكم المصمم السرية (تفتح عند الضغط 5 مرات على لوجو SteelPortal)
// ============================================================================
const CreatorSecretModal = ({ isOpen, onClose, companies, setCompanies, setActiveCompany }) => {
  const [pin, setPin] = useState('');
  const [ok, setOk] = useState(false);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');

  if (!isOpen) return null;

  const addComp = (e) => {
    e.preventDefault();
    if (!name || !code) return;
    const c = { id: Date.now().toString(), name, code: code.toUpperCase(), plan: 'Enterprise SaaS', status: 'active' };
    setCompanies([c, ...companies]);
    setName('');
    setCode('');
  };

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="bg-slate-900 border-2 border-amber-500/40 rounded-3xl p-5 sm:p-6 max-w-lg w-full space-y-4">
        <div className="flex justify-between items-center border-b border-slate-800 pb-3">
          <h3 className="text-lg font-bold text-amber-400 flex items-center gap-2">
            <Key size={20} /> لوحة م. بسام وليد السرية (Creator Admin)
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-sm">
            إغلاق X
          </button>
        </div>

        {!ok ? (
          <div className="space-y-3">
            <p className="text-xs text-slate-400">أدخل الرقم السري للمصمم:</p>
            <input
              type="password"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-center text-white font-mono"
            />
            <button
              onClick={() => (pin === '2026' || pin === 'beso' ? setOk(true) : alert('خطأ'))}
              className="w-full bg-amber-500 text-slate-950 font-bold py-2.5 rounded-xl"
            >
              دخول
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <form onSubmit={addComp} className="space-y-2.5 bg-slate-950 p-4 rounded-2xl border border-slate-800">
              <p className="text-xs font-bold text-white">توليد كود تفعيل لشركة جديدة:</p>
              <input
                type="text"
                placeholder="اسم الشركة"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2 text-xs text-white"
              />
              <input
                type="text"
                placeholder="الكود (مثلاً: GARHY-2026)"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2 text-xs text-white font-mono uppercase"
              />
              <button type="submit" className="w-full bg-amber-500 text-slate-950 font-bold py-2 rounded-xl text-xs">
                إضافة وتفعيل الكود
              </button>
            </form>

            <div className="space-y-2 max-h-48 overflow-y-auto">
              {companies.map((c) => (
                <div
                  key={c.id}
                  className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex justify-between items-center text-xs"
                >
                  <div>
                    <p className="font-bold text-white">{c.name}</p>
                    <p className="text-amber-400 font-mono">{c.code}</p>
                  </div>
                  <button
                    onClick={() => {
                      setActiveCompany(c);
                      onClose();
                    }}
                    className="bg-blue-600 text-white px-3 py-1 rounded-lg font-bold"
                  >
                    معاينة
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ============================================================================
// المكون الرئيسي للتطبيق
// ============================================================================
export default function App() {
  const [activeTab, setActiveTab] = useState('calculators');
  const [posts, setPosts] = useState(INITIAL_POSTS);
  const [faults] = useState(INITIAL_FAULTS);
  const [companies, setCompanies] = useState(INITIAL_COMPANIES);
  const [activeCompany, setActiveCompany] = useState(null);
  const [standsPasses, setStandsPasses] = useState(INITIAL_STANDS_PASSES);

  const [logoClicks, setLogoClicks] = useState(0);
  const [showCreator, setShowCreator] = useState(false);

  const handleLogoClick = () => {
    const next = logoClicks + 1;
    if (next >= 5) {
      setShowCreator(true);
      setLogoClicks(0);
    } else {
      setLogoClicks(next);
    }
  };

  const tabs = [
    { id: 'calculators', label: 'حاسبات الدرفلة', icon: Calculator },
    { id: 'social', label: 'المنشورات والأعطال', icon: MessageCircle },
    { id: 'companies', label: 'بوابة الشركات', icon: Building2 }
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans" dir="rtl">
      {/* الهيدر: مضغوط على الموبايل وثابت (sticky) على الشاشات الكبيرة فقط */}
      <header className="lg:sticky lg:top-0 z-40 bg-slate-950/95 backdrop-blur-md border-b border-slate-800/80">
        <div className="max-w-6xl mx-auto px-3 sm:px-4 py-3 flex flex-col lg:flex-row lg:justify-between lg:items-center gap-3">
          <div
            onClick={handleLogoClick}
            title="اضغط 5 مرات لفتح لوحة المصمم السرية"
            className="flex items-center gap-3 cursor-pointer select-none"
          >
            <div className="bg-gradient-to-br from-blue-600 to-indigo-600 p-2 rounded-2xl shadow-lg shadow-blue-600/30">
              <Zap className="text-white" size={20} />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-extrabold text-white tracking-tight leading-tight">
                Steel<span className="text-blue-500">Portal</span>
              </h1>
              <p className="text-[11px] text-slate-400">منصة مهندسي وفنيي الدرفلة</p>
            </div>
          </div>

          <nav className="grid grid-cols-3 gap-1.5 bg-slate-900 p-1.5 rounded-2xl border border-slate-800">
            {tabs.map((item) => {
              const IconComponent = item.icon;
              const isAct = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`px-2 sm:px-3.5 py-2 rounded-xl text-[11px] sm:text-sm font-bold flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 transition-all ${
                    isAct ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <IconComponent size={16} />
                  <span className="text-center leading-tight">{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-3 sm:px-4 py-5">
        {activeTab === 'calculators' && <SmartCalculatorsCenter />}
        {activeTab === 'social' && <SocialFeedAndFaults posts={posts} setPosts={setPosts} faults={faults} />}
        {activeTab === 'companies' && (
          <EnterpriseCompaniesPortal
            companies={companies}
            activeCompany={activeCompany}
            setActiveCompany={setActiveCompany}
            standsPasses={standsPasses}
            setStandsPasses={setStandsPasses}
          />
        )}
      </main>

      <CreatorSecretModal
        isOpen={showCreator}
        onClose={() => setShowCreator(false)}
        companies={companies}
        setCompanies={setCompanies}
        setActiveCompany={(c) => {
          setActiveCompany(c);
          setActiveTab('companies');
        }}
      />
    </div>
  );
}
