const Request = require('../models/requestModel');
const Employee = require('../models/employee');
const Assets = require("../models/AssetsSchema.js")
const multer = require('multer');
const path = require('path');
const LeaveBalance = require('../models/leaveBalanceModel')
const Notification = require('../models/notification');
const SalaryAdvance = require('../models/salaryAdvance');
const uploadToCloudinary = require('../../utlis/uploadToCloudinary');
const User = require('../models/user.js')
// هل المستخدم HR/Admin؟
const isHRorAdmin = (user) => ['HR', 'ADMIN'].includes(user.role);


const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 } // 5MB
})

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
        for (const file of req.files) {
          const result = await uploadToCloudinary(file.buffer, 'requests');

          attachments.push({
            filename: file.originalname,
            url: result.secure_url
          });
        }
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
// exports.getRequests = async (req, res) => {
//   try {
//     const { status = 'الكل', type } = req.query;

//     const query = {};
//     if (status !== 'الكل') query.status = status;
//     if (type) query.type = type;

//     let items = await Request.find(query)
//       .sort({ createdAt: -1 })
//       .populate({
//         path: 'employee',
//         select: 'name department jobTitle contract.start contract.end',
//         populate: { path: 'department', select: 'name' }
//       });


//     items = items.filter(r => r.employee);

//     // 
//     const table = items.map(r => ({
//       id: r._id,
//       employeeName: r.employee?.name || '-',
//       department: r.employee?.department?.name || null,
//       type: r.type,
//       submittedAt: r.createdAt,
//       status: r.status,
//       decisionDate: r.decidedAt || null
//     }));

//     res.json({
//       total: table.length,
//       items: table
//     });
//   } catch (e) {
//     console.error(e);
//     res.status(500).json({ message: 'خطأ أثناء جلب الطلبات' });
//   }
// };
// exports.getRequests = async (req, res) => {
//   try {
//     const { status = 'الكل' } = req.query;

//     /** 🔁 تحويل حالات السلف */
//     const mapBorrowStatus = (status) => {
//       switch (status) {
//         case 'pending':
//           return 'قيد المراجعة';

//         case 'approved':
//         case 'completed':
//           return 'مقبول';

//         case 'rejected':
//           return 'مرفوض';

//         default:
//           return status;
//       }
//     };

//     /** 1️⃣ الطلبات العادية */
//     let requests = await Request.find(
//       status !== 'الكل' ? { status } : {}
//     )
//       .sort({ createdAt: -1 })
//       .populate({
//         path: 'employee',
//         select: 'name department jobTitle',
//         populate: { path: 'department', select: 'name' }
//       });

//     requests = requests
//       .filter(r => r.employee)
//       .map(r => ({
//         id: r._id,
//         employeeName: r.employee.name,
//         department: r.employee.department?.name || null,
//         type: r.type || 'طلب',
//         submittedAt: r.createdAt,
//         status: r.status,
//         decisionDate: r.decidedAt || null,
//         __source: 'request'
//       }));

//     /** 2️⃣ السلف (مستقلة) */
//     let borrows = await SalaryAdvance.find(
//       status !== 'الكل' ? {} : {}
//       // ❗ متفلترش بالـ status هنا لأن حالات السلف مختلفة
//     )
//       .sort({ createdAt: -1 })
//       .populate({
//         path: 'employee',
//         select: 'name department jobTitle',
//         populate: { path: 'department', select: 'name' }
//       });

//     borrows = borrows
//       .filter(b => b.employee)
//       .map(b => ({
//         id: b._id,
//         employeeName: b.employee.name,
//         department: b.employee.department?.name || null,
//         type: 'سلفة',
//         submittedAt: b.createdAt,
//         status: mapBorrowStatus(b.status),
//         decisionDate: b.approvedAt || null,
//         __source: 'borrow'
//       }));

//     /** 3️⃣ دمج الطلبات + السلف */
//     let items = [...requests, ...borrows];

//     /** 4️⃣ فلترة حسب التاب (قيد المراجعة / مقبول / مرفوض) */
//     if (status !== 'الكل') {
//       items = items.filter(item => item.status === status);
//     }

//     /** 5️⃣ ترتيب بالوقت */
//     items.sort(
//       (a, b) => new Date(b.submittedAt) - new Date(a.submittedAt)
//     );

//     res.json({
//       total: items.length,
//       items
//     });

//   } catch (e) {
//     console.error(e);
//     res.status(500).json({ message: 'خطأ أثناء جلب الطلبات' });
//   }
// };
// exports.getRequests = async (req, res) => {
//   try {
//     const { status = 'الكل', type } = req.query;

