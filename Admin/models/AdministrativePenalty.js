const mongoose = require("mongoose");

const adminPenaltySchema = new mongoose.Schema({
  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Employee",
    required: true
  },
department: {
  type: mongoose.Schema.Types.ObjectId,
  ref: "Department", // لو عندك جدول Departments
  required: true
}
,
  branch: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Branch",
    required: true
  },

  penaltyType: { 
    type: String, // "مخالفة ادارية"
    default: "مخالفة إدارية"
  },

  violationType: { 
    type: String, 
    enum: [
      "تأخير متكرر",
      "غياب متكرر بدون إذن",
      "انصراف بدون إذن",
      "عدم الالتزام بآداب العمل",
      "الإهمال والتقصير",
      "مخالفة تعليمات المدير",
      "إساءة استخدام موارد الشركة",
      "أخرى"
    ],
    required: true
  },

  customViolation: { type: String }, // لو اختار "أخرى"
  
  penaltyPercent: { type: Number, required: true },
  penaltyAmount: { type: Number, required: true },

  status: { 
    type: String, 
    enum: ["APPLIED", "PENDING", "APPROVED", "REJECTED"],
    default: "APPLIED"
  },

  appliedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // HR
  appliedDate: { type: Date, default: Date.now },

}, { timestamps: true });

module.exports = mongoose.model("AdminPenalty", adminPenaltySchema);
