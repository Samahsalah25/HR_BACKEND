const mongoose = require('mongoose');
//  انا عندي الاقامات بالسنين كدا كدا ف 1 دي معناها انا عندي سنه ف الفرونت
const residencyYearSchema = new mongoose.Schema({
  year: {
    type: Number,
    required: true,
    unique: true
  }
}, { timestamps: true });

//  اسم  التابل  ResidencyYear
module.exports = mongoose.model('ResidencyYear', residencyYearSchema);