//     /** 🔁 تحويل حالات السلف */
//     const mapBorrowStatus = (status) => {
//       switch (status) {
//         case 'pending':
//           return 'قيد المراجعة';
//         case 'approved':
//         case 'completed':
//           return 'مقبول';
//         case 'rejected':
//           return 'مرفوض';
//         default:
//           return status;
//       }
//     };

//     /** 1️⃣ الطلبات العادية */
//     const requestQuery = {};
//     if (status !== 'الكل') requestQuery.status = status;
//     if (type) requestQuery.type = type;

//     let requests = await Request.find(requestQuery)
//       .sort({ createdAt: -1 })
//       .populate({
//         path: 'employee',
//         select: 'name department jobTitle',
//         populate: { path: 'department', select: 'name' }
//       });

//     requests = requests
//       .filter(r => r.employee)
//       .map(r => ({
//         id: r._id,
//         employeeName: r.employee.name,
//         department: r.employee.department?.name || null,
//         type: r.type || 'طلب',
//         submittedAt: r.createdAt,
//         status: r.status,
//         decisionDate: r.decidedAt || null,
//         __source: 'request'
//       }));

//     /** 2️⃣ السلف (مستقلة) */
//     let borrows = await SalaryAdvance.find()
//       .sort({ createdAt: -1 })
//       .populate({
//         path: 'employee',
//         select: 'name department jobTitle',
//         populate: { path: 'department', select: 'name' }
//       });

//     borrows = borrows
//       .filter(b => b.employee)
//       .map(b => ({
//         id: b._id,
//         employeeName: b.employee.name,
//         department: b.employee.department?.name || null,
//         type: 'سلفة',
//         submittedAt: b.createdAt,
//         status: mapBorrowStatus(b.status),
//         decisionDate: b.status === 'approved' ? b.approvedAt : (b.status === 'rejected' ? b.rejectedAt : null),
//         __source: 'borrow'
//       }));

//     /** 3️⃣ دمج الطلبات + السلف */
//     let items = [...requests, ...borrows];

//     /** 4️⃣ فلترة حسب التاب (قيد المراجعة / مقبول / مرفوض) */
//     if (status !== 'الكل') {
//       items = items.filter(item => item.status === status);
//     }

//     /** 5️⃣ ترتيب بالوقت */
//     items.sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));

//     res.json({
//       total: items.length,
//       items
//     });

//   } catch (e) {
//     console.error(e);
//     res.status(500).json({ message: 'خطأ أثناء جلب الطلبات' });
//   }
// };
// exports.getRequests = async (req, res) => {
//   try {
//     const { status = 'الكل', type } = req.query;

//     /** 🔁 تحويل حالات السلف */
//     const mapBorrowStatus = (status) => {
//       switch (status) {
//         case 'pending':
//           return 'قيد المراجعة';
//         case 'approved':
//         case 'completed':
//           return 'مقبول';
//         case 'rejected':
//           return 'مرفوض';
//         case 'forwarded':
//           return 'محول';
//         default:
//           return status;
//       }
//     };

//     /** 1️⃣ الطلبات العادية */
//     const requestQuery = {};
//     if (status !== 'الكل') requestQuery.status = status;
//     if (type) requestQuery.type = type;

//     let requests = await Request.find(requestQuery)
//       .sort({ createdAt: -1 })
//       .populate({
//         path: 'employee',
//         select: 'name department jobTitle',
//         populate: { path: 'department', select: 'name' }
//       });

//     requests = requests
//       .filter(r => r.employee)
//       .map(r => ({
//         id: r._id,
//         employeeName: r.employee.name,
//         department: r.employee.department?.name || null,
//         type: r.type || 'طلب',
//         submittedAt: r.createdAt,
//         status: r.status,
//         decisionDate: r.decidedAt || null,
//         __source: 'request'
//       }));

//     /** 2️⃣ السلف - تجيب بس لو مفيش type محدد */
//     let borrows = [];
//     if (!type) { // السلف تظهر فقط عند عرض الكل
//       borrows = await SalaryAdvance.find()
//         .sort({ createdAt: -1 })
//         .populate({
//           path: 'employee',
//           select: 'name department jobTitle',
//           populate: { path: 'department', select: 'name' }
//         });

