// const cron = require("node-cron");
// const Branch = require("../Admin/models/branchSchema");
// const Employee = require("../Admin/models/employee");
// const Attendance = require("../Admin/models/Attendance");
// const Request = require("../Admin/models/requestModel"); // موديل الطلبات
// const { DateTime } = require('luxon'); // استيراد Luxon

// // دالة لمحوّل اليوم من رقم الأسبوع
// function isWeekend(day, weekendDays) {
//   return weekendDays.includes(day);
// }

// // Cron job لتسجيل الغياب تلقائياً
// const setupAttendanceCron = () => {
//   Branch.find().then(branches => {
//     branches.forEach(branch => {
   
//       const [endHour, endMinute] = branch.workEnd.split(":").map(Number);

      
//       const cronHour = endHour + Math.floor((endMinute + 5) / 60);
//       const cronMinute = (endMinute + 5) % 60;

//       cron.schedule(`${cronMinute} ${cronHour} * * *`, async () => {
//         try {
//           console.log(`Running attendance check for branch ${branch.name}`);

         
//           const nowUTC = DateTime.utc();
//           const dayOfWeek = nowUTC.weekday % 7; 
//           if (isWeekend(dayOfWeek, branch.weekendDays)) return;

//           const employees = await Employee.find({ workplace: branch._id });

//           for (const employee of employees) {
           
//             const startOfDayUTC = nowUTC.startOf('day').toJSDate();
//             const endOfDayUTC = nowUTC.endOf('day').toJSDate();

//             const attendance = await Attendance.findOne({
//               employee: employee._id,
//               date: { $gte: startOfDayUTC, $lte: endOfDayUTC }
//             });

//             if (!attendance) {
//               const leave = await Request.findOne({
//                 employee: employee._id,
//                 type: "إجازة",
//                 status: "مقبول",
//                 "leave.startDate": { $lte: endOfDayUTC },
//                 "leave.endDate": { $gte: startOfDayUTC }
//               });

//               if (!leave) {
//                 await Attendance.create({
//                   employee: employee._id,
//                   branch: branch._id,
            
//                   date: nowUTC.toJSDate(), 
//                   status: "غائب"
//                 });

//                 console.log(`Marked absent: ${employee._id} at branch ${branch.name}`);
//               } else {
//                 console.log(`Employee ${employee._id} is on approved leave today`);
//               }
//             }
//           }
//         } catch (err) {
//           console.error("Error in attendance cron:", err);
//         }
//       });
//     });
//   });
// };

// module.exports = setupAttendanceCron;

const { DateTime } = require("luxon");
const cron = require("node-cron");
const Branch = require("../Admin/models/branchSchema");
const Employee = require("../Admin/models/employee");
const Attendance = require("../Admin/models/Attendance");
const Request = require("../Admin/models/requestModel");

// مجموعة لحفظ الفروع اللي اتعملها كرون بالفعل
const scheduledJobs = new Set();

function isWeekend(dayName, weekendDays) {
  return weekendDays.includes(dayName);
}

const setupAttendanceCron = () => {
  Branch.find()
    .then(branches => {
      branches.forEach(branch => {
        // منع تكرار الكرون لنفس الفرع
        if (scheduledJobs.has(branch._id.toString())) {
          console.log(`⚠️ Cron job already exists for branch: ${branch.branchName}`);
          return;
        }
        scheduledJobs.add(branch._id.toString());

        const [startHour, startMinute] = branch.workStart.split(":").map(Number);

        // بعد ساعة من بداية الدوام
        const cronHour = startHour + Math.floor((startMinute + 60) / 60);
        const cronMinute = (startMinute + 60) % 60;

        // إنشاء الكرون
        cron.schedule(`${cronMinute} ${cronHour} * * *`, async () => {
          try {
            const now = DateTime.now().setZone("Asia/Riyadh");
            const todayName = now.setLocale("ar").weekdayLong; // اسم اليوم بالعربي (مثلاً الجمعة)
            console.log(`🏁 Running absence cron for branch: ${branch.branchName} (${todayName}) at ${now.toFormat("HH:mm")}`);

            // لو اليوم دا إجازة أسبوعية للفرع
            if (isWeekend(todayName, branch.weekendDays)) {
              console.log(`⛱️ Skipping branch ${branch.branchName} (weekend: ${todayName})`);
              return;
            }

            // جلب الموظفين في الفرع
            const employees = await Employee.find({ workplace: branch._id });
            console.log(`👥 Found ${employees.length} employees in ${branch.branchName}`);

            for (const employee of employees) {
              const startOfDay = now.startOf("day").toJSDate();
              const endOfDay = now.endOf("day").toJSDate();

              // تحقق إن ما فيش سجل Attendance لنفس اليوم
              const existing = await Attendance.findOne({
                employee: employee._id,
                branch: branch._id,
                date: { $gte: startOfDay, $lte: endOfDay },
              });

              if (existing) {
                console.log(`↩️ Skipping ${employee.fullName || employee._id} (record exists today)`);
                continue;
              }

              // تحقق من وجود إجازة مقبولة للموظف
              const leave = await Request.findOne({
                employee: employee._id,
                type: "إجازة",
                status: "مقبول",
                "leave.startDate": { $lte: endOfDay },
                "leave.endDate": { $gte: startOfDay },
              });

              if (leave) {
                console.log(`✅ ${employee.fullName || employee._id} is on approved leave`);
                continue;
              }

              // إنشاء سجل غياب جديد
              await Attendance.create({
                employee: employee._id,
                branch: branch._id,
                date: now.toJSDate(),
                status: "غائب",
                createdAutomatically: true, // ممكن تستخدمها لتفرقي الغياب التلقائي من اليدوي
              });

              console.log(`🚫 Marked absent: ${employee.fullName || employee._id} (${branch.branchName})`);
            }
          } catch (err) {
            console.error("❌ Error in attendance cron:", err);
          }
        });

        console.log(`🕒 Cron job scheduled for ${branch.branchName} at ${cronHour}:${cronMinute}`);
      });
    })
    .catch(err => console.error("❌ Error fetching branches:", err));
};

module.exports = setupAttendanceCron;
