// التاجر برو المحاسبي - المحرك الرئيسي الشامل المستقر (تطوير تراكمي سحابي)
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getFirestore, collection, doc, setDoc, getDoc, deleteDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";

// إعدادات الربط بـ Firebase (ضع بيانات مشروعك السحابي هنا ليعمل الاتصال حياً فوراً)
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

const MainApp = {
    // 1. المخزن وإدارة المنتجات الجماعية والفردية
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
                    unit: document.getElementById(`p-unit-${id}`).value || '',
                    size: document.getElementById(`p-size-${id}`).value || '',
                    price: parseFloat(document.getElementById(`p-price-${id}`).value) || 0,
                    quantity: parseFloat(document.getElementById(`p-qty-${id}`).value) || 0,
                    total: parseFloat(document.getElementById(`p-total-${id}`).value) || 0,
                    notes: document.getElementById(`p-notes-${id}`).value || '',
                    vatRate: document.getElementById(`p-vat-${id}`) ? document.getElementById(`p-vat-${id}`).value : "15",
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
        link.download = "مخزون_التاجر.xls"; 
        link.href = url; 
        link.click();
    },

    // 2. إدارة ملفات العملاء
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
                alert("تم حفظ بيانات العميل بنجاح."); 
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
                alert("تم الحذف بنجاح."); 
                this.clearForm();
            } catch (e) { alert("خطأ: " + e.message); }
        },
        clearForm: function() {
            if(document.getElementById('custId')) document.getElementById('custId').value = ''; 
            if(document.getElementById('custName')) document.getElementById('custName').value = '';
            if(document.getElementById('custVat')) document.getElementById('custVat').value = ''; 
            if(document.getElementById('custAddress')) document.getElementById('custAddress').value = '';
            if(document.getElementById('custContact')) document.getElementById('custContact').value = '';
        }
    },

    // 3. التحكم المنفرد في عناصر المخزن (تم تطويرها تراكمياً لدعم حقول الواجهة الجديدة)
    item: {
        addOrUpdate: async function() {
            const code = document.getElementById('itemCode').value.trim();
            const name = document.getElementById('itemName').value.trim();
            const price = parseFloat(document.getElementById('itemPrice').value) || 0;
            const qty = parseFloat(document.getElementById('itemQty').value) || 0;
            const vatRate = document.getElementById('itemVatType').value; // الحقل الجديد للضريبة
            
            if (!code || !name) return alert("يرجى إدخال كود واسم الصنف.");
            try {
                await setDoc(doc(db, "products", code), { 
                    code, 
                    name, 
                    price, 
                    quantity: qty, 
                    vatRate: vatRate, 
                    timestamp: new Date() 
                });
                alert("تم حفظ الصنف بالمخزن بنجاح."); 
                this.clearForm();
            } catch (e) { alert("خطأ في الحفظ السحابي: " + e.message); }
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
                    if(document.getElementById('itemVatType') && data.vatRate) {
                        document.getElementById('itemVatType').value = data.vatRate;
                    }
                } else { alert("الصنف غير موجود في المخزن."); }
            } catch (e) { alert("خطأ أثناء البحث: " + e.message); }
        },
        delete: async function() {
            const code = document.getElementById('itemCode').value.trim();
            if (!code) return alert("يرجى إدخال الكود للحذف.");
            if (!confirm("هل تريد حذف هذا الصنف نهائياً؟")) return;
            try {
                await deleteDoc(doc(db, "products", code)); 
                alert("تم الحذف بنجاح."); 
                this.clearForm();
            } catch (e) { alert("خطأ أثناء الحذف: " + e.message); }
        },
        clearForm: function() {
            if(document.getElementById('itemCode')) document.getElementById('itemCode').value = ''; 
            if(document.getElementById('itemName')) document.getElementById('itemName').value = '';
            if(document.getElementById('itemPrice')) document.getElementById('itemPrice').value = ''; 
            if(document.getElementById('itemQty')) document.getElementById('itemQty').value = '0';
            if(document.getElementById('itemVatType')) document.getElementById('itemVatType').value = '15';
        }
    },

    // 4. نظام الكاشير المحاسبي وخصم المخزن
    pos: {
        addToCart: function() {
            const itemSelect = document.getElementById('cbItem'); 
            const code = itemSelect.value;
            const qtyBought = parseFloat(document.getElementById('poQtyBought').value) || 0;
            const maxQty = parseFloat(document.getElementById('poQtyOnHand').value) || 0;
            if (!code) return alert("اختر صنفاً أولاً.");
            if (qtyBought <= 0 || qtyBought > maxQty) return alert("كمية غير صحيحة أو تجاوزت المتاح بالمخزن.");
            
            const selectedOption = itemSelect.options[itemSelect.selectedIndex];
            const name = selectedOption.text.split(" - ")[0];
            const priceInclTax = parseFloat(selectedOption.dataset.price);
            const existingItem = cart.find(i => i.code === code);
            
            if (existingItem) {
                if ((existingItem.qty + qtyBought) > maxQty) return alert("إجمالي الكمية بالسلة تجاوز المتاح بالمخزن!");
                existingItem.qty += qtyBought; 
                existingItem.subtotal = existingItem.price * existingItem.qty;
            } else {
                cart.push({ code: code, name: name, price: priceInclTax, qty: qtyBought, subtotal: priceInclTax * qtyBought });
            }
            this.updateCartTable(); 
            document.getElementById('poQtyBought').value = '';
        },
        updateCartTable: function() {
            const tbody = document.getElementById('tblPlaceOrder'); 
            if(!tbody) return;
            tbody.innerHTML = ''; 
            let totalExclTax = 0; 
            let totalTax = 0; 
            let finalNet = 0;
            
            cart.forEach((item, index) => {
                const itemPriceExcl = item.price / 1.15; 
                const itemSubtotalExcl = itemPriceExcl * item.qty;
                totalExclTax += itemSubtotalExcl; 
                totalTax += (itemSubtotalExcl * 0.15); 
                finalNet += item.subtotal;
                
                tbody.innerHTML += `<tr>
                    <td>${item.code}</td>
                    <td>${item.name}</td>
                    <td>${itemPriceExcl.toFixed(2)}</td>
                    <td>${item.qty}</td>
                    <td>${item.subtotal.toFixed(2)}</td>
                    <td>
                        <button class="btn btn-sm btn-danger" onclick="window.App.pos.removeItem(${index})">
                            <i class="fas fa-trash"></i>
                        </button>
                    </td>
                </tr>`;
            });
            
            if(document.getElementById('subTotalVal')) document.getElementById('subTotalVal').innerText = totalExclTax.toFixed(2);
            if(document.getElementById('taxVal')) document.getElementById('taxVal').innerText = totalTax.toFixed(2);
            if(document.getElementById('totalVal')) document.getElementById('totalVal').innerText = finalNet.toFixed(2);
        },
        removeItem: function(index) { 
            cart.splice(index, 1); 
            this.updateCartTable(); 
        },
        placeOrder: async function() {
            if (cart.length === 0) return alert("السلة فارغة المحتوى!");
            try {
                const orderId = "INV-" + Date.now();
                const netTotal = parseFloat(document.getElementById('totalVal').innerText) || 0;
                const customerId = document.getElementById('poCustId').value || "نقدي";
                
                await setDoc(doc(db, "orders", orderId), { 
                    customerId: customerId, 
                    items: cart, 
                    netTotal: netTotal, 
                    timestamp: new Date() 
                });
                
                for (const item of cart) {
                    const itemRef = doc(db, "products", item.code); 
                    const itemSnap = await getDoc(itemRef);
                    if (itemSnap.exists()) {
                        const currentQty = parseFloat(itemSnap.data().quantity) || 0;
                        await setDoc(itemRef, { quantity: currentQty - item.qty }, { merge: true });
                    }
                }
                
                if(typeof window.generateInvoiceQR === "function") {
                    window.generateInvoiceQR(orderId, netTotal);
                }
                
                alert(`حُفظت الفاتورة بنجاح برقم: ${orderId}`); 
                cart = []; 
                this.updateCartTable();
            } catch (e) { alert("خطأ في معالجة الفاتورة: " + e.message); }
        }
    }
};

