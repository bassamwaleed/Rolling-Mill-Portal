import React, { useState, useEffect } from 'react';
import {
  Calculator, Building2, Zap, Key, X, PlusCircle,
  Lock, ArrowLeft, ShieldCheck, CheckCircle2
} from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, setDoc, onSnapshot } from 'firebase/firestore';

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

export { auth, db };

const DEFAULT_FACTORIES = [
  {
    id: 'al-gioshy-steel-rolls',
    code: 'GIOSHY-2026',
    name: 'شركة الجيوشي للصلب',
    techCode: '1111',
    managerCode: '2222',
    adminCode: '9999',
    status: 'active',
    createdAt: '2026-11-14'
  }
];

/* ======================================================
   2. البوابة الرئيسية (Clean Light UI - Mobile First)
   ====================================================== */
export default function App() {
  const [appMode, setAppMode] = useState('select'); // 'select' | 'public' | 'factory_gate' | 'factory_inside'
  const [userAuth, setUserAuth] = useState(null);

  const [factoriesList, setFactoriesList] = useState(DEFAULT_FACTORIES);
  const [activeFactory, setActiveFactory] = useState(null);

  const [factoryCodeInput, setFactoryCodeInput] = useState('');
  const [gateError, setGateError] = useState('');

  // لوحة تحكم المصمم السرية (تفتح عند الضغط 5 مرات على اللوجو)
  const [logoClicks, setLogoClicks] = useState(0);
  const [showCreatorModal, setShowCreatorModal] = useState(false);
  const [creatorPin, setCreatorPin] = useState('');
  const [creatorUnlocked, setCreatorUnlocked] = useState(false);
  const [newFactory, setNewFactory] = useState({
    name: '',
    code: '',
    techCode: '1111',
    managerCode: '2222'
  });

  useEffect(() => {
    if (!auth) return;
    signInAnonymously(auth).catch((e) => console.error(e));
    const unsub = onAuthStateChanged(auth, setUserAuth);
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!userAuth || !db) return;
    const regRef = doc(db, 'saas_registry', 'tenants_list');
    const unsub = onSnapshot(regRef, (snap) => {
      if (snap.exists() && Array.isArray(snap.data().factories)) {
        setFactoriesList(snap.data().factories);
      } else {
        setDoc(regRef, { factories: DEFAULT_FACTORIES });
      }
    });
    return () => unsub();
  }, [userAuth]);

  const saveFactoriesToCloud = async (updatedList) => {
    setFactoriesList(updatedList);
    if (userAuth && db) {
      try {
        await setDoc(doc(db, 'saas_registry', 'tenants_list'), { factories: updatedList });
      } catch (e) {
        console.error('Error saving tenants:', e);
      }
    }
  };

  const handleTitleClick = () => {
    const next = logoClicks + 1;
    if (next >= 5) {
      setShowCreatorModal(true);
      setLogoClicks(0);
    } else {
      setLogoClicks(next);
    }
  };

  const handleAddFactory = async (e) => {
    e.preventDefault();
    if (!newFactory.name.trim() || !newFactory.code.trim()) return;
    const cleanCode = newFactory.code.trim().toUpperCase();
    if (factoriesList.some((f) => f.code.toUpperCase() === cleanCode)) {
      alert('هذا الكود مستخدم لمصنع آخر بالفعل!');
      return;
    }
    const uniqueDbId = `tenant_${cleanCode.toLowerCase().replace(/[^a-z0-9]/g, '_')}_${Date.now().toString().slice(-4)}`;
    const item = {
      id: uniqueDbId,
      code: cleanCode,
      name: newFactory.name.trim(),
      techCode: newFactory.techCode || '1111',
      managerCode: newFactory.managerCode || '2222',
      adminCode: '9999',
      status: 'active',
      createdAt: new Date().toLocaleDateString('en-GB')
    };
    const updated = [item, ...factoriesList];
    await saveFactoriesToCloud(updated);
    setNewFactory({ name: '', code: '', techCode: '1111', managerCode: '2222' });
  };

  const toggleFactoryStatus = async (code) => {
    const updated = factoriesList.map((f) =>
      f.code === code ? { ...f, status: f.status === 'active' ? 'suspended' : 'active' } : f
    );
    await saveFactoriesToCloud(updated);
  };

  const handleVerifyFactoryCode = (e) => {
    e.preventDefault();
    const entered = factoryCodeInput.trim().toUpperCase();
    const found = factoriesList.find((f) => f.code.toUpperCase() === entered);
    if (!found) {
      setGateError('كود المصنع غير صحيح! تأكد من الكود الخاص بشركتك.');
      return;
    }
    if (found.status !== 'active') {
      setGateError('عفواً، اشتراك هذا المصنع موقوف مؤقتاً.');
      return;
    }
    setActiveFactory(found);
    setFactoryCodeInput('');
    setGateError('');
    setAppMode('factory_inside');
  };

  if (appMode === 'public') {
    return <PublicPortal onBack={() => setAppMode('select')} />;
  }

  if (appMode === 'factory_inside' && activeFactory) {
    return (
      <FactoryPortal
        onBack={() => {
          setActiveFactory(null);
          setAppMode('select');
        }}
        factoryConfig={activeFactory}
        factoriesList={[]}
      />
    );
  }

  // شاشة إدخال كود المصنع باللون الأبيض النظيف
  if (appMode === 'factory_gate') {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4 font-sans text-slate-900" dir="rtl">
        <div className="bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 max-w-md w-full text-center shadow-xl space-y-5">
          <div className="w-14 h-14 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-center mx-auto">
            <Lock className="w-7 h-7 text-emerald-600" />
          </div>
          <div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900">بوابة دخول المصانع</h2>
            <p className="text-xs text-slate-500 font-bold mt-1">
              أدخل كود المصنع الخاص بكم لفتح قاعدة البيانات المستقلة
            </p>
          </div>

          <form onSubmit={handleVerifyFactoryCode} className="space-y-3.5">
            <input
              type="text"
              autoFocus
              value={factoryCodeInput}
              onChange={(e) => {
                setFactoryCodeInput(e.target.value);
                setGateError('');
              }}
              placeholder="مثال: GIOSHY-2026"
              className="w-full bg-slate-50 border border-slate-300 focus:border-emerald-600 focus:bg-white rounded-2xl p-3.5 text-center font-mono text-base sm:text-lg text-slate-900 uppercase tracking-wider outline-none transition-all"
            />
            {gateError && (
              <p className="text-xs font-bold text-red-600 bg-red-50 border border-red-200 p-2.5 rounded-xl">
                {gateError}
              </p>
            )}
            <button
              type="submit"
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-3.5 rounded-2xl shadow-md transition-all text-sm"
            >
              فتح نظام المصنع
            </button>
          </form>

          <button
            onClick={() => {
              setGateError('');
              setFactoryCodeInput('');
              setAppMode('select');
            }}
            className="text-xs font-bold text-slate-500 hover:text-slate-900 pt-1 block mx-auto"
          >
            الرجوع للصفحة الرئيسية
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col justify-between p-4 sm:p-6 font-sans" dir="rtl">
      {/* شريط علوي بسيط وأنيق للموبايل */}
      <header className="max-w-3xl w-full mx-auto pt-2 sm:pt-6 flex items-center justify-between">
        <div
          onClick={handleTitleClick}
          title="اضغط 5 مرات لفتح لوحة المصمم"
          className="flex items-center gap-2.5 cursor-pointer select-none group"
        >
          <div className="bg-blue-600 p-2 rounded-xl shadow-md shadow-blue-600/20 group-active:scale-95 transition-transform">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight leading-none">
              Steel<span className="text-blue-600">Portal</span>
            </h1>
            <span className="text-[10px] font-bold text-slate-500">منصة صناعة الحديد والدرفلة</span>
          </div>
        </div>

        <span className="bg-blue-50 text-blue-700 border border-blue-200 text-[11px] font-bold px-3 py-1 rounded-full">
          الإصدار الهندسي 2026
        </span>
      </header>

      {/* منطقة المنتصف: بطاقات اختيار نظيفة ومرتبة جداً للموبايل */}
      <main className="max-w-3xl w-full mx-auto my-auto py-6 space-y-5">
        <div className="text-center sm:text-right space-y-1 px-1">
          <h2 className="text-xl sm:text-3xl font-black text-slate-900">
            اختر البوابة المناسبة لعملك
          </h2>
          <p className="text-xs sm:text-sm text-slate-500 font-bold">
            حاسبات وقوانين هندسية مفتوحة للجميع، أو نظام إدارة خاص لكل مصنع
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* البطاقة الأولى: بوابة المهندسين والفنيين */}
          <div
            onClick={() => setAppMode('public')}
            className="group bg-white border-2 border-slate-200 hover:border-blue-600 rounded-3xl p-5 sm:p-6 cursor-pointer transition-all shadow-sm hover:shadow-xl flex flex-col justify-between gap-4"
          >
            <div className="flex sm:flex-col items-start gap-3.5">
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-blue-50 border border-blue-100 rounded-2xl flex items-center justify-center shrink-0 group-hover:bg-blue-600 group-hover:text-white text-blue-600 transition-colors">
                <Calculator className="w-6 h-6 sm:w-7 sm:h-7" />
              </div>
              <div className="space-y-1">
                <span className="inline-block text-[10px] font-extrabold bg-blue-50 text-blue-700 px-2.5 py-0.5 rounded-full">
                  مفتوح مجاناً للجميع
                </span>
                <h3 className="text-lg sm:text-xl font-black text-slate-900">
                  بوابة المهندسين والحسابات
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed font-medium">
                  قوانين السرعات، قطعيات المقص الطائر والبارد، وزن المتر الطولي المخصص، حسابات الكابلات والكهرباء، والمجتمع الفني.
                </p>
              </div>
            </div>

            <div className="w-full bg-blue-600 group-hover:bg-blue-700 text-white font-bold py-3 px-4 rounded-xl text-xs sm:text-sm flex items-center justify-between shadow-sm transition-colors">
              <span>دخول بوابة الحسابات والمجتمع</span>
              <ArrowLeft className="w-4 h-4" />
            </div>
          </div>

          {/* البطاقة الثانية: بوابة المصانع SaaS */}
          <div
            onClick={() => setAppMode('factory_gate')}
            className="group bg-white border-2 border-slate-200 hover:border-emerald-600 rounded-3xl p-5 sm:p-6 cursor-pointer transition-all shadow-sm hover:shadow-xl flex flex-col justify-between gap-4"
          >
            <div className="flex sm:flex-col items-start gap-3.5">
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-emerald-50 border border-emerald-100 rounded-2xl flex items-center justify-center shrink-0 group-hover:bg-emerald-600 group-hover:text-white text-emerald-600 transition-colors">
                <Building2 className="w-6 h-6 sm:w-7 sm:h-7" />
              </div>
              <div className="space-y-1">
                <span className="inline-block text-[10px] font-extrabold bg-emerald-50 text-emerald-700 px-2.5 py-0.5 rounded-full">
                  خاص بالمصانع المشتركة
                </span>
                <h3 className="text-lg sm:text-xl font-black text-slate-900">
                  نظام إدارة المصانع (SaaS)
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed font-medium">
                  قاعدة بيانات مستقلة لكل مصنع لمتابعة أعمار الممرات والدرافيل، توقفات الورديات، وصفات المقاسات، وسجل المواتير.
                </p>
              </div>
            </div>

            <div className="w-full bg-slate-900 group-hover:bg-emerald-600 text-white font-bold py-3 px-4 rounded-xl text-xs sm:text-sm flex items-center justify-between shadow-sm transition-colors">
              <span>الدخول بكود المصنع</span>
              <ArrowLeft className="w-4 h-4" />
            </div>
          </div>
        </div>
      </main>

      {/* الفوتر */}
      <footer className="max-w-3xl w-full mx-auto text-center py-3 border-t border-slate-200/80 text-[11px] text-slate-500 font-bold">
        تصميم وتطوير <span className="text-blue-600 font-black">م. بسام وليد (Controlexa)</span> © 2026
      </footer>

      {/* نافذة المصمم السرية (تفتح بعد 5 ضغطات على اللوجو) */}
      {showCreatorModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-3xl max-w-xl w-full p-5 sm:p-6 space-y-4 text-slate-900 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-200 pb-3">
              <h3 className="font-black text-base text-slate-900 flex items-center gap-2">
                <Key size={18} className="text-amber-500" /> لوحة م. بسام السرية - إدارة المصانع
              </h3>
              <button onClick={() => setShowCreatorModal(false)} className="text-slate-400 hover:text-slate-700">
                <X size={20} />
              </button>
            </div>

            {!creatorUnlocked ? (
              <div className="space-y-3 py-2">
                <p className="text-xs text-slate-600 font-bold">أدخل الرقم السري للمصمم (2026 أو beso):</p>
                <input
                  type="password"
                  value={creatorPin}
                  onChange={(e) => setCreatorPin(e.target.value)}
                  placeholder="Master PIN"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-center font-mono text-lg outline-none focus:border-blue-600"
                />
                <button
                  onClick={() =>
                    creatorPin === '2026' || creatorPin === 'beso' ? setCreatorUnlocked(true) : alert('كود غير صحيح')
                  }
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-3 rounded-xl text-sm"
                >
                  فتح لوحة التحكم
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <form onSubmit={handleAddFactory} className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                  <h4 className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                    <PlusCircle size={15} className="text-blue-600" /> إنشاء مصنع جديد بقاعدة بيانات منفصلة
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <input
                      type="text"
                      placeholder="اسم المصنع (مثلاً: حديد العبور)"
                      value={newFactory.name}
                      onChange={(e) => setNewFactory({ ...newFactory, name: e.target.value })}
                      className="bg-white border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900"
                    />
                    <input
                      type="text"
                      placeholder="كود دخول المصنع (مثلاً: OBOUR-2026)"
                      value={newFactory.code}
                      onChange={(e) => setNewFactory({ ...newFactory, code: e.target.value })}
                      className="bg-white border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 font-mono uppercase"
                    />
                    <input
                      type="text"
                      placeholder="كود فني الإنتاج (1111)"
                      value={newFactory.techCode}
                      onChange={(e) => setNewFactory({ ...newFactory, techCode: e.target.value })}
                      className="bg-white border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 font-mono"
                    />
                    <input
                      type="text"
                      placeholder="كود مدير المصنع (2222)"
                      value={newFactory.managerCode}
                      onChange={(e) => setNewFactory({ ...newFactory, managerCode: e.target.value })}
                      className="bg-white border border-slate-300 rounded-xl p-2.5 text-xs text-slate-900 font-mono"
                    />
                  </div>
                  <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2.5 rounded-xl text-xs">
                    + حفظ وتفعيل كود المصنع
                  </button>
                </form>

                <div className="space-y-2 max-h-56 overflow-y-auto">
                  {factoriesList.map((f) => (
                    <div
                      key={f.code}
                      className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex flex-wrap justify-between items-center gap-2 text-xs"
                    >
                      <div>
                        <span className="font-black text-slate-900">{f.name}</span>
                        <p className="text-blue-700 font-mono font-bold mt-0.5">
                          الكود: {f.code} | فني: {f.techCode} | مدير: {f.managerCode}
                        </p>
                      </div>
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => {
                            setActiveFactory(f);
                            setShowCreatorModal(false);
                            setAppMode('factory_inside');
                          }}
                          className="bg-blue-600 text-white px-3 py-1.5 rounded-lg font-bold"
                        >
                          دخول
                        </button>
                        <button
                          onClick={() => toggleFactoryStatus(f.code)}
                          className="bg-slate-200 hover:bg-slate-300 text-slate-800 px-3 py-1.5 rounded-lg font-bold"
                        >
                          {f.status === 'active' ? 'إيقاف' : 'تفعيل'}
                        </button>
                      </div>
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
