const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema(
  {
    employee: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
    date: { type: Date, required: true },
    checkIn: { type: Date },
    checkOut: { type: Date },
    status: { type: String, enum: ['Present', 'Absent', 'Late'], default: 'Present' },
    reason: { type: String }, // لو تأخر بعذر
    penalty: { type: Number } // خصم لو موجود
  },
  { timestamps: true }
);

module.exports = mongoose.model('Attendance', attendanceSchema);
