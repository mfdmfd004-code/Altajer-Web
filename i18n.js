// التاجر برو المحاسبي - النظام المركزي الموحد لإدارة اللغات والترجمة الشاملة
const globalTranslations = {
    ar: {
        // --- شاشة القائمة الرئيسية والـ Dashboard ---
        "nav-dashboard": "لوحة التحكم",
        "nav-pos": "نظام الكاشير (POS)",
        "nav-purchases": "المشتريات وتغذية المخزن",
        "nav-products": "إدارة المنتجات والأصناف",
        "nav-customers": "إدارة العملاء",
        "nav-suppliers": "إدارة الموردين",
        "nav-inventory": "جرد المخزن",
        "nav-vat": "الإقرار الضريبي",
        "nav-settings": "الإعدادات",

        // --- شاشة المشتريات وتغذية المخزن ---
        "pur-main-title": "تسجيل فاتورة مشتريات وتحديث المخزن",
        "sub-invoice-meta": "البيانات التعريفية للمورد والفاتورة",
        "lbl-pur-sup": "المورد / الشركة البائعة",
        "lbl-pur-no": "رقم فاتورة المورد الأصلية",
        "lbl-pur-date": "تاريخ الشراء",
        "sub-product-entry": "تغذية السلع والأصناف المخزنية",
        "lbl-i-code": "كود الصنف / باركود",
        "lbl-i-name": "اسم المنتج / البيان",
        "lbl-i-price": "سعر الشراء",
        "lbl-i-qty": "الكمية",
        "lbl-i-unit": "النوع / الوحدة",
        "btn-add-row": "إضافة الصنف للجدول",
        "th-p-code": "كود الصنف", 
        "th-p-desc": "اسم المنتج / البيان", 
        "th-p-unit": "النوع", 
        "th-p-price": "سعر الوحدة (قبل الضريبة)", 
        "th-p-qty": "الكمية", 
        "th-p-tax-rate": "نسبة الضريبة", 
        "th-p-tax": "قيمة الضريبة",
        "th-p-total": "المجموع شامل الضريبة", 
        "th-p-action": "حذف", 
        "sum-p-sub": "الإجمالي الخاضع للضريبة:",
        "sum-p-tax": "مجموع ضريبة المدخلات (15%):", 
        "sum-p-net": "الصافي النهائي المعتمد للفاتورة:",
        "btn-commit-stock": "اعتماد الشراء وتحديث المخزن", 
        "btn-clear-all": "تفريغ وإلغاء الفاتورة",

        // --- شاشة الكاشير ونقاط البيع (POS) ---
        "pos-main-title": "نظام الكاشير والمبيعات الفورية",
        "lbl-select-cust": "اختر العميل المستهدف",
        "lbl-select-item": "اختر الصنف المطلوب",
        "lbl-qty-bought": "الكمية المطلوبة",
        "lbl-qty-hand": "الكمية المتاحة بالمخزن",
        "btn-add-cart": "إضافة إلى سلة البيع",
        "btn-place-order": "إصدار وحفظ الفاتورة الإلكترونية",
        "th-pos-excl": "السعر (قبل الضريبة)",
        "th-pos-sub": "المجموع الإجمالي",

        // --- شاشة إدارة العملاء والموردين ---
        "cust-manage-title": "إدارة ملفات وبيانات العملاء",
        "sup-manage-title": "إدارة ملفات وبيانات الموردين",
        "lbl-cust-id": "معرّف / رقم الملف",
        "lbl-cust-name": "الاسم الكامل",
        "lbl-cust-vat": "الرقم الضريبي (VAT)",
        "lbl-cust-address": "العنوان الوطني",
        "lbl-cust-contact": "رقم الجوال / التواصل",
        "btn-save": "حفظ / تحديث البيانات",
        "btn-search": "بحث سريع",
        "btn-delete": "حذف نهائي",

        // --- مصفوفة ترجمة الوحدات ديناميكياً في الجداول والقوائم ---
        "unit-حبة": "حبة",
        "unit-قطعة": "قطعة",
        "unit-علبة": "علبة",
        "unit-كرتون": "كرتون",
        "unit-شد": "شد",
        "unit-مطربان": "مطربان",
        "unit-كيس": "كيس",
        "unit-ربطة": "ربطة",
        "unit-بالة": "بالة",
        "unit-طبلية": "طبلية",
        "unit-كيلو": "كيلو",
        "unit-غرام": "غرام",
        "unit-طن": "طن",

        // --- خيارات الحالات والتنبيهات وحقول الإدخال ---
        "tax-method-excl": "غير شامل الضريبة",
        "tax-method-incl": "شامل الضريبة",
        "placeholder-barcode": "امسح أو اكتب الباركود...",
        "placeholder-pname": "ادخل اسم الصنف المالي...",
        "placeholder-price": "0.00",
        "no-items": "لا توجد أصناف مدرجة بالفاتورة حالياً"
    },
    en: {
        // --- Sidebar & Navigation ---
        "nav-dashboard": "Dashboard",
        "nav-pos": "POS / Cashier",
        "nav-purchases": "Purchases & Stock Inflow",
        "nav-products": "Products & Sku Master",
        "nav-customers": "Customers Directory",
        "nav-suppliers": "Suppliers Directory",
        "nav-inventory": "Inventory Counting",
        "nav-vat": "VAT Filing Summary",
        "nav-settings": "System Settings",

        // --- Purchase & Inventory Screen ---
        "pur-main-title": "Purchase Invoice Entry & Inventory Inflow",
        "sub-invoice-meta": "Supplier & Invoice Meta Identifiers",
        "lbl-pur-sup": "Supplier / Selling Company",
        "lbl-pur-no": "Original Supplier Invoice No",
        "lbl-pur-date": "Purchase Date",
        "sub-product-entry": "Inventory Inflow & Sku Feeding",
        "lbl-i-code": "Item Code / Barcode",
        "lbl-i-name": "Product Name / Sku Desc",
        "lbl-i-price": "Purchase Price",
        "lbl-i-qty": "Inflow Quantity",
        "lbl-i-unit": "Type / Unit",
        "btn-add-row": "Add Item to Table",
        "th-p-code": "Item Code", 
        "th-p-desc": "Product Description", 
        "th-p-unit": "Type", 
        "th-p-price": "Unit Price (Excl. VAT)", 
        "th-p-qty": "Qty", 
        "th-p-tax-rate": "VAT Rate", 
        "th-p-tax": "VAT Amount",
        "th-p-total": "Total (Incl. VAT)", 
        "th-p-action": "Del", 
        "sum-p-sub": "Taxable Subtotal:",
        "sum-p-tax": "Input VAT Total (15%):", 
        "sum-p-net": "Final Net Invoice Amount:",
        "btn-commit-stock": "Commit Purchase & Sync Stock", 
        "btn-clear-all": "Clear & Reset Invoice",

        // --- POS / Cashier Screen ---
        "pos-main-title": "Cashier & Instant Sales System",
        "lbl-select-cust": "Select Target Customer",
        "lbl-select-item": "Select Required Item",
        "lbl-qty-bought": "Required Quantity",
        "lbl-qty-hand": "Quantity On Hand",
        "btn-add-cart": "Add to Sales Cart",
        "btn-place-order": "Issue & Post E-Invoice",
        "th-pos-excl": "Price (Excl. VAT)",
        "th-pos-sub": "Subtotal Amount",

        // --- Customers & Suppliers ---
        "cust-manage-title": "Customer Profiles & Master Data",
        "sup-manage-title": "Supplier Profiles & Master Data",
        "lbl-cust-id": "Profile / ID No",
        "lbl-cust-name": "Full Name",
        "lbl-cust-vat": "VAT Number",
        "lbl-cust-address": "National Address",
        "lbl-cust-contact": "Mobile / Contact No",
        "btn-save": "Save / Update Record",
        "btn-search": "Quick Search",
        "btn-delete": "Permanent Delete",

        // --- Dropdown Units Translation ---
        "unit-حبة": "Piece",
        "unit-قطعة": "Item",
        "unit-علبة": "Box",
        "unit-كرتون": "Carton",
        "unit-شد": "Pack",
        "unit-مطربان": "Jar",
        "unit-كيس": "Bag",
        "unit-ربطة": "Bundle",
        "unit-بالة": "Bale",
        "unit-طبلية": "Pallet",
        "unit-كيلو": "KG",
        "unit-غرام": "Gram",
        "unit-طن": "Ton",

        // --- UI Placeholders & Toggle States ---
        "tax-method-excl": "Excl. Tax",
        "tax-method-incl": "Incl. Tax",
        "placeholder-barcode": "Scan or type barcode...",
        "placeholder-pname": "Enter financial item name...",
        "placeholder-price": "0.00",
        "no-items": "No items added to invoice yet"
    }
};

