import React, { useState, useEffect } from 'react';
import {
  Settings, Calculator, AlertTriangle, ShieldCheck, Activity, Zap,
  Server, ChevronRight, Save, LayoutDashboard, Award, PlusCircle,
  Lock, Unlock, Building2, CheckCircle2, XCircle, Printer, Download,
  Wrench, Clock, TrendingUp, HelpCircle, Search, RefreshCw, Key, Layers
} from 'lucide-react';
import {
  collection, addDoc, getDocs, updateDoc, doc, query, where, orderBy, serverTimestamp
} from 'firebase/firestore';
import { db } from './firebase';

// ============================================================================
// بيانات افتراضية أولية (تظهر فوراً وتندمج مع بيانات Firebase)
// ============================================================================
const INITIAL_STANDS = Array.from({ length: 12 }, (_, i) => ({
  id: i + 1,
  name: `استاند ${i + 1}`,
  type: i < 4 ? 'تخشين (Roughing)' : i < 8 ? 'متوسط (Intermediate)' : 'تشطيب (Finishing)',
  status: i === 4 ? 'warning' : 'active',
  rollDia: 485 - (i * 12),
  workingDia: 472 - (i * 12),
  speedMps: (1.2 + i * 0.45).toFixed(2),
  motorRpm: Math.round(350 + i * 65),
  gearRatio: (4.5 - i * 0.25).toFixed(2),
  passNumber: (i % 4) + 1,
  tonnageOnPass: Math.floor(180 + (i * 27) % 300),
  maxPassTonnage: 500,
  bearingHours: 120 + i * 15,
  entryDate: '2026-11-10'
}));

const DEFAULT_FAULTS = [
  {
    id: 'f1',
    code: 'F0001 / F30001',
    brand: 'Siemens SINAMICS / Micromaster',
    category: 'كهرباء ودرايف',
    title: 'Overcurrent (تيار زائد مفاجئ)',
    cause: 'دخول بيليت بارد على الاستاند، حشر معدن (Cobble)، أو قصر في كابلات الموتور.',
    solution: 'راجع حرارة البيليت، افحص خلوص الدرافيل (Roll Gap)، قس عزل الموتور والكابل بالـ Megger، وراجع باراميتر حدود التيار.',
    author: 'م. بسام وليد',
    points: 45
  },
  {
    id: 'f2',
    code: 'F0002 / F30002',
    brand: 'Siemens / Parker DC & AC Drives',
    category: 'كهرباء ودرايف',
    title: 'DC Link Overvoltage (ارتفاع جهد دائرة الـ DC)',
    cause: 'تباطؤ سريع جداً للموتور (Regeneration) أو فصل في مقاومة الفرملة (Braking Resistor).',
    solution: 'زود زمن التباطؤ (Deceleration Ramp Time)، وافحص Chopper ومقاومة الفرملة.',
    author: 'م. بسام وليد',
    points: 35
  },
  {
    id: 'f3',
    code: 'F07900 / Stall',
    brand: 'Siemens S120 / WinCC',
    category: 'كنترول وتشغيل',
    title: 'Motor Blocked / Torque Limit Reached',
    cause: 'نسبة التخفيض (Reduction Ratio) عالية جداً في الباس أو توقف الموتور تحت الحمل.',
    solution: 'افتح خلوص الدرافيل قليلاً، راجع سرعة الاستاند السابق واللاحق لمنع الشد أو الكومبريشن، وتأكد من سلامة الكوبلن وصندوق التروس.',
    author: 'م. بسام وليد',
    points: 50
  },
  {
    id: 'f4',
    code: 'ENC-FLT / F31115',
    brand: 'Incremental / Absolute Encoder',
    category: 'أجهزة قياس وحساسات',
    title: 'فقدان أو تقطع إشارة الإنكودر (Speed Feedback Loss)',
    cause: 'اهتزاز الكوبلن المرن للإنكودر، دخول مياه تبريد، أو شوشرة (Noise) على كابل الشيلد.',
    solution: 'افحص كابل الشيلد وتأريضه من ناحية الدرايف فقط، غير الكوبلن البلاستيك المكسور، أو حول الدرايف مؤقتاً لوضع Sensorless Vector لحين انتهاء الوردية.',
    author: 'فني كنترول أول',
    points: 30
  },
  {
    id: 'f5',
    code: 'LPR-ERR',
    brand: 'Looper Scanner / HMD',
    category: 'كنترول وتشغيل',
    title: 'عدم استقرار اللوبر (Looper Hunting / Oscillation)',
    cause: 'اتساخ عدسة الـ Looper Scanner بالبخار والقشور (Scale) أو خطأ في معامل الـ PID لتعويض السرعة.',
    solution: 'نظف عدسة الاسكانر وتأكد من ضغط هواء التبريد (Air Purge)، واضبط ارتفاع المرجع (Looper Reference Height) إلى الزاوية القياسية (15° - 20°).',
    author: 'م. بسام وليد',
    points: 60
  }
];

const INITIAL_TENANTS = [
  {
    id: 't1',
    name: 'شركة الجيوشي للصلب (El Gioshy Steel)',
    code: 'GIOSHY-2026',
    plan: 'باقة المصانع المتقدمة (Enterprise SaaS)',
    status: 'active',
    managerPin: '1234',
    standsCount: 12,
    expiryDate: '2027-12-31'
  },
  {
    id: 't2',
    name: 'مصنع الدرفلة النموذجي (Demo Mill)',
    code: 'DEMO-MILL',
    plan: 'الباقة التجريبية (Trial)',
    status: 'active',
    managerPin: '0000',
    standsCount: 12,
    expiryDate: '2026-12-30'
  }
];

