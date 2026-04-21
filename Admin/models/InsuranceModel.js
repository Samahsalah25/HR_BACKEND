const mongoose = require("mongoose");

const insuranceSchema = new mongoose.Schema(
  {
    name: { type: String, required: true }, // اسم التأمين
    percentage: { type: Number, required: true }, // النسبة %
    isActive: { type: Boolean, default: true }   // دي زيادة بحيث لو استخدمنا انه التامين دا يبقي اكتيف او لا
  },
  { timestamps: true }
);
//  اسم التابل
module.exports = mongoose.model("Insurance", insuranceSchema);