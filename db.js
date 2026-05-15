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
        const invoiceId = "INV-" + Date.now();
        // حفظ الفاتورة في كولكشن orders الموحد لضمان قراءة الجداول والكاونترات حياً
        await setDoc(doc(db, "orders", invoiceId), {
            ...invoiceData,
            timestamp: new Date()
        });
        console.log("تم حفظ الفاتورة بنجاح برقم: " + invoiceId);
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
                await setDoc(doc(db, "customers", id), { id, name, vat, address, contact, timestamp: new Date() });
                alert("تم حفظ بيانات العميل بنجاح."); this.clearForm();
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
                await deleteDoc(doc(db, "customers", id)); alert("تم الحذف بنجاح."); this.clearForm();
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
                
                const invoiceData = {
                    customerId: customerId,
                    items: cart,
                    netTotal: netTotal
                };

                // استدعاء دالة الحفظ المركزية لتوحيد ترحيل البيانات السحابية
                await saveInvoice(invoiceData);
                
                // تحديث وإدارة جرد المخزن التراكمي بخصم الكميات المشتراة حياً
                for (const item of cart) {
                    const itemRef = doc(db, "products", item.code); 
                    const itemSnap = await getDoc(itemRef);
                    if (itemSnap.exists()) {
                        const currentQty = parseFloat(itemSnap.data().quantity) || 0;
                        await setDoc(itemRef, { quantity: currentQty - item.qty }, { merge: true });
                    }
                }
                
                // ميزة إضافية: توليد الـ QR للفاتورة الإلكترونية المبسطة إن وجدت دالتها بالواجهة
                if(typeof window.generateInvoiceQR === "function") {
                    window.generateInvoiceQR(orderId, netTotal);
                }
                
                alert(`حُفظت الفاتورة برقم: ${orderId}`); 
                cart = []; 
                this.updateCartTable();
            } catch (e) { alert("خطأ في معالجة الفاتورة: " + e.message); }
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
        
        snapshot.forEach((doc) => {
            const data = doc.data();
            if(tbody) tbody.innerHTML += `<tr><td>${data.id}</td><td>${data.name}</td><td>${data.vat || '--'}</td><td>${data.contact}</td><td>${data.address}</td></tr>`;
            if(cbCustomer) cbCustomer.innerHTML += `<option value="${data.id}">${data.name}</option>`;
        });
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

    // مراقبة الفواتير الموحدة لعرض الكاونتر الرئيسي في الـ Dashboard
    onSnapshot(collection(db, "orders"), (snapshot) => {
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
