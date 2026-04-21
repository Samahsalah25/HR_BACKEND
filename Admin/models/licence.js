const mongoose = require("mongoose");

const attachmentSchema = new mongoose.Schema({
  filename: String,
  url: String
}, { _id: false });

const recordSchema = new mongoose.Schema({
  //  عندي نوعين من السجلات تراخيص او سجل تجاري وهو بيكريت يختار حاجه منهم
  category: { 
    type: String, 
    enum: ['سجل تجاري', 'تراخيص'], 
    required: true 
  },
  // زي اسم السجل دا
  type: { type: String, required: true }, 
  //  رقم السجل  
  number: { type: String }, 
  //  الفرع التابع له السجل دا يعني سجل دا تبع فرع ايه               
 branch: { 
  type: mongoose.Schema.Types.ObjectId, 
  ref: 'Branch' 
},
            //  تاريخ بداية السجل                
issueDate: { type: Date },  
//  تاريخ نهاية السجل             
expiryDate: { type: Date },               
  status: { 
    type: String, 
    enum: ['متاح', 'منتهي'], 
    default: 'متاح' 
  },
  //  الفايل بتاع السجل 
  attachments: [attachmentSchema],          
}, { timestamps: true });

//  اسم التابل 
module.exports = mongoose.model("Record", recordSchema);
