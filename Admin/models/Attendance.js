const mongoose = require("mongoose");

const attendanceSchema = new mongoose.Schema({
  employee: { type: mongoose.Schema.Types.ObjectId, ref: "Employee", required: true },
  branch: { type: mongoose.Schema.Types.ObjectId, ref: "Branch", required: true },
  date: { type: Date, required: true }, // اليوم اللي سجل فيه الحضور
  status: { type: String, enum: ["حاضر", "غائب", "متأخر"], required: true },
  checkIn: { type: Date },   // وقت تسجيل الدخول
  checkOut: { type: Date },  // وقت تسجيل الخروج
  lateMinutes: { type: Number, default: 0 } // عدد الدقائق المتأخرة
,workedMinutes: { type: Number, default: 0 } ,
workedtime: { type: Number, default: 0 }
 //  عدد الدقايق اللي اشتغلها
}, { timestamps: true });

module.exports = mongoose.model("Attendance", attendanceSchema);
