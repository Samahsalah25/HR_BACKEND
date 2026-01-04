const mongoose = require("mongoose");

const absencePenaltySchema = new mongoose.Schema({
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

  penaltyPercent: {
    type: Number, // مثال: 10 = 10%
    required: true
  },

  penaltyAmount: {
    type: Number,
    required: true
  },

  status: {
    type: String,
    enum: ["APPLIED"], // هنا مفيش موافقة غالبًا
    default: "APPLIED"
  },

  appliedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User" // HR
  },

  month: {
    type: Number, // 1 - 12
    required: true
  },

  year: {
    type: Number,
    required: true
  }

}, { timestamps: true });

module.exports = mongoose.model("AbsencePenalty", absencePenaltySchema);
