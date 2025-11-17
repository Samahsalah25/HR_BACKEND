// controllers/hrReportsController.js
const Attendance = require('../models/Attendance');
const Employee = require('../models/employee');
const Branch = require('../models/branchSchema');
const Contract = require('../models/Contract');
const ExcelJS = require('exceljs');
const mongoose = require('mongoose');
const moment = require('moment');
const Request = require('../models/requestModel');
const LeaveBalance =require('../models/leaveBalanceModel')
const Department =require('../models/depaertment')
const Record =require('../models/licence')

/* ---------------- Helpers ---------------- */

// Populate queries
const populateAttendance = [
  { path: 'employee', select: 'name employeeNumber department workplace salary' },
  { path: 'branch', select: 'name workStart workEnd' }
];

const populateContract = [
  { path: 'department', select: 'name' },
 { path: 'contract.duration', select: 'name duration unit' },
  { path: 'workplace', select: 'name' } // الفرع
];

// Saudi time conversion
const fixTimeSaudi = (date) => date ? moment(date).utcOffset(3).format('HH:mm') : null;

// Parse start/end dates
function parseDateStart(dateStr) {
  return moment(dateStr + ' 00:00', 'YYYY-MM-DD HH:mm').utcOffset(3).toDate();
}
function parseDateEnd(dateStr) {
  return moment(dateStr + ' 23:59', 'YYYY-MM-DD HH:mm').utcOffset(3).toDate();
}

// Send Excel workbook
async function sendWorkbook(res, workbook, filename) {
  res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
  await workbook.xlsx.write(res);
  res.end();
}

/* ---------------- Attendance Reports ---------------- */

