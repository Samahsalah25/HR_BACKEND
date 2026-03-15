const mongoose = require("mongoose");

const endServiceSchema = new mongoose.Schema({

  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Employee",
    required: true
  },

  reason: {
    type: String,
    enum: ["استقالة", "انتهاء العقد", "فصل", "تقاعد"],
    required: true
  },

  noticeDate: Date,
  lastWorkingDay: Date,

  serviceDuration: {
    years: Number,
    months: Number,
    days: Number
  },

  // مكافأة نهاية الخدمة
  endOfServiceReward: {
    type: Number,
    default: 0
  },

  // مستحقات الإجازات
  vacationCompensation: {
    days: Number,
    dailyValue: Number,
    total: Number
  },

  // الخصومات
  deductions: [
    {
      title: String,
      amount: Number
    }
  ],

  // الإضافات
  additions: [
    {
      title: String,
      amount: Number
    }
  ],

  // المجموع النهائي
  totalSettlement: {
    type: Number,
    default: 0
  },

  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },

  status: {
    type: String,
    enum: ["draft", "completed"],
    default: "draft"
  }

}, { timestamps: true });

module.exports = mongoose.model("EndService", endServiceSchema);