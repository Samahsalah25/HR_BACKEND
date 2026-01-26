// controllers/SalaryAdvanceController.js
const SalaryAdvance = require('../models/salaryAdvance');
const Employee = require('../models/employee');
const cloudinary = require('../../config/cloudinary'); 
const mongoose = require('mongoose');
const SalaryAdvanceInstallment = require('../models/SalaryAdvanceInstallment');
const Department =require('../models/depaertment')

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
// controllers/salaryAdvanceController.js

// exports.createSalaryAdvance = async (req, res) => {
//   try {
//     const { employeeId, amount, installmentsCount, startDate, notes } = req.body;
//     const isHR = req.user.role === 'HR';
//     let employee;

//     // تحويل الحقول لـ Number / Date
//     const parsedAmount = Number(amount);
//     const parsedInstallmentsCount = Number(installmentsCount);
//     const parsedStartDate = new Date(startDate);

//     // Validation بسيطة
//     if (!employeeId) return res.status(400).json({ message: 'Employee ID is required' });
//     if (isNaN(parsedAmount) || parsedAmount <= 0) return res.status(400).json({ message: 'Amount must be a positive number' });
//     if (isNaN(parsedInstallmentsCount) || parsedInstallmentsCount <= 0) return res.status(400).json({ message: 'Installments count must be a positive number' });
//     if (isNaN(parsedStartDate.getTime())) return res.status(400).json({ message: 'Start date is invalid' });

//     // تحديد الموظف
//     if (isHR && employeeId) {
//       employee = await Employee.findById(employeeId);
//       if (!employee) return res.status(404).json({ message: 'Employee not found' });
//     } else {
//       employee = await Employee.findOne({ user: req.user._id });
//       if (!employee) return res.status(404).json({ message: 'Employee not found for this user' });
//     }

//     // رفع الملفات لو موجودة
//     let attachments = [];
//     if (req.files && req.files.length > 0) {
//       for (const file of req.files) {
//         const uploaded = await cloudinary.uploader.upload(file.path, {
//           folder: 'salary_advances',
//         });
//         attachments.push({ filename: file.originalname, url: uploaded.secure_url });
//       }
//     }

//     // حساب قيمة القسط
//     const calculatedInstallmentAmount = parsedAmount / parsedInstallmentsCount;

//     // إنشاء السلفة
//     const salaryAdvance = await SalaryAdvance.create({
//       employee: employee._id,
//       amount: parsedAmount,
//       installmentsCount: parsedInstallmentsCount,
//       installmentAmount: calculatedInstallmentAmount,
//       startDate: parsedStartDate,
//       notes,
//       attachments,
//       remainingAmount: parsedAmount,
//       status: isHR && employeeId ? 'approved' : 'pending',
//       approvedBy: isHR && employeeId ? req.user._id : null,
//       approvedAt: isHR && employeeId ? new Date() : null,
//       createdBy: req.user._id,
//       type: 'سلفة من الراتب',
//     });

//     // لو معتمدة مباشرة → نولد الأقساط
//     if (salaryAdvance.status === 'approved') {
//       await createInstallments(salaryAdvance);
//     }

//     res.status(201).json({
//       message: 'Salary advance created successfully',
//       salaryAdvance,
//       success: true
//     });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: error.message });
//   }
// };


// exports.createSalaryAdvance = async (req, res) => {
//   try {
//     const { employeeId, amount, installmentsCount, startDate, notes } = req.body;
//     const isHR = req.user.role === 'HR';
//     let employee;

//     // تحويل الحقول لـ Number / Date
//     const parsedAmount = Number(amount);
//     const parsedInstallmentsCount = Number(installmentsCount);
//     const parsedStartDate = new Date(startDate);

//     // Validation بسيطة
//     if (isNaN(parsedAmount) || parsedAmount <= 0)
//       return res.status(400).json({ message: 'Amount must be a positive number' });
//     if (isNaN(parsedInstallmentsCount) || parsedInstallmentsCount <= 0)
//       return res.status(400).json({ message: 'Installments count must be a positive number' });
//     if (isNaN(parsedStartDate.getTime()))
//       return res.status(400).json({ message: 'Start date is invalid' });
// console.log('djfh')
//     // تحديد الموظف
//     if (isHR && employeeId) {
//       // لو HR وداخل ID محدد
//       employee = await Employee.findById(employeeId);
//       if (!employee) return res.status(404).json({ message: 'Employee not found' });
//     } else {
//       // لو موظف عادي أو HR بدون ID → ياخد نفسه
//       employee = await Employee.findOne({ user: req.user._id });
//       if (!employee) return res.status(404).json({ message: 'Employee not found for this user' });
//     }