// 1) Daily Attendance
exports.attendanceDaily = async (req, res) => {
  try {
    const { date } = req.query;
    if (!date) return res.status(400).json({ message: 'date (YYYY-MM-DD) required' });

    const start = parseDateStart(date);
    const end = parseDateEnd(date);

    const docs = await Attendance.find({ date: { $gte: start, $lte: end } })
      .populate(populateAttendance)
      .sort({ 'employee.name': 1 });

    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet(`Attendance ${date}`);

    ws.columns = [
      { header: 'اسم الموظف', key: 'name', width: 30 },
      { header: 'كود الموظف', key: 'empNo', width: 15 },
      { header: 'الفرع', key: 'branch', width: 20 },
      { header: 'التاريخ', key: 'date', width: 15 },
      { header: 'وقت الدخول', key: 'checkIn', width: 20 },
      { header: 'وقت الخروج', key: 'checkOut', width: 20 },
      { header: 'الحالة', key: 'status', width: 12 },
      { header: 'دقائق التأخير', key: 'lateMinutes', width: 15 },
      { header: 'دقائق العمل', key: 'workedMinutes', width: 15 }
    ];

    docs.forEach(d => {
      ws.addRow({
        name: d.employee?.name || '—',
        empNo: d.employee?.employeeNumber || '—',
        branch: d.branch?.name || '—',
        date: moment(d.date).format('YYYY-MM-DD'),
        checkIn: fixTimeSaudi(d.checkIn) || '—',
        checkOut: fixTimeSaudi(d.checkOut) || 'لم يتم تسجيل انصراف',
        status: d.status,
        lateMinutes: d.lateMinutes || 0,
        workedMinutes: d.workedMinutes || 0
      });
    });

    await sendWorkbook(res, wb, `attendance_${date}.xlsx`);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// 2) Attendance Range
exports.attendanceRange = async (req, res) => {
  try {
    const { start, end } = req.query;
    if (!start || !end)
      return res.status(400).json({ message: 'start and end required (YYYY-MM-DD)' });

    const s = parseDateStart(start);
    const e = parseDateEnd(end);

    const docs = await Attendance.find({ date: { $gte: s, $lte: e } })
      .populate(populateAttendance)
      .sort({ date: 1, 'employee.name': 1 });

    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet(`Attendance ${start} to ${end}`);

    ws.columns = [
      { header: 'التاريخ', key: 'date', width: 15 },
      { header: 'اسم الموظف', key: 'name', width: 30 },
      { header: 'كود الموظف', key: 'empNo', width: 15 },
      { header: 'الفرع', key: 'branch', width: 20 },
      { header: 'الدخول', key: 'checkIn', width: 15 },
      { header: 'الخروج', key: 'checkOut', width: 15 },
      { header: 'الحالة', key: 'status', width: 12 },
      { header: 'التأخير (دق)', key: 'late', width: 12 },
      { header: 'العمل (دق)', key: 'worked', width: 12 }
    ];

    docs.forEach(d => {
      ws.addRow({
        date: moment(d.date).format('YYYY-MM-DD'),
        name: d.employee?.name || '—',
        empNo: d.employee?.employeeNumber || '—',
        branch: d.branch?.name || '—',
        checkIn: fixTimeSaudi(d.checkIn) || '—',
        checkOut: fixTimeSaudi(d.checkOut) || 'لم يتم تسجيل انصراف',
        status: d.status,
        late: d.lateMinutes || 0,
        worked: d.workedMinutes || 0
      });
    });

    await sendWorkbook(res, wb, `attendance_${start}_to_${end}.xlsx`);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// 3) Late Report
exports.attendanceLate = async (req, res) => {
  try {
    const { start, end } = req.query;
    const filter = { status: 'متأخر' };
    if (start && end) filter.date = { $gte: parseDateStart(start), $lte: parseDateEnd(end) };

    const docs = await Attendance.find(filter).populate(populateAttendance).sort({ date: 1 });

    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Late Report');

    ws.columns = [
      { header: 'التاريخ', key: 'date', width: 15 },
      { header: 'الموظف', key: 'name', width: 30 },
      { header: 'الفرع', key: 'branch', width: 20 },
      { header: 'وقت الدخول', key: 'checkIn', width: 15 },
      { header: 'التأخير (دق)', key: 'late', width: 12 }
    ];

    docs.forEach(d => {
      ws.addRow({
        date: moment(d.date).format('YYYY-MM-DD'),
        name: d.employee?.name || '—',
        branch: d.branch?.name || '—',
        checkIn: fixTimeSaudi(d.checkIn) || '—',
        late: d.lateMinutes || 0
      });
    });

    await sendWorkbook(res, wb, `late_report_${start || 'all'}_${end || 'all'}.xlsx`);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// 4) Absence Report
exports.attendanceAbsence = async (req, res) => {
  try {
    const { start, end } = req.query;
    const filter = { status: 'غائب' };
    if (start && end) filter.date = { $gte: parseDateStart(start), $lte: parseDateEnd(end) };

    const docs = await Attendance.find(filter).populate(populateAttendance).sort({ date: 1 });

    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Absence Report');

    ws.columns = [
      { header: 'التاريخ', key: 'date', width: 15 },
      { header: 'الموظف', key: 'name', width: 30 },
      { header: 'الفرع', key: 'branch', width: 20 },
      { header: 'ملاحظة', key: 'note', width: 40 }
    ];

    docs.forEach(d => {
      ws.addRow({
        date: moment(d.date).format('YYYY-MM-DD'),
        name: d.employee?.name || '—',
        branch: d.branch?.name || '—',
        note: d.notes || '—'
      });
    });

    await sendWorkbook(res, wb, `absence_${start || 'all'}_${end || 'all'}.xlsx`);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// 5) Attendance By Employee
exports.attendanceByEmployee = async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { start, end } = req.query;
    if (!mongoose.Types.ObjectId.isValid(employeeId))
      return res.status(400).json({ message: 'Invalid employeeId' });

    const s = start ? parseDateStart(start) : moment().startOf('month').toDate();
    const e = end ? parseDateEnd(end) : moment().endOf('month').toDate();

    const docs = await Attendance.find({
      employee: mongoose.Types.ObjectId(employeeId),
      date: { $gte: s, $lte: e }
    }).populate(populateAttendance).sort({ date: 1 });

    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet(`Employee_${employeeId}`);

    ws.columns = [
      { header: 'التاريخ', key: 'date', width: 15 },
      { header: 'وقت الدخول', key: 'checkIn', width: 15 },
      { header: 'وقت الخروج', key: 'checkOut', width: 20 },
      { header: 'الحالة', key: 'status', width: 12 },
      { header: 'التأخير (دق)', key: 'late', width: 12 },
      { header: 'العمل (دق)', key: 'worked', width: 12 }
    ];

    docs.forEach(d => {
      ws.addRow({
        date: moment(d.date).format('YYYY-MM-DD'),
        checkIn: fixTimeSaudi(d.checkIn) || '—',
        checkOut: fixTimeSaudi(d.checkOut) || 'لم يتم تسجيل انصراف',
        status: d.status,
        late: d.lateMinutes || 0,
        worked: d.workedMinutes || 0
      });
    });

    await sendWorkbook(res, wb, `employee_${employeeId}_${moment(s).format('YYYYMMDD')}_${moment(e).format('YYYYMMDD')}.xlsx`);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

/* ---------------- Contracts Report ---------------- */
//6)
exports.contractsReport = async (req, res) => {
  try {
   const employees = await Employee.find()
  .populate([
    { path: 'contract', select: 'name duration unit' },  // Populate العقد بالكامل
    { path: 'contract.duration', select: 'name' },  // Populate المدة الخاصة بالعقد (duration)
    { path: 'department', select: 'name' },
    { path: 'workplace', select: 'name' }
  ])
  .sort({ 'name': 1 });

employees.forEach(emp => {
  console.log(emp.contract);  // طباعة العقد للتحقق من البيانات
  console.log(emp.contract?.name);  // تأكد أن اسم العقد يظهر هنا
});

  
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Employee Contracts');

    ws.columns = [
      { header: 'اسم الموظف', key: 'name', width: 30 },
      { header: 'الرقم الوظيفي', key: 'empNo', width: 15 },
      { header: 'الفرع', key: 'branch', width: 20 },
      { header: 'القسم', key: 'department', width: 20 },
      { header: 'مدة العقد', key: 'contractDuration', width: 30 },  // Increase column width if necessary
      { header: 'تاريخ البداية', key: 'start', width: 15 },
      { header: 'تاريخ النهاية', key: 'end', width: 15 },
      { header: 'الراتب الأساسي', key: 'baseSalary', width: 15 },
      { header: 'بدلات', key: 'allowances', width: 15 },
      { header: 'الإجمالي', key: 'totalSalary', width: 15 }
    ];

    employees.forEach(emp => {
      console.log('Employee Contract:', emp.contract); // Debug log
      ws.addRow({
        name: emp.name,
        empNo: emp.employeeNumber || '—',
        department: emp.department?.name || '—',
        branch: emp.workplace?.name || '—',
     contractDuration: emp.contract?.duration?.name || '—',
        start: emp.contract?.start ? moment(emp.contract.start).format('YYYY-MM-DD') : '—',
        end: emp.contract?.end ? moment(emp.contract.end).format('YYYY-MM-DD') : '—',
        baseSalary: emp.salary?.base || 0,
        allowances: (emp.salary?.housingAllowance || 0) + (emp.salary?.transportAllowance || 0) + (emp.salary?.otherAllowance || 0),
        totalSalary: emp.salary?.total || 0
      });
    });

    await sendWorkbook(res, wb, 'employee_contracts.xlsx');
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

exports.contractsExpiringReport = async (req, res) => {
  try {
    // تحديد عدد الأيام للفترة المطلوبة (شهرين أو ثلاثة أشهر)
    const daysIn2Months = 60;  
    const daysIn3Months = 90;  
    const today = new Date();
    
    // استعلام للحصول على بيانات الموظفين مع تفاصيل العقد
    const employees = await Employee.find()
      .populate([
        { path: 'contract', select: 'name start end duration unit' },  
        { path: 'contract.duration', select: 'name' },  
        { path: 'department', select: 'name' },  
        { path: 'workplace', select: 'name' }  
      ])
      .sort({ 'name': 1 });

    // إذا مفيش بيانات
    if (!employees || employees.length === 0) {
      return res.status(404).json({ message: "لا توجد بيانات لعقود الموظفين" });
    }

    // إنشاء ملف Excel
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Contracts Expiring Report');

    // تحديد الأعمدة في الـ Excel
    ws.columns = [
      { header: 'اسم الموظف', key: 'name', width: 30 },
      { header: 'الرقم الوظيفي', key: 'empNo', width: 15 },
      { header: 'الفرع', key: 'branch', width: 20 },
      { header: 'القسم', key: 'department', width: 20 },
      { header: 'مدة العقد', key: 'contractDuration', width: 30 },
      { header: 'تاريخ بداية العقد', key: 'start', width: 20 },
      { header: 'تاريخ نهاية العقد', key: 'end', width: 20 },
      { header: 'الراتب الأساسي', key: 'baseSalary', width: 15 },
      { header: 'بدلات', key: 'allowances', width: 15 },
      { header: 'الإجمالي', key: 'totalSalary', width: 15 }
    ];

    // إضافة البيانات التي ستنتهي قريبًا
    employees.forEach((emp) => {
      if (emp.contract?.end) {
        const endDate = new Date(emp.contract.end);
        const diffDays = (endDate - today) / (1000 * 60 * 60 * 24); // حساب الفارق بالأيام

        let status = "ساري"; // حالة العقد بشكل افتراضي

        // تحديد الحالة بناءً على الفارق بين تاريخ اليوم وتاريخ نهاية العقد
        if (diffDays < 0) status = "منتهي";
        else if (diffDays <= daysIn2Months) status = "قرب الانتهاء (شهرين)";
        else if (diffDays <= daysIn3Months) status = "قرب الانتهاء (ثلاثة أشهر)";

        // إضافة العقد إذا كان قريب من الانتهاء
        if (status === "قرب الانتهاء (شهرين)" || status === "قرب الانتهاء (ثلاثة أشهر)") {
          ws.addRow({
            name: emp.name,
            empNo: emp.employeeNumber || '—',
            department: emp.department?.name || '—',
            branch: emp.workplace?.name || '—',
            contractDuration: emp.contract?.duration?.name || '—',
            start: emp.contract?.start ? moment(emp.contract.start).format('YYYY-MM-DD') : '—',
            end: emp.contract?.end ? moment(emp.contract.end).format('YYYY-MM-DD') : '—',
            baseSalary: emp.salary?.base || 0,
            allowances: (emp.salary?.housingAllowance || 0) + (emp.salary?.transportAllowance || 0) + (emp.salary?.otherAllowance || 0),
            totalSalary: emp.salary?.total || 0
          });
        }
      }
    });


    if (ws.rowCount === 1) { // أول صف هو الرأس (header)
      return res.status(404).json({ message: "لا توجد عقود ستنتهي قريبًا في الفترة المحددة." });
    }

    // إرسال ملف الـ Excel للعميل
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="ContractsExpiringReport.xlsx"');
    await wb.xlsx.write(res);
    res.end();

  } catch (err) {
    console.error("Error generating contracts expiring report:", err);
    return res.status(500).json({ message: "Error generating contracts expiring report", error: err });
  }
};


// leave reports

exports.leaveBalancesReport = async (req, res) => {
  try {
    // استعلام عن الطلبات التي قيد المراجعة
    const requests = await Request.find({ status: 'قيد المراجعة' })
      .populate('employee'); // إذا كنت عايز تجيب تفاصيل الموظف

    const reportData = [];

    // لو فيه طلبات، هنجيب رصيد الإجازات
    for (const request of requests) {
      const leaveBalance = await LeaveBalance.findOne({ employee: request.employee });

      // لو رصيد الإجازات مش موجود، هنبقى بنعرض رسالة فاضية
      const leaveData = {
        employeeName: request.employee.name,
        leaveType: request.leave.leaveType,
        startDate: request.leave.startDate,
        endDate: request.leave.endDate,
        annualLeaveBalance: leaveBalance ? leaveBalance.annual : null, // لو مش موجود، خليها null
        sickLeaveBalance: leaveBalance ? leaveBalance.sick : null, // لو مش موجود، خليها null
        marriageLeaveBalance: leaveBalance ? leaveBalance.marriage : null, // لو مش موجود، خليها null
        emergencyLeaveBalance: leaveBalance ? leaveBalance.emergency : null, // لو مش موجود، خليها null
        maternityLeaveBalance: leaveBalance ? leaveBalance.maternity : null, // لو مش موجود، خليها null
        unpaidLeaveBalance: leaveBalance ? leaveBalance.unpaid : null, // لو مش موجود، خليها null
        remainingLeaveBalance: leaveBalance ? leaveBalance.remaining : null // لو مش موجود، خليها null
      };

      reportData.push(leaveData);
    }

    // هنا بننشئ ورقة Excel من التقرير باستخدام ExcelJS
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Leave Balances Report');

    // تحديد الأعمدة بشكل واضح
    ws.columns = [
      { header: 'اسم الموظف', key: 'employeeName', width: 30 },
      { header: 'نوع الإجازة', key: 'leaveType', width: 20 },
      { header: 'تاريخ البدء', key: 'startDate', width: 15 },
      { header: 'تاريخ الانتهاء', key: 'endDate', width: 15 },
      { header: 'رصيد إجازة سنوية', key: 'annualLeaveBalance', width: 20 },
      { header: 'رصيد إجازة مرضية', key: 'sickLeaveBalance', width: 20 },
      { header: 'رصيد إجازة زواج', key: 'marriageLeaveBalance', width: 20 },
      { header: 'رصيد إجازة طارئة', key: 'emergencyLeaveBalance', width: 20 },
      { header: 'رصيد إجازة أمومة', key: 'maternityLeaveBalance', width: 20 },
      { header: 'رصيد إجازة بدون راتب', key: 'unpaidLeaveBalance', width: 25 },
      { header: 'رصيد إجازات متبقية', key: 'remainingLeaveBalance', width: 25 }
    ];

    // إضافة البيانات إلى التقرير
    reportData.forEach(d => {
      ws.addRow({
        employeeName: d.employeeName || '—',
        leaveType: d.leaveType || '—',
        startDate: d.startDate ? moment(d.startDate).format('YYYY-MM-DD') : '—',
        endDate: d.endDate ? moment(d.endDate).format('YYYY-MM-DD') : '—',
        annualLeaveBalance: d.annualLeaveBalance !== null ? d.annualLeaveBalance : '—',
        sickLeaveBalance: d.sickLeaveBalance !== null ? d.sickLeaveBalance : '—',
        marriageLeaveBalance: d.marriageLeaveBalance !== null ? d.marriageLeaveBalance : '—',
        emergencyLeaveBalance: d.emergencyLeaveBalance !== null ? d.emergencyLeaveBalance : '—',
        maternityLeaveBalance: d.maternityLeaveBalance !== null ? d.maternityLeaveBalance : '—',
        unpaidLeaveBalance: d.unpaidLeaveBalance !== null ? d.unpaidLeaveBalance : '—',
        remainingLeaveBalance: d.remainingLeaveBalance !== null ? d.remainingLeaveBalance : '—'
      });
    });

    // إرسال الملف للمستخدم
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="LeaveBalancesReport.xlsx"');
    await wb.xlsx.write(res);
    res.end();
    
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Error generating leave balance report', error: err });
  }
};


// رصيد اجازت لكل الموظفين
// 1) Leave Balances Report for all employees
exports.leaveBalancesFullReport = async (req, res) => {
  try {
    // استعلام للحصول على بيانات رصيد الإجازات مع بيانات الموظف وبيانات القسم والفرع
    const leaveBalances = await LeaveBalance.find({ employee: { $ne: null } })  // شرط للتأكد من وجود الموظف
      .populate({
        path: 'employee',
        model: 'Employee',
        select: 'name employeeNumber department workplace', // بيانات الموظف المطلوبة
        populate: [
          {
            path: 'department',
            model: 'Department',
            select: 'name'  // بيانات القسم
          },
          {
            path: 'workplace',
            model: 'Branch',
            select: 'name'  // بيانات الفرع
          }
        ]
      })
      .sort({ 'employee.name': 1 });

    // لو مفيش بيانات
    if (!leaveBalances || leaveBalances.length === 0) {
      return res.status(404).json({ message: "No leave balances found" });
    }

    // إنشاء ملف Excel
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('All Employees Leave Balances');

    // تحديد الأعمدة في الـ Excel
    ws.columns = [
      { header: 'اسم الموظف', key: 'name', width: 30 },
      { header: 'الرقم الوظيفي', key: 'empNo', width: 15 },
      { header: 'القسم', key: 'department', width: 20 },
      { header: 'الفرع', key: 'branch', width: 20 },
      { header: 'رصيد الإجازة السنوية', key: 'annualLeave', width: 20 },
      { header: 'رصيد الإجازة المرضية', key: 'sickLeave', width: 20 },
      { header: 'رصيد الإجازة الطارئة', key: 'emergencyLeave', width: 20 },
      { header: 'رصيد الإجازة بدون راتب', key: 'unpaidLeave', width: 20 },
      { header: 'رصيد الإجازات المتبقية', key: 'remainingLeave', width: 20 }
    ];

    // إضافة بيانات الموظفين إلى الـ Excel
    leaveBalances.forEach(leave => {
      if (leave.employee) { // نضمن إن الموظف موجود
        ws.addRow({
          name: leave.employee.name || '—',
          empNo: leave.employee.employeeNumber || '—',
          department: leave.employee.department ? leave.employee.department.name : '—',
          branch: leave.employee.workplace ? leave.employee.workplace.name : '—',
          annualLeave: leave.annual || '—',
          sickLeave: leave.sick || '—',
          emergencyLeave: leave.emergency || '—',
          unpaidLeave: leave.unpaid || '—',
          remainingLeave: leave.remaining || '—'
        });
      }
    });

    // إرسال ملف الـ Excel للعميل
    await sendWorkbook(res, wb, 'Leave_Balances_Full_Report.xlsx');
  } catch (err) {
    console.error("Error generating leave balances report:", err);  // إضافة log للخطأ
    return res.status(500).json({ message: "Error generating leave balances report", error: err });
  }
};



// salaries
exports.generateSalaryReport = async (req, res) => {
  try {
    // استعلام للحصول على بيانات الموظفين مع الراتب
    const employees = await Employee.find().populate('department workplace'); // هنا بنجمع بيانات الموظفين
    
    // لو مفيش بيانات
    if (!employees || employees.length === 0) {
      return res.status(404).json({ message: "No employees found" });
    }

    // إنشاء ملف Excel
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Salary Report');

    // تحديد الأعمدة في الـ Excel
    ws.columns = [
      { header: 'اسم الموظف', key: 'name', width: 30 },
      { header: 'الرقم الوظيفي', key: 'employeeNumber', width: 20 },
      { header: 'المسمى الوظيفي', key: 'jobTitle', width: 25 },
      { header: 'القسم', key: 'department', width: 20 },
      { header: 'الفرع', key: 'branch', width: 20 },
      { header: 'الراتب الأساسي', key: 'baseSalary', width: 20 },
      { header: 'بدل سكن', key: 'housingAllowance', width: 20 },
      { header: 'بدل نقل', key: 'transportAllowance', width: 20 },
      { header: 'بدل آخر', key: 'otherAllowance', width: 20 },
      { header: 'الراتب الإجمالي', key: 'totalSalary', width: 20 }
    ];

    // إضافة بيانات الموظفين إلى الـ Excel
    employees.forEach(employee => {
      ws.addRow({
        name: employee.name || '—',
        employeeNumber: employee.employeeNumber || '—',
        jobTitle: employee.jobTitle || '—',
        department: employee.department ? employee.department.name : '—',
        branch: employee.workplace ? employee.workplace.name : '—',
        baseSalary: employee.salary.base || '—',
        housingAllowance: employee.salary.housingAllowance || '—',
        transportAllowance: employee.salary.transportAllowance || '—',
        otherAllowance: employee.salary.otherAllowance || '—',
        totalSalary: employee.salary.total || '—'
      });
    });

    // إرسال ملف الـ Excel للعميل
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="SalaryReport.xlsx"');
    await wb.xlsx.write(res);
    res.end();
    
  } catch (err) {
    console.error("Error generating salary report:", err); // إضافة log للخطأ
    return res.status(500).json({ message: "Error generating salary report", error: err });
  }
};


//  الاقامات بقي
exports.generateResidencyReport = async (req, res) => {
  try {
    // استعلام للحصول على بيانات الموظفين مع تفاصيل الإقامة
    const employees = await Employee.find()
      .populate('residency.duration', 'year') // الحصول على السنة من مدة الإقامة
      .select('name residency'); // تحديد الحقول التي نحتاجها (الاسم والإقامة)

    // لو مفيش بيانات
    if (!employees || employees.length === 0) {
      return res.status(404).json({ message: "No residency data found" });
    }

    // إنشاء ملف Excel
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Residency Report');

    // تحديد الأعمدة في الـ Excel
    ws.columns = [
      { header: 'اسم الموظف', key: 'name', width: 30 },
      { header: 'رقم الإضافة', key: 'additionNumber', width: 20 },
      { header: 'مدة الإقامة (سنوات)', key: 'duration', width: 20 },
      { header: 'تاريخ بداية الإقامة', key: 'start', width: 20 },
      { header: 'تاريخ نهاية الإقامة', key: 'end', width: 20 },
      { header: 'حالة الإقامة', key: 'status', width: 20 }
    ];

    // إضافة البيانات إلى التقرير
    employees.forEach((emp) => {
      const r = emp.residency || {}; // تفاصيل الإقامة
      const today = new Date();
      let status = "غير محددة";

      // حساب حالة الإقامة
      if (r.end) {
        const endDate = new Date(r.end);
        const diffDays = (endDate - today) / (1000 * 60 * 60 * 24);
        if (diffDays < 0) status = "منتهية";
        else if (diffDays <= 30) status = "قرب الانتهاء";
        else status = "سارية";
      }

      // إضافة صف البيانات
      ws.addRow({
        name: emp.name || '—',
        additionNumber: r.additionNumber || '—',
        duration: r.duration?.year ? `${r.duration.year} سنوات` : '—',
        start: r.start ? new Date(r.start).toISOString().split('T')[0] : '—',
        end: r.end ? new Date(r.end).toISOString().split('T')[0] : '—',
        status: status
      });
    });

    // إرسال ملف الـ Excel للعميل
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="ResidencyReport.xlsx"');
    await wb.xlsx.write(res);
    res.end();

  } catch (err) {
    console.error("Error generating residency report:", err); // إضافة log للخطأ
    return res.status(500).json({ message: "Error generating residency report", error: err });
  }
};

// الاقامات اللي قربت تخلص
exports.generateResidencyExpiringReport = async (req, res) => {
  try {
    // تحديد عدد الأيام للفترة المطلوبة (شهرين أو ثلاثة أشهر)
    const daysIn2Months = 60; 
    const daysIn3Months = 90;  
    const today = new Date();
    
    
    const employees = await Employee.find()
      .populate('residency.duration', 'year') 
      .select('name residency');

    // لو مفيش بيانات
    if (!employees || employees.length === 0) {
      return res.status(404).json({ message: "No residency data found" });
    }

    // إنشاء ملف Excel
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Residency Expiring Report');

    // تحديد الأعمدة في الـ Excel
    ws.columns = [
      { header: 'اسم الموظف', key: 'name', width: 30 },
      { header: 'رقم الإضافة', key: 'additionNumber', width: 20 },
      { header: 'مدة الإقامة (سنوات)', key: 'duration', width: 20 },
      { header: 'تاريخ بداية الإقامة', key: 'start', width: 20 },
      { header: 'تاريخ نهاية الإقامة', key: 'end', width: 20 },
      { header: 'حالة الإقامة', key: 'status', width: 20 }
    ];

    // إضافة البيانات إلى التقرير
    employees.forEach((emp) => {
      const r = emp.residency || {}; // تفاصيل الإقامة
      let status = "غير محددة";

      // إذا كانت نهاية الإقامة موجودة
      if (r.end) {
        const endDate = new Date(r.end);
        const diffDays = (endDate - today) / (1000 * 60 * 60 * 24); // حساب الفارق بالأيام

       
        if (diffDays < 0) status = "منتهية";
        else if (diffDays <= daysIn2Months) status = "قرب الانتهاء (شهرين)";
        else if (diffDays <= daysIn3Months) status = "قرب الانتهاء (ثلاثة أشهر)";
        else status = "سارية";
      }

  
      if (status === "قرب الانتهاء (شهرين)" || status === "قرب الانتهاء (ثلاثة أشهر)") {
        ws.addRow({
          name: emp.name || '—',
          additionNumber: r.additionNumber || '—',
          duration: r.duration?.year ? `${r.duration.year} سنوات` : '—',
          start: r.start ? new Date(r.start).toISOString().split('T')[0] : '—',
          end: r.end ? new Date(r.end).toISOString().split('T')[0] : '—',
          status: status
        });
      }
    });

  
    if (ws.rowCount === 1) { 
      return res.status(404).json({ message: "لا توجد إقامات ستنتهي قريبًا في الفترة المحددة." });
    }


    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="ResidencyExpiringReport.xlsx"');
    await wb.xlsx.write(res);
    res.end();

  } catch (err) {
    console.error("Error generating residency expiring report:", err); // إضافة log للخطأ
    return res.status(500).json({ message: "Error generating residency expiring report", error: err });
  }
};



// تقارير الl employee
exports.employeeReport = async (req, res) => {
  try {
    const employees = await Employee.find()
      .populate([
        { path: 'department', select: 'name' },  // Populate القسم
        { path: 'workplace', select: 'name' },  // Populate مكان العمل
        { path: 'contract', select: 'start end' },  // Populate عقد الموظف
        { path: 'residency', select: 'start end nationality' }  // Populate بيانات الإقامة
      ])
      .sort({ name: 1 }); // ترتيب حسب الاسم

    // إذا مفيش بيانات
    if (!employees || employees.length === 0) {
      return res.status(404).json({ message: "لا توجد بيانات للموظفين" });
    }

    // إنشاء ملف Excel
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('Employee Report');

    // تحديد الأعمدة في الـ Excel
    ws.columns = [
      { header: 'اسم الموظف', key: 'name', width: 30 },
      { header: 'الوظيفة', key: 'jobTitle', width: 20 },
      { header: 'الرقم الوظيفي', key: 'empNo', width: 15 },
      { header: 'القسم', key: 'department', width: 20 },
      { header: 'مكان العمل', key: 'branch', width: 20 },
      { header: 'تاريخ بداية العقد', key: 'contractStart', width: 20 },
      { header: 'تاريخ نهاية العقد', key: 'contractEnd', width: 20 },
      { header: 'الراتب الأساسي', key: 'baseSalary', width: 15 },
      { header: 'البدلات', key: 'allowances', width: 15 },
      { header: 'الإجمالي', key: 'totalSalary', width: 15 }
    ];

    // إضافة البيانات للموظفين
    employees.forEach(emp => {
      ws.addRow({
        name: emp.name,
        jobTitle: emp.jobTitle || '—',
        empNo: emp.employeeNumber || '—',
        department: emp.department?.name || '—',
        branch: emp.workplace?.name || '—',
        contractStart: emp.contract?.start ? moment(emp.contract.start).format('YYYY-MM-DD') : '—',
        contractEnd: emp.contract?.end ? moment(emp.contract.end).format('YYYY-MM-DD') : '—',
        baseSalary: emp.salary?.base || 0,
        allowances: (emp.salary?.housingAllowance || 0) + (emp.salary?.transportAllowance || 0) + (emp.salary?.otherAllowance || 0),
        totalSalary: emp.salary?.total || 0
      });
    });

    // إرسال ملف الـ Excel للعميل
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="EmployeeReport.xlsx"');
    await wb.xlsx.write(res);
    res.end();

  } catch (err) {
    console.error("Error generating employee report:", err);
    return res.status(500).json({ message: "Error generating employee report", error: err });
  }
};

exports.newEmployeesReport = async (req, res) => {
  try {
    const today = new Date();
    const threeMonthsAgo = new Date(today);
    threeMonthsAgo.setMonth(today.getMonth() - 3);  // تحديد الفترة الزمنية (آخر 3 أشهر)

    // جلب الموظفين الذين تم تعيينهم خلال آخر 3 أشهر
    const employees = await Employee.find({ createdAt: { $gte: threeMonthsAgo } })
      .populate('department')
      .populate('workplace')
      .sort({ createdAt: 1 }); // ترتيب الموظفين حسب تاريخ التوظيف من الأقدم للأحدث

    // إذا لم يكن هناك موظفين جدد في الفترة المحددة
    if (employees.length === 0) {
      return res.status(404).json({ success: false, message: 'لا يوجد موظفين جدد خلال الثلاثة أشهر الأخيرة.' });
    }

    // إنشاء ملف Excel
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet('New Employees');

    // تحديد الأعمدة
    ws.columns = [
      { header: 'اسم الموظف', key: 'name', width: 30 },
      { header: 'الرقم الوظيفي', key: 'empNo', width: 15 },
      { header: 'الوظيفة', key: 'jobTitle', width: 25 },
      { header: 'القسم', key: 'department', width: 20 },
      { header: 'الفرع', key: 'branch', width: 20 },
      { header: 'تاريخ التوظيف', key: 'hireDate', width: 20 },
    ];

    // إضافة البيانات لكل موظف
    employees.forEach(emp => {
      ws.addRow({
        name: emp.name,
        empNo: emp.employeeNumber || '—',
        jobTitle: emp.jobTitle || '—',
        department: emp.department?.name || '—',
        branch: emp.workplace?.name || '—',
        hireDate: emp.createdAt ? moment(emp.createdAt).format('YYYY-MM-DD') : '—',
      });
    });

    // إرسال الملف كـ Excel
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="NewEmployeesReport.xlsx"');
    await wb.xlsx.write(res);
    res.end();

  } catch (err) {
    console.error('Error generating new employees report:', err);
    res.status(500).json({ success: false, message: 'خطأ في إنشاء التقرير', error: err });
  }
};


async function getAddressFromCoordinates(lat, lng) {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=ar`;

    const { data } = await axios.get(url, {
      headers: {
       "User-Agent": "HR-Dashboard/1.0 (malaksalah@gmail.com)"

      }
    });

    if (data && data.display_name) {
      return data.display_name;
    } else {
      return "غير محدد";
    }
  } catch (error) {
    console.error("Geocoding error:", error.message);
    return "غير محدد";
  }
}

//  تقارير الفروع 
//1... view branch
exports.branchOverviewReport = async (req, res) => {
  try {
    const branches = await Branch.find();

    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet("Branch Overview");

    ws.columns = [
      { header: "اسم الفرع", key: "name", width: 25 },
      { header: "العنوان", key: "address", width: 40 },
      { header: "بداية الدوام", key: "start", width: 15 },
      { header: "نهاية الدوام", key: "end", width: 15 },
      { header: "مهلة السماح", key: "grace", width: 15 },
      { header: "دقائق التأخير المسموحة", key: "late", width: 20 },
      { header: "أيام الإجازة", key: "weekends", width: 20 },
      { header: "عدد الأقسام", key: "deptCount", width: 15 },
      { header: "عدد الموظفين", key: "empCount", width: 15 },
    ];

    for (const br of branches) {
      const lat = br.location.coordinates[1];
      const lng = br.location.coordinates[0];

      const address = await getAddressFromCoordinates(lat, lng);

      const employees = await Employee.find({ workplace: br._id })
        .populate("department", "name");

      const uniqueDepts = new Set(
        employees.map((e) => e.department?.name).filter(Boolean)
      );

      ws.addRow({
        name: br.name,
        address,
        start: br.workStart,
        end: br.workEnd,
        grace: br.gracePeriod,
        late: br.allowedLateMinutes,
        weekends: br.weekendDays.join(", "),
        deptCount: uniqueDepts.size,
        empCount: employees.length,
      });
    }

    await sendWorkbook(res, wb, "branch_overview.xlsx");
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error generating branch overview report" });
  }
};

//2) employee count in every branch
exports.employeesPerBranchReport = async (req, res) => {
  try {
    const branches = await Branch.find();

    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet("Employees per Branch");

    ws.columns = [
      { header: "اسم الفرع", key: "branch", width: 25 },
      { header: "عدد الموظفين", key: "count", width: 20 }
    ];

    for (const br of branches) {
      const employees = await Employee.find({ workplace: br._id });
      
      ws.addRow({
        branch: br.name,
        count: employees.length,
      });
    }

    await sendWorkbook(res, wb, "employees_per_branch.xlsx");
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error generating employee count report" });
  }
};

//3 new employees   New Employees Per Branch (آخر 90 يوما
exports.newEmployeesReport = async (req, res) => {
  try {
    const sinceDate = new Date();
    sinceDate.setDate(sinceDate.getDate() - 90); // آخر 3 شهور

    const branches = await Branch.find();

    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet("New Employees");

    ws.columns = [
      { header: "اسم الفرع", key: "branch", width: 25 },
      { header: "اسم الموظف", key: "name", width: 25 },
      { header: "تاريخ التعيين", key: "created", width: 20 }
    ];

    for (const br of branches) {
      const newEmployees = await Employee.find({
        workplace: br._id,
        createdAt: { $gte: sinceDate }
      });

      newEmployees.forEach((emp) => {
        ws.addRow({
          branch: br.name,
          name: emp.name,
          created: emp.contract.start.toISOString().split("T")[0]
        });
      });
    }

    await sendWorkbook(res, wb, "new_employees.xlsx");
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error generating new employees report" });
  }
};

//4) Departments Inside Each Branch
exports.departmentsPerBranchReport = async (req, res) => {
  try {
    const branches = await Branch.find();

    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet("Departments per Branch");

    ws.columns = [
      { header: "اسم الفرع", key: "branch", width: 25 },
      { header: "الأقسام داخل الفرع", key: "departments", width: 40 },
      { header: "عدد الأقسام", key: "deptCount", width: 20 }
    ];

    for (const br of branches) {
      const employees = await Employee.find({ workplace: br._id })
        .populate("department", "name");

      const uniqueDepts = [...new Set(
        employees.map((e) => e.department?.name).filter(Boolean)
      )];

      ws.addRow({
        branch: br.name,
        departments: uniqueDepts.join("، "),
        deptCount: uniqueDepts.length
      });
    }

    await sendWorkbook(res, wb, "departments_per_branch.xlsx");
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error generating department report" });
  }
};


// departments reports
//1)قائمة الأقسام + عدد الموظفين بكل قسم

exports.departmentsSummaryReport = async (req, res) => {
  try {
    const departments = await Department.find();

    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet("Departments Summary");

    ws.columns = [
      { header: "القسم", key: "name", width: 30 },
      { header: "الوصف", key: "description", width: 40 },
      { header: "عدد الموظفين", key: "totalEmployees", width: 20 },
    ];

    for (const dep of departments) {
      const count = await Employee.countDocuments({ department: dep._id });

      ws.addRow({
        name: dep.name,
        description: dep.description || "—",
        totalEmployees: count
      });
    }

    await sendWorkbook(res, wb, "departments_summary.xlsx");
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error generating department summary report" });
  }
};
//2) تفاصيل موظفي كل قسم
exports.departmentEmployeesDetailedReport = async (req, res) => {
  try {
    const employees = await Employee.find()
      .populate("department", "name")
      .populate("workplace", "name")
      .sort({ "department.name": 1, name: 1 });

    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet("Department Employees");

    ws.columns = [
      { header: "القسم", key: "department", width: 25 },
      { header: "اسم الموظف", key: "name", width: 30 },
      { header: "الرقم الوظيفي", key: "empNo", width: 15 },
      { header: "المسمى الوظيفي", key: "jobTitle", width: 20 },
      { header: "الفرع", key: "branch", width: 20 },
      { header: "تاريخ التعيين", key: "hiredAt", width: 20 }
    ];

    employees.forEach(emp => {
      ws.addRow({
        department: emp.department?.name || "—",
        name: emp.name,
        empNo: emp.employeeNumber || "—",
        jobTitle: emp.jobTitle || "—",
        branch: emp.workplace?.name || "—",
        hiredAt: emp.contract.start ? moment(emp.contract.start).format("YYYY-MM-DD") : "—",
      });
    });

    await sendWorkbook(res, wb, "department_employees_details.xlsx");
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error generating department employees report" });
  }
};

//3) الأقسام بدون موظفين
exports.departmentsWithoutEmployeesReport = async (req, res) => {
  try {
    const departments = await Department.find();

    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet("Empty Departments");

    ws.columns = [
      { header: "القسم", key: "name", width: 30 },
      { header: "الوصف", key: "description", width: 40 },
      { header: "الحالة", key: "status", width: 20 }
    ];

    for (const dep of departments) {
      const count = await Employee.countDocuments({ department: dep._id });

      if (count === 0) {
        ws.addRow({
          name: dep.name,
          description: dep.description || "—",
          status: "لا يوجد موظفين"
        });
      }
    }

    await sendWorkbook(res, wb, "departments_without_employees.xlsx");
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error generating empty departments report" });
  }
};

//4)متوسط الرواتب في كل قسم
exports.departmentSalaryAnalyticsReport = async (req, res) => {
  try {
    const departments = await Department.find();

    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet("Department Salary Analytics");

    ws.columns = [
      { header: "القسم", key: "name", width: 25 },
      { header: "عدد الموظفين", key: "count", width: 15 },
      { header: "أعلى راتب", key: "max", width: 15 },
      { header: "أقل راتب", key: "min", width: 15 },
      { header: "متوسط الرواتب", key: "avg", width: 20 }
    ];

    for (const dep of departments) {
      const employees = await Employee.find({ department: dep._id });

      if (!employees.length) continue;

      const salaries = employees.map(e => e.salary.total || 0);

      ws.addRow({
        name: dep.name,
        count: employees.length,
        max: Math.max(...salaries),
        min: Math.min(...salaries),
        avg: (salaries.reduce((a, b) => a + b, 0) / salaries.length).toFixed(2)
      });
    }

    await sendWorkbook(res, wb, "department_salary_analytics.xlsx");
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Error generating salary analytics report" });
  }
};

// residency:

//1) تقرير جميع السجلات
exports.recordsMasterReport = async (req, res) => {
  try {
    const records = await Record.find()
      .populate("branch", "name location");

    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet("All Records");

    ws.columns = [
      { header: "الفئة", key: "category", width: 20 },
      { header: "النوع", key: "type", width: 25 },
      { header: "رقم السجل", key: "number", width: 20 },
      { header: "الفرع", key: "branch", width: 25 },
      { header: "تاريخ الإصدار", key: "issueDate", width: 15 },
      { header: "تاريخ الانتهاء", key: "expiryDate", width: 15 },
      { header: "الحالة", key: "status", width: 15 },
      { header: "عدد المرفقات", key: "attachments", width: 15 }
    ];

    records.forEach(rec => {
      ws.addRow({
        category: rec.category,
        type: rec.type,
        number: rec.number || "—",
        branch: rec.branch?.name || "—",
        issueDate: rec.issueDate ? moment(rec.issueDate).format("YYYY-MM-DD") : "—",
        expiryDate: rec.expiryDate ? moment(rec.expiryDate).format("YYYY-MM-DD") : "—",
        status: rec.status,
        attachments: rec.attachments?.length || 0
      });
    });

    await sendWorkbook(res, wb, "records_master.xlsx");

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

//السجلات المنتهية2..) 
exports.expiredRecordsReport = async (req, res) => {
  try {
    const today = new Date();

    const records = await Record.find({
      expiryDate: { $lte: today }
    }).populate("branch", "name");

    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet("Expired Records");

    ws.columns = [
      { header: "الفئة", key: "category", width: 20 },
      { header: "النوع", key: "type", width: 25 },
      { header: "رقم السجل", key: "number", width: 20 },
      { header: "الفرع", key: "branch", width: 25 },
      { header: "تاريخ الانتهاء", key: "expiryDate", width: 15 },
      { header: "الحالة", key: "status", width: 15 }
    ];

    records.forEach(rec => {
      ws.addRow({
        category: rec.category,
        type: rec.type,
        number: rec.number || "—",
        branch: rec.branch?.name || "—",
        expiryDate: rec.expiryDate ? moment(rec.expiryDate).format("YYYY-MM-DD") : "—",
        status: "منتهي"
      });
    });

    await sendWorkbook(res, wb, "expired_records.xlsx");

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

//3) السجلات حسب الفروع
exports.recordsByBranchReport = async (req, res) => {
  try {
    const branches = await Branch.find();
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet("Records by Branch");

    ws.columns = [
      { header: "الفرع", key: "branch", width: 25 },
      { header: "عدد السجلات", key: "count", width: 15 },
      { header: "تفاصيل السجلات", key: "details", width: 50 }
    ];

    for (const branch of branches) {
      const branchRecords = await Record.find({ branch: branch._id });

      ws.addRow({
        branch: branch.name,
        count: branchRecords.length,
        details: branchRecords.map(r => `${r.type} (${r.number || "—"})`).join(" - ")
      });
    }

    await sendWorkbook(res, wb, "records_by_branch.xlsx");

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

//4)  السجلات اللي هتنتهي خلال 3 شهور
exports.recordsEndingIn3Months = async (req, res) => {
  try {
    const within = 90; // ثابت → ٣ شهور

    const today = new Date();
    const edge = new Date();
    edge.setDate(edge.getDate() + within);

    const records = await Record.find({
      expiryDate: { $gte: today, $lte: edge }
    }).populate("branch", "name");

    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet(`Expiring within 3 months`);

    ws.columns = [
      { header: "الفئة", key: "category", width: 20 },
      { header: "النوع", key: "type", width: 25 },
      { header: "رقم السجل", key: "number", width: 20 },
      { header: "الفرع", key: "branch", width: 25 },
      { header: "تاريخ الانتهاء", key: "expiryDate", width: 15 },
      { header: "الأيام المتبقية", key: "remaining", width: 15 }
    ];

    records.forEach(rec => {
      const remainingDays = Math.ceil((rec.expiryDate - today) / (1000 * 60 * 60 * 24));

      ws.addRow({
        category: rec.category,
        type: rec.type,
        number: rec.number || "—",
        branch: rec.branch?.name || "—",
        expiryDate: rec.expiryDate ? moment(rec.expiryDate).format("YYYY-MM-DD") : "—",
        remaining: remainingDays
      });
    });

    await sendWorkbook(res, wb, `records_expiring_in_3_months.xlsx`);

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};



