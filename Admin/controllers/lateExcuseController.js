const LateExcuse = require("../models/LateExcuse");
const Attendance = require("../models/Attendance");
const Employee = require("../models/employee");
exports.createLateExcuse = async (req, res) => {
  try {
    const { reason } = req.body;

    if (!reason) {
      return res.status(400).json({ message: "السبب مطلوب" });
    }

    // Employee من authenticate
    const employee = await Employee.findOne({ user: req.user._id });
    if (!employee) return res.status(404).json({ message: "الموظف غير موجود" });

    // آخر حضور لليوم
    const today = new Date();
    today.setHours(0,0,0,0);

    const attendance = await Attendance.findOne({
      employee: employee._id,
      date: { $gte: today }
    });

    if (!attendance) return res.status(404).json({ message: "سجل الحضور غير موجود" });

    if (attendance.status !== "متأخر")
      return res.status(400).json({ message: "هذا الحضور ليس متأخرًا" });

    if (attendance.hasExcuse)
      return res.status(400).json({ message: "تم إرسال عذر بالفعل" });

    const excuse = await LateExcuse.create({
      attendance: attendance._id,
      employee: employee._id,
      reason,
      file: req.file?.path || null
    });

    attendance.hasExcuse = true;
    await attendance.save();

    res.status(201).json({ message: "تم إرسال سبب التأخير بنجاح", excuse });

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
