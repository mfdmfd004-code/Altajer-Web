// ============================================================
// نظام الاشتراكات المركزي — تاجر برو
// subscription.js — النسخة الكاملة مع 3 باقات + تقييد الميزات
// ============================================================

import { db } from "./firebase-config.js";
import {
    doc, getDoc, setDoc, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { getAuth, onAuthStateChanged }
    from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

// ============================================================
// الثوابت
// ============================================================
const TRIAL_DAYS     = 120;   // 4 أشهر تجريبية
const WARN_DAYS_WEEK = 7;
const WARN_DAYS_3    = 3;

// ============================================================
// تعريف الباقات الثلاث — الأسعار بالريال السعودي
// ============================================================
export const PLANS = {
    trial: {
        label:       'تجريبي',
        days:        TRIAL_DAYS,
        price:       0,
        priceYearly: 0,
        tier:        0,   // أدنى مستوى
        features: {
            invoices:       true,
            quotes:         true,
            products:       true,
            customers:      true,
            suppliers:      false,
            purchaseOrders: false,
            costCenter:     false,
            projects:       false,
            payroll:        false,
            expenses:       false,
            warehouse:      false,
            multiStore:     false,
            assets:         false,
            multiCompany:   false,
            vatFiling:      true,
            taxReport:      false,
            aiScanner:      false,
            maxUsers:       1,
            maxScans:       20
        }
    },
    starter: {
        label:       'Starter',
        labelAr:     'المبتدئ',
        days:        30,
        price:       99,       // شهري
        priceYearly: 1190,     // سنوي
        tier:        1,
        features: {
            invoices:       true,
            quotes:         true,
            products:       true,
            customers:      true,
            suppliers:      false,
            purchaseOrders: false,
            costCenter:     false,
            projects:       false,
            payroll:        false,
            expenses:       false,
            warehouse:      false,
            multiStore:     false,
            assets:         false,
            multiCompany:   false,
            vatFiling:      true,
            taxReport:      false,
            aiScanner:      false,
            maxUsers:       2,
            maxScans:       20
        }
    },
    plus: {
        label:       'Plus',
        labelAr:     'الاحترافي',
        days:        30,
        price:       119,      // شهري
        priceYearly: 1430,     // سنوي
        tier:        2,
        features: {
            invoices:       true,
            quotes:         true,
            products:       true,
            customers:      true,
            suppliers:      true,
            purchaseOrders: true,
            costCenter:     true,
            projects:       true,
            payroll:        false,
            expenses:       false,
            warehouse:      false,
            multiStore:     false,
            assets:         false,
            multiCompany:   false,
            vatFiling:      true,
            taxReport:      true,
            aiScanner:      false,
            maxUsers:       5,
            maxScans:       100
        }
    },
    premium: {
        label:       'Premium',
        labelAr:     'المميز',
        days:        30,
        price:       199,      // شهري
        priceYearly: 2390,     // سنوي
        tier:        3,
        features: {
            invoices:       true,
            quotes:         true,
            products:       true,
            customers:      true,
            suppliers:      true,
            purchaseOrders: true,
            costCenter:     true,
            projects:       true,
            payroll:        true,
            expenses:       true,
            warehouse:      true,
            multiStore:     true,
            assets:         true,
            multiCompany:   true,
            vatFiling:      true,
            taxReport:      true,
            aiScanner:      true,
            maxUsers:       20,
            maxScans:       500
        }
    },
    // باقة سنوية مستقلة (اختياري — للتوافق مع الكود القديم)
    monthly: {
        label:       'شهري',
        days:        30,
        price:       99,
        tier:        1,
        features:    null  // يرث من starter
    },
    yearly: {
        label:       'سنوي',
        days:        365,
        price:       1190,
        tier:        1,
        features:    null
    }
};

// ============================================================
// 1. جلب / إنشاء بيانات الاشتراك
// ============================================================
export async function getSubscription(uid) {
    try {
        const ref  = doc(db, 'users', uid, 'subscription', 'status');
        const snap = await getDoc(ref);
        if (snap.exists()) return snap.data();

        // مستخدم جديد → 4 أشهر تجريبية مجانية
        const now      = new Date();
        const trialEnd = new Date(now.getTime() + TRIAL_DAYS * 86400000);
        const newSub   = {
            plan:                'trial',
            planTier:            0,
            status:              'trial',
            subscriptionEndDate: trialEnd.toISOString(),
            createdAt:           now.toISOString(),
            trialUsed:           true
        };
        await setDoc(ref, { ...newSub, createdAt: serverTimestamp() });
        return newSub;
    } catch (e) {
        console.error('getSubscription error:', e);
        return null;
    }
}

// ============================================================
// 2. تفعيل الاشتراك بعد الدفع
// ============================================================
export async function activateSubscription(uid, plan) {
    try {
        const ref     = doc(db, 'users', uid, 'subscription', 'status');
        const snap    = await getDoc(ref);
        const current = snap.exists() ? snap.data() : {};

        const planData = PLANS[plan];
        if (!planData) throw new Error('خطة غير معروفة: ' + plan);

        const now = new Date();
        let endDate;
        if (current.subscriptionEndDate) {
            const existingEnd = new Date(current.subscriptionEndDate);
            const base = existingEnd > now ? existingEnd : now;
            endDate = new Date(base.getTime() + planData.days * 86400000);
        } else {
            endDate = new Date(now.getTime() + planData.days * 86400000);
        }

        const updatedSub = {
            plan,
            planTier:            planData.tier || 1,
            status:              'active',
            subscriptionEndDate: endDate.toISOString(),
            lastPaymentAt:       now.toISOString(),
            updatedAt:           serverTimestamp()
        };
        await setDoc(ref, updatedSub, { merge: true });
        localStorage.removeItem('altajer_warn_dismissed');
        localStorage.removeItem('altajer_warn_shown_today');
        return { success: true, endDate: endDate.toISOString() };
    } catch (e) {
        console.error('activateSubscription error:', e);
        return { success: false, error: e.message };
    }
}

// ============================================================
// 3. فحص حالة الاشتراك
// ============================================================
export function checkSubscriptionStatus(sub) {
    if (!sub) return { allowed: false, status: 'no_sub', daysLeft: 0, tier: 0 };
    const now      = new Date();
    const endDate  = new Date(sub.subscriptionEndDate);
    const daysLeft = Math.ceil((endDate - now) / 86400000);
    if (daysLeft <= 0) return { allowed: false, status: 'expired', daysLeft: 0, tier: 0 };
    const tier = sub.planTier || (sub.status === 'trial' ? 0 : 1);
    if (sub.status === 'trial') return { allowed: true, status: 'trial', daysLeft, tier: 0 };
    return { allowed: true, status: 'active', daysLeft, tier };
}

// ============================================================
// 4. التحقق من صلاحية ميزة معينة
// ============================================================
export function canUseFeature(sub, featureName) {
    if (!sub) return false;
    const status = checkSubscriptionStatus(sub);
    if (!status.allowed) return false;

    // في التجربة المجانية: نفس صلاحيات Starter
    const planKey = (sub.status === 'trial') ? 'starter' : (sub.plan || 'starter');
    const planData = PLANS[planKey];
    if (!planData || !planData.features) {
        // للخطط القديمة (monthly/yearly) نعطي صلاحيات starter
        return PLANS['starter'].features[featureName] || false;
    }
    return planData.features[featureName] || false;
}

// ============================================================
// 5. نظام التحذير العائم
// ============================================================
export function initSubscriptionWarning(sub) {
    try {
        const status = checkSubscriptionStatus(sub);
        if (status.allowed && status.daysLeft > WARN_DAYS_WEEK) return;
        if (!status.allowed) { showExpiredBlock(); return; }
        const today      = new Date().toDateString();
        const shownToday = localStorage.getItem('altajer_warn_shown_today');
        if (shownToday === today) return;
        createFloatingWarning(status.daysLeft, sub);
        setupIdleDetection(sub);
    } catch (e) {
        console.warn('Warning init error:', e);
    }
}

function createFloatingWarning(daysLeft, sub) {
    const old = document.getElementById('subWarningFloat');
    if (old) old.remove();
    const color = daysLeft <= WARN_DAYS_3 ? '#e63946' : '#ffb703';
    const icon  = daysLeft <= WARN_DAYS_3 ? '🔴' : '⚠️';
    const msg   = daysLeft <= WARN_DAYS_3
        ? `${icon} تنبيه عاجل! ينتهي اشتراكك خلال ${daysLeft} أيام`
        : `${icon} اشتراكك ينتهي خلال ${daysLeft} يوماً`;

    const box = document.createElement('div');
    box.id    = 'subWarningFloat';
    box.innerHTML = `
        <div id="subWarnInner" style="
            background:${color};color:#fff;border-radius:14px;
            padding:12px 14px;box-shadow:0 6px 20px rgba(0,0,0,0.4);
            font-family:'Cairo',sans-serif;font-size:13px;
            min-width:220px;max-width:260px;cursor:grab;
            user-select:none;position:relative;">
            <div style="font-weight:700;margin-bottom:4px;">${msg}</div>
            <div id="subWarnCountdown" style="font-size:11px;opacity:0.85;">
                سأختفي بعد دقيقة — اضغط للترقية
            </div>
            <div style="position:absolute;top:6px;left:8px;font-size:16px;
                cursor:pointer;opacity:0.8;"
                onclick="document.getElementById('subWarningFloat').remove()">✕</div>
        </div>`;
    Object.assign(box.style, {
        position: 'fixed', top: '80px', right: '16px',
        zIndex: '9999', transition: 'opacity 0.3s'
    });
    box.querySelector('#subWarnInner').addEventListener('click', function(e) {
        if (e.target.textContent === '✕') return;
        window.location.href = 'billing.html';
    });
    document.body.appendChild(box);
    makeDraggable(box);

    let seconds = 60;
    const timer = setInterval(() => {
        seconds--;
        const el = document.getElementById('subWarnCountdown');
        if (el) el.textContent = `سأختفي بعد ${seconds} ثانية — اضغط للترقية`;
        if (seconds <= 0) {
            clearInterval(timer);
            box.style.opacity = '0';
            setTimeout(() => box.remove(), 400);
        }
    }, 1000);
    localStorage.setItem('altajer_warn_shown_today', new Date().toDateString());
}

function makeDraggable(el) {
    let startX, startY, startRight, startTop;
    const inner = el.querySelector('#subWarnInner');
    if (!inner) return;
    inner.addEventListener('mousedown', dragStart);
    inner.addEventListener('touchstart', e => dragStart(e.touches[0]), { passive: true });
    function dragStart(e) {
        startX = e.clientX; startY = e.clientY;
        const rect = el.getBoundingClientRect();
        startRight = window.innerWidth - rect.right;
        startTop   = rect.top;
        el.style.cursor = 'grabbing';
        document.addEventListener('mousemove', dragMove);
        document.addEventListener('mouseup', dragEnd);
        document.addEventListener('touchmove', e => dragMove(e.touches[0]), { passive: true });
        document.addEventListener('touchend', dragEnd);
    }
    function dragMove(e) {
        const dx = startX - e.clientX;
        const dy = e.clientY - startY;
        el.style.right = Math.max(0, Math.min(window.innerWidth - 220, startRight + dx)) + 'px';
        el.style.top   = Math.max(0, Math.min(window.innerHeight - 100, startTop + dy)) + 'px';
    }
    function dragEnd() {
        el.style.cursor = 'grab';
        document.removeEventListener('mousemove', dragMove);
        document.removeEventListener('mouseup', dragEnd);
    }
}

function setupIdleDetection(sub) {
    let idleTimer;
    const IDLE_MS = 5 * 60 * 1000;
    function resetIdle() {
        clearTimeout(idleTimer);
        idleTimer = setTimeout(() => {
            const status = checkSubscriptionStatus(sub);
            if (status.allowed && status.daysLeft <= WARN_DAYS_WEEK && status.daysLeft > 0) {
                localStorage.removeItem('altajer_warn_shown_today');
                createFloatingWarning(status.daysLeft, sub);
            }
        }, IDLE_MS);
    }
    ['mousemove','keydown','touchstart','click'].forEach(evt =>
        document.addEventListener(evt, resetIdle, { passive: true })
    );
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
            const status = checkSubscriptionStatus(sub);
            if (status.allowed && status.daysLeft <= WARN_DAYS_WEEK && status.daysLeft > 0) {
                localStorage.removeItem('altajer_warn_shown_today');
                createFloatingWarning(status.daysLeft, sub);
            }
        }
    });
}

