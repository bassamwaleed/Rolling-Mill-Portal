import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyB5TIvcOxd7_2EVuKauuA3lGJ4Sj9W0fXQ",
  authDomain: "rolling-mill-portal.firebaseapp.com",
  projectId: "rolling-mill-portal",
  storageBucket: "rolling-mill-portal.firebasestorage.app",
  messagingSenderId: "81722940977",
  appId: "1:81722940977:web:a94769c8d4e4ca34bf7f10",
  measurementId: "G-NHP82KMVC9"
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
