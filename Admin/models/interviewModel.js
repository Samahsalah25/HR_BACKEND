const mongoose = require('mongoose');

const interviewSchema = new mongoose.Schema({
  
  applicant: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Applicant',
    required: true,
  },
  title: {
  type: String,
  required: true
}
,
  interviewer:{
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  date: {
    type: Date,
    required: true,
  },
   time: {
    type: String,
    required: true,
  } ,
  type: {
    type: String,
    enum: ['online', 'onsite'],
    required: true,
  },
  location: {
    type: String, // لو online هيكون هنا link
  },
 result: {
    type: String,
    enum: ['pending', 'passed', 'failed'],
    default: 'pending',
},
notes: {
    type: String,
},
rating: {
    type: Number,
    min: 1,
    max: 10
}
}, { timestamps: true });

module.exports = mongoose.model('Interview', interviewSchema);
