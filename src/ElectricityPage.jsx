import React, { useState } from 'react';
import {
  Cpu, Thermometer, PlusCircle, Wrench, FileText, Save, Calendar,
  Search, Trash2, CheckCircle, Clock, X, Zap, AlertTriangle, Share2,
  ClipboardCheck, Edit3, Download
} from 'lucide-react';

const SHIFT_CREW = {
  1: { letter: 'A', name: 'أحمد مصطفى' },
  2: { letter: 'B', name: 'خميس' },
  3: { letter: 'C', name: 'يحيى' }
};
const shiftIdx = (shift) => {
  const s = String(shift || '');
  return s.startsWith('الوردية الأولى') ? 1 : s.startsWith('الوردية الثانية') ? 2 : s.startsWith('الوردية الثالثة') ? 3 : 0;
};
const crewOf = (shift) => SHIFT_CREW[shiftIdx(shift)] || { letter: '-', name: '-' };
const crewLabel = (shift) => `وردية ${crewOf(shift).letter} — ${crewOf(shift).name}`;

const MAINT_TYPES = ['تغيير فلاتر', 'نفخ هواء داخلي', 'تشحيم', 'فحص بلي', 'فحص كوابل وتوصيلات', 'تنظيف خارجي', 'أخرى'];
const DEFAULT_SHIFT_ROUTINE = ['تغيير فلاتر', 'نفخ هواء داخلي'];

const DAILY_CHECKLIST_ITEMS = [
  'متابعة الجهود للمحولات',
  'المرور على جميع وحدات الزيت والهواء الخاصة بمواتير DC',
  'متابعة حرارة المواتير (AC - DC) والمحولات',
  'متابعة أمبيرات الدرفلة والمقصات والمبردة',
  'تنظيف الخلايا الضوئية وخلايا الفنش',
  'تنظيف طقم الفلاتر وإعادة تركيبه',
  'متابعة خدمات الخط من توصيلات وأعطال'
];

const QUICK_ELEC_PRESETS = [
  { label: 'تغيير شربون', title: 'تغيير شربون ومراجعة الكوليكتور' },
  { label: 'نفخ هواء ومراجعة شربون', title: 'فتح وتنظيف بالهواء الجاف من الداخل والخارج والمراجعة على الشربون' },
  { label: 'تنظيف لوحات بالهواء', title: 'تنظيف اللوحات بالهواء الجاف ومسحها بالأقمشة' },
  { label: 'فصل درايف / VFD', title: 'فصل درايف / إنفرتر (Overcurrent / Fault)' },
  { label: 'خلية ضوئية / HMD', title: 'عطل / ضبط خلية ضوئية أو حساس HMD' },
  { label: 'إنكودر سرعة', title: 'عطل إنكودر سرعة أو كابل إشارة' },
  { label: 'فصل أوفرلود / قاطع', title: 'فصل أوفرلود أو قاطع حماية' },
  { label: 'توصيلات / كابل', title: 'إصلاح وتأمين توصيلات أو كابل باور/كنترول' }
];

// قائمة الـ 22 موتور/درايف من شاشة Parker Drive Diagnostics
const PARKER_22_MOTORS = [
  { category: 'rolling', stand: '1', locationName: 'ستاند 1 (STAND 1)', code: 'MTR-ST1', rpm: '1200', amps: '830' },
  { category: 'rolling', stand: '2', locationName: 'ستاند 2 (STAND 2)', code: 'MTR-ST2', rpm: '1500', amps: '782' },
  { category: 'rolling', stand: '3', locationName: 'ستاند 3 (STAND 3)', code: 'MTR-ST3', rpm: '1500', amps: '830' },
  { category: 'rolling', stand: '4', locationName: 'ستاند 4 (STAND 4)', code: 'MTR-ST4', rpm: '1200', amps: '783' },
  { category: 'rolling', stand: '5', locationName: 'ستاند 5 (STAND 5)', code: 'MTR-ST5', rpm: '1200', amps: '783' },
  { category: 'rolling', stand: '6', locationName: 'ستاند 6 (STAND 6)', code: 'MTR-ST6', rpm: '1200', amps: '830' },
  { category: 'rolling', stand: '7', locationName: 'ستاند 7 (STAND 7)', code: 'MTR-ST7', rpm: '1200', amps: '830' },
  { category: 'rolling', stand: '8', locationName: 'ستاند 8 (STAND 8)', code: 'MTR-ST8', rpm: '1200', amps: '783' },
  { category: 'rolling', stand: '9', locationName: 'ستاند 9 (STAND 9)', code: 'MTR-ST9', rpm: '1200', amps: '783' },
  { category: 'rolling', stand: '10', locationName: 'ستاند 10 (STAND 10)', code: 'MTR-ST10', rpm: '1200', amps: '830' },
  { category: 'rolling', stand: '11', locationName: 'ستاند 11 (STAND 11)', code: 'MTR-ST11', rpm: '1200', amps: '830' },
  { category: 'rolling', stand: '12', locationName: 'ستاند 12 (STAND 12)', code: 'MTR-ST12', rpm: '1600', amps: '875' },
  { category: 'rolling', stand: '13', locationName: 'ستاند 13 (STAND 13)', code: 'MTR-ST13', rpm: '1200', amps: '800' },
  { category: 'rolling', stand: '14', locationName: 'ستاند 14 (STAND 14)', code: 'MTR-ST14', rpm: '1200', amps: '800' },
  { category: 'aux', stand: '', locationName: 'بينش رول 1 (PR1)', code: 'MTR-PR1', rpm: '4100', amps: '99' },
  { category: 'aux', stand: '', locationName: 'بينش رول 2 (PR2)', code: 'MTR-PR2', rpm: '2800', amps: '220' },
  { category: 'aux', stand: '', locationName: 'المقص الطائر (FS)', code: 'MTR-FS', rpm: '700', amps: '623' },
  { category: 'aux', stand: '', locationName: 'تيل بريكر 1 (TB1)', code: 'MTR-TB1', rpm: '2000', amps: '175' },
  { category: 'aux', stand: '', locationName: 'توين تشانل (TC)', code: 'MTR-TC', rpm: '2070', amps: '77' },
  { category: 'aux', stand: '', locationName: 'بينش رول تخشين (R_PR)', code: 'MTR-RPR', rpm: '1310', amps: '180' },
  { category: 'aux', stand: '', locationName: 'مقص كروب/كعبلة 1 (CCS1)', code: 'MTR-CCS1', rpm: '300', amps: '467' },
  { category: 'aux', stand: '', locationName: 'مقص كروب/كعبلة 2 (CCS2)', code: 'MTR-CCS2', rpm: '700', amps: '532' }
];

const nowTime = () => new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
const todayISO = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
const isFilled = (v) => v !== undefined && v !== '';
const maxOfTemps = (...vals) => {
  const nums = vals.filter(isFilled).map(Number).filter((n) => !isNaN(n));
  return nums.length ? String(Math.max(...nums)) : '';
};
const esc = (s) => String(s ?? '').replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));

