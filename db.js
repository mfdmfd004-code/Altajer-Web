// التاجر برو المحاسبي - قاعدة البيانات المركزية
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getFirestore, collection, getDocs, doc, setDoc } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";

// إعدادات Firebase الخاصة بك
const firebaseConfig = {
    // ضع هنا إعدادات مشروعك التي حصلت عليها من Google Cloud/Firebase
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// دالة جلب كل العملاء لوضعهم في القائمة (ComboBox) في الفاتورة
export async function getAllCustomers() {
    const snap = await getDocs(collection(db, "customers"));
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

// دالة جلب كل المنتجات لوضعها في القائمة (ComboBox) في الفاتورة
export async function getAllItems() {
    const snap = await getDocs(collection(db, "items"));
    return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}

// دالة حفظ الفاتورة وتحديث المخزن (نظام تراكمي)
export async function saveInvoice(invoiceData) {
    const invoiceId = "INV-" + Date.now();
    await setDoc(doc(db, "invoices", invoiceId), invoiceData);
    console.log("تم حفظ الفاتورة بنجاح");
}
