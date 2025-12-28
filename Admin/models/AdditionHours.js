const mongoose = require("mongoose");

const AdditionHours = new mongoose.Schema({
  attendanceId: { type: mongoose.Schema.Types.ObjectId, ref: "Attendance", required: true },
  employeeId: { type: mongoose.Schema.Types.ObjectId, ref: "Employee", required: true },
  branchId: { type: mongoose.Schema.Types.ObjectId, ref: "Branch" },
  date: { type: Date, required: true },
  overtimeMinutes: { type: Number, required: true },
  amount: { type: Number, required: true }, // قيمة الإضافة بالريال
  status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending" },
}, { timestamps: true });

module.exports = mongoose.model("AdditionHours", AdditionHours);
