// features/meetings/meeting.controller.js
const Meeting = require("../models/Meeting");
const Employee = require("../models/employee");
const { cleanupUploadedFile } = require("../../utlis/cleanupUploadedFile");
const { io, onlineUsers } = require("../../server");
const Notification = require("../models/notification");
const createMeeting = async (req, res) => {
  try {
    const {
      title,
      subTitle,
      description,
      day,        // "YYYY-MM-DD"
      startTime,  // "HH:mm"
      endTime,    // "HH:mm"
      type,
      meetingLink,
      participants,
      repeat,
      status
    } = req.body;

    // جلب بيانات الـ creator
    const creatorEmp = await Employee.findOne({ user: req.user._id })
      .populate("department workplace manager user");
    if (!creatorEmp) {
      cleanupUploadedFile(req);
      return res.status(404).json({ success: false, message: "المستخدم غير مرتبط بموظف" });
    }

    const creatorRole = req.user.role;

    // التحقق من صلاحيات المشاركين
    for (let participantId of participants) {
      const participantEmp = await Employee.findById(participantId).populate("department user");

      if (!participantEmp) {
        cleanupUploadedFile(req);
        return res.status(404).json({ success: false, message: "مشارك غير موجود" });
      }

      let allowed = false;

      if (creatorRole === "Manager") {
        allowed = true;
      } else if (creatorRole === "EMPLOYEE") {
        if (participantEmp._id.equals(creatorEmp._id)) {
          allowed = true;
        } else if (
          creatorEmp.department &&
          participantEmp.department &&
          creatorEmp.department.equals(participantEmp.department) &&
          participantEmp.user.role === "EMPLOYEE"
        ) {
          allowed = true;
        } else if (
          creatorEmp.manager &&
          participantEmp._id.equals(creatorEmp.manager._id)
        ) {
          allowed = true;
        }
      }

      if (!allowed) {
        cleanupUploadedFile(req);
        return res.status(403).json({
          success: false,
          message: `غير مسموح لك بعمل ميتنج مع ${participantEmp.name}`,
        });
      }
    }

    // تجهيز المرفقات
    const attachments = req.file
      ? [
          {
            filename: req.file.filename,
            originalname: req.file.originalname,
            path: `/uploads/meetings/${req.file.filename}`,
          },
        ]
      : [];

    // إنشاء الميتنج
    const meeting = new Meeting({
      title,
      subTitle,
      description,
      day,
      startTime,
      endTime,
      type,
      meetingLink,
      participants,
      repeat,
      status,
      createdBy: creatorEmp._id,
      attachments,
    });

    await meeting.save();



//  إرسال إشعار للمشاركين
const io = req.app.get("io");
const onlineUsers = req.app.get("onlineUsers");

for (let participantId of participants) {
  const notification = await Notification.create({
    employee: participantId,
    type: "meeting",
    message: `تمت إضافتك إلى اجتماع بعنوان "${title}" يوم ${day}`,
    link: `/meetings/${meeting._id}`,
  });

  const socketId = onlineUsers.get(participantId.toString());
  if (socketId) {
    io.to(socketId).emit("notification", notification);
  }
}






    res.status(201).json({
      success: true,
      message: "تم إنشاء الميتنج بنجاح",
      data: meeting,
    });
  } catch (error) {
    cleanupUploadedFile(req);
    res.status(500).json({
      success: false,
      message: "خطأ في إنشاء الميتنج",
      error: error.message,
    });
  }
};


