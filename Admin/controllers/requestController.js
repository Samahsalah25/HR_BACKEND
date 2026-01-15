const Request = require('../models/requestModel');
const Employee = require('../models/employee');
const multer = require('multer');
const path = require('path');
const LeaveBalance=require('../models/leaveBalanceModel')
const Notification = require('../models/notification');
const SalaryAdvance = require('../models/salaryAdvance');

// هل المستخدم HR/Admin؟
const isHRorAdmin = (user) => ['HR', 'ADMIN'].includes(user.role);

// إعداد مكان التخزين للملفات
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/requests'); // فولدر محلي
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + '-' + file.originalname;
    cb(null, uniqueName);
  }
});
const upload = multer({ storage });

// =============== Create (الموظف ينشئ طلب) ===============

exports.createRequest = [
  upload.array('attachments'),
  async (req, res) => {
    try {
      const { 
        type, 
        leave, 
        complaint, 
        appeal, 
        allowance, 
        insurance, 
        custody, 
        custodyClearance, 
        expense,
        invoice
      } = req.body;

      if (!type) return res.status(400).json({ message: 'نوع الطلب مطلوب' });

      const employeeDoc = await Employee.findOne({ user: req.user._id });
      if (!employeeDoc) return res.status(404).json({ message: 'لم يتم العثور على بيانات الموظف' });

      let attachments = [];
      if (req.files && req.files.length > 0) {
        attachments = req.files.map(file => ({
          filename: file.originalname,
          url: `/uploads/requests/${file.filename}`
        }));
      }

      // Parse البيانات لو جايه كـ JSON string
      const leaveData = leave && typeof leave === 'string' ? JSON.parse(leave) : leave;
      const complaintData = complaint && typeof complaint === 'string' ? JSON.parse(complaint) : complaint;
      const appealData = appeal && typeof appeal === 'string' ? JSON.parse(appeal) : appeal;
      const allowanceData = allowance && typeof allowance === 'string' ? JSON.parse(allowance) : allowance;
      const insuranceData = insurance && typeof insurance === 'string' ? JSON.parse(insurance) : insurance;
      const custodyData = custody && typeof custody === 'string' ? JSON.parse(custody) : custody;
      const custodyClearanceData = custodyClearance && typeof custodyClearance === 'string' ? JSON.parse(custodyClearance) : custodyClearance;
      const expenseData = expense && typeof expense === 'string' ? JSON.parse(expense) : expense;
      const invoiceData = invoice && typeof invoice === 'string' ? JSON.parse(invoice) : invoice;

  
      let requestData = {
        employee: employeeDoc._id,
        type,
        attachments
      };

      // إدخال التفاصيل حسب النوع
      switch (type) {
        case 'إجازة':
          requestData.leave = leaveData;
          break;
        case 'شكوى':
          requestData.complaint = complaintData;
          break;
        case 'اعتراض':
          requestData.appeal = appealData;
          break;
        case 'بدل':
          requestData.allowance = allowanceData;
          break;
        case 'مطالبة تأمينية':
          requestData.insurance = insuranceData;
          break;
        case 'عهدة':
          requestData.custody = custodyData;
          break;
        case 'تصفية عهدة':
          requestData.custodyClearance = custodyClearanceData;
          break;
        case 'مصروف/فاتورة':
          requestData.expense = expenseData;
          break;
        default:
          return res.status(400).json({ message: 'نوع الطلب غير مدعوم' });
      }

      // إنشاء الطلب
      const request = await Request.create(requestData);

      res.status(201).json({ message: 'تم إنشاء الطلب بنجاح', request });
    } catch (e) {
      console.error(e);
      res.status(500).json({ message: 'خطأ أثناء إنشاء الطلب', error: e.message });
    }
  }
];


