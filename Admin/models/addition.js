const mongoose = require("mongoose");

const additionSchema = new mongoose.Schema(
  {
    employee: { type: mongoose.Schema.Types.ObjectId, ref: "Employee", required: true },
    addedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    // سبب المكافأة (نوع المكافأة أو السبب لو اختار "أخرى")
    addtionType: { 
      type: String, 
      enum: ["أداء متميز", "نهاية مشروع", "الحضور المنضبط", "مناسبة رسمية", "أخرى"], 
      required: true 
    },
    reason: { type: String }, // لو نوع "أخرى"
    addTo: { type: String, enum: ["employee", "department", "all"], required: true },
    targetId: { type: mongoose.Schema.Types.ObjectId }, // employeeId أو departmentId لو مش all
    addType: { type: String, enum: ["percent", "value"], required: true },
    amount: { type: Number, required: true }, // القيمة النهائية للمكافأة
    needsApproval: { type: Boolean, default: false },
    status: { type: String, enum: ["انتظار الموافقة", "مقبول", "مرفوض", "مدفوع"], default: "مقبول" },
    approveDate: { type: Date }, // تاريخ التطبيق
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    rejectedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" }
  },
  { timestamps: true }
);

module.exports = mongoose.model("Addition", additionSchema);
