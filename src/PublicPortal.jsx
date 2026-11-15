import React, { useState } from 'react';
import {
  Calculator, Layers, Ruler, MessageCircle, RotateCcw, Activity,
  Gauge, DivideSquare, Maximize2, Circle, ArrowLeftRight, Zap,
  Cpu, Wrench, PlusCircle, ThumbsUp, Flame, Scissors, BookOpen,
  ChevronDown, ChevronUp, Sliders, Search, Award, Sparkles,
  Check, ArrowLeft, Home, ShieldAlert, Cable, BatteryCharging, Radio, Square
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

const STANDARD_CABLES = [
  { size: 1.5, maxAmp: 18 },
  { size: 2.5, maxAmp: 25 },
  { size: 4, maxAmp: 34 },
  { size: 6, maxAmp: 43 },
  { size: 10, maxAmp: 60 },
  { size: 16, maxAmp: 80 },
  { size: 25, maxAmp: 106 },
  { size: 35, maxAmp: 131 },
  { size: 50, maxAmp: 159 },
  { size: 70, maxAmp: 202 },
  { size: 95, maxAmp: 244 },
  { size: 120, maxAmp: 282 },
  { size: 150, maxAmp: 324 },
  { size: 185, maxAmp: 371 },
  { size: 240, maxAmp: 436 },
  { size: 300, maxAmp: 500 }
];

const INITIAL_POSTS = [
  {
    id: 'p1',
    author: 'م. بسام وليد',
    role: 'مشغل أول غرفة تحكم رئيسية',
    badge: 'مؤسس المنصة',
    time: 'منذ ساعتين',
    category: 'غرف التحكم والـ VFD',
    title: 'إزاي تكتشف وجود شد (Tension) أو انضغاط (Loop) بين قائمين في التخشين من قراءة الأمبير؟',
    content:
      'طريقة عملية من غرفة التحكم الرئيسية (HMI): لو فرضنا إن أمبير قائم (2) كان 1500 أمبير أول ما المعدن دخل فيه، ولما رأس البيليت دخلت في قائم (3) لاحظت إن أمبير قائم (2) نزل فجأة لـ 1200 أمبير.. ده معناه وجود شد (Tension) بين القائمين ولازم نهدي سرعة قائم 3 أو نرفع سرعة قائم 1 و 2. العكس لو الأمبير زاد لـ 1700 أمبير فده معناه انضغاط (Compression) وبداية تكوين لوب!',
    likes: 34,
    fires: 18,
    liked: false,
    fired: false,
    solved: true,
    comments: [
      {
        id: 'c101',
        user: 'م. إسلام عرفات',
        role: 'مهندس درفلة',
        text: 'شرح ممتاز يا هندسة، وده اللي بنسميه في الأوتوميشن Minimum Tension Control (MTC) في منطقة الرفنج لأن المساحات كبيرة ومافيش لوابر.',
        time: 'منذ ساعة',
        isBest: true
      },
      {
        id: 'c102',
        user: 'فني تشغيل أول',
        role: 'غرفة التحكم',
        text: 'فعلاً متابعة أمبير ق12 وق13 مهمة جداً خصوصاً في مقاس 10 مم و 12 مم لضبط الجاب.',
        time: 'منذ 45 دقيقة',
        isBest: false
      }
    ]
  },
  {
    id: 'p2',
    author: 'م. عادل عزالدين',
    role: 'مهندس أتمتة وتحكم صناعي',
    badge: 'خبير أتمتة',
    time: 'منذ 5 ساعات',
    category: 'باس ديزاين ودرافيل',
    title: 'ليه بننقل أسياخ الحديد على سرير التبريد (Cooling Bed) سيخ ورا سيخ مش مجموعة مع بعض؟',
    content:
      'بعد خروج السيخ من صندوق التبريد (Quenching Box) عند حرارة حوالي 700 درجة، القلب الداخلي الساخن بيعمل مراجعة ذاتية للسطح (Self-Tempering) عشان يكون طبقة Tempered Martensite الصلبة. لو الأسياخ اتنقلت فوق بعضها كمجموعة هيحصل انتقال حرارة بالتوصيل بينهم وتبوظ عملية الـ Tempcore وتقل رتبة وإجهاد الحديد!',
    likes: 49,
    fires: 27,
    liked: false,
    fired: false,
    solved: true,
    comments: [
      {
        id: 'c103',
        user: 'م. أحمد طارق',
        role: 'مهندس جودة',
        text: 'معلومة ذهبية! وعشان كدا ضبط عدد العلب المغلقة في الأبرون (مربع السرعة على 8) بيفرق جداً في مسافة الرمي على سرير التبريد.',
        time: 'منذ 3 ساعات',
        isBest: true
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
    solution: 'افحص مقاس القلب ووزن المتر الطولي؛ لو القلب أقل من الطبيعي افتح جاب القائم النهائي، وراجع سنترية وبكر دليل الدخول.'
  },
  {
    id: 'f3',
    code: 'UNDERFILL / بطح',
    brand: 'عيوب الدرفلة والمنتج',
    title: 'عدم اكتمال الشرشرة أو اختفاء النتوء الطولي (الشنب)',
    cause: 'تلف في الدليل البكري ما قبل النهائي أو وجود شد كبير (High Tension) بين القوائم أو فتح الجاب زيادة عن اللزوم.',
    solution: 'راجع مستوى اللوبر لمنع الشد، افحص بكر الدلائل، واضبط جاب القائم النهائي.'
  },
  {
    id: 'f4',
    code: 'F0001 / Overcurrent',
    brand: 'Siemens SINAMICS Drives',
    title: 'فصل الإنفرتر تيار زائد مفاجئ أثناء دخول المعدن',
    cause: 'دخول بيليت بارد، نسبة تخفيض عالية جداً، أو زاوية عض أكبر من الحد المسموح.',
    solution: 'راجع حرارة البيليت، تأكد من تفعيل سرعة العض الزائدة (Over Speed 2% - 5%) لتحسين دخول مقدمة المعدن، وافحص كابلات الموتور.'
  }
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
   2. عناصر واجهة مساعدة (Clean Light Mode UI Helpers)
   ====================================================== */
const num = (v) => (Number.isFinite(Number(v)) ? Number(v) : 0);
const fmt = (n, d = 2) => (Number.isFinite(Number(n)) ? Number(n).toFixed(d) : '—');
const inputCls =
  'w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-mono text-sm font-bold focus:border-blue-600 focus:bg-white outline-none transition-colors';

const Field = ({ label, value, onChange, step = 'any', className = '' }) => (
  <div className={className}>
    <label className="text-[11px] sm:text-xs text-slate-600 block mb-1 font-bold">{label}</label>
    <input type="number" step={step} value={value} onChange={(e) => onChange(e.target.value)} className={inputCls} />
  </div>
);

const SelectField = ({ label, value, onChange, options, className = '' }) => (
  <div className={className}>
    <label className="text-[11px] sm:text-xs text-slate-600 block mb-1 font-bold">{label}</label>
    <select value={value} onChange={(e) => onChange(e.target.value)} className={inputCls}>
      {options.map((o) => (
        <option key={o[0]} value={o[0]}>
          {o[1]}
        </option>
      ))}
    </select>
  </div>
);

const Stat = ({ label, value, unit, color = 'text-slate-900', big = false }) => (
  <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
    <span className="text-[11px] text-slate-500 font-bold block mb-0.5">{label}</span>
    <span className={`font-black font-mono ${big ? 'text-lg sm:text-xl' : 'text-base sm:text-lg'} ${color}`}>
      {value} {unit && <span className="text-[11px] text-slate-500 font-bold mr-1">{unit}</span>}
    </span>
  </div>
);

const SolutionStepsBox = ({ formula, steps }) => {
  const [open, setOpen] = useState(false); // مغلق افتراضياً ويفتح عند الضغط
  if (!steps || steps.length === 0) return null;

  return (
    <div className="mt-4 bg-amber-50/60 border border-amber-300 rounded-2xl overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full px-4 py-3 bg-amber-100/80 hover:bg-amber-200/70 flex items-center justify-between text-amber-950 font-black text-xs sm:text-sm transition-colors"
      >
        <span className="flex items-center gap-2">
          <BookOpen size={16} className="text-amber-700" />
          {open ? 'إخفاء شرح القانون وخطوات الحل' : 'اضغط هنا لعرض القانون وخطوات الحل بالأرقام'}
        </span>
        {open ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
      </button>

      {open && (
        <div className="p-4 space-y-3 text-xs bg-white border-t border-amber-200">
          {formula && (
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
              <span className="text-slate-500 text-[11px] font-bold block mb-1">القاعدة الهندسية بالعربي:</span>
              <p className="text-blue-800 font-black text-xs sm:text-sm leading-relaxed">{formula}</p>
            </div>
          )}
          <div className="space-y-2">
            <span className="text-slate-500 text-[11px] font-bold block">خطوات التعويض المباشر بالأرقام:</span>
            {steps.map((st, idx) => (
              <div key={idx} className="flex items-start gap-2.5 bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                <span className="w-5 h-5 rounded-full bg-blue-600 text-white font-mono text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                  {idx + 1}
                </span>
                <p className="text-slate-800 font-bold leading-relaxed text-xs sm:text-sm">{st}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

/* ======================================================
   3. الحاسبة الشاملة لمساحات الممرات والقطاعات (الدائرة، المستطيل، البيضاوي، الصندوقي، المعين)
   ====================================================== */
const GrooveAndCrossSectionModal = ({ onBack }) => {
  const [shape, setShape] = useState('rect'); // 'rect' | 'circle' | 'oval' | 'box' | 'diamond'

  // 1) متغيرات المستطيل / المربع / الخوصة (طول × عرض)
  const [rectLen, setRectLen] = useState(50);
  const [rectWid, setRectWid] = useState(10);
  const [cornerR, setCornerR] = useState(0); // نصف قطر تقوس السوكة إن وجد

  // 2) متغيرات الدائرة والممر الدائري
  const [circleDia, setCircleDia] = useState(16);
  const [roundGap, setRoundGap] = useState(2.0);

  // 3) متغيرات الممر البيضاوي (Oval Pass)
  const [ovalWidth, setOvalWidth] = useState(28);
  const [ovalHeight, setOvalHeight] = useState(12);

  // 4) متغيرات الممر الصندوقي (Box Pass)
  const [boxBottomW, setBoxBottomW] = useState(75);
  const [boxTopW, setBoxTopW] = useState(82);
  const [boxHeight, setBoxHeight] = useState(68);

  // 5) متغيرات الممر المعين (Diamond Pass)
  const [diaD1, setDiaD1] = useState(48);
  const [diaD2, setDiaD2] = useState(42);

  // متغير فحص نسبة امتلاء الممر (Groove Filling Ratio)
  const [metalAreaInGroove, setMetalAreaInGroove] = useState(190);

  // الحسابات الهندسية حسب الشكل المختار
  let calcArea = 0;
  let perimeter = 0;
  let eqDia = 0;
  let formulaStr = '';
  let stepsArr = [];

  if (shape === 'rect') {
    const L = num(rectLen);
    const W = num(rectWid);
    const r = Math.max(0, num(cornerR));
    const cornerDeduction = r > 0 ? (4 - Math.PI) * r * r : 0;
    calcArea = Math.max(0, L * W - cornerDeduction);
    perimeter = 2 * (L + W);
    eqDia = Math.sqrt((4 * calcArea) / Math.PI);
    formulaStr = 'مساحة المستطيل أو الخوصة = الطول (العرض) × السمك (الارتفاع)  |  وزن المتر الطولي = المساحة × 0.00785';
    stepsArr = [
      `نضرب الطول في العرض = ${L} مم × ${W} مم = ${fmt(L * W, 2)} مم²`,
      ...(r > 0 ? [`نخصم تقوس الأركان الأربعة (نصف قطر ${r} مم) = ${fmt(L * W, 2)} - ${fmt(cornerDeduction, 2)} = ${fmt(calcArea, 2)} مم²`] : []),
      `محيط المقطع = 2 × (${L} + ${W}) = ${fmt(perimeter, 1)} مم`,
      `وزن المتر الطولي للحديد = ${fmt(calcArea, 2)} × 0.00785 = ${fmt(calcArea * 0.00785, 3)} كجم/متر`
    ];
  } else if (shape === 'circle') {
    const D = num(circleDia);
    const g = Math.max(0, num(roundGap));
    const fullCircle = (Math.PI * D * D) / 4;
    // المساحة الفعلية لممر الدرفيل الدائري مع فتح الجاب
    calcArea = fullCircle;
    const grooveEffectiveArea = Math.max(0, fullCircle - g * 0.15 * D);
    perimeter = Math.PI * D;
    eqDia = D;
    formulaStr = 'مساحة الدائرة = (3.1416 × القطر × القطر) ÷ 4  (أو 0.7854 × مربع القطر)';
    stepsArr = [
      `نربع القطر D = ${D} × ${D} = ${fmt(D * D, 2)}`,
      `نضرب في 3.1416 ونقسم على 4 = (3.1416 × ${fmt(D * D, 2)}) ÷ 4 = ${fmt(fullCircle, 2)} مم²`,
      `محيط الدائرة = 3.1416 × ${D} = ${fmt(perimeter, 2)} مم`,
      `مساحة ممر الدرفيل الصافية (عند جاب ${g} مم) ≈ ${fmt(grooveEffectiveArea, 2)} مم²`,
      `وزن المتر الطولي للبار المبروم = ${fmt(fullCircle, 2)} × 0.00785 = ${fmt(fullCircle * 0.00785, 3)} كجم/متر`
    ];
  } else if (shape === 'oval') {
    const B = num(ovalWidth);
    const H = num(ovalHeight);
    calcArea = (2 / 3) * B * H;
    perimeter = Math.PI * Math.sqrt(2 * (Math.pow(B / 2, 2) + Math.pow(H / 2, 2)));
    eqDia = Math.sqrt((4 * calcArea) / Math.PI);
    formulaStr = 'مساحة الممر البيضاوي (Oval Pass) = (2 ÷ 3) × عرض الممر × ارتفاع الممر الكلي';
    stepsArr = [
      `نضرب عرض الممر البيضاوي في ارتفاعه = ${B} × ${H} = ${fmt(B * H, 2)} مم²`,
      `نضرب في معامل شكل القوس البيضاوي (2/3 أي 0.667) = 0.667 × ${fmt(B * H, 2)} = ${fmt(calcArea, 2)} مم²`,
      `معامل الممر البيضاوي (Groove Factor) = المساحة ÷ العرض = ${fmt(calcArea, 1)} ÷ ${B} = ${fmt(calcArea / Math.max(1, B), 2)} مم`,
      `وزن المتر الطولي للبار البيضاوي الخارج = ${fmt(calcArea * 0.00785, 3)} كجم/متر`
    ];
  } else if (shape === 'box') {
    const b1 = num(boxBottomW);
    const b2 = num(boxTopW);
    const h = num(boxHeight);
    const avgW = (b1 + b2) / 2;
    calcArea = avgW * h;
    perimeter = b1 + b2 + 2 * h;
    eqDia = Math.sqrt((4 * calcArea) / Math.PI);
    formulaStr = 'مساحة الممر الصندوقي (Box Pass) = متوسط العرض [(عرض القاع + عرض الفتحة) ÷ 2] × الارتفاع الكلي';
    stepsArr = [
      `نحسب متوسط عرض الممر الصندوقي = (${b1} + ${b2}) ÷ 2 = ${fmt(avgW, 2)} مم`,
      `نضرب متوسط العرض في الارتفاع الكلي للممر (${h} مم) = ${fmt(avgW, 2)} × ${h} = ${fmt(calcArea, 2)} مم²`,
      `وزن المتر الطولي للكتلة الخارجة من الممر = ${fmt(calcArea * 0.00785, 3)} كجم/متر`
    ];
  } else if (shape === 'diamond') {
    const d1 = num(diaD1);
    const d2 = num(diaD2);
    calcArea = 0.5 * d1 * d2;
    const side = Math.sqrt(Math.pow(d1 / 2, 2) + Math.pow(d2 / 2, 2));
    perimeter = 4 * side;
    eqDia = Math.sqrt((4 * calcArea) / Math.PI);
    formulaStr = 'مساحة الممر المعين أو المربع المائل (Diamond / Square Pass) = (القطر الأفقي × القطر الرأسي) ÷ 2';
    stepsArr = [
      `نضرب القطر الأفقي في القطر الرأسي = ${d1} × ${d2} = ${fmt(d1 * d2, 2)}`,
      `نقسم الناتج على 2 = ${fmt(d1 * d2, 2)} ÷ 2 = ${fmt(calcArea, 2)} مم²`,
      `طول ضلع المعين = ${fmt(side, 2)} مم`
    ];
  }

  const meterWeightKg = calcArea * 0.00785;
  const fillPct = calcArea > 0 ? (num(metalAreaInGroove) / calcArea) * 100 : 0;
  const fillStatus =
    fillPct > 100
      ? 'امتلاء زائد! خطر ظهور شنب وقشرة (Overfill)'
      : fillPct < 80
      ? 'أقل من الطبيعي! خطر بطح وعدم اكتمال (Underfill)'
      : 'امتلاء مثالي وسليم للممر (80% - 98%)';

  return (
    <div className="space-y-4">
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-2">
        <button
          onClick={onBack}
          className="bg-slate-100 hover:bg-slate-200 text-slate-800 px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5"
        >
          <ArrowLeft size={15} className="rotate-180" /> رجوع لكل القوانين
        </button>

        {/* أزرار اختيار شكل المقطع أو الممر */}
        <div className="flex flex-wrap gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
          {[
            ['rect', 'طول × عرض (مستطيل/خوصة/مربع)'],
            ['circle', 'قانون الدائرة (ممر دائري)'],
            ['oval', 'ممر بيضاوي (Oval)'],
            ['box', 'ممر صندوقي (Box)'],
            ['diamond', 'ممر معين (Diamond)']
          ].map(([id, label]) => (
            <button
              key={id}
              onClick={() => setShape(id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                shape === id ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* مدخلات الشكل المختار */}
        <div className="lg:col-span-5 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4 h-fit">
          <h3 className="text-sm sm:text-base font-black text-slate-900 border-b border-slate-100 pb-2">
            أدخل أبعاد المقطع أو الممر بالملليمتر
          </h3>

          {shape === 'rect' && (
            <div className="grid grid-cols-2 gap-3">
              <Field label="الطول / العرض B (مم)" value={rectLen} onChange={setRectLen} />
              <Field label="العرض / السمك H (مم)" value={rectWid} onChange={setRectWid} />
              <Field
                label="نصف قطر تقوس السوكة (اختياري مم)"
                value={cornerR}
                onChange={setCornerR}
                step="0.5"
                className="col-span-2"
              />
            </div>
          )}

          {shape === 'circle' && (
            <div className="grid grid-cols-2 gap-3">
              <Field label="قطر الدائرة / الممر D (مم)" value={circleDia} onChange={setCircleDia} step="0.5" />
              <Field label="خلوص الجاب بين الدرفيلين (مم)" value={roundGap} onChange={setRoundGap} step="0.5" />
            </div>
          )}

          {shape === 'oval' && (
            <div className="grid grid-cols-2 gap-3">
              <Field label="عرض الممر البيضاوي B (مم)" value={ovalWidth} onChange={setOvalWidth} step="0.5" />
              <Field label="ارتفاع الممر الكلي شامل الجاب H (مم)" value={ovalHeight} onChange={setOvalHeight} step="0.5" />
            </div>
          )}

          {shape === 'box' && (
            <div className="grid grid-cols-2 gap-3">
              <Field label="عرض قاع الممر الصندوقي (مم)" value={boxBottomW} onChange={setBoxBottomW} />
              <Field label="عرض فتحة الممر عند الجاب (مم)" value={boxTopW} onChange={setTopW} />
              <Field label="الارتفاع الكلي للممر شامل الجاب (مم)" value={boxHeight} onChange={setBoxHeight} className="col-span-2" />
            </div>
          )}

          {shape === 'diamond' && (
            <div className="grid grid-cols-2 gap-3">
              <Field label="القطر الأفقي للمعين d1 (مم)" value={diaD1} onChange={setDiaD1} />
              <Field label="القطر الرأسي للمعين d2 (مم)" value={diaD2} onChange={setDiaD2} />
            </div>
          )}

          {/* فحص نسبة امتلاء الممر */}
          <div className="pt-3 border-t border-slate-100 space-y-2">
            <Field
              label="اختبار امتلاء الممر: أدخل مساحة المعدن الفعلية (مم²)"
              value={metalAreaInGroove}
              onChange={setMetalAreaInGroove}
            />
            <div
              className={`p-2.5 rounded-xl border text-xs font-bold ${
                fillPct > 100
                  ? 'bg-red-50 border-red-200 text-red-700'
                  : fillPct < 80
                  ? 'bg-amber-50 border-amber-200 text-amber-800'
                  : 'bg-emerald-50 border-emerald-200 text-emerald-800'
              }`}
            >
              نسبة امتلاء الممر: <strong className="font-mono">{fmt(fillPct, 1)}%</strong> — {fillStatus}
            </div>
          </div>
        </div>

        {/* نتائج المساحة ووزن المتر الطولي */}
        <div className="lg:col-span-7 bg-white p-4 sm:p-5 rounded-2xl border border-blue-200 shadow-sm space-y-4">
          <h3 className="text-sm sm:text-base font-black text-blue-800 border-b border-slate-100 pb-2">
            نتائج مساحة المقطع ووزن المتر الطولي
          </h3>

          <div className="bg-blue-50/70 border border-blue-200 rounded-2xl p-4 text-center">
            <span className="text-xs font-bold text-blue-800 block mb-1">مساحة المقطع الهندسية (Area)</span>
            <span className="text-3xl sm:text-4xl font-black font-mono text-blue-700">
              {fmt(calcArea, 2)} <span className="text-sm">مم² (mm²)</span>
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            <Stat label="وزن المتر الطولي للحديد" value={fmt(meterWeightKg, 3)} unit="كجم/متر" color="text-emerald-700" big />
            <Stat label="محيط المقطع الخارجي" value={fmt(perimeter, 1)} unit="مم" />
            <Stat label="القطر الدائري المكافئ" value={fmt(eqDia, 2)} unit="مم" />
          </div>

          <SolutionStepsBox formula={formulaStr} steps={stepsArr} />
        </div>
      </div>
    </div>
  );
};

/* ======================================================
   4. حاسبة قطعيات المقص الطائر وأسياخ العميل معاً + وزن المتر اليدوي
   ====================================================== */
const BarsAndProductivityModal = ({ onBack }) => {
  const [side, setSide] = useState(130);
  const [billetLen, setBilletLen] = useState(12);
  const [size, setSize] = useState('16');
  const [customMeterWeight, setCustomMeterWeight] = useState(1.580);
  const [yieldPct, setYieldPct] = useState(97.5);
  const [strands, setStrands] = useState('2');
  const [cutLen, setCutLen] = useState(36);
  const [commLen, setCommLen] = useState(12);
  const [gapSec, setGapSec] = useState(4);
  const [lineSpeed, setLineSpeed] = useState(12);
  const [billetsShift, setBilletsShift] = useState(400);

  const handleSizeSelect = (newSize) => {
    setSize(newSize);
    const found = REBAR_SPECS.find((r) => String(r.size) === String(newSize));
    if (found) {
      setCustomMeterWeight(found.nomW);
    }
  };

  const k = Math.max(1, Number(strands) || 1);
  const wMeter = Math.max(0.01, num(customMeterWeight));
  const billetKg = num(side) * num(side) * 0.00785 * num(billetLen);
  const prodKg = (billetKg * num(yieldPct)) / 100;
  const totalLenAllStrands = prodKg / wMeter;
  const lenPerStrand = totalLenAllStrands / k;

  const fullFlyingCutsPerStrand = num(cutLen) > 0 ? Math.floor(lenPerStrand / num(cutLen)) : 0;
  const totalFullFlyingBarsPerBillet = fullFlyingCutsPerStrand * k;
  const lastBarLengthPerStrand = Math.max(0, lenPerStrand - fullFlyingCutsPerStrand * num(cutLen));
  const totalFlyingBarsWithLast =
    lastBarLengthPerStrand >= 6 ? totalFullFlyingBarsPerBillet + k : totalFullFlyingBarsPerBillet;

  const commBarsPerFlyingCut = num(commLen) > 0 ? Math.floor(num(cutLen) / num(commLen)) : 0;
  const wastePerFlyingCut = Math.max(0, num(cutLen) - commBarsPerFlyingCut * num(commLen));
  const commBarsFromLastBar = num(commLen) > 0 ? Math.floor(lastBarLengthPerStrand / num(commLen)) : 0;
  const shortScrapFromLastBar = Math.max(0, lastBarLengthPerStrand - commBarsFromLastBar * num(commLen));
  const totalCustomerBarsPerBillet = k * (fullFlyingCutsPerStrand * commBarsPerFlyingCut + commBarsFromLastBar);

  const rollSec = num(lineSpeed) * wMeter * k > 0 ? billetKg / (num(lineSpeed) * wMeter * k) : 0;
  const cycleSec = rollSec + num(gapSec);
  const billetsPerHr = cycleSec > 0 ? 3600 / cycleSec : 0;
  const tonsPerHr = (billetsPerHr * prodKg) / 1000;

  return (
    <div className="space-y-4">
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
        <button
          onClick={onBack}
          className="bg-slate-100 hover:bg-slate-200 text-slate-800 px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5"
        >
          <ArrowLeft size={15} className="rotate-180" /> رجوع لكل القوانين
        </button>
        <span className="text-xs font-black text-blue-700 bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
          يعرض نتائج المقص الطائر + أسياخ العميل معاً
        </span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-5 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm space-y-3.5 h-fit">
          <h3 className="text-sm sm:text-base font-black text-slate-900 border-b border-slate-100 pb-2">
            بيانات البيليت ووزن المتر والمقصات
          </h3>

          <div className="bg-amber-50/70 p-3 rounded-xl border border-amber-200 space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-xs font-black text-amber-900">طول قطعية المقص الطائر (متر):</label>
              <span className="font-mono text-sm font-black text-amber-700">{cutLen} متر</span>
            </div>
            <div className="grid grid-cols-5 gap-1.5">
              {[24, 36, 48, 54, 60].map((presetLen) => (
                <button
                  key={presetLen}
                  type="button"
                  onClick={() => setCutLen(presetLen)}
                  className={`py-1.5 rounded-lg font-mono text-xs font-bold border transition-all ${
                    Number(cutLen) === presetLen
                      ? 'bg-amber-500 text-slate-950 border-amber-600 shadow-sm'
                      : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                  }`}
                >
                  {presetLen}م
                </button>
              ))}
            </div>
            <input
              type="number"
              step="0.5"
              value={cutLen}
              onChange={(e) => setCutLen(e.target.value)}
              placeholder="أو اكتب أي طول قطعية للمقص الطائر..."
              className={inputCls}
            />
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <Field label="ضلع البيليت (مم)" value={side} onChange={setSide} />
            <Field label="طول البيليت (متر)" value={billetLen} onChange={setBilletLen} step="0.5" />

            <SelectField
              label="اختيار مقاس قياسي (أو حر)"
              value={size}
              onChange={handleSizeSelect}
              options={[
                ...REBAR_SPECS.map((r) => [String(r.size), `تسليح ${r.size} مم (${r.nomW} كجم/م)`]),
                ['custom', 'مقاس خاص / خوصة (اكتب الوزن يدوياً)']
              ]}
            />

            <div>
              <label className="text-[11px] sm:text-xs text-blue-700 block mb-1 font-black">
                وزن المتر الطولي الفعلي (كجم/م):
              </label>
              <input
                type="number"
                step="0.001"
                value={customMeterWeight}
                onChange={(e) => setCustomMeterWeight(e.target.value)}
                className="w-full bg-blue-50/60 border-2 border-blue-400 rounded-xl px-3 py-2 text-blue-950 font-mono text-sm font-black focus:bg-white outline-none"
              />
            </div>

            <SelectField
              label="عدد الخيوط (Strands)"
              value={strands}
              onChange={setStrands}
              options={[
                ['1', '1 خط (بدون شق)'],
                ['2', '2 خط (شق ثنائي)'],
                ['3', '3 خطوط (شق ثلاثي)'],
                ['4', '4 خطوط (شق رباعي)']
              ]}
            />
            <Field label="طول سيخ العميل (متر)" value={commLen} onChange={setCommLen} step="0.5" />
            <Field label="نسبة الإدرار الصافي (%)" value={yieldPct} onChange={setYieldPct} step="0.5" />
            <Field label="سرعة آخر قائم (م/ث)" value={lineSpeed} onChange={setLineSpeed} step="0.5" />
            <Field label="زمن الفجوة بين البيليت (ثانية)" value={gapSec} onChange={setGapSec} step="0.5" />
            <Field label="عدد البيليت بالوردية" value={billetsShift} onChange={setBilletsShift} />
          </div>
        </div>

        <div className="lg:col-span-7 space-y-4">
          <div className="bg-white p-4 sm:p-5 rounded-2xl border-2 border-amber-300 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h4 className="text-sm sm:text-base font-black text-amber-900 flex items-center gap-1.5">
                <Scissors size={18} className="text-amber-600" />
                أولاً: قطعيات المقص الطائر على سرير التبريد (طول {cutLen} متر)
              </h4>
              <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-2.5 py-0.5 rounded-full">
                على الفرش
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <Stat
                label={`بارات كاملة (${cutLen}م) للبيليت`}
                value={totalFullFlyingBarsPerBillet}
                unit="بار"
                color="text-amber-700"
                big
              />
              <Stat
                label="طول البار الأخير (الذيل)"
                value={fmt(lastBarLengthPerStrand, 2)}
                unit="متر"
                color={lastBarLengthPerStrand < 12 && lastBarLengthPerStrand > 0 ? 'text-red-600' : 'text-emerald-700'}
                big
              />
              <Stat label="طول الحديد للخيط الواحد" value={fmt(lenPerStrand, 1)} unit="متر" />
              <Stat
                label="إجمالي قطعيات الوردية"
                value={fmt(num(billetsShift) * totalFullFlyingBarsPerBillet, 0)}
                unit={`بار (${cutLen}م)`}
              />
            </div>
            <p className="text-xs font-bold text-slate-600 bg-amber-50/70 p-2.5 rounded-xl border border-amber-200/80">
              • كل خيط يخرج منه <strong>{fullFlyingCutsPerStrand} قطعية كاملة</strong> بطول {cutLen}م + بار أخير في الذيل بطول{' '}
              <strong>{fmt(lastBarLengthPerStrand, 2)} متر</strong> (بإجمالي {totalFlyingBarsWithLast} بار على سرير التبريد للبيليت الواحد).
            </p>
          </div>

          <div className="bg-white p-4 sm:p-5 rounded-2xl border-2 border-emerald-300 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <h4 className="text-sm sm:text-base font-black text-emerald-900 flex items-center gap-1.5">
                <Calculator size={18} className="text-emerald-600" />
                ثانياً: الأسياخ النهائية للعميل بعد المقص البارد (طول {commLen} متر)
              </h4>
              <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2.5 py-0.5 rounded-full">
                تسليم العميل
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <Stat
                label={`أسياخ العميل (${commLen}م) للبيليت`}
                value={totalCustomerBarsPerBillet}
                unit="سيخ"
                color="text-emerald-700"
                big
              />
              <Stat label="إنتاجية الساعة الصافية" value={fmt(tonsPerHr, 1)} unit="طن/ساعة" color="text-blue-700" big />
              <Stat label="أسياخ سليمة من البار الأخير" value={commBarsFromLastBar * k} unit="سيخ" />
              <Stat label="فضلة القصائر للهالك" value={fmt(shortScrapFromLastBar, 2)} unit="متر/خيط" color="text-red-600" />
            </div>
            <p className="text-xs font-bold text-slate-600 bg-emerald-50/70 p-2.5 rounded-xl border border-emerald-200/80">
              • كل بار ({cutLen}م) يقطعه المقص البارد إلى <strong>{commBarsPerFlyingCut} أسياخ تجارية</strong> بطول {commLen}م{' '}
              {wastePerFlyingCut > 0 ? `(ويتهدر ${fmt(wastePerFlyingCut, 1)}م من كل قطعية)` : '(بدون أي هدر في القطعية)'}، وإجمالي إنتاج الوردية للعميل:{' '}
              <strong>{fmt(num(billetsShift) * totalCustomerBarsPerBillet, 0)} سيخ</strong> ({fmt((num(billetsShift) * prodKg) / 1000, 1)} طن).
            </p>
          </div>

          <SolutionStepsBox
            formula="الطول الكلي للحديد = الوزن الصافي للبيليت ÷ وزن المتر الطولي الفعلي  |  عدد القطعيات = الطول ÷ طول القطعية"
            steps={[
              `وزن البيليت الخام = (${side} × ${side}) × 0.00785 × ${billetLen} متر = ${fmt(billetKg, 1)} كجم`,
              `الوزن الصافي بعد خصم الفواقد (${yieldPct}%) = ${fmt(prodKg, 1)} كجم`,
              `إجمالي طول الحديد الخارج (على وزن متر ${wMeter} كجم/م) = ${fmt(prodKg, 1)} ÷ ${wMeter} = ${fmt(totalLenAllStrands, 1)} متر`,
              `طول الخيط الواحد (مقسوم على ${k} خيط) = ${fmt(totalLenAllStrands, 1)} ÷ ${k} = ${fmt(lenPerStrand, 2)} متر`,
              `المقص الطائر يقطع كل ${cutLen} متر: ${fmt(lenPerStrand, 2)} ÷ ${cutLen} = ${fullFlyingCutsPerStrand} قطعية كاملة لكل خيط (بإجمالي ${totalFullFlyingBarsPerBillet} بار للبيليت) ويتبقى ذيل بطول ${fmt(lastBarLengthPerStrand, 2)} متر`,
              `المقص البارد يقطع كل بار إلى أسياخ ${commLen} متر، ليصبح إجمالي الأسياخ السليمة للعميل = ${totalCustomerBarsPerBillet} سيخ من البيليت الواحد`
            ]}
          />
        </div>
      </div>
    </div>
  );
};

/* ======================================================
   5. حاسبة الباس ديزاين الهندسية الحقيقية (Realistic Roll Pass Schedule)
   ====================================================== */
const RealisticPassDesignModal = ({ onBack }) => {
  const [mode, setMode] = useState('rebar');
  const [billetSide, setBilletSide] = useState(130);
  const [rebarSize, setRebarSize] = useState('16');
  const [customFinalArea, setCustomFinalArea] = useState(201.0);
  const [strands, setStrands] = useState('1');
  const [finishSpeed, setFinishSpeed] = useState(12);
  const [roughStands, setRoughStands] = useState(4);
  const [interStands, setInterStands] = useState(4);
  const [finishStands, setFinishStands] = useState(4);

  const [flatW, setFlatW] = useState(50);
  const [flatT, setFlatT] = useState(10);
  const [flatSpeed, setFlatSpeed] = useState(2.5);

  const handleRebarChange = (sz) => {
    setRebarSize(sz);
    const f = REBAR_SPECS.find((r) => String(r.size) === String(sz));
    if (f) setCustomFinalArea(f.area);
  };

  const k = Number(strands) || 1;
  const totalStands = Math.max(4, Math.min(20, Number(roughStands) + Number(interStands) + Number(finishStands)));
  const A_billet = num(billetSide) * num(billetSide);

  const buildRealisticRebarSchedule = () => {
    const rCount = Math.max(1, Number(roughStands));
    const iCount = Math.max(1, Number(interStands));
    const fCount = Math.max(2, Number(finishStands));
    const N = rCount + iCount + fCount;

    const A_final_single = Math.max(10, num(customFinalArea));
    const A_total_exit = A_final_single * k;

    const weights = [];
    for (let s = 1; s <= N; s++) {
      if (s <= rCount) weights.push(1.35);
      else if (s <= rCount + iCount) weights.push(1.0);
      else if (s === N) weights.push(0.55);
      else weights.push(0.75);
    }

    const totalLogRatio = Math.log(A_billet / A_total_exit);
    const weightSum = weights.reduce((a, b) => a + b, 0);
    const Q_total = A_total_exit * num(finishSpeed);

    let currentArea = A_billet;
    const schedule = [];

    for (let idx = 0; idx < N; idx++) {
      const standNum = idx + 1;
      const zone =
        standNum <= rCount
          ? 'تخشين (Roughing)'
          : standNum <= rCount + iCount
          ? 'متوسط (Interm.)'
          : 'تشطيب (Finishing)';

      let shape = 'بيضاوي (Oval)';
      if (standNum <= 2) shape = standNum % 2 === 1 ? 'صندوقي (Box)' : 'مربع (Square)';
      else if (standNum === N) shape = 'دائري مشرشر (Final Round)';
      else if (standNum === N - 1) shape = 'بيضاوي قائد (Leader Oval)';
      else shape = standNum % 2 === 1 ? 'بيضاوي (Oval)' : 'مربع / دائري كاذب';

      const logStep = totalLogRatio * (weights[idx] / weightSum);
      const nextAreaTotal = idx === N - 1 ? A_total_exit : currentArea / Math.exp(logStep);

      const reductionPct = ((currentArea - nextAreaTotal) / currentArea) * 100;
      const elongFactor = currentArea / nextAreaTotal;

      const isSplitZone = k > 1 && standNum >= N - 1;
      const singleGrooveArea = isSplitZone ? nextAreaTotal / k : nextAreaTotal;

      const eqDia = Math.sqrt((4 * singleGrooveArea) / Math.PI);
      const estWidth = shape.includes('بيضاوي') ? eqDia * 1.45 : eqDia * 1.05;
      const estGap = standNum <= rCount ? 5.0 : standNum <= rCount + iCount ? 3.5 : 2.2;
      const grooveFactor = Math.max(2, singleGrooveArea / Math.max(1, estWidth) - estGap);

      const rollDe = standNum <= rCount ? 480 : standNum <= rCount + iCount ? 380 : 330;
      const workingDiaDw = rollDe - grooveFactor;

      const linearSpeedV = Q_total / nextAreaTotal;
      const rollRpm = (linearSpeedV * 60000) / (Math.PI * workingDiaDw);

      schedule.push({
        standNum,
        zone,
        shape,
        strandsHere: isSplitZone ? k : 1,
        exitAreaSingle: singleGrooveArea,
        reductionPct,
        elongFactor,
        workingDiaDw,
        linearSpeedV,
        rollRpm
      });

      currentArea = nextAreaTotal;
    }
    return { schedule, Q_total, A_total_exit };
  };

  const buildFlatBarSchedule = () => {
    const wFinal = num(flatW);
    const tFinal = num(flatT);
    const A_final = wFinal * tFinal;
    const Q_flat = A_final * num(flatSpeed);

    const flatPasses = [
      { name: 'قائم رأسي 1 (V1 Edger)', shape: 'كسر سوكة وضبط عرض', w: wFinal + 10, h: tFinal + 3, de: 420, gr: 31.7 },
      { name: 'قائم أفقي 1 (Stand 1 Flat)', shape: 'ممر عدل تفتيح (Flat)', w: wFinal + 1.5, h: tFinal + 1.2, de: 485, gr: 4.5 },
      { name: 'قائم رأسي 2 (V2 Edger)', shape: 'تحجيم العرض (Edging)', w: wFinal - 1.0, h: tFinal + 1.5, de: 380, gr: 26.8 },
      { name: 'قائم تشطيب (Finish Stand)', shape: 'ممر تشطيب الخوصة النهائي', w: wFinal, h: tFinal, de: 480, gr: 3.15 }
    ];

    return flatPasses.map((p, i) => {
      const area = p.w * p.h;
      const prevArea = i === 0 ? (wFinal + 14) * (tFinal + 6) : flatPasses[i - 1].w * flatPasses[i - 1].h;
      const red = ((prevArea - area) / prevArea) * 100;
      const dw = p.de - (p.h - 2.5);
      const vel = Q_flat / area;
      const rRpm = (vel * 60000) / (Math.PI * dw);
      const mRpm = rRpm * p.gr;
      return { ...p, area, red, dw, vel, rRpm, mRpm };
    });
  };

  const rebarData = buildRealisticRebarSchedule();
  const flatData = buildFlatBarSchedule();

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm">
        <button
          onClick={onBack}
          className="bg-slate-100 hover:bg-slate-200 text-slate-800 px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5"
        >
          <ArrowLeft size={15} className="rotate-180" /> رجوع لكل القوانين
        </button>
        <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
          <button
            onClick={() => setMode('rebar')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              mode === 'rebar' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            باس ديزاين حديد التسليح
          </button>
          <button
            onClick={() => setMode('flat')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              mode === 'flat' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            باس ديزاين الخوصة والقطاعات (50×10 / 40×10)
          </button>
        </div>
      </div>

      {mode === 'rebar' ? (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            <div className="lg:col-span-6 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <h3 className="text-sm sm:text-base font-black text-slate-900 border-b border-slate-100 pb-2">
                مدخلات خط الدرفلة وتوزيع القوائم
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                <Field label="ضلع البيليت (مم)" value={billetSide} onChange={setBilletSide} />
                <SelectField
                  label="مقاس السيخ"
                  value={rebarSize}
                  onChange={handleRebarChange}
                  options={REBAR_SPECS.map((r) => [String(r.size), `${r.size} مم`])}
                />
                <Field label="مساحة المقطع النهائي (مم²)" value={customFinalArea} onChange={setCustomFinalArea} step="0.5" />
                <SelectField
                  label="نظام الشق (Slitting)"
                  value={strands}
                  onChange={setStrands}
                  options={[
                    ['1', '1 خط (بدون شق)'],
                    ['2', '2 خط (شق ثنائي)'],
                    ['3', '3 خطوط'],
                    ['4', '4 خطوط']
                  ]}
                />
                <Field label="قوائم التخشين" value={roughStands} onChange={setRoughStands} />
                <Field label="قوائم المتوسط" value={interStands} onChange={setInterStands} />
                <Field label="قوائم التشطيب" value={finishStands} onChange={setFinishStands} />
                <Field label="سرعة آخر قائم (م/ث)" value={finishSpeed} onChange={setFinishSpeed} step="0.5" className="col-span-2" />
              </div>
            </div>

            <div className="lg:col-span-6 bg-white p-4 rounded-2xl border border-blue-200 shadow-sm space-y-3">
              <h3 className="text-sm sm:text-base font-black text-blue-800 border-b border-slate-100 pb-2">
                ملخص الباس ديزاين وثابت التدفق
              </h3>
              <div className="grid grid-cols-2 gap-2.5">
                <Stat label="مساحة البيليت الداخلة" value={fmt(A_billet, 0)} unit="مم²" />
                <Stat label="مساحة السيخ النهائي" value={fmt(customFinalArea, 1)} unit="مم²" color="text-emerald-700" />
                <Stat label="ثابت التدفق الحجمي للخط" value={fmt(rebarData.Q_total, 0)} unit="مم².م/ث" color="text-blue-700" />
                <Stat label="إجمالي عدد القوائم" value={totalStands} unit="قائم" />
              </div>
              <SolutionStepsBox
                formula="القطر الفعال = القطر الخارجي - معامل الممر  |  سرعة القائم = ثابت التدفق ÷ مساحة المقطع عند القائم"
                steps={[
                  'في مرحلة التخشين (Roughing): تكون نسبة التخفيض عالية (28% إلى 35%) لأن الحديد ساخن وطري جداً.',
                  'في المرحلة المتوسطة (Intermediate): تكون نسبة التخفيض متوسطة (20% إلى 25%).',
                  'في مرحلة التشطيب (Finishing): يكون الممر قبل الأخير بيضاوي قائد (Leader Oval) والأخير دائري مشرشر بتخفيض هادئ (12% إلى 17%) لضبط أبعاد السيخ.'
                ]}
              />
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm overflow-x-auto">
            <h4 className="text-sm font-black text-slate-900 mb-3">
              جدول تدرج الممرات، الأقطار الفعالة، وتزامن السرعات
            </h4>
            <table className="w-full text-right text-xs min-w-[720px]">
              <thead className="bg-slate-900 text-white">
                <tr>
                  <th className="p-2.5 rounded-r-lg">القائم</th>
                  <th className="p-2.5">المنطقة</th>
                  <th className="p-2.5">شكل الممر</th>
                  <th className="p-2.5">مساحة الممر مم²</th>
                  <th className="p-2.5">التخفيض %</th>
                  <th className="p-2.5">معامل الاستطالة</th>
                  <th className="p-2.5">القطر الفعال مم</th>
                  <th className="p-2.5">السرعة م/ث</th>
                  <th className="p-2.5 rounded-l-lg">لفات الدرفيل RPM</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-mono">
                {rebarData.schedule.map((row) => (
                  <tr key={row.standNum} className="hover:bg-slate-50">
                    <td className="p-2.5 font-black text-slate-900 font-sans">
                      ق {row.standNum} {row.strandsHere > 1 && <span className="text-[10px] text-amber-600">({row.strandsHere}×)</span>}
                    </td>
                    <td className="p-2.5 font-sans text-slate-600 font-bold">{row.zone}</td>
                    <td className="p-2.5 font-sans text-blue-700 font-bold">{row.shape}</td>
                    <td className="p-2.5 text-slate-900 font-bold">{fmt(row.exitAreaSingle, 1)}</td>
                    <td className="p-2.5 text-emerald-700 font-bold">{fmt(row.reductionPct, 1)}%</td>
                    <td className="p-2.5 text-slate-700">{fmt(row.elongFactor, 2)}</td>
                    <td className="p-2.5 text-amber-700 font-bold">{fmt(row.workingDiaDw, 1)}</td>
                    <td className="p-2.5 text-blue-700 font-black">{fmt(row.linearSpeedV, 2)}</td>
                    <td className="p-2.5 text-slate-900 font-black">{fmt(row.rollRpm, 1)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-emerald-200 shadow-sm grid grid-cols-1 md:grid-cols-3 gap-3">
            <Field label="عرض الخوصة النهائي (مم) مثل 50 أو 40" value={flatW} onChange={setFlatW} />
            <Field label="سمك الخوصة النهائي (مم) مثل 10" value={flatT} onChange={setFlatT} />
            <Field label="سرعة خروج الخوصة (م/ث)" value={flatSpeed} onChange={setFlatSpeed} step="0.1" />
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm overflow-x-auto">
            <h4 className="text-sm font-black text-emerald-800 mb-3">
              جدول تزامن القوائم الأفقية والرأسية لإنتاج خوصة {flatW}×{flatT} مم
            </h4>
            <table className="w-full text-right text-xs min-w-[650px]">
              <thead className="bg-slate-900 text-white">
                <tr>
                  <th className="p-2.5">القائم</th>
                  <th className="p-2.5">وظيفة الممر</th>
                  <th className="p-2.5">الأبعاد الخارجة (عرض×سمك)</th>
                  <th className="p-2.5">المساحة مم²</th>
                  <th className="p-2.5">التخفيض %</th>
                  <th className="p-2.5">القطر الفعال مم</th>
                  <th className="p-2.5">السرعة م/ث</th>
                  <th className="p-2.5">لفات الدرفيل</th>
                  <th className="p-2.5">لفات الموتور RPM</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-mono">
                {flatData.map((r, i) => (
                  <tr key={i} className="hover:bg-slate-50">
                    <td className="p-2.5 font-sans font-black text-slate-900">{r.name}</td>
                    <td className="p-2.5 font-sans text-slate-600 font-bold">{r.shape}</td>
                    <td className="p-2.5 text-amber-700 font-bold">
                      {fmt(r.w, 1)} × {fmt(r.h, 1)} مم
                    </td>
                    <td className="p-2.5 text-slate-900 font-bold">{fmt(r.area, 0)}</td>
                    <td className="p-2.5 text-emerald-700 font-bold">{fmt(r.red, 1)}%</td>
                    <td className="p-2.5 text-slate-700">{fmt(r.dw, 1)}</td>
                    <td className="p-2.5 text-blue-700 font-black">{fmt(r.vel, 2)}</td>
                    <td className="p-2.5 text-slate-900 font-bold">{fmt(r.rRpm, 1)}</td>
                    <td className="p-2.5 text-amber-700 font-black">{fmt(r.mRpm, 0)} RPM</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

/* ======================================================
   6. موسوعة كل القوانين الموحدة (شاملة مساحات الممرات وطول تلامس الدرفيل L)
   ====================================================== */
const ALL_CALCULATORS = [
  {
    id: 'special_groove_areas',
    title: 'حاسبة مساحات الممرات والقطاعات (الدائرة، المستطيل، البيضاوي، الصندوقي)',
    desc: 'احسب مساحة المقطع من الطول والعرض أو قانون الدائرة والبيضاوي مع وزن المتر ونسبة امتلاء الممر.',
    icon: Square,
    group: 'باس ديزاين وإنتاجية',
    isSpecial: true
  },
  {
    id: 'special_bars_yield',
    title: 'حاسبة قطعيات المقص الطائر (36م/48م) وأسياخ العميل (12م)',
    desc: 'تعرض نتيجة المقص الطائر وأسياخ العميل معاً مع تحكم يدوي في وزن المتر الطولي.',
    icon: Scissors,
    group: 'باس ديزاين وإنتاجية',
    isSpecial: true
  },
  {
    id: 'special_pass_design',
    title: 'تصميم الممرات وتوزيع السرعات (Pass Design)',
    desc: 'جدول تدريج المساحات والسرعات الواقعي لحديد التسليح والخوص.',
    icon: Layers,
    group: 'باس ديزاين وإنتاجية',
    isSpecial: true
  },

  // --- حاسبة الطول والعرض السريعة + حاسبة الـ L بتاع الدرفيل ---
  {
    id: 'c_rect_area',
    title: 'حاسبة مساحة المقطع (طول × عرض) ووزن المتر',
    desc: 'أدخل الطول (العرض) والسمك بالملليمتر لحساب المساحة بالمم² ووزن المتر فوراً.',
    icon: Square,
    group: 'درفلة وسرعات',
    formula: 'مساحة المقطع (مم²) = الطول (العرض) × السمك (الارتفاع)  |  وزن المتر الطولي = المساحة × 0.00785',
    inputs: [
      { k: 'l', l: 'الطول / عرض القطاع أو البيليت (مم)', def: 50 },
      { k: 'w', l: 'العرض / سمك القطاع أو البيليت (مم)', def: 10 }
    ],
    calc: (v) => {
      const l = num(v.l);
      const w = num(v.w);
      const area = l * w;
      const weight = area * 0.00785;
      return {
        results: {
          'مساحة المقطع (Area)': `${fmt(area, 2)} مم²`,
          'وزن المتر الطولي للحديد': `${fmt(weight, 3)} كجم/متر`,
          'محيط المقطع': `${fmt(2 * (l + w), 1)} مم`
        },
        steps: [
          `نضرب الطول في العرض = ${l} مم × ${w} مم = ${fmt(area, 2)} مم²`,
          `لحساب وزن المتر الطولي نضرب المساحة في كثافة الحديد (0.00785) = ${fmt(area, 2)} × 0.00785 = ${fmt(weight, 3)} كجم/متر`
        ]
      };
    }
  },
  {
    id: 'c_circle_area',
    title: 'قانون الدائرة وحساب مساحة الممر الدائري',
    desc: 'أدخل قطر الدائرة أو السيخ بالمم لحساب مساحة المقطع والمحيط ووزن المتر.',
    icon: Circle,
    group: 'درفلة وسرعات',
    formula: 'مساحة الدائرة (مم²) = (3.1416 × القطر × القطر) ÷ 4  (أو 0.7854 × مربع القطر)',
    inputs: [
      { k: 'd', l: 'قطر الدائرة أو الممر الدائري (مم)', def: 16 },
      { k: 'gap', l: 'خلوص الجاب بين الدرفيلين (اختياري مم)', def: 2 }
    ],
    calc: (v) => {
      const d = num(v.d);
      const gap = Math.max(0, num(v.gap));
      const area = (Math.PI * d * d) / 4;
      const grooveNet = Math.max(0, area - gap * 0.15 * d);
      const weight = area * 0.00785;
      return {
        results: {
          'مساحة الدائرة الكاملة': `${fmt(area, 2)} مم²`,
          'مساحة ممر الدرفيل الصافية': `${fmt(grooveNet, 2)} مم²`,
          'وزن المتر الطولي للبار الدائري': `${fmt(weight, 3)} كجم/متر`
        },
        steps: [
          `نربع القطر = ${d} × ${d} = ${fmt(d * d, 2)}`,
          `نضرب في 3.1416 ونقسم على 4 = ${fmt(area, 2)} مم²`,
          `وزن المتر الطولي = ${fmt(area, 2)} × 0.00785 = ${fmt(weight, 3)} كجم/متر`
        ]
      };
    }
  },
  {
    id: 'c_roll_L',
    title: 'حساب الـ L بتاع الدرفيل (طول قوس التلامس Lp / Ld)',
    desc: 'حساب طول قوس التلامس بين الدرفيل والمعدن ومساحة التلامس وذراع العزم.',
    icon: Maximize2,
    group: 'باس ديزاين وإنتاجية',
    formula: 'طول قوس التلامس (L) = الجذر التربيعي لـ (نصف قطر الدرفيل R × مقدار الضغطة Δh)',
    inputs: [
      { k: 'd', l: 'قطر الدرفيل الشغال D (مم)', def: 420 },
      { k: 'h1', l: 'ارتفاع المعدن قبل الدرفيل H1 (مم)', def: 24 },
      { k: 'h2', l: 'ارتفاع المعدن بعد الدرفيل H2 (مم)', def: 16 },
      { k: 'w', l: 'متوسط عرض المعدن الملامس للدرفيل W (مم)', def: 45 }
    ],
    calc: (v) => {
      const d = Math.max(1, num(v.d));
      const r = d / 2;
      const h1 = num(v.h1);
      const h2 = num(v.h2);
      const w = num(v.w);
      const dh = Math.max(0, h1 - h2);
      const L = Math.sqrt(r * dh);
      const contactArea = w * L;
      const leverArmX = 0.5 * L;
      const biteRad = Math.acos(Math.max(-1, Math.min(1, 1 - dh / d)));
      const biteDeg = (biteRad * 180) / Math.PI;

      return {
        results: {
          'طول قوس تلامس الدرفيل (L)': `${fmt(L, 2)} مم`,
          'قيمة الضغطة (Δh = H1 - H2)': `${fmt(dh, 2)} مم`,
          'مساحة التلامس الكلية (A = W × L)': `${fmt(contactArea, 1)} مم²`,
          'ذراع العزم الفعال (0.5 × L)': `${fmt(leverArmX, 2)} مم (${fmt(biteDeg, 1)}°)`
        },
        steps: [
          `نحسب نصف قطر الدرفيل (R) = القطر ${d} ÷ 2 = ${fmt(r, 1)} مم`,
          `نحسب قيمة الضغطة (النقص في الارتفاع) = ${h1} - ${h2} = ${fmt(dh, 2)} مم`,
          `نضرب نصف القطر في الضغطة = ${fmt(r, 1)} × ${fmt(dh, 2)} = ${fmt(r * dh, 1)}`,
          `نأخذ الجذر التربيعي للناتج لنحصل على طول قوس التلامس (L) = جذر(${fmt(r * dh, 1)}) = ${fmt(L, 2)} مم`,
          `مساحة منطقة التشكيل والتلامس تحت الدرفيل = العرض ${w} × الطول ${fmt(L, 2)} = ${fmt(contactArea, 1)} مم²`
        ]
      };
    }
  },

  // --- أ. حاسبات الدرفلة والسرعات ---
  {
    id: 'c1',
    title: 'السرعة الخطية للمعدن (متر/ثانية)',
    desc: 'حساب سرعة خروج المعدن من القطر الفعال وعدد لفات الدرفيل.',
    icon: Activity,
    group: 'درفلة وسرعات',
    formula: 'السرعة الخطية (م/ث) = (3.1416 × القطر الفعال بالمم × لفات الدرفيل بالدقيقة) ÷ 60000',
    inputs: [
      { k: 'd', l: 'القطر الفعال للدرفيل (مم)', def: 465 },
      { k: 'n', l: 'سرعة دوران الدرفيل (RPM)', def: 220 }
    ],
    calc: (v) => {
      const d = num(v.d);
      const n = num(v.n);
      const res = (Math.PI * d * n) / 60000;
      return {
        results: { 'السرعة الخطية (متر/ثانية)': `${fmt(res, 2)} m/s`, 'السرعة بالمتر/دقيقة': `${fmt(res * 60, 1)} m/min` },
        steps: [
          `نحسب محيط الدرفيل بالمتر = (3.1416 × ${d} مم) ÷ 1000 = ${fmt((Math.PI * d) / 1000, 3)} متر للفة الواحدة`,
          `نضرب محيط اللفة في عدد اللفات بالدقيقة (${n}) = ${fmt(res * 60, 2)} متر في الدقيقة`,
          `نقسم الناتج على 60 ثانية لنحصل على السرعة بالمتر/ثانية = ${fmt(res, 2)} م/ث`
        ]
      };
    }
  },
  {
    id: 'c2',
    title: 'عدد لفات الدرفيل المطلوبة (Roll RPM)',
    desc: 'إيجاد لفات الدرفيل المطلوبة لتحقيق سرعة خطية محددة للمعدن.',
    icon: RotateCcw,
    group: 'درفلة وسرعات',
    formula: 'لفات الدرفيل (RPM) = (السرعة الخطية بالمتر/ثانية × 60000) ÷ (3.1416 × القطر الفعال بالمم)',
    inputs: [
      { k: 'v', l: 'السرعة الخطية المطلوبة (متر/ثانية)', def: 5.5 },
      { k: 'd', l: 'القطر الفعال للدرفيل (مم)', def: 465 }
    ],
    calc: (v) => {
      const vel = num(v.v);
      const d = Math.max(1, num(v.d));
      const rpm = (vel * 60000) / (Math.PI * d);
      return {
        results: { 'لفات الدرفيل المطلوبة (RPM)': `${fmt(rpm, 1)} لفة/دقيقة` },
        steps: [
          `نحول السرعة إلى ملليمتر في الدقيقة = ${vel} × 60000 = ${fmt(vel * 60000, 0)} مم/دقيقة`,
          `نحسب محيط الدرفيل بالملليمتر = 3.1416 × ${d} = ${fmt(Math.PI * d, 2)} مم`,
          `نقسم المسافة بالدقيقة على محيط الدرفيل = ${fmt(vel * 60000, 0)} ÷ ${fmt(Math.PI * d, 2)} = ${fmt(rpm, 1)} لفة/دقيقة`
        ]
      };
    }
  },
  {
    id: 'c3',
    title: 'لفات الموتور وسرعة العض الزائدة (Over Speed)',
    desc: 'حساب RPM الموتور من نسبة الجيربوكس وإضافة نسبة الـ Over Speed.',
    icon: Gauge,
    group: 'درفلة وسرعات',
    formula: 'لفات الموتور = لفات الدرفيل × نسبة تخفيض الجيربوكس',
    inputs: [
      { k: 'nr', l: 'لفات الدرفيل المطلوبة (RPM)', def: 220 },
      { k: 'gr', l: 'نسبة تخفيض الجيربوكس (Gear Ratio)', def: 3.4 },
      { k: 'over', l: 'نسبة سرعة العض الزائدة Over Speed (%)', def: 3 }
    ],
    calc: (v) => {
      const nr = num(v.nr);
      const gr = num(v.gr);
      const over = num(v.over);
      const nm = nr * gr;
      const nmOver = nm * (1 + over / 100);
      return {
        results: {
          'لفات الموتور الأساسية': `${fmt(nm, 0)} RPM`,
          'لفات الموتور شاملة الـ Over Speed': `${fmt(nmOver, 0)} RPM`
        },
        steps: [
          `نضرب لفات الدرفيل في نسبة الجيربوكس = ${nr} × ${gr} = ${fmt(nm, 1)} لفة/دقيقة`,
          `نضيف نسبة السرعة الزائدة للعض (${over}%) = ${fmt(nm, 1)} × (1 + ${over}÷100) = ${fmt(nmOver, 1)} لفة/دقيقة`
        ]
      };
    }
  },
  {
    id: 'c4',
    title: 'القطر الفعال الشغال ومعامل الممر (Working Diameter)',
    desc: 'حساب القطر الفعال للدرفيل من مساحة وعرض الممر وخلوص الدرفيلين.',
    icon: Circle,
    group: 'درفلة وسرعات',
    formula: 'معامل الممر = (مساحة الممر ÷ عرض الممر) - خلوص الجاب  |  القطر الفعال = القطر الخارجي - معامل الممر',
    inputs: [
      { k: 'de', l: 'القطر الخارجي للدرفيل على المخرطة (مم)', def: 480 },
      { k: 'area', l: 'مساحة مقطع الممر (مم²)', def: 650 },
      { k: 'width', l: 'عرض الممر (مم)', def: 45 },
      { k: 'gap', l: 'خلوص الجاب بين الدرفيلين (مم)', def: 3.5 }
    ],
    calc: (v) => {
      const de = num(v.de);
      const area = num(v.area);
      const w = Math.max(1, num(v.width));
      const gap = num(v.gap);
      const gf = area / w - gap;
      const dw = de - gf;
      return {
        results: { 'معامل الممر (Groove Factor)': `${fmt(gf, 2)} مم`, 'القطر الفعال الشغال (Dw)': `${fmt(dw, 2)} مم` },
        steps: [
          `نقسم مساحة الممر على عرض الممر = ${area} ÷ ${w} = ${fmt(area / w, 2)} مم`,
          `نطرح خلوص الجاب (${gap} مم) لنحصل على معامل الممر = ${fmt(area / w, 2)} - ${gap} = ${fmt(gf, 2)} مم`,
          `نطرح معامل الممر من القطر الخارجي للدرفيل = ${de} - ${fmt(gf, 2)} = ${fmt(dw, 2)} مم`
        ]
      };
    }
  },
  {
    id: 'c5',
    title: 'نسبة التخفيض ومعامل الاستطالة للممر',
    desc: 'حساب النسبة المئوية للتخفيض ومقدار استطالة المعدن في الممر.',
    icon: DivideSquare,
    group: 'درفلة وسرعات',
    formula: 'نسبة التخفيض % = ((مساحة الدخول - مساحة الخروج) ÷ مساحة الدخول) × 100  |  معامل الاستطالة = مساحة الدخول ÷ مساحة الخروج',
    inputs: [
      { k: 'a1', l: 'مساحة المقطع الداخل للممر (مم²)', def: 1600 },
      { k: 'a2', l: 'مساحة المقطع الخارج من الممر (مم²)', def: 1200 }
    ],
    calc: (v) => {
      const a1 = Math.max(1, num(v.a1));
      const a2 = Math.max(1, num(v.a2));
      const red = ((a1 - a2) / a1) * 100;
      const lam = a1 / a2;
      return {
        results: { 'نسبة التخفيض المئوية': `${fmt(red, 2)}%`, 'معامل الاستطالة': `${fmt(lam, 3)} مرة` },
        steps: [
          `مقدار النقص في المساحة = ${a1} - ${a2} = ${fmt(a1 - a2, 1)} مم²`,
          `نسبة التخفيض المئوية = (${fmt(a1 - a2, 1)} ÷ ${a1}) × 100 = ${fmt(red, 2)}%`,
          `معامل الاستطالة = مساحة الدخول ${a1} ÷ مساحة الخروج ${a2} = ${fmt(lam, 3)}`
        ]
      };
    }
  },
  {
    id: 'c6',
    title: 'قانون ثبات الحجم وتزامن القائم التالي',
    desc: 'حساب سرعة القائم التالي لمنع حدوث شد أو انضغاط (لوب) بين القائمين.',
    icon: Layers,
    group: 'درفلة وسرعات',
    formula: 'ثابت الدرفلة = مساحة القائم الأول × سرعة القائم الأول = مساحة القائم الثاني × سرعة القائم الثاني',
    inputs: [
      { k: 'a1', l: 'مساحة ممر القائم الأول (مم²)', def: 1450 },
      { k: 'v1', l: 'سرعة القائم الأول (متر/ثانية)', def: 2.4 },
      { k: 'a2', l: 'مساحة ممر القائم الثاني (مم²)', def: 1120 }
    ],
    calc: (v) => {
      const a1 = num(v.a1);
      const v1 = num(v.v1);
      const a2 = Math.max(1, num(v.a2));
      const q = a1 * v1;
      const v2 = q / a2;
      return {
        results: { 'ثابت تدفق المعدن (Q)': fmt(q, 0), 'السرعة المطلوبة للقائم الثاني': `${fmt(v2, 2)} م/ث` },
        steps: [
          `نحسب تدفق المعدن الخارج من القائم الأول = ${a1} مم² × ${v1} م/ث = ${fmt(q, 1)}`,
          `نقسم هذا التدفق على مساحة القائم الثاني (${a2} مم²) لنحصل على سرعته المتزنة = ${fmt(q, 1)} ÷ ${a2} = ${fmt(v2, 2)} م/ث`
        ]
      };
    }
  },
  {
    id: 'c7',
    title: 'سرعة القائم السابق (التحكم المتتالي Cascade)',
    desc: 'حساب سرعة القائم الخلفي عند تعديل سرعة القائم الأمامي.',
    icon: ArrowLeftRight,
    group: 'درفلة وسرعات',
    formula: 'سرعة القائم السابق = (مساحة القائم الحالي × سرعة القائم الحالي) ÷ مساحة القائم السابق',
    inputs: [
      { k: 'a2', l: 'مساحة القائم الحالي (مم²)', def: 850 },
      { k: 'v2', l: 'سرعة القائم الحالي (متر/ثانية)', def: 4.8 },
      { k: 'a1', l: 'مساحة القائم السابق له (مم²)', def: 1120 }
    ],
    calc: (v) => {
      const a2 = num(v.a2);
      const v2 = num(v.v2);
      const a1 = Math.max(1, num(v.a1));
      const v1 = (a2 * v2) / a1;
      return {
        results: { 'سرعة القائم السابق المطلوبة': `${fmt(v1, 2)} م/ث` },
        steps: [
          `ثابت التدفق في القائم الحالي = ${a2} × ${v2} = ${fmt(a2 * v2, 1)}`,
          `سرعة القائم السابق = ${fmt(a2 * v2, 1)} ÷ ${a1} = ${fmt(v1, 2)} م/ث`
        ]
      };
    }
  },
  {
    id: 'c8',
    title: 'الضغطة وأقصى ضغطة وزاوية العض (Roll Bite)',
    desc: 'حساب قيمة الضغطة بالمم والتأكد من عدم زحلقة البيليت عند الدخول.',
    icon: Maximize2,
    group: 'باس ديزاين وإنتاجية',
    formula: 'الضغطة = ارتفاع الدخول - ارتفاع الخروج  |  أقصى ضغطة مسموحة = مربع معامل الاحتكاك × نصف قطر الدرفيل',
    inputs: [
      { k: 'h1', l: 'ارتفاع المعدن قبل الدرفيل (مم)', def: 22 },
      { k: 'h2', l: 'ارتفاع المعدن بعد الدرفيل (مم)', def: 15 },
      { k: 'd', l: 'قطر الدرفيل (مم)', def: 420 },
      { k: 'mu', l: 'معامل الاحتكاك الساخن (0.30 إلى 0.40)', def: 0.35 }
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
      const ok = dh <= dhMax;
      return {
        results: {
          'قيمة الضغطة الحالية': `${fmt(dh, 2)} مم`,
          'أقصى ضغطة يقبلها الدرفيل': `${fmt(dhMax, 2)} مم`,
          'زاوية العض وحالة الدخول': `${fmt(alphaDeg, 1)}° (${ok ? 'الدرفيل يعض المعدن بأمان' : 'خطر زحلقة وعدم عض!'})`
        },
        steps: [
          `قيمة الضغطة المطلوبة = ${h1} - ${h2} = ${fmt(dh, 2)} مم`,
          `نصف قطر الدرفيل = ${d} ÷ 2 = ${r} مم`,
          `أقصى ضغطة يقبلها الدرفيل بدون زحلقة = (${mu} × ${mu}) × ${r} = ${fmt(dhMax, 2)} مم`,
          `بما أن الضغطة الحالية (${fmt(dh, 2)} مم) ${ok ? 'أقل من' : 'أكبر من'} الحد الأقصى (${fmt(dhMax, 2)} مم)، فإن حالة العض: ${ok ? 'سليمة' : 'تحتاج فتح الجاب أو تخشين الدرفيل'}`
        ]
      };
    }
  },

  // --- ب. حاسبات الأتمتة والفنش ---
  {
    id: 'a1',
    title: 'مسافة رمي الأبرون والعلب المغلقة (سرير التبريد)',
    desc: 'حساب عدد العلب المغلقة لفرملة السيخ على الأبرون قبل سرير التبريد.',
    icon: Flame,
    group: 'أتمتة وفنش',
    formula: 'عدد العلب المغلقة بالمتر = مربع سرعة آخر قائم ÷ 8',
    inputs: [
      { k: 'v', l: 'سرعة خروج السيخ من آخر قائم (متر/ثانية)', def: 12 },
      { k: 'f', l: 'معامل احتكاك بلاطات الأبرون (القياسي 0.408)', def: 0.408 }
    ],
    calc: (v) => {
      const vel = num(v.v);
      const f = Math.max(0.05, num(v.f));
      const xStd = (vel * vel) / 8;
      const xExact = (vel * vel) / (2 * 9.81 * f);
      return {
        results: {
          'عدد العلب المغلقة القياسي': `${fmt(xStd, 1)} علبة (متر)`,
          'مسافة الفرملة الدقيقة': `${fmt(xExact, 1)} متر`
        },
        steps: [
          `نربع سرعة خروج السيخ = ${vel} × ${vel} = ${fmt(vel * vel, 1)}`,
          `نقسم مربع السرعة على 8 (حيث طول العلبة الواحدة 1 متر) = ${fmt(vel * vel, 1)} ÷ 8 = ${fmt(xStd, 1)} علبة مغلقة`
        ]
      };
    }
  },
  {
    id: 'a2',
    title: 'ضبط ارتفاعات بكر اللوبر (الثابت والمتحرك)',
    desc: 'حساب مستوى البكرة الثابتة والبكرة المتحركة (Kicker) للوبر.',
    icon: Sliders,
    group: 'أتمتة وفنش',
    formula: 'ارتفاع البكرة الثابتة = ارتفاع سنتر الدليل + نصف قطر البار  |  ارتفاع البكرة المتحركة = ارتفاع الثابتة + ثلث ارتفاعها',
    inputs: [
      { k: 'x', l: 'ارتفاع خط سنتر الدليل عن قاعدة اللوبر (مم)', def: 150 },
      { k: 'r', l: 'نصف قطر البار المدرفل (مم)', def: 8 }
    ],
    calc: (v) => {
      const x = num(v.x);
      const r = num(v.r);
      const h = x + r;
      const y = h + h / 3;
      return {
        results: {
          'ارتفاع البكرة الثابتة (H)': `${fmt(h, 1)} مم`,
          'ارتفاع البكرة المتحركة (Y)': `${fmt(y, 1)} مم`
        },
        steps: [
          `ارتفاع البكرة الثابتة = ${x} + ${r} = ${fmt(h, 1)} مم`,
          `نضيف ثلث هذا الارتفاع للبكرة المتحركة = ${fmt(h, 1)} + (${fmt(h, 1)} ÷ 3) = ${fmt(y, 1)} مم`
        ]
      };
    }
  },
  {
    id: 'a3',
    title: 'تزامن المقص الطائر ونسبة السرعة الزائدة',
    desc: 'حساب السرعة الخطية لسلاح المقص ونسبة الـ Over Speed لمنع انحناء المقدمة.',
    icon: Scissors,
    group: 'أتمتة وفنش',
    formula: 'السرعة الخطية للمقص = السرعة الزاوية × نصف قطر دوران السكين',
    inputs: [
      { k: 'nm', l: 'سرعة موتور المقص (RPM)', def: 1200 },
      { k: 'gr', l: 'نسبة جيربوكس المقص (Gear Ratio)', def: 4 },
      { k: 'r', l: 'نصف قطر دوران سلاح المقص (بالمتر)', def: 0.35 },
      { k: 'vbar', l: 'سرعة السيخ القادم من القائم السابق (م/ث)', def: 10 }
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
        results: {
          'السرعة الخطية لسلاح المقص': `${fmt(vcv, 2)} م/ث`,
          'نسبة زيادة سرعة المقص (Over Speed)': `${fmt(over, 1)}%`
        },
        steps: [
          `عدد لفات عمود المقص = ${nm} ÷ ${gr} = ${fmt(ncv, 1)} لفة/دقيقة`,
          `السرعة الخطية لحافة السكين = (2 × 3.1416 × ${fmt(ncv, 1)} ÷ 60) × ${r} م = ${fmt(vcv, 2)} م/ث`,
          `نسبة السرعة الزائدة للمقص فوق سرعة السيخ = ((${fmt(vcv, 2)} - ${vbar}) ÷ ${vbar}) × 100 = ${fmt(over, 1)}%`
        ]
      };
    }
  },

  // --- ج. حاسبات القوى والكهرباء والتحكم للفنيين ---
  {
    id: 'e_cable',
    title: 'اختيار كابل الموتور وحساب هبوط الجهد (Cable Sizing)',
    desc: 'تحديد مقاس كابل النحاس المناسب بالمم² للموتور وفحص نسبة هبوط الجهد.',
    icon: Cable,
    group: 'قوى وكهرباء',
    formula: 'تيار تصميم الكابل = 1.25 × أمبير الموتور الكامل  |  هبوط الجهد = (1.732 × التيار × الطول × معامل القدرة) ÷ (56 × مساحة الكابل)',
    inputs: [
      { k: 'kw', l: 'قدرة الموتور (كيلووات kW)', def: 75 },
      { k: 'v', l: 'جهد التشغيل (فولت)', def: 380 },
      { k: 'len', l: 'طول مسار الكابل (بالمتر)', def: 65 },
      { k: 'pf', l: 'معامل القدرة (PF)', def: 0.85 }
    ],
    calc: (v) => {
      const kw = num(v.kw);
      const volt = Math.max(1, num(v.v));
      const len = Math.max(1, num(v.len));
      const pf = Math.max(0.1, num(v.pf));
      const iFl = (kw * 1000) / (Math.sqrt(3) * volt * pf * 0.92);
      const iDesign = iFl * 1.25;

      let chosen = STANDARD_CABLES.find((c) => c.maxAmp >= iDesign);
      let parallelCount = 1;
      if (!chosen) {
        parallelCount = Math.ceil(iDesign / 400);
        chosen = STANDARD_CABLES.find((c) => c.maxAmp >= iDesign / parallelCount) || STANDARD_CABLES[STANDARD_CABLES.length - 1];
      }

      const totalCrossSection = chosen.size * parallelCount;
      const vDropVolt = (Math.sqrt(3) * iFl * len * pf) / (56 * totalCrossSection);
      const vDropPct = (vDropVolt / volt) * 100;
      const isDropSafe = vDropPct <= 5.0;

      return {
        results: {
          'أمبير الحمل الكامل للموتور': `${fmt(iFl, 1)} أمبير`,
          'أمبير تصميم الكابل (شامل 25% أمان)': `${fmt(iDesign, 1)} أمبير`,
          'مقاس كابل النحاس المناسب': parallelCount === 1 ? `3 × ${chosen.size} مم²` : `${parallelCount} كابلات بالتوازي (3 × ${chosen.size} مم²)`,
          'هبوط الجهد عند نهاية الكابل': `${fmt(vDropPct, 2)}% (${isDropSafe ? 'ممتاز أقل من 5%' : 'يفضل اختيار المقاس الأكبر'})`
        },
        steps: [
          `نحسب أمبير الموتور الفعلي = (${kw} × 1000) ÷ (1.732 × ${volt} × ${pf} × 0.92) = ${fmt(iFl, 1)} أمبير`,
          `نضيف 25% معامل أمان للكابل = ${fmt(iFl, 1)} × 1.25 = ${fmt(iDesign, 1)} أمبير`,
          `نختار من الجدول القياسي كابل نحاس بمقطع (${chosen.size} مم²) يتحمل بأمان هذا التيار`,
          `هبوط الجهد لمسافة ${len} متر = ${fmt(vDropVolt, 2)} فولت أي بنسبة ${fmt(vDropPct, 2)}% من الجهد الأصلي`
        ]
      };
    }
  },
  {
    id: 'e_protection',
    title: 'اختيار القاطع والكونتاكتور والأوفرلود (مباشر وستار/دلتا)',
    desc: 'حساب سعة القاطع MCCB والكونتاكتور ورينج الأوفرلود للموتور.',
    icon: ShieldAlert,
    group: 'قوى وكهرباء',
    formula: 'التشغيل المباشر: الأوفرلود = أمبير الموتور  |  ستار/دلتا: كونتاكتور الرئيسي والدلتا والأوفرلود = 58% من أمبير الموتور',
    inputs: [
      { k: 'kw', l: 'قدرة الموتور (كيلووات kW)', def: 45 },
      { k: 'v', l: 'جهد التشغيل (فولت)', def: 380 }
    ],
    calc: (v) => {
      const kw = num(v.kw);
      const volt = Math.max(1, num(v.v));
      const inAmp = (kw * 1000) / (Math.sqrt(3) * volt * 0.85 * 0.91);
      const cbAmp = inAmp * 1.5;
      const sdMainDelta = inAmp * 0.58;
      const sdStar = inAmp * 0.34;

      return {
        results: {
          'أمبير الموتور الاسمي': `${fmt(inAmp, 1)} A`,
          'القاطع الرئيسي المناسب (MCCB)': `${fmt(cbAmp, 0)} A`,
          'في حالة التشغيل المباشر (DOL)': `كونتاكتور ${fmt(inAmp * 1.2, 0)}A + أوفرلود يضبط على ${fmt(inAmp, 1)}A`,
          'في حالة ستار / دلتا (Star/Delta)': `رئيسي ودلتا: ${fmt(sdMainDelta, 0)}A | ستار: ${fmt(sdStar, 0)}A | أوفرلود: ${fmt(sdMainDelta, 1)}A`
        },
        steps: [
          `أمبير الموتور الاسمي التقريبي = ${fmt(inAmp, 1)} أمبير`,
          `سعة القاطع الرئيسي لحماية الدائرة = 1.5 × ${fmt(inAmp, 1)} = ${fmt(cbAmp, 0)} أمبير`,
          `في توصيلة ستار/دلتا يمر في الكونتاكتور الرئيسي والدلتا 58% فقط من التيار = ${fmt(sdMainDelta, 1)} أمبير، ويمر في كونتاكتور الستار 34% = ${fmt(sdStar, 1)} أمبير`
        ]
      };
    }
  },
  {
    id: 'e_braking',
    title: 'حاسبة مقاومة الفرملة للإنفرتر (Braking Resistor)',
    desc: 'حساب قيمة الأوم والكيلووات لمقاومة الفرملة لمنع عطل Overvoltage.',
    icon: Zap,
    group: 'قوى وكهرباء',
    formula: 'قيمة المقاومة بالأوم = مربع جهد دائرة الـ DC ÷ قدرة الموتور بالوات',
    inputs: [
      { k: 'kw', l: 'قدرة موتور الدرفلة أو المقص (kW)', def: 90 },
      { k: 'vdc', l: 'جهد دائرة الـ DC أثناء الفرملة (لـ 380V يكون 700V)', def: 700 },
      { k: 'duty', l: 'نسبة تكرار الفرملة Braking Duty (%)', def: 15 }
    ],
    calc: (v) => {
      const kw = Math.max(1, num(v.kw));
      const vdc = num(v.vdc);
      const duty = num(v.duty);
      const pPeakWatt = kw * 1000;
      const rOhm = (vdc * vdc) / pPeakWatt;
      const resKw = kw * (duty / 100);

      return {
        results: {
          'قيمة مقاومة الفرملة المطلوبة': `${fmt(rOhm, 1)} أوم (Ω)`,
          'قدرة المقاومة الحرارية': `${fmt(resKw, 1)} كيلووات (kW)`,
          'أقصى تيار فرملة': `${fmt(vdc / Math.max(0.1, rOhm), 1)} أمبير`
        },
        steps: [
          `مربع جهد دائرة التيار المستمر = ${vdc} × ${vdc} = ${vdc * vdc}`,
          `نقسم على قدرة الموتور بالوات (${pPeakWatt} وات) = ${fmt(rOhm, 1)} أوم`,
          `القدرة الحرارية للمقاومة حسب نسبة الفرملة (${duty}%) = ${kw} × (${duty}÷100) = ${fmt(resKw, 1)} كيلووات`
        ]
      };
    }
  },
  {
    id: 'e_pfc',
    title: 'مكثفات تحسين معامل القدرة (Power Factor kVAR)',
    desc: 'حساب سعة لوحة المكثفات بالكيلوفار لرفع معامل القدرة وتقليل الأمبير.',
    icon: BatteryCharging,
    group: 'قوى وكهرباء',
    formula: 'سعة المكثفات المطلوبة (kVAR) = القدرة الفعالة بالكيلووات × فرق ظل زاوية معامل القدرة قبل وبعد التحسين',
    inputs: [
      { k: 'kw', l: 'الحمل الفعال للمصنع أو اللوحة (kW)', def: 500 },
      { k: 'pf1', l: 'معامل القدرة الحالي المنخفض', def: 0.76 },
      { k: 'pf2', l: 'معامل القدرة المستهدف', def: 0.95 }
    ],
    calc: (v) => {
      const kw = num(v.kw);
      const pf1 = Math.max(0.3, Math.min(0.99, num(v.pf1)));
      const pf2 = Math.max(0.5, Math.min(0.99, num(v.pf2)));
      const tan1 = Math.tan(Math.acos(pf1));
      const tan2 = Math.tan(Math.acos(pf2));
      const kvar = Math.max(0, kw * (tan1 - tan2));
      const capAmp = (kvar * 1000) / (Math.sqrt(3) * 380);

      return {
        results: {
          'سعة المكثفات المطلوبة': `${fmt(kvar, 1)} kVAR`,
          'تيار لوحة المكثفات عند 380V': `${fmt(capAmp, 1)} أمبير`
        },
        steps: [
          `معامل الظل للوضع الحالي (${pf1}) = ${fmt(tan1, 3)}، وللوضع المستهدف (${pf2}) = ${fmt(tan2, 3)}`,
          `نضرب الحمل (${kw} كيلووات) في الفرق بينهما = ${kw} × (${fmt(tan1 - tan2, 3)}) = ${fmt(kvar, 1)} كيلوفار`
        ]
      };
    }
  },
  {
    id: 'e_plc_scale',
    title: 'تحويل إشارات الحساسات والـ PLC (4-20mA Scaling)',
    desc: 'تحويل قراءة المللي أمبير إلى حرارة أو ضغط وقيمة الـ PLC الرقمية.',
    icon: Radio,
    group: 'قوى وكهرباء',
    formula: 'النسبة المئوية للإشارة = ((قراءة المللي أمبير - 4) ÷ 16) × 100',
    inputs: [
      { k: 'ma', l: 'قراءة المللي أمبير على الأفوميتر (من 4 إلى 20)', def: 12 },
      { k: 'min', l: 'بداية تدريج الحساس (Min)', def: 0 },
      { k: 'max', l: 'نهاية تدريج الحساس (Max مثلاً 250 بار)', def: 250 }
    ],
    calc: (v) => {
      const ma = num(v.ma);
      const min = num(v.min);
      const max = num(v.max);
      const pct = ((ma - 4) / 16) * 100;
      const engVal = min + ((ma - 4) / 16) * (max - min);
      const siemensRaw = Math.round(((ma - 4) / 16) * 27648);

      return {
        results: {
          'نسبة الإشارة المئوية': `${fmt(pct, 1)}%`,
          'القراءة الفعلية للحساس (ضغط/حرارة)': fmt(engVal, 2),
          'القيمة داخل Siemens PLC (من 27648)': siemensRaw
        },
        steps: [
          `نطرح 4 مللي أمبير (نقطة الصفر) ونقسم على مدى الإشارة (16 مللي أمبير) = (${ma} - 4) ÷ 16 = ${fmt(pct, 1)}%`,
          `نضرب النسبة في مدى الحساس (${max} - ${min}) = ${fmt(engVal, 2)}`,
          `قيمة المسجل الرقمي داخل PLC سيمنز = النسبة × 27648 = ${siemensRaw}`
        ]
      };
    }
  },
  {
    id: 'e_encoder',
    title: 'حاسبة نبضات الإنكودر والسرعة (Encoder PPR)',
    desc: 'حساب تردد نبضات الإنكودر بالكيلوهرتز للتأكد من سلامة القراءة.',
    icon: Cpu,
    group: 'قوى وكهرباء',
    formula: 'تردد النبضات بالهرتز = (سرعة الموتور بالدقيقة × عدد نبضات اللفة الواحدة) ÷ 60',
    inputs: [
      { k: 'ppr', l: 'عدد نبضات الإنكودر في اللفة (PPR)', def: 1024 },
      { k: 'rpm', l: 'سرعة دوران الموتور (RPM)', def: 1500 }
    ],
    calc: (v) => {
      const ppr = num(v.ppr);
      const rpm = num(v.rpm);
      const hz = (rpm * ppr) / 60;
      const khz = hz / 1000;

      return {
        results: {
          'عدد النبضات في الثانية (Hz)': `${fmt(hz, 0)} نبضة/ثانية`,
          'التردد بالكيلوهرتز (kHz)': `${fmt(khz, 2)} kHz`
        },
        steps: [
          `عدد لفات الموتور في الثانية الواحدة = ${rpm} ÷ 60 = ${fmt(rpm / 60, 2)} لفة/ثانية`,
          `نضرب لفات الثانية في نبضات اللفة الواحدة (${ppr}) = ${fmt(hz, 0)} نبضة/ثانية (${fmt(khz, 2)} كيلوهرتز)`
        ]
      };
    }
  },
  {
    id: 'e1',
    title: 'حمل وعزم وقدرة الدرفلة الميكانيكية',
    desc: 'حساب طول قوس التلامس، قوة الدرفلة بالكيلونيوتن، والعزم والقدرة.',
    icon: Flame,
    group: 'قوى وكهرباء',
    formula: 'طول قوس التلامس = الجذر التربيعي لـ (نصف قطر الدرفيل × الضغطة)  |  حمل الدرفلة = مقاومة المعدن × العرض × قوس التلامس',
    inputs: [
      { k: 'sigma', l: 'مقاومة المعدن للتشكيل الساخن (MPa)', def: 110 },
      { k: 'w', l: 'عرض المعدن الملامس للدرفيل (مم)', def: 45 },
      { k: 'r', l: 'نصف قطر الدرفيل (مم)', def: 210 },
      { k: 'dh', l: 'مقدار الضغطة (مم)', def: 6 },
      { k: 'rpm', l: 'سرعة دوران الدرفيل (RPM)', def: 240 }
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
          'طول قوس التلامس (L)': `${fmt(lp, 2)} مم`,
          'قوة وحمل الدرفلة': `${fmt(loadKn, 1)} كيلو نيوتن`,
          'عزم الدرفلة المطلوب': `${fmt(torqueKnm, 2)} kN.m`,
          'القدرة المطلوبة للدرفلة': `${fmt(powerKw, 1)} كيلووات`
        },
        steps: [
          `طول قوس التلامس بين المعدن والدرفيل = جذر (${r} × ${dh}) = ${fmt(lp, 2)} مم`,
          `حمل الدرفلة = (${s} × ${w} × ${fmt(lp, 2)}) ÷ 1000 = ${fmt(loadKn, 1)} كيلو نيوتن`,
          `القدرة الميكانيكية اللازمة لتدوير الدرفيلين = ${fmt(powerKw, 1)} كيلووات`
        ]
      };
    }
  }
];

const UnifiedCalculatorsView = () => {
  const [selectedGroup, setSelectedGroup] = useState('الكل');
  const [activeCalcId, setActiveCalcId] = useState(null);
  const [vals, setVals] = useState({});

  const groups = ['الكل', 'باس ديزاين وإنتاجية', 'درفلة وسرعات', 'قوى وكهرباء', 'أتمتة وفنش'];

  const openCalculator = (c) => {
    if (c.isSpecial) {
      setActiveCalcId(c.id);
      return;
    }
    const defaults = {};
    c.inputs.forEach((inp) => {
      defaults[inp.k] = inp.def !== undefined ? inp.def : 1;
    });
    setVals(defaults);
    setActiveCalcId(c.id);
  };

  if (activeCalcId === 'special_groove_areas') {
    return <GrooveAndCrossSectionModal onBack={() => setActiveCalcId(null)} />;
  }
  if (activeCalcId === 'special_pass_design') {
    return <RealisticPassDesignModal onBack={() => setActiveCalcId(null)} />;
  }
  if (activeCalcId === 'special_bars_yield') {
    return <BarsAndProductivityModal onBack={() => setActiveCalcId(null)} />;
  }

  if (activeCalcId) {
    const c = ALL_CALCULATORS.find((x) => x.id === activeCalcId);
    const { results, steps } = c.calc(vals);
    return (
      <div className="space-y-4">
        <button
          onClick={() => {
            setActiveCalcId(null);
            setVals({});
          }}
          className="bg-white hover:bg-slate-100 text-slate-800 border border-slate-200 px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm"
        >
          <ArrowLeft size={15} className="rotate-180" /> رجوع لكل القوانين
        </button>

        <div className="bg-white p-4 sm:p-6 rounded-3xl border border-slate-200 max-w-2xl mx-auto shadow-lg">
          <div className="flex items-center gap-3 mb-4 border-b border-slate-100 pb-3.5">
            <div className="bg-blue-50 p-2.5 rounded-xl border border-blue-200 shrink-0">
              <c.icon className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
            </div>
            <div>
              <span className="text-[11px] text-blue-600 font-bold">{c.group}</span>
              <h2 className="text-base sm:text-xl font-black text-slate-900">{c.title}</h2>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {c.inputs.map((inp) => (
              <div key={inp.k}>
                <label className="block text-[11px] sm:text-xs font-bold text-slate-600 mb-1">{inp.l}</label>
                <input
                  type="number"
                  step="any"
                  value={vals[inp.k] ?? ''}
                  onChange={(e) => setVals({ ...vals, [inp.k]: e.target.value })}
                  className={inputCls}
                />
              </div>
            ))}
          </div>

          <div className="mt-5 bg-blue-50/60 p-4 rounded-2xl border border-blue-200 space-y-2.5">
            {Object.entries(results).map(([k, v]) => (
              <div key={k} className="flex justify-between items-center border-b border-blue-100 last:border-0 pb-2 last:pb-0 gap-2">
                <span className="text-slate-700 font-bold text-xs sm:text-sm">{k}</span>
                <span className="text-blue-700 font-black font-mono text-sm sm:text-lg text-left">{v}</span>
              </div>
            ))}
          </div>

          <SolutionStepsBox formula={c.formula} steps={steps} />
        </div>
      </div>
    );
  }

  const visibleCalcs =
    selectedGroup === 'الكل' ? ALL_CALCULATORS : ALL_CALCULATORS.filter((c) => c.group === selectedGroup);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
        {groups.map((grp) => (
          <button
            key={grp}
            onClick={() => setSelectedGroup(grp)}
            className={`px-3.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all shrink-0 ${
              selectedGroup === grp
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-white text-slate-600 border border-slate-200 hover:text-slate-900'
            }`}
          >
            {grp}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {visibleCalcs.map((c) => (
          <button
            key={c.id}
            onClick={() => openCalculator(c)}
            className={`text-right p-4 rounded-2xl border transition-all flex items-start gap-3 group hover:-translate-y-0.5 shadow-sm hover:shadow-md ${
              c.isSpecial
                ? 'bg-gradient-to-l from-blue-50/80 to-white border-blue-300 hover:border-blue-500'
                : 'bg-white border-slate-200 hover:border-blue-400'
            }`}
          >
            <div
              className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 ${
                c.isSpecial ? 'bg-blue-600 text-white shadow-sm' : 'bg-blue-50 border border-blue-100 text-blue-600'
              }`}
            >
              <c.icon className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-1">
                <span className="text-[10px] font-bold text-blue-600">{c.group}</span>
                {c.isSpecial && (
                  <span className="text-[9px] bg-amber-100 text-amber-800 border border-amber-300 px-2 py-0.5 rounded-full font-black">
                    شامل ذكي
                  </span>
                )}
              </div>
              <h3 className="text-xs sm:text-sm font-black text-slate-900 mt-0.5 truncate">{c.title}</h3>
              <p className="text-[11px] text-slate-500 font-medium line-clamp-1 mt-0.5">{c.desc}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

/* ======================================================
   7. الجداول ومحول الوحدات الهندسي (Tables & Converter)
   ====================================================== */
const TablesAndConverterView = () => {
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

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-5 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
          <h3 className="text-sm sm:text-base font-black text-slate-900 border-b border-slate-100 pb-2">
            محول الوحدات الهندسي الفوري
          </h3>
          <SelectField
            label="الكمية الفيزيائية"
            value={cat}
            onChange={(v) => {
              setCat(v);
              setUnit(UNIT_GROUPS[v].units[0][0]);
            }}
            options={Object.keys(UNIT_GROUPS).map((k) => [k, UNIT_GROUPS[k].label])}
          />
          <div className="grid grid-cols-2 gap-2.5">
            <Field label="القيمة" value={val} onChange={setVal} />
            <SelectField label="من وحدة" value={unit} onChange={setUnit} options={g.units.map((u) => [u[0], u[0]])} />
          </div>
        </div>

        <div className="lg:col-span-7 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm space-y-3">
          <h3 className="text-sm sm:text-base font-black text-blue-700 border-b border-slate-100 pb-2">القيم المكافئة</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {all.map(([u, v]) => (
              <Stat
                key={u}
                label={u}
                value={Math.abs(v) >= 1e6 || (Math.abs(v) < 1e-3 && v !== 0) ? v.toExponential(2) : fmt(v, 3)}
                color={u === unit ? 'text-blue-600' : 'text-slate-900'}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm overflow-x-auto">
        <h3 className="text-sm sm:text-base font-black text-slate-900 mb-3">
          جدول الأوزان القياسية والتجاوزات لحديد التسليح (ISO 6935-2 / ES 262)
        </h3>
        <table className="w-full text-right text-xs min-w-[480px]">
          <thead className="bg-slate-900 text-white">
            <tr>
              <th className="p-2.5 rounded-r-lg">المقاس</th>
              <th className="p-2.5">المساحة مم²</th>
              <th className="p-2.5">أقل وزن مسموح</th>
              <th className="p-2.5">الوزن الاسمي (كجم/م)</th>
              <th className="p-2.5">أقصى وزن مسموح</th>
              <th className="p-2.5 rounded-l-lg">كود اللون</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200 font-mono">
            {REBAR_SPECS.map((r) => (
              <tr key={r.size} className="hover:bg-slate-50">
                <td className="p-2.5 font-black text-slate-900">{r.size} مم</td>
                <td className="p-2.5 text-slate-600 font-bold">{r.area}</td>
                <td className="p-2.5 text-red-600 font-bold">{r.minW}</td>
                <td className="p-2.5 text-emerald-700 font-black">{r.nomW}</td>
                <td className="p-2.5 text-amber-700 font-bold">{r.maxW}</td>
                <td className="p-2.5 font-sans font-bold text-blue-700">{r.color}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

/* ======================================================
   8. مجتمع المهندسين وموسوعة الأعطال (Clean Light Community)
   ====================================================== */
const CommunityProView = () => {
  const [subMode, setSubMode] = useState('feed');
  const [posts, setPosts] = useState(INITIAL_POSTS);
  const [faults] = useState(INITIAL_FAULTS);
  const [categoryFilter, setCategoryFilter] = useState('الكل');
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewPostForm, setShowNewPostForm] = useState(false);

  const [newPostAuthor, setNewPostAuthor] = useState('');
  const [newPostRole, setNewPostRole] = useState('مهندس / فني درفلة');
  const [newPostCategory, setNewPostCategory] = useState('غرف التحكم والـ VFD');
  const [newPostTitle, setNewPostTitle] = useState('');
  const [newPostContent, setNewPostContent] = useState('');
  const [commentInputs, setCommentInputs] = useState({});
  const [commentAuthor, setCommentAuthor] = useState('');

  const categories = ['الكل', 'غرف التحكم والـ VFD', 'باس ديزاين ودرافيل', 'أعطال وصيانة'];

  const handleCreatePost = (e) => {
    e.preventDefault();
    if (!newPostTitle.trim() || !newPostContent.trim()) return;
    const postObj = {
      id: Date.now().toString(),
      author: newPostAuthor.trim() || 'مهندس / فني بالدرفلة',
      role: newPostRole,
      badge: 'عضو فاعل',
      time: 'الآن',
      category: newPostCategory,
      title: newPostTitle.trim(),
      content: newPostContent.trim(),
      likes: 1,
      fires: 0,
      liked: false,
      fired: false,
      solved: false,
      comments: []
    };
    setPosts([postObj, ...posts]);
    setNewPostTitle('');
    setNewPostContent('');
    setShowNewPostForm(false);
  };

  const handleReaction = (postId, type) => {
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id !== postId) return p;
        if (type === 'like') return { ...p, liked: !p.liked, likes: p.liked ? p.likes - 1 : p.likes + 1 };
        return { ...p, fired: !p.fired, fires: p.fired ? p.fires - 1 : p.fires + 1 };
      })
    );
  };

  const handleAddComment = (postId) => {
    const text = commentInputs[postId];
    if (!text || !text.trim()) return;
    const newComment = {
      id: Date.now().toString(),
      user: commentAuthor.trim() || 'عضو بالمنصة',
      role: 'فني / مهندس',
      text: text.trim(),
      time: 'الآن',
      isBest: false
    };
    setPosts((prev) => prev.map((p) => (p.id === postId ? { ...p, comments: [...p.comments, newComment] } : p)));
    setCommentInputs({ ...commentInputs, [postId]: '' });
  };

  const toggleBestComment = (postId, commentId) => {
    setPosts((prev) =>
      prev.map((p) =>
        p.id === postId
          ? {
              ...p,
              solved: true,
              comments: p.comments.map((c) => (c.id === commentId ? { ...c, isBest: !c.isBest } : c))
            }
          : p
      )
    );
  };

  const visiblePosts = posts.filter((p) => {
    const matchCat = categoryFilter === 'الكل' || p.category === categoryFilter;
    const matchSearch =
      !searchQuery.trim() ||
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.content.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSearch;
  });

  const filteredFaults = faults.filter(
    (f) =>
      f.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="bg-white border border-slate-200 p-3.5 rounded-2xl shadow-sm flex flex-wrap justify-between items-center gap-3">
        <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
          <button
            onClick={() => setSubMode('feed')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
              subMode === 'feed' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <MessageCircle size={14} /> المنشورات والنقاشات
          </button>
          <button
            onClick={() => setSubMode('faults')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
              subMode === 'faults' ? 'bg-amber-500 text-slate-950 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Wrench size={14} /> موسوعة العيوب والأعطال
          </button>
        </div>

        <div className="flex items-center gap-2 flex-1 sm:flex-initial justify-end">
          <div className="relative flex-1 sm:w-60">
            <Search size={14} className="absolute right-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="ابحث في النقاشات أو الأعطال..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-300 rounded-xl pr-8 pl-3 py-1.5 text-xs text-slate-900 outline-none focus:border-blue-600"
            />
          </div>
          {subMode === 'feed' && (
            <button
              onClick={() => setShowNewPostForm(!showNewPostForm)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 shrink-0 shadow-sm"
            >
              <PlusCircle size={14} /> إضافة منشور
            </button>
          )}
        </div>
      </div>

      {subMode === 'feed' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          <div className="lg:col-span-8 space-y-4">
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className={`px-3 py-1.5 rounded-lg text-[11px] font-bold whitespace-nowrap transition-all ${
                    categoryFilter === cat
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'bg-white text-slate-600 border border-slate-200 hover:text-slate-900'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {showNewPostForm && (
              <form onSubmit={handleCreatePost} className="bg-white border-2 border-blue-400 rounded-2xl p-4 space-y-3 shadow-lg">
                <h3 className="text-sm font-black text-slate-900 flex items-center gap-1.5">
                  <Sparkles size={15} className="text-blue-600" /> مشاركة معلومة فنية أو سؤال للزملاء
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <input
                    type="text"
                    placeholder="اسمك (مثال: م. بسام وليد)"
                    value={newPostAuthor}
                    onChange={(e) => setNewPostAuthor(e.target.value)}
                    className={inputCls}
                  />
                  <select value={newPostRole} onChange={(e) => setNewPostRole(e.target.value)} className={inputCls}>
                    <option>مشغل غرفة تحكم رئيسية</option>
                    <option>مهندس درفلة وإنتاج</option>
                    <option>مهندس / فني كهرباء وكنترول</option>
                    <option>فني ميكانيكا ودرافيل</option>
                  </select>
                  <select value={newPostCategory} onChange={(e) => setNewPostCategory(e.target.value)} className={inputCls}>
                    <option>غرف التحكم والـ VFD</option>
                    <option>باس ديزاين ودرافيل</option>
                    <option>أعطال وصيانة</option>
                  </select>
                </div>
                <input
                  type="text"
                  placeholder="عنوان السؤال أو المعلومة..."
                  value={newPostTitle}
                  onChange={(e) => setNewPostTitle(e.target.value)}
                  className={inputCls}
                />
                <textarea
                  rows="3"
                  placeholder="اشرح التفاصيل الفنية هنا..."
                  value={newPostContent}
                  onChange={(e) => setNewPostContent(e.target.value)}
                  className={inputCls + ' resize-none'}
                />
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowNewPostForm(false)}
                    className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 text-xs font-bold"
                  >
                    إلغاء
                  </button>
                  <button type="submit" className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold">
                    نشر الآن
                  </button>
                </div>
              </form>
            )}

            {visiblePosts.map((post) => (
              <div key={post.id} className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-3.5 shadow-sm">
                <div className="flex justify-between items-start gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white font-black text-base shrink-0">
                      {post.author.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h4 className="font-black text-slate-900 text-sm">{post.author}</h4>
                        <span className="text-[10px] bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full font-bold">
                          {post.badge}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 font-bold">
                        {post.role} • {post.time}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {post.solved && (
                      <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                        <Check size={11} /> محلول
                      </span>
                    )}
                    <span className="text-[10px] bg-slate-100 text-slate-700 font-bold px-2.5 py-0.5 rounded-full">
                      {post.category}
                    </span>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm sm:text-base font-black text-blue-800 mb-1.5">{post.title}</h3>
                  <p className="text-xs sm:text-sm text-slate-700 font-medium leading-relaxed whitespace-pre-line">
                    {post.content}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-2.5 border-t border-slate-100 text-xs">
                  <button
                    onClick={() => handleReaction(post.id, 'like')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition-colors ${
                      post.liked ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    <ThumbsUp size={13} /> مفيد ({post.likes})
                  </button>
                  <button
                    onClick={() => handleReaction(post.id, 'fire')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition-colors ${
                      post.fired ? 'bg-amber-500 text-slate-950' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    <Flame size={13} /> معلومة ذهبية ({post.fires})
                  </button>
                  <span className="text-slate-500 font-bold mr-auto flex items-center gap-1">
                    <MessageCircle size={13} /> {post.comments.length} تعليقات
                  </span>
                </div>

                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2.5">
                  {post.comments.map((c) => (
                    <div
                      key={c.id}
                      className={`p-2.5 rounded-xl border ${
                        c.isBest ? 'bg-emerald-50 border-emerald-300' : 'bg-white border-slate-200'
                      }`}
                    >
                      <div className="flex justify-between items-center mb-1">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-black text-slate-900">{c.user}</span>
                          {c.isBest && (
                            <span className="text-[9px] bg-emerald-600 text-white px-1.5 py-0.5 rounded font-bold">
                              ✓ أفضل إجابة فنية
                            </span>
                          )}
                        </div>
                        <button
                          onClick={() => toggleBestComment(post.id, c.id)}
                          className="text-[10px] text-slate-400 hover:text-emerald-600 font-bold"
                        >
                          {c.time}
                        </button>
                      </div>
                      <p className="text-xs text-slate-700 font-medium leading-relaxed">{c.text}</p>
                    </div>
                  ))}

                  <div className="flex flex-col sm:flex-row gap-1.5 pt-1">
                    <input
                      type="text"
                      placeholder="اسمك..."
                      value={commentAuthor}
                      onChange={(e) => setCommentAuthor(e.target.value)}
                      className="sm:w-32 bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 outline-none"
                    />
                    <div className="flex flex-1 gap-1.5">
                      <input
                        type="text"
                        placeholder="أضف تعليقك أو خبرتك الفنية..."
                        value={commentInputs[post.id] || ''}
                        onChange={(e) => setCommentInputs({ ...commentInputs, [post.id]: e.target.value })}
                        className="flex-1 bg-white border border-slate-300 rounded-lg px-2.5 py-1.5 text-xs text-slate-900 outline-none"
                      />
                      <button
                        onClick={() => handleAddComment(post.id)}
                        className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded-lg text-xs font-bold shrink-0"
                      >
                        تعليق
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="lg:col-span-4 space-y-4">
            <div className="bg-white border border-slate-200 rounded-2xl p-4 space-y-3 shadow-sm">
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-1.5">
                <Award size={17} className="text-amber-500" /> لوحة شرف خبراء الدرفلة
              </h3>
              <div className="space-y-2 text-xs">
                {[
                  { name: 'م. بسام وليد', role: 'مشغل أول غرفة تحكم & كنترول', pts: 185 },
                  { name: 'م. عادل عزالدين', role: 'مهندس أتمتة وتحكم', pts: 140 },
                  { name: 'م. إسلام عرفات', role: 'خبير درفلة وباس ديزاين', pts: 125 }
                ].map((u, i) => (
                  <div key={u.name} className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-800 font-mono text-[11px] font-black flex items-center justify-center">
                        {i + 1}
                      </span>
                      <div>
                        <p className="font-black text-slate-900">{u.name}</p>
                        <p className="text-[10px] text-slate-500 font-bold">{u.role}</p>
                      </div>
                    </div>
                    <span className="font-mono font-black text-emerald-700">{u.pts} نقطة</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {filteredFaults.map((f) => (
            <div key={f.id} className="bg-white border border-slate-200 rounded-2xl p-4 flex flex-col gap-2 shadow-sm">
              <div className="flex justify-between items-center">
                <span className="bg-red-50 text-red-700 font-black px-2.5 py-0.5 rounded-lg text-xs border border-red-200">
                  {f.code}
                </span>
                <span className="text-[11px] bg-slate-100 text-slate-700 font-bold px-2.5 py-0.5 rounded-full">
                  {f.brand}
                </span>
              </div>
              <h3 className="text-sm font-black text-slate-900">{f.title}</h3>
              <p className="text-xs text-slate-600 font-medium leading-relaxed">
                <strong className="text-amber-700">السبب: </strong> {f.cause}
              </p>
              <div className="bg-emerald-50 p-3 rounded-xl border border-emerald-200 text-xs text-emerald-900 font-bold mt-auto">
                <strong className="text-emerald-700">الحل العملي: </strong> {f.solution}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

/* ======================================================
   9. المكون الرئيسي لبوابة المهندسين (PublicPortal - Light Mode)
   ====================================================== */
export default function PublicPortal({ onBack }) {
  const [activeTab, setActiveTab] = useState('calculators');
  const tabs = [
    { id: 'calculators', label: 'كل القوانين والحاسبات', icon: Calculator },
    { id: 'tables', label: 'التحويلات والجداول', icon: Ruler },
    { id: 'community', label: 'المجتمع والأعطال', icon: MessageCircle }
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans" dir="rtl">
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-3 py-2.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="bg-blue-600 p-1.5 sm:p-2 rounded-xl shadow-sm">
                <Calculator className="text-white w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div>
                <h1 className="text-sm sm:text-base font-black text-slate-900 leading-tight">
                  بوابة المهندسين والحسابات
                </h1>
                <p className="text-[10px] text-slate-500 font-bold hidden sm:block">
                  قوانين الدرفلة، الممرات، المقصات، الكهرباء، والمجتمع الفني
                </p>
              </div>
            </div>

            <button
              onClick={onBack}
              className="sm:hidden bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 font-bold px-2.5 py-1.5 rounded-xl text-xs flex items-center gap-1"
            >
              <Home size={13} /> الرئيسية
            </button>
          </div>

          <div className="flex items-center gap-2">
            <div className="grid grid-cols-3 sm:flex bg-slate-100 p-1 rounded-xl border border-slate-200 w-full sm:w-auto">
              {tabs.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id)}
                  className={`px-2.5 sm:px-3.5 py-1.5 rounded-lg text-[11px] sm:text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                    activeTab === t.id ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <t.icon className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{t.label}</span>
                </button>
              ))}
            </div>

            <button
              onClick={onBack}
              className="hidden sm:flex bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 font-bold px-3.5 py-2 rounded-xl text-xs items-center gap-1.5 shrink-0"
            >
              <Home size={14} /> الرئيسية
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-3 py-4 pb-12">
        {activeTab === 'calculators' && <UnifiedCalculatorsView />}
        {activeTab === 'tables' && <TablesAndConverterView />}
        {activeTab === 'community' && <CommunityProView />}
      </main>
    </div>
  );
}
