// التاجر برو المحاسبي - قاعدة البيانات المركزية (تطوير تراكمي سحابي موحد)
import { db } from "./firebase-config.js";
import { collection, getDocs, doc, setDoc, getDoc, deleteDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

let cart = [];

// ==========================================
// أولاً: دالات التصدير
// ==========================================
export async function getAllCustomers() {
    try {
        const snap = await getDocs(collection(db, "customers"));
        return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (e) { console.error("خطأ العملاء:", e); return []; }
}

export async function getAllItems() {
    try {
        const snap = await getDocs(collection(db, "products"));
        return snap.docs.map(d => ({ id: d.id, ...d.data() }));
    } catch (e) { console.error("خطأ الأصناف:", e); return []; }
}

export async function saveInvoice(invoiceData) {
    try {
        const invoiceId = invoiceData.invoiceNumber || "INV-" + Date.now();
        await setDoc(doc(db, "orders", invoiceId), { ...invoiceData, timestamp: new Date() });
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

            if (!id || !name) return alert("يرجى إدخال معرّف واسم العميل.");

            if (vat !== '') {
                if (vat.length !== 15 || isNaN(vat))
                    return alert("❌ الرقم الضريبي يجب أن يكون 15 خانة رقمية!");
                if (!vat.startsWith('3') || !vat.endsWith('3'))
                    return alert("❌ الرقم الضريبي يجب أن يبدأ وينتهي بـ 3!");
            }
            if ((type === 'B2B' || type === 'GOV') && vat === '')
                return alert("⚠️ الرقم الضريبي إلزامي لعملاء B2B والجهات الحكومية!");

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

            try {
                await setDoc(doc(db, "customers", id), customerData, { merge: true });
                const local = JSON.parse(localStorage.getItem('altajer_customers')) || [];
                const idx = local.findIndex(c => c.id === id);
                if (idx > -1) local[idx] = customerData;
                else local.push(customerData);
                localStorage.setItem('altajer_customers', JSON.stringify(local));
                alert("✅ تم حفظ بيانات العميل بنجاح.");
                if (window.clearCustForm) window.clearCustForm();
            } catch (e) { alert("خطأ: " + e.message); }
        },

        delete: async function() {
            const id = (document.getElementById('custId')?.value||'').trim();
            if (!id) return alert("يرجى إدخال معرّف العميل للحذف.");
            if (!confirm("هل أنت متأكد من الحذف؟")) return;
            try {
                await deleteDoc(doc(db, "customers", id));
                let local = JSON.parse(localStorage.getItem('altajer_customers')) || [];
                local = local.filter(c => c.id !== id);
                localStorage.setItem('altajer_customers', JSON.stringify(local));
                alert("تم الحذف بنجاح.");
                if (window.clearCustForm) window.clearCustForm();
            } catch (e) { alert("خطأ: " + e.message); }
        }
    },

    // ===== المخزن =====
    item: {
        addOrUpdate: async function() {
            const code      = (document.getElementById('itemCode')?.value||'').trim();
            const name      = (document.getElementById('itemName')?.value||'').trim();
            const price     = parseFloat(document.getElementById('itemPrice')?.value)||0;
            const qty       = parseFloat(document.getElementById('itemQty')?.value)||0;
            const category  = document.getElementById('itemCategory')?.value||'';
            const unit      = document.getElementById('itemUnit')?.value||'قطعة';
            const priceType = document.getElementById('itemPriceType')?.value||'inclusive';
            const minQty    = parseFloat(document.getElementById('itemMinQty')?.value)||0;
            const notes     = document.getElementById('itemNotes')?.value||'';

            if (!code || !name) return alert("يرجى إدخال الكود والاسم.");

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

            try {
                await setDoc(doc(db, "products", code), {
                    code, name, category, unit,
                    price: priceInclTax,
                    priceExcl: parseFloat(priceExclTax.toFixed(2)),
                    priceType, vatRate,
                    qty, quantity: qty,
                    minQty, notes,
                    timestamp: new Date()
                });
                alert("✅ تم حفظ الصنف بالمخزن.");
                if (window.clearItemForm) window.clearItemForm();
            } catch (e) { alert("خطأ: " + e.message); }
        },

        delete: async function() {
            const code = (document.getElementById('itemCode')?.value||'').trim();
            if (!code) return alert("يرجى إدخال الكود للحذف.");
            if (!confirm("هل تريد الحذف نهائياً؟")) return;
            try {
                await deleteDoc(doc(db, "products", code));
                alert("تم الحذف بنجاح.");
                if (window.clearItemForm) window.clearItemForm();
            } catch (e) { alert("خطأ: " + e.message); }
        }
    },

    // ===== الكاشير =====
    pos: {
        addToCart: function() {
            const itemSelect = document.getElementById('cbItem');
            const code = itemSelect.value;
            const qtyBought = parseFloat(document.getElementById('poQtyBought').value)||0;
            const maxQty = parseFloat(document.getElementById('poQtyOnHand').value)||0;
            if (!code) return alert("اختر صنفاً أولاً.");
            if (qtyBought <= 0 || qtyBought > maxQty) return alert("كمية غير صحيحة أو تجاوزت المتاح.");
            const opt = itemSelect.options[itemSelect.selectedIndex];
            const name = opt.text.split(" - ")[0];
            const priceInclTax = parseFloat(opt.dataset.price);
            const existing = cart.find(i => i.code === code);
            if (existing) {
                if ((existing.qty + qtyBought) > maxQty) return alert("تجاوزت المتاح!");
                existing.qty += qtyBought;
                existing.subtotal = existing.price * existing.qty;
            } else {
                cart.push({ code, name, price: priceInclTax, qty: qtyBought, subtotal: priceInclTax * qtyBought });
            }
            this.updateCartTable();
            document.getElementById('poQtyBought').value = '';
        },

        updateCartTable: function() {
            const tbody = document.getElementById('tblPlaceOrder');
            if (!tbody) return;
            tbody.innerHTML = '';
            let totalExcl = 0, totalTax = 0, finalNet = 0;
            cart.forEach((item, index) => {
                const priceExcl = item.price / 1.15;
                const subtotalExcl = priceExcl * item.qty;
                totalExcl += subtotalExcl;
                totalTax += subtotalExcl * 0.15;
                finalNet += item.subtotal;
                tbody.innerHTML += `<tr>
                    <td>${item.code}</td>
                    <td>${item.name}</td>
                    <td>${priceExcl.toFixed(2)}</td>
                    <td>${item.qty}</td>
                    <td>${item.subtotal.toFixed(2)}</td>
                    <td><button class="btn btn-sm btn-danger"
                        onclick="window.App.pos.removeItem(${index})">
                        <i class="fas fa-trash"></i></button></td>
                </tr>`;
            });
            if(document.getElementById('subTotalVal'))
                document.getElementById('subTotalVal').innerText = totalExcl.toFixed(2);
            if(document.getElementById('taxVal'))
                document.getElementById('taxVal').innerText = totalTax.toFixed(2);
            if(document.getElementById('totalVal'))
                document.getElementById('totalVal').innerText = finalNet.toFixed(2);
        },

        removeItem: function(index) {
            cart.splice(index, 1);
            this.updateCartTable();
        },

        placeOrder: async function() {
            if (cart.length === 0) return alert("السلة فارغة!");
            try {
                const orderId = "INV-" + Date.now();
                const netTotal = parseFloat(document.getElementById('totalVal').innerText)||0;
                const discountVal = parseFloat(document.getElementById('poDiscount').value)||0;
                const totalAfterDiscount = netTotal - discountVal;
                const vatAmount = (totalAfterDiscount * 0.15) / 1.15;
                const totalExclTax = totalAfterDiscount - vatAmount;
                const custSel = document.getElementById('cbCustomer');
                const customerName = custSel.selectedIndex > 0
                    ? custSel.options[custSel.selectedIndex].text : "نقدي";
                const customerVat = document.getElementById('poCustVat')?.value||"غير ضريبي";

                const invoiceData = {
                    invoiceNumber: orderId,
                    customer: customerName,
                    customerVat,
                    date: new Date().toISOString().split('T')[0],
                    discount: discountVal,
                    items: cart.map(i => ({
                        code: i.code, name: i.name,
                        qty: i.qty, price: i.price, total: i.subtotal
                    })),
                    total: totalAfterDiscount,
                    tax: vatAmount,
                    subtotal: totalExclTax,
                    timestamp: new Date().toISOString(),
                    sellerName: "متجر التاجر برو",
                    vatNumber: "300000000000003"
                };

                await setDoc(doc(db, "orders", orderId), invoiceData);

                if (typeof window.syncInvoiceWithWafeq === "function")
                    await window.syncInvoiceWithWafeq(invoiceData);

                for (const item of cart) {
                    const itemRef = doc(db, "products", item.code);
                    const itemSnap = await getDoc(itemRef);
                    if (itemSnap.exists()) {
                        const curQty = parseFloat(itemSnap.data().qty ?? itemSnap.data().quantity)||0;
                        await setDoc(itemRef, { quantity: curQty - item.qty, qty: curQty - item.qty }, { merge: true });
                    }
                }

                if (typeof window.generateInvoiceQR === "function")
                    window.generateInvoiceQR(invoiceData);

                alert(`✅ تم اعتماد الفاتورة برقم: ${orderId}`);
                cart = [];
                this.updateCartTable();
            } catch (e) { alert("خطأ في الفاتورة: " + e.message); }
        }
    },

    processReturn: async function() {
        const input = document.getElementById('return-ref');
        const container = document.getElementById('return-details');
        if (!input?.value.trim()) return alert("يرجى إدخال رقم الفاتورة.");
        const invoiceId = input.value.trim();
        container.innerHTML = `<i class="fas fa-spinner fa-spin"></i> جاري...`;
        try {
            const snap = await getDoc(doc(db, "orders", invoiceId));
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
        } catch (e) { container.innerHTML = `خطأ: ${e.message}`; }
    },

    executeItemReturn: async function(invoiceId, itemCode, qty, price, itemIndex) {
        if (!confirm("تأكيد الإرجاع؟")) return;
        try {
            const itemRef = doc(db, "products", itemCode);
            const itemSnap = await getDoc(itemRef);
            if (itemSnap.exists()) {
                const cur = parseFloat(itemSnap.data().qty ?? itemSnap.data().quantity)||0;
                await setDoc(itemRef, { quantity: cur+qty, qty: cur+qty }, { merge: true });
            }
            const orderRef = doc(db, "orders", invoiceId);
            const orderSnap = await getDoc(orderRef);
            if (orderSnap.exists()) {
                let inv = orderSnap.data();
                inv.items.splice(itemIndex, 1);
                inv.total = parseFloat(inv.total||0) - (qty * price);
                if (inv.items.length === 0) {
                    await deleteDoc(orderRef);
                    alert("حُذفت الفاتورة بنجاح.");
                } else {
                    await setDoc(orderRef, inv);
                    alert("تمت معالجة المرتجع.");
                }
            }
            this.processReturn();
        } catch (e) { alert("خطأ: " + e.message); }
    }
};

window.App = MainApp;

// ==========================================
// ثالثاً: المستمعات الحية
// ==========================================
function initRealtimeListeners() {

    // ===== العملاء =====
    onSnapshot(collection(db, "customers"), (snapshot) => {
        const tbody = document.getElementById('customerTableBody');
        const cbCustomer = document.getElementById('cbCustomer');
        if (tbody) tbody.innerHTML = '';
        if (cbCustomer) cbCustomer.innerHTML = '<option value="" selected>اختر العميل</option>';
        const list = [];
        snapshot.forEach((d) => {
            const c = d.data();
            list.push(c);
            if (tbody) tbody.innerHTML += `<tr>
                <td>${c.id}</td>
                <td><span style="background:${
                    c.type==='B2B'?'#0077b6':c.type==='GOV'?'#38b000':'#6c757d'
                };color:white;padding:2px 8px;border-radius:10px;font-size:10px;">
                    ${c.type||'B2C'}</span></td>
                <td>${c.name}</td>
                <td style="color:#ffb703;font-size:11px;">${c.vat||'---'}</td>
                <td>${c.contact||'---'}</td>
                <td>${c.city||'---'}</td>
                <td>
                    <button class="btn btn-sm btn-warning"
                        onclick="loadCustomerToEdit('${c.id}')"
                        style="padding:2px 6px;font-size:11px;">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-danger"
                        onclick="deleteCustomerById('${c.id}')"
                        style="padding:2px 6px;font-size:11px;margin-right:3px;">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>`;
            if (cbCustomer) cbCustomer.innerHTML +=
                `<option value="${c.id}">${c.name}</option>`;
        });
        localStorage.setItem('altajer_customers', JSON.stringify(list));
        const cnt = document.getElementById('customerCount');
        if (cnt) cnt.innerText = snapshot.size;
    });

    // ===== المنتجات =====
    onSnapshot(collection(db, "products"), (snapshot) => {
        const tbody = document.getElementById('itemTableBody');
        const cbItem = document.getElementById('cbItem');
        if (tbody) tbody.innerHTML = '';
        if (cbItem) cbItem.innerHTML = '<option value="" selected>اختر الصنف</option>';
        snapshot.forEach((d) => {
            const data = d.data();
            const qty = data.qty !== undefined ? data.qty : (data.quantity||0);
            const code = data.code || d.id;
            const lowStock = qty > 0 && qty <= (data.minQty||0);
            const outStock = qty === 0;
            if (tbody) tbody.innerHTML += `<tr>
                <td style="font-size:11px;">${code}</td>
                <td>${data.name}</td>
                <td><small style="color:var(--text-muted);">${data.category||'---'}</small></td>
                <td>${parseFloat(data.price||0).toFixed(2)}</td>
                <td style="color:${outStock?'#ef233c':lowStock?'#ffb703':'inherit'};font-weight:bold;">
                    ${qty}${outStock?' ⚠️':lowStock?' 🔶':''}
                </td>
                <td>
                    <button class="btn btn-sm btn-warning"
                        onclick="loadItemToEdit('${code}')"
                        style="padding:2px 6px;font-size:11px;">
                        <i class="fas fa-edit"></i>
                    </button>
                    <button class="btn btn-sm btn-danger"
                        onclick="deleteItemById('${code}')"
                        style="padding:2px 6px;font-size:11px;margin-right:3px;">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            </tr>`;
            if (cbItem) cbItem.innerHTML +=
                `<option value="${code}" data-price="${data.price}"
                 data-qty="${qty}">${data.name} - ${parseFloat(data.price||0).toFixed(2)}</option>`;
        });
    });

    // ===== الطلبات =====
    onSnapshot(collection(db, "orders"), (snapshot) => {
        const list = [];
        snapshot.forEach(d => list.push({ invoiceNumber: d.id, ...d.data() }));
        localStorage.setItem('altajer_invoices', JSON.stringify(list));
        const cnt = document.getElementById('orderCount');
        if (cnt) cnt.innerText = snapshot.size;
    });

    // ===== تغيير العميل في الكاشير =====
    const cbCustomer = document.getElementById('cbCustomer');
    if (cbCustomer) {
        cbCustomer.addEventListener('change', async function() {
            const id = this.value;
            if (id) {
                const snap = await getDoc(doc(db, "customers", id));
                if (snap.exists()) {
                    const d = snap.data();
                    if(document.getElementById('poCustId'))
                        document.getElementById('poCustId').value = d.id;
                    if(document.getElementById('poCustVat'))
                        document.getElementById('poCustVat').value = d.vat||'غير ضريبي';
                }
            }
        });
    }

    // ===== تغيير الصنف في الكاشير =====
    const cbItem = document.getElementById('cbItem');
    if (cbItem) {
        cbItem.addEventListener('change', function() {
            const opt = this.options[this.selectedIndex];
            if (this.value) {
                if(document.getElementById('poItemName'))
                    document.getElementById('poItemName').value = opt.text.split(" - ")[0];
                if(document.getElementById('poQtyOnHand'))
                    document.getElementById('poQtyOnHand').value = opt.dataset.qty;
            }
        });
    }
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initRealtimeListeners);
} else {
    initRealtimeListeners();
}

