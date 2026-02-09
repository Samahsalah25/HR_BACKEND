const mongoose = require('mongoose');
// خصم معين هيطبق عليه احسب قيمة الخصم X

const penaltyOptions = ['تحذير', 'خصم نسبة', 'خصم أيام', 'قرار'];
const deductFromOptions = ['الراتب', 'البدلات'];

const occurrenceSchema = new mongoose.Schema({
    penaltyType: {
        type: String,
        enum: penaltyOptions,
        required: [true, 'نوع العقوبة مطلوب']
    },
    percentageValue: {
        type: Number,
        default: 0
    },
    deductFrom: {
        type: String,
        enum: deductFromOptions
    },
    daysCount: {
        type: Number,
        default: 0
    },
    decisionText: {
        type: String,
        trim: true
    }
}, { _id: false });

const violationPenaltySchema = new mongoose.Schema({
    violationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Violation',
        required: [true, 'يجب ربط العقوبات بنوع مخالفة'],
            unique: false 
     
    },
    firstOccurrence: {
        type: occurrenceSchema,
        required: [true, 'بيانات التكرار الأول مطلوبة']
    },
    secondOccurrence: {
        type: occurrenceSchema,
        required: [true, 'بيانات التكرار الثاني مطلوبة']
    },
    thirdOccurrence: {
        type: occurrenceSchema,
        required: [true, 'بيانات التكرار الثالث مطلوبة']
    },
    fourthOccurrence: {
        type: occurrenceSchema,
        required: [true, 'بيانات التكرار الرابع مطلوبة']
    }
}, { timestamps: true });

module.exports = mongoose.model('ViolationPenalty', violationPenaltySchema);