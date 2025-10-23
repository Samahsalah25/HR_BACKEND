const mongoose = require("mongoose");

const residencySchema = new mongoose.Schema({
  employee: { type: mongoose.Schema.Types.ObjectId, ref: "Employee", required: true },
  residencyNumber: { type: String, required: true, unique: true },
  issuingAuthority: { type: String }, // الجهة المصدرة
  residencyType: { type: String, enum: ["عمل", "زيارة", "دراسة", "مرافق", "أخرى"], default: "عمل" },
  issueDate: { type: Date },
  expiryDate: { type: Date },
  status: { type: String, enum: ["سارية", "منتهية", "قيد التجديد"], default: "سارية" }
}, { timestamps: true });

module.exports = mongoose.model("Residency", residencySchema);
