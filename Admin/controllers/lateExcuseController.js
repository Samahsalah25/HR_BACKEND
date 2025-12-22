const LateExcuse = require("../models/LateExcuse");
const Attendance = require("../models/Attendance");
const Employee = require("../models/employee");
exports.createLateExcuse = async (req, res) => {
  try {
    const { attendanceId, reason } = req.body;

    if (!attendanceId || !reason) {
      return res.status(400).json({ message: "البيانات غير مكتملة" });
    }

    const attendance = await Attendance.findById(attendanceId);

    if (!attendance)
      return res.status(404).json({ message: "سجل الحضور غير موجود" });

    if (attendance.status !== "متأخر")
      return res.status(400).json({ message: "هذا الحضور ليس متأخرًا" });

    if (attendance.hasExcuse)
      return res.status(400).json({ message: "تم إرسال عذر بالفعل" });

    const excuse = await LateExcuse.create({
      attendance: attendance._id,
      employee: req.user._id,
      reason,
      file: req.file?.path || null, // 👈 Cloudinary URL
    });

    attendance.hasExcuse = true;
    await attendance.save();

    res.status(201).json({
      message: "تم إرسال سبب التأخير بنجاح",
      excuse,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "خطأ في السيرفر" });
  }
};



exports.rejectLateExcuse = async (req, res) => {
  const { penaltyPercent, comment } = req.body;

  if (!penaltyPercent || penaltyPercent <= 0) {
    return res
      .status(400)
      .json({ message: "نسبة الخصم مطلوبة" });
  }

  const excuse = await LateExcuse.findById(req.params.id)
    .populate("employee");

  if (!excuse)
    return res.status(404).json({ message: "العذر غير موجود" });

  const salary = excuse.employee.salary;

  const penaltyAmount = (salary * penaltyPercent) / 100;

  excuse.status = "REJECTED";
  excuse.penaltyPercent = penaltyPercent;
  excuse.penaltyAmount = penaltyAmount;
  excuse.hrComment = comment || "";

  await excuse.save();

  res.json({
    message: "تم رفض العذر وتطبيق الخصم",
    penaltyAmount
  });
};