const getMyMeetings = async (req, res) => {
  try {
    const { date } = req.query;
    if (!date) {
      return res.status(400).json({ success: false, message: "برجاء تحديد التاريخ" });
    }

    // تحديد بداية ونهاية اليوم
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const emp = await Employee.findOne({ user: req.user._id });
    if (!emp) {
      return res.status(404).json({ success: false, message: "الموظف غير موجود" });
    }

    // جلب الاجتماعات ضمن اليوم المحدد
    const meetings = await Meeting.find({
      $or: [
        { createdBy: emp._id },
        { participants: emp._id }
      ],
      day: { $gte: startOfDay, $lte: endOfDay }  // range query لكل اليوم
    })
      .populate("createdBy", "name")
      .populate("participants", "name")
      .select("_id title startTime endTime status createdBy participants")
      .lean();

    // تحويل الوقت لصيغة HH:mm ص/م
    const formatTime = (timeStr) => {
      const [hourStr, minStr] = timeStr.split(":");
      let hour = parseInt(hourStr, 10);
      const minute = minStr.padStart(2, "0");
      const ampm = hour >= 12 ? "م" : "ص";
      hour = hour % 12 || 12;
      return `${hour}:${minute} ${ampm}`;
    };

    const formatted = meetings.map(meeting => ({
       _id: meeting._id ,
      time: `${formatTime(meeting.startTime)} - ${formatTime(meeting.endTime)}`,
      status: meeting.status === "confirmed" ? "مؤكدة" : "ملغية",
      title: meeting.title,
      createdBy: meeting.createdBy?.name || "غير معروف",
      participants: meeting.participants.map(p => p.name),
    }));

    res.status(200).json({
      success: true,
      count: formatted.length,
      data: formatted,
    });

  } catch (error) {
    res.status(500).json({
      success: false,
      message: "خطأ في جلب الاجتماعات",
      error: error.message,
    });
  }
};
const getMeetingById = async (req, res) => {
  try {
    const { id } = req.params;

    const meeting = await Meeting.findById(id)
      .populate("createdBy", "name jobTitle")
      .populate("participants", "name jobTitle");

    if (!meeting) {
      return res.status(404).json({
        success: false,
        message: "الاجتماع غير موجود",
      });
    }

    res.json({
      success: true,
      data: meeting,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "خطأ في استرجاع الاجتماع",
      error: error.message,
    });
  }
};

const updateMeeting = async (req, res) => {
  try {
    const { id } = req.params;

    

    // هات الميتنج
    const meeting = await Meeting.findById(id);
    if (!meeting) {
      return res.status(404).json({
        success: false,
        message: "الاجتماع غير موجود",
      });
    }

    // هات الموظف اللي عامل الريكويست
    const emp = await Employee.findOne({ user: req.user._id });
    if (!emp) {
      return res.status(404).json({
        success: false,
        message: "المستخدم غير مرتبط بموظف",
      });
    }

    // تحقق إنه هو الـ creator
    if (!meeting.createdBy.equals(emp._id)) {
      return res.status(403).json({
        success: false,
        message: "غير مسموح لك بتعديل هذا الاجتماع",
      });
    }

    // حدّث الاجتماع
    Object.assign(meeting, req.body);

    await meeting.save();

    res.json({
      success: true,
      message: "تم تحديث الاجتماع بنجاح",
      data: meeting,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "خطأ في تحديث الاجتماع",
      error: error.message,
    });
  }
};
const deleteMeeting = async (req, res) => {
  try {
    const { id } = req.params;

    const meeting = await Meeting.findById(id);
    if (!meeting) {
      return res.status(404).json({ success: false, message: "الاجتماع غير موجود" });
    }

    // هات الموظف اللي عامل الريكويست
    const emp = await Employee.findOne({ user: req.user._id });
    if (!emp) {
      return res.status(404).json({ success: false, message: "المستخدم غير مرتبط بموظف" });
    }

    // تحقق إنه الـ creator
    if (!meeting.createdBy.equals(emp._id)) {
      return res.status(403).json({
        success: false,
        message: "غير مسموح لك بحذف هذا الاجتماع",
      });
    }

    // لازم يبقى Cancelled عشان يتحذف
    if (meeting.status !== "cancelled") {
      return res.status(400).json({
        success: false,
        message: "لا يمكن حذف اجتماع مؤكد، يجب إلغاءه أولا",
      });
    }

    await meeting.deleteOne();

    res.json({
      success: true,
      message: "تم حذف الاجتماع بنجاح",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "خطأ في حذف الاجتماع",
      error: error.message,
    });
  }
};

module.exports = { createMeeting, getMyMeetings ,getMeetingById ,updateMeeting ,deleteMeeting};
