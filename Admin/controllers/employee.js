const Employee = require('../models/employee');
const User = require('../models/user')
const ResidencyYear = require('../models/ResidencyYear');
const LeaveBalance=require('../models/leaveBalanceModel')
const mongoose=require('mongoose')
const Attendance=require('../models/Attendance');
const Contract = require("../models/Contract");
const Task = require('../models/Task');
const Request=require('../models/requestModel')

 require("../models/leaveBalanceModel");

exports.employeeOverview = async (req, res) => {
  try {
    const userId = req.user.id;

    // نجيب الموظف
    const employee = await Employee.findOne({ user: userId }).populate("contract");
    if (!employee) {
      return res.status(404).json({ error: "الموظف غير موجود" });
    }

    // نجيب رصيد الإجازات
    const leaveBalance = await LeaveBalance.findOne({ employee: employee._id });

    // نحسب الإجمالي
    let totalRemaining = 0;
    if (leaveBalance) {
      totalRemaining =
        (leaveBalance.annual || 0) +
        (leaveBalance.sick || 0) +
        (leaveBalance.marriage || 0) +
        (leaveBalance.emergency || 0) +
        (leaveBalance.maternity || 0) +
        (leaveBalance.unpaid || 0);
    }

    // نحسب الغياب السنوي
    const startOfYear = new Date(new Date().getFullYear(), 0, 1);
    const absences = await Attendance.countDocuments({
      employee: employee._id,
      status: "غائب",
      date: { $gte: startOfYear }
    });

    // نحسب الأيام لحد انتهاء العقد
    let daysUntilContractEnd = null;
    if (employee.contract?.end) {
      const today = new Date();
      const diff = new Date(employee.contract.end) - today;
      daysUntilContractEnd = Math.max(Math.ceil(diff / (1000 * 60 * 60 * 24)), 0);
    }

    res.json({
      name: employee.name,
      jobTitle: employee.jobTitle,
      leaveBalances: leaveBalance
        ? {
            annual: leaveBalance.annual,
            sick: leaveBalance.sick,
            marriage: leaveBalance.marriage,
            emergency: leaveBalance.emergency,
            maternity: leaveBalance.maternity,
            unpaid: leaveBalance.unpaid,
            totalRemaining
          }
        : {},
      annualAbsences: absences,
      daysUntilContractEnd
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "خطأ في السيرفر" });
  }
};



exports.createEmployee = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const {
      name,
      email,
      password,
      jobTitle,
      employeeNumber,
      department,
      manager,
      employmentType,
      contractStart,
      contractDurationId,
      residencyStart,
      residencyDurationId,
      workHoursPerWeek,
      workplace,
      salary,
      role
    } = req.body;

    if (req.user.role !== "HR") {
      return res.status(403).json({ message: "ليس لديك صلاحية" });
    }

    // ✅ تشيك مسبق على الايميل
    const emailExists = await User.findOne({ email }).session(session);
    if (emailExists) {
      return res.status(400).json({ message: "البريد الإلكتروني مستخدم بالفعل" });
    }

    // ✅ تشيك مسبق على رقم الموظف
    const empNumExists = await Employee.findOne({ employeeNumber }).session(session);
    if (empNumExists) {
      return res.status(400).json({ message: "رقم الموظف مستخدم بالفعل" });
    }

    // إنشاء المستخدم
    const user = await User.create([{ name, email, password, role }], { session });

    // إنشاء الموظف
    let employee = await Employee.create([{
      name,
      jobTitle,
      employeeNumber,
      department,
      manager,
      employmentType,
      contract: { start: contractStart, duration: contractDurationId },
      residency: { start: residencyStart, duration: residencyDurationId },
      workHoursPerWeek,
      workplace,
      salary,
      user: user[0]._id
    }], { session });

    employee = employee[0];

    // جلب رصيد الإجازات الافتراضي
    const companyLeaves = await LeaveBalance.findOne({ employee: null }).session(session);
    if (!companyLeaves) {
      throw new Error("رصيد الإجازات الافتراضي للشركة غير محدد");
    }
