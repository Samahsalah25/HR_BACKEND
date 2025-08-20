const cron = require("node-cron");
const Branch = require("../Admin/models/branchSchema");
const Employee = require("../Admin/models/employee");
const Attendance = require("../Admin/models/Attendance");

// دالة لمحوّل اليوم من رقم الأسبوع
function isWeekend(day, weekendDays) {
  return weekendDays.includes(day);
}

// Cron job لتسجيل الغياب تلقائياً
const setupAttendanceCron = () => {
  // نجيب كل الفروع
  Branch.find().then(branches => {
    branches.forEach(branch => {
      // الوقت الفعلي بعد السماح
      const [startHour, startMinute] = branch.workStart.split(":").map(Number);
      const allowedLate = branch.allowedLateMinutes || 30;

      const cronHour = startHour + Math.floor((startMinute + allowedLate) / 60);
      const cronMinute = (startMinute + allowedLate) % 60;

      // ضبط الكرون لكل فرع
      cron.schedule(`${cronMinute} ${cronHour} * * *`, async () => {
        try {
          console.log(`Running attendance check for branch ${branch.name}`);

          const today = new Date();
          const dayOfWeek = today.getDay(); // 0=Sun ... 6=Sat

          // لو يوم عطلة رسمي
          if (isWeekend(dayOfWeek, branch.weekendDays)) return;

          // نجيب كل الموظفين في الفرع
          const employees = await Employee.find({ workplace: branch._id });

          for (const employee of employees) {
            // شيك لو الموظف سجل حضور اليوم
            const startOfDay = new Date(today);
            startOfDay.setHours(0, 0, 0, 0);

            const attendance = await Attendance.findOne({
              employee: employee._id,
              date: { $gte: startOfDay }
            });

            if (!attendance) {
              // لو ما سجلش حضور → نعمله غياب
              await Attendance.create({
                employee: employee._id,
                branch: branch._id,
                date: today,
                status: "غائب"
              });

              console.log(`Marked absent: ${employee._id} at branch ${branch.name}`);
            }
          }
        } catch (err) {
          console.error("Error in attendance cron:", err);
        }
      });
    });
  });
};

module.exports = setupAttendanceCron;
