const mongoose = require("mongoose");

const meetingSchema = new mongoose.Schema({
  title: { type: String, required: true },
  subTitle: { type: String },
  description: { type: String },
  day: { type: Date, required: true },        // اليوم فقط
  startTime: { type: String, required: true }, // "HH:mm"
  endTime: { type: String, required: true },   // "HH:mm"
  type: { type: String, enum: ["online", "offline"], required: true },
  meetingLink: { type: String },
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: "Employee" }],
  attachments: [{ filename: String, originalname: String, path: String }],
repeat: {
  isRepeated: { type: Boolean, default: false },
  repeatOriginId: { type: mongoose.Schema.Types.ObjectId, ref: "Meeting", default: null }
,
  frequency: { type: String, enum: ["daily", "weekly", "monthly"], default: null },
  sameTime: { type: Boolean, default: true }, // لو عايزين نغير الساعة لكل occurrence
  repeatEndDate: { type: Date, default: () => {
      const now = new Date();
      now.setMonth(now.getMonth() + 6); // افتراضياً 6 شهور
      return now;
  }},
}
,
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "Employee", required: true },
  status: { type: String, enum: ["confirmed", "cancelled"], default: "confirmed" },
}, { timestamps: true });


module.exports = mongoose.model("Meeting", meetingSchema);
