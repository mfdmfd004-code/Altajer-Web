// التاجر برو المحاسبي - قاعدة البيانات المركزية والمحرك الرئيسي الشامل (تطوير تراكمي سحابي موحد)
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getFirestore, collection, getDocs, doc, setDoc, getDoc, deleteDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";

// إعدادات Firebase الخاصة بك (تأكد من وضع بيانات مشروعك الحية هنا لتفعيل الاتصال السحابي فوراً)
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_AUTH_DOMAIN",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_STORAGE_BUCKET",
    messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
    appId: "YOUR_APP_ID"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

let cart = [];

// ==========================================
// أولاً: دالات التصدير المركزية لقاعدة البيانات (لربط الملفات الخارجية والـ index)
// ==========================================

// دالة جلب كل العملاء لوضعهم في القائمة (ComboBox) في الفاتورة والواجهات الأخرى
export async function getAllCustomers() {
    try {
        const snap = await getDocs(collection(db, "customers"));
        return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (e) {
        console.error("خطأ في جلب العملاء مركزياً: ", e);
        return [];
    }
}

// دالة جلب كل المنتجات - تم توحيد المسمى إلى كولكشن products ليتوافق مع المخزن الرئيسي
export async function getAllItems() {
    try {
        const snap = await getDocs(collection(db, "products"));
        return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (e) {
        console.error("خطأ في جلب الأصناف مركزياً: ", e);
        return [];
    }
}

// دالة حفظ الفاتورة وتحديث المخزن التراكمي المباشر
export async function saveInvoice(invoiceData) {
    try {
        const invoiceId = invoiceData.invoiceId || "INV-" + Date.now();
        
        // حفظ الفاتورة سحابياً في كولكشن orders الموحد لضمان قراءة العدادات حياً
        await setDoc(doc(db, "orders", invoiceId), {
            ...invoiceData,
            timestamp: new Date()
        });

        // مزامنة البيانات محلياً أيضاً لتغذية كروت الداش بورد دون انقطاع
        const localInvoices = JSON.parse(localStorage.getItem('altajer_invoices')) || [];
        // فحص لمنع تكرار نفس الفاتورة محلياً
        if (!localInvoices.find(inv => inv.invoiceId === invoiceId)) {
            localInvoices.push({ invoiceId, ...invoiceData });
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
// ثانياً: المحرك الرئيسي الشامل لإدارة العمليات والواجهات
// ==========================================
const MainApp = {
    // 1. إدارة المخزن والمنتجات الجماعية
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

    // 2. إدارة ملفات وبيانات العملاء
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
                
                // مزامنة الذاكرة المحلية للعملاء فوراً لتحديث كروت الداش بورد تلقائياً
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
                
                // الحذف من الذاكرة المحلية لمطابقة لوحة التحكم
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

    // 3. التحكم الفردي في عناصر المخزن
    item: {
        addOrUpdate: async function() {
            const code = document.getElementById('itemCode').value.trim();
            const name = document.getElementById('itemName').value.trim();
            const price = parseFloat(document.getElementById('itemPrice').value) || 0;
            const qty = parseFloat(document.getElementById('itemQty').value) || 0;
            if (!code || !name) return alert("يرجى إدخال كود واسم الصنف.");
            try {
                await setDoc(doc(db, "products", code), { code, name, price, quantity: qty, timestamp: new Date() });
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
                    document.getElementById('itemQty').value = data.quantity || 0;
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

    // 4. نظام الكاشير المحاسبي وحسابات الضريبة (15%) وخصم المخزن
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
                const customerId = document.getElementById('poCustId').value || "نقدي";
                
                // تصحيح فوري: استخدام حقل total_net لمطابقة محرك حسابات الداش بورد تماماً
                const invoiceData = {
                    invoiceId: orderId,
                    customerId: customerId,
                    items: cart,
                    total_net: netTotal 
                };

                // استدعاء دالة الحفظ المركزية المحدثة سحابياً ومحلياً
                await saveInvoice(invoiceData);
                
                // 🚀 [الربط الصامت والمدمج مع وافق]: إرسال البيانات الموحدة فوراً دون التأثير على الكاشير
                if (typeof window.syncInvoiceWithWafeq === "function") {
                    window.syncInvoiceWithWafeq(invoiceData);
                } else {
                    console.warn("⚠️ وحدة وافق المحاسبية غير مستدعاة في صفحة الـ HTML بعد.");
                }
                
                // تحديث وإدارة جرد المخزن التراكمي بخصم الكميات المشتراة حياً
                for (const item of cart) {
                    const itemRef = doc(db, "products", item.code); 
                    const itemSnap = await getDoc(itemRef);
                    if (itemSnap.exists()) {
                        const currentQty = parseFloat(itemSnap.data().quantity) || 0;
                        await setDoc(itemRef, { quantity: currentQty - item.qty }, { merge: true });
                    }
                }
                
                // ميزة توليد الـ QR للفاتورة الإلكترونية
                if(typeof window.generateInvoiceQR === "function") {
                    window.generateInvoiceQR(orderId, netTotal);
                }
                
                alert(`حُفظت الفاتورة برقم: ${orderId}`); 
                cart = []; 
                this.updateCartTable();
            } catch (e) { alert("خطأ في معالجة الفاتورة: " + e.message); }
        }
    },

    // 5. محرك إدارة مرتجعات المبيعات السحابية - (تم البناء والتأمين للتطوير التراكمي خطوة بخطوة)
    processReturn: async function() {
        const returnRefInput = document.getElementById('return-ref');
        const detailsContainer = document.getElementById('return-details');
        if (!returnRefInput || !returnRefInput.value.trim()) return alert("يرجى إدخال رقم الفاتورة الأصلية أولاً.");
        
        const invoiceId = returnRefInput.value.trim();
        detailsContainer.innerHTML = `<i class="fas fa-spinner fa-spin"></i> جاري جلب ومراجعة الفاتورة سحابياً...`;

        try {
            const docSnap = await getDoc(doc(db, "orders", invoiceId));
            if (!docSnap.exists()) {
                detailsContainer.innerHTML = `<span style="color:#e74c3c;"><i class="fas fa-times-circle"></i> الفاتورة غير موجودة بالنظام المحاسبي، يرجى التحقق من الرقم المرجعي.</span>`;
                return;
            }

            const invData = docSnap.data();
            let itemsHtml = `
                <div style="background: rgba(224,208,213,0.05); padding:12px; border-radius:8px; text-align:right; margin-bottom:15px; border:1px solid #3d1522;">
                    <p style="margin:4px 0;"><b>معرّف العميل:</b> ${invData.customerId}</p>
                    <p style="margin:4px 0;"><b>صافي الفاتورة:</b> ${parseFloat(invData.total_net || 0).toFixed(2)} ريال</p>
                </div>
                <table style="width:100%; border-collapse:collapse; color:#e0d0d5; font-size:0.9rem; text-align:center;">
                    <thead>
                        <tr style="border-bottom:1px solid #3d1522; color:#a09095;">
                            <th style="padding:8px;">الصنف</th>
                            <th style="padding:8px;">الكمية المباعة</th>
                            <th style="padding:8px;">الإجراء</th>
                        </tr>
                    </thead>
                    <tbody>
            `;

            invData.items.forEach((item, index) => {
                itemsHtml += `
                    <tr style="border-bottom:1px solid rgba(61,21,34,0.5);">
                        <td style="padding:8px;">${item.name}</td>
                        <td style="padding:8px;">${item.qty}</td>
                        <td style="padding:8px;">
                            <button class="btn-main" style="background:#e74c3c; padding:6px 10px; font-size:0.8rem; border-radius:4px; width:auto; display:inline-block;" 
                                onclick="window.App.executeItemReturn('${invoiceId}', '${item.code}', ${item.qty}, ${item.price}, ${index})">
                                <i class="fas fa-exchange-alt"></i> إرجاع بالكامل
                            </button>
                        </td>
                    </tr>
                `;
            });

            itemsHtml += `</tbody></table>`;
            detailsContainer.innerHTML = itemsHtml;

        } catch (e) {
            detailsContainer.innerHTML = `<span style="color:#e74c3c;">خطأ في جلب البيانات: ${e.message}</span>`;
        }
    },

    // دالة تنفيذ الإرجاع الفعلي وإعادة السلع إلى المخزن وتعديل الفاتورة
    executeItemReturn: async function(invoiceId, itemCode, qty, price, itemIndex) {
        if (!confirm("هل أنت متأكد من معالجة إرجاع هذا الصنف وإعادة تدويره في المخزن؟")) return;
        
        try {
            // 1. إعادة الكمية المرتجعة إلى المخزون (products)
            const itemRef = doc(db, "products", itemCode);
            const itemSnap = await getDoc(itemRef);
            if (itemSnap.exists()) {
                const currentQty = parseFloat(itemSnap.data().quantity) || 0;
                await setDoc(itemRef, { quantity: currentQty + qty }, { merge: true });
            }

            // 2. تعديل أو حذف الفاتورة من كولكشن orders
            const orderRef = doc(db, "orders", invoiceId);
            const orderSnap = await getDoc(orderRef);
            
            if (orderSnap.exists()) {
                let invData = orderSnap.data();
                // إزالة الصنف المرتجع من مصفوفة الأصناف
                invData.items.splice(itemIndex, 1);
                // خصم قيمة المرتجع من الصافي الخاضع للضريبة
                invData.total_net = parseFloat(invData.total_net || 0) - (qty * price);

                if (invData.items.length === 0) {
                    // إذا أصبحت الفاتورة فارغة تماماً يتم حذفها نهائياً
                    await deleteDoc(orderRef);
                    // مزامنة الحذف محلياً للداش بورد
                    let localInvoices = JSON.parse(localStorage.getItem('altajer_invoices')) || [];
                    localInvoices = localInvoices.filter(inv => inv.invoiceId !== invoiceId);
                    localStorage.setItem('altajer_invoices', JSON.stringify(localInvoices));
                    
                    alert("تم إرجاع كافة عناصر الفاتورة بالكامل، وحُذفت الفاتورة فارغة السجلات بنجاح.");
                } else {
                    // تحديث الفاتورة بالقيم الجديدة
                    await setDoc(orderRef, invData);
                    // مزامنة التحديث محلياً للداش بورد
                    let localInvoices = JSON.parse(localStorage.getItem('altajer_invoices')) || [];
                    const locIdx = localInvoices.findIndex(inv => inv.invoiceId === invoiceId);
                    if (locIdx > -1) {
                        localInvoices[locIdx].items = invData.items;
                        localInvoices[locIdx].total_net = invData.total_net;
                        localStorage.setItem('altajer_invoices', JSON.stringify(localInvoices));
                    }
                    alert("تمت معالجة المرتجع، وتحديث المخازن وحسابات الفاتورة بنجاح.");
                }
            }
            // إعادة تحديث الواجهة لعرض الحالة الجديدة
            this.processReturn();
        } catch (e) {
            alert("خطأ أثناء معالجة المرتجع: " + e.message);
        }
    }
};

// إتاحة الكائن والشاشات على النطاق العالمي لتتخاطب معها عناصر HTML مباشرة
window.App = MainApp;

// ==========================================
// ثالثاً: تفعيل المستمعات الحية (Real-time Snapshots) وتوجيه الأزرار
// ==========================================
$(document).ready(function() {
    
    // مراقبة العملاء حياً وتحديث القوائم والـ ComboBox في الكاشير
    onSnapshot(collection(db, "customers"), (snapshot) => {
        const tbody = document.getElementById('customerTableBody'); const cbCustomer = document.getElementById('cbCustomer');
        if(tbody) tbody.innerHTML = '';
        if(cbCustomer) cbCustomer.innerHTML = '<option value="" selected>اختر العميل</option>';
        
        // جلب البيانات ومزامنتها محلياً للتحديث الفوري لكروت لوحة التحكم
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

    // مراقبة المنتجات والمخزون حياً وتحديث قائمة الـ ComboBox في الكاشير تلقائياً
    onSnapshot(collection(db, "products"), (snapshot) => {
        const tbody = document.getElementById('itemTableBody'); const cbItem = document.getElementById('cbItem');
        if(tbody) tbody.innerHTML = '';
        if(cbItem) cbItem.innerHTML = '<option value="" selected>اختر الصنف</option>';
        
        snapshot.forEach((doc) => {
            const data = doc.data();
            if(tbody) tbody.innerHTML += `<tr><td>${data.code}</td><td>${data.name}</td><td>${parseFloat(data.price || 0).toFixed(2)}</td><td>${data.quantity || 0}</td></tr>`;
            if(cbItem) cbItem.innerHTML += `<option value="${data.code}" data-price="${data.price}" data-qty="${data.quantity || 0}">${data.name} - ${parseFloat(data.price || 0).toFixed(2)}</option>`;
        });
    });

    // مراقبة الفواتير الموحدة سحابياً ومزامنتها وتحديث كاونتر الـ Dashboard حياً
    onSnapshot(collection(db, "orders"), (snapshot) => {
        const currentInvoicesData = [];
        snapshot.forEach((doc) => {
            currentInvoicesData.push({ invoiceId: doc.id, ...doc.data() });
        });
        localStorage.setItem('altajer_invoices', JSON.stringify(currentInvoicesData));
        if(document.getElementById('orderCount')) document.getElementById('orderCount').innerText = snapshot.size;
    });

    // جلب بيانات العميل المختار تلقائياً عند التغيير في الكاشير
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

    // جلب بيانات وعرض كمية الـ Hand المتوفرة في المخزن للصنف المختار تلقائياً في الكاشير
    $('#cbItem').change(function() {
        const option = $(this).find('option:selected');
        if($(this).val()) {
            document.getElementById('poItemName').value = option.text().split(" - ")[0];
            document.getElementById('poQtyOnHand').value = option.data('qty');
        }
    });

    // ربط الأحداث والأزرار بشكل مستقر لمنع المشاكل البرمجية أثناء الإدخال والتعديل
    $(document).on('click', '#btnCustomerAdd, #btnCustomerUpdate', () => window.App.customer.addOrUpdate());
    $(document).on('click', '#btnCustomerSearch', () => window.App.customer.search());
    $(document).on('click', '#btnCustomerDelete', () => window.App.customer.delete());
    
    $(document).on('click', '#btnItemAdd, #btnItemUpdate', () => window.App.item.addOrUpdate());
    $(document).on('click', '#btnItemSearch', () => window.App.item.search());
    $(document).on('click', '#btnItemDelete', () => window.App.item.delete());
    
    $(document).on('click', '#btnAddToCart', () => window.App.pos.addToCart());
    $(document).on('click', '#btnPlaceOrder', () => window.App.pos.placeOrder());
    $(document).on('click', '#btnSaveAllProducts', () => window.App.saveAllProducts());
});

// دالة الحساب الفوري للإجمالي داخل سطور المخزن
window.calculateTotal = function(code) {
    const price = parseFloat(document.getElementById(`p-price-${code}`).value) || 0;
    const qty = parseFloat(document.getElementById(`p-qty-${code}`).value) || 0;
    if(document.getElementById(`p-total-${code}`)) {
        document.getElementById(`p-total-${code}`).value = (price * qty).toFixed(2);
    }
};
