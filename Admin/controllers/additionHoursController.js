// controllers/additionHoursController.js
const AdditionHours = require("../models/AdditionHours");
const Employee = require("../models/employee");
const Attendance =require('../models/Attendance');
const LateExcuse=require('../models/LateExcuse');

exports.getAdditionHours = async (req, res) => {
  try {
    const { attendanceId } = req.params;
    const addition = await AdditionHours.findOne({ attendanceId })
      .populate({ path: 'employeeId', select: 'name salary' });
    if (!addition) return res.status(404).json({ message: "ساعات الإضافة غير موجودة" });
    res.json({ success: true, addition });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "حدث خطأ" });
  }
};

exports.updateAdditionHours = async (req, res) => {
  try {
    const { id } = req.params;
    const { increasePercent } = req.body; // بدل discountPercent

    const addition = await AdditionHours.findById(id).populate('employeeId');
    if (!addition) return res.status(404).json({ message: "غير موجود" });

    const salary = addition.employeeId.salary.total || 0;
    const additionValue = (salary * increasePercent) / 100;

    addition.amount = additionValue; // تخزين قيمة الزيادة فقط
    addition.increasePercent = increasePercent; // لو حابب تخزن النسبة كمان
    addition.status = "approved"; // اعتماد الزيادة
    await addition.save();

    res.json({ success: true, addition });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "حدث خطأ" });
  }
};



// payroooolllllllllllllllllllll
const moment = require("moment-timezone");



function formatMinutes(minutes) {
  if (!minutes) return "0 د";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h > 0) return `${h} س ${m} د`;
  return `${m} د`;
}

