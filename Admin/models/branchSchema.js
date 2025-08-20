// models/branchModel.js
const mongoose = require("mongoose");

const branchSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
 
 location: {
  type: { type: String, enum: ['Point'], default: 'Point' },
  coordinates: { type: [Number], required: true } // [lng, lat]
}
 ,
  workStart: { type: String, required: true },  // "09:00"
  workEnd: { type: String, required: true },    // "17:00"
  gracePeriod: { type: Number, default: 15 },   // بالدقايق
  allowedLateMinutes: { type: Number, default: 30 },
  weekendDays: [{ type: Number, default: [5, 6] }], // 0=Sunday .. 6=Saturday
}, { timestamps: true });

module.exports = mongoose.model("Branch", branchSchema);
