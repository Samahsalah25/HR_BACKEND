const mongoose = require("mongoose");

const additionHoursSchema = new mongoose.Schema({
  attendance: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Attendance",
    required: true
  },

  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Employee",
    required: true
  },

  minutes: {
    type: Number,
    required: true // عدد الدقايق الإضافية
  },

  amount: {
    type: Number,
    default: 0 // قيمة الإضافة بالفلوس
  },

  approvedByHR: {
    type: Boolean,
    default: false
  }

}, { timestamps: true });

module.exports = mongoose.model("AdditionHours", additionHoursSchema);
