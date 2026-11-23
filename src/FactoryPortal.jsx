import React, { useState, useEffect, useRef } from 'react';
import {
  Edit3, TrendingUp, AlertTriangle, CheckCircle, RotateCcw,
  Save, Power, Archive, RefreshCw,
  Trash2, Clock, Settings, X, UploadCloud, History,
  Key, Lock, Wrench, ArrowLeftRight,
  FileSpreadsheet, FileText, Inbox, XCircle, Hourglass,
  Cpu, PlusCircle, Building2, BookMarked, Disc,
  Share2, Copy, Users, Link2, Search, Thermometer, Database
} from 'lucide-react';
import { signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { doc, setDoc, onSnapshot } from 'firebase/firestore';
import { auth, db } from './App';

/* ======================================================
   1. الثوابت الإعدادية وقوالب الستاندات لكل مصنع
   ====================================================== */
const ALGIOSHY_STANDS_CONFIG = [
  { type: 'بيضاوي', rollCode: '111', diameter: '380', hardness: '42 HRC', totalPasses: 6, maxLimit: 2500 },
  { type: 'مربع', rollCode: '207', diameter: '374', hardness: '45 HRC', totalPasses: 9, maxLimit: 2500 },
  { type: 'بيضاوي', rollCode: '307', diameter: '356', hardness: '46 HRC', totalPasses: 10, maxLimit: 2000 },
  { type: 'مربع', rollCode: '404', diameter: '400', hardness: '47 HRC', totalPasses: 15, maxLimit: 2000 },
  { type: 'بيضاوي', rollCode: '505', diameter: '371', hardness: '46 HRC', totalPasses: 14, maxLimit: 2000 },
  { type: 'مربع', rollCode: '604', diameter: '394', hardness: '47 HRC', totalPasses: 18, maxLimit: 2000 },
  { type: 'بيضاوي', rollCode: '70/ov', diameter: '340', hardness: '48 HRC', totalPasses: 15, maxLimit: 1500 },
  { type: 'دائري', rollCode: '804', diameter: '315', hardness: '45 HRC', totalPasses: 20, maxLimit: 1500 },
  { type: 'بيضاوي', rollCode: '90/ov', diameter: '345', hardness: '48 HRC', totalPasses: 19, maxLimit: 1000 },
  { type: '16 mm', rollCode: 'F16/15', diameter: '332', hardness: '51 HRC', totalPasses: 24, maxLimit: 1000 },
  { type: '16 mm', rollCode: 'F16/16', diameter: '332', hardness: '51 HRC', totalPasses: 24, maxLimit: 1000 },
  { type: '16 mm', rollCode: 'F16/17', diameter: '332', hardness: '51 HRC', totalPasses: 24, maxLimit: 1000 }
].map((c, i) => ({ ...c, id: String(i + 1), name: `ستاند ${i + 1}` }));

// قالب نظيف تماماً لأي مصنع جديد يتم إنشاؤه مستقبلاً حتى لا تتداخل بياناته مع الجيوشي
const CLEAN_NEW_FACTORY_STANDS_CONFIG = Array.from({ length: 12 }, (_, i) => ({
  id: String(i + 1),
  name: `ستاند ${i + 1}`,
  type: i % 2 === 0 ? 'بيضاوي' : 'دائري / مربع',
  rollCode: `R-${i + 1}`,
  diameter: i < 4 ? '400' : i < 8 ? '350' : '320',
  hardness: '48 HRC',
  totalPasses: i < 4 ? 8 : i < 8 ? 14 : 20,
  maxLimit: i < 6 ? 2000 : 1200
}));

const SHIFTS_NORMAL = ['الوردية الأولى', 'الوردية الثانية', 'الوردية الثالثة'];

const SHIFTS_FRIDAY = ['الوردية الأولى (12 ساعة)', 'الوردية الثانية (12 ساعة)'];

const shiftsFor = (isFri) => (isFri ? SHIFTS_FRIDAY : SHIFTS_NORMAL);

// أقسام النظام (تبويبات الشريط العلوي) — تبويب "الموظفين" للمدير فقط ولا يُمنح لموظف عادي
const FACTORY_TABS = [
  ['dashboard', 'الممرات والتشغيل', TrendingUp],
  ['motors', 'حالة وحرارة المواتير', Cpu],
  ['downtime', 'أعطال الوردية', Wrench],
  ['rollshop', 'ورشة الدرافيل', Disc],
  ['recipes', 'وصفات المقاسات', BookMarked],
  ['staff', 'الموظفين والأكواد', Users],
  ['archive', 'الأرشيف والتقارير', Archive]
];
const ASSIGNABLE_TABS = FACTORY_TABS.filter(([k]) => k !== 'staff');
const ASSIGNABLE_TAB_KEYS = ASSIGNABLE_TABS.map(([k]) => k);

// صلاحيات الموظف: null = دخول كامل (المدير أو موظف قديم بدون تحديد)، وإلا مصفوفة بالأقسام المسموحة فقط
const accessFor = (emp) => (emp.role === 'manager' || !Array.isArray(emp.access) ? null : emp.access);
const firstTabOf = (access) => (access ? (FACTORY_TABS.find(([k]) => access.includes(k)) || [])[0] || 'dashboard' : 'dashboard');

/* ======================================================
   2. دوال التواريخ المساعدة
   ====================================================== */
const formatDateToISO = (d) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

const formatDateToGB = (iso) => {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
};

const convertGBToISO = (gb) => {
  if (!gb || !gb.includes('/')) return formatDateToISO(new Date());
  const p = gb.split('/');
  if (p.length !== 3) return formatDateToISO(new Date());
  return `${p[2]}-${p[1].padStart(2, '0')}-${p[0].padStart(2, '0')}`;
};

/* ======================================================
   3. نموذج بيانات الستاند (بناء / تطبيع)
   ====================================================== */
const createPassesArray = (count, activePassNum = 1, initialTons = 0) =>
  Array.from({ length: count }, (_, idx) => {
    const pNum = idx + 1;
    const isCurrent = pNum === activePassNum;
    return {
      passNumber: pNum,
      status: isCurrent ? 'active' : 'unused',
      tons: isCurrent ? initialTons : 0,
      order: isCurrent ? 1 : null,
      sizeLabel: ''
    };
  });

const buildStand = (cfg) => {
  const todayGB = new Date().toLocaleDateString('en-GB');
  const totalPasses = Number(cfg.totalPasses) || 12;
  return {
    id: String(cfg.id),
    name: cfg.name || `ستاند ${cfg.id}`,
    type: cfg.type ?? '',
    rollCode: cfg.rollCode ?? '',
    diameter: cfg.diameter ?? '',
    hardness: cfg.hardness ?? '',
    entryDate: todayGB,
    totalPasses,
    activePass: 1,
    passes: createPassesArray(totalPasses, 1, 0),
    isActive: true,
    accumulatedTons: 0,
    creditedShiftKey: '',
    creditedShiftTons: 0,
    creditedShiftBillets: 0,
    maxLimit: Number(cfg.maxLimit) || 1500,
    lastResetDate: todayGB
  };
};

// دالة تبني الستاندات الابتدائية حسب هوية المصنع (الجيوشي أو مصنع جديد مستقل)
const buildInitialStandsForFactory = (factoryId) => {
  const baseCfg =
    factoryId === 'al-gioshy-steel-rolls' ? ALGIOSHY_STANDS_CONFIG : CLEAN_NEW_FACTORY_STANDS_CONFIG;
  return baseCfg.map(buildStand);
};

const normalizeStand = (stand, fallbackIndex, factoryId) => {
  const baseCfg =
    factoryId === 'al-gioshy-steel-rolls' ? ALGIOSHY_STANDS_CONFIG : CLEAN_NEW_FACTORY_STANDS_CONFIG;
  const cfg = baseCfg[fallbackIndex] || {
    id: String(fallbackIndex + 1),
    name: `ستاند ${fallbackIndex + 1}`,
    type: '',
    rollCode: '',
    diameter: '',
    hardness: '',
    totalPasses: 12,
    maxLimit: 1500
  };
  const id = String(stand?.id || cfg.id);
  const totalPasses = Number(stand?.totalPasses) || cfg.totalPasses || 12;
  const activePass = Number(stand?.activePass) || 1;
  const currentTons = Number(stand?.accumulatedTons) || 0;
  let passes = stand?.passes;
  if (!Array.isArray(passes) || passes.length !== totalPasses) {
    passes = createPassesArray(totalPasses, activePass, currentTons);
  } else {
    passes = passes.map((p) =>
      p.passNumber === activePass ? { ...p, status: 'active', tons: currentTons, order: p.order || 1 } : p
    );
  }
  return {
    ...stand,
    id,
    name: stand?.name || `ستاند ${id}`,
    type: stand?.type ?? cfg.type,
    rollCode: stand?.rollCode ?? cfg.rollCode,
    diameter: stand?.diameter ?? cfg.diameter,
    hardness: stand?.hardness ?? cfg.hardness,
    entryDate: stand?.entryDate || stand?.lastResetDate || new Date().toLocaleDateString('en-GB'),
    maxLimit: Number(stand?.maxLimit) || cfg.maxLimit || 1500,
    isActive: stand?.isActive !== undefined ? stand.isActive : true,
    accumulatedTons: currentTons,
    creditedShiftKey: stand?.creditedShiftKey || '',
    creditedShiftTons: Number(stand?.creditedShiftTons) || 0,
    creditedShiftBillets: Number(stand?.creditedShiftBillets) || 0,
    totalPasses,
    activePass,
    passes
  };
};

const normalizeList = (raw, factoryId) => {
  if (!Array.isArray(raw) || raw.length === 0) return buildInitialStandsForFactory(factoryId);
  return raw.map((st, idx) => normalizeStand(st, idx, factoryId));
};

/* ======================================================
   4. اللوجيك الهندسي الذكي لتغيير الممر بعد عدد كتل في الوردية
   ====================================================== */
const applyPassChange = (list, req, billetWeight, approver, archiveList = []) => {
  const idx = list.findIndex((s) => String(s.id) === String(req.standId));
  if (idx < 0) return null;
  const st = { ...list[idx] };
  const prev = st.activePass;
  const shiftKey = `${req.date}__${req.shift}`;

  const existingShiftLog = (archiveList || []).find((l) => l.date === req.date && l.shift === req.shift);

  const base = {
    id: Date.now() + Math.floor(Math.random() * 1000),
    standId: st.id,
    standName: st.name,
    date: req.date,
    time: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
    shift: req.shift,
    productSize: req.productSize,
    requestedBy: req.requestedBy || approver,
    approvedBy: approver
  };
  let log;

  if (req.kind === 'newRoll') {
    const total = st.passes.reduce((a, p) => a + (Number(p.tons) || 0), 0);
    st.entryDate = req.date;
    st.lastResetDate = req.date;
    st.activePass = 1;
    st.accumulatedTons = 0;
    st.creditedShiftKey = '';
    st.creditedShiftTons = 0;
    st.creditedShiftBillets = 0;
    st.passes = createPassesArray(st.totalPasses, 1, 0);
    log = {
      ...base,
      kind: 'newRoll',
      fromPass: prev,
      toPass: 1,
      tons: total,
      billetsAtChange: 0,
      notes: req.notes || 'تركيب درفيل جديد'
    };
  } else {
    const target = Number(req.targetPass) || prev;
    const billetsOnOldInThisShift = Math.max(0, Number(req.billets) || 0);
    const tonsOnOldInThisShift = billetsOnOldInThisShift * billetWeight;
    const currentAccumulated = Number(st.accumulatedTons) || 0;

    let finalOldPassTons = currentAccumulated;
    let newPassOpeningTons = 0;

    if (billetsOnOldInThisShift > 0) {
      if (existingShiftLog) {
        const shiftTotalTons = Number(existingShiftLog.tons) || 0;
        const tonsBeforeThisShift = Math.max(0, currentAccumulated - shiftTotalTons);
        finalOldPassTons = tonsBeforeThisShift + tonsOnOldInThisShift;
        newPassOpeningTons = Math.max(0, shiftTotalTons - tonsOnOldInThisShift);
        st.creditedShiftKey = '';
        st.creditedShiftTons = 0;
        st.creditedShiftBillets = 0;
      } else {
        finalOldPassTons = currentAccumulated + tonsOnOldInThisShift;
        newPassOpeningTons = 0;
        st.creditedShiftKey = shiftKey;
        st.creditedShiftTons = (st.creditedShiftKey === shiftKey ? Number(st.creditedShiftTons) || 0 : 0) + tonsOnOldInThisShift;
        st.creditedShiftBillets = (st.creditedShiftKey === shiftKey ? Number(st.creditedShiftBillets) || 0 : 0) + billetsOnOldInThisShift;
      }
    } else {
      finalOldPassTons = currentAccumulated;
      newPassOpeningTons = 0;
      st.creditedShiftKey = '';
      st.creditedShiftTons = 0;
      st.creditedShiftBillets = 0;
    }

    const maxOrder = Math.max(0, ...st.passes.map((p) => p.order || 0));
    st.passes = st.passes.map((p) => {
      if (p.passNumber === prev && prev !== target)
        return { ...p, status: 'used', tons: finalOldPassTons, order: p.order || Math.max(1, maxOrder) };
      if (p.passNumber === target)
        return {
          ...p,
          status: 'active',
          tons: newPassOpeningTons,
          order: prev === target ? p.order || 1 : p.order ? p.order : maxOrder + 1
        };
      return p;
    });
    st.activePass = target;
    st.accumulatedTons = newPassOpeningTons;
    st.lastResetDate = req.date;
    log = {
      ...base,
      kind: 'pass',
      fromPass: prev,
      toPass: target,
      tons: finalOldPassTons,
      billetsAtChange: billetsOnOldInThisShift,
      notes:
        req.notes ||
        (billetsOnOldInThisShift > 0
          ? `نقل من ممر ${prev} إلى ممر ${target} بعد سحب ${billetsOnOldInThisShift} كتلة (${tonsOnOldInThisShift.toFixed(1)} طن)`
          : `نقل من ممر ${prev} إلى ممر ${target}`)
    };
  }
  const newList = [...list];
  newList[idx] = st;
  return { list: newList, log };
};

/* ======================================================
   5. التصدير الشامل (Excel / PDF)
   ====================================================== */
const esc = (s) => String(s ?? '').replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));

const buildReportHTML = ({ factoryName, stands, archive, changes, downtimes, motors, tempShiftLogs, billetWeight }) => {
  const now = new Date().toLocaleString('ar-EG');
  const th = (arr) => `<tr>${arr.map((h) => `<th>${esc(h)}</th>`).join('')}</tr>`;
  const td = (arr) => `<tr>${arr.map((c) => `<td>${esc(c)}</td>`).join('')}</tr>`;

  const standsRows = stands
    .map((s) => {
      const total = s.passes.reduce((a, p) => a + (Number(p.tons) || 0), 0);
      return td([
        s.name,
        s.type,
        s.diameter,
        s.entryDate,
        `${s.activePass} / ${s.totalPasses}`,
        s.accumulatedTons.toFixed(0),
        s.maxLimit,
        `${Math.round((s.accumulatedTons / s.maxLimit) * 100)}%`,
        total.toFixed(0)
      ]);
    })
    .join('');

  const logs = [...archive].sort((a, b) => b.timestamp - a.timestamp);
  const archiveRows = logs
    .map((l) => td([l.date, l.dayName, l.shift, l.productSize || '', l.billets, l.tons.toFixed(1), l.by || '-', l.time]))
    .join('');
  const sumT = logs.reduce((a, l) => a + l.tons, 0).toFixed(1);
  const sumB = logs.reduce((a, c) => a + c.billets, 0);

  const changeRows = changes
    .map((c) =>
      td([
        c.date,
        c.shift,
        c.standName,
        c.kind === 'newRoll' ? 'تركيب درفيل جديد' : `ممر ${c.fromPass} ← ممر ${c.toPass}`,
        Number(c.tons).toFixed(1),
        c.billetsAtChange || 0,
        c.productSize || '',
        c.requestedBy || '',
        c.notes || ''
      ])
    )
    .join('');

  const downRows = (downtimes || [])
    .map((d) =>
      td([
        d.date,
        d.shift,
        d.category,
        d.standName || 'عام',
        `${d.durationMins} ق`,
        d.reason,
        d.actionTaken || '',
        d.techName || d.by || ''
      ])
    )
    .join('');
  const sumDownMins = (downtimes || []).reduce((a, d) => a + (Number(d.durationMins) || 0), 0);

  const motorRows = (motors || [])
    .map((m) =>
      td([
        m.category === 'aux' ? 'كهرباء ومعدات مساعدة' : 'درفلة رئيسي',
        m.locationName || `ستاند ${m.stand}`,
        m.code,
        m.brand || '',
        `${m.kw} kW`,
        m.rpm,
        m.amps || '-',
        `${m.bodyTemp || '-'} °C`,
        `${m.bearingTemp || '-'} °C`,
        m.megger || '-',
        m.lastTechName || '-',
        (m.logs || []).length
      ])
    )
    .join('');

  const tempLogsRows = (tempShiftLogs || [])
    .flatMap((batch) =>
      (batch.readings || []).map((r) =>
        td([
          batch.date,
          batch.shift,
          r.motorCode,
          r.locationName,
          r.bodyTemp1 !== undefined ? `${r.bodyTemp1 || '-'} / ${r.bodyTemp2 || '-'} °C` : `${r.bodyTemp || '-'} °C`,
          r.frontBearingTemp !== undefined ? `${r.frontBearingTemp || '-'} °C` : r.bearingTemp ? `${r.bearingTemp} °C` : '-',
          r.rearBearingTemp !== undefined ? `${r.rearBearingTemp || '-'} °C` : '-',
          `${r.amps || '-'} A`,
          batch.recordedBy || '-',
          batch.supervisor || '-'
        ])
      )
    )
    .join('');

  return `<html dir="rtl" lang="ar" xmlns:x="urn:schemas-microsoft-com:office:excel"><head><meta charset="UTF-8">
<title>تقرير ${esc(factoryName)}</title>
<style>
  body{font-family:Tahoma,Arial,'Noto Sans Arabic',sans-serif;color:#0f172a;padding:16px}
  h1{font-size:20px;margin:0} h2{font-size:14px;margin:22px 0 6px;border-right:4px solid #2563eb;padding-right:8px}
  .meta{color:#64748b;font-size:11px;margin-top:4px}
  table{border-collapse:collapse;width:100%;font-size:11px;margin-bottom:8px}
  th{background:#0f172a;color:#fff;padding:6px;border:1px solid #334155}
  td{padding:5px;border:1px solid #cbd5e1;text-align:center}
  tr:nth-child(even) td{background:#f1f5f9}
  .tot td{font-weight:bold;background:#dbeafe!important}
  @media print{ body{padding:0} h2{break-after:avoid} tr{break-inside:avoid} }
</style></head><body>
<h1>${esc(factoryName)} - التقرير الشامل للإنتاج والدرافيل وحرارة المواتير</h1>
<div class="meta">تاريخ التقرير: ${esc(now)} | عدد الستاندات: ${stands.length} | وزن البليت: ${esc(billetWeight)} طن</div>
<h2>1. حالة الستاندات والممرات (${stands.length} ستاند)</h2>
<table>${th(['الستاند', 'الشكل', 'القطر', 'تاريخ دخول الدرفيل', 'الممر الحالي', 'إنتاج الممر الحالي (طن)', 'الحد الأقصى', 'النسبة', 'إجمالي إنتاج الدرفيل (طن)'])}${standsRows}</table>
<h2>2. سجل الإنتاج اليومي للورديات</h2>
<table>${th(['التاريخ', 'اليوم', 'الوردية', 'المقاس', 'البليت', 'الطن', 'المسجل', 'وقت التسجيل'])}${archiveRows}
<tr class="tot"><td colspan="4">الإجمالي</td><td>${sumB}</td><td>${sumT}</td><td colspan="2"></td></tr></table>
<h2>3. سجل الأعطال والتوقفات بالورديات (Downtime Log)</h2>
<table>${th(['التاريخ', 'الوردية', 'التصنيف', 'الستاند/المعدة', 'مدة التوقف', 'سبب العطل/التوقف', 'الإجراء المتخذ', 'الفني/الملاحظ'])}${downRows}
<tr class="tot"><td colspan="4">إجمالي وقت التوقفات</td><td>${sumDownMins} دقيقة</td><td colspan="3"></td></tr></table>
<h2>4. سجل حرارة المواتير والأمبير للورديات</h2>
<table>${th(['التاريخ', 'الوردية', 'كود الموتور (ID)', 'الموقع/الستاند', 'حرارة الجسم (قراءة 1 / 2)', 'البلي الأمامي', 'البلي الخلفي', 'الأمبير', 'الفني القائم بالقياس', 'الملاحظ/المشرف'])}${tempLogsRows}</table>
<h2>5. سجل بيانات وصيانة المواتير</h2>
<table>${th(['القسم', 'الموقع/الستاند', 'كود الموتور (ID)', 'الماركة', 'القدرة', 'RPM', 'الأمبير', 'حرارة الجسم', 'حرارة البلي', 'العزل Megger', 'آخر فني صيانة', 'عدد الصيانات'])}${motorRows}</table>
<h2>6. سجل تغيير الممرات والدرافيل</h2>
<table>${th(['التاريخ', 'الوردية', 'الستاند', 'التغيير', 'إنتاج الممر المغلق (طن)', 'كتل الوردية قبل التغيير', 'المقاس', 'بواسطة', 'ملاحظات'])}${changeRows}</table>
</body></html>`;
};

