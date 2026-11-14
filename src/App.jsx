import React, { useState } from 'react';
import {
  Calculator, Wrench, Building2, Zap, Search,
  PlusCircle, Key, ArrowRight, ThumbsUp, MessageCircle,
  Gauge, Layers, Scissors, Flame, Sparkles, Activity,
  ArrowLeftRight, Repeat, Ruler
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
// 1. مركز الحاسبات الهندسية (بنظام بطاقات الاختيار السلسة)
// ============================================================================
const SmartCalculatorsCenter = () => {
  const [selectedTool, setSelectedTool] = useState(null);

  // --- أداة: محوّل السرعات الشامل (RPM ↔ m/s ↔ m/min) + Jog ---
  const [convMode, setConvMode] = useState('motor_rpm');
  const [convValue, setConvValue] = useState(1450);
  const [convDw, setConvDw] = useState(480);
  const [convGear, setConvGear] = useState(3.4);
  const [jogRpm, setJogRpm] = useState(100);
  const [jogOn, setJogOn] = useState('motor');
  const [baseRpm, setBaseRpm] = useState(750);
  const [maxRpm, setMaxRpm] = useState(1750);
  const [newDw, setNewDw] = useState(440);

  // --- أداة: سرعة المرور والاستطالة بين الممرات ---
  const [pA1, setPA1] = useState(500);
  const [pA2, setPA2] = useState(390);
  const [pV1, setPV1] = useState(2);
  const [pL1, setPL1] = useState(10);
  const [pSlip, setPSlip] = useState(0);
  const [pDw2, setPDw2] = useState(455);
  const [pGear2, setPGear2] = useState(3.4);
  const [tBilletSide, setTBilletSide] = useState(130);
  const [tProdArea, setTProdArea] = useState(113);
  const [tStrands, setTStrands] = useState(2);
  const [tVentry, setTVentry] = useState(0.12);
  const [tBilletLen, setTBilletLen] = useState(12);

  // --- أداة: تحويل الوحدات ---
  const [ucCat, setUcCat] = useState('speed');
  const [ucUnit, setUcUnit] = useState('m/s');
  const [ucVal, setUcVal] = useState(1);

  // --- متغيرات الأداة: القطر الفعال والسرعة وثابت الدرفلة ---
  const [rollDe, setRollDe] = useState(480);
  const [passArea, setPassArea] = useState(500);
  const [passWidth, setPassWidth] = useState(50);
  const [rollGap, setRollGap] = useState(3);
  const [motorRpm, setMotorRpm] = useState(1450);
  const [gearRatio, setGearRatio] = useState(3.4);
  const [overSpeedPct, setOverSpeedPct] = useState(3);
  const [nextStandArea, setNextStandArea] = useState(390);

  // --- متغيرات الأداة: الطاقة الإنتاجية، الإدرار، والإتاحية ---
  const [billetWeightKg, setBilletWeightKg] = useState(265);
  const [lineSpeedMps, setLineSpeedMps] = useState(12);
  const [barMeterWeight, setBarMeterWeight] = useState(0.888);
  const [strandsCount, setStrandsCount] = useState(2);
  const [gapTimeSec, setGapTimeSec] = useState(4);
  const [billetsPerShift, setBilletsPerShift] = useState(500);
  const [calendarHours, setCalendarHours] = useState(24);
  const [plannedStopHours, setPlannedStopHours] = useState(2);
  const [unplannedDownHours, setUnplannedDownHours] = useState(2.5);
  const [chargedBilletsTons, setChargedBilletsTons] = useState(500);
  const [finishedProdTons, setFinishedProdTons] = useState(482);

  // --- متغيرات الأداة: الضغطة، زاوية العض، وحمل وقدرة الدرفلة ---
  const [h1, setH1] = useState(18);
  const [h2, setH2] = useState(12);
  const [wBar, setWBar] = useState(45);
  const [sigmaMetal, setSigmaMetal] = useState(120);
  const [frictionMu, setFrictionMu] = useState(0.35);
  const [leverArmA, setLeverArmA] = useState(0.5);
  const [availMotorKw, setAvailMotorKw] = useState(600);
  const [torqueRollRpm, setTorqueRollRpm] = useState(427); // لفات الدرفيل لحساب القدرة (كانت مرتبطة بالأداة الأولى بشكل خفي)

  // --- متغيرات الأداة: المقص الطائر، اللوبر، والأبرون ---
  const [shearMotorRpm, setShearMotorRpm] = useState(1200);
  const [shearGearRatio, setShearGearRatio] = useState(4.0);
  const [shearRadiusM, setShearRadiusM] = useState(0.35);
  const [upstreamSpeedMps, setUpstreamSpeedMps] = useState(10.0);
  const [hmdToShearM, setHmdToShearM] = useState(4.5);
  const [headCropM, setHeadCropM] = useState(0.25);
  const [shearHomeAngleRad, setShearHomeAngleRad] = useState(1.2);
  const [looperCenterX, setLooperCenterX] = useState(150);
  const [barRadiusR, setBarRadiusR] = useState(8);
  const [finishSpeedApron, setFinishSpeedApron] = useState(14);

  // ===================== الحسابات =====================
  // 0) محوّل السرعات + Jog + أثر الخراطة
  const cCirc = (Math.PI * num(convDw)) / 1000; // محيط الدرفيل الفعال (متر)
  let cRoll = 0;
  if (convMode === 'motor_rpm') cRoll = num(convGear) > 0 ? num(convValue) / num(convGear) : 0;
  else if (convMode === 'roll_rpm') cRoll = num(convValue);
  else if (convMode === 'lin_mps') cRoll = cCirc > 0 ? (num(convValue) * 60) / cCirc : 0;
  else if (convMode === 'lin_mpm') cRoll = cCirc > 0 ? num(convValue) / cCirc : 0;
  const cMotor = cRoll * num(convGear);
  const cMps = (cCirc * cRoll) / 60;
  const cOmega = (2 * Math.PI * cRoll) / 60;

  const jogRoll = jogOn === 'motor' ? (num(convGear) > 0 ? num(jogRpm) / num(convGear) : 0) : num(jogRpm);
  const jogMotor = jogRoll * num(convGear);
  const jogMps = (cCirc * jogRoll) / 60;

  const wearMotor = num(newDw) > 0 ? (cMotor * num(convDw)) / num(newDw) : 0;
  const zoneOf = (rpm) => {
    if (rpm <= 0) return ['—', 'text-slate-400'];
    if (rpm < num(baseRpm)) return ['أقل من Base Speed: فقد في العزم', 'text-red-400'];
    if (rpm <= 0.86 * num(maxRpm)) return ['داخل النطاق الآمن', 'text-emerald-400'];
    if (rpm <= num(maxRpm)) return ['منطقة حرجة (أعلى من 0.86×Max)', 'text-amber-400'];
    return ['تجاوز السرعة القصوى للموتور!', 'text-red-400'];
  };
  const zoneNow = zoneOf(cMotor);
  const zoneWear = zoneOf(wearMotor);

  // 0-ب) سرعة المرور والاستطالة
  const pLam = num(pA2) > 0 ? num(pA1) / num(pA2) : 0;
  const pRR = num(pA1) > 0 ? ((num(pA1) - num(pA2)) / num(pA1)) * 100 : 0;
  const pV2 = num(pV1) * pLam;
  const pL2 = num(pL1) * pLam;
  const pVroll = pV2 / (1 + num(pSlip) / 100);
  const pRollRpm2 = num(pDw2) > 0 ? (pVroll * 60) / ((Math.PI * num(pDw2)) / 1000) : 0;
  const pMotorRpm2 = pRollRpm2 * num(pGear2);
  const tLam =
    num(tProdArea) * num(tStrands) > 0 ? Math.pow(num(tBilletSide), 2) / (num(tProdArea) * num(tStrands)) : 0;
  const tVfinal = num(tVentry) * tLam;
  const tLenFinal = num(tBilletLen) * tLam;
  const tCuts = Math.floor(tLenFinal / 48);
  const tShortBar = tLenFinal - tCuts * 48;
  const tPassTime = num(tVentry) > 0 ? num(tBilletLen) / num(tVentry) : 0;

  // 0-ج) تحويل الوحدات
  const ucGroup = UNIT_GROUPS[ucCat];
  const ucAll = ucGroup.temp
    ? ucGroup.units.map(([u]) => [u, fromCelsius(toCelsius(num(ucVal), ucUnit), u)])
    : (() => {
        const from = ucGroup.units.find((x) => x[0] === ucUnit);
        const base = num(ucVal) * (from ? from[1] : 1);
        return ucGroup.units.map(([u, f]) => [u, base / f]);
      })();

  // 1) القطر الفعال والسرعات
  const grooveFactor = num(passWidth) > 0 ? num(passArea) / num(passWidth) - num(rollGap) : 0;
  const workingDiaDw = Math.max(1, num(rollDe) - grooveFactor);
  const rollRpmNo = num(gearRatio) > 0 ? num(motorRpm) / num(gearRatio) : 0;
  const peripheralSpeedVr = (Math.PI * workingDiaDw * rollRpmNo) / 60000;
  const leadSpeedWithOver = peripheralSpeedVr * (1 + num(overSpeedPct) / 100);
  const millConstantQ = num(passArea) * peripheralSpeedVr;
  const nextStandReqSpeed = num(nextStandArea) > 0 ? millConstantQ / num(nextStandArea) : 0;

  // 2) الطاقة الإنتاجية والإدرار والإتاحية
  const lineKgPerSec = num(lineSpeedMps) * num(barMeterWeight) * num(strandsCount);
  const rollingTimeOnlySec = lineKgPerSec > 0 ? num(billetWeightKg) / lineKgPerSec : 0;
  const totalBilletCycleSec = rollingTimeOnlySec + num(gapTimeSec);
  const billetsPerHour = totalBilletCycleSec > 0 ? 3600 / totalBilletCycleSec : 0;
  const capacityTonPerHr = (billetsPerHour * num(billetWeightKg)) / 1000;
  const shiftGapLostMins = (num(billetsPerShift) * num(gapTimeSec)) / 60;
  const plannedOpTime = Math.max(0.1, num(calendarHours) - num(plannedStopHours));
  const actualRollingTime = Math.max(0, plannedOpTime - num(unplannedDownHours));
  const availabilityPct = (actualRollingTime / plannedOpTime) * 100;
  const utilizationPct = (actualRollingTime / Math.max(0.1, num(calendarHours))) * 100;
  const yieldPct = num(chargedBilletsTons) > 0 ? (num(finishedProdTons) / num(chargedBilletsTons)) * 100 : 0;
  const netProductivityTonHr = capacityTonPerHr * (yieldPct / 100) * (availabilityPct / 100);

  // 3) الضغطة وحمل الدرفلة والعزم والقدرة
  const absDraft = Math.max(0, num(h1) - num(h2));
  const relDraftPct = num(h1) > 0 ? (absDraft / num(h1)) * 100 : 0;
  const rollRadiusR = num(rollDe) / 2;
  const maxDraftSimple = Math.pow(num(frictionMu), 2) * rollRadiusR;
  const contactLenLp = Math.sqrt(rollRadiusR * absDraft);
  const biteAngleDeg =
    (Math.acos(Math.max(-1, Math.min(1, 1 - absDraft / Math.max(1, num(rollDe))))) * 180) / Math.PI;
  const canBiteCondition = num(frictionMu) >= Math.tan((biteAngleDeg * Math.PI) / 180);
  const rollingLoadKn = (num(sigmaMetal) * num(wBar) * contactLenLp) / 1000;
  const rollingTorqueKnm = 2 * rollingLoadKn * num(leverArmA) * (contactLenLp / 1000);
  const rollingPowerKw = (rollingTorqueKnm * 2 * Math.PI * num(torqueRollRpm)) / 60;
  const motorUtilFactor = num(availMotorKw) > 0 ? (rollingPowerKw / num(availMotorKw)) * 100 : 0;

  // 4) المقص الطائر، اللوبر، والأبرون
  const shearRpmNcv = num(shearGearRatio) > 0 ? num(shearMotorRpm) / num(shearGearRatio) : 0;
  const shearOmega = (2 * Math.PI * shearRpmNcv) / 60;
  const shearLinearVelVcv = shearOmega * num(shearRadiusM);
  const shearOverSpeedPct =
    num(upstreamSpeedMps) > 0 ? ((shearLinearVelVcv - num(upstreamSpeedMps)) / num(upstreamSpeedMps)) * 100 : 0;
  const shearCutCommandTimeTcv =
    num(upstreamSpeedMps) > 0 && shearOmega > 0
      ? (num(headCropM) + num(hmdToShearM)) / num(upstreamSpeedMps) - num(shearHomeAngleRad) / shearOmega
      : 0;
  const looperFixedRollH = num(looperCenterX) + num(barRadiusR);
  const looperKickerRollY = looperFixedRollH + looperFixedRollH / 3;
  const apronClosedBoxesX = Math.pow(num(finishSpeedApron), 2) / 8;

  const toolsList = [
    {
      id: 'speed_converter',
      title: 'محوّل السرعات الشامل (RPM ↔ m/s ↔ m/min) و Jog',
      desc: 'أدخل أي سرعة (موتور / درفيل / خطية) واحصل على الباقي، مع سرعة Jog وأثر خراطة الدرفيل على لفات الموتور.',
      icon: ArrowLeftRight,
      color: 'from-sky-600 to-blue-500',
      badge: 'سرعات وتحويلات'
    },
    {
      id: 'pass_speed',
      title: 'سرعة المرور والاستطالة بين الممرات',
      desc: 'سرعة الخروج من ثابت الدرفلة (A×V)، الاستطالة، نسبة التخفيض، الانزلاق الأمامي، RPM الموتور المطلوب، والطول الكلي من البيليت.',
      icon: Repeat,
      color: 'from-teal-600 to-emerald-500',
      badge: 'سرعات وتحويلات'
    },
    {
      id: 'unit_converter',
      title: 'تحويل الوحدات الهندسية',
      desc: 'سرعة، لفات، طول، وزن، وزن المتر، قدرة، قوة، عزم، إجهاد، وحرارة.',
      icon: Ruler,
      color: 'from-rose-600 to-pink-500',
      badge: 'تحويلات'
    },
    {
      id: 'speed_effective',
      title: 'القطر الفعال ومراجع السرعات وثابت الدرفلة',
      desc: 'حساب Groove Factor، القطر الفعال Dw، السرعة الخطية، الـ Over Speed، وتزامن القوائم المتتالي (Cascade).',
      icon: Gauge,
      color: 'from-blue-600 to-cyan-500',
      badge: 'أساسي للكنترول'
    },
    {
      id: 'productivity_yield',
      title: 'الطاقة الإنتاجية والإدرار (Yield) والإتاحية',
      desc: 'حساب زمن درفلة البيليت، الفجوة الزمنية (Gap Time)، طن/ساعة، نسبة الإدرار، و Mill Utilization.',
      icon: Activity,
      color: 'from-emerald-600 to-teal-500',
      badge: 'تقارير وتشغيل'
    },
    {
      id: 'load_torque_bite',
      title: 'الضغطة، زاوية العض، وحمل وقدرة الموتور',
      desc: 'حساب أقصى ضغطة، شرط العض لمنع الزحلقة (Slipping)، قوس التلامس، العزم، ومعامل استغلال الموتور.',
      icon: Flame,
      color: 'from-amber-600 to-orange-500',
      badge: 'هندسة درفلة'
    },
    {
      id: 'shear_looper_apron',
      title: 'المقص الطائر، ضبط اللوبر، ومسافة رمي الأبرون',
      desc: 'معادلات الـ Continuity للمقص الطائر، ارتفاعات بكر اللوبر (H & Y)، وعدد علب الأبرون المغلقة على سرير التبريد.',
      icon: Scissors,
      color: 'from-purple-600 to-pink-500',
      badge: 'أتمتة وفنش'
    },
    {
      id: 'rebar_specs',
      title: 'جدول مواصفات وأوزان حديد التسليح والقطاعات',
      desc: 'الحد الأدنى والاسمي والأقصى لوزن المتر الطولي (ECISP / ISO)، المساحة الاسمية، وأكواد ألوان المقاسات.',
      icon: Layers,
      color: 'from-indigo-600 to-blue-500',
      badge: 'جودة ومواصفات'
    }
  ];

  // شاشة عرض البطاقات النظيفة (قبل اختيار الحاسبة)
  if (!selectedTool) {
    return (
      <div className="space-y-5">
        <div className="bg-gradient-to-l from-slate-900 via-slate-900 to-blue-950/60 border border-slate-800 p-5 sm:p-6 rounded-3xl">
          <span className="inline-flex items-center gap-1.5 text-xs font-bold bg-blue-500/15 text-blue-400 border border-blue-500/30 px-3 py-1 rounded-full mb-2">
            <Sparkles size={13} /> اختر الأداة التي تريد حسابها فوراً
          </span>
          <h2 className="text-2xl md:text-3xl font-extrabold text-white">مركز حاسبات وقوانين الدرفلة الذكي</h2>
          <p className="text-slate-400 text-sm mt-1">اضغط على أي بطاقة لفتح الحاسبة المخصصة لها</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {toolsList.map((tool) => {
            const IconComponent = tool.icon;
            return (
              <div
                key={tool.id}
                onClick={() => setSelectedTool(tool.id)}
                className="group bg-slate-900/90 hover:bg-slate-900 border border-slate-800 hover:border-blue-500/50 rounded-3xl p-5 cursor-pointer transition-all duration-200 hover:-translate-y-1 flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${tool.color} flex items-center justify-center shadow-lg`}>
                      <IconComponent className="text-white" size={28} />
                    </div>
                    <span className="text-[11px] font-bold bg-slate-800 text-slate-300 px-3 py-1 rounded-full border border-slate-700">
                      {tool.badge}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-white group-hover:text-blue-400 transition-colors">{tool.title}</h3>
                  <p className="text-xs text-slate-400 leading-relaxed mt-2">{tool.desc}</p>
                </div>
                <div className="mt-5 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs font-bold text-blue-400">
                  <span>افتح الحاسبة الآن</span>
                  <ArrowRight size={16} className="rotate-180 group-hover:-translate-x-1 transition-transform" />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // شاشة الأداة المختارة
  return (
    <div className="space-y-5">
      <div className="bg-slate-900 border border-slate-800 p-3 sm:p-4 rounded-2xl flex justify-between items-center gap-3">
        <button
          onClick={() => setSelectedTool(null)}
          className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-colors"
        >
          <ArrowRight size={17} />
          <span>الرجوع لكل الحاسبات</span>
        </button>
        <span className="hidden sm:block text-xs text-slate-400 font-medium">
          القوانين معتمدة طبقاً لدليل نظم التحكم في الدرفلة
        </span>
      </div>

      {/* ===== محوّل السرعات الشامل + Jog ===== */}
      {selectedTool === 'speed_converter' && (
        <Shell
          border="border-sky-500/30"
          inputs={
            <>
              <Title>أدخل السرعة المعلومة</Title>
              <div className="grid grid-cols-2 gap-3">
                <SelectField
                  label="المعلوم عندي"
                  value={convMode}
                  onChange={setConvMode}
                  className="col-span-2"
                  options={[
                    ['motor_rpm', 'سرعة الموتور (RPM)'],
                    ['roll_rpm', 'لفات الدرفيل (RPM)'],
                    ['lin_mps', 'السرعة الخطية (m/s)'],
                    ['lin_mpm', 'السرعة الخطية (m/min)']
                  ]}
                />
                <Field label="القيمة" value={convValue} onChange={setConvValue} step="0.1" className="col-span-2" />
                <Field label="القطر الفعال Dw (mm)" value={convDw} onChange={setConvDw} />
                <Field label="نسبة الجيربوكس" value={convGear} onChange={setConvGear} step="0.1" />
              </div>

              <div className="border-t border-slate-800 pt-4 space-y-3">
                <p className="text-sm font-bold text-amber-400">السرعة البطيئة (Jog)</p>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="سرعة Jog (RPM)" value={jogRpm} onChange={setJogRpm} />
                  <SelectField
                    label="مقاسة على"
                    value={jogOn}
                    onChange={setJogOn}
                    options={[['motor', 'الموتور'], ['roll', 'الدرفيل']]}
                  />
                </div>
              </div>

              <div className="border-t border-slate-800 pt-4 space-y-3">
                <p className="text-sm font-bold text-purple-400">حدود الموتور وأثر خراطة الدرفيل</p>
                <div className="grid grid-cols-3 gap-3">
                  <Field label="Base RPM" value={baseRpm} onChange={setBaseRpm} />
                  <Field label="Max RPM" value={maxRpm} onChange={setMaxRpm} />
                  <Field label="Dw بعد الخراطة" value={newDw} onChange={setNewDw} />
                </div>
              </div>
            </>
          }
          results={
            <>
              <Title color="text-sky-400">كل التحويلات</Title>
              <div className="grid grid-cols-2 gap-3">
                <Stat label="موتور (RPM)" value={fmt(cMotor, 1)} />
                <Stat label="درفيل (RPM)" value={fmt(cRoll, 1)} />
                <Stat label="m/s" value={fmt(cMps, 3)} color="text-sky-400" big />
                <Stat label="m/min" value={fmt(cMps * 60, 1)} color="text-emerald-400" />
                <Stat label="km/h" value={fmt(cMps * 3.6, 2)} />
                <Stat label="ω الدرفيل (rad/s)" value={fmt(cOmega, 2)} />
              </div>
              <Box>
                <Row label="Jog: لفات الموتور" value={`${fmt(jogMotor, 1)} RPM`} color="text-amber-400" />
                <Row label="Jog: لفات الدرفيل" value={`${fmt(jogRoll, 1)} RPM`} color="text-amber-400" />
                <Row label="Jog: السرعة الخطية" value={`${fmt(jogMps, 3)} m/s (${fmt(jogMps * 60, 1)} m/min)`} />
                <Row label="Jog: زمن قطع متر واحد" value={`${jogMps > 0 ? fmt(1 / jogMps, 1) : '—'} ث`} />
                <Row label="حالة الموتور الحالية" value={zoneNow[0]} color={zoneNow[1]} top />
                <Row label="موتور بعد الخراطة لنفس السرعة" value={`${fmt(wearMotor, 1)} RPM`} color="text-purple-400" />
                <Row label="حالة الموتور بعد الخراطة" value={zoneWear[0]} color={zoneWear[1]} />
              </Box>
              <Formula>
                V = π·Dw·N_roll / 60 | N_mot = N_roll × GR | N_new = N × Dw/Dw_new
              </Formula>
            </>
          }
        />
      )}

      {/* ===== سرعة المرور والاستطالة ===== */}
      {selectedTool === 'pass_speed' && (
        <Shell
          border="border-emerald-500/30"
          inputs={
            <>
              <Title>ممر واحد (من قائم إلى القائم التالي)</Title>
              <div className="grid grid-cols-2 gap-3">
                <Field label="مساحة الدخول A1 (mm²)" value={pA1} onChange={setPA1} />
                <Field label="مساحة الخروج A2 (mm²)" value={pA2} onChange={setPA2} />
                <Field label="سرعة الدخول V1 (m/s)" value={pV1} onChange={setPV1} step="0.1" />
                <Field label="طول الدخول L1 (m)" value={pL1} onChange={setPL1} step="0.5" />
                <Field label="الانزلاق الأمامي (%)" value={pSlip} onChange={setPSlip} step="0.5" />
                <Field label="Dw القائم التالي (mm)" value={pDw2} onChange={setPDw2} />
                <Field label="Gear Ratio التالي" value={pGear2} onChange={setPGear2} step="0.1" className="col-span-2" />
              </div>

              <div className="border-t border-slate-800 pt-4 space-y-3">
                <p className="text-sm font-bold text-teal-400">من البيليت إلى المنتج النهائي</p>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="ضلع البيليت (mm)" value={tBilletSide} onChange={setTBilletSide} />
                  <Field label="مساحة المنتج (mm²)" value={tProdArea} onChange={setTProdArea} step="0.5" />
                  <SelectField
                    label="عدد البارات (Slitting)"
                    value={tStrands}
                    onChange={setTStrands}
                    options={[[1, '1'], [2, '2'], [3, '3'], [4, '4']]}
                  />
                  <Field label="طول البيليت (m)" value={tBilletLen} onChange={setTBilletLen} step="0.5" />
                  <Field label="سرعة دخول أول قائم (m/s)" value={tVentry} onChange={setTVentry} step="0.01" className="col-span-2" />
                </div>
              </div>
            </>
          }
          results={
            <>
              <Title color="text-emerald-400">نتائج الممر</Title>
              <div className="grid grid-cols-2 gap-3">
                <Stat label="الاستطالة λ = A1/A2" value={fmt(pLam, 3)} color="text-emerald-400" />
                <Stat label="نسبة التخفيض" value={fmt(pRR, 1)} unit="%" />
                <Stat label="سرعة الخروج V2" value={fmt(pV2, 3)} unit="m/s" color="text-sky-400" big />
                <Stat label="طول الخروج L2" value={fmt(pL2, 2)} unit="m" />
              </div>
              <Box>
                <Row label="سرعة محيط الدرفيل المطلوبة" value={`${fmt(pVroll, 3)} m/s`} />
                <Row label="لفات الدرفيل المطلوبة" value={`${fmt(pRollRpm2, 1)} RPM`} />
                <Row label="لفات الموتور المطلوبة" value={`${fmt(pMotorRpm2, 1)} RPM`} color="text-amber-400" />
                <Row label="زيادة السرعة عن القائم السابق" value={`${fmt((pLam - 1) * 100, 1)} %`} />
              </Box>
              <Formula>
                A1·V1 = A2·V2 | λ = A1/A2 | V_roll = V2 / (1 + slip)
              </Formula>

              <Title color="text-teal-400">من البيليت للمنتج</Title>
              <Box>
                <Row label="الاستطالة الكلية" value={fmt(tLam, 1)} color="text-teal-400" />
                <Row label="سرعة الخروج النهائية (لكل بار)" value={`${fmt(tVfinal, 2)} m/s`} color="text-sky-400" />
                <Row label="طول البار الناتج من بيليت" value={`${fmt(tLenFinal, 0)} m`} />
                <Row label="قطعيات المقص (48 م) + بار أخير" value={`${tCuts} + ${fmt(tShortBar, 1)} م`} />
                <Row label="زمن مرور البيليت" value={`${fmt(tPassTime, 1)} ث`} />
              </Box>
            </>
          }
        />
      )}

      {/* ===== تحويل الوحدات ===== */}
      {selectedTool === 'unit_converter' && (
        <Shell
          border="border-rose-500/30"
          inputs={
            <>
              <Title>اختر نوع الوحدة والقيمة</Title>
              <div className="grid grid-cols-2 gap-3">
                <SelectField
                  label="النوع"
                  value={ucCat}
                  onChange={(v) => {
                    setUcCat(v);
                    setUcUnit(UNIT_GROUPS[v].units[0][0]);
                  }}
                  className="col-span-2"
                  options={Object.keys(UNIT_GROUPS).map((k) => [k, UNIT_GROUPS[k].label])}
                />
                <Field label="القيمة" value={ucVal} onChange={setUcVal} step="any" />
                <SelectField
                  label="الوحدة"
                  value={ucUnit}
                  onChange={setUcUnit}
                  options={ucGroup.units.map((u) => [u[0], u[0]])}
                />
              </div>
            </>
          }
          results={
            <>
              <Title color="text-rose-400">النتائج</Title>
              <div className="grid grid-cols-2 gap-3">
                {ucAll.map(([u, v]) => (
                  <Stat
                    key={u}
                    label={u}
                    value={Math.abs(v) >= 1e6 || (Math.abs(v) < 1e-3 && v !== 0) ? v.toExponential(3) : fmt(v, 4)}
                    color={u === ucUnit ? 'text-rose-400' : 'text-white'}
                  />
                ))}
              </div>
            </>
          }
        />
      )}

      {/* ===== القطر الفعال والسرعة وثابت الدرفلة ===== */}
      {selectedTool === 'speed_effective' && (
        <Shell
          inputs={
            <>
              <Title>مدخلات الدرفيل والممر والموتور</Title>
              <div className="grid grid-cols-2 gap-3">
                <Field label="القطر الخارجي De (mm)" value={rollDe} onChange={setRollDe} />
                <Field label="مساحة مقطع الممر (mm²)" value={passArea} onChange={setPassArea} />
                <Field label="عرض الممر (mm)" value={passWidth} onChange={setPassWidth} />
                <Field label="خلوص الدرفيلين Gap (mm)" value={rollGap} onChange={setRollGap} step="0.5" />
                <Field label="سرعة الموتور (RPM)" value={motorRpm} onChange={setMotorRpm} />
                <Field label="نسبة الجيربوكس" value={gearRatio} onChange={setGearRatio} step="0.1" />
                <Field label="Over Speed للعض (%)" value={overSpeedPct} onChange={setOverSpeedPct} step="0.5" />
                <Field label="مساحة القائم التالي A2 (mm²)" value={nextStandArea} onChange={setNextStandArea} />
              </div>
            </>
          }
          results={
            <>
              <Title color="text-blue-400">النتائج الهندسية الفورية</Title>
              <div className="grid grid-cols-2 gap-3">
                <Stat label="Groove Factor" value={fmt(grooveFactor, 2)} unit="mm" />
                <Stat label="القطر الفعال Dw" value={fmt(workingDiaDw, 2)} unit="mm" color="text-emerald-400" />
                <Stat label="لفات الدرفيل" value={fmt(rollRpmNo, 1)} unit="RPM" />
                <Stat label="السرعة الخطية Vr" value={fmt(peripheralSpeedVr, 2)} unit="m/s" color="text-blue-400" big />
              </div>
              <Box>
                <Row label="السرعة بالمتر/دقيقة:" value={`${fmt(peripheralSpeedVr * 60, 1)} m/min`} />
                <Row label="سرعة الدخول مع Over Speed:" value={`${fmt(leadSpeedWithOver, 2)} m/s`} color="text-amber-400" />
                <Row label="ثابت الدرفلة Q = A×V:" value={`${fmt(millConstantQ, 0)} mm²·m/s`} />
                <Row label="السرعة المطلوبة للقائم التالي V2:" value={`${fmt(nextStandReqSpeed, 2)} m/s`} color="text-emerald-400" top />
              </Box>
              <Formula>Dw = De − (Area/Width − Gap) | V = π·Dw·N/60 | Q = A·V</Formula>
            </>
          }
        />
      )}

      {/* ===== الطاقة الإنتاجية والإدرار والإتاحية ===== */}
      {selectedTool === 'productivity_yield' && (
        <Shell
          border="border-emerald-500/30"
          inputs={
            <>
              <Title>مدخلات الإنتاج والبيليت والتوقفات</Title>
              <div className="grid grid-cols-2 gap-3">
                <Field label="وزن البيليت الواحد (كجم)" value={billetWeightKg} onChange={setBilletWeightKg} />
                <Field label="سرعة الخط النهائية (m/s)" value={lineSpeedMps} onChange={setLineSpeedMps} step="0.5" />
                <Field label="وزن المتر الطولي (كجم/م)" value={barMeterWeight} onChange={setBarMeterWeight} step="0.001" />
                <SelectField
                  label="عدد البارات (Slitting)"
                  value={strandsCount}
                  onChange={setStrandsCount}
                  options={[[1, '1 (Single)'], [2, '2 (Two-Slit)'], [3, '3 (Three-Slit)'], [4, '4 (Four-Slit)']]}
                />
                <Field label="زمن الفجوة Gap Time (ث)" value={gapTimeSec} onChange={setGapTimeSec} step="0.5" />
                <Field label="عدد بيليت الوردية" value={billetsPerShift} onChange={setBilletsPerShift} />
                <Field label="الزمن التقويمي (ساعة)" value={calendarHours} onChange={setCalendarHours} />
                <Field label="توقفات مخططة (ساعة)" value={plannedStopHours} onChange={setPlannedStopHours} step="0.5" />
                <Field label="توقفات غير مخططة (ساعة)" value={unplannedDownHours} onChange={setUnplannedDownHours} step="0.5" />
                <Field label="أطنان البيليت المشحونة" value={chargedBilletsTons} onChange={setChargedBilletsTons} />
                <Field label="أطنان المنتج النهائي السليم" value={finishedProdTons} onChange={setFinishedProdTons} className="col-span-2" />
              </div>
            </>
          }
          results={
            <>
              <Title color="text-emerald-400">مؤشرات الأداء والطاقة الإنتاجية</Title>
              <div className="grid grid-cols-2 gap-3">
                <Stat label="زمن دورة البيليت" value={fmt(totalBilletCycleSec, 1)} unit="ث" />
                <Stat label="بيليت / ساعة" value={fmt(billetsPerHour, 1)} color="text-blue-400" />
                <Stat label="الطاقة القصوى" value={fmt(capacityTonPerHr, 1)} unit="طن/س" color="text-emerald-400" />
                <Stat label="الإنتاجية الصافية" value={fmt(netProductivityTonHr, 1)} unit="طن/س" color="text-amber-400" />
              </div>
              <Box>
                <Row label="نسبة الإدرار (Yield):" value={`${fmt(yieldPct, 2)}%`} color="text-emerald-400" />
                <Row label="الإتاحية (Availability):" value={`${fmt(availabilityPct, 1)}%`} color="text-blue-400" />
                <Row label="الاستغلال (Utilization):" value={`${fmt(utilizationPct, 1)}%`} color="text-purple-400" />
                <Row label="وقت ضائع في الفجوات بالوردية:" value={`${fmt(shiftGapLostMins, 1)} دقيقة`} color="text-red-400" top />
              </Box>
            </>
          }
        />
      )}

      {/* ===== الضغطة وزاوية العض وحمل وقدرة الدرفلة ===== */}
      {selectedTool === 'load_torque_bite' && (
        <Shell
          border="border-amber-500/30"
          inputs={
            <>
              <Title>مدخلات الضغطة والاحتكاك والموتور</Title>
              <div className="grid grid-cols-2 gap-3">
                <Field label="ارتفاع الدخول H1 (mm)" value={h1} onChange={setH1} step="0.5" />
                <Field label="ارتفاع الخروج H2 (mm)" value={h2} onChange={setH2} step="0.5" />
                <Field label="عرض المعدن W (mm)" value={wBar} onChange={setWBar} />
                <Field label="قطر الدرفيل De (mm)" value={rollDe} onChange={setRollDe} />
                <Field label="مقاومة التشكيل σ (MPa)" value={sigmaMetal} onChange={setSigmaMetal} />
                <Field label="معامل الاحتكاك μ" value={frictionMu} onChange={setFrictionMu} step="0.02" />
                <Field label="ذراع العزم a (~0.5)" value={leverArmA} onChange={setLeverArmA} step="0.05" />
                <Field label="لفات الدرفيل (RPM)" value={torqueRollRpm} onChange={setTorqueRollRpm} />
                <Field label="قدرة الموتور المتاحة (kW)" value={availMotorKw} onChange={setAvailMotorKw} className="col-span-2" />
              </div>
            </>
          }
          results={
            <>
              <Title color="text-amber-400">نتائج العض والحمل والعزم والقدرة</Title>
              <div className="grid grid-cols-2 gap-3">
                <Stat label="الضغطة المطلقة / النسبية" value={`${fmt(absDraft, 1)} mm (${fmt(relDraftPct, 1)}%)`} />
                <Stat label="أقصى ضغطة Δh max" value={fmt(maxDraftSimple, 1)} unit="mm" color="text-emerald-400" />
                <Stat label="قوس التلامس Lp" value={fmt(contactLenLp, 2)} unit="mm" color="text-blue-400" />
                <Stat
                  label="زاوية العض"
                  value={`${fmt(biteAngleDeg, 1)}° ${canBiteCondition ? '✔' : '⚠ انزلاق'}`}
                  color={canBiteCondition ? 'text-emerald-400' : 'text-red-400'}
                />
              </div>
              <Box>
                <Row label="حمل الدرفلة:" value={`${fmt(rollingLoadKn, 1)} kN`} />
                <Row label="عزم الدوران:" value={`${fmt(rollingTorqueKnm, 2)} kN.m`} color="text-blue-400" />
                <Row label="القدرة المطلوبة:" value={`${fmt(rollingPowerKw, 1)} kW`} color="text-emerald-400" />
                <Row
                  label="استغلال الموتور:"
                  value={`${fmt(motorUtilFactor, 1)}%`}
                  color={motorUtilFactor > 95 ? 'text-red-400' : 'text-amber-400'}
                  top
                />
              </Box>
              <Formula>cos α = 1 − Δh/De | μ ≥ tan α | P = σ·w·√(R·Δh) | T = 2·P·a·Lp | Power = T·2π·N/60</Formula>
            </>
          }
        />
      )}

      {/* ===== المقص الطائر واللوبر والأبرون ===== */}
      {selectedTool === 'shear_looper_apron' && (
        <Shell
          border="border-purple-500/30"
          inputs={
            <>
              <Title>مدخلات المقص الطائر، اللوبر، والأبرون</Title>
              <div className="grid grid-cols-2 gap-3">
                <Field label="سرعة موتور المقص (RPM)" value={shearMotorRpm} onChange={setShearMotorRpm} />
                <Field label="جيربوكس المقص" value={shearGearRatio} onChange={setShearGearRatio} step="0.1" />
                <Field label="نصف قطر المقص R (m)" value={shearRadiusM} onChange={setShearRadiusM} step="0.05" />
                <Field label="سرعة القائم السابق (m/s)" value={upstreamSpeedMps} onChange={setUpstreamSpeedMps} step="0.2" />
                <Field label="المسافة HMD للمقص Ls (m)" value={hmdToShearM} onChange={setHmdToShearM} step="0.1" />
                <Field label="طول قطعية الهيد Lcv (m)" value={headCropM} onChange={setHeadCropM} step="0.05" />
                <Field label="زاوية الاستعداد θ (rad)" value={shearHomeAngleRad} onChange={setShearHomeAngleRad} step="0.1" />
                <Field label="ارتفاع سنتر الدليل X (mm)" value={looperCenterX} onChange={setLooperCenterX} />
                <Field label="نصف قطر البار R (mm)" value={barRadiusR} onChange={setBarRadiusR} />
                <Field label="سرعة آخر قائم للأبرون V (m/s)" value={finishSpeedApron} onChange={setFinishSpeedApron} step="0.5" />
              </div>
            </>
          }
          results={
            <>
              <Title color="text-purple-400">مخرجات الضبط والأتمتة</Title>
              <Box>
                <Row label="السرعة الخطية للمقص V_cv:" value={`${fmt(shearLinearVelVcv, 2)} m/s`} />
                <Row label="Shear Over Speed:" value={`${fmt(shearOverSpeedPct, 1)}%`} color="text-emerald-400" />
                <Row label="زمن أمر القطع T_cv:" value={`${fmt(shearCutCommandTimeTcv, 3)} ث`} color="text-blue-400" />
                <Row label="البكرة الثابتة H = X+R:" value={`${fmt(looperFixedRollH, 1)} mm`} color="text-amber-400" top />
                <Row label="البكرة المتحركة Y = H + H/3:" value={`${fmt(looperKickerRollY, 1)} mm`} color="text-purple-400" />
                <Row label="علب الأبرون المغلقة X = V²/8:" value={`${fmt(apronClosedBoxesX, 1)} م`} color="text-emerald-400" top />
              </Box>
            </>
          }
        />
      )}

      {/* ===== جدول المواصفات والأوزان القياسية لحديد التسليح ===== */}
      {selectedTool === 'rebar_specs' && (
        <div className="bg-slate-900 p-4 sm:p-6 rounded-3xl border border-slate-800 space-y-4 overflow-x-auto">
          <h3 className="text-lg sm:text-xl font-bold text-white">
            الأوزان القياسية والتجاوزات المسموحة لحديد التسليح (ES 262 / ISO 6935-2)
          </h3>
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
      )}
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
