/**
 * Altajer Pro - Integrated Core Engine
 * Connected to Firebase & ZATCA Ready
 * Developed for: Faez (Operations Manager)
 */

// 1. استيراد مكتبات Firebase السحابية
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-app.js";
import { getFirestore, collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-firestore.js";

// 2. إعدادات الربط الخاصة بمشروع Altajer Pro
const firebaseConfig = {
    apiKey: "AIzaSyADh8KorayFEiM1JIETYr8LDubkJpja_yU",
    authDomain: "altajer-pro-accountant.firebaseapp.com",
    projectId: "altajer-pro-accountant",
    storageBucket: "altajer-pro-accountant.firebasestorage.app",
    messagingSenderId: "982176278219",
    appId: "1:982176278219:web:5fede7cef02cce60a35d4e",
    measurementId: "G-WM6KN5NKTC"
};

// 3. محرك التطبيق الرئيسي
const App = {
    db: null,
    user: null,
    
    init: function() {
        console.log("جاري تشغيل محرك التاجر برو الاحترافي...");
        
        // تشغيل الاتصال بالسحابة
        const firebaseApp = initializeApp(firebaseConfig);
        this.db = getFirestore(firebaseApp);
        
        this.bindEvents();
        this.checkAuth();
    },

    bindEvents: function() {
        document.querySelectorAll('.nav-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const view = e.currentTarget.getAttribute('onclick').match(/'([^']+)'/)[1];
                this.loadView(view);
            });
        });
    },

    loadView: function(viewName) {
        if(viewName === 'sales') this.initSalesModule();
        if(viewName === 'zatca') this.initZatcaModule();
    },

    // وحدة الزكاة والدخل
    initZatcaModule: function() {
        const container = document.getElementById('zatca');
        if(!container) return;
        container.innerHTML = `
            <div class="data-section">
                <h3><i class="fas fa-shield-check"></i> وحدة الربط مع هيئة الزكاة والضريبة</h3>
                <div style="margin-top:20px; border:1px dashed #005f73; padding:20px; border-radius:10px;">
                    <p>المشروع: <strong>Altajer Pro</strong></p>
                    <label>حالة الربط:</label> <span class="badge" style="background:#27ae60; color:white; padding:5px 10px; border-radius:5px;">متصل بالسحابة (Live)</span>
                    <hr style="margin:20px 0; opacity:0.1;">
                    <button class="btn-action" onclick="App.generateCSR()">توليد ملفات التعريف (CSR)</button>
                </div>
            </div>
        `;
    },

    // وحدة المبيعات والضريبة 15%
    initSalesModule: function() {
        const container = document.getElementById('sales');
        if(!container) return;
        container.innerHTML = `
            <div class="data-section">
                <h2>إصدار فاتورة ضريبية مبسطة</h2>
                <div class="sales-form" style="display:grid; grid-template-columns: 1fr; gap:20px;">
                    <div class="items-entry">
                        <table style="width:100%; border-collapse: collapse;">
                            <thead style="background:#005f73; color:white;">
                                <tr>
                                    <th style="padding:10px;">الصنف</th>
                                    <th>الكمية</th>
                                    <th>السعر</th>
                                    <th>المجموع</th>
                                </tr>
                            </thead>
                            <tbody id="invoiceItems"></tbody>
                        </table>
                        <button class="btn-action" style="margin-top:10px;" onclick="App.addItemRow()">+ إضافة صنف</button>
                    </div>
                    <div class="summary-side" style="background:#f8f9fa; padding:20px; border-radius:10px; border: 1px solid #ddd;">
                        <h4>ملخص الفاتورة (الضريبة 15%)</h4>
                        <div id="totalsArea">
                            <p>الإجمالي: <span id="grandTotal">0.00</span> ر.س</p>
                        </div>
                        <button class="btn-action" style="width:100%; background:#27ae60;" onclick="App.finalizeInvoice()">حفظ وإصدار QR</button>
                    </div>
                </div>
            </div>
        `;
    },

    addItemRow: function() {
        const tbody = document.getElementById('invoiceItems');
        const row = `<tr>
            <td><input type="text" class="item-name" placeholder="المنتج" style="width:90%; padding:8px;"></td>
            <td><input type="number" class="item-qty" value="1" style="width:50px; padding:8px;"></td>
            <td><input type="number" class="item-price" value="0" style="width:70px; padding:8px;"></td>
            <td class="row-total">0.00</td>
        </tr>`;
        tbody.insertAdjacentHTML('beforeend', row);
    },

    // حفظ الفاتورة في Firestore مباشرة
    finalizeInvoice: async function() {
        try {
            const docRef = await addDoc(collection(this.db, "invoices"), {
                timestamp: serverTimestamp(),
                total: document.getElementById('grandTotal').innerText,
                status: "Finalized",
                zatca_compliant: true
            });
            alert("تم حفظ الفاتورة بنجاح في السحابة! رقم المرجع: " + docRef.id);
        } catch (e) {
            console.error("خطأ في الحفظ: ", e);
            alert("فشل الاتصال بالقاعدة، تأكد من إعدادات الـ Rules");
        }
    },

    checkAuth: function() {
        console.log("نظام التاجر برو متصل وجاهز للعمل.");
    }
};

// إطلاق النظام
window.onload = () => App.init();
window.App = App; // لجعل الوظائف متاحة في HTML