// إتاحة الكائن في النطاق العالمي ليعمل مع أزرار صفحة الـ HTML
window.App = MainApp;

$(document).ready(function() {
    // الاستماع الحي لكولكشن العملاء وتحديث لوحة الكاشير والإدارة
    onSnapshot(collection(db, "customers"), (snapshot) => {
        const tbody = document.getElementById('customerTableBody'); 
        const cbCustomer = document.getElementById('cbCustomer');
        if(tbody) tbody.innerHTML = '';
        if(cbCustomer) cbCustomer.innerHTML = '<option value="" selected>اختر العميل</option>';
        
        snapshot.forEach((doc) => {
            const data = doc.data();
            if(tbody) tbody.innerHTML += `<tr><td>${data.id}</td><td>${data.name}</td><td>${data.vat || '--'}</td><td>${data.contact}</td><td>${data.address}</td></tr>`;
            if(cbCustomer) cbCustomer.innerHTML += `<option value="${data.id}">${data.name}</option>`;
        });
        if(document.getElementById('customerCount')) document.getElementById('customerCount').innerText = snapshot.size;
    });

    // الاستماع الحي لكولكشن المنتجات والمخزون
    onSnapshot(collection(db, "products"), (snapshot) => {
        const tbody = document.getElementById('itemTableBody'); 
        const cbItem = document.getElementById('cbItem');
        if(tbody) tbody.innerHTML = '';
        if(cbItem) cbItem.innerHTML = '<option value="" selected>اختر الصنف</option>';
        
        snapshot.forEach((doc) => {
            const data = doc.data();
            if(tbody) tbody.innerHTML += `<tr><td>${data.code}</td><td>${data.name}</td><td>${parseFloat(data.price || 0).toFixed(2)}</td><td>${data.quantity || 0}</td></tr>`;
            if(cbItem) cbItem.innerHTML += `<option value="${data.code}" data-price="${data.price}" data-qty="${data.quantity || 0}">${data.name} - ${parseFloat(data.price || 0).toFixed(2)}</option>`;
        });
    });

    // مراقبة عدد الفواتير الإجمالي وعرضها في الكاونتر الرئيسي للـ Dashboard
    onSnapshot(collection(db, "orders"), (snapshot) => {
        if(document.getElementById('orderCount')) document.getElementById('orderCount').innerText = snapshot.size;
    });

    // أحداث التغير في اختيار العميل والصنف لتعبئة البيانات التلقائية
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

    // ربط مستقر ومباشر للأزرار لمنع تداخل العمليات عبر المعرفات (IDs) الموحدة
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

window.calculateTotal = function(code) {
    const price = parseFloat(document.getElementById(`p-price-${code}`).value) || 0;
    const qty = parseFloat(document.getElementById(`p-qty-${code}`).value) || 0;
    if(document.getElementById(`p-total-${code}`)) {
        document.getElementById(`p-total-${code}`).value = (price * qty).toFixed(2);
    }
};
