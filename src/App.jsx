import React, { useState, useEffect } from 'react';
import {
  Calculator, Wrench, MessageSquare, Building2, ShieldCheck, Zap,
  Award, Search, Send, Lock, CheckCircle2, XCircle, PlusCircle,
  Download, Printer, Activity, Layers, Key, RefreshCw, AlertTriangle, Clock
} from 'lucide-react';
import {
  collection, addDoc, getDocs, query, orderBy, serverTimestamp
} from 'firebase/firestore';
import { db } from './firebase';

// ============================================================================
// بيانات أولية للدرافيل والممرات (Roll & Pass Life Management) للشركات
// ============================================================================
const INITIAL_STANDS_PASSES = Array.from({ length: 12 }, (_, i) => ({
  id: i + 1,
  name: `استاند ${i + 1}`,
  section: i < 4 ? 'تخشين (Roughing)' : i < 8 ? 'متوسط (Intermediate)' : 'تشطيب (Finishing)',
  status: i === 4 ? 'warning' : 'active',
  rollCode: `R-${101 + i}`,
  maxDia: 485 - i * 10,
  currentDia: 472 - i * 10,
  minScrapDia: 420 - i * 10,
  collarDepth: 8 + (i % 3),
  speedMps: (1.2 + i * 0.45).toFixed(2),
  motorRpm: Math.round(350 + i * 65),
  activeGroove: 2,
  totalGrooves: 5,
  grooveTonnage: Math.floor(160 + (i * 35) % 280),
  maxGrooveCapacity: 400,
  totalRollTonnage: 1450 + i * 120,
  bearingHours: 140 + i * 12,
  installDate: '2026-11-10'
}));

const INITIAL_FAULTS = [
  {
    id: 'f1',
    code: 'F0001 / F30001',
    brand: 'Siemens SINAMICS / Micromaster',
    title: 'Overcurrent - فصل تيار زائد مفاجئ',
    cause: 'دخول بيليت بارد على الاستاند، حشر معدن (Cobble)، أو انهيار عزل كابل الموتور.',
    solution: 'راجع حرارة البيليت، افحص خلوص الدرافيل (Roll Gap)، قس عزل الموتور والكابل بالـ Megger، وتأكد من سلامة الكوبلن.',
    author: 'م. بسام وليد',
    points: 50
  },
  {
    id: 'f2',
    code: 'F0002 / F30002',
    brand: 'Siemens / Parker Drives',
    title: 'DC Link Overvoltage - ارتفاع جهد دائرة الـ DC',
    cause: 'فرملة سريعة للموتور أو فصل في مقاومة الفرملة (Braking Resistor).',
    solution: 'زود زمن التباطؤ (Deceleration Time) وافحص دائرة الـ Braking Chopper.',
    author: 'م. بسام وليد',
    points: 40
  },
  {
    id: 'f3',
    code: 'LPR-OSC',
    brand: 'Looper Scanner & Tension Control',
    title: 'تذبذب اللوبر وعدم استقرار الشد بين الاستاندات',
    cause: 'اتساخ عدسة الـ Looper Scanner بالبخار أو القشور (Scale) أو زيادة سرعة الاستاند الخلفي.',
    solution: 'نظف عدسة الاسكانر وتأكد من هواء التبريد، واضبط ارتفاع اللوبر المرجعي ليعمل في زاوية 15 إلى 20 درجة.',
    author: 'م. بسام وليد',
    points: 60
  },
  {
    id: 'f4',
    code: 'ENC-ERR / F31115',
    brand: 'Incremental Encoder',
    title: 'فقدان إشارة السرعة من الإنكودر',
    cause: 'كسر الكوبلن المرن للإنكودر أو شوشرة كهربائية على كابل الشيلد.',
    solution: 'غير الكوبلن المرن، وتأكد من تأريض الشيلد من جهة الدرايف فقط، أو حول الدرايف مؤقتاً لوضع بدون إنكودر (Sensorless) لحين انتهاء الوردية.',
    author: 'فني صيانة كنترول',
    points: 35
  }
];

const INITIAL_CHAT = [
  {
    id: 'c1',
    sender: 'م. بسام وليد (المؤسس)',
    role: 'مشغل أول غرفة تحكم & كنترول',
    text: 'أهلاً بكل مهندسين وفنيين صناعة الحديد والدرفلة! القسم ده متاح مجاناً للجميع لمناقشة الأعطال، حسابات السرعات، وتبادل الخبرات.',
    time: '09:00 ص'
  },
  {
    id: 'c2',
    sender: 'م. أحمد طارق',
    role: 'مهندس درفلة',
    text: 'شباب، لو بننقل من إنتاج خوصة 50x10 لخوصة 40x10، إيه أفضل نسبة تخفيض على استاند التشطيب قبل الأخير عشان نحافظ على استقامة العود؟',
    time: '09:15 ص'
  }
];

const INITIAL_COMPANIES = [
  {
    id: 'comp1',
    name: 'شركة الجيوشي للصلب (El Gioshy Steel)',
    code: 'GIOSHY-2026',
    plan: 'باقة المصانع المتكاملة (Enterprise Pass & Roll SaaS)',
    status: 'active',
    managerPin: '1234',
    contact: 'غرفة التحكم الرئيسية'
  },
  {
    id: 'comp2',
    name: 'مصنع الدرفلة التجريبي (Demo Steel Mill)',
    code: 'DEMO-2026',
    plan: 'باقة تجريبية للشركات',
    status: 'active',
    managerPin: '0000',
    contact: 'إدارة الإنتاج'
  }
];

