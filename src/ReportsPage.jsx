import React, { useState } from 'react';
import { FileText, FileSpreadsheet, Thermometer, Wrench, Archive } from 'lucide-react';

const SHIFTS_NORMAL = ['الوردية الأولى', 'الوردية الثانية', 'الوردية الثالثة'];
const SHIFTS_FRIDAY = ['الوردية الأولى (12 ساعة)', 'الوردية الثانية (12 ساعة)'];
const MAINT_TYPES = ['تغيير فلاتر', 'نفخ هواء داخلي', 'تشحيم', 'فحص بلي', 'فحص كوابل وتوصيلات', 'تنظيف خارجي', 'أخرى'];

const SHIFT_CREW = {
  1: { letter: 'A', name: 'أحمد مصطفى' },
  2: { letter: 'B', name: 'خميس' },
  3: { letter: 'C', name: 'يحيى' }
};
const shiftIdx = (shift) => {
  const s = String(shift || '');
  return s.startsWith('الوردية الأولى') ? 1 : s.startsWith('الوردية الثانية') ? 2 : s.startsWith('الوردية الثالثة') ? 3 : 0;
};
const crewLabel = (shift) => {
  const c = SHIFT_CREW[shiftIdx(shift)] || { letter: '-', name: '-' };
  return `وردية ${c.letter} — ${c.name}`;
};

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
const isoOfAny = (s) => (!s ? '' : String(s).includes('/') ? convertGBToISO(s) : s);
const inRange = (iso, from, to) => (!from || iso >= from) && (!to || iso <= to);
const esc = (s) => String(s ?? '').replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));

const REPORT_CSS = `
  @page{size:A4;margin:10mm}
  body{font-family:Tahoma,Arial,sans-serif;color:#0f172a;padding:14px}
  h1{font-size:18px;margin:0}
  h2{font-size:13px;margin:18px 0 4px;border-right:4px solid #2563eb;padding-right:8px}
  .meta{color:#475569;font-size:11px;margin:4px 0 8px}
  table{border-collapse:collapse;width:100%;font-size:11px;margin-bottom:8px}
  th{background:#0f172a;color:#fff;padding:5px;border:1px solid #334155}
  td{padding:4px;border:1px solid #94a3b8;text-align:center}
  td.l{text-align:right}
  tr:nth-child(even) td{background:#f1f5f9}
  .tot td{font-weight:bold;background:#dbeafe!important}
  .hot{background:#fecaca!important;color:#991b1b;font-weight:bold}
  .sign{display:flex;justify-content:space-between;margin-top:28px;font-size:12px}
  .sign div{width:30%;border-top:1px solid #0f172a;padding-top:4px;text-align:center}
  .grp{break-inside:avoid;page-break-inside:avoid}
  @media print{ body{padding:0} h2{break-after:avoid} tr{break-inside:avoid} }
`;

const wrapReport = (title, metaLine, body) =>
  `<html dir="rtl" lang="ar" xmlns:x="urn:schemas-microsoft-com:office:excel"><head><meta charset="UTF-8"><title>${esc(title)}</title><style>${REPORT_CSS}</style></head><body><h1>${esc(title)}</h1><div class="meta">${esc(metaLine)}</div>${body}</body></html>`;

const periodText = (from, to, shift) =>
  `الفترة: ${from ? formatDateToGB(from) : 'من البداية'} ← ${to ? formatDateToGB(to) : 'حتى اليوم'} | ${
    !shift || shift === 'all' ? 'كل الورديات' : `${shift} (${crewLabel(shift)})`
  }`;

const signBlock = `<div class="sign"><div>الفني / طاقم الوردية</div><div>ملاحظ الوردية</div><div>رئيس الوردية / المشرف</div></div>`;

export const openPrintHTML = (html, onBlocked) => {
  const w = window.open('', '_blank');
  if (!w) {
    onBlocked && onBlocked();
    return;
  }
  w.document.open();
  w.document.write(html + '<script>window.onload=function(){setTimeout(function(){window.print()},400)}<\/script>');
  w.document.close();
};

