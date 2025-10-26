const Employee = require('../models/employee');
const User = require('../models/user')
const ResidencyYear = require('../models/ResidencyYear');
const LeaveBalance=require('../models/leaveBalanceModel')
const mongoose=require('mongoose')
const Attendance=require('../models/Attendance');
const Contract = require("../models/Contract");
const Task = require('../models/Task');
const Request=require('../models/requestModel')



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
      residencyAdditionNumber,
      residencyIssuingAuthority,
      residencyInsuranceNumber,
        residencyNationality, 
      residencyType,
      workHoursPerWeek,
      workplace,
      salary,
      role
    } = req.body;

    if (req.user.role !== "HR") {
      return res.status(403).json({ message: "ليس لديك صلاحية" });
    }

    //  تشيك مسبق على الايميل
    const emailExists = await User.findOne({ email }).session(session);
    if (emailExists) {
      return res.status(400).json({ message: "البريد الإلكتروني مستخدم بالفعل" });
    }

    //  تشيك مسبق على رقم الموظف
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
      residency: { 
          nationality: residencyNationality,  
        start: residencyStart, 
        duration: residencyDurationId,
        residencyNumber: residencyAdditionNumber,
      // رقم الإضافة
        issuingAuthority: residencyIssuingAuthority,  // الجهة المصدرة
        insuranceNumber: residencyInsuranceNumber,    // الرقم التأميني
        residencyType: residencyType                  // نوع الإقامة
      },
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
      unpaid: companyLeaves.unpaid,
      remaining: totalLeaveBalance
    }], { session });

    await session.commitTransaction();
    session.endSession();

    const populatedEmployee = await Employee.findById(employee._id)
      .populate("contract.duration")
      .populate("residency.duration");

    res.status(201).json({ user: user[0], employee: populatedEmployee });

  } catch (error) {
    await session.abortTransaction();
    session.endSession();

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


//هنجيت هنا علشان نختاره وقت الميتنج او وقت المهام
 exports.getEmployees = async (req, res) => {
  try {
    // هجيب الـ Employee اللي بيمثل اليوزر الحالي
    const currentEmp = await Employee.findOne({ user: req.user._id })
      .populate("department")
      .populate("workplace")
      .populate("user", "name email role");

    if (!currentEmp) {
      return res.status(404).json({ success: false, message: "الموظف غير موجود" });
    }

    let employees = [];

    if (req.user.role === "HR") {
      // HR يشوف الكل
      employees = await Employee.find()
        .populate("department", "name")
        .populate("workplace", "name location")
        .populate("manager", "name jobTitle")
        .populate("user", "name email role");
    } 
    else if (req.user.role === "Manager") {
      // Manager يشوف موظفين القسم + مدراء الأقسام التانية
      employees = await Employee.find({
        $or: [
          { department: currentEmp.department }, // موظفين قسمه
          { "user.role": "Manager" }             // مدراء
        ]
      })
        .populate("department", "name")
        .populate("workplace", "name location")
        .populate("manager", "name jobTitle")
        .populate("user", "name email role");
    } 
    else if (req.user.role === "EMPLOYEE") {
      // EMPLOYEE يشوف نفسه + زمايله في نفس القسم (مش HR/Manager)
      employees = await Employee.find({
        department: currentEmp.department
      })
        .populate("department", "name")
        .populate("workplace", "name location")
        .populate("manager", "name jobTitle")
        .populate("user", "name email role");

      // فلترة: استبعد HR & Manager
      employees = employees.filter(emp => 
        emp.user.role !== "HR" && emp.user.role !== "Manager"
      );
    }

    res.json({
      success: true,
      count: employees.length,
      data: employees
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "خطأ في استرجاع الموظفين",
      error: error.message
    });
  }
};



const moment = require("moment-timezone");

require("moment/locale/ar-sa"); // تحميل locale العربية

exports.employeeStatus = async (req, res) => {
  try {
    const userId = req.user.id;

    function formatTime(time) {
      if (!time) return null;

      if (typeof time === "string") {
        const [hours, minutes] = time.split(":").map(Number);
        return moment()
          .tz("Asia/Riyadh")
          .hour(hours)
          .minute(minutes)
          .format("hh:mm A"); // hh:mm 12 ساعة مع AM/PM
      }

      if (time instanceof Date) {
        return moment(time).tz("Asia/Riyadh").format("hh:mm A"); // 12 ساعة
      }

      return null;
    }

    const employee = await Employee.findOne({ user: userId }).populate("workplace");
    if (!employee) return res.status(404).json({ error: "الموظف غير مرتبط بالحساب" });
    const branch = employee.workplace;

    const now = moment().tz("Asia/Riyadh").locale("ar-sa"); // اللغة عربية
    const startOfDay = now.clone().startOf("day").toDate();
    const endOfDay = now.clone().endOf("day").toDate();

    const attendance = await Attendance.findOne({
      employee: employee._id,
      date: { $gte: startOfDay, $lte: endOfDay }
    });

    res.json({
      today: now.format("dddd، DD MMMM YYYY"),
      officialCheckIn: formatTime(branch?.workStart),
      officialCheckOut: formatTime(branch?.workEnd),
      employeeCheckIn: formatTime(attendance?.checkIn),
      employeeCheckOut: formatTime(attendance?.checkOut),
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


//  دالة تنسيق التاريخ
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

//  دالة تحويل وقت الفرع (09:00 → 09:00 AM)
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

// سجلات حضور الموظف للشهر الحالي اللي احنا فيه
exports.getMyAttendanceThroughMonth = async (req, res) => {
  try {
    const userId = req.user._id;

    // نجيب الموظف المرتبط باليوزر
    const employee = await Employee.findOne({ user: userId });
    if (!employee) {
      return res.status(404).json({ error: "الموظف غير مرتبط بالحساب" });
    }

    // أول وآخر يوم في الشهر الحالي
    const today = new Date();
    const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999);

    // limit ديناميكي من query param أو افتراضي 30
    const limit = parseInt(req.query.limit) || 30;

    // جلب السجلات من الشهر الحالي
    const records = await Attendance.find({
      employee: employee._id,
      date: { $gte: startOfMonth, $lte: endOfMonth }
    })
    .sort({ date: -1 }) // الأحدث أولاً
    .limit(limit);

    // اسم الشهر الحالي مع السنة
    const monthName = today.toLocaleDateString("ar-EG", { month: "long", year: "numeric" });

    // تنسيق البيانات
    const formattedRecords = records.map((rec) => {
      const day = new Date(rec.date).toLocaleDateString("ar-EG", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
        numberingSystem: "latn"
      });

      // وقت الدخول والخروج
      const checkIn = rec.checkIn
        ? rec.checkIn.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true })
        : "لم يتم تسجيل حضور";

      const checkOut = rec.checkOut
        ? rec.checkOut.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true })
        : "لم يتم تسجيل الانصراف";

      // الوقت اللي اشتغله
      let workedTime = "لم يكتمل اليوم";
      if (rec.checkIn && rec.checkOut) {
        const diffMs = rec.checkOut - rec.checkIn;
        const diffMins = Math.floor(diffMs / 60000);
        const hours = Math.floor(diffMins / 60);
        const mins = diffMins % 60;
        workedTime = `${hours} س, ${mins} د`;
      } else if (!rec.checkIn) {
        workedTime = "0 س, 0 د";
      }

      // الحالة
      let status = "غير محدد";
      if (!rec.checkIn) status = "غائب";
      else if (rec.status === "حاضر") status = "بدون تأخير";
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

    res.json({ month: monthName, records: formattedRecords });
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

    // جلب بيانات الموظف
    const employee = await Employee.findOne({ user: userId });
    if (!employee) return res.status(404).json({ error: "الموظف غير مرتبط بالحساب" });

    // بناء فلترة الـ query بدون تحديد فترة زمنية
    let filter = {
      $or: [
        { assignedTo: employee._id },   // مسندة لي
        { assignedBy: userId }          // أنا اللي مكريها
      ]
    };
    if (statusFilter && statusFilter !== "الكل") {
      filter.status = statusFilter;
    }

    // جلب المهام + الموظف المسند له
    const tasks = await Task.find(filter)
      .populate("assignedTo", "name _id jobTitle")
      .sort({ assignDate: -1 });

    let inProgressCount = 0;
    let completedCount = 0;
    let overdueCount = 0;

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
        overdueCount++;
        endInfo = `المهام متأخرة منذ: ${new Date(task.dueDate).toLocaleDateString('ar-EG', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
          numberingSystem: 'latn'
        })}`;
      }

      let relation = "من أجلي" ;
      let assignedToInfo = null;
      if (!task.assignedTo._id.equals(employee._id)) {
        relation = "لموظف آخر";
        assignedToInfo = {
          id: task.assignedTo._id,
          name: task.assignedTo.name,
          jobTitle: task.assignedTo.jobTitle || ""
        };
      }

      return {
        _id: task._id,
        title: task.title,
        status: task.status,
        priority: task.priority || 'متوسطة',
        assignDate: assignDay,
        endInfo,
        notes: task.notes || "",
        attachments: task.attachments || [],
        relation,
        assignedTo: assignedToInfo
      };
    });

    res.json({
      totalCount: tasks.length,
      inProgressCount,
      completedCount,
      overdueCount,
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

    // الفلتر الأساسي
    let filter = { employee: employee._id };

    // فلتر حسب الفترة لو موجود
    if (req.query.period) {
      const periodDays = parseInt(req.query.period);
      const fromDate = new Date();
      fromDate.setDate(fromDate.getDate() - periodDays);
      filter.createdAt = { $gte: fromDate };
    }

    // فلتر حسب الحالة لو موجود
    if (req.query.status) {
      filter.status = req.query.status;
    }

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
        _id: reqItem._id,
        employeeName: reqItem.employee.name,
        jobTitle: reqItem.employee.jobTitle,
        type: reqItem.type,
        status: reqItem.status,
        submittedAt: reqItem.createdAt.toISOString(), // إرسال بصيغة ISO
        decidedAt: reqItem.decidedAt ? reqItem.decidedAt.toISOString() : null, // تاريخ القبول/الرفض
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
      total: requests.length,
      requests: formattedRequests
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "خطأ في السيرفر" });
  }
};



// PATCH /api/employees/promote/:id
exports.promoteToManager = async (req, res) => {
  try {
    const { id } = req.params;
    
    // نعدل اليوزر ونخلي دوره MANAGER
    await User.findOneAndUpdate({ _id: id }, { role: "MANAGER" });
    
    // نعدل بيانات الموظف (اختياري) 
    await Employee.findOneAndUpdate({ user: id }, { jobTitle: "Manager" });

    res.status(200).json({ message: "تمت ترقية الموظف إلى مدير" });
  } catch (err) {
    res.status(500).json({ message: "فشل في الترقية", error: err.message });
  }
};

