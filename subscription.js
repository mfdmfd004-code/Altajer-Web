// ============================================================
// نظام الاشتراكات المركزي — تاجر برو
// subscription.js
// ============================================================

import { db } from "./firebase-config.js";
import {
    doc, getDoc, setDoc, updateDoc, serverTimestamp
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { getAuth, onAuthStateChanged }
    from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

// ============================================================
// الثوابت
// ============================================================
const TRIAL_DAYS        = 4;
const WARN_DAYS_WEEK    = 7;
const WARN_DAYS_3       = 3;
const FLOAT_VISIBLE_MS  = 60000; // دقيقة واحدة

// الخطط
export const PLANS = {
    trial:   { label: 'تجريبي',  days: TRIAL_DAYS, price: 0    },
    monthly: { label: 'شهري',    days: 30,          price: 49   },
    yearly:  { label: 'سنوي',    days: 365,         price: 399  }
};

// ============================================================
// 1. جلب / إنشاء بيانات الاشتراك من Firebase
// ============================================================
export async function getSubscription(uid) {
    try {
        const ref  = doc(db, 'users', uid, 'subscription', 'status');
        const snap = await getDoc(ref);

        if (snap.exists()) return snap.data();

        // مستخدم جديد — إنشاء فترة تجريبية
        const now      = new Date();
        const trialEnd = new Date(now.getTime() + TRIAL_DAYS * 86400000);
        const newSub   = {
            plan:                'trial',
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
// 2. تحديث الاشتراك بعد الدفع (يُستدعى من السيرفر أو Webhook)
// ============================================================
export async function activateSubscription(uid, plan) {
    try {
        const ref     = doc(db, 'users', uid, 'subscription', 'status');
        const snap    = await getDoc(ref);
        const current = snap.exists() ? snap.data() : {};

        const now    = new Date();
        let endDate;

        // إذا كان الاشتراك لم ينته بعد — امتد من نهايته
        if (current.subscriptionEndDate) {
            const existingEnd = new Date(current.subscriptionEndDate);
            const base = existingEnd > now ? existingEnd : now;
            endDate = new Date(base.getTime() + PLANS[plan].days * 86400000);
        } else {
            endDate = new Date(now.getTime() + PLANS[plan].days * 86400000);
        }

        const updatedSub = {
            plan,
            status:              'active',
            subscriptionEndDate: endDate.toISOString(),
            lastPaymentAt:       now.toISOString(),
            updatedAt:           serverTimestamp()
        };

        await setDoc(ref, updatedSub, { merge: true });

        // مسح التحذير من الذاكرة
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
    if (!sub) return { allowed: false, status: 'no_sub', daysLeft: 0 };

    const now    = new Date();
    const endDate = new Date(sub.subscriptionEndDate);
    const daysLeft = Math.ceil((endDate - now) / 86400000);

    if (daysLeft <= 0) {
        return { allowed: false, status: 'expired', daysLeft: 0 };
    }
    if (sub.status === 'trial') {
        return { allowed: true, status: 'trial', daysLeft };
    }
    return { allowed: true, status: 'active', daysLeft };
}

// ============================================================
// 4. نظام التحذير الذكي العائم (Floating Warning)
// ============================================================
export function initSubscriptionWarning(sub) {
    try {
        const status = checkSubscriptionStatus(sub);

        // لا تحذير إذا كان النظام يعمل بشكل طبيعي وأكثر من أسبوع
        if (status.allowed && status.daysLeft > WARN_DAYS_WEEK) return;
        if (!status.allowed) {
            showExpiredBlock();
            return;
        }

        // تحقق: هل ظهر التحذير اليوم؟
        const today       = new Date().toDateString();
        const shownToday  = localStorage.getItem('altajer_warn_shown_today');
        if (shownToday === today) return;

        // إنشاء المربع العائم
        createFloatingWarning(status.daysLeft);

        // مراقبة الخمول (Idle) لإعادة الظهور
        setupIdleDetection(sub);
    } catch (e) {
        console.warn('Warning init error:', e);
    }
}

function createFloatingWarning(daysLeft) {
    // إزالة أي تحذير قديم
    const old = document.getElementById('subWarningFloat');
    if (old) old.remove();

    const color  = daysLeft <= WARN_DAYS_3 ? '#e63946' : '#ffb703';
    const icon   = daysLeft <= WARN_DAYS_3 ? '🔴' : '⚠️';
    const msg    = daysLeft <= WARN_DAYS_3
        ? `${icon} تنبيه عاجل! ينتهي اشتراكك خلال ${daysLeft} أيام`
        : `${icon} اشتراكك ينتهي خلال ${daysLeft} يوماً`;

    const box = document.createElement('div');
    box.id    = 'subWarningFloat';
    box.innerHTML = `
        <div id="subWarnInner" style="
            background:${color};color:#fff;
            border-radius:14px;padding:12px 14px;
            box-shadow:0 6px 20px rgba(0,0,0,0.4);
            font-family:'Cairo',sans-serif;font-size:13px;
            min-width:220px;max-width:260px;
            cursor:grab;user-select:none;
            position:relative;">
            <div style="font-weight:700;margin-bottom:4px;">${msg}</div>
            <div id="subWarnCountdown" style="font-size:11px;opacity:0.85;">
                سأختفي بعد دقيقة — اضغط للتجديد
            </div>
            <div style="
                position:absolute;top:6px;left:8px;
                font-size:16px;cursor:pointer;opacity:0.8;"
                onclick="document.getElementById('subWarningFloat').remove()">✕</div>
        </div>`;

    Object.assign(box.style, {
        position:  'fixed',
        top:       '80px',
        right:     '16px',
        zIndex:    '9999',
        transition:'opacity 0.3s'
    });

    // الضغط يفتح صفحة التجديد
    box.querySelector('#subWarnInner').addEventListener('click', function(e) {
        if (e.target.textContent === '✕') return;
        window.location.href = 'billing.html';
    });

    document.body.appendChild(box);

    // جعله قابلاً للسحب
    makeDraggable(box);

    // العد التنازلي
    let seconds = 60;
    const timer = setInterval(() => {
        seconds--;
        const el = document.getElementById('subWarnCountdown');
        if (el) el.textContent = `سأختفي بعد ${seconds} ثانية — اضغط للتجديد`;
        if (seconds <= 0) {
            clearInterval(timer);
            box.style.opacity = '0';
            setTimeout(() => box.remove(), 400);
        }
    }, 1000);

    // تسجيل أنه ظهر اليوم
    localStorage.setItem('altajer_warn_shown_today', new Date().toDateString());
}

function makeDraggable(el) {
    let startX, startY, startRight, startTop;
    const inner = el.querySelector('#subWarnInner');
    if (!inner) return;

    inner.addEventListener('mousedown', dragStart);
    inner.addEventListener('touchstart', e => dragStart(e.touches[0]), { passive: true });

    function dragStart(e) {
        startX     = e.clientX;
        startY     = e.clientY;
        const rect = el.getBoundingClientRect();
        startRight = window.innerWidth  - rect.right;
        startTop   = rect.top;
        el.style.cursor = 'grabbing';

        document.addEventListener('mousemove', dragMove);
        document.addEventListener('mouseup',   dragEnd);
        document.addEventListener('touchmove', e => dragMove(e.touches[0]), { passive: true });
        document.addEventListener('touchend',  dragEnd);
    }

    function dragMove(e) {
        const dx = startX - e.clientX;
        const dy = e.clientY - startY;
        const newRight = Math.max(0, Math.min(window.innerWidth - 220, startRight + dx));
        const newTop   = Math.max(0, Math.min(window.innerHeight - 100, startTop + dy));
        el.style.right = newRight + 'px';
        el.style.top   = newTop + 'px';
    }

    function dragEnd() {
        el.style.cursor = 'grab';
        document.removeEventListener('mousemove', dragMove);
        document.removeEventListener('mouseup',   dragEnd);
    }
}

function setupIdleDetection(sub) {
    let idleTimer;
    const IDLE_MS = 5 * 60 * 1000; // 5 دقائق خمول

    function resetIdle() {
        clearTimeout(idleTimer);
        idleTimer = setTimeout(() => {
            // عاد من الخمول — أعد التحذير
            const status = checkSubscriptionStatus(sub);
            if (status.allowed && status.daysLeft <= WARN_DAYS_WEEK && status.daysLeft > 0) {
                // مسح علامة "ظهر اليوم" حتى يظهر مجدداً بعد الخمول
                localStorage.removeItem('altajer_warn_shown_today');
                createFloatingWarning(status.daysLeft);
            }
        }, IDLE_MS);
    }

    ['mousemove','keydown','touchstart','click'].forEach(evt =>
        document.addEventListener(evt, resetIdle, { passive: true })
    );

    // عند عودة الصفحة من الخلفية
    document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') {
            const status = checkSubscriptionStatus(sub);
            if (status.allowed && status.daysLeft <= WARN_DAYS_WEEK && status.daysLeft > 0) {
                localStorage.removeItem('altajer_warn_shown_today');
                createFloatingWarning(status.daysLeft);
            }
        }
    });
}

// ============================================================
// 5. حجب الميزات عند انتهاء الاشتراك
// ============================================================
export function showExpiredBlock() {
    // إزالة أي حاجب قديم
    const old = document.getElementById('subExpiredOverlay');
    if (old) old.remove();

    const overlay = document.createElement('div');
    overlay.id    = 'subExpiredOverlay';
    overlay.innerHTML = `
        <div style="
            background:linear-gradient(135deg,#1e293b,#0f172a);
            border:2px solid #e63946;border-radius:20px;
            padding:30px 25px;max-width:380px;width:90%;
            text-align:center;font-family:'Cairo',sans-serif;
            box-shadow:0 10px 40px rgba(0,0,0,0.6);">
            <div style="font-size:48px;margin-bottom:10px;">🔒</div>
            <h3 style="color:#e63946;font-weight:900;margin-bottom:8px;">
                انتهت فترة الاشتراك
            </h3>
            <p style="color:rgba(255,255,255,0.7);font-size:13px;margin-bottom:20px;">
                بياناتك ومخازنك محفوظة بالكامل.<br>
                جدد اشتراكك للاستمرار في إصدار الفواتير.
            </p>
            <a href="billing.html" style="
                display:block;background:linear-gradient(135deg,#2b9348,#38b000);
                color:white;padding:13px;border-radius:12px;
                text-decoration:none;font-weight:700;font-size:15px;
                margin-bottom:10px;">
                💳 جدد الاشتراك الآن
            </a>
            <a href="index.html" style="
                display:block;color:rgba(255,255,255,0.4);
                font-size:12px;text-decoration:none;margin-top:8px;">
                العودة للرئيسية (بدون إصدار فواتير)
            </a>
        </div>`;

    Object.assign(overlay.style, {
        position:       'fixed',
        inset:          '0',
        background:     'rgba(0,0,0,0.85)',
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'center',
        zIndex:         '99999',
        backdropFilter: 'blur(6px)'
    });

    document.body.appendChild(overlay);
}

// ============================================================
// 6. تطبيق حماية الصفحات — يُستدعى من أي صفحة
// ============================================================
export async function guardPage(options = {}) {
    const {
        blockOnExpired   = false, // هل تحجب الصفحة كلياً؟
        blockInvoiceOnly = true,  // هل تحجب الفواتير فقط؟
        redirectTo       = 'billing.html'
    } = options;

    const auth = getAuth();

    return new Promise(resolve => {
        onAuthStateChanged(auth, async user => {
            if (!user) {
                window.location.href = 'login.html';
                return;
            }
            try {
                const sub    = await getSubscription(user.uid);
                const status = checkSubscriptionStatus(sub);

                // تشغيل نظام التحذير
                initSubscriptionWarning(sub);

                if (!status.allowed) {
                    if (blockOnExpired) {
                        showExpiredBlock();
                    } else if (blockInvoiceOnly) {
                        // تعطيل أزرار الفاتورة فقط
                        disableInvoiceButtons();
                    }
                }

                resolve({ user, sub, status });
            } catch (e) {
                console.error('guardPage error:', e);
                resolve({ user, sub: null, status: { allowed: true } });
            }
        });
    });
}

function disableInvoiceButtons() {
    const selectors = [
        '#btnCommit', '.btnPayOut',
        '[onclick*="commitInvoice"]',
        '[onclick*="placeOrder"]',
        '[onclick*="commitSales"]'
    ];
    selectors.forEach(sel => {
        document.querySelectorAll(sel).forEach(btn => {
            btn.disabled = true;
            btn.style.opacity    = '0.4';
            btn.style.cursor     = 'not-allowed';
            btn.title            = 'انتهى اشتراكك — جدد للاستمرار';
            btn.onclick          = e => {
                e.preventDefault();
                e.stopPropagation();
                window.location.href = 'billing.html';
            };
        });
    });

    // تعطيل توليد QR
    window.generateInvoiceQR = () => {
        alert('انتهى اشتراكك. جدد للاستمرار في توليد QR كود.');
        window.location.href = 'billing.html';
    };
}
