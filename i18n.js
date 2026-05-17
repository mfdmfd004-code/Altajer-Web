// ==========================================
// التاجر برو المحاسبي - Altajer Pro Accountant
// المحرك المركزي الموحد للترجمة السحابية الفورية عبر الإنترنت
// ==========================================

/**
 * دالة تهيئة محرك ترجمة جوجل التلقائي للويب
 * يتم استدعاؤها برمجياً عبر سكريبت جوجل المربوط بالإنترنت
 */
function googleTranslateElementInit() {
    new google.translate.TranslateElement({
        // اللغة الأساسية والافتراضية لبناء كود البرنامج
        pageLanguage: 'en', 
        
        // اللغات المتاحة للتحويل بينها (يمكنك توسيعها أو تركها مفتوحة لكل لغات العالم)
        includedLanguages: 'ar,en,ur, hi', 
        
        // نمط العرض: مدمج وبسيط ليناسب شاشات الهواتف الذكية
        layout: google.translate.TranslateElement.InlineLayout.SIMPLE,
        
        // تفعيل الترجمة التلقائية بناءً على لغة متصفح المستخدم
        autoDisplay: true 
    }, 'google_translate_element');
}

/**
 * حقن واستدعاء ملفات ربط محرك الترجمة السحابي من خوادم جوجل
 */
function injectCloudTranslateEngine() {
    // 1. إنشاء حاوية برمجية لتثبيت واجهة اختيار اللغة في الشاشة إن لم تكن موجودة
    if (!document.getElementById('google_translate_element')) {
        const translateContainer = document.createElement('div');
        translateContainer.id = 'google_translate_element';
        
        // تنسيق الحاوية لتظهر بشكل أنيق وثابت في أعلى يمين الشاشة دون تشويه التصميم
        translateContainer.style.position = 'fixed';
        translateContainer.style.top = '10px';
        translateContainer.style.right = '10px';
        translateContainer.style.zIndex = '99999';
        translateContainer.style.padding = '5px';
        translateContainer.style.borderRadius = '8px';
        translateContainer.style.backgroundColor = 'rgba(30, 41, 59, 0.85)'; // متناسق مع المظهر الداكن للبرنامج
        translateContainer.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1)';
        
        document.body.appendChild(translateContainer);
    }

    // 2. حقن سكريبت جوجل الرسمي للترجمة الفورية برمجياً داخل الصفحة
    const googleScript = document.createElement('script');
    googleScript.type = 'text/javascript';
    googleScript.async = true;
    googleScript.src = '//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
    
    document.head.appendChild(googleScript);
}

// تشغيل المحرك السحابي فوراً وبشكل تلقائي عند تحميل أي صفحة في النظام
document.addEventListener('DOMContentLoaded', () => {
    // تعيين إعدادات الصفحة الأساسية لتصبح بالإنجليزية افتراضياً ومن اليسار لليمين
    document.documentElement.lang = 'en';
    document.documentElement.dir = 'ltr';
    
    // تشغيل الاتصال بالإنترنت ومزامنة الترجمة الفورية
    injectCloudTranslateEngine();
});
