// Admin/controllers/notificationController.js
const Notification = require("../models/notification"); 
const Employee = require("../models/employee"); 


async function resolveEmployeeId(req) {
  if (!req.user?._id) return null;
  const emp = await Employee.findOne({ user: req.user._id }).select("_id");
  return emp ? emp._id : null;
}

// ================== جلب الإشعارات ==================
exports.getNotifications = async (req, res) => {
  try {
    const employeeId = await resolveEmployeeId(req);
    if (!employeeId) {
      return res.status(401).json({ success: false, message: "غير مصرح" });
    }

    const limit = Math.min(parseInt(req.query.limit || "20", 10), 100);
    const skip = parseInt(req.query.skip || "0", 10);

    const notifications = await Notification.find({ employee: employeeId })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    const unreadCount = await Notification.countDocuments({
      employee: employeeId,
      read: false,
    });

    return res.json({ success: true, data: notifications, unreadCount });
  } catch (err) {
    console.error("getNotifications:", err);
    return res.status(500).json({
      success: false,
      message: "خطأ في جلب الإشعارات",
    });
  }
};

// ================== تعليم إشعار واحد كمقروء ==================
exports.markRead = async (req, res) => {
  try {
    const employeeId = await resolveEmployeeId(req);
    if (!employeeId) {
      return res.status(401).json({ success: false, message: "غير مصرح" });
    }

    const notif = await Notification.findOneAndUpdate(
      { _id: req.params.id, employee: employeeId },
      { $set: { read: true } },
      { new: true } // عشان يرجع النسخة بعد التعديل
    );

    if (!notif) {
      return res.status(404).json({ success: false, message: "الإشعار غير موجود" });
    }

    return res.json({ success: true, data: notif });
  } catch (err) {
    console.error("markRead:", err);
    return res.status(500).json({
      success: false,
      message: "خطأ في تحديث الإشعار",
    });
  }
};

// ================== تعليم كل الإشعارات كمقروءة ==================
exports.markAllRead = async (req, res) => {
  try {
    const employeeId = await resolveEmployeeId(req);
    if (!employeeId) {
      return res.status(401).json({ success: false, message: "غير مصرح" });
    }

    const result = await Notification.updateMany(
      { employee: employeeId, read: false },
      { $set: { read: true } }
    );

    return res.json({
      success: true,
      message: "تم تعليم كل الإشعارات كمقروءة",
      modifiedCount: result.modifiedCount, 
    });
  } catch (err) {
    console.error("markAllRead:", err);
    return res.status(500).json({
      success: false,
      message: "خطأ في تحديث الإشعارات",
    });
  }
};