//       borrows = borrows
//         .filter(b => b.employee)
//         .map(b => ({
//           id: b._id,
//           employeeName: b.employee.name,
//           department: b.employee.department?.name || null,
//           type: 'سلفة',
//           submittedAt: b.createdAt,
//           status: mapBorrowStatus(b.status),
//           decisionDate: b.status === 'approved' ? b.approvedAt
//             : (b.status === 'rejected' ? b.rejectedAt : null),
//           __source: 'borrow'
//         }));
//     }

//     /** 3️⃣ دمج الطلبات + السلف */
//     let items = [...requests, ...borrows];

//     /** 4️⃣ فلترة حسب التاب (قيد المراجعة / مقبول / مرفوض) */
//     if (status !== 'الكل') {
//       items = items.filter(item => item.status === status);
//     }

//     /** 5️⃣ ترتيب حسب التاريخ */
//     items.sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));

//     res.json({
//       total: items.length,
//       items
//     });

//   } catch (e) {
//     console.error(e);
//     res.status(500).json({ message: 'خطأ أثناء جلب الطلبات' });
//   }
// };

exports.getRequests = async (req, res) => {
  try {
    // 1. التأكد إن اللي بيطلب البيانات موظف نشط (حماية الـ Endpoint)
    const requester = await Employee.findOne({ user: req.user._id });
    if (!requester || requester.status !== 'active') {
      return res.status(403).json({
        message: 'عفواً، حسابك غير نشط ولا تملك صلاحية الوصول لهذه البيانات.'
      });
    }

    const { status = 'الكل', type } = req.query;

    /** 🔁 تحويل حالات السلف */
    const mapBorrowStatus = (status) => {
      switch (status) {
        case 'pending': return 'قيد المراجعة';
        case 'approved':
        case 'completed': return 'مقبول';
        case 'rejected': return 'مرفوض';
        case 'forwarded': return 'محول';
        default: return status;
      }
    };

    /** 1️⃣ الطلبات العادية */
    const requestQuery = {};
    if (status !== 'الكل') requestQuery.status = status;
    if (type) requestQuery.type = type;

    let requests = await Request.find(requestQuery)
      .sort({ createdAt: -1 })
      .populate({
        path: 'employee',
        select: 'name department jobTitle status', // ضفنا status هنا عشان نفلتر بيها
        populate: { path: 'department', select: 'name' }
      });

    // التعديل: بنشيل الطلبات اللي الموظف بتاعها "مش نشط" أو "محذوف"
    requests = requests
      .filter(r => r.employee && r.employee.status === 'active')
      .map(r => ({
        id: r._id,
        employeeName: r.employee.name,
        department: r.employee.department?.name || null,
        type: r.type || 'طلب',
        submittedAt: r.createdAt,
        status: r.status,
        decisionDate: r.decidedAt || null,
        __source: 'request'
      }));

    /** 2️⃣ السلف */
    let borrows = [];
    if (!type) {
      borrows = await SalaryAdvance.find()
        .sort({ createdAt: -1 })
        .populate({
          path: 'employee',
          select: 'name department jobTitle status', // ضفنا status برضه
          populate: { path: 'department', select: 'name' }
        });

      // التعديل: فلترة السلف للموظفين النشطين بس
      borrows = borrows
        .filter(b => b.employee && b.employee.status === 'active')
        .map(b => ({
          id: b._id,
          employeeName: b.employee.name,
          department: b.employee.department?.name || null,
          type: 'سلفة',
          submittedAt: b.createdAt,
          status: mapBorrowStatus(b.status),
          decisionDate: b.status === 'approved' ? b.approvedAt
            : (b.status === 'rejected' ? b.rejectedAt : null),
          __source: 'borrow'
        }));
    }

    /** 3️⃣ دمج + 4️⃣ فلترة حسب الحالة + 5️⃣ ترتيب */
    let items = [...requests, ...borrows];

    if (status !== 'الكل') {
      items = items.filter(item => item.status === status);
    }

    items.sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));

    res.json({
      total: items.length,
      items
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
// exports.getRequestById = async (req, res) => {
//   try {
//     const r = await Request.findById(req.params.id)
//       .populate({
//         path: 'employee',
//         select: 'name user department jobTitle contract.start contract.end',
//         populate: { path: 'department', select: 'name' }
//       })
//       .populate('decidedBy', 'name role')
//       .populate('notes.by', 'name role');

//     if (!r) return res.status(404).json({ message: 'الطلب غير موجود' });

//     // الموظف لا يرى إلا طلباته
//     // if (!isHRorAdmin(req.user)) {
//     //   const emp = await Employee.findOne({ user: req.user._id }).select('_id');
//     //   if (!emp || String(r.employee._id) !== String(emp._id)) {
//     //     return res.status(403).json({ message: 'غير مسموح' });
//     //   }
//     // }

//     res.json(r);
//   } catch (e) {
//     console.error(e);
//     res.status(500).json({ message: 'خطأ أثناء جلب تفاصيل الطلب' });
//   }
// };
// Backend: getRequestById


// Backend: getRequestById

// exports.getRequestById = async (req, res) => {
//   try {
//     const { id } = req.params;

//     // أولاً نجيب الطلب العادي من جدول Requests
//     let request = await Request.findById(id)
//       .populate({
//         path: 'employee',
//         select: 'name user department jobTitle contract.start contract.end',
//         populate: { path: 'department', select: 'name' }
//       })
//       .populate('decidedBy', 'name role')
//       .populate('notes.by', 'name role');

//     if (!request) return res.status(404).json({ message: 'الطلب غير موجود' });

//     // نحول request لـ object عادي عشان نقدر نضيف خصائص جديدة
//     request = request.toObject();

//     // بعدين نبحث لو فيه سلفة مرتبطة بالـ request._id
//     const borrowData = await SalaryAdvance.findOne({ request: id })
//       .populate({
//         path: 'employee',
//         select: 'name user department jobTitle contract.start contract.end',
//         populate: { path: 'department', select: 'name' }
//       });

//     if (borrowData) {
//       // لو لقينا السلفة، نضيفها كـ property جديدة
//       request.borrowData = borrowData;
//       request.type = 'سلفة'; // عشان الـ frontend يعرف يعرض الفورم الصح
//     }

//     return res.json(request);

//   } catch (e) {
//     console.error(e);
//     res.status(500).json({ message: 'خطأ أثناء جلب تفاصيل الطلب' });
//   }
// };

// exports.getRequestById = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const { source } = req.query;

//     if (source === 'borrow') {
//       const borrow = await SalaryAdvance.findById(id)
//         .populate({
//           path: 'employee',
//           select: 'name department jobTitle',
//           populate: { path: 'department', select: 'name' }
//         });

//       if (!borrow) return res.status(404).json({ message: 'السلفة غير موجودة' });

//       return res.json({ ...borrow.toObject(), type: 'سلفة' });
//     }

//     // الطلب العادي
//     let request = await Request.findById(id)
//       .populate({
//         path: 'employee',
//         select: 'name department jobTitle',
//         populate: { path: 'department', select: 'name' }
//       });

//     if (!request) return res.status(404).json({ message: 'الطلب غير موجود' });

//     // ✅ لو الطلب عهدة، نجيب الاسم والنوع من الـ asset مباشرة
//     if (request.type === 'عهدة' && request.custody?.custodyId) {
//       const asset = await Assets.findById(request.custody.custodyId);
//       if (asset) {
//         request = request.toObject(); // نحولها object عشان نقدر نعدل فيها
//         request.custody = {
//           ...request.custody,
//           name: asset.assetName,
//           custodyType: asset.assetType,
//           description: asset.description,
//         };
//       }
//     }

//     res.json({ ...request, type: request.type || 'طلب' });

//   } catch (e) {
//     console.error(e);
//     res.status(500).json({ message: 'خطأ أثناء جلب التفاصيل' });
//   }
// };
exports.getRequestById = async (req, res) => {
  try {
    const { id } = req.params;
    const { source } = req.query;

    // ------------------------
    // حالة السلفة
    // ------------------------
    if (source === 'borrow') {
      const borrow = await SalaryAdvance.findById(id)
        .populate({
          path: 'employee',
          select: 'name department jobTitle',
          populate: { path: 'department', select: 'name' }
        });

      if (!borrow) return res.status(404).json({ message: 'السلفة غير موجودة' });

      return res.json({ ...borrow.toObject(), type: 'سلفة' });
    }

    // ------------------------
    // الطلب العادي
    // ------------------------
    let request = await Request.findById(id)
      .populate({
        path: 'employee',
        select: 'name department jobTitle',
        populate: { path: 'department', select: 'name' }
      })
      .populate('decidedBy', 'name')
      .populate('forwardedTo', 'name')
      .populate('custody.receivedBy', 'name jobTitle')
      .populate('custody.returnedTo', 'name jobTitle')
      .populate('notes.by', 'name');

    if (!request) return res.status(404).json({ message: 'الطلب غير موجود' });

    // ------------------------
    // حالة العهدة أو تصفية عهدة
    // ------------------------


    // ------------------------
    // رجع كل البيانات
    // ------------------------
    res.json({ ...request.toObject(), type: request.type || 'طلب' });

  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'خطأ أثناء جلب التفاصيل' });
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
        (new Date(r.leave.endDate) - new Date(r.leave.startDate)) / (1000 * 60 * 60 * 24)
      ) + 1;

      const leaveYear = new Date(r.leave.startDate).getFullYear();

      const leaveBalance = await LeaveBalance.findOne({ employee: r.employee._id, year: leaveYear });
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

    //==========          تصفية العهد      ================
    if (r.type === 'تصفية عهدة' && r.custodyClearance?.custodyId) {
      const assetId = r.custodyClearance.custodyId;
      const clearanceReason = r.custodyClearance.reason;
      const clearanceDate = r.custodyClearance.clearanceDate || new Date();

      if (r.custody) {
        r.custody.status = 'مستلمة';
        r.custody.returnDate = clearanceDate;
        r.custody.returnedTo = req.user._id;
      }

      const asset = await Assets.findById(assetId);
      if (asset) {
        asset.currentEmployee = null;

        if (clearanceReason === 'عطل') {
          asset.status = 'تحت الصيانة';
        } else {
          asset.status = 'متاح';
        }

        // console.log(asset)

        await asset.save();
      } else {
        return res.status(404).json({ message: 'الأصل (Asset) المراد تصفيته غير موجود' });
      }
    }


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

// =============== Approve (HR/Admin) Custody  ===============


exports.approveCustodyRequest = async (req, res) => {
  try {
    if (!['HR', 'ADMIN'].includes(req.user.role))
      return res.status(403).json({ message: 'غير مسموح' });

    const {
      receivedDate,
      receivedBy,
      returnDate,
      returnedTo,
      note
    } = req.body;

    const r = await Request.findById(req.params.id).populate('employee');
    if (!r) return res.status(404).json({ message: 'الطلب غير موجود' });
    console.log(r.employee.name);



    if (r.type !== 'عهدة') {
      return res.status(400).json({ message: 'هذا الطلب ليس طلب عهدة' });
    }
    r.status = 'مقبول';
    r.decidedAt = new Date();
    r.decidedBy = req.user._id;
    if (note) r.decisionNote = note;

    r.custody.status = 'قيد المراجعة';
    r.custody.receivedDate = receivedDate;
    r.custody.receivedBy = receivedBy; // الـ ID بتاع الموظف المسئول
    r.custody.returnDate = returnDate;
    r.custody.returnedTo = returnedTo; // الـ ID بتاع مسئول الاستيراد

    if (r.custody.custodyId) {
      const assets = await Assets.findByIdAndUpdate(r.custody.custodyId, {
        status: 'مستخدمة',
        currentEmployee: r.employee.name
      });
      console.log(assets);

    }


    await r.save();

    await Notification.create({
      employee: r.employee._id,
      type: 'request',
      message: `تمت الموافقة على طلب العهدة الخاص بك وحالته الآن: ${r.custody.status}`,
      link: `/employee/services`,
      read: false
    });


    // if (receivedBy) {
    //   await Notification.create({
    //     employee: receivedBy, 
    //     type: 'request',
    //     message: `لديك مهمة تسليم عهدة جديدة للموظف: ${r.employee.name}`,
    //     link: `/admin/custody-delivery`, 
    //     read: false
    //   });
    // }

    res.json({
      message: 'تمت الموافقة على طلب العهدة بنجاح',
      request: r
    });

  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'خطأ أثناء معالجة طلب العهدة', error: e.message });
  }
};
// =============== تسليم العهده  (HR/Admin) Custody  ===============

