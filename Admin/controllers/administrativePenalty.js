const AdminPenalty = require("../models/AdministrativePenalty");
const Employee = require("../models/employee");

const AbsencePenalty = require("../models/absencePenaltySchema");
const LateExcuse = require("../models/LateExcuse");
const Department = require("../models/depaertment");



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
      penalty ,
      success:true
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "خطأ في إنشاء الخصم الإداري" });
  }
};



const getAllPenalties = async (req, res) => {
  try {
    const { date } = req.query;

    // let start, end;
    // if (date) {
    //   start = new Date(date);
    //   start.setHours(0, 0, 0, 0);
    //   end = new Date(date);
    //   end.setHours(23, 59, 59, 999);
    // }
    let start, end;
if (date) {
  // نفترض إن الفرونت هيبعت "YYYY-MM" زي "2026-01"
  const [year, month] = date.split("-");
  start = new Date(year, month - 1, 1); // أول يوم في الشهر
  end = new Date(year, month, 0, 23, 59, 59, 999); // آخر يوم في الشهر
}


    // نجيب التأخيرات
    const lateExcuses = await LateExcuse.find(date ? { createdAt: { $gte: start, $lte: end } } : {})
      .populate({
  path: "employee",
  select: "name employeeNumber jobTitle department workplace salary",
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
  select: "name employeeNumber jobTitle department workplace salary",
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
  select: "name employeeNumber jobTitle department workplace salary",
  populate: [
    { path: "department", select: "name" },
    { path: "workplace", select: "name" }
  ]
})

      .lean();

    // ندمج كل الخصومات
 const allPenalties = [
  ...lateExcuses.filter(l => l.employee).map(l => ({
    id: l._id,
    employeeName: l.employee.name,
    employeeSalary: l.employee.salary,
    department: l.employee.department?.name,
    branch: l.employee.workplace?.name,
    type: "تأخير",
    penaltyAmount: l.penaltyAmount,
    appliedDate: l.createdAt
  })),
  ...absencePenalties.filter(a => a.employee).map(a => ({
    id: a._id,
    employeeName: a.employee.name,
    employeeSalary: a.employee.salary,
    department: a.employee.department?.name,
    branch: a.employee.workplace?.name,
    type: "غياب",
    penaltyAmount: a.penaltyAmount,
    appliedDate: a.createdAt
  })),
  ...adminPenalties.filter(a => a.employee).map(a => ({
    id: a._id,
    employeeName: a.employee.name,
    employeeSalary: a.employee.salary,
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

// const getPenaltyDetail = async (req, res) => {
//   try {
//     const { id, type } = req.params; // type: "late" | "absence" | "admin"

//     let penalty;

//     if (type === "late") {
//       penalty = await LateExcuse.findById(id)
//  .populate({
//   path: "employee",
//   select: "name employeeNumber jobTitle department workplace",
//   populate: [
//     { path: "department", select: "name" },
//     { path: "workplace", select: "name" }
//   ]
// })
//         .populate("attendance", "date status")
//         .lean();
//     } else if (type === "absence") {
//       penalty = await AbsencePenalty.findById(id)
//        .populate({
//   path: "employee",
//   select: "name employeeNumber jobTitle department workplace",
//   populate: [
//     { path: "department", select: "name" },
//     { path: "workplace", select: "name" }
//   ]
// })
//         .populate("attendance", "date status")
//         .lean();
//     } else if (type === "admin") {
//       penalty = await AdminPenalty.findById(id)
//       .populate({
//   path: "employee",
//   select: "name employeeNumber jobTitle department workplace",
//   populate: [
//     { path: "department", select: "name" },
//     { path: "workplace", select: "name" }
//   ]
// })
//         .lean();
//     } else {
//       return res.status(400).json({ message: "نوع الخصم غير صحيح" });
//     }

//     if (!penalty) return res.status(404).json({ message: "الخصم غير موجود" });

//     // بيانات التفاصيل
//     const detail = {
//       employeeName: penalty.employee.name,
//       department: penalty.employee.department?.name,
//       employeeNumber: penalty.employee.employeeNumber,
//       jobTitle: penalty.employee.jobTitle,
//       branch: penalty.employee.workplace?.name,
//       reason: type === "late" ? "تأخير" : type === "absence" ? "غياب" : "مخالفة إدارية",
//       penaltyAmount: penalty.penaltyAmount,
//       appliedDate: type === "admin" ? penalty.appliedDate : penalty.createdAt ,
//       createdAt:penalty.createdAt
//     };

//     res.json({ success: true, data: detail });

//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ message: err.message || "خطأ في السيرفر" });
//   }
// };
const getPenaltyDetail = async (req, res) => {
  try {
    const { id, type } = req.params;

    // 🔹 تحويل النوع العربي لنوع داخلي
    const typeMap = {
      "تأخير": "late",
      "غياب": "absence",
      "مخالفة إدارية": "admin"
    };

    const mappedType = typeMap[type];

    if (!mappedType) {
      return res.status(400).json({ message: "نوع الخصم غير صحيح" });
    }

    let penalty;

    if (mappedType === "late") {
      penalty = await LateExcuse.findById(id)
        .populate({
          path: "employee",
          select: "name employeeNumber jobTitle department workplace",
          populate: [
            { path: "department", select: "name" },
            { path: "workplace", select: "name" }
          ]
        })
        .populate("attendance", "date status").populate("appliedBy", "name")
        .lean();

    } else if (mappedType === "absence") {
      penalty = await AbsencePenalty.findById(id)
        .populate({
          path: "employee",
          select: "name employeeNumber jobTitle department workplace",
          populate: [
            { path: "department", select: "name" },
            { path: "workplace", select: "name" }
          ]
        })
        .populate("attendance", "date status").populate("appliedBy", "name")
        .lean();

    } else if (mappedType === "admin") {
      penalty = await AdminPenalty.findById(id)
        .populate({
          path: "employee",
          select: "name employeeNumber jobTitle department workplace",
          populate: [
            { path: "department", select: "name" },
            { path: "workplace", select: "name" }
          ]
        }).populate("appliedBy", "name")
        .lean();
    }

    if (!penalty) {
      return res.status(404).json({ message: "الخصم غير موجود" });
    }

    // 🔹 بيانات التفاصيل
    const detail = {
      employeeName: penalty.employee.name,
      department: penalty.employee.department?.name,
      employeeNumber: penalty.employee.employeeNumber,
      jobTitle: penalty.employee.jobTitle,
      branch: penalty.employee.workplace?.name,
      reason: type, // نرجع العربي زي ما هو
      penaltyAmount: penalty.penaltyAmount,
      appliedDate: mappedType === "admin" ? penalty.appliedDate : penalty.createdAt,
      createdAt: penalty.createdAt ,
      appliedBy: penalty.appliedBy?.name || "غير معروف"
    };

    res.json({ success: true, data: detail });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message || "خطأ في السيرفر" });
  }
};


// GET /departments/by-branch/:branchId
const getDepartmentsByBranch = async (req, res) => {
  try {
    const { branchId } = req.query;

    // 1️⃣ هات IDs الأقسام من الموظفين
    const departmentIds = await Employee.distinct("department", {
      workplace: branchId
    });

    // 2️⃣ هات بيانات الأقسام
    const departments = await Department.find({
      _id: { $in: departmentIds }
    }).select("name");

    res.json({
      success: true,
      data: departments
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


const getEmployeesByBranchAndDepartment = async (req, res) => {
  try {
    const { branchId, departmentId } = req.query;

    if (!branchId || !departmentId) {
      return res.status(400).json({
        message: "branchId و departmentId مطلوبين"
      });
    }

    const employees = await Employee.find({
      workplace: branchId,
      department: departmentId
    })
      .select("name jobTitle salary") //  بس اللي نحتاجه
      .sort({ name: 1 });

    res.json({
      success: true,
      data: employees
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "خطأ في جلب الموظفين"
    });
  }
};

// خصومات  موظف معيت
const getEmployeePenalties = async (req, res) => {
  try {
    const { employeeId } = req.params;

    const STATUS_MAP = {
      APPROVED: "معتمد",
      APPLIED :"معتمد" ,
      REJECTED: "مرفوض",
      PENDING: "قيد الانتظار",
      مقبول: "معتمد",
      مرفوض: "مرفوض",
      قيد_الانتظار: "قيد الانتظار"
    };

    const mapStatus = (status) =>
      STATUS_MAP[status] || status;

    // ⏱ Late Excuses
    const lateExcuses = await LateExcuse.find({ employee: employeeId })
      .populate({
        path: "employee",
        select: "name employeeNumber jobTitle department",
        populate: { path: "department", select: "name" }
      })
      .populate("appliedBy", "name")
      .lean();

    // 🚫 Absence Penalties
    const absencePenalties = await AbsencePenalty.find({ employee: employeeId })
      .populate({
        path: "employee",
        select: "name employeeNumber jobTitle department",
        populate: { path: "department", select: "name" }
      })
      .populate("appliedBy", "name")
      .lean();

    // ⚠ Admin Penalties
    const adminPenalties = await AdminPenalty.find({ employee: employeeId })
      .populate({
        path: "employee",
        select: "name employeeNumber jobTitle department",
        populate: { path: "department", select: "name" }
      })
      .populate("appliedBy", "name")
      .lean();

    // 🔁 Unified Response
    const penalties = [
      ...lateExcuses.map(p => ({
        reason: p.reason,
        amount: p.penaltyAmount,
        appliedDate: p.createdAt,
        status: mapStatus(p.status),
        employeeName: p.employee.name,
        department: p.employee.department?.name,
        jobTitle: p.employee.jobTitle,
        employeeNumber: p.employee.employeeNumber,
        addedBy: p.appliedBy?.name || "-",
        type: "تأخير"
      })),

      ...absencePenalties.map(p => ({
        reason: "غياب",
        amount: p.penaltyAmount,
        appliedDate: p.createdAt,
        status: "معتمد", // الغياب خصم مباشر
        employeeName: p.employee.name,
        department: p.employee.department?.name,
        jobTitle: p.employee.jobTitle,
        employeeNumber: p.employee.employeeNumber,
        addedBy: p.appliedBy?.name || "-",
        type: "غياب"
      })),

      ...adminPenalties.map(p => ({
        reason:
          p.violationType === "أخرى"
            ? p.customViolation
            : p.violationType,
        amount: p.penaltyAmount,
        appliedDate: p.appliedDate,
        status: mapStatus(p.status),
        employeeName: p.employee.name,
        department: p.employee.department?.name,
        jobTitle: p.employee.jobTitle,
        employeeNumber: p.employee.employeeNumber,
        addedBy: p.appliedBy?.name || "-",
        type: "مخالفة إدارية"
      }))
    ];

    res.json({ success: true, data: penalties });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "خطأ في السيرفر" });
  }
};

// get departments 
module.exports = { createAdminPenalty  ,getAllPenalties ,getPenaltyDetail ,getEmployeePenalties ,getDepartmentsByBranch ,getEmployeesByBranchAndDepartment};
