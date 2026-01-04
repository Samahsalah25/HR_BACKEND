const AbsencePenalty = require("../models/absencePenaltySchema");
const Attendance = require("../models/Attendance");
const Employee = require("../models/employee");

exports.createAbsencePenalty = async (req, res) => {
  try {
    const { attendanceId, penaltyPercent } = req.body;

    const attendance = await Attendance.findById(attendanceId)
      .populate("employee");

    if (!attendance)
      return res.status(404).json({ message: "الحضور غير موجود" });

    if (attendance.status !== "غائب")
      return res.status(400).json({ message: "هذا اليوم ليس غيابًا" });

    // منع التكرار
    const exists = await AbsencePenalty.findOne({ attendance: attendanceId });
    if (exists)
      return res.status(400).json({ message: "تم تطبيق خصم مسبقًا" });

  const employee = await Employee.findOne({  _id:attendance.employee });

    const salary = employee.salary.total;
    const penaltyAmount = (salary * penaltyPercent) / 100;

    const date = new Date(attendance.date);

    const penalty = await AbsencePenalty.create({
      attendance: attendance._id,
      employee: attendance.employee._id,
      penaltyPercent,
      penaltyAmount,
      month: date.getMonth() + 1,
      year: date.getFullYear(),
      appliedBy: req.user._id
    });

    res.json({ success: true, penalty });

  } catch (error) {
    res.status(500).json({ message: "خطأ في إنشاء خصم الغياب", error });
  }
};