// =============== Get list (HR/Admin يشوف الكل – الموظف يشوف طلباته) ===============
exports.getRequests = async (req, res) => {
  try {
    const { status = 'الكل', type } = req.query;

    const query = {};
    if (status !== 'الكل') query.status = status;
    if (type) query.type = type;

    let items = await Request.find(query)
      .sort({ createdAt: -1 })
      .populate({
        path: 'employee',
        select: 'name department jobTitle contract.start contract.end',
        populate: { path: 'department', select: 'name' }
      });


    items = items.filter(r => r.employee);

    // 
    const table = items.map(r => ({
      id: r._id,
      employeeName: r.employee?.name || '-',
      department: r.employee?.department?.name || null,
      type: r.type,
      submittedAt: r.createdAt,
      status: r.status,
      decisionDate: r.decidedAt || null
    }));

    res.json({
      total: table.length,
      items: table
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'خطأ أثناء جلب الطلبات' });
  }
};


// =============== Get requests for my branch (HR only) ===============
exports.getBranchRequests = async (req, res) => {
  try {
    const { status = 'الكل', type, page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    // جيب فرع المستخدم الحالي
    const hrEmployee = await Employee.findOne({ user: req.user._id }).select('workplace');
    if (!hrEmployee) return res.status(404).json({ message: 'لا توجد بيانات الموظف' });
    const branchId = hrEmployee.workplace;

    // بناء الاستعلام
    const query = {};
    if (status !== 'الكل') query.status = status;
    if (type) query.type = type;

    // فلتر على الموظفين في نفس الفرع
    query['employee'] = await Employee.find({ workplace: branchId }).select('_id');

    const [items, total] = await Promise.all([
      Request.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit))
        .populate({
          path: 'employee',
          select: 'name department jobTitle contract.start contract.end',
          populate: { path: 'department', select: 'name' }
        }),
      Request.countDocuments(query)
    ]);


    const table = items.map(r => ({
      id: r._id,
      employeeName: r.employee?.name || '-',
      department: r.employee?.department?.name || null,
      type: r.type,
      submittedAt: r.createdAt,
      status: r.status,
      decisionDate: r.decidedAt || null
    }));

    res.json({
      page: Number(page),
      limit: Number(limit),
      total,
      items: table
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'خطأ أثناء جلب طلبات الفرع', error: e.message });
  }
};

// =============== Get single (تفاصيل الطلب) ===============
exports.getRequestById = async (req, res) => {
  try {
    const r = await Request.findById(req.params.id)
      .populate({
        path: 'employee',
        select: 'name user department jobTitle contract.start contract.end',
        populate: { path: 'department', select: 'name' }
      })
      .populate('decidedBy', 'name role')
      .populate('notes.by', 'name role');

    if (!r) return res.status(404).json({ message: 'الطلب غير موجود' });

    // الموظف لا يرى إلا طلباته
    // if (!isHRorAdmin(req.user)) {
    //   const emp = await Employee.findOne({ user: req.user._id }).select('_id');
    //   if (!emp || String(r.employee._id) !== String(emp._id)) {
    //     return res.status(403).json({ message: 'غير مسموح' });
    //   }
    // }

    res.json(r);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'خطأ أثناء جلب تفاصيل الطلب' });
  }
};
// Backend: getRequestById


// exports.getRequestById = async (req, res) => {
//   try {
//     const { id } = req.params;

//     // نجرب نجيب الطلب من جدول Requests
//     let request = await Request.findById(id)
//       .populate({
//         path: 'employee',
//         select: 'name user department jobTitle contract.start contract.end',
//         populate: { path: 'department', select: 'name' }
//       })
//       .populate('decidedBy', 'name role')
//       .populate('notes.by', 'name role');

//     if (request) {
//       // لو الطلب موجود في Requests، نرجعه مباشرة
//       return res.json(request);
//     }

//     // لو مش موجود في Requests، نجرب جدول Borrow
//     let borrowRequest = await SalaryAdvance.findById(id)
//       .populate({
//         path: 'employee',
//         select: 'name user department jobTitle contract.start contract.end',
//         populate: { path: 'department', select: 'name' }
//       });

//     if (!borrowRequest) {
//       return res.status(404).json({ message: 'الطلب غير موجود' });
//     }

//     // نضيف type عشان frontend يعرف إنه سلفة
//     borrowRequest = borrowRequest.toObject();
//     borrowRequest.type = 'سلفة';

//     return res.json(borrowRequest);

