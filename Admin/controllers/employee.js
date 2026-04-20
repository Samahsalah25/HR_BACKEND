const Employee = require('../models/employee');
const User = require('../models/user')
const ResidencyYear = require('../models/ResidencyYear');
const LeaveBalance = require('../models/leaveBalanceModel')
const mongoose = require('mongoose')
const Attendance = require('../models/Attendance');
const Contract = require("../models/Contract");
const Task = require('../models/Task');
const Request = require('../models/requestModel')
const Counter = require("../models/counterSchema");
const SalaryAdvance = require('../models/salaryAdvance')
const Insurance = require("../models/InsuranceModel");
// exports.createEmployee = async (req, res) => {
//   const session = await mongoose.startSession();
//   session.startTransaction();

//   try {
//     const {
//       name,
//       email,
//       password,
//       jobTitle,
//       department,
//       manager,
//       employmentType,
//       contractStart,
//       contractDurationId,
//       residencyStart,
//       residencyDurationId,
//       residencyAdditionNumber,
//       residencyIssuingAuthority,
//       residencyInsuranceNumber,
//       residencyNationality,
//       residencyType,
//       workHoursPerWeek,
//       workplace,
//       salary,
//       role,
//       contactInfo,
//       bankInfo ,
//         insurance
//     } = req.body;

//     //  تحقق البريد
//     const existingUser = await User.findOne({ email }).session(session);
//     if (existingUser) {
//       return res.status(400).json({ message: `البريد ${email} مستخدم بالفعل` });
//     }
// let selectedInsurance = null;

// if (insurance) {
//   selectedInsurance = await Insurance.findById(insurance).session(session);

//   if (!selectedInsurance) {
//     return res.status(404).json({ message: "التأمين غير موجود" });
//   }
// }
//     //  المدد
//     const contractDuration = contractDurationId
//       ? await Contract.findById(contractDurationId).session(session)
//       : null;

//     const residencyDuration = residencyDurationId
//       ? await ResidencyYear.findById(residencyDurationId).session(session)
//       : null;

//     //  إنشاء المستخدم
//     const user = await User.create([{ name, email, password, role: role || "EMPLOYEE" }], { session });

//     //  توليد رقم الموظف
//     const generatedEmpNo = await generateEmployeeNumber(session);

//     // إنشاء الموظف
//     let employee = await Employee.create([{
//       name,
//       jobTitle,
//       employeeNumber: generatedEmpNo,
//       department,
//       manager,
//       employmentType,
//       contract: {
//         start: contractStart || null,
//         duration: contractDuration?._id || null
//       },
//       residency: {
//         nationality: residencyNationality || "",
//         start: residencyStart || null,
//         duration: residencyDuration?._id || null,
//         additionNumber: residencyAdditionNumber || "",
//         issuingAuthority: residencyIssuingAuthority || "",
//         insuranceNumber: residencyInsuranceNumber || "",
//         type: residencyType || ""
//       },
//       workHoursPerWeek: workHoursPerWeek || 0,
//       workplace,
//       salary,
//       contactInfo: contactInfo || {},
//       bankInfo: bankInfo || {},
//       user: user[0]._id ,
//       insurance: selectedInsurance ? {
//   insuranceId: selectedInsurance._id,
//   name: selectedInsurance.name,
//   employeePercentage: selectedInsurance.employeePercentage,
//   companyPercentage: selectedInsurance.companyPercentage
// } : null,
//     }], { session });

//     employee = employee[0];

//     //  حساب نهاية العقد
//     if (employee.contract.start && contractDuration) {
//       const end = new Date(employee.contract.start);
//       if (contractDuration.unit === "years") end.setFullYear(end.getFullYear() + contractDuration.duration);
//       if (contractDuration.unit === "months") end.setMonth(end.getMonth() + contractDuration.duration);
//       employee.contract.end = end;
//     }

