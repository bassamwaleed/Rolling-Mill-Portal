import React, { useState } from 'react';
import {
  Calculator, Wrench, Building2, Zap, Award, Search, Lock,
  PlusCircle, Download, Printer, Activity, Key, ArrowRight,
  ThumbsUp, MessageCircle, Share2, Gauge, Layers, Scissors,
  Flame, ShieldAlert, CheckCircle2, Sparkles, Sliders, Box
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
// 1. مركز الحاسبات الهندسية (بنظام بطاقات الاختيار السلسة)
// ============================================================================
const SmartCalculatorsCenter = () => {
  const [selectedTool, setSelectedTool] = useState(null);

  // --- متغيرات الأداة 1: القطر الفعال والسرعة وثابت الدرفلة ---
  const [rollDe, setRollDe] = useState(480);
  const [passArea, setPassArea] = useState(500);
  const [passWidth, setPassWidth] = useState(50);
  const [rollGap, setRollGap] = useState(3);
  const [motorRpm, setMotorRpm] = useState(1450);
  const [gearRatio, setGearRatio] = useState(3.4);
  const [overSpeedPct, setOverSpeedPct] = useState(3);
  const [nextStandArea, setNextStandArea] = useState(390);

  // --- متغيرات الأداة 2: الطاقة الإنتاجية، الإدرار، والإتاحية ---
  const [billetWeightKg, setBilletWeightKg] = useState(265);
  const [lineSpeedMps, setLineSpeedMps] = useState(12);
  const [barMeterWeight, setBarMeterWeight] = useState(0.888);
  const [strandsCount, setStrandsCount] = useState(2); // Slitting
  const [gapTimeSec, setGapTimeSec] = useState(4);
  const [billetsPerShift, setBilletsPerShift] = useState(500);
  const [calendarHours, setCalendarHours] = useState(24);
  const [plannedStopHours, setPlannedStopHours] = useState(2);
  const [unplannedDownHours, setUnplannedDownHours] = useState(2.5);
  const [chargedBilletsTons, setChargedBilletsTons] = useState(500);
  const [finishedProdTons, setFinishedProdTons] = useState(482);

  // --- متغيرات الأداة 3: الضغطة، الاستطالة، زاوية العض، وحمل وقدرة الدرفلة ---
  const [h1, setH1] = useState(18);
  const [h2, setH2] = useState(12);
  const [wBar, setWBar] = useState(45);
  const [sigmaMetal, setSigmaMetal] = useState(120); // MPa مقاومة المعدن للتشكيل
  const [frictionMu, setFrictionMu] = useState(0.35);
  const [leverArmA, setLeverArmA] = useState(0.5);
  const [availMotorKw, setAvailMotorKw] = useState(600);

  // --- متغيرات الأداة 4: المقص الطائر، اللوبر، والأبرون ---
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

  // --- الحسابات الهندسية الدقيقة من ملفات الـ PDF ---
  // 1) القطر الفعال والسرعات
  const grooveFactor = passWidth > 0 ? (Number(passArea) / Number(passWidth)) - Number(rollGap) : 0;
  const workingDiaDw = Math.max(1, Number(rollDe) - grooveFactor);
  const rollRpmNo = gearRatio > 0 ? Number(motorRpm) / Number(gearRatio) : 0;
  const peripheralSpeedVr = (Math.PI * workingDiaDw * rollRpmNo) / 60000;
  const leadSpeedWithOver = peripheralSpeedVr * (1 + Number(overSpeedPct) / 100);
  const millConstantQ = Number(passArea) * peripheralSpeedVr;
  const nextStandReqSpeed = nextStandArea > 0 ? millConstantQ / Number(nextStandArea) : 0;

  // 2) الطاقة الإنتاجية والإدرار والإتاحية
  const rollingTimeOnlySec =
    Number(lineSpeedMps) * Number(barMeterWeight) * Number(strandsCount) > 0
      ? Number(billetWeightKg) / (Number(lineSpeedMps) * Number(barMeterWeight) * Number(strandsCount))
      : 0;
  const totalBilletCycleSec = rollingTimeOnlySec + Number(gapTimeSec);
  const billetsPerHour = totalBilletCycleSec > 0 ? 3600 / totalBilletCycleSec : 0;
  const capacityTonPerHr = (billetsPerHour * Number(billetWeightKg)) / 1000;
  const shiftGapLostMins = (Number(billetsPerShift) * Number(gapTimeSec)) / 60;

  const plannedOpTime = Math.max(0.1, Number(calendarHours) - Number(plannedStopHours));
  const actualRollingTime = Math.max(0, plannedOpTime - Number(unplannedDownHours));
  const availabilityPct = (actualRollingTime / plannedOpTime) * 100;
  const utilizationPct = (actualRollingTime / Math.max(0.1, Number(calendarHours))) * 100;
  const yieldPct = chargedBilletsTons > 0 ? (Number(finishedProdTons) / Number(chargedBilletsTons)) * 100 : 0;
  const netProductivityTonHr = capacityTonPerHr * (yieldPct / 100) * (availabilityPct / 100);

  // 3) الضغطة وحمل الدرفلة والعزم والقدرة
  const absDraft = Math.max(0, Number(h1) - Number(h2));
  const relDraftPct = h1 > 0 ? (absDraft / Number(h1)) * 100 : 0;
  const rollRadiusR = Number(rollDe) / 2;
  const maxDraftSimple = Math.pow(Number(frictionMu), 2) * rollRadiusR;
  const contactLenLp = Math.sqrt(rollRadiusR * absDraft);
  const biteAngleDeg = (Math.acos(Math.max(-1, Math.min(1, 1 - absDraft / Math.max(1, Number(rollDe))))) * 180) / Math.PI;
  const canBiteCondition = Number(frictionMu) >= Math.tan((biteAngleDeg * Math.PI) / 180);
  // حمل الدرفلة بالكيلونيوتن
  const rollingLoadKn = (Number(sigmaMetal) * Number(wBar) * contactLenLp) / 1000;
  // عزم الدوران T = 2 * P * a * ld (kN.m)
  const rollingTorqueKnm = 2 * rollingLoadKn * Number(leverArmA) * (contactLenLp / 1000);
  // القدرة P = (T * 2 * pi * N_roll) / 60
  const rollingPowerKw = (rollingTorqueKnm * 2 * Math.PI * rollRpmNo) / 60;
  const motorUtilFactor = availMotorKw > 0 ? (rollingPowerKw / Number(availMotorKw)) * 100 : 0;

  // 4) المقص الطائر، اللوبر، والأبرون
  const shearRpmNcv = shearGearRatio > 0 ? Number(shearMotorRpm) / Number(shearGearRatio) : 0;
  const shearOmega = (2 * Math.PI * shearRpmNcv) / 60;
  const shearLinearVelVcv = shearOmega * Number(shearRadiusM);
  const shearOverSpeedPct =
    upstreamSpeedMps > 0 ? ((shearLinearVelVcv - Number(upstreamSpeedMps)) / Number(upstreamSpeedMps)) * 100 : 0;
  const shearCutCommandTimeTcv =
    upstreamSpeedMps > 0 && shearOmega > 0
      ? (Number(headCropM) + Number(hmdToShearM)) / Number(upstreamSpeedMps) - Number(shearHomeAngleRad) / shearOmega
      : 0;
  const looperFixedRollH = Number(looperCenterX) + Number(barRadiusR);
  const looperKickerRollY = looperFixedRollH + looperFixedRollH / 3;
  const apronClosedBoxesX = Math.pow(Number(finishSpeedApron), 2) / 8;

  const toolsList = [
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
      <div className="space-y-6">
        <div className="bg-gradient-to-l from-slate-900 via-slate-900 to-blue-950/60 border border-slate-800 p-6 rounded-3xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <span className="inline-flex items-center gap-1.5 text-xs font-bold bg-blue-500/15 text-blue-400 border border-blue-500/30 px-3 py-1 rounded-full mb-2">
              <Sparkles size={13} /> اختر الأداة التي تريد حسابها فوراً
            </span>
            <h2 className="text-2xl md:text-3xl font-extrabold text-white">
              مركز حاسبات وقوانين الدرفلة الذكي
            </h2>
            <p className="text-slate-400 text-sm mt-1">
              اضغط على أي بطاقة لفتح الحاسبة المخصصة لها بتصميم مريح وواضح بدون تكدس
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {toolsList.map((tool) => {
            const IconComponent = tool.icon;
            return (
              <div
                key={tool.id}
                onClick={() => setSelectedTool(tool.id)}
                className="group bg-slate-900/90 hover:bg-slate-900 border border-slate-800 hover:border-blue-500/50 rounded-3xl p-6 cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:shadow-2xl hover:shadow-blue-950/40 flex flex-col justify-between"
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
                  <h3 className="text-lg font-bold text-white group-hover:text-blue-400 transition-colors">
                    {tool.title}
                  </h3>
                  <p className="text-xs text-slate-400 leading-relaxed mt-2">
                    {tool.desc}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-800/80 flex items-center justify-between text-xs font-bold text-blue-400">
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
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 p-4 rounded-2xl flex justify-between items-center">
        <button
          onClick={() => setSelectedTool(null)}
          className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 transition-colors"
        >
          <ArrowRight size={17} />
          <span>الرجوع لكل الحاسبات</span>
        </button>
        <span className="text-xs text-slate-400 font-medium">
          القوانين معتمدة طبقاً لدليل نظم التحكم في الدرفلة
        </span>
      </div>

      {/* الأداة 1: القطر الفعال والسرعة وثابت الدرفلة */}
      {selectedTool === 'speed_effective' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 bg-slate-900 p-6 rounded-3xl border border-slate-800 space-y-5">
            <h3 className="text-xl font-bold text-white flex items-center gap-2 border-b border-slate-800 pb-3">
              <Gauge className="text-blue-400" /> مدخلات الدرفيل والممر والموتور
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-slate-400 block mb-1.5">القطر الخارجي للدرفيل De (mm)</label>
                <input type="number" value={rollDe} onChange={(e) => setRollDe(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white font-mono" />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1.5">مساحة مقطع الممر Area (mm²)</label>
                <input type="number" value={passArea} onChange={(e) => setPassArea(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white font-mono" />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1.5">عرض الممر Width (mm)</label>
                <input type="number" value={passWidth} onChange={(e) => setPassWidth(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white font-mono" />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1.5">خلوص الدرفيلين Gap (mm)</label>
                <input type="number" step="0.5" value={rollGap} onChange={(e) => setRollGap(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white font-mono" />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1.5">سرعة الموتور (Motor RPM)</label>
                <input type="number" value={motorRpm} onChange={(e) => setMotorRpm(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white font-mono" />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1.5">نسبة الجيربوكس (Gear Ratio)</label>
                <input type="number" step="0.1" value={gearRatio} onChange={(e) => setGearRatio(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white font-mono" />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1.5">نسبة الـ Over Speed للعض (%)</label>
                <input type="number" step="0.5" value={overSpeedPct} onChange={(e) => setOverSpeedPct(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white font-mono" />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1.5">مساحة القائم التالي A2 (لحساب التزامن mm²)</label>
                <input type="number" value={nextStandArea} onChange={(e) => setNextStandArea(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white font-mono" />
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 bg-gradient-to-b from-slate-900 to-slate-950 p-6 rounded-3xl border border-blue-500/30 space-y-4">
            <h3 className="text-xl font-bold text-blue-400 border-b border-slate-800 pb-3">
              النتائج الهندسية الفورية
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-900/90 p-4 rounded-2xl border border-slate-800">
                <span className="text-xs text-slate-400 block">معامل الممر (Groove Factor)</span>
                <span className="text-xl font-bold text-white font-mono">{grooveFactor.toFixed(2)} mm</span>
              </div>
              <div className="bg-slate-900/90 p-4 rounded-2xl border border-slate-800">
                <span className="text-xs text-slate-400 block">القطر الفعال الشغال (Dw)</span>
                <span className="text-xl font-bold text-emerald-400 font-mono">{workingDiaDw.toFixed(2)} mm</span>
              </div>
              <div className="bg-slate-900/90 p-4 rounded-2xl border border-slate-800">
                <span className="text-xs text-slate-400 block">لفات الدرفيل (Roll RPM)</span>
                <span className="text-xl font-bold text-white font-mono">{rollRpmNo.toFixed(1)} RPM</span>
              </div>
              <div className="bg-slate-900/90 p-4 rounded-2xl border border-slate-800">
                <span className="text-xs text-slate-400 block">السرعة الخطية للمعدن (Vr)</span>
                <span className="text-2xl font-extrabold text-blue-400 font-mono">{peripheralSpeedVr.toFixed(2)} m/s</span>
              </div>
            </div>

            <div className="bg-slate-900 p-4 rounded-2xl border border-slate-800 space-y-2.5 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-400">سرعة الدخول مع Over Speed:</span>
                <span className="text-amber-400 font-mono font-bold">{leadSpeedWithOver.toFixed(2)} m/s</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">ثابت الدرفلة (Mill Constant Q = A×V):</span>
                <span className="text-white font-mono font-bold">{millConstantQ.toFixed(0)} mm².m/s</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-slate-800">
                <span className="text-emerald-300 font-bold">السرعة المطلوبة للقائم التالي (V2):</span>
                <span className="text-emerald-400 font-mono text-lg font-extrabold">{nextStandReqSpeed.toFixed(2)} m/s</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* الأداة 2: الطاقة الإنتاجية والإدرار والإتاحية */}
      {selectedTool === 'productivity_yield' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 bg-slate-900 p-6 rounded-3xl border border-slate-800 space-y-4">
            <h3 className="text-xl font-bold text-white border-b border-slate-800 pb-3">
              مدخلات الإنتاج والبيليت والتوقفات
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5">
              <div>
                <label className="text-xs text-slate-400 block mb-1">وزن البيليت الواحد (كجم)</label>
                <input type="number" value={billetWeightKg} onChange={(e) => setBilletWeightKg(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white font-mono" />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">سرعة الخط النهائية (m/s)</label>
                <input type="number" step="0.5" value={lineSpeedMps} onChange={(e) => setLineSpeedMps(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white font-mono" />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">وزن المتر الطولي (كجم/م)</label>
                <input type="number" step="0.001" value={barMeterWeight} onChange={(e) => setBarMeterWeight(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white font-mono" />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">عدد البارات (Slitting Strands)</label>
                <select value={strandsCount} onChange={(e) => setStrandsCount(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white">
                  <option value={1}>1 (Single Strand)</option>
                  <option value={2}>2 (Two-Slit)</option>
                  <option value={3}>3 (Three-Slit)</option>
                  <option value={4}>4 (Four-Slit)</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">زمن الفجوة Gap Time (ثانية)</label>
                <input type="number" step="0.5" value={gapTimeSec} onChange={(e) => setGapTimeSec(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white font-mono" />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">عدد بيليت الوردية (لحساب الفجوة)</label>
                <input type="number" value={billetsPerShift} onChange={(e) => setBilletsPerShift(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white font-mono" />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">الزمن التقويمي الكلي (ساعة)</label>
                <input type="number" value={calendarHours} onChange={(e) => setCalendarHours(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white font-mono" />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">توقفات مخططة (ساعة)</label>
                <input type="number" step="0.5" value={plannedStopHours} onChange={(e) => setPlannedStopHours(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white font-mono" />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">أعطال وتوقفات غير مخططة (ساعة)</label>
                <input type="number" step="0.5" value={unplannedDownHours} onChange={(e) => setUnplannedDownHours(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white font-mono" />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">أطنان البيليت المشحونة للفرن</label>
                <input type="number" value={chargedBilletsTons} onChange={(e) => setChargedBilletsTons(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white font-mono" />
              </div>
              <div className="col-span-2">
                <label className="text-xs text-slate-400 block mb-1">أطنان المنتج النهائي السليم</label>
                <input type="number" value={finishedProdTons} onChange={(e) => setFinishedProdTons(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white font-mono" />
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 bg-slate-900 p-6 rounded-3xl border border-emerald-500/30 space-y-4">
            <h3 className="text-xl font-bold text-emerald-400 border-b border-slate-800 pb-3">
              مؤشرات الأداء والطاقة الإنتاجية
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800">
                <span className="text-xs text-slate-400 block">زمن درفلة البيليت الكلي</span>
                <span className="text-xl font-bold text-white font-mono">{totalBilletCycleSec.toFixed(1)} ثانية</span>
              </div>
              <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800">
                <span className="text-xs text-slate-400 block">عدد البيليت في الساعة</span>
                <span className="text-xl font-bold text-blue-400 font-mono">{billetsPerHour.toFixed(1)} بيليت/س</span>
              </div>
              <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800">
                <span className="text-xs text-slate-400 block">الطاقة القصوى (Capacity)</span>
                <span className="text-xl font-bold text-emerald-400 font-mono">{capacityTonPerHr.toFixed(1)} طن/س</span>
              </div>
              <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800">
                <span className="text-xs text-slate-400 block">الإنتاجية الفعلية الصافية</span>
                <span className="text-xl font-bold text-amber-400 font-mono">{netProductivityTonHr.toFixed(1)} طن/س</span>
              </div>
            </div>

            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-400">نسبة الإدرار (Yield %):</span>
                <span className="text-emerald-400 font-mono font-bold">{yieldPct.toFixed(2)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">نسبة الإتاحية (Availability %):</span>
                <span className="text-blue-400 font-mono font-bold">{availabilityPct.toFixed(1)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">معدل الاستغلال (Mill Utilization %):</span>
                <span className="text-purple-400 font-mono font-bold">{utilizationPct.toFixed(1)}%</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-slate-800 text-xs">
                <span className="text-slate-400">الوقت الضائع في الفجوات (Gap Time) بالوردية:</span>
                <span className="text-red-400 font-mono font-bold">{shiftGapLostMins.toFixed(1)} دقيقة</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* الأداة 3: الضغطة وزاوية العض وحمل وقدرة الدرفلة */}
      {selectedTool === 'load_torque_bite' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 bg-slate-900 p-6 rounded-3xl border border-slate-800 space-y-4">
            <h3 className="text-xl font-bold text-white border-b border-slate-800 pb-3">
              مدخلات الضغطة والاحتكاك والموتور
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-slate-400 block mb-1">ارتفاع الدخول H1 (mm)</label>
                <input type="number" step="0.5" value={h1} onChange={(e) => setH1(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white font-mono" />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">ارتفاع الخروج H2 (mm)</label>
                <input type="number" step="0.5" value={h2} onChange={(e) => setH2(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white font-mono" />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">عرض المعدن الملامس W (mm)</label>
                <input type="number" value={wBar} onChange={(e) => setWBar(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white font-mono" />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">قطر الدرفيل De (mm)</label>
                <input type="number" value={rollDe} onChange={(e) => setRollDe(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white font-mono" />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">مقاومة المعدن للتشكيل σ (MPa)</label>
                <input type="number" value={sigmaMetal} onChange={(e) => setSigmaMetal(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white font-mono" />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">معامل الاحتكاك μ (0.25 - 0.45)</label>
                <input type="number" step="0.02" value={frictionMu} onChange={(e) => setFrictionMu(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white font-mono" />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">معامل ذراع العزم (Lever Arm a ~ 0.5)</label>
                <input type="number" step="0.05" value={leverArmA} onChange={(e) => setLeverArmA(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white font-mono" />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">قدرة الموتور المتاحة P_available (kW)</label>
                <input type="number" value={availMotorKw} onChange={(e) => setAvailMotorKw(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white font-mono" />
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 bg-slate-900 p-6 rounded-3xl border border-amber-500/30 space-y-4">
            <h3 className="text-xl font-bold text-amber-400 border-b border-slate-800 pb-3">
              نتائج العض والحمل والعزم والقدرة
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800">
                <span className="text-xs text-slate-400 block">الضغطة المطلقة والنسبية</span>
                <span className="text-lg font-bold text-white font-mono">
                  {absDraft.toFixed(1)} mm ({relDraftPct.toFixed(1)}%)
                </span>
              </div>
              <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800">
                <span className="text-xs text-slate-400 block">أقصى ضغطة مسموحة (Δh max)</span>
                <span className="text-lg font-bold text-emerald-400 font-mono">{maxDraftSimple.toFixed(1)} mm</span>
              </div>
              <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800">
                <span className="text-xs text-slate-400 block">طول قوس التلامس (Lp)</span>
                <span className="text-lg font-bold text-blue-400 font-mono">{contactLenLp.toFixed(2)} mm</span>
              </div>
              <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800">
                <span className="text-xs text-slate-400 block">زاوية العض وشرط الدرفلة</span>
                <span className={`text-sm font-bold font-mono ${canBiteCondition ? 'text-emerald-400' : 'text-red-400'}`}>
                  {biteAngleDeg.toFixed(1)}° ({canBiteCondition ? 'يقبل العض' : 'خطر انزلاق!'})
                </span>
              </div>
            </div>

            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-400">حمل الدرفلة (Rolling Load):</span>
                <span className="text-white font-mono font-bold">{rollingLoadKn.toFixed(1)} kN</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">عزم الدوران (Rolling Torque):</span>
                <span className="text-blue-400 font-mono font-bold">{rollingTorqueKnm.toFixed(2)} kN.m</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">قدرة الدرفلة المطلوبة (Power):</span>
                <span className="text-emerald-400 font-mono font-bold">{rollingPowerKw.toFixed(1)} kW</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-slate-800">
                <span className="text-slate-400">معامل استغلال الموتور (Utilization):</span>
                <span className={`font-mono font-bold ${motorUtilFactor > 95 ? 'text-red-400' : 'text-amber-400'}`}>
                  {motorUtilFactor.toFixed(1)}%
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* الأداة 4: المقص الطائر واللوبر والأبرون */}
      {selectedTool === 'shear_looper_apron' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 bg-slate-900 p-6 rounded-3xl border border-slate-800 space-y-4">
            <h3 className="text-xl font-bold text-white border-b border-slate-800 pb-3">
              مدخلات المقص الطائر، اللوبر، والأبرون
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5">
              <div>
                <label className="text-xs text-slate-400 block mb-1">سرعة موتور المقص (RPM)</label>
                <input type="number" value={shearMotorRpm} onChange={(e) => setShearMotorRpm(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white font-mono" />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">جيربوكس المقص (Gear Ratio)</label>
                <input type="number" step="0.1" value={shearGearRatio} onChange={(e) => setShearGearRatio(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white font-mono" />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">نصف قطر دوران المقص R (متر)</label>
                <input type="number" step="0.05" value={shearRadiusM} onChange={(e) => setShearRadiusM(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white font-mono" />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">سرعة القائم السابق للمقص (m/s)</label>
                <input type="number" step="0.2" value={upstreamSpeedMps} onChange={(e) => setUpstreamSpeedMps(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white font-mono" />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">المسافة من HMD للمقص Ls (متر)</label>
                <input type="number" step="0.1" value={hmdToShearM} onChange={(e) => setHmdToShearM(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white font-mono" />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">طول قطعية الهيد المطلوبة Lcv (متر)</label>
                <input type="number" step="0.05" value={headCropM} onChange={(e) => setHeadCropM(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white font-mono" />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">ارتفاع سنتر الدليل لقاعدة اللوبر X (mm)</label>
                <input type="number" value={looperCenterX} onChange={(e) => setLooperCenterX(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white font-mono" />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">نصف قطر البار المدرفل باللوبر R (mm)</label>
                <input type="number" value={barRadiusR} onChange={(e) => setBarRadiusR(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white font-mono" />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">سرعة آخر قائم للأبرون V (m/s)</label>
                <input type="number" step="0.5" value={finishSpeedApron} onChange={(e) => setFinishSpeedApron(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white font-mono" />
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 bg-slate-900 p-6 rounded-3xl border border-purple-500/30 space-y-4">
            <h3 className="text-xl font-bold text-purple-400 border-b border-slate-800 pb-3">
              مخرجات الضبط والأتمتة
            </h3>
            <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2.5 text-sm">
              <div className="flex justify-between">
                <span className="text-slate-400">السرعة الخطية للمقص (V_cv):</span>
                <span className="text-white font-mono font-bold">{shearLinearVelVcv.toFixed(2)} m/s</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">نسبة Shear Over Speed:</span>
                <span className="text-emerald-400 font-mono font-bold">{shearOverSpeedPct.toFixed(1)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">زمن إرسال أمر القطع (T_cv):</span>
                <span className="text-blue-400 font-mono font-bold">{shearCutCommandTimeTcv.toFixed(3)} ثانية</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-slate-800">
                <span className="text-slate-400">ارتفاع بكرة اللوبر الثابتة (H = X+R):</span>
                <span className="text-amber-400 font-mono font-bold">{looperFixedRollH.toFixed(1)} mm</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">ارتفاع بكرة اللوبر المتحركة (Y = H + H/3):</span>
                <span className="text-purple-400 font-mono font-bold">{looperKickerRollY.toFixed(1)} mm</span>
              </div>
              <div className="flex justify-between pt-2 border-t border-slate-800">
                <span className="text-slate-300 font-bold">عدد العلب المغلقة للأبرون (X = V²/8):</span>
                <span className="text-emerald-400 font-mono text-lg font-extrabold">{apronClosedBoxesX.toFixed(1)} متر (علبة)</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* الأداة 5: جدول المواصفات والأوزان القياسية لحديد التسليح */}
      {selectedTool === 'rebar_specs' && (
        <div className="bg-slate-900 p-6 rounded-3xl border border-slate-800 space-y-4 overflow-x-auto">
          <h3 className="text-xl font-bold text-white">
            جدول الأوزان القياسية والتجاوزات المسموحة لحديد التسليح (ES 262 / ISO 6935-2)
          </h3>
          <table className="w-full text-right border-collapse text-sm">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 text-xs">
                <th className="p-3">المقاس (mm)</th>
                <th className="p-3">المساحة الاسمية (mm²)</th>
                <th className="p-3">أقل وزن (كجم/م)</th>
                <th className="p-3">الوزن الاسمي (كجم/م)</th>
                <th className="p-3">أقصى وزن (كجم/م)</th>
                <th className="p-3">لون تمييز المقاس</th>
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
const SocialFeedAndFaults = ({ posts, setPosts, faults, setFaults }) => {
  const [subMode, setSubMode] = useState('feed'); // feed | faults
  const [newPostAuthor, setNewPostAuthor] = useState('');
  const [newPostRole, setNewPostRole] = useState('مهندس / فني درفلة');
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
        p.id === postId
          ? { ...p, liked: !p.liked, likes: p.liked ? p.likes - 1 : p.likes + 1 }
          : p
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
    setPosts((prev) =>
      prev.map((p) => (p.id === postId ? { ...p, comments: [...p.comments, newComment] } : p))
    );
    setCommentInputs({ ...commentInputs, [postId]: '' });
  };

  const filteredFaults = faults.filter(
    (f) =>
      f.code.toLowerCase().includes(faultSearch.toLowerCase()) ||
      f.title.toLowerCase().includes(faultSearch.toLowerCase()) ||
      f.brand.toLowerCase().includes(faultSearch.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* شريط التبديل بين المنشورات وموسوعة الأعطال */}
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl flex flex-wrap justify-between items-center gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-white">مجتمع صناع الحديد وموسوعة الأعطال</h2>
          <p className="text-xs text-slate-400 mt-1">
            انشر معلومة أو سؤالاً فنياً ليعلق عليه الزملاء، أو ابحث في تشخيص عيوب الدرفلة والدرايفات
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setSubMode('feed')}
            className={`px-4 py-2.5 rounded-2xl text-sm font-bold flex items-center gap-2 transition-all ${
              subMode === 'feed'
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <MessageCircle size={17} /> المنشورات والنقاشات ({posts.length})
          </button>
          <button
            onClick={() => setSubMode('faults')}
            className={`px-4 py-2.5 rounded-2xl text-sm font-bold flex items-center gap-2 transition-all ${
              subMode === 'faults'
                ? 'bg-amber-500 text-slate-950 shadow-lg shadow-amber-500/30'
                : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
            }`}
          >
            <Wrench size={17} /> تشخيص العيوب والأعطال
          </button>
        </div>
      </div>

      {subMode === 'feed' ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* عمود كتابة بوست جديد */}
          <div className="lg:col-span-4">
            <form
              onSubmit={handleCreatePost}
              className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-3.5 sticky top-6"
            >
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <PlusCircle className="text-blue-400" size={20} /> نشر بوست أو سؤال فني
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
                className="w-full bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-xl font-bold text-sm shadow-lg shadow-blue-600/20"
              >
                نشر البوست الآن
              </button>
            </form>
          </div>

          {/* عمود البوستات والتعليقات (Social Wall) */}
          <div className="lg:col-span-8 space-y-5">
            {posts.map((post) => (
              <div
                key={post.id}
                className="bg-slate-900 border border-slate-800 rounded-3xl p-6 space-y-4 shadow-lg"
              >
                {/* هيدر البوست */}
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white font-extrabold text-lg">
                      {post.author.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
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
                  <span className="text-xs bg-slate-800 text-slate-300 px-3 py-1 rounded-full">
                    {post.category}
                  </span>
                </div>

                {/* محتوى البوست */}
                <div>
                  <h3 className="text-lg font-bold text-blue-300 mb-2">{post.title}</h3>
                  <p className="text-sm text-slate-200 leading-relaxed whitespace-pre-line">
                    {post.content}
                  </p>
                </div>

                {/* شريط التفاعل (إعجاب + عدد التعليقات) */}
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

                {/* قائمة التعليقات */}
                <div className="bg-slate-950/80 rounded-2xl p-4 border border-slate-800/80 space-y-3">
                  {post.comments.map((c) => (
                    <div key={c.id} className="bg-slate-900 p-3 rounded-xl border border-slate-800/70">
                      <div className="flex justify-between items-center mb-1">
                        <span className="text-xs font-bold text-emerald-400">{c.user}</span>
                        <span className="text-[10px] text-slate-500">{c.time}</span>
                      </div>
                      <p className="text-xs text-slate-200 leading-relaxed">{c.text}</p>
                    </div>
                  ))}

                  {/* إضافة تعليق جديد */}
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
        /* قسم موسوعة العيوب والأعطال */
        <div className="space-y-4">
          <div className="relative">
            <Search className="absolute right-4 top-3.5 text-slate-500" size={18} />
            <input
              type="text"
              placeholder="ابحث عن عيب منتج (قشرة، شنب، شرشرة) أو عطل درايف (F0001)..."
              value={faultSearch}
              onChange={(e) => setFaultSearch(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-2xl pr-11 pl-4 py-3 text-white text-sm"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredFaults.map((f) => (
              <div key={f.id} className="bg-slate-900 border border-slate-800 rounded-3xl p-5 space-y-2.5">
                <div className="flex justify-between items-center">
                  <span className="px-3 py-1 bg-red-500/20 text-red-400 border border-red-500/30 rounded-xl font-mono font-bold text-xs">
                    {f.code}
                  </span>
                  <span className="text-xs bg-slate-800 text-slate-300 px-3 py-1 rounded-xl">
                    {f.brand}
                  </span>
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
const EnterpriseCompaniesPortal = ({
  companies,
  activeCompany,
  setActiveCompany,
  standsPasses,
  setStandsPasses
}) => {
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
      prev.map((s) =>
        s.id === id
          ? { ...s, passTons: s.passTons + tons, totalRollTons: s.totalRollTons + tons }
          : s
      )
    );
  };

  const switchNextPass = (id) => {
    setStandsPasses((prev) =>
      prev.map((s) =>
        s.id === id
          ? {
              ...s,
              activePass: s.activePass < s.totalPasses ? s.activePass + 1 : 1,
              passTons: 0
            }
          : s
      )
    );
  };

  if (!activeCompany) {
    return (
      <div className="max-w-xl mx-auto bg-slate-900 border border-slate-800 rounded-3xl p-8 text-center space-y-5 mt-6">
        <div className="w-16 h-16 rounded-2xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center mx-auto">
          <Building2 className="text-blue-400" size={32} />
        </div>
        <h2 className="text-2xl font-extrabold text-white">
          بوابة الشركات وإدارة عمر الدرافيل والممرات (SaaS)
        </h2>
        <p className="text-xs text-slate-400 leading-relaxed">
          مخصصة للمصانع المشتركة لمتابعة الأقطار الفعالة للدرافيل ($D_w$)، إنتاجية كل ممر (Pass Tonnage)، والرصيد المتبقي قبل الخراطة. للتجربة الفورية أدخل كود: <strong className="text-emerald-400 font-mono">GIOSHY-2026</strong>
        </p>
        <form onSubmit={handleLogin} className="space-y-3">
          <input
            type="text"
            placeholder="أدخل كود تفعيل الشركة (GIOSHY-2026)"
            value={companyCode}
            onChange={(e) => setCompanyCode(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded-2xl p-3.5 text-center text-white font-mono uppercase text-lg"
          />
          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-500 text-white py-3.5 rounded-2xl font-bold shadow-lg shadow-blue-600/25"
          >
            فتح منظومة الدرافيل والممرات
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-3xl flex flex-wrap justify-between items-center gap-4">
        <div>
          <span className="text-xs bg-emerald-500/20 text-emerald-400 px-3 py-1 rounded-full font-bold">
            {activeCompany.name} ({activeCompany.code})
          </span>
          <h2 className="text-2xl font-extrabold text-white mt-1.5">
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
                  <span className="text-xs text-slate-400">{st.zone} • {st.rollCode}</span>
                </div>
                <span className="text-xs font-mono font-bold bg-blue-500/20 text-blue-400 px-2.5 py-1 rounded-lg">
                  ممر {st.activePass}/{st.totalPasses}
                </span>
              </div>

              <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">القطر الخارجي / القطر الفعال Dw:</span>
                  <span className="text-white font-mono font-bold">{st.collarDia} / {workingDia} mm</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">خلوص القائم (Gap):</span>
                  <span className="text-emerald-400 font-mono font-bold">{st.gapMm} mm</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">إنتاجية الممر الحالي:</span>
                  <span className="text-amber-400 font-mono font-bold">{st.passTons} / {st.maxPassTons} طن</span>
                </div>
              </div>

              <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                <div
                  className={`h-full ${usagePct > 85 ? 'bg-red-500' : 'bg-blue-500'}`}
                  style={{ width: `${usagePct}%` }}
                />
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
      <div className="bg-slate-900 border-2 border-amber-500/40 rounded-3xl p-6 max-w-lg w-full space-y-4">
        <div className="flex justify-between items-center border-b border-slate-800 pb-3">
          <h3 className="text-lg font-bold text-amber-400 flex items-center gap-2">
            <Key size={20} /> لوحة م. بسام وليد السرية (Creator Admin)
          </h3>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-sm">إغلاق X</button>
        </div>

        {!ok ? (
          <div className="space-y-3">
            <p className="text-xs text-slate-400">أدخل الرقم السري للمصمم (2026 أو beso):</p>
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
                <div key={c.id} className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex justify-between items-center text-xs">
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
// المكون الرئيسي للتطبيق (شريط تنقل علوي سلس وعصري)
// ============================================================================
export default function App() {
  const [activeTab, setActiveTab] = useState('calculators');
  const [posts, setPosts] = useState(INITIAL_POSTS);
  const [faults, setFaults] = useState(INITIAL_FAULTS);
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

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 font-sans" dir="rtl">
      {/* الهيدر العلوي العصري */}
      <header className="sticky top-0 z-40 bg-slate-950/85 backdrop-blur-md border-b border-slate-800/80">
        <div className="max-w-6xl mx-auto px-4 py-3.5 flex flex-wrap justify-between items-center gap-4">
          <div
            onClick={handleLogoClick}
            title="اضغط 5 مرات لفتح لوحة المصمم السرية"
            className="flex items-center gap-3 cursor-pointer select-none"
          >
            <div className="bg-gradient-to-br from-blue-600 to-indigo-600 p-2.5 rounded-2xl shadow-lg shadow-blue-600/30">
              <Zap className="text-white" size={22} />
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-white tracking-tight">
                Steel<span className="text-blue-500">Portal</span>
              </h1>
              <p className="text-[11px] text-slate-400">منصة مهندسي وفنيي الدرفلة</p>
            </div>
          </div>

          <nav className="flex items-center gap-2 bg-slate-900 p-1.5 rounded-2xl border border-slate-800">
            {[
              { id: 'calculators', label: 'حاسبات الدرفلة', icon: Calculator },
              { id: 'social', label: 'المنشورات والأعطال', icon: MessageCircle },
              { id: 'companies', label: 'بوابة الشركات (الممرات)', icon: Building2 }
            ].map((item) => {
              const IconComponent = item.icon;
              const isAct = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold flex items-center gap-2 transition-all ${
                    isAct
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  <IconComponent size={16} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>
      </header>

      {/* المحتوى الرئيسي */}
      <main className="max-w-6xl mx-auto px-4 py-6">
        {activeTab === 'calculators' && <SmartCalculatorsCenter />}
        {activeTab === 'social' && (
          <SocialFeedAndFaults
            posts={posts}
            setPosts={setPosts}
            faults={faults}
            setFaults={setFaults}
          />
        )}
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
