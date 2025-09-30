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
const cron = require("node-cron");
const Branch = require("../Admin/models/branchSchema");
const Employee = require("../Admin/models/employee");
const Attendance = require("../Admin/models/Attendance");
const Request = require("../Admin/models/requestModel");
const { DateTime } = require("luxon");

function isWeekend(day, weekendDays) {
  return weekendDays.includes(day);
}

const setupAttendanceCron = () => {
  Branch.find().then(branches => {
    branches.forEach(branch => {
      const [startHour, startMinute] = branch.workStart.split(":").map(Number);

      // الكرون يرن بعد ساعة من بداية الدوام
      const cronHour = startHour + 1;
      const cronMinute = startMinute;

      cron.schedule(`${cronMinute} ${cronHour} * * *`, async () => {
        try {
          console.log(`⏰ Running auto-absence for branch ${branch.name}`);

          const nowUTC = DateTime.utc();
          const dayOfWeek = nowUTC.weekday % 7;
          if (isWeekend(dayOfWeek, branch.weekendDays)) return;

          const employees = await Employee.find({ workplace: branch._id });

          for (const employee of employees) {
            const startOfDayUTC = nowUTC.startOf("day").toJSDate();
            const endOfDayUTC = nowUTC.endOf("day").toJSDate();

            const attendance = await Attendance.findOne({
              employee: employee._id,
              date: { $gte: startOfDayUTC, $lte: endOfDayUTC }
            });

            if (!attendance) {
              const leave = await Request.findOne({
                employee: employee._id,
                type: "إجازة",
                status: "مقبول",
                "leave.startDate": { $lte: endOfDayUTC },
                "leave.endDate": { $gte: startOfDayUTC }
              });

              if (!leave) {
                await Attendance.create({
                  employee: employee._id,
                  branch: branch._id,
                  date: nowUTC.toJSDate(),
                  status: "غائب"
                });

                console.log(` Marked absent: ${employee._id} at branch ${branch.name}`);
              }
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
