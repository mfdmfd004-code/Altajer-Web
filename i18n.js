// ==========================================
// التاجر برو المحاسبي - Altajer Pro Accountant
// محرك الترجمة التلقائي الصامت - بدون widget ظاهر
// ==========================================

function googleTranslateElementInit() {
    new google.translate.TranslateElement({
        pageLanguage: 'ar',
        autoDisplay: false  // ← هذا يمنع ظهور أي شيء تلقائي
    }, 'google_translate_element');

    // بعد تحميل الـ widget، نطبق لغة المتصفح فوراً
    setTimeout(() => {
        applyBrowserLanguage();
    }, 800);
}

function applyBrowserLanguage() {
    // قراءة لغة المتصفح/الجهاز
    const browserLang = navigator.language || navigator.userLanguage || 'ar';
    const langCode = browserLang.split('-')[0].toLowerCase(); // مثال: "de-DE" → "de"

    // إذا كانت اللغة عربية لا نفعل شيء (لغة التطبيق الأصلية)
    if (langCode === 'ar') return;

    // البحث عن select الخاص بجوجل ترانسليت وتغييره
    const trySetLanguage = (attempts) => {
        if (attempts <= 0) return;

        const select = document.querySelector('.goog-te-combo');
        if (select) {
            select.value = langCode;
            select.dispatchEvent(new Event('change'));
        } else {
            // لم يتحمل بعد، نحاول مرة أخرى
            setTimeout(() => trySetLanguage(attempts - 1), 500);
        }
    };

    trySetLanguage(10); // يحاول 10 مرات كل 500ms
}

function injectCloudTranslateEngine() {
    // إنشاء حاوية مخفية تماماً - لا تظهر للمستخدم
    if (!document.getElementById('google_translate_element')) {
        const translateContainer = document.createElement('div');
        translateContainer.id = 'google_translate_element';
        translateContainer.style.display = 'none'; // ← مخفي تماماً
        document.body.appendChild(translateContainer);
    }

    // حقن سكريبت جوجل
    const googleScript = document.createElement('script');
    googleScript.type = 'text/javascript';
    googleScript.async = true;
    googleScript.src = '//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
    document.head.appendChild(googleScript);
}

// إخفاء شريط جوجل الأصفر الذي يظهر أعلى الصفحة
function hideGoogleBanner() {
    const style = document.createElement('style');
    style.textContent = `
        /* إخفاء شريط جوجل الأصفر */
        .goog-te-banner-frame,
        #goog-gt-tt,
        .goog-te-balloon-frame,
        div#goog-gt- { 
            display: none !important; 
        }
        body { 
            top: 0 !important; 
        }
        /* إخفاء الـ widget نهائياً */
        #google_translate_element,
        .goog-te-gadget {
            display: none !important;
        }
    `;
    document.head.appendChild(style);
}

// تشغيل كل شيء عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', () => {
    hideGoogleBanner();
    injectCloudTranslateEngine();
});
