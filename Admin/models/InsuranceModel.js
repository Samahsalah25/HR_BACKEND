const mongoose = require("mongoose");

const insuranceSchema = new mongoose.Schema(
  {
    name: { type: String, required: true }, // اسم التأمين
    percentage: { type: Number, required: true }, // النسبة %
    isActive: { type: Boolean, default: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Insurance", insuranceSchema);