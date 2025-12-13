const mongoose = require("mongoose");

const jobOpeningSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
  },

  department: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Department",
    required: true,
  },

  branch: { // الفرع اللي طلب الوظيفة
    type: mongoose.Schema.Types.ObjectId,
    ref: "Branch",
    required: true,
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

  skills: {
    type: String
  },

  requirements: {
    experienceYears: String,
    gender: String,
    qualification: String,
    languages: String,
    ageRange:String,
    other: String,
  },

  requestedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  viewedByHR: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }], 


  status: {
    type: String,
    enum: ["pending", "approved", "rejected"],
    default: "pending",
  },

}, { timestamps: true });

module.exports = mongoose.model("JobOpening", jobOpeningSchema);