const totalLeaveBalance = companyLeaves.annual + companyLeaves.sick + companyLeaves.marriage +
                          companyLeaves.emergency + companyLeaves.maternity + companyLeaves.unpaid;
    await LeaveBalance.create([{
      employee: employee._id,
      annual: companyLeaves.annual,
      sick: companyLeaves.sick,
      marriage: companyLeaves.marriage,
      emergency: companyLeaves.emergency,
      maternity: companyLeaves.maternity,
      unpaid: companyLeaves.unpaid ,
      remaining: totalLeaveBalance 
    }], { session });

    // ✅ لو كله تمام نعمل commit
    await session.commitTransaction();
    session.endSession();

    // ✅ بعد الكوميت نعمل populate براحه
    const populatedEmployee = await Employee.findById(employee._id)
      .populate("contract.duration")
      .populate("residency.duration");

    res.status(201).json({ user: user[0], employee: populatedEmployee });

  } catch (error) {
    await session.abortTransaction();
    session.endSession();

    // ✅ مسك errors بتاعت الـ duplicate keys
    if (error.code === 11000) {
      if (error.keyPattern?.employeeNumber) {
        return res.status(400).json({ message: "رقم الموظف مستخدم بالفعل" });
      }
      if (error.keyPattern?.email) {
        return res.status(400).json({ message: "البريد الإلكتروني مستخدم بالفعل" });
      }
      return res.status(400).json({ message: "قيمة مكررة في البيانات" });
    }

    console.error(error);
    res.status(500).json({ message: "حدث خطأ أثناء إنشاء الموظف", error: error.message });
  }
};
exports.employeeStatus = async (req, res) => {
  try {
    const userId = req.user.id;

    // نجيب الموظف المرتبط باليوزر
    const employee = await Employee.findOne({ user: userId }).populate("workplace");
    if (!employee) {
      return res.status(404).json({ error: "الموظف غير مرتبط بالحساب" });
    }

    const branch = employee.workplace;

    // تاريخ النهاردة
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));

    // نجيب الحضور بتاع النهاردة
    let attendance = await Attendance.findOne({
      employee: employee._id,
      date: { $gte: startOfDay, $lte: endOfDay }
    });

    res.json({
      today: formatArabicDate(new Date()), // 🟢 التاريخ بالصيغة المظبوطة
      officialCheckIn: formatTime(branch?.workStart),
      officialCheckOut: formatTime(branch?.workEnd),
      employeeCheckIn: attendance?.checkIn
        ? attendance.checkIn.toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: true
          })
        : null,
      employeeCheckOut: attendance?.checkOut
        ? attendance.checkOut.toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: true
          })
        : null,
      status: attendance
        ? attendance.checkOut
          ? "تم الانصراف"
          : attendance.checkIn
          ? "تم تسجيل الحضور"
          : "لم يتم تسجيل الحضور"
        : "لم يتم تسجيل الحضور"
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "خطأ في السيرفر" });
  }
};

// 🟢 دالة تنسيق التاريخ
function formatArabicDate(date) {
  const day = new Intl.DateTimeFormat("ar-EG", {
    day: "numeric",
    numberingSystem: "latn"
  }).format(date);

  const month = new Intl.DateTimeFormat("ar-EG", {
    month: "long"
  }).format(date);

  const year = new Intl.DateTimeFormat("ar-EG", {
    year: "numeric",
    numberingSystem: "latn"
  }).format(date);

  return `${day} ${month} ${year}`;
}

// 🟢 دالة تحويل وقت الفرع (09:00 → 09:00 AM)
function formatTime(timeStr) {
  if (!timeStr) return null;
  const [hours, minutes] = timeStr.split(":");
  const date = new Date();
  date.setHours(Number(hours), Number(minutes));
  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true
  });
}



exports.getMyAttendanceRecord = async (req, res) => {
  try {
    const userId = req.user._id;

    // نجيب الموظف المرتبط باليوزر
    const employee = await Employee.findOne({ user: userId });
    if (!employee) {
      return res.status(404).json({ error: "الموظف غير مرتبط بالحساب" });
    }

    // حساب آخر 30 يوم
    const today = new Date();
    const past30Days = new Date();
    past30Days.setDate(today.getDate() - 30);

    // نجيب السجلات من آخر 30 يوم (الأحدث أولاً)
    const records = await Attendance.find({
      employee: employee._id,
      date: { $gte: past30Days, $lte: today }
    }).sort({ date: -1 });

    // تنسيق البيانات
    const formattedRecords = records.map((rec) => {
      // صيغة اليوم والتاريخ
      const day = new Date(rec.date).toLocaleDateString("ar-EG", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
        numberingSystem: "latn"
      });

      // وقت الدخول والخروج
      const checkIn = rec.checkIn
        ? rec.checkIn.toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
          })
        : null;

      const checkOut = rec.checkOut
        ? rec.checkOut.toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
          })
        : "لم يتم تسجيل الانصراف";

      // الوقت اللي اشتغله
      let workedTime = "لم يكتمل اليوم";
      if (rec.checkIn && rec.checkOut) {
        const diffMs = rec.checkOut - rec.checkIn;
        const diffMins = Math.floor(diffMs / 60000);
        const hours = Math.floor(diffMins / 60);
        const mins = diffMins % 60;
        workedTime = `${hours} س, ${mins} د`;
      } else if (rec.checkIn && !rec.checkOut) {
        workedTime = "لم يكتمل اليوم";
      }

      // الحالة
      let status = "غير محدد";
      if (rec.status === "حاضر") status = "بدون تأخير";
      else if (rec.status === "متأخر") status = "بتأخير";
      else if (rec.status === "غائب") status = "غائب";

      return {
        day,
        employeeCheckIn: checkIn,
        employeeCheckOut: checkOut,
        workedTime,
        status,
      };
    });

    res.json({ records: formattedRecords });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "خطأ في السيرفر" });
  }
};



