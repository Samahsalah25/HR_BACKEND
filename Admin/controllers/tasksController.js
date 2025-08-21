// controllers/tasksController.js
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const Task = require('../models/Task');
const Employee = require('../models/employee');
const { log } = require('console');

// ===== Multer config (ملف واحد باسم attachment) =====
const UPLOAD_DIR = path.resolve(__dirname, '..', 'uploads', 'tasks');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // تأكد أن فولدر الرفع موجود
    try {
      fs.mkdirSync(UPLOAD_DIR, { recursive: true });
    } catch (e) {
      return cb(e);
    }
    cb(null, UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname || '');
    cb(null, `attachment-${uniqueSuffix}${ext}`);
  }
});

const upload = multer({ storage });

// ===== Helpers =====
function parseISODate(dateStr) {
  // يقبل "YYYY-MM-DD" أو ISO كامل
  if (typeof dateStr !== 'string') return null;
  const trimmed = dateStr.trim();
  // لو بالضبط YYYY-MM-DD: ابنِ التاريخ بـ UTC لتفادي مشاكل التايمزون
  const m = trimmed.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (m) {
    const y = Number(m[1]), mo = Number(m[2]) - 1, d = Number(m[3]);
    const dt = new Date(Date.UTC(y, mo, d));
    // تحقّق من صلاحية التاريخ
    return isNaN(dt.getTime()) ? null : dt;
  }
  const dt = new Date(trimmed);
  return isNaN(dt.getTime()) ? null : dt;
}

function cleanupUploadedFile(req) {
  if (req.file && req.file.path) {
    fs.unlink(req.file.path, (err) => {
      if (err) console.error('خطأ أثناء مسح الملف بعد الفشل:', err);
    });
  }
}

// ===== Controllers =====

// GET all tasks
const getAlltasks = async (req, res) => {
  try {
   const tasks = await Task.find()
  .populate({
    path: 'assignedTo',
    select: 'fullName department',   // ✅ رجع بس الاسم والقسم
    populate: {
      path: 'user',
      select: ' name email'                // ✅ رجع بس الإيميل
    }
  })
  .populate('assignedBy', 'fullName email')
  .sort({ createdAt: -1 });


    res.json({ success: true, data: tasks });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'خطأ في استرجاع المهام',
      error: error.message
    });
  }
};

//  هنا هنجيب كل التاسكات الخاصه بالفرع بتاعي
const getAllTasksForMyBranch = async (req, res) => {
  try {
    console.log(req.user._id);
    
    // أولاً، جلب بيانات المستخدم مع الفرع
    const user = await Employee.findOne({ user: req.user._id }).populate('workplace');
    console.log("Found user:", user);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'المستخدم غير موجود'
      });
    }

    if (!user.workplace) {
      return res.status(400).json({
        success: false,
        message: 'المستخدم ليس مرتبطًا بأي فرع'
      });
    }

    const branchId = user.workplace._id;

    // جلب كل الموظفين في نفس الفرع
    const myBranchEmployees = await Employee.find({ workplace: branchId }).select('_id');
    const employeeIds = myBranchEmployees.map(e => e._id);

    // جلب المهام الخاصة بهم فقط
    const tasks = await Task.find({ assignedTo: { $in: employeeIds } })
      .populate({
        path: 'assignedTo',
        select: 'fullName department',
        populate: { path: 'user', select: 'name email' }
      })
      .populate('assignedBy', 'fullName email')
      .sort({ createdAt: -1 });

    // تعديل التواريخ علشان input type="date"
    const formattedTasks = tasks.map(task => ({
      ...task.toObject(),
      dueDate: task.dueDate ? task.dueDate.toISOString().split("T")[0] : null,
      createdAt: task.createdAt ? task.createdAt.toISOString().split("T")[0] : null,
      updatedAt: task.updatedAt ? task.updatedAt.toISOString().split("T")[0] : null
    }));

    res.json({ success: true, data: formattedTasks });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'خطأ في استرجاع المهام',
      error: error.message
    });
  }
};


// GET tasks by employee
const taskByemployee = async (req, res) => {
  try {
    const tasks = await Task.find({ assignedTo: req.params.id })
      .populate('assignedBy', ' name email')
      .sort({ createdAt: -1 });

    res.json({ success: true, data: tasks });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'خطأ في استرجاع مهام الموظف',
      error: error.message
    });
  }
};

