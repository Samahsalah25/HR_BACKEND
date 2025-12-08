// models/JobOpening.js

const mongoose =require("mongoose");

const jobOpeningSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
 department: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Department",
    required: true
},

  experienceRequired: {
    type: String, // مثل: 1-3 سنين
  },
  skills: {
    type: [String],
  },
  employmentType: {
    type: String,
    enum: ["full-time", "part-time", "internship"],
    required: true,
  },
  salaryRange: {
    min: Number,
    max: Number,
  },
  description: String,

  // المستخدم اللي طلب فتح الوظيفة
  requestedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },

  // حالة الطلب
  status: {
    type: String,
    enum: ["pending", "approved", "rejected"],
    default: "pending",
  },
}, { timestamps: true });

module.exports= mongoose.model("JobOpening", jobOpeningSchema);
