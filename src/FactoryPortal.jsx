import React, { useState } from 'react';
import {
  Calculator, Layers, Ruler, MessageCircle, RotateCcw, Activity,
  Gauge, DivideSquare, Maximize2, Circle, ArrowLeftRight, Zap,
  Cpu, Wrench, PlusCircle, ThumbsUp, Flame, Scissors, BookOpen,
  ChevronDown, ChevronUp, CheckCircle2, HelpCircle, Sliders
} from 'lucide-react';

/* ======================================================
   1. البيانات القياسية والجداول (ISO 6935-2 / ES 262)
   ====================================================== */
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

const INITIAL_POSTS = [
  {
    id: 'p1',
    author: 'م. بسام وليد',
    role: 'مشغل أول غرفة تحكم رئيسية',
    badge: 'Admin',
    time: 'منذ ساعتين',
    category: 'فنيات تشغيل الكنترول',
    title: 'إزاي تعرف فيه شد (Tension) ولا انضغاط (Loop) بين قائمين في التخشين من شاشة الأمبير؟',
    content:
      'طريقة عملية من غرفة التحكم الرئيسية (HMI): لو فرضنا إن أمبير قائم (2) كان 1500 أمبير أول ما المعدن دخل فيه، ولما رأس البيليت دخلت في قائم (3) لاحظت إن أمبير قائم (2) نزل فجأة لـ 1200 أمبير.. ده معناه وجود شد (Tension) بين القائمين ولازم نهدي سرعة قائم 3 أو نرفع سرعة قائم 1 و 2. العكس لو الأمبير زاد لـ 1700 أمبير فده معناه انضغاط (Compression) وبداية تكوين لوب!',
    likes: 28,
    liked: false,
    comments: [
      { id: 'c101', user: 'م. إسلام عرفات', role: 'مهندس درفلة', text: 'شرح ممتاز يا هندسة، وده اللي بنسميه في الأوتوميشن Minimum Tension Control (MTC).', time: 'منذ ساعة' },
      { id: 'c102', user: 'فني تشغيل أول', role: 'غرفة التحكم', text: 'فعلاً متابعة أمبير ق12 وق13 مهمة جداً خصوصاً في مقاس 10 مم و 12 مم لضبط الجاب.', time: 'منذ 45 دقيقة' }
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
      { id: 'c103', user: 'م. أحمد طارق', role: 'مهندس جودة', text: 'معلومة ذهبية! وعشان كدا ضبط عدد العلب المغلقة في الأبرون (X = V² / 8) بيفرق جداً في مسافة الرمي.', time: 'منذ 3 ساعات' }
    ]
  }
];

const INITIAL_FAULTS = [
  { id: 'f1', code: 'LAPS / قشرة', brand: 'عيوب الدرفلة والمنتج', title: 'ظهور شرخ ظاهري أو قشرة بطول السيخ (Laps Defect)', cause: 'حدوث امتلاء زائد (Overfill) في أحد الممرات مع دخول المعدن للممر التالي بزاوية غير مضبوطة فيتم طي الشنب ودرفلته.', solution: 'افحص خلوص الممر السابق، راجع سنترية دليل الدخول (Entry Guide)، واعمل اختبار ثني (Bending Test) للعينة.' },
  { id: 'f2', code: 'FINS / شنب', brand: 'عيوب الدرفلة والمنتج', title: 'ظهور نتوء طولي أكبر من المسموح', cause: 'من الجانبين: غلق جاب القائم النهائي زيادة عن اللزوم أو زيادة معدن من القوائم السابقة. من جانب واحد: عدم سنترية دليل الدخول أو انهيار رولمان بلي الدليل البكري.', solution: 'افحص Core Dimension ووزن المتر الطولي؛ لو القلب أقل من الطبيعي افتح جاب القائم النهائي، وراجع سنترية وبكر دليل الدخول.' },
  { id: 'f3', code: 'UNDERFILL / بطح', brand: 'عيوب الدرفلة والمنتج', title: 'عدم اكتمال الشرشرة أو اختفاء الشنب', cause: 'تلف في الدليل البكري ما قبل النهائي أو وجود شد كبير (High Tension) بين القوائم أو فتح الجاب زيادة عن اللزوم.', solution: 'راجع مستوى اللوبر لمنع الشد، افحص بكر الدلائل، واضبط جاب القائم النهائي.' },
  { id: 'f4', code: 'F0001 / Overcurrent', brand: 'Siemens SINAMICS Drives', title: 'فصل الإنفرتر تيار زائد مفاجئ أثناء دخول المعدن', cause: 'دخول بيليت بارد، نسبة تخفيض عالية جداً، أو زاوية عض أكبر من الحد المسموح.', solution: 'راجع حرارة البيليت، تأكد من تفعيل الـ Lead/Over Speed (2% - 5%) لتحسين عض مقدمة المعدن، وافحص كابلات الموتور.' }
];

const UNIT_GROUPS = {
  speed: { label: 'السرعة الخطية', baseUnit: 'm/s', units: [['m/s', 1], ['m/min', 1 / 60], ['km/h', 1 / 3.6], ['ft/s', 0.3048]] },
  rot: { label: 'السرعة الدورانية', baseUnit: 'RPM', units: [['RPM', 1], ['rad/s', 60 / (2 * Math.PI)], ['rev/s (Hz)', 60]] },
  length: { label: 'الطول والأبعاد', baseUnit: 'mm', units: [['mm', 1], ['cm', 10], ['m', 1000], ['in (بوصة)', 25.4]] },
  area: { label: 'المساحة', baseUnit: 'mm²', units: [['mm²', 1], ['cm²', 100], ['m²', 1000000]] },
  mass: { label: 'الوزن والكتلة', baseUnit: 'kg', units: [['kg', 1], ['ton (طن)', 1000], ['g (جرام)', 0.001], ['lb (رطل)', 0.45359237]] },
  force: { label: 'القوة والحمل', baseUnit: 'kN', units: [['kN', 1], ['N', 0.001], ['Ton-force', 9.80665], ['MN', 1000]] },
  power: { label: 'القدرة والطاقة', baseUnit: 'kW', units: [['kW', 1], ['hp (حصان ميكانيكي)', 0.7457], ['Watt', 0.001], ['MW', 1000]] },
  temp: { label: 'درجة الحرارة', baseUnit: '°C', temp: true, units: [['°C', 1], ['°F', 1], ['K', 1]] }
};

const toCelsius = (v, u) => (u === '°F' ? ((v - 32) * 5) / 9 : u === 'K' ? v - 273.15 : v);
const fromCelsius = (c, u) => (u === '°F' ? (c * 9) / 5 + 32 : u === 'K' ? c + 273.15 : c);

/* ======================================================
   2. عناصر واجهة مساعدة (UI Helpers)
   ====================================================== */
const num = (v) => (Number.isFinite(Number(v)) ? Number(v) : 0);
const fmt = (n, d = 2) => (Number.isFinite(Number(n)) ? Number(n).toFixed(d) : '—');
const inputCls = 'w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white font-mono text-sm focus:border-blue-500 outline-none';

const Field = ({ label, value, onChange, step = 'any', className = '' }) => (
  <div className={className}>
    <label className="text-xs text-slate-400 block mb-1 font-bold">{label}</label>
    <input type="number" step={step} value={value} onChange={(e) => onChange(e.target.value)} className={inputCls} />
  </div>
);

const SelectField = ({ label, value, onChange, options, className = '' }) => (
  <div className={className}>
    <label className="text-xs text-slate-400 block mb-1 font-bold">{label}</label>
    <select value={value} onChange={(e) => onChange(e.target.value)} className={inputCls}>
      {options.map((o) => (<option key={o[0]} value={o[0]}>{o[1]}</option>))}
    </select>
  </div>
);

const Stat = ({ label, value, unit, color = 'text-white', big = false }) => (
  <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800">
    <span className="text-xs text-slate-400 block mb-1">{label}</span>
    <span className={`font-bold font-mono ${big ? 'text-xl' : 'text-lg'} ${color}`}>
      {value} {unit && <span className="text-xs text-slate-500 ml-1">{unit}</span>}
    </span>
  </div>
);