exports.getMyMonthlyPayroll = async (req, res) => {
  try {
    const userId = req.user._id;
    const { month, year } = req.query;

    // الموظف
    const employee = await Employee.findOne({ user: userId });
    if (!employee) return res.status(404).json({ message: "الموظف غير موجود" });

    // بداية ونهاية الشهر
    const startOfMonth = moment.tz({ year, month: month - 1 }, "Asia/Riyadh").startOf("month");
    const endOfMonth = startOfMonth.clone().endOf("month");

    // الحضور
    const attendances = await Attendance.find({
      employee: employee._id,
      date: { $gte: startOfMonth.toDate(), $lte: endOfMonth.toDate() }
    });

    const workDays = attendances.filter(a => a.status === "حاضر" || a.status === "متأخر").length;
    const absentDays = attendances.filter(a => a.status === "غائب").length;

    const totalLateMinutes = attendances.reduce((sum, a) => sum + (a.lateMinutes || 0), 0);

    // الأعذار / الخصومات
    const excuses = await LateExcuse.find({
      employee: employee._id,
      createdAt: { $gte: startOfMonth.toDate(), $lte: endOfMonth.toDate() },
      status: "REJECTED"
    });

    const totalLatePenalty = excuses.reduce((sum, e) => sum + (e.penaltyAmount || 0), 0);

    // جدول التأخير لكل يوم متأخر مع الخصم اليومي
    const attendanceDetails = attendances
      .filter(a => a.lateMinutes > 0)
      .map(a => {
        const dayExcuse = excuses.find(e => moment(e.createdAt).isSame(a.date, "day"));
        const penaltyAmount = dayExcuse ? dayExcuse.penaltyAmount : 0;

        return {
          day: moment(a.date).format("YYYY/MM/DD"),
          checkIn: a.checkIn ? moment(a.checkIn).format("HH:mm") : "-",
          checkOut: a.checkOut ? moment(a.checkOut).format("HH:mm") : "-",
          lateMinutes: formatMinutes(a.lateMinutes),
          lateMoney: penaltyAmount
        };
      });

    // الإضافي
    const additions = await AdditionHours.find({
      employeeId: employee._id,
      date: { $gte: startOfMonth.toDate(), $lte: endOfMonth.toDate() },
      status: "approved"
    });

    const totalOvertimeMinutes = additions.reduce((sum, a) => sum + a.overtimeMinutes, 0);
    const totalOvertimeAmount = additions.reduce((sum, a) => sum + a.amount, 0);

    // جدول الساعات الإضافية لكل يوم فيه إضافات
// خريطة الحضور حسب اليوم (علشان نجيب checkIn / checkOut)
const attendanceMap = {};
attendances.forEach(a => {
  const dayKey = moment(a.date).format("YYYY-MM-DD");
  attendanceMap[dayKey] = a;
});

const additionDetails = additions.map(a => {
  const dayKey = moment(a.date).format("YYYY-MM-DD");
  const attendance = attendanceMap[dayKey];

  return {
    day: moment(a.date).format("YYYY/MM/DD"),
    checkIn: attendance?.checkIn
      ? moment(attendance.checkIn).format("HH:mm")
      : "-",
    checkOut: attendance?.checkOut
      ? moment(attendance.checkOut).format("HH:mm")
      : "-",
    additionHours: formatMinutes(a.overtimeMinutes),
    amount: a.amount
  };
});

    // الراتب
    const salary = employee.salary;
    const totalSalary = salary.total + totalOvertimeAmount - totalLatePenalty;

    res.json({
      month,
      year,
      salary: {
        base: salary.base,
        housingAllowance: salary.housingAllowance,
        transportAllowance: salary.transportAllowance,
        otherAllowance: salary.otherAllowance,
        total: salary.total
      },
      attendanceSummary: {
        workDays,
        absentDays,
        totalLateMinutes: formatMinutes(totalLateMinutes),
        totalOvertimeMinutes: formatMinutes(totalOvertimeMinutes)
      },
      attendanceDetails,       // جدول التأخير مع الخصم اليومي
      additions: {
        totalOvertimeAmount,
        details: additionDetails // جدول الإضافات
      },
      deductions: {
        latePenalty: totalLatePenalty
      },
      totalSalary
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({
      message: "خطأ في حساب الراتب الشهري",
      error: err.message
    });
  }
};



exports.getMonthlyPayrollForHr = async (req, res) => {
  try {
    const { month, year, employeeId } = req.query;

    // البداية والنهاية للشهر
    const startOfMonth = moment.tz({ year, month: month - 1 }, "Asia/Riyadh").startOf("month");
    const endOfMonth = startOfMonth.clone().endOf("month");

    if (employeeId) {
      // بيانات موظف واحد
      const emp = await Employee.findById(employeeId);
      if (!emp) return res.status(404).json({ message: "الموظف غير موجود" });

      // الحضور
      const attendances = await Attendance.find({
        employee: emp._id,
        date: { $gte: startOfMonth.toDate(), $lte: endOfMonth.toDate() },
      });

      const workDays = attendances.filter(a => a.status === "حاضر" || a.status === "متأخر").length;
      const absentDays = attendances.filter(a => a.status === "غائب").length;
      const totalLateMinutes = attendances.reduce((sum, a) => sum + (a.lateMinutes || 0), 0);

      // الخصومات
      const excuses = await LateExcuse.find({
        employee: emp._id,
        createdAt: { $gte: startOfMonth.toDate(), $lte: endOfMonth.toDate() },
        status: "REJECTED"
      });
      const totalLatePenalty = excuses.reduce((sum, e) => sum + (e.penaltyAmount || 0), 0);

      // الإضافات
      const additions = await AdditionHours.find({
        employeeId: emp._id,
        date: { $gte: startOfMonth.toDate(), $lte: endOfMonth.toDate() },
        status: "approved"
      });
      const totalOvertimeAmount = additions.reduce((sum, a) => sum + a.amount, 0);
      const totalOvertimeMinutes = additions.reduce((sum, a) => sum + a.overtimeMinutes, 0);

      const salary = emp.salary;
      const totalSalary = salary.total + totalOvertimeAmount - totalLatePenalty;

      return res.json({
        month,
        year,
        employee: {
          name: emp.name,
          employeeNumber: emp.employeeNumber,
          department: emp.department,
          jobTitle: emp.jobTitle
        },
        additions: {
          baseSalary: salary.base,
          allowances: salary.housingAllowance + salary.transportAllowance + salary.otherAllowance,
          bonuses: totalOvertimeAmount,
          overtimeMinutes: totalOvertimeMinutes
        },
        deductions: {
          insurance: 0,
          taxes: 0,
          absenceAndLate: totalLatePenalty
        },
        attendanceSummary: {
          workDays,
          absentDays,
          totalLateMinutes
        },
        totalSalary
      });
    }

    // بيانات كل الموظفين
    const employees = await Employee.find().populate("department");
    const result = await Promise.all(
      employees.map(async emp => {
        // إحضار الإضافات والخصومات
        const additions = await AdditionHours.find({
          employeeId: emp._id,
          date: { $gte: startOfMonth.toDate(), $lte: endOfMonth.toDate() },
          status: "approved"
        });
        const totalAdditions = additions.reduce((sum, a) => sum + a.amount, 0);

        const attendances = await Attendance.find({
          employee: emp._id,
          date: { $gte: startOfMonth.toDate(), $lte: endOfMonth.toDate() },
        });
        const excuses = await LateExcuse.find({
          employee: emp._id,
          createdAt: { $gte: startOfMonth.toDate(), $lte: endOfMonth.toDate() },
          status: "REJECTED"
        });
        const totalDeductions = excuses.reduce((sum, e) => sum + (e.penaltyAmount || 0), 0);

        const netSalary = emp.salary.total + totalAdditions - totalDeductions;

        return {
          employeeId: emp._id,
          name: emp.name,
          department: emp.department?.name || "-",
          totalAdditions,
          totalDeductions,
          netSalary
        };
      })
    );

    res.json({
      month,
      year,
      employees: result
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "خطأ في جلب الرواتب", error: err.message });
  }
};

