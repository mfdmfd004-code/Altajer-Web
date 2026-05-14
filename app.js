// التاجر برو المحاسبي - المحرك الرئيسي (تطوير تراكمي)
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getFirestore, collection, doc, setDoc } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";

// إعدادات الربط بـ Firebase (تأكد أن إعداداتك هنا)
const firebaseConfig = {
    // ضع بيانات مشروعك هنا إذا لم تكن موجودة سابقاً
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

window.App = {
    // وظيفة حفظ الأصناف المتتابعة (بديل الإكسل)
    saveAllProducts: async function() {
        const rows = document.querySelectorAll('#product-list tr');
        let productsData = [];

        rows.forEach(row => {
            const id = row.id.replace('row-', '');
            const name = document.getElementById(`p-name-${id}`).value;
            if (name && name.trim() !== "") {
                productsData.push({
                    code: id,
                    name: name,
                    unit: document.getElementById(`p-unit-${id}`).value,
                    size: document.getElementById(`p-size-${id}`).value,
                    price: parseFloat(document.getElementById(`p-price-${id}`).value),
                    quantity: parseFloat(document.getElementById(`p-qty-${id}`).value),
                    total: parseFloat(document.getElementById(`p-total-${id}`).value),
                    notes: document.getElementById(`p-notes-${id}`).value,
                    timestamp: new Date()
                });
            }
        });

        if (productsData.length === 0) return alert("الرجاء إدخال بيانات الأصناف أولاً.");

        try {
            for (const product of productsData) {
                await setDoc(doc(db, "products", product.code), product);
            }
            alert("تم حفظ كافة البنود في التاجر برو بنجاح.");
        } catch (e) {
            alert("خطأ في الاتصال: " + e.message);
        }
    },

    // وظيفة تصدير البيانات لإكسل
    exportToExcel: function(tableId) {
        const table = document.getElementById(tableId);
        let html = table.outerHTML;
        let url = 'data:application/vnd.ms-excel,' + escape(html);
        let link = document.createElement("a");
        link.download = "مخزون_التاجر.xls";
        link.href = url;
        link.click();
    }
};

// وظائف الحساب التلقائي داخل الصفحة
window.calculateTotal = function(code) {
    const price = document.getElementById(`p-price-${code}`).value || 0;
    const qty = document.getElementById(`p-qty-${code}`).value || 0;
    document.getElementById(`p-total-${code}`).value = (price * qty).toFixed(2);
};