exports.confirmDelivery = async (req, res) => {
  try {
    const r = await Request.findById(req.params.id);
    if (!r) return res.status(404).json({ message: 'الطلب غير موجود' });

    r.custody.status = 'مسلمة';
    r.custody.receivedDate = new Date();


    await Assets.findByIdAndUpdate(r.custody.custodyId, { status: 'مستخدمة' });

    await r.save();
    res.json({ message: 'تم تأكيد تسليم العهدة للموظف بنجاح', request: r });
  } catch (e) {
    res.status(500).json({ message: 'خطأ أثناء تأكيد التسليم', error: e.message });
  }
};

exports.confirmReturn = async (req, res) => {
  try {
    const r = await Request.findById(req.params.id);
    if (!r) return res.status(404).json({ message: 'الطلب غير موجود' });

    r.custody.status = 'مستلمة';
    r.custody.returnDate = new Date();

    await Assets.findByIdAndUpdate(r.custody.custodyId, {
      status: 'عائدة',
      currentEmployee: null
    });

    await r.save();
    res.json({ message: 'تم تأكيد استلام العهدة في المخزن بنجاح', request: r });
  } catch (e) {
    res.status(500).json({ message: 'خطأ أثناء تأكيد الاسترداد', error: e.message });
  }
};


// exports.getMyDeliveryTasks = async (req, res) => {
//   try {
//     const employee = await Employee.findOne({ user: req.user._id }).select('_id');

