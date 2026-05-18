// استدعاء مكتبات فايربيز الأساسية من السيرفر مباشرة (CDN)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, signInWithPopup, GoogleAuthProvider, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// إعدادات مشروعك الصافية المستخرجة من حسابك
const firebaseConfig = {
  apiKey: "AIzaSyADh8KorayFEiM1JIETYr8LDubkJpja_yU",
  authDomain: "altajer-pro-accountant.firebaseapp.com",
  projectId: "altajer-pro-accountant",
  storageBucket: "altajer-pro-accountant.firebasestorage.app",
  messagingSenderId: "982176278219",
  appId: "1:982176278219:web:f16baa6502f657fca35d4e",
  measurementId: "G-2SKNNZF03R"
};

// تشغيل الخدمات
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const provider = new GoogleAuthProvider();

// تصدير الأدوات لربطها عالمياً بالمشروع دون تكرار الكود
window.auth = auth;
window.db = db;
window.provider = provider;
window.signInWithEmailAndPassword = signInWithEmailAndPassword;
window.signInWithPopup = signInWithPopup;
window.signOut = signOut;
window.onAuthStateChanged = onAuthStateChanged;

console.log("Altajer Pro: تم تفعيل خط الاتصال بـ Firebase بنجاح والأمان مكتمل للأمام!");
