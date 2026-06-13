// ============================================
// taxEngine.js — تاجر برو
// محرك ضرائب عالمي مرن (Core Engine + Adapters)
// ============================================

// ===== الدول المدعومة وإعداداتها =====
const TAX_ADAPTERS = {

    SA: {
        name: 'المملكة العربية السعودية',
        currency: 'SAR',
        currencySymbol: 'ر.س',
        vatRate: 0.15,
        vatLabel: 'ضريبة القيمة المضافة (VAT)',
        vatNumber_regex: /^3\d{13}3$/,
        invoiceTypes: {
            simplified: '388',  // فاتورة مبسطة (B2C)
            standard: '381'     // فاتورة ضريبية كاملة (B2B/GOV)
        },
        validateVat: (vat) => /^3\d{13}3$/.test(vat),
        compute: (items, discount = 0) => computeStandard(items, discount, 0.15)
    },

    AE: {
        name: 'الإمارات العربية المتحدة',
        currency: 'AED',
        currencySymbol: 'د.إ',
        vatRate: 0.05,
        vatLabel: 'ضريبة القيمة المضافة (VAT)',
        vatNumber_regex: /^\d{15}$/,
        validateVat: (vat) => /^\d{15}$/.test(vat),
        compute: (items, discount = 0) => computeStandard(items, discount, 0.05)
    },

    EG: {
        name: 'مصر',
        currency: 'EGP',
        currencySymbol: 'ج.م',
        vatRate: 0.14,
        vatLabel: 'ضريبة القيمة المضافة',
        validateVat: (vat) => vat && vat.length === 9,
        compute: (items, discount = 0) => computeStandard(items, discount, 0.14)
    },

    KW: {
        name: 'الكويت',
        currency: 'KWD',
        currencySymbol: 'د.ك',
        vatRate: 0,
        vatLabel: 'لا توجد ضريبة',
        validateVat: () => true,
        compute: (items, discount = 0) => computeStandard(items, discount, 0)
    },

    BH: {
        name: 'البحرين',
        currency: 'BHD',
        currencySymbol: 'د.ب',
        vatRate: 0.10,
        vatLabel: 'ضريبة القيمة المضافة (VAT)',
        validateVat: (vat) => vat && vat.length >= 5,
        compute: (items, discount = 0) => computeStandard(items, discount, 0.10)
    },

    OM: {
        name: 'عُمان',
        currency: 'OMR',
        currencySymbol: 'ر.ع',
        vatRate: 0.05,
        vatLabel: 'ضريبة القيمة المضافة (VAT)',
        validateVat: (vat) => vat && vat.length >= 5,
        compute: (items, discount = 0) => computeStandard(items, discount, 0.05)
    },

    QA: {
        name: 'قطر',
        currency: 'QAR',
        currencySymbol: 'ر.ق',
        vatRate: 0,
        vatLabel: 'لا توجد ضريبة',
        validateVat: () => true,
        compute: (items, discount = 0) => computeStandard(items, discount, 0)
    },

    GB: {
        name: 'المملكة المتحدة',
        currency: 'GBP',
        currencySymbol: '£',
        vatRate: 0.20,
        vatLabel: 'VAT',
        validateVat: (vat) => /^GB\d{9}$/.test(vat),
        compute: (items, discount = 0) => computeStandard(items, discount, 0.20)
    },

    DE: {
        name: 'ألمانيا',
        currency: 'EUR',
        currencySymbol: '€',
        vatRate: 0.19,
        vatLabel: 'MwSt',
        validateVat: (vat) => /^DE\d{9}$/.test(vat),
        compute: (items, discount = 0) => computeStandard(items, discount, 0.19)
    },

    US: {
        name: 'الولايات المتحدة',
        currency: 'USD',
        currencySymbol: '$',
        vatRate: 0,
        vatLabel: 'Sales Tax (varies by state)',
        validateVat: () => true,
        compute: (items, discount = 0) => computeStandard(items, discount, 0)
    }
};

// ===== دالة الحساب الموحدة =====
function computeStandard(items, discount, rate) {
    const subtotal = items.reduce((sum, item) => {
        const price = parseFloat(item.priceExclTax || item.price || 0);
        const qty = parseFloat(item.qty || item.quantity || 1);
        return sum + (price * qty);
    }, 0);

    const discountAmt = Math.min(parseFloat(discount) || 0, subtotal);
    const taxableAmount = subtotal - discountAmt;
    const taxAmount = parseFloat((taxableAmount * rate).toFixed(2));
    const total = parseFloat((taxableAmount + taxAmount).toFixed(2));

    return {
        subtotal: parseFloat(subtotal.toFixed(2)),
        discount: parseFloat(discountAmt.toFixed(2)),
        taxableAmount: parseFloat(taxableAmount.toFixed(2)),
        taxRate: rate,
        taxAmount,
        total
    };
}

// ============================================
// ===== Core Engine - الواجهة الرئيسية =====
// ============================================

const TaxEngine = {

    // جلب معلومات دولة التاجر
    getAdapter(countryCode) {
        const code = (countryCode || 'SA').toUpperCase();
        return TAX_ADAPTERS[code] || TAX_ADAPTERS['SA'];
    },

    // حساب ضرائب الفاتورة
    compute(items, options = {}) {
        const countryCode = options.country ||
            this.getStoreCountry();
        const adapter = this.getAdapter(countryCode);
        const result = adapter.compute(
            items,
            options.discount || 0
        );
        return {
            ...result,
            currency: adapter.currency,
            currencySymbol: adapter.currencySymbol,
            vatLabel: adapter.vatLabel,
            country: countryCode
        };
    },

    // التحقق من الرقم الضريبي
    validateVat(vat, countryCode) {
        const adapter = this.getAdapter(
            countryCode || this.getStoreCountry()
        );
        return adapter.validateVat(vat);
    },

    // جلب معدل الضريبة الحالي
    getRate(countryCode) {
        return this.getAdapter(
            countryCode || this.getStoreCountry()
        ).vatRate;
    },

    // جلب رمز العملة
    getCurrencySymbol(countryCode) {
        return this.getAdapter(
            countryCode || this.getStoreCountry()
        ).currencySymbol;
    },

    // جلب دولة التاجر من الإعدادات
    getStoreCountry() {
        try {
            const s = JSON.parse(
                localStorage.getItem('altajer_settings') || '{}'
            );
            return s.country || 'SA';
        } catch(e) {
            return 'SA';
        }
    },

    // قائمة الدول المدعومة (للإعدادات)
    getSupportedCountries() {
        return Object.entries(TAX_ADAPTERS).map(([code, adapter]) => ({
            code,
            name: adapter.name,
            currency: adapter.currency,
            vatRate: (adapter.vatRate * 100).toFixed(0) + '%'
        }));
    }
};

// ===== تصدير للاستخدام في باقي الملفات =====
window.TaxEngine = TaxEngine;
window.TAX_ADAPTERS = TAX_ADAPTERS;

console.log('✅ TaxEngine جاهز —',
    TaxEngine.getSupportedCountries().length,
    'دولة مدعومة'
);
