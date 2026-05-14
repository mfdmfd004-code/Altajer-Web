/* 
   مشروع: تاجر برو المحاسبي (تاجر برو المحاسبي)
   الوظيفة: سجل إدخال الأصناف الذكي - بديل الإكسل
   المطور: فايز
*/

import { getFirestore, collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.0.0/firebase-firestore.js";

export const Database = {
    // وظيفة توثيق عملية إدخال صنف جديد في الجداول
    async logNewProduct(productData) {
        try {
            const docRef = await addDoc(collection(db, "product_logs"), {
                productName: productData.name,
                unitPrice: productData.price,
                initialStock: productData.stock,
                actionType: "إدخال جديد",
                adminName: "فايز", // توثيق المستخدم المسؤول
                entryTime: serverTimestamp() // تاريخ الإدخال الدقيق
            });
            console.log("تم التوثيق في سجلات التاجر برو برقم: ", docRef.id);
        } catch (error) {
            console.error("فشل في توثيق البيانات: ", error);
        }
    }
};
