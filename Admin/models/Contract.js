const mongoose = require('mongoose');

const contractSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
    },
    duration: { // عدد السنوات أو الأشهر
      type: Number,
      required: true,
    },
    unit: { // لتحديد هل المدة بالسنين أو بالشهور
      type: String,
      enum: ['years', 'months'],
      default: 'years'
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Contract', contractSchema);
