// التاجر برو المحاسبي - قاعدة البيانات المركزية
import { db } from "./firebase-config.js";
import {
    collection, getDocs, doc, setDoc,
    getDoc, deleteDoc, onSnapshot
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { getAuth, onAuthStateChanged }
    from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { guardPage } from "./subscription.js";

let cart = [];
let currentUserUid = null;

// ==========================================
// انتظار جاهزية المستخدم — الحل الرئيسي للمشكلة
// ==========================================
function waitForUser(timeoutMs = 10000) {
    return new Promise((resolve, reject) => {
        if (currentUserUid) { resolve(currentUserUid); return; }
        const auth = getAuth();
        const unsub = onAuthStateChanged(auth, user => {
            if (user) {
                unsub();
                currentUserUid = user.uid;
                resolve(user.uid);
            }
        });
        setTimeout(() => reject(new Error('انتهت مهلة انتظار تسجيل الدخول')), timeoutMs);
    });
}

// مراقبة حالة تسجيل الدخول
const auth = getAuth();
onAuthStateChanged(auth, (user) => {
    if (user) {
        currentUserUid = user.uid;
        console.log("✅ المستخدم المسجل UID:", currentUserUid);
        initRealtimeListeners();
    } else {
        currentUserUid = null;
        console.warn("⚠️ لم يتم تسجيل الدخول بعد!");
    }
});

// تشغيل حماية الصفحة
document.addEventListener('DOMContentLoaded', async () => {
    try {
        const { status } = await guardPage({
            blockOnExpired:   false,
            blockInvoiceOnly: true
        });
        console.log('Subscription:', status.status, '- Days left:', status.daysLeft);
    } catch(e) {
        console.warn('Guard page error:', e);
    }
});

// ==========================================
// أولاً: دوال التصدير
// ==========================================
export async function getAllCustomers() {
    try {
        const uid = await waitForUser();
        const snap = await getDocs(collection(db, "users", uid, "customers"));
        return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (e) { console.error("خطأ العملاء:", e); return []; }
}

export async function getAllItems() {
    try {
        const uid = await waitForUser();
        const snap = await getDocs(collection(db, "users", uid, "products"));
        return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (e) { console.error("خطأ الأصناف:", e); return []; }
}

export async function saveInvoice(invoiceData) {
    try {
        const uid = await waitForUser();
        const invoiceId = invoiceData.invoiceNumber || "INV-" + Date.now();
        await setDoc(doc(db, "users", uid, "orders", invoiceId), {
            ...invoiceData, timestamp: new Date()
        });
        const local = JSON.parse(localStorage.getItem('altajer_invoices')) || [];
        if (!local.find(i => i.invoiceNumber === invoiceId)) {
            local.push({ invoiceNumber: invoiceId, ...invoiceData });
            localStorage.setItem('altajer_invoices', JSON.stringify(local));
        }
        return invoiceId;
    } catch (e) { console.error("خطأ الفاتورة:", e); throw e; }
}

// ==========================================
// ثانياً: المحرك الرئيسي
// ==========================================
const MainApp = {

    // ===== العملاء =====
    customer: {
        addOrUpdate: async function() {
            try {
                const uid = await waitForUser();
                const id       = (document.getElementById('custId')?.value||'').trim();
                const name     = (document.getElementById('custName')?.value||'').trim();
                const type     = (document.getElementById('custType')?.value||'B2C');
                const vat      = (document.getElementById('custVat')?.value||'').trim();
                const cr       = (document.getElementById('custCR')?.value||'').trim();
                const contact  = (document.getElementById('custContact')?.value||'').trim();
                const city     = (document.getElementById('custCity')?.value||'').trim();
                const district = (document.getElementById('custDistrict')?.value||'').trim();
                const street   = (document.getElementById('custStreet')?.value||'').trim();
                const building = (document.getElementById('custBuilding')?.value||'').trim();
                const postal   = (document.getElementById('custPostal')?.value||'').trim();
                const addNo    = (document.getElementById('custAddNo')?.value||'').trim();

                if (!id || !name) {
                    if(typeof showToast==='function') showToast('يرجى إدخال معرّف واسم العميل.', false);
                    return;
                }
                if (vat !== '') {
                    if (vat.length !== 15 || isNaN(vat)) {
                        if(typeof showToast==='function') showToast('❌ الرقم الضريبي يجب أن يكون 15 خانة رقمية!', false);
                        return;
                    }
                    if (!vat.startsWith('3') || !vat.endsWith('3')) {
                        if(typeof showToast==='function') showToast('❌ الرقم الضريبي يجب أن يبدأ وينتهي بـ 3!', false);
                        return;
                    }
                }
                if ((type === 'B2B' || type === 'GOV') && vat === '') {
                    if(typeof showToast==='function') showToast('⚠️ الرقم الضريبي إلزامي لعملاء B2B والجهات الحكومية!', false);
                    return;
                }

                const customerData = {
                    id, name, type, vat, cr, contact,
                    city, district,
                    street_name: street,
                    building_no: building,
                    postal_code: postal,
                    additional_no: addNo,
                    address: `${city} - ${district} - ${street}`,
                    updated_at: new Date().toISOString(),
                    timestamp: new Date()
                };

                await setDoc(doc(db, "users", uid, "customers", id), customerData, { merge: true });
                const local = JSON.parse(localStorage.getItem('altajer_customers')) || [];
                const idx = local.findIndex(c => c.id === id);
                if (idx > -1) local[idx] = customerData;
                else local.push(customerData);
                localStorage.setItem('altajer_customers', JSON.stringify(local));
                if(typeof showToast==='function') showToast('✅ تم حفظ بيانات العميل بنجاح.', true);
                if (window.clearCustForm) window.clearCustForm();
            } catch (e) {
                if(typeof showToast==='function') showToast('خطأ: ' + e.message, false);
                console.error('customer.addOrUpdate error:', e);
            }
        },

        delete: async function(id) {
            try {
                const uid = await waitForUser();
                const custId = id || (document.getElementById('custId')?.value||'').trim();
                if (!custId) {
                    if(typeof showToast==='function') showToast('يرجى إدخال معرّف العميل للحذف.', false);
                    return;
                }
                if (!confirm('هل أنت متأكد من الحذف؟')) return;
                await deleteDoc(doc(db, "users", uid, "customers", custId));
                let local = JSON.parse(localStorage.getItem('altajer_customers')) || [];
                local = local.filter(c => c.id !== custId);
                localStorage.setItem('altajer_customers', JSON.stringify(local));
                if(typeof showToast==='function') showToast('✅ تم حذف العميل بنجاح.', true);
                if (window.clearCustForm) window.clearCustForm();
            } catch (e) {
                if(typeof showToast==='function') showToast('خطأ: ' + e.message, false);
            }
        }
    },

    // ===== المخزن — الإصلاح الرئيسي هنا =====
    item: {
        addOrUpdate: async function() {
            try {
                // انتظار المستخدم قبل أي شيء
                const uid = await waitForUser();

                const code      = (document.getElementById('itemCode')?.value||'').trim();
                const name      = (document.getElementById('itemName')?.value||'').trim();
                const price     = parseFloat(document.getElementById('itemPrice')?.value)||0;
                const qty       = parseFloat(document.getElementById('itemQty')?.value)||0;
                const category  = document.getElementById('itemCategory')?.value||'';
                const unit      = document.getElementById('itemUnit')?.value||'قطعة';
                const priceType = document.getElementById('itemPriceType')?.value||'inclusive';
                const minQty    = parseFloat(document.getElementById('itemMinQty')?.value)||0;
                const notes     = document.getElementById('itemNotes')?.value||'';

                if (!code || !name) {
                    if(typeof showToast==='function') showToast('يرجى إدخال الكود والاسم.', false);
                    return;
                }
                if (price <= 0) {
                    if(typeof showToast==='function') showToast('يرجى إدخال سعر صحيح.', false);
                    return;
                }

                let priceInclTax, priceExclTax, vatRate;
                if (priceType === 'inclusive') {
                    priceInclTax = price;
                    priceExclTax = price / 1.15;
                    vatRate = 15;
                } else if (priceType === 'exclusive') {
                    priceExclTax = price;
                    priceInclTax = price * 1.15;
                    vatRate = 15;
                } else {
                    priceInclTax = price;
                    priceExclTax = price;
                    vatRate = 0;
                }

                const productData = {
                    code, name, category, unit,
                    price:     parseFloat(priceInclTax.toFixed(2)),
                    priceExcl: parseFloat(priceExclTax.toFixed(2)),
                    priceType, vatRate,
                    qty,
                    quantity:  qty,
                    minQty,
                    notes,
                    updatedAt: new Date().toISOString(),
                    timestamp: new Date()
                };

                console.log('💾 حفظ المنتج:', code, '→ users/', uid, '/products/', code);

                await setDoc(
                    doc(db, "users", uid, "products", code),
                    productData,
                    { merge: true }
                );

                console.log('✅ تم حفظ المنتج بنجاح');
                if(typeof showToast==='function') showToast('✅ تم حفظ الصنف بالمخزن.', true);
                if (window.clearItemForm) window.clearItemForm();

            } catch (e) {
                console.error('❌ item.addOrUpdate error:', e);
                if(typeof showToast==='function')
                    showToast('❌ خطأ في الحفظ: ' + e.message, false);
            }
        },

        delete: async function(code) {
            try {
                const uid = await waitForUser();
                const itemCode = code || (document.getElementById('itemCode')?.value||'').trim();
                if (!itemCode) {
                    if(typeof showToast==='function') showToast('يرجى إدخال الكود للحذف.', false);
                    return;
                }
                if (!confirm('هل تريد الحذف نهائياً؟')) return;
                await deleteDoc(doc(db, "users", uid, "products", itemCode));
                if(typeof showToast==='function') showToast('✅ تم حذف الصنف بنجاح.', true);
                if (window.clearItemForm) window.clearItemForm();
            } catch (e) {
                if(typeof showToast==='function') showToast('خطأ: ' + e.message, false);
            }
        }
    },

    // ===== الكاشير =====
    pos: {
        addToCart: function() {
            const itemSelect = document.getElementById('cbItem');
            const code = itemSelect.value;
            const qtyBought = parseFloat(document.getElementById('poQtyBought').value)||0;
            const maxQty = parseFloat(document.getElementById('poQtyOnHand').value)||0;
            if (!code) {
                if(typeof showToast==='function') showToast('اختر صنفاً أولاً.', false);
                return;
            }
            if (qtyBought <= 0 || qtyBought > maxQty) {
                if(typeof showToast==='function') showToast('كمية غير صحيحة أو تجاوزت المتاح.', false);
                return;
            }
            const opt = itemSelect.options[itemSelect.selectedIndex];
            const name = opt.text.split(" - ")[0];
            const priceInclTax = parseFloat(opt.dataset.price);
            const existing = cart.find(i => i.code === code);
            if (existing) {
                if ((existing.qty + qtyBought) > maxQty) {
                    if(typeof showToast==='function') showToast('تجاوزت الكمية المتاحة!', false);
                    return;
                }
                existing.qty += qtyBought;
                existing.subtotal = existing.price * existing.qty;
            } else {
                cart.push({ code, name, price: priceInclTax, qty: qtyBought, subtotal: priceInclTax * qtyBought });
            }
            this.updateCartTable();
            document.getElementById('poQtyBought').value = 1;
            if(typeof showToast==='function') showToast('✅ تمت الإضافة للسلة.', true);
        },

        updateCartTable: function() {
            const tbody = document.getElementById('tblPlaceOrder');
            if (!tbody) return;
            tbody.innerHTML = '';
            let totalExcl = 0, totalTax = 0, finalNet = 0;
            cart.forEach((item, index) => {
                const priceExcl    = item.price / 1.15;
                const subtotalExcl = priceExcl * item.qty;
                totalExcl += subtotalExcl;
                totalTax  += subtotalExcl * 0.15;
                finalNet  += item.subtotal;
                tbody.innerHTML += `<tr>
                    <td style="font-size:11px;">${item.code}</td>
                    <td>${item.name}</td>
                    <td>${priceExcl.toFixed(2)}</td>
                    <td>${item.qty}</td>
                    <td>${item.subtotal.toFixed(2)}</td>
                    <td><button class="btn btn-sm btn-danger"
                        onclick="window.App.pos.removeItem(${index})"
                        style="padding:2px 6px;">
                        <i class="fas fa-trash"></i></button></td>
                </tr>`;
            });
            const discount = parseFloat(document.getElementById('poDiscount')?.value)||0;
            const net = Math.max(0, finalNet - discount);
            if(document.getElementById('subTotalVal')) document.getElementById('subTotalVal').innerText = totalExcl.toFixed(2);
            if(document.getElementById('taxVal'))      document.getElementById('taxVal').innerText      = totalTax.toFixed(2);
            if(document.getElementById('totalVal'))    document.getElementById('totalVal').innerText    = net.toFixed(2);
        },

        removeItem: function(index) {
            cart.splice(index, 1);
            this.updateCartTable();
            if(typeof showToast==='function') showToast('تم حذف الصنف من السلة.', false);
        },

        onCustomerChange: async function() {
            try {
                const uid = await waitForUser();
                const id  = document.getElementById('cbCustomer')?.value;
                if (id) {
                    const snap = await getDoc(doc(db, "users", uid, "customers", id));
                    if (snap.exists()) {
                        const d = snap.data();
                        if(document.getElementById('poCustId'))  document.getElementById('poCustId').value  = d.id;
                        if(document.getElementById('poCustVat')) document.getElementById('poCustVat').value = d.vat||'غير ضريبي';
                    }
                } else {
                    if(document.getElementById('poCustId'))  document.getElementById('poCustId').value  = '';
                    if(document.getElementById('poCustVat')) document.getElementById('poCustVat').value = '';
                }
            } catch(e) { console.warn('onCustomerChange error:', e); }
        },

        onItemChange: function() {
            const sel = document.getElementById('cbItem');
            const opt = sel?.options[sel.selectedIndex];
            if (sel?.value && opt) {
                if(document.getElementById('poItemName'))  document.getElementById('poItemName').value  = opt.text.split(" - ")[0];
                if(document.getElementById('poQtyOnHand')) document.getElementById('poQtyOnHand').value = opt.dataset.qty;
            }
        },

        placeOrder: async function() {
            try {
                const uid = await waitForUser();
                const settings = JSON.parse(localStorage.getItem('altajer_settings')) || {};
                if (cart.length === 0) {
                    if(typeof showToast==='function') showToast('السلة فارغة!', false);
                    return;
                }
                const orderId            = "INV-" + Date.now();
                const netTotal           = parseFloat(document.getElementById('totalVal').innerText)||0;
                const discountVal        = parseFloat(document.getElementById('poDiscount').value)||0;
                const totalAfterDiscount = Math.max(0, netTotal);
                const vatAmount          = (totalAfterDiscount * 0.15) / 1.15;
                const totalExclTax       = totalAfterDiscount - vatAmount;
                const custSel            = document.getElementById('cbCustomer');
                const customerName       = custSel.selectedIndex > 0
                    ? custSel.options[custSel.selectedIndex].text : "نقدي";
                const customerVat        = document.getElementById('poCustVat')?.value||"غير ضريبي";

                const invoiceData = {
                    invoiceNumber: orderId, customer: customerName, customerVat,
                    date: new Date().toISOString().split('T')[0],
                    discount: discountVal,
                    items: cart.map(i => ({ code: i.code, name: i.name, qty: i.qty, price: i.price, total: i.subtotal })),
                    total: totalAfterDiscount,
                    tax: parseFloat(vatAmount.toFixed(2)),
                    subtotal: parseFloat(totalExclTax.toFixed(2)),
                    timestamp: new Date().toISOString(),
                    sellerName:     settings.companyName  || "متجر التاجر برو",
                    sellerPhone:    settings.phone        || "",
                    sellerVat:      settings.vatNumber    || "",
                    sellerCountry:  settings.country      || "",
                    sellerCurrency: settings.currency     || "SAR",
                    sellerTaxRate:  settings.taxEnabled ? (settings.taxRate || 15) : 15,
                    sellerAddress:  settings.address      || {},
                    vatNumber:      settings.vatNumber    || "300000000000003",
                    invoiceFooter:  settings.invoiceFooter || ""
                };

                await setDoc(doc(db, "users", uid, "orders", orderId), invoiceData);

                if (typeof window.syncInvoiceWithWafeq === "function")
                    await window.syncInvoiceWithWafeq(invoiceData);

                for (const item of cart) {
                    try {
                        const itemRef  = doc(db, "users", uid, "products", item.code);
                        const itemSnap = await getDoc(itemRef);
                        if (itemSnap.exists()) {
                            const curQty = parseFloat(itemSnap.data().qty ?? itemSnap.data().quantity)||0;
                            const newQty = Math.max(0, curQty - item.qty);
                            await setDoc(itemRef, { quantity: newQty, qty: newQty }, { merge: true });
                        }
                    } catch(itemErr) {
                        console.warn('Stock update error:', item.code, itemErr);
                    }
                }

                if (typeof window.generateInvoiceQR === "function")
                    window.generateInvoiceQR(invoiceData);

                sessionStorage.setItem('altajer_print_invoice', JSON.stringify(invoiceData));
                localStorage.setItem('altajer_last_invoice', JSON.stringify(invoiceData));
                if(typeof showToast==='function') showToast(`✅ تم اعتماد الفاتورة: ${orderId}`, true);

                cart = [];
                this.updateCartTable();
                if(document.getElementById('poDiscount'))   document.getElementById('poDiscount').value = 0;
                if(document.getElementById('cbCustomer'))   document.getElementById('cbCustomer').selectedIndex = 0;
                if(document.getElementById('poCustId'))     document.getElementById('poCustId').value = '';
                if(document.getElementById('poCustVat'))    document.getElementById('poCustVat').value = '';

                setTimeout(() => {
                    window.location.href = 'print.html?inv=' + encodeURIComponent(JSON.stringify(invoiceData));
                }, 1500);

            } catch (e) {
                if(typeof showToast==='function') showToast('خطأ في الفاتورة: ' + e.message, false);
                console.error('placeOrder error:', e);
            }
        }
    },

    // ===== المرتجعات =====
    processReturn: async function() {
        try {
            const uid = await waitForUser();
            const input     = document.getElementById('return-ref');
            const container = document.getElementById('return-details');
            if (!input?.value.trim()) {
                if(typeof showToast==='function') showToast('يرجى إدخال رقم الفاتورة.', false);
                return;
            }
            const invoiceId = input.value.trim();
            container.innerHTML = `<i class="fas fa-spinner fa-spin"></i> جاري...`;
            const snap = await getDoc(doc(db, "users", uid, "orders", invoiceId));
            if (!snap.exists()) {
                container.innerHTML = `<span style="color:#e74c3c;">الفاتورة غير موجودة.</span>`;
                return;
            }
            const inv = snap.data();
            let html = `<p><b>العميل:</b> ${inv.customer||'نقدي'}</p>
                <p><b>الصافي:</b> ${parseFloat(inv.total||0).toFixed(2)} ريال</p>
                <table style="width:100%;text-align:center;">
                <thead><tr><th>الصنف</th><th>الكمية</th><th>إرجاع</th></tr></thead><tbody>`;
            inv.items.forEach((item, i) => {
                html += `<tr>
                    <td>${item.name}</td><td>${item.qty||item.quantity}</td>
                    <td><button class="btn btn-sm btn-danger"
                        onclick="window.App.executeItemReturn('${invoiceId}','${item.code}',
                        ${item.qty||item.quantity},${item.price},${i})">إرجاع</button></td>
                </tr>`;
            });
            container.innerHTML = html + `</tbody></table>`;
        } catch (e) {
            const container = document.getElementById('return-details');
            if(container) container.innerHTML = `خطأ: ${e.message}`;
        }
    },

    executeItemReturn: async function(invoiceId, itemCode, qty, price, itemIndex) {
        try {
            const uid = await waitForUser();
            if (!confirm("تأكيد الإرجاع؟")) return;
            const itemRef  = doc(db, "users", uid, "products", itemCode);
            const itemSnap = await getDoc(itemRef);
            if (itemSnap.exists()) {
                const cur = parseFloat(itemSnap.data().qty ?? itemSnap.data().quantity)||0;
                await setDoc(itemRef, { quantity: cur + qty, qty: cur + qty }, { merge: true });
            }
            const orderRef  = doc(db, "users", uid, "orders", invoiceId);
            const orderSnap = await getDoc(orderRef);
            if (orderSnap.exists()) {
                let inv = orderSnap.data();
                inv.items.splice(itemIndex, 1);
                inv.total = parseFloat(inv.total||0) - (qty * price);
                if (inv.items.length === 0) {
                    await deleteDoc(orderRef);
                    if(typeof showToast==='function') showToast('حُذفت الفاتورة بنجاح.', true);
                } else {
                    await setDoc(orderRef, inv);
                    if(typeof showToast==='function') showToast('تمت معالجة المرتجع.', true);
                }
            }
            this.processReturn();
        } catch (e) {
            if(typeof showToast==='function') showToast('خطأ: ' + e.message, false);
        }
    },

    // ===== السندات =====
    voucher: {
        save: async function() {
            try {
                const uid    = await waitForUser();
                const type   = document.getElementById('voucherType')?.value || 'receipt';
                const amount = parseFloat(document.getElementById('voucherAmount')?.value)||0;
                const party  = (document.getElementById('voucherParty')?.value||'').trim();
                const method = document.getElementById('voucherMethod')?.value || 'نقد';
                const date   = document.getElementById('voucherDate')?.value || '';
                const note   = document.getElementById('voucherNote')?.value || '';

                if(!amount || amount <= 0) { if(typeof showToast==='function') showToast('يرجى إدخال مبلغ صحيح', false); return; }
                if(!party)  { if(typeof showToast==='function') showToast('يرجى إدخال اسم الطرف', false); return; }
                if(!date)   { if(typeof showToast==='function') showToast('يرجى اختيار التاريخ', false); return; }

                const voucherId = 'VCH-' + Date.now();
                const data = { id: voucherId, type, amount, party, method, date, note, createdAt: new Date().toISOString() };
                await setDoc(doc(db, 'users', uid, 'vouchers', voucherId), data);
                if(typeof showToast==='function') showToast('✅ تم حفظ السند بنجاح', true);
                if(window.clearVoucherForm) window.clearVoucherForm();
            } catch(e) {
                if(typeof showToast==='function') showToast('خطأ: ' + e.message, false);
            }
        },

        delete: async function(id) {
            try {
                const uid = await waitForUser();
                if(!confirm('حذف هذا السند نهائياً؟')) return;
                await deleteDoc(doc(db, 'users', uid, 'vouchers', id));
                if(typeof showToast==='function') showToast('✅ تم حذف السند', true);
            } catch(e) {
                if(typeof showToast==='function') showToast('خطأ: ' + e.message, false);
            }
        }
    }
};

window.App = MainApp;

// ==========================================
// ثالثاً: المستمعات الحية
// ==========================================
function initRealtimeListeners() {
    if (!currentUserUid) return;

    onSnapshot(collection(db, "users", currentUserUid, "customers"), (snapshot) => {
        const tbody      = document.getElementById('customerTableBody');
        const cbCustomer = document.getElementById('cbCustomer');
        if (tbody)      tbody.innerHTML = '';
        if (cbCustomer) cbCustomer.innerHTML = '<option value="" selected>اختر العميل</option>';
        const list = [];
        snapshot.forEach((d) => {
            const c = d.data();
            list.push(c);
            if (tbody) tbody.innerHTML += `<tr>
                <td>${c.id}</td>
                <td><span style="background:${c.type==='B2B'?'#0077b6':c.type==='GOV'?'#38b000':'#6c757d'};color:white;padding:2px 8px;border-radius:10px;font-size:10px;">${c.type||'B2C'}</span></td>
                <td>${c.name}</td>
                <td style="color:#ffb703;font-size:11px;">${c.vat||'---'}</td>
                <td>${c.contact||'---'}</td>
                <td>${c.city||'---'}</td>
                <td>
                    <button class="btn btn-sm btn-warning" onclick="loadCustomerToEdit('${c.id}')" style="padding:2px 6px;font-size:11px;"><i class="fas fa-edit"></i></button>
                    <button class="btn btn-sm btn-danger" onclick="deleteCustomerById('${c.id}')" style="padding:2px 6px;font-size:11px;margin-right:3px;"><i class="fas fa-trash"></i></button>
                </td>
            </tr>`;
            if (cbCustomer) cbCustomer.innerHTML += `<option value="${c.id}">${c.name}</option>`;
        });
        localStorage.setItem('altajer_customers', JSON.stringify(list));
        const cnt = document.getElementById('customerCount');
        if (cnt) cnt.innerText = snapshot.size;
    });

    onSnapshot(collection(db, "users", currentUserUid, "products"), (snapshot) => {
        const tbody  = document.getElementById('itemTableBody');
        const cbItem = document.getElementById('cbItem');
        if (tbody)  tbody.innerHTML = '';
        if (cbItem) cbItem.innerHTML = '<option value="" selected>اختر الصنف</option>';
        let lowStockCount = 0;
        snapshot.forEach((d) => {
            const data     = d.data();
            const qty      = data.qty !== undefined ? data.qty : (data.quantity||0);
            const code     = data.code || d.id;
            const lowStock = qty > 0 && qty <= (data.minQty||0);
            const outStock = qty === 0;
            if (lowStock || outStock) lowStockCount++;
            if (tbody) tbody.innerHTML += `<tr>
                <td style="font-size:11px;">${code}</td>
                <td>${data.name}</td>
                <td><small>${data.category||'---'}</small></td>
                <td>${parseFloat(data.price||0).toFixed(2)}</td>
                <td style="color:${outStock?'#ef233c':lowStock?'#ffb703':'inherit'};font-weight:bold;">
                    ${qty}${outStock?' ⚠️':lowStock?' 🔶':''}
                </td>
                <td>
                    <button class="btn btn-sm btn-warning" onclick="loadItemToEdit('${code}')" style="padding:2px 6px;font-size:11px;"><i class="fas fa-edit"></i></button>
                    <button class="btn btn-sm btn-danger" onclick="deleteItemById('${code}')" style="padding:2px 6px;font-size:11px;margin-right:3px;"><i class="fas fa-trash"></i></button>
                </td>
            </tr>`;
            if (cbItem) cbItem.innerHTML += `<option value="${code}" data-price="${data.price}" data-qty="${qty}">${data.name} - ${parseFloat(data.price||0).toFixed(2)}</option>`;
        });
        const stockAlert = document.getElementById('stockAlertCount');
        if (stockAlert) stockAlert.innerText = lowStockCount > 0 ? `⚠️ ${lowStockCount} صنف منخفض` : '';
    });

    onSnapshot(collection(db, "users", currentUserUid, "orders"), (snapshot) => {
        const list = [];
        snapshot.forEach(d => list.push({ invoiceNumber: d.id, ...d.data() }));
        localStorage.setItem('altajer_invoices', JSON.stringify(list));
        const cnt = document.getElementById('orderCount');
        if (cnt) cnt.innerText = snapshot.size;
    });

    onSnapshot(collection(db, "users", currentUserUid, "vouchers"), (snapshot) => {
        const tbody = document.getElementById('vouchersTableBody');
        if(!tbody) return;
        tbody.innerHTML = '';
        let totalR = 0, totalP = 0;
        const list = [];
        snapshot.forEach(d => {
            const v = d.data();
            list.push(v);
            if(v.type === 'receipt') totalR += parseFloat(v.amount||0);
            else totalP += parseFloat(v.amount||0);
            const color = v.type === 'receipt' ? '#2b9348' : '#d90429';
            const label = v.type === 'receipt' ? 'قبض' : 'صرف';
            tbody.innerHTML += `<tr>
                <td style="font-size:10px;">${v.id}</td>
                <td><span style="background:${color};color:white;padding:2px 8px;border-radius:10px;font-size:10px;">${label}</span></td>
                <td>${v.party||'—'}</td>
                <td style="font-weight:700;color:${color};">${parseFloat(v.amount||0).toFixed(2)}</td>
                <td>${v.method||'—'}</td>
                <td>${v.date||'—'}</td>
                <td><button class="btn btn-sm btn-info" onclick="printVoucher('${v.id}')" style="padding:2px 6px;font-size:11px;"><i class="fas fa-print"></i></button></td>
                <td><button class="btn btn-sm btn-danger" onclick="window.App.voucher.delete('${v.id}')" style="padding:2px 6px;font-size:11px;"><i class="fas fa-trash"></i></button></td>
            </tr>`;
        });
        const bal = totalR - totalP;
        if(document.getElementById('totalReceipt')) document.getElementById('totalReceipt').innerText = totalR.toFixed(2);
        if(document.getElementById('totalPayment')) document.getElementById('totalPayment').innerText = totalP.toFixed(2);
        if(document.getElementById('totalBalance')) {
            const el = document.getElementById('totalBalance');
            el.innerText    = bal.toFixed(2);
            el.style.color  = bal >= 0 ? 'var(--neon-cyan)' : '#d90429';
        }
        localStorage.setItem('altajer_vouchers', JSON.stringify(list));
    });
}

const discountInput = document.getElementById('poDiscount');
if (discountInput) {
    discountInput.addEventListener('input', () => {
        if (window.App?.pos) window.App.pos.updateCartTable();
    });
}

// ==========================================
// رابعاً: دوال مساعدة عامة
// ==========================================
window.deleteCustomerById = async function(id) {
    try {
        const uid = await waitForUser();
        if (!confirm(`حذف العميل: ${id}?`)) return;
        await deleteDoc(doc(db, "users", uid, "customers", id));
        let local = JSON.parse(localStorage.getItem('altajer_customers'))||[];
        local = local.filter(c => c.id !== id);
        localStorage.setItem('altajer_customers', JSON.stringify(local));
        if(typeof showToast==='function') showToast('✅ تم حذف العميل.', true);
    } catch(e) {
        if(typeof showToast==='function') showToast('خطأ: ' + e.message, false);
    }
};

window.loadCustomerToEdit = function(id) {
    const list = JSON.parse(localStorage.getItem('altajer_customers'))||[];
    const c = list.find(x => x.id === id);
    if (!c) return;
    if(document.getElementById('custId')) {
        document.getElementById('custId').value    = c.id;
        document.getElementById('custId').disabled = true;
    }
    ['custName','custVat','custCR','custContact','custCity','custDistrict'].forEach(field => {
        const key = field.replace('cust','').toLowerCase();
        const el  = document.getElementById(field);
        if(el) el.value = c[key] || c[field.replace('cust','')] || '';
    });
    if(document.getElementById('custType'))     document.getElementById('custType').value     = c.type||'B2C';
    if(document.getElementById('custStreet'))   document.getElementById('custStreet').value   = c.street_name||'';
    if(document.getElementById('custBuilding')) document.getElementById('custBuilding').value = c.building_no||'';
    if(document.getElementById('custPostal'))   document.getElementById('custPostal').value   = c.postal_code||'';
    if(document.getElementById('custAddNo'))    document.getElementById('custAddNo').value    = c.additional_no||'';
    if(window.setCustType) window.setCustType(c.type||'B2C');
    if(document.getElementById('lblCustBtn')) document.getElementById('lblCustBtn').innerText = 'تعديل العميل';
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if(typeof showToast==='function') showToast('جاهز للتعديل — اضغط حفظ بعد التغيير.', true);
};

window.deleteItemById = async function(code) {
    try {
        const uid = await waitForUser();
        if (!confirm(`حذف الصنف: ${code}?`)) return;
        await deleteDoc(doc(db, "users", uid, "products", code));
        if(typeof showToast==='function') showToast('✅ تم حذف الصنف.', true);
    } catch(e) {
        if(typeof showToast==='function') showToast('خطأ: ' + e.message, false);
    }
};

window.loadItemToEdit = async function(code) {
    try {
        const uid  = await waitForUser();
        const snap = await getDoc(doc(db, "users", uid, "products", code));
        if (!snap.exists()) {
            if(typeof showToast==='function') showToast('الصنف غير موجود.', false);
            return;
        }
        const d = snap.data();
        if(document.getElementById('itemCode'))      document.getElementById('itemCode').value      = d.code||code;
        if(document.getElementById('itemName'))      document.getElementById('itemName').value      = d.name||'';
        if(document.getElementById('itemCategory'))  document.getElementById('itemCategory').value  = d.category||'';
        if(document.getElementById('itemUnit'))      document.getElementById('itemUnit').value      = d.unit||'قطعة';
        if(document.getElementById('itemPrice'))     document.getElementById('itemPrice').value     = d.price||0;
        if(document.getElementById('itemPriceType')) document.getElementById('itemPriceType').value = d.priceType||'inclusive';
        if(document.getElementById('itemQty'))       document.getElementById('itemQty').value       = d.qty||d.quantity||0;
        if(document.getElementById('itemMinQty'))    document.getElementById('itemMinQty').value    = d.minQty||0;
        if(document.getElementById('itemNotes'))     document.getElementById('itemNotes').value     = d.notes||'';
        if(typeof switchView==='function') switchView(2);
        window.scrollTo({ top: 0, behavior: 'smooth' });
        if(typeof showToast==='function') showToast('جاهز للتعديل — اضغط حفظ بعد التغيير.', true);
    } catch(e) {
        if(typeof showToast==='function') showToast('خطأ: ' + e.message, false);
    }
};

// ==========================================
// خامساً: QR Code ZATCA
// ==========================================
window.calculateTotal = function(code) {
    const price = parseFloat(document.getElementById(`p-price-${code}`)?.value)||0;
    const qty   = parseFloat(document.getElementById(`p-qty-${code}`)?.value)||0;
    const el = document.getElementById(`p-total-${code}`);
    if (el) el.value = (price * qty).toFixed(2);
};

function encodeZatcaTLV(seller, vat, ts, total, vatAmt) {
    function toTLV(tag, value) {
        const bytes = new TextEncoder().encode(value);
        return String.fromCharCode(tag) +
               String.fromCharCode(bytes.length) +
               String.fromCharCode(...bytes);
    }
    return btoa(
        toTLV(1, seller) + toTLV(2, vat) + toTLV(3, ts) +
        toTLV(4, Number(total).toFixed(2)) +
        toTLV(5, Number(vatAmt).toFixed(2))
    );
}

window.generateInvoiceQR = function(invoiceData) {
    const container = document.getElementById("invoice-qrcode");
    if (!container) return;
    container.innerHTML = "";
    try {
        const qrText = encodeZatcaTLV(
            invoiceData.sellerName || "متجر التاجر برو",
            invoiceData.vatNumber  || "300000000000003",
            invoiceData.timestamp  || new Date().toISOString(),
            invoiceData.total      || 0,
            invoiceData.tax        || ((invoiceData.total||0) * 0.15 / 1.15)
        );
        new QRCode(container, {
            text: qrText, width: 128, height: 128,
            colorDark: "#000000", colorLight: "#ffffff",
            correctLevel: QRCode.CorrectLevel.M
        });
    } catch (e) { console.error("فشل QR:", e); }
};
