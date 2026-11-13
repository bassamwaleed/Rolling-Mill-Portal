import React, { useState } from 'react';
import { 
  Settings, Calculator, AlertTriangle, ShieldCheck, 
  Activity, Zap, Server, ChevronRight, Save, LayoutDashboard 
} from 'lucide-react';
// استدعاء دوال قاعدة البيانات
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase'; 

// ==========================================
// 1. قسم يوميات التشغيل (Shift Operations)
// ==========================================
const Operations = () => {
  const stands = Array.from({ length: 12 }, (_, i) => ({
    id: i + 1,
    name: `استاند ${i + 1}`,
    status: i === 4 ? 'warning' : i === 7 ? 'danger' : 'active',
    rollDia: 480 - (i * 5),
    passZero: Math.floor(Math.random() * 1000)
  }));

  // دالة الإرسال لقاعدة البيانات
  const handleSaveReport = async () => {
    try {
      const docRef = await addDoc(collection(db, 'shift_reports'), {
        date: serverTimestamp(),
        operatorName: 'Beso',
        shiftType: 'وردية أ',
        standsData: stands,
        status: 'تم التسجيل'
      });
      alert('تم حفظ تقرير الوردية بنجاح! رقم التقرير: ' + docRef.id);
    } catch (error) {
      console.error('خطأ في الحفظ:', error);
      alert('حدث خطأ أثناء حفظ التقرير، تأكد من الاتصال بقاعدة البيانات.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-slate-800 p-4 rounded-lg border border-slate-700">
        <div>
          <h2 className="text-2xl font-bold text-white">حالة خط الدرفلة (Live Status)</h2>
          <p className="text-slate-400 text-sm mt-1">مراقبة الاستاندات وتغيير الباسات لشركة الجيوشي للصلب</p>
        </div>
        <button 
          onClick={handleSaveReport}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded flex items-center gap-2"
        >
          <Save size={18} />
          <span>حفظ تقرير الوردية</span>
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {stands.map((stand) => (
          <div key={stand.id} className="bg-slate-800 rounded-lg p-4 border border-slate-700">
            <div className="flex justify-between items-start mb-4">
              <span className="text-lg font-bold text-slate-200">{stand.name}</span>
              <span className={`w-3 h-3 rounded-full ${
                stand.status === 'active' ? 'bg-green-500' : 
                stand.status === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
              } shadow-[0_0_8px_currentColor]`} />
            </div>
            <div className="space-y-2 text-sm text-slate-400">
              <div className="flex justify-between">
                <span>قطر الدرفيل:</span>
                <span className="text-white font-mono">{stand.rollDia} mm</span>
              </div>
              <div className="flex justify-between">
                <span>عداد الباس:</span>
                <span className="text-blue-400 font-mono">{stand.passZero} طن</span>
              </div>
            </div>
            <button className="mt-4 w-full bg-slate-700 hover:bg-slate-600 text-white py-1.5 rounded text-sm">
              تحديث الباس
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

// ==========================================
// 2. قسم الحاسبات الهندسية (Smart Calculators)
// ==========================================
const Calculators = () => {
  const [velocity, setVelocity] = useState(2.5);
  const [diameter, setDiameter] = useState(480);
  const [gearRatio, setGearRatio] = useState(3.5);
  const [areaIn, setAreaIn] = useState(16900);
  const [areaOut, setAreaOut] = useState(13000);

  const rollRpm = diameter > 0 ? ((velocity * 60 * 1000) / (Math.PI * diameter)).toFixed(1) : 0;
  const motorRpm = (rollRpm * gearRatio).toFixed(1);
  const reductionPercent = areaIn > 0 ? (((areaIn - areaOut) / areaIn) * 100).toFixed(1) : 0;
  const elongation = areaOut > 0 ? (areaIn / areaOut).toFixed(2) : 0;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white mb-6">حاسبات الدرفلة المتقدمة ⚙️</h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-slate-800 p-6 rounded-lg border border-slate-700">
          <h3 className="text-xl font-bold text-blue-400 mb-4 flex items-center gap-2">
            <Activity size={20} /> تزامن السرعات (Speed & RPM)
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-slate-400 text-sm mb-1">سرعة خروج المعدن (m/s)</label>
              <input type="number" value={velocity} onChange={(e) => setVelocity(e.target.value)} 
                className="w-full bg-slate-900 border border-slate-600 text-white p-2 rounded focus:border-blue-500 outline-none" />
            </div>
            <div>
              <label className="block text-slate-400 text-sm mb-1">قطر الدرفيل الفعال (mm)</label>
              <input type="number" value={diameter} onChange={(e) => setDiameter(e.target.value)} 
                className="w-full bg-slate-900 border border-slate-600 text-white p-2 rounded focus:border-blue-500 outline-none" />
            </div>
            <div>
              <label className="block text-slate-400 text-sm mb-1">نسبة تخفيض الجيربوكس (Gear Ratio)</label>
              <input type="number" value={gearRatio} onChange={(e) => setGearRatio(e.target.value)} 
                className="w-full bg-slate-900 border border-slate-600 text-white p-2 rounded focus:border-blue-500 outline-none" />
            </div>
            <div className="mt-6 p-4 bg-slate-900 rounded border border-blue-900/50">
              <div className="flex justify-between items-center mb-2">
                <span className="text-slate-300">سرعة الدرفيل (Roll RPM):</span>
                <span className="text-2xl font-bold text-white font-mono">{rollRpm}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-blue-400 font-bold">سرعة الموتور (Motor RPM):</span>
                <span className="text-3xl font-bold text-blue-400 font-mono">{motorRpm}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-slate-800 p-6 rounded-lg border border-slate-700">
          <h3 className="text-xl font-bold text-emerald-400 mb-4 flex items-center gap-2">
            <LayoutDashboard size={20} /> حسابات التخفيض (Pass Design)
          </h3>
          <div className="space-y-4">
            <div>
              <label className="block text-slate-400 text-sm mb-1">مساحة المقطع الداخل (Area IN mm²)</label>
              <input type="number" value={areaIn} onChange={(e) => setAreaIn(e.target.value)} 
                className="w-full bg-slate-900 border border-slate-600 text-white p-2 rounded focus:border-emerald-500 outline-none" />
            </div>
            <div>
              <label className="block text-slate-400 text-sm mb-1">مساحة المقطع الخارج (Area OUT mm²)</label>
              <input type="number" value={areaOut} onChange={(e) => setAreaOut(e.target.value)} 
                className="w-full bg-slate-900 border border-slate-600 text-white p-2 rounded focus:border-emerald-500 outline-none" />
            </div>
            <div className="mt-6 p-4 bg-slate-900 rounded border border-emerald-900/50 space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-slate-300">نسبة التخفيض (Reduction %):</span>
                <span className="text-2xl font-bold text-emerald-400 font-mono">{reductionPercent}%</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-300">معامل الاستطالة (Elongation):</span>
                <span className="text-xl font-bold text-white font-mono">{elongation}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// ==========================================
// 3. قسم الأعطال والصيانة (Troubleshooting)
// ==========================================
const Faults = () => (
  <div className="space-y-6">
    <h2 className="text-2xl font-bold text-white mb-6">دليل الأعطال والصيانة 🛠️</h2>
    <div className="grid gap-4">
      {[
        { code: 'F011', type: 'Siemens VFD', desc: 'Overcurrent (تيار زائد)', sol: 'افحص الموتور، تأكد من عدم وجود حشر (Cobble) في الاستاند، راجع كابلات الباور.' },
        { code: 'F008', type: 'Siemens VFD', desc: 'DC Link Overvoltage', sol: 'تأكد من مقاومة الفرملة (Braking Resistor)، راجع زمن التباطؤ (Deceleration time).' }
      ].map((fault, i) => (
        <div key={i} className="bg-slate-800 p-5 rounded-lg border border-slate-700 flex flex-col md:flex-row gap-4 items-start md:items-center">
          <div className="bg-red-900/50 p-3 rounded-lg text-red-400 border border-red-800">
            <AlertTriangle size={24} />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-1">
              <h3 className="text-xl font-bold text-white">{fault.code}</h3>
              <span className="text-xs bg-slate-700 text-slate-300 px-2 py-1 rounded">{fault.type}</span>
            </div>
            <p className="text-red-300 mb-2">{fault.desc}</p>
            <p className="text-slate-400 text-sm"><span className="text-emerald-400">الحل السريع: </span>{fault.sol}</p>
          </div>
        </div>
      ))}
    </div>
  </div>
);

// ==========================================
// 4. لوحة الإدارة (Admin Panel)
// ==========================================
const AdminPanel = () => (
  <div className="space-y-6">
    <div className="bg-gradient-to-r from-slate-800 to-slate-900 p-8 rounded-lg border border-slate-700 text-center">
      <ShieldCheck size={48} className="mx-auto text-blue-500 mb-4" />
      <h2 className="text-2xl font-bold text-white mb-2">لوحة تحكم مدير الإنتاج</h2>
      <p className="text-slate-400 mb-6">مخصصة للإدارة فقط.</p>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-3xl mx-auto">
        <button className="bg-slate-700 hover:bg-slate-600 text-white p-4 rounded-lg flex flex-col items-center gap-2">
          <Server size={24} className="text-emerald-400" />
          <span>تصدير تقرير Excel</span>
        </button>
        <button className="bg-slate-700 hover:bg-slate-600 text-white p-4 rounded-lg flex flex-col items-center gap-2">
          <Settings size={24} className="text-blue-400" />
          <span>موافقات التغيير</span>
        </button>
      </div>
    </div>
  </div>
);

// ==========================================
// التطبيق الرئيسي
// ==========================================
export default function App() {
  const [activeTab, setActiveTab] = useState('operations');

  const navItems = [
    { id: 'operations', label: 'يوميات التشغيل', icon: Activity },
    { id: 'calculators', label: 'الحاسبات الهندسية', icon: Calculator },
    { id: 'faults', label: 'دليل الأعطال', icon: AlertTriangle },
    { id: 'admin', label: 'لوحة الإدارة', icon: ShieldCheck },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 flex flex-col md:flex-row" dir="rtl">
      <aside className="w-full md:w-64 bg-slate-900 border-l border-slate-800 p-4 flex flex-col">
        <div className="flex items-center gap-3 mb-8 px-2 mt-4">
          <div className="bg-blue-600 p-2 rounded-lg">
            <Zap className="text-white" size={24} />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">Steel<span className="text-blue-500">Portal</span></h1>
            <p className="text-xs text-slate-500">Rolling Mill Management</p>
          </div>
        </div>

        <nav className="flex-1 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center justify-between p-3 rounded-lg transition-all duration-200 ${
                  isActive 
                    ? 'bg-blue-600/10 text-blue-400 border border-blue-600/30 shadow-[inset_4px_0_0_0_rgb(37,99,235)]' 
                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon size={20} className={isActive ? 'text-blue-500' : 'text-slate-500'} />
                  <span className="font-medium">{item.label}</span>
                </div>
                {isActive && <ChevronRight size={16} />}
              </button>
            );
          })}
        </nav>
      </aside>

      <main className="flex-1 p-4 md:p-8 overflow-y-auto">
        <div className="max-w-6xl mx-auto">
          {activeTab === 'operations' && <Operations />}
          {activeTab === 'calculators' && <Calculators />}
          {activeTab === 'faults' && <Faults />}
          {activeTab === 'admin' && <AdminPanel />}
        </div>
      </main>
    </div>
  );
}
