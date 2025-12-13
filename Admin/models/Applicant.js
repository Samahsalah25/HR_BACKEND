const mongoose = require('mongoose');

const applicantSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  mobile: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  age: {
    type: Number,
  },
  experience: {
    type: String,
  },
  cv: {
    type: String, // هذا الـ URL بعد رفع الملف على Cloudinary
    required: true,
  },
  jobOpening: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'JobOpening',
    required: true,
  },
  status: {
    type: String,
    enum: ['new', 'screened', 'interview', 'rejected', 'hired'],
    default: 'new',
  },
  notes: {
    type: String,
  } ,
  viewedByHR: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]

}, { timestamps: true });

module.exports = mongoose.model('Applicant', applicantSchema);
