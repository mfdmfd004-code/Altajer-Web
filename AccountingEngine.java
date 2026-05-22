class AccountingEngine {
    constructor(tableName, directory) {
        this.tableName = tableName;
        this.directory = directory;
    }

    // دالة التحقق من الرقم الضريبي (15 رقم، يبدأ بـ 3 وينتهي بـ 3)
    isVatValid(vatNumber) {
        const vatRegex = /^3[0-9]{13}3$/;
        return vatRegex.test(vatNumber);
    }

    // دالة محاكاة لحفظ المعاملة
    recordTransaction(date, accountTitle, debit, credit, note, customerName, vatNumber) {
        if (!this.isVatValid(vatNumber)) {
            console.error("خطأ: الرقم الضريبي غير صالح! يجب أن يبدأ بـ 3 وينتهي بـ 3 وطوله 15 رقماً.");
            return false;
        }

        // هنا يمكنك إضافة منطق الربط مع Firebase أو قاعدة بياناتك
        const transaction = {
            date: date,
            accountTitle: accountTitle,
            debit: parseFloat(debit),
            credit: parseFloat(credit),
            note: note,
            customerName: customerName,
            vatNumber: vatNumber
        };

        console.log("تم الحفظ بنجاح:", transaction);
        return true;
    }
}

// تصدير الكلاس لاستخدامه في ملفات المشروع الأخرى
export default AccountingEngine;
