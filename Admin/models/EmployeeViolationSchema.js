const mongoose = require('mongoose');
const employeeViolationSchema = new mongoose.Schema({
    employeeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Employee',
        required: [true, 'يجب تحديد الموظف']
    },
    violationId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Violation',
        required: [true, 'يجب تحديد نوع المخالفة']
    },
    occurrenceNumber: {
        type: Number,
        default: 1
    },
    violationDate: {
        type: Date,
        required: [true, 'تاريخ المخالفة مطلوب'],
        default: Date.now
    },
    addedBy: {
        type: String,
        default: 'Admin' //
    }
}, { timestamps: true });

module.exports = mongoose.model('EmployeeViolation', employeeViolationSchema);