//     //  حساب نهاية الإقامة
//     if (employee.residency.start && residencyDuration) {
//       const end = new Date(employee.residency.start);
//       end.setFullYear(end.getFullYear() + residencyDuration.year);
//       employee.residency.end = end;
//     }
//     // بعد إنشاء الموظف
//     if (req.files && req.files.length > 0) {
//       employee.documents = req.files.map(file => ({
//         name: file.originalname,
//         url: file.path,
//       }));
//       await employee.save({ session });
//     }

//     await employee.save({ session });

//     //  إنشاء رصيد الإجازات

//     const companyLeaves = await LeaveBalance.findOne({ employee: null }).session(session);
//     if (!companyLeaves) {
//       throw new Error("رصيد الإجازات الافتراضي للشركة غير محدد");
//     }

//     const currentYear = new Date().getFullYear();

//     const totalLeaveBalance =
//       companyLeaves.annual +
//       companyLeaves.sick +
//       companyLeaves.marriage +
//       companyLeaves.emergency +
//       companyLeaves.maternity +
//       companyLeaves.unpaid;

//     await LeaveBalance.create([{
//       employee: employee._id,
//       annual: companyLeaves.annual,
//       sick: companyLeaves.sick,
//       marriage: companyLeaves.marriage,
//       emergency: companyLeaves.emergency,
//       maternity: companyLeaves.maternity,
//       unpaid: companyLeaves.unpaid,
//       remaining: totalLeaveBalance,
//       year: currentYear
//     }], { session });

//     await session.commitTransaction();
//     session.endSession();

//     //  Populate للعرض
//     const populatedEmployee = await Employee.findById(employee._id)
//       .populate("contract.duration")
//       .populate("residency.duration");

//     res.status(201).json({
//       message: " تم إنشاء الموظف بنجاح",
//       user: user[0],
//       employee: populatedEmployee
//     });

//   } catch (error) {
//     await session.abortTransaction();
//     session.endSession();
//     res.status(500).json({ message: "حدث خطأ أثناء إنشاء الموظف", error: error.message });
//   }
// };


//  توليد الرقم الوظيفي