//     if (!employee) {
//       return res.status(404).json({ message: 'لا يوجد موظف مرتبط بالمستخدم' });
//     }

//     const tasks = await Request.find({
//       type: 'عهدة',
//       'custody.receivedBy': employee._id
//     })
//       .populate('employee', 'name department')
//       .populate({
//         path: 'custody.custodyId',
//         select: 'assetType assetId assetName serialNumber status',
//         populate: { path: 'currentEmployee', select: 'name' }
//       })
//       .populate('custody.returnedTo', 'name')
//       .sort({ 'custody.receivedDate': 1 });

//     const formattedTasks = tasks.map(task => {
//       const assetInfo = task.custody?.custodyId || {};

//       return {
//         requestId: task._id,

//         currentEmployee:
//           assetInfo?.currentEmployee?.name || 'لا يوجد موظف حالي',

//         custodyType: assetInfo?.assetType || 'غير محدد',

//         assetNumber:
//           assetInfo?.assetId || assetInfo?.serialNumber || '-',

//         receivedDate: task.custody?.receivedDate
//           ? new Date(task.custody.receivedDate).toLocaleDateString('ar-EG')
//           : '-',

//         status: task.custody?.status || '-'
//       };
//     });

//     res.status(200).json({
//       results: formattedTasks.length,
//       tasks: formattedTasks
//     });

