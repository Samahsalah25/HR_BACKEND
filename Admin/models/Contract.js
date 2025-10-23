const mongoose = require('mongoose');

const contractSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
    },
    duration: { 
      type: Number,
      required: true,
    },
    unit: { 
      type: String,
      enum: ['years', 'months'],
      default: 'years'
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Contract', contractSchema);





