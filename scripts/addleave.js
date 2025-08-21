const Employee = require('../Admin/models/employee');
const LeaveBalance = require('../Admin/models/leaveBalanceModel');
const CompanyLeave = require('../Admin/models/leaveBalanceModel');
 const mongoose=require('mongoose')

// ربط السكريبت بقاعدة البيانات
const DB_URI = 'mongodb://samahsalah2555:samahsalah2555@ac-syrodyh-shard-00-00.xpqnok3.mongodb.net:27017,ac-syrodyh-shard-00-01.xpqnok3.mongodb.net:27017,ac-syrodyh-shard-00-02.xpqnok3.mongodb.net:27017/?replicaSet=atlas-bfkn2s-shard-0&ssl=true&authSource=admin'; // غيريها باسم قاعدة بياناتك

mongoose.connect(DB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('تم الاتصال بقاعدة البيانات بنجاح');
  addLeavesToExistingEmployees();
}).catch(err => {
  console.error('حدث خطأ في الاتصال بقاعدة البيانات:', err.message);
});
const addLeavesToExistingEmployees = async () => {
  try {
    const companyLeaves = await CompanyLeave.findOne();
    if (!companyLeaves) {
      throw new Error('رصيد الإجازات الافتراضي للشركة غير محدد');
    }

    const employees = await Employee.find();

    for (const emp of employees) {
      const existing = await LeaveBalance.findOne({ employee: emp._id });
      if (!existing) {
        await LeaveBalance.create({
          employee: emp._id,
          annual: companyLeaves.annual,
          sick: companyLeaves.sick,
          marriage: companyLeaves.marriage,
          emergency: companyLeaves.emergency,
          maternity: companyLeaves.maternity,
          unpaid: companyLeaves.unpaid
        });
      }
    }

    console.log('تمت إضافة رصيد الإجازات للموظفين الحاليين بنجاح!');
  } catch (error) {
    console.error('حدث خطأ:', error.message);
  }
};

addLeavesToExistingEmployees();