// POST create new task (ملف واحد: attachment)
const createTasks = async (req, res) => {
  try {
   

    const {
      title,
      description,
      assignedTo,    
      dueDate,
  
    } = req.body || {};

 

    if (!title || !description || !assignedTo || !dueDate) {
      cleanupUploadedFile(req);
      return res.status(400).json({
        success: false,
        message: 'حقول مطلوبة مفقودة: title, description, assignedTo, dueDate'
      });
    }

    // تحقّق من الموظف
    const employee = await Employee.findById(assignedTo);
    if (!employee) {
      cleanupUploadedFile(req);
      return res.status(404).json({ success: false, message: 'الموظف غير موجود' });
    }

    // تحقّق من التاريخ
    const parsedDueDate = parseISODate(dueDate);
    if (!parsedDueDate) {
      cleanupUploadedFile(req);
      return res.status(400).json({ success: false, message: 'التاريخ غير صالح (استخدم YYYY-MM-DD)' });
    }

    // تجهيز المرفق (ملف واحد)
    const attachments = req.file ? [{
      filename: req.file.filename,
      originalname: req.file.originalname,
      path: req.file.path
    }] : [];

    const task = new Task({
      title,
      description,
      assignedTo,
      assignedBy: req.user.id, // يفترض أن authenticate بيضيف user
      dueDate: parsedDueDate,
      attachments,
 
    });

    await task.save();

    // Populate موحّد
    await task.populate([
      { path: 'assignedBy', select: 'name  email' },
      {
        path: 'assignedTo',
        populate: { path: 'user', select: 'name  email role' }
      }
    ]);

    res.status(201).json({
      success: true,
      message: 'تم إنشاء المهمة بنجاح',
      data: task
    });
  } catch (error) {
    // امسح الملف لو الرفع تم والإنشاء فشل
    cleanupUploadedFile(req);
    res.status(400).json({
      success: false,
      message: 'خطأ في إنشاء المهمة',
      error: error.message
    });
  }
};

// PATCH update task (يدعم إضافة/استبدال مرفق واحد إضافي)
const updateTask = async (req, res) => {
  try {
    const taskId = req.params.id;
    const { title, description, dueDate, assignDate } = req.body || {};

    const task = await Task.findById(taskId);
    if (!task) {
      cleanupUploadedFile(req);
      return res.status(404).json({ success: false, message: 'المهمة غير موجودة' });
    }

    if (title) task.title = title;
    if (description) task.description = description;
 

    if (dueDate) {
      const parsedDueDate = parseISODate(dueDate);
      if (!parsedDueDate) {
        cleanupUploadedFile(req);
        return res.status(400).json({ success: false, message: 'تاريخ الاستحقاق غير صالح (YYYY-MM-DD)' });
      }
      task.dueDate = parsedDueDate;
    }

    if (assignDate) {
      const parsedAssign = parseISODate(assignDate);
      if (!parsedAssign) {
        cleanupUploadedFile(req);
        return res.status(400).json({ success: false, message: 'تاريخ الإسناد غير صالح (YYYY-MM-DD)' });
      }
      task.assignDate = parsedAssign;
    }

    // إضافة مرفق جديد لو موجود (ملف واحد)
    if (req.file) {
      task.attachments.push({
        filename: req.file.filename,
        originalname: req.file.originalname,
        path: req.file.path
      });
    }

    await task.save();

    await task.populate([
      { path: 'assignedBy', select: 'fullName name email' },
      {
        path: 'assignedTo',
        populate: { path: 'user', select: 'fullName name email role' }
      }
    ]);

    res.json({ success: true, message: 'تم تحديث المهمة بنجاح', data: task });
  } catch (error) {
    cleanupUploadedFile(req);
    res.status(400).json({
      success: false,
      message: 'خطأ في تحديث المهمة',
      error: error.message
    });
  }
};

// DELETE task
const deleteTask = async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      return res.status(404).json({ success: false, message: 'المهمة غير موجودة' });
    }

    // (اختياري) مسح ملفات المرفقات من الديسك
    if (task.attachments && task.attachments.length) {
      task.attachments.forEach(att => {
        if (att.path) {
          fs.unlink(att.path, (err) => {
            if (err) console.error('تعذر مسح المرفق:', att.path, err.message);
          });
        }
      });
    }

    await Task.findByIdAndDelete(req.params.id);

    res.json({ success: true, message: 'تم حذف المهمة بنجاح' });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'خطأ في حذف المهمة',
      error: error.message
    });
  }
};

// GET task statistics
const tasksOverview = async (req, res) => {
  try {
    const totalTasks = await Task.countDocuments();
    const completedTasks = await Task.countDocuments({ status: 'مكتملة' });
    const inProgressTasks = await Task.countDocuments({ status: 'قيد العمل' });
    const overdueTasks = await Task.countDocuments({ status: 'متأخرة' });

    const stats = {
      total: totalTasks,
      completed: completedTasks,
      inProgress: inProgressTasks,
      overdue: overdueTasks,
      completionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0
    };

    res.json({ success: true, data: stats });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'خطأ في استرجاع إحصائيات المهام',
      error: error.message
    });
  }
};

