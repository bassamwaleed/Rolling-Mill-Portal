import React, { useState, useEffect } from 'react';
import {
  Calculator, Layers, Ruler, MessageCircle, RotateCcw, Activity,
  Gauge, DivideSquare, Maximize2, Circle, ArrowLeftRight, Zap,
  Cpu, Wrench, PlusCircle, ThumbsUp, Flame, Scissors, BookOpen,
  ChevronDown, ChevronUp, Sliders, Search, Award, Sparkles,
  Check, ArrowLeft, Home, ShieldAlert, Cable, BatteryCharging,
  Radio, Square, Percent, Info, Trash2, Scale, Droplets, Compass, Wifi, WifiOff
} from 'lucide-react';

/* ======================================================
   1. البيانات القياسية والجداول (ISO 6935-2 / ES 262)
   ====================================================== */
const REBAR_SPECS = [
  { size: 10, area: 78.5, minW: 0.580, nomW: 0.617, maxW: 0.654, minRib: 0.65, maxLrib: 1.0, color: 'بدون لون' },
  { size: 12, area: 113.0, minW: 0.835, nomW: 0.888, maxW: 0.941, minRib: 0.78, maxLrib: 1.2, color: 'أحمر' },
  { size: 14, area: 154.0, minW: 1.150, nomW: 1.210, maxW: 1.271, minRib: 0.91, maxLrib: 1.4, color: 'أبيض' },
  { size: 16, area: 201.0, minW: 1.501, nomW: 1.580, maxW: 1.659, minRib: 1.04, maxLrib: 1.5, color: 'أزرق' },
  { size: 18, area: 254.0, minW: 1.900, nomW: 2.000, maxW: 2.100, minRib: 1.17, maxLrib: 1.6, color: 'أصفر' },
  { size: 20, area: 314.0, minW: 2.340, nomW: 2.470, maxW: 2.590, minRib: 1.30, maxLrib: 1.8, color: 'بني' },
  { size: 22, area: 380.0, minW: 2.836, nomW: 2.986, maxW: 3.135, minRib: 1.43, maxLrib: 2.0, color: 'رمادي' },
  { size: 25, area: 491.0, minW: 3.696, nomW: 3.850, maxW: 4.004, minRib: 1.62, maxLrib: 2.2, color: 'أسود' },
  { size: 32, area: 804.0, minW: 6.057, nomW: 6.310, maxW: 6.562, minRib: 2.08, maxLrib: 2.7, color: 'أخضر' }
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
   2. عناصر واجهة مساعدة + دالة حساب أبعاد الكاليبر (B × H أو Ø D)
   ====================================================== */
const num = (v) => (Number.isFinite(Number(v)) ? Number(v) : 0);
const fmt = (n, d = 2) => (Number.isFinite(Number(n)) ? Number(n).toFixed(d) : '—');
const inputCls =
  'w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2.5 text-slate-900 font-mono text-sm font-bold focus:border-blue-600 focus:bg-white outline-none transition-colors';

// دالة هندسية تحول (مساحة الممر + شكل الممر) إلى أبعاد فعلية بالمم (عرض × ارتفاع أو قطر) ومعامل الممر (Groove Factor)
const computeGrooveGeometry = (areaMm2, shapeType, gapMm = 3.0) => {
  const A = Math.max(1, num(areaMm2));
  if (shapeType.includes('مبروم') || shapeType.includes('دائري')) {
    const d = Math.sqrt((4 * A) / Math.PI);
    const gf = Math.max(2, d - gapMm);
    return {
      dimText: `Ø ${fmt(d, 1)} مم`,
      width: d,
      height: d,
      grooveFactor: gf,
      maxSafeRed: 22
    };
  }
  if (shapeType.includes('بيضاوي قائد')) {
    // Leader Oval: نسبة العرض للارتفاع ~ 1.85 ، والمساحة = 2/3 * B * H
    const ratio = 1.85;
    const h = Math.sqrt((1.5 * A) / ratio);
    const b = ratio * h;
    const gf = Math.max(2, A / b - gapMm);
    return {
      dimText: `${fmt(b, 1)} × ${fmt(h, 1)} مم`,
      width: b,
      height: h,
      grooveFactor: gf,
      maxSafeRed: 26
    };
  }
  if (shapeType.includes('بيضاوي')) {
    // Oval Pass: نسبة العرض للارتفاع ~ 2.25 ، والمساحة = 2/3 * B * H
    const ratio = 2.25;
    const h = Math.sqrt((1.5 * A) / ratio);
    const b = ratio * h;
    const gf = Math.max(2, A / b - gapMm);
    return {
      dimText: `${fmt(b, 1)} × ${fmt(h, 1)} مم`,
      width: b,
      height: h,
      grooveFactor: gf,
      maxSafeRed: 34
    };
  }
  if (shapeType.includes('صندوقي')) {
    // Box Pass: نسبة العرض للارتفاع ~ 1.15
    const ratio = 1.15;
    const h = Math.sqrt(A / ratio);
    const b = ratio * h;
    const gf = Math.max(3, h - gapMm);
    return {
      dimText: `${fmt(b, 1)} × ${fmt(h, 1)} مم`,
      width: b,
      height: h,
      grooveFactor: gf,
      maxSafeRed: 38
    };
  }
  // مربع أو معين (Square / Diamond)
  const side = Math.sqrt(A);
  const diag = side * 1.414;
  const gf = Math.max(2.5, side * 0.85 - gapMm);
  return {
    dimText: `ضلع ${fmt(side, 1)} مم (قطر ${fmt(diag, 1)})`,
    width: diag,
    height: diag,
    grooveFactor: gf,
    maxSafeRed: 32
  };
};

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

const ToolDetailsExplainer = ({ title, explanation, whenToUse }) => {
  const [showInfo, setShowInfo] = useState(false);

  return (
    <div className="mb-3">
      <button
        type="button"
        onClick={() => setShowInfo(!showInfo)}
        className={`w-full sm:w-auto px-3.5 py-2 rounded-xl text-xs font-black flex items-center justify-center gap-1.5 border transition-all ${
          showInfo
            ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
            : 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100'
        }`}
      >
        <Info size={15} />
        <span>{showInfo ? 'إخفاء تفاصيل وشرح الأداة' : 'اضغط لمعرفة تفاصيل وشرح هذه الأداة'}</span>
        {showInfo ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
      </button>

      {showInfo && (
        <div className="mt-2.5 bg-blue-50/80 border border-blue-200 rounded-2xl p-3.5 text-xs space-y-2 animate-in fade-in duration-200">
          <h4 className="font-black text-blue-950 flex items-center gap-1.5">
            <Info size={14} className="text-blue-600 shrink-0" /> {title || 'فكرة عمل الأداة بالتفصيل:'}
          </h4>
          <p className="text-slate-700 font-bold leading-relaxed">{explanation}</p>
          {whenToUse && (
            <div className="bg-white p-2.5 rounded-xl border border-blue-100 text-slate-700 font-bold">
              <strong className="text-blue-700 block mb-0.5">متى تستخدمها في أرض المصنع؟</strong>
              {whenToUse}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const SolutionStepsBox = ({ formula, steps }) => {
  const [open, setOpen] = useState(false);
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
   3. حاسبة مساحات المقاطع والممرات
   ====================================================== */
const GrooveAndCrossSectionModal = ({ onBack }) => {
  const [shape, setShape] = useState('rect');

  const [rectLen, setRectLen] = useState(50);
  const [rectWid, setRectWid] = useState(10);

  const [circleDia, setCircleDia] = useState(16);

  const [ovalWidth, setOvalWidth] = useState(28);
  const [ovalHeight, setOvalHeight] = useState(12);

  const [boxBottomW, setBoxBottomW] = useState(75);
  const [boxTopW, setBoxTopW] = useState(82);
  const [boxHeight, setBoxHeight] = useState(68);

  const [diaD1, setDiaD1] = useState(48);
  const [diaD2, setDiaD2] = useState(42);

  const SHAPE_GUIDES = {
    rect: {
      title: 'حساب مساحة المستطيل / المربع / الخوصة (طول × عرض)',
      explanation: 'تضرب العرض (أو الطول) في السمك (الارتفاع) بالملليمتر لإيجاد مساحة المقطع بالمم²، ثم تضرب المساحة في الكثافة (0.00785) لإخراج وزن المتر الطولي بالكيلوجرام.',
      whenToUse: 'تُستخدم لحساب مساحة ووزن الخوص الحديدية (مثل خوصة 50×10 أو 40×10) أو لحساب مساحة مقطع البيليت الخام (مثل 130×130 مم).'
    },
    circle: {
      title: 'قانون الدائرة وحساب الممر المبروم أو السيخ',
      explanation: 'تحسب مساحة المقطع الدائري من خلال ضرب (0.7854 × القطر × القطر)، ومنها تحسب وزن المتر الطولي للسيخ أو البار المبروم مباشرة.',
      whenToUse: 'تُستخدم لحساب مساحة مقطع أسياخ حديد التسليح والبارات المبرومة، أو مساحة ممر التشطيب المبروم (Round Pass).'
    },
    oval: {
      title: 'حساب مساحة الممر البيضاوي (Oval Pass)',
      explanation: 'الممر البيضاوي يكون منحني القوسين، وتُحسب مساحته الهندسية في الدرفلة بضرب (ثلثين 2/3 × عرض البيضاوي × ارتفاع البيضاوي).',
      whenToUse: 'تُستخدم في قوائم المتوسط والتشطيب (سلسلة بيضاوي - مبروم).'
    },
    box: {
      title: 'حساب مساحة الممر الصندوقي (Box Pass)',
      explanation: 'الممر الصندوقي له جوانب مائلة لتسهيل خروج الكتلة، فتُحسب مساحته بأخذ متوسط العرض (عرض القاع + عرض الفتحة مقسوماً على 2) ثم ضربه في الارتفاع.',
      whenToUse: 'تُستخدم في أول قوائم التخشين (Roughing Stands 1 & 2) حيث يدخل البيليت المربع في ممر صندوقي لتكسير قشرة الأكسيد وعمل تخفيض كبير.'
    },
    diamond: {
      title: 'حساب مساحة الممر المعين (Diamond Pass)',
      explanation: 'الممر المعين هو مربع مائل على سيفه، وتُحسب مساحته بضرب (القطر الأفقي للممر × القطر الرأسي للممر) ثم قسمة الناتج على 2.',
      whenToUse: 'تُستخدم في سلاسل درفلة (معين - مربع) في مرحلة التخشين.'
    }
  };

  let calcArea = 0;
  let perimeter = 0;
  let eqDia = 0;
  let formulaStr = '';
  let stepsArr = [];

  if (shape === 'rect') {
    const L = num(rectLen);
    const W = num(rectWid);
    calcArea = Math.max(0, L * W);
    perimeter = 2 * (L + W);
    eqDia = Math.sqrt((4 * calcArea) / Math.PI);
    formulaStr = 'مساحة المستطيل أو الخوصة = الطول (العرض) × السمك (الارتفاع)  |  وزن المتر الطولي = المساحة × 0.00785';
    stepsArr = [
      `نضرب الطول في العرض = ${L} مم × ${W} مم = ${fmt(calcArea, 2)} مم²`,
      `محيط المقطع = 2 × (${L} + ${W}) = ${fmt(perimeter, 1)} مم`,
      `وزن المتر الطولي للحديد = ${fmt(calcArea, 2)} × 0.00785 = ${fmt(calcArea * 0.00785, 3)} كجم/متر`
    ];
  } else if (shape === 'circle') {
    const D = num(circleDia);
    calcArea = (Math.PI * D * D) / 4;
    perimeter = Math.PI * D;
    eqDia = D;
    formulaStr = 'مساحة الدائرة = (3.1416 × القطر × القطر) ÷ 4  (أو 0.7854 × مربع القطر)';
    stepsArr = [
      `نربع القطر D = ${D} × ${D} = ${fmt(D * D, 2)}`,
      `نضرب في 3.1416 ونقسم على 4 = (3.1416 × ${fmt(D * D, 2)}) ÷ 4 = ${fmt(calcArea, 2)} مم²`,
      `محيط الدائرة = 3.1416 × ${D} = ${fmt(perimeter, 2)} مم`,
      `وزن المتر الطولي للبار المبروم = ${fmt(calcArea, 2)} × 0.00785 = ${fmt(calcArea * 0.00785, 3)} كجم/متر`
    ];
  } else if (shape === 'oval') {
    const B = num(ovalWidth);
    const H = num(ovalHeight);
    calcArea = (2 / 3) * B * H;
    perimeter = Math.PI * Math.sqrt(2 * (Math.pow(B / 2, 2) + Math.pow(H / 2, 2)));
    eqDia = Math.sqrt((4 * calcArea) / Math.PI);
    formulaStr = 'مساحة الممر البيضاوي (Oval Pass) = (2 ÷ 3) × عرض الممر × ارتفاع الممر';
    stepsArr = [
      `نضرب عرض الممر البيضاوي في ارتفاعه = ${B} × ${H} = ${fmt(B * H, 2)} مم²`,
      `نضرب في معامل القوس البيضاوي (2/3 أي 0.667) = 0.667 × ${fmt(B * H, 2)} = ${fmt(calcArea, 2)} مم²`,
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
    formulaStr = 'مساحة الممر الصندوقي (Box Pass) = متوسط العرض [(عرض القاع + عرض الفتحة) ÷ 2] × الارتفاع';
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
    formulaStr = 'مساحة الممر المعين (Diamond Pass) = (القطر الأفقي × القطر الرأسي) ÷ 2';
    stepsArr = [
      `نضرب القطر الأفقي في القطر الرأسي = ${d1} × ${d2} = ${fmt(d1 * d2, 2)}`,
      `نقسم الناتج على 2 = ${fmt(d1 * d2, 2)} ÷ 2 = ${fmt(calcArea, 2)} مم²`,
      `وزن المتر الطولي = ${fmt(calcArea * 0.00785, 3)} كجم/متر`
    ];
  }

  const meterWeightKg = calcArea * 0.00785;
  const activeGuide = SHAPE_GUIDES[shape];

  return (
    <div className="space-y-4">
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
        <button
          onClick={onBack}
          className="bg-slate-100 hover:bg-slate-200 text-slate-800 px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5"
        >
          <ArrowLeft size={15} className="rotate-180" /> رجوع لكل الأدوات
        </button>
        <span className="text-xs font-black text-blue-700 bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
          حاسبة المساحات والممرات
        </span>
      </div>

      <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm space-y-2.5">
        <label className="text-xs font-black text-slate-700 block">1. اختر شكل المقطع أو الممر:</label>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {[
            ['rect', 'طول × عرض', 'مستطيل / خوصة / مربع'],
            ['circle', 'قانون الدائرة', 'ممر مبروم / سيخ'],
            ['oval', 'ممر بيضاوي', 'Oval Pass'],
            ['box', 'ممر صندوقي', 'Box Pass'],
            ['diamond', 'ممر معين', 'Diamond Pass']
          ].map(([id, mainTitle, sub]) => (
            <button
              key={id}
              type="button"
              onClick={() => setShape(id)}
              className={`p-2.5 rounded-xl border text-right transition-all flex flex-col justify-between ${
                shape === id
                  ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                  : 'bg-slate-50 text-slate-800 border-slate-200 hover:bg-slate-100'
              }`}
            >
              <span className="font-black text-xs block">{mainTitle}</span>
              <span className={`text-[10px] mt-0.5 block ${shape === id ? 'text-blue-100' : 'text-slate-500'}`}>
                {sub}
              </span>
            </button>
          ))}
        </div>
      </div>

      <ToolDetailsExplainer
        title={activeGuide.title}
        explanation={activeGuide.explanation}
        whenToUse={activeGuide.whenToUse}
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-5 bg-white p-4 sm:p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4 h-fit">
          <h3 className="text-sm sm:text-base font-black text-slate-900 border-b border-slate-100 pb-2">
            2. أدخل الأبعاد بالملليمتر (مم)
          </h3>

          {shape === 'rect' && (
            <div className="grid grid-cols-2 gap-3">
              <Field label="الطول / العرض (مم)" value={rectLen} onChange={setRectLen} />
              <Field label="العرض / السمك (مم)" value={rectWid} onChange={setRectWid} />
            </div>
          )}

          {shape === 'circle' && (
            <div>
              <Field label="قطر الدائرة أو الممر المبروم (مم)" value={circleDia} onChange={setCircleDia} step="0.5" />
            </div>
          )}

          {shape === 'oval' && (
            <div className="grid grid-cols-2 gap-3">
              <Field label="عرض البيضاوي (مم)" value={ovalWidth} onChange={setOvalWidth} step="0.5" />
              <Field label="ارتفاع البيضاوي (مم)" value={ovalHeight} onChange={setOvalHeight} step="0.5" />
            </div>
          )}

          {shape === 'box' && (
            <div className="grid grid-cols-2 gap-3">
              <Field label="عرض قاع الصندوق (مم)" value={boxBottomW} onChange={setBoxBottomW} />
              <Field label="عرض فتحة الصندوق (مم)" value={boxTopW} onChange={setBoxTopW} />
              <Field label="ارتفاع الممر الكلي (مم)" value={boxHeight} onChange={setBoxHeight} className="col-span-2" />
            </div>
          )}

          {shape === 'diamond' && (
            <div className="grid grid-cols-2 gap-3">
              <Field label="القطر الأفقي للمعين (مم)" value={diaD1} onChange={setDiaD1} />
              <Field label="القطر الرأسي للمعين (مم)" value={diaD2} onChange={setDiaD2} />
            </div>
          )}
        </div>

        <div className="lg:col-span-7 bg-white p-4 sm:p-5 rounded-2xl border border-blue-200 shadow-sm space-y-4">
          <h3 className="text-sm sm:text-base font-black text-blue-800 border-b border-slate-100 pb-2">
            النتائج الفورية
          </h3>

          <div className="bg-blue-50/70 border border-blue-200 rounded-2xl p-4 text-center">
            <span className="text-xs font-bold text-blue-800 block mb-1">مساحة المقطع الهندسية (Area)</span>
            <span className="text-3xl sm:text-4xl font-black font-mono text-blue-700">
              {fmt(calcArea, 2)} <span className="text-sm">مم²</span>
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            <Stat label="وزن المتر الطولي" value={fmt(meterWeightKg, 3)} unit="كجم/متر" color="text-emerald-700" big />
            <Stat label="محيط المقطع" value={fmt(perimeter, 1)} unit="مم" />
            <Stat label="القطر المكافئ" value={fmt(eqDia, 2)} unit="مم" />
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
          <ArrowLeft size={15} className="rotate-180" /> رجوع لكل الأدوات
        </button>
        <span className="text-xs font-black text-blue-700 bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
          حاسبة المقص الطائر وأسياخ العميل
        </span>
      </div>

      <ToolDetailsExplainer
        title="شرح حاسبة قطعيات المقص الطائر وأسياخ العميل"
        explanation="تحسب لك هذه الأداة في نفس اللحظة كم بار يقطعه المقص الطائر (مثلاً بطول 36م أو 48م) ليرميه على سرير التبريد وكم متر يتبقى في البار الأخير (الذيل)، ثم تحسب كم سيخ تجاري (12م) يخرج للعميل على المقص البارد."
        whenToUse="استخدمها عند بداية الوردية أو عند تغيير وزن المتر الطولي لمعرفة طول البار الأخير وتقليل فضلة القصائر والهالك."
      />

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
                ['custom', 'مقاس خاص / خوصة (يدوي)']
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
   5. حاسبة الباس ديزاين الهندسية (بيضاوي ← مبروم في المتوسط والفنش + أبعاد الكاليبر B×H + اختيار شكل الممر)
   ====================================================== */
const GROOVE_SHAPES_LIST = [
  'صندوقي (Box)',
  'مربع (Square)',
  'بيضاوي (Oval)',
  'مبروم (Round)',
  'بيضاوي قائد (Leader Oval)',
  'مبروم مشرشر (Final Rebar)'
];

const INITIAL_CUSTOM_STANDS = [
  { id: 1, name: 'ق 1 (تخشين)', shape: 'صندوقي (Box)', dw: 455, gr: 8.5, area: 12200 },
  { id: 2, name: 'ق 2 (تخشين)', shape: 'مربع (Square)', dw: 450, gr: 7.2, area: 8800 },
  { id: 3, name: 'ق 3 (تخشين)', shape: 'بيضاوي (Oval)', dw: 440, gr: 6.0, area: 6200 },
  { id: 4, name: 'ق 4 (تخشين)', shape: 'مربع (Square)', dw: 435, gr: 4.8, area: 4400 },
  { id: 5, name: 'ق 5 (متوسط)', shape: 'بيضاوي (Oval)', dw: 365, gr: 3.8, area: 3150 },
  { id: 6, name: 'ق 6 (متوسط)', shape: 'مبروم (Round)', dw: 360, gr: 3.2, area: 2250 },
  { id: 7, name: 'ق 7 (متوسط)', shape: 'بيضاوي (Oval)', dw: 355, gr: 2.6, area: 1600 },
  { id: 8, name: 'ق 8 (متوسط)', shape: 'مبروم (Round)', dw: 350, gr: 2.2, area: 1150 },
  { id: 9, name: 'ق 9 (تشطيب)', shape: 'بيضاوي (Oval)', dw: 318, gr: 1.8, area: 820 },
  { id: 10, name: 'ق 10 (تشطيب)', shape: 'مبروم (Round)', dw: 315, gr: 1.5, area: 560 },
  { id: 11, name: 'ق 11 (تشطيب)', shape: 'بيضاوي قائد (Leader Oval)', dw: 312, gr: 1.25, area: 245 },
  { id: 12, name: 'ق 12 (نهائي)', shape: 'مبروم مشرشر (Final Rebar)', dw: 310, gr: 1.0, area: 201 }
];

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

  // إمكانية تخصيص شكل الممر لأي قائم في الجدول التلقائي
  const [shapeOverrides, setShapeOverrides] = useState({});

  const [flatW, setFlatW] = useState(50);
  const [flatT, setFlatT] = useState(10);
  const [flatSpeed, setFlatSpeed] = useState(2.5);

  const [customBilletArea, setCustomBilletArea] = useState(16900);
  const [customDeliverySpeed, setCustomDeliverySpeed] = useState(11.5);
  const [customStands, setCustomStands] = useState(INITIAL_CUSTOM_STANDS);

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

      // التسلسل القياسي: التخشين (صندوقي/مربع ثم بيضاوي/مربع)، والمتوسط والفنش (بيضاوي ← مبروم بالتناوب حتى النهائي)
      let defaultShape = 'بيضاوي (Oval)';
      if (standNum <= 2) {
        defaultShape = standNum % 2 === 1 ? 'صندوقي (Box)' : 'مربع (Square)';
      } else if (standNum <= rCount) {
        defaultShape = standNum % 2 === 1 ? 'بيضاوي (Oval)' : 'مربع (Square)';
      } else if (standNum === N) {
        defaultShape = 'مبروم مشرشر (Final Rebar)';
      } else if (standNum === N - 1) {
        defaultShape = 'بيضاوي قائد (Leader Oval)';
      } else {
        // في المنطقة المتوسطة والفنش: تناوب عكسي من النهاية لضمان أن ما قبل البيضاوي القائد يكون مبروم، وقبله بيضاوي وهكذا (بيضاوي ← مبروم)
        const stepsFromEnd = N - standNum;
        defaultShape = stepsFromEnd % 2 === 1 ? 'بيضاوي (Oval)' : 'مبروم (Round)';
      }

      const shape = shapeOverrides[standNum] || defaultShape;

      const logStep = totalLogRatio * (weights[idx] / weightSum);
      const nextAreaTotal = idx === N - 1 ? A_total_exit : currentArea / Math.exp(logStep);

      const reductionPct = ((currentArea - nextAreaTotal) / currentArea) * 100;
      const elongFactor = currentArea / nextAreaTotal;

      const isSplitZone = k > 1 && standNum >= N - 1;
      const singleGrooveArea = isSplitZone ? nextAreaTotal / k : nextAreaTotal;

      const estGap = standNum <= rCount ? 4.5 : standNum <= rCount + iCount ? 3.2 : 2.0;
      const geom = computeGrooveGeometry(singleGrooveArea, shape, estGap);

      const rollDe = standNum <= rCount ? 480 : standNum <= rCount + iCount ? 380 : 330;
      const workingDiaDw = Math.max(150, rollDe - geom.grooveFactor);

      const linearSpeedV = Q_total / nextAreaTotal;
      const rollRpm = (linearSpeedV * 60000) / (Math.PI * workingDiaDw);
      const gearRatio = standNum <= rCount ? +(8.5 - idx * 1.1).toFixed(2) : standNum <= rCount + iCount ? 3.2 : 1.4;

      schedule.push({
        standNum,
        zone,
        shape,
        dimText: geom.dimText,
        maxSafeRed: geom.maxSafeRed,
        strandsHere: isSplitZone ? k : 1,
        exitAreaSingle: singleGrooveArea,
        reductionPct,
        elongFactor,
        workingDiaDw,
        gearRatio,
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

  const handleCustomStandUpdate = (index, field, rawVal) => {
    const updated = [...customStands];
    const current = { ...updated[index] };

    if (field === 'redPct') {
      const prevArea = index === 0 ? Math.max(1, num(customBilletArea)) : Math.max(1, num(updated[index - 1].area));
      const clampedRed = Math.max(1, Math.min(85, num(rawVal)));
      current.area = +(prevArea * (1 - clampedRed / 100)).toFixed(1);
    } else {
      current[field] = rawVal;
    }

    updated[index] = current;
    setCustomStands(updated);
  };

  const handleCopyFromAutoSchedule = () => {
    setCustomBilletArea(A_billet);
    setCustomDeliverySpeed(finishSpeed);
    const copied = rebarData.schedule.map((row) => ({
      id: row.standNum,
      name: `ق ${row.standNum}`,
      shape: row.shape,
      dw: +row.workingDiaDw.toFixed(1),
      gr: row.gearRatio,
      area: +row.exitAreaSingle.toFixed(1)
    }));
    setCustomStands(copied);
  };

  const handleAddCustomStand = () => {
    const last = customStands[customStands.length - 1] || { dw: 310, gr: 1.2, area: 201 };
    const nextId = customStands.length + 1;
    setCustomStands([
      ...customStands,
      {
        id: Date.now(),
        name: `ق ${nextId}`,
        shape: nextId % 2 === 1 ? 'بيضاوي (Oval)' : 'مبروم (Round)',
        dw: last.dw,
        gr: last.gr,
        area: +(num(last.area) * 0.85).toFixed(1)
      }
    ]);
  };

  const handleRemoveCustomStand = (idx) => {
    if (customStands.length <= 1) return;
    setCustomStands(customStands.filter((_, i) => i !== idx));
  };

  const lastStandArea = Math.max(1, num(customStands[customStands.length - 1]?.area || 201));
  const customConstantQ = lastStandArea * Math.max(0.1, num(customDeliverySpeed));

  const computedCustomRows = customStands.map((st, idx) => {
    const prevArea = idx === 0 ? Math.max(1, num(customBilletArea)) : Math.max(1, num(customStands[idx - 1].area));
    const curArea = Math.max(1, num(st.area));
    const redPct = ((prevArea - curArea) / prevArea) * 100;
    const elong = prevArea / curArea;
    const geom = computeGrooveGeometry(curArea, st.shape || 'بيضاوي (Oval)', 2.5);
    const dw = Math.max(1, num(st.dw));
    const gr = Math.max(0.1, num(st.gr));
    const speedMps = customConstantQ / curArea;
    const rollRpm = (speedMps * 60000) / (Math.PI * dw);
    const motorRpm = rollRpm * gr;
    return {
      ...st,
      dimText: geom.dimText,
      prevArea,
      redPct,
      elong,
      speedMps,
      rollRpm,
      motorRpm
    };
  });

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm">
        <button
          onClick={onBack}
          className="bg-slate-100 hover:bg-slate-200 text-slate-800 px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5"
        >
          <ArrowLeft size={15} className="rotate-180" /> رجوع لكل الأدوات
        </button>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-1.5 bg-slate-100 p-1 rounded-xl border border-slate-200 w-full sm:w-auto">
          <button
            onClick={() => setMode('rebar')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              mode === 'rebar' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            1. باس ديزاين التسليح (بيضاوي-مبروم)
          </button>
          <button
            onClick={() => setMode('flat')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              mode === 'flat' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            2. باس ديزاين الخوصة
          </button>
          <button
            onClick={() => setMode('custom')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              mode === 'custom' ? 'bg-amber-500 text-slate-950 shadow-sm' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            3. محاكاة بأقطار ومخفضات مخصصة
          </button>
        </div>
      </div>

      <ToolDetailsExplainer
        title="شرح أداة تصميم الممرات (بيضاوي ← مبروم) وأبعاد الكاليبر"
        explanation="يعرض هذا الجدول تدرج الممرات في المنطقة المتوسطة والفنش بنظام (بيضاوي Oval ← مبروم Round) القياسي، ويحسب لكل قائم أبعاد الممر بالملليمتر (العرض × الارتفاع للبيضاوي والصندوقي، أو القطر Ø للمبروم). كما يمكنك تغيير شكل أي ممر من القائمة المنسدلة لترى تأثيره المباشر على الأبعاد والقطر الفعال وسرعة الدرفيل."
        whenToUse="استخدمه لمعرفة مقاسات الكاليبرات (كام × كام مم) وتوزيع السرعات، أو انتقل للوضع رقم (3) لإدخال أقطار الدرافيل ونسب الجيربوكس الفعلية لمصنعك."
      />

      {mode === 'rebar' && (
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
                formula="الممر البيضاوي: المساحة = 2/3 × العرض × الارتفاع  |  الممر المبروم: القطر = جذر (4 × المساحة ÷ 3.1416)"
                steps={[
                  'في مرحلة التخشين (Roughing): يعمل النظام بممرات (صندوقي ← مربع ← بيضاوي ← مربع) بتخفيض عالي لتشكيل البيليت.',
                  'في المنطقة المتوسطة والتشطيب (Intermediate & Finishing): يعمل النظام بتسلسل (بيضاوي Oval ← مبروم Round) بالتناوب لضمان استقرار المعدن ودقة أبعاد السيخ.',
                  'يمكنك الضغط على شكل الممر لأي قائم في الجدول بالأسفل لتغييره ومشاهدة أبعاده الجديدة (كام × كام مم) فوراً.'
                ]}
              />
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm overflow-x-auto">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
              <h4 className="text-sm font-black text-slate-900">
                جدول تدرج الممرات (بيضاوي ← مبروم)، أبعاد الكاليبر (كام × كام مم)، والسرعات
              </h4>
              <div className="flex gap-2">
                {Object.keys(shapeOverrides).length > 0 && (
                  <button
                    type="button"
                    onClick={() => setShapeOverrides({})}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold px-3 py-1.5 rounded-xl text-xs"
                  >
                    استعادة التسلسل الافتراضي
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    handleCopyFromAutoSchedule();
                    setMode('custom');
                  }}
                  className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black px-3 py-1.5 rounded-xl text-xs shadow-sm"
                >
                  فتح الجدول لتعديل الأقطار والمخفضات يدوياً ←
                </button>
              </div>
            </div>
            <table className="w-full text-right text-xs min-w-[820px]">
              <thead className="bg-slate-900 text-white">
                <tr>
                  <th className="p-2.5 rounded-r-lg">القائم</th>
                  <th className="p-2.5">المنطقة</th>
                  <th className="p-2.5">شكل الممر (قابل للتغيير)</th>
                  <th className="p-2.5">أبعاد الممر (عرض×ارتفاع / قطر)</th>
                  <th className="p-2.5">المساحة مم²</th>
                  <th className="p-2.5">التخفيض %</th>
                  <th className="p-2.5">القطر الفعال Dw</th>
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
                    <td className="p-2 font-sans">
                      <select
                        value={row.shape}
                        onChange={(e) => setShapeOverrides({ ...shapeOverrides, [row.standNum]: e.target.value })}
                        className="bg-blue-50 border border-blue-200 text-blue-800 rounded-lg px-2 py-1 text-xs font-bold outline-none cursor-pointer"
                      >
                        {GROOVE_SHAPES_LIST.map((sh) => (
                          <option key={sh} value={sh}>
                            {sh}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="p-2.5 font-sans font-black text-amber-800 bg-amber-50/50">{row.dimText}</td>
                    <td className="p-2.5 text-slate-900 font-bold">{fmt(row.exitAreaSingle, 1)}</td>
                    <td className="p-2.5 text-emerald-700 font-bold">{fmt(row.reductionPct, 1)}%</td>
                    <td className="p-2.5 text-slate-700 font-bold">{fmt(row.workingDiaDw, 1)} مم</td>
                    <td className="p-2.5 text-blue-700 font-black">{fmt(row.linearSpeedV, 2)}</td>
                    <td className="p-2.5 text-slate-900 font-black">{fmt(row.rollRpm, 1)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {mode === 'flat' && (
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

      {mode === 'custom' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-2xl border-2 border-amber-300 shadow-sm space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 pb-2.5">
              <div>
                <h3 className="text-sm sm:text-base font-black text-slate-900">
                  محاكاة الخط بأقطار الدرافيل والمخفضات وأشكال الممرات الفعلية (تعديل حر)
                </h3>
                <p className="text-[11px] text-slate-500 font-bold">
                  غيّر شكل الممر أو القطر الفعال أو نسبة الجيربوكس أو المساحة/التخفيض لأي قائم للتحقق الفوري من الأبعاد والسرعة
                </p>
              </div>
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={handleCopyFromAutoSchedule}
                  className="bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 font-bold px-3 py-1.5 rounded-xl text-xs"
                >
                  نسخ القيم من الباس ديزاين التلقائي
                </button>
                <button
                  type="button"
                  onClick={handleAddCustomStand}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-1.5 rounded-xl text-xs flex items-center gap-1"
                >
                  <PlusCircle size={14} /> + إضافة قائم
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Field
                label="مساحة البيليت الداخلة لأول قائم (مم²)"
                value={customBilletArea}
                onChange={setCustomBilletArea}
              />
              <Field
                label="سرعة خروج آخر قائم المرجعية (م/ث)"
                value={customDeliverySpeed}
                onChange={setCustomDeliverySpeed}
                step="0.2"
              />
              <Stat
                label="ثابت التدفق الحجمي المحسوب (Q)"
                value={fmt(customConstantQ, 0)}
                unit="مم².م/ث"
                color="text-blue-700"
              />
            </div>
          </div>

          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm overflow-x-auto">
            <table className="w-full text-right text-xs min-w-[920px]">
              <thead className="bg-slate-900 text-white">
                <tr>
                  <th className="p-2.5 rounded-r-lg">القائم</th>
                  <th className="p-2.5">شكل الممر</th>
                  <th className="p-2.5">أبعاد الممر (كام×كام مم)</th>
                  <th className="p-2.5">القطر الفعال Dw</th>
                  <th className="p-2.5">الجيربوكس (i)</th>
                  <th className="p-2.5">المساحة (مم²)</th>
                  <th className="p-2.5">التخفيض %</th>
                  <th className="p-2.5">السرعة (م/ث)</th>
                  <th className="p-2.5">لفات الدرفيل</th>
                  <th className="p-2.5">لفات الموتور RPM</th>
                  <th className="p-2.5 rounded-l-lg">حذف</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 font-mono">
                {computedCustomRows.map((row, idx) => (
                  <tr key={row.id || idx} className="hover:bg-amber-50/40">
                    <td className="p-2 font-sans">
                      <input
                        type="text"
                        value={row.name}
                        onChange={(e) => handleCustomStandUpdate(idx, 'name', e.target.value)}
                        className="w-24 bg-slate-50 border border-slate-300 rounded-lg px-2 py-1 text-xs font-black text-slate-900"
                      />
                    </td>
                    <td className="p-2 font-sans">
                      <select
                        value={row.shape || 'بيضاوي (Oval)'}
                        onChange={(e) => handleCustomStandUpdate(idx, 'shape', e.target.value)}
                        className="bg-blue-50 border border-blue-200 text-blue-900 rounded-lg px-2 py-1 text-[11px] font-bold"
                      >
                        {GROOVE_SHAPES_LIST.map((sh) => (
                          <option key={sh} value={sh}>
                            {sh}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="p-2 font-sans font-black text-amber-900 bg-amber-50/50 whitespace-nowrap">
                      {row.dimText}
                    </td>
                    <td className="p-2">
                      <input
                        type="number"
                        step="0.5"
                        value={row.dw}
                        onChange={(e) => handleCustomStandUpdate(idx, 'dw', e.target.value)}
                        className="w-20 bg-amber-50 border-2 border-amber-400 rounded-lg px-2 py-1 text-xs font-black text-slate-900 text-center"
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="number"
                        step="0.05"
                        value={row.gr}
                        onChange={(e) => handleCustomStandUpdate(idx, 'gr', e.target.value)}
                        className="w-20 bg-blue-50 border-2 border-blue-300 rounded-lg px-2 py-1 text-xs font-black text-blue-950 text-center"
                      />
                    </td>
                    <td className="p-2">
                      <input
                        type="number"
                        step="1"
                        value={row.area}
                        onChange={(e) => handleCustomStandUpdate(idx, 'area', e.target.value)}
                        className="w-24 bg-slate-50 border border-slate-300 rounded-lg px-2 py-1 text-xs font-bold text-slate-900 text-center"
                      />
                    </td>
                    <td className="p-2">
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          step="0.5"
                          value={fmt(row.redPct, 1)}
                          onChange={(e) => handleCustomStandUpdate(idx, 'redPct', e.target.value)}
                          className="w-16 bg-emerald-50 border border-emerald-300 rounded-lg px-1.5 py-1 text-xs font-black text-emerald-800 text-center"
                        />
                        <span className="text-emerald-700 font-bold">%</span>
                      </div>
                    </td>
                    <td className="p-2 text-blue-700 font-black text-sm">{fmt(row.speedMps, 2)}</td>
                    <td className="p-2 text-slate-900 font-bold">{fmt(row.rollRpm, 1)}</td>
                    <td className="p-2">
                      <span className="bg-slate-900 text-amber-400 px-2.5 py-1 rounded-lg font-black text-xs inline-block whitespace-nowrap">
                        {fmt(row.motorRpm, 0)} RPM
                      </span>
                    </td>
                    <td className="p-2">
                      <button
                        type="button"
                        onClick={() => handleRemoveCustomStand(idx)}
                        className="text-red-500 hover:text-red-700 p-1"
                        title="حذف القائم"
                      >
                        <Trash2 size={15} />
                      </button>
                    </td>
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
   6. نافذة محول الوحدات وجدول المواصفات
   ====================================================== */
const UnitConverterModal = ({ onBack }) => {
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
    <div className="space-y-4">
      <div className="bg-white p-3.5 rounded-2xl border border-slate-200 shadow-sm flex items-center justify-between">
        <button
          onClick={onBack}
          className="bg-slate-100 hover:bg-slate-200 text-slate-800 px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5"
        >
          <ArrowLeft size={15} className="rotate-180" /> رجوع لكل الأدوات
        </button>
        <span className="text-xs font-black text-blue-700 bg-blue-50 px-3 py-1 rounded-full border border-blue-200">
          محول الوحدات والجداول القياسية
        </span>
      </div>

      <ToolDetailsExplainer
        title="شرح محول الوحدات وجدول الأوزان القياسية"
        explanation="يحول لك فوراً بين وحدات السرعة (م/ث إلى كم/س أو م/دقيقة)، والأوزان، والقدرات (حصان إلى كيلووات)، ويعرض بالأسفل جدول الأوزان القياسية المسموحة لحديد التسليح."
        whenToUse="استخدمه عند مراجعة أوزان العينات مع قسم الجودة للتأكد من وقوع وزن المتر الطولي بين الحد الأدنى والحد الأقصى للمواصفة."
      />

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
   7. موسوعة كل القوانين والأدوات الموحدة (شاملة قسم معمل الجودة والاختبارات الجديد)
   ====================================================== */
const ALL_CALCULATORS = [
  {
    id: 'special_pass_design',
    title: 'تصميم الممرات والأقطار',
    shortTag: 'بيضاوي-مبروم + محاكي الأقطار',
    desc: 'جدول الباس ديزاين بنظام (بيضاوي ← مبروم) مع أبعاد الكاليبر ومحاكي الأقطار.',
    icon: Layers,
    group: 'باس ديزاين وإنتاجية',
    isSpecial: true
  },
  {
    id: 'special_groove_areas',
    title: 'مساحات الممرات والقطاعات',
    shortTag: 'الدائرة والمستطيل والبيضاوي',
    desc: 'حساب مساحة المقطع من الطول والعرض أو قانون الدائرة والبيضاوي مع وزن المتر.',
    icon: Square,
    group: 'باس ديزاين وإنتاجية',
    isSpecial: true
  },
  {
    id: 'special_bars_yield',
    title: 'المقص الطائر وأسياخ العميل',
    shortTag: 'قطعيات 36م/48م و 12م',
    desc: 'نتيجة المقص الطائر وأسياخ العميل معاً مع تحكم يدوي في وزن المتر.',
    icon: Scissors,
    group: 'باس ديزاين وإنتاجية',
    isSpecial: true
  },
  {
    id: 'special_unit_converter',
    title: 'محول الوحدات وجدول الأوزان',
    shortTag: 'التحويلات والمواصفات',
    desc: 'تحويل وحدات السرعة والقدرة والأوزان مع جدول أوزان حديد التسليح.',
    icon: Ruler,
    group: 'معمل الجودة والاختبارات',
    isSpecial: true
  },

  // --- قسم معمل الجودة والاختبارات (Quality Control & Lab Tests) ---
  {
    id: 'q_meter_weight',
    title: 'وزن المتر الطولي (جرام ومتر)',
    shortTag: 'فحص وزن العينة والمواصفة',
    desc: 'احسب وزن المتر الطولي من وزن العينة بالجرام وطولها بالمتر مع مطابقة المواصفة.',
    details: 'يقوم فني الجودة بقطع عينة من السيخ ووزنها على الميزان الحساس بالجرام وقياس طولها بالمتر (مثلاً 0.5 متر أو 1 متر)، فتحسب هذه الأداة وزن المتر الطولي الفعلي بالكيلوجرام وتقارنه بالحد الأدنى والأقصى المسموح للمقاس في المواصفة القياسية.',
    whenToUse: 'تُستخدم عند سحب عينة من سرير التبريد للتأكد من مطابقة وزن السيخ وضبط خلوص القائم النهائي.',
    icon: Scale,
    group: 'معمل الجودة والاختبارات',
    formula: 'وزن المتر الطولي (كجم/م) = (وزن العينة بالجرام ÷ 1000) ÷ طول العينة بالمتر',
    inputs: [
      { k: 'grams', l: 'وزن القطعة على الميزان (بالجرام g)', def: 785 },
      { k: 'lenM', l: 'طول القطعة المقاس (بالمتر m مثلاً 0.5 أو 1)', def: 0.5 },
      { k: 'nomSize', l: 'مقاس السيخ للمقارنة بالمواصفة (مم)', def: 16 }
    ],
    calc: (v) => {
      const g = Math.max(1, num(v.grams));
      const l = Math.max(0.05, num(v.lenM));
      const sz = Math.round(num(v.nomSize));
      const kgPerM = g / 1000 / l;
      const effDia = 12.74 * Math.sqrt(kgPerM);
      const spec = REBAR_SPECS.find((r) => r.size === sz) || REBAR_SPECS[3];
      const devPct = ((kgPerM - spec.nomW) / spec.nomW) * 100;
      const isOk = kgPerM >= spec.minW && kgPerM <= spec.maxW;

      return {
        results: {
          'وزن المتر الطولي الفعلي': `${fmt(kgPerM, 3)} كجم/متر`,
          'الوزن القياسي للمقاس (الاسمي)': `${spec.nomW} كجم/م (${spec.minW} إلى ${spec.maxW})`,
          'نسبة الانحراف عن الاسمي': `${devPct >= 0 ? '+' : ''}${fmt(devPct, 2)}%`,
          'حالة مطابقة المواصفة': isOk ? 'مطابق للمواصفة القياسية ✅' : kgPerM < spec.minW ? 'وزن ناقص تحت المسموح ❌' : 'وزن ثقيل فوق المسموح ⚠️',
          'القطر الفعلي المكافئ للعينة': `${fmt(effDia, 2)} مم`
        },
        steps: [
          `نحول وزن العينة من جرام إلى كيلوجرام = ${g} ÷ 1000 = ${fmt(g / 1000, 3)} كجم`,
          `نقسم الوزن بالكيلوجرام على طول العينة (${l} متر) = ${fmt(g / 1000, 3)} ÷ ${l} = ${fmt(kgPerM, 3)} كجم/متر`,
          `بمقارنة الناتج بمدى مقاس ${spec.size} مم (${spec.minW} إلى ${spec.maxW} كجم/م): العينة ${isOk ? 'مطابقة' : 'خارج حدود المواصفة'}`
        ]
      };
    }
  },
  {
    id: 'q_tensile_test',
    title: 'اختبار الشد والاستطالة (المعمل)',
    shortTag: 'الإجهاد والشد والممطولية',
    desc: 'حساب إجهاد الخضوع والشد الأقصى ونسبة الاستطالة المئوية لعينة المعمل.',
    details: 'تحول قراءة ماكينة الشد الهيدروليكية في معمل الجودة (حمل الخضوع وحمل الكسر بالكيلونيوتن kN) إلى إجهاد بالميجاباسكال (MPa)، وتحسب نسبة الممطولية (TS/YS) ونسبة الاستطالة المئوية بعد الكسر.',
    whenToUse: 'تُستخدم في معمل مراقبة الجودة للحكم على رتبة الحديد (مثل B500DWR أو B400).',
    icon: Activity,
    group: 'معمل الجودة والاختبارات',
    formula: 'الإجهاد (MPa) = (الحمل بالكيلونيوتن × 1000) ÷ المساحة الفعلية  |  الاستطالة % = ((الطول بعد الكسر - الطول الأصلي) ÷ الطول الأصلي) × 100',
    inputs: [
      { k: 'd', l: 'قطر السيخ الاسمي أو الفعلي (مم)', def: 16 },
      { k: 'fy', l: 'حمل الخضوع من ماكينة الشد Fy (kN)', def: 108 },
      { k: 'fu', l: 'أقصى حمل شد قبل الكسر Fu (kN)', def: 132 },
      { k: 'l0', l: 'طول القياس الأصلي قبل الشد L0 (5×القطر مم)', def: 80 },
      { k: 'lu', l: 'طول القياس بعد الكسر Lu (مم)', def: 94.5 }
    ],
    calc: (v) => {
      const d = Math.max(1, num(v.d));
      const area = (Math.PI * d * d) / 4;
      const fy = num(v.fy);
      const fu = num(v.fu);
      const l0 = Math.max(1, num(v.l0));
      const lu = Math.max(l0, num(v.lu));

      const yieldMpa = (fy * 1000) / area;
      const tensileMpa = (fu * 1000) / area;
      const ductRatio = yieldMpa > 0 ? tensileMpa / yieldMpa : 0;
      const elongPct = ((lu - l0) / l0) * 100;
      const passB500 = yieldMpa >= 500 && ductRatio >= 1.15 && elongPct >= 14;

      return {
        results: {
          'مساحة مقطع العينة (A0)': `${fmt(area, 1)} مم²`,
          'إجهاد الخضوع (Yield Strength ReH)': `${fmt(yieldMpa, 1)} MPa`,
          'إجهاد الشد الأقصى (Tensile Rm)': `${fmt(tensileMpa, 1)} MPa`,
          'نسبة الممطولية (Rm / ReH)': `${fmt(ductRatio, 2)} (${ductRatio >= 1.15 ? 'ممتازة ≥ 1.15' : 'منخفضة'})`,
          'نسبة الاستطالة بعد الكسر (A%)': `${fmt(elongPct, 1)}% (${passB500 ? 'مطابق B500DWR ✅' : 'راجع شروط الرتبة'})`
        },
        steps: [
          `مساحة مقطع العينة = 0.7854 × ${d} × ${d} = ${fmt(area, 1)} مم²`,
          `إجهاد الخضوع = (${fy} × 1000) ÷ ${fmt(area, 1)} = ${fmt(yieldMpa, 1)} MPa`,
          `إجهاد الشد الأقصى = (${fu} × 1000) ÷ ${fmt(area, 1)} = ${fmt(tensileMpa, 1)} MPa`,
          `نسبة الاستطالة المئوية = ((${lu} - ${l0}) ÷ ${l0}) × 100 = ${fmt(elongPct, 1)}%`
        ]
      };
    }
  },
  {
    id: 'q_qtb_tempcore',
    title: 'مساعد ضبط مياه التبريد (QTB)',
    shortTag: 'ضبط الإجهاد والـ Tempcore',
    desc: 'حساب تعديل تدفق مياه صندوق التبريد (QTB) لضبط إجهاد الخضوع للسيخ.',
    details: 'في عملية الـ Tempcore، إذا خرج إجهاد الخضوع في المعمل أعلى أو أقل من المستهدف، تساعدك هذه الأداة في حساب التعديل المطلوب في كمية مياه صندوق التبريد ودرجة حرارة خروج السيخ على سرير التبريد.',
    whenToUse: 'تُستخدم بواسطة مشغل الكنترول ومهندس الجودة عند ضبط صمامات مياه الـ QTB.',
    icon: Droplets,
    group: 'معمل الجودة والاختبارات',
    formula: 'كل تغير 10°C في حرارة المراجعة الذاتية للسيخ يغير إجهاد الخضوع بحوالي 20 إلى 25 MPa',
    inputs: [
      { k: 'curYield', l: 'إجهاد الخضوع الحالي في المعمل (MPa)', def: 565 },
      { k: 'targetYield', l: 'إجهاد الخضوع المستهدف (MPa)', def: 530 },
      { k: 'curFlow', l: 'تدفق مياه التبريد الحالي (m³/h)', def: 410 },
      { k: 'curTemp', l: 'حرارة السيخ بعد الصندوق حالياً (°C)', def: 610 }
    ],
    calc: (v) => {
      const curY = num(v.curYield);
      const tarY = num(v.targetYield);
      const curF = Math.max(10, num(v.curFlow));
      const curT = num(v.curTemp);
      const diffMpa = tarY - curY;
      // لرفع الإجهاد نزود المياه ونخفض حرارة الخروج، ولخفض الإجهاد نقلل المياه
      const flowChangePct = (diffMpa / 22) * 4.5;
      const newFlow = Math.max(0, curF * (1 + flowChangePct / 100));
      const targetTemp = curT - diffMpa / 2.2;

      return {
        results: {
          'فرق الإجهاد المطلوب تعويضه': `${diffMpa >= 0 ? '+' : ''}${fmt(diffMpa, 0)} MPa`,
          'تدفق مياه QTB المقترح الجديد': `${fmt(newFlow, 0)} m³/h (${flowChangePct >= 0 ? 'زيادة' : 'تقليل'} ${fmt(Math.abs(flowChangePct), 1)}%)`,
          'حرارة السيخ المستهدفة بعد الصندوق': `${fmt(targetTemp, 0)} °C`
        },
        steps: [
          `الفرق بين الإجهاد المستهدف والحالي = ${tarY} - ${curY} = ${diffMpa} MPa`,
          diffMpa < 0
            ? `بما أن الإجهاد الحالي عالي (ناشف)، نحتاج لتقليل مياه التبريد بنسبة ${fmt(Math.abs(flowChangePct), 1)}% لترتفع حرارة مراجعة السيخ إلى ${fmt(targetTemp, 0)}°C.`
            : `بما أن الإجهاد الحالي منخفض، نحتاج لزيادة مياه التبريد بنسبة ${fmt(Math.abs(flowChangePct), 1)}% لتنخفض حرارة السيخ بعد الصندوق إلى ${fmt(targetTemp, 0)}°C.`
        ]
      };
    }
  },
  {
    id: 'q_ovality_ribs',
    title: 'فحص البيضاوية والشرشرة والشنب',
    shortTag: 'فحص أبعاد القدمة Ovality',
    desc: 'فحص استدارة البار، ارتفاع الشرشرة، والنتوء الطولي (الشنب) بالقدمة.',
    details: 'يدخل فني الدرفلة أو الجودة قراءتي قطر السيخ في اتجاهين متعامدين (D1 و D2) وارتفاع الشرشرة والشنب، فتحسب الأداة قيمة البيضاوية (Ovality) وتقارن ارتفاع الشنب بالحد المسموح.',
    whenToUse: 'تُستخدم أمام القائم النهائي مباشرة بعد سحب عينة وفحصها بالقدمة ذات الورنية.',
    icon: Compass,
    group: 'معمل الجودة والاختبارات',
    formula: 'البيضاوية (Ovality) = |القطر الأول D1 - القطر الثاني D2|',
    inputs: [
      { k: 'size', l: 'المقاس الاسمي للسيخ (مم)', def: 16 },
      { k: 'd1', l: 'قراءة القطر عند الشنب D1 (مم)', def: 16.2 },
      { k: 'd2', l: 'قراءة القطر العمودي (البطن) D2 (مم)', def: 15.6 },
      { k: 'ribH', l: 'ارتفاع الشرشرة العرضية المقاس (مم)', def: 1.15 }
    ],
    calc: (v) => {
      const sz = Math.round(num(v.size));
      const d1 = num(v.d1);
      const d2 = num(v.d2);
      const ribH = num(v.ribH);
      const spec = REBAR_SPECS.find((r) => r.size === sz) || REBAR_SPECS[3];
      const ovality = Math.abs(d1 - d2);
      const avgCore = (d1 + d2) / 2;
      const ribOk = ribH >= spec.minRib;
      const ovalOk = ovality <= spec.maxLrib;

      return {
        results: {
          'قيمة البيضاوية (فرق القطرين)': `${fmt(ovality, 2)} مم (${ovalOk ? 'مقبول ✅' : 'بيضاوية/شنب عالي ⚠️'})`,
          'متوسط قطر القلب (Core Dia)': `${fmt(avgCore, 2)} مم`,
          'حالة ارتفاع الشرشرة': `${ribH} مم (${ribOk ? `مطابق ≥ ${spec.minRib} مم ✅` : `واطي أقل من ${spec.minRib} مم ❌`})`
        },
        steps: [
          `الفرق بين القطرين المتعامدين = |${d1} - ${d2}| = ${fmt(ovality, 2)} مم`,
          `أقل ارتفاع شرشرة مسموح لمقاس ${spec.size} مم هو ${spec.minRib} مم ← القراءة الحالية (${ribH} مم) ${ribOk ? 'سليمة' : 'تحتاج مراجعة الجاب أو الممر'}`
        ]
      };
    }
  },

  // --- باقي الحاسبات الهندسية ---
  {
    id: 'c_billet_yield_scrap',
    title: 'يلد الهالك في الكتلة كلها',
    shortTag: 'الإدرار والفواقد %',
    desc: 'حساب إجمالي وزن ونسبة الهالك (أكسيد الفرن + المقصات + القصائر) والوزن الصافي.',
    details: 'تقوم هذه الأداة بجمع كل الفواقد التي تخرج من الكتلة الواحدة (قشور الأكسيد في الفرن + قطعية الرأس والذيل على المقصات + القصائر أو الكعبلة) وتطرحها من وزن البيليت الأصلي لتعطيك الوزن الصافي ونسبة الإدرار المئوية (Yield %) ونسبة الهالك.',
    whenToUse: 'تُستخدم لحساب كفاءة الوردية أو معرفة كم كيلوجرام يضيع من كل كتلة.',
    icon: Percent,
    group: 'باس ديزاين وإنتاجية',
    formula: 'الوزن الصافي = وزن الكتلة - إجمالي الهوالك  |  نسبة الإدرار (Yield %) = (الوزن الصافي ÷ وزن الكتلة) × 100',
    inputs: [
      { k: 'wBillet', l: 'وزن الكتلة (البيليت) الكلي (كجم)', def: 1592 },
      { k: 'scalePct', l: 'نسبة فاقد أكسيد الفرن Scale (%)', def: 1.5 },
      { k: 'cropKg', l: 'وزن قطعيات الهيد والديل للمقصات (كجم)', def: 12 },
      { k: 'shortKg', l: 'وزن هالك القصائر أو الكعبلة في الكتلة (كجم)', def: 18 }
    ],
    calc: (v) => {
      const wTotal = Math.max(1, num(v.wBillet));
      const scalePct = Math.max(0, num(v.scalePct));
      const scaleKg = (wTotal * scalePct) / 100;
      const cropKg = Math.max(0, num(v.cropKg));
      const shortKg = Math.max(0, num(v.shortKg));

      const totalScrapKg = scaleKg + cropKg + shortKg;
      const netGoodKg = Math.max(0, wTotal - totalScrapKg);
      const yieldPct = (netGoodKg / wTotal) * 100;
      const scrapPct = (totalScrapKg / wTotal) * 100;

      return {
        results: {
          'إجمالي وزن الهالك في الكتلة': `${fmt(totalScrapKg, 2)} كجم`,
          'وزن المنتج الصافي السليم': `${fmt(netGoodKg, 2)} كجم`,
          'نسبة الإدرار الصافي (Yield %)': `${fmt(yieldPct, 2)}%`,
          'نسبة الهالك الكلية من الكتلة': `${fmt(scrapPct, 2)}%`
        },
        steps: [
          `وزن فاقد أكسيد الفرن (${scalePct}%) = (${wTotal} × ${scalePct}) ÷ 100 = ${fmt(scaleKg, 2)} كجم`,
          `نجمع كل الهوالك في الكتلة = ${fmt(scaleKg, 2)} + ${cropKg} + ${shortKg} = ${fmt(totalScrapKg, 2)} كجم هالك`,
          `الوزن الصافي السليم = ${wTotal} - ${fmt(totalScrapKg, 2)} = ${fmt(netGoodKg, 2)} كجم`,
          `نسبة الإدرار (Yield) = (${fmt(netGoodKg, 2)} ÷ ${wTotal}) × 100 = ${fmt(yieldPct, 2)}%`
        ]
      };
    }
  },
  {
    id: 'c_rect_area',
    title: 'مساحة المقطع (طول × عرض)',
    shortTag: 'المساحة ووزن المتر',
    desc: 'أدخل الطول والسمك بالملليمتر لحساب المساحة بالمم² ووزن المتر فوراً.',
    details: 'تحسب مساحة أي مقطع مستطيل أو مربع (بيليت أو خوصة) بضرب الطول في العرض، ثم تضرب المساحة في 0.00785 لإيجاد وزن المتر الطولي بالكيلوجرام.',
    whenToUse: 'تُستخدم عند قياس أبعاد العينة بالقدمة ذات الورنية لمعرفة مساحتها ووزن مترها فوراً.',
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
          `وزن المتر الطولي = ${fmt(area, 2)} × 0.00785 = ${fmt(weight, 3)} كجم/متر`
        ]
      };
    }
  },
  {
    id: 'c_circle_area',
    title: 'قانون الدائرة ومساحة الممر',
    shortTag: 'مساحة الدائرة ووزنها',
    desc: 'أدخل قطر الدائرة أو السيخ بالمم لحساب مساحة المقطع ووزن المتر.',
    details: 'تطبق قانون مساحة الدائرة الهندسي (3.1416 × نصف القطر تربيع) لإيجاد مساحة مقطع السيخ الدائري ووزن المتر الطولي.',
    whenToUse: 'تُستخدم لحساب مساحة البار المبروم أو الممر الدائري النهائي.',
    icon: Circle,
    group: 'درفلة وسرعات',
    formula: 'مساحة الدائرة (مم²) = (3.1416 × القطر × القطر) ÷ 4',
    inputs: [{ k: 'd', l: 'قطر الدائرة أو الممر المبروم (مم)', def: 16 }],
    calc: (v) => {
      const d = num(v.d);
      const area = (Math.PI * d * d) / 4;
      const weight = area * 0.00785;
      return {
        results: {
          'مساحة الدائرة الكاملة': `${fmt(area, 2)} مم²`,
          'وزن المتر الطولي للبار المبروم': `${fmt(weight, 3)} كجم/متر`,
          'محيط الدائرة': `${fmt(Math.PI * d, 2)} مم`
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
    id: 'c1',
    title: 'السرعة الخطية للمعدن',
    shortTag: 'متر / ثانية',
    desc: 'حساب سرعة خروج المعدن من القطر الفعال وعدد لفات الدرفيل.',
    details: 'تحسب سرعة جريان السيخ بالمتر في الثانية الواحدة بناءً على القطر الفعال للدرفيل وسرعة دورانه (RPM).',
    whenToUse: 'تُستخدم لمعرفة سرعة خروج المعدن عند أي قائم ومطابقتها مع القائم الذي يليه.',
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
          `محيط الدرفيل بالمتر = (3.1416 × ${d} مم) ÷ 1000 = ${fmt((Math.PI * d) / 1000, 3)} متر`,
          `السرعة بالمتر/ثانية = (${fmt((Math.PI * d) / 1000, 3)} × ${n}) ÷ 60 = ${fmt(res, 2)} م/ث`
        ]
      };
    }
  },
  {
    id: 'c2',
    title: 'عدد لفات الدرفيل (RPM)',
    shortTag: 'لفات الدرفيل',
    desc: 'إيجاد لفات الدرفيل المطلوبة لتحقيق سرعة خطية محددة للمعدن.',
    details: 'عكس حاسبة السرعة الخطية؛ تعطيها السرعة التي تريد أن يخرج بها المعدن (م/ث) وقطر الدرفيل، فتحسب لك كم لفة في الدقيقة يجب أن يدورها الدرفيل.',
    whenToUse: 'تُستخدم عند تعويض نقص قطر الدرفيل بعد خرطه في المخرطة للحفاظ على نفس سرعة الخط.',
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
          `نحول السرعة إلى مم/دقيقة = ${vel} × 60000 = ${fmt(vel * 60000, 0)}`,
          `نقسم على محيط الدرفيل (3.1416 × ${d}) = ${fmt(rpm, 1)} لفة/دقيقة`
        ]
      };
    }
  },
  {
    id: 'c3',
    title: 'لفات الموتور والجيربوكس',
    shortTag: 'Motor RPM',
    desc: 'حساب RPM الموتور من نسبة الجيربوكس وإضافة نسبة الـ Over Speed.',
    details: 'تحسب السرعة التي يجب ضبط إنفرتر الموتور عليها عن طريق ضرب لفات الدرفيل في نسبة تخفيض صندوق التروس (Gear Ratio).',
    whenToUse: 'تُستخدم لضبط سرعة المواتير على شاشة الـ WinCC أو الـ HMI في غرفة التحكم.',
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
          `لفات الموتور = ${nr} × ${gr} = ${fmt(nm, 1)} لفة/دقيقة`,
          `شاملة Over Speed (${over}%) = ${fmt(nmOver, 1)} لفة/دقيقة`
        ]
      };
    }
  },
  {
    id: 'c4',
    title: 'القطر الفعال ومعامل الممر',
    shortTag: 'Working Dia Dw',
    desc: 'حساب القطر الفعال للدرفيل من مساحة وعرض الممر وخلوص الجاب.',
    details: 'بما أن الممر محفور داخل الدرفيل، فإن القطر الذي يدفع المعدن فعلياً (القطر الفعال Dw) يكون أصغر من القطر الخارجي للدرفيل بمقدار يسمى معامل الممر (Groove Factor).',
    whenToUse: 'تُستخدم لإدخال القطر الفعال الصحيح في شاشة الكنترول بعد تغيير الدرفيل أو تغيير الممر.',
    icon: Circle,
    group: 'درفلة وسرعات',
    formula: 'معامل الممر = (مساحة الممر ÷ عرض الممر) - الجاب  |  القطر الفعال = القطر الخارجي - معامل الممر',
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
          `معامل الممر = (${area} ÷ ${w}) - ${gap} = ${fmt(gf, 2)} مم`,
          `القطر الفعال الشغال = ${de} - ${fmt(gf, 2)} = ${fmt(dw, 2)} مم`
        ]
      };
    }
  },
  {
    id: 'c5',
    title: 'نسبة التخفيض والاستطالة',
    shortTag: 'Reduction %',
    desc: 'حساب النسبة المئوية للتخفيض ومقدار استطالة المعدن في الممر.',
    details: 'تحسب نسبة العصر (التخفيض في المساحة) التي يقوم بها القائم، وكم مرة زاد طول السيخ بعد خروجه من القائم (معامل الاستطالة).',
    whenToUse: 'تُستخدم للتأكد من عدم تحميل القائم بنسبة تخفيض أعلى من المسموح.',
    icon: DivideSquare,
    group: 'درفلة وسرعات',
    formula: 'نسبة التخفيض % = ((مساحة الدخول - مساحة الخروج) ÷ مساحة الدخول) × 100',
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
          `نسبة التخفيض = ((${a1} - ${a2}) ÷ ${a1}) × 100 = ${fmt(red, 2)}%`,
          `معامل الاستطالة = ${a1} ÷ ${a2} = ${fmt(lam, 3)}`
        ]
      };
    }
  },
  {
    id: 'c6',
    title: 'تزامن القائم التالي (ثبات الحجم)',
    shortTag: 'A1 × V1 = A2 × V2',
    desc: 'حساب سرعة القائم التالي لمنع حدوث شد أو انضغاط (لوب).',
    details: 'تطبق قاعدة اتزان الكتلة (كمية المعدن الداخلة للقائم تساوي الخارجة منه) لحساب السرعة المضبوطة للقائم التالي.',
    whenToUse: 'تُستخدم لضبط التزامن بين قائمين متتاليين ومنع الشد أو الكعبلة.',
    icon: Layers,
    group: 'درفلة وسرعات',
    formula: 'سرعة القائم الثاني = (مساحة الأول × سرعة الأول) ÷ مساحة الثاني',
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
          `ثابت التدفق = ${a1} × ${v1} = ${fmt(q, 1)}`,
          `سرعة القائم الثاني = ${fmt(q, 1)} ÷ ${a2} = ${fmt(v2, 2)} م/ث`
        ]
      };
    }
  },
  {
    id: 'a1',
    title: 'مسافة رمي الأبرون والعلب',
    shortTag: 'سرير التبريد V²/8',
    desc: 'حساب عدد العلب المغلقة لفرملة السيخ على الأبرون قبل سرير التبريد.',
    details: 'تحسب المسافة (عدد العلب المغلقة بطول 1 متر للعلبة) اللازمة لفرملة السيخ القادم من آخر قائم حتى يتوقف في مكانه الصحيح على سرير التبريد.',
    whenToUse: 'تُستخدم عند زيادة سرعة الخط لضبط مسافة رمي الأسياخ على الفرش.',
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
        steps: [`عدد العلب المغلقة = (${vel} × ${vel}) ÷ 8 = ${fmt(xStd, 1)} علبة`]
      };
    }
  },
  {
    id: 'a2',
    title: 'ضبط ارتفاع بكر اللوبر',
    shortTag: 'الثابت والمتحرك',
    desc: 'حساب مستوى البكرة الثابتة والبكرة المتحركة (Kicker) للوبر.',
    details: 'تحسب الارتفاع الصحيح لبكر اللوبر الثابت والمتحرك عن قاعدة اللوبر لضمان دخول البار في سنتر الدليل التالي دون احتكاك.',
    whenToUse: 'تُستخدم مع فنيي الميكانيكا عند صيانة أو معايرة اللوبر.',
    icon: Sliders,
    group: 'أتمتة وفنش',
    formula: 'البكرة الثابتة = ارتفاع السنتر + نصف قطر البار  |  البكرة المتحركة = الثابتة + ثلثها',
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
          `البكرة الثابتة = ${x} + ${r} = ${fmt(h, 1)} مم`,
          `البكرة المتحركة = ${fmt(h, 1)} + (${fmt(h, 1)} ÷ 3) = ${fmt(y, 1)} مم`
        ]
      };
    }
  },
  {
    id: 'e_cable',
    title: 'اختيار كابل الموتور',
    shortTag: 'مقاس الكابل وهبوط الجهد',
    desc: 'تحديد مقاس كابل النحاس المناسب بالمم² للموتور وفحص هبوط الجهد.',
    details: 'تحسب أمبير الحمل الكامل للموتور، وتضيف معامل أمان 25%، ثم تختار لك مقاس كابل النحاس القياسي وتفحص نسبة هبوط الجهد حسب طول الكابل.',
    whenToUse: 'تُستخدم عند تأسيس أو تغيير كابل باور لأي موتور في المصنع.',
    icon: Cable,
    group: 'قوى وكهرباء',
    formula: 'تيار تصميم الكابل = 1.25 × أمبير الموتور الكامل',
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
          'مقاس كابل النحاس المناسب': parallelCount === 1 ? `3 × ${chosen.size} مم²` : `${parallelCount} كابلات (3 × ${chosen.size} مم²)`,
          'هبوط الجهد عند نهاية الكابل': `${fmt(vDropPct, 2)}% (${isDropSafe ? 'آمن أقل من 5%' : 'يفضل المقاس الأكبر'})`
        },
        steps: [
          `أمبير الموتور = ${fmt(iFl, 1)} أمبير`,
          `أمبير تصميم الكابل = ${fmt(iDesign, 1)} أمبير ← كابل ${chosen.size} مم²`
        ]
      };
    }
  },
  {
    id: 'e_protection',
    title: 'القاطع والكونتاكتور والأوفرلود',
    shortTag: 'مباشر وستار/دلتا',
    desc: 'حساب سعة القاطع MCCB والكونتاكتور ورينج الأوفرلود للموتور.',
    details: 'تحسب سعة القاطع الرئيسي ومقاسات الكونتاكتورات والأوفرلود سواء كانت الدائرة تعمل بنظام التشغيل المباشر (DOL) أو ستار/دلتا.',
    whenToUse: 'تُستخدم عند تجميع لوحة باور أو استبدال كونتاكتور أو أوفرلود تالف.',
    icon: ShieldAlert,
    group: 'قوى وكهرباء',
    formula: 'ستار/دلتا: كونتاكتور الرئيسي والدلتا والأوفرلود = 58% من أمبير الموتور، والستار = 34%',
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
          'القاطع الرئيسي (MCCB)': `${fmt(cbAmp, 0)} A`,
          'تشغيل مباشر (DOL)': `كونتاكتور ${fmt(inAmp * 1.2, 0)}A | أوفرلود ${fmt(inAmp, 1)}A`,
          'ستار / دلتا (Star/Delta)': `رئيسي ودلتا: ${fmt(sdMainDelta, 0)}A | ستار: ${fmt(sdStar, 0)}A | أوفرلود: ${fmt(sdMainDelta, 1)}A`
        },
        steps: [`أمبير الموتور = ${fmt(inAmp, 1)}A | قاطع الحماية = ${fmt(cbAmp, 0)}A`]
      };
    }
  }
];

const UnifiedCalculatorsView = () => {
  const [selectedGroup, setSelectedGroup] = useState('الكل');
  const [activeCalcId, setActiveCalcId] = useState(null);
  const [vals, setVals] = useState({});

  const groups = ['الكل', 'معمل الجودة والاختبارات', 'باس ديزاين وإنتاجية', 'درفلة وسرعات', 'قوى وكهرباء', 'أتمتة وفنش'];

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
  if (activeCalcId === 'special_unit_converter') {
    return <UnitConverterModal onBack={() => setActiveCalcId(null)} />;
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
          <ArrowLeft size={15} className="rotate-180" /> رجوع لكل الأدوات
        </button>

        <div className="bg-white p-4 sm:p-6 rounded-3xl border border-slate-200 max-w-2xl mx-auto shadow-lg">
          <div className="flex items-center gap-3 mb-3 border-b border-slate-100 pb-3.5">
            <div className="bg-blue-50 p-2.5 rounded-xl border border-blue-200 shrink-0">
              <c.icon className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
            </div>
            <div>
              <span className="text-[11px] text-blue-600 font-bold">{c.group}</span>
              <h2 className="text-base sm:text-xl font-black text-slate-900">{c.title}</h2>
            </div>
          </div>

          <ToolDetailsExplainer
            title={`شرح أداة: ${c.title}`}
            explanation={c.details || c.desc}
            whenToUse={c.whenToUse}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
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
      <div className="flex flex-wrap items-center gap-1.5">
        {groups.map((grp) => (
          <button
            key={grp}
            onClick={() => setSelectedGroup(grp)}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              selectedGroup === grp
                ? 'bg-blue-600 text-white shadow-sm'
                : 'bg-white text-slate-600 border border-slate-200 hover:text-slate-900'
            }`}
          >
            {grp}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-3.5">
        {visibleCalcs.map((c) => (
          <button
            key={c.id}
            onClick={() => openCalculator(c)}
            className={`text-right p-3.5 sm:p-4 rounded-2xl border transition-all flex flex-col justify-between group hover:-translate-y-0.5 shadow-sm hover:shadow-md ${
              c.isSpecial
                ? 'bg-gradient-to-b from-blue-50/70 to-white border-blue-300 hover:border-blue-500'
                : c.group === 'معمل الجودة والاختبارات'
                ? 'bg-gradient-to-b from-emerald-50/50 to-white border-emerald-300 hover:border-emerald-500'
                : 'bg-white border-slate-200 hover:border-blue-400'
            }`}
          >
            <div>
              <div className="flex items-center justify-between gap-1 mb-2.5">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 ${
                    c.isSpecial
                      ? 'bg-blue-600 text-white shadow-sm'
                      : c.group === 'معمل الجودة والاختبارات'
                      ? 'bg-emerald-600 text-white shadow-sm'
                      : 'bg-blue-50 border border-blue-100 text-blue-600'
                  }`}
                >
                  <c.icon className="w-5 h-5" />
                </div>
                {c.isSpecial ? (
                  <span className="text-[9px] bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.5 rounded-full font-black">
                    شامل
                  </span>
                ) : c.group === 'معمل الجودة والاختبارات' ? (
                  <span className="text-[9px] bg-emerald-100 text-emerald-900 border border-emerald-300 px-2 py-0.5 rounded-full font-black">
                    جودة
                  </span>
                ) : null}
              </div>

              <h3 className="text-xs sm:text-sm font-black text-slate-900 leading-snug">{c.title}</h3>
              <p className="text-[10px] sm:text-[11px] text-slate-500 font-bold mt-1 line-clamp-2 leading-relaxed">
                {c.desc}
              </p>
            </div>

            <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] font-bold text-blue-600">
              <span>{c.shortTag || 'فتح الأداة'}</span>
              <ArrowLeft size={12} />
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

/* ======================================================
   8. مجتمع المهندسين وموسوعة الأعطال
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
            <div className="flex flex-wrap items-center gap-1.5">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all ${
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
   9. المكون الرئيسي لبوابة المهندسين (شامل مؤشر العمل بدون إنترنت Offline Ready)
   ====================================================== */
export default function PublicPortal({ onBack }) {
  const [activeTab, setActiveTab] = useState('calculators');
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);

  useEffect(() => {
    const goOnline = () => setIsOnline(true);
    const goOffline = () => setIsOnline(false);
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);
    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  const tabs = [
    { id: 'calculators', label: 'الحاسبات ومعمل الجودة', icon: Calculator },
    { id: 'community', label: 'المجتمع وموسوعة الأعطال', icon: MessageCircle }
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
                <div className="flex items-center gap-2">
                  <h1 className="text-sm sm:text-base font-black text-slate-900 leading-tight">
                    بوابة المهندسين والحسابات
                  </h1>
                  <span
                    className={`inline-flex items-center gap-1 text-[9px] font-black px-2 py-0.5 rounded-full border ${
                      isOnline
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-amber-100 text-amber-900 border-amber-300'
                    }`}
                  >
                    {isOnline ? <Wifi size={10} /> : <WifiOff size={10} />}
                    {isOnline ? 'يعمل أوفلاين وأونلاين' : 'وضع العمل بدون إنترنت'}
                  </span>
                </div>
                <p className="text-[10px] text-slate-500 font-bold hidden sm:block">
                  قوانين الدرفلة، الممرات (بيضاوي-مبروم)، معمل الجودة، والكهرباء
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
            <div className="grid grid-cols-2 sm:flex bg-slate-100 p-1 rounded-xl border border-slate-200 w-full sm:w-auto">
              {tabs.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id)}
                  className={`px-3 sm:px-4 py-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
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
        {activeTab === 'community' && <CommunityProView />}
      </main>
    </div>
  );
}
