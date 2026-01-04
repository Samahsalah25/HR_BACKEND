const AdminPenalty = require("../models/AdministrativePenalty");
const Employee = require("../models/employee");

const AbsencePenalty = require("../models/absencePenaltySchema");
const LateExcuse = require("../models/LateExcuse");



const createAdminPenalty = async (req, res) => {
  try {
    const { employeeId, branchId,departmentId, violationType, customViolation, penaltyPercent, appliedDate } = req.body;

    // جلب بيانات الموظف
    const employee = await Employee.findById(employeeId);
    if (!employee) return res.status(404).json({ message: "الموظف غير موجود" });

    // تأكد الموظف في القسم اللي اختاره HR
    if (employee.workplace.toString() !== branchId) {
      return res.status(400).json({ message: "الموظف لا ينتمي لهذا الفرع" });
    }
  if (employee.department.toString() !== departmentId) {
      return res.status(400).json({ message: "الموظف لا ينتمي لهذا القسم" });
    }
    // حساب قيمة الخصم
    const penaltyAmount = Math.round((employee.salary?.total * penaltyPercent) / 100);

    // إنشاء الخصم الإداري
    const penalty = await AdminPenalty.create({
      employee: employeeId,
      branch: branchId,
      department:departmentId ,          // هنا تخزين القسم
      violationType,
      customViolation,
      penaltyPercent,
      penaltyAmount,
      appliedBy: req.user._id,
      appliedDate: appliedDate || new Date()
    });

    res.status(201).json({
      message: "تم إنشاء الخصم الإداري بنجاح",
      penalty
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "خطأ في إنشاء الخصم الإداري" });
  }
};



const getAllPenalties = async (req, res) => {
  try {
    const { date } = req.query;

    let start, end;
    if (date) {
      start = new Date(date);
      start.setHours(0, 0, 0, 0);
      end = new Date(date);
      end.setHours(23, 59, 59, 999);
    }

    // نجيب التأخيرات
    const lateExcuses = await LateExcuse.find(date ? { createdAt: { $gte: start, $lte: end } } : {})
      .populate({
  path: "employee",
  select: "name employeeNumber jobTitle department workplace",
  populate: [
    { path: "department", select: "name" },
    { path: "workplace", select: "name" }
  ]
})

      .populate("attendance", "date status")
      .lean();

    const absencePenalties = await AbsencePenalty.find(date ? { createdAt: { $gte: start, $lte: end } } : {})
 .populate({
  path: "employee",
  select: "name employeeNumber jobTitle department workplace",
  populate: [
    { path: "department", select: "name" },
    { path: "workplace", select: "name" }
  ]
})

      .populate("attendance", "date status")
      .lean();

    const adminPenalties = await AdminPenalty.find(date ? { appliedDate: { $gte: start, $lte: end } } : {})
.populate({
  path: "employee",
  select: "name employeeNumber jobTitle department workplace",
  populate: [
    { path: "department", select: "name" },
    { path: "workplace", select: "name" }
  ]
})

      .lean();

    // ندمج كل الخصومات
    const allPenalties = [
      ...lateExcuses.map(l => ({
        id: l._id,
        employeeName: l.employee.name,
         department: l.employee.department?.name,
  branch: l.employee.workplace?.name,
        type: "تأخير",
        penaltyAmount: l.penaltyAmount,
        appliedDate: l.createdAt
      })),
      ...absencePenalties.map(a => ({
        id: a._id,
        employeeName: a.employee.name,
       department: a.employee.department?.name,
  branch: a.employee.workplace?.name,
        type: "غياب",
        penaltyAmount: a.penaltyAmount,
        appliedDate: a.createdAt
      })),
      ...adminPenalties.map(a => ({
        id: a._id,
        employeeName: a.employee.name,
        department: a.employee.department?.name,
  branch: a.employee.workplace?.name,
        type: "مخالفة إدارية",
        penaltyAmount: a.penaltyAmount,
        appliedDate: a.appliedDate
      }))
    ];

    res.json({ success: true, data: allPenalties });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message || "خطأ في السيرفر" });
  }
};

const getPenaltyDetail = async (req, res) => {
  try {
    const { id, type } = req.params; // type: "late" | "absence" | "admin"

    let penalty;

    if (type === "late") {
      penalty = await LateExcuse.findById(id)
 .populate({
  path: "employee",
  select: "name employeeNumber jobTitle department workplace",
  populate: [
    { path: "department", select: "name" },
    { path: "workplace", select: "name" }
  ]
})
        .populate("attendance", "date status")
        .lean();
    } else if (type === "absence") {
      penalty = await AbsencePenalty.findById(id)
       .populate({
  path: "employee",
  select: "name employeeNumber jobTitle department workplace",
  populate: [
    { path: "department", select: "name" },
    { path: "workplace", select: "name" }
  ]
})
        .populate("attendance", "date status")
        .lean();
    } else if (type === "admin") {
      penalty = await AdminPenalty.findById(id)
      .populate({
  path: "employee",
  select: "name employeeNumber jobTitle department workplace",
  populate: [
    { path: "department", select: "name" },
    { path: "workplace", select: "name" }
  ]
})
        .lean();
    } else {
      return res.status(400).json({ message: "نوع الخصم غير صحيح" });
    }

    if (!penalty) return res.status(404).json({ message: "الخصم غير موجود" });

    // بيانات التفاصيل
    const detail = {
      employeeName: penalty.employee.name,
      department: penalty.employee.department?.name,
      employeeNumber: penalty.employee.employeeNumber,
      jobTitle: penalty.employee.jobTitle,
      branch: penalty.employee.workplace?.name,
      reason: type === "late" ? "تأخير" : type === "absence" ? "غياب" : "مخالفة إدارية",
      penaltyAmount: penalty.penaltyAmount,
      appliedDate: type === "admin" ? penalty.appliedDate : penalty.createdAt ,
      createdAt:penalty.createdAt
    };

    res.json({ success: true, data: detail });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message || "خطأ في السيرفر" });
  }
};

module.exports = { createAdminPenalty  ,getAllPenalties ,getPenaltyDetail};