exports.createEmployee = async (req, res) => {
  const session = await mongoose.startSession();

  try {
    session.startTransaction();

    const {
      name,
      email,
      password,
      jobTitle,
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
      role,
      contactInfo,
      bankInfo,
      insurance
    } = req.body;

    const existingUser = await User.findOne({ email }).session(session);
    if (existingUser) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: `البريد ${email} مستخدم بالفعل` });
    }

    let selectedInsurance = null;
    if (insurance) {
      selectedInsurance = await Insurance.findById(insurance).session(session);

      if (!selectedInsurance) {
        await session.abortTransaction();
        session.endSession();
        return res.status(404).json({ message: "التأمين غير موجود" });
      }
    }

    const contractDuration = contractDurationId
      ? await Contract.findById(contractDurationId).session(session)
      : null;

    const residencyDuration = residencyDurationId
      ? await ResidencyYear.findById(residencyDurationId).session(session)
      : null;

    const user = await User.create(
      [{ name, email, password, role: role || "EMPLOYEE" }],
      { session }
    );

    const generatedEmpNo = await generateEmployeeNumber(session);

    let employeeArr = await Employee.create(
      [{
        name,
        jobTitle,
        employeeNumber: generatedEmpNo,
        department,
        manager,
        employmentType,
        contract: {
          start: contractStart || null,
          duration: contractDuration?._id || null
        },
        residency: {
          nationality: residencyNationality || "",
          start: residencyStart || null,
          duration: residencyDuration?._id || null,
          additionNumber: residencyAdditionNumber || "",
          issuingAuthority: residencyIssuingAuthority || "",
          insuranceNumber: residencyInsuranceNumber || "",
          type: residencyType || ""
        },
        workHoursPerWeek: workHoursPerWeek || 0,
        workplace,
        salary,
        contactInfo: contactInfo || {},
        bankInfo: bankInfo || {},
        user: user[0]._id,
        insurance: selectedInsurance
          ? {
              insuranceId: selectedInsurance._id,
              name: selectedInsurance.name,
              employeePercentage: selectedInsurance.employeePercentage,
              companyPercentage: selectedInsurance.companyPercentage
            }
          : null
      }],
      { session }
    );

    let employee = employeeArr[0];

    // حساب العقد
    if (employee.contract.start && contractDuration) {
      const end = new Date(employee.contract.start);

      if (contractDuration.unit === "years") {
        end.setFullYear(end.getFullYear() + contractDuration.duration);
      } else if (contractDuration.unit === "months") {
        end.setMonth(end.getMonth() + contractDuration.duration);
      }

      employee.contract.end = end;
    }

    // حساب الإقامة
    if (employee.residency.start && residencyDuration) {
      const end = new Date(employee.residency.start);
      end.setFullYear(end.getFullYear() + residencyDuration.year);
      employee.residency.end = end;
    }

    // الملفات
    if (req.files && req.files.length > 0) {
      employee.documents = req.files.map(file => ({
        name: file.originalname,
        url: file.path
      }));
    }

    await employee.save({ session });

    // leave balance
    const companyLeaves = await LeaveBalance.findOne({ employee: null }).session(session);
    if (!companyLeaves) {
      throw new Error("رصيد الإجازات الافتراضي للشركة غير محدد");
    }

    const totalLeaveBalance =
      companyLeaves.annual +
      companyLeaves.sick +
      companyLeaves.marriage +
      companyLeaves.emergency +
      companyLeaves.maternity +
      companyLeaves.unpaid;

    await LeaveBalance.create(
      [{
        employee: employee._id,
        annual: companyLeaves.annual,
        sick: companyLeaves.sick,
        marriage: companyLeaves.marriage,
        emergency: companyLeaves.emergency,
        maternity: companyLeaves.maternity,
        unpaid: companyLeaves.unpaid,
        remaining: totalLeaveBalance,
        year: new Date().getFullYear()
      }],
      { session }
    );

    await session.commitTransaction();
    session.endSession();

    const populatedEmployee = await Employee.findById(employee._id)
      .populate("contract.duration")
      .populate("residency.duration");

    return res.status(201).json({
      message: "تم إنشاء الموظف بنجاح",
      user: user[0],
      employee: populatedEmployee
    });

  } catch (error) {
    await session.abortTransaction();
    session.endSession();

    return res.status(500).json({
      message: "حدث خطأ أثناء إنشاء الموظف",
      error: error.message
    });
  }
};


async function generateEmployeeNumber(session) {
  const counter = await Counter.findOneAndUpdate(
    { key: "employeeNumber" },
    { $inc: { value: 1 } },
    { new: true, upsert: true, session }
  );
  return `EMP-${String(counter.value).padStart(5, "0")}`;
}
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






