// models/leaveBalanceModel.js
const mongoose = require("mongoose");

const leaveBalanceSchema = new mongoose.Schema({
  employee: { type: mongoose.Schema.Types.ObjectId, ref: "Employee" },
  annual: { type: Number, default: 21 },      // إجازة اعتيادية
  sick: { type: Number, default: 7 },         // إجازة مرضية
  marriage: { type: Number, default: 3 },     // إجازة زواج
  emergency: { type: Number, default: 5 },    // إجازة طارئة
  maternity: { type: Number, default: 90 },   // إجازة ولادة
  unpaid: { type: Number, default: 0 },   // إجازة غير مدفوعة
  remaining: { type: Number, default: 0 }, // الرصيد المتبقي
  year: {
    type: Number,
    required: true,
    default: new Date().getFullYear()
  }

}, { timestamps: true });

module.exports = mongoose.model("LeaveBalance", leaveBalanceSchema);