//   } catch (e) {
//     console.error("getMyDeliveryTasks error:", e);
//     res.status(500).json({
//       message: 'خطأ أثناء جلب مهام التسليم',
//       error: e.message
//     });
//   }
// };

exports.getMyDeliveryTasks = async (req, res) => {
  try {
    const employee = await Employee.findOne({ user: req.user._id }).select('_id');

    if (!employee) {
      return res.status(404).json({ message: 'لا يوجد موظف مرتبط بالمستخدم' });
    }

    const tasks = await Request.find({
      type: 'عهدة',
      'custody.receivedBy': employee._id
    })
      .populate('employee', 'name department')
      .populate({
        path: 'custody.custodyId',
        select: 'assetType assetId assetName serialNumber currentEmployee status'
      })
      .populate('custody.returnedTo', 'name')
      .sort({ 'custody.receivedDate': 1 });

    const formattedTasks = tasks.map(task => {
      const assetInfo = task.custody?.custodyId || {};

      return {
        requestId: task._id,

        //  اسم الموظف اللي طلب العهدة
        requestedBy: task.employee?.name || 'غير معروف',

        //  اسم الأصل
        assetName: assetInfo?.assetName || '-',

        custodyType: assetInfo?.assetType || 'غير محدد',

        assetNumber:
          assetInfo?.assetId || assetInfo?.serialNumber || '-',

        receivedDate: task.custody?.receivedDate
          ? new Date(task.custody.receivedDate).toLocaleDateString('ar-EG')
          : '-',

        status: task.custody?.status || '-'
      };
    });

    res.status(200).json({
      results: formattedTasks.length,
      tasks: formattedTasks
    });

  } catch (e) {
    console.error("getMyDeliveryTasks error:", e);
    res.status(500).json({
      message: 'خطأ أثناء جلب مهام التسليم',
      error: e.message
    });
  }
};

