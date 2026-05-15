// التاجر برو المحاسبي - المحرك الرئيسي الشامل (تطوير تراكمي)
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getFirestore, collection, doc, setDoc, getDoc, getDocs, deleteDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";

// إعدادات الربط بـ Firebase (تأكد من الحفاظ على بيانات مشروعك هنا)
const firebaseConfig = {
    // ضع بيانات مشروعك السحابي الحالية هنا ليعمل النظام مباشرة
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// كائن السلة المحلي الخاص بنظام الكاشير (شاشة POS)
let cart = [];

window.App = {
    // 1. الوظيفة الأصلية: حفظ الأصناف المتتابعة (بديل الإكسل - لعدم حذف أي كود سابق)
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
                    price: parseFloat(document.getElementById(`p-price-${id}`).value),
                    quantity: parseFloat(document.getElementById(`p-qty-${id}`).value),
                    total: parseFloat(document.getElementById(`p-total-${id}`).value),
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
        } catch (e) {
            alert("خطأ في الاتصال: " + e.message);
        }
    },

    // 2. الوظيفة الأصلية: تصدير البيانات لإكسل
    exportToExcel: function(tableId) {
        const table = document.getElementById(tableId);
        let html = table.outerHTML;
        let url = 'data:application/vnd.ms-excel,' + escape(html);
        let link = document.createElement("a");
        link.download = "مخزون_التاجر.xls";
        link.href = url;
        link.click();
    },

    // ==========================================
    // محرك الربط الجديد والشامل للواجهات المتطورة
    // ==========================================

    // [أولاً: إدارة سحابية متكاملة للعملاء]
    customer: {
        addOrUpdate: async function() {
            const id = document.getElementById('custId').value.trim();
            const name = document.getElementById('custName').value.trim();
            const vat = document.getElementById('custVat').value.trim();
            const address = document.getElementById('custAddress').value.trim();
            const contact = document.getElementById('custContact').value.trim();

            if (!id || !name) return alert("يرجى إدخال معرّف واسم العميل على الأقل.");

            const customerData = { id, name, vat, address, contact, timestamp: new Date() };
            try {
                await setDoc(doc(db, "customers", id), customerData);
                alert("تم حفظ بيانات العميل سحابياً بنجاح.");
                this.clearForm();
            } catch (e) { alert("خطأ في حفظ العميل: " + e.message); }
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
                } else { alert("العميل غير موجود في السجلات."); }
            } catch (e) { alert("خطأ في البحث: " + e.message); }
        },
        delete: async function() {
            const id = document.getElementById('custId').value.trim();
            if (!id) return alert("يرجى إدخال معرّف العميل المراد حذفه.");
            if (!confirm("هل أنت متأكد من حذف هذا العميل نهائياً من سحابة التاجر؟")) return;
            try {
                await deleteDoc(doc(db, "customers", id));
                alert("تم حذف العميل بنجاح.");
                this.clearForm();
            } catch (e) { alert("خطأ في الحذف: " + e.message); }
        },
        clearForm: function() {
            document.getElementById('custId').value = ''; document.getElementById('custName').value = '';
            document.getElementById('custVat').value = ''; document.getElementById('custAddress').value = '';
            document.getElementById('custContact').value = '';
        }
    },

    // [ثانياً: إدارة سحابية متكاملة للأصناف المفردة بالمخزن]
    item: {
        addOrUpdate: async function() {
            const code = document.getElementById('itemCode').value.trim();
            const name = document.getElementById('itemName').value.trim();
            const price = parseFloat(document.getElementById('itemPrice').value) || 0;
            const qty = parseFloat(document.getElementById('itemQty').value) || 0;

            if (!code || !name) return alert("يرجى إدخال كود واسم الصنف.");

            const itemData = { code, name, price, quantity: qty, timestamp: new Date() };
            try {
                await setDoc(doc(db, "products", code), itemData);
                alert("تم حفظ الصنف بالمخزن سحابياً.");
                this.clearForm();
            } catch (e) { alert("خطأ في حفظ الصنف: " + e.message); }
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
                } else { alert("الصنف غير موجود بالمستودع."); }
            } catch (e) { alert("خطأ في البحث: " + e.message); }
        },
        delete: async function() {
            const code = document.getElementById('itemCode').value.trim();
            if (!code) return alert("يرجى إدخال كود الصنف لحذفه.");
            if (!confirm("هل تريد حذف الصنف من المخزن نهائياً؟")) return;
            try {
                await deleteDoc(doc(db, "products", code));
                alert("تم حذف الصنف.");
                this.clearForm();
            } catch (e) { alert("خطأ في الحذف: " + e.message); }
        },
        clearForm: function() {
            document.getElementById('itemCode').value = ''; document.getElementById('itemName').value = '';
            document.getElementById('itemPrice').value = ''; document.getElementById('itemQty').value = '';
        }
    },

    // [ثالثاً: نظام الكاشير المتفاعل والسلة الحية مع احتساب الضريبة والخصم]
    pos: {
        addToCart: function() {
            const itemSelect = document.getElementById('cbItem');
            const code = itemSelect.value;
            const qtyBought = parseFloat(document.getElementById('poQtyBought').value) || 0;
            const maxQty = parseFloat(document.getElementById('poQtyOnHand').value) || 0;

            if (!code) return alert("الرجاء اختيار صنف من القائمة أولاً.");
            if (qtyBought <= 0) return alert("يرجى إدخال كمية بيع صحيحة أكبر من الصفر.");
            if (qtyBought > maxQty) return alert("الكمية المطلوبة تتجاوز المتاح حالياً في المخزن!");

            const selectedOption = itemSelect.options[itemSelect.selectedIndex];
            const name = selectedOption.text.split(" - ")[0];
            const priceInclTax = parseFloat(selectedOption.dataset.price);

            // حساب التفكيك الضريبي لمعايير هيئة الزكاة (ZATCA) 15%
            const priceExclTax = priceInclTax / 1.15;
            const subtotalExclTax = priceExclTax * qtyBought;
            const taxAmount = subtotalExclTax * 0.15;
            const totalItemCost = priceInclTax * qtyBought;

            // التحقق إذا كان الصنف مضافاً مسبقاً لتحديث الكمية تراكمياً
            const existingItem = cart.find(i => i.code === code);
            if (existingItem) {
                if ((existingItem.qty + qtyBought) > maxQty) return alert("مجموع الكمية بالسلة يتجاوز المتاح بالمخزن!");
                existingItem.qty += qtyBought;
                existingItem.subtotal = existingItem.price * existingItem.qty;
            } else {
                cart.push({
                    code: code,
                    name: name,
                    price: priceInclTax,
                    qty: qtyBought,
                    subtotal: totalItemCost
                });
            }

            this.updateCartTable();
            document.getElementById('poQtyBought').value = '';
        },
        updateCartTable: function() {
            const tbody = document.getElementById('tblPlaceOrder');
            tbody.innerHTML = '';
            let totalExclTax = 0;
            let totalTax = 0;
            let finalNet = 0;

            cart.forEach((item, index) => {
                const itemPriceExcl = item.price / 1.15;
                const itemSubtotalExcl = itemPriceExcl * item.qty;
                const itemTax = itemSubtotalExcl * 0.15;

                totalExclTax += itemSubtotalExcl;
                totalTax += itemTax;
                finalNet += item.subtotal;

                tbody.innerHTML += `
                    <tr>
                        <td>${item.code}</td>
                        <td>${item.name}</td>
                        <td>${itemPriceExcl.toFixed(2)} ر.س</td>
                        <td>${item.qty}</td>
                        <td>${item.subtotal.toFixed(2)} ر.س</td>
                        <td><button class="btn btn-sm btn-danger" onclick="App.pos.removeItem(${index})"><i class="fas fa-trash"></i></button></td>
                    </tr>
                `;
            });

            document.getElementById('subTotalVal').innerText = totalExclTax.toFixed(2);
            document.getElementById('taxVal').innerText = totalTax.toFixed(2);
            document.getElementById('totalVal').innerText = finalNet.toFixed(2);
        },
        removeItem: function(index) {
            cart.splice(index, 1);
            this.updateCartTable();
        },
        placeOrder: async function() {
            if (cart.length === 0) return alert("السلة فارغة! يرجى إضافة أصناف أولاً لإصدار الفاتورة.");
            const custId = document.getElementById('poCustId').value;
            
            const orderData = {
                customerId: custId || "زبون نقدي",
                items: cart,
                subTotalExclTax: parseFloat(document.getElementById('subTotalVal').innerText),
                taxAmount: parseFloat(document.getElementById('taxVal').innerText),
                netTotal: parseFloat(document.getElementById('totalVal').innerText),
                timestamp: new Date()
            };

            try {
                const orderId = "INV-" + Date.now();
                await setDoc(doc(db, "orders", orderId), orderData);
                
                // تحديث كميات المخزن سحابياً بشكل تنازلي أوتوماتيكي
                for (const item of cart) {
                    const itemRef = doc(db, "products", item.code);
                    const itemSnap = await getDoc(itemRef);
                    if (itemSnap.exists()) {
                        const newQty = (itemSnap.data().quantity || 0) - item.qty;
                        await setDoc(itemRef, { quantity: newQty }, { merge: true });
                    }
                }

                alert(`تم اعتماد وحفظ الفاتورة الضريبية برقم: ${orderId} بنجاح.`);
                cart = [];
                this.updateCartTable();
            } catch (e) { alert("خطأ في معالجة الفاتورة: " + e.message); }
        }
    }
};

