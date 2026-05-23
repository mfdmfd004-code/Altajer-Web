// التاجر برو — مصدر Firebase الموحد (النسخة المستقرة 10.8.0)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword, signInWithPopup,
         GoogleAuthProvider, signOut, onAuthStateChanged }
    from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyADh8KorayFEiM1JIETYr8LDubkJpja_yU",
  authDomain: "altajer-pro-accountant.firebaseapp.com",
  projectId: "altajer-pro-accountant",
  storageBucket: "altajer-pro-accountant.firebasestorage.app",
  messagingSenderId: "982176278219",
  appId: "1:982176278219:web:f16baa6502f657fca35d4e",
  measurementId: "G-2SKNNZF03R"
};

// تشغيل مرة واحدة فقط
let app;
try {
    app = initializeApp(firebaseConfig);
} catch(e) {
    // تجنب خطأ التهيئة المزدوجة
    const { getApp } = await import("https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js");
    app = getApp();
}

export const auth     = getAuth(app);
export const db       = getFirestore(app);
export const provider = new GoogleAuthProvider();

// إتاحة عالمية
window.__firebaseApp  = app;
window.__firebaseAuth = auth;
window.__firebaseDb   = db;
window.auth           = auth;
window.db             = db;
window.provider       = provider;
window.signInWithEmailAndPassword = signInWithEmailAndPassword;
window.signInWithPopup            = signInWithPopup;
window.signOut                    = signOut;
window.onAuthStateChanged         = onAuthStateChanged;

console.log("✅ Altajer Pro: Firebase موحد وجاهز — النسخة 10.8.0");