const Shell = ({ inputs, results, border = 'border-blue-500/30' }) => (
  <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
    <div className="lg:col-span-6 bg-slate-900 p-4 sm:p-6 rounded-3xl border border-slate-800 space-y-4">{inputs}</div>
    <div className={`lg:col-span-6 bg-slate-900 p-4 sm:p-6 rounded-3xl border ${border} space-y-4`}>{results}</div>
  </div>
);

// مكون عرض خطوات الحل والقانون الهندسي
const SolutionStepsBox = ({ formula, steps }) => {
  const [open, setOpen] = useState(true);
  if (!steps || steps.length === 0) return null;

  return (
    <div className="mt-5 bg-slate-950/90 border border-amber-500/30 rounded-2xl overflow-hidden shadow-lg">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full px-4 py-3 bg-amber-500/10 flex items-center justify-between text-amber-400 font-bold text-sm hover:bg-amber-500/15 transition-colors"
      >
        <span className="flex items-center gap-2">
          <BookOpen size={17} /> طريقة الحل والقانون الهندسي خطوة بخطوة
        </span>
        {open ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
      </button>

      {open && (
        <div className="p-4 space-y-3 text-xs sm:text-sm">
          {formula && (
            <div className="bg-slate-900 p-3 rounded-xl border border-slate-800">
              <span className="text-slate-400 text-xs block mb-1">القانون الأساسي:</span>
              <p className="font-mono text-amber-300 font-bold dir-ltr text-left">{formula}</p>
            </div>
          )}
          <div className="space-y-2">
            {steps.map((st, idx) => (
              <div key={idx} className="flex items-start gap-2.5 bg-slate-900/60 p-2.5 rounded-xl border border-slate-800/70">
                <span className="w-5 h-5 rounded-full bg-blue-600/20 text-blue-400 border border-blue-500/30 font-mono text-xs flex items-center justify-center shrink-0 mt-0.5">
                  {idx + 1}
                </span>
                <p className="text-slate-200 leading-relaxed font-mono">{st}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

/* ======================================================
   3. موسوعة الحاسبات السريعة (18 حاسبة مع خطوات الحل)
   ====================================================== */
const PUBLIC_CALCULATORS = [
  // --- أ. حاسبات الدرفلة والسرعات ---
  {
    id: 'c1',
    title: 'السرعة الخطية للمعدن (Linear Speed)',
    icon: Activity,
    group: 'درفلة وسرعات',
    formula: 'V (m/s) = (π × Dw × N_roll) / 60000',
    inputs: [
      { k: 'd', l: 'القطر الفعال للدرفيل Dw (mm)', def: 465 },
      { k: 'n', l: 'سرعة دوران الدرفيل N_roll (RPM)', def: 220 }
    ],
    calc: (v) => {
      const d = num(v.d);
      const n = num(v.n);
      const res = (Math.PI * d * n) / 60000;
      return {
        results: { 'السرعة الخطية V (m/s)': fmt(res, 2), 'السرعة بالمتر/دقيقة (m/min)': fmt(res * 60, 1) },
        steps: [
          `نحسب محيط الدرفيل الفعال = π × ${d} = ${fmt(Math.PI * d, 1)} مم = ${fmt((Math.PI * d) / 1000, 3)} متر`,
          `نضرب المحيط بالمتر في عدد اللفات بالدقيقة = ${fmt((Math.PI * d) / 1000, 3)} × ${n} = ${fmt(res * 60, 2)} م/دقيقة`,
          `نقسم على 60 للتحويل إلى متر/ثانية: V = ${fmt(res * 60, 2)} / 60 = ${fmt(res, 2)} m/s`
        ]
      };
    }
  },
  {
    id: 'c2',
    title: 'عدد لفات الدرفيل (Roll RPM)',
    icon: RotateCcw,
    group: 'درفلة وسرعات',
    formula: 'N_roll (RPM) = (V × 60000) / (π × Dw)',
    inputs: [
      { k: 'v', l: 'السرعة الخطية المطلوبة V (m/s)', def: 5.5 },
      { k: 'd', l: 'القطر الفعال للدرفيل Dw (mm)', def: 465 }
    ],
    calc: (v) => {
      const vel = num(v.v);
      const d = Math.max(1, num(v.d));
      const rpm = (vel * 60000) / (Math.PI * d);
      return {
        results: { 'لفات الدرفيل (RPM)': fmt(rpm, 1) },
        steps: [
          `نحول السرعة من م/ث إلى مم/دقيقة = ${vel} × 60000 = ${fmt(vel * 60000, 0)} مم/دقيقة`,
          `نحسب محيط الدرفيل = π × ${d} = ${fmt(Math.PI * d, 2)} مم`,
          `نقسم المسافة بالدقيقة على المحيط: RPM = ${fmt(vel * 60000, 0)} / ${fmt(Math.PI * d, 2)} = ${fmt(rpm, 1)} لفة/دقيقة`
        ]
      };
    }
  },
  {
    id: 'c3',
    title: 'عدد لفات الموتور والجيربوكس (Motor RPM)',
    icon: Gauge,
    group: 'درفلة وسرعات',
    formula: 'N_motor = N_roll × Gear_Ratio',
    inputs: [
      { k: 'nr', l: 'لفات الدرفيل المطلوبة N_roll (RPM)', def: 220 },
      { k: 'gr', l: 'نسبة التخفيض للجيربوكس (Gear Ratio)', def: 3.4 },
      { k: 'over', l: 'نسبة الـ Over Speed للعض (%)', def: 3 }
    ],
    calc: (v) => {
      const nr = num(v.nr);
      const gr = num(v.gr);
      const over = num(v.over);
      const nm = nr * gr;
      const nmOver = nm * (1 + over / 100);
      return {
        results: { 'لفات الموتور الأساسية (RPM)': fmt(nm, 0), 'لفات الموتور مع Over Speed (RPM)': fmt(nmOver, 0) },
        steps: [
          `نضرب سرعة الدرفيل في نسبة الجيربوكس: N_motor = ${nr} × ${gr} = ${fmt(nm, 1)} RPM`,
          `نضيف نسبة السرعة الزائدة للعض (${over}%): ${fmt(nm, 1)} × (1 + ${over}/100) = ${fmt(nmOver, 1)} RPM`
        ]
      };
    }
  },
  {
    id: 'c4',
    title: 'القطر الفعال ومعامل الممر (Working Dia & Groove Factor)',
    icon: Circle,
    group: 'درفلة وسرعات',
    formula: 'Groove Factor = (Area / Width) - Gap  |  Dw = De - Groove Factor',
    inputs: [
      { k: 'de', l: 'القطر الخارجي للدرفيل De (mm)', def: 480 },
      { k: 'area', l: 'مساحة الممر Area (mm²)', def: 650 },
      { k: 'width', l: 'عرض الممر Width (mm)', def: 45 },
      { k: 'gap', l: 'خلوص الدرفيلين Gap (mm)', def: 3.5 }
    ],
    calc: (v) => {
      const de = num(v.de);
      const area = num(v.area);
      const w = Math.max(1, num(v.width));
      const gap = num(v.gap);
      const gf = area / w - gap;
      const dw = de - gf;
      return {
        results: { 'معامل الممر (Groove Factor)': `${fmt(gf, 2)} mm`, 'القطر الفعال الشغال (Dw)': `${fmt(dw, 2)} mm` },
        steps: [
          `نحسب متوسط عمق الممر = المساحة / العرض = ${area} / ${w} = ${fmt(area / w, 2)} مم`,
          `نطرح الجاب للحصول على معامل الممر: Groove Factor = ${fmt(area / w, 2)} - ${gap} = ${fmt(gf, 2)} مم`,
          `نطرح معامل الممر من القطر الخارجي: Dw = ${de} - ${fmt(gf, 2)} = ${fmt(dw, 2)} مم`
        ]
      };
    }
  },
  {
    id: 'c5',
    title: 'نسبة التخفيض والاستطالة (Reduction & Elongation)',
    icon: DivideSquare,
    group: 'درفلة وسرعات',
    formula: 'Reduction % = ((A1 - A2) / A1) × 100  |  λ = A1 / A2',
    inputs: [
      { k: 'a1', l: 'مساحة الدخول A1 (mm²)', def: 1600 },
      { k: 'a2', l: 'مساحة الخروج A2 (mm²)', def: 1200 }
    ],
    calc: (v) => {
      const a1 = Math.max(1, num(v.a1));
      const a2 = Math.max(1, num(v.a2));
      const red = ((a1 - a2) / a1) * 100;
      const lam = a1 / a2;
      return {
        results: { 'نسبة التخفيض (Reduction %)': `${fmt(red, 2)}%`, 'معامل الاستطالة (λ)': fmt(lam, 3) },
        steps: [
          `مقدار النقص في المساحة = A1 - A2 = ${a1} - ${a2} = ${fmt(a1 - a2, 1)} mm²`,
          `نسبة التخفيض المئوية = (${fmt(a1 - a2, 1)} / ${a1}) × 100 = ${fmt(red, 2)}%`,
          `معامل الاستطالة (Elongation Factor) = ${a1} / ${a2} = ${fmt(lam, 3)}`
        ]
      };
    }
  },
  {
    id: 'c6',
    title: 'قانون ثبات الحجم وتزامن القوائم (Mass Flow)',
    icon: Layers,
    group: 'درفلة وسرعات',
    formula: 'Q = A1 × V1 = A2 × V2 = Constant',
    inputs: [
      { k: 'a1', l: 'مساحة قائم 1 (mm²)', def: 1450 },
      { k: 'v1', l: 'سرعة قائم 1 (m/s)', def: 2.4 },
      { k: 'a2', l: 'مساحة قائم 2 (mm²)', def: 1120 }
    ],
    calc: (v) => {
      const a1 = num(v.a1);
      const v1 = num(v.v1);
      const a2 = Math.max(1, num(v.a2));
      const q = a1 * v1;
      const v2 = q / a2;
      return {
        results: { 'ثابت الدرفلة Q (mm².m/s)': fmt(q, 0), 'سرعة القائم الثاني V2 (m/s)': fmt(v2, 2) },
        steps: [
          `نحسب ثابت التدفق الحجمي في القائم الأول: Q = A1 × V1 = ${a1} × ${v1} = ${fmt(q, 1)} mm².m/s`,
          `بما أن الحجم ثابت (A1×V1 = A2×V2)، نقسم Q على مساحة القائم الثاني A2:`,
          `السرعة المتزامنة V2 = ${fmt(q, 1)} / ${a2} = ${fmt(v2, 2)} m/s`
        ]
      };
    }
  },
  {
    id: 'c7',
    title: 'سرعة القائم السابق (Cascade Upstream Speed)',
    icon: ArrowLeftRight,
    group: 'درفلة وسرعات',
    formula: 'V1 = (A2 × V2) / A1',
    inputs: [
      { k: 'a2', l: 'مساحة القائم الحالي A2 (mm²)', def: 850 },
      { k: 'v2', l: 'سرعة القائم الحالي V2 (m/s)', def: 4.8 },
      { k: 'a1', l: 'مساحة القائم السابق A1 (mm²)', def: 1120 }
    ],
    calc: (v) => {
      const a2 = num(v.a2);
      const v2 = num(v.v2);
      const a1 = Math.max(1, num(v.a1));
      const v1 = (a2 * v2) / a1;
      return {
        results: { 'سرعة القائم السابق V1 (m/s)': fmt(v1, 2) },
        steps: [
          `نحسب ثابت التدفق عند القائم الحالي: Q = ${a2} × ${v2} = ${fmt(a2 * v2, 1)}`,
          `نقسم ثابت التدفق على مساحة القائم السابق A1 (${a1}):`,
          `V1 = ${fmt(a2 * v2, 1)} / ${a1} = ${fmt(v1, 2)} m/s`
        ]
      };
    }
  },
  {
    id: 'c8',
    title: 'الضغطة وزاوية العض وشرط عدم الزحلقة (Draft & Bite)',
    icon: Maximize2,
    group: 'درفلة وسرعات',
    formula: 'ΔH = H1 - H2  |  ΔH_max = μ² × R  |  cos(α) = 1 - (ΔH / D)',
    inputs: [
      { k: 'h1', l: 'ارتفاع الدخول H1 (mm)', def: 22 },
      { k: 'h2', l: 'ارتفاع الخروج H2 (mm)', def: 15 },
      { k: 'd', l: 'قطر الدرفيل D (mm)', def: 420 },
      { k: 'mu', l: 'معامل الاحتكاك μ (0.3 - 0.4)', def: 0.35 }
    ],
    calc: (v) => {
      const h1 = num(v.h1);
      const h2 = num(v.h2);
      const d = Math.max(1, num(v.d));
      const mu = num(v.mu);
      const dh = Math.max(0, h1 - h2);
      const r = d / 2;
      const dhMax = mu * mu * r;
      const alphaRad = Math.acos(Math.max(-1, Math.min(1, 1 - dh / d)));
      const alphaDeg = (alphaRad * 180) / Math.PI;
      const ok = mu >= Math.tan(alphaRad);
      return {
        results: {
          'الضغطة المطلقة (ΔH)': `${fmt(dh, 2)} mm`,
          'أقصى ضغطة مسموحة (ΔH max)': `${fmt(dhMax, 2)} mm`,
          'زاوية العض (Bite Angle α)': `${fmt(alphaDeg, 1)}° (${ok ? 'آمن' : 'خطر زحلقة!'})`
        },
        steps: [
          `الضغطة المطلقة ΔH = H1 - H2 = ${h1} - ${h2} = ${fmt(dh, 2)} مم`,
          `نصف قطر الدرفيل R = ${d} / 2 = ${r} مم`,
          `أقصى ضغطة يقبلها الدرفيل ΔH_max = μ² × R = (${mu})² × ${r} = ${fmt(dhMax, 2)} مم`,
          `زاوية العض α = arccos(1 - ${fmt(dh, 2)}/${d}) = ${fmt(alphaDeg, 1)} درجة`
        ]
      };
    }
  },
  {
    id: 'c9',
    title: 'الانزلاق الأمامي والانتشار العرضي (Forward Slip & Spread)',
    icon: Sliders,
    group: 'درفلة وسرعات',
    formula: 'Slip % = ((V_bar - V_roll) / V_roll) × 100  |  Spread = 0.35 × ΔH × √(R / H1)',
    inputs: [
      { k: 'vroll', l: 'السرعة المحيطية للدرفيل V_roll (m/s)', def: 6.0 },
      { k: 'vbar', l: 'سرعة خروج المعدن الفعلية V_bar (m/s)', def: 6.3 },
      { k: 'dh', l: 'مقدار الضغطة ΔH (mm)', def: 6 },
      { k: 'r', l: 'نصف قطر الدرفيل R (mm)', def: 200 },
      { k: 'h1', l: 'ارتفاع الدخول H1 (mm)', def: 20 }
    ],
    calc: (v) => {
      const vr = Math.max(0.1, num(v.vroll));
      const vb = num(v.vbar);
      const dh = num(v.dh);
      const r = num(v.r);
      const h1 = Math.max(1, num(v.h1));
      const slip = ((vb - vr) / vr) * 100;
      const spread = 0.35 * dh * Math.sqrt(r / h1);
      return {
        results: { 'نسبة الانزلاق الأمامي (Forward Slip)': `${fmt(slip, 2)}%`, 'الانتشار العرضي المتوقع (Spread)': `+${fmt(spread, 2)} mm` },
        steps: [
          `فرق السرعة بعد نقطة الحياد = V_bar - V_roll = ${vb} - ${vr} = ${fmt(vb - vr, 2)} m/s`,
          `نسبة الانزلاق الأمامي = (${fmt(vb - vr, 2)} / ${vr}) × 100 = ${fmt(slip, 2)}%`,
          `الانتشار العرضي (معادلة Siebel) = 0.35 × ${dh} × √(${r} / ${h1}) = ${fmt(spread, 2)} مم`
        ]
      };
    }
  },

  // --- ب. حاسبات الأتمتة والمقصات واللوبر والأبرون ---
  {
    id: 'a1',
    title: 'مسافة رمي الأبرون وعدد العلب المغلقة (Apron Braking)',
    icon: Flame,
    group: 'أتمتة وفنش',
    formula: 'X (العلب المغلقة بالمتر) = V² / (2 × g × f) ≈ V² / 8',
    inputs: [
      { k: 'v', l: 'سرعة خروج السيخ من آخر قائم V (m/s)', def: 12 },
      { k: 'f', l: 'معامل احتكاك الأبرون f (القياسي 0.408)', def: 0.408 }
    ],
    calc: (v) => {
      const vel = num(v.v);
      const f = Math.max(0.05, num(v.f));
      const xStd = (vel * vel) / 8;
      const xExact = (vel * vel) / (2 * 9.81 * f);
      return {
        results: { 'عدد العلب المغلقة (المعادلة القياسية V²/8)': `${fmt(xStd, 1)} علبة (متر)`, 'مسافة الفرملة الدقيقة': `${fmt(xExact, 1)} متر` },
        steps: [
          `مربع سرعة السيخ الخارج من الفنش: V² = ${vel} × ${vel} = ${fmt(vel * vel, 1)}`,
          `بقسمة مربع السرعة على ثابت الفرملة (2 × g × f ≈ 8):`,
          `عدد العلب المغلقة X = ${fmt(vel * vel, 1)} / 8 = ${fmt(xStd, 1)} علبة (حيث طول العلبة 1 متر)`
        ]
      };
    }
  },
  {
    id: 'a2',
    title: 'ضبط ارتفاعات بكر اللوبر (Looper Rollers H & Y)',
    icon: Sliders,
    group: 'أتمتة وفنش',
    formula: 'H = X + R (البكرة الثابتة)  |  Y = H + (H / 3) (البكرة المتحركة)',
    inputs: [
      { k: 'x', l: 'ارتفاع خط سنتر الدليل عن قاعدة اللوبر X (mm)', def: 150 },
      { k: 'r', l: 'نصف قطر البار المدرفل R (mm)', def: 8 }
    ],
    calc: (v) => {
      const x = num(v.x);
      const r = num(v.r);
      const h = x + r;
      const y = h + h / 3;
      return {
        results: { 'ارتفاع البكرة العلوية الثابتة (H)': `${fmt(h, 1)} mm`, 'ارتفاع البكرة المتحركة Kicker (Y)': `${fmt(y, 1)} mm` },
        steps: [
          `نجمع ارتفاع سنتر الدليل X مع نصف قطر البار R للحصول على ارتفاع البكرة الثابتة H:`,
          `H = ${x} + ${r} = ${fmt(h, 1)} مم`,
          `نضيف ثلث قيمة H لضبط مستوى البكرة المتحركة (Kicker Roll):`,
          `Y = ${fmt(h, 1)} + (${fmt(h, 1)} / 3) = ${fmt(y, 1)} مم`
        ]
      };
    }
  },
  {
    id: 'a3',
    title: 'تزامن المقص الطائر والـ Over Speed (Flying Shear)',
    icon: Scissors,
    group: 'أتمتة وفنش',
    formula: 'V_cv = (2 × π × N_cv / 60) × R  |  Over Speed % = ((V_cv - V_bar) / V_bar) × 100',
    inputs: [
      { k: 'nm', l: 'سرعة موتور المقص N_motor (RPM)', def: 1200 },
      { k: 'gr', l: 'نسبة جيربوكس المقص (Gear Ratio)', def: 4 },
      { k: 'r', l: 'نصف قطر دوران سلاح المقص R (متر)', def: 0.35 },
      { k: 'vbar', l: 'سرعة المعدن من القائم السابق V_bar (m/s)', def: 10 }
    ],
    calc: (v) => {
      const nm = num(v.nm);
      const gr = Math.max(0.1, num(v.gr));
      const r = num(v.r);
      const vbar = Math.max(0.1, num(v.vbar));
      const ncv = nm / gr;
      const w = (2 * Math.PI * ncv) / 60;
      const vcv = w * r;
      const over = ((vcv - vbar) / vbar) * 100;
      return {
        results: { 'السرعة الخطية لسلاح المقص V_cv (m/s)': fmt(vcv, 2), 'نسبة Shear Over Speed (%)': `${fmt(over, 1)}%` },
        steps: [
          `سرعة دوران المقص N_cv = ${nm} / ${gr} = ${fmt(ncv, 1)} RPM`,
          `السرعة الزاوية للمقص ω_cv = (2 × π × ${fmt(ncv, 1)}) / 60 = ${fmt(w, 2)} rad/s`,
          `السرعة الخطية للمقص V_cv = ω_cv × R = ${fmt(w, 2)} × ${r} = ${fmt(vcv, 2)} m/s`,
          `نسبة السرعة الزائدة لمنع انحناء المقدمة = ((${fmt(vcv, 2)} - ${vbar}) / ${vbar}) × 100 = ${fmt(over, 1)}%`
        ]
      };
    }
  },
  {
    id: 'a4',
    title: 'زاوية دليل الإقلاب (Twister Guide Angle β)',
    icon: RotateCcw,
    group: 'أتمتة وفنش',
    formula: 'β° = (X / Y) × Target_Angle (45° or 90°)',
    inputs: [
      { k: 'x', l: 'المسافة من القائم لدليل الإقلاب X (mm)', def: 450 },
      { k: 'y', l: 'المسافة الكلية بين القائمين Y (mm)', def: 2200 },
      { k: 'target', l: 'زاوية القلب المطلوبة بالمرور (45 أو 90 درجة)', def: 90 }
    ],
    calc: (v) => {
      const x = num(v.x);
      const y = Math.max(1, num(v.y));
      const target = num(v.target);
      const beta = (x / y) * target;
      return {
        results: { 'زاوية ضبط بكر دليل الإقلاب (β°)': `${fmt(beta, 2)}°` },
        steps: [
          `نحسب نسبة موقع دليل الإقلاب إلى المسافة الكلية = X / Y = ${x} / ${y} = ${fmt(x / y, 3)}`,
          `نضرب النسبة في زاوية الإقلاب الكلية المطلوبة (${target}°):`,
          `زاوية الضبط β = ${fmt(x / y, 3)} × ${target}° = ${fmt(beta, 2)} درجة`
        ]
      };
    }
  },

  // --- ج. حاسبات القوى والكهرباء والدرايفات ---
  {
    id: 'e1',
    title: 'حمل وعزم وقدرة الدرفلة (Load, Torque & Power)',
    icon: Flame,
    group: 'قوى وكهرباء',
    formula: 'Lp = √(R × Δh)  |  Load = σ × W × Lp  |  T = 2 × Load × 0.5 × Lp  |  P = (2π × N × T) / 60',
    inputs: [
      { k: 'sigma', l: 'مقاومة المعدن للتشكيل σ (MPa)', def: 110 },
      { k: 'w', l: 'عرض المعدن الملامس W (mm)', def: 45 },
      { k: 'r', l: 'نصف قطر الدرفيل R (mm)', def: 210 },
      { k: 'dh', l: 'مقدار الضغطة Δh (mm)', def: 6 },
      { k: 'rpm', l: 'سرعة دوران الدرفيل N_roll (RPM)', def: 240 }
    ],
    calc: (v) => {
      const s = num(v.sigma);
      const w = num(v.w);
      const r = num(v.r);
      const dh = Math.max(0, num(v.dh));
      const rpm = num(v.rpm);
      const lp = Math.sqrt(r * dh);
      const loadKn = (s * w * lp) / 1000;
      const torqueKnm = loadKn * (lp / 1000);
      const powerKw = (torqueKnm * 2 * Math.PI * rpm) / 60;
      return {
        results: {
          'طول قوس التلامس Lp (mm)': fmt(lp, 2),
          'حمل الدرفلة (Rolling Load)': `${fmt(loadKn, 1)} kN`,
          'عزم الدرفلة (Torque)': `${fmt(torqueKnm, 2)} kN.m`,
          'قدرة الدرفلة المطلوبة (Power)': `${fmt(powerKw, 1)} kW`
        },
        steps: [
          `طول قوس التلامس Lp = √(R × Δh) = √(${r} × ${dh}) = ${fmt(lp, 2)} مم`,
          `حمل الدرفلة = σ × W × Lp = ${s} × ${w} × ${fmt(lp, 2)} = ${fmt(loadKn, 1)} كيلو نيوتن`,
          `عزم الدرفلة للدرفيلين = 2 × Load × 0.5 × (Lp/1000) = ${fmt(torqueKnm, 2)} kN.m`,
          `القدرة الميكانيكية = (2 × π × ${rpm} × ${fmt(torqueKnm, 2)}) / 60 = ${fmt(powerKw, 1)} كيلووات`
        ]
      };
    }
  },
  {
    id: 'e2',
    title: 'حساب أمبير الموتور ثلاثي الأوجه (3-Phase Current)',
    icon: Cpu,
    group: 'قوى وكهرباء',
    formula: 'I (Amp) = (P_kW × 1000) / (√3 × V × PF × η)',
    inputs: [
      { k: 'kw', l: 'قدرة الموتور (kW)', def: 400 },
      { k: 'v', l: 'الجهد الكهربائي (Volt)', def: 400 },
      { k: 'pf', l: 'معامل القدرة (Power Factor)', def: 0.86 },
      { k: 'eff', l: 'كفاءة الموتور η (مثلاً 0.94)', def: 0.94 }
    ],
    calc: (v) => {
      const kw = num(v.kw);
      const volt = Math.max(1, num(v.v));
      const pf = Math.max(0.1, num(v.pf));
      const eff = Math.max(0.1, num(v.eff));
      const amp = (kw * 1000) / (Math.sqrt(3) * volt * pf * eff);
      return {
        results: { 'التيار المسحوب المتوقع (Amperes)': `${fmt(amp, 1)} A` },
        steps: [
          `نحول القدرة من كيلووات إلى وات = ${kw} × 1000 = ${kw * 1000} Watt`,
          `نحسب مقام المعادلة = √3 (1.732) × ${volt}V × ${pf} × ${eff} = ${fmt(Math.sqrt(3) * volt * pf * eff, 2)}`,
          `نقسم القدرة بالوات على المقام: I = ${kw * 1000} / ${fmt(Math.sqrt(3) * volt * pf * eff, 2)} = ${fmt(amp, 1)} أمبير`
        ]
      };
    }
  },
  {
    id: 'e3',
    title: 'تردد الإنفرتر والسرعة التزامنية (VFD Hz & RPM)',
    icon: Zap,
    group: 'قوى وكهرباء',
    formula: 'f (Hz) = (N_motor × Poles) / 120',
    inputs: [
      { k: 'rpm', l: 'سرعة الموتور المطلوبة (RPM)', def: 1250 },
      { k: 'poles', l: 'عدد أقطاب الموتور (مثلاً 4 أو 6)', def: 4 }
    ],
    calc: (v) => {
      const rpm = num(v.rpm);
      const p = Math.max(2, num(v.poles));
      const hz = (rpm * p) / 120;
      return {
        results: { 'تردد خرج الـ VFD المطلوب (Hz)': `${fmt(hz, 1)} Hz` },
        steps: [
          `نضرب سرعة الموتور المطلوبة في عدد الأقطاب = ${rpm} × ${p} = ${rpm * p}`,
          `نقسم الناتج على ثابت التزامن 120: f = ${rpm * p} / 120 = ${fmt(hz, 1)} هرتز (Hz)`
        ]
      };
    }
  }
];

const BasicCalculatorsGrid = () => {
  const [activeCalc, setActiveCalc] = useState(null);
  const [vals, setVals] = useState({});

  const openCalculator = (calcObj) => {
    const defaults = {};
    calcObj.inputs.forEach((inp) => {
      defaults[inp.k] = inp.def !== undefined ? inp.def : 1;
    });
    setVals(defaults);
    setActiveCalc(calcObj.id);
  };

  if (activeCalc) {
    const c = PUBLIC_CALCULATORS.find((x) => x.id === activeCalc);
    const { results, steps } = c.calc(vals);
    return (
      <div className="animate-in fade-in zoom-in duration-300">
        <button
          onClick={() => { setActiveCalc(null); setVals({}); }}
          className="mb-4 bg-slate-800 text-slate-300 px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-slate-700 flex items-center gap-2"
        >
          <RotateCcw size={16} /> العودة لكل الحاسبات السريعة
        </button>

        <div className="bg-slate-900 p-6 md:p-8 rounded-3xl border border-slate-800 max-w-3xl mx-auto shadow-2xl">
          <div className="flex items-center gap-3 mb-6 border-b border-slate-800 pb-5">
            <div className="bg-blue-600/20 p-3.5 rounded-2xl border border-blue-500/30">
              <c.icon className="w-8 h-8 text-blue-400" />
            </div>
            <div>
              <span className="text-xs text-blue-400 font-bold">{c.group}</span>
              <h2 className="text-2xl font-black text-white">{c.title}</h2>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {c.inputs.map((inp) => (
              <div key={inp.k}>
                <label className="block text-xs font-bold text-slate-400 mb-1.5">{inp.l}</label>
                <input
                  type="number"
                  step="any"
                  value={vals[inp.k] ?? ''}
                  onChange={(e) => setVals({ ...vals, [inp.k]: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3.5 text-white font-mono text-base outline-none focus:border-blue-500 transition-colors"
                />
              </div>
            ))}
          </div>

          {/* صندوق النتيجة النهائية */}
          <div className="mt-6 bg-slate-950 p-5 rounded-2xl border border-blue-500/40 space-y-3 shadow-lg">
            {Object.entries(results).map(([k, v]) => (
              <div key={k} className="flex justify-between items-center border-b border-slate-800/80 last:border-0 pb-2 last:pb-0">
                <span className="text-slate-300 font-bold text-sm sm:text-base">{k}</span>
                <span className="text-blue-400 font-black font-mono text-xl sm:text-2xl">{v}</span>
              </div>
            ))}
          </div>

          {/* صندوق خطوات الحل والقانون */}
          <SolutionStepsBox formula={c.formula} steps={steps} />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      {['درفلة وسرعات', 'أتمتة وفنش', 'قوى وكهرباء'].map((group) => (
        <div key={group} className="bg-slate-900 border border-slate-800 p-6 rounded-3xl shadow-lg">
          <h3 className="text-xl font-black text-white mb-5 flex items-center gap-2">
            <div className="w-2 h-6 bg-blue-500 rounded-full" /> حاسبات {group}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {PUBLIC_CALCULATORS.filter((c) => c.group === group).map((c) => (
              <button
                key={c.id}
                onClick={() => openCalculator(c)}
                className="bg-slate-950 hover:bg-slate-800/90 border border-slate-800 hover:border-blue-500 p-5 rounded-2xl flex flex-col items-center gap-3 transition-all text-center group shadow-md hover:-translate-y-1"
              >
                <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-2xl group-hover:scale-110 transition-transform">
                  <c.icon className="w-7 h-7 text-blue-400" />
                </div>
                <span className="text-sm font-bold text-slate-200 leading-snug">{c.title}</span>
                <span className="text-[11px] text-amber-400/90 font-medium mt-auto">مع خطوات الحل والقانون</span>
              </button>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

/* ======================================================
   4. الحاسبات المتقدمة (تصميم الممرات، الأسياخ، والإنتاجية/الإدرار)
   ====================================================== */
const PassDesignCalc = () => {
  const [side, setSide] = useState(130);
  const [size, setSize] = useState('12');
  const [strands, setStrands] = useState('2');
  const [stands, setStands] = useState(14);
  const [vFinal, setVFinal] = useState(14);
  const [dwFirst, setDwFirst] = useState(480);
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

  const stepsList = [
    `مساحة البيليت الابتدائية A0 = ${side} × ${side} = ${fmt(A0, 0)} مم²`,
    `مساحة الخرج الكلية (${k} خط × مساحة مقاس ${size}مم) A_out = ${k} × ${spec.area} = ${fmt(Aout, 1)} مم²`,
    `معامل الاستطالة الكلي λ_total = A0 / A_out = ${fmt(A0, 0)} / ${fmt(Aout, 1)} = ${fmt(lamTotal, 2)}`,
    `متوسط الاستطالة لكل قائم من الـ ${N} قوائم: λ_pass = (${fmt(lamTotal, 2)})^(1/${N}) = ${fmt(lamPass, 3)}`,
    `ثابت الدرفلة للخط Q = A_out × V_final = ${fmt(Aout, 1)} × ${vFinal} = ${fmt(Q, 0)} مم².م/ث`
  ];

  return (
    <div className="space-y-5">
      <Shell
        border="border-teal-500/30"
        inputs={
          <>
            <h3 className="text-xl font-bold text-white border-b border-slate-800 pb-3">
              1. حاسبة تصميم الممرات وتوزيع السرعات (Pass Design)
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <Field label="ضلع البليت (mm)" value={side} onChange={setSide} />
              <Field label="طول البليت (m)" value={billetLen} onChange={setBilletLen} step="0.5" />
              <SelectField label="مقاس المنتج" value={size} onChange={setSize} options={REBAR_SPECS.map((r) => [String(r.size), `${r.size} مم`])} />
              <SelectField label="البارات (Strands)" value={strands} onChange={setStrands} options={[['1', '1'], ['2', '2'], ['3', '3'], ['4', '4']]} />
              <Field label="عدد القوائم" value={stands} onChange={setStands} />
              <Field label="سرعة الخروج (m/s)" value={vFinal} onChange={setVFinal} step="0.5" />
              <Field label="Dw أول قائم (mm)" value={dwFirst} onChange={setDwFirst} />
              <Field label="Dw آخر قائم (mm)" value={dwLast} onChange={setDwLast} />
              <Field label="Gear Ratio متوسط" value={gr} onChange={setGr} step="0.1" />
              <Field label="Max RPM للموتور" value={maxRpm} onChange={setMaxRpm} />
              <Field label="طول قطعية المقص الطائر (m)" value={cutLen} onChange={setCutLen} step="1" className="col-span-2" />
            </div>
          </>
        }
        results={
          <>
            <h3 className="text-xl font-bold text-teal-400 border-b border-slate-800 pb-3">ملخص التصميم وخطوات الحل</h3>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <Stat label="الاستطالة الكلية" value={fmt(lamTotal, 1)} color="text-teal-400" big />
              <Stat label="λ لكل ممر" value={fmt(lamPass, 3)} />
              <Stat label="تخفيض الممر" value={fmt((1 - 1 / lamPass) * 100, 1)} unit="%" />
              <Stat label="سرعة دخول ق1" value={fmt(V0, 3)} unit="m/s" />
            </div>
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-slate-400">وزن البليت:</span><span className="font-mono text-white font-bold">{fmt(billetKg, 0)} كجم</span></div>
              <div className="flex justify-between"><span className="text-slate-400">زمن الدرفلة الصافي:</span><span className="font-mono text-white font-bold">{fmt(passTime, 1)} ثانية</span></div>
              <div className="flex justify-between border-t border-slate-800 pt-2"><span className="text-slate-400">القطعيات + البار الأخير:</span><span className="font-mono text-amber-400 font-bold">{cuts} قطعية + {fmt(shortBar, 1)} م</span></div>
            </div>
            <SolutionStepsBox formula="λ_total = A_billet / (k × A_bar)  |  V_i = Q / A_i" steps={stepsList} />
          </>
        }
      />

      <div className="bg-slate-900 p-5 rounded-3xl border border-slate-800 overflow-x-auto">
        <h3 className="text-lg font-bold text-white mb-3">جدول توزيع المساحات والسرعات على القوائم (1 إلى {N})</h3>
        <table className="w-full text-right text-sm min-w-[600px]">
          <thead className="bg-slate-950 text-slate-400 text-xs">
            <tr>
              <th className="p-2.5 rounded-r-lg">قائم</th>
              <th className="p-2.5">المساحة mm²</th>
              <th className="p-2.5">تخفيض %</th>
              <th className="p-2.5">السرعة m/s</th>
              <th className="p-2.5">Dw mm</th>
              <th className="p-2.5">درفيل RPM</th>
              <th className="p-2.5 rounded-l-lg">موتور RPM</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800 font-mono">
            {rows.map((r) => (
              <tr key={r.idx} className={r.over ? 'bg-red-500/10' : 'hover:bg-slate-800/40'}>
                <td className="p-2.5 font-bold text-white">ق {r.idx}</td>
                <td className="p-2.5 text-slate-300">{fmt(r.A, 1)}</td>
                <td className="p-2.5 text-emerald-400">{fmt(r.red, 1)}%</td>
                <td className="p-2.5 text-sky-400 font-bold">{fmt(r.V, 2)}</td>
                <td className="p-2.5 text-slate-300">{fmt(r.dw, 0)}</td>
                <td className="p-2.5 text-slate-300">{fmt(r.roll, 1)}</td>
                <td className={`p-2.5 font-bold ${r.over ? 'text-red-400' : 'text-amber-400'}`}>{fmt(r.motor, 0)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const BarsAndYieldCalc = () => {
  const [side, setSide] = useState(130);
  const [billetLen, setBilletLen] = useState(12);
  const [size, setSize] = useState('12');
  const [yieldPct, setYieldPct] = useState(97.5);
  const [strands, setStrands] = useState('2');
  const [cutLen, setCutLen] = useState(48);
  const [commLen, setCommLen] = useState(12);
  const [gapSec, setGapSec] = useState(4);
  const [lineSpeed, setLineSpeed] = useState(13);

  const spec = REBAR_SPECS.find((r) => String(r.size) === size) || REBAR_SPECS[1];
  const k = Number(strands) || 1;
  const billetKg = num(side) * num(side) * 0.00785 * num(billetLen);
  const prodKg = (billetKg * num(yieldPct)) / 100;
  const totalLen = spec.nomW > 0 ? prodKg / spec.nomW : 0;
  const perStrand = totalLen / k;
  const cuts = num(cutLen) > 0 ? Math.floor(perStrand / num(cutLen)) : 0;
  const rem = perStrand - cuts * num(cutLen);
  const bpc = num(commLen) > 0 ? Math.floor(num(cutLen) / num(commLen)) : 0;
  const remBars = num(commLen) > 0 ? Math.floor(rem / num(commLen)) : 0;
  const barsPerBillet = k * (cuts * bpc + remBars);

  // حساب طن/ساعة وزمن البيليت
  const rollSec = (num(lineSpeed) * spec.nomW * k) > 0 ? billetKg / (num(lineSpeed) * spec.nomW * k) : 0;
  const cycleSec = rollSec + num(gapSec);
  const billetsPerHr = cycleSec > 0 ? 3600 / cycleSec : 0;
  const tonsPerHr = (billetsPerHr * prodKg) / 1000;

  return (
    <Shell
      border="border-emerald-500/30"
      inputs={
        <>
          <h3 className="text-xl font-bold text-white border-b border-slate-800 pb-3">
            2. حاسبة عدد الأسياخ والطاقة الإنتاجية (طن/ساعة)
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <Field label="ضلع البليت (mm)" value={side} onChange={setSide} />
            <Field label="طول البليت (m)" value={billetLen} onChange={setBilletLen} step="0.5" />
            <SelectField label="مقاس السيخ" value={size} onChange={setSize} options={REBAR_SPECS.map((r) => [String(r.size), `${r.size} مم`])} />
            <SelectField label="عدد الخيوط (Slitting)" value={strands} onChange={setStrands} options={[['1', '1'], ['2', '2'], ['3', '3'], ['4', '4']]} />
            <Field label="طول قطعية المقص الطائر (m)" value={cutLen} onChange={setCutLen} step="1" />
            <Field label="طول السيخ التجاري (m)" value={commLen} onChange={setCommLen} step="0.5" />
            <Field label="نسبة الإدرار Yield (%)" value={yieldPct} onChange={setYieldPct} step="0.5" />
            <Field label="سرعة الدرفلة النهائية (m/s)" value={lineSpeed} onChange={setLineSpeed} step="0.5" />
            <Field label="زمن الفجوة Gap Time (ثانية)" value={gapSec} onChange={setGapSec} step="0.5" className="col-span-2" />
          </div>
        </>
      }
      results={
        <>
          <h3 className="text-xl font-bold text-emerald-400 border-b border-slate-800 pb-3">النتائج وخطوات الحساب</h3>
          <div className="grid grid-cols-2 gap-3">
            <Stat label="عدد الأسياخ من البيليت" value={barsPerBillet} unit="سيخ" color="text-emerald-400" big />
            <Stat label="إنتاجية الخط الصافية" value={fmt(tonsPerHr, 1)} unit="طن/ساعة" color="text-amber-400" big />
            <Stat label="وزن البيليت الخام" value={fmt(billetKg, 0)} unit="كجم" />
            <Stat label="زمن دورة البيليت الكلي" value={fmt(cycleSec, 1)} unit="ثانية" />
          </div>
          <SolutionStepsBox
            formula="Time = [W_billet / (V × w_m × k)] + Gap_Time  |  Tons/hr = (3600 / Time) × W_net"
            steps={[
              `وزن البيليت الخام = (${side}×${side}) × 0.00785 × ${billetLen}م = ${fmt(billetKg, 1)} كجم`,
              `الوزن الصافي بعد الإدرار (${yieldPct}%) = ${fmt(prodKg, 1)} كجم`,
              `الطول الكلي للحديد الخارج = ${fmt(prodKg, 1)} / ${spec.nomW} (وزن المتر) = ${fmt(totalLen, 1)} متر (${fmt(perStrand, 1)} م لكل ستراند)`,
              `زمن الدرفلة الفعلي للبيليت = ${fmt(rollSec, 1)} ث + فجوة ${gapSec} ث = ${fmt(cycleSec, 1)} ثانية/بيليت`,
              `عدد البيليت في الساعة = 3600 / ${fmt(cycleSec, 1)} = ${fmt(billetsPerHr, 1)} بيليت/ساعة (${fmt(tonsPerHr, 1)} طن/ساعة)`
            ]}
          />
        </>
      }
    />
  );
};

/* ======================================================
   5. محول الوحدات الهندسي (مع شرح معامل التحويل)
   ====================================================== */
const UnitConverterTool = () => {
  const [cat, setCat] = useState('speed');
  const [unit, setUnit] = useState('m/s');
  const [val, setVal] = useState(10);
  const g = UNIT_GROUPS[cat];

  const all = g.temp
    ? g.units.map(([u]) => [u, fromCelsius(toCelsius(num(val), unit), u)])
    : (() => {
        const from = g.units.find((x) => x[0] === unit);
        const base = num(val) * (from ? from[1] : 1);
        return g.units.map(([u, f]) => [u, base / f, f, from ? from[1] : 1]);
      })();

  const conversionSteps = g.temp
    ? [
        `القيمة المدخلة: ${val} ${unit}`,
        `نحول أولاً إلى درجة مئوية (°C) = ${fmt(toCelsius(num(val), unit), 2)} °C`,
        `ثم نحول للكلفن (°C + 273.15) وللفهرنهايت ((°C × 9/5) + 32)`
      ]
    : all.map(([u, resVal, targetFactor, sourceFactor]) =>
        `للتحويل من (${unit}) إلى (${u}): نضرب ${val} × (${fmt(sourceFactor / targetFactor, 5)}) = ${fmt(resVal, 4)} ${u}`
      );

  return (
    <Shell
      border="border-rose-500/30"
      inputs={
        <>
          <h3 className="text-xl font-bold text-white border-b border-slate-800 pb-3">محول الوحدات الهندسي الشامل</h3>
          <div className="grid grid-cols-2 gap-3">
            <SelectField
              label="اختر الكمية الفيزيائية"
              value={cat}
              onChange={(v) => { setCat(v); setUnit(UNIT_GROUPS[v].units[0][0]); }}
              className="col-span-2"
              options={Object.keys(UNIT_GROUPS).map((k) => [k, UNIT_GROUPS[k].label])}
            />
            <Field label="القيمة المراد تحويلها" value={val} onChange={setVal} step="any" />
            <SelectField label="من وحدة" value={unit} onChange={setUnit} options={g.units.map((u) => [u[0], u[0]])} />
          </div>
          <SolutionStepsBox formula={`الوحدة المرجعية للتحويل: ${g.baseUnit}`} steps={conversionSteps} />
        </>
      }
      results={
        <>
          <h3 className="text-xl font-bold text-rose-400 border-b border-slate-800 pb-3">نتائج التحويل الفورية</h3>
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
  <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 overflow-x-auto">
    <h3 className="text-xl font-bold text-white mb-4">الأوزان القياسية لحديد التسليح (ISO 6935-2 / ES 262)</h3>
    <table className="w-full text-right text-sm min-w-[500px]">
      <thead className="bg-slate-950 text-slate-400 text-xs">
        <tr>
          <th className="p-3 rounded-r-lg">المقاس (mm)</th>
          <th className="p-3">المساحة (mm²)</th>
          <th className="p-3">أقل وزن</th>
          <th className="p-3">الاسمي (كجم/م)</th>
          <th className="p-3">أقصى وزن</th>
          <th className="p-3 rounded-l-lg">كود اللون</th>
        </tr>
      </thead>
      <tbody className="divide-y divide-slate-800/60 font-mono">
        {REBAR_SPECS.map((r) => (
          <tr key={r.size} className="hover:bg-slate-800/50">
            <td className="p-3 font-bold text-white">{r.size} مم</td>
            <td className="p-3 text-slate-300">{r.area}</td>
            <td className="p-3 text-red-400">{r.minW}</td>
            <td className="p-3 text-emerald-400 font-bold text-base">{r.nomW}</td>
            <td className="p-3 text-amber-400">{r.maxW}</td>
            <td className="p-3 font-sans text-xs text-blue-300">{r.color}</td>
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

/* ======================================================
   6. مجتمع المهندسين وموسوعة العيوب (Posts & Faults)
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
      id: Date.now().toString(),
      author: newPostAuthor || 'مهندس / فني بالدرفلة',
      role: 'عضو المنصة',
      badge: 'جديد',
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
  };

  const handleToggleLike = (postId) => {
    setPosts((prev) =>
      prev.map((p) => (p.id === postId ? { ...p, liked: !p.liked, likes: p.liked ? p.likes - 1 : p.likes + 1 } : p))
    );
  };

  const handleAddComment = (postId) => {
    const text = commentInputs[postId];
    if (!text || !text.trim()) return;
    const newComment = {
      id: Date.now().toString(),
      user: commentAuthor || 'عضو بالمنصة',
      role: 'متابع',
      text: text.trim(),
      time: 'الآن'
    };
    setPosts((prev) => prev.map((p) => (p.id === postId ? { ...p, comments: [...p.comments, newComment] } : p)));
    setCommentInputs({ ...commentInputs, [postId]: '' });
  };

  const filteredFaults = faults.filter(
    (f) => f.code.toLowerCase().includes(faultSearch.toLowerCase()) || f.title.toLowerCase().includes(faultSearch.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl flex flex-col sm:flex-row justify-between items-center gap-4 shadow-lg">
        <div>
          <h2 className="text-2xl font-extrabold text-white flex items-center gap-2">
            <MessageCircle className="text-blue-500" /> مجتمع صناع الحديد وموسوعة الأعطال
          </h2>
          <p className="text-sm text-slate-400 mt-1">بوستات تفاعلية، تعليقات فنية، وتشخيص عيوب الدرفلة والدرايفات.</p>
        </div>
        <div className="flex bg-slate-950 p-1.5 rounded-2xl border border-slate-800 shrink-0">
          <button
            onClick={() => setSubMode('feed')}
            className={`px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all ${
              subMode === 'feed' ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            <MessageCircle size={18} /> المنشورات
          </button>
          <button
            onClick={() => setSubMode('faults')}
            className={`px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-all ${
              subMode === 'faults' ? 'bg-amber-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Wrench size={18} /> موسوعة العيوب
          </button>
        </div>
      </div>

      {subMode === 'feed' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-4">
            <form onSubmit={handleCreatePost} className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-4 shadow-lg lg:sticky lg:top-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-2">
                <PlusCircle className="text-blue-400" /> نشر بوست جديد
              </h3>
              <input type="text" placeholder="اسمك / صفتك..." value={newPostAuthor} onChange={(e) => setNewPostAuthor(e.target.value)} className={inputCls} />
              <input type="text" placeholder="عنوان المنشور..." value={newPostTitle} onChange={(e) => setNewPostTitle(e.target.value)} className={inputCls + ' font-bold'} />
              <textarea rows="4" placeholder="اكتب المعلومة أو السؤال هنا..." value={newPostContent} onChange={(e) => setNewPostContent(e.target.value)} className={inputCls + ' resize-none'} />
              <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-xl shadow-md">
                نشر الآن
              </button>
            </form>
          </div>

          <div className="lg:col-span-8 space-y-5">
            {posts.map((post) => (
              <div key={post.id} className="bg-slate-900 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-lg">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-black text-xl">
                      {post.author.charAt(0)}
                    </div>
                    <div>
                      <h4 className="font-bold text-white text-base flex items-center gap-2">
                        {post.author}
                        <span className="text-[10px] bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full">{post.badge}</span>
                      </h4>
                      <p className="text-xs text-slate-400">{post.role} • {post.time}</p>
                    </div>
                  </div>
                  <span className="text-xs bg-slate-800 text-slate-300 px-3 py-1 rounded-full">{post.category}</span>
                </div>

                <h3 className="text-lg font-bold text-blue-300 mb-2">{post.title}</h3>
                <p className="text-sm text-slate-200 leading-relaxed whitespace-pre-line mb-4">{post.content}</p>

                <div className="flex items-center gap-4 pt-4 border-t border-slate-800 mb-4">
                  <button
                    onClick={() => handleToggleLike(post.id)}
                    className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-bold transition-colors ${
                      post.liked ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    <ThumbsUp size={16} /> أعجبني ({post.likes})
                  </button>
                  <span className="text-sm text-slate-400 font-bold flex items-center gap-1.5">
                    <MessageCircle size={16} /> {post.comments.length} تعليقات
                  </span>
                </div>

                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
                  {post.comments.map((c) => (
                    <div key={c.id} className="bg-slate-900 p-3 rounded-xl border border-slate-700/50">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs font-bold text-emerald-400">{c.user}</span>
                        <span className="text-[10px] text-slate-500">{c.time}</span>
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed">{c.text}</p>
                    </div>
                  ))}
                  <div className="flex flex-col sm:flex-row gap-2 mt-3 pt-3 border-t border-slate-800">
                    <input
                      type="text"
                      placeholder="اسمك..."
                      value={commentAuthor}
                      onChange={(e) => setCommentAuthor(e.target.value)}
                      className="sm:w-1/4 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none"
                    />
                    <input
                      type="text"
                      placeholder="اكتب تعليقك..."
                      value={commentInputs[post.id] || ''}
                      onChange={(e) => setCommentInputs({ ...commentInputs, [post.id]: e.target.value })}
                      className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white outline-none"
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
        <div className="space-y-6">
          <input
            type="text"
            placeholder="ابحث عن عطل أو عيب (مثلاً: شنب، قشرة، بطح، F0001)..."
            value={faultSearch}
            onChange={(e) => setFaultSearch(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-2xl px-5 py-4 text-white font-bold shadow-lg outline-none focus:border-amber-500"
          />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {filteredFaults.map((f) => (
              <div key={f.id} className="bg-slate-900 border border-slate-800 rounded-3xl p-6 shadow-lg flex flex-col">
                <div className="flex justify-between items-center mb-3">
                  <span className="bg-red-500/20 text-red-400 font-black px-3 py-1 rounded-lg text-sm border border-red-500/30">{f.code}</span>
                  <span className="text-xs bg-slate-800 text-slate-300 px-3 py-1 rounded-full">{f.brand}</span>
                </div>
                <h3 className="text-base font-bold text-white mb-3">{f.title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed mb-4 flex-1">
                  <strong className="text-amber-400 block mb-1">السبب الفني:</strong> {f.cause}
                </p>
                <div className="bg-slate-950 p-4 rounded-xl border border-emerald-900/40 text-xs text-emerald-300 leading-relaxed font-bold">
                  <strong className="block mb-1 text-emerald-400">الحل المقترح:</strong> {f.solution}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

/* ======================================================
   7. المكون الرئيسي لبوابة المهندسين (PublicPortal)
   ====================================================== */
export default function PublicPortal({ onBack }) {
  const [activeTab, setActiveTab] = useState('basic');
  const tabs = [
    { id: 'basic', label: 'حاسبات سريعة (بالخطوات)', icon: Calculator },
    { id: 'advanced', label: 'تصميم الممرات والإنتاجية', icon: Layers },
    { id: 'tables', label: 'التحويلات والجداول', icon: Ruler },
    { id: 'community', label: 'مجتمع المهندسين والأعطال', icon: MessageCircle }
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans p-2 sm:p-4" dir="rtl">
      <header className="max-w-6xl mx-auto mb-6 bg-slate-900 border border-slate-800 p-4 rounded-3xl flex flex-col md:flex-row justify-between items-center gap-4 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="bg-blue-600 p-2.5 rounded-2xl shadow-lg">
            <Calculator className="text-white" size={24} />
          </div>
          <div>
            <h1 className="text-xl font-black text-white leading-tight">بوابة المهندسين والحسابات</h1>
            <p className="text-xs text-slate-400 font-bold">حاسبات الدرفلة بالخطوات، الجداول، والمجتمع الفني</p>
          </div>
        </div>

        <div className="flex bg-slate-950 p-1.5 rounded-2xl border border-slate-800 overflow-x-auto max-w-full">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id)}
              className={`px-3.5 py-2.5 rounded-xl text-xs sm:text-sm font-bold flex items-center justify-center gap-2 whitespace-nowrap transition-all ${
                activeTab === t.id ? 'bg-blue-600 text-white shadow-md' : 'text-slate-400 hover:text-white'
              }`}
            >
              <t.icon size={16} /> <span>{t.label}</span>
            </button>
          ))}
        </div>

        <button
          onClick={onBack}
          className="bg-red-500/10 text-red-400 hover:bg-red-500/20 font-bold px-5 py-2.5 rounded-xl text-sm transition-colors border border-red-500/20 shrink-0"
        >
          الرئيسية
        </button>
      </header>

      <main className="max-w-6xl mx-auto pb-12">
        {activeTab === 'basic' && <BasicCalculatorsGrid />}
        {activeTab === 'advanced' && (
          <div className="space-y-8">
            <PassDesignCalc />
            <BarsAndYieldCalc />
          </div>
        )}
        {activeTab === 'tables' && (
          <div className="space-y-8">
            <UnitConverterTool />
            <RebarTable />
          </div>
        )}
        {activeTab === 'community' && <SocialFeedAndFaults />}
      </main>
    </div>
  );
}