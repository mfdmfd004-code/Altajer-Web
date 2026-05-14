/* 
   مشروع: تاجر برو المحاسبي
   المطور: فايز
   التحديث: نظام جداول البيانات الذكي (بديل الإكسل)
*/
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, query, orderBy, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-firestore.js";

// إعدادات مشروعك في Firebase (نفس التي استخدمناها سابقاً)
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
    // وظيفة حفظ تفاصيل الصنف في "جدول البيانات"
    saveProduct: async function() {
        const name = document.getElementById('p-name').value;
        const price = parseFloat(document.getElementById('p-price').value);
        const stock = parseInt(document.getElementById('p-stock').value);

        if (!name || isNaN(price) || isNaN(stock)) {
            alert("يرجى إكمال جميع تفاصيل الصنف");
            return;
        }

        try {
            // حفظ البيانات مع طابع زمني (Timestamp) لترتيب الجداول
            await addDoc(collection(db, "products"), {
                name: name,
                price: price,
                stock: stock,
                addedBy: "فايز", // توثيق عملية الإدخال
                createdAt: serverTimestamp()
            });
            alert("تم حفظ الصنف وتحديث جدول البيانات ✅");
            this.loadProducts(); // تحديث الجدول تلقائياً
        } catch (e) {
            console.error("خطأ في الحفظ: ", e);
        }
    },

    // وظيفة عرض البيانات في جدول (يشبه الإكسل)
    loadProducts: async function() {
        const list = document.getElementById('product-list');
        if (!list) return;

        const q = query(collection(db, "products"), orderBy("createdAt", "desc"));
        const snapshot = await getDocs(q);
        
        list.innerHTML = "";
        snapshot.forEach(doc => {
            const p = doc.data();
            const date = p.createdAt ? p.createdAt.toDate().toLocaleString('ar-SA') : 'قيد المعالجة';
            
            list.innerHTML += `
                <tr>
                    <td>${p.name}</td>
                    <td>${p.price.toFixed(2)} ر.س</td>
                    <td>${p.stock}</td>
                    <td>${date}</td>
                </tr>`;
        });
    }
};

// تفعيل الوظائف عند تحميل الصفحة
window.onload = () => {
    if (document.getElementById('product-list')) App.loadProducts();
};
window.App = App;
