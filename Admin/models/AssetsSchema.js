const mongoose = require('mongoose');

const assetsSchema = new mongoose.Schema({
    assetType: {
        type: String,
        required: true,
        enum: ['أجهزة إلكترونية', 'أدوات مكتبية', 'معدات تشغيل', 'أخرى'],
    },
    assetId: {
        type: String,
        unique: true
    },
    //  الموظف الحالي 
    currentEmployee: {
        type: String,
        default: null
    },
    //  الحالة 
    status: {
        type: String,
        required: true,
        enum: ['متاح', 'مستخدمة', 'عائدة', 'تحت الصيانة'],
        default: 'متاح'
    },
    // اسم الأصل 
    assetName: {
        type: String,
        required: [true]
    },
    //  الوصف 
    description: {
        type: String,
        required: [true]
    },
    // باقي البيانات المطلوبة
    serialNumber: { type: String }, // الرقم التسلسلي
    brand: { type: String },        // العلامة التجارية
    model: { type: String },        // الموديل
    purchasePrice: { type: Number }, // سعر الشراء
    supplierName: { type: String },  // اسم المورد
    invoiceNumber: { type: String }, // رقم الفاتورة
    warrantyPeriod: { type: String } // مدة الضمان
}, { timestamps: true });

assetsSchema.pre('save', async function (next) {
    if (this.isNew) {
        const assets = mongoose.model('assets', assetsSchema);
        const lastAsset = await assets.findOne().sort({ createdAt: -1 });

        let newId = 'A01';
        if (lastAsset && lastAsset.assetId) {
            const lastNumber = parseInt(lastAsset.assetId.substring(1));
            const nextNumber = lastNumber + 1;
            newId = `A${nextNumber.toString().padStart(2, '0')}`;
        }
        this.assetId = newId;
    }
    next();
});

const Assets = mongoose.model('assets', assetsSchema);

module.exports = Assets;