// ==========================================
// رابعاً: دوال مساعدة عامة
// ==========================================

// حذف عميل من الجدول مباشرة
window.deleteCustomerById = async function(id) {
    if (!confirm(`حذف العميل: ${id}?`)) return;
    try {
        await deleteDoc(doc(db, "customers", id));
        let local = JSON.parse(localStorage.getItem('altajer_customers'))||[];
        local = local.filter(c => c.id !== id);
        localStorage.setItem('altajer_customers', JSON.stringify(local));
        if(typeof showToast === 'function') showToast('تم حذف العميل.', false);
    } catch(e) { alert("خطأ: " + e.message); }
};

// تحميل بيانات العميل للتعديل
window.loadCustomerToEdit = function(id) {
    const list = JSON.parse(localStorage.getItem('altajer_customers'))||[];
    const c = list.find(x => x.id === id);
    if (!c) return;
    if(document.getElementById('custId')) {
        document.getElementById('custId').value = c.id;
        document.getElementById('custId').disabled = true;
    }
    if(document.getElementById('custName')) document.getElementById('custName').value = c.name||'';
    if(document.getElementById('custType')) document.getElementById('custType').value = c.type||'B2C';
    if(window.setCustType) window.setCustType(c.type||'B2C');
    if(document.getElementById('custVat')) document.getElementById('custVat').value = c.vat||'';
    if(document.getElementById('custCR')) document.getElementById('custCR').value = c.cr||'';
    if(document.getElementById('custContact')) document.getElementById('custContact').value = c.contact||'';
    if(document.getElementById('custCity')) document.getElementById('custCity').value = c.city||'';
    if(document.getElementById('custDistrict')) document.getElementById('custDistrict').value = c.district||'';
    if(document.getElementById('custStreet')) document.getElementById('custStreet').value = c.street_name||'';
    if(document.getElementById('custBuilding')) document.getElementById('custBuilding').value = c.building_no||'';
    if(document.getElementById('custPostal')) document.getElementById('custPostal').value = c.postal_code||'';
    if(document.getElementById('custAddNo')) document.getElementById('custAddNo').value = c.additional_no||'';
    if(document.getElementById('lblCustBtn')) document.getElementById('lblCustBtn').innerText = 'تعديل العميل';
    window.scrollTo({ top: 0, behavior: 'smooth' });
    if(typeof showToast === 'function') showToast('جاهز للتعديل — اضغط حفظ بعد التغيير.', true);
};