exports.getMyReturnTasks = async (req, res) => {
  try {
    const employee = await Employee.findOne({ user: req.user._id }).select('_id');
    if (!employee) {
      return res.status(404).json({ message: 'لا يوجد موظف مرتبط بالمستخدم' });
    }
    const tasks = await Request.find({
      type: 'عهدة',
      'custody.returnedTo': employee._id
    })
      .populate('employee', 'name department')
      .populate({
        path: 'custody.custodyId',
        select: 'assetType assetId assetName serialNumber currentEmployee status'
      })
      .populate('custody.returnedTo', 'name')
      .sort({ 'custody.receivedDate': 1 });

    const formattedTasks = tasks.map(task => {
      const assetInfo = task.custody?.custodyId || {};
      return {
        requestId: task._id,
        // اسم اللي طلب العهدة
        requestedBy: task.employee?.name || 'غير معروف',

        //  اسم الأصل
        assetName: assetInfo?.assetName || '-',

        custodyType: assetInfo?.assetType || 'غير محدد',

        assetNumber:
          assetInfo?.assetId || assetInfo?.serialNumber || '-',

        receivedDate: task.custody?.receivedDate
          ? new Date(task.custody.receivedDate).toLocaleDateString('ar-EG')
          : '-',

        status: task.custody?.status || '-'
      };
    });

    res.status(200).json({
      results: formattedTasks.length,
      tasks: formattedTasks
    });

  } catch (e) {
    console.error("getMyReturnTasks error:", e);
    res.status(500).json({
      message: 'خطأ أثناء جلب مهام استلام المرتجعات',
      error: e.message
    });
  }
};
//===============get all approve request 
//69146254d2f2d5527adb2393
exports.getMyApprovedCustodyRequests = async (req, res) => {
  try {
    const employee = await Employee.findOne({ user: req.user._id });
    if (!employee) {
      return res.status(404).json({ message: 'لا يوجد موظف مرتبط بالمستخدم' });
    }
    const tasks = await Request.find({
      employee: employee._id,
      type: 'عهدة',
      status: 'مقبول'
    })
      .populate('employee', 'name department')
      .populate({
        path: 'custody.custodyId',
        select: 'assetType assetId _id assetName serialNumber currentEmployee status,assetName'
      })
      .populate('custody.receivedBy', 'name')
      .populate('custody.returnedTo', 'name')
      .sort({ 'custody.receivedDate': 1 });

    // if (tasks.length == 0)
    //   return res.status(404).json({ message: 'الطلب غير موجود' });

    const formattedTasks = tasks.map(task => {
      const assetInfo = task.custody?.custodyId;

      return {
        requestId: task._id,

        //  اسم الموظف اللي طلب العهدة
        requestedBy: task.employee?.name || '-',

        //  النوع
        custodyType: assetInfo?.assetType || 'غير محدد',
        assetName: assetInfo?.assetName || 'غير محدد',
        assetId: assetInfo?._id || '-',
        //  اسم العهدة (الجديد)
        assetName: assetInfo?.assetName || '-',
        //رقم الأصل
        assetNumber: assetInfo?.assetId || assetInfo?.serialNumber || '-',
        // الموظف الحالي
        currentEmployee: assetInfo?.currentEmployee || 'لا يوجد موظف حالي',
        receivedDate: task.custody?.receivedDate
          ? new Date(task.custody.receivedDate).toLocaleDateString('ar-EG')
          : '-',

        receivedBy: task.custody?.receivedBy?.name || 'غير معروف',
        returnDate: task.custody?.returnDate
          ? new Date(task.custody.returnDate).toLocaleDateString('ar-EG')
          : '-',

        returnedTo: task.custody?.returnedTo?.name || '-',
        status: task.custody?.status
      };
    });

    res.status(200).json({
      success: true,
      count: formattedTasks.length,
      data: formattedTasks
    });

  } catch (e) {
    res.status(500).json({
      success: false,
      message: 'خطأ أثناء جلب العهد المعتمدة',
      error: e.message
    });
  }
};
//=======get all CustodyRequests ===================

exports.getAllApprovedCustodyRequests = async (req, res) => {
  try {
    const { month, year } = req.query;
    let filter = {
      type: 'عهدة',
      status: 'مقبول'
    };

    if (month && year) {
      const startDate = new Date(Number(year), Number(month) - 1, 1);
      const endDate = new Date(Number(year), Number(month), 0, 23, 59, 59);

      filter['custody.requestDate'] = {
        $exists: true,
        $gte: startDate,
        $lte: endDate
      };
    }

    const tasks = await Request.find(filter)
      .populate('employee', 'name department')
      .populate({
        path: 'custody.custodyId',
        select: 'assetType assetId assetName serialNumber currentEmployee status'
      })
      .populate('custody.receivedBy', 'name')
      .populate('custody.returnedTo', 'name')
      .sort({ 'custody.receivedDate': -1 });

    const formattedTasks = tasks.map(task => {
      const assetInfo = task.custody?.custodyId;
      return {
        employeeName: task.employee?.name || '-',

        custodyType: assetInfo?.assetType || 'غير محدد',

        assetNumber: assetInfo?.assetId || assetInfo?.serialNumber || '-',
        assetName: assetInfo?.assetName || 'غير محدد',

        receivedDate: task.custody?.receivedDate
          ? new Date(task.custody.receivedDate).toLocaleDateString('ar-EG')
          : '-',

        receivedBy: task.custody?.receivedBy?.name || 'غير معروف',

        returnDate: task.custody?.returnDate
          ? new Date(task.custody.returnDate).toLocaleDateString('ar-EG')
          : '-',

        returnedTo: task.custody?.returnedTo?.name || '-',

        status: task.custody?.status || 'مقبول'
      };
    });

    res.status(200).json({
      success: true,
      results: formattedTasks.length,
      data: formattedTasks
    });

  } catch (e) {
    res.status(500).json({
      success: false,
      message: 'خطأ أثناء جلب كافة العهد المعتمدة',
      error: e.message
    });
  }
};


