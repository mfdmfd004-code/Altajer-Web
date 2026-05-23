// ==========================================
// نظام التاجر برو (Altajer Pro)
// وحدة الربط مع نظام وافق المحاسبي (Wafeq API)
// متوافق مع اشتراطات ZATCA Phase 2
// ==========================================

const WAFEQ_API_URL = 'https://api.wafeq.com/v1/invoices/';
const WAFEQ_API_KEY = '3Z4oNsHN.QVPQJnmb4dM7efQ057eAEgfnxJpUjVZF';

async function syncInvoiceWithWafeq(currentInvoice) {
    try {
        // التحقق من وجود البيانات الأساسية
        if (!currentInvoice || !currentInvoice.items || currentInvoice.items.length === 0) {
            console.warn("⚠️ وافق: لا توجد أصناف في الفاتورة.");
            return { success: false, error: "فاتورة فارغة" };
        }

        const wafeqInvoicePayload = {
            invoice_number: currentInvoice.invoiceNumber || `INV-${Date.now()}`,
            date: currentInvoice.date || new Date().toISOString().split('T')[0],
            customer_name: currentInvoice.customer || "نقدي",
            currency: "SAR",
            discount: parseFloat(currentInvoice.discount) || 0.00,
            notes: `فاتورة صادرة من تاجر برو | الرقم الضريبي للعميل: ${currentInvoice.customerVat || 'غير ضريبي'}`,
            items: currentInvoice.items.map(item => ({
                name: item.name || "منتج عام",
                quantity: parseFloat(item.qty || item.quantity) || 1,
                unit_price: parseFloat(
                    item.priceExcl || (item.price / 1.15)
                ).toFixed(2),
                tax_rate: "0.15"
            })),
            status: "draft"
        };

        console.log("🔄 إرسال الفاتورة إلى وافق...", wafeqInvoicePayload);

        const response = await fetch(WAFEQ_API_URL, {
            method: 'POST',
            headers: {
                'Authorization': `Api-Key ${WAFEQ_API_KEY}`,
                'Content-Type': 'application/json',
                'Accept': 'application/json'
            },
            body: JSON.stringify(wafeqInvoicePayload)
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`خطأ من سيرفر وافق (${response.status}): ${errorText}`);
        }

        const jsonResult = await response.json();

        console.log("✅ تم إرسال الفاتورة لوافق بنجاح:", jsonResult.id);

        // إشعار المستخدم بالنجاح
        if (typeof showToast === 'function') {
            showToast(`✅ تم الإرسال لوافق: ${jsonResult.invoice_number || jsonResult.id}`, true);
        }

        return {
            success: true,
            wafeqInvoiceId: jsonResult.id,
            wafeqInvoiceNumber: jsonResult.invoice_number
        };

    } catch (error) {
        console.error("❌ فشل الربط مع وافق:", error.message);

        // إشعار المستخدم بالفشل دون إيقاف العمل
        if (typeof showToast === 'function') {
            showToast(`⚠️ تعذر الإرسال لوافق — تم الحفظ محلياً`, false);
        }

        return {
            success: false,
            error: error.message
        };
    }
}

window.syncInvoiceWithWafeq = syncInvoiceWithWafeq;
console.log("✅ وحدة وافق جاهزة للربط.");