//   } catch (e) {
//     console.error(e);
//     res.status(500).json({ message: 'خطأ أثناء جلب تفاصيل الطلب' });
//   }
// };


// =============== Approve (HR/Admin) ===============


exports.approveRequest = async (req, res) => {
  try {
    // تحقق من الصلاحيات
    if (!['HR', 'ADMIN'].includes(req.user.role)) 
      return res.status(403).json({ message: 'غير مسموح' });

    const { note } = req.body;
    const r = await Request.findById(req.params.id).populate('employee');
    if (!r) return res.status(404).json({ message: 'الطلب غير موجود' });

    r.status = 'مقبول';
    r.decidedAt = new Date();
    r.decidedBy = req.user._id;
    if (note) r.decisionNote = note;

    // ======== التعامل مع الإجازة ========

if (r.type === 'إجازة' && r.leave?.startDate && r.leave?.endDate) {
  const leaveDays = Math.ceil(
    (new Date(r.leave.endDate) - new Date(r.leave.startDate)) / (1000 * 60 * 60 * 24)
  ) + 1;

  const leaveBalance = await LeaveBalance.findOne({ employee: r.employee._id });
  if (!leaveBalance) return res.status(404).json({ message: 'رصيد الإجازات غير موجود' });

  const leaveMap = {
    'اعتيادية': 'annual',
    'مرضية': 'sick',
    'زواج': 'marriage',
    'طارئة': 'emergency',
    'ولادة': 'maternity',
    'بدون مرتب': 'unpaid'
  };

  const balanceField = leaveMap[r.leave.leaveType];

  if (!balanceField) {
    return res.status(400).json({ message: `نوع الإجازة غير معروف: ${r.leave.leaveType}` });
  }

  if (leaveBalance[balanceField] < leaveDays) {
    return res.status(400).json({ message: 'الرصيد غير كافي' });
  }

  // خصم من النوع
  leaveBalance[balanceField] -= leaveDays;

  //  خصم كمان من الرصيد الكلي المتبقي
  if (leaveBalance.remaining < leaveDays) {
    return res.status(400).json({ message: 'الرصيد الكلي غير كافي' });
  }
  leaveBalance.remaining -= leaveDays;

  await leaveBalance.save();
}


    // ======== التعامل مع البدل ========
    if (r.type === 'بدل' && r.allowance?.amount) {
      const emp = r.employee;
      if (!emp.salary || typeof emp.salary !== 'object') emp.salary = {};

      emp.salary.base = emp.salary.base || 0;
      emp.salary.housingAllowance = emp.salary.housingAllowance || 0;
      emp.salary.transportAllowance = emp.salary.transportAllowance || 0;
      emp.salary.otherAllowance = emp.salary.otherAllowance || 0;

      emp.salary.otherAllowance += r.allowance.amount;

      // تحديث total
      emp.salary.total = emp.salary.base 
                        + emp.salary.housingAllowance 
                        + emp.salary.transportAllowance 
                        + emp.salary.otherAllowance;

      await emp.save();
    }

    await r.save();
    // ======== إنشاء Notification للموظف ========
    await Notification.create({
      employee: r.employee._id,
      type: 'request',
      message: `تمت الموافقة على طلبك (${r.type})`,
   link: `/employee/services`,
      read: false
    });



    res.json({ message: 'تمت الموافقة على الطلب', request: r });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'خطأ أثناء الموافقة', error: e.message });
  }
};


// =============== Reject (HR/Admin) ===============
exports.rejectRequest = async (req, res) => {
  try {
    // if (!isHRorAdmin(req.user)) return res.status(403).json({ message: 'غير مسموح' });
if (!req.user || !req.user._id) {
  return res.status(401).json({ message: 'غير مصرح' });
}
    // const { reason } = req.body;
    const r = await Request.findById(req.params.id);
    if (!r) return res.status(404).json({ message: 'الطلب غير موجود' });

    r.status = 'مرفوض';
    r.decidedAt = new Date();
    r.decidedBy = req.user._id;
    // r.rejectionReason = reason || null;
    await r.save();
  await Notification.create({
      employee: r.employee, // أو r.employee._id لو populate موجود
      type: 'request',
      message: `تم رفض طلبك (${r.type})`,
       link: `/employee/services`,
      read: false
    });
    res.json({ message: 'تم رفض الطلب', request: r });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'خطأ أثناء الرفض' });
  }
};

