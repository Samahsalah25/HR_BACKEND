const mongoose = require("mongoose");

const attachmentSchema = new mongoose.Schema({
  filename: String,
  url: String
}, { _id: false });

const recordSchema = new mongoose.Schema({
  category: { 
    type: String, 
    enum: ['سجل تجاري', 'تراخيص'], 
    required: true 
  },
  type: { type: String, required: true },   
  number: { type: String },                
  branch: { type: String },               
  issueDate: { type: Date },               
  expiryDate: { type: Date },               
  status: { 
    type: String, 
    enum: ['متاح', 'منتهي'], 
    default: 'متاح' 
  },
  attachments: [attachmentSchema],          
}, { timestamps: true });

module.exports = mongoose.model("Record", recordSchema);
