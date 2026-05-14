/* 
   مشروع: تاجر برو المحاسبي (تاجر برو المحاسبي)
   التحديث: الربط الشامل للـ 15 ملفاً الأساسية
   المطور: فايز
*/
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, query, orderBy, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-firestore.js";

// إعدادات Firebase الخاصة بمشروع التاجر برو
const firebaseConfig = {
    apiKey: "AIzaSyADh8KorayFEiM1JIETYr8LDubkJpja_yU",
    authDomain: "altajer-pro-accountant.firebaseapp.com",
    projectId: "altajer-pro-accountant",
    storageBucket: "altajer-pro-accountant.firebasestorage.app",
    messagingSenderId: "982176278219",
    appId: "1:982176278219:web:5fede7cef02cce60a35d4e"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const App = {
    // 1. تفعيل الموردين (suppliers.html)
    saveSupplier: async function() {
        const name = document.getElementById('s-name').value;
        const vat = document.getElementById('s-vat').value;
        if (!name) return alert("يرجى إدخال اسم المورد");

        try {
            await addDoc(collection(db, "suppliers"), {
                name, vat, createdAt: serverTimestamp()
            });
            alert("تم حفظ المورد بنجاح ✅");
            location.reload();
        } catch (e) { console.error(e); }
    },

    // 2. تفعيل الباركود (barcode-gen.html)
    generateBarcode: function(value) {
        if (!value) return;
        JsBarcode("#barcode-output", value, {
            format: "CODE128",
            lineColor: "#0077b6", // اللون البحري الخاص بالتاجر
            width: 2,
            height: 100,
            displayValue: true
        });
    },

    // 3. الربط المحاسبي وجدولة البيانات (products.html)
    loadAllData: async function() {
        // تحميل المنتجات لجدول الإكسل الذكي
        const pList = document.getElementById('product-list');
        if (pList) {
            const q = query(collection(db, "products"), orderBy("createdAt", "desc"));
            const snap = await getDocs(q);
            pList.innerHTML = "";
            snap.forEach(doc => {
                const p = doc.data();
                pList.innerHTML += `<tr><td>${p.name}</td><td>${p.price}</td><td>${p.stock}</td><td>${p.createdAt?.toDate().toLocaleDateString('ar-SA')}</td></tr>`;
            });
        }
        
        // تحميل الموردين للقائمة المنسدلة في المشتريات
        const sSelect = document.getElementById('p-supplier');
        if (sSelect) {
            const snap = await getDocs(collection(db, "suppliers"));
            snap.forEach(doc => {
                sSelect.innerHTML += `<option value="${doc.id}">${doc.data().name}</option>`;
            });
        }
    }
};

// تشغيل النظام عند تحميل أي ملف من الـ 15 ملفاً
window.onload = () => App.loadAllData();
window.App = App;