export default function ElectricityPage({
  factoryName,
  stands,
  motorsList,
  tempShiftLogs,
  shiftMaintLogs,
  selectedShift,
  setSelectedShift,
  availableShifts,
  currentDateStr,
  currentProdDate,
  roleLabel,
  isManagerLike,
  isSupervisorLogin,
  save,
  showAlert,
  showConfirm,
  onPrintTempNow,
  onPrintMaintNow
}) {
  // الصلاحيات: الملاحظ والمهندس يقدروا يقفلوا الأعطال المؤقتة ويحذفوا بنود الوردية، المهندس فقط يضيف/يعدل/يحذف المواتير
  const isSupervisorOrManager = isManagerLike || isSupervisorLogin;

  const [subView, setSubView] = useState('faults'); // 'faults' | 'cards' | 'shift_temp' | 'maint' | 'add_new'
  const [motorCategoryFilter, setMotorCategoryFilter] = useState('all');
  const [motorSearchId, setMotorSearchId] = useState('');
  const [selectedMotorForLog, setSelectedMotorForLog] = useState(null);
  const [motorLogView, setMotorLogView] = useState('full'); // 'full' | 'temps' | 'edit'

  const [editMotorForm, setEditMotorForm] = useState({
    serviceEntryDate: '',
    brand: '',
    kw: '',
    rpm: '',
    amps: '',
    megger: ''
  });

  const [tempRound, setTempRound] = useState('1');
  const [shiftTempInputs, setShiftTempInputs] = useState({});
  const [shiftTempTech, setShiftTempTech] = useState('');
  const [shiftTempSupervisor, setShiftTempSupervisor] = useState('');

  const [maintForm, setMaintForm] = useState({
    type: MAINT_TYPES[0],
    scope: 'all',
    motorIds: [],
    notes: '',
    status: 'done'
  });

  const [crewNamesText, setCrewNamesText] = useState('');
  const [elecFaultForm, setElecFaultForm] = useState({
    location: 'ستاند 1',
    title: '',
    faultCode: '',
    durationMins: '',
    sparePart: '',
    actionTaken: '',
    resolution: 'fixed'
  });

  const [motorMaintForm, setMotorMaintForm] = useState({
    type: 'فحص دوري وعزل',
    techName: '',
    supervisorName: '',
    megger: '',
    bodyTemp: '',
    bearingTemp: '',
    ampsRead: '',
    notes: ''
  });

  const [newMotor, setNewMotor] = useState({
    category: 'rolling',
    stand: '1',
    locationName: 'ستاند 1',
    code: '',
    brand: 'Parker DC/AC Drive',
    kw: '',
    rpm: '',
    amps: '',
    gearRatio: '',
    megger: '550 MΩ',
    bodyTemp: '50',
    bearingTemp: '55',
    serviceEntryDate: todayISO(),
    status: 'يعمل بحالة ممتازة'
  });

  const TEMP_KEYS = tempRound === '1' ? ['bodyTemp1', 'frontBearingTemp', 'rearBearingTemp'] : ['bodyTemp2'];
  const crewNow = crewOf(selectedShift);

  const regularMaintLogs = shiftMaintLogs.filter((e) => !e.recordKind);
  const currentShiftMaint = regularMaintLogs.filter((e) => e.date === currentDateStr && e.shift === selectedShift);

  const elecFaultsAll = shiftMaintLogs.filter((e) => e.recordKind === 'elec_fault');
  const currentShiftElecFaults = elecFaultsAll.filter((e) => e.date === currentDateStr && e.shift === selectedShift);
  const pendingFollowUpFaults = elecFaultsAll.filter((e) => e.resolution === 'temp');

  const routineEntry = shiftMaintLogs.find(
    (e) => e.recordKind === 'elec_routine' && e.date === currentDateStr && e.shift === selectedShift
  );
  const checkedRoutineItems = routineEntry?.items || [];

  const hotMotorsCount = motorsList.filter((m) => Number(m.bearingTemp) >= 75 || Number(m.bodyTemp) >= 80).length;
  const shiftElecDownMins = currentShiftElecFaults.reduce((a, f) => a + (Number(f.durationMins) || 0), 0);

  const shiftRecordedIds = new Set(
    tempShiftLogs
      .filter((b) => b.date === currentDateStr && b.shift === selectedShift && (!b.round || String(b.round) === tempRound))
      .flatMap((b) => (b.readings || []).map((r) => r.motorId))
  );

  const getFullMotorHistory = (motor) => {
    if (!motor) return [];
    const directLogs = (motor.logs || []).map((l) => ({
      id: `dir_${l.id}`,
      source: 'direct',
      sourceLabel: 'صيانة مباشرة',
      date: l.date,
      shift: l.shift || '-',
      time: l.time || '',
      title: l.type,
      details: l.notes,
      tech: l.techName || l.by || '-',
      supervisor: l.supervisorName || '-'
    }));

    const shiftLogs = regularMaintLogs
      .filter(
        (e) =>
          e.status === 'done' &&
          (e.scope === 'all' || (e.scope === 'selected' && Array.isArray(e.motorIds) && e.motorIds.includes(motor.id)))
      )
      .map((e) => ({
        id: `sh_${e.id}`,
        source: 'shift',
        sourceLabel: 'صيانة وردية',
        date: e.date,
        shift: e.shift || '-',
        time: e.doneTime || '',
        title: e.type,
        details: e.notes || (e.scope === 'all' ? 'ضمن صيانة كل المواتير بالوردية' : 'صيانة مجدولة للوردية'),
        tech: e.doneBy || e.crewName || '-',
        supervisor: e.createdBy || '-'
      }));

    const loc = motor.locationName || `ستاند ${motor.stand}`;
    const faultLogs = elecFaultsAll
      .filter((f) => f.location === loc || (motor.stand && f.location === `ستاند ${motor.stand}`) || (f.title && f.title.includes(motor.code)))
      .map((f) => ({
        id: `flt_${f.id}`,
        source: 'fault',
        sourceLabel: 'عطل كهرباء',
        date: f.date,
        shift: f.shift || '-',
        time: f.time || '',
        title: `${f.title}${f.faultCode ? ` [${f.faultCode}]` : ''}`,
        details: `${f.actionTaken ? `الحل: ${f.actionTaken}` : ''}${f.sparePart ? ` | قطع غيار: ${f.sparePart}` : ''}${
          f.durationMins ? ` | توقف: ${f.durationMins}ق` : ''
        }`,
        tech: f.by || '-',
        supervisor: f.crewNames || '-'
      }));

    return [...directLogs, ...shiftLogs, ...faultLogs];
  };

  const selectedMotorFullHistory = getFullMotorHistory(selectedMotorForLog);

  const selectedMotorTempHistory = selectedMotorForLog
    ? tempShiftLogs
        .flatMap((b) =>
          (b.readings || [])
            .filter((r) => r.motorId === selectedMotorForLog.id)
            .map((r) => ({
              ...r, batchId: b.id, date: b.date, shift: b.shift, time: b.time, round: b.round, recordedBy: b.recordedBy, supervisor: b.supervisor
            }))
        )
        .slice(0, 40)
    : [];

  const filteredMotors = motorsList.filter((m) => {
    const matchCat =
      motorCategoryFilter === 'all' ? true : motorCategoryFilter === 'aux' ? m.category === 'aux' : m.category !== 'aux';
    const q = motorSearchId.trim().toLowerCase();
    const matchSearch =
      !q ||
      (m.code && m.code.toLowerCase().includes(q)) ||
      (m.locationName && m.locationName.toLowerCase().includes(q)) ||
      (m.brand && m.brand.toLowerCase().includes(q));
    return matchCat && matchSearch;
  });

  // تحميل الـ 22 موتور/درايف من شاشة Parker بدون مسح أي موتور موجود مسبقاً
  const handleLoadParkerMotors = () => {
    const existingCodes = new Set(motorsList.map((m) => String(m.code || '').toUpperCase()));
    const toAdd = PARKER_22_MOTORS.filter((pm) => !existingCodes.has(pm.code.toUpperCase())).map((pm, idx) => ({
      id: `pk_${Date.now()}_${idx}`,
      ...pm,
      brand: 'Parker Drive',
      kw: '-',
      megger: '550 MΩ',
      bodyTemp: '50',
      bearingTemp: '55',
      serviceEntryDate: todayISO(),
      dateAdded: new Date().toLocaleDateString('en-GB'),
      lastTechName: roleLabel,
      status: 'يعمل بحالة ممتازة',
      logs: []
    }));

    if (toAdd.length === 0) {
      showAlert('تنبيه', 'جميع مواتير Parker الـ 22 مضافة بالفعل في قاعدة البيانات.');
      return;
    }

    showConfirm(
      'تحميل مواتير Parker',
      `سيتم إضافة (${toAdd.length}) موتور ودرايف جديد ببيانات السرعة والأمبير من شاشة Parker بدون مسح المواتير الحالية. موافق؟`,
      () => {
        save({ motors: [...motorsList, ...toAdd] });
        showAlert('تمت الإضافة', `تم إضافة ${toAdd.length} موتور بنجاح.`);
      }
    );
  };

  const openMotorModal = (m, initialTab = 'full') => {
    setSelectedMotorForLog(m);
    setMotorLogView(initialTab);
    setEditMotorForm({
      serviceEntryDate: m.serviceEntryDate || '',
      brand: m.brand || '',
      kw: m.kw || '',
      rpm: m.rpm || '',
      amps: m.amps || '',
      megger: m.megger || ''
    });
  };

  const handleSaveMotorInfo = (e) => {
    e.preventDefault();
    if (!selectedMotorForLog || !isManagerLike) return;
    const updated = motorsList.map((m) => (m.id === selectedMotorForLog.id ? { ...m, ...editMotorForm } : m));
    save({ motors: updated });
    setSelectedMotorForLog(updated.find((m) => m.id === selectedMotorForLog.id));
    setMotorLogView('full');
    showAlert('تم التحديث', 'تم حفظ تاريخ دخول الخدمة وبيانات الموتور بنجاح.');
  };

  const handlePrintMotorFullFile = (m) => {
    const history = getFullMotorHistory(m);
    const rows = history.length
      ? history
          .map(
            (h) =>
              `<tr><td>${esc(h.date)}</td><td>${esc(h.shift)}</td><td>${esc(h.sourceLabel)}</td><td style="text-align:right"><b>${esc(h.title)}</b></td><td style="text-align:right">${esc(h.details || '-')}</td><td>${esc(h.tech)}</td></tr>`
          )
          .join('')
      : '<tr><td colspan="6">لا توجد صيانات أو أعطال مسجلة لهذا الموتور حتى الآن.</td></tr>';

    const html = `<html dir="rtl" lang="ar"><head><meta charset="UTF-8"><title>سجل موتور ${esc(m.code)}</title>
<style>
  @page{size:A4;margin:12mm}
  body{font-family:Tahoma,Arial,sans-serif;color:#0f172a;padding:10px}
  h1{font-size:18px;margin:0 0 6px}
  .meta{font-size:12px;background:#f1f5f9;padding:10px;border:1px solid #cbd5e1;border-radius:6px;margin-bottom:12px;line-height:1.8}
  table{border-collapse:collapse;width:100%;font-size:11px}
  th,td{border:1px solid #334155;padding:6px;text-align:center}
  th{background:#0f172a;color:#fff}
</style></head><body>
<h1>السجل الكامل للموتور: ${esc(m.locationName || `ستاند ${m.stand}`)} (${esc(m.code)})</h1>
<div class="meta">
  <b>المصنع:</b> ${esc(factoryName)} &nbsp;|&nbsp; <b>تاريخ دخول الخدمة:</b> ${esc(m.serviceEntryDate || m.dateAdded || 'غير محدد')}<br/>
  <b>الماركة:</b> ${esc(m.brand || '-')} &nbsp;|&nbsp; <b>القدرة:</b> ${esc(m.kw)} kW &nbsp;|&nbsp; <b>السرعة:</b> ${esc(m.rpm)} RPM &nbsp;|&nbsp; <b>الأمبير:</b> ${esc(m.amps || '-')} A &nbsp;|&nbsp; <b>العزل:</b> ${esc(m.megger || '-')}
</div>
<table><tr><th>التاريخ</th><th>الوردية</th><th>النوع</th><th>العمل / الصيانة / العطل</th><th>التفاصيل والحل</th><th>الفني / الطاقم</th></tr>${rows}</table>
<script>window.onload=function(){setTimeout(function(){window.print()},350)}<\/script></body></html>`;

    const w = window.open('', '_blank');
    if (!w) { showAlert('تعذر الفتح', 'اسمح بالنوافذ المنبثقة وجرّب تاني.'); return; }
    w.document.open();
    w.document.write(html);
    w.document.close();
  };

  /* ---------- دوال أعطال وتقرير الوردية اليومي للكهرباء ---------- */
  const handleToggleRoutineItem = (itemText) => {
    const exists = checkedRoutineItems.includes(itemText);
    const nextItems = exists ? checkedRoutineItems.filter((x) => x !== itemText) : [...checkedRoutineItems, itemText];
    const updatedEntry = {
      id: routineEntry?.id || `routine_${currentDateStr}_${selectedShift}`,
      recordKind: 'elec_routine',
      date: currentDateStr,
      shift: selectedShift,
      crewNames: crewNamesText || routineEntry?.crewNames || crewLabel(selectedShift),
      items: nextItems,
      updatedBy: roleLabel,
      updatedAt: nowTime()
    };
    save({ shiftMaint: [updatedEntry, ...shiftMaintLogs.filter((e) => e.id !== updatedEntry.id)] });
  };

  const handleCheckAllRoutine = () => {
    const updatedEntry = {
      id: routineEntry?.id || `routine_${currentDateStr}_${selectedShift}`,
      recordKind: 'elec_routine',
      date: currentDateStr,
      shift: selectedShift,
      crewNames: crewNamesText || routineEntry?.crewNames || crewLabel(selectedShift),
      items: [...DAILY_CHECKLIST_ITEMS],
      updatedBy: roleLabel,
      updatedAt: nowTime()
    };
    save({ shiftMaint: [updatedEntry, ...shiftMaintLogs.filter((e) => e.id !== updatedEntry.id)] });
  };

  const handleAddElecFault = (e) => {
    e.preventDefault();
    if (!elecFaultForm.title.trim()) { showAlert('تنبيه', 'اختر عطل/عمل من الأزرار الجاهزة أو اكتب الوصف أولاً.'); return; }
    const entry = {
      id: `ef_${Date.now()}`,
      recordKind: 'elec_fault',
      date: currentDateStr,
      dayName: currentProdDate.toLocaleDateString('ar-EG', { weekday: 'long' }),
      shift: selectedShift,
      time: nowTime(),
      location: elecFaultForm.location,
      title: elecFaultForm.title.trim(),
      faultCode: elecFaultForm.faultCode.trim().toUpperCase(),
      durationMins: Number(elecFaultForm.durationMins) || 0,
      sparePart: elecFaultForm.sparePart.trim(),
      actionTaken: elecFaultForm.actionTaken.trim(),
      resolution: elecFaultForm.resolution,
      crewNames: crewNamesText.trim() || routineEntry?.crewNames || crewLabel(selectedShift),
      by: roleLabel
    };
    save({ shiftMaint: [entry, ...shiftMaintLogs] });
    setElecFaultForm({ ...elecFaultForm, title: '', faultCode: '', durationMins: '', sparePart: '', actionTaken: '', resolution: 'fixed' });
  };

  const handleResolveTempFault = (id) => {
    if (!isSupervisorOrManager) return;
    save({ shiftMaint: shiftMaintLogs.map((e) => (e.id === id ? { ...e, resolution: 'fixed', resolvedBy: roleLabel, resolvedAt: nowTime() } : e)) });
  };

  const handleDeleteElecFault = (id) => {
    if (!isSupervisorOrManager) return;
    showConfirm('حذف سجل', 'هل تريد حذف هذا البند من التقرير اليومي؟', () => save({ shiftMaint: shiftMaintLogs.filter((e) => e.id !== id) }));
  };

  const buildDailyElecWhatsApp = () => {
    const crewStr = crewNamesText.trim() || routineEntry?.crewNames || crewLabel(selectedShift);
    const routineStr = checkedRoutineItems.length ? checkedRoutineItems.map((it) => `✅ ${it}`).join('\n') : '• لم يتم تأشير بنود المرور بعد';
    const faultsStr = currentShiftElecFaults.length
      ? currentShiftElecFaults
          .map((f) => `• [${f.location}] ${f.title}${f.durationMins ? ` (${f.durationMins}ق)` : ''}${f.faultCode ? ` [${f.faultCode}]` : ''}${f.actionTaken ? ` ← ${f.actionTaken}` : ''}${f.resolution === 'temp' ? ' ⚠️ (متابعة)' : ''}`)
          .join('\n')
      : '• لا توجد أعطال مسجلة بالوردية';
    return `⚡ *التقرير اليومي لقسم الكهرباء — ${factoryName}*\n📅 التاريخ: ${currentDateStr} | ${selectedShift}\n👷 الطاقم: ${crewStr}\n\n📋 *المرور والمتابعة الدورية:*\n${routineStr}\n\n🔧 *الأعطال والأعمال المنفذة بالوردية:*\n${faultsStr}`;
  };

  const handlePrintDailyElecReport = () => {
    const crewStr = crewNamesText.trim() || routineEntry?.crewNames || crewLabel(selectedShift);
    const routineHtml = checkedRoutineItems.map((it) => `<li>${esc(it)}</li>`).join('') || '<li>لم يُسجل</li>';
    const faultsHtml = currentShiftElecFaults.length
      ? currentShiftElecFaults
          .map((f) => `<tr><td>${esc(f.time)}</td><td>${esc(f.location)}</td><td style="text-align:right">${esc(f.title)}${f.faultCode ? ` <b>(${esc(f.faultCode)})</b>` : ''}</td><td>${f.durationMins ? `${f.durationMins} ق` : '-'}</td><td style="text-align:right">${esc(f.actionTaken || '-')}</td><td>${esc(f.sparePart || '-')}</td><td>${f.resolution === 'temp' ? 'متابعة ⚠️' : 'تم ✓'}</td></tr>`)
          .join('')
      : '<tr><td colspan="7">لا توجد أعطال أو أعمال إضافية مسجلة في هذه الوردية</td></tr>';

    const html = `<html dir="rtl" lang="ar"><head><meta charset="UTF-8"><title>التقرير اليومي لقسم الكهرباء</title>
<style>
  @page{size:A4;margin:12mm}
  body{font-family:Tahoma,Arial,sans-serif;color:#0f172a;padding:10px}
  .hdr{display:flex;justify-content:space-between;align-items:center;border-bottom:2px solid #0f172a;padding-bottom:8px;margin-bottom:10px}
  h1{font-size:18px;margin:0}
  table{border-collapse:collapse;width:100%;font-size:11px;margin-top:8px}
  th,td{border:1px solid #334155;padding:6px;text-align:center}
  th{background:#0f172a;color:#fff}
  .box{border:1px solid #334155;padding:8px 12px;margin-top:10px;border-radius:6px}
  ul{margin:6px 0;padding-right:18px;font-size:12px;line-height:1.7}
  .sign{display:flex;justify-content:space-between;margin-top:32px;font-size:12px}
  .sign div{width:30%;border-top:1px solid #0f172a;padding-top:4px;text-align:center}
</style></head><body>
<div class="hdr"><h1>التقرير اليومي لقسم الكهرباء</h1><div><b>${esc(factoryName)}</b></div></div>
<table><tr><th>التاريخ</th><th>الوردية</th><th>القسم</th></tr><tr><td>${esc(currentDateStr)}</td><td>${esc(selectedShift)}</td><td>الكهرباء والدرفلة</td></tr></table>
<div class="box"><b>طاقم الوردية:</b> ${esc(crewStr)}</div>
<div class="box"><b>بنود المرور والمتابعة الدورية:</b><ul>${routineHtml}</ul></div>
<h3 style="margin:14px 0 4px;font-size:13px">الأعطال والأعمال المنفذة بالوردية (إجمالي التوقف: ${shiftElecDownMins} دقيقة):</h3>
<table><tr><th>الوقت</th><th>المكان / المعدة</th><th>العطل / العمل المنفذ</th><th>المدة</th><th>الإجراء المتخذ</th><th>قطع الغيار</th><th>الحالة</th></tr>${faultsHtml}</table>
<div class="sign"><div>فني / طاقم الكهرباء</div><div>ملاحظ الوردية</div><div>مهندس القسم</div></div>
<script>window.onload=function(){setTimeout(function(){window.print()},350)}<\/script></body></html>`;

    const w = window.open('', '_blank');
    if (!w) { showAlert('تعذر الفتح', 'اسمح بالنوافذ المنبثقة لهذا الموقع وجرّب تاني.'); return; }
    w.document.open();
    w.document.write(html);
    w.document.close();
  };

  /* ---------- دوال المواتير والحرارة والصيانة ---------- */
  const handleAddMotor = (e) => {
    e.preventDefault();
    if (!isManagerLike || !newMotor.code.trim() || !newMotor.kw) return;
    const m = {
      id: Date.now().toString(),
      ...newMotor,
      code: newMotor.code.trim().toUpperCase(),
      locationName: newMotor.category === 'rolling' ? `ستاند ${newMotor.stand}` : newMotor.locationName || 'معدة مساعدة',
      serviceEntryDate: newMotor.serviceEntryDate || todayISO(),
      dateAdded: new Date().toLocaleDateString('en-GB'),
      lastTechName: roleLabel,
      logs: []
    };
    save({ motors: [m, ...motorsList] });
    setNewMotor({
      category: 'rolling', stand: '1', locationName: 'ستاند 1', code: '', brand: 'Parker DC/AC Drive',
      kw: '', rpm: '', amps: '', gearRatio: '', megger: '550 MΩ', bodyTemp: '50', bearingTemp: '55', serviceEntryDate: todayISO(), status: 'يعمل بحالة ممتازة'
    });
    setSubView('cards');
    showAlert('تم الحفظ', `تم إضافة الموتور (${m.code}) بنجاح.`);
  };

  const handleSaveShiftTemperatures = (e) => {
    e.preventDefault();
    const anyKeys = tempRound === '1' ? [...TEMP_KEYS, 'amps'] : TEMP_KEYS;
    const touched = motorsList.filter((m) => anyKeys.some((k) => isFilled((shiftTempInputs[m.id] || {})[k])));
    if (touched.length === 0) { showAlert('تنبيه', 'اكتب قراءات موتور واحد على الأقل قبل الحفظ.'); return; }
    const incomplete = touched.filter((m) => TEMP_KEYS.some((k) => !isFilled((shiftTempInputs[m.id] || {})[k])));
    if (incomplete.length > 0) {
      showAlert('قراءات ناقصة', `${tempRound === '1' ? 'أكمل (الجسم + البلي الأمامي + البلي الخلفي)' : 'أكمل حرارة الجسم'} للموتورات:\n${incomplete.map((m) => `• ${m.locationName || `ستاند ${m.stand}`} (${m.code})`).join('\n')}`);
      return;
    }
    const readings = touched.map((m) => {
      const inp = shiftTempInputs[m.id];
      const base = { motorId: m.id, motorCode: m.code, locationName: m.locationName || `ستاند ${m.stand}` };
      return tempRound === '1'
        ? { ...base, bodyTemp1: inp.bodyTemp1, frontBearingTemp: inp.frontBearingTemp, rearBearingTemp: inp.rearBearingTemp, bodyTemp: inp.bodyTemp1, bearingTemp: maxOfTemps(inp.frontBearingTemp, inp.rearBearingTemp), amps: isFilled(inp.amps) ? inp.amps : m.amps || '-' }
        : { ...base, bodyTemp2: inp.bodyTemp2, bodyTemp: inp.bodyTemp2 };
    });
    const batchLog = {
      id: Date.now(), round: tempRound, roundLabel: tempRound === '1' ? 'بداية الوردية' : 'منتصف الوردية',
      date: currentDateStr, dayName: currentProdDate.toLocaleDateString('ar-EG', { weekday: 'long' }),
      shift: selectedShift, time: nowTime(),
      recordedBy: isSupervisorLogin ? shiftTempTech.trim() || roleLabel : roleLabel,
      supervisor: isSupervisorLogin ? roleLabel : shiftTempSupervisor.trim() || '-',
      enteredBy: roleLabel, readings
    };
    const updatedMotors = motorsList.map((m) => {
      const r = readings.find((x) => x.motorId === m.id);
      if (!r) return m;
      const common = { lastTempShift: `${currentDateStr} (${selectedShift})`, lastTechName: batchLog.recordedBy };
      return tempRound === '1'
        ? { ...m, ...common, bodyTemp1: r.bodyTemp1, bodyTemp2: '', frontBearingTemp: r.frontBearingTemp, rearBearingTemp: r.rearBearingTemp, bodyTemp: r.bodyTemp, bearingTemp: r.bearingTemp, amps: r.amps }
        : { ...m, ...common, bodyTemp2: r.bodyTemp2, bodyTemp: maxOfTemps(m.bodyTemp1, r.bodyTemp2) };
    });
    save({ motors: updatedMotors, tempLogs: [batchLog, ...tempShiftLogs] });
    setShiftTempInputs({});
    showAlert(`تم حفظ ${batchLog.roundLabel}`, `تم حفظ قراءات ${readings.length} موتور لـ (${selectedShift}).`);
  };

  const maintCoverage = (type) => {
    const done = currentShiftMaint.filter((e) => e.type === type && e.status === 'done');
    if (done.some((e) => e.scope === 'all')) return { all: true, count: motorsList.length };
    const ids = new Set(done.flatMap((e) => e.motorIds || []));
    return { all: false, count: motorsList.filter((m) => ids.has(m.id)).length };
  };

  const makeMaintEntry = ({ type, scope, motorIds, notes, status }) => {
    const ids = scope === 'all' ? motorsList.map((m) => m.id) : scope === 'selected' ? motorIds : [];
    return {
      id: `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      date: currentDateStr, dayName: currentProdDate.toLocaleDateString('ar-EG', { weekday: 'long' }),
      shift: selectedShift, crewLetter: crewNow.letter, crewName: crewNow.name, type, scope,
      motorIds: ids, motorCodes: motorsList.filter((m) => ids.includes(m.id)).map((m) => m.code), motorCount: ids.length,
      notes: notes || '', status, createdBy: roleLabel, doneBy: status === 'done' ? crewNow.name : '', doneTime: status === 'done' ? nowTime() : ''
    };
  };

  const handleAddMaintTask = (e) => {
    e.preventDefault();
    if (maintForm.scope === 'selected' && maintForm.motorIds.length === 0) {
      showAlert('تنبيه', 'اختار موتور واحد على الأقل، أو غيّر النطاق إلى "كل المواتير".');
      return;
    }
    save({ shiftMaint: [makeMaintEntry({ ...maintForm, notes: maintForm.notes.trim() }), ...shiftMaintLogs] });
    setMaintForm({ ...maintForm, motorIds: [], notes: '' });
  };

  const quickMaintAll = (type) => {
    showConfirm(`تسجيل: ${type}`, `تأكيد إن "${type}" تم لكل المواتير (${motorsList.length}) في ${selectedShift}؟ سيتم إضافته تلقائياً في سجل كل موتور.`, () =>
      save({ shiftMaint: [makeMaintEntry({ type, scope: 'all', motorIds: [], notes: '', status: 'done' }), ...shiftMaintLogs] })
    );
  };

  const createShiftRoutine = () => {
    const missing = DEFAULT_SHIFT_ROUTINE.filter((t) => !currentShiftMaint.some((e) => e.type === t));
    if (missing.length === 0) { showAlert('تنبيه', 'الجدول المعتاد موجود بالفعل لهذه الوردية.'); return; }
    save({ shiftMaint: [...missing.map((type) => makeMaintEntry({ type, scope: 'all', motorIds: [], notes: '', status: 'planned' })), ...shiftMaintLogs] });
  };

  const toggleMaintStatus = (id) => {
    save({
      shiftMaint: shiftMaintLogs.map((e) =>
        e.id !== id ? e : e.status === 'done' ? { ...e, status: 'planned', doneBy: '', doneTime: '' } : { ...e, status: 'done', doneBy: crewOf(e.shift).name, doneTime: nowTime() }
      )
    });
  };

  const deleteMaintTask = (id) => {
    if (!isSupervisorOrManager) return;
    showConfirm('حذف بند صيانة', 'هل تريد حذف هذا البند من الجدول؟', () => save({ shiftMaint: shiftMaintLogs.filter((e) => e.id !== id) }));
  };

  const maintScopeLabel = (e) => (e.scope === 'all' ? `كل المواتير (${e.motorCount || motorsList.length})` : e.scope === 'selected' ? (e.motorCodes || []).join('، ') : 'عام');

  const handleAddMotorMaintenanceLog = (e) => {
    e.preventDefault();
    if (!selectedMotorForLog || !motorMaintForm.notes.trim()) return;
    const logItem = {
      id: Date.now(), date: new Date().toLocaleDateString('en-GB'), shift: selectedShift, time: nowTime(),
      type: motorMaintForm.type,
      techName: isSupervisorLogin ? motorMaintForm.techName.trim() || '-' : roleLabel,
      supervisorName: isSupervisorLogin ? roleLabel : motorMaintForm.supervisorName.trim() || '-',
      megger: motorMaintForm.megger || selectedMotorForLog.megger,
      bodyTemp: motorMaintForm.bodyTemp || selectedMotorForLog.bodyTemp,
      bearingTemp: motorMaintForm.bearingTemp || selectedMotorForLog.bearingTemp,
      ampsRead: motorMaintForm.ampsRead || selectedMotorForLog.amps,
      notes: motorMaintForm.notes.trim(), by: roleLabel
    };
    const updatedMotors = motorsList.map((m) =>
      m.id === selectedMotorForLog.id
        ? { ...m, megger: logItem.megger || m.megger, bodyTemp: logItem.bodyTemp || m.bodyTemp, bearingTemp: logItem.bearingTemp || m.bearingTemp, amps: logItem.ampsRead || m.amps, lastTechName: logItem.techName !== '-' ? logItem.techName : roleLabel, logs: [logItem, ...(m.logs || [])] }
        : m
    );
    save({ motors: updatedMotors });
    setSelectedMotorForLog(updatedMotors.find((m) => m.id === selectedMotorForLog.id));
    setMotorMaintForm({ type: 'فحص دوري وعزل', techName: '', supervisorName: '', megger: '', bodyTemp: '', bearingTemp: '', ampsRead: '', notes: '' });
  };

  const handleDeleteMotor = (id) => {
    if (!isManagerLike) return;
    showConfirm('حذف موتور', 'هل أنت متأكد من حذف هذا الموتور وسجلاته؟', () => save({ motors: motorsList.filter((m) => m.id !== id) }));
  };

  return (
    <div className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-200 p-2.5 sm:p-4 space-y-3">
      {/* نافذة الملف والسجل الكامل للموتور */}
      {selectedMotorForLog && (
        <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-2.5 sm:p-4 backdrop-blur-sm z-50">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-300 flex flex-col max-h-[92vh]">
            <div className="bg-slate-900 text-white p-3.5 flex justify-between items-start gap-2">
              <div>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] bg-blue-600 px-2 py-0.5 rounded font-bold font-mono">ID: {selectedMotorForLog.code}</span>
                  <span className="text-[10px] bg-emerald-700 px-2 py-0.5 rounded font-bold flex items-center gap-1">
                    <Calendar className="w-3 h-3" /> دخول الخدمة: {selectedMotorForLog.serviceEntryDate || selectedMotorForLog.dateAdded || 'غير محدد'}
                  </span>
                </div>
                <h3 className="font-black text-xs sm:text-base mt-1">الملف الكامل لموتور: {selectedMotorForLog.locationName}</h3>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => handlePrintMotorFullFile(selectedMotorForLog)}
                  className="bg-rose-600 hover:bg-rose-700 text-white px-2.5 py-1.5 rounded-lg text-[10px] font-bold flex items-center gap-1"
                >
                  <FileText className="w-3 h-3" /> طباعة السجل
                </button>
                <button onClick={() => setSelectedMotorForLog(null)} className="text-slate-400 hover:text-white p-1"><X className="w-5 h-5" /></button>
              </div>
            </div>

            <div className="p-3 sm:p-4 overflow-y-auto space-y-3 text-xs">
              <div className={`grid gap-1.5 ${isManagerLike ? 'grid-cols-3' : 'grid-cols-2'}`}>
                <button type="button" onClick={() => setMotorLogView('full')} className={`py-1.5 rounded-xl font-black ${motorLogView === 'full' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                  السجل الكامل ({selectedMotorFullHistory.length})
                </button>
                <button type="button" onClick={() => setMotorLogView('temps')} className={`py-1.5 rounded-xl font-black ${motorLogView === 'temps' ? 'bg-amber-500 text-slate-950' : 'bg-slate-100 text-slate-600'}`}>
                  سجل الحرارة ({selectedMotorTempHistory.length})
                </button>
                {isManagerLike && (
                  <button type="button" onClick={() => setMotorLogView('edit')} className={`py-1.5 rounded-xl font-black flex items-center justify-center gap-1 ${motorLogView === 'edit' ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'}`}>
                    <Edit3 className="w-3.5 h-3.5" /> بيانات الموتور
                  </button>
                )}
              </div>

              {motorLogView === 'full' && (
                <>
                  <form onSubmit={handleAddMotorMaintenanceLog} className="bg-blue-50/60 border border-blue-200 rounded-xl p-3 space-y-2.5">
                    <h4 className="font-black text-blue-950">+ تسجيل صيانة مباشرة على هذا الموتور:</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <select value={motorMaintForm.type} onChange={(e) => setMotorMaintForm({ ...motorMaintForm, type: e.target.value })} className="border border-slate-300 rounded-lg p-2 bg-white font-bold">
                        <option>فحص دوري وعزل</option><option>تشحيم</option><option>تغيير شربون</option><option>عمرة / لف موتور</option><option>إصلاح عطل طارئ بالوردية</option><option>تغيير فلاتر</option>
                      </select>
                      <div className="border border-emerald-300 rounded-lg p-2 bg-emerald-50 font-black text-emerald-900 truncate">{roleLabel}</div>
                      <input type="text" placeholder={isSupervisorLogin ? 'أسماء الفنيين...' : 'اسم الملاحظ...'} value={isSupervisorLogin ? motorMaintForm.techName : motorMaintForm.supervisorName} onChange={(e) => setMotorMaintForm(isSupervisorLogin ? { ...motorMaintForm, techName: e.target.value } : { ...motorMaintForm, supervisorName: e.target.value })} className="border border-slate-300 rounded-lg p-2 bg-white font-bold" />
                    </div>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      <input type="text" placeholder="العزل 550 MΩ" value={motorMaintForm.megger} onChange={(e) => setMotorMaintForm({ ...motorMaintForm, megger: e.target.value })} className="border border-slate-300 rounded-lg p-1.5 bg-white font-mono" />
                      <input type="number" placeholder="حرارة الجسم °C" value={motorMaintForm.bodyTemp} onChange={(e) => setMotorMaintForm({ ...motorMaintForm, bodyTemp: e.target.value })} className="border border-slate-300 rounded-lg p-1.5 bg-white font-mono" />
                      <input type="number" placeholder="حرارة البلي °C" value={motorMaintForm.bearingTemp} onChange={(e) => setMotorMaintForm({ ...motorMaintForm, bearingTemp: e.target.value })} className="border border-slate-300 rounded-lg p-1.5 bg-white font-mono" />
                      <input type="text" placeholder="الأمبير A" value={motorMaintForm.ampsRead} onChange={(e) => setMotorMaintForm({ ...motorMaintForm, ampsRead: e.target.value })} className="border border-slate-300 rounded-lg p-1.5 bg-white font-mono" />
                    </div>
                    <input type="text" placeholder="تفاصيل الصيانة..." value={motorMaintForm.notes} onChange={(e) => setMotorMaintForm({ ...motorMaintForm, notes: e.target.value })} className="w-full border border-slate-300 rounded-lg p-2 bg-white" />
                    <button type="submit" className="w-full bg-blue-600 text-white font-bold py-2 rounded-xl shadow">+ حفظ في سجل الموتور</button>
                  </form>

                  <div className="space-y-2">
                    <h4 className="font-black text-slate-800">السجل الكامل (صيانة مباشرة + صيانة الورادي + الأعطال):</h4>
                    {selectedMotorFullHistory.length === 0 && (
                      <p className="text-slate-400 font-bold text-center py-4 bg-slate-50 rounded-xl">لا توجد سجلات لهذا الموتور بعد.</p>
                    )}
                    {selectedMotorFullHistory.map((item) => (
                      <div key={item.id} className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 space-y-1">
                        <div className="flex justify-between items-center font-bold text-[11px]">
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`px-2 py-0.5 rounded text-[9px] font-black ${
                                item.source === 'shift'
                                  ? 'bg-indigo-100 text-indigo-800'
                                  : item.source === 'fault'
                                  ? 'bg-red-100 text-red-700'
                                  : 'bg-blue-100 text-blue-800'
                              }`}
                            >
                              {item.sourceLabel}
                            </span>
                            <span className="text-slate-900 font-black">{item.title}</span>
                          </div>
                          <span className="font-mono text-slate-500">{item.date} {item.time}</span>
                        </div>
                        {item.details && <p className="text-slate-700 font-bold">{item.details}</p>}
                        <p className="text-[10px] text-emerald-700 font-bold">🔧 المنفذ: {item.tech} | ⏰ {item.shift}</p>
                      </div>
                    ))}
                  </div>
                </>
              )}

              {motorLogView === 'temps' && (
                <div className="space-y-2">
                  {selectedMotorTempHistory.length === 0 && <p className="text-slate-500 font-bold bg-slate-50 rounded-xl p-3 text-center">لا توجد قراءات حرارة مسجلة بعد.</p>}
                  {selectedMotorTempHistory.map((r) => (
                    <div key={`${r.batchId}-${r.motorId}`} className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 space-y-1">
                      <div className="flex justify-between font-bold text-[11px]"><span className="text-amber-700 font-black">{r.shift}</span><span className="font-mono text-slate-500">{r.date}</span></div>
                      <p className="font-mono font-black text-slate-800">
                        {String(r.round) === '2' ? `منتصف الوردية — الجسم: ${r.bodyTemp2 || r.bodyTemp || '-'}°` : `الجسم: ${r.bodyTemp1 || r.bodyTemp || '-'}° • البلي: أمامي ${r.frontBearingTemp || '-'}° / خلفي ${r.rearBearingTemp || '-'}° • ${r.amps || '-'} A`}
                      </p>
                    </div>
                  ))}
                </div>
              )}

              {motorLogView === 'edit' && isManagerLike && (
                <form onSubmit={handleSaveMotorInfo} className="bg-emerald-50/60 border border-emerald-200 rounded-xl p-3 space-y-2.5">
                  <h4 className="font-black text-emerald-950">تعديل تاريخ دخول الخدمة وبيانات الموتور (صلاحية المهندس):</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">تاريخ دخول الخدمة:</label>
                      <input type="date" value={editMotorForm.serviceEntryDate} onChange={(e) => setEditMotorForm({ ...editMotorForm, serviceEntryDate: e.target.value })} className="w-full border border-emerald-300 rounded-lg p-2 bg-white font-mono font-bold" />
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">الماركة / الدرايف:</label>
                      <input type="text" value={editMotorForm.brand} onChange={(e) => setEditMotorForm({ ...editMotorForm, brand: e.target.value })} className="w-full border border-slate-300 rounded-lg p-2 bg-white font-bold" />
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">القدرة (kW):</label>
                      <input type="text" value={editMotorForm.kw} onChange={(e) => setEditMotorForm({ ...editMotorForm, kw: e.target.value })} className="w-full border border-slate-300 rounded-lg p-2 bg-white font-mono" />
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">السرعة (RPM):</label>
                      <input type="number" value={editMotorForm.rpm} onChange={(e) => setEditMotorForm({ ...editMotorForm, rpm: e.target.value })} className="w-full border border-slate-300 rounded-lg p-2 bg-white font-mono" />
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">الأمبير (A):</label>
                      <input type="text" value={editMotorForm.amps} onChange={(e) => setEditMotorForm({ ...editMotorForm, amps: e.target.value })} className="w-full border border-slate-300 rounded-lg p-2 bg-white font-mono" />
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">العزل (Megger):</label>
                      <input type="text" value={editMotorForm.megger} onChange={(e) => setEditMotorForm({ ...editMotorForm, megger: e.target.value })} className="w-full border border-slate-300 rounded-lg p-2 bg-white font-mono" />
                    </div>
                  </div>
                  <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-2 rounded-xl shadow">حفظ التعديلات</button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* هيدر قسم الكهرباء والمواتير */}
      <div className="bg-slate-900 text-white p-3 rounded-2xl flex flex-col gap-2.5">
        <div className="flex flex-wrap justify-between items-center gap-2">
          <h2 className="font-black text-xs sm:text-base flex items-center gap-1.5">
            <Cpu className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400" /> قسم الكهرباء والمواتير ({factoryName})
          </h2>
          <div className="flex gap-1.5 text-[10px] font-black">
            <span className={`px-2 py-0.5 rounded-lg ${hotMotorsCount > 0 ? 'bg-red-600 text-white' : 'bg-slate-800 text-emerald-400'}`}>
              🔥 سخونة: {hotMotorsCount}
            </span>
            <span className="bg-slate-800 text-amber-300 px-2 py-0.5 rounded-lg">⏱️ توقف كهرباء: {shiftElecDownMins}ق</span>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:flex flex-wrap gap-1.5">
          {[
            ['faults', 'أعطال وتقرير الوردية', Zap, 'bg-rose-600 text-white'],
            ['cards', `المواتير (${motorsList.length})`, Cpu, 'bg-blue-600 text-white'],
            ['shift_temp', 'حرارة الوردية', Thermometer, 'bg-amber-500 text-slate-950'],
            ['maint', 'صيانة الورديات', Wrench, 'bg-indigo-600 text-white'],
            ...(isManagerLike ? [['add_new', '+ موتور', PlusCircle, 'bg-emerald-600 text-white']] : [])
          ].map(([id, label, Icon, activeCls]) => (
            <button key={id} onClick={() => setSubView(id)} className={`px-2.5 py-1.5 rounded-xl text-[11px] font-black flex items-center justify-center gap-1 ${subView === id ? activeCls : 'bg-slate-800 text-slate-300'}`}>
              <Icon size={13} /> {label}
            </button>
          ))}
        </div>
      </div>

      {/* تنبيه الأعطال المؤقتة (الإغلاق للملاحظ والمهندس فقط) */}
      {pendingFollowUpFaults.length > 0 && (
        <div className="bg-amber-50 border-2 border-amber-400 rounded-2xl p-2.5 space-y-1.5 text-xs">
          <p className="font-black text-amber-950 flex items-center gap-1.5">
            <AlertTriangle className="w-4 h-4 text-amber-600" /> تنبيه للوردية: يوجد ({pendingFollowUpFaults.length}) أعطال بحل مؤقت تحتاج متابعة:
          </p>
          {pendingFollowUpFaults.map((f) => (
            <div key={f.id} className="bg-white border border-amber-200 rounded-xl p-2 flex justify-between items-center gap-2">
              <span className="font-bold text-slate-800">
                <strong className="text-red-700">[{f.location}]</strong> {f.title} ({f.date} - {f.shift})
              </span>
              {isSupervisorOrManager && (
                <button onClick={() => handleResolveTempFault(f.id)} className="bg-emerald-600 text-white px-2.5 py-1 rounded-lg font-black text-[10px] shrink-0">
                  تم الحل نهائياً ✓
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* 0. أعطال وتقرير الوردية اليومي */}
      {subView === 'faults' && (
        <div className="space-y-3 text-xs">
          <div className="bg-rose-50 border border-rose-200 rounded-2xl p-3 space-y-2.5">
            <div className="flex flex-wrap justify-between items-center gap-2 border-b border-rose-200 pb-2">
              <h3 className="font-black text-xs sm:text-sm text-rose-950 flex items-center gap-1.5">
                <ClipboardCheck className="w-4 h-4 text-rose-600" /> التقرير اليومي لقسم الكهرباء — {selectedShift} ({currentDateStr})
              </h3>
              {/* طباعة التقرير اليومي والواتساب متاحة للكل */}
              <div className="flex gap-1.5">
                <button type="button" onClick={() => { navigator.clipboard.writeText(buildDailyElecWhatsApp()); showAlert('تم النسخ', 'تم نسخ التقرير اليومي لقسم الكهرباء.'); }} className="bg-green-600 text-white font-bold px-2.5 py-1.5 rounded-lg text-[10px] flex items-center gap-1">
                  <Share2 className="w-3 h-3" /> واتساب
                </button>
                <button type="button" onClick={handlePrintDailyElecReport} className="bg-rose-600 text-white font-bold px-2.5 py-1.5 rounded-lg text-[10px] flex items-center gap-1">
                  <FileText className="w-3 h-3" /> طباعة التقرير اليومي
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <select value={selectedShift} onChange={(e) => setSelectedShift(e.target.value)} className="border border-rose-300 rounded-xl p-2 bg-white font-black">
                {availableShifts.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
              <input type="text" placeholder="أسماء طاقم الوردية (مثال: محمود داود - رضا السيد - بسام - أنس...)" value={crewNamesText} onChange={(e) => setCrewNamesText(e.target.value)} className="sm:col-span-2 border border-rose-300 rounded-xl p-2 bg-white font-bold" />
            </div>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 space-y-2">
            <div className="flex justify-between items-center">
              <h4 className="font-black text-slate-900">1. بنود المرور والمتابعة اليومية ({checkedRoutineItems.length}/{DAILY_CHECKLIST_ITEMS.length}):</h4>
              <button type="button" onClick={handleCheckAllRoutine} className="bg-emerald-600 text-white font-black px-2.5 py-1 rounded-lg text-[10px]">تحديد الكل ✓</button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              {DAILY_CHECKLIST_ITEMS.map((item) => {
                const done = checkedRoutineItems.includes(item);
                return (
                  <button key={item} type="button" onClick={() => handleToggleRoutineItem(item)} className={`p-2 rounded-xl border text-right font-bold flex items-center gap-2 ${done ? 'bg-emerald-50 border-emerald-400 text-emerald-900' : 'bg-white border-slate-200 text-slate-700'}`}>
                    <CheckCircle className={`w-4 h-4 shrink-0 ${done ? 'text-emerald-600' : 'text-slate-300'}`} />
                    <span>{item}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <form onSubmit={handleAddElecFault} className="bg-white border-2 border-slate-200 rounded-2xl p-3 space-y-2.5">
            <h4 className="font-black text-slate-900">2. تسجيل عطل أو عمل منفذ (يُضاف تلقائياً في سجل الموتور):</h4>
            <div className="flex flex-wrap gap-1.5">
              {QUICK_ELEC_PRESETS.map((p) => (
                <button key={p.label} type="button" onClick={() => setElecFaultForm({ ...elecFaultForm, title: p.title })} className="bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 px-2.5 py-1 rounded-lg font-black text-[10px]">
                  + {p.label}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <select value={elecFaultForm.location} onChange={(e) => setElecFaultForm({ ...elecFaultForm, location: e.target.value })} className="border border-slate-300 rounded-xl p-2 bg-slate-50 font-bold">
                {Array.from({ length: 14 }, (_, i) => `ستاند ${i + 1}`).map((name) => <option key={name} value={name}>{name}</option>)}
                <option value="بينش رول 1 (PR1)">بينش رول 1 (PR1)</option>
                <option value="بينش رول 2 (PR2)">بينش رول 2 (PR2)</option>
                <option value="المقص الطائر (FS)">المقص الطائر (FS)</option>
                <option value="تيل بريكر 1 (TB1)">تيل بريكر 1 (TB1)</option>
                <option value="توين تشانل (TC)">توين تشانل (TC)</option>
                <option value="بينش رول تخشين (R_PR)">بينش رول تخشين (R_PR)</option>
                <option value="مقص كروب/كعبلة 1 (CCS1)">مقص كروب/كعبلة 1 (CCS1)</option>
                <option value="مقص كروب/كعبلة 2 (CCS2)">مقص كروب/كعبلة 2 (CCS2)</option>
                <option value="لوحة الكوينشنج">لوحة الكوينشنج</option>
                <option value="محطة الدرفلة واللوحات">محطة الدرفلة واللوحات</option>
                <option value="المحولات / عام">المحولات / عام</option>
              </select>
              <input type="number" placeholder="مدة التوقف (دقيقة)" value={elecFaultForm.durationMins} onChange={(e) => setElecFaultForm({ ...elecFaultForm, durationMins: e.target.value })} className="border border-slate-300 rounded-xl p-2 font-mono font-bold bg-slate-50" />
              <input type="text" placeholder="كود العطل (F0001)" value={elecFaultForm.faultCode} onChange={(e) => setElecFaultForm({ ...elecFaultForm, faultCode: e.target.value })} className="border border-slate-300 rounded-xl p-2 font-mono font-bold bg-slate-50 uppercase" />
              <input type="text" placeholder="عدد الشربون / قطعة الغيار" value={elecFaultForm.sparePart} onChange={(e) => setElecFaultForm({ ...elecFaultForm, sparePart: e.target.value })} className="border border-slate-300 rounded-xl p-2 font-bold bg-slate-50" />
            </div>
            <input type="text" placeholder="وصف العطل أو العمل المنفذ..." value={elecFaultForm.title} onChange={(e) => setElecFaultForm({ ...elecFaultForm, title: e.target.value })} className="w-full border border-slate-300 rounded-xl p-2 bg-white font-bold" />
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <input type="text" placeholder="الإجراء المتخذ / الحل..." value={elecFaultForm.actionTaken} onChange={(e) => setElecFaultForm({ ...elecFaultForm, actionTaken: e.target.value })} className="sm:col-span-2 border border-slate-300 rounded-xl p-2 bg-white font-bold" />
              <select value={elecFaultForm.resolution} onChange={(e) => setElecFaultForm({ ...elecFaultForm, resolution: e.target.value })} className="border border-slate-300 rounded-xl p-2 bg-white font-black">
                <option value="fixed">🟢 تم الحل نهائياً</option>
                <option value="temp">🟡 حل مؤقت (متابعة)</option>
              </select>
            </div>
            <button type="submit" className="w-full bg-rose-600 hover:bg-rose-700 text-white font-black py-2.5 rounded-xl shadow flex items-center justify-center gap-1.5">
              <Save className="w-4 h-4" /> حفظ في التقرير اليومي للوردية
            </button>
          </form>

          <div className="space-y-2">
            {currentShiftElecFaults.map((f) => (
              <div key={f.id} className={`p-3 rounded-xl border space-y-1 ${f.resolution === 'temp' ? 'bg-amber-50 border-amber-300' : 'bg-slate-50 border-slate-200'}`}>
                <div className="flex justify-between items-center">
                  <span className="font-black text-slate-900">
                    <span className="text-blue-700">[{f.location}]</span> {f.title}
                    {f.faultCode && <span className="mr-1.5 font-mono bg-red-100 text-red-700 px-1.5 py-0.5 rounded text-[10px]">{f.faultCode}</span>}
                  </span>
                  <div className="flex items-center gap-2">
                    {f.durationMins > 0 && <span className="font-mono font-black text-red-600">{f.durationMins} ق</span>}
                    {isSupervisorOrManager && (
                      <button onClick={() => handleDeleteElecFault(f.id)} className="text-red-500"><Trash2 className="w-3.5 h-3.5" /></button>
                    )}
                  </div>
                </div>
                {f.actionTaken && <p className="text-emerald-700 font-bold">✅ الإجراء: {f.actionTaken}</p>}
                {f.sparePart && <p className="text-indigo-700 font-bold text-[11px]">🔩 قطع الغيار/العدد: {f.sparePart}</p>}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 1. حرارة الوردية (الطباعة متاحة للكل) */}
      {subView === 'shift_temp' && (
        <form onSubmit={handleSaveShiftTemperatures} className="space-y-3">
          <div className="bg-amber-50 border border-amber-300 rounded-2xl p-3 space-y-2.5">
            <div className="flex flex-wrap justify-between items-center gap-2 border-b border-amber-200 pb-2">
              <h3 className="font-black text-xs sm:text-sm text-amber-950">تسجيل حرارة المواتير — {selectedShift} ({currentDateStr})</h3>
              <button type="button" onClick={onPrintTempNow} className="bg-rose-600 text-white font-bold py-1.5 px-2.5 rounded-lg text-[10px] flex items-center gap-1">
                <FileText className="w-3 h-3" /> طباعة تقرير الحرارة
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {[['1', '① بداية الوردية', 'جسم + بلي أمامي + خلفي + أمبير'], ['2', '② منتصف الوردية', 'حرارة الجسم فقط']].map(([id, label, hint]) => (
                <button key={id} type="button" onClick={() => { setTempRound(id); setShiftTempInputs({}); }} className={`rounded-xl p-2 font-black border text-center ${tempRound === id ? 'bg-amber-500 text-slate-950 border-amber-600' : 'bg-white text-amber-900 border-amber-300'}`}>
                  {label}<span className="block text-[9px] font-bold opacity-80">{hint}</span>
                </button>
              ))}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
              <select value={selectedShift} onChange={(e) => setSelectedShift(e.target.value)} className="border border-amber-300 rounded-xl p-2 bg-white font-black">
                {availableShifts.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
              <div className="border border-amber-300 rounded-xl p-2 bg-amber-100/60 font-bold text-amber-950 truncate">{roleLabel}</div>
              <input type="text" placeholder={isSupervisorLogin ? 'أسماء الفنيين...' : 'اسم الملاحظ...'} value={isSupervisorLogin ? shiftTempTech : shiftTempSupervisor} onChange={(e) => (isSupervisorLogin ? setShiftTempTech(e.target.value) : setShiftTempSupervisor(e.target.value))} className="border border-amber-300 rounded-xl p-2 bg-white font-bold" />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            {motorsList.map((m) => {
              const inp = shiftTempInputs[m.id] || {};
              return (
                <div key={m.id} className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-black text-xs text-slate-900">{m.locationName || `ستاند ${m.stand}`}</span>
                    <span className="font-mono text-[10px] font-black bg-blue-100 text-blue-800 px-2 py-0.5 rounded">ID: {m.code}</span>
                  </div>
                  {shiftRecordedIds.has(m.id) && <p className="text-[10px] font-black text-emerald-700 bg-emerald-50 rounded-lg px-2 py-1">✅ سُجل هذا القياس</p>}
                  <div className={`grid gap-1.5 text-[10px] ${tempRound === '1' ? 'grid-cols-2' : 'grid-cols-1'}`}>
                    {(tempRound === '1' ? [['bodyTemp1', 'حرارة الجسم °C', 'border-slate-300 bg-white'], ['amps', 'الأمبير A', 'border-slate-300 bg-white'], ['frontBearingTemp', 'البلي الأمامي °C', 'border-amber-400 bg-amber-50/50'], ['rearBearingTemp', 'البلي الخلفي °C', 'border-amber-400 bg-amber-50/50']] : [['bodyTemp2', 'حرارة الجسم °C', 'border-slate-300 bg-white']]).map(([key, label, cls]) => (
                      <div key={key}>
                        <label className="text-slate-500 font-bold block mb-0.5">{label}</label>
                        <input type="number" value={inp[key] ?? ''} onChange={(e) => setShiftTempInputs({ ...shiftTempInputs, [m.id]: { ...inp, [key]: e.target.value } })} className={`w-full border rounded-lg p-1.5 text-center font-mono font-black ${cls}`} />
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
          <button type="submit" className="w-full bg-emerald-600 text-white font-black py-2.5 rounded-xl shadow text-xs flex items-center justify-center gap-1.5">
            <Save className="w-4 h-4" /> حفظ قراءات الحرارة
          </button>
        </form>
      )}

      {/* 2. صيانة الورديات */}
      {subView === 'maint' && (
        <div className="space-y-3">
          <div className="bg-indigo-50 border border-indigo-300 rounded-2xl p-3 flex flex-wrap justify-between items-center gap-2">
            <h3 className="font-black text-xs sm:text-sm text-indigo-950">صيانة المواتير — {selectedShift} ({crewLabel(selectedShift)})</h3>
            <button type="button" onClick={onPrintMaintNow} className="bg-rose-600 text-white font-bold py-1.5 px-2.5 rounded-lg text-[10px] flex items-center gap-1">
              <FileText className="w-3 h-3" /> طباعة تقرير الصيانة
            </button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {['تغيير فلاتر', 'نفخ هواء داخلي'].map((t) => {
              const cov = maintCoverage(t);
              return (
                <button key={t} type="button" onClick={() => quickMaintAll(t)} className={`rounded-xl p-2.5 text-xs font-black border flex items-center justify-between ${cov.all ? 'bg-emerald-50 border-emerald-400 text-emerald-800' : 'bg-slate-50 border-slate-300 text-slate-800'}`}>
                  <span>✔ {t} لكل المواتير</span>
                  <span className="text-[10px] font-mono">{cov.all ? 'تم (الكل)' : `${cov.count}/${motorsList.length}`}</span>
                </button>
              );
            })}
          </div>
          <button type="button" onClick={createShiftRoutine} className="w-full bg-indigo-100 text-indigo-900 border border-indigo-300 rounded-xl py-1.5 text-[11px] font-black">
            + إنشاء الجدول المعتاد للوردية ({DEFAULT_SHIFT_ROUTINE.join(' + ')})
          </button>
          <form onSubmit={handleAddMaintTask} className="bg-slate-50 border border-slate-200 rounded-2xl p-3 space-y-2 text-xs">
            <div className="grid grid-cols-2 gap-2">
              <select value={maintForm.type} onChange={(e) => setMaintForm({ ...maintForm, type: e.target.value })} className="border border-slate-300 rounded-xl p-2 bg-white font-bold">
                {MAINT_TYPES.map((t) => <option key={t}>{t}</option>)}
              </select>
              <select value={maintForm.status} onChange={(e) => setMaintForm({ ...maintForm, status: e.target.value })} className="border border-slate-300 rounded-xl p-2 bg-white font-bold">
                <option value="done">تم التنفيذ (يُضاف لسجل الموتور)</option><option value="planned">مخطط (لم يتم)</option>
              </select>
            </div>
            <div className="grid grid-cols-3 gap-1">
              {[['all', 'كل المواتير'], ['selected', 'مواتير محددة'], ['general', 'عام']].map(([v, l]) => (
                <button key={v} type="button" onClick={() => setMaintForm({ ...maintForm, scope: v })} className={`rounded-xl py-1.5 font-black border text-[11px] ${maintForm.scope === v ? 'bg-slate-900 text-white' : 'bg-white text-slate-700 border-slate-300'}`}>{l}</button>
              ))}
            </div>
            {maintForm.scope === 'selected' && (
              <div className="flex flex-wrap gap-1 bg-white p-2 rounded-xl border border-slate-200">
                {motorsList.map((m) => {
                  const on = maintForm.motorIds.includes(m.id);
                  return (
                    <button key={m.id} type="button" onClick={() => setMaintForm({ ...maintForm, motorIds: on ? maintForm.motorIds.filter((x) => x !== m.id) : [...maintForm.motorIds, m.id] })} className={`px-2 py-1 rounded-lg border text-[10px] font-black ${on ? 'bg-indigo-600 text-white' : 'bg-slate-50 text-slate-700 border-slate-300'}`}>
                      {m.locationName} ({m.code})
                    </button>
                  );
                })}
              </div>
            )}
            <input type="text" value={maintForm.notes} onChange={(e) => setMaintForm({ ...maintForm, notes: e.target.value })} placeholder="ملاحظات..." className="w-full border border-slate-300 rounded-xl p-2 bg-white font-bold" />
            <button type="submit" className="w-full bg-indigo-600 text-white font-black py-2 rounded-xl">حفظ البند</button>
          </form>
          <div className="space-y-1.5">
            {currentShiftMaint.map((e) => (
              <div key={e.id} className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl p-2 text-xs">
                <button type="button" onClick={() => toggleMaintStatus(e.id)} className={e.status === 'done' ? 'text-emerald-600' : 'text-amber-500'}>
                  {e.status === 'done' ? <CheckCircle className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
                </button>
                <div className="flex-1 font-bold">{e.type} — {maintScopeLabel(e)} {e.notes && `(${e.notes})`}</div>
                {isSupervisorOrManager && (
                  <button type="button" onClick={() => deleteMaintTask(e.id)} className="text-red-500"><Trash2 className="w-4 h-4" /></button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 3. إضافة موتور جديد (للمهندس / المدير فقط) */}
      {subView === 'add_new' && isManagerLike && (
        <form onSubmit={handleAddMotor} className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-3 text-xs">
          <div className="flex flex-wrap justify-between items-center gap-2 border-b border-slate-200 pb-2">
            <h3 className="font-black text-slate-900">إضافة موتور جديد بتاريخ دخول الخدمة</h3>
            <button
              type="button"
              onClick={handleLoadParkerMotors}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-black px-3 py-1.5 rounded-xl text-[11px] flex items-center gap-1 shadow"
            >
              <Download className="w-3.5 h-3.5" /> تحميل مواتير Parker الـ 22 دفعة واحدة
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
            <select value={newMotor.category} onChange={(e) => setNewMotor({ ...newMotor, category: e.target.value })} className="border border-slate-300 rounded-xl p-2 bg-white font-bold">
              <option value="rolling">درفلة رئيسي</option><option value="aux">كهرباء مساعدة</option>
            </select>
            {newMotor.category === 'rolling' ? (
              <select value={newMotor.stand} onChange={(e) => setNewMotor({ ...newMotor, stand: e.target.value, locationName: `ستاند ${e.target.value}` })} className="border border-slate-300 rounded-xl p-2 bg-white font-bold">
                {Array.from({ length: 14 }, (_, i) => String(i + 1)).map((id) => <option key={id} value={id}>ستاند {id}</option>)}
              </select>
            ) : (
              <input type="text" placeholder="اسم المعدة" value={newMotor.locationName} onChange={(e) => setNewMotor({ ...newMotor, locationName: e.target.value })} className="border border-slate-300 rounded-xl p-2 bg-white font-bold" />
            )}
            <input type="text" placeholder="كود الموتور MTR-ST1" value={newMotor.code} onChange={(e) => setNewMotor({ ...newMotor, code: e.target.value })} className="border border-slate-300 rounded-xl p-2 bg-white font-mono font-bold uppercase" />
            <input type="text" placeholder="الماركة" value={newMotor.brand} onChange={(e) => setNewMotor({ ...newMotor, brand: e.target.value })} className="border border-slate-300 rounded-xl p-2 bg-white" />
            <input type="number" placeholder="القدرة kW" value={newMotor.kw} onChange={(e) => setNewMotor({ ...newMotor, kw: e.target.value })} className="border border-slate-300 rounded-xl p-2 bg-white font-mono" />
            <input type="number" placeholder="السرعة RPM" value={newMotor.rpm} onChange={(e) => setNewMotor({ ...newMotor, rpm: e.target.value })} className="border border-slate-300 rounded-xl p-2 bg-white font-mono" />
            <div className="col-span-2 sm:col-span-3">
              <label className="font-bold text-slate-700 block mb-1">تاريخ دخول الموتور الخدمة:</label>
              <input type="date" value={newMotor.serviceEntryDate} onChange={(e) => setNewMotor({ ...newMotor, serviceEntryDate: e.target.value })} className="w-full border border-emerald-400 rounded-xl p-2 bg-white font-mono font-bold" />
            </div>
          </div>
          <button type="submit" className="w-full bg-blue-600 text-white font-black py-2.5 rounded-xl shadow">حفظ الموتور الجديد</button>
        </form>
      )}

      {/* 4. كروت المواتير */}
      {subView === 'cards' && (
        <div className="space-y-2.5">
          <div className="flex flex-col sm:flex-row gap-2">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
              <input type="text" value={motorSearchId} onChange={(e) => setMotorSearchId(e.target.value)} placeholder="ابحث بـ ID الموتور أو الستاند..." className="w-full bg-slate-50 border border-slate-300 rounded-xl pr-9 pl-3 py-2 text-xs font-bold outline-none" />
            </div>
            <div className="grid grid-cols-3 sm:flex gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 text-[11px] font-bold">
              {[['all', 'الكل'], ['rolling', 'الدرفلة'], ['aux', 'المساعدة']].map(([id, label]) => (
                <button key={id} onClick={() => setMotorCategoryFilter(id)} className={`px-2.5 py-1 rounded-lg ${motorCategoryFilter === id ? 'bg-blue-600 text-white' : 'text-slate-600'}`}>{label}</button>
              ))}
            </div>
            {isManagerLike && (
              <button
                type="button"
                onClick={handleLoadParkerMotors}
                className="bg-emerald-600 hover:bg-emerald-700 text-white font-black px-3 py-1.5 rounded-xl text-[11px] flex items-center justify-center gap-1 shrink-0"
              >
                <Download className="w-3.5 h-3.5" /> تحميل مواتير Parker (22)
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {filteredMotors.map((m) => {
              const bearingHot = Number(m.bearingTemp) >= 75;
              const totalRecordsCount = getFullMotorHistory(m).length;
              return (
                <div key={m.id} className={`rounded-2xl border p-3 flex flex-col justify-between gap-2.5 shadow-sm ${bearingHot ? 'bg-red-50/60 border-red-400' : 'bg-slate-50/70 border-slate-200'}`}>
                  <div>
                    <div className="flex justify-between items-center gap-2">
                      <h3 className="font-black text-sm text-slate-900">{m.locationName || `ستاند ${m.stand}`}</h3>
                      <span className="font-mono font-black text-[11px] bg-slate-900 text-amber-400 px-2 py-0.5 rounded-lg">ID: {m.code}</span>
                    </div>
                    <p className="text-[10px] font-bold text-emerald-700 mt-1 flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> دخول الخدمة: <span className="font-mono">{m.serviceEntryDate || m.dateAdded || 'غير محدد'}</span>
                    </p>
                    <div className="grid grid-cols-2 gap-1.5 bg-white p-2.5 rounded-xl border border-slate-200 mt-2 text-[11px] font-bold">
                      <div><span className="text-slate-400 text-[9px] block">القدرة / السرعة:</span><span className="font-mono">{m.kw}kW • {m.rpm}RPM</span></div>
                      <div><span className="text-slate-400 text-[9px] block">الأمبير:</span><span className="font-mono text-blue-700">{m.amps || '-'} A</span></div>
                      <div><span className="text-slate-400 text-[9px] block">حرارة الجسم:</span><span className="font-mono text-amber-700">{m.bodyTemp1 !== undefined ? `${m.bodyTemp1 || '-'}° / ${m.bodyTemp2 || '-'}°C` : `${m.bodyTemp || '50'}°C`}</span></div>
                      <div><span className="text-slate-400 text-[9px] block">البلي (أمامي/خلفي):</span><span className={`font-mono ${bearingHot ? 'text-red-600' : 'text-amber-700'}`}>{m.frontBearingTemp !== undefined ? `${m.frontBearingTemp || '-'}° / ${m.rearBearingTemp || '-'}°C` : `${m.bearingTemp || '55'}°C`}</span></div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 pt-2 border-t border-slate-200">
                    <button onClick={() => openMotorModal(m, 'full')} className="flex-1 bg-blue-600 text-white font-bold py-1.5 rounded-xl text-xs flex items-center justify-center gap-1">
                      <Wrench className="w-3.5 h-3.5" /> السجل الكامل ({totalRecordsCount})
                    </button>
                    {isManagerLike && <button onClick={() => handleDeleteMotor(m.id)} className="bg-red-50 text-red-600 p-1.5 rounded-xl border border-red-200"><Trash2 className="w-4 h-4" /></button>}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}