// ============================================================
// 6. حجب الصفحة عند انتهاء الاشتراك
// ============================================================
export function showExpiredBlock() {
    const old = document.getElementById('subExpiredOverlay');
    if (old) old.remove();
    const overlay = document.createElement('div');
    overlay.id = 'subExpiredOverlay';
    overlay.innerHTML = `
        <div style="background:linear-gradient(135deg,#1e293b,#0f172a);
            border:2px solid #e63946;border-radius:20px;
            padding:30px 25px;max-width:380px;width:90%;
            text-align:center;font-family:'Cairo',sans-serif;
            box-shadow:0 10px 40px rgba(0,0,0,0.6);">
            <div style="font-size:48px;margin-bottom:10px;">🔒</div>
            <h3 style="color:#e63946;font-weight:900;margin-bottom:8px;">انتهت فترة الاشتراك</h3>
            <p style="color:rgba(255,255,255,0.7);font-size:13px;margin-bottom:20px;">
                بياناتك ومخازنك محفوظة بالكامل.<br>
                جدد أو ارقِّ اشتراكك للاستمرار.
            </p>
            <a href="billing.html" style="display:block;
                background:linear-gradient(135deg,#2b9348,#38b000);
                color:white;padding:13px;border-radius:12px;
                text-decoration:none;font-weight:700;font-size:15px;
                margin-bottom:10px;">💳 اختر خطة وارقِّ اشتراكك</a>
            <a href="index.html" style="display:block;
                color:rgba(255,255,255,0.4);font-size:12px;
                text-decoration:none;margin-top:8px;">
                العودة للرئيسية (بدون إصدار فواتير)</a>
        </div>`;
    Object.assign(overlay.style, {
        position: 'fixed', inset: '0',
        background: 'rgba(0,0,0,0.85)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: '99999', backdropFilter: 'blur(6px)'
    });
    document.body.appendChild(overlay);
}

