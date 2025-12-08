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
    select: 'fullName department',   //  رجع بس الاسم والقسم
    populate: {
      path: 'user',
      select: ' name email'                //  رجع بس الإيميل
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


//
const createTasks = async (req, res) => {
  try {
    const { title, description, assignedTo, dueDate ,priority,assignDate } = req.body || {};
        console.log(" Payload from frontend:", req.body)

    if (!title || !description || !assignedTo || !dueDate) {
      cleanupUploadedFile(req);
      return res.status(400).json({
        success: false,
        message: 'حقول مطلوبة مفقودة: title, description, assignedTo, dueDate'
      });
    }

    // جلب بيانات الموظف المستلم مع المدير، القسم، workplace، والـ user (عشان الـ role)
    const assignedEmployee = await Employee.findById(assignedTo)
      .populate('manager department workplace user');
    if (!assignedEmployee) {
      cleanupUploadedFile(req);
      return res.status(404).json({ success: false, message: 'الموظف غير موجود' });
    }

    const parsedDueDate = parseISODate(dueDate);
    if (!parsedDueDate) {
      cleanupUploadedFile(req);
      return res.status(400).json({ success: false, message: 'التاريخ غير صالح (استخدم YYYY-MM-DD)' });
    }

    // جلب بيانات الموظف اللي عامل العملية مع قسمه وفرعه، و populate user عشان الـ role
    const creatorEmp = await Employee.findOne({ user: req.user._id })
      .populate('department workplace user');
    if (!creatorEmp) {
      cleanupUploadedFile(req);
      return res.status(404).json({ success: false, message: 'المستخدم غير مرتبط بموظف' });
    }

    const creatorRole = req.user.role;

    console.log('creatorRole:', creatorRole);
    console.log('creatorEmp ID:', creatorEmp._id);
    console.log('assignedEmployee ID:', assignedEmployee._id);
    console.log('assignedEmployee role:', assignedEmployee.user.role);

    // ===== Checks حسب الدور =====
    let allowed = false;

    if (creatorRole === "HR") {
      allowed = true; // HR يقدر لأي موظف
    } else if (creatorRole === "Manager") {
      // يمكن للManager عمل تاسك لنفسه، للموظفين اللي تحت إدارته، وللمدراء في الأقسام التانية
      if (assignedEmployee._id.equals(creatorEmp._id)) {
        allowed = true; // لنفسه
        console.log('Allowed: Manager assigning to self');
      } else if (assignedEmployee.manager && assignedEmployee.manager._id.equals(creatorEmp._id)) {
        allowed = true; // direct reports
        console.log('Allowed: Manager assigning to direct report');
      } else if (assignedEmployee.user.role === "Manager" && !assignedEmployee.workplace._id.equals(creatorEmp.workplace._id)) {
        allowed = true; // مدراء في أقسام تانية
        console.log('Allowed: Manager assigning to Manager in another branch');
      }
    } else if (creatorRole === "EMPLOYEE") {
  // الموظف يقدر يعمل تاسك لنفسه، للموظفين اللي تحت إدارته، أو زملائه في نفس القسم (غير HR أو Manager)
  if (assignedEmployee._id.equals(creatorEmp._id)) {
    allowed = true; // لنفسه
    console.log('Allowed: Employee assigning to self');
  } else if (assignedEmployee.manager && assignedEmployee.manager._id.equals(creatorEmp._id)) {
    allowed = true; // direct reports
    console.log('Allowed: Employee assigning to direct report');
  } else if (
    assignedEmployee.department &&
    creatorEmp.department &&
    assignedEmployee.department.equals(creatorEmp.department) &&
    assignedEmployee.user.role !== "HR" &&
    assignedEmployee.user.role !== "Manager"
  ) {
    allowed = true; // أي موظف في نفس القسم لكنه مش HR أو Manager
    console.log('Allowed: Employee assigning to colleague in same department (not HR/Manager)');
  } else {
    allowed = false; // غير مسموح
    console.log('Not allowed: Employee cannot assign to HR or Manager or outside rules');
  }
}


    if (!allowed) {
      cleanupUploadedFile(req);
      return res.status(403).json({ success: false, message: 'غير مسموح لك بعمل تاسك لهذا الموظف' });
    }


    const attachments = req.file
      ? [
          {
            filename: req.file.filename,
            originalname: req.file.originalname,
            path: `/uploads/tasks/${req.file.filename}`
          }
        ]
      : [];

    const task = new Task({
      title,
      description,
      assignedTo,
      assignDate,
      assignedBy: req.user.id,
      dueDate: parsedDueDate,
      attachments ,
       priority,
    });

    await task.save();

    await task.populate([
      { path: 'assignedBy', select: 'name email' },
      { path: 'assignedTo', populate: { path: 'user', select: 'name email role' } }
    ]);

    res.status(201).json({
      success: true,
      message: 'تم إنشاء المهمة بنجاح',
      data: task
    });

  } catch (error) {
    cleanupUploadedFile(req);
    res.status(400).json({
      success: false,
      message: 'خطأ في إنشاء المهمة',
      error: error.message
    });
  }
};




// PATCH update task  
const updateTask = async (req, res) => {
  try {
    console.log("updateTask reached");

    const taskId = req.params.id;
    const { title, description, dueDate, assignDate, priority, status } = req.body || {};

    const task = await Task.findById(taskId);
    console.log("Task found:", task);

    if (!task) {
      cleanupUploadedFile(req);
      return res.status(404).json({ success: false, message: 'المهمة غير موجودة' });
    }

    const userId = req.user._id;
    const userRole = req.user.role;
    console.log('user', userId);
    console.log('role', userRole);

    // جلب الموظف المرتبط باليوزر الحالي
    const currentEmployee = await Employee.findOne({ user: userId });
    if (!currentEmployee) {
      return res.status(403).json({ success: false, message: 'الموظف غير موجود' });
    }
    const currentEmployeeId = currentEmployee._id;

    const assignedById = task.assignedBy; // User ID
    const assignedToId = task.assignedTo; // Employee ID
    console.log("assignedById:", assignedById);
    console.log("assignedToId:", assignedToId);

    // صلاحيات التعديل
    let canEditAll = false;
    let canEditStatusOnly = false;

    if (userRole === "EMPLOYEE") {
      if (assignedById.equals(userId)) {
        canEditAll = true; // هو اللي عمل المهمة
      } else if (assignedToId.equals(currentEmployeeId)) {
        canEditStatusOnly = true; // مسنودة له
      }
    } else {
      canEditAll = true; // Roles أخرى
    }

    if (!canEditAll && !canEditStatusOnly) {
      cleanupUploadedFile(req);
      return res.status(403).json({ success: false, message: 'غير مسموح لك بتحديث هذه المهمة' });
    }

    // تحديث الحقول
    if (canEditAll) {
      if (title) task.title = title;
      if (description) task.description = description;
      if (dueDate) {
        const parsedDueDate = parseISODate(dueDate);
        if (!parsedDueDate) {
          cleanupUploadedFile(req);
          return res.status(400).json({ success: false, message: 'تاريخ الاستحقاق غير صالح' });
        }
        task.dueDate = parsedDueDate;
      }
      if (assignDate) {
        const parsedAssign = parseISODate(assignDate);
        if (!parsedAssign) {
          cleanupUploadedFile(req);
          return res.status(400).json({ success: false, message: 'تاريخ الإسناد غير صالح' });
        }
        task.assignDate = parsedAssign;
      }
      if (priority) task.priority = priority;
    }

    // يمكن للموظف أو أي دور آخر تحديث الحالة
    if (status) {
      const allowedStatuses = ["قيد العمل", "مكتملة", "متأخرة"];
      if (!allowedStatuses.includes(status)) {
        cleanupUploadedFile(req);
        return res.status(400).json({
          success: false,
          message: `الستاتس غير صالح، القيم المسموحة: ${allowedStatuses.join(', ')}`
        });
      }
      task.status = status;

      // تحديث completedDate تلقائيًا عند الحالة مكتملة
      if (status === "مكتملة") {
        task.completedDate = new Date();
         task.progressPercentage = 100;
      } else {
        task.completedDate = null;
      }
    }

  
    if (req.file) {
      task.attachments = [{
        filename: req.file.filename,
        originalname: req.file.originalname,
        path: `/uploads/tasks/${req.file.filename}`
      }];
    }

    await task.save();
    console.log("Task after save:", task);

    // Populate للعرض النهائي
    await task.populate([
      { path: 'assignedBy', select: 'name email' },
      { path: 'assignedTo', select: 'name email' }
    ]);

    res.json({ success: true, message: 'تم تحديث المهمة بنجاح', data: task });

  } catch (error) {
    console.error("Error updating task:", error);
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

    // () مسح ملفات المرفقات من الديسك
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
      .populate('assignedTo', 'name email jobTitle user') 
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
const getTasksForMeOrCreated = async (req, res) => {
  try {
    const creatorEmp = await Employee.findOne({ user: req.user._id }).populate('department workplace user');
    if (!creatorEmp) return res.status(404).json({ success: false, message: 'المستخدم غير مرتبط بموظف' });

    let tasks;

    if (req.user.role === "HR") {
      // HR يشوف كل المهام
      tasks = await Task.find().populate('assignedBy assignedTo');
    } else if (req.user.role === "Manager") {
      // Manager يشوف:
      // 1- المهام اللي هي تحت إدارته
      // 2- المهام اللي هو كريتها
      // 3- المهام اللي assigned له
      const directReports = await Employee.find({ manager: creatorEmp._id }).select('_id');
      const reportIds = directReports.map(e => e._id);
      tasks = await Task.find({
        $or: [
          { assignedBy: creatorEmp.user._id },    // المهام اللي هو كريتها
          { assignedTo: { $in: reportIds } },     // المهام للموظفين تحته
          { assignedTo: creatorEmp._id }          // المهام اللي assigned له
        ]
      }).populate('assignedBy assignedTo');
    } else {
      // Employee يشوف:
      // 1- المهام اللي هو كريتها
      // 2- المهام اللي assigned له
      tasks = await Task.find({
        $or: [
          { assignedBy: creatorEmp.user._id },
          { assignedTo: creatorEmp._id }
        ]
      }).populate('assignedBy assignedTo');
    }

    res.json({ success: true, data: tasks });

  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'خطأ في جلب المهام', error: error.message });
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
  getTasksStats ,tasksOverviewForMyBranch ,
   getTasksForMeOrCreated
};
