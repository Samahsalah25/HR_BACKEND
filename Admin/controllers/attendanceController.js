const Attendance = require('../models/Attendance');
const Employee = require('../models/employee');
const Branch = require('../models/branchSchema');

// دالة لحساب المسافة بالمتر بين نقطتين
function getDistanceFromLatLonInMeters(lat1, lon1, lat2, lon2) {
  const R = 6371000; 
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// Check-In endpoint
const checkIn = async (req, res) => {
  try {
    const userId = req.user._id;

    const employee = await Employee.findOne({ user: userId }).populate('workplace');
    if (!employee) return res.status(404).json({ message: 'الموظف غير موجود' });

    const branch = employee.workplace;
    if (!branch) return res.status(400).json({ message: 'الفرع غير موجود' });

    const { latitude, longitude } = req.body;

    // تحقق من الموقع
    const distance = getDistanceFromLatLonInMeters(
      latitude,
      longitude,
      branch.location.coordinates[1],
      branch.location.coordinates[0]
    );

    if (distance > 100) {
      return res.status(400).json({ message: 'أنت بعيد عن موقع الفرع' });
    }

    const now = new Date();

    // وقت بداية الدوام
    const branchStart = new Date();
    const [hour, minute] = branch.workStart.split(':').map(Number);
    branchStart.setHours(hour, minute, 0, 0);

    // gracePeriod
    const graceEnd = new Date(branchStart.getTime() + branch.gracePeriod * 60000);

    // allowedLateMinutes
    const lateEnd = new Date(branchStart.getTime() + branch.allowedLateMinutes * 60000);

    let status = 'حاضر';
    let lateMinutes = 0;

    if (now > graceEnd && now <= lateEnd) {
      status = 'متأخر';
      lateMinutes = Math.floor((now - branchStart) / 60000);
    } else if (now > lateEnd) {
      status = 'غائب';
      lateMinutes = Math.floor((now - branchStart) / 60000);
    }

    const attendance = await Attendance.create({
      employee: employee._id,
      branch: branch._id,
      date: now,
      status,
      checkIn: now,
      lateMinutes
    });

    res.status(201).json({ message: 'تم تسجيل الحضور', attendance });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'حدث خطأ أثناء تسجيل الحضور' });
  }
};

// Check-Out endpoint
const checkOut = async (req, res) => {
  try {
    const userId = req.user._id;
    const { latitude, longitude } = req.body;

    const employee = await Employee.findOne({ user: userId }).populate("workplace");
    if (!employee) return res.status(404).json({ message: "الموظف غير موجود" });

    const branch = employee.workplace;
    if (!branch) return res.status(400).json({ message: "الفرع غير موجود" });

    // تحقق من الموقع
    const distance = getDistanceFromLatLonInMeters(
      latitude,
      longitude,
      branch.location.coordinates[1],
      branch.location.coordinates[0]
    );

    if (distance > 100) {
      return res.status(400).json({ message: "لا يمكنك تسجيل الانصراف خارج الفرع" });
    }

    const now = new Date();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const attendance = await Attendance.findOne({
      employee: employee._id,
      date: { $gte: today }
    });

    if (!attendance) {
      return res.status(400).json({ message: "لم يتم تسجيل حضور لهذا اليوم" });
    }

    attendance.checkOut = now;
    await attendance.save();

    res.status(200).json({ message: "تم تسجيل الانصراف", attendance });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "حدث خطأ أثناء تسجيل الانصراف" });
  }
};

//


const getTodayAttendance = async (req, res) => {
  try {
    const employeeId = req.params.id;

    // 1️⃣ نحسب بداية اليوم ونهايته
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    // 2️⃣ نجيب حضور اليوم
    const todayAttendance = await Attendance.findOne({
      employee: employeeId,
      date: { $gte: todayStart, $lte: todayEnd }
    })
      .populate("employee", "name jobTitle")
      .populate("branch", "name");

    // 3️⃣ نجيب كل الحضور السابق (لحساب غياب وتأخير)
    const allAttendance = await Attendance.find({ employee: employeeId });

    const absences = allAttendance.filter(a => a.status === "غائب").length;
    const lates = allAttendance.filter(a => a.status === "متأخر").length;

    if (!todayAttendance) {
      return res.json({
        message: "لا يوجد حضور لهذا الموظف اليوم",
        absences,
        lates
      });
    }

    res.json({
      employee: todayAttendance.employee.name,
      branch: todayAttendance.branch.name,
      status: todayAttendance.status,
      checkIn: todayAttendance.checkIn,
      checkOut: todayAttendance.checkOut,
      absences,
      lates
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "حدث خطأ أثناء جلب بيانات الحضور" });
  }
};



module.exports = { checkIn, checkOut ,getTodayAttendance };
