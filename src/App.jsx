import React, { useState, useEffect } from 'react';
import {
  Calculator, Building2, Zap, Key, X, PlusCircle,
  Lock, ArrowLeft, Sparkles
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
    createdAt: '14/11/2026'
  }
];

/* ======================================================
   2. البوابة الرئيسية والموزع الذكي بالروابط (App Router)
   ====================================================== */
export default function App() {
  const getInitialRoute = () => {
    const params = new URLSearchParams(window.location.search);
    const modeParam = params.get('mode');
    const fParam = params.get('f');
    if (fParam) return 'factory_inside';
    if (modeParam === 'public') return 'public';
    if (modeParam === 'factory_gate') return 'factory_gate';
    return 'select';
  };

  const [appMode, setAppModeState] = useState(getInitialRoute);
  const [userAuth, setUserAuth] = useState(null);

  const [factoriesList, setFactoriesList] = useState(DEFAULT_FACTORIES);
  const [activeFactory, setActiveFactory] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    const fParam = params.get('f');
    if (fParam) {
      return DEFAULT_FACTORIES.find((x) => x.id === fParam || x.code === fParam) || DEFAULT_FACTORIES[0];
    }
    return null;
  });

  const [factoryCodeInput, setFactoryCodeInput] = useState('');
  const [gateError, setGateError] = useState('');

  // لوحة تحكم المصمم السرية (5 ضغطات على اللوجو)
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

  const navigateToMode = (nextMode, factoryObj = null) => {
    setAppModeState(nextMode);
    if (factoryObj) {
      setActiveFactory(factoryObj);
    } else if (nextMode === 'select' || nextMode === 'public' || nextMode === 'factory_gate') {
      setActiveFactory(null);
    }

    const params = new URLSearchParams();
    if (nextMode === 'public') {
      params.set('mode', 'public');
      params.set('tab', 'calculators');
    } else if (nextMode === 'factory_gate') {
      params.set('mode', 'factory_gate');
    } else if (nextMode === 'factory_inside' && (factoryObj || activeFactory)) {
      const targetF = factoryObj || activeFactory;
      params.set('mode', 'factory');
      params.set('f', targetF.id);
      params.set('tab', 'dashboard');
    }

    const queryStr = params.toString();
    const newUrl = queryStr ? `?${queryStr}` : window.location.pathname;
    window.history.pushState({ mode: nextMode, factoryId: factoryObj?.id || null }, '', newUrl);
  };

  useEffect(() => {
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      const modeParam = params.get('mode');
      const fParam = params.get('f');

      if ((modeParam === 'factory' || fParam) && fParam) {
        const found = factoriesList.find((x) => x.id === fParam || x.code === fParam);
        if (found && found.status === 'active') {
          setActiveFactory(found);
          setAppModeState('factory_inside');
          return;
        }
      }
      if (modeParam === 'public') {
        setAppModeState('public');
        return;
      }
      if (modeParam === 'factory_gate') {
        setAppModeState('factory_gate');
        return;
      }
      setActiveFactory(null);
      setAppModeState('select');
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [factoriesList]);

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

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const directFactoryId = params.get('f');
    if (directFactoryId && factoriesList.length > 0) {
      const found = factoriesList.find((x) => x.id === directFactoryId || x.code === directFactoryId);
      if (found && found.status === 'active') {
        setActiveFactory(found);
        setAppModeState('factory_inside');
      }
    }
  }, [factoriesList]);

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
    setFactoryCodeInput('');
    setGateError('');
    navigateToMode('factory_inside', found);
  };

  if (appMode === 'public') {
    return <PublicPortal onBack={() => navigateToMode('select')} />;
  }

  if (appMode === 'factory_inside' && activeFactory) {
    return (
      <FactoryPortal
        onBack={() => navigateToMode('select')}
        factoryConfig={activeFactory}
        factoriesList={[]}
      />
    );
  }

  /* ---------- شاشة إدخال كود تفعيل المصنع (مضبوطة للموبايل واللابتوب) ---------- */
  if (appMode === 'factory_gate') {
    return (
      <div className="min-h-dvh bg-slate-50 flex flex-col items-center justify-center p-3.5 sm:p-6 font-sans text-slate-900" dir="rtl">
        <div className="bg-white border border-slate-200 rounded-2xl sm:rounded-3xl p-5 sm:p-8 max-w-sm sm:max-w-md w-full text-center shadow-lg space-y-4 sm:space-y-5">
          <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-2xl flex items-center justify-center mx-auto shadow-md shadow-emerald-500/20">
            <Lock className="w-6 h-6 sm:w-8 sm:h-8 text-white" />
          </div>
          <div>
            <h2 className="text-lg sm:text-2xl font-black text-slate-900">بوابة دخول المصانع</h2>
            <p className="text-[11px] sm:text-xs text-slate-500 font-bold mt-1 leading-relaxed">
              أدخل كود المصنع الخاص بكم لفتح قاعدة البيانات السحابية المستقلة
            </p>
          </div>

          <form onSubmit={handleVerifyFactoryCode} className="space-y-3">
            <input
              type="text"
              autoFocus
              value={factoryCodeInput}
              onChange={(e) => {
                setFactoryCodeInput(e.target.value);
                setGateError('');
              }}
              placeholder="مثال: GIOSHY-2026"
              className="w-full bg-slate-50 border-2 border-slate-300 focus:border-emerald-600 focus:bg-white rounded-xl sm:rounded-2xl p-3 sm:p-3.5 text-center font-mono text-sm sm:text-lg font-black text-slate-900 uppercase tracking-wider outline-none transition-all"
            />
            {gateError && (
              <p className="text-[11px] sm:text-xs font-bold text-red-600 bg-red-50 border border-red-200 p-2 rounded-xl">
                {gateError}
              </p>
            )}
            <button
              type="submit"
              className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-3 sm:py-3.5 rounded-xl sm:rounded-2xl shadow-md transition-all text-xs sm:text-sm"
            >
              فتح نظام المصنع
            </button>
          </form>

          <button
            onClick={() => {
              setGateError('');
              setFactoryCodeInput('');
              navigateToMode('select');
            }}
            className="text-xs font-bold text-slate-500 hover:text-slate-900 pt-1 flex items-center justify-center gap-1 mx-auto"
          >
            <ArrowLeft size={14} className="rotate-180" /> الرجوع للصفحة الرئيسية
          </button>
        </div>
      </div>
    );
  }

  /* ---------- الشاشة الرئيسية (مضبوطة للموبايل لتظهر بالكامل بدون زحام، وبحجم كامل على اللابتوب) ---------- */
  return (
    <div className="min-h-dvh bg-slate-50 text-slate-900 flex flex-col justify-between px-3.5 py-3 sm:p-6 font-sans" dir="rtl">
      {/* الهيدر العلوي المدمج للموبايل */}
      <header className="max-w-4xl w-full mx-auto pt-1 sm:pt-4 flex items-center justify-between">
        <div
          onClick={handleTitleClick}
          title="اضغط 5 مرات لفتح لوحة المصمم"
          className="flex items-center gap-2 sm:gap-2.5 cursor-pointer select-none group"
        >
          <div className="bg-gradient-to-br from-blue-600 to-indigo-600 p-2 sm:p-2.5 rounded-xl sm:rounded-2xl shadow-md shadow-blue-600/25 group-active:scale-95 transition-transform">
            <Zap className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
          </div>
          <div>
            <h1 className="text-base sm:text-2xl font-black text-slate-900 tracking-tight leading-none">
              Steel<span className="text-blue-600">Portal</span>
            </h1>
            <span className="text-[9px] sm:text-xs font-bold text-slate-500 block mt-0.5">
              منصة هندسة الدرفلة وإدارة المصانع
            </span>
          </div>
        </div>

        <span className="bg-white text-blue-700 border border-blue-200 shadow-sm text-[10px] sm:text-[11px] font-black px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full flex items-center gap-1">
          <Sparkles className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-500" /> إصدار 2026
        </span>
      </header>

      {/* منطقة المنتصف */}
      <main className="max-w-4xl w-full mx-auto my-auto py-3 sm:py-6 space-y-3.5 sm:space-y-6">
        <div className="text-center space-y-1 px-1">
          <h2 className="text-lg sm:text-4xl font-black text-slate-900 tracking-tight">
            بوابة صناعة الحديد والدرفلة الذكية
          </h2>
          <p className="text-[11px] sm:text-sm text-slate-500 font-bold max-w-xl mx-auto leading-relaxed">
            أدوات هندسية وحاسبات باس ديزاين ومعمل جودة مجانية، أو نظام سحابي لإدارة تشغيل المصانع
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-6">
          {/* البطاقة الأولى: بوابة المهندسين والفنيين */}
          <div
            onClick={() => navigateToMode('public')}
            className="group bg-white border-2 border-slate-200/90 hover:border-blue-600 rounded-2xl sm:rounded-3xl p-4 sm:p-7 cursor-pointer transition-all shadow-sm hover:shadow-xl sm:hover:-translate-y-1 flex flex-col justify-between gap-3.5 sm:gap-5"
          >
            <div className="space-y-2.5 sm:space-y-4">
              {/* على الموبايل الأيقونة والعنوان والشارة في صف متناسق مدمج، وعلى اللابتوب بالحجم الكبير */}
              <div className="flex items-center sm:items-start justify-between gap-3">
                <div className="flex items-center gap-3 sm:block">
                  <div className="w-11 h-11 sm:w-14 sm:h-14 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl sm:rounded-2xl flex items-center justify-center text-white shadow-md shadow-blue-600/20 shrink-0 group-hover:scale-105 transition-transform">
                    <Calculator className="w-5 h-5 sm:w-7 sm:h-7" strokeWidth={2.2} />
                  </div>
                  <div className="sm:hidden">
                    <span className="text-[9px] font-black bg-blue-50 text-blue-700 border border-blue-200 px-2 py-0.5 rounded-full inline-block mb-0.5">
                      مفتوح مجاناً للجميع
                    </span>
                    <h3 className="text-base font-black text-slate-900 leading-snug">
                      بوابة المهندسين والحسابات
                    </h3>
                  </div>
                </div>
                <span className="hidden sm:inline-block text-[11px] font-black bg-blue-50 text-blue-700 border border-blue-200 px-3 py-1 rounded-full">
                  مفتوح مجاناً للجميع
                </span>
              </div>

              <div className="space-y-1">
                <h3 className="hidden sm:block text-2xl font-black text-slate-900">
                  بوابة المهندسين والحسابات
                </h3>
                <p className="text-[11px] sm:text-sm text-slate-600 leading-relaxed font-bold">
                  تصميم الممرات (بيضاوي ← مبروم)، حاسبة المقص الطائر وأسياخ العميل، معمل الجودة والشد، حسابات الكابلات والكهرباء، والشات الفني السحابي.
                </p>
              </div>
            </div>

            <div className="w-full bg-blue-600 group-hover:bg-blue-700 text-white font-black py-2.5 sm:py-3.5 px-4 rounded-xl sm:rounded-2xl text-xs sm:text-sm flex items-center justify-between shadow-sm transition-colors">
              <span>فتح الحاسبات والمجتمع الفني</span>
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            </div>
          </div>

          {/* البطاقة الثانية: نظام إدارة المصانع SaaS */}
          <div
            onClick={() => navigateToMode('factory_gate')}
            className="group bg-white border-2 border-slate-200/90 hover:border-emerald-600 rounded-2xl sm:rounded-3xl p-4 sm:p-7 cursor-pointer transition-all shadow-sm hover:shadow-xl sm:hover:-translate-y-1 flex flex-col justify-between gap-3.5 sm:gap-5"
          >
            <div className="space-y-2.5 sm:space-y-4">
              <div className="flex items-center sm:items-start justify-between gap-3">
                <div className="flex items-center gap-3 sm:block">
                  <div className="w-11 h-11 sm:w-14 sm:h-14 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl sm:rounded-2xl flex items-center justify-center text-white shadow-md shadow-emerald-600/20 shrink-0 group-hover:scale-105 transition-transform">
                    <Building2 className="w-5 h-5 sm:w-7 sm:h-7" strokeWidth={2.2} />
                  </div>
                  <div className="sm:hidden">
                    <span className="text-[9px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full inline-block mb-0.5">
                      نظام المصانع (SaaS)
                    </span>
                    <h3 className="text-base font-black text-slate-900 leading-snug">
                      منظومة تشغيل وإدارة المصانع
                    </h3>
                  </div>
                </div>
                <span className="hidden sm:inline-block text-[11px] font-black bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1 rounded-full">
                  نظام المصانع (SaaS)
                </span>
              </div>

              <div className="space-y-1">
                <h3 className="hidden sm:block text-2xl font-black text-slate-900">
                  منظومة تشغيل وإدارة المصانع
                </h3>
                <p className="text-[11px] sm:text-sm text-slate-600 leading-relaxed font-bold">
                  قاعدة بيانات سحابية معزولة لكل مصنع لمتابعة أعمار الممرات والدرافيل، حرارة وصيانة المواتير، أعطال الورديات، واستخراج تقارير Excel و PDF.
                </p>
              </div>
            </div>

            <div className="w-full bg-slate-900 group-hover:bg-emerald-600 text-white font-black py-2.5 sm:py-3.5 px-4 rounded-xl sm:rounded-2xl text-xs sm:text-sm flex items-center justify-between shadow-sm transition-colors">
              <span>الدخول بكود المصنع</span>
              <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
            </div>
          </div>
        </div>
      </main>

      {/* الفوتر */}
      <footer className="max-w-4xl w-full mx-auto text-center py-2 sm:py-3 border-t border-slate-200/80 text-[10px] sm:text-[11px] text-slate-500 font-bold">
        تصميم وتطوير <span className="text-blue-600 font-black">م. بسام وليد (Controlexa)</span> © 2026
      </footer>

      {/* نافذة المصمم السرية لإدارة المصانع */}
      {showCreatorModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-3 sm:p-4">
          <div className="bg-white border border-slate-200 rounded-2xl sm:rounded-3xl max-w-xl w-full p-4 sm:p-6 space-y-4 text-slate-900 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-200 pb-2.5">
              <h3 className="font-black text-sm sm:text-base text-slate-900 flex items-center gap-2">
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
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-center font-mono text-base outline-none focus:border-blue-600"
                />
                <button
                  onClick={() =>
                    creatorPin === '2026' || creatorPin === 'beso' ? setCreatorUnlocked(true) : alert('كود غير صحيح')
                  }
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-2.5 rounded-xl text-xs sm:text-sm"
                >
                  فتح لوحة التحكم
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <form onSubmit={handleAddFactory} className="bg-slate-50 p-3.5 rounded-2xl border border-slate-200 space-y-2.5">
                  <h4 className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                    <PlusCircle size={15} className="text-blue-600" /> إنشاء مصنع جديد بقاعدة بيانات منفصلة
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="اسم المصنع (مثلاً: حديد العبور)"
                      value={newFactory.name}
                      onChange={(e) => setNewFactory({ ...newFactory, name: e.target.value })}
                      className="bg-white border border-slate-300 rounded-xl p-2 text-xs text-slate-900 font-bold"
                    />
                    <input
                      type="text"
                      placeholder="كود دخول المصنع (مثلاً: OBOUR-2026)"
                      value={newFactory.code}
                      onChange={(e) => setNewFactory({ ...newFactory, code: e.target.value })}
                      className="bg-white border border-slate-300 rounded-xl p-2 text-xs text-slate-900 font-mono font-bold uppercase"
                    />
                    <input
                      type="text"
                      placeholder="كود فني الإنتاج (1111)"
                      value={newFactory.techCode}
                      onChange={(e) => setNewFactory({ ...newFactory, techCode: e.target.value })}
                      className="bg-white border border-slate-300 rounded-xl p-2 text-xs text-slate-900 font-mono"
                    />
                    <input
                      type="text"
                      placeholder="كود مدير المصنع (2222)"
                      value={newFactory.managerCode}
                      onChange={(e) => setNewFactory({ ...newFactory, managerCode: e.target.value })}
                      className="bg-white border border-slate-300 rounded-xl p-2 text-xs text-slate-900 font-mono"
                    />
                  </div>
                  <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 rounded-xl text-xs">
                    + حفظ وتفعيل كود المصنع
                  </button>
                </form>

                <div className="space-y-2 max-h-56 overflow-y-auto">
                  {factoriesList.map((f) => (
                    <div
                      key={f.code}
                      className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 flex flex-wrap justify-between items-center gap-2 text-xs"
                    >
                      <div>
                        <span className="font-black text-slate-900">{f.name}</span>
                        <p className="text-blue-700 font-mono font-bold mt-0.5 text-[11px]">
                          الكود: {f.code} | فني: {f.techCode} | مدير: {f.managerCode}
                        </p>
                      </div>
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => {
                            setShowCreatorModal(false);
                            navigateToMode('factory_inside', f);
                          }}
                          className="bg-blue-600 text-white px-2.5 py-1 rounded-lg font-bold text-[11px]"
                        >
                          دخول مباشر
                        </button>
                        <button
                          onClick={() => toggleFactoryStatus(f.code)}
                          className="bg-slate-200 hover:bg-slate-300 text-slate-800 px-2.5 py-1 rounded-lg font-bold text-[11px]"
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