function formatTime(date) {
  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true
  });
}


exports.getMyTasks = async (req, res) => {
  try {
    const userId = req.user._id;
    const statusFilter = req.query.status; // "مكتملة", "قيد العمل", "متأخرة" أو undefined
    const periodDays = parseInt(req.query.period) || 90; 
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - periodDays);

    // جلب بيانات الموظف
    const employee = await Employee.findOne({ user: userId });
    if (!employee) return res.status(404).json({ error: "الموظف غير مرتبط بالحساب" });

    // بناء فلترة الـ query
    let filter = { assignedTo: employee._id, assignDate: { $gte: fromDate } };
    if (statusFilter) filter.status = statusFilter;

    // جلب المهام حسب الفلترة
    const tasks = await Task.find(filter).sort({ assignDate: -1 });

    let inProgressCount = 0;
    let completedCount = 0;

    const formattedTasks = tasks.map(task => {
      const assignDay = new Date(task.assignDate).toLocaleDateString('ar-EG', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        numberingSystem: 'latn'
      });

      let endInfo = "";
      if (task.status === "مكتملة") {
        completedCount++;
        endInfo = `تم الانتهاء منها في ${new Date(task.completedDate || task.dueDate).toLocaleDateString('ar-EG', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
          numberingSystem: 'latn'
        })}`;
      } else if (task.status === "قيد العمل") {
        inProgressCount++;
        endInfo = `تاريخ الانتهاء : ${new Date(task.dueDate).toLocaleDateString('ar-EG', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
          numberingSystem: 'latn'
        })}`;
      } else if (task.status === "متأخرة") {
        inProgressCount++;
        endInfo = `المهام متأخرة منذ: ${new Date(task.dueDate).toLocaleDateString('ar-EG', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
          numberingSystem: 'latn'
        })}`;
      }

      return {
        _id:task._id,
        title: task.title,
        status: task.status,
        priority: task.priority || 'متوسطة',
        assignDate: assignDay,
        endInfo,
        notes: task.notes || "",
        attachments: task.attachments || []
      };
    });

    res.json({
      inProgressCount,
      completedCount,
      tasks: formattedTasks
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "خطأ في السيرفر" });
  }
};

exports.getMyRequests = async (req, res) => {
  try {
    const userId = req.user._id;

    const employee = await Employee.findOne({ user: userId });
    if (!employee) return res.status(404).json({ error: "الموظف غير مرتبط بالحساب" });

    const periodDays = parseInt(req.query.period) || 90;
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - periodDays);

    const statusFilter = req.query.status;

    let filter = { 
      employee: employee._id,
      createdAt: { $gte: fromDate }
    };
    if (statusFilter) filter.status = statusFilter;

    const requests = await Request.find(filter)
      .populate('employee', 'name jobTitle')
      .populate('decidedBy', 'name')
      .sort({ createdAt: -1 });

    let pendingCount = 0, approvedCount = 0, rejectedCount = 0, forwardedCount = 0;

    const formattedRequests = requests.map(reqItem => {
      if (reqItem.status === "قيد المراجعة") pendingCount++;
      else if (reqItem.status === "مقبول") approvedCount++;
      else if (reqItem.status === "مرفوض") rejectedCount++;
      else if (reqItem.status === "محول") forwardedCount++;

      return {
        _id:reqItem._id ,
        employeeName: reqItem.employee.name,
        jobTitle: reqItem.employee.jobTitle,
        type: reqItem.type,
        status: reqItem.status,
        submittedAt: `${reqItem.createdAt.getDate()}/${reqItem.createdAt.getMonth() + 1}/${reqItem.createdAt.getFullYear()}`,
        notes: reqItem.notes || [],
        attachments: reqItem.attachments || []
      };
    });

    res.json({
      counts: {
        pending: pendingCount,
        approved: approvedCount,
        rejected: rejectedCount,
        forwarded: forwardedCount
      },
      requests: formattedRequests
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "خطأ في السيرفر" });
  }
};