// ============================================================================
// 1. قسم الحاسبات الهندسية الشامل (Rolling Mill Engineering Toolkit)
// ============================================================================
const CalculatorsSection = () => {
  const [subTab, setSubTab] = useState('speed');

  // 1) متغيرات تزامن السرعات والتدفق الكتلي
  const [vel, setVel] = useState(2.5); // m/s
  const [rollDia, setRollDia] = useState(480); // mm
  const [collarDepth, setCollarDepth] = useState(8); // عمق الكاليبر mm
  const [gearRatio, setGearRatio] = useState(3.5);
  const [motorPoles, setMotorPoles] = useState(4);
  const [area1, setArea1] = useState(1600); // mm2
  const [vel1, setVel1] = useState(2.25); // m/s
  const [area2, setArea2] = useState(1250); // mm2

  // 2) متغيرات الباس ديزاين والتخفيض
  const [hIn, setHIn] = useState(14.5);
  const [bIn, setBIn] = useState(46);
  const [hOut, setHOut] = useState(10);
  const [bOut, setBOut] = useState(50);
  const [workRollDia, setWorkRollDia] = useState(480);

  // 3) متغيرات الأوزان والبيليت والهالك
  const [billetSize, setBilletSize] = useState(130); // 130x130 mm
  const [billetLength, setBilletLength] = useState(2.0); // meters
  const [scaleLoss, setScaleLoss] = useState(2.0); // %
  const [prodType, setProdType] = useState('flat'); // rebar | flat | angle
  const [rebarDia, setRebarDia] = useState(16); // mm
  const [flatWidth, setFlatWidth] = useState(50); // mm
  const [flatThick, setFlatThick] = useState(10); // mm
  const [angleSide, setAngleSide] = useState(50); // mm
  const [angleThick, setAngleThick] = useState(5); // mm
  const [commercialLen, setCommercialLen] = useState(12); // 12m

  // 4) متغيرات القدرة والعزم واللوبر
  const [rollingForce, setRollingForce] = useState(450); // kN
  const [leverArm, setLeverArm] = useState(0.45);
  const [voltage, setVoltage] = useState(400);
  const [pf, setPf] = useState(0.86);
  const [looperSpan, setLooperSpan] = useState(4500); // mm بين الاستاندين
  const [looperHeight, setLooperHeight] = useState(180); // mm ارتفاع اللوبر

  // --- المعادلات الهندسية ---
  // أ. السرعات
  const workingDia = Math.max(1, Number(rollDia) - Number(collarDepth));
  const rollRpm = ((Number(vel) * 60 * 1000) / (Math.PI * workingDia)).toFixed(1);
  const motorRpm = (Number(rollRpm) * Number(gearRatio)).toFixed(0);
  const vfdFreq = ((Number(motorRpm) * Number(motorPoles)) / 120).toFixed(1);
  const syncedVel2 = area2 > 0 ? ((Number(area1) * Number(vel1)) / Number(area2)).toFixed(2) : 0;
  const hourlyProdTon = ((Number(area2) / 1000000) * Number(syncedVel2) * 7.85 * 3600).toFixed(1);

  // ب. الباس ديزاين
  const calcAreaIn = (Number(hIn) * Number(bIn)).toFixed(1);
  const calcAreaOut = (Number(hOut) * Number(bOut)).toFixed(1);
  const reductionRatio = calcAreaIn > 0 ? (((calcAreaIn - calcAreaOut) / calcAreaIn) * 100).toFixed(2) : 0;
  const elongationFactor = calcAreaOut > 0 ? (calcAreaIn / calcAreaOut).toFixed(3) : 0;
  const draft = Math.max(0, Number(hIn) - Number(hOut)).toFixed(2);
  const contactLength = Math.sqrt((Number(workRollDia) / 2) * Number(draft)).toFixed(2);
  const biteAngleRad = Math.acos(Math.max(-1, Math.min(1, 1 - Number(draft) / Number(workRollDia))));
  const biteAngleDeg = ((biteAngleRad * 180) / Math.PI).toFixed(1);
  // معادلة Wusatowski / Siebel التقريبية للانتشار (Spread)
  const siebelSpread = (0.35 * Number(draft) * Math.sqrt(Number(workRollDia) / (2 * Number(hIn)))).toFixed(2);

  // ج. الأوزان والهالك وأطوال الخرج
  const billetVolM3 = (Number(billetSize) / 1000) * (Number(billetSize) / 1000) * Number(billetLength);
  const billetWeightKg = (billetVolM3 * 7850).toFixed(1);
  const netWeightKg = (billetWeightKg * (1 - Number(scaleLoss) / 100)).toFixed(1);

  let unitWeightKgPerM = 1;
  let productCrossAreaMm2 = 100;
  if (prodType === 'rebar') {
    unitWeightKgPerM = (Number(rebarDia) * Number(rebarDia)) / 162.2;
    productCrossAreaMm2 = Math.PI * Math.pow(Number(rebarDia) / 2, 2);
  } else if (prodType === 'flat') {
    productCrossAreaMm2 = Number(flatWidth) * Number(flatThick);
    unitWeightKgPerM = productCrossAreaMm2 * 0.00785;
  } else {
    productCrossAreaMm2 = (2 * Number(angleSide) - Number(angleThick)) * Number(angleThick);
    unitWeightKgPerM = productCrossAreaMm2 * 0.00785;
  }
  const totalBarLengthM = unitWeightKgPerM > 0 ? (Number(netWeightKg) / unitWeightKgPerM).toFixed(2) : 0;
  const barsCount = commercialLen > 0 ? (Number(totalBarLengthM) / Number(commercialLen)).toFixed(1) : 0;

  // د. العزم والقدرة واللوبر
  const torqueKnM = (2 * Number(rollingForce) * Number(leverArm) * (Number(contactLength) / 1000)).toFixed(2);
  const powerKw = ((Number(torqueKnM) * Number(rollRpm) * 2 * Math.PI) / 60).toFixed(1);
  const estCurrentAmp = (
    (Number(powerKw) * 1000) /
    (Math.sqrt(3) * Number(voltage) * Number(pf) * 0.92)
  ).toFixed(0);
  // طول القوس الزائد في اللوبر
  const looperExtraLengthMm = looperSpan > 0 ? ((8 * Math.pow(Number(looperHeight), 2)) / (3 * Number(looperSpan))).toFixed(1) : 0;
  const looperAngleDeg = (Math.atan((2 * Number(looperHeight)) / Number(looperSpan)) * (180 / Math.PI)).toFixed(1);

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Calculator className="text-blue-500" />
            موسوعة حاسبات وقوانين الدرفلة الذكية
          </h2>
          <p className="text-slate-400 text-sm mt-1">
            معادلات هندسية دقيقة لمشغلي غرف التحكم ومهندسي الدرفلة والـ Pass Design
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {[
            { id: 'speed', label: 'تزامن السرعات والـ VFD' },
            { id: 'pass', label: 'الباس ديزاين والتخفيض' },
            { id: 'weight', label: 'الأوزان والهالك والأطوال' },
            { id: 'power', label: 'العزم واللوبر والقوانين' }
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setSubTab(t.id)}
              className={`px-3.5 py-2 rounded-lg text-sm font-medium transition-all ${
                subTab === t.id
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* 1. حاسبة تزامن السرعات والتدفق الكتلي */}
      {subTab === 'speed' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 space-y-4">
            <h3 className="text-lg font-bold text-blue-400 border-b border-slate-800 pb-3">
              1. حساب سرعة الدرفيل والموتور والتردد (Speed, RPM & VFD Hz)
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-slate-400 block mb-1">سرعة خروج المعدن الخطية V (m/s)</label>
                <input type="number" step="0.05" value={vel} onChange={(e) => setVel(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white font-mono" />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">قطر الدرفيل الاسمي D (mm)</label>
                <input type="number" value={rollDia} onChange={(e) => setRollDia(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white font-mono" />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">عمق الكاليبر الفعال (Collar Reduction mm)</label>
                <input type="number" value={collarDepth} onChange={(e) => setCollarDepth(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white font-mono" />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">نسبة الجيربوكس (Gearbox Ratio i)</label>
                <input type="number" step="0.1" value={gearRatio} onChange={(e) => setGearRatio(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white font-mono" />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">عدد أقطاب الموتور (Motor Poles)</label>
                <select value={motorPoles} onChange={(e) => setMotorPoles(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white">
                  <option value={2}>2 أقطاب (3000 RPM)</option>
                  <option value={4}>4 أقطاب (1500 RPM)</option>
                  <option value={6}>6 أقطاب (1000 RPM)</option>
                  <option value={8}>8 أقطاب (750 RPM)</option>
                </select>
              </div>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-blue-900/40 space-y-2 mt-4">
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">القطر الشغال الفعال ($D_w$):</span>
                <span className="text-white font-mono font-bold">{workingDia} mm</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">سرعة الدرفيل ($N_{roll}$):</span>
                <span className="text-emerald-400 font-mono text-lg font-bold">{rollRpm} RPM</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">سرعة الموتور المطلوبة ($N_{motor}$):</span>
                <span className="text-blue-400 font-mono text-2xl font-bold">{motorRpm} RPM</span>
              </div>
              <div className="flex justify-between text-sm pt-2 border-t border-slate-800">
                <span className="text-slate-400">تردد الإنفرتر المتوقع (VFD Frequency):</span>
                <span className="text-amber-400 font-mono font-bold">{vfdFreq} Hz</span>
              </div>
            </div>
          </div>

          <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 space-y-4">
            <h3 className="text-lg font-bold text-emerald-400 border-b border-slate-800 pb-3">
              2. قانون ثبات التدفق الكتلي (Mass Flow Balance: $A_1 V_1 = A_2 V_2$)
            </h3>
            <p className="text-xs text-slate-400">
              يضمن ضبط سرعة الاستاند التالي بدقة لمنع الشد (Tension) أو التكدس والحشر (Cobble).
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="text-xs text-slate-400 block mb-1">مساحة استاند 1 ($A_1\text{ mm}^2$)</label>
                <input type="number" value={area1} onChange={(e) => setArea1(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white font-mono" />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">سرعة استاند 1 ($V_1\text{ m/s}$)</label>
                <input type="number" step="0.05" value={vel1} onChange={(e) => setVel1(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white font-mono" />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">مساحة استاند 2 ($A_2\text{ mm}^2$)</label>
                <input type="number" value={area2} onChange={(e) => setArea2(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white font-mono" />
              </div>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-emerald-900/40 space-y-3 mt-4">
              <div className="flex justify-between items-center">
                <span className="text-slate-300">السرعة المتزامنة المطلوبة لاستاند 2 ($V_2$):</span>
                <span className="text-2xl font-bold text-emerald-400 font-mono">{syncedVel2} m/s</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-300">معدل الإنتاج النظري للخط (Hourly Rate):</span>
                <span className="text-xl font-bold text-white font-mono">{hourlyProdTon} طن/ساعة</span>
              </div>
              <div className="text-xs text-slate-500 pt-2 border-t border-slate-800">
                معادلة السرعة الخطية: $V = \frac{\pi \times D_{work} \times N_{roll}}{60 \times 1000}$
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2. حاسبة الباس ديزاين والتخفيض */}
      {subTab === 'pass' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 space-y-4">
            <h3 className="text-lg font-bold text-blue-400 border-b border-slate-800 pb-3">
              مدخلات تمريرة الدرفلة (Pass Entry & Exit Dimensions)
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs text-slate-400 block mb-1">ارتفاع الدخول $H_1$ (mm)</label>
                <input type="number" step="0.5" value={hIn} onChange={(e) => setHIn(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white font-mono" />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">عرض الدخول $B_1$ (mm)</label>
                <input type="number" step="0.5" value={bIn} onChange={(e) => setBIn(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white font-mono" />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">ارتفاع الخروج $H_2$ (mm)</label>
                <input type="number" step="0.5" value={hOut} onChange={(e) => setHOut(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white font-mono" />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">عرض الخروج $B_2$ (mm)</label>
                <input type="number" step="0.5" value={bOut} onChange={(e) => setBOut(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white font-mono" />
              </div>
              <div className="col-span-2">
                <label className="text-xs text-slate-400 block mb-1">قطر الدرفيل الشغال (Working Roll Dia mm)</label>
                <input type="number" value={workRollDia} onChange={(e) => setWorkRollDia(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white font-mono" />
              </div>
            </div>
          </div>

          <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 space-y-3">
            <h3 className="text-lg font-bold text-emerald-400 border-b border-slate-800 pb-3">
              نتائج الـ Pass Design الهندسية
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800">
                <span className="text-xs text-slate-400 block">نسبة التخفيض (Reduction %)</span>
                <span className="text-2xl font-bold text-emerald-400 font-mono">{reductionRatio}%</span>
              </div>
              <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800">
                <span className="text-xs text-slate-400 block">معامل الاستطالة ($\lambda = A_1/A_2$)</span>
                <span className="text-2xl font-bold text-blue-400 font-mono">{elongationFactor}</span>
              </div>
              <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800">
                <span className="text-xs text-slate-400 block">مقدار الجر (Draft $\Delta h$)</span>
                <span className="text-xl font-bold text-white font-mono">{draft} mm</span>
              </div>
              <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800">
                <span className="text-xs text-slate-400 block">طول قوس التلامس ($L_d$)</span>
                <span className="text-xl font-bold text-white font-mono">{contactLength} mm</span>
              </div>
              <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800">
                <span className="text-xs text-slate-400 block">زاوية العض (Bite Angle $\alpha$)</span>
                <span className={`text-xl font-bold font-mono ${Number(biteAngleDeg) > 24 ? 'text-red-400' : 'text-amber-400'}`}>
                  {biteAngleDeg}° {Number(biteAngleDeg) > 24 ? '(خطر انزلاق!)' : '(آمن)'}
                </span>
              </div>
              <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800">
                <span className="text-xs text-slate-400 block">الانتشار العرضي المتوقع (Siebel Spread)</span>
                <span className="text-xl font-bold text-purple-400 font-mono">+{siebelSpread} mm</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. حاسبة الأوزان والهالك وأطوال الخرج */}
      {subTab === 'weight' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 space-y-4">
            <h3 className="text-lg font-bold text-blue-400 border-b border-slate-800 pb-3">
              بيانات البيليت الخام ونوع القطاع النهائي
            </h3>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-xs text-slate-400 block mb-1">مقاس البيليت (mm)</label>
                <input type="number" value={billetSize} onChange={(e) => setBilletSize(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white font-mono" />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">طول البيليت (متر)</label>
                <input type="number" step="0.1" value={billetLength} onChange={(e) => setBilletLength(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white font-mono" />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">نسبة الهالك Scale (%)</label>
                <input type="number" step="0.5" value={scaleLoss} onChange={(e) => setScaleLoss(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white font-mono" />
              </div>
            </div>

            <div>
              <label className="text-xs text-slate-400 block mb-1">نوع المنتج المدرفل</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: 'flat', label: 'خوصة (Flat Bar)' },
                  { id: 'rebar', label: 'حديد تسليح (Rebar)' },
                  { id: 'angle', label: 'زاوية متساوية (Angle)' }
                ].map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setProdType(p.id)}
                    className={`py-2 rounded-lg text-xs font-bold border ${
                      prodType === p.id
                        ? 'bg-blue-600/20 border-blue-500 text-blue-400'
                        : 'bg-slate-950 border-slate-800 text-slate-400'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {prodType === 'flat' && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">عرض الخوصة (mm) مثلاً 50 أو 40</label>
                  <input type="number" value={flatWidth} onChange={(e) => setFlatWidth(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white font-mono" />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">سمك الخوصة (mm) مثلاً 10</label>
                  <input type="number" value={flatThick} onChange={(e) => setFlatThick(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white font-mono" />
                </div>
              </div>
            )}

            {prodType === 'rebar' && (
              <div>
                <label className="text-xs text-slate-400 block mb-1">قطر سيخ التسليح D (mm)</label>
                <input type="number" value={rebarDia} onChange={(e) => setRebarDia(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white font-mono" />
              </div>
            )}

            {prodType === 'angle' && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">طول ضلع الزاوية (mm)</label>
                  <input type="number" value={angleSide} onChange={(e) => setAngleSide(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white font-mono" />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">سمك الزاوية (mm)</label>
                  <input type="number" value={angleThick} onChange={(e) => setAngleThick(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white font-mono" />
                </div>
              </div>
            )}
          </div>

          <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 space-y-3">
            <h3 className="text-lg font-bold text-emerald-400 border-b border-slate-800 pb-3">
              نتائج الوزن الصافي وطول العود على فرش التبريد
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800">
                <span className="text-xs text-slate-400 block">وزن البيليت الخام</span>
                <span className="text-xl font-bold text-white font-mono">{billetWeightKg} كجم</span>
              </div>
              <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800">
                <span className="text-xs text-slate-400 block">الوزن الصافي بعد الهالك</span>
                <span className="text-xl font-bold text-emerald-400 font-mono">{netWeightKg} كجم</span>
              </div>
              <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800">
                <span className="text-xs text-slate-400 block">وزن المتر الطولي للمنتج</span>
                <span className="text-xl font-bold text-blue-400 font-mono">{unitWeightKgPerM.toFixed(3)} كجم/م</span>
              </div>
              <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800">
                <span className="text-xs text-slate-400 block">إجمالي طول الخرج الصافي</span>
                <span className="text-2xl font-bold text-amber-400 font-mono">{totalBarLengthM} متر</span>
              </div>
            </div>
            <div className="bg-slate-950 p-4 rounded-lg border border-slate-800 flex justify-between items-center">
              <span className="text-sm text-slate-300">عدد الأعواد التجارية (طول {commercialLen} متر):</span>
              <span className="text-xl font-bold text-white font-mono">{barsCount} عود</span>
            </div>
          </div>
        </div>
      )}

      {/* 4. حاسبة القدرة والعزم واللوبر ومرجع القوانين */}
      {subTab === 'power' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 space-y-4">
            <h3 className="text-lg font-bold text-blue-400 border-b border-slate-800 pb-3">
              حسابات عزم الموتور والأمبير واللوبر (Torque & Looper Tension)
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-400 block mb-1">قوة الدرفلة المقدرة F (kN)</label>
                <input type="number" value={rollingForce} onChange={(e) => setRollingForce(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white font-mono" />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">المسافة بين الاستاندين (mm)</label>
                <input type="number" value={looperSpan} onChange={(e) => setLooperSpan(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white font-mono" />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">ارتفاع اللوبر الفعلي (mm)</label>
                <input type="number" value={looperHeight} onChange={(e) => setLooperHeight(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white font-mono" />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">جهد تشغيل الموتور (Volt)</label>
                <input type="number" value={voltage} onChange={(e) => setVoltage(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white font-mono" />
              </div>
            </div>

            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">عزم الدرفلة المطلوب ($M_t$):</span>
                <span className="text-white font-mono font-bold">{torqueKnM} kN.m</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">القدرة الميكانيكية المطلوبة ($P$):</span>
                <span className="text-emerald-400 font-mono font-bold">{powerKw} kW</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">الأمبير المتوقع سحبه ($I$):</span>
                <span className="text-amber-400 font-mono font-bold">{estCurrentAmp} Amp</span>
              </div>
              <div className="flex justify-between text-sm pt-2 border-t border-slate-800">
                <span className="text-slate-400">زاوية اللوبر / الطول المخزن:</span>
                <span className="text-blue-400 font-mono font-bold">{looperAngleDeg}° ({looperExtraLengthMm} mm)</span>
              </div>
            </div>
          </div>

          <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 space-y-3">
            <h3 className="text-lg font-bold text-amber-400 border-b border-slate-800 pb-3">
              المرجع السريع لقوانين الدرفلة الأساسية
            </h3>
            <ul className="space-y-2.5 text-xs text-slate-300 leading-relaxed">
              <li className="p-2.5 bg-slate-950 rounded-lg border border-slate-800">
                <strong className="text-blue-400 block">1. قانون السرعة الخطية للمعدن:</strong>
                $V (\text{m/s}) = \frac{\pi \times D_{\text{work}} (\text{mm}) \times N_{\text{motor}}}{60 \times 1000 \times i_{\text{gear}}}$
              </li>
              <li className="p-2.5 bg-slate-950 rounded-lg border border-slate-800">
                <strong className="text-emerald-400 block">2. قانون التدفق الحجمي الثابت (Constant Mass Flow):</strong>
                $A_1 \times V_1 = A_2 \times V_2 = A_n \times V_n = \text{Constant}$
              </li>
              <li className="p-2.5 bg-slate-950 rounded-lg border border-slate-800">
                <strong className="text-purple-400 block">3. قانون الانزلاق الأمامي (Forward Slip $S_f$):</strong>
                $S_f \% = \frac{V_{\text{exit}} - V_{\text{roll}}}{V_{\text{roll}}} \times 100$ (يتراوح عادة بين 3% إلى 8%)
              </li>
              <li className="p-2.5 bg-slate-950 rounded-lg border border-slate-800">
                <strong className="text-amber-400 block">4. وزن المتر الطولي للقطاعات:</strong>
                للتسليح: $\frac{D^2}{162.2}$ كجم/م | للخوص والزوايا: $\text{Area (mm}^2) \times 0.00785$ كجم/م
              </li>
            </ul>
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// 2. قسم يوميات التشغيل والاستاندات 1-12 (Shift Handover & Stands 1-12)
// ============================================================================
const OperationsSection = ({ currentTenant, stands, setStands, pendingChanges, setPendingChanges }) => {
  const [selectedStand, setSelectedStand] = useState(null);
  const [downtimeReason, setDowntimeReason] = useState('');
  const [downtimeCategory, setDowntimeCategory] = useState('كهرباء وكنترول');
  const [downtimeMins, setDowntimeMins] = useState(15);
  const [downtimeLogs, setDowntimeLogs] = useState([
    { id: 1, category: 'ميكانيكا ودرافيل', reason: 'تغيير باس استاند 5 وضبط الخلوص', mins: 25, time: '10:30 ص' }
  ]);
  const [shiftBillets, setShiftBillets] = useState(340);

  // تعديل مباشر لعدادات البليت ورولمان البلي (يتخطى موافقة المدير)
  const handleQuickCounterUpdate = (standId, addTons) => {
    setStands((prev) =>
      prev.map((s) =>
        s.id === standId
          ? { ...s, tonnageOnPass: s.tonnageOnPass + addTons, bearingHours: s.bearingHours + 1 }
          : s
      )
    );
  };

  // طلب تغيير باس أو قطر درفيل (يرسل للمدير للموافقة)
  const handleRequestPassChange = (e) => {
    e.preventDefault();
    if (!selectedStand) return;
    const changeReq = {
      id: Date.now(),
      standId: selectedStand.id,
      standName: selectedStand.name,
      newRollDia: Number(selectedStand.rollDia),
      newPassNumber: Number(selectedStand.passNumber),
      newStatus: selectedStand.status,
      requestedBy: 'مشغل غرفة التحكم الرئيسية',
      timestamp: new Date().toLocaleTimeString('ar-EG'),
      zeroPass: selectedStand.zeroPass || false
    };
    setPendingChanges((prev) => [changeReq, ...prev]);
    setSelectedStand(null);
    alert('تم إرسال طلب تعديل الباس/الدرفيل إلى لوحة مدير الإنتاج للاعتماد!');
  };

  // حفظ تقرير الوردية في Firebase
  const handleSaveShiftToCloud = async () => {
    try {
      const docRef = await addDoc(collection(db, 'shift_reports'), {
        tenantCode: currentTenant.code,
        tenantName: currentTenant.name,
        billetsCount: Number(shiftBillets),
        standsSnapshot: stands,
        downtimeLogs: downtimeLogs,
        createdAt: serverTimestamp()
      });
      alert(`تم حفظ تقرير الوردية سحابياً باسم (${currentTenant.name})! رقم المرجع: ${docRef.id}`);
    } catch (err) {
      console.error(err);
      alert('تم الحفظ محلياً، وتأكد من إعدادات Rules في Firebase Firestore.');
    }
  };

  const addDowntime = () => {
    if (!downtimeReason.trim()) return;
    setDowntimeLogs([
      {
        id: Date.now(),
        category: downtimeCategory,
        reason: downtimeReason,
        mins: Number(downtimeMins),
        time: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })
      },
      ...downtimeLogs
    ]);
    setDowntimeReason('');
  };

  return (
    <div className="space-y-6">
      {/* شريط معلومات الوردية السريع */}
      <div className="bg-slate-900 p-5 rounded-xl border border-slate-800 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-blue-600/20 text-blue-400 border border-blue-500/30">
              {currentTenant.name}
            </span>
            <span className="text-xs text-slate-500 font-mono">كود المصنع: {currentTenant.code}</span>
          </div>
          <h2 className="text-2xl font-bold text-white mt-1">خريطة خط الدرفلة (Stands 1 – 12)</h2>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="bg-slate-950 px-4 py-2 rounded-lg border border-slate-800 flex items-center gap-3">
            <span className="text-xs text-slate-400">عداد البيليت بالوردية:</span>
            <input
              type="number"
              value={shiftBillets}
              onChange={(e) => setShiftBillets(e.target.value)}
              className="w-20 bg-slate-900 border border-slate-700 rounded px-2 py-1 text-emerald-400 font-mono font-bold text-center"
            />
          </div>
          <button
            onClick={handleSaveShiftToCloud}
            className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2.5 rounded-lg font-medium flex items-center gap-2 shadow-lg shadow-blue-600/20"
          >
            <Save size={18} />
            <span>حفظ تقرير الوردية سحابياً</span>
          </button>
        </div>
      </div>

      {/* شبكة الاستاندات 1 إلى 12 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {stands.map((stand) => {
          const loadPercent = Math.min(100, Math.round((stand.tonnageOnPass / stand.maxPassTonnage) * 100));
          return (
            <div
              key={stand.id}
              className="bg-slate-900 rounded-xl p-4 border border-slate-800 hover:border-slate-600 transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <h3 className="text-lg font-bold text-white">{stand.name}</h3>
                    <span className="text-[11px] text-slate-400">{stand.type}</span>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded text-xs font-bold ${
                      stand.status === 'active'
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : stand.status === 'warning'
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        : 'bg-red-500/20 text-red-400 border border-red-500/30'
                    }`}
                  >
                    {stand.status === 'active' ? 'يعمل' : stand.status === 'warning' ? 'تنبيه باس' : 'متوقف'}
                  </span>
                </div>

                <div className="space-y-1.5 text-xs text-slate-300 mt-3 bg-slate-950 p-3 rounded-lg border border-slate-800/80">
                  <div className="flex justify-between">
                    <span className="text-slate-400">قطر الدرفيل / الشغال:</span>
                    <span className="font-mono text-white font-bold">{stand.rollDia} / {stand.workingDia} mm</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">السرعة / الموتور:</span>
                    <span className="font-mono text-blue-400">{stand.speedMps} m/s ({stand.motorRpm} RPM)</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">رقم الباس الحالي:</span>
                    <span className="font-mono text-amber-400 font-bold">Pass #{stand.passNumber}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">ساعات البلي (Bearing):</span>
                    <span className="font-mono text-slate-200">{stand.bearingHours} ساعة</span>
                  </div>
                </div>

                {/* شريط استهلاك الباس */}
                <div className="mt-3">
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-slate-400">إنتاج الباس:</span>
                    <span className="font-mono text-white">{stand.tonnageOnPass} / {stand.maxPassTonnage} طن</span>
                  </div>
                  <div className="w-full h-2 bg-slate-950 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${loadPercent > 85 ? 'bg-red-500' : loadPercent > 65 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                      style={{ width: `${loadPercent}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-slate-800">
                <button
                  onClick={() => handleQuickCounterUpdate(stand.id, 10)}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-200 py-1.5 rounded-lg text-xs font-medium"
                >
                  +10 طن إنتاج
                </button>
                <button
                  onClick={() => setSelectedStand({ ...stand, zeroPass: false })}
                  className="bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30 py-1.5 rounded-lg text-xs font-medium"
                >
                  تعديل / تصفير باس
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* نافذة تعديل وتصفير الباس (Modal) */}
      {selectedStand && (
        <div className="fixed inset-0 bg-black/75 flex items-center justify-center p-4 z-50">
          <form
            onSubmit={handleRequestPassChange}
            className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-md w-full space-y-4"
          >
            <h3 className="text-xl font-bold text-white">
              طلب تعديل بيانات {selectedStand.name}
            </h3>
            <p className="text-xs text-amber-400">
              ملاحظة: تغييرات الأقطار وتصفير الباسات تُرسل لمدير الإنتاج للاعتماد قبل التفعيل النهائي.
            </p>
            <div>
              <label className="text-xs text-slate-400 block mb-1">قطر الدرفيل الجديد (mm)</label>
              <input
                type="number"
                value={selectedStand.rollDia}
                onChange={(e) => setSelectedStand({ ...selectedStand, rollDia: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white font-mono"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">رقم الباس الجديد (Pass Number)</label>
              <input
                type="number"
                value={selectedStand.passNumber}
                onChange={(e) => setSelectedStand({ ...selectedStand, passNumber: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white font-mono"
              />
            </div>
            <div>
              <label className="text-xs text-slate-400 block mb-1">حالة الاستاند</label>
              <select
                value={selectedStand.status}
                onChange={(e) => setSelectedStand({ ...selectedStand, status: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white"
              >
                <option value="active">يعمل بشكل طبيعي (Active)</option>
                <option value="warning">يحتاج مراجعة قريباً (Warning)</option>
                <option value="danger">متوقف للصيانة (Stopped)</option>
              </select>
            </div>
            <label className="flex items-center gap-2 text-sm text-slate-200 cursor-pointer">
              <input
                type="checkbox"
                checked={selectedStand.zeroPass}
                onChange={(e) => setSelectedStand({ ...selectedStand, zeroPass: e.target.checked })}
              />
              <span>تصفير عداد أطنان الباس (Pass Zeroing)</span>
            </label>
            <div className="flex gap-3 pt-2">
              <button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-500 text-white py-2 rounded-lg font-bold">
                إرسال للاعتماد
              </button>
              <button
                type="button"
                onClick={() => setSelectedStand(null)}
                className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-300 py-2 rounded-lg"
              >
                إلغاء
              </button>
            </div>
          </form>
        </div>
      )}

      {/* سجل التوقفات والأعطال اليومية (Downtime Tracker) */}
      <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 space-y-4">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <Clock size={20} className="text-amber-400" />
          سجل توقفات الخط خلال الوردية (Downtime Log)
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <select
            value={downtimeCategory}
            onChange={(e) => setDowntimeCategory(e.target.value)}
            className="bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white text-sm"
          >
            <option>كهرباء وكنترول</option>
            <option>ميكانيكا ودرافيل</option>
            <option>تشغيل وحشر (Cobble)</option>
            <option>هيدروليك وتبريد</option>
          </select>
          <input
            type="text"
            placeholder="سبب التوقف بالتفصيل..."
            value={downtimeReason}
            onChange={(e) => setDowntimeReason(e.target.value)}
            className="md:col-span-2 bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white text-sm"
          />
          <div className="flex gap-2">
            <input
              type="number"
              value={downtimeMins}
              onChange={(e) => setDowntimeMins(e.target.value)}
              className="w-24 bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white font-mono text-center"
              placeholder="دقيقة"
            />
            <button
              onClick={addDowntime}
              className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg font-medium text-sm"
            >
              تسجيل
            </button>
          </div>
        </div>

        <div className="space-y-2">
          {downtimeLogs.map((log) => (
            <div key={log.id} className="bg-slate-950 p-3 rounded-lg border border-slate-800 flex justify-between items-center text-sm">
              <div>
                <span className="text-amber-400 font-bold ml-2">[{log.category}]</span>
                <span className="text-slate-200">{log.reason}</span>
              </div>
              <div className="flex items-center gap-4 font-mono text-xs">
                <span className="text-red-400 font-bold">{log.mins} دقيقة</span>
                <span className="text-slate-500">{log.time}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ============================================================================
// 3. موسوعة الأعطال والصيانة ولوحة الشرف (Troubleshooting Hub & Leaderboard)
// ============================================================================
const TroubleshootingSection = ({ faults, setFaults }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [newCode, setNewCode] = useState('');
  const [newBrand, setNewBrand] = useState('Siemens SINAMICS');
  const [newTitle, setNewTitle] = useState('');
  const [newSolution, setNewSolution] = useState('');
  const [authorName, setAuthorName] = useState('');

  const filteredFaults = faults.filter(
    (f) =>
      f.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      f.brand.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleAddFault = async (e) => {
    e.preventDefault();
    if (!newCode || !newTitle || !newSolution) return;
    const item = {
      id: Date.now().toString(),
      code: newCode,
      brand: newBrand,
      category: 'مشاركة خبرات',
      title: newTitle,
      cause: 'تم رصدها أثناء التشغيل الفعلي بالمصنع',
      solution: newSolution,
      author: authorName || 'مهندس / فني صيانة',
      points: 15
    };
    setFaults([item, ...faults]);
    try {
      await addDoc(collection(db, 'troubleshooting_hub'), item);
    } catch (err) {
      console.error(err);
    }
    setNewCode('');
    setNewTitle('');
    setNewSolution('');
  };

  // تجميع نقاط لوحة الشرف
  const leaderboard = Object.values(
    faults.reduce((acc, curr) => {
      acc[curr.author] = acc[curr.author] || { name: curr.author, points: 0, count: 0 };
      acc[curr.author].points += curr.points || 10;
      acc[curr.author].count += 1;
      return acc;
    }, {})
  ).sort((a, b) => b.points - a.points);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 space-y-6">
        <div className="bg-slate-900 p-5 rounded-xl border border-slate-800 space-y-4">
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Wrench className="text-amber-400" />
            موسوعة أعطال الدرايفات والكنترول والميكانيكا
          </h2>
          <div className="relative">
            <Search className="absolute right-3 top-3 text-slate-500" size={18} />
            <input
              type="text"
              placeholder="ابحث بكود العطل (مثلاً F0001 أو ENC-FLT أو Siemens أو Looper)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg pr-10 pl-4 py-2.5 text-white text-sm"
            />
          </div>
        </div>

        <div className="space-y-4">
          {filteredFaults.map((fault) => (
            <div key={fault.id} className="bg-slate-900 p-5 rounded-xl border border-slate-800 space-y-2">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-2">
                  <span className="px-2.5 py-1 bg-red-500/20 text-red-400 border border-red-500/30 rounded font-mono font-bold text-sm">
                    {fault.code}
                  </span>
                  <span className="text-xs bg-slate-800 text-slate-300 px-2.5 py-1 rounded">
                    {fault.brand}
                  </span>
                </div>
                <span className="text-xs text-slate-400">بواسطة: {fault.author}</span>
              </div>
              <h3 className="text-lg font-bold text-white">{fault.title}</h3>
              <p className="text-xs text-slate-400"><strong>السبب المحتمل:</strong> {fault.cause}</p>
              <div className="bg-slate-950 p-3 rounded-lg border border-emerald-900/40 text-xs text-emerald-300">
                <strong>خطوات الإصلاح السريع: </strong> {fault.solution}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* القسم الجانبي: إضافة عطل + لوحة الشرف */}
      <div className="space-y-6">
        <div className="bg-slate-900 p-5 rounded-xl border border-slate-800">
          <h3 className="text-lg font-bold text-amber-400 flex items-center gap-2 mb-4">
            <Award size={20} />
            لوحة شرف خبراء الصيانة (Leaderboard)
          </h3>
          <div className="space-y-2.5">
            {leaderboard.map((user, idx) => (
              <div key={user.name} className="bg-slate-950 p-3 rounded-lg border border-slate-800 flex justify-between items-center">
                <div className="flex items-center gap-2.5">
                  <span className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 text-xs font-bold flex items-center justify-center">
                    {idx + 1}
                  </span>
                  <div>
                    <p className="text-sm font-bold text-white">{user.name}</p>
                    <p className="text-[11px] text-slate-400">{user.count} مساهمات فنية</p>
                  </div>
                </div>
                <span className="text-emerald-400 font-mono font-bold text-sm">{user.points} نقطة</span>
              </div>
            ))}
          </div>
        </div>

        <form onSubmit={handleAddFault} className="bg-slate-900 p-5 rounded-xl border border-slate-800 space-y-3">
          <h3 className="text-lg font-bold text-white">شارك حل عطل واجهك (+15 نقطة)</h3>
          <input
            type="text"
            placeholder="اسمك (للوحة الشرف)"
            value={authorName}
            onChange={(e) => setAuthorName(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-sm text-white"
          />
          <input
            type="text"
            placeholder="كود العطل (مثلاً F008 أو Cobble-S4)"
            value={newCode}
            onChange={(e) => setNewCode(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-sm text-white"
          />
          <select
            value={newBrand}
            onChange={(e) => setNewBrand(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-sm text-white"
          >
            <option>Siemens SINAMICS / WinCC</option>
            <option>Parker SSD Drives</option>
            <option>PLC & Sensors</option>
            <option>ميكانيكا ودرافيل وهيدروليك</option>
          </select>
          <input
            type="text"
            placeholder="وصف المشكلة باختصار"
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-sm text-white"
          />
          <textarea
            rows={3}
            placeholder="كيف قمت بحل المشكلة؟"
            value={newSolution}
            onChange={(e) => setNewSolution(e.target.value)}
            className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-sm text-white"
          />
          <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white py-2 rounded-lg font-bold text-sm">
            نشر الحل في الموسوعة
          </button>
        </form>
      </div>
    </div>
  );
};

// ============================================================================
// 4. لوحة مدير الإنتاج بالمصنع (Factory Manager Admin Panel)
// ============================================================================
const FactoryAdminSection = ({ currentTenant, stands, setStands, pendingChanges, setPendingChanges }) => {
  const [pinInput, setPinInput] = useState('');
  const [unlocked, setUnlocked] = useState(false);

  const handleApprove = (change) => {
    setStands((prev) =>
      prev.map((s) =>
        s.id === change.standId
          ? {
              ...s,
              rollDia: change.newRollDia,
              passNumber: change.newPassNumber,
              status: change.newStatus,
              tonnageOnPass: change.zeroPass ? 0 : s.tonnageOnPass,
              entryDate: new Date().toISOString().slice(0, 10)
            }
          : s
      )
    );
    setPendingChanges((prev) => prev.filter((c) => c.id !== change.id));
  };

  const handleExportCSV = () => {
    const headers = ['Stand,Type,Status,RollDia(mm),WorkingDia(mm),Speed(m/s),MotorRPM,PassNumber,TonnageOnPass\n'];
    const rows = stands.map(
      (s) =>
        `${s.name},${s.type},${s.status},${s.rollDia},${s.workingDia},${s.speedMps},${s.motorRpm},${s.passNumber},${s.tonnageOnPass}`
    );
    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + headers.concat(rows.join('\n'));
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Report_${currentTenant.code}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
  };

  if (!unlocked) {
    return (
      <div className="max-w-md mx-auto bg-slate-900 p-8 rounded-2xl border border-slate-800 text-center space-y-4 mt-10">
        <ShieldCheck size={48} className="mx-auto text-blue-500" />
        <h2 className="text-xl font-bold text-white">لوحة اعتماد مدير الإنتاج ({currentTenant.name})</h2>
        <p className="text-xs text-slate-400">
          أدخل رمز مدير المصنع لاعتماد تغييرات الباسات وتصدير التقارير (الرمز الافتراضي: <span className="font-mono text-white">{currentTenant.managerPin}</span>)
        </p>
        <input
          type="password"
          placeholder="PIN مدير المصنع"
          value={pinInput}
          onChange={(e) => setPinInput(e.target.value)}
          className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-center text-white font-mono text-lg"
        />
        <button
          onClick={() => {
            if (pinInput === currentTenant.managerPin || pinInput === '1234') setUnlocked(true);
            else alert('الرمز غير صحيح');
          }}
          className="w-full bg-blue-600 hover:bg-blue-500 text-white py-2.5 rounded-lg font-bold"
        >
          دخول لوحة مدير المصنع
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 p-5 rounded-xl border border-slate-800 flex flex-wrap justify-between items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">لوحة مدير الإنتاج واعتماد الباسات</h2>
          <p className="text-xs text-slate-400">المصنع الحالي: {currentTenant.name}</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleExportCSV}
            className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2"
          >
            <Download size={16} />
            <span>تصدير Excel (CSV)</span>
          </button>
          <button
            onClick={() => window.print()}
            className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2"
          >
            <Printer size={16} />
            <span>طباعة تقرير PDF</span>
          </button>
        </div>
      </div>

      <div className="bg-slate-900 p-6 rounded-xl border border-slate-800 space-y-4">
        <h3 className="text-lg font-bold text-amber-400">
          طلبات تغيير الدرافيل وتصفير الباسات المعلقة ({pendingChanges.length})
        </h3>
        {pendingChanges.length === 0 ? (
          <p className="text-sm text-slate-500">لا توجد طلبات معلقة حالياً.</p>
        ) : (
          <div className="space-y-3">
            {pendingChanges.map((change) => (
              <div key={change.id} className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <span className="text-white font-bold">{change.standName}</span>
                  <p className="text-xs text-slate-300 mt-1">
                    القطر الجديد: <strong>{change.newRollDia} mm</strong> | الباس الجديد: <strong>#{change.newPassNumber}</strong> | تصفير العداد: <strong>{change.zeroPass ? 'نعم' : 'لا'}</strong>
                  </p>
                  <span className="text-[11px] text-slate-500">وقت الطلب: {change.timestamp}</span>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleApprove(change)}
                    className="bg-emerald-600 hover:bg-emerald-500 text-white px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1"
                  >
                    <CheckCircle2 size={14} /> اعتماد وتنفيذ
                  </button>
                  <button
                    onClick={() => setPendingChanges((prev) => prev.filter((c) => c.id !== change.id))}
                    className="bg-red-600/20 hover:bg-red-600/30 text-red-400 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1"
                  >
                    <XCircle size={14} /> رفض
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// ============================================================================
// 5. لوحة تحكم المصمم ومؤسس المنصة السرية (Creator & SaaS Super Admin)
// تفتح عند الضغط 5 مرات على لوجو SteelPortal
// ============================================================================
const CreatorSuperAdminModal = ({ isOpen, onClose, tenants, setTenants, currentTenant, setCurrentTenant }) => {
  const [masterPin, setMasterPin] = useState('');
  const [isCreatorAuth, setIsCreatorAuth] = useState(false);
  const [factoryName, setFactoryName] = useState('');
  const [factoryCode, setFactoryCode] = useState('');
  const [factoryPlan, setFactoryPlan] = useState('باقة المصانع الاحترافية (Pro SaaS)');
  const [factoryPin, setFactoryPin] = useState('1234');

  if (!isOpen) return null;

  const handleCreateTenant = async (e) => {
    e.preventDefault();
    if (!factoryName || !factoryCode) return;
    const newTenant = {
      id: Date.now().toString(),
      name: factoryName,
      code: factoryCode.toUpperCase(),
      plan: factoryPlan,
      status: 'active',
      managerPin: factoryPin,
      standsCount: 12,
      expiryDate: '2027-12-31'
    };
    setTenants([newTenant, ...tenants]);
    try {
      await addDoc(collection(db, 'saas_tenants'), newTenant);
    } catch (err) {
      console.error(err);
    }
    setFactoryName('');
    setFactoryCode('');
    alert(`تم تفعيل اشتراك المصنع الجديد بالكود: ${newTenant.code}`);
  };

  const toggleTenantStatus = (id) => {
    setTenants((prev) =>
      prev.map((t) => (t.id === id ? { ...t, status: t.status === 'active' ? 'suspended' : 'active' } : t))
    );
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-slate-900 border-2 border-amber-500/40 rounded-2xl p-6 max-w-4xl w-full space-y-6">
        <div className="flex justify-between items-center border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="bg-amber-500/20 p-2.5 rounded-xl border border-amber-500/40">
              <Key className="text-amber-400" size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">لوحة تحكم المبرمج ومؤسس المنصة (SaaS Master Console)</h2>
              <p className="text-xs text-amber-400">خاص بالمهندس بسام وليد (Controlexa / SteelPortal Creator)</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white text-sm bg-slate-800 px-3 py-1.5 rounded-lg">
            إغلاق X
          </button>
        </div>

        {!isCreatorAuth ? (
          <div className="max-w-sm mx-auto py-8 text-center space-y-4">
            <Lock size={40} className="mx-auto text-amber-400" />
            <p className="text-sm text-slate-300">أدخل الرقم السري الخاص بمصمم المنصة (الافتراضي: 2026)</p>
            <input
              type="password"
              value={masterPin}
              onChange={(e) => setMasterPin(e.target.value)}
              placeholder="Master Password"
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-3 text-center text-white font-mono"
            />
            <button
              onClick={() => {
                if (masterPin === '2026' || masterPin === 'beso') setIsCreatorAuth(true);
                else alert('كلمة المرور غير صحيحة');
              }}
              className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-2.5 rounded-lg"
            >
              فتح لوحة التحكم الكاملة
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* فورم إنشاء مصنع جديد (SaaS Tenant) */}
            <form onSubmit={handleCreateTenant} className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
              <h3 className="text-sm font-bold text-amber-400 flex items-center gap-2">
                <PlusCircle size={16} /> إضافة مصنع جديد وتوليد كود اشتراك
              </h3>
              <div>
                <label className="text-xs text-slate-400 block mb-1">اسم المصنع / الشركة</label>
                <input
                  type="text"
                  placeholder="مثلاً: حديد الأردن / مصنع العبور"
                  value={factoryName}
                  onChange={(e) => setFactoryName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-sm text-white"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">كود تفعيل المصنع (Activation Key)</label>
                <input
                  type="text"
                  placeholder="مثلاً: JORDAN-2026"
                  value={factoryCode}
                  onChange={(e) => setFactoryCode(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-sm text-white font-mono uppercase"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">الباقة (SaaS Plan)</label>
                <select
                  value={factoryPlan}
                  onChange={(e) => setFactoryPlan(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-sm text-white"
                >
                  <option>باقة المصانع المتقدمة (Enterprise SaaS)</option>
                  <option>باقة المصانع الاحترافية (Pro SaaS)</option>
                  <option>الباقة التجريبية (Trial 30 Days)</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">الرقم السري لمدير هذا المصنع</label>
                <input
                  type="text"
                  value={factoryPin}
                  onChange={(e) => setFactoryPin(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-sm text-white font-mono"
                />
              </div>
              <button type="submit" className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold py-2 rounded-lg text-sm">
                تفعيل وحفظ في السحابة
              </button>
            </form>

            {/* قائمة المصانع المشتركة */}
            <div className="lg:col-span-2 space-y-3">
              <h3 className="text-sm font-bold text-white">إدارة المصانع المشتركة في المنصة ({tenants.length} مصانع)</h3>
              <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
                {tenants.map((t) => (
                  <div key={t.id} className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white text-sm">{t.name}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${t.status === 'active' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                          {t.status === 'active' ? 'مفعل' : 'موقوف'}
                        </span>
                      </div>
                      <p className="text-xs text-slate-400 mt-1">
                        كود الدخول: <strong className="text-amber-400 font-mono">{t.code}</strong> | الباقة: {t.plan} | PIN المدير: {t.managerPin}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setCurrentTenant(t)}
                        className="bg-blue-600/20 text-blue-400 border border-blue-500/30 px-2.5 py-1 rounded text-xs font-bold"
                      >
                        معاينة كمصنع حالي
                      </button>
                      <button
                        onClick={() => toggleTenantStatus(t.id)}
                        className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-2.5 py-1 rounded text-xs"
                      >
                        {t.status === 'active' ? 'إيقاف الاشتراك' : 'تفعيل'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// ============================================================================
// التطبيق الرئيسي (Main Portal App)
// ============================================================================
export default function App() {
  const [activeTab, setActiveTab] = useState('calculators');
  const [tenants, setTenants] = useState(INITIAL_TENANTS);
  const [currentTenant, setCurrentTenant] = useState(INITIAL_TENANTS[0]);
  const [stands, setStands] = useState(INITIAL_STANDS);
  const [pendingChanges, setPendingChanges] = useState([]);
  const [faults, setFaults] = useState(DEFAULT_FAULTS);

  // عداد الضغطات السرية على اللوجو لفتح لوحة المصمم (5 ضغطات)
  const [logoClicks, setLogoClicks] = useState(0);
  const [showCreatorModal, setShowCreatorModal] = useState(false);
  const [switchCodeInput, setSwitchCodeInput] = useState('');

  const handleLogoClick = () => {
    const next = logoClicks + 1;
    if (next >= 5) {
      setShowCreatorModal(true);
      setLogoClicks(0);
    } else {
      setLogoClicks(next);
    }
  };

  const handleTenantSwitch = (e) => {
    e.preventDefault();
    const found = tenants.find((t) => t.code.toUpperCase() === switchCodeInput.trim().toUpperCase());
    if (!found) {
      alert('كود المصنع غير مسجل! يمكنك توليد أكواد جديدة من لوحة المصمم السرية.');
      return;
    }
    if (found.status !== 'active') {
      alert('عفواً، اشتراك هذا المصنع موقوف مؤقتاً من قبل إدارة المنصة.');
      return;
    }
    setCurrentTenant(found);
    setSwitchCodeInput('');
  };

  const navItems = [
    { id: 'calculators', label: 'حاسبة الدرفلة الذكية', icon: Calculator },
    { id: 'operations', label: 'إدارة يوميات التشغيل', icon: Activity },
    { id: 'faults', label: 'موسوعة الأعطال والصيانة', icon: Wrench },
    { id: 'admin', label: 'لوحة مدير المصنع', icon: ShieldCheck }
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 flex flex-col md:flex-row font-sans" dir="rtl">
      {/* القائمة الجانبية */}
      <aside className="w-full md:w-72 bg-slate-900 border-l border-slate-800 p-4 flex flex-col justify-between">
        <div>
          {/* اللوجو (اضغط 5 مرات لفتح لوحة المصمم السرية) */}
          <div
            onClick={handleLogoClick}
            title="اضغط 5 مرات لفتح لوحة تحكم مصمم المنصة"
            className="flex items-center gap-3 mb-6 px-2 mt-2 cursor-pointer select-none group"
          >
            <div className="bg-blue-600 p-2.5 rounded-xl shadow-lg shadow-blue-600/30 group-active:scale-95 transition-transform">
              <Zap className="text-white" size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white tracking-tight">
                Steel<span className="text-blue-500">Portal</span>
                <span className="text-[10px] bg-blue-500/20 text-blue-400 px-1.5 py-0.5 rounded mr-1.5">SaaS</span>
              </h1>
              <p className="text-[11px] text-slate-400">منصة صناع الحديد والدرفلة</p>
            </div>
          </div>

          {/* صندوق تبديل كود المصنع (SaaS Workspace) */}
          <form onSubmit={handleTenantSwitch} className="bg-slate-950 p-3 rounded-xl border border-slate-800 mb-6 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-400 flex items-center gap-1">
                <Building2 size={13} className="text-blue-400" /> المصنع النشط:
              </span>
              <span className="text-emerald-400 font-mono font-bold">{currentTenant.code}</span>
            </div>
            <p className="text-xs font-bold text-white truncate">{currentTenant.name}</p>
            <div className="flex gap-1.5 pt-1">
              <input
                type="text"
                placeholder="أدخل كود مصنع آخر..."
                value={switchCodeInput}
                onChange={(e) => setSwitchCodeInput(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs text-white font-mono uppercase"
              />
              <button type="submit" className="bg-slate-800 hover:bg-slate-700 text-slate-200 px-2.5 py-1 rounded text-xs">
                تبديل
              </button>
            </div>
          </form>

          {/* أزرار التنقل */}
          <nav className="space-y-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center justify-between p-3 rounded-xl transition-all ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/25 font-bold'
                      : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon size={19} />
                    <span className="text-sm">{item.label}</span>
                  </div>
                  {item.id === 'admin' && pendingChanges.length > 0 && (
                    <span className="bg-amber-500 text-slate-950 text-xs font-bold px-2 py-0.5 rounded-full">
                      {pendingChanges.length}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* الفوتر الجانبي */}
        <div className="pt-4 border-t border-slate-800 mt-6 text-xs text-slate-500 space-y-1">
          <p className="text-slate-300 font-medium">غرفة التحكم الرئيسية (MCR)</p>
          <p>تطوير: م. بسام وليد (Controlexa)</p>
        </div>
      </aside>

      {/* المحتوى الرئيسي */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto">
        <div className="max-w-6xl mx-auto">
          {activeTab === 'calculators' && <CalculatorsSection />}
          {activeTab === 'operations' && (
            <OperationsSection
              currentTenant={currentTenant}
              stands={stands}
              setStands={setStands}
              pendingChanges={pendingChanges}
              setPendingChanges={setPendingChanges}
            />
          )}
          {activeTab === 'faults' && <TroubleshootingSection faults={faults} setFaults={setFaults} />}
          {activeTab === 'admin' && (
            <FactoryAdminSection
              currentTenant={currentTenant}
              stands={stands}
              setStands={setStands}
              pendingChanges={pendingChanges}
              setPendingChanges={setPendingChanges}
            />
          )}
        </div>
      </main>

      {/* نافذة مصمم المنصة السرية */}
      <CreatorSuperAdminModal
        isOpen={showCreatorModal}
        onClose={() => setShowCreatorModal(false)}
        tenants={tenants}
        setTenants={setTenants}
        currentTenant={currentTenant}
        setCurrentTenant={setCurrentTenant}
      />
    </div>
  );
}
