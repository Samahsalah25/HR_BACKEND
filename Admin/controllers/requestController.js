const Request = require('../models/requestModel');
const Employee = require('../models/employee');
const multer = require('multer');
const path = require('path');
const LeaveBalance=require('../models/leaveBalanceModel')
// هل المستخدم HR/Admin؟
const isHRorAdmin = (user) => ['HR', 'ADMIN'].includes(user.role);

// إعداد مكان التخزين للملفات
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // فولدر محلي
  },
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + '-' + file.originalname;
    cb(null, uniqueName);
  }
});
const upload = multer({ storage });

// =============== Create (الموظف ينشئ طلب) ===============
// =============== Create Request ===============
exports.createRequest = [
  upload.array('attachments'), // لو فيه ملفات
  async (req, res) => {
    try {
      const { type, leave, complaint, appeal, allowance, insurance } = req.body;

      if (!type) return res.status(400).json({ message: 'نوع الطلب مطلوب' });

      // المستخدم لازم يكون موظف
      if (req.user.role !== 'EMPLOYEE') {
        return res.status(403).json({ message: 'هذا الإجراء متاح للموظفين فقط' });
      }

      // جيب Employee المرتبط باليوزر الحالي
      const employeeDoc = await Employee.findOne({ user: req.user._id });
      if (!employeeDoc) return res.status(404).json({ message: 'لم يتم العثور على بيانات الموظف' });

      // تجهيز المرفقات (لو موجودة)
      let attachments = [];
      if (req.files && req.files.length > 0) {
        attachments = req.files.map(file => ({
          filename: file.originalname,
          url: `/uploads/${file.filename}`
        }));
      }

      // تحقق من النوع لو String أو Object
      const leaveData = leave && typeof leave === 'string' ? JSON.parse(leave) : leave;
      const complaintData = complaint && typeof complaint === 'string' ? JSON.parse(complaint) : complaint;
      const appealData = appeal && typeof appeal === 'string' ? JSON.parse(appeal) : appeal;
      const allowanceData = allowance && typeof allowance === 'string' ? JSON.parse(allowance) : allowance;
      const insuranceData = insurance && typeof insurance === 'string' ? JSON.parse(insurance) : insurance;

      // إنشاء الطلب
      const request = await Request.create({
        employee: employeeDoc._id,
        type,
        leave: leaveData,
        complaint: complaintData,
        appeal: appealData,
        allowance: allowanceData,
        insurance: insuranceData,
        attachments
      });

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
    const { status = 'الكل', type, page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const query = {};

    if (status !== 'الكل') query.status = status;
    if (type) query.type = type;

    if (!isHRorAdmin(req.user)) {
      // الموظف يشوف طلباته فقط
      const emp = await Employee.findOne({ user: req.user._id }).select('_id');
      if (!emp) return res.status(404).json({ message: 'لا توجد بيانات موظف' });
      query.employee = emp._id;
    }

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

    // جدول مختصر
    const table = items.map(r => ({
      id: r._id,
      employeeName: r.employee?.name || '-',
      department: r.employee?.department?.name || null,
      type: r.type,                 // بالعربي
      submittedAt: r.createdAt,
      status: r.status,             // بالعربي
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
    res.status(500).json({ message: 'خطأ أثناء جلب الطلبات' });
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
    if (!isHRorAdmin(req.user)) {
      const emp = await Employee.findOne({ user: req.user._id }).select('_id');
      if (!emp || String(r.employee._id) !== String(emp._id)) {
        return res.status(403).json({ message: 'غير مسموح' });
      }
    }

    res.json(r);
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'خطأ أثناء جلب تفاصيل الطلب' });
  }
};

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
        (new Date(r.leave.endDate) - new Date(r.leave.startDate)) / (1000 * 60 * 60 * 24) + 1
      );

      const leaveBalance = await LeaveBalance.findOne({ employee: r.employee._id });
      if (!leaveBalance) return res.status(404).json({ message: 'رصيد الإجازات غير موجود' });

      switch (r.leave.leaveType) {
        case 'سنوية':
          leaveBalance.annual -= leaveDays;
          break;
        case 'مرضية':
          leaveBalance.sick -= leaveDays;
          break;
        case 'بدون مرتب':
          leaveBalance.unpaid -= leaveDays;
          break;
        default:
          break;
      }

      await leaveBalance.save();
    }

    // ======== التعامل مع البدل ========
    if (r.type === 'بدل' && r.allowance?.amount) {
      const emp = r.employee;
      if (!emp.salary || typeof emp.salary !== 'object') emp.salary = {};

      // نضمن القيم الإفتراضية
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

    res.json({ message: 'تمت الموافقة على الطلب', request: r });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'خطأ أثناء الموافقة', error: e.message });
  }
};

// =============== Reject (HR/Admin) ===============
exports.rejectRequest = async (req, res) => {
  try {
    if (!isHRorAdmin(req.user)) return res.status(403).json({ message: 'غير مسموح' });

    const { reason } = req.body;
    const r = await Request.findById(req.params.id);
    if (!r) return res.status(404).json({ message: 'الطلب غير موجود' });

    r.status = 'مرفوض';
    r.decidedAt = new Date();
    r.decidedBy = req.user._id;
    r.rejectionReason = reason || null;
    await r.save();

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
    if (!isHRorAdmin(req.user)) return res.status(403).json({ message: 'غير مسموح' });

    const { text } = req.body;
    if (!text) return res.status(400).json({ message: 'النص مطلوب' });

    const r = await Request.findById(req.params.id);
    if (!r) return res.status(404).json({ message: 'الطلب غير موجود' });

    r.notes.push({ text, by: req.user._id });
    await r.save();

    res.json({ message: 'تمت إضافة الملاحظة', request: r });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'خطأ أثناء إضافة الملاحظة' });
  }
};

// =============== Add Note (HR/Admin) ===============
exports.addNote = async (req, res) => {
  try {
    if (!isHRorAdmin(req.user)) return res.status(403).json({ message: 'غير مسموح' });

    const { text } = req.body;
    if (!text) return res.status(400).json({ message: 'النص مطلوب' });

    const r = await Request.findById(req.params.id);
    if (!r) return res.status(404).json({ message: 'الطلب غير موجود' });

    r.notes.push({ text, by: req.user._id });
    await r.save();

    res.json({ message: 'تمت إضافة الملاحظة', request: r });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'خطأ أثناء إضافة الملاحظة' });
  }
};

// =============== get request by type ===============

exports.getRequestsByType = async (req, res) => {
  try {
    const { type } = req.query; 
    const filter = {};
    if (type) filter.type = type; 

    const requests = await Request.find(filter)
      .populate('employee', 'name') 
      .sort({ createdAt: -1 }); 

   
    const result = requests.map(r => ({
      employeeName: r.employee.name,
      requestType: r.type,
      submittedAt: r.createdAt,
      status: r.status
    }));

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'خطأ أثناء جلب الطلبات' });
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
