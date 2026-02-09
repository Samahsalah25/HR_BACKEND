const mongoose = require('mongoose');

const violationSchema = new mongoose.Schema({
    nameEn: {
        type: String,
        required: [true, 'English name is required'],
        trim: true
    },
    nameAr: {
        type: String,
        required: [true, 'الاسم بالعربية مطلوب'],
        trim: true
    },
    descriptionEn: {
        type: String,
        required: [true, 'English description is required'],
        trim: true
    },
    descriptionAr: {
        type: String,
        required: [true, 'الوصف بالعربية مطلوب'],
        trim: true
    }
}, {
    timestamps: true
});

const Violation = mongoose.model('Violation', violationSchema);

module.exports = Violation;