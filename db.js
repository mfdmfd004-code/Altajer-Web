/**
 * Altajer Pro - Database & Logic Engine
 * نظام إدارة قواعد البيانات والعمليات الحسابية المتطور
 */

const DB = {
    // 1. هيكل بيانات التاجر الافتراضي (SaaS Structure)
    merchantSchema: {
        id: "",
        name: "",
        vatNumber: "",
        subscriptionEnd: "",
        status: "trial", // trial, active, expired
        settings: {
            currency: "SAR",
            taxRate: 15,
            theme: "rustic"
        }
    },

    // 2. محرك الحسابات الضريبية (VAT Engine)
    calculateInvoice: function(items) {
        let subtotal = 0;
        items.forEach(item => {
            subtotal += item.price * item.quantity;
        });

        const taxRate = this.merchantSchema.settings.taxRate / 100;
        const taxAmount = subtotal * taxRate;
        const totalAmount = subtotal + taxAmount;

        return {
            subtotal: subtotal.toFixed(2),
            taxAmount: taxAmount.toFixed(2),
            totalAmount: totalAmount.toFixed(2),
            timestamp: new Date().toISOString()
        };
    },

    // 3. نظام تشفير TLV لمتطلبات ZATCA (المرحلة الأولى)
    // هذا الجزء ضروري جداً لإنشاء QR Code صحيح تتقبله هيئة الزكاة
    generateZatcaTLV: function(sellerName, vatNo, time, total, tax) {
        function toTLV(tag, value) {
            const tagBuf = String.fromCharCode(tag);
            const lenBuf = String.fromCharCode(value.length);
            return tagBuf + lenBuf + value;
        }

        const tlvData = 
            toTLV(1, sellerName) + 
            toTLV(2, vatNo) + 
            toTLV(3, time) + 
            toTLV(4, total) + 
            toTLV(5, tax);

        return btoa(unescape(encodeURIComponent(tlvData))); // تحويل إلى Base64
    },

    // 4. إدارة المخزون (Inventory Management)
    updateStock: async function(productId, quantitySold) {
        console.log(`تحديث المخزن للمنتج ${productId} بخصم ${quantitySold}`);
        // سيتم ربط هذا الجزء بـ Firestore لاحقاً
    },

    // 5. فحص صلاحية الاشتراك (SaaS Guard)
    checkSubscriptionStatus: function(expiryDate) {
        const today = new Date();
        const expiry = new Date(expiryDate);
        const diffTime = expiry - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        return {
            isExpired: diffDays <= 0,
            daysLeft: diffDays > 0 ? diffDays : 0
        };
    },

    // 6. حفظ الفاتورة (Invoice Archiving)
    saveInvoice: async function(invoiceData) {
        console.log("جاري حفظ الفاتورة في سجلات التاجر...");
        // كود الربط مع Firebase Firestore لإضافة الفاتورة في مجموعة (Invoices)
    }
};

// تصدير المكتبة لتكون جاهزة للاستخدام في app.js
window.DB = DB;
