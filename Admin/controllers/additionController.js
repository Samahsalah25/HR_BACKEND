const Addition = require("../models/addition");
const Employee = require("../models/employee");

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
    const { status, adminId } = req.body;
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
// جلب كل الإضافات
const Addition = require("../models/additionSchema");

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
