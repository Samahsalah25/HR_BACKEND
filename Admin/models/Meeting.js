const mongoose = require("mongoose");

const meetingSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    subTitle: { type: String },
    description: { type: String },
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    type: { type: String, enum: ["online", "offline"], required: true },
    meetingLink: { type: String }, // لو أونلاين
    participants: [{ type: mongoose.Schema.Types.ObjectId, ref: "Employee" }],
    attachments: [
      {
        filename: String,
        originalname: String,
        path: String,
      },
    ],
    repeat: {
      isRepeated: { type: Boolean, default: false },
      frequency: {
        type: String,
        enum: ["daily", "weekly", "monthly", "custom"],
        default: null,
      },
      sameTime: { type: Boolean, default: true }, // true = نفس الوقت دايمًا
      customTimes: [
        {
          occurrenceNumber: { type: Number, required: true }, // رقم التكرار (الأسبوع الثاني مثلاً)
          startTime: { type: Date, required: true },
          endTime: { type: Date, required: true },
        },
      ],
    },
 createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "Employee", required: true },
 status: { type: String, enum: ["confirmed", "cancelled"], default: "confirmed" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Meeting", meetingSchema);
