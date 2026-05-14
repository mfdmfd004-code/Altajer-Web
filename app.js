/**
 * Altajer Pro - المطور والكامل
 * نظام متكامل للمحاسبة، المخزون، والربط الضريبي
 * إعداد: فايز (Operations Manager)
 */

// 1. استيراد مكتبات Firebase (النسخة الحديثة)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, query, orderBy, limit, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-firestore.js";

// 2. إعدادات الربط (Firebase Config) - كما في ملفك الأصلي
const firebaseConfig = {
    apiKey: "AIzaSyADh8KorayFEiM1JIETYr8LDubkJpja_yU",
    authDomain: "altajer-pro-accountant.firebaseapp.com",
    projectId: "altajer-pro-accountant",
    storageBucket: "altajer-pro-accountant.firebasestorage.app",
    messagingSenderId: "982176278219",
    appId: "1:982176278219:web:5fede7cef02cce60a35d4e",
    measurementId: "G-WM6KN5NKTC"
};

// 3. كائن التطبيق الرئيسي (The Core Engine)
const App = {
    db: null,
    invoiceItems: [],
    VAT_RATE: 0.15,

    init: async function() {
        console.log("جاري تشغيل محرك التاجر برو المتكامل...");
        try {
            const firebaseApp = initializeApp(firebaseConfig);
            this.db = getFirestore(firebaseApp);
            
            this.loadDashboardData();
            this.setupListeners();
            console.log("تم الاتصال بالسحابة بنجاح ✅");
        } catch (error) {
            console.error("فشل بدء النظام:", error);
        }
    },

    // --- إدارة واجهة المبيعات والضرائب ---
    
    addItemRow: function() {
        const name = document.getElementById('item-name').value;
        const price = parseFloat(document.getElementById('item-price').value);
        const qty = parseInt(document.getElementById('item-qty').value);

        if (!name || isNaN(price) || price <= 0) {
            alert("يرجى إدخال اسم المنتج وسعره");
            return;
        }

        const total = price * qty;
        const item = { name, price, qty, total };
        
        this.invoiceItems.push(item);
        this.renderTable();
        this.calculateTotals();

        // مسح الحقول للإدخال التالي
        document.getElementById('item-name').value = '';
        document.getElementById('item-price').value = '';
        document.getElementById('item-qty').value = '1';
    },

    renderTable: function() {
        const tbody = document.querySelector('#invoice-table tbody');
        if (!tbody) return;
        tbody.innerHTML = this.invoiceItems.map((item, index) => `
            <tr>
                <td>${item.name}</td>
                <td>${item.price.toFixed(2)}</td>
                <td>${item.qty}</td>
                <td>${item.total.toFixed(2)}</td>
                <td><button onclick="App.deleteItem(${index})" style="color:red; border:none; background:none;"><i class="fas fa-trash"></i></button></td>
            </tr>
        `).join('');
    },

    deleteItem: function(index) {
        this.invoiceItems.splice(index, 1);
        this.renderTable();
        this.calculateTotals();
    },

    calculateTotals: function() {
        const subtotal = this.invoiceItems.reduce((s, i) => s + i.total, 0);
        const tax = subtotal * this.VAT_RATE;
        const grandTotal = subtotal + tax;
        
        const totalDisplay = document.getElementById('final-total');
        if (totalDisplay) totalDisplay.innerText = grandTotal.toFixed(2) + " ر.س";
        
        return { subtotal, tax, grandTotal };
    },

    // --- عمليات الحفظ السحابي (Firestore) ---

    saveInvoice: async function() {
        if (this.invoiceItems.length === 0) {
            alert("أضف أصنافاً للفاتورة أولاً");
            return;
        }

        const totals = this.calculateTotals();
        const invoiceData = {
            customer: document.getElementById('inv-customer').value,
            date: document.getElementById('inv-date').value,
            items: this.invoiceItems,
            subtotal: totals.subtotal,
            tax: totals.tax,
            total: totals.grandTotal,
            timestamp: serverTimestamp(),
            zatca_status: "READY"
        };

        try {
            const docRef = await addDoc(collection(this.db, "invoices"), invoiceData);
            alert("تم حفظ الفاتورة بنجاح! رقم المرجع: " + docRef.id);
            this.resetForm();
            this.loadDashboardData();
        } catch (e) {
            console.error("خطأ أثناء الحفظ:", e);
            alert("فشل الحفظ، تأكد من إعدادات الـ Rules في Firebase");
        }
    },

    resetForm: function() {
        this.invoiceItems = [];
        this.renderTable();
        this.calculateTotals();
        document.getElementById('inv-date').valueAsDate = new Date();
    },

    // --- إدارة البيانات (Dashboard & Contacts) ---

    loadDashboardData: async function() {
        try {
            const q = query(collection(this.db, "invoices"), orderBy("timestamp", "desc"), limit(5));
            const querySnapshot = await getDocs(q);
            
            let dailyTotal = 0;
            const recentBody = document.getElementById('recent-activity');
            if (recentBody) recentBody.innerHTML = "";

            querySnapshot.forEach((doc) => {
                const data = doc.data();
                dailyTotal += data.total;
                // تحديث واجهة النشاط الأخير (إذا كان العنصر موجوداً)
                if (recentBody) {
                    recentBody.innerHTML += `<div style="border-bottom:1px solid #eee; padding:10px;">فاتورة بمبلغ ${data.total.toFixed(2)} ر.س - ${data.customer}</div>`;
                }
            });

            const dailyDisp = document.getElementById('dash-daily');
            const countDisp = document.getElementById('dash-count');
            if (dailyDisp) dailyDisp.innerText = dailyTotal.toFixed(2) + " ر.س";
            if (countDisp) countDisp.innerText = querySnapshot.size;

        } catch (e) {
            console.log("بانتظار البيانات الأولى...");
        }
    },

    addContact: async function() {
        const name = document.getElementById('contact-name').value;
        const type = document.getElementById('contact-type').value;

        if (!name) return alert("يرجى إدخال الاسم");

        try {
            await addDoc(collection(this.db, "contacts"), { name, type, createdAt: serverTimestamp() });
            alert("تمت الإضافة بنجاح");
            document.getElementById('contact-name').value = '';
        } catch (e) {
            alert("خطأ في إضافة جهة الاتصال");
        }
    },

    setupListeners: function() {
        // ربط زر الحفظ الأساسي في واجهة المبيعات
        const saveBtn = document.querySelector('button[onclick="submitToFirebase()"]');
        if (saveBtn) {
            saveBtn.setAttribute("onclick", "App.saveInvoice()");
        }
    }
};

// إطلاق النظام وجعله متاحاً عالمياً
window.onload = () => App.init();
window.App = App;