//     // رفع الملفات لو موجودة (باستخدام buffer)
//     let attachments = [];
//     if (req.files && req.files.length > 0) {
//       for (const file of req.files) {
//         const uploaded = await new Promise((resolve, reject) => {
//           const stream = cloudinary.uploader.upload_stream(
//             { folder: 'salary_advances' },
//             (error, result) => {
//               if (error) reject(error);
//               else resolve(result);
//             }
//           );
//           stream.end(file.buffer);
//         });
//         attachments.push({ filename: file.originalname, url: uploaded.secure_url });
//       }
//     }

//     // حساب قيمة القسط
//     const calculatedInstallmentAmount = parsedAmount / parsedInstallmentsCount;

//     // تحديد حالة السلفة: HR مع ID → approved ، أي حد تاني → pending
//     const status = isHR && employeeId ? 'approved' : 'pending';

//     // إنشاء السلفة
//     const salaryAdvance = await SalaryAdvance.create({
//       employee: employee._id,
//       amount: parsedAmount,
//       installmentsCount: parsedInstallmentsCount,
//       installmentAmount: calculatedInstallmentAmount,
//       startDate: parsedStartDate,
//       notes,
//       attachments,
//       remainingAmount: parsedAmount,
//       status, // هنا استخدمنا status الجديد
//       approvedBy: isHR && employeeId ? req.user._id : null,
//       approvedAt: isHR && employeeId ? new Date() : null,
//       createdBy: req.user._id,
//       type: 'سلفة من الراتب',
//     });

//     // لو معتمدة مباشرة → نولد الأقساط
//     if (salaryAdvance.status === 'approved') {
//       await createInstallments(salaryAdvance);
//     }

//     res.status(201).json({
//       message: 'Salary advance created successfully',
//       salaryAdvance,
//       success: true,
//     });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({ message: error.message });
//   }
// };