// =============== Forward (HR/Admin) ===============
exports.forwardRequest = async (req, res) => {
  try {
    if (!isHRorAdmin(req.user)) 
      return res.status(403).json({ message: 'غير مسموح' });

    const { managerId, note } = req.body; // هنا هنستقبل ID المدير

    const r = await Request.findById(req.params.id);
    if (!r) return res.status(404).json({ message: 'الطلب غير موجود' });

    r.status = 'محول';
    r.forwardedTo = managerId;

    if (note) {
      r.notes.push({ text: `تم التحويل: ${note}`, by: req.user._id });
    }

    await r.save();

    res.json({ message: 'تم تحويل الطلب', request: r });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'خطأ أثناء التحويل' });
  }
};

// =============== Add Note (HR/Admin) ===============
exports.addNote = async (req, res) => {
  try {
    const { text } = req.body;
    const requestId = req.params.id;

    const request = await Request.findById(requestId);
    if (!request) return res.status(404).json({ message: 'الطلب غير موجود' });

    // إضافة الملاحظة
    request.notes.push({
      text,
      by: req.user._id,   // الشخص اللي بيضيف الملاحظة
      at: new Date()
    });

    await request.save();

    res.json({ message: 'تمت إضافة الملاحظة', notes: request.notes });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'حدث خطأ أثناء إضافة الملاحظة', error: err.message });
  }
};

// =============== get request by type ===============

exports.getRequestsByType = async (req, res) => {
  try {
    const { status, type } = req.query;

    // بناء الفلتر بدون تقيد بالفرع
    const filter = {};
    if (status && status !== 'الكل') filter.status = status;
    if (type) filter.type = type;

    // جلب الطلبات
    const requests = await Request.find(filter)
      .populate({
        path: 'employee',
        select: 'name workplace',
        populate: { path: 'workplace', select: 'name' } // لإظهار اسم الفرع
      })
      .sort({ createdAt: -1 });

    // إعداد النتيجة حسب الحالة
    const result = requests.map(r => {
      const base = {
        employeeName: r.employee.name,
        requestType: r.type,
        submittedAt: r.createdAt,
        status: r.status
      };
      if (r.status === 'مقبول') base.decisionDate = r.decidedAt;
      if (r.status === 'مرفوض') base.rejectionDate = r.decidedAt;
      return base;
    });

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'خطأ أثناء جلب الطلبات', error: err.message });
  }
};


exports.getRequestsByWorkplace = async (req, res) => {
  try {
    const { status, type } = req.query;

  
    const currentEmployee = await Employee.findOne({ user: req.user._id }).select('workplace');
    if (!currentEmployee) return res.status(404).json({ message: 'الموظف غير موجود' });


    const employeesInWorkplace = await Employee.find({ 
      workplace: currentEmployee.workplace 
    }).select('_id');

    const employeeIds = employeesInWorkplace.map(emp => emp._id);


    const filter = { employee: { $in: employeeIds } };
    if (status && status !== 'الكل') filter.status = status;
    if (type) filter.type = type;


    const requests = await Request.find(filter)
      .populate({
        path: 'employee',
        select: 'name workplace',
        populate: { path: 'workplace', select: 'name' } 
      })
      .sort({ createdAt: -1 });


    const result = requests.map(r => {
      const base = {
        employeeName: r.employee.name,
        requestType: r.type,
        submittedAt: r.createdAt,
        status: r.status
      };
      if (r.status === 'مقبول') base.decisionDate = r.decidedAt;
      if (r.status === 'مرفوض') base.rejectionDate = r.decidedAt;
      return base;
    });

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'خطأ أثناء جلب الطلبات', error: err.message });
  }
};



//  get requests to one employee by id

