// scripts/initLeaveBalances.js
const mongoose = require("mongoose");
const Employee = require("../Admin/models/employee");
const LeaveBalance = require("../Admin/models/leaveBalanceModel");

(async () => {
  await mongoose.connect("mongodb://samahsalah2555:samahsalah2555@ac-syrodyh-shard-00-00.xpqnok3.mongodb.net:27017,ac-syrodyh-shard-00-01.xpqnok3.mongodb.net:27017,ac-syrodyh-shard-00-02.xpqnok3.mongodb.net:27017/?replicaSet=atlas-bfkn2s-shard-0&ssl=true&authSource=admin"); // غيري DB name

  const employees = await Employee.find();

  for (const emp of employees) {
    const exists = await LeaveBalance.findOne({ employee: emp._id });
    if (!exists) {
      await LeaveBalance.create({
        employee: emp._id,
        annual: 21,
        sick: 7,
        unpaid: 0
      });
      console.log(`رصيد اجازات اتعمل لـ ${emp.name}`);
    }
  }

  console.log("خلصت ✅");
  process.exit();
})();
