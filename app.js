/**
 * Altajer Pro - المحرك المركزي الشامل
 * إدارة: فايز (Operations Manager)
 */
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, query, orderBy, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-firestore.js";

// إعدادات Firebase الثابتة لمشروعك
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
    // 1. وظيفة حفظ منتج جديد (المستودع)
    saveProduct: async function() {
        const name = document.getElementById('p-name').value;
        const price = parseFloat(document.getElementById('p-price').value);
        const stock = parseInt(document.getElementById('p-stock').value);

        if (!name || isNaN(price)) return alert("يرجى إكمال البيانات");

        try {
            await addDoc(collection(db, "products"), {
                name, price, stock, createdAt: serverTimestamp()
            });
            alert("تمت إضافة الصنف للمخزن بنجاح ✅");
            this.loadProducts(); // تحديث الجدول فوراً
        } catch (e) { console.error(e); }
    },

    // 2. وظيفة عرض المنتجات (جدول الإكسل البرمجي)
    loadProducts: async function() {
        const list = document.getElementById('product-list');
        if (!list) return;
        list.innerHTML = "جاري التحميل...";
        
        const q = query(collection(db, "products"), orderBy("createdAt", "desc"));
        const snapshot = await getDocs(q);
        list.innerHTML = "";
        
        snapshot.forEach(doc => {
            const p = doc.data();
            list.innerHTML += `
                <tr>
                    <td>${p.name}</td>
                    <td>${p.price.toFixed(2)}</td>
                    <td>${p.stock}</td>
                    <td><button onclick="App.deleteDoc('products', '${doc.id}')">حذف</button></td>
                </tr>`;
        });
    },

    // 3. وظيفة تصدير البيانات لإكسل حقيقي (عند الحاجة)
    exportToExcel: function(tableId) {
        let table = document.getElementById(tableId);
        let html = table.outerHTML;
        window.open('data:application/vnd.ms-excel,' + encodeURIComponent(html));
    }
};

// تشغيل الوظائف بناءً على الصفحة
window.onload = () => {
    if (document.getElementById('product-list')) App.loadProducts();
};
window.App = App;