// ===============Hr  بيعمل طلب عهده الي موظف  ===============

exports.createAndApproveCustodyByHR = async (req, res) => {
  try {
    if (!['HR', 'ADMIN'].includes(req.user.role)) {
      return res.status(403).json({ message: 'غير مسموح ليك بالعملية دي' });
    }

    const {
      employeeId,
      custodyId,
      purpose,
      duration,
      receivedBy,
      receivedDate,
      returnedTo,
      returnDate,
      note
    } = req.body;


    const emp = await Employee.findById(employeeId);
    if (!emp) {
      return res.status(404).json({ message: 'employee not founded' });
    }


    const asset = await Assets.findById(custodyId);
    if (!asset) {
      return res.status(404).json({ message: 'asset not founded' });
    }


    if (asset.status == 'مستخدمة' || asset.status == 'تحت الصيانة') {
      return res.status(400).json({ message: `asset not availbal` });
    }


    const newRequest = await Request.create({
      employee: employeeId,
      type: 'عهدة',
      status: 'مقبول',
      decidedAt: new Date(),
      decidedBy: req.user._id,
      decisionNote: note || 'تم التخصيص مباشرة من قبل الموارد البشرية',
      custody: {
        custodyId,
        purpose,
        duration,
        status: 'قيد المراجعة',
        receivedBy,
        receivedDate,
        returnedTo,
        returnDate
      }
    });

    asset.status = 'مستخدمة';
    asset.currentEmployee = emp.name;
    await asset.save();

    // 7. الإشعارات
    await Notification.create({
      employee: employeeId,
      type: 'request',
      message: `تم صرف عهدة جديدة لك: ${purpose}`,
      link: `/employee/services`,
      read: false
    });

    res.status(201).json({
      message: 'تم التحقق من البيانات وإنشاء العهدة بنجاح',
      request: newRequest
    });

  } catch (e) {
    console.error(e);
    res.status(500).json({ message: 'حصل خطأ في السيرفر وأنا بتأكد من البيانات', error: e.message });
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

exports.forwardCustodyRequest = async (req, res) => {
  try {
    if (!isHRorAdmin(req.user)) {
      return res.status(403).json({ message: 'غير مسموح' });
    }

    const {
      // ID المدير المحول إليه
      receivedDate,
      receivedBy,
      returnDate,
      returnedTo,
      note
    } = req.body;

    const r = await Request.findById(req.params.id);
    if (!r) return res.status(404).json({ message: 'الطلب مش موجود' });

    if (r.type !== 'عهدة') {
      return res.status(400).json({ message: 'ده مش طلب عهدة يا هندسة' });
    }
    const admin = await User.findOne({ role: 'ADMIN' });

    if (!admin) {
      return res.status(400).json({ message: 'لا يوجد أدمن للتحويل' });
    }




    r.status = 'محول';
    r.forwardedTo = admin._id;;

    r.custody.status = 'قيد المراجعة';
    r.custody.receivedDate = receivedDate;
    r.custody.receivedBy = receivedBy;
    r.custody.returnDate = returnDate;
    r.custody.returnedTo = returnedTo;

    if (note) {
      r.notes.push({
        text: `تم تحويل الطلب للمدير مع ملاحظة: ${note}`,
        by: req.user._id,
        at: new Date()
      });
    }

    await r.save();

    await Notification.create({
      employee: admin._id,
      type: 'request',
      message: `طلب عهدة محول إليك لمراجعته واعتماده.`,
      link: `/admin/requests/${r._id}`,
      read: false
    });

    res.json({ message: 'تم تحويل الطلب وتجهيز بيانات العهدة للمدير', request: r });

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
        for (const file of req.files) {
          const result = await uploadToCloudinary(file.buffer, 'requests');

          request.attachments.push({
            filename: file.originalname,
            url: result.secure_url
          });
        }
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