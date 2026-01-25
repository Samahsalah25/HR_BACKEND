const Addition = require("../models/addition");
const Employee = require("../models/employee");
const AdditionHours = require("../models/AdditionHours");

// إنشاء الإضافة (موظف واحد / قسم / كل الموظفين)
exports.createAddition = async (req, res) => {
  try {
    const {
      addTo,
      targetId,
      addType,
      amount,
      needsApproval,
      addtionType,
      reason,
      applyDate
    } = req.body;

    const userId = req.user._id;

    let employees = [];

    if (addTo === "employee") {
      const emp = await Employee.findById(targetId);
      if (!emp) return res.status(404).json({ message: "Employee not found" });
      employees.push(emp);

    } else if (addTo === "department") {
      employees = await Employee.find({ department: targetId });

    } else if (addTo === "all") {
      employees = await Employee.find();
    }

    const additions = [];

    for (const employee of employees) {
      let finalAmount = 0;

      if (addType === "percent") {
        finalAmount = (employee.salary.total || 0) * (amount / 100);
      } else {
        finalAmount = amount;
      }

      const status = needsApproval ? "انتظار الموافقة" : "مقبول";

      const newAddition = new Addition({
        employee: employee._id,
        addType,
        amount: finalAmount,
        addedBy: userId,
        needsApproval,
        status,
        addtionType,
        reason,
        addTo,
        targetId,
        applyDate
      });

      await newAddition.save();

      const populated = await newAddition.populate(
        "employee addedBy approvedBy rejectedBy"
      );

      additions.push(populated);
    }

    res.status(201).json(additions);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};


// تحديث حالة الإضافة (موافقة / رفض / دفع)
exports.updateAdditionStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const adminId = req.user._id;
    const addition = await Addition.findById(req.params.id);
    if (!addition) return res.status(404).json({ message: "Not found" });

    if (status === "مقبول") {
      addition.status = "مقبول";
      addition.approvedBy = adminId;
    } else if (status === "مرفوض") {
      addition.status = "مرفوض";
      addition.rejectedBy = adminId;
    } else if (status === "مدفوع") {
      addition.status = "مدفوع";
      addition.approveDate = new Date();
    } else {
      return res.status(400).json({ message: "Invalid status" });
    }

    await addition.save();
    const populated = await addition.populate("employee addedBy approvedBy rejectedBy");
    res.json(populated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};


// جلب كل الإضافات
// exports.getAllAdditions = async (req, res) => {
//   try {
//     const { month, year } = req.query;

//     let filter = {};

//     if (month && year) {
//       const startDate = new Date(year, month - 1, 1); // أول يوم في الشهر
//       const endDate = new Date(year, month, 1);       // أول يوم في الشهر اللي بعده

//       filter.createdAt = {
//         $gte: startDate,
//         $lt: endDate
//       };
//     }

//    const additions = await Addition.find(filter)
//   .populate({
//     path: "employee",
//     select: "name employeeNumber jobTitle department workplace",
//     populate: [
//       { path: "department", select: "name" },
//       { path: "workplace", select: "name" }
//     ]
//   })
//   .populate("addedBy", "name")
//   .populate("approvedBy", "name")
//   .populate("rejectedBy", "name")
//   .sort({ createdAt: -1 });

//     res.json(additions);
//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// };
// jjnnvgh
// جلب كل الإضافات


// جلب كل الإضافات
exports.getAllAdditions = async (req, res) => {
  try {
    const { month, year } = req.query;

    let filter = {};

    if (month && year) {
      const startDate = new Date(year, month - 1, 1);
      const endDate = new Date(year, month, 1);

      filter.createdAt = {
        $gte: startDate,
        $lt: endDate
      };
    }

    // =========================
    // 🟢 تحديث الحالة تلقائياً (مقبول → مدفوع)
    // =========================
    const today = new Date();

    await Addition.updateMany(
      {
        status: "مقبول",
        applyDate: { $lte: today }
      },
      {
        $set: { status: "مدفوع" }
      }
    );

    // =========================
    // 🔵 جلب البيانات
    // =========================
    const additions = await Addition.find(filter)
      .populate({
        path: "employee",
        select: "name employeeNumber jobTitle department workplace",
        populate: [
          { path: "department", select: "name" },
          { path: "workplace", select: "name" }
        ]
      })
      .populate("addedBy", "name")
      .populate("approvedBy", "name")
      .populate("rejectedBy", "name")
      .sort({ createdAt: -1 });

    // =========================
    // 🟣 تحديد حالة الموافقة الإدارية
    // =========================
    const formattedAdditions = additions.map(addition => {
      let approvalStatus = "-";

      if (addition.needsApproval) {
        if (addition.status === "انتظار الموافقة") {
          approvalStatus = "قيد الانتظار";
        } else if (addition.status === "مقبول" || addition.status === "مدفوع") {
          approvalStatus = "مقبول";
        } else if (addition.status === "مرفوض") {
          approvalStatus = "مرفوض";
        }
      }

      return {
        ...addition.toObject(),
        approvalStatus
      };
    });

    res.status(200).json(formattedAdditions);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


//  هجيب هنا كل الاضافات لموظف معين 

exports.getEmployeeAdditions = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const today = new Date();

    // ======================
    // 1️⃣ تحديث تلقائي (مقبول → مدفوع)
    // ======================
    await Addition.updateMany(
      {
        employee: employeeId,
        status: "مقبول",
        applyDate: { $lte: today }
      },
      { $set: { status: "مدفوع" } }
    );

    // ======================
    // 2️⃣ المكافآت / الإضافات المالية
    // ======================
    const additions = await Addition.find({ employee: employeeId })
      .populate("employee", "name department jobTitle employeeNumber")
      .populate("addedBy", "name")
      .lean();

    const formattedAdditions = additions.map(a => {
      let approvalStatus = "-";

      if (a.needsApproval) {
        if (a.status === "انتظار الموافقة") approvalStatus = "قيد الانتظار";
        else if (a.status === "مرفوض") approvalStatus = "مرفوض";
        else approvalStatus = "مقبول";
      }

      return {
        type: "مكافأة",
        reason: a.addtionType === "أخرى" ? a.reason : a.addtionType,
        amount: a.amount,
        applyDate: a.applyDate,
        createdAt: a.createdAt,
        status: a.status, // مدفوع / مقبول / انتظار الموافقة
        approvalStatus,
        addedBy: a.addedBy?.name || "-",
        employee: {
          name: a.employee?.name || "-",
          department: a.employee?.department?.name || "-",
          jobTitle: a.employee?.jobTitle || "-",
          employeeNumber: a.employee?.employeeNumber || "-"
        }
      };
    });

    // ======================
    // 3️⃣ الساعات الإضافية
    // ======================
    const additionHours = await AdditionHours.find({
      employeeId,
      status: "approved"
    })
      .populate("employeeId", "name department jobTitle employeeNumber")
      .lean();

    const formattedHours = additionHours.map(h => ({
      type: "ساعات إضافية",
      reason: "ساعات إضافية",
      amount: h.amount,
      applyDate: h.date,
      createdAt: h.createdAt,
      status: "مدفوع",
      approvalStatus: "مقبول",
      addedBy: "-", // محسوبة تلقائي
      employee: {
        name: h.employeeId?.name || "-",
        department: h.employeeId?.department?.name || "-",
        jobTitle: h.employeeId?.jobTitle || "-",
        employeeNumber: h.employeeId?.employeeNumber || "-"
      }
    }));

    // ======================
    // 4️⃣ دمج الكل
    // ======================
    const result = [...formattedAdditions, ...formattedHours].sort(
      (a, b) => new Date(b.applyDate) - new Date(a.applyDate)
    );

    res.json({
      success: true,
      data: result
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "خطأ في جلب الإضافات",
      error: err.message
    });
  }
};