const downloadExcel = (data) => {
  const html = '\ufeff' + buildReportHTML(data);
  const blob = new Blob([html], { type: 'application/vnd.ms-excel;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `تقرير-${data.factoryName || 'المصنع'}-${formatDateToISO(new Date())}.xls`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
};

const printPDF = (data, onBlocked) => {
  const w = window.open('', '_blank');
  if (!w) {
    onBlocked && onBlocked();
    return;
  }
  w.document.open();
  w.document.write(
    buildReportHTML(data) +
      '<script>window.onload=function(){setTimeout(function(){window.print()},400)}<\/script>'
  );
  w.document.close();
};

// طباعة أي مستند HTML جاهز في نافذة جديدة
const printHTMLDoc = (html, onBlocked) => {
  const w = window.open('', '_blank');
  if (!w) {
    onBlocked && onBlocked();
    return;
  }
  w.document.open();
  w.document.write(html + '<script>window.onload=function(){setTimeout(function(){window.print()},400)}<\/script>');
  w.document.close();
};

// أنواع الصيانة المعروفة (تُستخدم في فلاتر تقرير الصيانة)
const MAINT_TYPES = [
  'فحص دوري وعزل',
  'تشحيم',
  'تغيير شربون',
  'عمرة / لف موتور',
  'إصلاح عطل طارئ بالوردية',
  'تغيير فلاتر',
  'تنضيف بالهواء'
];

/* ---------- تقرير حرارة المواتير المستقل (بشكل نموذج الفحص اليومي الورقي) ---------- */
const buildTempReportHTML = ({ factoryName, logoUrl, dateGB, shiftLabel, motors, tempLogs, maintTech }) => {
  const dayName = new Date(convertGBToISO(dateGB) + 'T00:00:00').toLocaleDateString('ar-EG', { weekday: 'long' });
  const batches = (tempLogs || []).filter(
    (b) => b.date === dateGB && (shiftLabel === 'الكل' || b.shift === shiftLabel)
  );
  // دمج قراءات الموتور الواحد من دفعات اليوم (الأحدث أولاً — أول قيمة غير فاضية هي الأحدث)
  const byMotor = {};
  batches.forEach((b) => {
    (b.readings || []).forEach((r) => {
      const cur = byMotor[r.motorId] || {};
      ['bodyTemp1', 'bodyTemp2', 'frontBearingTemp', 'rearBearingTemp', 'amps', 'bodyTemp', 'bearingTemp'].forEach((k) => {
        if ((cur[k] === undefined || cur[k] === '') && r[k] !== undefined && r[k] !== '') cur[k] = r[k];
      });
      if (!cur.recordedBy && b.recordedBy) cur.recordedBy = b.recordedBy;
      if (!cur.supervisor && b.supervisor) cur.supervisor = b.supervisor;
      byMotor[r.motorId] = cur;
    });
  });
  const hasMaint = (m, t) =>
    (m.logs || []).some(
      (lg) => lg.date === dateGB && (shiftLabel === 'الكل' || lg.shift === shiftLabel) && (lg.type || '').trim() === t
    );
  const cell = (v) => `<td>${v === undefined || v === '' ? '' : esc(v)}</td>`;
  const v = (a, b) => (a === undefined || a === '' ? b : a);
  const rowsHtml = (motors || [])
    .map((m) => {
      const r = byMotor[m.id] || {};
      return `<tr>
  <td class="mn">${esc(m.locationName || `ستاند ${m.stand}`)}<span class="mc">${esc(m.code)}</span></td>
  ${cell(v(r.bodyTemp1, r.bodyTemp))}${cell(r.bodyTemp2)}${cell(r.rearBearingTemp)}${cell(v(r.frontBearingTemp, r.bearingTemp))}${cell(r.amps)}
  <td class="ck">${hasMaint(m, 'تغيير فلاتر') ? '\u2714' : ''}</td>
  <td class="ck">${hasMaint(m, 'تنضيف بالهواء') ? '\u2714' : ''}</td>
</tr>`;
    })
    .join('');
  return `<html dir="rtl" lang="ar"><head><meta charset="UTF-8">
<title>تقرير حرارة المواتير - ${esc(factoryName)} - ${esc(dateGB)}</title>
<style>
  body{font-family:Tahoma,Arial,'Noto Sans Arabic',sans-serif;color:#0f172a;padding:12px}
  .head{width:100%;border-collapse:collapse;margin-bottom:10px}
  .head td{border:1.5px solid #0f172a;text-align:center;vertical-align:middle;padding:6px}
  .head .t{font-size:17px;font-weight:900}
  .head .t small{display:block;font-size:12px;margin-top:2px}
  .head .meta{font-size:11px;font-weight:bold;line-height:1.9}
  .head img{max-height:48px;max-width:120px}
  table.data{border-collapse:collapse;width:100%;font-size:12px}
  table.data th{background:#e2e8f0;border:1px solid #0f172a;padding:5px 3px;font-size:11px}
  table.data td{border:1px solid #0f172a;padding:4px 3px;text-align:center;font-family:Consolas,monospace;font-weight:bold;min-width:34px}
  table.data td.mn{text-align:right;font-family:Tahoma,Arial,'Noto Sans Arabic',sans-serif;padding-right:6px}
  table.data td.mn .mc{display:block;color:#64748b;font-size:9px}
  table.data td.ck{font-size:13px}
  table.data tr.grp td{background:#f1f5f9;font-weight:900;text-align:center;border:1px solid #0f172a;padding:4px;font-family:Tahoma,Arial,'Noto Sans Arabic',sans-serif}
  .foot{display:flex;justify-content:space-between;gap:12px;margin-top:16px;font-size:12px;font-weight:bold}
  .foot div{border-top:1px solid #0f172a;padding-top:4px;min-width:150px;text-align:center}
  @page{size:A4;margin:10mm} @media print{ body{padding:0} thead{display:table-header-group} tr{break-inside:avoid} }
</style></head><body>
<table class="head"><tr>
  <td style="width:26%">${logoUrl ? `<img src="${esc(logoUrl)}" alt="logo"><br>` : ''}<b>${esc(factoryName)}</b></td>
  <td class="t">DAILY INSPECTION REPORT<small>تقرير فحص حرارة المواتير اليومي</small></td>
  <td style="width:26%" class="meta">Document Code: GS-ELD/F-002<br>التاريخ: ${esc(dateGB)} (${esc(dayName)})<br>${shiftLabel === 'الكل' ? 'كل الورديات' : esc(shiftLabel)}</td>
</tr></table>
<table class="data">
<thead>
<tr class="grp"><td colspan="8">المواتير — الحرارة °C وصيانة الوردية</td></tr>
<tr><th>الموتور</th><th>جسم المحرك (1)</th><th>جسم المحرك (2)</th><th>البلي الخلفي</th><th>البلي الأمامي</th><th>الأمبير A</th><th>الفلاتر</th><th>تنضيف بالهوا</th></tr>
</thead>
<tbody>${rowsHtml}</tbody>
</table>
<div class="foot">
  <div>فني صيانة الوردية<br>${esc(maintTech || '................')}</div>
  <div>ملاحظ الوردية<br>................</div>
  <div>رئيس الوردية<br>................</div>
  <div>التاريخ<br>${esc(dateGB)}</div>
</div>
</body></html>`;
};

/* ---------- تقرير الصيانة المستقل مع فلترة بالنوع والوردية والفترة ---------- */
const buildMaintReportHTML = ({ factoryName, logoUrl, typeLabel, shiftLabel, fromGB, toGB, rows }) => {
  const filters = [
    `نوع الصيانة: ${typeLabel}`,
    `الوردية: ${shiftLabel}`,
    fromGB || toGB ? `الفترة: ${fromGB || '...'} - ${toGB || '...'}` : 'كل التواريخ'
  ].join(' | ');
  const rowsHtml = rows
    .map((r) => {
      const cells = [
        r.date || '',
        r.shift || '',
        r.locationName || '',
        r.motorCode || '',
        (r.type || '').trim(),
        r.notes || '',
        r.techName || r.by || '',
        r.supervisorName || ''
      ]
        .map((c) => `<td>${esc(c)}</td>`)
        .join('');
      return `<tr>${cells}</tr>`;
    })
    .join('');
  return `<html dir="rtl" lang="ar"><head><meta charset="UTF-8">
<title>تقرير صيانة المواتير - ${esc(factoryName)}</title>
<style>
  body{font-family:Tahoma,Arial,'Noto Sans Arabic',sans-serif;color:#0f172a;padding:12px}
  .head{width:100%;border-collapse:collapse;margin-bottom:10px}
  .head td{border:1.5px solid #0f172a;text-align:center;vertical-align:middle;padding:6px}
  .head .t{font-size:17px;font-weight:900}
  .head img{max-height:48px;max-width:120px}
  .meta{color:#334155;font-size:11px;font-weight:bold;margin-bottom:8px}
  table.data{border-collapse:collapse;width:100%;font-size:11px}
  table.data th{background:#e2e8f0;border:1px solid #0f172a;padding:5px 3px}
  table.data td{border:1px solid #0f172a;padding:4px;text-align:center}
  table.data tr:nth-child(even) td{background:#f8fafc}
  .tot td{font-weight:900;background:#e2e8f0!important}
  @page{size:A4;margin:10mm} @media print{ body{padding:0} thead{display:table-header-group} tr{break-inside:avoid} }
</style></head><body>
<table class="head"><tr>
  <td style="width:26%">${logoUrl ? `<img src="${esc(logoUrl)}" alt="logo"><br>` : ''}<b>${esc(factoryName)}</b></td>
  <td class="t">تقرير صيانة المواتير</td>
  <td style="width:26%" class="meta">تاريخ الطباعة: ${esc(new Date().toLocaleString('ar-EG'))}</td>
</tr></table>
<div class="meta">${esc(filters)}</div>
<table class="data">
<thead>
<tr><th>التاريخ</th><th>الوردية</th><th>الموقع/الستاند</th><th>كود الموتور</th><th>نوع الصيانة</th><th>التفاصيل</th><th>الفني المنفذ</th><th>الملاحظ</th></tr>
</thead>
<tbody>${rowsHtml}
<tr class="tot"><td colspan="8">إجمالي السجلات: ${rows.length}</td></tr>
</tbody>
</table>
</body></html>`;
};

/* ======================================================
   6. مكونات واجهة مشتركة صغيرة
   ====================================================== */
const LiveClock = () => {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="flex bg-slate-800 border border-slate-700 rounded-lg px-2 py-0.5 items-center gap-1.5 shadow-inner">
      <Clock className="w-3 h-3 text-blue-400" />
      <div className="flex flex-col items-center leading-none">
        <span className="text-[10px] font-mono font-bold text-slate-100" dir="ltr">
          {time.toLocaleTimeString('en-US', { hour12: true, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
        </span>
      </div>
    </div>
  );
};

const Overlay = ({ z = 50, children }) => (
  <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-2.5 sm:p-4 backdrop-blur-sm" style={{ zIndex: z }}>
    {children}
  </div>
);

export default function FactoryPortal({ onBack, factoryConfig }) {
  /* ------------------------------------------------------------
     [أ-1] الأساس: الهوية والصلاحيات والنوافذ العامة (الحالة)
     ------------------------------------------------------------ */
  // معرف قاعدة البيانات المستقل الخاص بهذا المصنع تحديداً
  const appId = factoryConfig?.id || 'al-gioshy-steel-rolls';
  const factoryName = factoryConfig?.name || 'شركة الجيوشي للصلب';

  const getInitialTabFromUrl = () => {
    const params = new URLSearchParams(window.location.search);
    return params.get('tab') || 'dashboard';
  };

  const [currentUser, setCurrentUser] = useState('none');
  const [loggedEmployeeName, setLoggedEmployeeName] = useState('');
  const [isSuperAdmin, setIsSuperAdmin] = useState(false);
  const [loggedEmployeeId, setLoggedEmployeeId] = useState('');
  // الدخول من الرابط المباشر للموظفين (?via=link): يُخفي زر العودة للبوابة الرئيسية. الدخول العادي من البوابة لا يتأثر
  const [isLinkEntry] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('via') === 'link' || (!!params.get('f') && window.history.state === null);
  });
  const [activeTab, setActiveTabState] = useState(getInitialTabFromUrl);
  const [userAuth, setUserAuth] = useState(null);

  const isManagerLike = currentUser === 'manager' || currentUser === 'admin';
  const roleLabel =
    loggedEmployeeName || (currentUser === 'tech' ? 'فني تشغيل' : currentUser === 'manager' ? 'مدير المصنع' : 'أدمن');
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [customLogo, setCustomLogo] = useState('');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [tempLogoUrl, setTempLogoUrl] = useState('');

  const [adminState, setAdminState] = useState({
    isMaintenance: false,
    maintenanceMessage: 'الموقع مغلق حالياً لإجراء تحديثات وصيانة للنظام.. يرجى المحاولة لاحقاً.',
    techCode: factoryConfig?.techCode || '1111',
    managerCode: factoryConfig?.managerCode || '2222',
    adminCode: factoryConfig?.adminCode || '9999',
    visitsCount: 0,
    lastVisit: ''
  });
  const [loginPrompt, setLoginPrompt] = useState({ isOpen: false, role: '', codeInput: '', error: '' });
  const [quickPinInput, setQuickPinInput] = useState('');
  const [quickPinError, setQuickPinError] = useState('');
  const [visitLogged, setVisitLogged] = useState(false);

  const [modal, setModal] = useState({ isOpen: false, type: '', title: '', message: '', onConfirm: null });
  const closeBox = () => setModal((m) => ({ ...m, isOpen: false }));
  const showAlert = (title, message) => setModal({ isOpen: true, type: 'alert', title, message, onConfirm: null });
  const showConfirm = (title, message, onConfirm) =>
    setModal({ isOpen: true, type: 'confirm', title, message, onConfirm });

  /* ------------------------------------------------------------
     [ب-1] الدرفيل والتتبع والتسجيل: الحالة (الستاندات، الورديات، الطلبات، النوافذ)
     ------------------------------------------------------------ */
  const [stands, setStands] = useState(() => buildInitialStandsForFactory(appId));
  const [shiftBillets, setShiftBillets] = useState('');
  const [productionArchive, setProductionArchive] = useState([]);
  const [passChanges, setPassChanges] = useState([]);
  const [pendingList, setPendingList] = useState([]);
  const [handoverNotesList, setHandoverNotesList] = useState([]);
  const [whatsappModalOpen, setWhatsappModalOpen] = useState(false);

  const [billetWeight, setBilletWeight] = useState(0.75);
  const [selectedProductSize, setSelectedProductSize] = useState('16');

  const [addStandOpen, setAddStandOpen] = useState(false);
  const [newStandForm, setNewStandForm] = useState({
    name: '',
    type: 'بيضاوي',
    rollCode: '',
    diameter: '340',
    hardness: '48 HRC',
    totalPasses: 12,
    maxLimit: 1500
  });
  const [targetStandsCount, setTargetStandsCount] = useState(12);

  const [rollModal, setRollModal] = useState({ isOpen: false, standIndex: null, isEditingInfo: false });
  const [rollEditForm, setRollEditForm] = useState({
    name: '',
    rollCode: '',
    diameter: '',
    hardness: '',
    type: '',
    entryDate: '',
    totalPasses: 6
  });

  const [resetModal, setResetModal] = useState({ isOpen: false, standIndex: null });
  const [resetBillets, setResetBillets] = useState('');
  const [resetNotes, setResetNotes] = useState('');
  const [resetDateInput, setResetDateInput] = useState('');
  const [resetShiftInput, setResetShiftInput] = useState('');
  const [resetTargetPass, setResetTargetPass] = useState(null);

  const [historyModal, setHistoryModal] = useState({ isOpen: false, standId: null });
  const [approvalsOpen, setApprovalsOpen] = useState(false);
  const [reqEdits, setReqEdits] = useState({});
  const [dupModal, setDupModal] = useState(false);

  /* ---------- اليوم الإنتاجي والورديات + زر "الآن" ---------- */
  const getInitialProductionState = () => {
    const now = new Date();
    const hour = now.getHours();
    const prodDate = new Date(now);
    if (hour < 8) prodDate.setDate(prodDate.getDate() - 1);
    const fri = prodDate.getDay() === 5;
    let initialShift = '';
    if (fri) initialShift = hour >= 8 && hour < 20 ? SHIFTS_FRIDAY[0] : SHIFTS_FRIDAY[1];
    else if (hour >= 8 && hour < 16) initialShift = SHIFTS_NORMAL[0];
    else if (hour >= 16 && hour < 24) initialShift = SHIFTS_NORMAL[1];
    else initialShift = SHIFTS_NORMAL[2];
    return { prodDate, initialShift };
  };
  const initState = getInitialProductionState();
  const [currentProdDate, setCurrentProdDate] = useState(initState.prodDate);
  const [selectedShift, setSelectedShift] = useState(initState.initialShift);

  const isFriday = currentProdDate.getDay() === 5;
  const availableShifts = shiftsFor(isFriday);

  /* ------------------------------------------------------------
     [ج-1] المواتير: الحالة (السجل، الحرارة، الصيانة)
     ------------------------------------------------------------ */
  const [motorsList, setMotorsList] = useState([]);
  const [tempShiftLogs, setTempShiftLogs] = useState([]);

  const [motorSubView, setMotorSubView] = useState('cards');
  const [motorCategoryFilter, setMotorCategoryFilter] = useState('all');
  const [motorSearchId, setMotorSearchId] = useState('');
  const [selectedMotorForLog, setSelectedMotorForLog] = useState(null);
  const [motorLogView, setMotorLogView] = useState('maint'); // 'maint' = سجل الصيانة | 'temps' = سجل الحرارة
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
  const [shiftTempInputs, setShiftTempInputs] = useState({});
  const [shiftTempTech, setShiftTempTech] = useState('');
  const [shiftTempSupervisor, setShiftTempSupervisor] = useState('');
  // جولة القياس الحالية: 1 = بداية الوردية (جسم + بلي + أمبير) | 2 = وسط الوردية (جسم فقط)
  const [tempRound, setTempRound] = useState(1);
  // مسؤول صيانة كل وردية (افتراضي المصنع، يُعدَّل من الإعدادات ويُحفظ في settingsState)
  const [maintShiftTechs, setMaintShiftTechs] = useState({
    'الوردية الأولى': 'أحمد مصطفى',
    'الوردية الثانية': 'خميس',
    'الوردية الثالثة': 'يحيى'
  });
  const [tempMaintTechs, setTempMaintTechs] = useState(null);
  const [airBlowSelected, setAirBlowSelected] = useState({});
  // فلاتر تقارير الكهربا
  const [tempReportDateISO, setTempReportDateISO] = useState(() => formatDateToISO(new Date()));
  const [tempReportShift, setTempReportShift] = useState('الكل');
  const [maintReportType, setMaintReportType] = useState('الكل');
  const [maintReportShift, setMaintReportShift] = useState('الكل');
  const [maintReportFromISO, setMaintReportFromISO] = useState('');
  const [maintReportToISO, setMaintReportToISO] = useState('');

  const [newMotor, setNewMotor] = useState({
    category: 'rolling',
    stand: '1',
    locationName: 'ستاند 1',
    code: '',
    brand: 'Siemens SINAMICS',
    kw: '',
    rpm: '',
    amps: '',
    gearRatio: '',
    megger: '550 MΩ',
    bodyTemp: '50',
    bearingTemp: '55',
    status: 'يعمل بحالة ممتازة'
  });

  /* ------------------------------------------------------------
     [د-1] الباقي: الحالة (الأعطال، ورشة الدرافيل، الوصفات، الموظفين)
     ------------------------------------------------------------ */
  const [downtimesList, setDowntimesList] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [recipesList, setRecipesList] = useState([]);
  const [rollShopList, setRollShopList] = useState([]);

  const [downFilterCat, setDownFilterCat] = useState('الكل');
  const [downSearchQuery, setDownSearchQuery] = useState('');
  const [downForm, setDownForm] = useState({
    category: 'كهرباء وكنترول',
    standName: 'عام / الخط بالكامل',
    durationMins: '',
    reason: '',
    actionTaken: '',
    techName: ''
  });

  const [editingRollId, setEditingRollId] = useState(null);
  const [rollFormOpen, setRollFormOpen] = useState(false);
  const [newRollItem, setNewRollItem] = useState({
    code: '',
    standName: 'ستاند 1',
    material: 'SG Iron / HSS',
    maxDia: 400,
    currentDia: 390,
    minScrapDia: 340,
    status: 'جاهز بالورشة (جديد)'
  });

  const [newStaffForm, setNewStaffForm] = useState({
    name: '',
    pin: '',
    role: 'tech',
    jobTitle: 'مشغل غرفة تحكم / فني إنتاج',
    access: [...ASSIGNABLE_TAB_KEYS]
  });

  /* ------------------------------------------------------------
     [أ-2] الأساس: التنقل، مزامنة Firebase، الحفظ، الإعدادات، الدخول
     ------------------------------------------------------------ */
  /* ---------- صلاحيات الأقسام للموظف الحالي (تتحدث فوراً مع تعديل المدير) ---------- */
  const loggedEmployee = loggedEmployeeId ? staffList.find((emp) => emp.id === loggedEmployeeId) : null;
  const allowedTabs = loggedEmployeeId ? (loggedEmployee ? accessFor(loggedEmployee) : []) : null;
  const canAccessTab = (tab) => !allowedTabs || allowedTabs.includes(tab);
  // الملاحظ: حسابه يُسجَّل كملاحظ تلقائياً ويكتب معه أسماء الفنيين، وغيره يُسجَّل كفني ويكتب معه اسم الملاحظ
  const isSupervisorLogin = !!loggedEmployee && loggedEmployee.role === 'supervisor';

  // تثبيت علامة الرابط المباشر في العنوان حتى لا يعود زر الرجوع بعد تحديث الصفحة
  useEffect(() => {
    if (!isLinkEntry) return;
    const params = new URLSearchParams(window.location.search);
    if (params.get('via') === 'link') return;
    params.set('via', 'link');
    window.history.replaceState(window.history.state, '', `?${params.toString()}`);
  }, []);

  /* ---------- نظام الروابط والتنقل بزر الرجوع في الموبايل ---------- */
  const setActiveTab = (newTab) => {
    setActiveTabState(newTab);
    const params = new URLSearchParams(window.location.search);
    params.set('mode', 'factory');
    params.set('f', appId);
    params.set('tab', newTab);
    window.history.pushState({ mode: 'factory', f: appId, tab: newTab }, '', `?${params.toString()}`);
  };

  useEffect(() => {
    const handlePopState = () => {
      if (resetModal.isOpen) {
        setResetModal({ isOpen: false, standIndex: null });
        return;
      }
      if (rollModal.isOpen) {
        setRollModal({ isOpen: false, standIndex: null, isEditingInfo: false });
        return;
      }
      if (selectedMotorForLog) {
        setSelectedMotorForLog(null);
        return;
      }
      if (whatsappModalOpen) {
        setWhatsappModalOpen(false);
        return;
      }
      if (approvalsOpen) {
        setApprovalsOpen(false);
        return;
      }
      const params = new URLSearchParams(window.location.search);
      const urlTab = params.get('tab');
      if (urlTab) {
        setActiveTabState(urlTab);
      } else if (params.get('mode') !== 'factory' && onBack && !isLinkEntry) {
        onBack();
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [resetModal.isOpen, rollModal.isOpen, selectedMotorForLog, whatsappModalOpen, approvalsOpen, onBack]);

  const secretTapCount = useRef(0);
  const secretTapTimer = useRef(null);
  const handleSecretAdminTrigger = () => {
    secretTapCount.current += 1;
    if (secretTapTimer.current) clearTimeout(secretTapTimer.current);
    if (secretTapCount.current >= 5) {
      secretTapCount.current = 0;
      if (isSuperAdmin) {
        setCurrentUser('admin');
        setActiveTab('staff');
      } else setLoginPrompt({ isOpen: true, role: 'admin', codeInput: '', error: '' });
    } else {
      secretTapTimer.current = setTimeout(() => {
        secretTapCount.current = 0;
      }, 1500);
    }
  };

  /* ---------- العزل الكامل لقاعدة البيانات لكل مصنع (Multi-Tenant Strict Isolation) ---------- */
  useEffect(() => {
    if (!auth) {
      setIsDataLoaded(true);
      return;
    }
    signInAnonymously(auth).catch((e) => console.error(e));
    const unsub = onAuthStateChanged(auth, setUserAuth);
    return () => unsub();
  }, []);

  useEffect(() => {
    // تصفير جميع الحالات فور تغير معرف المصنع (appId) لمنع أي تداخل لحظي بين مصنعين
    setIsDataLoaded(false);
    setStands(buildInitialStandsForFactory(appId));
    setProductionArchive([]);
    setPassChanges([]);
    setPendingList([]);
    setDowntimesList([]);
    setHandoverNotesList([]);
    setMotorsList([]);
    setTempShiftLogs([]);
    setStaffList([]);
    setRecipesList([]);
    setRollShopList([]);
    setCustomLogo('');
    setBilletWeight(0.75);
    setSelectedProductSize('16');

    if (!userAuth || !db) return;

    // مسار معزول تماماً في Firestore خاص بـ appId فقط
    const ref = (docName) => doc(db, 'factory', appId, 'data', docName);
    const standsRef = ref('standsState'),
      archiveRef = ref('archiveState'),
      passChangesRef = ref('passChangesState'),
      settingsRef = ref('settingsState'),
      adminRef = ref('adminState'),
      pendingRef = ref('pendingState'),
      downtimesRef = ref('downtimesState'),
      motorsRef = ref('motorsState'),
      recipesRef = ref('recipesState'),
      rollShopRef = ref('rollShopState'),
      staffRef = ref('staffState');

    const u1 = onSnapshot(standsRef, (snap) => {
      if (snap.exists() && Array.isArray(snap.data().standsList)) {
        const list = normalizeList(snap.data().standsList, appId);
        setStands(list);
        setTargetStandsCount(list.length);
      } else {
        const init = buildInitialStandsForFactory(appId);
        setDoc(standsRef, { factoryId: appId, factoryName, standsList: init });
        setStands(init);
        setTargetStandsCount(init.length);
      }
      setIsDataLoaded(true);
    });

    const u2 = onSnapshot(archiveRef, (snap) => {
      if (snap.exists()) setProductionArchive(snap.data().archiveList || []);
      else setDoc(archiveRef, { factoryId: appId, archiveList: [] });
    });

    const u3 = onSnapshot(passChangesRef, (snap) => {
      if (snap.exists()) setPassChanges(snap.data().passChangesList || []);
      else setDoc(passChangesRef, { factoryId: appId, passChangesList: [] });
    });

    const u4 = onSnapshot(settingsRef, (snap) => {
      if (snap.exists()) {
        const d = snap.data();
        setBilletWeight(d.billetWeight || 0.75);
        setCustomLogo(d.logoUrl || '');
        setSelectedProductSize(d.selectedProductSize || '16');
        if (d.maintTechs && typeof d.maintTechs === 'object') {
          setMaintShiftTechs((prev) => ({ ...prev, ...d.maintTechs }));
        }
      } else {
        setDoc(settingsRef, { factoryId: appId, billetWeight: 0.75, logoUrl: '', selectedProductSize: '16' });
      }
    });

    const u5 = onSnapshot(adminRef, (snap) => {
      if (snap.exists()) {
        setAdminState((prev) => ({ ...prev, ...snap.data() }));
      } else {
        const def = {
          factoryId: appId,
          factoryName,
          isMaintenance: false,
          maintenanceMessage: 'الموقع مغلق حالياً لإجراء تحديثات وصيانة للنظام.. يرجى المحاولة لاحقاً.',
          techCode: factoryConfig?.techCode || '1111',
          managerCode: factoryConfig?.managerCode || '2222',
          adminCode: factoryConfig?.adminCode || '9999',
          visitsCount: 1,
          lastVisit: new Date().toLocaleString('ar-EG')
        };
        setDoc(adminRef, def);
        setAdminState(def);
      }
    });

    const u6 = onSnapshot(pendingRef, (snap) => {
      if (snap.exists()) setPendingList(snap.data().pendingList || []);
      else setDoc(pendingRef, { factoryId: appId, pendingList: [] });
    });

    const u7 = onSnapshot(downtimesRef, (snap) => {
      if (snap.exists()) {
        setDowntimesList(snap.data().downtimes || []);
        setHandoverNotesList(snap.data().handovers || []);
      } else {
        setDoc(downtimesRef, { factoryId: appId, downtimes: [], handovers: [] });
      }
    });

    const u8 = onSnapshot(motorsRef, (snap) => {
      if (snap.exists()) {
        setMotorsList(snap.data().motors || []);
        setTempShiftLogs(snap.data().tempShiftLogs || []);
      } else {
        // كل مصنع جديد يبدأ بسجل مواتير فارغ أو مبدئي خاص به فقط
        const initMotors = [
          {
            id: `m1_${appId}`,
            category: 'rolling',
            stand: '1',
            locationName: 'ستاند 1',
            code: 'MTR-ST1',
            brand: 'Siemens / ABB',
            kw: '400',
            rpm: '1500',
            amps: '700',
            megger: '550 MΩ',
            bodyTemp: '50',
            bearingTemp: '55',
            status: 'يعمل بحالة ممتازة',
            dateAdded: new Date().toLocaleDateString('en-GB'),
            logs: []
          }
        ];
        setDoc(motorsRef, { factoryId: appId, motors: initMotors, tempShiftLogs: [] });
        setMotorsList(initMotors);
      }
    });

    const u9 = onSnapshot(recipesRef, (snap) => {
      if (snap.exists() && Array.isArray(snap.data().recipes)) {
        setRecipesList(snap.data().recipes);
      } else {
        const initRecipes = [
          {
            id: `rec16_${appId}`,
            name: 'وصفة حديد تسليح 16 مم',
            productSize: '16',
            billetSize: '130×130 مم',
            furnaceTemp: '1150 °C',
            finishSpeed: '11.5 m/s',
            qtbPressure: '8.5 bar',
            qtbFlow: '420 m³/h',
            flyingShearLen: '48 متر',
            activeStandsCount: 12,
            notes: 'ضبط اللوبر ومراجعة خلوص الفنش.'
          }
        ];
        setDoc(recipesRef, { factoryId: appId, recipes: initRecipes });
        setRecipesList(initRecipes);
      }
    });

    const u10 = onSnapshot(rollShopRef, (snap) => {
      if (snap.exists() && Array.isArray(snap.data().rolls)) {
        setRollShopList(snap.data().rolls);
      } else {
        setDoc(rollShopRef, { factoryId: appId, rolls: [] });
        setRollShopList([]);
      }
    });

    const u11 = onSnapshot(staffRef, (snap) => {
      if (snap.exists() && Array.isArray(snap.data().staff)) {
        setStaffList(snap.data().staff);
      } else {
        const initStaff = [
          {
            id: `emp1_${appId}`,
            name: 'فني غرفة التحكم',
            pin: factoryConfig?.techCode || '1111',
            role: 'tech',
            jobTitle: 'مشغل كنترول / فني إنتاج',
            active: true
          }
        ];
        setDoc(staffRef, { factoryId: appId, staff: initStaff });
        setStaffList(initStaff);
      }
    });

    return () => {
      u1(); u2(); u3(); u4(); u5(); u6(); u7(); u8(); u9(); u10(); u11();
    };
  }, [userAuth, appId, factoryName]);

  useEffect(() => {
    if (isDataLoaded && userAuth && db && !visitLogged) {
      setVisitLogged(true);
      setDoc(
        doc(db, 'factory', appId, 'data', 'adminState'),
        { visitsCount: (adminState.visitsCount || 0) + 1, lastVisit: new Date().toLocaleString('ar-EG') },
        { merge: true }
      ).catch((e) => console.error(e));
    }
  }, [isDataLoaded, userAuth, visitLogged, appId]);

  /* ---------- الحفظ السحابي الموحد في المسار الخاص بالمصنع فقط ---------- */
  const save = async ({
    stands: s,
    archive,
    weight,
    logo,
    changes,
    productSize,
    admin,
    pending,
    downtimes,
    handovers,
    motors,
    tempLogs,
    recipes,
    rollShop,
    staff,
    maintTechs
  } = {}) => {
    if (userAuth && db) {
      try {
        const ref = (name) => doc(db, 'factory', appId, 'data', name);
        if (s !== undefined) await setDoc(ref('standsState'), { factoryId: appId, standsList: s }, { merge: true });
        if (archive !== undefined) await setDoc(ref('archiveState'), { factoryId: appId, archiveList: archive }, { merge: true });
        if (changes !== undefined) await setDoc(ref('passChangesState'), { factoryId: appId, passChangesList: changes }, { merge: true });
        if (pending !== undefined) await setDoc(ref('pendingState'), { factoryId: appId, pendingList: pending }, { merge: true });
        if (admin !== undefined) await setDoc(ref('adminState'), { factoryId: appId, ...admin }, { merge: true });
        if (downtimes !== undefined || handovers !== undefined) {
          await setDoc(
            ref('downtimesState'),
            {
              factoryId: appId,
              downtimes: downtimes !== undefined ? downtimes : downtimesList,
              handovers: handovers !== undefined ? handovers : handoverNotesList
            },
            { merge: true }
          );
        }
        if (motors !== undefined || tempLogs !== undefined) {
          await setDoc(
            ref('motorsState'),
            {
              factoryId: appId,
              motors: motors !== undefined ? motors : motorsList,
              tempShiftLogs: tempLogs !== undefined ? tempLogs : tempShiftLogs
            },
            { merge: true }
          );
        }
        if (recipes !== undefined) await setDoc(ref('recipesState'), { factoryId: appId, recipes }, { merge: true });
        if (rollShop !== undefined) await setDoc(ref('rollShopState'), { factoryId: appId, rolls: rollShop }, { merge: true });
        if (staff !== undefined) await setDoc(ref('staffState'), { factoryId: appId, staff }, { merge: true });
        const upd = { factoryId: appId };
        if (weight !== undefined) upd.billetWeight = weight;
        if (logo !== undefined) upd.logoUrl = logo;
        if (productSize !== undefined) upd.selectedProductSize = productSize;
        if (maintTechs !== undefined) upd.maintTechs = maintTechs;
        if (Object.keys(upd).length > 1) await setDoc(ref('settingsState'), upd, { merge: true });
      } catch (e) {
        console.error('Save error:', e);
      }
    }
  };

  /* ---------- إدارة شعار المصنع وتصفير الستاندات والأرشيف ---------- */
  const openSettingsModal = () => {
    setTempLogoUrl(customLogo);
    setTempMaintTechs({ ...maintShiftTechs });
    setIsSettingsOpen(true);
  };
  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 1024 * 1024) {
      showAlert('خطأ', 'حجم الصورة كبير جداً. يرجى اختيار صورة أقل من 1 ميجابايت.');
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => setTempLogoUrl(reader.result);
    reader.readAsDataURL(file);
  };
  const handleSaveSettings = () => {
    const payload = {};
    if (tempLogoUrl && tempLogoUrl.trim() !== '') payload.logo = tempLogoUrl.trim();
    if (tempMaintTechs) {
      const cleaned = {};
      Object.entries(tempMaintTechs).forEach(([k, v]) => {
        cleaned[k] = String(v || '').trim();
      });
      setMaintShiftTechs((prev) => ({ ...prev, ...cleaned }));
      payload.maintTechs = cleaned;
    }
    if (Object.keys(payload).length > 0) save(payload);
    setIsSettingsOpen(false);
  };

  const handleQuickPinLogin = (e) => {
    e.preventDefault();
    const code = quickPinInput.trim();
    if (!code) return;

    if (code === adminState.adminCode) {
      setIsSuperAdmin(true);
      setLoggedEmployeeName('م. بسام (Admin)');
      setCurrentUser('admin');
      setActiveTab('dashboard');
      setQuickPinInput('');
      return;
    }

    if (code === adminState.managerCode) {
      setIsSuperAdmin(false);
      setLoggedEmployeeName('مدير المصنع');
      setCurrentUser('manager');
      setActiveTab('dashboard');
      setQuickPinInput('');
      return;
    }

    const foundEmp = staffList.find((emp) => emp.pin === code);
    if (foundEmp) {
      if (!foundEmp.active) {
        setQuickPinError('عفواً، تم إيقاف صلاحية دخول هذا الحساب بواسطة مدير المصنع.');
        return;
      }
      if (adminState.isMaintenance && foundEmp.role !== 'manager') {
        setQuickPinError('النظام في وضع الصيانة حالياً.');
        return;
      }
      const access = accessFor(foundEmp);
      if (access && access.length === 0) {
        setQuickPinError('لم يتم منح هذا الحساب صلاحية دخول أي قسم. تواصل مع مدير المصنع.');
        return;
      }
      setIsSuperAdmin(false);
      setLoggedEmployeeName(foundEmp.name);
      setLoggedEmployeeId(foundEmp.id);
      setCurrentUser(foundEmp.role === 'manager' ? 'manager' : 'tech');
      setActiveTab(firstTabOf(access));
      setQuickPinInput('');
      return;
    }

    if (code === adminState.techCode) {
      if (adminState.isMaintenance) {
        setQuickPinError('النظام في وضع الصيانة حالياً.');
        return;
      }
      setIsSuperAdmin(false);
      setLoggedEmployeeName('فني الإنتاج');
      setCurrentUser('tech');
      setActiveTab('dashboard');
      setQuickPinInput('');
      return;
    }

    setQuickPinError('الكود غير صحيح! تأكد من الكود الشخصي الخاص بك.');
  };

  const closeLogin = () => setLoginPrompt({ isOpen: false, role: '', codeInput: '', error: '' });

  const handleVerifyAccessCode = (e) => {
    e.preventDefault();
    const { role, codeInput } = loginPrompt;
    const code = codeInput.trim();
    if (code === adminState.adminCode) {
      setIsSuperAdmin(true);
      setLoggedEmployeeName('م. بسام (Admin)');
      setCurrentUser(role === 'admin' ? 'admin' : role);
      setActiveTab('dashboard');
      closeLogin();
      return;
    }
    const foundEmp = staffList.find((emp) => emp.pin === code && emp.active);
    if (foundEmp && (foundEmp.role === role || (foundEmp.role === 'supervisor' && role === 'tech') || foundEmp.role === 'manager')) {
      const access = accessFor(foundEmp);
      if (access && access.length === 0) {
        setLoginPrompt((p) => ({ ...p, error: 'لم يتم منح هذا الحساب صلاحية دخول أي قسم.' }));
        return;
      }
      setIsSuperAdmin(false);
      setLoggedEmployeeName(foundEmp.name);
      setLoggedEmployeeId(foundEmp.id);
      setCurrentUser(foundEmp.role === 'supervisor' ? 'tech' : foundEmp.role);
      setActiveTab(firstTabOf(access));
      closeLogin();
      return;
    }
    const ok = (role === 'tech' && code === adminState.techCode) || (role === 'manager' && code === adminState.managerCode);
    if (!ok) {
      setLoginPrompt((p) => ({ ...p, error: 'الكود غير صحيح!' }));
      return;
    }
    setIsSuperAdmin(false);
    setLoggedEmployeeName(role === 'manager' ? 'مدير المصنع' : 'فني الإنتاج');
    setCurrentUser(role);
    setActiveTab('dashboard');
    closeLogin();
  };

  const handleLogout = () => {
    setCurrentUser('none');
    setLoggedEmployeeName('');
    setLoggedEmployeeId('');
    setIsSuperAdmin(false);
    setActiveTab('dashboard');
  };

  const loginModalJSX = loginPrompt.isOpen && (
    <Overlay z={90}>
      <form onSubmit={handleVerifyAccessCode} className="bg-slate-800 border border-slate-600 rounded-xl max-w-xs w-full p-5 shadow-2xl flex flex-col gap-3 text-white">
        <div className="flex justify-between items-center border-b border-slate-700 pb-2">
          <h3 className="font-bold text-sm flex items-center gap-1.5">
            <Key className="w-4 h-4 text-blue-400" /> كود الدخول
          </h3>
          <button type="button" onClick={closeLogin} className="text-slate-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
        <input
          type="password"
          autoFocus
          value={loginPrompt.codeInput}
          onChange={(e) => setLoginPrompt((p) => ({ ...p, codeInput: e.target.value, error: '' }))}
          placeholder="أدخل الكود الشخصي..."
          className="w-full bg-slate-900 border border-slate-600 rounded-lg p-2.5 text-center font-mono text-lg tracking-widest text-white outline-none"
        />
        {loginPrompt.error && (
          <p className="text-red-400 text-xs font-bold text-center bg-red-950/50 border border-red-800 p-1.5 rounded">
            {loginPrompt.error}
          </p>
        )}
        <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-lg text-sm">
          تأكيد الدخول
        </button>
      </form>
    </Overlay>
  );

  /* ------------------------------------------------------------
     [ب-2] الدرفيل والتتبع والتسجيل: الدوال والمشتقات
     ------------------------------------------------------------ */
  useEffect(() => {
    if (!availableShifts.includes(selectedShift)) setSelectedShift(availableShifts[0]);
  }, [isFriday]);

  const handleDateChange = (dir) => {
    const nd = new Date(currentProdDate);
    nd.setDate(nd.getDate() + dir);
    setCurrentProdDate(nd);
    setSelectedShift(shiftsFor(nd.getDay() === 5)[0]);
  };

  // دالة زر "الآن" للرجوع الفوري للوردية الحالية واليوم الإنتاجي الحالي
  const handleGoToToday = () => {
    const s = getInitialProductionState();
    setCurrentProdDate(new Date(s.prodDate.getTime()));
    setSelectedShift(s.initialShift);
  };

  const handleResetAllStands = () => {
    showConfirm('تحذير شديد', 'هل أنت متأكد من تصفير كافة الستاندات والممرات بالكامل والبدء من ممر 1؟', () => {
      const today = new Date().toLocaleDateString('en-GB');
      save({
        stands: stands.map((s) => ({
          ...s,
          activePass: 1,
          accumulatedTons: 0,
          creditedShiftKey: '',
          creditedShiftTons: 0,
          creditedShiftBillets: 0,
          lastResetDate: today,
          passes: createPassesArray(s.totalPasses, 1, 0)
        }))
      });
    });
  };

  /* ---------- ملخص الوردية السريع للواتساب ---------- */
  const currentDateStr = currentProdDate.toLocaleDateString('en-GB');
  const existingShiftLog = productionArchive.find((l) => l.date === currentDateStr && l.shift === selectedShift);
  const currentShiftDowntimes = downtimesList.filter((d) => d.date === currentDateStr && d.shift === selectedShift);
  const currentShiftDownMins = currentShiftDowntimes.reduce((a, d) => a + (Number(d.durationMins) || 0), 0);
  const currentShiftPassChanges = passChanges.filter((c) => c.date === currentDateStr && c.shift === selectedShift);

  const buildWhatsAppSummaryText = () => {
    const dayName = currentProdDate.toLocaleDateString('ar-EG', { weekday: 'long' });
    const billets = existingShiftLog ? existingShiftLog.billets : Number(shiftBillets) || 0;
    const tons = existingShiftLog ? existingShiftLog.tons.toFixed(1) : (billets * billetWeight).toFixed(1);
    const activeCount = stands.filter((s) => s.isActive).length;
    const dangerStands = stands.filter((s) => s.accumulatedTons >= s.maxLimit).map((s) => s.name);

    const changesStr =
      currentShiftPassChanges.length === 0
        ? 'لا يوجد تغييرات ممرات بالوردية'
        : currentShiftPassChanges
            .map(
              (c) =>
                `• ${c.standName}: ${
                  c.kind === 'newRoll'
                    ? 'درفيل جديد'
                    : `ممر ${c.fromPass} ← ${c.toPass} (أُغلق على ${Number(c.tons).toFixed(0)} طن)`
                }`
            )
            .join('\n');

    const downStr =
      currentShiftDowntimes.length === 0
        ? 'لا يوجد توقفات (تشغيل مستمر 100%)'
        : currentShiftDowntimes
            .map((d) => `• ${d.standName} (${d.durationMins} ق): ${d.reason} [فني: ${d.techName || d.by}]`)
            .join('\n');

    return `🏭 *تقرير وردية خط الدرفلة - ${factoryName}*
📅 *اليوم:* ${dayName} (${currentDateStr})
⏰ *الوردية:* ${selectedShift} (المسؤول: ${roleLabel})
📏 *مقاس المنتج:* ${selectedProductSize} مم

📊 *ملخص الإنتاج:*
• عدد البيليت المسحوب: *${billets} بيليت*
• إجمالي الأطنان: *${tons} طن*
• القوائم العاملة: ${activeCount} من ${stands.length} ستاند

⏱️ *التوقفات والأعطال (إجمالي ${currentShiftDownMins} دقيقة):*
${downStr}

🔄 *تغييرات الممرات والدرافيل بالوردية:*
${changesStr}
${dangerStands.length > 0 ? `\n⚠️ *تنبيه ممرات وصلت للحد الأقصى:* ${dangerStands.join('، ')}` : ''}
✅ *تم التوليد عبر منصة SteelPortal SaaS*`;
  };

  const handleCopyWhatsApp = () => {
    navigator.clipboard.writeText(buildWhatsAppSummaryText());
    showAlert('تم النسخ', 'تم نسخ ملخص الوردية بنجاح! يمكنك لصقه مباشرة في جروب الواتساب.');
  };

  const handleSendWhatsAppDirect = () => {
    const url = `https://wa.me/?text=${encodeURIComponent(buildWhatsAppSummaryText())}`;
    window.open(url, '_blank');
  };

  /* ---------- إضافة / حذف / تغيير عدد الستاندات للمصنع ---------- */
  const handleAddSingleStand = (e) => {
    e.preventDefault();
    const nextNum = stands.length + 1;
    const created = buildStand({
      id: String(nextNum),
      name: newStandForm.name.trim() || `ستاند ${nextNum}`,
      type: newStandForm.type,
      rollCode: newStandForm.rollCode,
      diameter: newStandForm.diameter,
      hardness: newStandForm.hardness,
      totalPasses: Number(newStandForm.totalPasses) || 12,
      maxLimit: Number(newStandForm.maxLimit) || 1500
    });
    const updated = [...stands, created];
    save({ stands: updated });
    setTargetStandsCount(updated.length);
    setAddStandOpen(false);
    setNewStandForm({ name: '', type: 'بيضاوي', rollCode: '', diameter: '340', hardness: '48 HRC', totalPasses: 12, maxLimit: 1500 });
    showAlert('تمت الإضافة', `تم إضافة (${created.name}) بنجاح. إجمالي الستاندات الآن: ${updated.length}`);
  };

  const handleResizeStandsCount = () => {
    const count = Math.max(1, Math.min(30, Number(targetStandsCount) || 12));
    if (count === stands.length) return;
    showConfirm(
      'تعديل عدد قوائم الخط',
      `سيتم ضبط عدد الستاندات في المصنع إلى (${count}) ستاند مع الحفاظ على بيانات الستاندات الحالية. هل أنت متأكد؟`,
      () => {
        let updated = [...stands];
        if (count > stands.length) {
          for (let i = stands.length; i < count; i++) {
            const cfg = {
              id: String(i + 1),
              name: `ستاند ${i + 1}`,
              type: 'دائري',
              rollCode: `R-${i + 1}`,
              diameter: '330',
              hardness: '50 HRC',
              totalPasses: 16,
              maxLimit: 1200
            };
            updated.push(buildStand(cfg));
          }
        } else {
          updated = updated.slice(0, count);
        }
        save({ stands: updated });
        setAddStandOpen(false);
      }
    );
  };

  const handleDeleteStand = (standIndex) => {
    if (stands.length <= 1) return;
    const st = stands[standIndex];
    showConfirm('حذف ستاند', `هل أنت متأكد من حذف (${st.name}) من خط الإنتاج؟`, () => {
      const updated = stands.filter((_, i) => i !== standIndex);
      save({ stands: updated });
      setRollModal({ isOpen: false, standIndex: null, isEditingInfo: false });
    });
  };

  const handleProductSizeChange = (size) => {
    setSelectedProductSize(size);
    save({ stands: stands.map((s) => ({ ...s, isActive: true })), productSize: size });
  };

  const getStandStatus = (tons, limit) => {
    const pct = Math.max(0, (tons / limit) * 100);
    if (pct >= 100) return { color: 'danger', bg: 'bg-red-50', border: 'border-red-500', bar: 'bg-red-600', text: 'text-red-700', hex: '#dc2626' };
    if (pct >= 80) return { color: 'warning', bg: 'bg-amber-50', border: 'border-amber-400', bar: 'bg-amber-500', text: 'text-amber-700', hex: '#eab308' };
    return { color: 'good', bg: 'bg-white', border: 'border-slate-200', bar: 'bg-emerald-500', text: 'text-slate-900', hex: '#10b981' };
  };

  const handleToggleActive = (index, e) => {
    if (e) e.stopPropagation();
    const ns = stands.map((s, i) => (i === index ? { ...s, isActive: !s.isActive } : s));
    save({ stands: ns });
  };

  /* ---------- صفحة الدرفيل ---------- */
  const openStandRollPage = (index) => {
    const st = stands[index];
    setRollEditForm({
      name: st.name || `ستاند ${st.id}`,
      rollCode: st.rollCode || '',
      diameter: st.diameter || '',
      hardness: st.hardness || '',
      type: st.type || '',
      entryDate: convertGBToISO(st.entryDate),
      totalPasses: st.totalPasses || 6
    });
    window.history.pushState({ modal: 'roll' }, '');
    setRollModal({ isOpen: true, standIndex: index, isEditingInfo: false });
  };

  const handleSaveRollMetadata = () => {
    const idx = rollModal.standIndex;
    if (idx === null) return;
    const ns = [...stands];
    const st = { ...ns[idx] };
    const newTotal = Math.max(1, Math.min(40, Number(rollEditForm.totalPasses) || st.totalPasses));
    st.name = rollEditForm.name.trim() || st.name;
    st.rollCode = rollEditForm.rollCode;
    st.diameter = rollEditForm.diameter;
    st.hardness = rollEditForm.hardness;
    st.type = rollEditForm.type;
    st.entryDate = formatDateToGB(rollEditForm.entryDate) || st.entryDate;
    if (newTotal !== st.totalPasses) {
      st.passes = Array.from({ length: newTotal }, (_, i) => {
        const n = i + 1;
        const ex = st.passes.find((p) => p.passNumber === n);
        if (ex) return ex;
        return {
          passNumber: n,
          status: n === st.activePass ? 'active' : 'unused',
          tons: n === st.activePass ? st.accumulatedTons : 0,
          order: n === st.activePass ? 1 : null,
          sizeLabel: ''
        };
      });
      st.totalPasses = newTotal;
      if (st.activePass > newTotal) st.activePass = 1;
    }
    ns[idx] = st;
    save({ stands: ns });
    setRollModal((prev) => ({ ...prev, isEditingInfo: false }));
    showAlert('تم الحفظ', 'تم تحديث بيانات الدرفيل والممرات بنجاح.');
  };

  const pendingFor = (standId) => pendingList.filter((r) => String(r.standId) === String(standId) && r.status === 'pending');

  const buildRequest = (st, kind, extra = {}) => ({
    id: Date.now() + Math.floor(Math.random() * 1000),
    kind,
    status: 'pending',
    standId: st.id,
    standName: st.name,
    fromPass: st.activePass,
    currentTons: st.accumulatedTons,
    productSize: selectedProductSize,
    requestedBy: roleLabel,
    createdAt: new Date().toLocaleString('ar-EG'),
    date: new Date().toLocaleDateString('en-GB'),
    shift: selectedShift,
    ...extra
  });

  const submitChange = (req) => {
    if (isManagerLike) {
      const r = applyPassChange(stands, req, billetWeight, roleLabel, productionArchive);
      if (!r) return;
      save({ stands: r.list, changes: [r.log, ...passChanges] });
      return;
    }
    save({ pending: [req, ...pendingList] });
    showAlert('تم إرسال الطلب', 'تم إرسال طلب التغيير للمدير. هيتنفذ بعد موافقته.');
  };

  const handleInstallNewRoll = () => {
    const idx = rollModal.standIndex;
    if (idx === null) return;
    const st = stands[idx];
    if (!isManagerLike && pendingFor(st.id).length) {
      showAlert('يوجد طلب معلّق', 'فيه طلب لهذا الستاند بانتظار موافقة المدير.');
      return;
    }
    showConfirm(
      'تركيب درفيل جديد',
      isManagerLike
        ? 'سيتم تصفير جميع الممرات والبدء من الممر 1 بتاريخ اليوم.'
        : 'سيتم إرسال طلب تركيب درفيل جديد للمدير.',
      () => submitChange(buildRequest(st, 'newRoll', { notes: 'تركيب درفيل جديد' }))
    );
  };

  const initiateResetStand = (index, preselectedPassNum = null, e = null) => {
    if (e) e.stopPropagation();
    const st = stands[index];
    if (!isManagerLike && pendingFor(st.id).length) {
      showAlert('يوجد طلب معلّق', 'فيه طلب لهذا الستاند بانتظار موافقة المدير.');
      return;
    }
    setResetBillets('');
    setResetNotes('');
    setResetDateInput(formatDateToISO(currentProdDate));
    setResetShiftInput(selectedShift);
    if (preselectedPassNum) setResetTargetPass(preselectedPassNum);
    else {
      const next = st.passes.find((p) => p.status === 'unused' && p.passNumber !== st.activePass);
      setResetTargetPass(next ? next.passNumber : st.activePass);
    }
    window.history.pushState({ modal: 'reset' }, '');
    setResetModal({ isOpen: true, standIndex: index });
  };

  const confirmResetStand = () => {
    const index = resetModal.standIndex;
    if (index === null) return;
    const st = stands[index];
    const req = buildRequest(st, 'pass', {
      targetPass: Number(resetTargetPass) || st.activePass,
      billets: Number(resetBillets) || 0,
      notes: resetNotes,
      date: formatDateToGB(resetDateInput) || new Date().toLocaleDateString('en-GB'),
      shift: resetShiftInput
    });
    submitChange(req);
    setResetModal({ isOpen: false, standIndex: null });
  };

  /* ---------- موافقات المدير ---------- */
  const getEdit = (r) => ({ targetPass: r.targetPass, billets: r.billets, notes: r.notes, ...(reqEdits[r.id] || {}) });
  const setEdit = (id, patch) => setReqEdits((prev) => ({ ...prev, [id]: { ...(prev[id] || {}), ...patch } }));

  const approveRequest = (r) => {
    const merged = { ...r, ...(r.kind === 'pass' ? getEdit(r) : {}) };
    const res = applyPassChange(stands, merged, billetWeight, roleLabel, productionArchive);
    if (!res) return;
    save({ stands: res.list, changes: [res.log, ...passChanges], pending: pendingList.filter((x) => x.id !== r.id) });
  };
  const rejectRequest = (r) => {
    save({
      pending: pendingList.map((x) => (x.id === r.id ? { ...x, status: 'rejected', rejectedAt: new Date().toLocaleString('ar-EG') } : x))
    });
  };
  const dismissRequest = (id) => save({ pending: pendingList.filter((x) => x.id !== id) });

  const handleWeightChange = (v) => {
    const val = Number(v);
    if (val > 0) save({ weight: val });
  };

  /* ---------- إنتاج الوردية ---------- */
  const handleAddShiftProduction = () => {
    const n = Number(shiftBillets);
    if (n <= 0 || isNaN(n)) return;
    if (existingShiftLog) {
      setDupModal(true);
      return;
    }
    commitShift('add');
  };

  const commitShift = (mode) => {
    setDupModal(false);
    const n = Number(shiftBillets);
    if (n <= 0 || isNaN(n)) return;
    const newTons = n * billetWeight;
    const existing = productionArchive.find((l) => l.date === currentDateStr && l.shift === selectedShift);
    const shiftKey = `${currentDateStr}__${selectedShift}`;

    const now = new Date();
    const saveTime = now.toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
    const dayName = currentProdDate.toLocaleDateString('ar-EG', { weekday: 'long' });

    const newStands = stands.map((s) => {
      if (!s.isActive) return s;
      const alreadyCreditedTons = s.creditedShiftKey === shiftKey ? Number(s.creditedShiftTons) || 0 : 0;

      let deltaTons = newTons;
      if (mode === 'replace' && existing) {
        deltaTons = newTons - existing.tons;
      } else if (!existing && alreadyCreditedTons > 0) {
        deltaTons = Math.max(0, newTons - alreadyCreditedTons);
      }

      const tons = Math.max(0, s.accumulatedTons + deltaTons);
      return {
        ...s,
        accumulatedTons: tons,
        creditedShiftKey: '',
        creditedShiftTons: 0,
        creditedShiftBillets: 0,
        passes: s.passes.map((p) => (p.passNumber === s.activePass ? { ...p, status: 'active', tons, order: p.order || 1 } : p))
      };
    });

    let archive;
    if (existing) {
      archive = productionArchive.map((l) =>
        l === existing
          ? {
              ...l,
              billets: mode === 'replace' ? n : l.billets + n,
              tons: mode === 'replace' ? newTons : l.tons + newTons,
              time: saveTime,
              by: roleLabel,
              productSize: selectedProductSize,
              timestamp: now.getTime()
            }
          : l
      );
    } else {
      archive = [
        {
          id: Date.now(),
          date: currentDateStr,
          dayName,
          time: saveTime,
          shift: selectedShift,
          billets: n,
          tons: newTons,
          by: roleLabel,
          productSize: selectedProductSize,
          timestamp: now.getTime()
        },
        ...productionArchive
      ];
    }
    save({ stands: newStands, archive });

    const dayShifts = shiftsFor(currentProdDate.getDay() === 5);
    const i = dayShifts.indexOf(selectedShift);
    if (i === dayShifts.length - 1) {
      const nd = new Date(currentProdDate);
      nd.setDate(nd.getDate() + 1);
      setCurrentProdDate(nd);
      setSelectedShift(shiftsFor(nd.getDay() === 5)[0]);
      showAlert('تم الإقفال', `تم إقفال يوم ${dayName} وتسجيل إنتاج ${selectedShift} بنجاح!`);
    } else setSelectedShift(dayShifts[i >= 0 ? i + 1 : 0]);
    setShiftBillets('');
  };

  const pendingCount = pendingList.filter((r) => r.status === 'pending').length;
  const selectedRollStand = rollModal.standIndex !== null ? stands[rollModal.standIndex] : null;
  const resetStandObj = resetModal.standIndex !== null ? stands[resetModal.standIndex] : null;

  /* ------------------------------------------------------------
     [ج-2] المواتير: الدوال والمشتقات
     ------------------------------------------------------------ */
  /* ---------- سجل المواتير + تسجيل حرارة الوردية + الصيانة ---------- */
  const handleAddMotor = (e) => {
    e.preventDefault();
    if (!newMotor.code.trim() || !newMotor.kw) return;
    const m = {
      id: Date.now().toString(),
      ...newMotor,
      code: newMotor.code.trim().toUpperCase(),
      locationName: newMotor.category === 'rolling' ? `ستاند ${newMotor.stand}` : newMotor.locationName || 'معدة مساعدة',
      dateAdded: new Date().toLocaleDateString('en-GB'),
      lastTechName: roleLabel,
      logs: []
    };
    save({ motors: [m, ...motorsList] });
    setNewMotor({
      category: 'rolling',
      stand: '1',
      locationName: 'ستاند 1',
      code: '',
      brand: 'Siemens SINAMICS',
      kw: '',
      rpm: '',
      amps: '',
      gearRatio: '',
      megger: '550 MΩ',
      bodyTemp: '50',
      bearingTemp: '55',
      status: 'يعمل بحالة ممتازة'
    });
    setMotorSubView('cards');
    showAlert('تم الحفظ', `تم إضافة الموتور (${m.code}) بنجاح.`);
  };

  // قراءات الحرارة في الوردية لكل موتور: الجسم مرتين + البلي الأمامي مرة + البلي الخلفي مرة
  const TEMP_KEYS = ['bodyTemp1', 'bodyTemp2', 'frontBearingTemp', 'rearBearingTemp'];
  const isFilled = (v) => v !== undefined && v !== '';
  const maxOfTemps = (...vals) => {
    const nums = vals.filter(isFilled).map(Number).filter((n) => !isNaN(n));
    return nums.length ? String(Math.max(...nums)) : '';
  };

  // حفظ قراءات الجولة الحالية فقط: الجولة 1 (بداية الوردية) جسم + بلي أمامي/خلفي + أمبير، الجولة 2 (وسط الوردية) جسم فقط
  const handleSaveShiftTemperatures = (e) => {
    e.preventDefault();
    const roundKeys = tempRound === 1 ? ['bodyTemp1', 'frontBearingTemp', 'rearBearingTemp'] : ['bodyTemp2'];
    const optionalKeys = tempRound === 1 ? ['amps'] : [];
    const roundLabel = tempRound === 1 ? 'القراءة الأولى (بداية الوردية)' : 'القراءة الثانية (وسط الوردية — جسم فقط)';
    const touched = motorsList.filter((m) => {
      const inp = shiftTempInputs[m.id] || {};
      return [...roundKeys, ...optionalKeys].some((k) => isFilled(inp[k]));
    });
    if (touched.length === 0) {
      showAlert('تنبيه', 'اكتب قراءات موتور واحد على الأقل قبل الحفظ.');
      return;
    }
    const incomplete = touched.filter((m) => roundKeys.some((k) => !isFilled((shiftTempInputs[m.id] || {})[k])));
    if (incomplete.length > 0) {
      showAlert(
        'قراءات ناقصة',
        (tempRound === 1
          ? `أكمل قراءات الجولة الأولى (الجسم + البلي الأمامي + البلي الخلفي) للموتورات:\n`
          : `أكمل قراءة الجسم الثانية للموتورات:\n`) +
          incomplete.map((m) => `• ${m.locationName || `ستاند ${m.stand}`} (${m.code})`).join('\n')
      );
      return;
    }

    const readings = touched.map((m) => {
      const inp = shiftTempInputs[m.id];
      const r = {
        motorId: m.id,
        motorCode: m.code,
        locationName: m.locationName || `ستاند ${m.stand}`
      };
      if (tempRound === 1) {
        r.bodyTemp1 = inp.bodyTemp1;
        r.frontBearingTemp = inp.frontBearingTemp;
        r.rearBearingTemp = inp.rearBearingTemp;
        r.bodyTemp = maxOfTemps(inp.bodyTemp1, m.bodyTemp2);
        r.bearingTemp = maxOfTemps(inp.frontBearingTemp, inp.rearBearingTemp);
        r.amps = isFilled(inp.amps) ? inp.amps : m.amps || '-';
      } else {
        r.bodyTemp2 = inp.bodyTemp2;
        r.bodyTemp = maxOfTemps(m.bodyTemp1, inp.bodyTemp2);
        r.bearingTemp = maxOfTemps(m.frontBearingTemp, m.rearBearingTemp) || m.bearingTemp;
        r.amps = m.amps || '-';
      }
      return r;
    });

    const batchLog = {
      id: Date.now(),
      round: tempRound,
      date: currentDateStr,
      dayName: currentProdDate.toLocaleDateString('ar-EG', { weekday: 'long' }),
      shift: selectedShift,
      time: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
      recordedBy: isSupervisorLogin ? shiftTempTech.trim() || maintShiftTechs[selectedShift] || roleLabel : roleLabel,
      supervisor: isSupervisorLogin ? roleLabel : shiftTempSupervisor.trim() || '-',
      enteredBy: roleLabel,
      readings
    };

    const updatedMotors = motorsList.map((m) => {
      const r = readings.find((x) => x.motorId === m.id);
      if (!r) return m;
      const merged = { ...m };
      if (tempRound === 1) {
        merged.bodyTemp1 = r.bodyTemp1;
        merged.frontBearingTemp = r.frontBearingTemp;
        merged.rearBearingTemp = r.rearBearingTemp;
        merged.amps = r.amps;
      } else {
        merged.bodyTemp2 = r.bodyTemp2;
      }
      merged.bodyTemp = maxOfTemps(merged.bodyTemp1, merged.bodyTemp2);
      merged.bearingTemp = maxOfTemps(merged.frontBearingTemp, merged.rearBearingTemp) || m.bearingTemp;
      merged.lastTempShift = `${currentDateStr} (${selectedShift})`;
      merged.lastTechName = batchLog.recordedBy;
      return merged;
    });

    save({ motors: updatedMotors, tempLogs: [batchLog, ...tempShiftLogs] });
    setShiftTempInputs((prev) => {
      const next = { ...prev };
      touched.forEach((m) => {
        const kept = { ...(next[m.id] || {}) };
        [...roundKeys, ...optionalKeys].forEach((k) => delete kept[k]);
        next[m.id] = kept;
      });
      return next;
    });
    showAlert(
      `تم تسجيل ${roundLabel}`,
      `تم حفظ قراءات ${readings.length} موتور لـ (${selectedShift} - ${currentDateStr}) باسم: ${batchLog.recordedBy}`
    );
  };

  // تسجيل جماعي: تغيير فلاتر كل المواتير دفعة واحدة للوردية الحالية
  const handleBulkFilterChange = () => {
    if (motorsList.length === 0) return;
    showConfirm(
      'تغيير فلاتر كل المواتير',
      `سيتم تسجيل "تغيير فلاتر" لكل المواتير (${motorsList.length}) في سجل صيانة ${selectedShift} بتاريخ ${currentDateStr}. متأكد؟`,
      () => {
        const now = Date.now();
        const time = new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
        const updatedMotors = motorsList.map((m, i) => ({
          ...m,
          lastTechName: maintShiftTechs[selectedShift] || roleLabel,
          logs: [
            {
              id: now + i,
              date: currentDateStr,
              shift: selectedShift,
              time,
              type: 'تغيير فلاتر',
              techName: maintShiftTechs[selectedShift] || roleLabel,
              supervisorName: isSupervisorLogin ? roleLabel : shiftTempSupervisor.trim() || '-',
              notes: 'تغيير فلاتر الموتور (تسجيل جماعي للوردية)',
              by: roleLabel
            },
            ...(m.logs || [])
          ]
        }));
        save({ motors: updatedMotors });
        showAlert('تم التسجيل', `تم تسجيل تغيير الفلاتر لـ ${updatedMotors.length} موتور في ${selectedShift}.`);
      }
    );
  };

  // تسجيل تنضيف بالهوا للمواتير المختارة فقط
  const handleBulkAirBlow = () => {
    const ids = Object.keys(airBlowSelected).filter((id) => airBlowSelected[id]);
    if (ids.length === 0) {
      showAlert('تنبيه', 'حدد موتور واحد على الأقل اتنضف بالهوا.');
      return;
    }
    const now = Date.now();
    const time = new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' });
    const selectedSet = new Set(ids);
    const updatedMotors = motorsList.map((m, i) =>
      selectedSet.has(m.id)
        ? {
            ...m,
            lastTechName: maintShiftTechs[selectedShift] || roleLabel,
            logs: [
              {
                id: now + i,
                date: currentDateStr,
                shift: selectedShift,
                time,
                type: 'تنضيف بالهواء',
                techName: maintShiftTechs[selectedShift] || roleLabel,
                supervisorName: isSupervisorLogin ? roleLabel : shiftTempSupervisor.trim() || '-',
                notes: 'تنضيف الموتور بالهوا من الداخل',
                by: roleLabel
              },
              ...(m.logs || [])
            ]
          }
        : m
    );
    save({ motors: updatedMotors });
    setAirBlowSelected({});
    showAlert('تم التسجيل', `تم تسجيل التنضيف بالهوا لـ ${ids.length} موتور في ${selectedShift}.`);
  };

  // طباعة تقرير حرارة المواتير المستقل
  const handlePrintTempReport = () => {
    const dateGB = formatDateToGB(tempReportDateISO);
    printHTMLDoc(
      buildTempReportHTML({
        factoryName,
        logoUrl: customLogo,
        dateGB,
        shiftLabel: tempReportShift,
        motors: motorsList,
        tempLogs: tempShiftLogs,
        maintTech: tempReportShift !== 'الكل'
          ? maintShiftTechs[tempReportShift]
          : ['الوردية الأولى', 'الوردية الثانية', 'الوردية الثالثة'].map((sh) => maintShiftTechs[sh]).filter(Boolean).join(' / ')
      }),
      () => showAlert('تعذر الفتح', 'المتصفح منع النافذة. اسمح بالنوافذ المنبثقة لهذا الموقع وجرّب تاني.')
    );
  };

  // طباعة تقرير الصيانة المستقل بالفلاتر المختارة
  const handlePrintMaintReport = () => {
    const rows = motorsList
      .flatMap((m) =>
        (m.logs || []).map((lg) => ({
          ...lg,
          motorCode: m.code,
          locationName: m.locationName || `ستاند ${m.stand}`
        }))
      )
      .filter((lg) => maintReportType === 'الكل' || (lg.type || '').trim() === maintReportType)
      .filter((lg) => maintReportShift === 'الكل' || lg.shift === maintReportShift)
      .filter((lg) => {
        if (!maintReportFromISO && !maintReportToISO) return true;
        const iso = convertGBToISO(lg.date);
        return (!maintReportFromISO || iso >= maintReportFromISO) && (!maintReportToISO || iso <= maintReportToISO);
      })
      .sort((a, b) => convertGBToISO(b.date).localeCompare(convertGBToISO(a.date)) || String(b.id).localeCompare(String(a.id)));
    if (rows.length === 0) {
      showAlert('لا توجد سجلات', 'مفيش سجلات صيانة مطابقة للفلاتر المختارة. غيّر الفلاتر وحاول تاني.');
      return;
    }
    printHTMLDoc(
      buildMaintReportHTML({
        factoryName,
        logoUrl: customLogo,
        typeLabel: maintReportType,
        shiftLabel: maintReportShift,
        fromGB: maintReportFromISO ? formatDateToGB(maintReportFromISO) : '',
        toGB: maintReportToISO ? formatDateToGB(maintReportToISO) : '',
        rows
      }),
      () => showAlert('تعذر الفتح', 'المتصفح منع النافذة. اسمح بالنوافذ المنبثقة لهذا الموقع وجرّب تاني.')
    );
  };

  const handleAddMotorMaintenanceLog = (e) => {
    e.preventDefault();
    if (!selectedMotorForLog || !motorMaintForm.notes.trim()) return;
    const logItem = {
      id: Date.now(),
      date: new Date().toLocaleDateString('en-GB'),
      shift: selectedShift,
      time: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
      type: motorMaintForm.type,
      techName: isSupervisorLogin ? motorMaintForm.techName.trim() || maintShiftTechs[selectedShift] || '-' : roleLabel,
      supervisorName: isSupervisorLogin ? roleLabel : motorMaintForm.supervisorName.trim() || '-',
      megger: motorMaintForm.megger || selectedMotorForLog.megger,
      bodyTemp: motorMaintForm.bodyTemp || selectedMotorForLog.bodyTemp,
      bearingTemp: motorMaintForm.bearingTemp || selectedMotorForLog.bearingTemp,
      ampsRead: motorMaintForm.ampsRead || selectedMotorForLog.amps,
      notes: motorMaintForm.notes.trim(),
      by: roleLabel
    };
    const updatedMotors = motorsList.map((m) =>
      m.id === selectedMotorForLog.id
        ? {
            ...m,
            megger: logItem.megger || m.megger,
            bodyTemp: logItem.bodyTemp || m.bodyTemp,
            bearingTemp: logItem.bearingTemp || m.bearingTemp,
            amps: logItem.ampsRead || m.amps,
            lastTechName: logItem.techName !== '-' ? logItem.techName : roleLabel,
            logs: [logItem, ...(m.logs || [])]
          }
        : m
    );
    save({ motors: updatedMotors });
    setSelectedMotorForLog(updatedMotors.find((m) => m.id === selectedMotorForLog.id));
    setMotorMaintForm({
      type: 'فحص دوري وعزل',
      techName: '',
      supervisorName: '',
      megger: '',
      bodyTemp: '',
      bearingTemp: '',
      ampsRead: '',
      notes: ''
    });
  };

  const handleDeleteMotor = (id) => {
    showConfirm('حذف موتور', 'هل أنت متأكد من حذف هذا الموتور وسجلاته؟', () => {
      save({ motors: motorsList.filter((m) => m.id !== id) });
    });
  };

  // حالة تسجيل كل جولة قياس في الوردية المختارة (الدفعات القديمة بدون round تُحتسب للجولتين حسب حقولها)
  const todayShiftBatches = tempShiftLogs.filter((b) => b.date === currentDateStr && b.shift === selectedShift);
  const round1RecordedIds = new Set(
    todayShiftBatches.flatMap((b) => (b.readings || []).filter((r) => isFilled(r.bodyTemp1)).map((r) => r.motorId))
  );
  const round2RecordedIds = new Set(
    todayShiftBatches.flatMap((b) => (b.readings || []).filter((r) => isFilled(r.bodyTemp2)).map((r) => r.motorId))
  );

  // سجل حرارة الموتور المفتوح (الأحدث أولاً)
  const selectedMotorTempHistory = selectedMotorForLog
    ? tempShiftLogs
        .flatMap((b) =>
          (b.readings || [])
            .filter((r) => r.motorId === selectedMotorForLog.id)
            .map((r) => ({ ...r, batchId: b.id, date: b.date, shift: b.shift, time: b.time, recordedBy: b.recordedBy, supervisor: b.supervisor }))
        )
        .slice(0, 40)
    : [];

  const filteredMotors = motorsList.filter((m) => {
    const matchCat =
      motorCategoryFilter === 'all'
        ? true
        : motorCategoryFilter === 'aux'
        ? m.category === 'aux'
        : m.category !== 'aux';
    const q = motorSearchId.trim().toLowerCase();
    const matchSearch =
      !q ||
      (m.code && m.code.toLowerCase().includes(q)) ||
      (m.locationName && m.locationName.toLowerCase().includes(q)) ||
      (m.brand && m.brand.toLowerCase().includes(q));
    return matchCat && matchSearch;
  });

  /* ------------------------------------------------------------
     [د-2] الباقي: الأعطال، ورشة الدرافيل، الوصفات، الموظفين، الأرشيف والتقارير
     ------------------------------------------------------------ */
  /* ---------- تسجيل التوقفات والأعطال ---------- */
  const handleAddDowntime = (e) => {
    e.preventDefault();
    if (!downForm.reason.trim() || !downForm.durationMins) return;
    const item = {
      id: Date.now(),
      date: currentDateStr,
      dayName: currentProdDate.toLocaleDateString('ar-EG', { weekday: 'long' }),
      shift: selectedShift,
      time: new Date().toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' }),
      category: downForm.category,
      standName: downForm.standName,
      durationMins: Number(downForm.durationMins) || 0,
      reason: downForm.reason.trim(),
      actionTaken: downForm.actionTaken.trim(),
      techName: downForm.techName.trim() || roleLabel,
      productSize: selectedProductSize,
      by: roleLabel
    };
    save({ downtimes: [item, ...downtimesList] });
    setDownForm({ ...downForm, durationMins: '', reason: '', actionTaken: '' });
  };

  const handleDeleteDowntime = (id) => {
    save({ downtimes: downtimesList.filter((d) => d.id !== id) });
  };

  const filteredDowntimes = downtimesList.filter((d) => {
    const matchCat = downFilterCat === 'الكل' || d.category === downFilterCat;
    const q = downSearchQuery.trim().toLowerCase();
    const matchSearch =
      !q ||
      (d.reason && d.reason.toLowerCase().includes(q)) ||
      (d.standName && d.standName.toLowerCase().includes(q)) ||
      (d.techName && d.techName.toLowerCase().includes(q));
    return matchCat && matchSearch;
  });

  /* ---------- وظائف رادار الدرافيل والمخرطة ---------- */
  const handleSaveRollShopItem = (e) => {
    e.preventDefault();
    if (!newRollItem.code.trim()) return;

    if (editingRollId) {
      const updated = rollShopList.map((r) =>
        r.id === editingRollId
          ? {
              ...r,
              code: newRollItem.code.trim().toUpperCase(),
              standName: newRollItem.standName,
              material: newRollItem.material,
              maxDia: Number(newRollItem.maxDia) || 400,
              currentDia: Number(newRollItem.currentDia) || 390,
              minScrapDia: Number(newRollItem.minScrapDia) || 340,
              status: newRollItem.status || r.status
            }
          : r
      );
      save({ rollShop: updated });
      setEditingRollId(null);
      setRollFormOpen(false);
    } else {
      const item = {
        id: `rs-${Date.now()}`,
        code: newRollItem.code.trim().toUpperCase(),
        standName: newRollItem.standName,
        material: newRollItem.material,
        maxDia: Number(newRollItem.maxDia) || 400,
        currentDia: Number(newRollItem.currentDia) || 390,
        minScrapDia: Number(newRollItem.minScrapDia) || 340,
        redressCount: 0,
        totalTonsRolled: 0,
        status: newRollItem.status || 'جاهز بالورشة (جديد)',
        lastRedressDate: new Date().toLocaleDateString('en-GB')
      };
      save({ rollShop: [item, ...rollShopList] });
      setRollFormOpen(false);
    }
    setNewRollItem({
      code: '',
      standName: 'ستاند 1',
      material: 'SG Iron / HSS',
      maxDia: 400,
      currentDia: 390,
      minScrapDia: 340,
      status: 'جاهز بالورشة (جديد)'
    });
  };

  const handleStartEditRollItem = (roll) => {
    setEditingRollId(roll.id);
    setNewRollItem({
      code: roll.code,
      standName: roll.standName,
      material: roll.material,
      maxDia: roll.maxDia,
      currentDia: roll.currentDia,
      minScrapDia: roll.minScrapDia,
      status: roll.status
    });
    setRollFormOpen(true);
  };

  const handleDeleteRollShopItem = (id) => {
    showConfirm('حذف طقم الدرافيل', 'هل أنت متأكد من حذف هذا الدرفيل نهائياً من سجل الورشة؟', () => {
      save({ rollShop: rollShopList.filter((r) => r.id !== id) });
    });
  };

  const handleRecordRedressing = (roll) => {
    const mmRemoved = prompt(
      `كم ملليمتر تم خرطها من قطر الدرفيل (${roll.code}) في المخرطة؟ (القطر الحالي: ${roll.currentDia} مم)`,
      '4'
    );
    if (mmRemoved === null) return;
    const cut = Number(mmRemoved) || 0;
    if (cut <= 0) return;
    const nextDia = Math.max(0, roll.currentDia - cut);
    const updated = rollShopList.map((r) =>
      r.id === roll.id
        ? {
            ...r,
            currentDia: nextDia,
            redressCount: (r.redressCount || 0) + 1,
            status: nextDia <= r.minScrapDia ? 'تكهين (وصل لحد الخردة)' : 'تمت الخراطة وجاهز للتركيب',
            lastRedressDate: new Date().toLocaleDateString('en-GB')
          }
        : r
    );
    save({ rollShop: updated });
  };

  /* ---------- وظائف وصفات الإنتاج ---------- */
  const handleApplyRecipe = (recipe) => {
    setSelectedProductSize(recipe.productSize);
    const updatedStands = stands.map((s, idx) => ({
      ...s,
      isActive: idx < (Number(recipe.activeStandsCount) || stands.length)
    }));
    save({ stands: updatedStands, productSize: recipe.productSize });
    showAlert(
      'تم تفعيل الوصفة على الخط',
      `تم ضبط الخط على (${recipe.name}):\n• المقاس: ${recipe.productSize}\n• السرعة المرجعية: ${recipe.finishSpeed}\n• صندوق التبريد QTB: ${recipe.qtbPressure}`
    );
  };

  /* ---------- إدارة الموظفين والرابط المباشر ---------- */
  const handleAddStaffMember = (e) => {
    e.preventDefault();
    if (!newStaffForm.name.trim() || !newStaffForm.pin.trim()) return;
    if (newStaffForm.role !== 'manager' && newStaffForm.access.length === 0) {
      showAlert('تنبيه', 'اختر قسماً واحداً على الأقل يدخل عليه هذا الموظف.');
      return;
    }
    const cleanPin = newStaffForm.pin.trim();
    if (staffList.some((emp) => emp.pin === cleanPin) || cleanPin === adminState.managerCode) {
      showAlert('تنبيه', 'هذا الكود مستخدم بالفعل لموظف آخر أو للمدير!');
      return;
    }
    const item = {
      id: `emp-${Date.now()}`,
      name: newStaffForm.name.trim(),
      pin: cleanPin,
      role: newStaffForm.role,
      jobTitle: newStaffForm.jobTitle.trim() || 'فني تشغيل',
      access: newStaffForm.role === 'manager' ? [...ASSIGNABLE_TAB_KEYS] : newStaffForm.access,
      active: true
    };
    save({ staff: [item, ...staffList] });
    setNewStaffForm({ name: '', pin: '', role: 'tech', jobTitle: 'مشغل غرفة تحكم / فني إنتاج', access: [...ASSIGNABLE_TAB_KEYS] });
  };

  const handleToggleStaffActive = (id) => {
    const updated = staffList.map((emp) => (emp.id === id ? { ...emp, active: !emp.active } : emp));
    save({ staff: updated });
  };

  // تعديل الأقسام المسموحة لموظف موجود (يسري فوراً حتى لو كان داخل النظام)
  const handleToggleStaffTab = (id, tab) => {
    const updated = staffList.map((emp) => {
      if (emp.id !== id) return emp;
      const current = accessFor(emp) || ASSIGNABLE_TAB_KEYS;
      const next = current.includes(tab) ? current.filter((k) => k !== tab) : [...current, tab];
      return { ...emp, access: next };
    });
    const target = updated.find((emp) => emp.id === id);
    if (target && target.access.length === 0) {
      showAlert('تنبيه', 'يجب أن يبقى للموظف قسم واحد على الأقل. لإيقاف دخوله بالكامل استخدم زر "إيقاف".');
      return;
    }
    save({ staff: updated });
  };

  const handleDeleteStaff = (id) => {
    save({ staff: staffList.filter((emp) => emp.id !== id) });
  };

  const handleCopyEmployeeDirectLink = () => {
    const baseUrl = window.location.origin + window.location.pathname;
    const directUrl = `${baseUrl}?mode=factory&f=${encodeURIComponent(appId)}&via=link`;
    navigator.clipboard.writeText(directUrl);
    showAlert(
      'تم نسخ رابط الموظفين المباشر',
      `انسخ هذا الرابط وأرسله للموظفين على الواتساب:\n${directUrl}\n\nعندما يضغط الموظف عليه، سيفتح له شاشة مصنع (${factoryName}) مباشرة ويطلب منه كود الموظف فقط، وبدون زر العودة للبوابة الرئيسية. كل موظف يدخل الأقسام المحددة لكوده فقط.`
    );
  };

  const handleClearArchive = () => {
    showConfirm('تحذير نهائي', 'هل أنت متأكد من مسح جميع بيانات الأرشيف القديمة وسجل الممرات بالكامل لهذا المصنع؟', () => {
      save({ archive: [], changes: [] });
      showAlert('تمت العملية', 'تم مسح الأرشيف وسجل الممرات بنجاح.');
    });
  };

  /* ---------- تجميع الأرشيف والتقارير ---------- */
  const groupedArchive = productionArchive.reduce((acc, log) => {
    if (!acc[log.date]) acc[log.date] = { dayName: log.dayName, totalBillets: 0, totalTons: 0, shiftsList: [], timestamp: log.timestamp };
    acc[log.date].totalBillets += log.billets;
    acc[log.date].totalTons += log.tons;
    acc[log.date].shiftsList.push(log);
    return acc;
  }, {});
  const shiftOrder = {
    'الوردية الأولى': 1,
    'الوردية الأولى (12 ساعة)': 1,
    'الوردية الثانية': 2,
    'الوردية الثانية (12 ساعة)': 2,
    'الوردية الثالثة': 3
  };
  Object.keys(groupedArchive).forEach((k) =>
    groupedArchive[k].shiftsList.sort((a, b) => (shiftOrder[a.shift] || 9) - (shiftOrder[b.shift] || 9))
  );
  const sortedDates = Object.keys(groupedArchive).sort((a, b) => groupedArchive[b].timestamp - groupedArchive[a].timestamp);

  const reportData = {
    factoryName,
    stands,
    archive: productionArchive,
    changes: passChanges,
    downtimes: downtimesList,
    motors: motorsList,
    tempShiftLogs,
    billetWeight
  };

  const exportButtons = (
    <div className="flex flex-wrap gap-1">
      <button
        onClick={() => {
          window.history.pushState({ modal: 'whatsapp' }, '');
          setWhatsappModalOpen(true);
        }}
        className="bg-green-600 hover:bg-green-700 text-white font-bold py-1.5 px-2.5 rounded-lg text-[10px] flex items-center gap-1 shadow-sm"
      >
        <Share2 className="w-3 h-3" /> واتساب
      </button>
      <button
        onClick={() => downloadExcel(reportData)}
        className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-1.5 px-2.5 rounded-lg text-[10px] flex items-center gap-1 shadow-sm"
      >
        <FileSpreadsheet className="w-3 h-3" /> Excel
      </button>
      <button
        onClick={() =>
          printPDF(reportData, () =>
            showAlert('تعذر الفتح', 'المتصفح منع النافذة. اسمح بالنوافذ المنبثقة لهذا الموقع وجرّب تاني.')
          )
        }
        className="bg-rose-600 hover:bg-rose-700 text-white font-bold py-1.5 px-2.5 rounded-lg text-[10px] flex items-center gap-1 shadow-sm"
      >
        <FileText className="w-3 h-3" /> PDF
      </button>
    </div>
  );

  /* ---------- شاشة الدخول (قبل اختيار المستخدم) ---------- */
  if (currentUser === 'none') {
    return (
      <div className="flex flex-col items-center justify-center min-h-dvh bg-slate-50 text-slate-900 p-3.5 sm:p-6 select-none font-sans" dir="rtl">
        {loginModalJSX}
        <div className="bg-white p-5 sm:p-8 rounded-2xl sm:rounded-3xl max-w-sm w-full text-center border border-slate-200 shadow-lg relative space-y-4">
          <div onClick={handleSecretAdminTrigger} className="cursor-pointer inline-block w-full">
            {customLogo ? (
              <div className="w-full flex justify-center mb-2 bg-slate-50 p-2 rounded-xl border border-slate-200">
                <img src={customLogo} alt="Factory Logo" className="h-14 sm:h-16 object-contain" />
              </div>
            ) : (
              <div className="w-12 h-12 sm:w-16 sm:h-16 mx-auto bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-center mb-1">
                <Building2 className="w-6 h-6 sm:w-9 sm:h-9 text-emerald-600" />
              </div>
            )}
          </div>
          <div>
            <h1 onClick={handleSecretAdminTrigger} className="text-lg sm:text-2xl font-black text-slate-900 cursor-pointer">
              {factoryName}
            </h1>
            <p className="text-[11px] sm:text-xs text-emerald-700 font-bold mt-1 flex items-center justify-center gap-1">
              <Database className="w-3.5 h-3.5" /> قاعدة بيانات مستقلة ({stands.length} ستاند)
            </p>
          </div>

          {!isDataLoaded ? (
            <div className="text-slate-400 animate-pulse text-xs sm:text-sm font-bold py-4">جاري الاتصال بقاعدة البيانات...</div>
          ) : (
            <form onSubmit={handleQuickPinLogin} className="space-y-3 pt-1">
              <div className="text-right">
                <label className="text-xs font-black text-slate-700 block mb-1.5">
                  أدخل الكود الشخصي للموظف أو المدير:
                </label>
                <input
                  type="password"
                  autoFocus
                  value={quickPinInput}
                  onChange={(e) => {
                    setQuickPinInput(e.target.value);
                    setQuickPinError('');
                  }}
                  placeholder="أدخل الكود السري هنا..."
                  className="w-full bg-slate-50 border-2 border-slate-300 focus:border-blue-600 focus:bg-white rounded-xl p-2.5 sm:p-3 text-center font-mono text-lg sm:text-xl tracking-widest text-slate-900 outline-none transition-all"
                />
              </div>
              {quickPinError && (
                <p className="text-xs font-bold text-red-600 bg-red-50 border border-red-200 p-2 rounded-lg">
                  {quickPinError}
                </p>
              )}
              <button
                type="submit"
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-3 sm:py-3.5 rounded-xl shadow-md transition-colors text-xs sm:text-sm"
              >
                تسجيل الدخول للنظام
              </button>
            </form>
          )}

          {onBack && !isLinkEntry && (
            <button
              onClick={onBack}
              className="w-full pt-1 text-slate-400 hover:text-slate-700 text-xs font-bold flex items-center justify-center gap-1"
            >
              <RotateCcw className="w-3.5 h-3.5" /> العودة للبوابة الرئيسية
            </button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-slate-100 text-slate-900 font-sans flex flex-col p-1.5 sm:p-2.5 gap-2" dir="rtl">
      {/* ################ [أ-3] الأساس: النوافذ العامة ################ */}
      {modal.isOpen && (
        <Overlay z={100}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden border border-slate-200">
            <div className="p-4 sm:p-5">
              <h3 className="font-bold text-base sm:text-lg text-slate-800 flex items-center gap-2">
                {modal.type === 'alert' ? <CheckCircle className="text-green-500 w-5 h-5" /> : <AlertTriangle className="text-orange-500 w-5 h-5" />}
                {modal.title}
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed whitespace-pre-line">{modal.message}</p>
            </div>
            <div className="bg-slate-50 p-3 flex justify-end gap-2 border-t border-slate-100">
              {modal.type === 'confirm' && (
                <button onClick={closeBox} className="px-4 py-2 bg-slate-200 hover:bg-slate-300 rounded-lg font-bold text-slate-700 text-xs">
                  إلغاء
                </button>
              )}
              <button
                onClick={() => {
                  const cb = modal.onConfirm;
                  closeBox();
                  if (cb) cb();
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-xs shadow"
              >
                موافق
              </button>
            </div>
          </div>
        </Overlay>
      )}

      {loginModalJSX}

      {/* نافذة رفع شعار المصنع */}
      {isSettingsOpen && (
        <Overlay z={95}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden border border-slate-300">
            <div className="bg-slate-900 p-3 flex justify-between items-center text-white">
              <h3 className="font-bold text-xs sm:text-sm flex items-center gap-2">
                <Settings className="w-4 h-4" /> إعدادات شعار المصنع ({factoryName})
              </h3>
              <button onClick={() => setIsSettingsOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-4 flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                  <UploadCloud className="w-4 h-4 text-blue-600" /> رفع لوجو خاص بهذا المصنع:
                </label>
                <input
                  type="file"
                  accept="image/png, image/jpeg, image/webp"
                  onChange={handleLogoUpload}
                  className="w-full border border-slate-300 rounded-xl p-1.5 text-xs cursor-pointer"
                />
              </div>
              {tempLogoUrl && (
                <div className="bg-slate-100 p-3 rounded-xl border border-slate-200 flex flex-col items-center gap-2">
                  <div className="bg-white p-2 rounded shadow-sm">
                    <img src={tempLogoUrl} alt="Preview" className="h-16 object-contain" />
                  </div>
                </div>
              )}
              <div className="flex flex-col gap-2 border-t border-slate-200 pt-3">
                <label className="text-xs font-bold text-slate-700 flex items-center gap-1">
                  <Wrench className="w-4 h-4 text-blue-600" /> مسؤول صيانة الكهربا لكل وردية:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {SHIFTS_NORMAL.map((sh) => (
                    <div key={sh}>
                      <span className="text-[10px] font-bold text-slate-500 block mb-0.5">{sh}</span>
                      <input
                        type="text"
                        value={(tempMaintTechs || maintShiftTechs)[sh] || ''}
                        onChange={(e) => setTempMaintTechs({ ...(tempMaintTechs || maintShiftTechs), [sh]: e.target.value })}
                        className="w-full border border-slate-300 rounded-xl p-1.5 text-xs font-bold bg-white"
                      />
                    </div>
                  ))}
                </div>
                <p className="text-[10px] text-slate-400 font-bold">
                  بيُستخدم تلقائياً كفني الصيانة في تسجيلات الحرارة والفلاتر والتقارير.
                </p>
              </div>
              <button
                onClick={handleSaveSettings}
                className="w-full bg-blue-600 text-white font-bold py-2.5 rounded-xl hover:bg-blue-700 flex justify-center items-center gap-2 shadow-md text-xs"
              >
                <Save className="w-4 h-4" /> حفظ الإعدادات
              </button>
            </div>
          </div>
        </Overlay>
      )}

      {/* ################ [ب-3] الدرفيل والتتبع والتسجيل: النوافذ ################ */}
      {whatsappModalOpen && (
        <Overlay z={95}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-300 flex flex-col max-h-[90vh]">
            <div className="bg-green-700 text-white p-3 flex justify-between items-center">
              <h3 className="font-black text-xs sm:text-sm flex items-center gap-2">
                <Share2 className="w-4 h-4" /> ملخص تقرير الوردية السريع للواتساب
              </h3>
              <button onClick={() => setWhatsappModalOpen(false)} className="text-white/80 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-3.5 space-y-3 overflow-y-auto">
              <pre className="bg-slate-900 text-emerald-300 p-3 rounded-xl text-[11px] sm:text-xs font-sans whitespace-pre-wrap leading-relaxed border border-slate-700">
                {buildWhatsAppSummaryText()}
              </pre>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={handleCopyWhatsApp}
                  className="bg-slate-800 hover:bg-slate-900 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow"
                >
                  <Copy className="w-3.5 h-3.5" /> نسخ النص
                </button>
                <button
                  onClick={handleSendWhatsAppDirect}
                  className="bg-green-600 hover:bg-green-700 text-white font-bold py-2.5 rounded-xl text-xs flex items-center justify-center gap-1.5 shadow"
                >
                  <Share2 className="w-3.5 h-3.5" /> إرسال لواتساب
                </button>
              </div>
            </div>
          </div>
        </Overlay>
      )}

      {addStandOpen && isManagerLike && (
        <Overlay z={85}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-300">
            <div className="bg-slate-900 text-white p-3 flex justify-between items-center">
              <h3 className="font-bold text-xs sm:text-sm flex items-center gap-2">
                <PlusCircle className="w-4 h-4 text-emerald-400" /> إدارة عدد وإضافة قوائم الخط (Stands)
              </h3>
              <button onClick={() => setAddStandOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-3.5 space-y-3.5 text-xs">
              <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 space-y-2">
                <label className="font-black text-blue-900 block">
                  ضبط إجمالي عدد الستاندات بالمصنع (الحالي: {stands.length} ستاند):
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    min="1"
                    max="30"
                    value={targetStandsCount}
                    onChange={(e) => setTargetStandsCount(e.target.value)}
                    className="w-20 border border-blue-300 rounded-lg p-2 text-center font-mono font-bold bg-white"
                  />
                  <button
                    type="button"
                    onClick={handleResizeStandsCount}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg py-2 shadow"
                  >
                    تطبيق العدد الجديد
                  </button>
                </div>
              </div>

              <form onSubmit={handleAddSingleStand} className="space-y-2.5 border-t border-slate-200 pt-3">
                <h4 className="font-black text-slate-800">أو إضافة ستاند جديد بمواصفات مخصصة:</h4>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="font-bold text-slate-600 block mb-1">اسم الستاند:</label>
                    <input
                      type="text"
                      placeholder={`ستاند ${stands.length + 1}`}
                      value={newStandForm.name}
                      onChange={(e) => setNewStandForm({ ...newStandForm, name: e.target.value })}
                      className="w-full border border-slate-300 rounded p-1.5"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-600 block mb-1">شكل الممر (Type):</label>
                    <input
                      type="text"
                      placeholder="بيضاوي / مربع / دائري"
                      value={newStandForm.type}
                      onChange={(e) => setNewStandForm({ ...newStandForm, type: e.target.value })}
                      className="w-full border border-slate-300 rounded p-1.5"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-600 block mb-1">القطر (مم):</label>
                    <input
                      type="text"
                      value={newStandForm.diameter}
                      onChange={(e) => setNewStandForm({ ...newStandForm, diameter: e.target.value })}
                      className="w-full border border-slate-300 rounded p-1.5 font-mono"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-600 block mb-1">عدد الممرات بالدرفيل:</label>
                    <input
                      type="number"
                      value={newStandForm.totalPasses}
                      onChange={(e) => setNewStandForm({ ...newStandForm, totalPasses: e.target.value })}
                      className="w-full border border-slate-300 rounded p-1.5 font-mono"
                    />
                  </div>
                </div>
                <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-lg shadow">
                  + إضافة الستاند للخط
                </button>
              </form>
            </div>
          </div>
        </Overlay>
      )}

      {dupModal && existingShiftLog && (
        <Overlay z={95}>
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden border border-amber-300">
            <div className="bg-amber-500 text-slate-950 p-3 font-black text-sm flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" /> الوردية دي مسجلة قبل كده
            </div>
            <div className="p-4 flex flex-col gap-3 text-xs">
              <div className="bg-slate-50 border border-slate-200 rounded-lg p-3 grid grid-cols-2 gap-2 font-bold">
                <div className="text-slate-500">{existingShiftLog.date} - {existingShiftLog.shift}</div>
                <div className="text-slate-500 text-left" dir="ltr">{existingShiftLog.time}</div>
                <div>المسجل: <span className="font-mono text-blue-700">{existingShiftLog.billets} بليت</span></div>
                <div className="font-mono text-green-700">{existingShiftLog.tons.toFixed(1)} طن</div>
                <div className="col-span-2 border-t border-slate-200 pt-2">
                  الجديد: <span className="font-mono text-amber-700">{Number(shiftBillets)} بليت</span>
                </div>
              </div>
              <button onClick={() => commitShift('replace')} className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2.5 rounded-lg shadow">
                استبدال الرقم المسجل بالجديد ({Number(shiftBillets)} بليت)
              </button>
              <button onClick={() => commitShift('add')} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-lg shadow">
                إضافته على المسجل (المجموع {existingShiftLog.billets + Number(shiftBillets)} بليت)
              </button>
              <button onClick={() => setDupModal(false)} className="w-full bg-slate-200 hover:bg-slate-300 text-slate-700 font-bold py-2 rounded-lg">
                إلغاء
              </button>
            </div>
          </div>
        </Overlay>
      )}

      {/* ===== نافذة تفاصيل وممرات الستاند ===== */}
      {rollModal.isOpen && selectedRollStand && (() => {
        const st = selectedRollStand;
        const stat = getStandStatus(st.accumulatedTons, st.maxLimit);
        const pct = Math.min(100, Math.max(0, (st.accumulatedTons / st.maxLimit) * 100));
        const rollTotal = st.passes.reduce((a, p) => a + (Number(p.tons) || 0), 0);
        const usedCount = st.passes.filter((p) => p.status === 'used' || p.status === 'active').length;
        const myPending = pendingList.filter((r) => String(r.standId) === String(st.id));
        const kpi = (label, value, unit, cls = 'text-slate-900') => (
          <div className="bg-white rounded-xl border border-slate-200 p-2.5 flex flex-col gap-0.5">
            <span className="text-[10px] font-bold text-slate-500">{label}</span>
            <span className={`font-mono font-black text-base sm:text-xl leading-tight ${cls}`}>
              {value}
              <span className="text-[10px] font-bold text-slate-400 mr-1">{unit}</span>
            </span>
          </div>
        );
        return (
          <Overlay z={50}>
            <div className="bg-slate-100 rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden border border-slate-300 flex flex-col max-h-[92vh]">
              <div className="bg-slate-900 text-white p-3 sm:p-4 shrink-0">
                <div className="flex justify-between items-start gap-2">
                  <div className="flex items-center gap-2.5">
                    <div className="bg-amber-400 text-slate-950 font-black rounded-xl w-11 h-11 sm:w-14 sm:h-14 flex flex-col items-center justify-center leading-none shadow shrink-0">
                      <span className="text-[8px] sm:text-[9px] font-bold">ستاند</span>
                      <span className="text-lg sm:text-2xl">{st.id}</span>
                    </div>
                    <div>
                      <h3 className="font-black text-sm sm:text-lg leading-tight">{st.name}</h3>
                      <div className="flex flex-wrap gap-1 mt-1 text-[10px] font-bold">
                        {st.type && <span className="bg-slate-800 border border-slate-700 px-2 py-0.5 rounded">الممر: {st.type}</span>}
                        {st.diameter && (
                          <span className="bg-slate-800 border border-slate-700 px-2 py-0.5 rounded">
                            القطر: <span className="font-mono text-amber-300">{st.diameter}</span> مم
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => setRollModal({ isOpen: false, standIndex: null, isEditingInfo: false })}
                    className="text-slate-300 hover:text-white bg-slate-800 p-1.5 rounded-lg shrink-0"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                <div className="mt-2.5">
                  <div className="flex justify-between text-[10px] font-bold text-slate-300 mb-1">
                    <span>إنتاج الممر الحالي مقابل الحد الأقصى</span>
                    <span className="font-mono">{pct.toFixed(0)}%</span>
                  </div>
                  <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: stat.hex }} />
                  </div>
                </div>
              </div>

              <div className="p-2.5 sm:p-4 overflow-y-auto flex-1 flex flex-col gap-2.5">
                {myPending.map((r) => (
                  <div
                    key={r.id}
                    className={`rounded-xl border p-2 text-xs font-bold flex items-center justify-between gap-2 ${
                      r.status === 'pending' ? 'bg-amber-50 border-amber-300 text-amber-900' : 'bg-red-50 border-red-300 text-red-800'
                    }`}
                  >
                    <span className="flex items-center gap-1.5">
                      {r.status === 'pending' ? <Hourglass className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                      {r.status === 'pending' ? 'بانتظار موافقة المدير: ' : 'المدير رفض الطلب: '}
                      {r.kind === 'newRoll' ? 'تركيب درفيل جديد' : `نقل من ممر ${r.fromPass} إلى ممر ${r.targetPass}`}
                    </span>
                    {r.status === 'rejected' && (
                      <button onClick={() => dismissRequest(r.id)} className="bg-white border border-red-300 px-2 py-0.5 rounded text-[10px]">
                        حسناً
                      </button>
                    )}
                  </div>
                ))}

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {kpi('الممر الشغال', `${st.activePass} / ${st.totalPasses}`, 'ممر', 'text-blue-700')}
                  {kpi('إنتاج الممر', st.accumulatedTons.toFixed(0), 'طن', stat.text)}
                  {kpi('إجمالي الدرفيل', rollTotal.toFixed(0), 'طن', 'text-emerald-700')}
                  {kpi('ممرات استُهلكت', usedCount, `من ${st.totalPasses}`, 'text-purple-700')}
                </div>

                <div className="flex flex-wrap items-center justify-between gap-1.5 bg-white p-2 rounded-xl border border-slate-200">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <button
                      onClick={() => initiateResetStand(rollModal.standIndex)}
                      className="bg-blue-600 hover:bg-blue-700 text-white font-bold px-3 py-1.5 rounded-lg text-[11px] flex items-center gap-1 shadow"
                    >
                      <ArrowLeftRight className="w-3.5 h-3.5" /> {isManagerLike ? 'تغيير الممر' : 'طلب تغيير ممر'}
                    </button>
                    <button
                      onClick={handleInstallNewRoll}
                      className="bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-bold px-2.5 py-1.5 rounded-lg text-[11px] flex items-center gap-1 border border-emerald-300"
                    >
                      <RefreshCw className="w-3.5 h-3.5" /> درفيل جديد
                    </button>
                    <button
                      onClick={() => setHistoryModal({ isOpen: true, standId: st.id })}
                      className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold px-2.5 py-1.5 rounded-lg text-[11px] flex items-center gap-1 border border-slate-300"
                    >
                      <History className="w-3.5 h-3.5" /> السجل
                    </button>
                  </div>
                  {isManagerLike && (
                    <div className="flex gap-1">
                      <button
                        onClick={() => setRollModal((prev) => ({ ...prev, isEditingInfo: !prev.isEditingInfo }))}
                        className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold px-2.5 py-1.5 rounded-lg text-[11px] flex items-center gap-1 border border-slate-300"
                      >
                        <Edit3 className="w-3.5 h-3.5 text-blue-600" /> تعديل
                      </button>
                      {stands.length > 1 && (
                        <button
                          onClick={() => handleDeleteStand(rollModal.standIndex)}
                          className="bg-red-50 hover:bg-red-100 text-red-700 font-bold px-2 py-1.5 rounded-lg text-[11px] border border-red-200"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {isManagerLike && rollModal.isEditingInfo && (
                  <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-2.5 grid grid-cols-2 sm:grid-cols-4 gap-2 items-end">
                    {[
                      ['اسم الستاند', 'name', 'text'],
                      ['كود الدرفيل', 'rollCode', 'text'],
                      ['القطر (مم)', 'diameter', 'text'],
                      ['شكل الممر', 'type', 'text'],
                      ['عدد الممرات', 'totalPasses', 'number']
                    ].map(([label, key, type]) => (
                      <div key={key}>
                        <label className="text-[10px] font-bold text-slate-700 block mb-1">{label}:</label>
                        <input
                          type={type}
                          value={rollEditForm[key]}
                          onChange={(e) => setRollEditForm({ ...rollEditForm, [key]: e.target.value })}
                          className="w-full p-1.5 rounded border border-slate-300 text-xs font-mono bg-white"
                        />
                      </div>
                    ))}
                    <button
                      onClick={handleSaveRollMetadata}
                      className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold px-4 py-1.5 rounded-lg text-xs flex items-center justify-center gap-1 shadow"
                    >
                      <Save className="w-3.5 h-3.5" /> حفظ
                    </button>
                  </div>
                )}

                <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-6 gap-1.5 sm:gap-2">
                  {st.passes.map((p) => {
                    const isCurrent = p.status === 'active' || p.passNumber === st.activePass;
                    const isUsed = !isCurrent && p.status === 'used';
                    return (
                      <div
                        key={p.passNumber}
                        onClick={() => {
                          if (!isCurrent) initiateResetStand(rollModal.standIndex, p.passNumber);
                        }}
                        className={`rounded-xl border-2 p-2 flex flex-col gap-1 transition-all relative ${
                          isCurrent
                            ? 'bg-slate-900 text-white border-amber-400 shadow-md'
                            : isUsed
                            ? 'bg-blue-50 text-blue-950 border-blue-300 cursor-pointer'
                            : 'bg-white text-slate-700 border-slate-200 cursor-pointer'
                        }`}
                      >
                        <div className="flex justify-between items-center">
                          <span className="font-black text-[11px]">ممر {p.passNumber}</span>
                          {p.order && <span className="bg-amber-400 text-slate-950 font-black text-[9px] px-1 rounded">#{p.order}</span>}
                        </div>
                        <div className="text-center">
                          <span
                            className={`font-mono font-black text-lg leading-none ${
                              isCurrent ? 'text-amber-400' : isUsed ? 'text-blue-900' : 'text-slate-300'
                            }`}
                          >
                            {Number(p.tons || 0).toFixed(0)}
                          </span>
                          <span className="text-[9px] font-bold opacity-70 mr-0.5">ط</span>
                        </div>
                        <span
                          className={`text-center text-[9px] font-bold py-0.5 rounded ${
                            isCurrent ? 'bg-amber-400 text-slate-950' : isUsed ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          {isCurrent ? 'شغال' : isUsed ? 'منتهي' : 'جديد'}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </Overlay>
        );
      })()}

      {/* ===== نافذة تغيير الممر ===== */}
      {resetModal.isOpen && resetStandObj && (() => {
        const enteredBillets = Math.max(0, Number(resetBillets) || 0);
        const addedTonsToOld = enteredBillets * billetWeight;
        const previewOldFinalTons = resetStandObj.accumulatedTons + addedTonsToOld;
        return (
          <Overlay z={60}>
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-300 flex flex-col max-h-[90vh]">
              <div className="bg-slate-900 p-3 flex justify-between items-center text-white shrink-0">
                <h3 className="font-bold text-xs sm:text-sm flex items-center gap-2">
                  <RotateCcw className="w-4 h-4 text-amber-400" /> {isManagerLike ? 'تغيير ممر' : 'طلب تغيير ممر'} - {resetStandObj.name}
                </h3>
                <button onClick={() => setResetModal({ isOpen: false, standIndex: null })} className="text-slate-400 hover:text-white">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="p-3.5 flex flex-col gap-3 overflow-y-auto">
                <div className="bg-blue-50 border border-blue-200 p-2 rounded-lg flex justify-between items-center text-xs font-bold text-blue-900">
                  <span>
                    الشغال: <strong className="bg-slate-900 text-amber-400 px-2 py-0.5 rounded font-mono">ممر {resetStandObj.activePass}</strong>
                  </span>
                  <span>
                    الرصيد: <strong className="font-mono text-blue-700">{resetStandObj.accumulatedTons.toFixed(0)} طن</strong>
                  </span>
                </div>

                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-black text-slate-800">1. اختر الممر الجديد:</label>
                  <div className="grid grid-cols-6 sm:grid-cols-8 gap-1.5 bg-slate-100 p-2 rounded-xl border border-slate-200 max-h-36 overflow-y-auto">
                    {resetStandObj.passes.map((p) => {
                      const sel = Number(resetTargetPass) === p.passNumber;
                      const cur = p.passNumber === resetStandObj.activePass;
                      const used = p.status === 'used' && !cur;
                      return (
                        <button
                          type="button"
                          key={p.passNumber}
                          onClick={() => setResetTargetPass(p.passNumber)}
                          className={`p-1.5 rounded-lg font-mono text-xs font-black border-2 flex flex-col items-center transition-all ${
                            sel
                              ? 'bg-emerald-600 text-white border-emerald-900 shadow-sm'
                              : cur
                              ? 'bg-slate-900 text-amber-400 border-amber-400'
                              : used
                              ? 'bg-blue-100 text-blue-900 border-blue-300 opacity-80'
                              : 'bg-white text-slate-800 border-slate-300'
                          }`}
                        >
                          <span>{p.passNumber}</span>
                          <span className="text-[8px] font-normal opacity-80">
                            {cur ? 'الحالي' : used ? `${Number(p.tons).toFixed(0)}ط` : 'جديد'}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="flex flex-col gap-1 bg-amber-50/80 border border-amber-300 p-2.5 rounded-xl">
                  <label className="text-[11px] font-black text-amber-950">
                    كم كتلة (بليت) اشتغلها الممر القديم في هذه الوردية قبل تغييره؟
                  </label>
                  <input
                    type="number"
                    value={resetBillets}
                    onChange={(e) => setResetBillets(e.target.value)}
                    className="w-full border border-amber-400 rounded-lg p-2 font-mono text-sm font-black bg-white mt-1"
                    placeholder="مثلاً: 12 كتلة (اتركه 0 لو التغيير أول الوردية)"
                  />
                  <p className="text-[10px] font-bold text-slate-700 mt-1">
                    إغلاق القديم على: <strong className="font-mono text-blue-700">{previewOldFinalTons.toFixed(1)} طن</strong> | الجديد يبدأ من: <strong className="font-mono text-emerald-700">0 طن</strong>
                  </p>
                </div>

                <input
                  type="text"
                  value={resetNotes}
                  onChange={(e) => setResetNotes(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2 text-xs"
                  placeholder="ملاحظات أو سبب التغيير (تآكل، خشونة، مقاس...)"
                />
                <button
                  onClick={confirmResetStand}
                  className="w-full bg-blue-600 text-white font-bold py-2.5 rounded-xl hover:bg-blue-700 shadow text-xs"
                >
                  {isManagerLike
                    ? `تأكيد إغلاق ممر ${resetStandObj.activePass} وبدء ممر ${resetTargetPass}`
                    : `إرسال الطلب للمدير (ممر ${resetStandObj.activePass} ← ممر ${resetTargetPass})`}
                </button>
              </div>
            </div>
          </Overlay>
        );
      })()}

      {/* ===== نافذة موافقات المدير ===== */}
      {approvalsOpen && isManagerLike && (
        <Overlay z={70}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-300 flex flex-col max-h-[90vh]">
            <div className="bg-slate-900 p-3 flex justify-between items-center text-white shrink-0">
              <h3 className="font-bold text-xs sm:text-sm flex items-center gap-2">
                <Inbox className="w-4 h-4 text-amber-400" /> طلبات بانتظار الموافقة ({pendingCount})
              </h3>
              <button onClick={() => setApprovalsOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-3 overflow-y-auto flex flex-col gap-2.5 bg-slate-50">
              {pendingCount === 0 && <div className="text-center py-8 text-slate-400 font-bold text-xs">مفيش طلبات معلّقة.</div>}
              {pendingList
                .filter((r) => r.status === 'pending')
                .map((r) => {
                  const st = stands.find((s) => String(s.id) === String(r.standId));
                  const ed = getEdit(r);
                  return (
                    <div key={r.id} className="bg-white border border-slate-200 rounded-xl p-3 flex flex-col gap-2 shadow-sm">
                      <div className="flex justify-between items-center">
                        <span className="font-black text-xs sm:text-sm text-slate-900">{r.standName}</span>
                        <span
                          className={`text-[10px] font-black px-2 py-0.5 rounded ${
                            r.kind === 'newRoll' ? 'bg-emerald-100 text-emerald-800' : 'bg-blue-100 text-blue-800'
                          }`}
                        >
                          {r.kind === 'newRoll' ? 'تركيب درفيل جديد' : 'تغيير ممر'}
                        </span>
                      </div>
                      {r.kind === 'pass' && (
                        <div className="grid grid-cols-3 gap-2 text-[10px] font-bold">
                          <div>
                            <label className="block text-slate-600 mb-0.5">إلى ممر:</label>
                            <select
                              value={ed.targetPass}
                              onChange={(e) => setEdit(r.id, { targetPass: Number(e.target.value) })}
                              className="w-full border border-slate-300 rounded p-1 font-mono bg-white"
                            >
                              {st &&
                                st.passes.map((p) => (
                                  <option key={p.passNumber} value={p.passNumber}>
                                    ممر {p.passNumber}
                                  </option>
                                ))}
                            </select>
                          </div>
                          <div>
                            <label className="block text-slate-600 mb-0.5">كتل القديم:</label>
                            <input
                              type="number"
                              value={ed.billets}
                              onChange={(e) => setEdit(r.id, { billets: e.target.value })}
                              className="w-full border border-slate-300 rounded p-1 font-mono"
                            />
                          </div>
                          <div>
                            <label className="block text-slate-600 mb-0.5">ملاحظات:</label>
                            <input
                              type="text"
                              value={ed.notes || ''}
                              onChange={(e) => setEdit(r.id, { notes: e.target.value })}
                              className="w-full border border-slate-300 rounded p-1"
                            />
                          </div>
                        </div>
                      )}
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => rejectRequest(r)}
                          className="bg-red-50 text-red-700 border border-red-300 font-bold px-3 py-1 rounded-lg text-xs"
                        >
                          رفض
                        </button>
                        <button
                          onClick={() => approveRequest(r)}
                          className="bg-emerald-600 text-white font-bold px-3 py-1 rounded-lg text-xs shadow"
                        >
                          اعتماد
                        </button>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </Overlay>
      )}

      {/* ===== سجل الستاند ===== */}
      {historyModal.isOpen && (
        <Overlay z={80}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-300 flex flex-col max-h-[80vh]">
            <div className="bg-slate-800 p-3 flex justify-between items-center text-white shrink-0">
              <h3 className="font-bold text-xs sm:text-sm flex items-center gap-2">
                <History className="w-4 h-4" /> سجل تغييرات ستاند {historyModal.standId}
              </h3>
              <button onClick={() => setHistoryModal({ isOpen: false, standId: null })} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-3 overflow-y-auto flex-1 flex flex-col gap-2 bg-slate-50">
              {passChanges.filter((c) => String(c.standId) === String(historyModal.standId)).length === 0 ? (
                <div className="text-center py-8 text-slate-400 font-bold text-xs">لا يوجد سجل تغييرات لهذا الستاند.</div>
              ) : (
                passChanges
                  .filter((c) => String(c.standId) === String(historyModal.standId))
                  .map((c) => (
                    <div key={c.id} className="bg-white p-2.5 rounded-lg border border-slate-200 shadow-sm flex flex-col gap-1">
                      <div className="flex justify-between items-center border-b border-slate-100 pb-1">
                        <span className="text-[10px] font-bold text-slate-600">{c.date} | {c.shift}</span>
                        <span className="text-[11px] font-black text-blue-700">أُغلق على: {Number(c.tons).toFixed(1)} طن</span>
                      </div>
                      <div className="flex justify-between text-[10px] text-slate-600 font-bold">
                        <span>{c.kind === 'newRoll' ? 'درفيل جديد' : `ممر ${c.fromPass} ← ${c.toPass}`}</span>
                        <span>بواسطة: {c.requestedBy || '-'}</span>
                      </div>
                    </div>
                  ))
              )}
            </div>
          </div>
        </Overlay>
      )}

      {/* ################ [ج-3] المواتير: النوافذ ################ */}
      {/* ===== نافذة ملف وسجل صيانة الموتور ===== */}
      {selectedMotorForLog && (
        <Overlay z={85}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-300 flex flex-col max-h-[90vh]">
            <div className="bg-slate-900 text-white p-3.5 flex justify-between items-center">
              <div>
                <span className="text-[10px] bg-blue-600 px-2 py-0.5 rounded font-bold font-mono">
                  ID: {selectedMotorForLog.code}
                </span>
                <h3 className="font-black text-xs sm:text-base mt-1">
                  سجل صيانة ومتابعة موتور: {selectedMotorForLog.locationName}
                </h3>
              </div>
              <button onClick={() => setSelectedMotorForLog(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 sm:p-4 overflow-y-auto space-y-3 text-xs">
              <div className="flex gap-1.5">
                <button
                  type="button"
                  onClick={() => setMotorLogView('maint')}
                  className={`flex-1 py-1.5 rounded-xl font-black ${motorLogView === 'maint' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-600'}`}
                >
                  سجل الصيانة ({(selectedMotorForLog.logs || []).length})
                </button>
                <button
                  type="button"
                  onClick={() => setMotorLogView('temps')}
                  className={`flex-1 py-1.5 rounded-xl font-black ${motorLogView === 'temps' ? 'bg-amber-500 text-slate-950' : 'bg-slate-100 text-slate-600'}`}
                >
                  سجل الحرارة ({selectedMotorTempHistory.length})
                </button>
              </div>
              {motorLogView === 'maint' && (
              <>
              <form onSubmit={handleAddMotorMaintenanceLog} className="bg-blue-50/60 border border-blue-200 rounded-xl p-3 space-y-2.5">
                <h4 className="font-black text-blue-950">تسجيل صيانة أو إصلاح جديد للموتور:</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">نوع الصيانة:</label>
                    <select
                      value={motorMaintForm.type}
                      onChange={(e) => setMotorMaintForm({ ...motorMaintForm, type: e.target.value })}
                      className="w-full border border-slate-300 rounded-lg p-2 bg-white font-bold"
                    >
                      <option>فحص دوري وعزل</option>
                      <option>تشحيم  </option>
                      <option>تغيير شربون /  </option>
                      <option>عمرة / لف موتور</option>
                      <option>إصلاح عطل طارئ بالوردية</option>
                             <option> تغيير فلاتر  </option>
                      <option>تنضيف بالهواء</option>
                    </select>
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">
                      {isSupervisorLogin ? 'الملاحظ المشرف (تلقائي من حسابك):' : 'الفني المنفذ (تلقائي من حسابك):'}
                    </label>
                    <div className="w-full border border-emerald-300 rounded-lg p-2 bg-emerald-50 font-black text-emerald-900 truncate">
                      {roleLabel}
                    </div>
                  </div>
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">
                      {isSupervisorLogin ? 'أسماء الفنيين المنفذين:' : 'اسم الملاحظ المشرف:'}
                    </label>
                    {isSupervisorLogin ? (
                      <input
                        type="text"
                        placeholder="مثلاً: محمد صابر، أحمد علي"
                        value={motorMaintForm.techName}
                        onChange={(e) => setMotorMaintForm({ ...motorMaintForm, techName: e.target.value })}
                        className="w-full border border-slate-300 rounded-lg p-2 bg-white font-bold"
                      />
                    ) : (
                      <input
                        type="text"
                        placeholder="اسم الملاحظ"
                        value={motorMaintForm.supervisorName}
                        onChange={(e) => setMotorMaintForm({ ...motorMaintForm, supervisorName: e.target.value })}
                        className="w-full border border-slate-300 rounded-lg p-2 bg-white font-bold"
                      />
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <input
                    type="text"
                    placeholder="العزل 550 MΩ"
                    value={motorMaintForm.megger}
                    onChange={(e) => setMotorMaintForm({ ...motorMaintForm, megger: e.target.value })}
                    className="border border-slate-300 rounded-lg p-1.5 bg-white font-mono"
                  />
                  <input
                    type="number"
                    placeholder="حرارة الجسم °C"
                    value={motorMaintForm.bodyTemp}
                    onChange={(e) => setMotorMaintForm({ ...motorMaintForm, bodyTemp: e.target.value })}
                    className="border border-slate-300 rounded-lg p-1.5 bg-white font-mono"
                  />
                  <input
                    type="number"
                    placeholder="حرارة البلي °C"
                    value={motorMaintForm.bearingTemp}
                    onChange={(e) => setMotorMaintForm({ ...motorMaintForm, bearingTemp: e.target.value })}
                    className="border border-slate-300 rounded-lg p-1.5 bg-white font-mono"
                  />
                  <input
                    type="text"
                    placeholder="الأمبير A"
                    value={motorMaintForm.ampsRead}
                    onChange={(e) => setMotorMaintForm({ ...motorMaintForm, ampsRead: e.target.value })}
                    className="border border-slate-300 rounded-lg p-1.5 bg-white font-mono"
                  />
                </div>

                <input
                  type="text"
                  placeholder="تفاصيل الصيانة أو قطع الغيار التي تم تغييرها..."
                  value={motorMaintForm.notes}
                  onChange={(e) => setMotorMaintForm({ ...motorMaintForm, notes: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg p-2 bg-white"
                />
                <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded-xl shadow">
                  + حفظ في سجل الموتور
                </button>
              </form>

              <div className="space-y-2">
                <h4 className="font-black text-slate-800">أرشيف الصيانات السابقة ({(selectedMotorForLog.logs || []).length}):</h4>
                {(selectedMotorForLog.logs || []).map((lg) => (
                  <div key={lg.id} className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 space-y-1">
                    <div className="flex justify-between font-bold text-[11px]">
                      <span className="text-blue-700 font-black">{lg.type}</span>
                      <span className="font-mono text-slate-500">{lg.date}</span>
                    </div>
                    <p className="text-slate-800 font-bold">{lg.notes}</p>
                    <p className="text-[10px] text-emerald-700 font-bold">
                      🔧 الفني: {lg.techName || lg.by} | 👷 الملاحظ: {lg.supervisorName || '-'}
                    </p>
                  </div>
                ))}
              </div>
              </>
              )}
              {motorLogView === 'temps' && (
                <div className="space-y-2">
                  <h4 className="font-black text-slate-800">
                    قراءات الحرارة في الورديات (الجسم مرتين + البلي الأمامي والخلفي):
                  </h4>
                  {selectedMotorTempHistory.length === 0 && (
                    <p className="text-slate-500 font-bold bg-slate-50 border border-slate-200 rounded-xl p-3 text-center">
                      لا توجد قراءات حرارة مسجلة لهذا الموتور بعد.
                    </p>
                  )}
                  {selectedMotorTempHistory.map((r) => (
                    <div key={`${r.batchId}-${r.motorId}`} className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 space-y-1">
                      <div className="flex justify-between font-bold text-[11px]">
                        <span className="text-amber-700 font-black">{r.shift}</span>
                        <span className="font-mono text-slate-500">{r.date}</span>
                      </div>
                      <p className="font-mono font-black text-slate-800">
                        {r.bodyTemp1 !== undefined
                          ? `الجسم: ${r.bodyTemp1 || '-'}° / ${r.bodyTemp2 || '-'}° • البلي: أمامي ${r.frontBearingTemp || '-'}° / خلفي ${r.rearBearingTemp || '-'}°`
                          : `الجسم: ${r.bodyTemp || '-'}° • البلي: ${r.bearingTemp || '-'}°`}
                        {` • ${r.amps || '-'} A`}
                      </p>
                      <p className="text-[10px] text-emerald-700 font-bold">
                        🔧 الفني: {r.recordedBy || '-'} | 👷 الملاحظ: {r.supervisor || '-'}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </Overlay>
      )}

      {/* ################ [أ-4] الأساس: الهيدر وشريط التبويبات ################ */}
      {/* ===== الهيدر العلوي المدمج مع الساعة الحية وزر الشعار ===== */}
      <nav className="bg-slate-900 text-white p-2 sm:p-2.5 rounded-2xl flex flex-col gap-2 shadow-md select-none">
        <div className="flex justify-between items-center gap-1.5">
          <div onClick={handleSecretAdminTrigger} className="flex items-center gap-2 cursor-pointer min-w-0">
            {customLogo ? (
              <div className="bg-white p-1 rounded-lg shadow-sm flex shrink-0">
                <img src={customLogo} alt="Logo" className="h-5 sm:h-6 w-auto max-w-[70px] object-contain" />
              </div>
            ) : (
              <div className="bg-emerald-600 p-1.5 rounded-xl shrink-0">
                <Building2 className="w-4 h-4 text-white" />
              </div>
            )}
            <div className="truncate">
              <span className="font-black text-xs sm:text-sm text-white block truncate">{factoryName}</span>
              <span className="text-[10px] text-emerald-400 font-bold block truncate">{roleLabel}</span>
            </div>
          </div>

          <div className="hidden md:block">
            <LiveClock />
          </div>

          <div className="flex items-center gap-1 shrink-0">
            {canAccessTab('dashboard') && (
              <button
                onClick={() => {
                  window.history.pushState({ modal: 'whatsapp' }, '');
                  setWhatsappModalOpen(true);
                }}
                className="bg-green-600 hover:bg-green-500 text-white px-2 py-1.5 rounded-xl text-[10px] font-bold flex items-center gap-1"
              >
                <Share2 className="w-3 h-3" />
                <span>واتساب</span>
              </button>
            )}
            {isManagerLike && (
              <button
                onClick={handleCopyEmployeeDirectLink}
                className="bg-blue-600 hover:bg-blue-500 text-white px-2 py-1.5 rounded-xl text-[10px] font-bold flex items-center gap-1"
                title="نسخ رابط الموظفين"
              >
                <Link2 className="w-3 h-3" />
                <span className="hidden sm:inline">رابط الموظفين</span>
              </button>
            )}
            {isManagerLike && (
              <button
                onClick={() => {
                  window.history.pushState({ modal: 'approvals' }, '');
                  setApprovalsOpen(true);
                }}
                className="relative bg-amber-500 text-slate-950 p-1.5 rounded-xl"
              >
                <Inbox className="w-3.5 h-3.5" />
                {pendingCount > 0 && (
                  <span className="absolute -top-1 -left-1 bg-red-600 text-white text-[9px] font-black rounded-full min-w-[15px] h-3.5 px-1 flex items-center justify-center">
                    {pendingCount}
                  </span>
                )}
              </button>
            )}
            {(isManagerLike || isSuperAdmin) && (
              <button
                onClick={openSettingsModal}
                className="bg-slate-800 hover:bg-slate-700 text-blue-300 p-1.5 rounded-xl"
                title="رفع شعار المصنع"
              >
                <Settings className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              onClick={handleLogout}
              className="bg-red-500/20 text-red-300 border border-red-500/30 px-2 py-1.5 rounded-xl text-[10px] font-bold"
            >
              خروج
            </button>
          </div>
        </div>

        {/* شريط التبويبات الأفقي الناعم للموبايل */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 no-scrollbar">
          {FACTORY_TABS.filter(([k]) => (k !== 'staff' || isManagerLike) && canAccessTab(k)).map(([k, label, Icon]) => (
            <button
              key={k}
              onClick={() => setActiveTab(k)}
              className={`px-3 py-1.5 text-[11px] font-bold rounded-xl flex items-center gap-1.5 whitespace-nowrap shrink-0 transition-all ${
                activeTab === k
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-slate-800/90 text-slate-300 hover:bg-slate-800'
              }`}
            >
              <Icon className="w-3.5 h-3.5 shrink-0" />
              <span>{label}</span>
            </button>
          ))}
        </div>
      </nav>

      {/* صفحة القسم المغلق: الأقسام غير المسموحة مخفية من الشريط، وتظهر هذه الرسالة فقط لو وصل لها من الرابط أو زر الرجوع */}
      {!canAccessTab(activeTab) && (
        <div className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col items-center justify-center gap-2 text-center">
          <Lock className="w-8 h-8 text-slate-400" />
          <h2 className="font-black text-sm text-slate-800">هذا القسم مغلق</h2>
          <p className="text-xs text-slate-500 font-bold">ليس لديك صلاحية دخول هذا القسم. تواصل مع مدير المصنع.</p>
        </div>
      )}

      {/* ################ [ب-4] الدرفيل والتتبع والتسجيل: صفحة الممرات والتشغيل ################ */}
      {/* ===== 1. لوحة التشغيل والممرات (مع إرجاع زر "الآن" وكل أزرار التحكم) ===== */}
      {activeTab === 'dashboard' && canAccessTab('dashboard') && (
        <div className="flex flex-col gap-2 flex-1">
          {isManagerLike && (
            <div className="bg-white p-2.5 sm:p-3 rounded-2xl border border-slate-200 shadow-sm space-y-2">
              <div className="grid grid-cols-3 gap-1.5 text-center">
                <div className="bg-emerald-50 py-1.5 px-2 border border-emerald-200 rounded-xl">
                  <span className="text-[9px] font-bold text-emerald-800 block">سليم (&lt;80%)</span>
                  <span className="font-black text-base text-emerald-700">{stands.filter((s) => s.accumulatedTons / s.maxLimit < 0.8).length}</span>
                </div>
                <div className="bg-amber-50 py-1.5 px-2 border border-amber-300 rounded-xl">
                  <span className="text-[9px] font-bold text-amber-800 block">إنذار (+80%)</span>
                  <span className="font-black text-base text-amber-700">
                    {stands.filter((s) => s.accumulatedTons / s.maxLimit >= 0.8 && s.accumulatedTons / s.maxLimit < 1).length}
                  </span>
                </div>
                <div className="bg-red-50 py-1.5 px-2 border border-red-300 rounded-xl">
                  <span className="text-[9px] font-bold text-red-800 block">خطر (+100%)</span>
                  <span className="font-black text-base text-red-700">{stands.filter((s) => s.accumulatedTons / s.maxLimit >= 1).length}</span>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-1.5 pt-1.5 border-t border-slate-100">
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-bold text-slate-700">المقاس:</span>
                  <select
                    value={selectedProductSize}
                    onChange={(e) => handleProductSizeChange(e.target.value)}
                    className="bg-slate-100 border border-slate-300 text-slate-900 text-[11px] font-black px-2 py-1 rounded-lg"
                  >
                    {['10', '12', '14', '16', '18', '20', '22', '25', '32', 'خوصة 50×10', 'خوصة 40×10'].map((s) => (
                      <option key={s} value={s}>
                        {s} مم
                      </option>
                    ))}
                  </select>
                  <span className="text-[11px] font-bold text-slate-700 mr-1">البليت:</span>
                  <input
                    type="number"
                    step="0.01"
                    value={billetWeight}
                    onChange={(e) => handleWeightChange(e.target.value)}
                    className="w-14 p-1 border border-slate-300 rounded-lg text-center font-mono font-bold text-[11px] bg-slate-50"
                  />
                </div>
                <div className="flex flex-wrap gap-1">
                  {exportButtons}
                  <button
                    onClick={() => setAddStandOpen(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-1.5 px-2 rounded-lg text-[10px] flex items-center gap-1"
                  >
                    <PlusCircle className="w-3 h-3" /> الستاندات ({stands.length})
                  </button>
                  <button
                    onClick={handleResetAllStands}
                    className="bg-orange-500 hover:bg-orange-600 text-white font-bold py-1.5 px-2 rounded-lg text-[10px] flex items-center gap-1"
                  >
                    <RefreshCw className="w-3 h-3" /> تصفير الكل
                  </button>
                  <button
                    onClick={handleClearArchive}
                    className="bg-red-600 hover:bg-red-700 text-white font-bold py-1.5 px-2 rounded-lg text-[10px] flex items-center gap-1"
                  >
                    <Trash2 className="w-3 h-3" /> مسح الأرشيف
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* شريط تسجيل الوردية مع زر "الآن" للرجوع الفوري للوردية الحالية */}
          <div className="bg-white p-2.5 rounded-2xl shadow-sm border border-slate-200 space-y-2">
            <div className="bg-blue-50 border border-blue-200 text-blue-900 text-[11px] font-bold py-1.5 px-2 rounded-xl flex justify-between items-center gap-1">
              <button
                onClick={() => handleDateChange(-1)}
                className="px-2.5 py-1 bg-blue-200/80 hover:bg-blue-300 text-blue-950 rounded-lg text-[10px] font-black active:scale-95 shrink-0"
              >
                يوم سابق
              </button>

              <div className="flex items-center gap-1.5 min-w-0">
                <button
                  onClick={handleGoToToday}
                  className="px-2 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg shadow-sm text-[10px] font-black flex items-center gap-1 active:scale-95 shrink-0"
                  title="العودة لليوم والوردية الحالية الآن"
                >
                  <span>الآن</span>
                  <RotateCcw className="w-3 h-3" />
                </button>
                <div className="text-center truncate">
                  <span className="font-black block truncate">
                    {currentProdDate.toLocaleDateString('ar-EG', { weekday: 'long' })} ({currentDateStr})
                  </span>
                </div>
              </div>

              <button
                onClick={() => handleDateChange(1)}
                className="px-2.5 py-1 bg-blue-200/80 hover:bg-blue-300 text-blue-950 rounded-lg text-[10px] font-black active:scale-95 shrink-0"
              >
                يوم تالي
              </button>
            </div>

            <div className="flex items-stretch gap-1.5">
              <select
                value={selectedShift}
                onChange={(e) => setSelectedShift(e.target.value)}
                className="w-32 sm:w-44 bg-slate-50 border border-slate-300 text-[11px] font-black px-2 py-2 rounded-xl shrink-0"
              >
                {availableShifts.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
              <input
                type="number"
                value={shiftBillets}
                onChange={(e) => setShiftBillets(e.target.value)}
                className="flex-1 min-w-0 p-2 border border-slate-300 rounded-xl text-center text-xs sm:text-sm font-black bg-slate-50"
                placeholder="عدد البليت..."
              />
              <button
                onClick={handleAddShiftProduction}
                className="bg-blue-600 hover:bg-blue-700 text-white font-black px-3 sm:px-5 py-2 rounded-xl flex items-center gap-1 shadow text-xs shrink-0"
              >
                <Save className="w-3.5 h-3.5" /> حفظ
              </button>
            </div>
          </div>

          {/* شبكة كروت الستاندات المضبوطة للموبايل */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 pb-6">
            {stands.map((stand, idx) => {
              const percentage = Math.max(0, Math.min((stand.accumulatedTons / stand.maxLimit) * 100, 100));
              const status = getStandStatus(stand.accumulatedTons, stand.maxLimit);
              const usedCount = stand.passes ? stand.passes.filter((p) => p.status === 'used' || p.status === 'active').length : 1;
              const sp = pendingList.filter((r) => String(r.standId) === String(stand.id));
              const hasPending = sp.some((r) => r.status === 'pending');

              return (
                <div
                  key={stand.id}
                  onClick={() => openStandRollPage(idx)}
                  className={`rounded-2xl flex flex-col justify-between border-2 cursor-pointer ${
                    stand.isActive ? status.bg : 'bg-slate-200 opacity-60'
                  } ${status.border} p-2.5 relative overflow-hidden shadow-sm transition-all`}
                >
                  <div className="absolute bottom-0 left-0 w-full h-1 bg-slate-200">
                    <div className={`h-full ${status.bar}`} style={{ width: `${percentage}%` }} />
                  </div>

                  <div className="flex justify-between items-start z-10">
                    <div className="min-w-0">
                      <span className="font-black text-xs sm:text-sm text-slate-900 block truncate">{stand.name}</span>
                      <span className="text-[9px] text-slate-500 font-bold block truncate">
                        {[stand.type, stand.diameter && `Ø${stand.diameter}`].filter(Boolean).join(' • ')}
                      </span>
                    </div>
                    <button
                      onClick={(e) => handleToggleActive(idx, e)}
                      className={`p-1 rounded-lg shrink-0 ${stand.isActive ? 'text-emerald-600 bg-emerald-50' : 'text-slate-400 bg-slate-200'}`}
                    >
                      <Power className="w-3 h-3" />
                    </button>
                  </div>

                  {hasPending && (
                    <span className="my-0.5 self-start text-[8px] font-black px-1.5 py-0.5 rounded bg-amber-400 text-slate-950">
                      بانتظار المدير
                    </span>
                  )}

                  <div className="flex flex-col items-center justify-center py-2 z-10">
                    <span className={`font-mono font-black text-2xl sm:text-3xl leading-none ${status.text}`}>
                      {stand.accumulatedTons.toFixed(0)}
                    </span>
                    <span className="text-[9px] text-slate-400 font-bold mt-0.5">من {stand.maxLimit} طن</span>
                    <div className="flex items-center gap-1 mt-1.5">
                      <span className="bg-slate-900 text-amber-400 text-[9px] font-black px-1.5 py-0.5 rounded">
                        ممر {stand.activePass}/{stand.totalPasses}
                      </span>
                      <span className="text-[9px] font-bold text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded">
                        استُهلك {usedCount}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-1 pt-1.5 border-t border-slate-200/70 z-10" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => openStandRollPage(idx)}
                      className="py-1 bg-blue-600 text-white text-[10px] font-bold rounded-lg"
                    >
                      الممرات
                    </button>
                    <button
                      onClick={(e) => initiateResetStand(idx, null, e)}
                      className="py-1 bg-slate-800 text-white text-[10px] font-bold rounded-lg"
                    >
                      نقل ممر
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ################ [ج-4] المواتير: صفحة حالة وحرارة المواتير ################ */}
      {/* ===== 2. صفحة متابعة حالة وحرارة المواتير ===== */}
      {activeTab === 'motors' && canAccessTab('motors') && (
        <div className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-200 p-2.5 sm:p-4 space-y-3">
          <div className="bg-slate-900 text-white p-3 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2.5">
            <div>
              <h2 className="font-black text-xs sm:text-base flex items-center gap-1.5">
                <Cpu className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-400" /> متابعة حالة وحرارة المواتير ({factoryName})
              </h2>
            </div>
            <div className="grid grid-cols-4 sm:flex gap-1.5 w-full sm:w-auto">
              <button
                onClick={() => setMotorSubView('cards')}
                className={`px-2.5 py-1.5 rounded-xl text-[11px] font-black flex items-center justify-center gap-1 ${
                  motorSubView === 'cards' ? 'bg-blue-600 text-white' : 'bg-slate-800 text-slate-300'
                }`}
              >
                <Cpu size={13} /> المواتير ({motorsList.length})
              </button>
              <button
                onClick={() => setMotorSubView('shift_temp')}
                className={`px-2.5 py-1.5 rounded-xl text-[11px] font-black flex items-center justify-center gap-1 ${
                  motorSubView === 'shift_temp' ? 'bg-amber-500 text-slate-950' : 'bg-slate-800 text-amber-400'
                }`}
              >
                <Thermometer size={13} /> حرارة الوردية
              </button>
              <button
                onClick={() => setMotorSubView('add_new')}
                className={`px-2.5 py-1.5 rounded-xl text-[11px] font-black flex items-center justify-center gap-1 ${
                  motorSubView === 'add_new' ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-emerald-400'
                }`}
              >
                <PlusCircle size={13} /> + موتور
              </button>
              <button
                onClick={() => setMotorSubView('reports')}
                className={`px-2.5 py-1.5 rounded-xl text-[11px] font-black flex items-center justify-center gap-1 ${
                  motorSubView === 'reports' ? 'bg-rose-600 text-white' : 'bg-slate-800 text-rose-400'
                }`}
              >
                <BookMarked size={13} /> تقارير
              </button>
            </div>
          </div>

          {motorSubView === 'shift_temp' && (
            <form onSubmit={handleSaveShiftTemperatures} className="space-y-3">
              <div className="bg-amber-50 border border-amber-300 rounded-2xl p-3 space-y-2.5">
                <div className="flex flex-wrap justify-between items-center gap-2 border-b border-amber-200 pb-2">
                  <h3 className="font-black text-xs sm:text-sm text-amber-950">
                    تسجيل حرارة المواتير — {selectedShift} ({currentDateStr})
                  </h3>
                  {exportButtons}
                </div>
                <div className="grid grid-cols-2 gap-1.5 text-[11px] font-black">
                  <button
                    type="button"
                    onClick={() => setTempRound(1)}
                    className={`py-2 rounded-xl border transition-all ${
                      tempRound === 1
                        ? 'bg-amber-500 border-amber-600 text-slate-950 shadow'
                        : 'bg-white/70 border-amber-200 text-amber-800'
                    }`}
                  >
                    ① القراءة الأولى — بداية الوردية
                    <span className="block text-[9px] font-bold opacity-80">جسم الموتور + البلي الأمامي والخلفي + الأمبير</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setTempRound(2)}
                    className={`py-2 rounded-xl border transition-all ${
                      tempRound === 2
                        ? 'bg-sky-500 border-sky-600 text-white shadow'
                        : 'bg-white/70 border-sky-200 text-sky-800'
                    }`}
                  >
                    ② القراءة الثانية — وسط الوردية
                    <span className="block text-[9px] font-bold opacity-80">جسم الموتور فقط</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
                  <select
                    value={selectedShift}
                    onChange={(e) => setSelectedShift(e.target.value)}
                    className="border border-amber-300 rounded-xl p-2 bg-white font-black"
                  >
                    {availableShifts.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                  <div className="border border-amber-300 rounded-xl p-2 bg-amber-100/60 font-bold text-amber-950 flex flex-col justify-center">
                    <span className="text-[9px] text-amber-700 block">
                      {isSupervisorLogin ? 'الملاحظ (يُسجَّل تلقائياً من حسابك)' : 'الفني القائم بالقياس (يُسجَّل تلقائياً من حسابك)'}
                    </span>
                    <span className="truncate">{roleLabel}</span>
                  </div>
                  {isSupervisorLogin ? (
                    <input
                      type="text"
                      placeholder="أسماء الفنيين المشاركين في القياس..."
                      value={shiftTempTech}
                      onChange={(e) => setShiftTempTech(e.target.value)}
                      className="border border-amber-300 rounded-xl p-2 bg-white font-bold"
                    />
                  ) : (
                    <input
                      type="text"
                      placeholder="اسم الملاحظ / مهندس الوردية..."
                      value={shiftTempSupervisor}
                      onChange={(e) => setShiftTempSupervisor(e.target.value)}
                      className="border border-amber-300 rounded-xl p-2 bg-white font-bold"
                    />
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                {motorsList.map((m) => {
                  const inp = shiftTempInputs[m.id] || {};
                  return (
                    <div key={m.id} className="bg-slate-50 border border-slate-200 rounded-xl p-2.5 space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="font-black text-xs text-slate-900">{m.locationName || `ستاند ${m.stand}`}</span>
                        <span className="font-mono text-[10px] font-black bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                          ID: {m.code}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {round1RecordedIds.has(m.id) && (
                          <p className="text-[9px] font-black text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-lg px-1.5 py-0.5">
                            ✅ القراءة الأولى
                          </p>
                        )}
                        {round2RecordedIds.has(m.id) && (
                          <p className="text-[9px] font-black text-sky-700 bg-sky-50 border border-sky-200 rounded-lg px-1.5 py-0.5">
                            ✅ القراءة الثانية
                          </p>
                        )}
                      </div>
                      <div className={`grid ${tempRound === 1 ? 'grid-cols-2' : 'grid-cols-1'} gap-1.5 text-[10px]`}>
                        {(tempRound === 1
                          ? [
                              ['bodyTemp1', 'الجسم ① °C', 'border-slate-300 bg-white'],
                              ['frontBearingTemp', 'البلي الأمامي °C', 'border-amber-400 bg-amber-50/50'],
                              ['rearBearingTemp', 'البلي الخلفي °C', 'border-amber-400 bg-amber-50/50'],
                              ['amps', 'الأمبير A', 'border-slate-300 bg-white']
                            ]
                          : [['bodyTemp2', 'الجسم ② °C', 'border-sky-400 bg-sky-50/50']]
                        ).map(([key, label, cls]) => (
                          <div key={key}>
                            <label className="text-slate-500 font-bold block mb-0.5">{label}</label>
                            <input
                              type="number"
                              placeholder={key === 'amps' ? m.amps || '400' : ''}
                              value={inp[key] ?? ''}
                              onChange={(e) =>
                                setShiftTempInputs({
                                  ...shiftTempInputs,
                                  [m.id]: { ...inp, [key]: e.target.value }
                                })
                              }
                              className={`w-full border rounded-lg p-1.5 text-center font-mono font-black ${cls}`}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>

              <button
                type="submit"
                className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-2.5 rounded-xl shadow text-xs flex items-center justify-center gap-1.5"
              >
                <Save className="w-4 h-4" /> {tempRound === 1 ? 'حفظ القراءة الأولى (بداية الوردية)' : 'حفظ القراءة الثانية (وسط الوردية — جسم فقط)'} — {selectedShift}
              </button>
            </form>
          )}

          {motorSubView === 'shift_temp' && (
            <div className="bg-sky-50 border border-sky-300 rounded-2xl p-3 space-y-2.5">
              <div className="flex flex-wrap justify-between items-center gap-2 border-b border-sky-200 pb-2">
                <h3 className="font-black text-xs sm:text-sm text-sky-950">
                  صيانة الوردية السريعة — {selectedShift} ({currentDateStr})
                </h3>
                <span className="text-[10px] font-black text-sky-800 bg-white/70 border border-sky-200 rounded-lg px-2 py-1">
                  مسؤول صيانة الوردية: {maintShiftTechs[selectedShift] || roleLabel}
                </span>
              </div>
              <button
                type="button"
                onClick={handleBulkFilterChange}
                className="w-full bg-sky-600 hover:bg-sky-700 text-white font-black py-2 rounded-xl shadow text-xs flex items-center justify-center gap-1.5"
              >
                <CheckCircle className="w-4 h-4" /> تسجيل تغيير الفلاتر لكل المواتير ({motorsList.length}) دفعة واحدة
              </button>
              <div className="space-y-1.5">
                <p className="text-[10px] font-black text-sky-900">التنضيف بالهوا من الداخل — حدد المواتير اللي اتنضفت:</p>
                <div className="flex flex-wrap gap-1.5">
                  {motorsList.map((m) => {
                    const on = !!airBlowSelected[m.id];
                    return (
                      <button
                        type="button"
                        key={m.id}
                        onClick={() => setAirBlowSelected({ ...airBlowSelected, [m.id]: !on })}
                        className={`px-2 py-1 rounded-lg text-[10px] font-black border transition-all ${
                          on ? 'bg-sky-600 text-white border-sky-700 shadow' : 'bg-white text-slate-600 border-slate-300'
                        }`}
                      >
                        {on ? '✓ ' : ''}
                        {m.locationName || `ستاند ${m.stand}`}
                      </button>
                    );
                  })}
                </div>
                <button
                  type="button"
                  onClick={handleBulkAirBlow}
                  className="w-full bg-white hover:bg-sky-100 text-sky-800 border border-sky-400 font-black py-2 rounded-xl text-xs"
                >
                  💨 تسجيل التنضيف بالهوا للمواتير المحددة ({Object.values(airBlowSelected).filter(Boolean).length})
                </button>
              </div>
            </div>
          )}

          {motorSubView === 'add_new' && (
            <form onSubmit={handleAddMotor} className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 space-y-3 text-xs">
              <h3 className="font-black text-xs sm:text-sm text-slate-900 border-b border-slate-200 pb-2">
                إضافة موتور جديد لقاعدة بيانات ({factoryName})
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">القسم:</label>
                  <select
                    value={newMotor.category}
                    onChange={(e) => setNewMotor({ ...newMotor, category: e.target.value })}
                    className="w-full border border-slate-300 rounded-xl p-2 bg-white font-bold"
                  >
                    <option value="rolling">درفلة رئيسي</option>
                    <option value="aux">كهرباء مساعدة</option>
                  </select>
                </div>

                {newMotor.category === 'rolling' ? (
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">الستاند:</label>
                    <select
                      value={newMotor.stand}
                      onChange={(e) => setNewMotor({ ...newMotor, stand: e.target.value, locationName: `ستاند ${e.target.value}` })}
                      className="w-full border border-slate-300 rounded-xl p-2 bg-white font-bold"
                    >
                      {stands.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">اسم المعدة:</label>
                    <input
                      type="text"
                      placeholder="مقص طائر / طلمبة"
                      value={newMotor.locationName}
                      onChange={(e) => setNewMotor({ ...newMotor, locationName: e.target.value })}
                      className="w-full border border-slate-300 rounded-xl p-2 bg-white font-bold"
                    />
                  </div>
                )}

                <div>
                  <label className="font-bold text-slate-700 block mb-1">كود / ID الموتور:</label>
                  <input
                    type="text"
                    placeholder="MTR-ST1"
                    value={newMotor.code}
                    onChange={(e) => setNewMotor({ ...newMotor, code: e.target.value })}
                    className="w-full border border-slate-300 rounded-xl p-2 bg-white font-mono font-bold uppercase"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">الماركة / الدرايف:</label>
                  <input
                    type="text"
                    placeholder="Siemens / ABB"
                    value={newMotor.brand}
                    onChange={(e) => setNewMotor({ ...newMotor, brand: e.target.value })}
                    className="w-full border border-slate-300 rounded-xl p-2 bg-white"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">القدرة (kW):</label>
                  <input
                    type="number"
                    placeholder="400"
                    value={newMotor.kw}
                    onChange={(e) => setNewMotor({ ...newMotor, kw: e.target.value })}
                    className="w-full border border-slate-300 rounded-xl p-2 bg-white font-mono"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">السرعة (RPM):</label>
                  <input
                    type="number"
                    placeholder="1500"
                    value={newMotor.rpm}
                    onChange={(e) => setNewMotor({ ...newMotor, rpm: e.target.value })}
                    className="w-full border border-slate-300 rounded-xl p-2 bg-white font-mono"
                  />
                </div>
              </div>
              <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-2.5 rounded-xl shadow">
                حفظ الموتور الجديد
              </button>
            </form>
          )}

          {motorSubView === 'reports' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
              <div className="bg-amber-50 border border-amber-300 rounded-2xl p-3.5 space-y-2.5 text-xs">
                <h3 className="font-black text-amber-950 flex items-center gap-1.5 border-b border-amber-200 pb-2">
                  <Thermometer className="w-4 h-4" /> تقرير حرارة المواتير (مستقل)
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="font-bold text-slate-600 block mb-0.5 text-[10px]">التاريخ:</label>
                    <input
                      type="date"
                      value={tempReportDateISO}
                      onChange={(e) => setTempReportDateISO(e.target.value)}
                      className="w-full border border-amber-300 rounded-xl p-2 bg-white font-bold"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-600 block mb-0.5 text-[10px]">الوردية:</label>
                    <select
                      value={tempReportShift}
                      onChange={(e) => setTempReportShift(e.target.value)}
                      className="w-full border border-amber-300 rounded-xl p-2 bg-white font-bold"
                    >
                      <option value="الكل">كل الورديات</option>
                      {availableShifts.map((sh) => (
                        <option key={sh} value={sh}>
                          {sh}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handlePrintTempReport}
                  className="w-full bg-rose-600 hover:bg-rose-700 text-white font-black py-2.5 rounded-xl shadow text-xs flex items-center justify-center gap-1.5"
                >
                  <FileText className="w-4 h-4" /> طباعة تقرير الحرارة
                </button>
                <p className="text-[10px] text-amber-800 font-bold">
                  بيطلع جدول الفحص اليومي: جسم المحرك قراءتين + البلي + الأمبير + علامات الفلاتر والتنضيف بالهوا.
                </p>
              </div>

              <div className="bg-blue-50 border border-blue-300 rounded-2xl p-3.5 space-y-2.5 text-xs">
                <h3 className="font-black text-blue-950 flex items-center gap-1.5 border-b border-blue-200 pb-2">
                  <Wrench className="w-4 h-4" /> تقرير الصيانة (مستقل)
                </h3>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="font-bold text-slate-600 block mb-0.5 text-[10px]">نوع الصيانة:</label>
                    <select
                      value={maintReportType}
                      onChange={(e) => setMaintReportType(e.target.value)}
                      className="w-full border border-blue-300 rounded-xl p-2 bg-white font-bold"
                    >
                      <option value="الكل">كل الأنواع</option>
                      {MAINT_TYPES.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="font-bold text-slate-600 block mb-0.5 text-[10px]">الوردية:</label>
                    <select
                      value={maintReportShift}
                      onChange={(e) => setMaintReportShift(e.target.value)}
                      className="w-full border border-blue-300 rounded-xl p-2 bg-white font-bold"
                    >
                      <option value="الكل">كل الورديات</option>
                      {availableShifts.map((sh) => (
                        <option key={sh} value={sh}>
                          {sh}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="font-bold text-slate-600 block mb-0.5 text-[10px]">من تاريخ:</label>
                    <input
                      type="date"
                      value={maintReportFromISO}
                      onChange={(e) => setMaintReportFromISO(e.target.value)}
                      className="w-full border border-blue-300 rounded-xl p-2 bg-white font-bold"
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-600 block mb-0.5 text-[10px]">إلى تاريخ:</label>
                    <input
                      type="date"
                      value={maintReportToISO}
                      onChange={(e) => setMaintReportToISO(e.target.value)}
                      className="w-full border border-blue-300 rounded-xl p-2 bg-white font-bold"
                    />
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handlePrintMaintReport}
                  className="w-full bg-rose-600 hover:bg-rose-700 text-white font-black py-2.5 rounded-xl shadow text-xs flex items-center justify-center gap-1.5"
                >
                  <FileText className="w-4 h-4" /> طباعة تقرير الصيانة
                </button>
                <p className="text-[10px] text-blue-800 font-bold">
                  اختار نوع صيانة بعينه (تشحيم / فلاتر / تنضيف بالهوا...) أو وردية أو فترة، واطبع تقريرها لوحدها.
                </p>
              </div>
            </div>
          )}

          {motorSubView === 'cards' && (
            <div className="space-y-2.5">
              <div className="flex flex-col sm:flex-row gap-2 justify-between">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute right-3 top-2.5" />
                  <input
                    type="text"
                    value={motorSearchId}
                    onChange={(e) => setMotorSearchId(e.target.value)}
                    placeholder="ابحث بـ ID الموتور (مثلاً MTR-ST1) أو الستاند..."
                    className="w-full bg-slate-50 border border-slate-300 focus:border-blue-600 focus:bg-white rounded-xl pr-9 pl-3 py-2 text-xs font-bold outline-none"
                  />
                </div>
                <div className="grid grid-cols-3 sm:flex gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 text-[11px] font-bold">
                  {[
                    ['all', 'الكل'],
                    ['rolling', 'الدرفلة'],
                    ['aux', 'المساعدة']
                  ].map(([id, label]) => (
                    <button
                      key={id}
                      onClick={() => setMotorCategoryFilter(id)}
                      className={`px-2.5 py-1 rounded-lg transition-all ${
                        motorCategoryFilter === id ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-600'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                {filteredMotors.map((m) => {
                  const bearingHot = Number(m.bearingTemp) >= 75;
                  return (
                    <div
                      key={m.id}
                      className={`rounded-2xl border p-3 flex flex-col justify-between gap-2.5 shadow-sm ${
                        bearingHot ? 'bg-red-50/60 border-red-400' : 'bg-slate-50/70 border-slate-200'
                      }`}
                    >
                      <div>
                        <div className="flex justify-between items-center gap-2">
                          <h3 className="font-black text-sm text-slate-900">
                            {m.locationName || `ستاند ${m.stand}`}
                          </h3>
                          <span className="font-mono font-black text-[11px] bg-slate-900 text-amber-400 px-2 py-0.5 rounded-lg">
                            ID: {m.code}
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-1.5 bg-white p-2.5 rounded-xl border border-slate-200 mt-2 text-[11px] font-bold">
                          <div>
                            <span className="text-slate-400 text-[9px] block">القدرة / السرعة:</span>
                            <span className="font-mono text-slate-900">{m.kw}kW • {m.rpm}RPM</span>
                          </div>
                          <div>
                            <span className="text-slate-400 text-[9px] block">الأمبير:</span>
                            <span className="font-mono text-blue-700">{m.amps || '-'} A</span>
                          </div>
                          <div>
                            <span className="text-slate-400 text-[9px] block">حرارة الجسم (قراءتان):</span>
                            <span className="font-mono font-black text-amber-700">
                              {m.bodyTemp1 !== undefined
                                ? `${m.bodyTemp1 || '-'}° / ${m.bodyTemp2 || '-'}°C`
                                : `${m.bodyTemp || '50'}°C`}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-400 text-[9px] block">البلي (أمامي / خلفي):</span>
                            <span className={`font-mono font-black ${bearingHot ? 'text-red-600' : 'text-amber-700'}`}>
                              {m.frontBearingTemp !== undefined
                                ? `${m.frontBearingTemp || '-'}° / ${m.rearBearingTemp || '-'}°C`
                                : `${m.bearingTemp || '55'}°C`}
                            </span>
                          </div>
                          <div>
                            <span className="text-slate-400 text-[9px] block">العزل (Megger):</span>
                            <span className="font-mono text-emerald-700">{m.megger || '550 MΩ'}</span>
                          </div>
                        </div>

                        {m.lastTechName && (
                          <p className="text-[10px] font-bold text-slate-500 mt-1.5">
                            👷 آخر فني متابع: <strong className="text-slate-800">{m.lastTechName}</strong>
                          </p>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 pt-2 border-t border-slate-200">
                        <button
                          onClick={() => {
                            window.history.pushState({ modal: 'motor' }, '');
                            setMotorLogView('maint');
                            setSelectedMotorForLog(m);
                          }}
                          className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-1.5 rounded-xl text-xs flex items-center justify-center gap-1"
                        >
                          <Wrench className="w-3.5 h-3.5" /> سجل الصيانة ({(m.logs || []).length})
                        </button>
                        {isManagerLike && (
                          <button
                            onClick={() => handleDeleteMotor(m.id)}
                            className="bg-red-50 text-red-600 p-1.5 rounded-xl border border-red-200"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ################ [د-4] الباقي: باقي الصفحات ################ */}
      {/* ===== 3. صفحة أعطال وتوقفات الوردية ===== */}
      {activeTab === 'downtime' && canAccessTab('downtime') && (
        <div className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-200 p-2.5 sm:p-4 space-y-3">
          <div className="bg-slate-900 text-white p-3 rounded-2xl flex flex-wrap justify-between items-center gap-2">
            <h2 className="font-black text-xs sm:text-base flex items-center gap-1.5">
              <Wrench className="w-4 h-4 text-amber-400" /> أعطال وتوقفات الوردية ({currentShiftDownMins} ق)
            </h2>
            {exportButtons}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
            <form onSubmit={handleAddDowntime} className="lg:col-span-5 bg-slate-50 border border-slate-200 rounded-2xl p-3 space-y-2.5 h-fit">
              <h3 className="font-black text-xs sm:text-sm text-slate-900">
                + تسجيل عطل أو توقف في ({selectedShift})
              </h3>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <select
                  value={downForm.category}
                  onChange={(e) => setDownForm({ ...downForm, category: e.target.value })}
                  className="border border-slate-300 rounded-xl p-2 bg-white font-bold"
                >
                  <option>كهرباء وكنترول</option>
                  <option>ميكانيكا ودرافيل</option>
                  <option>تشغيل وكعبلة (Cobble)</option>
                  <option>تغيير ممر / ضبط خلوص</option>
                  <option>هيدروليك ومياه تبريد</option>
                </select>
                <select
                  value={downForm.standName}
                  onChange={(e) => setDownForm({ ...downForm, standName: e.target.value })}
                  className="border border-slate-300 rounded-xl p-2 bg-white font-bold"
                >
                  <option value="عام / الخط بالكامل">عام / الخط بالكامل</option>
                  {stands.map((s) => (
                    <option key={s.id} value={s.name}>
                      {s.name}
                    </option>
                  ))}
                  <option value="المقص الطائر / اللوابر">المقص الطائر / اللوابر</option>
                </select>
                <input
                  type="number"
                  placeholder="مدة التوقف (دقيقة)"
                  value={downForm.durationMins}
                  onChange={(e) => setDownForm({ ...downForm, durationMins: e.target.value })}
                  className="border border-slate-300 rounded-xl p-2 font-mono font-bold bg-white"
                />
                <input
                  type="text"
                  placeholder="اسم الفني / الملاحظ"
                  value={downForm.techName}
                  onChange={(e) => setDownForm({ ...downForm, techName: e.target.value })}
                  className="border border-slate-300 rounded-xl p-2 bg-white font-bold"
                />
                <input
                  type="text"
                  placeholder="سبب التوقف / وصف العطل..."
                  value={downForm.reason}
                  onChange={(e) => setDownForm({ ...downForm, reason: e.target.value })}
                  className="col-span-2 border border-slate-300 rounded-xl p-2 bg-white"
                />
                <input
                  type="text"
                  placeholder="الإجراء المتخذ والحل..."
                  value={downForm.actionTaken}
                  onChange={(e) => setDownForm({ ...downForm, actionTaken: e.target.value })}
                  className="col-span-2 border border-slate-300 rounded-xl p-2 bg-white"
                />
              </div>
              <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-2.5 rounded-xl text-xs shadow">
                حفظ التوقف في سجل الوردية
              </button>
            </form>

            <div className="lg:col-span-7 space-y-2.5">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={downSearchQuery}
                  onChange={(e) => setDownSearchQuery(e.target.value)}
                  placeholder="ابحث في الأعطال..."
                  className="flex-1 bg-slate-50 border border-slate-300 rounded-xl px-3 py-1.5 text-xs font-bold outline-none"
                />
                <select
                  value={downFilterCat}
                  onChange={(e) => setDownFilterCat(e.target.value)}
                  className="bg-slate-100 border border-slate-300 rounded-xl px-2.5 py-1.5 text-xs font-bold"
                >
                  <option value="الكل">الكل</option>
                  <option value="كهرباء وكنترول">كهرباء</option>
                  <option value="ميكانيكا ودرافيل">ميكانيكا</option>
                  <option value="تشغيل وكعبلة (Cobble)">كعبلة</option>
                </select>
              </div>

              <div className="space-y-2 max-h-96 overflow-y-auto">
                {filteredDowntimes.map((d) => (
                  <div key={d.id} className="bg-slate-50 border border-slate-200 rounded-xl p-3 space-y-1 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="font-black text-red-700">
                        {d.durationMins} ق — {d.standName} ({d.category})
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono text-slate-500">{d.date}</span>
                        {isManagerLike && (
                          <button onClick={() => handleDeleteDowntime(d.id)} className="text-red-500">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                    <p className="font-bold text-slate-900">{d.reason}</p>
                    {d.actionTaken && <p className="text-emerald-700 font-bold text-[11px]">✅ الحل: {d.actionTaken}</p>}
                    <p className="text-[10px] text-slate-500 font-bold">👷 الفني/الملاحظ: {d.techName || d.by}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===== 4. رادار طواقم الدرافيل وورشة الخراطة ===== */}
      {activeTab === 'rollshop' && canAccessTab('rollshop') && (
        <div className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-200 p-2.5 sm:p-4 space-y-3">
          <div className="bg-slate-900 text-white p-3 rounded-2xl flex justify-between items-center gap-2">
            <h2 className="font-black text-xs sm:text-base flex items-center gap-1.5">
              <Disc className="w-4 h-4 text-emerald-400" /> ورشة الدرافيل والخراطة (Roll Shop)
            </h2>
            <button
              onClick={() => {
                setEditingRollId(null);
                setRollFormOpen(!rollFormOpen);
              }}
              className="bg-emerald-600 text-white font-black px-3 py-1.5 rounded-xl text-xs flex items-center gap-1"
            >
              <PlusCircle size={14} /> {rollFormOpen ? 'إغلاق' : '+ إضافة درفيل'}
            </button>
          </div>

          {rollFormOpen && (
            <form
              onSubmit={handleSaveRollShopItem}
              className="bg-blue-50/60 border border-blue-300 rounded-2xl p-3 grid grid-cols-2 sm:grid-cols-4 gap-2.5 items-end text-xs"
            >
              <div>
                <label className="font-bold text-slate-700 block mb-1">كود الطقم:</label>
                <input
                  type="text"
                  placeholder="RL-205-A"
                  value={newRollItem.code}
                  onChange={(e) => setNewRollItem({ ...newRollItem, code: e.target.value })}
                  className="w-full border border-slate-300 rounded-xl p-2 bg-white font-mono font-bold uppercase"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">الستاند:</label>
                <select
                  value={newRollItem.standName}
                  onChange={(e) => setNewRollItem({ ...newRollItem, standName: e.target.value })}
                  className="w-full border border-slate-300 rounded-xl p-2 bg-white font-bold"
                >
                  {stands.map((s) => (
                    <option key={s.id} value={s.name}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">القطر الحالي (مم):</label>
                <input
                  type="number"
                  value={newRollItem.currentDia}
                  onChange={(e) => setNewRollItem({ ...newRollItem, currentDia: e.target.value })}
                  className="w-full border border-slate-300 rounded-xl p-2 bg-white font-mono"
                />
              </div>
              <div>
                <label className="font-bold text-slate-700 block mb-1">حد التكهين (مم):</label>
                <input
                  type="number"
                  value={newRollItem.minScrapDia}
                  onChange={(e) => setNewRollItem({ ...newRollItem, minScrapDia: e.target.value })}
                  className="w-full border border-slate-300 rounded-xl p-2 bg-white font-mono"
                />
              </div>
              <button type="submit" className="col-span-2 sm:col-span-4 bg-blue-600 text-white font-black py-2 rounded-xl shadow">
                {editingRollId ? 'حفظ التعديلات' : '+ حفظ الدرفيل'}
              </button>
            </form>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
            {rollShopList.map((roll) => {
              const remainingMm = Math.max(0, roll.currentDia - roll.minScrapDia);
              const isScrap = remainingMm <= 0;
              return (
                <div
                  key={roll.id}
                  className={`rounded-2xl border p-3 flex flex-col justify-between gap-2.5 shadow-sm ${
                    isScrap ? 'bg-red-50 border-red-400' : 'bg-slate-50 border-slate-200'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="font-mono font-black text-sm text-blue-900 block">{roll.code}</span>
                      <span className="text-[11px] font-bold text-slate-600">{roll.standName}</span>
                    </div>
                    <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                      {roll.status}
                    </span>
                  </div>

                  <div className="bg-white rounded-xl border border-slate-200 p-2.5 text-xs font-bold space-y-1">
                    <div className="flex justify-between">
                      <span className="text-slate-500">القطر الحالي / التكهين:</span>
                      <span className="font-mono font-black">{roll.currentDia} / {roll.minScrapDia} مم</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">المتبقي للخراطة:</span>
                      <span className="font-mono font-black text-emerald-700">{remainingMm} مم</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleRecordRedressing(roll)}
                      className="flex-1 py-1.5 rounded-xl text-xs font-bold bg-slate-900 text-amber-400"
                    >
                      تسجيل خراطة
                    </button>
                    <button
                      onClick={() => handleStartEditRollItem(roll)}
                      className="bg-blue-50 text-blue-700 p-1.5 rounded-xl border border-blue-200"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteRollShopItem(roll.id)}
                      className="bg-red-50 text-red-600 p-1.5 rounded-xl border border-red-200"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ===== 5. كتالوج وصفات الإنتاج الجاهزة ===== */}
      {activeTab === 'recipes' && canAccessTab('recipes') && (
        <div className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-200 p-2.5 sm:p-4 space-y-3">
          <div className="bg-slate-900 text-white p-3 rounded-2xl flex justify-between items-center">
            <h2 className="font-black text-xs sm:text-base flex items-center gap-1.5">
              <BookMarked className="w-4 h-4 text-blue-400" /> وصفات المقاسات الجاهزة
            </h2>
            <span className="bg-blue-600 text-white px-2.5 py-0.5 rounded-lg text-[11px] font-black">
              الحالي: {selectedProductSize}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {recipesList.map((rec) => (
              <div key={rec.id} className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 flex flex-col justify-between gap-2.5">
                <div className="flex justify-between items-center">
                  <h3 className="font-black text-sm text-slate-900">{rec.name}</h3>
                  <span className="bg-blue-600 text-white text-[10px] font-black px-2 py-0.5 rounded-lg">
                    {rec.productSize}
                  </span>
                </div>
                <div className="grid grid-cols-3 gap-1.5 text-[11px] bg-white p-2.5 rounded-xl border border-slate-200 font-bold">
                  <div>
                    <span className="text-slate-400 block text-[9px]">السرعة:</span>
                    <span className="font-mono text-blue-700">{rec.finishSpeed}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[9px]">ضغط QTB:</span>
                    <span className="font-mono text-emerald-700">{rec.qtbPressure}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[9px]">الفرن:</span>
                    <span className="font-mono text-amber-700">{rec.furnaceTemp}</span>
                  </div>
                </div>
                <button
                  onClick={() => handleApplyRecipe(rec)}
                  className="w-full bg-blue-600 text-white font-bold py-2 rounded-xl text-xs"
                >
                  تفعيل الوصفة على الخط
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ===== 6. إدارة الموظفين والأكواد ===== */}
      {activeTab === 'staff' && isManagerLike && (
        <div className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-200 p-3 sm:p-4 space-y-3">
          <div className="bg-slate-900 text-white p-3 rounded-2xl flex flex-wrap justify-between items-center gap-2">
            <h2 className="font-black text-xs sm:text-base flex items-center gap-1.5">
              <Users className="w-4 h-4 text-amber-400" /> إدارة الموظفين والأكواد ({factoryName})
            </h2>
            <button
              onClick={handleCopyEmployeeDirectLink}
              className="bg-amber-500 text-slate-950 font-black px-3 py-1.5 rounded-xl text-xs flex items-center gap-1"
            >
              <Link2 className="w-3.5 h-3.5" /> نسخ رابط الموظفين
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
            <form onSubmit={handleAddStaffMember} className="lg:col-span-5 bg-slate-50 border border-slate-200 rounded-2xl p-3 space-y-2.5 text-xs">
              <h3 className="font-black text-slate-800">+ إضافة موظف جديد بكود خاص</h3>
              <input
                type="text"
                placeholder="اسم الموظف / المهندس"
                value={newStaffForm.name}
                onChange={(e) => setNewStaffForm({ ...newStaffForm, name: e.target.value })}
                className="w-full border border-slate-300 rounded-xl p-2 bg-white font-bold"
              />
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  placeholder="الكود (مثلاً 5544)"
                  value={newStaffForm.pin}
                  onChange={(e) => setNewStaffForm({ ...newStaffForm, pin: e.target.value })}
                  className="border border-slate-300 rounded-xl p-2 bg-white font-mono font-bold text-center"
                />
                <select
                  value={newStaffForm.role}
                  onChange={(e) => setNewStaffForm({ ...newStaffForm, role: e.target.value })}
                  className="border border-slate-300 rounded-xl p-2 bg-white font-bold"
                >
                  <option value="tech">فني / مهندس</option>
                  <option value="supervisor">ملاحظ</option>
                  <option value="manager">مدير</option>
                </select>
              </div>
              {newStaffForm.role === 'manager' ? (
                <p className="text-[11px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 rounded-xl p-2">
                  المدير له صلاحية كاملة على كل الأقسام.
                </p>
              ) : (
                <div className="space-y-1.5">
                  <span className="font-black text-slate-700 block">الأقسام المسموح له بدخولها (الباقي يكون مغلقاً):</span>
                  <div className="flex flex-wrap gap-1.5">
                    {ASSIGNABLE_TABS.map(([k, label]) => {
                      const on = newStaffForm.access.includes(k);
                      return (
                        <button
                          type="button"
                          key={k}
                          onClick={() =>
                            setNewStaffForm({
                              ...newStaffForm,
                              access: on ? newStaffForm.access.filter((x) => x !== k) : [...newStaffForm.access, k]
                            })
                          }
                          className={`px-2.5 py-1 rounded-lg font-bold border ${
                            on ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-slate-500 border-slate-300'
                          }`}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
              <button type="submit" className="w-full bg-blue-600 text-white font-black py-2 rounded-xl">
                حفظ كود الموظف
              </button>
            </form>

            <div className="lg:col-span-7 space-y-2">
              {staffList.map((emp) => (
                <div
                  key={emp.id}
                  className="p-3 rounded-xl border bg-white border-slate-200 flex justify-between items-center text-xs"
                >
                  <div>
                    <span className="font-black text-slate-900">{emp.name}</span>
                    {emp.role === 'supervisor' && (
                      <span className="mr-1.5 text-[10px] font-black bg-indigo-100 text-indigo-800 px-1.5 py-0.5 rounded">ملاحظ</span>
                    )}
                    <p className="text-slate-500 font-bold">
                      الكود: <strong className="font-mono text-blue-700">{emp.pin}</strong>
                    </p>
                    {accessFor(emp) ? (
                      <div className="flex flex-wrap gap-1 pt-1.5">
                        {ASSIGNABLE_TABS.map(([k, label]) => {
                          const on = accessFor(emp).includes(k);
                          return (
                            <button
                              type="button"
                              key={k}
                              onClick={() => handleToggleStaffTab(emp.id, k)}
                              className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${
                                on ? 'bg-blue-50 text-blue-700 border-blue-300' : 'bg-slate-50 text-slate-400 border-slate-200'
                              }`}
                            >
                              {on ? label : `🔒 ${label}`}
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      <p className="text-emerald-700 font-bold text-[10px] pt-1">صلاحية كاملة على كل الأقسام</p>
                    )}
                  </div>
                  <div className="flex gap-1.5">
                    <button
                      onClick={() => handleToggleStaffActive(emp.id)}
                      className="px-2.5 py-1 rounded-lg font-bold bg-amber-100 text-amber-900"
                    >
                      {emp.active ? 'إيقاف' : 'تفعيل'}
                    </button>
                    <button onClick={() => handleDeleteStaff(emp.id)} className="text-red-600 p-1">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ===== 7. الأرشيف والتقارير ===== */}
      {activeTab === 'archive' && canAccessTab('archive') && (
        <div className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-200 p-2.5 sm:p-4 space-y-3">
          <div className="flex justify-between items-center border-b border-slate-100 pb-2.5">
            <h2 className="font-black text-xs sm:text-base text-slate-900">أرشيف الورديات والتقارير ({factoryName})</h2>
            {exportButtons}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2">
            {sortedDates.map((date) => {
              const day = groupedArchive[date];
              return (
                <div key={date} className="bg-slate-50 border border-slate-200 rounded-xl overflow-hidden">
                  <div className="bg-slate-900 text-white p-2 flex justify-between items-center text-xs font-bold">
                    <span>يوم {day.dayName}</span>
                    <span className="font-mono text-[10px] text-amber-400">{date}</span>
                  </div>
                  <div className="p-2 space-y-1 text-xs">
                    {day.shiftsList.map((log, i) => (
                      <div key={i} className="flex justify-between items-center p-1.5 bg-white rounded-lg border border-slate-200 font-bold">
                        <span>{log.shift}</span>
                        <span className="font-mono text-emerald-700">{log.billets} ب | {log.tons.toFixed(1)} ط</span>
                      </div>
                    ))}
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