/**
 * محرك الترجمة الديناميكي الموحد لبرنامج التاجر برو
 * يقوم بالبحث التلقائي في كامل الواجهة وترجمة كل ما يحمل معرف لغوي
 */
function applySystemLanguage(lang = 'ar') {
    // 1. حفظ اللغة المفضلة في المتصفح لتبقى ثابتة عند التنقل بين الشاشات
    localStorage.setItem('altajer_lang', lang);
    
    // ضبط اتجاه الصفحة هندسياً بناءً على اللغة
    document.documentElement.dir = (lang === 'ar') ? 'rtl' : 'ltr';
    document.documentElement.lang = lang;

    // 2. ترجمة العناصر الثابتة التي تحمل خاصية data-i18n
    const elements = document.querySelectorAll('[data-i18n]');
    elements.forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (globalTranslations[lang] && globalTranslations[lang][key]) {
            // المحافظة على الأيقونات الداخيلة إن وجدت، وتغيير النص فقط
            const icon = el.querySelector('i, svg');
            if (icon) {
                el.innerHTML = '';
                el.appendChild(icon);
                el.appendChild(document.createTextNode(' ' + globalTranslations[lang][key]));
            } else {
                el.textContent = globalTranslations[lang][key];
            }
        }
    });

    // 3. ترجمة الـ Placeholders في حقول الإدخال بشكل ديناميكي
    const inputs = document.querySelectorAll('[data-i18n-holder]');
    inputs.forEach(input => {
        const key = input.getAttribute('data-i18n-holder');
        if (globalTranslations[lang] && globalTranslations[lang][key]) {
            input.placeholder = globalTranslations[lang][key];
        }
    });

    // 4. ترجمة خيارات القوائم المنسدلة (مثل الوحدات) دون إتلاف القيمة الأساسية
    const options = document.querySelectorAll('select option[data-i18n-unit]');
    options.forEach(opt => {
        const rawUnit = opt.getAttribute('data-i18n-unit');
        const key = 'unit-' + rawUnit;
        if (globalTranslations[lang] && globalTranslations[lang][key]) {
            opt.textContent = globalTranslations[lang][key];
        }
    });
}

// تشغيل المحرك تلقائياً فور تحميل الشاشة بناءً على آخر لغة تم حفظها
document.addEventListener('DOMContentLoaded', () => {
    const savedLang = localStorage.getItem('altajer_lang') || 'ar';
    applySystemLanguage(savedLang);
});