exports.getEmployees = async (req, res) => {
  try {
    // هجيب الـ Employee اللي بيمثل اليوزر الحالي
    const currentEmp = await Employee.findOne({ user: req.user._id })
      .populate("department")
      .populate("workplace")
      .populate("contract.duration", "_id name duration unit")
      .populate("user", "name email role");

    if (!currentEmp) {
      return res.status(404).json({ success: false, message: "الموظف غير موجود" });
    }

    let employees = [];

    if (req.user.role === "HR") {
      // HR يشوف الكل ما عدا نفسه
      employees = await Employee.find({ _id: { $ne: currentEmp._id } })
        .populate("department", "name")
        .populate("workplace", "name location")
        .populate("manager", "name jobTitle")
        .populate("contract.duration", "_id name duration unit")
        .populate("user", "name email role");
    }
    else if (req.user.role === "Manager") {
      // Manager يشوف موظفين قسمه + مدراء آخرين، مستبعد نفسه
      employees = await Employee.find({
        _id: { $ne: currentEmp._id },
        $or: [
          { department: currentEmp.department }, // موظفين قسمه
          { "user.role": "Manager" }             // مدراء
        ]
      })
        .populate("department", "name")
        .populate("workplace", "name location")
        .populate("manager", "name jobTitle")
        .populate("contract.duration", "_id name duration unit")
        .populate("user", "name email role");
    }
    else if (req.user.role === "EMPLOYEE") {
      // EMPLOYEE يشوف زمايله في نفس القسم فقط، مستبعد نفسه
      employees = await Employee.find({
        _id: { $ne: currentEmp._id },
        department: currentEmp.department
      })
        .populate("department", "name")
        .populate("workplace", "name location")
        .populate("manager", "name jobTitle")
        .populate("contract.duration", "_id name duration unit")
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

      let relation = "من أجلي";
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

    // جلب الطلبات العادية
    const requests = await Request.find(filter)
      .populate('employee', 'name jobTitle')
      .populate('decidedBy', 'name')
      .sort({ createdAt: -1 });

    // جلب السلف الخاصة بالموظف
    const salaryAdvances = await SalaryAdvance.find({ employee: employee._id })
      .populate('employee', 'name jobTitle')
      .sort({ createdAt: -1 });

    let pendingCount = 0, approvedCount = 0, rejectedCount = 0, forwardedCount = 0;

    // تحويل الطلبات العادية
    const formattedRequests = requests.map(reqItem => {
      let displayStatus = reqItem.status; // نستخدمها كما هي
      if (displayStatus === "قيد المراجعة") pendingCount++;
      else if (displayStatus === "مقبول") approvedCount++;
      else if (displayStatus === "مرفوض") rejectedCount++;
      else if (displayStatus === "محول") forwardedCount++;

      return {
        _id: reqItem._id,
        employeeName: reqItem.employee.name,
        jobTitle: reqItem.employee.jobTitle,
        type: reqItem.type,
        status: displayStatus,
        submittedAt: reqItem.createdAt.toISOString(),
        decidedAt: reqItem.decidedAt ? reqItem.decidedAt.toISOString() : null,
        notes: reqItem.notes || [],
        attachments: reqItem.attachments || []
      };
    });

    // تحويل السلف
    // تحويل السلف بعد التعديل
    const formattedSalaryAdvances = salaryAdvances.map(sa => {
      let displayStatus = "";
      let decidedAt = null;

      if (sa.status === "pending") displayStatus = "قيد المراجعة";
      else if (sa.status === "approved" || sa.status === "completed") {
        displayStatus = "مقبول";
        decidedAt = sa.approvedAt; // لو مقبولة
      } else if (sa.status === "rejected") {
        displayStatus = "مرفوض";
        decidedAt = sa.rejectedAt; // لو مرفوضة
      }
      else if (sa.status === "forwarded") {
        displayStatus = "محول";

      }

      return {
        _id: sa._id,
        employeeName: sa.employee.name,
        jobTitle: sa.employee.jobTitle,
        type: "سلفة من الراتب",
        status: displayStatus,
        submittedAt: sa.createdAt.toISOString(),
        decidedAt: decidedAt ? decidedAt.toISOString() : null, // هنبعت التاريخ الصح هنا
        notes: sa.notes || [],
        attachments: sa.attachments || [],
        amount: sa.amount,
        installmentsCount: sa.installmentsCount,
        installmentAmount: sa.installmentAmount,
        remainingAmount: sa.remainingAmount,
      };
    });


    // دمج الطلبات + السلف
    const allRequests = [...formattedRequests, ...formattedSalaryAdvances];

    // ترتيبهم حسب التاريخ
    allRequests.sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));

    res.json({
      counts: {
        pending: pendingCount,
        approved: approvedCount,
        rejected: rejectedCount,
        forwarded: forwardedCount
      },
      total: allRequests.length,
      requests: allRequests
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "خطأ في السيرفر" });
  }
};
