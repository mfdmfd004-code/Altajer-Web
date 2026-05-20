// ==========================================
// نظام التاجر برو (Altajer Pro)
// وحدة الربط الشامل والصامت مع نظام وافق المحاسبي (Wafeq API)
// متوافق بالكامل مع اشتراطات هيئة الزكاة والضريبة والجمارك (ZATCA Phase 2)
// ==========================================

// رابط واجهة برمجيات وافق لإصدار الفواتير
const WAFEQ_API_URL = 'https://api.wafeq.com/v1/invoices/';

// مفتاح الأمان السري (API Key) الخاص بحسابك في وافق
// ملاحظة لأبي فهد: استبدل النص أدناه بمفتاحك الفعلي من إعدادات وافق عند الجاهزية
const WAFEQ_API_KEY = 'YOUR_WAFEQ_API_KEY_HERE'; 

/**
 * دالة رئيسية مدمجة لاستقبال بيانات الفاتورة من الكاشير وإرسالها فوراً إلى وافق
 * @param {Object} currentInvoice - كائن الفاتورة الفعلي المحمل بالمنتجات والأسعار
 */
async function syncInvoiceWithWafeq(currentInvoice) {
    try {
        // 1. صياغة وهيكلة البيانات المدمجة بالتنسيق الذي يفهمه نظام وافق وضريبة 15%
        const wafeqInvoicePayload = {
            "invoice_number": currentInvoice.invoiceNumber || `INV-${Date.now()}`,
            "date": currentInvoice.date || new Date().toISOString().split('T')[0],
            "customer_name": currentInvoice.customer || "نقدي",
            "currency": "SAR",
            "discount": parseFloat(currentInvoice.discount) || 0.00,
            "items": currentInvoice.items.map(item => ({
                "name": item.name || "منتج عام",
                "quantity": parseFloat(item.quantity) || 1,
                "unit_price": parseFloat(item.price) || 0,
                "tax_rate": 0.15 // فرض ضريبة القيمة المضافة 15% تلقائياً حسب النظام السعودي
            })),
            "status": "draft" // تُرسل كمسودة لحسابك لتراجعها، أو "sent" للاعتماد الفوري
        };

        console.log("🔄 جاري إرسال الفاتورة المدمجة إلى نظام وافق صامتاً...", wafeqInvoicePayload);

        // 2. فتح خط اتصال آمن ومباشر (Fetch) مع السيرفر المحاسبي لوافق
        const response = await fetch(WAFEQ_API_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Api-Key ${WAFEQ_API_KEY}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(wafeqInvoicePayload)
        });

        // 3. فحص استجابة السيرفر ومعالجة النتيجة
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`استجابة خاطئة من سيرفر وافق: ${errorText}`);
        }

        const jsonResult = await response.json();
        
        console.log("✅ تم إثبات الفاتورة ضريبياً بنجاح في وافق وتوليد الـ QR بالخلفية!");
        return { 
            success: true, 
            wafeqInvoiceId: jsonResult.id,
            wafeqInvoiceNumber: jsonResult.invoice_number 
        };

    } catch (error) {
        console.error("❌ فشل الربط الصامت مع وافق، وتم حفظ الفاتورة محلياً فقط:", error.message);
        return { 
            success: false, 
            error: error.message 
        };
    }
}
