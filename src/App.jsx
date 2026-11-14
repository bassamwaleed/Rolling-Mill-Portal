import React, { useState } from 'react';
import { Calculator, Building2, Zap, Key, X, PlusCircle, ShieldCheck } from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// استدعاء الملفين الآخرين اللذين سننشئهما في الخطوتين القادمتين
import PublicPortal from './PublicPortal';
import FactoryPortal from './FactoryPortal';

/* ======================================================
   1. إعدادات قاعدة البيانات المشتركة (Firebase)
   ====================================================== */
const firebaseConfig = {
  apiKey: "AIzaSyDrSPpzOlaC1CYRURzLWeI9crZwF5jV_QY",
  authDomain: "rolling-mill-tracker.firebaseapp.com",
  databaseURL: "https://rolling-mill-tracker-default-rtdb.firebaseio.com",
  projectId: "rolling-mill-tracker",
  storageBucket: "rolling-mill-tracker.firebasestorage.app",
  messagingSenderId: "528405881772",
  appId: "1:528405881772:web:30498fd387894331fb9009",
  measurementId: "G-3XR8MT7T3S"
};

let app, auth, db;
try {
  if (Object.keys(firebaseConfig).length > 0) {
    app = initializeApp(firebaseConfig);
    auth = getAuth(app);
    db = getFirestore(app);
  }
} catch (error) {
  console.error("Firebase init error:", error);
}

// تصدير auth و db ليتم استخدامهما في ملف الحسابات وملف المصانع
export { auth, db };

/* ======================================================
   2. الموزع الرئيسي (App Gateway)
   ====================================================== */
