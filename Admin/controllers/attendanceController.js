const Attendance = require('../models/Attendance');
const Employee = require('../models/employee');
const Branch = require('../models/branchSchema');
const LeaveBalance=require('../models/leaveBalanceModel');
const Request=require('../models/requestModel')

// دالة لحساب المسافة بالمتر بين نقطتين
function getDistanceFromLatLonInMeters(lat1, lon1, lat2, lon2) {
  const R = 6371000; 
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// Check-In endpoint

// const checkIn = async (req, res) => {
//   try {

//   const userId = req.user._id;
//  const employee = await Employee.findOne({ user: userId }).populate('workplace');
//     if (!employee) return res.status(404).json({ message: 'الموظف غير موجود' });

//     const branch = employee.workplace;
// if (!branch) return res.status(400).json({ message: 'الفرع غير موجود' });

//     const { latitude, longitude } = req.body;

//     const distance = getDistanceFromLatLonInMeters(
//       latitude,
//       longitude,
//       branch.location.coordinates[1],
//       branch.location.coordinates[0]
//     );

//     if (distance > 20) {
//       return res.status(400).json({ message: 'أنت بعيد عن موقع الفرع' });
//     }

//     // تحديد المنطقة الزمنية من العميل (أو الافتراضية)
//     const clientTimezone = req.headers['timezone'] || 'Africa/Cairo';

//     // الحصول على الوقت الحالي بتوقيت العميل (باستخدام Luxon)
//     const now = DateTime.now().setZone(clientTimezone);

//     // تحديد بداية ونهاية اليوم الحالي بتوقيت العميل للبحث عن سجلات سابقة
//     const todayStart = now.startOf('day').toJSDate();
//     const todayEnd = now.endOf('day').toJSDate();

//     const existingAttendance = await Attendance.findOne({
//       employee: employee._id,
//       date: { $gte: todayStart, $lte: todayEnd }
//     });

//     if (existingAttendance) {
//       return res.status(400).json({ message: 'لقد قمت بتسجيل الحضور بالفعل اليوم' });
//     }

//     // حساب أوقات الدوام وفترة السماح في نفس المنطقة الزمنية للعميل
//     const [startHour, startMinute] = branch.workStart.split(':').map(Number);
//     const [endHour, endMinute] = branch.workEnd.split(':').map(Number);

//     // إنشاء أوقات الدوام في نفس يوم 'now' وبنفس المنطقة الزمنية
//     const branchStart = now.set({ hour: startHour, minute: startMinute, second: 0, millisecond: 0 });
//     const branchEnd = now.set({ hour: endHour, minute: endMinute, second: 0, millisecond: 0 });
//     const graceEnd = branchStart.plus({ minutes: branch.gracePeriod });

//     let status = 'حاضر';
//     let lateMinutes = 0;

//     // المقارنات والحسابات تتم كلها باستخدام كائنات Luxon في نفس المنطقة الزمنية
//     if (now > branchEnd) {
//       status = 'غائب';
//     } else if (now > graceEnd) {
//       status = 'متأخر';
//       lateMinutes = Math.floor(now.diff(graceEnd, 'minutes').minutes);
//     } else {
//         status = 'حاضر';
//     }

//     // تخزين التواريخ في قاعدة البيانات بتوقيت UTC
//     const attendance = await Attendance.create({
//       employee: employee._id,
//       branch: branch._id,
//       date: now.toJSDate(),
//       status,
//       checkIn: now.toJSDate(),
//       lateMinutes
//     });

//     res.status(201).json({
//       message: 'تم تسجيل الحضور',
//       attendance: {
//         ...attendance._doc,
//         checkIn: now.toFormat('HH:mm') // تمثيل الوقت فقط في الرد
//       },
//       times: {
//         workStart: branch.workStart,
//         workEnd: branch.workEnd,
//         graceEnd: graceEnd.toFormat('HH:mm'),
//         currentTime: now.toFormat('HH:mm')
//       }
//     });

//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: 'حدث خطأ أثناء تسجيل الحضور' });
//   }
// };




const checkIn = async (req, res) => {
  try {
    const userId = req.user._id;
    const employee = await Employee.findOne({ user: userId }).populate("workplace");
    if (!employee) return res.status(404).json({ message: "الموظف غير موجود" });

    const branch = employee.workplace;
    if (!branch) return res.status(400).json({ message: "الفرع غير موجود" });

    // تحقق من الموقع
    const { latitude, longitude } = req.body;
    const distance = getDistanceFromLatLonInMeters(
      latitude,
      longitude,
      branch.location.coordinates[1],
      branch.location.coordinates[0]
    );
    if (distance > 20) return res.status(400).json({ message: "أنت بعيد عن موقع الفرع" });

    const clientTimezone = req.headers["timezone"] || "Africa/Cairo";
    const now = DateTime.now().setZone(clientTimezone);

    const todayStart = now.startOf("day").toJSDate();
    const todayEnd = now.endOf("day").toJSDate();

    let existingAttendance = await Attendance.findOne({
      employee: employee._id,
      date: { $gte: todayStart, $lte: todayEnd }
    });

    // لو عنده سجل غياب من الكرون → نحدثه
    if (existingAttendance && existingAttendance.status === "غائب") {
      // نكمل تحت ونغيره حسب الوقت
    } else if (existingAttendance) {
      return res.status(400).json({ message: "لقد قمت بتسجيل الحضور بالفعل اليوم" });
    }

    const [startHour, startMinute] = branch.workStart.split(":").map(Number);
    const [endHour, endMinute] = branch.workEnd.split(":").map(Number);

    const branchStart = now.set({ hour: startHour, minute: startMinute, second: 0, millisecond: 0 });
    const branchEnd = now.set({ hour: endHour, minute: endMinute, second: 0, millisecond: 0 });
    const graceEnd = branchStart.plus({ minutes: branch.gracePeriod });
    const oneHourAfter = branchStart.plus({ hours: 1 });
    const cutoffTime = branchStart.plus({ hours: 4 }); // آخر معاد للتسجيل

    let status = "حاضر";
    let lateMinutes = 0;

    if (now > cutoffTime) {
      status = "غائب"; // بعد cutoff يفضل غياب
    } else if (now > oneHourAfter) {
      status = "متأخر";
      lateMinutes = Math.floor(now.diff(branchStart, "minutes").minutes);
    } else if (now > graceEnd) {
      status = "متأخر";
      lateMinutes = Math.floor(now.diff(graceEnd, "minutes").minutes);
    } else {
      status = "حاضر";
    }

    let attendance;
    if (existingAttendance) {
      // تعديل الغياب اللي اتسجل من الكرون
      existingAttendance.status = status;
      existingAttendance.checkIn = now.toJSDate();
      existingAttendance.lateMinutes = lateMinutes;
      await existingAttendance.save();
      attendance = existingAttendance;
    } else {
      // إنشاء سجل جديد
      attendance = await Attendance.create({
        employee: employee._id,
        branch: branch._id,
        date: now.toJSDate(),
        status,
        checkIn: now.toJSDate(),
        lateMinutes
      });
    }

    res.status(201).json({
      message: "تم تسجيل الحضور",
      attendance: {
        ...attendance._doc,
        checkIn: now.toFormat("HH:mm")
      },
      times: {
        workStart: branch.workStart,
        workEnd: branch.workEnd,
        graceEnd: graceEnd.toFormat("HH:mm"),
        cutoff: cutoffTime.toFormat("HH:mm"),
        currentTime: now.toFormat("HH:mm")
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "حدث خطأ أثناء تسجيل الحضور" });
  }
};




// Check-Out endpoint
const checkOut = async (req, res) => {
  try {
    const userId = req.user._id;
    const { latitude, longitude } = req.body;

    const employee = await Employee.findOne({ user: userId }).populate("workplace");
    if (!employee) return res.status(404).json({ message: "الموظف غير موجود" });

    const branch = employee.workplace;
    if (!branch) return res.status(400).json({ message: "الفرع غير موجود" });

    // تحقق من الموقع
    const distance = getDistanceFromLatLonInMeters(
      latitude,
      longitude,
      branch.location.coordinates[1],
      branch.location.coordinates[0]
    );

    if (distance > 10) {
      return res.status(400).json({ message: "لا يمكنك تسجيل الانصراف خارج الفرع" });
    }

    const now = new Date();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const attendance = await Attendance.findOne({
      employee: employee._id,
      date: { $gte: today }
    });

    if (!attendance) {
      return res.status(400).json({ message: "لم يتم تسجيل حضور لهذا اليوم" });
    }

    // تسجيل وقت الانصراف
    attendance.checkOut = now;

  
    if (attendance.checkIn) {
      const workedMs = attendance.checkOut - attendance.checkIn; // الفرق بالملي ثانية
      attendance.workedtime = Math.floor(workedMs / 60000);   // نحولها لدقايق
    }

    await attendance.save();

    res.status(200).json({ 
      message: "تم تسجيل الانصراف", 
      attendance 
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "حدث خطأ أثناء تسجيل الانصراف" });
  }
};


//

//  هنا بنجيب حضور اليوم لموظف معين بحيث بقي هو عمل اتشيك ان امتي واتشيم اوت امتي


const getTodayAttendance = async (req, res) => {
 try {
   const employeeId = req.params.id;
    const clientTimezone = req.headers['timezone'] || 'Africa/Cairo';

// 1️⃣ نحسب بداية اليوم ونهايته باستخدام Luxon
const now = DateTime.now().setZone(clientTimezone);
const todayStart = now.startOf('day').toJSDate();
 const todayEnd = now.endOf('day').toJSDate();

 // 2️⃣ نجيب حضور اليوم
 const todayAttendance = await Attendance.findOne({
 employee: employeeId,
 date: { $gte: todayStart, $lte: todayEnd }
 })
 .populate("employee", "name jobTitle")
 .populate("branch", "name");

 // 3️⃣ نجيب كل الحضور السابق (لحساب غياب وتأخير)
 const allAttendance = await Attendance.find({ employee: employeeId });

 const absences = allAttendance.filter(a => a.status === "غائب").length;
 const lates = allAttendance.filter(a => a.status === "متأخر").length;

if (!todayAttendance) {
 return res.json({
 message: "لا يوجد حضور لهذا الموظف اليوم",
 absences,
 lates
 });
 }

    // 4️⃣ تنسيق وقت الدخول والخروج للعرض (باستخدام Luxon)
    const checkInTime = todayAttendance.checkIn 
      ? DateTime.fromJSDate(todayAttendance.checkIn, { zone: clientTimezone }).toFormat('HH:mm')
      : null;
    
    const checkOutTime = todayAttendance.checkOut
      ? DateTime.fromJSDate(todayAttendance.checkOut, { zone: clientTimezone }).toFormat('HH:mm')
      : null;

    res.json({
      employee: todayAttendance.employee.name,
      branch: todayAttendance.branch.name,
      status: todayAttendance.status,
      checkIn: checkInTime,
      checkOut: checkOutTime,
      absences,
      lates

});
 } catch (error) {
 console.error(error);
 res.status(500).json({ message: "حدث خطأ أثناء جلب بيانات الحضور" });
 }
};


//    عدد الحاضرين هنا والنسب المئوية وكدا لكل الفروع


const dailyState = async (req, res) => {
  try {
    const today = new Date();
    const startOfDay = new Date(today);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(today);
    endOfDay.setHours(23, 59, 59, 999);

    // كل الموظفين
    const employees = await Employee.find();
    const totalEmployees = employees.length;

    // حضور النهاردة
    const attendances = await Attendance.find({
      date: { $gte: startOfDay, $lte: endOfDay }
    });

    // اجازات النهاردة (مقبولة بس)
 
const leaves = await Request.find({
  type: "إجازة",
  status: "مقبول",
  "leave.startDate": { $lte: endOfDay },
  "leave.endDate": { $gte: startOfDay }
}).populate("employee");

const leaveEmployeeIds = leaves
  .filter(l => l.employee) // تجاهل الطلبات اللي الموظف بتاعها اتحذف
  .map(l => l.employee._id.toString());

    // حساب الحالات
    const present = attendances.filter(
      a => a.status === "حاضر" || a.status === "متأخر"
    ).length;

    const late = attendances.filter(a => a.status === "متأخر").length;

    const absentWithoutExcuse = attendances.filter(
      a => a.status === "غائب" && !leaveEmployeeIds.includes(a.employee.toString())
    ).length;

    const absentWithExcuse = leaveEmployeeIds.length;

    // حساب النسب
    const percent = (count) =>
      totalEmployees ? ((count / totalEmployees) * 100).toFixed(2) : "0.00";

    res.json({
      totalEmployees,
      present,
      presentPercent: percent(present),
      late,
      latePercent: percent(late),
      absentWithExcuse,
      absentWithExcusePercent: percent(absentWithExcuse),
      absentWithoutExcuse,
      absentWithoutExcusePercent: percent(absentWithoutExcuse),
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server Error" });
  }
};

//  عدد الحاضرين والنسب المئوية لفرع معين
const dailyStateBranch = async (req, res) => {
  try {
    const today = new Date();
    const startOfDay = new Date(today);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(today);
    endOfDay.setHours(23, 59, 59, 999);

    // فلتر الموظفين حسب الفرع لو HR
    let employeesFilter = {};
    if (req.user.role === "HR") {
      const hrEmployee = await Employee.findOne({ user: req.user._id });
      if (!hrEmployee) {
        return res.status(404).json({ message: "لم يتم العثور على بيانات الـ HR" });
      }
      employeesFilter = { workplace: hrEmployee.workplace };
    }

    // هات الموظفين (حسب الفرع أو الكل لو ADMIN)
    const employees = await Employee.find(employeesFilter);
    const totalEmployees = employees.length;
    const employeeIds = employees.map(e => e._id);

    // حضور النهاردة للموظفين دول فقط
    const attendances = await Attendance.find({
      employee: { $in: employeeIds },
      date: { $gte: startOfDay, $lte: endOfDay }
    });

    // اجازات النهاردة (مقبولة بس) لنفس الموظفين
    const leaves = await Request.find({
      employee: { $in: employeeIds },
      type: "إجازة",
      status: "مقبول",
      "leave.startDate": { $lte: endOfDay },
      "leave.endDate": { $gte: startOfDay }
    }).populate("employee");

    const leaveEmployeeIds = leaves.map(l => l.employee._id.toString());

    // حساب الحالات
    const present = attendances.filter(
      a => a.status === "حاضر" || a.status === "متأخر"
    ).length;

    const late = attendances.filter(a => a.status === "متأخر").length;

    const absentWithoutExcuse = attendances.filter(
      a => a.status === "غائب" && !leaveEmployeeIds.includes(a.employee.toString())
    ).length;

    const absentWithExcuse = leaveEmployeeIds.length;

    // حساب النسب
    const percent = (count) =>
      totalEmployees ? ((count / totalEmployees) * 100).toFixed(2) : "0.00";

    res.json({
      totalEmployees,
      present,
      presentPercent: percent(present),
      late,
      latePercent: percent(late),
      absentWithExcuse,
      absentWithExcusePercent: percent(absentWithExcuse),
      absentWithoutExcuse,
      absentWithoutExcusePercent: percent(absentWithoutExcuse),
    });
  } catch (err) {
    console.error("Error in dailyState:", err);
    res.status(500).json({ error: "Server Error" });
  }
};



//  هنا  جدول لحضور اليوم 

const dailyAttendanceTable = async (req, res) => {
  try {
    const today = new Date();
    const startOfDay = new Date(today);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(today);
    endOfDay.setHours(23, 59, 59, 999);

    // جلب الحضور اليوم مع اسم الموظف والقسم
    const attendances = await Attendance.find({
      date: { $gte: startOfDay, $lte: endOfDay }
    }).populate({
      path: "employee",
      select: "name department",
      populate: { path: "department", select: "name" }
    });

    // تجهيز الجدول
    const table = attendances.map(a => ({
      employeeName: a.employee.name,
      departmentName: a.employee.department ? a.employee.department.name : "غير محدد",
      status: a.status
    }));

    res.json({ table });
  } catch (err) {
    console.error("Error fetching daily attendance table:", err);
    res.status(500).json({ error: "Server Error" });
  }
}; 

// جدول الحضور اليومي لفرع معين
const dailyAttendanceTableOnebranch = async (req, res) => {
  try {
    const today = new Date();
    const startOfDay = new Date(today);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(today);
    endOfDay.setHours(23, 59, 59, 999);

    let employeesFilter = {}; // الفلتر الأساسي

    if (req.user.role === "HR") {
      // هات الـ HR نفسه علشان نجيب الفرع بتاعه
      const hrEmployee = await Employee.findOne({ user: req.user._id });
      if (!hrEmployee) {
        return res.status(404).json({ message: "لم يتم العثور على بيانات الـ HR" });
      }

      employeesFilter = { workplace: hrEmployee.workplace };
    }

    // هات كل الموظفين في الفرع (أو كلهم لو admin)
    const employees = await Employee.find(employeesFilter).select("_id workplace");

    const employeeIds = employees.map(e => e._id);

    // هات الحضور لليوم للموظفين دول بس
    const attendances = await Attendance.find({
      employee: { $in: employeeIds },
      date: { $gte: startOfDay, $lte: endOfDay }
    }).populate({
      path: "employee",
      select: "name department",
      populate: { path: "department", select: "name" }
    });

    // تجهيز الريسبونس بنفس الشكل
    const table = attendances.map(a => ({
      _id: a.employee._id,
      name: a.employee.name,
      department: a.employee.department ? a.employee.department.name : "غير محدد",
      status: a.status
    }));

    res.json({ data:table });
  } catch (err) {
    console.error("Error fetching daily attendance table:", err);
    res.status(500).json({ error: "Server Error" });
  }
};


//  بيانات تسجيل خضور موظف معين خلال الشهر


const getMonthlyAttendanceForEmployee = async (req, res) => {
  try {
    const employeeId = req.params.id;
    const today = new Date();
    const month = today.getMonth(); // 0-11
    const year = today.getFullYear();
    const monthNames = [
      "يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو",
      "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"
    ];

    const emp = await Employee.findById(employeeId).populate("department", "name");
    if (!emp) return res.status(404).json({ error: "الموظف غير موجود" });

    // بداية ونهاية الشهر
    const monthStart = new Date(year, month, 1, 0, 0, 0, 0);
    const monthEnd = new Date(year, month + 1, 0, 23, 59, 59, 999);

    // حضور الموظف للشهر
    const attendances = await Attendance.find({
      employee: emp._id,
      date: { $gte: monthStart, $lte: monthEnd }
    }).sort({ date: 1 });

    let totalAbsent = 0;
    let totalLate = 0;
    

    const days = attendances.map(a => {
      if (a.status === "غائب") totalAbsent++;
      if (a.status === "متأخر") totalLate++;

      const day = a.date.getDate().toString().padStart(2, "0");
      const monthNum = (a.date.getMonth() + 1).toString().padStart(2, "0");
      const yearNum = a.date.getFullYear();

      // فورمات HH:mm:ss
      const formatTime = (d) => {
        if (!d) return null;
        return d.toTimeString().split(" ")[0]; // بياخد "HH:mm:ss"
      };

      return {
        day: `${day}/${monthNum}/${yearNum}`,
        status: a.status,
        checkIn: formatTime(a.checkIn),
        checkOut: formatTime(a.checkOut)
      };
    });

    // نجيب الإجازات المقبولة في الشهر دا
    const leaves = await Request.find({
      employee: emp._id,
      type: "إجازة",
      status: "مقبول",
      "leave.startDate": { $lte: monthEnd },
      "leave.endDate": { $gte: monthStart }
    });

    // نحسب عدد الأيام
    let totalLeaves = 0;
    for (const leave of leaves) {
      const start = leave.leave.startDate < monthStart ? monthStart : leave.leave.startDate;
      const end = leave.leave.endDate > monthEnd ? monthEnd : leave.leave.endDate;

      const daysDiff = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
      totalLeaves += daysDiff;
    }

    res.json({
      month: `${monthNames[month]} ${year}`,
      employeeName: emp.name,
      departmentName: emp.department ? emp.department.name : "غير محدد",
      days,
      totalAbsent,
      totalLate,
      totalLeaves
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server Error" });
  }
};


//  تقرير شهري لكل الموظفين في الشركة ناو 



const { DateTime } = require("luxon"); // لو بتستخدمي Luxon
// افترضنا إن LeaveBalance, Employee, Attendance موجودين ومستورَدِين

const monthlyReport = async (req, res) => {
  try {
    const nowUTC = DateTime.utc();
    const year = nowUTC.year;
    const startOfMonth = nowUTC.startOf('month').toJSDate();
    const endOfMonth = nowUTC.endOf('month').toJSDate();

    // الرصيد الاساسي للشركة (document where employee: null)
    const baseLeaveBalance = await LeaveBalance.findOne({ employee: null });
    if (!baseLeaveBalance) {
      return res.status(404).json({ message: "لم يتم العثور على الرصيد الأساسي للإجازات" });
    }

    // حساب totalBase (مجموع كل الأنواع) — لو انتي عايزة بس annual غيري السطر ده ل lb.annual
    const baseTotalAllTypes = (
      (baseLeaveBalance.annual || 0) +
      (baseLeaveBalance.sick || 0) +
      (baseLeaveBalance.marriage || 0) +
      (baseLeaveBalance.emergency || 0) +
      (baseLeaveBalance.maternity || 0) +
      (baseLeaveBalance.unpaid || 0)
    );

    // جلب الموظفين
    const employees = await Employee.find()
      .populate("department")
      .populate("workplace")
      .populate("user");

    const reports = [];

    for (const employee of employees) {
      // حضور الشهر
      const attendances = await Attendance.find({
        employee: employee._id,
        date: { $gte: startOfMonth, $lte: endOfMonth }
      });

      const present = attendances.filter(a => a.status === "حاضر").length;
      const late = attendances.filter(a => a.status === "متأخر").length;
      const absent = attendances.filter(a => a.status === "غائب").length;
      const attendedDays = present + late;

      // جلب LeaveBalance للموظف (إن وجد)
      const lb = await LeaveBalance.findOne({ employee: employee._id });

      // إذا لم يوجد LeaveBalance للموظف نعتبره يأخذ القيم من base
      let totalLeaveBalance = baseTotalAllTypes;
      let remainingLeave = baseTotalAllTypes;
      let totalLeaveTaken = 0;

      if (lb) {
        // calc employee total (sum الأنواع عند الموظف) — هذا يعكس الرصيد المتبقي بتقسيم الأنواع
        const employeeTotalAllTypes = (
          (lb.annual || 0) +
          (lb.sick || 0) +
          (lb.marriage || 0) +
          (lb.emergency || 0) +
          (lb.maternity || 0) +
          (lb.unpaid || 0)
        );

        totalLeaveBalance = baseTotalAllTypes; // ثابت: نأخذ Base كمرجع للكُل (طلبك)

        // إذا فيه حقل remaining مستخدم (مفضّل) خليه مصدرنا الأول
        if (typeof lb.remaining === "number") {
          remainingLeave = lb.remaining;
          totalLeaveTaken = totalLeaveBalance - remainingLeave;
        } else {
          // fallback: لو مفيش remaining، نحسب remaining من مجموع الحقول الحالية عند الموظف
          remainingLeave = employeeTotalAllTypes;
          totalLeaveTaken = totalLeaveBalance - remainingLeave;
        }
      } else {
        // لا يوجد رصيد موظف، نعامل الموظف كأنه لم يستخدم شي
        totalLeaveBalance = baseTotalAllTypes;
        remainingLeave = baseTotalAllTypes;
        totalLeaveTaken = 0;
      }

      // تأكد عدم الحصول على أرقام سالبة
      if (totalLeaveTaken < 0) totalLeaveTaken = 0;
      if (remainingLeave < 0) remainingLeave = 0;

      reports.push({
        _id: employee._id,
        name: employee.name,
        email: employee.user?.email || "",
        department: employee.department?.name || "N/A",
        jobTitle: employee.jobTitle || "",
        attendance: { present: attendedDays, late, absent },
        leaves: { total: totalLeaveBalance, taken: totalLeaveTaken, remaining: remainingLeave }
      });
    }

    const formattedMonth = nowUTC.setLocale('ar-EG').toLocaleString({ month: 'long' });

    res.json({
      month: `${formattedMonth} ${year}`,
      baseLeave: {
        annual: baseLeaveBalance.annual,
        sick: baseLeaveBalance.sick,
        marriage: baseLeaveBalance.marriage,
        emergency: baseLeaveBalance.emergency,
        maternity: baseLeaveBalance.maternity,
        unpaid: baseLeaveBalance.unpaid,
        total: baseTotalAllTypes
      },
      reports
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server Error", details: err.message });
  }
};




 // تقرير شهري لكل الحضور الخاص بفرع الاتش ار مانجر دا بس 
const monthlyReportoneBranch = async (req, res) => {
  try {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();

    const startOfMonth = new Date(year, month, 1);
    const endOfMonth = new Date(year, month + 1, 0, 23, 59, 59, 999);
    const startOfYear = new Date(year, 0, 1);
    const endOfYear = new Date(year, 11, 31, 23, 59, 59, 999);

    // نجيب الرصيد الأساسي للإجازات (اللي employee: null)
    const baseLeaveBalance = await LeaveBalance.findOne({ employee: null });

    if (!baseLeaveBalance) {
      return res.status(404).json({ message: "لم يتم العثور على الرصيد الأساسي للإجازات" });
    }

    let employees;

    if (req.user.role === "ADMIN") {
      employees = await Employee.find()
        .populate("department")
        .populate("workplace")
        .populate("user");
    } else if (req.user.role === "HR") {
      const hrEmployee = await Employee.findOne({ user: req.user._id });
      if (!hrEmployee) {
        return res.status(404).json({ message: "لم يتم العثور على بيانات الـ HR" });
      }

      employees = await Employee.find({ workplace: hrEmployee.workplace })
        .populate("department")
        .populate("workplace")
        .populate("user");
    } else {
      return res.status(403).json({ message: "ليس لديك صلاحية" });
    }

    const reports = [];

    for (const employee of employees) {
      // حضور وانصراف
      const attendances = await Attendance.find({
        employee: employee._id,
        date: { $gte: startOfMonth, $lte: endOfMonth }
      });

      const present = attendances.filter(a => a.status === "حاضر").length;
      const late = attendances.filter(a => a.status === "متأخر").length;
      const absent = attendances.filter(a => a.status === "غائب").length;
      const attendedDays = present + late;

      // رصيد الإجازات الخاص بالموظف (لو موجود)
      const employeeLeaveBalance = await LeaveBalance.findOne({ employee: employee._id });

      let totalLeaveBalance = 0;
      let totalLeaveTaken = 0;

      // إذا كان للموظف رصيد خاص، نستخدمه، وإلا نستخدم الرصيد الأساسي
     totalLeaveBalance = 
          baseLeaveBalance.annual +
          baseLeaveBalance.sick +
          baseLeaveBalance.marriage +
          baseLeaveBalance.emergency +
          baseLeaveBalance.maternity +
          baseLeaveBalance.unpaid;

      console.log('total for', employee.name, ':', totalLeaveBalance);

      // حساب جميع الإجازات المستخدمة خلال السنة
      const allLeaveRequests = await Request.find({
        employee: employee._id,
        type: "إجازة",
        status: "مقبول",
        "leave.startDate": { $lte: endOfYear },
        "leave.endDate": { $gte: startOfYear }
      });

      allLeaveRequests.forEach(req => {
        const start = req.leave.startDate < startOfYear ? startOfYear : req.leave.startDate;
        const end = req.leave.endDate > endOfYear ? endOfYear : req.leave.endDate;
        const diffDays = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
        totalLeaveTaken += diffDays;
      });

      // الرصيد المتبقي
      const remainingLeave = totalLeaveBalance - totalLeaveTaken;
      console.log('remaining leave for', employee.name, ':', remainingLeave);
      
      // منع الرصيد السالب من العرض
      const displayRemaining = remainingLeave < 0 ? 0 : remainingLeave;

      reports.push({
        _id: employee._id,
        name: employee.name,
        email: employee.user?.email || "",
        department: employee.department?.name || "N/A",
        jobTitle: employee.jobTitle || "",
       
        attendance: {
          present: attendedDays,
          late,
          absent
        },
        leaves: {
          total: totalLeaveBalance,        // إجمالي الرصيد
          taken: totalLeaveTaken,          // الإجازات المستخدمة خلال السنة
          remaining: displayRemaining      // الرصيد المتبقي (غير سالب)
        },
     
      });
    }

    res.json({
      month: `${today.toLocaleString("ar-EG", { month: "long" })} ${year}`,
      baseLeave: { // إضافة معلومات الرصيد الأساسي للشركة
        annual: baseLeaveBalance.annual,
        sick: baseLeaveBalance.sick,
        marriage: baseLeaveBalance.marriage,
        emergency: baseLeaveBalance.emergency,
        maternity: baseLeaveBalance.maternity,
        unpaid: baseLeaveBalance.unpaid,
        total: baseLeaveBalance.annual + baseLeaveBalance.sick + baseLeaveBalance.marriage + 
               baseLeaveBalance.emergency + baseLeaveBalance.maternity + baseLeaveBalance.unpaid
      },
      reports
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server Error" });
  }
};

// لليوم - جدول تاخير موظف معينs


const dailyEmployeeAttendance = async (req, res) => {
  try {
    const { id } = req.params;
    const employee = await Employee.findById(id).populate("workplace");
    if (!employee) return res.status(404).json({ message: "الموظف غير موجود" });

    const nowUTC = DateTime.utc();
    const todayStartUTC = nowUTC.startOf('day').toJSDate();

    const branch = employee.workplace;
    const officialStart = branch.workStart;
    const allowedLate = branch.gracePeriod;
    const branchTimezone = 'Africa/Cairo';

    const attendance = await Attendance.findOne({
      employee: id,
      date: { $gte: todayStartUTC }
    });

    if (!attendance || attendance.status !== "متأخر") {
      return res.json({ message: "لا يوجد تأخير لهذا اليوم" });
    }
    
    // تحويل كائن Date من UTC إلى الوقت المحلي
    const checkInDateTime = DateTime.fromJSDate(attendance.checkIn, { zone: branchTimezone });
    const checkInTime = checkInDateTime.toFormat('HH:mm');
    
    // *** التعديل هنا: نستخدم قيمة lateMinutes المحفوظة من قاعدة البيانات مباشرةً ***
    const delayMinutesFromDB = attendance.lateMinutes;
    
    res.json({
      employeeName: employee.name,
      date: nowUTC.setLocale('ar-EG').toFormat('dd/MM/yyyy'),
      checkIn: checkInTime,
      officialStartTime: officialStart,
      delayMinutes: delayMinutesFromDB, // استخدام القيمة من قاعدة البيانات
      allowedLateMinutes: allowedLate
    });

  } catch (err) {
    console.error("Error:", err);
    res.status(500).json({ message: "Server Error" });
  }
};

// جدول شهري للتاخيرات لموظف معين



const monthlyEmployeeAttendance = async (req, res) => {
  try {
 const { id } = req.params;
 const employee = await Employee.findById(id).populate("workplace");
if (!employee) return res.status(404).json({ message: "الموظف غير موجود" });

 const nowUTC = DateTime.utc();
 const startOfMonth = nowUTC.startOf('month').toJSDate();
 const endOfMonth = nowUTC.endOf('month').toJSDate();

 const attendances = await Attendance.find({
 employee: employee._id,
 date: { $gte: startOfMonth, $lte: endOfMonth }
 });
  
 const officialStart = employee.workplace?.workStart || "09:00";
 const allowedLateMinutes = employee.workplace?.gracePeriod || 0;

 const dailyDelays = [];
let totalMonthlyDelay = 0;

attendances.forEach(a => {
 if (a.status === "متأخر") {
   const delay = a.lateMinutes;

   // تنسيق التاريخ باللغة العربية
   const attendanceDate = DateTime.fromJSDate(a.date).setLocale('ar-EG').toFormat('dd/MM/yyyy');
  
  // هنا التعديل: تنسيق وقت الحضور باللغة الإنجليزية
   const checkInTime = DateTime.fromJSDate(a.checkIn).setLocale('en-US').toFormat('HH:mm');

   dailyDelays.push({
   employeeName: employee.name,
  date: attendanceDate,
  checkIn: checkInTime,
   officialStart,
  delayMinutes: delay,
 allowedLateMinutes
 });

 totalMonthlyDelay += delay;
 }
 });

 res.json({
   employeeName: employee.name,
 month: nowUTC.setLocale("ar-EG").toFormat("MMMM yyyy"),
 dailyDelays,
  totalMonthlyDelay
    });
  } catch (err) {
 console.error(err);
res.status(500).json({ error: "Server Error" });
  }
};


//get leaves and absences and tiken leaves for employee logging in...

const getYearlyAttendanceSummary = async (req, res) => {
  try {
    const employeeId = req.user.id;

    const today = new Date();
    const year = today.getFullYear();
    const yearStart = new Date(year, 0, 1, 0, 0, 0, 0);
    const yearEnd = new Date(year, 11, 31, 23, 59, 59, 999);

    // بيانات الموظف
    const emp = await Employee.findOne({user:employeeId}).select("name department");
    if (!emp) return res.status(404).json({ error: "الموظف غير موجود" });

    // حضور السنة
    const attendances = await Attendance.find({
      employee: emp._id,
      date: { $gte: yearStart, $lte: yearEnd }
    });

    const absentCount = attendances.filter(a => a.status === "غائب").length;
    const lateCount = attendances.filter(a => a.status === "متأخر").length;

    // الإجازات المقبولة
    const leaves = await Request.find({
      employee: emp._id,
      type: "إجازة",
      status: "مقبول",
      "leave.startDate": { $lte: yearEnd },
      "leave.endDate": { $gte: yearStart }
    });

    let totalLeavesTaken = 0;
    for (const leave of leaves) {
      const start = leave.leave.startDate < yearStart ? yearStart : leave.leave.startDate;
      const end = leave.leave.endDate > yearEnd ? yearEnd : leave.leave.endDate;

      const daysDiff = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
      totalLeavesTaken += daysDiff;
    }

    // رصيد الإجازات من LeaveBalance
    const leaveBalance = await LeaveBalance.findOne({ employee: emp._id });

    res.json({
      year,
      employee: emp.name,
      department: emp.department,
      absences: absentCount,
      lates: lateCount,
      leavesTaken: totalLeavesTaken,
      leaveRemaining: leaveBalance ? leaveBalance.remaining : 0
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "خطأ في السيرفر" });
  }
};





module.exports = { checkIn, checkOut ,getTodayAttendance 
   ,dailyState ,dailyStateBranch , dailyAttendanceTable ,getMonthlyAttendanceForEmployee 
   , monthlyReport ,monthlyReportoneBranch ,dailyAttendanceTableOnebranch ,dailyEmployeeAttendance ,monthlyEmployeeAttendance ,getYearlyAttendanceSummary };
