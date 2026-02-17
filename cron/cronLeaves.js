// const cron = require("node-cron");
// const mongoose = require("mongoose");

// // استدعاء السكيمات (تأكد إن المسارات دي صحيحة على حسب مشروعك)
// const Employee = require("../models/employeeModel");
// const LeaveBalance = require("../models/leaveBalanceModel");

// cron.schedule("0 0 1 1 *", async () => {
//     console.log("بداية تحديث أرصدة الإجازات السنوية...");

//     try {
//         const currentYear = new Date().getFullYear();

//         // 1. جلب رصيد الشركة الأساسي
//         const companyLeaves = await LeaveBalance.findOne({ employee: null });

//         if (!companyLeaves) {
//             console.error("خطأ: لم يتم العثور على رصيد الشركة الأساسي (employee: null)!");
//             return;
//         }

//         // 2. جلب الموظفين
//         const employees = await Employee.find({}, "_id");

//         const totalDefault =
//             (companyLeaves.annual || 0) + (companyLeaves.sick || 0) +
//             (companyLeaves.marriage || 0) + (companyLeaves.emergency || 0) +
//             (companyLeaves.maternity || 0) + (companyLeaves.unpaid || 0);

//         // 3. تنفيذ العمليات
//         const tasks = employees.map(async (emp) => {
//             const exists = await LeaveBalance.findOne({
//                 employee: emp._id,
//                 year: currentYear
//             });

//             if (!exists) {
//                 return LeaveBalance.create({
//                     employee: emp._id,
//                     year: currentYear,
//                     annual: companyLeaves.annual,
//                     sick: companyLeaves.sick,
//                     marriage: companyLeaves.marriage,
//                     emergency: companyLeaves.emergency,
//                     maternity: companyLeaves.maternity,
//                     unpaid: companyLeaves.unpaid,
//                     remaining: totalDefault
//                 });
//             }
//         });

//         await Promise.all(tasks);
//         console.log(`تم بنجاح إنشاء أرصدة عام ${currentYear} لجميع الموظفين.`);

//     } catch (error) {
//         console.error("حدث خطأ في الـ Cron Job:", error.message);
//     }
// });

const cron = require('node-cron');
const mongoose = require('mongoose');
const LeaveBalance = require('../Admin/models/leaveBalanceModel.js');
const Employee = require('../Admin/models/employee.js');

const initYearlyLeaves = () => {
    // cron.schedule('1 0 0 1 1 *', async() 

    cron.schedule('* * * * *', async () => {
        console.log('--- بدأت عملية تجديد أرصدة الإجازات السنوية ---');

        const session = await mongoose.startSession();
        session.startTransaction();

        try {
            const currentYear = new Date().getFullYear();

            // 1. جلب رصيد الشركة الأساسي للسنة الجديدة (أو آخر سنة متاحة)
            let baseLeaves = await LeaveBalance.findOne({ employee: null, year: currentYear }).session(session);
            if (!baseLeaves) {
                baseLeaves = await LeaveBalance.findOne({ employee: null }).sort({ year: -1 }).session(session);
            }

            if (!baseLeaves) {
                console.error('فشل التجديد: لا يوجد رصيد أساسي للشركة (base balance) في السيستم');
                return;
            }

            // 2. جلب كل الموظفين
            const employees = await Employee.find({}).session(session);

            for (const employee of employees) {
                // نتاكد إننا مكررناش السجل
                const alreadyExists = await LeaveBalance.findOne({ employee: employee._id, year: currentYear }).session(session);

                if (!alreadyExists) {
                    const totalDefault =
                        baseLeaves.annual + baseLeaves.sick + baseLeaves.marriage +
                        baseLeaves.emergency + baseLeaves.maternity + baseLeaves.unpaid;

                    await LeaveBalance.create([{
                        employee: employee._id,
                        year: currentYear,
                        annual: baseLeaves.annual,
                        sick: baseLeaves.sick,
                        marriage: baseLeaves.marriage,
                        emergency: baseLeaves.emergency,
                        maternity: baseLeaves.maternity,
                        unpaid: baseLeaves.unpaid,
                        remaining: totalDefault
                    }], { session });
                }
            }

            await session.commitTransaction();
            console.log(`--- تم تجديد أرصدة عام ${currentYear} بنجاح لـ ${employees.length} موظف ---`);
        } catch (error) {
            await session.abortTransaction();
            console.error('خطأ كارثي أثناء تجديد الأرصدة:', error);
        } finally {
            session.endSession();
        }
    });
};

module.exports = initYearlyLeaves;