// ============================================================
// 7. تقييد الميزات بحسب الباقة — يُضاف لكل صفحة تلقائياً
// ============================================================
export function applyPlanRestrictions(sub) {
    if (!sub) return;
    const status = checkSubscriptionStatus(sub);
    // لا تقييد خلال فترة التجربة أو الاشتراك النشط
    if (status.status === 'trial' || status.status === 'active') return;
    // قائمة الميزات المقيدة مع data-feature المقابل في HTML
    const featureMap = {
        'suppliers':       '[data-feature="suppliers"], [href="suppliers.html"], [onclick*="suppliers"]',
        'purchaseOrders':  '[data-feature="purchaseOrders"], [href="purchases.html"], [onclick*="purchases"]',
        'payroll':         '[data-feature="payroll"], [href="employees.html"], [onclick*="payroll"]',
        'expenses':        '[data-feature="expenses"], [href="expenses.html"], [onclick*="expenses"]',
        'warehouse':       '[data-feature="warehouse"], [href="inventory-count.html"]',
        'multiStore':      '[data-feature="multiStore"]',
        'assets':          '[data-feature="assets"]',
        'multiCompany':    '[data-feature="multiCompany"]',
        'aiScanner':       '[data-feature="aiScanner"]',
        'taxReport':       '[data-feature="taxReport"]',
        'costCenter':      '[data-feature="costCenter"]',
        'projects':        '[data-feature="projects"]'
    };

    Object.entries(featureMap).forEach(([feature, selector]) => {
        const allowed = canUseFeature(sub, feature);
        if (!allowed) {
            document.querySelectorAll(selector).forEach(el => {
                el.style.position = 'relative';
                el.style.opacity  = '0.5';
                el.style.pointerEvents = 'none';
                // إضافة شارة القفل إن لم تكن موجودة
                if (!el.querySelector('.plan-lock-badge')) {
                    const badge = document.createElement('span');
                    badge.className = 'plan-lock-badge';
                    badge.innerHTML = ' 🔒';
                    badge.style.cssText = 'font-size:10px;vertical-align:middle;';
                    el.appendChild(badge);
                }
                // إعادة تفعيل pointer للنقر وإظهار رسالة الترقية
                el.style.pointerEvents = 'auto';
                el.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    showUpgradePrompt(feature);
                }, { once: false });
            });
        }
    });
}

