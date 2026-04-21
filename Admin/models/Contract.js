const mongoose = require('mongoose');

const contractSchema = new mongoose.Schema(
  {
  //  الاسم دا وقت الكريت الباك ايند بيكريت بيبقي عباره عن المدة مع الوحده مثلا المدة 3 والوحده شهور ف الاسم بيتكريت 3 شهور 
    name: {
      type: String,
      required: true,
      unique: true,
    },
    //  هنا المدة ارقام عموما 
    duration: { 
      type: Number,
      required: true,
    },
    //  الوحده الا شهور او سنين 
    unit: { 
      type: String,
      enum: ['years', 'months'],
      default: 'years'
    }
  },
  { timestamps: true }
);

//  اسم التابل Contract

module.exports = mongoose.model('Contract', contractSchema);