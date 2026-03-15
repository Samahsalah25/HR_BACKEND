const EndService = require("../models/EndService");
const Employee = require("../models/employee");
const LeaveBalance = require("../models/leaveBalanceModel");
const SalaryAdvance = require("../models/salaryAdvance");
const Request = require("../models/requestModel");


// =====================================================
// 1) إنشاء طلب إنهاء خدمة (Draft)
// =====================================================
exports.createEndService = async (req, res) => {
  try {
    const {
      employeeId,
      reason,
      noticeDate,
      lastWorkingDay
       
    } = req.body;

    const employee = await Employee.findById(employeeId);

    if (!employee)
      return res.status(404).json({ message: "الموظف غير موجود" });

    const endService = await EndService.create({
      employee: employeeId,
      reason,
      noticeDate,
      lastWorkingDay,
      createdBy: req.user?._id
    });

    res.status(201).json(endService);

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


// =====================================================
// 2) جلب بيانات Step 3 — العهد الحالية
// =====================================================
exports.getEmployeeCustody = async (req, res) => {
  try {
    const { employeeId } = req.params;

    const custody = await Request.find({
      employee: employeeId,
      type: "عهدة",
      "custody.status": "مسلمة"
    }).populate("custody.custodyId");

    res.json(custody);

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


// =====================================================
// 3) جلب الطلبات المعلقة (Step 4)
// =====================================================
exports.getPendingRequests = async (req, res) => {
  try {
    const { employeeId } = req.params;

    const requests = await Request.find({
      employee: employeeId,
      status: "قيد المراجعة"
    });

    res.json(requests);

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


// =====================================================
//  4) رصيد الإجازات (Step 5)
// =====================================================
exports.getLeaveBalance = async (req, res) => {
  try {
    const { employeeId } = req.params;

    const leave = await LeaveBalance.findOne({ employee: employeeId });

    if (!leave)
      return res.json({ remaining: 0 });

    res.json(leave);

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


// =====================================================
//  5) حساب المخالصة (Step 6)
// =====================================================
exports.calculateSettlement = async (req, res) => {
  try {
    const { id } = req.params;

    const endService = await EndService.findById(id)
      .populate("employee");

    if (!endService)
      return res.status(404).json({ message: "غير موجود" });

    const employee = endService.employee;

    // 🧮 حساب مدة الخدمة
    const start = employee.contract.start;
    const end = endService.lastWorkingDay;

    const diff = new Date(end) - new Date(start);

    const years = Math.floor(diff / (1000 * 60 * 60 * 24 * 365));
    const months = Math.floor((diff / (1000 * 60 * 60 * 24 * 30)) % 12);
    const days = Math.floor((diff / (1000 * 60 * 60 * 24)) % 30);

    endService.serviceDuration = { years, months, days };

    // 🧮 مكافأة نهاية الخدمة (مثال مبسط)
    const salary = employee.salary.total;

    let reward = 0;

    if (years <= 5) {
      reward = years * (salary / 2);
    } else {
      reward =
        (5 * (salary / 2)) +
        ((years - 5) * salary);
    }

    endService.endOfServiceReward = reward;


    // 🧮 رصيد الإجازات
 // 🧮 رصيد الإجازات
const leave = await LeaveBalance.findOne({
  employee: employee._id,
  year: new Date(end).getFullYear()  // السنة اللي الموظف هينهي الخدمة فيها
});

if (leave) {
  const dailySalary = salary / 30;

  // حساب الرصيد المتبقي من الإجازة السنوية فقط
  const annualRemaining =  leave.annual;

  endService.vacationCompensation = {
    days: annualRemaining,
    dailyValue: dailySalary,
    total: annualRemaining * dailySalary
  };
}

    await endService.save();

    res.json(endService);

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


// =====================================================
//  6) إضافة خصم
// =====================================================
exports.addDeduction = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, amount } = req.body;

    const endService = await EndService.findById(id);

    endService.deductions.push({ title, amount });

    await endService.save();

    res.json(endService);

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


// =====================================================
//  7) إضافة مبلغ إضافي
// =====================================================
exports.addAddition = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, amount } = req.body;

    const endService = await EndService.findById(id);

    endService.additions.push({ title, amount });

    await endService.save();

    res.json(endService);

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


// =====================================================
// 🟢 8) الإنهاء النهائي (Step 7)
// =====================================================
exports.completeEndService = async (req, res) => {
  try {
    const { id } = req.params;

    const endService = await EndService.findById(id)
      .populate("employee");

    if (!endService)
      return res.status(404).json({ message: "غير موجود" });

    // مجموع الإضافات
    const totalAdditions = endService.additions.reduce(
      (sum, a) => sum + a.amount,
      0
    );

    // مجموع الخصومات
    const totalDeductions = endService.deductions.reduce(
      (sum, d) => sum + d.amount,
      0
    );

    endService.totalSettlement =
      endService.endOfServiceReward +
      (endService.vacationCompensation?.total || 0) +
      totalAdditions -
      totalDeductions;

    endService.status = "completed";

    await endService.save();

    //  تغيير حالة الموظف
    await Employee.findByIdAndUpdate(
      endService.employee._id,
      { status: "terminated" }
    );

    res.json(endService);

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


// =====================================================
//  9) جلب كل عمليات إنهاء الخدمة
// =====================================================
exports.getAllEndServices = async (req, res) => {
  try {

    const data = await EndService.find()
      .populate("employee").populate("createdBy", "name")
      .sort({ createdAt: -1 });

    res.json(data);

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};


// =====================================================
// 10) تفاصيل عملية واحدة
// =====================================================
exports.getEndServiceDetails = async (req, res) => {
  try {

    const data = await EndService.findById(req.params.id)
      .populate("employee");

    if (!data)
      return res.status(404).json({ message: "غير موجود" });

    res.json(data);

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};