function showUpgradePrompt(feature) {
    const featureNames = {
        suppliers:      'إدارة الموردين',
        purchaseOrders: 'أوامر الشراء',
        payroll:        'كشف الرواتب',
        expenses:       'مصروفات الموظفين',
        warehouse:      'تتبع المخزون',
        multiStore:     'مستودعات متعددة',
        assets:         'إدارة الأصول',
        multiCompany:   'وحدة البيانات المالية',
        aiScanner:      'المسح بالذكاء الاصطناعي',
        taxReport:      'قائمة تحقق الضريبة',
        costCenter:     'مراكز التكلفة',
        projects:       'تتبع ربحية المشاريع'
    };
    const name = featureNames[feature] || feature;

    const old = document.getElementById('upgradePromptBox');
    if (old) old.remove();

    const box = document.createElement('div');
    box.id = 'upgradePromptBox';
    box.innerHTML = `
        <div style="background:linear-gradient(135deg,#1e293b,#0f172a);
            border:2px solid #00b4d8;border-radius:20px;
            padding:28px 22px;max-width:340px;width:90%;
            text-align:center;font-family:'Cairo',sans-serif;">
            <div style="font-size:40px;margin-bottom:8px;">⭐</div>
            <h3 style="color:#00b4d8;font-weight:900;margin-bottom:8px;font-size:16px;">
                ميزة متاحة في الباقات المتقدمة
            </h3>
            <p style="color:rgba(255,255,255,0.7);font-size:13px;margin-bottom:20px;">
                <strong style="color:white;">${name}</strong><br>
                متاحة في باقة Plus أو Premium.
                <br>ارقِّ اشتراكك للوصول لكل الميزات.
            </p>
            <a href="billing.html" style="display:block;
                background:linear-gradient(135deg,#0077b6,#00b4d8);
                color:white;padding:12px;border-radius:12px;
                text-decoration:none;font-weight:700;font-size:14px;
                margin-bottom:10px;">🚀 ارقِّ اشتراكك الآن</a>
            <button onclick="document.getElementById('upgradePromptBox').remove()"
                style="background:transparent;border:1px solid rgba(255,255,255,0.2);
                color:rgba(255,255,255,0.5);padding:8px 20px;border-radius:10px;
                cursor:pointer;font-family:'Cairo',sans-serif;font-size:12px;
                width:100%;">إغلاق</button>
        </div>`;
    Object.assign(box.style, {
        position: 'fixed', inset: '0',
        background: 'rgba(0,0,0,0.7)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        zIndex: '99998', backdropFilter: 'blur(4px)'
    });
    document.body.appendChild(box);
    box.addEventListener('click', (e) => {
        if (e.target === box) box.remove();
    });
}