// ==========================================
// محرك التدفق المباشر (Real-time Snapshots)
// ==========================================
$(document).ready(function() {
    // 1. الاستماع الحي لجدول العملاء لتحديث الجداول وقوائم الكاشير
    onSnapshot(collection(db, "customers"), (snapshot) => {
        const tbody = document.getElementById('customerTableBody');
        const cbCustomer = document.getElementById('cbCustomer');
        
        if(tbody) tbody.innerHTML = '';
        if(cbCustomer) {
            cbCustomer.innerHTML = '<option value="" selected>اختر العميل</option>';
        }

        let count = 0;
        snapshot.forEach((doc) => {
            count++;
            const data = doc.data();
            if(tbody) {
                tbody.innerHTML += `
                    <tr>
                        <td>${data.id}</td>
                        <td>${data.name}</td>
                        <td>${data.vat || '--'}</td>
                        <td>${data.contact}</td>
                        <td>${data.address}</td>
                    </tr>
                `;
            }
            if(cbCustomer) {
                cbCustomer.innerHTML += `<option value="${data.id}">${data.name}</option>`;
            }
        });
        const countLabel = document.getElementById('customerCount');
        if(countLabel) countLabel.innerText = count;
    });

    // 2. الاستماع الحي لجدول الأصناف لملء شاشة المخزن وقائمة الكاشير الفورية
    onSnapshot(collection(db, "products"), (snapshot) => {
        const tbody = document.getElementById('itemTableBody');
        const cbItem = document.getElementById('cbItem');

        if(tbody) tbody.innerHTML = '';
        if(cbItem) {
            cbItem.innerHTML = '<option value="" selected>اختر الصنف</option>';
        }

        snapshot.forEach((doc) => {
            const data = doc.data();
            if(tbody) {
                tbody.innerHTML += `
                    <tr>
                        <td>${data.code}</td>
                        <td>${data.name}</td>
                        <td>${parseFloat(data.price || 0).toFixed(2)} ر.س</td>
                        <td>${data.quantity || 0}</td>
                    </tr>
                `;
            }
            if(cbItem) {
                cbItem.innerHTML += `<option value="${data.code}" data-price="${data.price}" data-qty="${data.quantity || 0}">${data.name} - ${parseFloat(data.price || 0).toFixed(2)} ر.س</option>`;
            }
        });
    });

    // 3. الاستماع الحي لعدد فواتير الشهر
    onSnapshot(collection(db, "orders"), (snapshot) => {
        const orderCountLabel = document.getElementById('orderCount');
        if(orderCountLabel) orderCountLabel.innerText = snapshot.size;
    });

    // أحداث التغير في قائمة الكاشير المنسدلة (العملاء)
    $('#cbCustomer').change(async function() {
        const id = $(this).val();
        if(id) {
            const docSnap = await getDoc(doc(db, "customers", id));
            if(docSnap.exists()) {
                document.getElementById('poCustId').value = docSnap.data().id;
                document.getElementById('poCustVat').value = docSnap.data().vat || 'زبون غير ضريبي';
            }
        } else {
            document.getElementById('poCustId').value = ''; document.getElementById('poCustVat').value = '';
        }
    });

    // أحداث التغير في قائمة الكاشير المنسدلة (الأصناف)
    $('#cbItem').change(function() {
        const option = $(this).find('option:selected');
        const code = $(this).val();
        if(code) {
            document.getElementById('poItemName').value = option.text().split(" - ")[0];
            document.getElementById('poQtyOnHand').value = option.data('qty');
        } else {
            document.getElementById('poItemName').value = ''; document.getElementById('poQtyOnHand').value = '';
        }
    });

    // ربط أزرار العمليات في شاشات العملاء والمخزن بالكاشير
    $('#manageCustomer .btn-neon').eq(0).click(() => App.customer.addOrUpdate());
    $('#manageCustomer .btn-neon').eq(1).click(() => App.customer.search());
    $('#manageCustomer .btn-neon').eq(2).click(() => App.customer.addOrUpdate());
    $('#manageCustomer .btn-neon').eq(3).click(() => App.customer.delete());

    $('#manageItem .btn-neon').eq(0).click(() => App.item.addOrUpdate());
    $('#manageItem .btn-neon').eq(1).click(() => App.item.search());
    $('#manageItem .btn-neon').eq(2).click(() => App.item.addOrUpdate());
    $('#manageItem .btn-neon').eq(3).click(() => App.item.delete());

    $('#btnAddToCart').click(() => App.pos.addToCart());
    $('#btnPlaceOrder').click(() => App.pos.placeOrder());
});

// وظائف الحساب التلقائي القديمة (لعدم تعطيل أي كود سابق بالمخزن الأساسي)
window.calculateTotal = function(code) {
    const price = document.getElementById(`p-price-${code}`).value || 0;
    const qty = document.getElementById(`p-qty-${code}`).value || 0;
    const totalField = document.getElementById(`p-total-${code}`);
    if(totalField) totalField.value = (price * qty).toFixed(2);
};