export default function App() {
  const [appMode, setAppMode] = useState('select'); // 'select' | 'public' | 'factory'
  const [logoClicks, setLogoClicks] = useState(0);
  const [showCreatorModal, setShowCreatorModal] = useState(false);
  const [creatorPin, setCreatorPin] = useState('');
  const [creatorUnlocked, setCreatorUnlocked] = useState(false);

  // قائمة المصانع المشتركة في الـ SaaS (قابلة للإضافة من لوحتك السرية)
  const [factoriesList, setFactoriesList] = useState([
    { id: 'al-gioshy-steel-rolls', name: 'شركة الجيوشي للصلب', techCode: '1111', managerCode: '2222', adminCode: '9999' },
    { id: 'demo-steel-mill', name: 'مصنع الدرفلة النموذجي', techCode: '0000', managerCode: '1234', adminCode: '9999' }
  ]);
  const [selectedFactory, setSelectedFactory] = useState(factoriesList[0]);
  const [newFactory, setNewFactory] = useState({ name: '', id: '', techCode: '1111', managerCode: '2222' });

  const handleTitleClick = () => {
    const next = logoClicks + 1;
    if (next >= 5) {
      setShowCreatorModal(true);
      setLogoClicks(0);
    } else {
      setLogoClicks(next);
    }
  };

  const handleAddFactory = (e) => {
    e.preventDefault();
    if (!newFactory.name.trim() || !newFactory.id.trim()) return;
    const item = {
      id: newFactory.id.trim().toLowerCase().replace(/\s+/g, '-'),
      name: newFactory.name.trim(),
      techCode: newFactory.techCode || '1111',
      managerCode: newFactory.managerCode || '2222',
      adminCode: '9999'
    };
    setFactoriesList([item, ...factoriesList]);
    setSelectedFactory(item);
    setNewFactory({ name: '', id: '', techCode: '1111', managerCode: '2222' });
  };

  // التوجيه إلى ملف الحسابات والمجتمع
  if (appMode === 'public') {
    return <PublicPortal onBack={() => setAppMode('select')} />;
  }

  // التوجيه إلى ملف المصانع SaaS
  if (appMode === 'factory') {
    return (
      <FactoryPortal
        onBack={() => setAppMode('select')}
        factoryConfig={selectedFactory}
        factoriesList={factoriesList}
        onSelectFactory={setSelectedFactory}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden" dir="rtl">
      {/* إضاءة خلفية */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-600/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-emerald-600/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-4xl w-full z-10">
        {/* الهيدر الرئيسي (اضغط 5 مرات لفتح لوحة المصمم السرية) */}
        <div className="text-center mb-12">
          <div
            onClick={handleTitleClick}
            title="اضغط 5 مرات لفتح لوحة تحكم المصمم"
            className="inline-flex items-center gap-3 cursor-pointer select-none mb-3 group"
          >
            <div className="bg-blue-600 p-3 rounded-2xl shadow-lg shadow-blue-600/30 group-active:scale-95 transition-transform">
              <Zap className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight">
              Steel<span className="text-blue-500">Portal</span> Gateway
            </h1>
          </div>
          <p className="text-slate-400 font-bold text-sm md:text-base">
            المنصة الرقمية الشاملة لمهندسي الدرفلة وإدارة مصانع الحديد والصلب
          </p>
        </div>

        {/* بطاقات اختيار البوابة */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
          {/* 1. بوابة المهندسين والحسابات */}
          <div
            onClick={() => setAppMode('public')}
            className="group bg-slate-900 border-2 border-slate-800 hover:border-blue-500 p-8 sm:p-10 rounded-[2rem] text-center flex flex-col items-center cursor-pointer transition-all hover:shadow-[0_0_40px_rgba(59,130,246,0.15)] hover:-translate-y-2"
          >
            <div className="w-24 h-24 bg-gradient-to-br from-blue-900/40 to-blue-600/20 rounded-3xl flex items-center justify-center mb-6 border border-blue-500/20 group-hover:scale-110 transition-transform duration-300">
              <Calculator className="w-12 h-12 text-blue-400" />
            </div>
            <h2 className="text-3xl font-black text-white mb-4">بوابة المهندسين والحسابات</h2>
            <p className="text-sm text-slate-400 mb-8 leading-relaxed font-bold">
              حاسبات الدرفلة والكهرباء، تصميم الممرات، حساب أطوال الأسياخ، الجداول القياسية، ومجتمع النقاشات والأعطال.
            </p>
            <div className="mt-auto w-full bg-blue-600 group-hover:bg-blue-500 text-white font-black py-4 rounded-2xl transition-colors shadow-lg shadow-blue-900/20">
              دخول مجاني (Public Portal)
            </div>
          </div>

          {/* 2. بوابة المصانع SaaS */}
          <div
            onClick={() => setAppMode('factory')}
            className="group bg-slate-900 border-2 border-slate-800 hover:border-emerald-500 p-8 sm:p-10 rounded-[2rem] text-center flex flex-col items-center cursor-pointer transition-all hover:shadow-[0_0_40px_rgba(16,185,129,0.15)] hover:-translate-y-2"
          >
            <div className="w-24 h-24 bg-gradient-to-br from-emerald-900/40 to-emerald-600/20 rounded-3xl flex items-center justify-center mb-6 border border-emerald-500/20 group-hover:scale-110 transition-transform duration-300">
              <Building2 className="w-12 h-12 text-emerald-400" />
            </div>
            <h2 className="text-3xl font-black text-white mb-4">نظام المصانع SaaS</h2>
            <p className="text-sm text-slate-400 mb-8 leading-relaxed font-bold">
              بوابة خاصة للمصانع لمتابعة أعمار الدرافيل والممرات (Stands 1-12)، تقارير الورديات، وسجل المواتير.
            </p>
            <div className="mt-auto w-full bg-emerald-600 group-hover:bg-emerald-500 text-white font-black py-4 rounded-2xl transition-colors shadow-lg shadow-emerald-900/20">
              تسجيل الدخول للمصنع (Enterprise)
            </div>
          </div>
        </div>

        <div className="mt-12 text-center text-slate-500 text-xs font-bold">
          تم تصميم وتطوير النظام بواسطة <span className="text-blue-400">م. بسام وليد (Controlexa)</span> © 2026
        </div>
      </div>

      {/* نافذة المصمم السرية (تفتح بعد 5 ضغطات على اللوجو) */}
      {showCreatorModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border-2 border-amber-500/40 rounded-3xl max-w-lg w-full p-6 space-y-4 text-white shadow-2xl">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="font-black text-lg text-amber-400 flex items-center gap-2">
                <Key size={20} /> لوحة تحكم م. بسام وليد (Creator SaaS)
              </h3>
              <button onClick={() => setShowCreatorModal(false)} className="text-slate-400 hover:text-white">
                <X size={20} />
              </button>
            </div>

            {!creatorUnlocked ? (
              <div className="space-y-3 py-2">
                <p className="text-xs text-slate-400">أدخل الرقم السري الخاص بمؤسس المنصة (2026 أو beso):</p>
                <input
                  type="password"
                  value={creatorPin}
                  onChange={(e) => setCreatorPin(e.target.value)}
                  placeholder="Master Password"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-3 text-center font-mono text-lg"
                />
                <button
                  onClick={() => (creatorPin === '2026' || creatorPin === 'beso' ? setCreatorUnlocked(true) : alert('كود غير صحيح'))}
                  className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-black py-3 rounded-xl"
                >
                  فتح إعدادات الـ SaaS
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <form onSubmit={handleAddFactory} className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
                  <h4 className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                    <PlusCircle size={15} /> إضافة مصنع جديد للمنصة
                  </h4>
                  <input
                    type="text"
                    placeholder="اسم المصنع (مثلاً: مصنع العبور للصلب)"
                    value={newFactory.name}
                    onChange={(e) => setNewFactory({ ...newFactory, name: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-white"
                  />
                  <input
                    type="text"
                    placeholder="المعرف في قاعدة البيانات (مثلاً: obour-steel)"
                    value={newFactory.id}
                    onChange={(e) => setNewFactory({ ...newFactory, id: e.target.value })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-white font-mono"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="كود الفنيين (1111)"
                      value={newFactory.techCode}
                      onChange={(e) => setNewFactory({ ...newFactory, techCode: e.target.value })}
                      className="bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-white font-mono"
                    />
                    <input
                      type="text"
                      placeholder="كود المدير (2222)"
                      value={newFactory.managerCode}
                      onChange={(e) => setNewFactory({ ...newFactory, managerCode: e.target.value })}
                      className="bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-white font-mono"
                    />
                  </div>
                  <button type="submit" className="w-full bg-amber-500 text-slate-950 font-black py-2.5 rounded-xl text-xs">
                    تفعيل المصنع
                  </button>
                </form>

                <div className="space-y-2 max-h-44 overflow-y-auto">
                  {factoriesList.map((f) => (
                    <div key={f.id} className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex justify-between items-center text-xs">
                      <div>
                        <p className="font-bold text-white">{f.name}</p>
                        <p className="text-slate-400 font-mono">
                          ID: {f.id} | فني: {f.techCode} | مدير: {f.managerCode}
                        </p>
                      </div>
                      <button
                        onClick={() => {
                          setSelectedFactory(f);
                          setShowCreatorModal(false);
                          setAppMode('factory');
                        }}
                        className="bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 px-3 py-1.5 rounded-lg font-bold"
                      >
                        فتح المصنع
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}