// ============================================================
// 8. حماية الصفحات — الدالة الرئيسية التي تُستدعى من كل صفحة
// ============================================================
export async function guardPage(options = {}) {
    const {
        blockOnExpired   = false,
        blockInvoiceOnly = true,
        redirectTo       = 'billing.html',
        applyRestrictions = true   // تفعيل تقييد الميزات تلقائياً
    } = options;
    const auth = getAuth();
    return new Promise(resolve => {
        onAuthStateChanged(auth, async user => {
            if (!user) { window.location.href = 'login.html'; return; }
            try {
                const sub    = await getSubscription(user.uid);
                const status = checkSubscriptionStatus(sub);
                initSubscriptionWarning(sub);

                // تطبيق تقييد الميزات بعد تحميل الصفحة
                if (applyRestrictions) {
                    if (document.readyState === 'complete') {
                        applyPlanRestrictions(sub);
                    } else {
                        window.addEventListener('load', () => applyPlanRestrictions(sub));
                    }
                }

                if (!status.allowed) {
                    if (blockOnExpired) showExpiredBlock();
                    else if (blockInvoiceOnly) disableInvoiceButtons();
                }
                resolve({ user, sub, status });
            } catch (e) {
                console.error('guardPage error:', e);
                resolve({ user, sub: null, status: { allowed: true, tier: 0 } });
            }
        });
    });
}

function disableInvoiceButtons() {
    ['#btnCommit','.btnPayOut','[onclick*="commitInvoice"]',
     '[onclick*="placeOrder"]','[onclick*="commitSales"]'].forEach(sel => {
        document.querySelectorAll(sel).forEach(btn => {
            btn.disabled = true;
            btn.style.opacity = '0.4';
            btn.style.cursor  = 'not-allowed';
            btn.title = 'انتهى اشتراكك — جدد للاستمرار';
            btn.onclick = e => {
                e.preventDefault(); e.stopPropagation();
                window.location.href = 'billing.html';
            };
        });
    });
    window.generateInvoiceQR = () => {
        alert('انتهى اشتراكك. جدد للاستمرار.');
        window.location.href = 'billing.html';
    };
}

// ============================================================
// 9. إشعار الأدمن عند تسجيل مستخدم جديد
// ============================================================
export async function notifyAdminNewUser(userEmail, userName, country) {
    try {
        const notifRef = doc(db, 'admin', 'notifications', 'newUsers', Date.now().toString());
        await setDoc(notifRef, {
            userEmail:    userEmail || 'غير محدد',
            userName:     userName  || 'غير محدد',
            country:      country   || 'غير محدد',
            registeredAt: new Date().toISOString(),
            seen:         false
        });
        await fetch('https://api.emailjs.com/api/v1.0/email/send', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                service_id:      'service_ogo1oah',
                template_id:     'template_ca7k80l',
                user_id:         'HSUdjmzBSJr41GPF-',
                template_params: {
                    to_email:   'mfdmfd004@gmail.com',
                    user_name:  userName  || 'غير محدد',
                    user_email: userEmail || 'غير محدد',
                    country:    country   || 'غير محدد',
                    date:       new Date().toLocaleString('ar-SA')
                }
            })
        });
    } catch (e) {
        console.warn('notifyAdminNewUser error:', e);
    }
}
