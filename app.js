// إضافة وظيفة حفظ كافة الأصناف من الجدول إلى Firebase
App.saveAllProducts = async function() {
    const rows = document.querySelectorAll('#product-list tr');
    const productsData = [];

    rows.forEach(row => {
        const id = row.id.replace('row-', ''); // جلب الكود مثل 1001
        const name = document.getElementById(`p-name-${id}`).value;
        const unit = document.getElementById(`p-unit-${id}`).value;
        const size = document.getElementById(`p-size-${id}`).value;
        const price = document.getElementById(`p-price-${id}`).value;
        const qty = document.getElementById(`p-qty-${id}`).value;
        const total = document.getElementById(`p-total-${id}`).value;
        const notes = document.getElementById(`p-notes-${id}`).value;

        // فقط نجمع الصفوف التي تحتوي على اسم صنف
        if (name.trim() !== "") {
            productsData.push({
                code: id,
                name: name,
                unit: unit,
                size: size,
                price: parseFloat(price),
                quantity: parseFloat(qty),
                total: parseFloat(total),
                notes: notes,
                timestamp: new Date()
            });
        }
    });

    if (productsData.length === 0) {
        alert("الرجاء إدخال اسم صنف واحد على الأقل قبل الحفظ.");
        return;
    }

    try {
        // هنا يتم الربط التراكمي مع قاعدة بيانات التاجر برو
        for (const product of productsData) {
            await db.collection("products").doc(product.code).set(product);
        }
        alert("تم حفظ جميع الأصناف بنجاح في نظام التاجر برو.");
    } catch (error) {
        console.error("خطأ في الحفظ: ", error);
        alert("حدث خطأ أثناء الحفظ، تأكد من اتصال الإنترنت.");
    }
};