// GET task statistics لفرع معين بس 
const tasksOverviewForMyBranch = async (req, res) => {
  try {
    // جلب بيانات المستخدم الحالي مع الفرع
    const user = await Employee.findOne({ user: req.user._id }).populate("workplace");
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "المستخدم غير موجود"
      });
    }

    if (!user.workplace) {
      return res.status(400).json({
        success: false,
        message: "المستخدم ليس مرتبطًا بأي فرع"
      });
    }

    const branchId = user.workplace._id;

    // جلب كل الموظفين في نفس الفرع
    const myBranchEmployees = await Employee.find({ workplace: branchId }).select("_id");
    const employeeIds = myBranchEmployees.map(e => e._id);

    // حساب الإحصائيات للمهام الخاصة بهم فقط
    const totalTasks = await Task.countDocuments({ assignedTo: { $in: employeeIds } });
    const completedTasks = await Task.countDocuments({ assignedTo: { $in: employeeIds }, status: "مكتملة" });
    const inProgressTasks = await Task.countDocuments({ assignedTo: { $in: employeeIds }, status: "قيد العمل" });
    const overdueTasks = await Task.countDocuments({ assignedTo: { $in: employeeIds }, status: "متأخرة" });

    const stats = {
      total: totalTasks,
      completed: completedTasks,
      inProgress: inProgressTasks,
      overdue: overdueTasks,
      completionRate: totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0,
      nonCompletionRate: totalTasks > 0 ? Math.round(((overdueTasks+inProgressTasks) / totalTasks) * 100) : 0
    };

    res.json({ success: true, data: stats });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "خطأ في استرجاع إحصائيات المهام",
      error: error.message
    });
  }
};


// single task by id
const getTaskById = async (req, res) => {
  try {
    const taskId = req.params.id;

    const task = await Task.findById(taskId)
      .populate('assignedTo', 'name email') // أو زوّدي أي فيلد موجود عندك في Employee
      .populate('assignedBy', 'name email'); // من User

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'المهمة غير موجودة'
      });
    }

    res.json({
      success: true,
      data: task
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'خطأ في استرجاع المهمة',
      error: error.message
    });
  }
};

// get tasksState ( نسبة التاسكات المكتملة والغير مكتملة خلال شهر وسنة)


const getTasksStats = async (req, res) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const endOfYear = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
    const startOfDay = new Date(now);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(now);
    endOfDay.setHours(23, 59, 59, 999);

    // helper function
    const calculateStats = (tasks) => {
      const total = tasks.length;
      const completed = tasks.filter(t => t.status === "مكتملة").length;
      const inProgress = tasks.filter(t => t.status === "قيد العمل").length;
      const overdue = tasks.filter(t => t.status === "متأخرة").length;
      const notCompleted = inProgress + overdue;

      return {
        total,
        completed,
        inProgress,
        overdue,
        notCompleted,
        percentages: {
          completed: total ? ((completed / total) * 100).toFixed(2) : "0.00",
          inProgress: total ? ((inProgress / total) * 100).toFixed(2) : "0.00",
          overdue: total ? ((overdue / total) * 100).toFixed(2) : "0.00",
          notCompleted: total ? ((notCompleted / total) * 100).toFixed(2) : "0.00"
        }
      };
    };

    // اجمالي
    const allTasks = await Task.find();
    const allStats = calculateStats(allTasks);

    // الشهر
    const monthlyTasks = await Task.find({
      assignDate: { $gte: startOfMonth, $lte: endOfMonth }
    });
    const monthlyStats = calculateStats(monthlyTasks);

    // السنة
    const yearlyTasks = await Task.find({
      assignDate: { $gte: startOfYear, $lte: endOfYear }
    });
    const yearlyStats = calculateStats(yearlyTasks);

    // اليوم
    const dailyTasks = await Task.find({
      assignDate: { $gte: startOfDay, $lte: endOfDay }
    });
    const dailyStats = calculateStats(dailyTasks);

    res.json({
      all: allStats,
      monthly: monthlyStats,
      yearly: yearlyStats,
      daily: dailyStats
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server Error" });
  }
};


module.exports = {
  upload,          // استخدم في الراوتر: upload.single('attachment')
  getAlltasks,
  getAllTasksForMyBranch,
  getTaskById,
  createTasks,
  taskByemployee,
  updateTask,
  deleteTask,
  tasksOverview ,
  getTasksStats ,tasksOverviewForMyBranch
};
