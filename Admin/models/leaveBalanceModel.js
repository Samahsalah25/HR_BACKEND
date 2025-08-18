// models/leaveBalanceModel.js
const mongoose = require("mongoose");

const leaveBalanceSchema = new mongoose.Schema({
  employee: { type: mongoose.Schema.Types.ObjectId, ref: "Employee", required: true },
  annual: { type: Number, default: 21 },   // مثلاً 21 يوم سنوي
  sick: { type: Number, default: 7 },      // مثلاً 7 أيام مرضية
  unpaid: { type: Number, default: 0 },    // بدون مرتب مالهاش رصيد
}, { timestamps: true });

module.exports = mongoose.model("LeaveBalance", leaveBalanceSchema);
