// التاجر برو المحاسبي - المحرك الرئيسي الشامل المستقر (تطوير تراكمي سحابي)
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-app.js";
import { getFirestore, collection, doc, setDoc, getDoc, deleteDoc, onSnapshot } from "https://www.gstatic.com/firebasejs/9.6.1/firebase-firestore.js";

// إعدادات الربط بـ Firebase (تأكد من الحفاظ على بيانات مشروعك هنا)
const firebaseConfig = {
    // ضع بيانات مشروعك السحابي هنا ليعمل الاتصال حياً فوراً
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

let cart = [];

const MainApp = {
    saveAllProducts: async function() {
        const rows = document.querySelectorAll('#product-list tr');
        let productsData = [];
        rows.forEach(row => {
            const id = row.id.replace('row-', '');
            const name = document.getElementById(`p-name-${id}`).value;
            if (name && name.trim() !== "") {
                productsData.push({
                    code: id, name: name,
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
        } catch (e) { alert("خطأ في الاتصال: " + e.message); }
    },

    exportToExcel: function(tableId) {
        const table = document.getElementById(tableId);
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
                await deleteDoc(doc(db, "customers", id)); alert("تم الحذف."); this.clearForm();
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
            if (!confirm("هل تريد الحذف؟")) return;
            try {
                await deleteDoc(doc(db, "products", code)); alert("تم الحذف."); this.clearForm();
            } catch (e) { alert("خطأ: " + e.message); }
        },
        clearForm: function() {
            document.getElementById('itemCode').value = ''; document.getElementById('itemName').value = '';
            document.getElementById('itemPrice').value = ''; document.getElementById('itemQty').value = '';
        }
    },

    pos: {
        addToCart: function() {
            const itemSelect = document.getElementById('cbItem'); const code = itemSelect.value;
            const qtyBought = parseFloat(document.getElementById('poQtyBought').value) || 0;
            const maxQty = parseFloat(document.getElementById('poQtyOnHand').value) || 0;
            if (!code) return alert("اختر صنفاً أولاً.");
            if (qtyBought <= 0 || qtyBought > maxQty) return alert("كمية غير صحيحة أو غير متوفرة.");
            const selectedOption = itemSelect.options[itemSelect.selectedIndex];
            const name = selectedOption.text.split(" - ")[0];
            const priceInclTax = parseFloat(selectedOption.dataset.price);
            const existingItem = cart.find(i => i.code === code);
            if (existingItem) {
                if ((existingItem.qty + qtyBought) > maxQty) return alert("تجاوزت المتاح!");
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
                tbody.innerHTML += `<tr><td>${item.code}</td><td>${item.name}</td><td>${itemPriceExcl.toFixed(2)}</td><td>${item.qty}</td><td>${item.subtotal.toFixed(2)}</td><td><button class="btn btn-sm btn-danger" onclick="window.App.pos.removeItem(${index})"><i class="fas fa-trash"></i></button></td></tr>`;
            });
            document.getElementById('subTotalVal').innerText = totalExclTax.toFixed(2);
            document.getElementById('taxVal').innerText = totalTax.toFixed(2);
            document.getElementById('totalVal').innerText = finalNet.toFixed(2);
        },
        removeItem: function(index) { cart.splice(index, 1); this.updateCartTable(); },
        placeOrder: async function() {
            if (cart.length === 0) return alert("السلة فارغة!");
            try {
                const orderId = "INV-" + Date.now();
                await setDoc(doc(db, "orders", orderId), { customerId: document.getElementById('poCustId').value || "نقدي", items: cart, netTotal: parseFloat(document.getElementById('totalVal').innerText), timestamp: new Date() });
                for (const item of cart) {
                    const itemRef = doc(db, "products", item.code); const itemSnap = await getDoc(itemRef);
                    if (itemSnap.exists()) await setDoc(itemRef, { quantity: (itemSnap.data().quantity || 0) - item.qty }, { merge: true });
                }
                alert(`حُفظت الفاتورة: ${orderId}`); cart = []; this.updateCartTable();
            } catch (e) { alert("خطأ: " + e.message); }
        }
    }
};

// جعل الكائن متاحاً على النطاق العالمي ليعمل داخل المتصفح مباشرة
window.App = MainApp;

$(document).ready(function() {
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

    onSnapshot(collection(db, "orders"), (snapshot) => {
        if(document.getElementById('orderCount')) document.getElementById('orderCount').innerText = snapshot.size;
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

    $('#manageCustomer .btn-neon').eq(0).click(() => window.App.customer.addOrUpdate());
    $('#manageCustomer .btn-neon').eq(1).click(() => window.App.customer.search());
    $('#manageCustomer .btn-neon').eq(2).click(() => window.App.customer.addOrUpdate());
    $('#manageCustomer .btn-neon').eq(3).click(() => window.App.customer.delete());
    $('#manageItem .btn-neon').eq(0).click(() => window.App.item.addOrUpdate());
    $('#manageItem .btn-neon').eq(1).click(() => window.App.item.search());
    $('#manageItem .btn-neon').eq(2).click(() => window.App.item.addOrUpdate());
    $('#manageItem .btn-neon').eq(3).click(() => window.App.item.delete());
    $('#btnAddToCart').click(() => window.App.pos.addToCart());
    $('#btnPlaceOrder').click(() => window.App.pos.placeOrder());
});

window.calculateTotal = function(code) {
    const price = document.getElementById(`p-price-${code}`).value || 0;
    const qty = document.getElementById(`p-qty-${code}`).value || 0;
    if(document.getElementById(`p-total-${code}`)) document.getElementById(`p-total-${code}`).value = (price * qty).toFixed(2);
};
