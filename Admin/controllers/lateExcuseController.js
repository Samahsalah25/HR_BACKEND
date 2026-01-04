const LateExcuse = require("../models/LateExcuse");
const Attendance = require("../models/Attendance");
const Employee = require("../models/employee");
const Notification = require("../models/notification");
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

    res.status(201).json({ message: "تم إرسال سبب التأخير بنجاح", excuse ,success:true });

  } catch (err) {
   
   console.error(err);
    res.status(500).json({ message: "خطأ في السيرفر" });
  }
};

exports.getPendingExcuses = async (req, res) => {
  try {
    const excuses = await LateExcuse.find({ status: "PENDING" })
      .populate("employee", "name salary") // اسم الموظف + راتبه
      .populate("attendance", "date lateMinutes checkIn");

    res.json(excuses);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message || "خطأ في السيرفر" });
  }
};


exports.getExcuseByAttendance = async (req, res) => {
  const { attendanceId } = req.params;

  const excuse = await LateExcuse.findOne({ attendance: attendanceId })
    .populate("employee", "name salary");

  if (!excuse) {
    return res.json(null); // مفيش عذر
  }
  
 res.status(201).json({
      message: "get excuse sucessfull",
      excuse ,
      success:true
    })
};




//  قبول العذر
exports.approveExcuse = async (req, res) => {
  try {
    const excuse = await LateExcuse.findById(req.params.id)
      .populate("employee");

    if (!excuse) return res.status(404).json({ message: "العذر غير موجود" });
    if (excuse.status !== "PENDING")
      return res.status(400).json({ message: "تم معالجة هذا العذر سابقاً" });

    excuse.status = "APPROVED";
    excuse.penaltyAmount = 0;
   excuse.appliedBy=req.user._id;

    await excuse.save();

    res.json({ message: "تم قبول العذر", excuse ,success:true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message || "خطأ في السيرفر" });
  }
};

// 3️⃣ رفض العذر + خصم


exports.rejectExcuse = async (req, res) => {
  try {
    const { penaltyPercent } = req.body;

    if (!penaltyPercent || penaltyPercent <= 0) {
      return res.status(400).json({ message: "نسبة الخصم مطلوبة" });
    }

    const excuse = await LateExcuse.findById(req.params.id)
      .populate("employee");

    if (!excuse) return res.status(404).json({ message: "العذر غير موجود" });
    if (excuse.status !== "PENDING")
      return res.status(400).json({ message: "تم معالجة هذا العذر سابقاً" });

    const salary = excuse.employee.salary.total || 0;
    const penaltyAmount = (salary * penaltyPercent) / 100;

    excuse.status = "REJECTED";
    excuse.penaltyPercent = penaltyPercent;
    excuse.penaltyAmount = penaltyAmount;
   excuse.appliedBy=req.user._id;

    await excuse.save();

    //  إنشاء الإشعار للموظف
    await Notification.create({
      employee: excuse.employee._id,
      type: "late", // 
      message: `تم رفض عذرك وتأثر راتبك بمقدار ${penaltyAmount} ريال`,
      link: "/employee/salary" // رابط الشاشة في الفرونت
    });

    res.json({
      message: "تم رفض العذر وتطبيق الخصم + إرسال إشعار للموظف",
      penaltyAmount,
      excuse ,
      success:true
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message || "خطأ في السيرفر" });
  }
};

