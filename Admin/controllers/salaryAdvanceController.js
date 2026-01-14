// controllers/SalaryAdvanceController.js
const SalaryAdvance = require('../models/salaryAdvance');
const Employee = require('../models/employee');
const cloudinary = require('../../config/cloudinary'); 
const mongoose = require('mongoose');
const SalaryAdvanceInstallment = require('../models/SalaryAdvanceInstallment');

/**
 * توليد الأقساط عند اعتماد السلفة
 */
const createInstallments = async (salaryAdvance) => {
  
  const installments = [];
  const installmentAmount = salaryAdvance.installmentAmount;
  const startDate = new Date(salaryAdvance.startDate);

  for (let i = 0; i < salaryAdvance.installmentsCount; i++) {
    const dueDate = new Date(startDate);
    dueDate.setMonth(dueDate.getMonth() + i); // كل شهر
    installments.push({
      salaryAdvance: salaryAdvance._id,
      employee: salaryAdvance.employee,
      installmentNumber: i + 1,
      amount: installmentAmount,
      dueDate,
    });
  }

  // نحفظ الأقساط في جدول الأقساط
  await SalaryAdvanceInstallment.insertMany(installments);
};

/**
 * إنشاء طلب سلفة
 */
exports.createSalaryAdvance = async (req, res) => {
  try {
    const { employeeId, amount, installmentsCount, startDate, notes } = req.body;
    const isHR = req.user.role === 'HR';
    let employee;

    if (isHR && employeeId) {
      // HR بيعمل سلفة لموظف تاني → معتمدة مباشرة
      employee = await Employee.findById(employeeId);
      if (!employee) return res.status(404).json({ message: 'Employee not found' });
    } else {
      // الموظف أو HR لنفسه → pending
      employee = await Employee.findOne({ user: req.user._id });
      if (!employee) return res.status(404).json({ message: 'Employee not found for this user' });
    }

    // رفع الملفات لو موجودة
    let attachments = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const uploaded = await cloudinary.uploader.upload(file.path, {
          folder: 'salary_advances',
        });
        attachments.push({ name: file.originalname, url: uploaded.secure_url });
      }
    }

    // حساب القسط تلقائي
    const calculatedInstallmentAmount = amount / installmentsCount;

    // تحديد الحالة: إذا HR بيعمل سلفة لموظف تاني → معتمدة مباشرة، لو لنفسه → pending
    const salaryAdvance = await SalaryAdvance.create({
      employee: employee._id,
      amount,
      installmentsCount,
      installmentAmount: calculatedInstallmentAmount,
      startDate,
      notes,
      attachments,
      remainingAmount: amount,
      status: isHR && employeeId ? 'approved' : 'pending',  // التعديل هنا
      approvedBy: isHR && employeeId ? req.user._id : null, // التعديل هنا
      approvedAt: isHR && employeeId ? new Date() : null,   // التعديل هنا
      createdBy: req.user._id,
      type: 'سلفة من الراتب',
    });

    // لو معتمدة مباشرة → نولد الأقساط
    if (salaryAdvance.status === 'approved') await createInstallments(salaryAdvance);

    res.status(201).json({
      message: 'Salary advance created successfully',
      salaryAdvance,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};


/**
 * اعتماد السلفة
 */
exports.approveSalaryAdvance = async (req, res) => {
  try {
    const { id } = req.params;
    const salaryAdvance = await SalaryAdvance.findById(id);
    if (!salaryAdvance) return res.status(404).json({ message: 'Salary advance not found' });
    if (salaryAdvance.status !== 'pending') return res.status(400).json({ message: 'This request is not pending' });

    salaryAdvance.status = 'approved';
    salaryAdvance.approvedBy = req.user._id;
    salaryAdvance.approvedAt = new Date();
    await salaryAdvance.save();

    // توليد الأقساط بعد الاعتماد
    await createInstallments(salaryAdvance);

    res.json({ message: 'Salary advance approved', salaryAdvance });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * رفض السلفة
 */
exports.rejectSalaryAdvance = async (req, res) => {
  try {
    const { id } = req.params;
    const salaryAdvance = await SalaryAdvance.findById(id);
    if (!salaryAdvance) return res.status(404).json({ message: 'Salary advance not found' });
    if (salaryAdvance.status !== 'pending') return res.status(400).json({ message: 'This request is not pending' });

    salaryAdvance.status = 'rejected';
    salaryAdvance.rejectedBy = req.user._id;
    salaryAdvance.rejectedAt = new Date();
    await salaryAdvance.save();

    res.json({ message: 'Salary advance rejected', salaryAdvance });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

/**
 * جلب كل السلفات
 */
const formatDate = (date) => {
  const d = new Date(date);
  const month = String(d.getMonth() + 1).padStart(2, '0'); // +1 لأن الشهور 0-11
  const day = String(d.getDate()).padStart(2, '0');
  const year = d.getFullYear();
  return `${year}-${month}-${day}`;
};

function getArabicStatus(dbStatus, totalPaid, remainingAmount) {
  if (dbStatus === 'rejected') return 'مرفوض';
  if (dbStatus === 'pending') return 'قيد المراجعة';

  // approved
  if (remainingAmount === 0) return 'تم السداد';

  if (totalPaid > 0 && remainingAmount > 0)
    return 'مدفوع للموظف';

  return 'معتمد';
}


// exports.getSalaryAdvances = async (req, res) => {
//   try {
//     const isHR = req.user.role === 'HR';

//     //  استبعاد قيد المراجعة
//     let query = {
//       status: { $ne: 'pending' }
//     };

//     // لو مش HR → يجيب سلف الموظف نفسه بس
//     if (!isHR) {
//       const employee = await Employee.findOne({ user: req.user._id });
//       if (!employee)
//         return res.status(404).json({ message: 'Employee not found' });

//       query.employee = employee._id;
//     }

//     //  فلترة بالشهر والسنة
//     const month = parseInt(req.query.month);
//     const year = parseInt(req.query.year);

//     if (!isNaN(month) && !isNaN(year)) {
//       const start = new Date(year, month - 1, 1);
//       const end = new Date(year, month, 0, 23, 59, 59, 999);
//       query.createdAt = { $gte: start, $lte: end };
//     }

//     //  جلب السلفات + بيانات الموظف كاملة
//   const advances = await SalaryAdvance.find(query)
//   .populate({
//     path: 'employee',
//     select: 'name employeeNumber jobTitle department',
//     populate: {
//       path: 'department',       
//       select: 'name'             
//     }
//   })
//   .sort({ createdAt: -1 });

//     const result = [];

//     for (const advance of advances) {
//       const installments = await SalaryAdvanceInstallment.find({
//         salaryAdvance: advance._id
//       }).sort({ installmentNumber: 1 });

//       const totalPaid = installments
//         .filter(i => i.status === 'paid')
//         .reduce((sum, i) => sum + i.amount, 0);

//       const remainingAmount = advance.amount - totalPaid;

//       //  تحديد الحالة النهائية بالعربي
//       let status = 'معتمد';

//       if (advance.status === 'rejected') status = 'مرفوض';
//       else if (advance.status === 'approved' && remainingAmount === 0)
//         status = 'تم السداد';
//       else if (advance.status === 'approved' && totalPaid > 0)
//         status = 'مدفوع للموظف';
//       else if (advance.status === 'approved')
//         status = 'معتمد';

//       result.push({
//         id: advance._id,
//         title: advance.type,
//         employeName: advance.employee.name,
//         employeeNumb: advance.employee.employeeNumber,
//         jobTitle: advance.employee.jobTitle,
//         department: advance.employee.department,
//         mount: advance.amount,
//         numb: advance.installmentsCount,
//         totalPaid,
//         remain: remainingAmount,
//         CreateDate: formatDate(advance.createdAt),
//         status,
//         notes: advance.notes || '',
//         details: installments.map(inst => ({
//           id: inst._id,
//           title: `قسط ${inst.installmentNumber}`,
//           data: formatDate(inst.dueDate),
//           mount: inst.amount,
//           status:
//             inst.status === 'paid'
//               ? 'مدفوع'
//               : inst.status === 'postponed'
//               ? 'مؤجل'
//               : 'غير مدفوع'
//         }))
//       });
//     }

//     res.json({ advances: result });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: error.message });
//   }
// };



// my salaryAdvanced
exports.getSalaryAdvances = async (req, res) => {
  try {
    const isHR = req.user.role === 'HR';

    // استبعاد السلفات قيد المراجعة
    let query = { status: { $ne: 'pending' } };

    // لو مش HR → يجيب سلف الموظف نفسه
    if (!isHR) {
      const employee = await Employee.findOne({ user: req.user._id });
      if (!employee) return res.status(404).json({ message: 'Employee not found' });
      query.employee = employee._id;
    }

    // فلترة بالشهر والسنة
    const month = parseInt(req.query.month);
    const year = parseInt(req.query.year);

    if (!isNaN(month) && !isNaN(year)) {
      const start = new Date(year, month - 1, 1);
      const end = new Date(year, month, 0, 23, 59, 59, 999);
      query.createdAt = { $gte: start, $lte: end };
    }

    // جلب السلفات + بيانات الموظف
    let advances = await SalaryAdvance.find(query)
      .populate({
        path: 'employee',
        select: 'name employeeNumber jobTitle department'
      })
      .sort({ createdAt: -1 });

    // جلب أسماء الأقسام منفصل لتجنب مشاكل strictPopulate
    const departmentIds = advances
      .map(a => a.employee.department)
      .filter(Boolean);

    const departments = await Department.find({ _id: { $in: departmentIds } }).select('name');
    const deptMap = {};
    departments.forEach(d => (deptMap[d._id] = d.name));

    const result = [];

    for (const advance of advances) {
      const installments = await SalaryAdvanceInstallment.find({ salaryAdvance: advance._id })
        .sort({ installmentNumber: 1 });

      const totalPaid = installments
        .filter(i => i.status === 'paid')
        .reduce((sum, i) => sum + i.amount, 0);

      const remainingAmount = advance.amount - totalPaid;

      // تحديد الحالة النهائية بالعربي
      let status = 'معتمد';
      if (advance.status === 'rejected') status = 'مرفوض';
      else if (advance.status === 'approved' && remainingAmount === 0) status = 'تم السداد';
      else if (advance.status === 'approved' && totalPaid > 0) status = 'مدفوع للموظف';
      else if (advance.status === 'approved') status = 'معتمد';

      result.push({
        id: advance._id,
        title: advance.type,
        employeName: advance.employee.name,
        employeeNumb: advance.employee.employeeNumber,
        jobTitle: advance.employee.jobTitle,
        department: deptMap[advance.employee.department] || '', // اسم القسم بدل ID
        mount: advance.amount,
        numb: advance.installmentsCount,
        totalPaid,
        remain: remainingAmount,
        CreateDate: formatDate(advance.createdAt),
        status,
        notes: advance.notes || '',
        details: installments.map(inst => ({
          id: inst._id,
          title: `قسط ${inst.installmentNumber}`,
          data: formatDate(inst.dueDate),
          mount: inst.amount,
          status: inst.status === 'paid' ? 'مدفوع'
                  : inst.status === 'postponed' ? 'مؤجل'
                  : 'غير مدفوع'
        }))
      });
    }

    res.json({ advances: result });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

exports.getMySalaryAdvances = async (req, res) => {
  try {
    // نجيب الموظف المرتبط بالمستخدم الحالي
    const employee = await Employee.findOne({ user: req.user._id });
    if (!employee) return res.status(404).json({ message: 'Employee not found' });

    // نجيب كل السلفات الخاصة بالموظف
    const advances = await SalaryAdvance.find({ employee: employee._id })
      .sort({ createdAt: -1 });

    const result = [];

    for (const advance of advances) {
      const installments = await SalaryAdvanceInstallment.find({ salaryAdvance: advance._id })
        .sort({ installmentNumber: 1 });

      const totalPaid = installments
        .filter(inst => inst.status === 'paid')
        .reduce((sum, inst) => sum + inst.amount, 0);

      const remainingAmount = advance.amount - totalPaid;

      let status = advance.status;
      if (status === 'approved' && remainingAmount === 0) status = 'تم السداد';
      if (status === 'approved' && remainingAmount > 0) status = 'معتمد';
      if (status === 'rejected') status = 'مرفوض';

      result.push({
        _id: advance._id,
        type: advance.type,
        amount: advance.amount,
        installmentsCount: advance.installmentsCount,
        totalPaid,
        remainingAmount,
        createdAt: formatDate(advance.createdAt),
        status,
        installments: installments.map(inst => ({
          installmentNumber: inst.installmentNumber,
          title: `قسط شهر ${inst.installmentNumber}`,
          dueDate: formatDate(inst.dueDate),
          amount: inst.amount,
          status: inst.status === 'paid' ? 'مدفوع' : 'غير مدفوع'
        }))
      });
    }

    res.json({ advances: result });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

