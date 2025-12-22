const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema({
  employee: { type: mongoose.Schema.Types.ObjectId, ref: "Employee", required: true }, // مش User
  type: { type: String, enum: ["meeting", "task", "request" ,"late"] , required: true },
  message: { type: String, required: true },
  link: { type: String }, // لينك للشاشة اللي يفتحها
  read: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Notification", notificationSchema);
