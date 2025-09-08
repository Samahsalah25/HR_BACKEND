// features/meetings/meeting.controller.js
const Meeting = require("../models/Meeting");
const Employee = require("../models/employee");
const { cleanupUploadedFile } = require("../../utlis/cleanupUploadedFile");

const createMeeting = async (req, res) => {
  try {
    const {
      title,
      subTitle,
      description,
      startTime,
      endTime,
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
        allowed = true; // المانجر يقدر مع أي حد
      } else if (creatorRole === "EMPLOYEE") {
        if (participantEmp._id.equals(creatorEmp._id)) {
          allowed = true; // مع نفسه
        } else if (
          creatorEmp.department &&
          participantEmp.department &&
          creatorEmp.department.equals(participantEmp.department) &&
          participantEmp.user.role === "EMPLOYEE"
        ) {
          allowed = true; // زميل في نفس القسم (ولازم EMPLOYEE)
        } else if (
          creatorEmp.manager &&
          participantEmp._id.equals(creatorEmp.manager._id)
        ) {
          allowed = true; // مع المانجر المباشر
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
// controllers/meetingController.js
const getMyMeetings = async (req, res) => {
  try {
    const { date } = req.query;
    if (!date) {
      return res.status(400).json({ success: false, message: "برجاء تحديد التاريخ" });
    }

    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const emp = await Employee.findOne({ user: req.user._id });
    if (!emp) {
      return res.status(404).json({ success: false, message: "الموظف غير موجود" });
    }

    const meetings = await Meeting.find({
      $and: [
        {
          $or: [
            { createdBy: emp._id },
            { participants: emp._id }
          ]
        },
        { startTime: { $gte: startOfDay, $lte: endOfDay } }
      ]
    })
      .populate("createdBy", "name") // هنجيب بس الاسم
      .populate("participants", "name") // هنجيب بس الاسم
      .select("title startTime endTime status createdBy participants") // الحقول المطلوبة فقط
      .lean();

 const formatExact = (date) => {
  const d = new Date(date);
  let hours = d.getUTCHours(); 
  let minutes = d.getUTCMinutes();

  // نجهز ص/م
  const ampm = hours >= 12 ? "م" : "ص";
  hours = hours % 12 || 12; 
  minutes = minutes.toString().padStart(2, "0");

  return `${hours}:${minutes} ${ampm}`;
};


    // نجهز الداتا زي ما انتي عايزاها بالظبط
   const formatted = meetings.map(meeting => ({
  time: `${formatExact(meeting.startTime)} - ${formatExact(meeting.endTime)}`,
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


module.exports = { createMeeting ,getMyMeetings};