exports.getRequestsByEmployee = async (req, res) => {
  try {
    const employeeId = req.params.id;

    const requests = await Request.find({ employee: employeeId })
      .populate('employee', 'name') // يظهر اسم الموظف بس
      .select('type status createdAt'); // نوع الطلب، الحالة، وتاريخ التقديم

    res.json(requests);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'خطأ أثناء جلب الطلبات' });
  }
};


//update request 
exports.updateRequest = [
  upload.array('attachments'),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { type, leave, complaint, appeal, allowance, insurance, custody, custodyClearance, expense } = req.body;

      const request = await Request.findById(id);
      if (!request) return res.status(404).json({ message: 'الطلب غير موجود' });

 // جلب الموظف اللي في الطلب
const employeeDoc = await Employee.findById(request.employee._id).populate('user');

// التأكد إن اليوزر الحالي هو نفس اليوزر المرتبط بالموظف
if (String(employeeDoc.user._id) !== String(req.user._id)) {
  return res.status(403).json({ message: 'غير مسموح بتعديل هذا الطلب' });
}
      // تحديث المرفقات
      if (req.files && req.files.length > 0) {
        const attachments = req.files.map(file => ({
          filename: file.originalname,
          url: `/uploads/requests/${file.filename}`
        }));
        request.attachments = [...request.attachments, ...attachments];
      }

      // تحديث النوع
      if (type) request.type = type;

      // Parse البيانات لو جايه كـ JSON string
      const leaveData = leave && typeof leave === 'string' ? JSON.parse(leave) : leave;
      const complaintData = complaint && typeof complaint === 'string' ? JSON.parse(complaint) : complaint;
      const appealData = appeal && typeof appeal === 'string' ? JSON.parse(appeal) : appeal;
      const allowanceData = allowance && typeof allowance === 'string' ? JSON.parse(allowance) : allowance;
      const insuranceData = insurance && typeof insurance === 'string' ? JSON.parse(insurance) : insurance;
      const custodyData = custody && typeof custody === 'string' ? JSON.parse(custody) : custody;
      const custodyClearanceData = custodyClearance && typeof custodyClearance === 'string' ? JSON.parse(custodyClearance) : custodyClearance;
      const expenseData = expense && typeof expense === 'string' ? JSON.parse(expense) : expense;

      // تحديث التفاصيل حسب النوع
      switch (type || request.type) {
        case 'إجازة':
          request.leave = leaveData || request.leave;
          break;
        case 'شكوى':
          request.complaint = complaintData || request.complaint;
          break;
        case 'اعتراض':
          request.appeal = appealData || request.appeal;
          break;
        case 'بدل':
          request.allowance = allowanceData || request.allowance;
          break;
        case 'مطالبة تأمينية':
          request.insurance = insuranceData || request.insurance;
          break;
        case 'عهدة':
          request.custody = custodyData || request.custody;
          break;
        case 'تصفية عهدة':
          request.custodyClearance = custodyClearanceData || request.custodyClearance;
          break;
        case 'مصروف/فاتورة':
          request.expense = expenseData || request.expense;
          break;
        default:
          return res.status(400).json({ message: 'نوع الطلب غير مدعوم' });
      }

      // حفظ التعديلات
      await request.save();

      res.status(200).json({ message: 'تم تعديل الطلب بنجاح', request });
    } catch (e) {
      console.error(e);
      res.status(500).json({ message: 'خطأ أثناء تعديل الطلب', error: e.message });
    }
  }
];


// DELETE /api/requests/:id
exports.deleteRequest = async (req, res) => {
  try {
    // جلب الطلب
    const request = await Request.findById(req.params.id).populate({
      path: "employee",
      populate: { path: "user" }
    });

    if (!request) {
      return res.status(404).json({ message: "الطلب غير موجود" });
    }

    const employeeDoc = await Employee.findById(request.employee._id).populate('user');
    // التحقق من صاحب الطلب
    if (String(employeeDoc.user._id) !== String(req.user._id)) {
      return res.status(403).json({ message: "غير مسموح بحذف هذا الطلب" });
    }


    await request.deleteOne();

    res.status(200).json({ message: "تم حذف الطلب بنجاح" });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: "خطأ أثناء حذف الطلب", error: e.message });
  }
};



































