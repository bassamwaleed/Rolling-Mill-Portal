import React, { useState, useEffect } from 'react';
import { Calculator, Building2, Zap, Key, X, PlusCircle, Lock, CheckCircle2, Ban } from 'lucide-react';
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
   2. الموزع الرئيسي ونظام عزل المصانع بالكود (Multi-Tenant Gateway)
   ====================================================== */
export default function App() {
  const [appMode, setAppMode] = useState('select'); // 'select' | 'public' | 'factory_gate' | 'factory_inside'
  const [userAuth, setUserAuth] = useState(null);

  // سجل المصانع السحابي (محفوظ على Firebase ليعمل على كل الأجهزة)
  const [factoriesList, setFactoriesList] = useState(DEFAULT_FACTORIES);
  const [activeFactory, setActiveFactory] = useState(null);

  // شاشة إدخال كود المصنع للعملاء
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

  // الاتصال السحابي وجلب قائمة المصانع المسجلة
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

  // إنشاء مصنع جديد بقاعدة بيانات معزولة تماماً وكود دخول خاص
  const handleAddFactory = async (e) => {
    e.preventDefault();
    if (!newFactory.name.trim() || !newFactory.code.trim()) return;
    const cleanCode = newFactory.code.trim().toUpperCase();
    if (factoriesList.some((f) => f.code.toUpperCase() === cleanCode)) {
      alert('هذا الكود مستخدم لمصنع آخر بالفعل!');
      return;
    }
    // توليد معرف قاعدة بيانات منفصل وفريد لهذا المصنع
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

  // التحقق من كود المصنع قبل فتح قاعدة بياناته الخاصة
  const handleVerifyFactoryCode = (e) => {
    e.preventDefault();
    const entered = factoryCodeInput.trim().toUpperCase();
    const found = factoriesList.find((f) => f.code.toUpperCase() === entered);
    if (!found) {
      setGateError('كود المصنع غير صحيح! تأكد من الكود الخاص بشركتك.');
      return;
    }
    if (found.status !== 'active') {
      setGateError('عفواً، اشتراك هذا المصنع موقوف مؤقتاً. تواصل مع إدارة المنصة.');
      return;
    }
    setActiveFactory(found);
    setFactoryCodeInput('');
    setGateError('');
    setAppMode('factory_inside');
  };

  // 1. البوابة العامة للمهندسين
  if (appMode === 'public') {
    return <PublicPortal onBack={() => setAppMode('select')} />;
  }

  // 2. داخل المصنع بعد التحقق من كود المصنع المعزول
  if (appMode === 'factory_inside' && activeFactory) {
    return (
      <FactoryPortal
        onBack={() => {
          setActiveFactory(null);
          setAppMode('select');
        }}
        factoryConfig={activeFactory}
        factoriesList={[]} // نمرر مصفوفة فارغة حتى لا يرى أي مصنع أسماء المصانع الأخرى
      />
    );
  }

  // 3. بوابة إدخال كود المصنع السري (Multi-Tenant Isolation Gate)
  if (appMode === 'factory_gate') {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4" dir="rtl">
        <div className="bg-slate-900 border-2 border-slate-800 rounded-3xl p-6 sm:p-8 max-w-md w-full text-center shadow-2xl space-y-5">
          <div className="w-16 h-16 bg-emerald-500/15 border border-emerald-500/30 rounded-2xl flex items-center justify-center mx-auto">
            <Lock className="w-8 h-8 text-emerald-400" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-white">بوابة دخول المصانع المشتركة</h2>
            <p className="text-xs text-slate-400 font-bold mt-1">
              أدخل الكود التعريفي الخاص بمصنعك لفتح قاعدة البيانات المستقلة الخاصة بكم
            </p>
          </div>

          <form onSubmit={handleVerifyFactoryCode} className="space-y-4">
            <input
              type="text"
              autoFocus
              value={factoryCodeInput}
              onChange={(e) => {
                setFactoryCodeInput(e.target.value);
                setGateError('');
              }}
              placeholder="أدخل كود المصنع (مثلاً: GIOSHY-2026)"
              className="w-full bg-slate-950 border border-slate-700 focus:border-emerald-500 rounded-2xl p-3.5 text-center font-mono text-lg text-white uppercase tracking-wider outline-none"
            />
            {gateError && (
              <p className="text-xs font-bold text-red-400 bg-red-950/50 border border-red-800/80 p-2.5 rounded-xl">
                {gateError}
              </p>
            )}
            <button
              type="submit"
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-black py-3.5 rounded-2xl shadow-lg shadow-emerald-900/30 transition-all"
            >
              الاتصال بقاعدة بيانات المصنع
            </button>
          </form>

          <button
            onClick={() => {
              setGateError('');
              setFactoryCodeInput('');
              setAppMode('select');
            }}
            className="text-xs font-bold text-slate-400 hover:text-white pt-2 block mx-auto"
          >
            الرجوع للصفحة الرئيسية
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden" dir="rtl">
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-blue-600/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-emerald-600/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-4xl w-full z-10">
        <div className="text-center mb-10">
          <div
            onClick={handleTitleClick}
            title="اضغط 5 مرات لفتح لوحة تحكم م. بسام السرية"
            className="inline-flex items-center gap-3 cursor-pointer select-none mb-3 group"
          >
            <div className="bg-blue-600 p-2.5 sm:p-3 rounded-2xl shadow-lg shadow-blue-600/30 group-active:scale-95 transition-transform">
              <Zap className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
            </div>
            <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
              Steel<span className="text-blue-500">Portal</span> Gateway
            </h1>
          </div>
          <p className="text-slate-400 font-bold text-xs sm:text-base">
            المنصة الرقمية الشاملة لمهندسي الدرفلة وإدارة مصانع الحديد والصلب
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 sm:gap-8">
          <div
            onClick={() => setAppMode('public')}
            className="group bg-slate-900 border-2 border-slate-800 hover:border-blue-500 p-7 sm:p-10 rounded-[2rem] text-center flex flex-col items-center cursor-pointer transition-all hover:shadow-[0_0_40px_rgba(59,130,246,0.15)] hover:-translate-y-1.5"
          >
            <div className="w-20 h-20 bg-gradient-to-br from-blue-900/40 to-blue-600/20 rounded-3xl flex items-center justify-center mb-5 border border-blue-500/20 group-hover:scale-110 transition-transform duration-300">
              <Calculator className="w-10 h-10 text-blue-400" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white mb-3">بوابة المهندسين والحسابات</h2>
            <p className="text-xs sm:text-sm text-slate-400 mb-6 leading-relaxed font-bold">
              حاسبات الدرفلة والكهرباء واختيار الكابلات، تصميم الممرات، قطعيات المقص الطائر، ومجتمع النقاشات.
            </p>
            <div className="mt-auto w-full bg-blue-600 group-hover:bg-blue-500 text-white font-black py-3.5 rounded-2xl transition-colors shadow-lg shadow-blue-900/20 text-sm">
              دخول مجاني (Public Portal)
            </div>
          </div>

          <div
            onClick={() => setAppMode('factory_gate')}
            className="group bg-slate-900 border-2 border-slate-800 hover:border-emerald-500 p-7 sm:p-10 rounded-[2rem] text-center flex flex-col items-center cursor-pointer transition-all hover:shadow-[0_0_40px_rgba(16,185,129,0.15)] hover:-translate-y-1.5"
          >
            <div className="w-20 h-20 bg-gradient-to-br from-emerald-900/40 to-emerald-600/20 rounded-3xl flex items-center justify-center mb-5 border border-emerald-500/20 group-hover:scale-110 transition-transform duration-300">
              <Building2 className="w-10 h-10 text-emerald-400" />
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white mb-3">نظام المصانع SaaS</h2>
            <p className="text-xs sm:text-sm text-slate-400 mb-6 leading-relaxed font-bold">
              قاعدة بيانات سحابية معزولة لكل مصنع بكود خاص لإدارة أعمار الدرافيل والممرات، توقفات الورديات، والمواتير.
            </p>
            <div className="mt-auto w-full bg-emerald-600 group-hover:bg-emerald-500 text-white font-black py-3.5 rounded-2xl transition-colors shadow-lg shadow-emerald-900/20 text-sm">
              دخول بكود المصنع (Enterprise)
            </div>
          </div>
        </div>

        <div className="mt-10 text-center text-slate-500 text-xs font-bold">
          تم تصميم وتطوير النظام بواسطة <span className="text-blue-400">م. بسام وليد (Controlexa)</span> © 2026
        </div>
      </div>

      {/* لوحة تحكم م. بسام السرية لإدارة المصانع وأكوادها المعزولة */}
      {showCreatorModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border-2 border-amber-500/40 rounded-3xl max-w-xl w-full p-6 space-y-4 text-white shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center border-b border-slate-800 pb-3">
              <h3 className="font-black text-base sm:text-lg text-amber-400 flex items-center gap-2">
                <Key size={20} /> لوحة م. بسام السرية - إدارة قواعد بيانات المصانع
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
                  onClick={() =>
                    creatorPin === '2026' || creatorPin === 'beso' ? setCreatorUnlocked(true) : alert('كود غير صحيح')
                  }
                  className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-black py-3 rounded-xl"
                >
                  فتح لوحة الـ SaaS السحابية
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <form onSubmit={handleAddFactory} className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
                  <h4 className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                    <PlusCircle size={15} /> إنشاء مصنع جديد بقاعدة بيانات منفصلة
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <input
                      type="text"
                      placeholder="اسم المصنع (مثلاً: حديد العبور)"
                      value={newFactory.name}
                      onChange={(e) => setNewFactory({ ...newFactory, name: e.target.value })}
                      className="bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-white"
                    />
                    <input
                      type="text"
                      placeholder="كود دخول المصنع (مثلاً: OBOUR-2026)"
                      value={newFactory.code}
                      onChange={(e) => setNewFactory({ ...newFactory, code: e.target.value })}
                      className="bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-white font-mono uppercase"
                    />
                    <input
                      type="text"
                      placeholder="كود فني الإنتاج الافتراضي (1111)"
                      value={newFactory.techCode}
                      onChange={(e) => setNewFactory({ ...newFactory, techCode: e.target.value })}
                      className="bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-white font-mono"
                    />
                    <input
                      type="text"
                      placeholder="كود مدير المصنع الافتراضي (2222)"
                      value={newFactory.managerCode}
                      onChange={(e) => setNewFactory({ ...newFactory, managerCode: e.target.value })}
                      className="bg-slate-900 border border-slate-700 rounded-xl p-2.5 text-xs text-white font-mono"
                    />
                  </div>
                  <button type="submit" className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-black py-2.5 rounded-xl text-xs">
                    + إنشاء قاعدة بيانات منفصلة وتفعيل الكود
                  </button>
                </form>

                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  <p className="text-xs font-bold text-slate-400">المصانع المسجلة سحابياً ({factoriesList.length}):</p>
                  {factoriesList.map((f) => (
                    <div
                      key={f.code}
                      className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex flex-wrap justify-between items-center gap-2 text-xs"
                    >
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-white">{f.name}</span>
                          <span
                            className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                              f.status === 'active'
                                ? 'bg-emerald-500/20 text-emerald-400'
                                : 'bg-red-500/20 text-red-400'
                            }`}
                          >
                            {f.status === 'active' ? 'نشط' : 'موقوف'}
                          </span>
                        </div>
                        <p className="text-amber-400 font-mono mt-0.5">
                          كود المصنع: <strong>{f.code}</strong> | فني: {f.techCode} | مدير: {f.managerCode}
                        </p>
                        <p className="text-[10px] text-slate-500 font-mono">DB Path: factory/{f.id}</p>
                      </div>
                      <div className="flex gap-1.5">
                        <button
                          onClick={() => {
                            setActiveFactory(f);
                            setShowCreatorModal(false);
                            setAppMode('factory_inside');
                          }}
                          className="bg-blue-600/20 text-blue-400 border border-blue-500/30 px-2.5 py-1.5 rounded-lg font-bold"
                        >
                          دخول مباشر
                        </button>
                        <button
                          onClick={() => toggleFactoryStatus(f.code)}
                          className="bg-slate-800 hover:bg-slate-700 text-slate-300 px-2.5 py-1.5 rounded-lg font-bold"
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