import React, { useState } from 'react';
import {
  Calculator, Layers, Ruler, MessageCircle, RotateCcw, Activity,
  Gauge, DivideSquare, Maximize2, Circle, ArrowLeftRight, Zap,
  Cpu, Wrench, PlusCircle, ThumbsUp, Flame, Scissors, BookOpen,
  ChevronDown, ChevronUp, Sliders, Search, Award, Sparkles,
  Check, ArrowLeft, Home, ShieldAlert, Cable, BatteryCharging, Radio
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

// جدول الكابلات القياسية بالملليمتر المربع وأقصى أمبير تقريبي للنحاس في الهواء/الحوامل
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
        text: 'معلومة ذهبية! وعشان كدا ضبط عدد العلب المغلقة في الأبرون (X = V² / 8) بيفرق جداً في مسافة الرمي على سرير التبريد.',
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
    solution: 'افحص Core Dimension ووزن المتر الطولي؛ لو القلب أقل من الطبيعي افتح جاب القائم النهائي، وراجع سنترية وبكر دليل الدخول.'
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
    solution: 'راجع حرارة البيليت، تأكد من تفعيل الـ Lead/Over Speed (2% - 5%) لتحسين عض مقدمة المعدن، وافحص كابلات الموتور.'
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
   2. عناصر واجهة مساعدة (UI Helpers)
   ====================================================== */
const num = (v) => (Number.isFinite(Number(v)) ? Number(v) : 0);
const fmt = (n, d = 2) => (Number.isFinite(Number(n)) ? Number(n).toFixed(d) : '—');
const inputCls =
  'w-full bg-slate-950 border border-slate-700/80 rounded-xl px-3 py-2 text-white font-mono text-sm focus:border-blue-500 outline-none transition-colors';

const Field = ({ label, value, onChange, step = 'any', className = '' }) => (
  <div className={className}>
    <label className="text-[11px] sm:text-xs text-slate-400 block mb-1 font-bold">{label}</label>
    <input type="number" step={step} value={value} onChange={(e) => onChange(e.target.value)} className={inputCls} />
  </div>
);

const SelectField = ({ label, value, onChange, options, className = '' }) => (
  <div className={className}>
    <label className="text-[11px] sm:text-xs text-slate-400 block mb-1 font-bold">{label}</label>
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
  <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/90">
    <span className="text-[11px] text-slate-400 block mb-0.5">{label}</span>
    <span className={`font-bold font-mono ${big ? 'text-lg sm:text-xl' : 'text-base sm:text-lg'} ${color}`}>
      {value} {unit && <span className="text-[11px] text-slate-500 mr-1">{unit}</span>}
    </span>
  </div>
);

const SolutionStepsBox = ({ formula, steps }) => {
  const [open, setOpen] = useState(true);
  if (!steps || steps.length === 0) return null;

  return (
    <div className="mt-4 bg-slate-950/90 border border-amber-500/30 rounded-2xl overflow-hidden shadow-md">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full px-3.5 py-2.5 bg-amber-500/10 flex items-center justify-between text-amber-400 font-bold text-xs sm:text-sm hover:bg-amber-500/15 transition-colors"
      >
        <span className="flex items-center gap-2">
          <BookOpen size={15} /> خطوات الحل والتعويض في القانون
        </span>
        {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>

      {open && (
        <div className="p-3.5 space-y-2.5 text-xs">
          {formula && (
            <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
              <span className="text-slate-400 text-[11px] block mb-0.5">القانون الهندسي:</span>
              <p className="font-mono text-amber-300 font-bold text-left" dir="ltr">
                {formula}
              </p>
            </div>
          )}
          <div className="space-y-1.5">
            {steps.map((st, idx) => (
              <div key={idx} className="flex items-start gap-2 bg-slate-900/60 p-2 rounded-lg border border-slate-800/70">
                <span className="w-4 h-4 rounded-full bg-blue-600/20 text-blue-400 border border-blue-500/30 font-mono text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                  {idx + 1}
                </span>
                <p className="text-slate-200 leading-relaxed font-mono text-[11px] sm:text-xs">{st}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

/* ======================================================
   3. حاسبة الباس ديزاين الهندسية الحقيقية (Realistic Roll Pass Schedule)
   ====================================================== */
const RealisticPassDesignModal = ({ onBack }) => {
  const [mode, setMode] = useState('rebar'); // 'rebar' | 'flat'
  const [billetSide, setBilletSide] = useState(130);
  const [rebarSize, setRebarSize] = useState('16');
  const [strands, setStrands] = useState('1');
  const [finishSpeed, setFinishSpeed] = useState(12);
  const [roughStands, setRoughStands] = useState(4);
  const [interStands, setInterStands] = useState(4);
  const [finishStands, setFinishStands] = useState(4);

  const [flatW, setFlatW] = useState(50);
  const [flatT, setFlatT] = useState(10);
  const [flatSpeed, setFlatSpeed] = useState(2.5);

  const spec = REBAR_SPECS.find((r) => String(r.size) === rebarSize) || REBAR_SPECS[3];
  const k = Number(strands) || 1;
  const totalStands = Math.max(4, Math.min(20, Number(roughStands) + Number(interStands) + Number(finishStands)));
  const A_billet = num(billetSide) * num(billetSide);

  const buildRealisticRebarSchedule = () => {
    const rCount = Math.max(1, Number(roughStands));
    const iCount = Math.max(1, Number(interStands));
    const fCount = Math.max(2, Number(finishStands));
    const N = rCount + iCount + fCount;

    const A_final_single = spec.area;
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
      else shape = standNum % 2 === 1 ? 'بيضاوي (Oval)' : 'مربع / دائري كاذب (Round/Sq)';

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
      const gearRatio = standNum <= rCount ? 8.5 - idx * 1.2 : standNum <= rCount + iCount ? 3.5 : 1.5;
      const motorRpm = rollRpm * Math.max(1, gearRatio);

      schedule.push({
        standNum,
        zone,
        shape,
        strandsHere: isSplitZone ? k : 1,
        entryArea: currentArea,
        exitAreaSingle: singleGrooveArea,
        reductionPct,
        elongFactor,
        rollDe,
        grooveFactor,
        workingDiaDw,
        linearSpeedV,
        rollRpm,
        gearRatio,
        motorRpm
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
      <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-900 p-3.5 rounded-2xl border border-slate-800">
        <button
          onClick={onBack}
          className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5"
        >
          <ArrowLeft size={15} className="rotate-180" /> رجوع لكل القوانين
        </button>
        <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setMode('rebar')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              mode === 'rebar' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            باس ديزاين حديد التسليح (Box-Oval-Round)
          </button>
          <button
            onClick={() => setMode('flat')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
              mode === 'flat' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            باس ديزاين الخوصة والقطاعات (50×10 / 40×10)
          </button>
        </div>
      </div>

      {mode === 'rebar' ? (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            <div className="lg:col-span-6 bg-slate-900 p-4 rounded-2xl border border-slate-800 space-y-3">
              <h3 className="text-sm sm:text-base font-bold text-white border-b border-slate-800 pb-2">
                مدخلات خط الدرفلة وتوزيع مناطق القوائم
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                <Field label="ضلع البيليت (mm)" value={billetSide} onChange={setBilletSide} />
                <SelectField
                  label="مقاس السيخ النهائي"
                  value={rebarSize}
                  onChange={setRebarSize}
                  options={REBAR_SPECS.map((r) => [String(r.size), `${r.size} مم (${r.area} mm²)`])}
                />
                <SelectField
                  label="نظام الشق (Slitting)"
                  value={strands}
                  onChange={setStrands}
                  options={[
                    ['1', '1 خط (بدون شق)'],
                    ['2', '2 خط (Two-Slit)'],
                    ['3', '3 خطوط (Three-Slit)'],
                    ['4', '4 خطوط (Four-Slit)']
                  ]}
                />
                <Field label="قوائم التخشين" value={roughStands} onChange={setRoughStands} />
                <Field label="قوائم المتوسط" value={interStands} onChange={setInterStands} />
                <Field label="قوائم التشطيب" value={finishStands} onChange={setFinishStands} />
                <Field label="سرعة آخر قائم (m/s)" value={finishSpeed} onChange={setFinishSpeed} step="0.5" className="col-span-2 sm:col-span-3" />
              </div>
            </div>

            <div className="lg:col-span-6 bg-slate-900 p-4 rounded-2xl border border-blue-500/30 space-y-3">
              <h3 className="text-sm sm:text-base font-bold text-blue-400 border-b border-slate-800 pb-2">
                المنطق الهندسي لتدرج التخفيض (كما في مصانع الدرفلة)
              </h3>
              <div className="grid grid-cols-2 gap-2.5">
                <Stat label="مساحة البيليت الداخلة" value={fmt(A_billet, 0)} unit="mm²" />
                <Stat label="مساحة الممر النهائي للسيخ" value={fmt(spec.area, 1)} unit="mm²" color="text-emerald-400" />
                <Stat label="ثابت التدفق الحجمي Q" value={fmt(rebarData.Q_total, 0)} unit="mm².m/s" color="text-blue-400" />
                <Stat label="إجمالي عدد القوائم" value={totalStands} unit="قائم" />
              </div>
              <SolutionStepsBox
                formula="Dw = De - [(Area / Width) - Gap]  |  V_i = Q / Area_i  |  RPM = (V_i × 60000) / (π × Dw)"
                steps={[
                  'التخشين (Roughing): ممرات صندوقي/مربع بتخفيض عالي (28% - 35%) لأن المعدن في أعلى لدونة حرارية (1150°C).',
                  'المتوسط (Intermediate): ممرات بيضاوي/دائري كاذب بتخفيض متوسط (20% - 25%).',
                  'التشطيب (Finishing): الممر ما قبل النهائي بيضاوي قائد (Leader Oval) والممر الأخير دائري مشرشر بتخفيض هادئ (12% - 17%) لضبط أبعاد القلب والشنب.'
                ]}
              />
            </div>
          </div>

          <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 overflow-x-auto">
            <h4 className="text-sm font-bold text-white mb-3">
              جدول تدرج الممرات، الأقطار الفعالة ($D_w$)، وتزامن السرعات
            </h4>
            <table className="w-full text-right text-xs min-w-[720px]">
              <thead className="bg-slate-950 text-slate-400">
                <tr>
                  <th className="p-2.5 rounded-r-lg">القائم</th>
                  <th className="p-2.5">المنطقة</th>
                  <th className="p-2.5">شكل الممر (Groove)</th>
                  <th className="p-2.5">مساحة الممر mm²</th>
                  <th className="p-2.5">التخفيض %</th>
                  <th className="p-2.5">الاستطالة λ</th>
                  <th className="p-2.5">القطر الفعال Dw</th>
                  <th className="p-2.5">السرعة m/s</th>
                  <th className="p-2.5 rounded-l-lg">لفات الدرفيل RPM</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/70 font-mono">
                {rebarData.schedule.map((row) => (
                  <tr key={row.standNum} className="hover:bg-slate-800/40">
                    <td className="p-2.5 font-bold text-white font-sans">
                      ق {row.standNum} {row.strandsHere > 1 && <span className="text-[10px] text-amber-400">({row.strandsHere}×)</span>}
                    </td>
                    <td className="p-2.5 font-sans text-slate-300">{row.zone}</td>
                    <td className="p-2.5 font-sans text-blue-300 font-bold">{row.shape}</td>
                    <td className="p-2.5 text-white font-bold">{fmt(row.exitAreaSingle, 1)}</td>
                    <td className="p-2.5 text-emerald-400">{fmt(row.reductionPct, 1)}%</td>
                    <td className="p-2.5 text-slate-300">{fmt(row.elongFactor, 2)}</td>
                    <td className="p-2.5 text-amber-300">{fmt(row.workingDiaDw, 1)} mm</td>
                    <td className="p-2.5 text-sky-400 font-bold">{fmt(row.linearSpeedV, 2)}</td>
                    <td className="p-2.5 text-white font-bold">{fmt(row.rollRpm, 1)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <div className="space-y-4">
          <div className="bg-slate-900 p-4 rounded-2xl border border-emerald-500/30 grid grid-cols-1 md:grid-cols-3 gap-3">
            <Field label="عرض الخوصة النهائي (mm) مثل 50 أو 40" value={flatW} onChange={setFlatW} />
            <Field label="سمك الخوصة النهائي (mm) مثل 10" value={flatT} onChange={setFlatT} />
            <Field label="سرعة خروج الخوصة (m/s)" value={flatSpeed} onChange={setFlatSpeed} step="0.1" />
          </div>

          <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 overflow-x-auto">
            <h4 className="text-sm font-bold text-emerald-400 mb-3">
              جدول تزامن القوائم الأفقية والرأسية (Vertical & Horizontal Stands) لإنتاج خوصة {flatW}×{flatT} مم
            </h4>
            <table className="w-full text-right text-xs min-w-[650px]">
              <thead className="bg-slate-950 text-slate-400">
                <tr>
                  <th className="p-2.5">القائم</th>
                  <th className="p-2.5">وظيفة الممر</th>
                  <th className="p-2.5">الأبعاد الخارجة (عرض×سمك)</th>
                  <th className="p-2.5">المساحة mm²</th>
                  <th className="p-2.5">التخفيض %</th>
                  <th className="p-2.5">القطر الفعال Dw</th>
                  <th className="p-2.5">السرعة m/s</th>
                  <th className="p-2.5">لفات الدرفيل</th>
                  <th className="p-2.5">لفات الموتور RPM</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 font-mono">
                {flatData.map((r, i) => (
                  <tr key={i} className="hover:bg-slate-800/40">
                    <td className="p-2.5 font-sans font-bold text-white">{r.name}</td>
                    <td className="p-2.5 font-sans text-slate-300">{r.shape}</td>
                    <td className="p-2.5 text-amber-300 font-bold">
                      {fmt(r.w, 1)} × {fmt(r.h, 1)} مم
                    </td>
                    <td className="p-2.5 text-white">{fmt(r.area, 0)}</td>
                    <td className="p-2.5 text-emerald-400">{fmt(r.red, 1)}%</td>
                    <td className="p-2.5 text-slate-300">{fmt(r.dw, 1)} mm</td>
                    <td className="p-2.5 text-sky-400 font-bold">{fmt(r.vel, 2)}</td>
                    <td className="p-2.5 text-white">{fmt(r.rRpm, 1)}</td>
                    <td className="p-2.5 text-amber-400 font-bold">{fmt(r.mRpm, 0)} RPM</td>
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
   4. حاسبة قطعيات المقص الطائر (36م / 48م) والأسياخ التجارية للعميل (12م)
   ====================================================== */
const BarsAndProductivityModal = ({ onBack }) => {
  // وضع الحساب: 'flying_shear' (قطعيات المقص الطائر على سرير التبريد) | 'customer_bars' (أسياخ العميل 12م)
  const [calcTarget, setCalcTarget] = useState('flying_shear');
  const [side, setSide] = useState(130);
  const [billetLen, setBilletLen] = useState(12);
  const [size, setSize] = useState('16');
  const [yieldPct, setYieldPct] = useState(97.5);
  const [strands, setStrands] = useState('2');
  const [cutLen, setCutLen] = useState(36); // افتراضي 36 متر حسب طلبك مع أزرار سريعة 36 / 48 / 54 / 60
  const [commLen, setCommLen] = useState(12);
  const [gapSec, setGapSec] = useState(4);
  const [lineSpeed, setLineSpeed] = useState(12);
  const [billetsShift, setBilletsShift] = useState(400);

  const spec = REBAR_SPECS.find((r) => String(r.size) === size) || REBAR_SPECS[3];
  const k = Number(strands) || 1;
  const billetKg = num(side) * num(side) * 0.00785 * num(billetLen);
  const prodKg = (billetKg * num(yieldPct)) / 100;
  const totalLenAllStrands = spec.nomW > 0 ? prodKg / spec.nomW : 0;
  const lenPerStrand = totalLenAllStrands / k;

  // حسابات المقص الطائر (Flying Shear) لكل خيط وللبليت الكامل
  const fullFlyingCutsPerStrand = num(cutLen) > 0 ? Math.floor(lenPerStrand / num(cutLen)) : 0;
  const totalFullFlyingBarsPerBillet = fullFlyingCutsPerStrand * k;
  const lastBarLengthPerStrand = Math.max(0, lenPerStrand - fullFlyingCutsPerStrand * num(cutLen));
  // شمل البار الأخير إذا كان أطول من الحد الأدنى للنقل على سرير التبريد (مثلاً >= 12م)
  const totalFlyingBarsOnBedWithLast =
    lastBarLengthPerStrand >= 6 ? totalFullFlyingBarsPerBillet + k : totalFullFlyingBarsPerBillet;

  // حسابات المقص البارد للعميل (Commercial Bars 12m)
  const commBarsPerFlyingCut = num(commLen) > 0 ? Math.floor(num(cutLen) / num(commLen)) : 0;
  const wastePerFlyingCut = Math.max(0, num(cutLen) - commBarsPerFlyingCut * num(commLen));
  const commBarsFromLastBar = num(commLen) > 0 ? Math.floor(lastBarLengthPerStrand / num(commLen)) : 0;
  const shortScrapFromLastBar = Math.max(0, lastBarLengthPerStrand - commBarsFromLastBar * num(commLen));
  const totalCustomerBarsPerBillet = k * (fullFlyingCutsPerStrand * commBarsPerFlyingCut + commBarsFromLastBar);

  // حساب الإنتاجية بالساعة
  const rollSec = num(lineSpeed) * spec.nomW * k > 0 ? billetKg / (num(lineSpeed) * spec.nomW * k) : 0;
  const cycleSec = rollSec + num(gapSec);
  const billetsPerHr = cycleSec > 0 ? 3600 / cycleSec : 0;
  const tonsPerHr = (billetsPerHr * prodKg) / 1000;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-900 p-3.5 rounded-2xl border border-slate-800">
        <button
          onClick={onBack}
          className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5"
        >
          <ArrowLeft size={15} className="rotate-180" /> رجوع لكل القوانين
        </button>

        {/* مفتاح اختيار نوع الحساب: المقص الطائر (36م/48م) أم أسياخ العميل (12م) */}
        <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setCalcTarget('flying_shear')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
              calcTarget === 'flying_shear'
                ? 'bg-amber-500 text-slate-950 shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Scissors size={14} /> 1. قطعيات المقص الطائر (36م / 48م لسرير التبريد)
          </button>
          <button
            onClick={() => setCalcTarget('customer_bars')}
            className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
              calcTarget === 'customer_bars'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Calculator size={14} /> 2. الأسياخ النهائية للعميل (12م بعد المقص البارد)
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* المدخلات */}
        <div className="lg:col-span-6 bg-slate-900 p-4 rounded-2xl border border-slate-800 space-y-3.5">
          <h3 className="text-sm sm:text-base font-bold text-white border-b border-slate-800 pb-2">
            مدخلات البيليت والمقص الطائر وسرير التبريد
          </h3>

          {/* أزرار سريعة لاختيار طول قطعية المقص الطائر */}
          <div className="bg-slate-950 p-3 rounded-xl border border-amber-500/30 space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-xs font-bold text-amber-400">
                طول قطعية المقص الطائر (Flying Shear Cut Length):
              </label>
              <span className="font-mono text-sm font-black text-white">{cutLen} متر</span>
            </div>
            <div className="grid grid-cols-5 gap-1.5">
              {[24, 36, 48, 54, 60].map((presetLen) => (
                <button
                  key={presetLen}
                  type="button"
                  onClick={() => setCutLen(presetLen)}
                  className={`py-1.5 rounded-lg font-mono text-xs font-bold border transition-all ${
                    Number(cutLen) === presetLen
                      ? 'bg-amber-500 text-slate-950 border-amber-400 shadow'
                      : 'bg-slate-900 text-slate-300 border-slate-800 hover:border-slate-600'
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
              placeholder="أو اكتب أي طول قطعية للمقص الطائر بالمتر..."
              className={inputCls}
            />
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <Field label="ضلع البليت (mm)" value={side} onChange={setSide} />
            <Field label="طول البليت (m)" value={billetLen} onChange={setBilletLen} step="0.5" />
            <SelectField
              label="مقاس السيخ"
              value={size}
              onChange={setSize}
              options={REBAR_SPECS.map((r) => [String(r.size), `${r.size} مم (${r.nomW} كجم/م)`])}
            />
            <SelectField
              label="عدد الخيوط (Slitting Strands)"
              value={strands}
              onChange={setStrands}
              options={[
                ['1', '1 خط (Single)'],
                ['2', '2 خط (Two-Slit)'],
                ['3', '3 خطوط (Three-Slit)'],
                ['4', '4 خطوط (Four-Slit)']
              ]}
            />
            <Field label="طول السيخ التجاري للعميل (m)" value={commLen} onChange={setCommLen} step="0.5" />
            <Field label="نسبة الإدرار Yield (%)" value={yieldPct} onChange={setYieldPct} step="0.5" />
            <Field label="سرعة آخر قائم (m/s)" value={lineSpeed} onChange={setLineSpeed} step="0.5" />
            <Field label="عدد البليت بالوردية" value={billetsShift} onChange={setBilletsShift} />
          </div>
        </div>

        {/* النتائج حسب الوضع المختار */}
        <div className="lg:col-span-6 bg-slate-900 p-4 rounded-2xl border border-emerald-500/30 space-y-3.5">
          {calcTarget === 'flying_shear' ? (
            <>
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <h3 className="text-sm sm:text-base font-bold text-amber-400">
                  نتائج المقص الطائر وسرير التبريد (طول القطعية {cutLen}م)
                </h3>
                <span className="text-[10px] bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded-full font-bold">
                  قبل المقص البارد
                </span>
              </div>

              <div className="bg-amber-500/10 border border-amber-500/40 rounded-2xl p-4 text-center">
                <span className="text-xs text-amber-200 block mb-1">
                  إجمالي البارات الكاملة (طول {cutLen}م) من البيليت الواحد ({k} خيط)
                </span>
                <span className="text-3xl sm:text-4xl font-black font-mono text-amber-400">
                  {totalFullFlyingBarsPerBillet} <span className="text-sm">بار ({cutLen}م)</span>
                </span>
                <p className="text-[11px] text-slate-300 mt-1 font-mono">
                  ({fullFlyingCutsPerStrand} قطعية كاملة لكل خيط × {k} خيط) + {k} بار أخير بطول {fmt(lastBarLengthPerStrand, 2)} م
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <Stat label="طول السيخ الكلي لكل خيط" value={fmt(lenPerStrand, 1)} unit="متر" color="text-blue-400" />
                <Stat
                  label="طول البار الأخير (Last Bar)"
                  value={fmt(lastBarLengthPerStrand, 2)}
                  unit="متر"
                  color={lastBarLengthPerStrand < 12 && lastBarLengthPerStrand > 0 ? 'text-red-400' : 'text-emerald-400'}
                />
                <Stat label="إجمالي البارات على الفرش (شامل الذيل)" value={totalFlyingBarsOnBedWithLast} unit="بار/بيليت" />
                <Stat
                  label="قطعيات المقص الطائر بالوردية"
                  value={fmt(num(billetsShift) * totalFullFlyingBarsPerBillet, 0)}
                  unit={`قطعية (${cutLen}م)`}
                  color="text-amber-400"
                />
              </div>

              <SolutionStepsBox
                formula="L_strand = W_net / (w_meter × k)  |  N_flying = floor(L_strand / L_cut)"
                steps={[
                  `وزن البيليت الصافي بعد الهالك = ${fmt(prodKg, 1)} كجم`,
                  `الطول الكلي الخارج من البيليت = ${fmt(prodKg, 1)} / ${spec.nomW} = ${fmt(totalLenAllStrands, 1)} متر`,
                  `طول الحديد في الخيط الواحد (${k} خيط) = ${fmt(totalLenAllStrands, 1)} / ${k} = ${fmt(lenPerStrand, 2)} متر`,
                  `عدد قطعيات المقص الطائر (طول ${cutLen}م) للخيط الواحد = floor(${fmt(lenPerStrand, 2)} / ${cutLen}) = ${fullFlyingCutsPerStrand} قطعية كاملة`,
                  `يتبقى في ذيل الخيط (Last Bar / Short Bar) = ${fmt(lenPerStrand, 2)} - (${fullFlyingCutsPerStrand} × ${cutLen}) = ${fmt(lastBarLengthPerStrand, 2)} متر`,
                  `إجمالي قطعيات الـ ${cutLen}م من البيليت (${k} خيط) = ${fullFlyingCutsPerStrand} × ${k} = ${totalFullFlyingBarsPerBillet} بار`
                ]}
              />
            </>
          ) : (
            <>
              <div className="flex items-center justify-between border-b border-slate-800 pb-2">
                <h3 className="text-sm sm:text-base font-bold text-emerald-400">
                  نتائج الأسياخ التجارية النهائية للعميل (طول {commLen}م)
                </h3>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full font-bold">
                  بعد المقص البارد
                </span>
              </div>

              <div className="bg-emerald-500/10 border border-emerald-500/40 rounded-2xl p-4 text-center">
                <span className="text-xs text-emerald-200 block mb-1">
                  إجمالي الأسياخ السليمة للعميل (طول {commLen}م) من البيليت الواحد
                </span>
                <span className="text-3xl sm:text-4xl font-black font-mono text-emerald-400">
                  {totalCustomerBarsPerBillet} <span className="text-sm">سيخ ({commLen}م)</span>
                </span>
                <p className="text-[11px] text-slate-300 mt-1 font-mono">
                  كل قطعية مقص طائر ({cutLen}م) تعطي {commBarsPerFlyingCut} أسياخ × {commLen}م
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <Stat label="أسياخ من كل قطعية مقص طائر" value={commBarsPerFlyingCut} unit={`سيخ (${commLen}م)`} />
                <Stat label="أسياخ سليمة من البار الأخير" value={commBarsFromLastBar * k} unit={`سيخ (${commLen}م)`} color="text-blue-400" />
                <Stat label="فضلة القصائر لكل خيط" value={fmt(shortScrapFromLastBar, 2)} unit="متر هالك" color="text-red-400" />
                <Stat
                  label="إنتاج الوردية للعميل"
                  value={fmt(num(billetsShift) * totalCustomerBarsPerBillet, 0)}
                  unit="سيخ"
                  color="text-emerald-400"
                />
              </div>

              <SolutionStepsBox
                formula="N_customer = k × [ (N_flying × floor(L_cut / L_comm)) + floor(L_last / L_comm) ]"
                steps={[
                  `المقص الطائر يقطع ${fullFlyingCutsPerStrand} بار بطول ${cutLen}م لكل خيط + بار أخير بطول ${fmt(lastBarLengthPerStrand, 2)}م`,
                  `على المقص البارد: كل بار ${cutLen}م يعطي (${cutLen} / ${commLen}) = ${commBarsPerFlyingCut} أسياخ تجارية ${wastePerFlyingCut > 0 ? `(ويتهدر ${fmt(wastePerFlyingCut, 1)}م)` : '(بدون هدر)'}`,
                  `البار الأخير (${fmt(lastBarLengthPerStrand, 2)}م) يعطي ${commBarsFromLastBar} سيخ سليم بطول ${commLen}م ويتبقى قصيرة بطول ${fmt(shortScrapFromLastBar, 2)}م`,
                  `إجمالي الأسياخ للعميل من البيليت = ${k} خيط × [(${fullFlyingCutsPerStrand} × ${commBarsPerFlyingCut}) + ${commBarsFromLastBar}] = ${totalCustomerBarsPerBillet} سيخ`
                ]}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
};

/* ======================================================
   5. موسوعة كل قوانين الدرفلة والكهرباء الموحدة (21 حاسبة)
   ====================================================== */
const ALL_CALCULATORS = [
  // --- حاسبات متقدمة مدمجة ---
  {
    id: 'special_bars_yield',
    title: 'عدد قطعيات المقص الطائر (36م/48م) وأسياخ العميل (12م)',
    desc: 'احسب عدد بارات المقص الطائر على سرير التبريد أو الأسياخ التجارية للعميل والبار الأخير.',
    icon: Scissors,
    group: 'باس ديزاين وإنتاجية',
    isSpecial: true
  },
  {
    id: 'special_pass_design',
    title: 'تصميم الممرات وتوزيع السرعات (Pass Design)',
    desc: 'جدول تدريج المساحات الواقعي (تخشين، متوسط، تشطيب) لحديد التسليح والخوص.',
    icon: Layers,
    group: 'باس ديزاين وإنتاجية',
    isSpecial: true
  },

  // --- أ. حاسبات الدرفلة والسرعات ---
  {
    id: 'c1',
    title: 'السرعة الخطية للمعدن (Linear Speed)',
    desc: 'حساب سرعة المعدن بالمتر/ثانية من القطر الفعال و RPM.',
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
          `محيط الدرفيل الفعال = π × ${d} = ${fmt(Math.PI * d, 1)} مم = ${fmt((Math.PI * d) / 1000, 3)} متر`,
          `السرعة بالمتر/دقيقة = ${fmt((Math.PI * d) / 1000, 3)} × ${n} = ${fmt(res * 60, 2)} م/دقيقة`,
          `نقسم على 60 للتحويل إلى متر/ثانية: V = ${fmt(res, 2)} m/s`
        ]
      };
    }
  },
  {
    id: 'c2',
    title: 'عدد لفات الدرفيل (Roll RPM)',
    desc: 'إيجاد لفات الدرفيل المطلوبة لتحقيق سرعة خطية محددة.',
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
          `نحول السرعة إلى مم/دقيقة = ${vel} × 60000 = ${fmt(vel * 60000, 0)} مم/دقيقة`,
          `محيط الدرفيل = π × ${d} = ${fmt(Math.PI * d, 2)} مم`,
          `RPM = ${fmt(vel * 60000, 0)} / ${fmt(Math.PI * d, 2)} = ${fmt(rpm, 1)} لفة/دقيقة`
        ]
      };
    }
  },
  {
    id: 'c3',
    title: 'لفات الموتور والـ Over Speed',
    desc: 'حساب RPM الموتور من نسبة الجيربوكس وسرعة العض الزائدة.',
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
        results: { 'لفات الموتور الأساسية (RPM)': fmt(nm, 0), 'لفات الموتور مع Over Speed': fmt(nmOver, 0) },
        steps: [
          `سرعة الموتور = ${nr} × ${gr} = ${fmt(nm, 1)} RPM`,
          `بإضافة نسبة Over Speed (${over}%): ${fmt(nm, 1)} × (1 + ${over}/100) = ${fmt(nmOver, 1)} RPM`
        ]
      };
    }
  },
  {
    id: 'c4',
    title: 'القطر الفعال ومعامل الممر (Dw & Groove Factor)',
    desc: 'حساب القطر الفعال للدرفيل من مساحة وعرض الممر والجاب.',
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
          `متوسط عمق الممر = المساحة / العرض = ${area} / ${w} = ${fmt(area / w, 2)} مم`,
          `معامل الممر = ${fmt(area / w, 2)} - ${gap} = ${fmt(gf, 2)} مم`,
          `القطر الفعال Dw = ${de} - ${fmt(gf, 2)} = ${fmt(dw, 2)} مم`
        ]
      };
    }
  },
  {
    id: 'c5',
    title: 'نسبة التخفيض والاستطالة (Reduction & λ)',
    desc: 'حساب النقص المئوي في المساحة ومعامل الاستطالة للممر.',
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
          `فرق المساحة = ${a1} - ${a2} = ${fmt(a1 - a2, 1)} mm²`,
          `نسبة التخفيض = (${fmt(a1 - a2, 1)} / ${a1}) × 100 = ${fmt(red, 2)}%`,
          `معامل الاستطالة λ = ${a1} / ${a2} = ${fmt(lam, 3)}`
        ]
      };
    }
  },
  {
    id: 'c6',
    title: 'قانون ثبات الحجم وتزامن القوائم (A1V1 = A2V2)',
    desc: 'ضبط سرعة القائم التالي لمنع الشد أو الكعبلة.',
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
          `ثابت التدفق Q = A1 × V1 = ${a1} × ${v1} = ${fmt(q, 1)}`,
          `سرعة القائم الثاني V2 = ${fmt(q, 1)} / ${a2} = ${fmt(v2, 2)} m/s`
        ]
      };
    }
  },
  {
    id: 'c7',
    title: 'سرعة القائم السابق (Cascade Upstream)',
    desc: 'حساب سرعة القائم الخلفي عند تعديل سرعة القائم الأمامي.',
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
          `ثابت التدفق Q = ${a2} × ${v2} = ${fmt(a2 * v2, 1)}`,
          `سرعة القائم السابق V1 = ${fmt(a2 * v2, 1)} / ${a1} = ${fmt(v1, 2)} m/s`
        ]
      };
    }
  },
  {
    id: 'c8',
    title: 'الضغطة وزاوية العض وشرط الدرفلة (Roll Bite)',
    desc: 'حساب أقصى ضغطة مسموحة وشرط عدم انزلاق البيليت.',
    icon: Maximize2,
    group: 'باس ديزاين وإنتاجية',
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
          'زاوية العض (α)': `${fmt(alphaDeg, 1)}° (${ok ? 'يقبل العض' : 'خطر زحلقة!'})`
        },
        steps: [
          `الضغطة ΔH = ${h1} - ${h2} = ${fmt(dh, 2)} مم`,
          `أقصى ضغطة ΔH_max = μ² × R = (${mu})² × ${r} = ${fmt(dhMax, 2)} مم`,
          `زاوية العض α = ${fmt(alphaDeg, 1)}°`
        ]
      };
    }
  },

  // --- ب. حاسبات الأتمتة والفنش ---
  {
    id: 'a1',
    title: 'مسافة رمي الأبرون والعلب المغلقة (Apron)',
    desc: 'حساب عدد العلب المغلقة لفرملة الأسياخ على سرير التبريد.',
    icon: Flame,
    group: 'أتمتة وفنش',
    formula: 'X (العلب المغلقة بالمتر) = V² / 8',
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
        results: { 'عدد العلب المغلقة (V²/8)': `${fmt(xStd, 1)} علبة (متر)`, 'مسافة الفرملة الدقيقة': `${fmt(xExact, 1)} متر` },
        steps: [
          `مربع سرعة السيخ: V² = ${vel} × ${vel} = ${fmt(vel * vel, 1)}`,
          `عدد العلب المغلقة X = ${fmt(vel * vel, 1)} / 8 = ${fmt(xStd, 1)} علبة`
        ]
      };
    }
  },
  {
    id: 'a2',
    title: 'ضبط ارتفاعات بكر اللوبر (Looper H & Y)',
    desc: 'حساب ارتفاع البكرة الثابتة والمتحركة للوبر.',
    icon: Sliders,
    group: 'أتمتة وفنش',
    formula: 'H = X + R (الثابتة)  |  Y = H + (H / 3) (المتحركة)',
    inputs: [
      { k: 'x', l: 'ارتفاع سنتر الدليل عن قاعدة اللوبر X (mm)', def: 150 },
      { k: 'r', l: 'نصف قطر البار المدرفل R (mm)', def: 8 }
    ],
    calc: (v) => {
      const x = num(v.x);
      const r = num(v.r);
      const h = x + r;
      const y = h + h / 3;
      return {
        results: { 'ارتفاع البكرة الثابتة (H)': `${fmt(h, 1)} mm`, 'ارتفاع البكرة المتحركة (Y)': `${fmt(y, 1)} mm` },
        steps: [
          `البكرة الثابتة H = ${x} + ${r} = ${fmt(h, 1)} مم`,
          `البكرة المتحركة Y = ${fmt(h, 1)} + (${fmt(h, 1)} / 3) = ${fmt(y, 1)} مم`
        ]
      };
    }
  },
  {
    id: 'a3',
    title: 'تزامن المقص الطائر (Flying Shear Over Speed)',
    desc: 'حساب السرعة الخطية لسلاح المقص ونسبة الـ Over Speed.',
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
        results: { 'السرعة الخطية للمقص V_cv (m/s)': fmt(vcv, 2), 'نسبة Shear Over Speed (%)': `${fmt(over, 1)}%` },
        steps: [
          `لفات المقص N_cv = ${nm} / ${gr} = ${fmt(ncv, 1)} RPM`,
          `السرعة الخطية للمقص V_cv = ${fmt(vcv, 2)} m/s`,
          `نسبة السرعة الزائدة = ${fmt(over, 1)}%`
        ]
      };
    }
  },

  // --- ج. حاسبات القوى والكهرباء والتحكم للفنيين في أرض العمل ---
  {
    id: 'e_cable',
    title: 'اختيار كابل الموتور وهبوط الجهد (Cable Sizing)',
    desc: 'حساب مقطع الكابل المناسب بالمم² لموتور معين مع فحص الـ Voltage Drop.',
    icon: Cable,
    group: 'قوى وكهرباء',
    formula: 'I_design = 1.25 × I_FL  |  ΔV = (√3 × I × L × cosφ) / (γ_cu × S)',
    inputs: [
      { k: 'kw', l: 'قدرة الموتور (kW)', def: 75 },
      { k: 'v', l: 'جهد التشغيل (Volt)', def: 380 },
      { k: 'len', l: 'طول مسار الكابل بالمتر (m)', def: 65 },
      { k: 'pf', l: 'معامل القدرة (PF)', def: 0.85 }
    ],
    calc: (v) => {
      const kw = num(v.kw);
      const volt = Math.max(1, num(v.v));
      const len = Math.max(1, num(v.len));
      const pf = Math.max(0.1, num(v.pf));
      const iFl = (kw * 1000) / (Math.sqrt(3) * volt * pf * 0.92);
      const iDesign = iFl * 1.25; // معامل أمان 25% للكابل

      // اختيار الكابل من الجدول القياسي
      let chosen = STANDARD_CABLES.find((c) => c.maxAmp >= iDesign);
      let parallelCount = 1;
      if (!chosen) {
        parallelCount = Math.ceil(iDesign / 400);
        chosen = STANDARD_CABLES.find((c) => c.maxAmp >= iDesign / parallelCount) || STANDARD_CABLES[STANDARD_CABLES.length - 1];
      }

      // فحص هبوط الجهد (معامل التوصيلية للنحاس γ = 56)
      const totalCrossSection = chosen.size * parallelCount;
      const vDropVolt = (Math.sqrt(3) * iFl * len * pf) / (56 * totalCrossSection);
      const vDropPct = (vDropVolt / volt) * 100;

      // إذا كان هبوط الجهد أكبر من 5% نقترح الكابل الأكبر
      const isDropSafe = vDropPct <= 5.0;

      return {
        results: {
          'أمبير الحمل الكامل للموتور (I_FL)': `${fmt(iFl, 1)} A`,
          'أمبير تصميم الكابل (1.25 × I_FL)': `${fmt(iDesign, 1)} A`,
          'مقاس كابل النحاس المقترح': parallelCount === 1 ? `3×${chosen.size} mm²` : `${parallelCount} × (3×${chosen.size} mm²) بالتوازي`,
          'نسبة هبوط الجهد (Voltage Drop)': `${fmt(vDropPct, 2)}% (${isDropSafe ? 'مطابق آمن' : 'يُنصح بزيادة المقطع درجة'})`
        },
        steps: [
          `نحسب تيار الموتور الكامل I_FL = (${kw} × 1000) / (1.732 × ${volt} × ${pf} × 0.92) = ${fmt(iFl, 1)} أمبير`,
          `نضرب في معامل أمان الكابل (1.25) لتحمل ظروف المصنع = ${fmt(iFl, 1)} × 1.25 = ${fmt(iDesign, 1)} أمبير`,
          `من جدول كابلات النحاس القياسية نختار مقطع (${parallelCount === 1 ? chosen.size : `${parallelCount}×${chosen.size}`} مم²) الذي يتحمل حتى ${chosen.maxAmp * parallelCount} أمبير`,
          `نحسب هبوط الجهد لمسافة ${len} متر: ΔV = (1.732 × ${fmt(iFl, 1)} × ${len} × ${pf}) / (56 × ${totalCrossSection}) = ${fmt(vDropVolt, 2)} فولت (${fmt(vDropPct, 2)}%)`
        ]
      };
    }
  },
  {
    id: 'e_protection',
    title: 'اختيار القاطع والكونتاكتور والأوفرلود (DOL & Star/Delta)',
    desc: 'حساب سعة الكونتاكتور، رينج الأوفرلود، والقاطع الرئيسي للموتور.',
    icon: ShieldAlert,
    group: 'قوى وكهرباء',
    formula: 'DOL: I_ovl = I_n , I_cb = 1.5 × I_n  |  Star-Delta: I_main/delta = 0.58 × I_n , I_star = 0.33 × I_n',
    inputs: [
      { k: 'kw', l: 'قدرة الموتور (kW)', def: 45 },
      { k: 'v', l: 'الجهد الكهربائي (Volt)', def: 380 }
    ],
    calc: (v) => {
      const kw = num(v.kw);
      const volt = Math.max(1, num(v.v));
      const inAmp = (kw * 1000) / (Math.sqrt(3) * volt * 0.85 * 0.91);
      const cbAmp = inAmp * 1.5;
      const dolOvl = inAmp;
      const sdMainDelta = inAmp * 0.58;
      const sdStar = inAmp * 0.34;

      return {
        results: {
          'أمبير الموتور الاسمي (I_n)': `${fmt(inAmp, 1)} A`,
          'القاطع الرئيسي المقترح (MCCB)': `${fmt(cbAmp, 0)} A`,
          'في حالة DOL (أوفرلود وكونتاكتور)': `كونتاكتور ≥ ${fmt(inAmp * 1.2, 0)}A | أوفرلود على ${fmt(dolOvl, 1)}A`,
          'في حالة Star/Delta (المكونات)': `رئيسي ودلتا: ${fmt(sdMainDelta, 0)}A | ستار: ${fmt(sdStar, 0)}A | أوفرلود: ${fmt(sdMainDelta, 1)}A`
        },
        steps: [
          `تيار الموتور الاسمي التقريبي I_n = ${fmt(inAmp, 1)} أمبير`,
          `سعة القاطع الرئيسي (MCCB) = 1.5 × ${fmt(inAmp, 1)} = ${fmt(cbAmp, 0)} أمبير`,
          `في دائرة ستار/دلتا يمر في الكونتاكتور الرئيسي والدلتا والأوفرلود (I_n / √3 = 58%): ${fmt(sdMainDelta, 1)} أمبير`,
          `بينما يمر في كونتاكتور الستار ثلث التيار (33% × I_n) = ${fmt(sdStar, 1)} أمبير`
        ]
      };
    }
  },
  {
    id: 'e_braking',
    title: 'حاسبة مقاومة الفرملة للإنفرتر (VFD Braking Resistor)',
    desc: 'حساب قيمة الأوم (Ω) والكيلووات لمقاومة الفرملة لمنع عطل Overvoltage.',
    icon: Zap,
    group: 'قوى وكهرباء',
    formula: 'R_min (Ω) = V_dc_max² / P_peak  |  P_resistor = P_motor × Braking_Duty%',
    inputs: [
      { k: 'kw', l: 'قدرة موتور الدرفلة أو المقص (kW)', def: 90 },
      { k: 'vdc', l: 'جهد الـ DC Link أثناء الفرملة (لـ 380V يكون ~ 700V)', def: 700 },
      { k: 'duty', l: 'نسبة دورة الفرملة Braking Duty (%)', def: 15 }
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
          'قيمة مقاومة الفرملة المناسبة (Ω)': `${fmt(rOhm, 1)} Ohm (Ω)`,
          'القدرة الحرارية لمقاومة الفرملة (kW)': `${fmt(resKw, 1)} kW`,
          'تيار الشوبر الأقصى (Chopper Current)': `${fmt(vdc / Math.max(0.1, rOhm), 1)} A`
        },
        steps: [
          `أثناء تباطؤ الموتور يرتفع جهد دائرة الـ DC Link إلى حوالي ${vdc} فولت مستمر (VDC)`,
          `قيمة المقاومة بالأوم R = V_dc² / P_watt = (${vdc})² / (${kw * 1000}) = ${fmt(rOhm, 1)} أوم`,
          `القدرة المستمرة للمقاومة حسب دورة التشغيل (${duty}%) = ${kw} × (${duty}/100) = ${fmt(resKw, 1)} كيلووات`
        ]
      };
    }
  },
  {
    id: 'e_pfc',
    title: 'حاسبة مكثفات تحسين معامل القدرة (PF Correction kVAR)',
    desc: 'حساب سعة البانل بالكيلوفار لرفع معامل القدرة وتقليل الأمبير.',
    icon: BatteryCharging,
    group: 'قوى وكهرباء',
    formula: 'Q (kVAR) = P (kW) × [ tan(arccos(PF_1)) - tan(arccos(PF_2)) ]',
    inputs: [
      { k: 'kw', l: 'الحمل الفعال للمصنع أو اللوحة (kW)', def: 500 },
      { k: 'pf1', l: 'معامل القدرة الحالي المنخفض (PF 1)', def: 0.76 },
      { k: 'pf2', l: 'معامل القدرة المستهدف (PF 2)', def: 0.95 }
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
          'سعة المكثفات المطلوبة (kVAR)': `${fmt(kvar, 1)} kVAR`,
          'أمبير لوحة المكثفات عند 380V': `${fmt(capAmp, 1)} A`
        },
        steps: [
          `زاوية الطور الحالية φ1: tan(φ1) = ${fmt(tan1, 3)}`,
          `زاوية الطور المستهدفة φ2: tan(φ2) = ${fmt(tan2, 3)}`,
          `سعة المكثفات Q = ${kw} × (${fmt(tan1, 3)} - ${fmt(tan2, 3)}) = ${fmt(kvar, 1)} kVAR`
        ]
      };
    }
  },
  {
    id: 'e_plc_scale',
    title: 'تحجيم إشارات الحساسات والـ PLC (4-20mA Analog Scaling)',
    desc: 'تحويل إشارة 4-20mA أو 0-10V إلى حرارة أو ضغط أو سرعة وقيمة الـ PLC.',
    icon: Radio,
    group: 'قوى وكهرباء',
    formula: 'Value = Min + [ ((mA - 4) / 16) × (Max - Min) ]  |  Siemens Raw = ((mA - 4) / 16) × 27648',
    inputs: [
      { k: 'ma', l: 'قراءة التيار المقاسة بالأفوميتر (mA من 4 إلى 20)', def: 12 },
      { k: 'min', l: 'أقل قيمة لتدريج الحساس (Min Range)', def: 0 },
      { k: 'max', l: 'أعلى قيمة لتدريج الحساس (Max Range مثلاً 250 بار)', def: 250 }
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
          'النسبة المئوية للإشارة (%)': `${fmt(pct, 1)}%`,
          'القيمة الفيزيائية المقابلة (Engineering Value)': fmt(engVal, 2),
          'القيمة الرقمية داخل Siemens PLC (0-27648)': siemensRaw
        },
        steps: [
          `نسبة الإشارة من مدى الـ 16mA = (${ma} - 4) / 16 = ${fmt((ma - 4) / 16, 3)} (${fmt(pct, 1)}%)`,
          `القيمة الفيزيائية = ${min} + (${fmt((ma - 4) / 16, 3)} × (${max} - ${min})) = ${fmt(engVal, 2)}`,
          `قيمة المسجل في Siemens S7 (PIW/IW) = ${fmt((ma - 4) / 16, 3)} × 27648 = ${siemensRaw}`
        ]
      };
    }
  },
  {
    id: 'e_encoder',
    title: 'حاسبة نبضات الإنكودر والسرعة (Encoder PPR & kHz)',
    desc: 'حساب تردد نبضات الإنكودر بالـ kHz وتشخيص توافق كارت السرعة.',
    icon: Cpu,
    group: 'قوى وكهرباء',
    formula: 'f_pulse (Hz) = (RPM × PPR) / 60',
    inputs: [
      { k: 'ppr', l: 'عدد نبضات الإنكودر للفة (PPR مثلاً 1024)', def: 1024 },
      { k: 'rpm', l: 'سرعة دوران عمود الموتور (RPM)', def: 1500 }
    ],
    calc: (v) => {
      const ppr = num(v.ppr);
      const rpm = num(v.rpm);
      const hz = (rpm * ppr) / 60;
      const khz = hz / 1000;

      return {
        results: {
          'تردد النبضات بالهرتز (Hz)': `${fmt(hz, 0)} نبضة/ثانية`,
          'التردد بالكيلوهرتز (kHz)': `${fmt(khz, 2)} kHz`
        },
        steps: [
          `عدد لفات الموتور في الثانية الواحدة = ${rpm} / 60 = ${fmt(rpm / 60, 2)} لفة/ثانية`,
          `تردد النبضات = ${fmt(rpm / 60, 2)} × ${ppr} نبضة = ${fmt(hz, 0)} Hz (${fmt(khz, 2)} kHz)`
        ]
      };
    }
  },
  {
    id: 'e1',
    title: 'حمل وعزم وقدرة الدرفلة (Load, Torque & Power)',
    desc: 'حساب قوس التلامس، قوة الدرفلة kN، العزم، والكيلووات.',
    icon: Flame,
    group: 'قوى وكهرباء',
    formula: 'Lp = √(R × Δh)  |  Load = σ × W × Lp  |  P = (2π × N × T) / 60',
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
          'حمل الدرفلة (Load)': `${fmt(loadKn, 1)} kN`,
          'عزم الدرفلة (Torque)': `${fmt(torqueKnm, 2)} kN.m`,
          'قدرة الدرفلة (Power)': `${fmt(powerKw, 1)} kW`
        },
        steps: [
          `قوس التلامس Lp = √(${r} × ${dh}) = ${fmt(lp, 2)} مم`,
          `حمل الدرفلة = ${fmt(loadKn, 1)} kN`,
          `القدرة الميكانيكية = ${fmt(powerKw, 1)} كيلووات`
        ]
      };
    }
  },
  {
    id: 'e2',
    title: 'حساب أمبير الموتور ثلاثي الأوجه (Amperes)',
    desc: 'حساب التيار المتوقع سحبه للموتور من الكيلووات والجهد.',
    icon: Cpu,
    group: 'قوى وكهرباء',
    formula: 'I (Amp) = (P_kW × 1000) / (√3 × V × PF × η)',
    inputs: [
      { k: 'kw', l: 'قدرة الموتور (kW)', def: 400 },
      { k: 'v', l: 'الجهد الكهربائي (Volt)', def: 400 },
      { k: 'pf', l: 'معامل القدرة (PF)', def: 0.86 },
      { k: 'eff', l: 'كفاءة الموتور η', def: 0.94 }
    ],
    calc: (v) => {
      const kw = num(v.kw);
      const volt = Math.max(1, num(v.v));
      const pf = Math.max(0.1, num(v.pf));
      const eff = Math.max(0.1, num(v.eff));
      const amp = (kw * 1000) / (Math.sqrt(3) * volt * pf * eff);
      return {
        results: { 'التيار المسحوب المتوقع (Amperes)': `${fmt(amp, 1)} A` },
        steps: [`القدرة بالوات = ${kw * 1000} W`, `الأمبير المسحوب I = ${fmt(amp, 1)} أمبير`]
      };
    }
  },
  {
    id: 'e3',
    title: 'تردد الإنفرتر والسرعة التزامنية (VFD Hz)',
    desc: 'حساب التردد بالهرتز المطلوب إخراجه من الدرايف.',
    icon: Zap,
    group: 'قوى وكهرباء',
    formula: 'f (Hz) = (N_motor × Poles) / 120',
    inputs: [
      { k: 'rpm', l: 'سرعة الموتور المطلوبة (RPM)', def: 1250 },
      { k: 'poles', l: 'عدد أقطاب الموتور (4 أو 6)', def: 4 }
    ],
    calc: (v) => {
      const rpm = num(v.rpm);
      const p = Math.max(2, num(v.poles));
      const hz = (rpm * p) / 120;
      return {
        results: { 'تردد خرج الـ VFD المطلوب (Hz)': `${fmt(hz, 1)} Hz` },
        steps: [`التردد f = (${rpm} × ${p}) / 120 = ${fmt(hz, 1)} Hz`]
      };
    }
  }
];

const UnifiedCalculatorsView = () => {
  const [selectedGroup, setSelectedGroup] = useState('الكل');
  const [activeCalcId, setActiveCalcId] = useState(null);
  const [vals, setVals] = useState({});

  const groups = ['الكل', 'باس ديزاين وإنتاجية', 'قوى وكهرباء', 'درفلة وسرعات', 'أتمتة وفنش'];

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
          className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5"
        >
          <ArrowLeft size={15} className="rotate-180" /> رجوع لكل القوانين
        </button>

        <div className="bg-slate-900 p-4 sm:p-6 rounded-2xl border border-slate-800 max-w-2xl mx-auto shadow-xl">
          <div className="flex items-center gap-3 mb-4 border-b border-slate-800 pb-3.5">
            <div className="bg-blue-600/20 p-2.5 rounded-xl border border-blue-500/30 shrink-0">
              <c.icon className="w-5 h-5 sm:w-6 sm:h-6 text-blue-400" />
            </div>
            <div>
              <span className="text-[11px] text-blue-400 font-bold">{c.group}</span>
              <h2 className="text-base sm:text-xl font-black text-white">{c.title}</h2>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {c.inputs.map((inp) => (
              <div key={inp.k}>
                <label className="block text-[11px] sm:text-xs font-bold text-slate-400 mb-1">{inp.l}</label>
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

          <div className="mt-4 bg-slate-950 p-4 rounded-xl border border-blue-500/40 space-y-2">
            {Object.entries(results).map(([k, v]) => (
              <div key={k} className="flex justify-between items-center border-b border-slate-800/80 last:border-0 pb-2 last:pb-0 gap-2">
                <span className="text-slate-300 font-bold text-xs sm:text-sm">{k}</span>
                <span className="text-blue-400 font-black font-mono text-sm sm:text-lg text-left">{v}</span>
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
            className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all shrink-0 ${
              selectedGroup === grp
                ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-white'
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
            className={`text-right p-3.5 sm:p-4 rounded-2xl border transition-all flex items-start gap-3 group hover:-translate-y-0.5 ${
              c.isSpecial
                ? 'bg-gradient-to-l from-blue-950/60 to-slate-900 border-blue-500/40 hover:border-blue-400'
                : 'bg-slate-900 hover:bg-slate-800/90 border-slate-800 hover:border-blue-500/50'
            }`}
          >
            <div
              className={`w-10 h-10 sm:w-11 sm:h-11 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-105 ${
                c.isSpecial
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : 'bg-slate-950 border border-slate-800 text-blue-400'
              }`}
            >
              <c.icon className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-1">
                <span className="text-[10px] font-bold text-blue-400">{c.group}</span>
                {c.isSpecial && (
                  <span className="text-[9px] bg-amber-500/20 text-amber-300 border border-amber-500/30 px-1.5 py-0.5 rounded font-bold">
                    مطور
                  </span>
                )}
              </div>
              <h3 className="text-xs sm:text-sm font-black text-white mt-0.5 truncate">{c.title}</h3>
              <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">{c.desc}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

/* ======================================================
   6. الجداول ومحول الوحدات الهندسي (Tables & Converter)
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
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        <div className="lg:col-span-5 bg-slate-900 p-4 rounded-2xl border border-slate-800 space-y-3">
          <h3 className="text-sm sm:text-base font-bold text-white border-b border-slate-800 pb-2">
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

        <div className="lg:col-span-7 bg-slate-900 p-4 rounded-2xl border border-rose-500/30 space-y-3">
          <h3 className="text-sm sm:text-base font-bold text-rose-400 border-b border-slate-800 pb-2">القيم المكافئة</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {all.map(([u, v]) => (
              <Stat
                key={u}
                label={u}
                value={Math.abs(v) >= 1e6 || (Math.abs(v) < 1e-3 && v !== 0) ? v.toExponential(2) : fmt(v, 3)}
                color={u === unit ? 'text-rose-400' : 'text-white'}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 overflow-x-auto">
        <h3 className="text-sm sm:text-base font-bold text-white mb-3">
          جدول الأوزان القياسية والتجاوزات لحديد التسليح (ISO 6935-2 / ES 262)
        </h3>
        <table className="w-full text-right text-xs min-w-[480px]">
          <thead className="bg-slate-950 text-slate-400">
            <tr>
              <th className="p-2.5 rounded-r-lg">المقاس</th>
              <th className="p-2.5">المساحة mm²</th>
              <th className="p-2.5">أقل وزن</th>
              <th className="p-2.5">الوزن الاسمي (كجم/م)</th>
              <th className="p-2.5">أقصى وزن</th>
              <th className="p-2.5 rounded-l-lg">كود اللون</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 font-mono">
            {REBAR_SPECS.map((r) => (
              <tr key={r.size} className="hover:bg-slate-800/40">
                <td className="p-2.5 font-bold text-white">{r.size} مم</td>
                <td className="p-2.5 text-slate-300">{r.area}</td>
                <td className="p-2.5 text-red-400">{r.minW}</td>
                <td className="p-2.5 text-emerald-400 font-bold">{r.nomW}</td>
                <td className="p-2.5 text-amber-400">{r.maxW}</td>
                <td className="p-2.5 font-sans text-blue-300">{r.color}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

/* ======================================================
   7. مجتمع المهندسين المطور وموسوعة الأعطال (Community Pro)
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
      <div className="bg-slate-900 border border-slate-800 p-3.5 rounded-2xl flex flex-wrap justify-between items-center gap-3">
        <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-800">
          <button
            onClick={() => setSubMode('feed')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
              subMode === 'feed' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            <MessageCircle size={14} /> المنشورات والنقاشات
          </button>
          <button
            onClick={() => setSubMode('faults')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all ${
              subMode === 'faults' ? 'bg-amber-500 text-slate-950' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Wrench size={14} /> موسوعة العيوب والأعطال
          </button>
        </div>

        <div className="flex items-center gap-2 flex-1 sm:flex-initial justify-end">
          <div className="relative flex-1 sm:w-60">
            <Search size={14} className="absolute right-3 top-2.5 text-slate-500" />
            <input
              type="text"
              placeholder="ابحث في النقاشات أو الأعطال..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pr-8 pl-3 py-1.5 text-xs text-white outline-none focus:border-blue-500"
            />
          </div>
          {subMode === 'feed' && (
            <button
              onClick={() => setShowNewPostForm(!showNewPostForm)}
              className="bg-blue-600 hover:bg-blue-500 text-white px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1 shrink-0 shadow"
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
                  className={`px-3 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap transition-all ${
                    categoryFilter === cat
                      ? 'bg-blue-600/20 text-blue-400 border border-blue-500/40'
                      : 'bg-slate-900 text-slate-400 border border-slate-800'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {showNewPostForm && (
              <form onSubmit={handleCreatePost} className="bg-slate-900 border border-blue-500/40 rounded-2xl p-4 space-y-3 shadow-xl">
                <h3 className="text-sm font-bold text-white flex items-center gap-1.5">
                  <Sparkles size={15} className="text-blue-400" /> مشاركة معلومة فنية أو سؤال للزملاء
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
                  className={inputCls + ' font-bold'}
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
                    className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 text-xs font-bold"
                  >
                    إلغاء
                  </button>
                  <button type="submit" className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold">
                    نشر الآن
                  </button>
                </div>
              </form>
            )}

            {visiblePosts.map((post) => (
              <div key={post.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 sm:p-5 space-y-3.5 shadow-md">
                <div className="flex justify-between items-start gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-black text-base shrink-0">
                      {post.author.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h4 className="font-bold text-white text-sm">{post.author}</h4>
                        <span className="text-[10px] bg-blue-500/20 text-blue-400 px-2 py-0.5 rounded-full font-bold">
                          {post.badge}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400">
                        {post.role} • {post.time}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    {post.solved && (
                      <span className="text-[10px] bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                        <Check size={11} /> محلول
                      </span>
                    )}
                    <span className="text-[10px] bg-slate-800 text-slate-300 px-2.5 py-0.5 rounded-full">{post.category}</span>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm sm:text-base font-bold text-blue-300 mb-1.5">{post.title}</h3>
                  <p className="text-xs sm:text-sm text-slate-200 leading-relaxed whitespace-pre-line">{post.content}</p>
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-2.5 border-t border-slate-800 text-xs">
                  <button
                    onClick={() => handleReaction(post.id, 'like')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition-colors ${
                      post.liked ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    <ThumbsUp size={13} /> مفيد ({post.likes})
                  </button>
                  <button
                    onClick={() => handleReaction(post.id, 'fire')}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold transition-colors ${
                      post.fired ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    <Flame size={13} /> معلومة ذهبية ({post.fires})
                  </button>
                  <span className="text-slate-400 font-bold mr-auto flex items-center gap-1">
                    <MessageCircle size={13} /> {post.comments.length} ردود
                  </span>
                </div>

                <div className="bg-slate-950 p-3 rounded-xl border border-slate-800/90 space-y-2.5">
                  {post.comments.map((c) => (
                    <div
                      key={c.id}
                      className={`p-2.5 rounded-xl border ${
                        c.isBest ? 'bg-emerald-950/30 border-emerald-500/40' : 'bg-slate-900 border-slate-800/80'
                      }`}
                    >
                      <div className="flex justify-between items-center mb-1">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-emerald-400">{c.user}</span>
                          {c.isBest && (
                            <span className="text-[9px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded font-bold">
                              ✓ أفضل إجابة فنية
                            </span>
                          )}
                        </div>
                        <button
                          onClick={() => toggleBestComment(post.id, c.id)}
                          className="text-[10px] text-slate-500 hover:text-emerald-400"
                        >
                          {c.time}
                        </button>
                      </div>
                      <p className="text-xs text-slate-200 leading-relaxed">{c.text}</p>
                    </div>
                  ))}

                  <div className="flex flex-col sm:flex-row gap-1.5 pt-1">
                    <input
                      type="text"
                      placeholder="اسمك..."
                      value={commentAuthor}
                      onChange={(e) => setCommentAuthor(e.target.value)}
                      className="sm:w-32 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none"
                    />
                    <div className="flex flex-1 gap-1.5">
                      <input
                        type="text"
                        placeholder="أضف ردك أو خبرتك الفنية..."
                        value={commentInputs[post.id] || ''}
                        onChange={(e) => setCommentInputs({ ...commentInputs, [post.id]: e.target.value })}
                        className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none"
                      />
                      <button
                        onClick={() => handleAddComment(post.id)}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white px-3.5 py-1.5 rounded-lg text-xs font-bold shrink-0"
                      >
                        رد
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="lg:col-span-4 space-y-4">
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
              <h3 className="text-sm font-bold text-amber-400 flex items-center gap-1.5">
                <Award size={17} /> لوحة شرف خبراء الدرفلة
              </h3>
              <div className="space-y-2 text-xs">
                {[
                  { name: 'م. بسام وليد', role: 'مشغل أول غرفة تحكم & كنترول', pts: 185 },
                  { name: 'م. عادل عزالدين', role: 'مهندس أتمتة وتحكم', pts: 140 },
                  { name: 'م. إسلام عرفات', role: 'خبير درفلة وباس ديزاين', pts: 125 }
                ].map((u, i) => (
                  <div key={u.name} className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <span className="w-5 h-5 rounded-full bg-amber-500/20 text-amber-400 font-mono text-[11px] font-bold flex items-center justify-center">
                        {i + 1}
                      </span>
                      <div>
                        <p className="font-bold text-white">{u.name}</p>
                        <p className="text-[10px] text-slate-400">{u.role}</p>
                      </div>
                    </div>
                    <span className="font-mono font-bold text-emerald-400">{u.pts} نقطة</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
          {filteredFaults.map((f) => (
            <div key={f.id} className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <span className="bg-red-500/20 text-red-400 font-black px-2.5 py-0.5 rounded-lg text-xs border border-red-500/30">
                  {f.code}
                </span>
                <span className="text-[11px] bg-slate-800 text-slate-300 px-2.5 py-0.5 rounded-full">{f.brand}</span>
              </div>
              <h3 className="text-sm font-bold text-white">{f.title}</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                <strong className="text-amber-400">السبب: </strong> {f.cause}
              </p>
              <div className="bg-slate-950 p-3 rounded-xl border border-emerald-900/40 text-xs text-emerald-300 font-bold mt-auto">
                <strong className="text-emerald-400">الحل العملي: </strong> {f.solution}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

/* ======================================================
   8. المكون الرئيسي لبوابة المهندسين (PublicPortal)
   ====================================================== */
export default function PublicPortal({ onBack }) {
  const [activeTab, setActiveTab] = useState('calculators');
  const tabs = [
    { id: 'calculators', label: 'كل القوانين والحاسبات', icon: Calculator },
    { id: 'tables', label: 'التحويلات والجداول', icon: Ruler },
    { id: 'community', label: 'المجتمع والأعطال', icon: MessageCircle }
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans" dir="rtl">
      <header className="sticky top-0 z-30 bg-slate-950/90 backdrop-blur-md border-b border-slate-800/80">
        <div className="max-w-6xl mx-auto px-3 py-2.5 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="bg-blue-600 p-1.5 sm:p-2 rounded-xl shadow-md shadow-blue-600/20">
                <Calculator className="text-white w-4 h-4 sm:w-5 sm:h-5" />
              </div>
              <div>
                <h1 className="text-sm sm:text-base font-black text-white leading-tight">بوابة المهندسين والحسابات</h1>
                <p className="text-[10px] text-slate-400 font-bold hidden sm:block">
                  قوانين الدرفلة، الكهرباء، الباس ديزاين، والمجتمع الفني
                </p>
              </div>
            </div>

            <button
              onClick={onBack}
              className="sm:hidden bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 font-bold px-2.5 py-1.5 rounded-xl text-xs flex items-center gap-1"
            >
              <Home size={13} /> الرئيسية
            </button>
          </div>

          <div className="flex items-center gap-2">
            <div className="grid grid-cols-3 sm:flex bg-slate-900 p-1 rounded-xl border border-slate-800 w-full sm:w-auto">
              {tabs.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id)}
                  className={`px-2.5 sm:px-3.5 py-1.5 rounded-lg text-[11px] sm:text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                    activeTab === t.id ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <t.icon className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">{t.label}</span>
                </button>
              ))}
            </div>

            <button
              onClick={onBack}
              className="hidden sm:flex bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 font-bold px-3.5 py-2 rounded-xl text-xs items-center gap-1.5 shrink-0"
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