const mongoose = require("mongoose");

const lateExcuseSchema = new mongoose.Schema({
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

  reason: {
    type: String,
    required: true
  },

  file: {
    type: String // path أو url
  },

  status: {
    type: String,
    enum: ["PENDING", "APPROVED", "REJECTED"],
    default: "PENDING"
  },

  hrComment: String,
penaltyPercent: {
  type: Number, // مثال: 5 = 5%
  
},

  penaltyAmount: {
    type: Number,
    default: 0
  }
  
}, { timestamps: true });

module.exports = mongoose.model("LateExcuse", lateExcuseSchema);