export const downloadHTMLAsExcel = (html, filename) => {
  const blob = new Blob(['\ufeff' + html], { type: 'application/vnd.ms-excel;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
};

export const buildReportHTML = ({ factoryName, stands, archive, changes, downtimes, motors, tempShiftLogs, billetWeight }) => {
  const now = new Date().toLocaleString('ar-EG');
  const th = (arr) => `<tr>${arr.map((h) => `<th>${esc(h)}</th>`).join('')}</tr>`;
  const td = (arr) => `<tr>${arr.map((c) => `<td>${esc(c)}</td>`).join('')}</tr>`;

  const standsRows = stands
    .map((s) => {
      const total = s.passes.reduce((a, p) => a + (Number(p.tons) || 0), 0);
      return td([
        s.name, s.type, s.diameter, s.entryDate, `${s.activePass} / ${s.totalPasses}`,
        s.accumulatedTons.toFixed(0), s.maxLimit, `${Math.round((s.accumulatedTons / s.maxLimit) * 100)}%`, total.toFixed(0)
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
        c.date, c.shift, c.standName,
        c.kind === 'newRoll' ? 'تركيب درفيل جديد' : `ممر ${c.fromPass} ← ممر ${c.toPass}`,
        Number(c.tons).toFixed(1), c.billetsAtChange || 0, c.productSize || '', c.requestedBy || '', c.notes || ''
      ])
    )
    .join('');

  const downRows = (downtimes || [])
    .map((d) => td([d.date, d.shift, d.category, d.standName || 'عام', `${d.durationMins} ق`, d.reason, d.actionTaken || '', d.techName || d.by || '']))
    .join('');
  const sumDownMins = (downtimes || []).reduce((a, d) => a + (Number(d.durationMins) || 0), 0);

  const motorRows = (motors || [])
    .map((m) =>
      td([
        m.category === 'aux' ? 'كهرباء مساعدة' : 'درفلة رئيسي',
        m.locationName || `ستاند ${m.stand}`, m.code, m.brand || '', `${m.kw} kW`, m.rpm,
        m.amps || '-', `${m.bodyTemp || '-'} °C`, `${m.bearingTemp || '-'} °C`, m.megger || '-', m.lastTechName || '-', (m.logs || []).length
      ])
    )
    .join('');

  const tempLogsRows = (tempShiftLogs || [])
    .flatMap((batch) =>
      (batch.readings || []).map((r) =>
        td([
          batch.date, batch.shift, String(batch.round) === '2' ? 'منتصف الوردية' : 'بداية الوردية',
          r.motorCode, r.locationName,
          !batch.round && r.bodyTemp2 ? `${r.bodyTemp1 || '-'} / ${r.bodyTemp2} °C` : `${r.bodyTemp1 || r.bodyTemp2 || r.bodyTemp || '-'} °C`,
          r.frontBearingTemp !== undefined ? `${r.frontBearingTemp || '-'} °C` : r.bearingTemp ? `${r.bearingTemp} °C` : '-',
          r.rearBearingTemp !== undefined ? `${r.rearBearingTemp || '-'} °C` : '-',
          `${r.amps || '-'} A`, batch.recordedBy || '-', batch.supervisor || '-'
        ])
      )
    )
    .join('');

  const body = `
    <h2>1. حالة الستاندات والممرات (${stands.length} ستاند)</h2>
    <table>${th(['الستاند', 'الشكل', 'القطر', 'تاريخ دخول الدرفيل', 'الممر الحالي', 'إنتاج الممر الحالي (طن)', 'الحد الأقصى', 'النسبة', 'إجمالي إنتاج الدرفيل (طن)'])}${standsRows}</table>
    <h2>2. سجل الإنتاج اليومي للورديات</h2>
    <table>${th(['التاريخ', 'اليوم', 'الوردية', 'المقاس', 'البليت', 'الطن', 'المسجل', 'وقت التسجيل'])}${archiveRows}<tr class="tot"><td colspan="4">الإجمالي</td><td>${sumB}</td><td>${sumT}</td><td colspan="2"></td></tr></table>
    <h2>3. سجل الأعطال والتوقفات بالورديات</h2>
    <table>${th(['التاريخ', 'الوردية', 'التصنيف', 'الستاند/المعدة', 'مدة التوقف', 'سبب العطل', 'الإجراء المتخذ', 'الفني/الملاحظ'])}${downRows}<tr class="tot"><td colspan="4">إجمالي وقت التوقفات</td><td>${sumDownMins} دقيقة</td><td colspan="3"></td></tr></table>
    <h2>4. سجل حرارة المواتير والأمبير للورديات</h2>
    <table>${th(['التاريخ', 'الوردية', 'القياس', 'كود الموتور', 'الموقع/الستاند', 'حرارة الجسم', 'البلي الأمامي', 'البلي الخلفي', 'الأمبير', 'الفني', 'الملاحظ'])}${tempLogsRows}</table>
    <h2>5. سجل بيانات وصيانة المواتير</h2>
    <table>${th(['القسم', 'الموقع/الستاند', 'كود الموتور', 'الماركة', 'القدرة', 'RPM', 'الأمبير', 'حرارة الجسم', 'حرارة البلي', 'العزل Megger', 'آخر فني', 'عدد الصيانات'])}${motorRows}</table>
    <h2>6. سجل تغيير الممرات والدرافيل</h2>
    <table>${th(['التاريخ', 'الوردية', 'الستاند', 'التغيير', 'إنتاج الممر المغلق', 'كتل الوردية قبل التغيير', 'المقاس', 'بواسطة', 'ملاحظات'])}${changeRows}</table>
  `;

  return wrapReport(
    `${factoryName} — التقرير الشامل للإنتاج والدرافيل وحرارة المواتير`,
    `تاريخ التقرير: ${now} | عدد الستاندات: ${stands.length} | وزن البليت: ${billetWeight} طن`,
    body
  );
};

export const downloadExcel = (data) =>
  downloadHTMLAsExcel(buildReportHTML(data), `تقرير-${data.factoryName || 'المصنع'}-${formatDateToISO(new Date())}.xls`);

export const printPDF = (data, onBlocked) => openPrintHTML(buildReportHTML(data), onBlocked);

export const buildTempReportHTML = ({ factoryName, tempShiftLogs, from, to, shift }) => {
  const put = (o, k, v) => {
    if (o[k] === undefined && v !== undefined && v !== '') o[k] = v;
  };
  const groups = {};
  (tempShiftLogs || []).forEach((b) => {
    const iso = isoOfAny(b.date);
    if (!inRange(iso, from, to)) return;
    if (shift && shift !== 'all' && b.shift !== shift) return;
    const key = `${iso}__${b.shift}`;
    const g = groups[key] || (groups[key] = { iso, date: b.date, shift: b.shift, motors: {}, r1: null, r2: null });
    const isR2 = String(b.round) === '2';
    const legacy = !b.round;
    if (isR2) g.r2 = g.r2 || b;
    else g.r1 = g.r1 || b;
    (b.readings || []).forEach((r) => {
      const m = g.motors[r.motorId] || (g.motors[r.motorId] = { code: r.motorCode, loc: r.locationName });
      if (isR2) put(m, 'body2', r.bodyTemp2 ?? r.bodyTemp);
      else {
        put(m, 'body1', r.bodyTemp1 ?? r.bodyTemp);
        put(m, 'front', r.frontBearingTemp ?? r.bearingTemp);
        put(m, 'rear', r.rearBearingTemp);
        put(m, 'amps', r.amps);
        if (legacy) put(m, 'body2', r.bodyTemp2);
      }
    });
  });
  const list = Object.values(groups).sort((a, b) =>
    a.iso < b.iso ? -1 : a.iso > b.iso ? 1 : shiftIdx(a.shift) - shiftIdx(b.shift)
  );
  const cell = (v, lim) => `<td${v !== undefined && Number(v) >= lim ? ' class="hot"' : ''}>${esc(v ?? '-')}</td>`;
  const who = (b) => (b ? `${b.time || ''} — ${b.recordedBy || '-'}` : 'لم يُسجَّل');
  const body = list.length
    ? list
        .map((g) => {
          const rows = Object.values(g.motors)
            .sort((a, b) => String(a.loc).localeCompare(String(b.loc), 'ar', { numeric: true }))
            .map((m) => {
              const nums = [m.body1, m.body2].filter((x) => x !== undefined).map(Number);
              return `<tr><td class="l">${esc(m.loc)}</td><td>${esc(m.code)}</td>${cell(m.body1, 80)}${cell(m.front, 75)}${cell(m.rear, 75)}<td>${esc(m.amps ?? '-')}</td>${cell(m.body2, 80)}<td>${nums.length ? Math.max(...nums) : '-'}</td></tr>`;
            })
            .join('');
          return `<div class="grp"><h2>${esc(g.date)} — ${esc(g.shift)} — ${esc(crewLabel(g.shift))}</h2>
<div class="meta">القياس الأول (بداية الوردية): ${esc(who(g.r1))} &nbsp;|&nbsp; القياس الثاني (منتصف الوردية): ${esc(who(g.r2))}</div>
<table><tr><th rowspan="2">الموقع / الستاند</th><th rowspan="2">ID</th><th colspan="4">القياس الأول — بداية الوردية</th><th>القياس الثاني — منتصف الوردية</th><th rowspan="2">أعلى حرارة جسم °C</th></tr>
<tr><th>جسم °C</th><th>بلي أمامي °C</th><th>بلي خلفي °C</th><th>أمبير A</th><th>جسم °C</th></tr>${rows}</table></div>`;
        })
        .join('')
    : '<p style="text-align:center;padding:30px">لا توجد قراءات حرارة في هذه الفترة.</p>';
  return wrapReport(`${factoryName} — تقرير حرارة المواتير`, periodText(from, to, shift) + ' | الخانات الحمراء = حرارة مرتفعة', body + signBlock);
};

export const buildMaintReportHTML = ({ factoryName, motors, shiftMaintLogs, from, to, shift, types, status }) => {
  const entries = [];
  (shiftMaintLogs || []).forEach((e) => entries.push({ ...e, iso: isoOfAny(e.date) }));
  (motors || []).forEach((m) =>
    (m.logs || []).forEach((l) =>
      entries.push({
        id: l.id, date: l.date, iso: isoOfAny(l.date), shift: l.shift, type: l.type, status: 'done',
        scope: 'motor', motorText: `${m.code} — ${m.locationName || ''}`, notes: l.notes, doneBy: l.techName
      })
    )
  );
  const hasTypes = types && types.length > 0;
  const rows = entries
    .filter((e) => inRange(e.iso, from, to))
    .filter((e) => !shift || shift === 'all' || e.shift === shift)
    .filter((e) => !hasTypes || types.includes(e.type))
    .filter((e) => status === 'all' || e.status === 'done')
    .sort((a, b) => (a.iso < b.iso ? -1 : a.iso > b.iso ? 1 : shiftIdx(a.shift) - shiftIdx(b.shift)));
  const scopeText = (e) =>
    e.scope === 'all'
      ? `كل المواتير (${e.motorCount || (e.motorCodes || []).length})`
      : e.scope === 'selected'
      ? (e.motorCodes || []).join('، ') || '-'
      : e.scope === 'motor'
      ? e.motorText
      : 'عام';
  const byType = {};
  rows.forEach((e) => {
    byType[e.type] = (byType[e.type] || 0) + 1;
  });
  const summary = Object.keys(byType).length
    ? `<table style="width:auto"><tr><th>نوع الصيانة</th><th>العدد</th></tr>${Object.entries(byType)
        .map(([t, n]) => `<tr><td class="l">${esc(t)}</td><td>${n}</td></tr>`)
        .join('')}</table>`
    : '';
  const table = rows.length
    ? `<table><tr><th>التاريخ</th><th>الوردية</th><th>الطاقم</th><th>نوع الصيانة</th><th>المواتير</th><th>الحالة</th><th>المنفذ</th><th>ملاحظات</th></tr>${rows
        .map(
          (e) =>
            `<tr><td>${esc(e.date)}</td><td>${esc(e.shift || '-')}</td><td>${esc(e.shift ? crewLabel(e.shift) : '-')}</td><td>${esc(e.type)}</td><td class="l">${esc(scopeText(e))}</td><td>${e.status === 'done' ? 'تم' : 'مخطط (لم يتم)'}</td><td>${esc(e.doneBy || '-')}</td><td class="l">${esc(e.notes || '')}</td></tr>`
        )
        .join('')}</table>`
    : '<p style="text-align:center;padding:30px">لا توجد صيانات مطابقة في هذه الفترة.</p>';
  const title = `${factoryName} — تقرير الصيانة${hasTypes ? ` (${types.join(' + ')})` : ''}`;
  return wrapReport(title, periodText(from, to, shift), `${summary}${table}${signBlock}`);
};

export default function ReportsPage({
  factoryName,
  productionArchive,
  motorsList,
  tempShiftLogs,
  shiftMaintLogs,
  exportButtons,
  showAlert
}) {
  const [tempRepFilter, setTempRepFilter] = useState({
    from: formatDateToISO(new Date()),
    to: formatDateToISO(new Date()),
    shift: 'all'
  });
  const [maintRepFilter, setMaintRepFilter] = useState({
    from: formatDateToISO(new Date()),
    to: formatDateToISO(new Date()),
    shift: 'all',
    types: [],
    status: 'done'
  });

  const blockedAlert = () => showAlert('تعذر الفتح', 'المتصفح منع النافذة. اسمح بالنوافذ المنبثقة لهذا الموقع وجرّب تاني.');

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

  return (
    <div className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-200 p-2.5 sm:p-4 space-y-4">
      {/* هيدر التقارير الشاملة */}
      <div className="bg-slate-900 text-white p-3 rounded-2xl flex flex-wrap justify-between items-center gap-2">
        <h2 className="font-black text-xs sm:text-base flex items-center gap-1.5">
          <FileText className="w-4 h-4 text-rose-400" /> التقارير والأرشيف الشامل ({factoryName})
        </h2>
        {exportButtons}
      </div>

      {/* تقارير المواتير (الحرارة + الصيانة) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 text-xs">
        <div className="bg-amber-50 border border-amber-300 rounded-2xl p-3 space-y-2.5">
          <h3 className="font-black text-sm text-amber-950 flex items-center gap-1.5">
            <Thermometer size={15} /> تقرير حرارة المواتير
          </h3>
          <div className="grid grid-cols-2 gap-2">
            <label className="font-bold text-slate-700">
              من:
              <input
                type="date"
                value={tempRepFilter.from}
                onChange={(e) => setTempRepFilter({ ...tempRepFilter, from: e.target.value })}
                className="w-full border border-amber-300 rounded-xl p-2 bg-white font-bold mt-0.5"
              />
            </label>
            <label className="font-bold text-slate-700">
              إلى:
              <input
                type="date"
                value={tempRepFilter.to}
                onChange={(e) => setTempRepFilter({ ...tempRepFilter, to: e.target.value })}
                className="w-full border border-amber-300 rounded-xl p-2 bg-white font-bold mt-0.5"
              />
            </label>
          </div>
          <select
            value={tempRepFilter.shift}
            onChange={(e) => setTempRepFilter({ ...tempRepFilter, shift: e.target.value })}
            className="w-full border border-amber-300 rounded-xl p-2 bg-white font-black"
          >
            <option value="all">كل الورديات</option>
            {[...SHIFTS_NORMAL, ...SHIFTS_FRIDAY].map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => openPrintHTML(buildTempReportHTML({ factoryName, tempShiftLogs, ...tempRepFilter }), blockedAlert)}
              className="bg-rose-600 hover:bg-rose-700 text-white font-black py-2 rounded-xl flex items-center justify-center gap-1"
            >
              <FileText className="w-4 h-4" /> طباعة / PDF
            </button>
            <button
              type="button"
              onClick={() =>
                downloadHTMLAsExcel(
                  buildTempReportHTML({ factoryName, tempShiftLogs, ...tempRepFilter }),
                  `حرارة-المواتير-${formatDateToISO(new Date())}.xls`
                )
              }
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-black py-2 rounded-xl flex items-center justify-center gap-1"
            >
              <FileSpreadsheet className="w-4 h-4" /> Excel
            </button>
          </div>
        </div>

        <div className="bg-indigo-50 border border-indigo-300 rounded-2xl p-3 space-y-2.5">
          <h3 className="font-black text-sm text-indigo-950 flex items-center gap-1.5">
            <Wrench size={15} /> تقرير الصيانة
          </h3>
          <div className="grid grid-cols-2 gap-2">
            <label className="font-bold text-slate-700">
              من:
              <input
                type="date"
                value={maintRepFilter.from}
                onChange={(e) => setMaintRepFilter({ ...maintRepFilter, from: e.target.value })}
                className="w-full border border-indigo-300 rounded-xl p-2 bg-white font-bold mt-0.5"
              />
            </label>
            <label className="font-bold text-slate-700">
              إلى:
              <input
                type="date"
                value={maintRepFilter.to}
                onChange={(e) => setMaintRepFilter({ ...maintRepFilter, to: e.target.value })}
                className="w-full border border-indigo-300 rounded-xl p-2 bg-white font-bold mt-0.5"
              />
            </label>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <select
              value={maintRepFilter.shift}
              onChange={(e) => setMaintRepFilter({ ...maintRepFilter, shift: e.target.value })}
              className="border border-indigo-300 rounded-xl p-2 bg-white font-black"
            >
              <option value="all">كل الورديات</option>
              {[...SHIFTS_NORMAL, ...SHIFTS_FRIDAY].map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
            <select
              value={maintRepFilter.status}
              onChange={(e) => setMaintRepFilter({ ...maintRepFilter, status: e.target.value })}
              className="border border-indigo-300 rounded-xl p-2 bg-white font-black"
            >
              <option value="done">المنفذ فقط</option>
              <option value="all">المنفذ + المخطط</option>
            </select>
          </div>
          <div>
            <p className="font-bold text-slate-700 mb-1">
              نوع الصيانة {maintRepFilter.types.length === 0 ? '(الكل — اضغط لتحديد نوع معيّن)' : ''}:
            </p>
            <div className="flex flex-wrap gap-1">
              {MAINT_TYPES.map((t) => {
                const on = maintRepFilter.types.includes(t);
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() =>
                      setMaintRepFilter({
                        ...maintRepFilter,
                        types: on ? maintRepFilter.types.filter((x) => x !== t) : [...maintRepFilter.types, t]
                      })
                    }
                    className={`px-2 py-1 rounded-lg border text-[10px] font-black ${
                      on ? 'bg-indigo-600 text-white border-indigo-700' : 'bg-white text-slate-700 border-slate-300'
                    }`}
                  >
                    {t}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() =>
                openPrintHTML(
                  buildMaintReportHTML({ factoryName, motors: motorsList, shiftMaintLogs, ...maintRepFilter }),
                  blockedAlert
                )
              }
              className="bg-rose-600 hover:bg-rose-700 text-white font-black py-2 rounded-xl flex items-center justify-center gap-1"
            >
              <FileText className="w-4 h-4" /> طباعة / PDF
            </button>
            <button
              type="button"
              onClick={() =>
                downloadHTMLAsExcel(
                  buildMaintReportHTML({ factoryName, motors: motorsList, shiftMaintLogs, ...maintRepFilter }),
                  `صيانة-المواتير-${formatDateToISO(new Date())}.xls`
                )
              }
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-black py-2 rounded-xl flex items-center justify-center gap-1"
            >
              <FileSpreadsheet className="w-4 h-4" /> Excel
            </button>
          </div>
        </div>
      </div>

      {/* أرشيف الورديات اليومي */}
      <div className="space-y-2.5 pt-2 border-t border-slate-200">
        <h3 className="font-black text-xs sm:text-sm text-slate-900 flex items-center gap-1.5">
          <Archive className="w-4 h-4 text-blue-600" /> أرشيف إنتاج الورديات (الشهر المفتوح)
        </h3>
        {sortedDates.length === 0 && (
          <p className="text-center text-xs font-bold text-slate-400 py-6">لا توجد ورديات مسجلة في هذا الشهر بعد.</p>
        )}
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
                      <span className="font-mono text-emerald-700">
                        {log.billets} ب | {log.tons.toFixed(1)} ط
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}