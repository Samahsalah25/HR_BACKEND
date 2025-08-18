const mongoose = require('mongoose');

const residencyYearSchema = new mongoose.Schema({
  year: {
    type: Number,
    required: true,
    unique: true
  }
}, { timestamps: true });

module.exports = mongoose.model('ResidencyYear', residencyYearSchema);