// 
exports.createSalaryAdvance = async (req, res) => {
  try {
    const { employeeId, amount, installmentsCount, startDate, notes, requiresAdminApproval } = req.body;
    const isHR = req.user.role === 'HR';
    let employee;

    // تحويل القيم
    const parsedAmount = Number(amount);
    const parsedInstallmentsCount = Number(installmentsCount);
    const parsedStartDate = new Date(startDate);

    // Validation
    if (!employeeId)
      return res.status(400).json({ message: 'Employee ID is required' });

    if (isNaN(parsedAmount) || parsedAmount <= 0)
      return res.status(400).json({ message: 'Invalid amount' });

    if (isNaN(parsedInstallmentsCount) || parsedInstallmentsCount <= 0)
      return res.status(400).json({ message: 'Invalid installments count' });

    if (isNaN(parsedStartDate.getTime()))
      return res.status(400).json({ message: 'Invalid start date' });

    // تحديد الموظف
    if (isHR && employeeId) {
      employee = await Employee.findById(employeeId);
      if (!employee)
        return res.status(404).json({ message: 'Employee not found' });
    } else {
      employee = await Employee.findOne({ user: req.user._id });
      if (!employee)
        return res.status(404).json({ message: 'Employee not found for this user' });
    }

    // حساب القسط
    const calculatedInstallmentAmount =
      parsedAmount / parsedInstallmentsCount;

    /**
     *  تحديد الحالة
     * - موظف عادي → pending
     * - HR + موافقة إدارية → forwarded
     * - HR بدون موافقة إدارية → approved
     */
    let status = 'pending';

    if (isHR && employeeId) {
      status = requiresAdminApproval ? 'forwarded' : 'approved';
    }

    // إنشاء السلفة
    const salaryAdvance = await SalaryAdvance.create({
      employee: employee._id,
      amount: parsedAmount,
      installmentsCount: parsedInstallmentsCount,
      installmentAmount: calculatedInstallmentAmount,
      startDate: parsedStartDate,
      notes,
      remainingAmount: parsedAmount,
      status,
      createdBy: req.user._id,
      type: 'سلفة من الراتب',
    });

    // لو اتعتمدت مباشرة → توليد الأقساط
    if (salaryAdvance.status === 'approved') {
      await createInstallments(salaryAdvance);
    }

    res.status(201).json({
      success: true,
      message: 'Salary advance created successfully',
      salaryAdvance,
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: 'Error creating salary advance',
      error: error.message,
    });
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

// محول
// تحويل السلفة للادمن
exports.forwardSalaryAdvance = async (req, res) => {
  try {
    const { id } = req.params;
    const salaryAdvance = await SalaryAdvance.findById(id);
    if (!salaryAdvance) return res.status(404).json({ message: 'Not found' });
    if (req.user.role !== 'HR') return res.status(403).json({ message: 'Forbidden' });

    salaryAdvance.status = 'forwarded';
    salaryAdvance.forwardedBy = req.user._id;
    salaryAdvance.forwardedAt = new Date();
    await salaryAdvance.save();

    res.json({ message: 'Salary advance forwarded to admin', salaryAdvance });
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
      else if (advance.status === 'completed' && remainingAmount === 0) status = 'تم السداد';
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
//  السلف بتاعتي
exports.getMySalaryAdvances = async (req, res) => {
  try {
    const employee = await Employee.findOne({ user: req.user._id });
    if (!employee) return res.status(404).json({ message: 'Employee not found' });

    const advances = await SalaryAdvance.find({ employee: employee._id })
      .sort({ createdAt: -1 });

    const result = [];

    for (const advance of advances) {
      const installments = await SalaryAdvanceInstallment.find({ salaryAdvance: advance._id })
        .sort({ installmentNumber: 1 });

      const totalPaid = installments
        .filter(i => i.status === 'paid')
        .reduce((sum, i) => sum + i.amount, 0);

      const remainingAmount = advance.amount - totalPaid;

      // 🔥 توحيد الحالات مع getSalaryAdvances
      let status = 'معتمد';
      if (advance.status === 'rejected') status = 'مرفوض';
      else if (advance.status === 'completed' && remainingAmount === 0) status = 'تم السداد';
      else if (advance.status === 'approved' && totalPaid > 0) status = 'مدفوع للموظف';
      else if (advance.status === 'approved') status = 'معتمد';

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
          title: `قسط ${inst.installmentNumber}`,
          dueDate: formatDate(inst.dueDate),
          amount: inst.amount,
          status: inst.status === 'paid'
            ? 'مدفوع'
            : inst.status === 'postponed'
            ? 'مؤجل'
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

//  السلف بتاعت موظف معين
exports.getEmployeeSalaryAdvances = async (req, res) => {
  try {
    const { employeeId } = req.params; //

    //  جلب بيانات الموظف للتأكد إنه موجود
    const employee = await Employee.findById(employeeId);
    if (!employee) return res.status(404).json({ message: 'Employee not found' });

    //  جلب كل السلف الخاصة بالموظف
    const advances = await SalaryAdvance.find({ employee: employee._id })
      .sort({ createdAt: -1 });

    const result = [];

    for (const advance of advances) {
      // جلب الأقساط الخاصة بالسلفة
      const installments = await SalaryAdvanceInstallment.find({ salaryAdvance: advance._id })
        .sort({ installmentNumber: 1 });

      const totalPaid = installments
        .filter(i => i.status === 'paid')
        .reduce((sum, i) => sum + i.amount, 0);

      const remainingAmount = advance.amount - totalPaid;

      // توحيد حالات السلفة
      let status = 'معتمد';
      if (advance.status === 'rejected') status = 'مرفوض';
      else if (advance.status === 'completed' && remainingAmount === 0) status = 'تم السداد';
      else if (advance.status === 'approved' && totalPaid > 0) status = 'مدفوع للموظف';
      else if (advance.status === 'approved') status = 'معتمد';

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
          title: `قسط ${inst.installmentNumber}`,
          dueDate: formatDate(inst.dueDate),
          amount: inst.amount,
          status: inst.status === 'paid'
            ? 'مدفوع'
            : inst.status === 'postponed'
            ? 'مؤجل'
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




//  الدفع
// POST /salary-advance/installment/:id/pay
exports.payInstallment = async (req, res) => {
  try {
    const { id } = req.params;

    const installment = await SalaryAdvanceInstallment.findById(id);
    if (!installment) return res.status(404).json({ message: 'Installment not found' });

    if (installment.status === 'paid') return res.status(400).json({ message: 'Installment already paid' });

    installment.status = 'paid';
    installment.paidAt = new Date();
    await installment.save();

    // تحديث السلفة
    const salaryAdvance = await SalaryAdvance.findById(installment.salaryAdvance);
    const totalPaid = await SalaryAdvanceInstallment.aggregate([
      { $match: { salaryAdvance: salaryAdvance._id, status: 'paid' } },
      { $group: { _id: null, sum: { $sum: '$amount' } } }
    ]);
    
    salaryAdvance.totalPaid = totalPaid[0]?.sum || 0;
    salaryAdvance.remainingAmount = salaryAdvance.amount - salaryAdvance.totalPaid;

    // لو كله اتدفع
    if (salaryAdvance.remainingAmount <= 0) salaryAdvance.status = 'completed';

    await salaryAdvance.save();

    res.json({ message: 'Installment paid successfully', installment, salaryAdvance ,success:true });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};


// التاجيل
// POST /salary-advance/installment/:id/postpone
exports.postponeInstallment = async (req, res) => {
  try {
    const { id } = req.params;
    const { newDueDate } = req.body;

    const installment = await SalaryAdvanceInstallment.findById(id);
    if (!installment)
      return res.status(404).json({ message: 'Installment not found' });

    const newDate = new Date(newDueDate);

    //  check لو الشهر فيه قسط بالفعل
    const startOfMonth = new Date(newDate.getFullYear(), newDate.getMonth(), 1);
    const endOfMonth = new Date(newDate.getFullYear(), newDate.getMonth() + 1, 0, 23, 59, 59);

    const existingInstallment = await SalaryAdvanceInstallment.findOne({
      salaryAdvance: installment.salaryAdvance,
      dueDate: { $gte: startOfMonth, $lte: endOfMonth },
      status: { $ne: 'postponed' }
    });

    if (existingInstallment) {
      return res.status(400).json({
        success: false,
        message: 'يوجد بالفعل قسط في هذا الشهر، برجاء اختيار شهر آخر'
      });
    }

    //  تأجيل القسط الحالي
    installment.status = 'postponed';
    installment.postponedTo = newDate;
    await installment.save();

    //  إنشاء قسط جديد
    const newInstallment = await SalaryAdvanceInstallment.create({
      salaryAdvance: installment.salaryAdvance,
      employee: installment.employee,
      installmentNumber: installment.installmentNumber,
      amount: installment.amount,
      dueDate: newDate,
      status: 'unpaid',
    });

    res.json({
      success: true,
      message: 'Installment postponed successfully',
      oldInstallment: installment,
      newInstallment
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: error.message });
  }
};

//  هنا بيانات الاقساط بتاعت شهر معين ؟؟
// GET /salary-advance/installments/monthly?month=1&year=2026



exports.getMonthlyInstallments = async (req, res) => {
  try {
    const { month, year } = req.query;

    if (!month || !year) {
      return res.status(400).json({
        message: 'month and year are required'
      });
    }

    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);

    const installments = await SalaryAdvanceInstallment.find({
      dueDate: { $gte: startDate, $lte: endDate }
    })
      .populate({
        path: 'employee',
        select: 'name employeeNumber'
      })
      .populate({
        path: 'salaryAdvance',
        select: 'amount installmentsCount status'
      });

    const result = [];

    for (const inst of installments) {
      const allInstallments = await SalaryAdvanceInstallment.find({
        salaryAdvance: inst.salaryAdvance._id
      });

      const totalPaid = allInstallments
        .filter(i => i.status === 'paid')
        .reduce((sum, i) => sum + i.amount, 0);

      const remainingAmount = inst.salaryAdvance.amount - totalPaid;

      const remainingInstallmentsCount = allInstallments.filter(
        i => i.status !== 'paid'
      ).length;

      // ✅ تحويل الحالة للعربي من DB
      let status = 'غير مدفوع';
      if (inst.status === 'paid') status = 'مدفوع';
      else if (inst.status === 'postponed') status = 'مؤجل';

      result.push({
        employeeName: inst.employee.name,
        employeeNumber: inst.employee.employeeNumber,

        salaryAdvanceId: inst.salaryAdvance._id,
        installmentId: inst._id,

        totalAdvanceAmount: inst.salaryAdvance.amount,
        totalInstallmentsCount: inst.salaryAdvance.installmentsCount, // ✅ العدد الكلي
        installmentAmount: inst.amount,

        totalPaid,
        remainingAmount,
        remainingInstallmentsCount,

        status, // ✅ الحالة من DB
        dueDate: inst.dueDate
      });
    }

    res.json({
      month,
      year,
      total: result.length,
      installments: result
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: 'خطأ في جلب أقساط الشهر'
    });
  }
};



// تعديل السلفة
// controllers/SalaryAdvanceController.js

/**
 * تحديث سلفة
 */
// controllers/SalaryAdvanceController.js
// controllers/SalaryAdvanceController.js
exports.updateSalaryAdvance = [
  async (req, res) => {
    try {
      const { id } = req.params;
      const { amount, installmentsCount, startDate, notes } = req.body;

      // 1️⃣ جلب السلفة
      const salaryAdvance = await SalaryAdvance.findById(id);
      if (!salaryAdvance) {
        return res.status(404).json({ message: 'السلفة غير موجودة' });
      }

      // 2️⃣ السماح بالتعديل فقط لو Pending
      if (salaryAdvance.status !== 'pending') {
        return res.status(400).json({
          message: 'يمكن تعديل السلفة فقط إذا كانت قيد المراجعة',
        });
      }

      // 3️⃣ تحديث البيانات الأساسية
      if (amount !== undefined) {
        salaryAdvance.amount = Number(amount);
      }

      if (installmentsCount !== undefined) {
        salaryAdvance.installmentsCount = Number(installmentsCount);
      }

      if (startDate) {
        salaryAdvance.startDate = new Date(startDate);
      }

      if (notes !== undefined) {
        salaryAdvance.notes = notes;
      }

      // 4️⃣ رفع المرفقات (لو موجودة)
      if (req.files && req.files.length > 0) {
        const attachments = [];

        for (const file of req.files) {
          const uploaded = await new Promise((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream(
              { folder: 'salary_advances' },
              (error, result) => {
                if (error) reject(error);
                else resolve(result);
              }
            );
            stream.end(file.buffer);
          });

          attachments.push({
            filename: file.originalname,
            url: uploaded.secure_url,
          });
        }

        salaryAdvance.attachments = [
          ...salaryAdvance.attachments,
          ...attachments,
        ];
      }

      // 5️⃣ إعادة توليد الأقساط (لو حصل تعديل مؤثر)
      if (amount || installmentsCount || startDate) {
        // الأقساط المدفوعة
        const paidInstallments = await SalaryAdvanceInstallment.find({
          salaryAdvance: id,
          status: 'paid',
        }).sort({ installmentNumber: 1 });

        // حذف غير المدفوع فقط
        await SalaryAdvanceInstallment.deleteMany({
          salaryAdvance: id,
          status: { $ne: 'paid' },
        });

        const unpaidCount =
          salaryAdvance.installmentsCount - paidInstallments.length;

        if (unpaidCount > 0) {
          const totalPaid = paidInstallments.reduce(
            (sum, i) => sum + i.amount,
            0
          );

          const installmentAmount =
            (salaryAdvance.amount - totalPaid) / unpaidCount;

          const start = new Date(salaryAdvance.startDate);

          for (let i = 0; i < unpaidCount; i++) {
            const dueDate = new Date(
              start.getFullYear(),
              start.getMonth() + i,
              start.getDate()
            );

            await SalaryAdvanceInstallment.create({
              salaryAdvance: id,
              employee: salaryAdvance.employee,
              installmentNumber: paidInstallments.length + i + 1,
              amount: installmentAmount,
              dueDate,
              status: 'unpaid',
            });
          }
        }
      }

      // 6️⃣ حفظ
      await salaryAdvance.save();

      // 7️⃣ رجوع Populate علشان الفرونت
      const populatedSalaryAdvance = await SalaryAdvance.findById(id).populate({
        path: 'employee',
        select: 'name jobTitle department',
        populate: {
          path: 'department',
          select: 'name',
        },
      });

      res.json({
        message: 'تم تعديل السلفة بنجاح',
        salaryAdvance: populatedSalaryAdvance,
      });
    } catch (error) {
      console.error(error);
      res.status(500).json({
        message: 'خطأ أثناء تعديل السلفة',
        error: error.message,
      });
    }
  },
];


