// features/meetings/meeting.controller.js
const Meeting = require("../models/Meeting");
const Employee = require("../models/employee");
const { cleanupUploadedFile } = require("../../utlis/cleanupUploadedFile");
const { io, onlineUsers } = require("../../server");
const Notification = require("../models/notification");
const mongoose = require("mongoose");

const createMeeting = async (req, res) => {
  try {
    let {
      title, subTitle, description, day, startTime, endTime,
      type, meetingLink, participants, repeat, status
    } = req.body;
if (typeof participants === "string") {
  try {
    participants = JSON.parse(participants);
  } catch {
    participants = [];
  }
}

if (typeof repeat === "string") {
  try {
    repeat = JSON.parse(repeat);
  } catch {
    repeat = { isRepeated: false };
  }
}
    const creatorEmp = await Employee.findOne({ user: req.user._id });
    if (!creatorEmp) return res.status(404).json({ success: false, message: "المستخدم غير مرتبط بموظف" });

    const attachments = req.file
      ? [{ filename: req.file.filename, originalname: req.file.originalname, path: `/uploads/meetings/${req.file.filename}` }]
      : [];

    const io = req.app.get("io");
    const onlineUsers = req.app.get("onlineUsers");

    // إنشاء الـ origin أولاً
    const originMeeting = new Meeting({
      title, subTitle, description, day, startTime, endTime,
      type, meetingLink, participants, status, attachments,
      repeat: repeat ? { ...repeat, repeatOriginId: null } : { isRepeated: false },
      createdBy: creatorEmp._id
    });

    await originMeeting.save();
    const meetingsCreated = [originMeeting];

    if (repeat?.isRepeated) {
      const getNextDate = (currentDate, frequency) => {
        const next = new Date(currentDate);
        if (frequency === "daily") next.setDate(next.getDate() + 1);
        if (frequency === "weekly") next.setDate(next.getDate() + 7);
        if (frequency === "monthly") next.setMonth(next.getMonth() + 1);
        return next;
      };

      let currentDate = new Date(day);
      const endDate = repeat.repeatEndDate ? new Date(repeat.repeatEndDate) : new Date(day);

      while (true) {
        currentDate = getNextDate(currentDate, repeat.frequency);
        if (currentDate > endDate) break;

        const newMeeting = new Meeting({
          title, subTitle, description,
          day: currentDate, startTime, endTime, type, meetingLink,
          participants, attachments,
          repeat: { ...repeat, repeatOriginId: originMeeting._id }, // مهم: جوه repeat
          status, createdBy: creatorEmp._id
        });

        await newMeeting.save();
        meetingsCreated.push(newMeeting);
      }
    }

    // إشعارات لكل مشارك
    for (let participantId of participants) {
      const baseMsg = repeat?.isRepeated
        ? `تمت إضافتك إلى اجتماع متكرر بعنوان "${title}" يبدأ من ${new Date(day).toLocaleDateString()} ويتكرر ${repeat.frequency} حتى ${new Date(repeat.repeatEndDate).toLocaleDateString()}`
        : `تمت إضافتك إلى اجتماع بعنوان "${title}" يوم ${new Date(day).toLocaleDateString()}`;

      const notification = await Notification.create({
        employee: participantId,
        type: "meeting",
        message: baseMsg,
      link: `/employee/meetings`,
      });

      const socketId = onlineUsers.get(participantId.toString());
      if (socketId) io.to(socketId).emit("notification", notification);
    }
console.log("📌 Meeting Saved:", meetingsCreated);

    res.status(201).json({
      success: true,
      message: repeat?.isRepeated
        ? `تم إنشاء ${meetingsCreated.length} ميتنجات متكررة مع إشعار واحد`
        : "تم إنشاء الميتنج بنجاح مع إشعار",
      data: meetingsCreated,
    });

  } catch (error) {
    res.status(500).json({ success: false, message: "خطأ في إنشاء الميتنج", error: error.message });
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

    // جلب الاجتماع بالكامل
    const meeting = await Meeting.findById(id)
      .populate({
        path: "createdBy",
        select: "_id name user jobTitle",
      })
      .populate("participants", "_id name jobTitle")
      .lean(); // تحويله لكائن عادي لتسهيل التعامل مع الحقول

    if (!meeting) {
      return res.status(404).json({
        success: false,
        message: "الاجتماع غير موجود",
      });
    }

    // لو attachments موجودة، نظهرها كاملة
    const formattedMeeting = {
      ...meeting,
      attachments: meeting.attachments?.map(att => ({
        _id: att._id,
        filename: att.filename,
        originalname: att.originalname,
        path: att.path,
        url: `/uploads/meetings/${att.filename}`, // رابط مباشر للـ frontend
      })) || [],
    };

    res.json({
      success: true,
      data: formattedMeeting,
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
 let { title, subTitle, description, day, startTime, endTime,
      type, meetingLink, participants, repeat, status } = req.body;


if (typeof participants === "string") {
  try {
    participants = JSON.parse(participants);
  } catch {
    participants = [];
  }
}

if (typeof repeat === "string") {
  try {
    repeat = JSON.parse(repeat);
  } catch {
    repeat = { isRepeated: false };
  }
}



    const meeting = await Meeting.findById(id);
    if (!meeting) return res.status(404).json({ success: false, message: "الاجتماع غير موجود" });

    const emp = await Employee.findOne({ user: req.user._id });
    if (!emp) return res.status(404).json({ success: false, message: "المستخدم غير مرتبط بموظف" });
    if (!meeting.createdBy.equals(emp._id)) return res.status(403).json({ success: false, message: "غير مسموح لك بتعديل هذا الاجتماع" });

    const io = req.app.get("io");
    const onlineUsers = req.app.get("onlineUsers");
//attachments 
const attachments = req.file
  ? [{ filename: req.file.filename, originalname: req.file.originalname, path: `/uploads/meetings/${req.file.filename}` }]
  : meeting.attachments; // لو مفيش ملف جديد نخلي القديم



    meeting.title = title ?? meeting.title;
    meeting.subTitle = subTitle ?? meeting.subTitle;
    meeting.description = description ?? meeting.description;
    meeting.day = day ?? meeting.day;
    meeting.startTime = startTime ?? meeting.startTime;
    meeting.endTime = endTime ?? meeting.endTime;
    meeting.type = type ?? meeting.type;
    meeting.meetingLink = meetingLink ?? meeting.meetingLink;
    meeting.participants = participants ?? meeting.participants;
    meeting.status = status ?? meeting.status;
meeting.attachments = attachments;

    let regenerateOccurrences = false;
    if (repeat) {
      if (
        repeat.isRepeated !== meeting.repeat.isRepeated ||
        repeat.frequency !== meeting.repeat.frequency ||
        new Date(repeat.repeatEndDate).getTime() !== new Date(meeting.repeat.repeatEndDate).getTime()
      ) regenerateOccurrences = true;

      meeting.repeat = repeat;
    }

    await meeting.save();

    // إعادة توليد الـ occurrences لو محتاج
    if (regenerateOccurrences && repeat.isRepeated) {
      // حذف الـ occurrences القديمة المرتبطة بالـ origin
      await Meeting.deleteMany({ "repeat.repeatOriginId": meeting._id });

      const getNextDate = (currentDate, frequency) => {
        const next = new Date(currentDate);
        if (frequency === "daily") next.setDate(next.getDate() + 1);
        if (frequency === "weekly") next.setDate(next.getDate() + 7);
        if (frequency === "monthly") next.setMonth(next.getMonth() + 1);
        return next;
      };

      let currentDate = new Date(meeting.day);
      const endDate = repeat.repeatEndDate ? new Date(repeat.repeatEndDate) : new Date(meeting.day);

      while (true) {
        currentDate = getNextDate(currentDate, repeat.frequency);
        if (currentDate > endDate) break;

        const newMeeting = new Meeting({
          title: meeting.title, subTitle: meeting.subTitle, description: meeting.description,
          day: currentDate, startTime: meeting.startTime, endTime: meeting.endTime,
          type: meeting.type, meetingLink: meeting.meetingLink, participants: meeting.participants,
          attachments: meeting.attachments,
          repeat: { ...meeting.repeat, repeatOriginId: meeting._id }, // مهم: جوه repeat
          status: meeting.status,
          createdBy: meeting.createdBy
        });

        await newMeeting.save();
      }
    }

    // إشعارات
    for (let participantId of meeting.participants) {
      const baseMsg = meeting.repeat.isRepeated
        ? `تم تعديل اجتماع متكرر بعنوان "${meeting.title}" يبدأ من ${meeting.day.toLocaleDateString()} ويتكرر ${meeting.repeat.frequency} حتى ${new Date(meeting.repeat.repeatEndDate).toLocaleDateString()}`
        : `تم تعديل الاجتماع بعنوان "${meeting.title}" يوم ${meeting.day.toLocaleDateString()}`;

      const notification = await Notification.create({
        employee: participantId,
        type: "meeting",
        message: baseMsg,
       link: `/employee/meetings`,

      });

      const socketId = onlineUsers.get(participantId.toString());
      if (socketId) io.to(socketId).emit("notification", notification);
    }
console.log('u[dated metting' ,meeting)
    res.json({ success: true, message: "تم تحديث الاجتماع بنجاح", data: meeting });

  } catch (error) {
    res.status(500).json({ success: false, message: "خطأ في تحديث الاجتماع", error: error.message });
  }
};

const getallMyMeetings = async (req, res) => {
  try {
   
    const emp = await Employee.findOne({ user: req.user._id });
    if (!emp) {
      return res.status(404).json({ success: false, message: "الموظف غير موجود" });
    }

    //  جلب الاجتماعات المتعلقة بالموظف
    const meetings = await Meeting.find({
      $or: [
        { createdBy: emp._id },
        { participants: emp._id }
      ]
    })
      .populate("createdBy", "_id name")
      .populate("participants", "name")
      .select("_id title startTime endTime day status createdBy participants")
      .lean();

    // \\ دالة لتحويل الوقت من "HH:mm" لصيغة 12 ساعة ص/م
    const formatTime = (timeStr) => {
      if (!timeStr) return "00:00";
      const [hourStr, minStr] = timeStr.split(":");
      let hour = parseInt(hourStr, 10);
      const minute = minStr.padStart(2, "0");
      const ampm = hour >= 12 ? "م" : "ص";
      hour = hour % 12 || 12;
      return `${hour}:${minute} ${ampm}`;
    };

  
    const formatted = meetings.map(meeting => ({
      _id: meeting._id,
      date: meeting.day.toISOString().split("T")[0], // yyyy-mm-dd
      time: `${formatTime(meeting.startTime)} - ${formatTime(meeting.endTime)}`,
      status: meeting.status === "confirmed" ? "مؤكدة" : "ملغية",
      title: meeting.title,
      createdBy: {
        _id: meeting.createdBy?._id,
        name: meeting.createdBy?.name || "غير معروف"
      },
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








// delete metting (el canceled)
const deleteMeeting = async (req, res) => {
  try {
    const { id } = req.params;

    const meeting = await Meeting.findById(id);
    if (!meeting) {
      return res.status(404).json({ success: false, message: "الاجتماع غير موجود" });
    }

 
    const emp = await Employee.findOne({ user: req.user._id });
    if (!emp) {
      return res.status(404).json({ success: false, message: "المستخدم غير مرتبط بموظف" });
    }

    if (!meeting.createdBy.equals(emp._id)) {
      return res.status(403).json({ success: false, message: "غير مسموح لك بحذف هذا الاجتماع" });
    }

    // لو الاجتماع مش ملغي، نعمله Cancelled قبل الحذف
    if (meeting.status !== "cancelled") {
      meeting.status = "cancelled";
      await meeting.save();
    }

    await meeting.deleteOne();

    res.json({ success: true, message: "تم حذف الاجتماع بنجاح" });
  } catch (error) {
    res.status(500).json({ success: false, message: "خطأ في حذف الاجتماع", error: error.message });
  }
};


module.exports = { createMeeting, getMyMeetings  ,getallMyMeetings,getMeetingById ,updateMeeting ,deleteMeeting};
