const mongoose = require('mongoose');


const employeeViolationSchema = new mongoose.Schema({
  employeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true
  },
  violationPenaltyId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'ViolationPenalty',
    required: true
  },
  currentOccurrence: {
    type: Number,
    enum: [1, 2, 3, 4],
    required: true
  },
  // بيانات كل تكرار
 occurrences: [
  {
    occurrenceNumber: Number,
    date: { type: Date, default: Date.now },
    addedBy: { type: String }, // الاسم
    addedById: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // الـ user ID
    penaltyType: { type: String },
    percentageValue: { type: Number, default: 0 },
    daysCount: { type: Number, default: 0 },
    deductFrom: { type: String, default: null },
    decisionText: { type: String, default: '' } ,
  }
]

}, { timestamps: true });

module.exports = mongoose.model('EmployeeViolation', employeeViolationSchema);