// ============================================================================
// 1. قسم الحاسبات الهندسية المجاني (Public Rolling Mill Calculators)
// ============================================================================
const CalculatorsHub = () => {
  const [subTab, setSubTab] = useState('speed');

  // متغيرات السرعة والتزامن
  const [vel, setVel] = useState(2.5);
  const [rollDia, setRollDia] = useState(480);
  const [collarDepth, setCollarDepth] = useState(8);
  const [gearRatio, setGearRatio] = useState(3.5);
  const [poles, setPoles] = useState(4);
  const [area1, setArea1] = useState(1600);
  const [vel1, setVel1] = useState(2.25);
  const [area2, setArea2] = useState(1250);

  // متغيرات الباس ديزاين
  const [hIn, setHIn] = useState(14.5);
  const [bIn, setBIn] = useState(46);
  const [hOut, setHOut] = useState(10);
  const [bOut, setBOut] = useState(50);
  const [workDia, setWorkDia] = useState(480);

  // متغيرات الأوزان والهالك
  const [billetSize, setBilletSize] = useState(130);
  const [billetLen, setBilletLen] = useState(2.0);
  const [scaleLoss, setScaleLoss] = useState(2.0);
  const [prodType, setProdType] = useState('flat');
  const [rebarDia, setRebarDia] = useState(16);
  const [flatW, setFlatW] = useState(50);
  const [flatT, setFlatT] = useState(10);
  const [angleS, setAngleS] = useState(50);
  const [angleT, setAngleT] = useState(5);

  // متغيرات العزم واللوبر
  const [forceKn, setForceKn] = useState(450);
  const [looperSpan, setLooperSpan] = useState(4500);
  const [looperHeight, setLooperHeight] = useState(180);
  const [voltage, setVoltage] = useState(400);

  // الحسابات الرياضية
  const effDia = Math.max(1, Number(rollDia) - Number(collarDepth));
  const rollRpm = ((Number(vel) * 60 * 1000) / (Math.PI * effDia)).toFixed(1);
  const motorRpm = (Number(rollRpm) * Number(gearRatio)).toFixed(0);
  const vfdHz = ((Number(motorRpm) * Number(poles)) / 120).toFixed(1);
  const v2Synced = area2 > 0 ? ((Number(area1) * Number(vel1)) / Number(area2)).toFixed(2) : 0;
  const tonsPerHour = ((Number(area2) / 1000000) * Number(v2Synced) * 7.85 * 3600).toFixed(1);

  const areaInCalc = (Number(hIn) * Number(bIn)).toFixed(1);
  const areaOutCalc = (Number(hOut) * Number(bOut)).toFixed(1);
  const redRatio = areaInCalc > 0 ? (((areaInCalc - areaOutCalc) / areaInCalc) * 100).toFixed(2) : 0;
  const elong = areaOutCalc > 0 ? (areaInCalc / areaOutCalc).toFixed(3) : 0;
  const draft = Math.max(0, Number(hIn) - Number(hOut)).toFixed(2);
  const contactArc = Math.sqrt((Number(workDia) / 2) * Number(draft)).toFixed(2);
  const biteDeg = ((Math.acos(Math.max(-1, Math.min(1, 1 - Number(draft) / Number(workDia)))) * 180) / Math.PI).toFixed(1);
  const spreadMm = (0.35 * Number(draft) * Math.sqrt(Number(workDia) / (2 * Math.max(1, Number(hIn))))).toFixed(2);

  const billetWeight = ((Number(billetSize) / 1000) * (Number(billetSize) / 1000) * Number(billetLen) * 7850).toFixed(1);
  const netWeight = (billetWeight * (1 - Number(scaleLoss) / 100)).toFixed(1);
  let meterWeight = 1;
  if (prodType === 'rebar') {
    meterWeight = (Number(rebarDia) * Number(rebarDia)) / 162.2;
  } else if (prodType === 'flat') {
    meterWeight = Number(flatW) * Number(flatT) * 0.00785;
  } else {
    meterWeight = (2 * Number(angleS) - Number(angleT)) * Number(angleT) * 0.00785;
  }
  const totalOutLength = meterWeight > 0 ? (Number(netWeight) / meterWeight).toFixed(2) : 0;
  const bars12m = (Number(totalOutLength) / 12).toFixed(1);

  const torqueKnM = (2 * Number(forceKn) * 0.45 * (Number(contactArc) / 1000)).toFixed(2);
  const powerKw = ((Number(torqueKnM) * Number(rollRpm) * 2 * Math.PI) / 60).toFixed(1);
  const estAmp = ((Number(powerKw) * 1000) / (1.732 * Number(voltage) * 0.85 * 0.92)).toFixed(0);
  const looperExtraMm = looperSpan > 0 ? ((8 * Math.pow(Number(looperHeight), 2)) / (3 * Number(looperSpan))).toFixed(1) : 0;
  const looperAngle = (Math.atan((2 * Number(looperHeight)) / Math.max(1, Number(looperSpan))) * (180 / Math.PI)).toFixed(1);

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <span className="text-xs bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 px-2.5 py-0.5 rounded-full font-bold">
            أداة مجانية لجميع المهندسين والفنيين
          </span>
          <h2 className="text-2xl font-bold text-white mt-1.5 flex items-center gap-2">
            <Calculator className="text-blue-500" />
            حاسبة الدرفلة الذكية وقوانين التشغيل
          </h2>
        </div>
        <div className="flex flex-wrap gap-2">
          {[
            { id: 'speed', label: 'تزامن السرعات و RPM' },
            { id: 'pass', label: 'الباس ديزاين والتخفيض' },
            { id: 'weight', label: 'الأوزان والهالك والطول' },
            { id: 'power', label: 'العزم واللوبر والقوانين' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSubTab(tab.id)}
              className={`px-3.5 py-2 rounded-xl text-xs sm:text-sm font-bold transition-all ${
                subTab === tab.id
                  ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30'
                  : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {subTab === 'speed' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 space-y-4">
            <h3 className="text-lg font-bold text-blue-400 border-b border-slate-800 pb-2">
              1. حساب سرعة الدرفيل والموتور وتردد الـ VFD
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-400 block mb-1">سرعة خروج المعدن الخطية (m/s)</label>
                <input type="number" step="0.05" value={vel} onChange={(e) => setVel(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white font-mono" />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">قطر الدرفيل الخارجي (mm)</label>
                <input type="number" value={rollDia} onChange={(e) => setRollDia(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white font-mono" />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">عمق الكاليبر / الممر (mm)</label>
                <input type="number" value={collarDepth} onChange={(e) => setCollarDepth(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white font-mono" />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">نسبة تخفيض الجيربوكس (Gear Ratio)</label>
                <input type="number" step="0.1" value={gearRatio} onChange={(e) => setGearRatio(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white font-mono" />
              </div>
            </div>
            <div className="bg-slate-950 p-4 rounded-xl border border-blue-900/40 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">القطر الشغال الفعال (Working Dia):</span>
                <span className="text-white font-mono font-bold">{effDia} mm</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">سرعة الدرفيل (Roll RPM):</span>
                <span className="text-emerald-400 font-mono font-bold text-lg">{rollRpm} RPM</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">سرعة الموتور (Motor RPM):</span>
                <span className="text-blue-400 font-mono font-bold text-2xl">{motorRpm} RPM</span>
              </div>
              <div className="flex justify-between text-sm pt-2 border-t border-slate-800">
                <span className="text-slate-400">التردد المتوقع على الدرايف (Frequency):</span>
                <span className="text-amber-400 font-mono font-bold">{vfdHz} Hz</span>
              </div>
            </div>
          </div>

          <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 space-y-4">
            <h3 className="text-lg font-bold text-emerald-400 border-b border-slate-800 pb-2">
              2. معادلة ثبات التدفق الكتلي (A1 × V1 = A2 × V2)
            </h3>
            <p className="text-xs text-slate-400">
              اضبط تزامن الاستاندات المتتالية لمنع حدوث شد في العود (Tension) أو حشر (Cobble).
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-xs text-slate-400 block mb-1">مساحة استاند 1 (mm²)</label>
                <input type="number" value={area1} onChange={(e) => setArea1(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white font-mono" />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">سرعة استاند 1 (m/s)</label>
                <input type="number" step="0.05" value={vel1} onChange={(e) => setVel1(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white font-mono" />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">مساحة استاند 2 (mm²)</label>
                <input type="number" value={area2} onChange={(e) => setArea2(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white font-mono" />
              </div>
            </div>
            <div className="bg-slate-950 p-4 rounded-xl border border-emerald-900/40 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-slate-300 text-sm">السرعة المطلوبة لاستاند 2 (V2):</span>
                <span className="text-2xl font-bold text-emerald-400 font-mono">{v2Synced} m/s</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-300 text-sm">إنتاجية الخط النظرية بالطن/ساعة:</span>
                <span className="text-xl font-bold text-white font-mono">{tonsPerHour} طن/ساعة</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {subTab === 'pass' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 space-y-4">
            <h3 className="text-lg font-bold text-blue-400 border-b border-slate-800 pb-2">
              أبعاد المعدن قبل وبعد الدرفيل (Pass Dimensions)
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-400 block mb-1">ارتفاع الدخول H1 (mm)</label>
                <input type="number" step="0.5" value={hIn} onChange={(e) => setHIn(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white font-mono" />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">عرض الدخول B1 (mm)</label>
                <input type="number" step="0.5" value={bIn} onChange={(e) => setBIn(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white font-mono" />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">ارتفاع الخروج H2 (mm)</label>
                <input type="number" step="0.5" value={hOut} onChange={(e) => setHOut(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white font-mono" />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">عرض الخروج B2 (mm)</label>
                <input type="number" step="0.5" value={bOut} onChange={(e) => setBOut(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white font-mono" />
              </div>
              <div className="col-span-2">
                <label className="text-xs text-slate-400 block mb-1">قطر الدرفيل الشغال (mm)</label>
                <input type="number" value={workDia} onChange={(e) => setWorkDia(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white font-mono" />
              </div>
            </div>
          </div>

          <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 space-y-3">
            <h3 className="text-lg font-bold text-emerald-400 border-b border-slate-800 pb-2">
              نتائج التخفيض والاستطالة وزاوية العض
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                <span className="text-xs text-slate-400 block">نسبة التخفيض (Reduction %)</span>
                <span className="text-2xl font-bold text-emerald-400 font-mono">{redRatio}%</span>
              </div>
              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                <span className="text-xs text-slate-400 block">معامل الاستطالة (Elongation)</span>
                <span className="text-2xl font-bold text-blue-400 font-mono">{elong}</span>
              </div>
              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                <span className="text-xs text-slate-400 block">مقدار الجر (Draft Δh)</span>
                <span className="text-xl font-bold text-white font-mono">{draft} mm</span>
              </div>
              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                <span className="text-xs text-slate-400 block">طول قوس التلامس (Contact Arc)</span>
                <span className="text-xl font-bold text-white font-mono">{contactArc} mm</span>
              </div>
              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                <span className="text-xs text-slate-400 block">زاوية العض (Bite Angle)</span>
                <span className={`text-xl font-bold font-mono ${Number(biteDeg) > 24 ? 'text-red-400' : 'text-amber-400'}`}>
                  {biteDeg}° {Number(biteDeg) > 24 ? '(خطر زحلقة)' : '(ممتاز)'}
                </span>
              </div>
              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                <span className="text-xs text-slate-400 block">الانتشار العرضي (Spread)</span>
                <span className="text-xl font-bold text-purple-400 font-mono">+{spreadMm} mm</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {subTab === 'weight' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 space-y-4">
            <h3 className="text-lg font-bold text-blue-400 border-b border-slate-800 pb-2">
              حسابات وزن البيليت والهالك وأطوال الخرج
            </h3>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="text-xs text-slate-400 block mb-1">مقاس البيليت (mm)</label>
                <input type="number" value={billetSize} onChange={(e) => setBilletSize(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white font-mono" />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">طول البيليت (متر)</label>
                <input type="number" step="0.1" value={billetLen} onChange={(e) => setBilletLen(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white font-mono" />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">نسبة الهالك (%)</label>
                <input type="number" step="0.5" value={scaleLoss} onChange={(e) => setScaleLoss(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white font-mono" />
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'flat', label: 'خوصة (Flat Bar)' },
                { id: 'rebar', label: 'حديد تسليح (Rebar)' },
                { id: 'angle', label: 'زاوية (Equal Angle)' }
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setProdType(t.id)}
                  className={`py-2 rounded-lg text-xs font-bold border ${
                    prodType === t.id
                      ? 'bg-blue-600/20 border-blue-500 text-blue-400'
                      : 'bg-slate-950 border-slate-800 text-slate-400'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>

            {prodType === 'flat' && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">عرض الخوصة (mm) مثلاً 50</label>
                  <input type="number" value={flatW} onChange={(e) => setFlatW(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white font-mono" />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">سمك الخوصة (mm) مثلاً 10</label>
                  <input type="number" value={flatT} onChange={(e) => setFlatT(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white font-mono" />
                </div>
              </div>
            )}

            {prodType === 'rebar' && (
              <div>
                <label className="text-xs text-slate-400 block mb-1">قطر السيخ (mm)</label>
                <input type="number" value={rebarDia} onChange={(e) => setRebarDia(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white font-mono" />
              </div>
            )}

            {prodType === 'angle' && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-slate-400 block mb-1">عرض ضلع الزاوية (mm)</label>
                  <input type="number" value={angleS} onChange={(e) => setAngleS(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white font-mono" />
                </div>
                <div>
                  <label className="text-xs text-slate-400 block mb-1">تخانة الزاوية (mm)</label>
                  <input type="number" value={angleT} onChange={(e) => setAngleT(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white font-mono" />
                </div>
              </div>
            )}
          </div>

          <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 space-y-3">
            <h3 className="text-lg font-bold text-emerald-400 border-b border-slate-800 pb-2">
              الوزن الصافي وطول العود الخارج
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                <span className="text-xs text-slate-400 block">وزن البيليت الخام</span>
                <span className="text-xl font-bold text-white font-mono">{billetWeight} كجم</span>
              </div>
              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                <span className="text-xs text-slate-400 block">الوزن الصافي بعد الهالك</span>
                <span className="text-xl font-bold text-emerald-400 font-mono">{netWeight} كجم</span>
              </div>
              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                <span className="text-xs text-slate-400 block">وزن المتر الطولي</span>
                <span className="text-xl font-bold text-blue-400 font-mono">{meterWeight.toFixed(3)} كجم/م</span>
              </div>
              <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800">
                <span className="text-xs text-slate-400 block">إجمالي طول العود الخارج</span>
                <span className="text-2xl font-bold text-amber-400 font-mono">{totalOutLength} متر</span>
              </div>
            </div>
            <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 flex justify-between items-center">
              <span className="text-sm text-slate-300">عدد الأسياخ / الأعواد التجارية (طول 12 متر):</span>
              <span className="text-xl font-bold text-white font-mono">{bars12m} عود</span>
            </div>
          </div>
        </div>
      )}

      {subTab === 'power' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 space-y-4">
            <h3 className="text-lg font-bold text-blue-400 border-b border-slate-800 pb-2">
              حسابات العزم والأمبير واللوبر (Torque & Looper Control)
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-400 block mb-1">قوة الدرفلة المقدرة (kN)</label>
                <input type="number" value={forceKn} onChange={(e) => setForceKn(e.target.value)}
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
                <span className="text-slate-400">عزم الدرفلة المطلوب (Rolling Torque):</span>
                <span className="text-white font-mono font-bold">{torqueKnM} kN.m</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">القدرة الميكانيكية المطلوبة:</span>
                <span className="text-emerald-400 font-mono font-bold">{powerKw} kW</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">الأمبير المتوقع للموتور:</span>
                <span className="text-amber-400 font-mono font-bold">{estAmp} Amp</span>
              </div>
              <div className="flex justify-between text-sm pt-2 border-t border-slate-800">
                <span className="text-slate-400">زاوية اللوبر / الطول المخزن باللوبر:</span>
                <span className="text-blue-400 font-mono font-bold">{looperAngle}° ({looperExtraMm} mm)</span>
              </div>
            </div>
          </div>

          <div className="bg-slate-900 p-6 rounded-2xl border border-slate-800 space-y-3">
            <h3 className="text-lg font-bold text-amber-400 border-b border-slate-800 pb-2">
              ملخص قوانين الدرفلة الأساسية للمهندسين
            </h3>
            <div className="space-y-2.5 text-xs text-slate-300">
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                <p className="text-blue-400 font-bold mb-1">1. معادلة السرعة الخطية للمعدن (Linear Speed):</p>
                <p className="font-mono text-white">V (m/s) = (3.1416 × Working_Dia_mm × Roll_RPM) / 60000</p>
              </div>
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                <p className="text-emerald-400 font-bold mb-1">2. معادلة ثبات التدفق الكتلي (Mass Flow Equation):</p>
                <p className="font-mono text-white">Area_1 × Speed_1 = Area_2 × Speed_2 = Constant</p>
              </div>
              <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
                <p className="text-purple-400 font-bold mb-1">3. معادلة وزن المتر الطولي:</p>
                <p className="font-mono text-white">للتسليح: D² / 162.2 | للقطاعات والخوص: Area(mm²) × 0.00785</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// 2. قسم الأعطال والدردشة الفنية للمستخدمين (Public Troubleshooting & Live Chat)
// ============================================================================
const CommunityAndFaultsHub = ({ faults, setFaults, messages, setMessages }) => {
  const [view, setView] = useState('faults'); // faults | chat
  const [search, setSearch] = useState('');

  // فورم إضافة عطل
  const [author, setAuthor] = useState('');
  const [code, setCode] = useState('');
  const [brand, setBrand] = useState('Siemens SINAMICS / WinCC');
  const [title, setTitle] = useState('');
  const [solution, setSolution] = useState('');

  // فورم الدردشة
  const [chatName, setChatName] = useState('');
  const [chatRole, setChatRole] = useState('مهندس / فني درفلة');
  const [chatText, setChatText] = useState('');

  const filteredFaults = faults.filter(
    (f) =>
      f.code.toLowerCase().includes(search.toLowerCase()) ||
      f.title.toLowerCase().includes(search.toLowerCase()) ||
      f.brand.toLowerCase().includes(search.toLowerCase())
  );

  const handleAddFault = async (e) => {
    e.preventDefault();
    if (!code || !title || !solution) return;
    const newF = {
      id: Date.now().toString(),
      code,
      brand,
      title,
      cause: 'مرصود من واقع التشغيل الفعلي بالمصنع',
      solution,
      author: author || 'فني محترف',
      points: 20
    };
    setFaults([newF, ...faults]);
    try {
      await addDoc(collection(db, 'faults_hub'), { ...newF, createdAt: serverTimestamp() });
    } catch (err) {
      console.error(err);
    }
    setCode('');
    setTitle('');
    setSolution('');
  };

  const handleSendChat = async (e) => {
    e.preventDefault();
    if (!chatText.trim()) return;
    const msg = {
      id: Date.now().toString(),
      sender: chatName || 'عضو صناع الحديد',
      role: chatRole,
      text: chatText,
      time: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })
    };
    setMessages([...messages, msg]);
    setChatText('');
    try {
      await addDoc(collection(db, 'community_chat'), { ...msg, createdAt: serverTimestamp() });
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 flex flex-wrap justify-between items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white">مجتمع الصيانة والدردشة الفنية المفتوح</h2>
          <p className="text-xs text-slate-400 mt-1">تبادل خبرات الصيانة، حلول أعطال الدرايفات، ونقاشات الدرفلة المباشرة</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setView('faults')}
            className={`px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 ${
              view === 'faults' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-300'
            }`}
          >
            <Wrench size={16} /> موسوعة الأعطال
          </button>
          <button
            onClick={() => setView('chat')}
            className={`px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 ${
              view === 'chat' ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-300'
            }`}
          >
            <MessageSquare size={16} /> غرفة الدردشة المباشرة
          </button>
        </div>
      </div>

      {view === 'faults' ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="relative">
              <Search className="absolute right-3.5 top-3 text-slate-500" size={18} />
              <input
                type="text"
                placeholder="ابحث بكود العطل (مثلاً F0001 أو ENC أو Looper أو Siemens)..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl pr-10 pl-4 py-2.5 text-white text-sm"
              />
            </div>

            {filteredFaults.map((f) => (
              <div key={f.id} className="bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-2">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg font-mono font-bold text-xs">
                      {f.code}
                    </span>
                    <span className="text-xs bg-slate-800 text-slate-300 px-2.5 py-1 rounded-lg">{f.brand}</span>
                  </div>
                  <span className="text-xs text-amber-400 font-medium">بواسطة: {f.author}</span>
                </div>
                <h3 className="text-lg font-bold text-white">{f.title}</h3>
                <p className="text-xs text-slate-400">السبب: {f.cause}</p>
                <div className="bg-slate-950 p-3 rounded-xl border border-emerald-900/40 text-xs text-emerald-300">
                  <strong>الحل العملي: </strong> {f.solution}
                </div>
              </div>
            ))}
          </div>

          <form onSubmit={handleAddFault} className="bg-slate-900 p-5 rounded-2xl border border-slate-800 space-y-3 h-fit">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Award className="text-amber-400" size={20} /> أضف عطل وحله للموسوعة
            </h3>
            <input
              type="text"
              placeholder="اسمك (يظهر في القائمة)"
              value={author}
              onChange={(e) => setAuthor(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-sm text-white"
            />
            <input
              type="text"
              placeholder="كود العطل (مثلاً F008)"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-sm text-white"
            />
            <select
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-sm text-white"
            >
              <option>Siemens SINAMICS / WinCC</option>
              <option>Parker SSD Drives</option>
              <option>ABB / Schneider Drives</option>
              <option>أعطال درافيل وميكانيكا وهيدروليك</option>
            </select>
            <input
              type="text"
              placeholder="عنوان المشكلة"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-sm text-white"
            />
            <textarea
              rows={3}
              placeholder="خطوات الحل بالتفصيل..."
              value={solution}
              onChange={(e) => setSolution(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-sm text-white"
            />
            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white py-2.5 rounded-xl font-bold text-sm">
              نشر في الموسوعة
            </button>
          </form>
        </div>
      ) : (
        <div className="bg-slate-900 rounded-2xl border border-slate-800 p-5 space-y-4">
          <div className="h-96 overflow-y-auto space-y-3 p-3 bg-slate-950 rounded-xl border border-slate-800">
            {messages.map((m) => (
              <div key={m.id} className="bg-slate-900 p-3.5 rounded-xl border border-slate-800">
                <div className="flex justify-between items-center mb-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-blue-400 text-sm">{m.sender}</span>
                    <span className="text-[11px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded">{m.role}</span>
                  </div>
                  <span className="text-[11px] text-slate-500">{m.time}</span>
                </div>
                <p className="text-sm text-slate-200 leading-relaxed">{m.text}</p>
              </div>
            ))}
          </div>

          <form onSubmit={handleSendChat} className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <input
              type="text"
              placeholder="اسمك..."
              value={chatName}
              onChange={(e) => setChatName(e.target.value)}
              className="bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-sm text-white"
            />
            <select
              value={chatRole}
              onChange={(e) => setChatRole(e.target.value)}
              className="bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-sm text-white"
            >
              <option>مشغل غرفة تحكم (MCR)</option>
              <option>مهندس درفلة / إنتاج</option>
              <option>مهندس / فني كهرباء وكنترول</option>
              <option>فني ميكانيكا ودرافيل</option>
            </select>
            <div className="md:col-span-2 flex gap-2">
              <input
                type="text"
                placeholder="اكتب سؤالك أو مشاركتك الفنية هنا..."
                value={chatText}
                onChange={(e) => setChatText(e.target.value)}
                className="flex-1 bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-sm text-white"
              />
              <button type="submit" className="bg-emerald-600 hover:bg-emerald-500 text-white px-5 rounded-xl font-bold flex items-center gap-1">
                <Send size={16} /> إرسال
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// 3. بوابة الشركات ونظام إدارة الدرافيل وإنتاجية الممرات (Enterprise Roll & Pass SaaS)
// ============================================================================
const CompaniesSaaSSection = ({
  companies,
  activeCompany,
  setActiveCompany,
  standsPasses,
  setStandsPasses,
  joinRequests,
  setJoinRequests
}) => {
  const [codeInput, setCodeInput] = useState('');
  const [reqFactoryName, setReqFactoryName] = useState('');
  const [reqPhone, setReqPhone] = useState('');
  const [reqStandsCount, setReqStandsCount] = useState(12);
  const [selectedStand, setSelectedStand] = useState(null);

  const handleLoginCompany = (e) => {
    e.preventDefault();
    const found = companies.find((c) => c.code.toUpperCase() === codeInput.trim().toUpperCase());
    if (!found) {
      alert('كود الشركة غير صحيح! يمكنك تجربة كود GIOSHY-2026 أو تقديم طلب انضمام شركتك بالأسفل.');
      return;
    }
    if (found.status !== 'active') {
      alert('اشتراك هذه الشركة موقوف حالياً.');
      return;
    }
    setActiveCompany(found);
    setCodeInput('');
  };

  const handleJoinRequest = async (e) => {
    e.preventDefault();
    if (!reqFactoryName || !reqPhone) return;
    const reqObj = {
      id: Date.now().toString(),
      factoryName: reqFactoryName,
      phone: reqPhone,
      standsCount: Number(reqStandsCount),
      date: new Date().toLocaleDateString('ar-EG')
    };
    setJoinRequests([reqObj, ...joinRequests]);
    try {
      await addDoc(collection(db, 'company_join_requests'), reqObj);
    } catch (err) {
      console.error(err);
    }
    setReqFactoryName('');
    setReqPhone('');
    alert('تم إرسال طلب انضمام شركتكم بنجاح! سيقوم م. بسام وليد بمراجعته وتفعيل كود الشركة.');
  };

  // زيادة إنتاجية الممر الحالي بالطن
  const handleAddPassTons = (standId, tons) => {
    setStandsPasses((prev) =>
      prev.map((s) =>
        s.id === standId
          ? {
              ...s,
              grooveTonnage: s.grooveTonnage + tons,
              totalRollTonnage: s.totalRollTonnage + tons,
              status: s.grooveTonnage + tons >= s.maxGrooveCapacity ? 'warning' : s.status
            }
          : s
      )
    );
  };

  // نقل للباص / الممر الجديد (Next Groove) وتصفير عداد الممر الحالي
  const handleSwitchNextGroove = (standId) => {
    setStandsPasses((prev) =>
      prev.map((s) => {
        if (s.id !== standId) return s;
        const nextGroove = s.activeGroove < s.totalGrooves ? s.activeGroove + 1 : 1;
        return {
          ...s,
          activeGroove: nextGroove,
          grooveTonnage: 0,
          status: 'active',
          installDate: new Date().toISOString().slice(0, 10)
        };
      })
    );
  };

  // تحديث قطر الدرفيل بعد المخرطة (Roll Turning)
  const handleSaveRollUpdate = (e) => {
    e.preventDefault();
    if (!selectedStand) return;
    setStandsPasses((prev) =>
      prev.map((s) => (s.id === selectedStand.id ? { ...selectedStand } : s))
    );
    setSelectedStand(null);
  };

  // تصدير شيت إكسيل لإنتاجية الدرافيل والممرات
  const handleExportPassCSV = () => {
    const headers = ['Stand,RollCode,CurrentDia(mm),ActiveGroove,GrooveTonnage,MaxCapacity,TotalRollTonnage,RemainingLife(%)\n'];
    const rows = standsPasses.map((s) => {
      const rem = Math.max(0, Math.round(((s.maxGrooveCapacity - s.grooveTonnage) / s.maxGrooveCapacity) * 100));
      return `${s.name},${s.rollCode},${s.currentDia},Pass ${s.activeGroove}/${s.totalGrooves},${s.grooveTonnage},${s.maxGrooveCapacity},${s.totalRollTonnage},${rem}%`;
    });
    const csv = 'data:text/csv;charset=utf-8,\uFEFF' + headers.concat(rows.join('\n'));
    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csv));
    link.setAttribute('download', `Roll_Pass_Productivity_${activeCompany.code}.csv`);
    document.body.appendChild(link);
    link.click();
  };

  // إذا لم تسجل الشركة دخولها بعد: نعرض بوابة انضمام الشركات + تسجيل الدخول بكود الشركة
  if (!activeCompany) {
    return (
      <div className="space-y-8">
        <div className="bg-gradient-to-l from-blue-950/60 to-slate-900 border border-blue-500/30 p-6 rounded-2xl">
          <span className="text-xs bg-blue-500/20 text-blue-400 px-3 py-1 rounded-full font-bold">
            نظام SaaS للشركات ومصانع الحديد والصلب
          </span>
          <h2 className="text-2xl font-bold text-white mt-2">
            بوابة الشركات: نظام إدارة الدرافيل وحساب إنتاجية الممرات (Pass & Roll Life)
          </h2>
          <p className="text-sm text-slate-300 mt-1">
            يتيح هذا القسم للمصانع المشتركة تتبع عمر كل ممر (Pass/Groove) على الدرفيل بالطن، التنبيه قبل انتهاء عمر الكاليبر، وحساب المتبقي من قطر الدرفيل قبل الخراطة.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* تسجيل دخول الشركات المشتركة */}
          <form onSubmit={handleLoginCompany} className="bg-slate-900 p-6 rounded-2xl border border-slate-800 space-y-4">
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Lock className="text-blue-400" size={20} /> دخول الشركات المشتركة
            </h3>
            <p className="text-xs text-slate-400">
              أدخل كود التفعيل الخاص بمصنعك لفتح لوحة تتبع الدرافيل والممرات (للتجربة الفورية أدخل الكود: <strong className="text-emerald-400 font-mono">GIOSHY-2026</strong>)
            </p>
            <input
              type="text"
              placeholder="كود الشركة (مثلاً: GIOSHY-2026)"
              value={codeInput}
              onChange={(e) => setCodeInput(e.target.value)}
              className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-white font-mono uppercase text-center text-lg"
            />
            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white py-3 rounded-xl font-bold">
              دخول نظام إدارة الدرافيل والممرات
            </button>
          </form>

          {/* طلب انضمام شركة جديدة */}
          <form onSubmit={handleJoinRequest} className="bg-slate-900 p-6 rounded-2xl border border-slate-800 space-y-4">
            <h3 className="text-lg font-bold text-emerald-400 flex items-center gap-2">
              <Building2 size={20} /> طلب انضمام مصنع / شركة جديدة للمنصة
            </h3>
            <div>
              <label className="text-xs text-slate-400 block mb-1">اسم الشركة / المصنع</label>
              <input
                type="text"
                placeholder="مثلاً: شركة حديد العبور / مصنع الدرفلة..."
                value={reqFactoryName}
                onChange={(e) => setReqFactoryName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white text-sm"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-400 block mb-1">رقم التواصل / واتساب</label>
                <input
                  type="text"
                  placeholder="010xxxxxxxx"
                  value={reqPhone}
                  onChange={(e) => setReqPhone(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white text-sm font-mono"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">عدد استاندات الخط</label>
                <input
                  type="number"
                  value={reqStandsCount}
                  onChange={(e) => setReqStandsCount(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white text-sm font-mono"
                />
              </div>
            </div>
            <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-500 text-white py-3 rounded-xl font-bold">
              إرسال طلب اشتراك الشركة
            </button>
          </form>
        </div>
      </div>
    );
  }

  // واجهة الشركة بعد الدخول: حسابات الدرافيل وإنتاجية الممرات (Pass & Groove Productivity)
  return (
    <div className="space-y-6">
      <div className="bg-slate-900 p-5 rounded-2xl border border-slate-800 flex flex-wrap justify-between items-center gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              حساب شركة مفعل: {activeCompany.name}
            </span>
            <span className="text-xs text-slate-400 font-mono">({activeCompany.code})</span>
          </div>
          <h2 className="text-2xl font-bold text-white mt-1">
            منظومة تتبع الدرافيل وإنتاجية الممرات (Roll & Pass Life Tracker)
          </h2>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={handleExportPassCSV}
            className="bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5"
          >
            <Download size={15} /> تصدير تقرير الإكسيل
          </button>
          <button
            onClick={() => window.print()}
            className="bg-slate-800 hover:bg-slate-700 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5"
          >
            <Printer size={15} /> طباعة التقرير
          </button>
          <button
            onClick={() => setActiveCompany(null)}
            className="bg-red-600/20 text-red-400 border border-red-500/30 px-3 py-2 rounded-xl text-xs font-bold"
          >
            خروج من حساب الشركة
          </button>
        </div>
      </div>

      {/* بطاقات الدرافيل والممرات للاستاندات 1 - 12 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {standsPasses.map((st) => {
          const grooveUsagePercent = Math.min(100, Math.round((st.grooveTonnage / st.maxGrooveCapacity) * 100));
          const remainingTons = Math.max(0, st.maxGrooveCapacity - st.grooveTonnage);
          const usableDiaMm = Math.max(0, st.currentDia - st.minScrapDia);

          return (
            <div key={st.id} className="bg-slate-900 rounded-2xl p-5 border border-slate-800 flex flex-col justify-between space-y-4">
              <div>
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-bold text-white">{st.name}</h3>
                    <span className="text-xs text-slate-400">{st.section} | كود الدرفيل: {st.rollCode}</span>
                  </div>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                      grooveUsagePercent >= 90
                        ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                        : grooveUsagePercent >= 75
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    }`}
                  >
                    {grooveUsagePercent >= 90 ? 'يحتاج نقل باس!' : 'الممر سليم'}
                  </span>
                </div>

                {/* تفاصيل القطر والممر الفعال */}
                <div className="bg-slate-950 p-3.5 rounded-xl border border-slate-800/80 space-y-2 mt-3 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-400">القطر الحالي / حد التكهين:</span>
                    <span className="text-white font-mono font-bold">{st.currentDia} / {st.minScrapDia} mm</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">الرصيد المتبقي للخراطة:</span>
                    <span className="text-emerald-400 font-mono font-bold">{usableDiaMm} mm متاح</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">الممر الشغال حالياً (Groove):</span>
                    <span className="text-amber-400 font-mono font-bold">
                      باس رقم {st.activeGroove} من {st.totalGrooves}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-400">إجمالي إنتاج الدرفيل الكلي:</span>
                    <span className="text-blue-400 font-mono font-bold">{st.totalRollTonnage} طن</span>
                  </div>
                </div>

                {/* مؤشر عمر الممر الحالي (Pass Productivity Bar) */}
                <div className="mt-3 space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="text-slate-400">إنتاجية الممر الحالي:</span>
                    <span className="font-mono font-bold text-white">
                      {st.grooveTonnage} / {st.maxGrooveCapacity} طن (متبقي {remainingTons} طن)
                    </span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
                    <div
                      className={`h-full transition-all ${
                        grooveUsagePercent >= 90 ? 'bg-red-500' : grooveUsagePercent >= 75 ? 'bg-amber-500' : 'bg-blue-500'
                      }`}
                      style={{ width: `${grooveUsagePercent}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* أزرار التحكم السريع في الباس والدرفيل */}
              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800">
                <button
                  onClick={() => handleAddPassTons(st.id, 25)}
                  className="bg-slate-800 hover:bg-slate-700 text-white py-2 rounded-lg text-xs font-bold"
                >
                  +25 طن للممر
                </button>
                <button
                  onClick={() => handleSwitchNextGroove(st.id)}
                  className="bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/30 py-2 rounded-lg text-xs font-bold"
                >
                  نقل للباس التالي
                </button>
                <button
                  onClick={() => setSelectedStand({ ...st })}
                  className="bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 border border-blue-500/30 py-2 rounded-lg text-xs font-bold"
                >
                  خراطة / تعديل
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* نافذة تعديل قطر الدرفيل وسعة الممر */}
      {selectedStand && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <form
            onSubmit={handleSaveRollUpdate}
            className="bg-slate-900 border border-slate-700 rounded-2xl p-6 max-w-md w-full space-y-4"
          >
            <h3 className="text-lg font-bold text-white">
              تحديث بيانات درفيل {selectedStand.name} ({selectedStand.rollCode})
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-400 block mb-1">القطر الحالي بعد الخراطة (mm)</label>
                <input
                  type="number"
                  value={selectedStand.currentDia}
                  onChange={(e) => setSelectedStand({ ...selectedStand, currentDia: Number(e.target.value) })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white font-mono"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">السعة القصوى للممر (طن)</label>
                <input
                  type="number"
                  value={selectedStand.maxGrooveCapacity}
                  onChange={(e) => setSelectedStand({ ...selectedStand, maxGrooveCapacity: Number(e.target.value) })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white font-mono"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">عدد الممرات الكلي بالدرفيل</label>
                <input
                  type="number"
                  value={selectedStand.totalGrooves}
                  onChange={(e) => setSelectedStand({ ...selectedStand, totalGrooves: Number(e.target.value) })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white font-mono"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400 block mb-1">رقم الممر الفعال حالياً</label>
                <input
                  type="number"
                  value={selectedStand.activeGroove}
                  onChange={(e) => setSelectedStand({ ...selectedStand, activeGroove: Number(e.target.value) })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-white font-mono"
                />
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <button type="submit" className="flex-1 bg-blue-600 hover:bg-blue-500 text-white py-2 rounded-xl font-bold">
                حفظ التعديلات
              </button>
              <button
                type="button"
                onClick={() => setSelectedStand(null)}
                className="flex-1 bg-slate-800 text-slate-300 py-2 rounded-xl"
              >
                إلغاء
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// 4. لوحة تحكم المصمم السرية (Creator Super Admin) - تفتح بـ 5 ضغطات على اللوجو
// ============================================================================
const CreatorSuperAdminModal = ({
  isOpen,
  onClose,
  companies,
  setCompanies,
  joinRequests,
  setActiveCompany
}) => {
  const [pin, setPin] = useState('');
  const [auth, setAuth] = useState(false);
  const [newCompName, setNewCompName] = useState('');
  const [newCompCode, setNewCompCode] = useState('');

  if (!isOpen) return null;

  const handleAddCompany = (e) => {
    e.preventDefault();
    if (!newCompName || !newCompCode) return;
    const item = {
      id: Date.now().toString(),
      name: newCompName,
      code: newCompCode.toUpperCase(),
      plan: 'باقة الشركات الكاملة (Enterprise)',
      status: 'active',
      managerPin: '1234',
      contact: 'تم التفعيل من لوحة المصمم'
    };
    setCompanies([item, ...companies]);
    setNewCompName('');
    setNewCompCode('');
    alert(`تم تفعيل الشركة بالكود: ${item.code}`);
  };

  return (
    <div className="fixed inset-0 bg-black/85 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-slate-900 border-2 border-amber-500/40 rounded-2xl p-6 max-w-4xl w-full space-y-6">
        <div className="flex justify-between items-center border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <Key className="text-amber-400" size={24} />
            <div>
              <h2 className="text-xl font-bold text-white">لوحة تحكم مؤسس المنصة (Creator SaaS Admin)</h2>
              <p className="text-xs text-amber-400">إدارة اشتراكات المصانع وتوليد أكواد التفعيل - م. بسام وليد</p>
            </div>
          </div>
          <button onClick={onClose} className="bg-slate-800 text-slate-300 px-3 py-1 rounded-lg text-sm">
            إغلاق X
          </button>
        </div>

        {!auth ? (
          <div className="max-w-sm mx-auto py-6 text-center space-y-4">
            <p className="text-sm text-slate-300">أدخل الرقم السري للمصمم (الافتراضي: 2026 أو beso)</p>
            <input
              type="password"
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="Master PIN"
              className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-center text-white font-mono"
            />
            <button
              onClick={() => {
                if (pin === '2026' || pin === 'beso') setAuth(true);
                else alert('الرقم السري غير صحيح');
              }}
              className="w-full bg-amber-500 text-slate-950 font-bold py-2.5 rounded-xl"
            >
              فتح لوحة المصمم
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-4">
              <form onSubmit={handleAddCompany} className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-3">
                <h3 className="text-sm font-bold text-amber-400">تفعيل شركة جديدة وتوليد كود دخول</h3>
                <input
                  type="text"
                  placeholder="اسم المصنع / الشركة"
                  value={newCompName}
                  onChange={(e) => setNewCompName(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-sm text-white"
                />
                <input
                  type="text"
                  placeholder="كود التفعيل (مثلاً: EZZ-2026)"
                  value={newCompCode}
                  onChange={(e) => setNewCompCode(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-sm text-white font-mono uppercase"
                />
                <button type="submit" className="w-full bg-amber-500 text-slate-950 font-bold py-2 rounded-lg text-sm">
                  تفعيل الشركة الآن
                </button>
              </form>

              <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 space-y-2">
                <h3 className="text-sm font-bold text-emerald-400">طلبات انضمام الشركات الواردة ({joinRequests.length})</h3>
                {joinRequests.length === 0 ? (
                  <p className="text-xs text-slate-500">لا توجد طلبات جديدة حالياً.</p>
                ) : (
                  joinRequests.map((r) => (
                    <div key={r.id} className="p-2.5 bg-slate-900 rounded-lg border border-slate-800 text-xs flex justify-between">
                      <span>{r.factoryName} ({r.standsCount} استاند)</span>
                      <span className="font-mono text-amber-400">{r.phone}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="space-y-2.5">
              <h3 className="text-sm font-bold text-white">الشركات المفعلة حالياً ({companies.length})</h3>
              {companies.map((c) => (
                <div key={c.id} className="bg-slate-950 p-3.5 rounded-xl border border-slate-800 flex justify-between items-center">
                  <div>
                    <p className="text-sm font-bold text-white">{c.name}</p>
                    <p className="text-xs text-amber-400 font-mono">كود الدخول: {c.code}</p>
                  </div>
                  <button
                    onClick={() => {
                      setActiveCompany(c);
                      onClose();
                    }}
                    className="bg-blue-600/20 text-blue-400 border border-blue-500/30 px-3 py-1.5 rounded-lg text-xs font-bold"
                  >
                    فتح لوحة الشركة
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
// المكون الرئيسي للتطبيق (Main App)
// ============================================================================
export default function App() {
  const [activeTab, setActiveTab] = useState('calculators');
  const [faults, setFaults] = useState(INITIAL_FAULTS);
  const [messages, setMessages] = useState(INITIAL_CHAT);
  const [companies, setCompanies] = useState(INITIAL_COMPANIES);
  const [activeCompany, setActiveCompany] = useState(null);
  const [standsPasses, setStandsPasses] = useState(INITIAL_STANDS_PASSES);
  const [joinRequests, setJoinRequests] = useState([]);

  // عداد الـ 5 ضغطات على اللوجو لفتح لوحة المصمم
  const [logoClicks, setLogoClicks] = useState(0);
  const [showCreatorModal, setShowCreatorModal] = useState(false);

  const handleLogoClick = () => {
    const next = logoClicks + 1;
    if (next >= 5) {
      setShowCreatorModal(true);
      setLogoClicks(0);
    } else {
      setLogoClicks(next);
    }
  };

  const navItems = [
    { id: 'calculators', label: 'حاسبات الدرفلة (مجاني)', icon: Calculator },
    { id: 'community', label: 'الأعطال والدردشة الفنية', icon: MessageSquare },
    { id: 'companies', label: 'بوابة الشركات (إنتاجية الممرات)', icon: Building2 }
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 flex flex-col md:flex-row font-sans" dir="rtl">
      {/* القائمة الجانبية */}
      <aside className="w-full md:w-72 bg-slate-900 border-l border-slate-800 p-4 flex flex-col justify-between">
        <div>
          <div
            onClick={handleLogoClick}
            title="اضغط 5 مرات لفتح لوحة المصمم السرية"
            className="flex items-center gap-3 mb-6 px-2 mt-2 cursor-pointer select-none"
          >
            <div className="bg-blue-600 p-2.5 rounded-xl shadow-lg shadow-blue-600/30">
              <Zap className="text-white" size={24} />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">
                Steel<span className="text-blue-500">Portal</span>
              </h1>
              <p className="text-[11px] text-slate-400">مجتمع صناع الحديد ومنصة الشركات</p>
            </div>
          </div>

          <nav className="space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`w-full flex items-center justify-between p-3.5 rounded-xl transition-all ${
                    isActive
                      ? 'bg-blue-600 text-white font-bold shadow-lg shadow-blue-600/25'
                      : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon size={19} />
                    <span className="text-sm">{item.label}</span>
                  </div>
                </button>
              );
            })}
          </nav>
        </div>

        <div className="pt-4 border-t border-slate-800 mt-6 text-xs text-slate-500 space-y-1">
          <p className="text-slate-300 font-bold">صناع الحديد والصلب - Rolling Mill</p>
          <p>تطوير: م. بسام وليد (Controlexa)</p>
        </div>
      </aside>

      {/* المحتوى الرئيسي */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto">
        <div className="max-w-6xl mx-auto">
          {activeTab === 'calculators' && <CalculatorsHub />}
          {activeTab === 'community' && (
            <CommunityAndFaultsHub
              faults={faults}
              setFaults={setFaults}
              messages={messages}
              setMessages={setMessages}
            />
          )}
          {activeTab === 'companies' && (
            <CompaniesSaaSSection
              companies={companies}
              activeCompany={activeCompany}
              setActiveCompany={setActiveCompany}
              standsPasses={standsPasses}
              setStandsPasses={setStandsPasses}
              joinRequests={joinRequests}
              setJoinRequests={setJoinRequests}
            />
          )}
        </div>
      </main>

      {/* لوحة المصمم السرية */}
      <CreatorSuperAdminModal
        isOpen={showCreatorModal}
        onClose={() => setShowCreatorModal(false)}
        companies={companies}
        setCompanies={setCompanies}
        joinRequests={joinRequests}
        setActiveCompany={(c) => {
          setActiveCompany(c);
          setActiveTab('companies');
        }}
      />
    </div>
  );
}