// حذف صنف من الجدول مباشرة
window.deleteItemById = async function(code) {
    if (!confirm(`حذف الصنف: ${code}?`)) return;
    try {
        await deleteDoc(doc(db, "products", code));
        if(typeof showToast === 'function') showToast('تم حذف الصنف.', false);
    } catch(e) { alert("خطأ: " + e.message); }
};

// تحميل بيانات الصنف للتعديل
window.loadItemToEdit = async function(code) {
    try {
        const snap = await getDoc(doc(db, "products", code));
        if (!snap.exists()) return alert("الصنف غير موجود.");
        const d = snap.data();
        if(document.getElementById('itemCode')) document.getElementById('itemCode').value = d.code||code;
        if(document.getElementById('itemName')) document.getElementById('itemName').value = d.name||'';
        if(document.getElementById('itemCategory')) document.getElementById('itemCategory').value = d.category||'';
        if(document.getElementById('itemUnit')) document.getElementById('itemUnit').value = d.unit||'قطعة';
        if(document.getElementById('itemPrice')) document.getElementById('itemPrice').value = d.price||0;
        if(document.getElementById('itemPriceType')) document.getElementById('itemPriceType').value = d.priceType||'inclusive';
        if(document.getElementById('itemQty')) document.getElementById('itemQty').value = d.qty||d.quantity||0;
        if(document.getElementById('itemMinQty')) document.getElementById('itemMinQty').value = d.minQty||0;
        if(document.getElementById('itemNotes')) document.getElementById('itemNotes').value = d.notes||'';
        window.scrollTo({ top: 0, behavior: 'smooth' });
        if(typeof showToast === 'function') showToast('جاهز للتعديل — اضغط حفظ بعد التغيير.', true);
    } catch(e) { alert("خطأ: " + e.message); }
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
        toTLV(1,seller) + toTLV(2,vat) + toTLV(3,ts) +
        toTLV(4,Number(total).toFixed(2)) +
        toTLV(5,Number(vatAmt).toFixed(2))
    );
}

window.generateInvoiceQR = function(invoiceData) {
    const container = document.getElementById("invoice-qrcode");
    if (!container) return;
    container.innerHTML = "";
    try {
        const qrText = encodeZatcaTLV(
            invoiceData.sellerName||"متجر التاجر برو",
            invoiceData.vatNumber ||"300000000000003",
            invoiceData.timestamp ||new Date().toISOString(),
            invoiceData.total||0,
            invoiceData.tax||((invoiceData.total||0)*0.15/1.15)
        );
        new QRCode(container, {
            text: qrText, width: 128, height: 128,
            colorDark: "#000000", colorLight: "#ffffff",
            correctLevel: QRCode.CorrectLevel.M
        });
    } catch (e) { console.error("فشل QR:", e); }
};
