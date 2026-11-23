import React, { useState } from 'react';
import {
  TrendingUp, Wrench, Disc, BookMarked, PlusCircle, RefreshCw,
  Trash2, RotateCcw, Save, Power, Edit3
} from 'lucide-react';

const getStandStatus = (tons, limit) => {
  const pct = Math.max(0, (tons / limit) * 100);
  if (pct >= 100) return { color: 'danger', bg: 'bg-red-50', border: 'border-red-500', bar: 'bg-red-600', text: 'text-red-700', hex: '#dc2626' };
  if (pct >= 80) return { color: 'warning', bg: 'bg-amber-50', border: 'border-amber-400', bar: 'bg-amber-500', text: 'text-amber-700', hex: '#eab308' };
  return { color: 'good', bg: 'bg-white', border: 'border-slate-200', bar: 'bg-emerald-500', text: 'text-slate-900', hex: '#10b981' };
};

export default function RollingPage({
  factoryName,
  stands,
  pendingList,
  downtimesList,
  rollShopList,
  recipesList,
  selectedProductSize,
  setSelectedProductSize,
  billetWeight,
  shiftBillets,
  setShiftBillets,
  currentProdDate,
  currentDateStr,
  selectedShift,
  setSelectedShift,
  availableShifts,
  isManagerLike,
  roleLabel,
  exportButtons,
  handleDateChange,
  handleGoToToday,
  handleAddShiftProduction,
  handleProductSizeChange,
  handleWeightChange,
  handleToggleActive,
  openStandRollPage,
  initiateResetStand,
  setAddStandOpen,
  handleResetAllStands,
  handleClearArchive,
  save,
  showAlert,
  showConfirm
}) {
  const [subView, setSubView] = useState('dashboard'); // 'dashboard' | 'downtime' | 'rollshop' | 'recipes'

  // حالات الأعطال
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

  // حالات ورشة الدرافيل
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

  const currentShiftDowntimes = downtimesList.filter((d) => d.date === currentDateStr && d.shift === selectedShift);
  const currentShiftDownMins = currentShiftDowntimes.reduce((a, d) => a + (Number(d.durationMins) || 0), 0);

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

  return (
    <div className="flex flex-col gap-2 flex-1">
      {/* شريط التنقل الداخلي لقسم الدرافيل والتشغيل */}
      <div className="bg-slate-900 text-white p-2.5 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
        <h2 className="font-black text-xs sm:text-base flex items-center gap-1.5">
          <Disc className="w-4 h-4 sm:w-5 sm:h-5 text-blue-400" /> قسم الدرافيل والتشغيل ({factoryName})
        </h2>
        <div className="grid grid-cols-2 sm:flex gap-1.5 w-full sm:w-auto">
          {[
            ['dashboard', 'الممرات والتشغيل', TrendingUp, 'bg-blue-600 text-white'],
            ['downtime', `أعطال الوردية (${currentShiftDownMins}ق)`, Wrench, 'bg-amber-500 text-slate-950'],
            ['rollshop', 'ورشة الدرافيل', Disc, 'bg-emerald-600 text-white'],
            ['recipes', 'وصفات المقاسات', BookMarked, 'bg-indigo-600 text-white']
          ].map(([id, label, Icon, activeCls]) => (
            <button
              key={id}
              onClick={() => setSubView(id)}
              className={`px-2.5 py-1.5 rounded-xl text-[11px] font-black flex items-center justify-center gap-1 ${
                subView === id ? activeCls : 'bg-slate-800 text-slate-300'
              }`}
            >
              <Icon size={13} /> {label}
            </button>
          ))}
        </div>
      </div>

      {/* 1. الممرات والتشغيل */}
      {subView === 'dashboard' && (
        <div className="flex flex-col gap-2 flex-1">
          {isManagerLike && (
            <div className="bg-white p-2.5 sm:p-3 rounded-2xl border border-slate-200 shadow-sm space-y-2">
              <div className="grid grid-cols-3 gap-1.5 text-center">
                <div className="bg-emerald-50 py-1.5 px-2 border border-emerald-200 rounded-xl">
                  <span className="text-[9px] font-bold text-emerald-800 block">سليم (&lt;80%)</span>
                  <span className="font-black text-base text-emerald-700">
                    {stands.filter((s) => s.accumulatedTons / s.maxLimit < 0.8).length}
                  </span>
                </div>
                <div className="bg-amber-50 py-1.5 px-2 border border-amber-300 rounded-xl">
                  <span className="text-[9px] font-bold text-amber-800 block">إنذار (+80%)</span>
                  <span className="font-black text-base text-amber-700">
                    {stands.filter((s) => s.accumulatedTons / s.maxLimit >= 0.8 && s.accumulatedTons / s.maxLimit < 1).length}
                  </span>
                </div>
                <div className="bg-red-50 py-1.5 px-2 border border-red-300 rounded-xl">
                  <span className="text-[9px] font-bold text-red-800 block">خطر (+100%)</span>
                  <span className="font-black text-base text-red-700">
                    {stands.filter((s) => s.accumulatedTons / s.maxLimit >= 1).length}
                  </span>
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

          {/* شريط تسجيل الوردية */}
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

          {/* شبكة كروت الستاندات */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2 pb-6">
            {stands.map((stand, idx) => {
              const percentage = Math.max(0, Math.min((stand.accumulatedTons / stand.maxLimit) * 100, 100));
              const status = getStandStatus(stand.accumulatedTons, stand.maxLimit);
              const usedCount = stand.passes ? stand.passes.filter((p) => p.status === 'used' || p.status === 'active').length : 1;
              const hasPending = pendingList.some((r) => String(r.standId) === String(stand.id) && r.status === 'pending');

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
                    <button onClick={() => openStandRollPage(idx)} className="py-1 bg-blue-600 text-white text-[10px] font-bold rounded-lg">
                      الممرات
                    </button>
                    <button onClick={(e) => initiateResetStand(idx, null, e)} className="py-1 bg-slate-800 text-white text-[10px] font-bold rounded-lg">
                      نقل ممر
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 2. أعطال وتوقفات الوردية */}
      {subView === 'downtime' && (
        <div className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-200 p-2.5 sm:p-4 space-y-3">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
            <form onSubmit={handleAddDowntime} className="lg:col-span-5 bg-slate-50 border border-slate-200 rounded-2xl p-3 space-y-2.5 h-fit">
              <h3 className="font-black text-xs sm:text-sm text-slate-900">+ تسجيل عطل أو توقف في ({selectedShift})</h3>
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

      {/* 3. ورشة الدرافيل */}
      {subView === 'rollshop' && (
        <div className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-200 p-2.5 sm:p-4 space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="font-black text-xs sm:text-sm text-slate-900">سجل طواقم الدرافيل والمخرطة (Roll Shop)</h3>
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
                      <span className="font-mono font-black">
                        {roll.currentDia} / {roll.minScrapDia} مم
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">المتبقي للخراطة:</span>
                      <span className="font-mono font-black text-emerald-700">{remainingMm} مم</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button onClick={() => handleRecordRedressing(roll)} className="flex-1 py-1.5 rounded-xl text-xs font-bold bg-slate-900 text-amber-400">
                      تسجيل خراطة
                    </button>
                    <button onClick={() => handleStartEditRollItem(roll)} className="bg-blue-50 text-blue-700 p-1.5 rounded-xl border border-blue-200">
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button onClick={() => handleDeleteRollShopItem(roll.id)} className="bg-red-50 text-red-600 p-1.5 rounded-xl border border-red-200">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 4. وصفات المقاسات */}
      {subView === 'recipes' && (
        <div className="flex-1 bg-white rounded-2xl shadow-sm border border-slate-200 p-2.5 sm:p-4 space-y-3">
          <div className="flex justify-between items-center">
            <h3 className="font-black text-xs sm:text-sm text-slate-900">كتالوج وصفات المقاسات الجاهزة</h3>
            <span className="bg-blue-600 text-white px-2.5 py-0.5 rounded-lg text-[11px] font-black">
              المقاس الحالي: {selectedProductSize}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {recipesList.map((rec) => (
              <div key={rec.id} className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 flex flex-col justify-between gap-2.5">
                <div className="flex justify-between items-center">
                  <h3 className="font-black text-sm text-slate-900">{rec.name}</h3>
                  <span className="bg-blue-600 text-white text-[10px] font-black px-2 py-0.5 rounded-lg">{rec.productSize}</span>
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
                <button onClick={() => handleApplyRecipe(rec)} className="w-full bg-blue-600 text-white font-bold py-2 rounded-xl text-xs">
                  تفعيل الوصفة على الخط
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}