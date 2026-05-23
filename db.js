// التاجر برو المحاسبي - قاعدة البيانات المركزية (تطوير تراكمي سحابي موحد)
import { db } from "./firebase-config.js";
import { collection, getDocs, doc, setDoc, getDoc, deleteDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

let cart = [];

// ==========================================
// أولاً: دالات التصدير المركزية لقاعدة البيانات
// ==========================================

export async function getAllCustomers() {
    try {
        const snap = await getDocs(collection(db, "customers"));
        return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (e) {
        console.error("خطأ في جلب العملاء مركزياً: ", e);
        return [];
    }
}

export async function getAllItems() {
    try {
        const snap = await getDocs(collection(db, "products"));
        return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (e) {
        console.error("خطأ في جلب الأصناف مركزياً: ", e);
        return [];
    }
}

export async function saveInvoice(invoiceData) {
    try {
        const invoiceId = invoiceData.invoiceNumber || "INV-" + Date.now();
        
        await setDoc(doc(db, "orders", invoiceId), {
            ...invoiceData,
            timestamp: new Date()
        });

        const localInvoices = JSON.parse(localStorage.getItem('altajer_invoices')) || [];
        if (!localInvoices.find(inv => inv.invoiceNumber === invoiceId)) {
            localInvoices.push({ invoiceNumber: invoiceId, ...invoiceData });
            localStorage.setItem('altajer_invoices', JSON.stringify(localInvoices));
        }

        console.log("تم حفظ الفاتورة بنجاح في السحاب والمحلي برقم: " + invoiceId);
        return invoiceId;
    } catch (e) {
        console.error("خطأ أثناء حفظ الفاتورة مركزياً: ", e);
        throw e;
    }
}
// ==========================================
// ثانياً: المحرك الرئيسي الشامل لإدارة العمليات والواجهات (الجزء 1)
// ==========================================
const MainApp = {
    saveAllProducts: async function() {
        const rows = document.querySelectorAll('#product-list tr');
        let productsData = [];
        rows.forEach(row => {
            const id = row.id.replace('row-', '');
            const name = document.getElementById(`p-name-${id}`).value;
            if (name && name.trim() !== "") {
                productsData.push({
                    code: id, 
                    name: name,
                    unit: document.getElementById(`p-unit-${id}`).value,
                    size: document.getElementById(`p-size-${id}`).value,
                    price: parseFloat(document.getElementById(`p-price-${id}`).value) || 0,
                    qty: parseFloat(document.getElementById(`p-qty-${id}`).value) || 0, // مطابقة لقاعدة البيانات حياً
                    quantity: parseFloat(document.getElementById(`p-qty-${id}`).value) || 0,
                    total: parseFloat(document.getElementById(`p-total-${id}`).value) || 0,
                    notes: document.getElementById(`p-notes-${id}`).value,
                    timestamp: new Date()
                });
            }
        });
        if (productsData.length === 0) return alert("الرجاء إدخال بيانات الأصناف أولاً.");
        try {
            for (const product of productsData) {
                await setDoc(doc(db, "products", product.code), product);
            }
            alert("تم حفظ كافة البنود في التاجر برو بنجاح.");
        } catch (e) { alert("خطأ في الاتصال: " + e.message); }
    },

    exportToExcel: function(tableId) {
        const table = document.getElementById(tableId);
        if(!table) return alert("الجدول غير موجود لتصديره.");
        let html = table.outerHTML;
        let url = 'data:application/vnd.ms-excel,' + escape(html);
        let link = document.createElement("a");
        link.download = "مخزون_التاجر.xls"; link.href = url; link.click();
    },

    customer: {
        addOrUpdate: async function() {
            const id = document.getElementById('custId').value.trim();
            const name = document.getElementById('custName').value.trim();
            const vat = document.getElementById('custVat').value.trim();
            const address = document.getElementById('custAddress').value.trim();
            const contact = document.getElementById('custContact').value.trim();
            if (!id || !name) return alert("يرجى إدخال معرّف واسم العميل.");
            try {
                const customerData = { id, name, vat, address, contact, timestamp: new Date() };
                await setDoc(doc(db, "customers", id), customerData);
                
                const localCust = JSON.parse(localStorage.getItem('altajer_customers')) || [];
                const index = localCust.findIndex(c => c.id === id);
                if (index > -1) localCust[index] = customerData; else localCust.push(customerData);
                localStorage.setItem('altajer_customers', JSON.stringify(localCust));

                alert("تم حفظ بيانات العميل بنجاح والمزامنة حية."); 
                this.clearForm();
            } catch (e) { alert("خطأ: " + e.message); }
        },
        search: async function() {
            const id = document.getElementById('custId').value.trim();
            if (!id) return alert("يرجى إدخال معرّف العميل للبحث.");
            try {
                const docSnap = await getDoc(doc(db, "customers", id));
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    document.getElementById('custName').value = data.name || '';
                    document.getElementById('custVat').value = data.vat || '';
                    document.getElementById('custAddress').value = data.address || '';
                    document.getElementById('custContact').value = data.contact || '';
                } else { alert("العميل غير موجود."); }
            } catch (e) { alert("خطأ: " + e.message); }
        },
        delete: async function() {
            const id = document.getElementById('custId').value.trim();
            if (!id) return alert("يرجى إدخال معرّف العميل للحذف.");
            if (!confirm("هل أنت متأكد من الحذف؟")) return;
            try {
                await deleteDoc(doc(db, "customers", id)); 
                let localCust = JSON.parse(localStorage.getItem('altajer_customers')) || [];
                localCust = localCust.filter(c => c.id !== id);
                localStorage.setItem('altajer_customers', JSON.stringify(localCust));
                alert("تم الحذف بنجاح."); 
                this.clearForm();
            } catch (e) { alert("خطأ: " + e.message); }
        },
        clearForm: function() {
            document.getElementById('custId').value = ''; document.getElementById('custName').value = '';
            document.getElementById('custVat').value = ''; document.getElementById('custAddress').value = '';
            document.getElementById('custContact').value = '';
        }
    },

    item: {
        addOrUpdate: async function() {
            const code = document.getElementById('itemCode').value.trim();
            const name = document.getElementById('itemName').value.trim();
            const price = parseFloat(document.getElementById('itemPrice').value) || 0;
            const qty = parseFloat(document.getElementById('itemQty').value) || 0;
            if (!code || !name) return alert("يرجى إدخال كود واسم الصنف.");
            try {
                // حفظ المسميين qty و quantity معاً لضمان عدم حدوث أي خلل مع الفايربيز
                await setDoc(doc(db, "products", code), { code, name, price, qty: qty, quantity: qty, timestamp: new Date() });
                alert("تم حفظ الصنف بالمخزن."); this.clearForm();
            } catch (e) { alert("خطأ: " + e.message); }
        },
        search: async function() {
            const code = document.getElementById('itemCode').value.trim();
            if (!code) return alert("يرجى إدخال كود الصنف للبحث.");
            try {
                const docSnap = await getDoc(doc(db, "products", code));
                if (docSnap.exists()) {
                    const data = docSnap.data();
                    document.getElementById('itemName').value = data.name || '';
                    document.getElementById('itemPrice').value = data.price || 0;
                    document.getElementById('itemQty').value = data.qty || data.quantity || 0;
                } else { alert("الصنف غير موجود."); }
            } catch (e) { alert("خطأ: " + e.message); }
        },
        delete: async function() {
            const code = document.getElementById('itemCode').value.trim();
            if (!code) return alert("يرجى إدخال الكود للحذف.");
            if (!confirm("هل تريد الحذف نهائياً؟")) return;
            try {
                await deleteDoc(doc(db, "products", code)); alert("تم الحذف بنجاح."); this.clearForm();
            } catch (e) { alert("خطأ: " + e.message); }
        },
        clearForm: function() {
            document.getElementById('itemCode').value = ''; document.getElementById('itemName').value = '';
            document.getElementById('itemPrice').value = ''; document.getElementById('itemQty').value = '';
        }
    },
      // 4. نظام الكاشير المحاسبي والربط المزدوج مع وافق والفايربيز وتوليد الـ QR
    pos: {
        addToCart: function() {
            const itemSelect = document.getElementById('cbItem'); const code = itemSelect.value;
            const qtyBought = parseFloat(document.getElementById('poQtyBought').value) || 0;
            const maxQty = parseFloat(document.getElementById('poQtyOnHand').value) || 0;
            if (!code) return alert("اختر صنفاً أولاً.");
            if (qtyBought <= 0 || qtyBought > maxQty) return alert("كمية غير صحيحة أو تجاوزت المتاح بالمخزن.");
            
            const selectedOption = itemSelect.options[itemSelect.selectedIndex];
            const name = selectedOption.text.split(" - ")[0];
            const priceInclTax = parseFloat(selectedOption.dataset.price);
            const existingItem = cart.find(i => i.code === code);
            
            if (existingItem) {
                if ((existingItem.qty + qtyBought) > maxQty) return alert("تجاوزت المتاح بالمخزن لهذه المادة!");
                existingItem.qty += qtyBought; existingItem.subtotal = existingItem.price * existingItem.qty;
            } else {
                cart.push({ code: code, name: name, price: priceInclTax, qty: qtyBought, subtotal: priceInclTax * qtyBought });
            }
            this.updateCartTable(); document.getElementById('poQtyBought').value = '';
        },
        updateCartTable: function() {
            const tbody = document.getElementById('tblPlaceOrder'); if(!tbody) return;
            tbody.innerHTML = ''; let totalExclTax = 0; let totalTax = 0; let finalNet = 0;
            
            cart.forEach((item, index) => {
                const itemPriceExcl = item.price / 1.15; const itemSubtotalExcl = itemPriceExcl * item.qty;
                totalExclTax += itemSubtotalExcl; totalTax += (itemSubtotalExcl * 0.15); finalNet += item.subtotal;
                
                tbody.innerHTML += `<tr>
                    <td>${item.code}</td>
                    <td>${item.name}</td>
                    <td>${itemPriceExcl.toFixed(2)}</td>
                    <td>${item.qty}</td>
                    <td>${item.subtotal.toFixed(2)}</td>
                    <td><button class="btn btn-sm btn-danger" onclick="window.App.pos.removeItem(${index})"><i class="fas fa-trash"></i></button></td>
                </tr>`;
            });
            
            if(document.getElementById('subTotalVal')) document.getElementById('subTotalVal').innerText = totalExclTax.toFixed(2);
            if(document.getElementById('taxVal')) document.getElementById('taxVal').innerText = totalTax.toFixed(2);
            if(document.getElementById('totalVal')) document.getElementById('totalVal').innerText = finalNet.toFixed(2);
        },
        removeItem: function(index) { cart.splice(index, 1); this.updateCartTable(); },
        placeOrder: async function() {
            if (cart.length === 0) return alert("السلة فارغة!");
            try {
                const orderId = "INV-" + Date.now();
                const netTotal = parseFloat(document.getElementById('totalVal').innerText) || 0;
                const discountVal = parseFloat(document.getElementById('poDiscount').value) || 0;
                
                // حسابات الضرائب المعتمدة 15%
                const totalAfterDiscount = netTotal - discountVal;
                const vatAmount = (totalAfterDiscount * 0.15) / 1.15; 
                const totalExclTax = totalAfterDiscount - vatAmount;

                const customerSelect = document.getElementById('cbCustomer');
                const customerName = customerSelect.selectedIndex > 0 ? customerSelect.options[customerSelect.selectedIndex].text : "نقدي";
                const customerVat = document.getElementById('poCustVat') ? document.getElementById('poCustVat').value : "غير ضريبي";
                
                const sellerName = "متجر التاجر برو"; 
                const storeVatNumber = "300000000000003"; 
                const invoiceTimestamp = new Date().toISOString();
                const currentDateString = new Date().toISOString().split('T')[0]; // تعبئة التاريخ تلقائياً لحل مشكلة الحقل الفارغ

                // تجهيز كائن الفاتورة الموحد ليتوافق تماماً مع حقول الفايربيز الحية في حسابك
                const invoiceData = {
                    invoiceNumber: orderId,
                    customer: customerName,
                    customerVat: customerVat,
                    date: currentDateString, 
                    discount: discountVal,
                    items: cart.map(i => ({
                        code: i.code,
                        name: i.name,
                        qty: i.qty,        // تكييف المسمى لـ qty
                        price: i.price,
                        total: i.subtotal  // تكييف المسمى لـ total
                    })),
                    total: totalAfterDiscount, // حقل total المباشر في قاعدتك
                    tax: vatAmount,            // حقل tax المباشر في قاعدتك
                    subtotal: totalExclTax,    // حقل subtotal المباشر في قاعدتك
                    timestamp: invoiceTimestamp,
                    sellerName: sellerName,
                    vatNumber: storeVatNumber
                };

                // 1. ترحيل الفاتورة وحفظها سحابياً ومحلياً في الفايربيز
                await setDoc(doc(db, "orders", orderId), invoiceData);
                
                // 2. 🚀 [الربط المحاسبي التلقائي المباشر مع نظام وافق عبر الـ API]:
                if (typeof window.syncInvoiceWithWafeq === "function") {
                    await window.syncInvoiceWithWafeq(invoiceData);
                } else {
                    console.warn("⚠️ وحدة وافق المحاسبية wafeq-service.js لم تُستدعى بشكل صحيح في الواجهة.");
                }
                
                // 3. تحديث جرد المستودع التراكمي حياً في المسميين لضمان السلامة
                for (const item of cart) {
                    const itemRef = doc(db, "products", item.code); 
                    const itemSnap = await getDoc(itemRef);
                    if (itemSnap.exists()) {
                        const currentQty = parseFloat(itemSnap.data().qty || itemSnap.data().quantity) || 0;
                        await setDoc(itemRef, { quantity: currentQty - item.qty, qty: currentQty - item.qty }, { merge: true });
                    }
                }

                // 4. 🎉 تشغيل محرك الـ QR التلقائي وعرضه فور اعتماد الفاتورة للزكاة
                if (typeof window.generateInvoiceQR === "function") {
                    window.generateInvoiceQR(invoiceData);
                } else {
                    console.error("⚠️ محرك توليد الـ QR غير معرف في الواجهة المركزية.");
                }
                
                alert(`تم اعتماد الفاتورة وتوليد الـ QR وترحيلها بنجاح برقم المرجع: ${orderId}`); 
                cart = []; 
                this.updateCartTable();
            } catch (e) { alert("خطأ في ترحيل الفاتورة: " + e.message); }
        }
    },

    // 5. محرك إدارة مرتجعات المبيعات السحابية التراكمي
    processReturn: async function() {
        const returnRefInput = document.getElementById('return-ref');
        const detailsContainer = document.getElementById('return-details');
        if (!returnRefInput || !returnRefInput.value.trim()) return alert("يرجى إدخل رقم الفاتورة الأصلية.");
        
        const invoiceId = returnRefInput.value.trim();
        detailsContainer.innerHTML = `<i class="fas fa-spinner fa-spin"></i> جاري مراجعة السحاب...`;

        try {
            const docSnap = await getDoc(doc(db, "orders", invoiceId));
            if (!docSnap.exists()) {
                detailsContainer.innerHTML = `<span style="color:#e74c3c;"><i class="fas fa-times-circle"></i> الفاتورة غير موجودة.</span>`;
                return;
            }

            const invData = docSnap.data();
            let itemsHtml = `
                <div style="background: rgba(224,208,213,0.05); padding:12px; border-radius:8px; text-align:right; margin-bottom:15px; border:1px solid #3d1522;">
                    <p style="margin:4px 0;"><b>العميل:</b> ${invData.customer || 'نقدي'}</p>
                    <p style="margin:4px 0;"><b>صافي الفاتورة:</b> ${parseFloat(invData.total || 0).toFixed(2)} ريال</p>
                </div>
                <table style="width:100%; text-align:center; color:#e0d0d5; font-size:0.9rem;">
                    <thead>
                        <tr style="border-bottom:1px solid #3d1522;">
                            <th>الصنف</th>
                            <th>الكمية</th>
                            <th>الإجراء</th>
                        </tr>
                    </thead>
                    <tbody>
            `;

            invData.items.forEach((item, index) => {
                itemsHtml += `
                    <tr>
                        <td>${item.name}</td>
                        <td>${item.qty || item.quantity}</td>
                        <td>
                            <button class="btn btn-sm btn-danger" onclick="window.App.executeItemReturn('${invoiceId}', '${item.code}', ${item.qty || item.quantity}, ${item.price}, ${index})">
                                إرجاع
                            </button>
                        </td>
                    </tr>
                `;
            });

            itemsHtml += `</tbody></table>`;
            detailsContainer.innerHTML = itemsHtml;

        } catch (e) { detailsContainer.innerHTML = `خطأ: ${e.message}`; }
    },

    executeItemReturn: async function(invoiceId, itemCode, qty, price, itemIndex) {
        if (!confirm("هل تريد معالجة إرجاع الصنف وإعادة تدويره بالمخزن؟")) return;
        try {
            const itemRef = doc(db, "products", itemCode);
            const itemSnap = await getDoc(itemRef);
            if (itemSnap.exists()) {
                const currentQty = parseFloat(itemSnap.data().qty || itemSnap.data().quantity) || 0;
                await setDoc(itemRef, { quantity: currentQty + qty, qty: currentQty + qty }, { merge: true });
            }

            const orderRef = doc(db, "orders", invoiceId);
            const orderSnap = await getDoc(orderRef);
            
            if (orderSnap.exists()) {
                let invData = orderSnap.data();
                invData.items.splice(itemIndex, 1);
                
                const currentTotal = parseFloat(invData.total || 0);
                const newTotal = currentTotal - (qty * price);
                invData.total = newTotal;

                if (invData.items.length === 0) {
                    await deleteDoc(orderRef);
                    let localInvoices = JSON.parse(localStorage.getItem('altajer_invoices')) || [];
                    localInvoices = localInvoices.filter(inv => inv.invoiceNumber !== invoiceId);
                    localStorage.setItem('altajer_invoices', JSON.stringify(localInvoices));
                    alert("حُذفت الفاتورة فارغة السجلات بنجاح.");
                } else {
                    await setDoc(orderRef, invData);
                    let localInvoices = JSON.parse(localStorage.getItem('altajer_invoices')) || [];
                    const locIdx = localInvoices.findIndex(inv => inv.invoiceNumber === invoiceId);
                    if (locIdx > -1) {
                        localInvoices[locIdx].items = invData.items;
                        localInvoices[locIdx].total = newTotal;
                        localStorage.setItem('altajer_invoices', JSON.stringify(localInvoices));
                    }
                    alert("تمت معالجة المرتجع وتحديث الحسابات بنجاح.");
                }
            }
            this.processReturn();
        } catch (e) { alert("خطأ: " + e.message); }
    }
};

window.App = MainApp;

// ==========================================
// ثالثاً: تفعيل المستمعات الحية (Real-time Snapshots) وتوجيه الأزرار
// ==========================================
$(document).ready(function() {
    
    onSnapshot(collection(db, "customers"), (snapshot) => {
        const tbody = document.getElementById('customerTableBody'); const cbCustomer = document.getElementById('cbCustomer');
        if(tbody) tbody.innerHTML = '';
        if(cbCustomer) cbCustomer.innerHTML = '<option value="" selected>اختر العميل</option>';
        
        const currentCustData = [];
        snapshot.forEach((doc) => {
            const data = doc.data();
            currentCustData.push(data);
            if(tbody) tbody.innerHTML += `<tr><td>${data.id}</td><td>${data.name}</td><td>${data.vat || '--'}</td><td>${data.contact}</td><td>${data.address}</td></tr>`;
            if(cbCustomer) cbCustomer.innerHTML += `<option value="${data.id}">${data.name}</option>`;
        });
        localStorage.setItem('altajer_customers', JSON.stringify(currentCustData));
        if(document.getElementById('customerCount')) document.getElementById('customerCount').innerText = snapshot.size;
    });

    onSnapshot(collection(db, "products"), (snapshot) => {
        const tbody = document.getElementById('itemTableBody'); const cbItem = document.getElementById('cbItem');
        if(tbody) tbody.innerHTML = '';
        if(cbItem) cbItem.innerHTML = '<option value="" selected>اختر الصنف</option>';
        
        snapshot.forEach((doc) => {
            const data = doc.data();
            const currentQty = data.qty !== undefined ? data.qty : (data.quantity || 0);
            if(tbody) tbody.innerHTML += `<tr><td>${data.code}</td><td>${data.name}</td><td>${parseFloat(data.price || 0).toFixed(2)}</td><td>${currentQty}</td></tr>`;
            if(cbItem) cbItem.innerHTML += `<option value="${data.code}" data-price="${data.price}" data-qty="${currentQty}">${data.name} - ${parseFloat(data.price || 0).toFixed(2)}</option>`;
        });
    });

    onSnapshot(collection(db, "orders"), (snapshot) => {
        const currentInvoicesData = [];
        snapshot.forEach((doc) => {
            currentInvoicesData.push({ invoiceNumber: doc.id, ...doc.data() });
        });
        localStorage.setItem('altajer_invoices', JSON.stringify(currentInvoicesData));
    });

    $('#cbCustomer').change(async function() {
        const id = $(this).val();
        if(id) {
            const docSnap = await getDoc(doc(db, "customers", id));
            if(docSnap.exists()) {
                document.getElementById('poCustId').value = docSnap.data().id;
                document.getElementById('poCustVat').value = docSnap.data().vat || 'غير ضريبي';
            }
        }
    });

    $('#cbItem').change(function() {
        const option = $(this).find('option:selected');
        if($(this).val()) {
            document.getElementById('poItemName').value = option.text().split(" - ")[0];
            document.getElementById('poQtyOnHand').value = option.data('qty');
        }
    });
});

window.calculateTotal = function(code) {
    const price = parseFloat(document.getElementById(`p-price-${code}`).value) || 0;
    const qty = parseFloat(document.getElementById(`p-qty-${code}`).value) || 0;
    if(document.getElementById(`p-total-${code}`)) {
        document.getElementById(`p-total-${code}`).value = (price * qty).toFixed(2);
    }
};

// دالة تشفير حقول الزكاة والضريبة بصيغة TLV لـ ZATCA ثم Base64
function encodeZatcaTLV(sellerName, vatNumber, timestamp, totalAmount, vatAmount) {
    function toTLV(tag, value) {
        let valueBytes = new TextEncoder().encode(value);
        return String.fromCharCode(tag) + String.fromCharCode(valueBytes.length) + String.fromCharCode(...valueBytes);
    }
    let tlv = toTLV(1, sellerName) + toTLV(2, vatNumber) + toTLV(3, timestamp) + toTLV(4, Number(totalAmount).toFixed(2)) + toTLV(5, Number(vatAmount).toFixed(2));
    return btoa(tlv);
}

// الدالة المركزية لتوليد الـ QR Code داخل حاوية الفاتورة
window.generateInvoiceQR = function(invoiceData) {
    const qrContainer = document.getElementById("invoice-qrcode");
    if (!qrContainer) return console.error("لم يتم العثور على عنصر invoice-qrcode");
    qrContainer.innerHTML = ""; 

    try {
        const sellerName = invoiceData.sellerName || "متجر التاجر برو";
        const vatNumber = invoiceData.vatNumber || "300000000000003"; 
        const timestamp = invoiceData.timestamp || new Date().toISOString();
        const totalAmount = invoiceData.total || 0; // مطابقة لحقل total المحدث
        const vatAmount = invoiceData.tax || (totalAmount * 0.15 / 1.15); // مطابقة لحقل tax المحدث

        const base64CodedValue = encodeZatcaTLV(sellerName, vatNumber, timestamp, totalAmount, vatAmount);

        new QRCode(qrContainer, {
            text: base64CodedValue,
            width: 128,
            height: 128,
            colorDark: "#000000",
            colorLight: "#ffffff",
            correctLevel: QRCode.CorrectLevel.M
        });
        console.log("تم توليد الـ QR بنجاح متوافقاً مع ZATCA");
    } catch (e) {
        console.error("فشل في توليد الـ QR:", e);
    }
};
