import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAnalytics } from 'firebase/analytics';
import { getAuth } from 'firebase/auth';
import {
  getFirestore,
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager
} from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyB5TIvcOxd7_2EVuKauuA3lGJ4Sj9W0fXQ",
  authDomain: "rolling-mill-portal.firebaseapp.com",
  projectId: "rolling-mill-portal",
  storageBucket: "rolling-mill-portal.firebasestorage.app",
  messagingSenderId: "81722940977",
  appId: "1:81722940977:web:a94769c8d4e4ca34bf7f10",
  measurementId: "G-NHP82KMVC9"
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);
const auth = getAuth(app);

let db;
try {
  db = initializeFirestore(app, {
    localCache: persistentLocalCache({
      tabManager: persistentMultipleTabManager()
    })
  });
} catch {
  // في حالة إعادة التحميل السريع (Vite HMR) أو عدم دعم الكاش المحلي
  db = getFirestore(app);
}

let analytics = null;
try {
  if (typeof window !== 'undefined') analytics = getAnalytics(app);
} catch {
  analytics = null;
}

export { app, auth, db, analytics };