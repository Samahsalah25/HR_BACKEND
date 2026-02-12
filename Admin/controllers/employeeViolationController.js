const EmployeeViolation = require("../models/EmployeeViolationSchema.js")
const ViolationPenalty = require("../models/violationPenaltySchema.js")

const Violation = require("../models/ViolationFormSchema")

const mongoose = require('mongoose');



const Employee = require('../models/employee');


exports.createViolationRecord = async (req, res) => {
  try {
    const { employeeId, violationPenaltyId } = req.body;

    if (
      !mongoose.Types.ObjectId.isValid(employeeId) ||
      !mongoose.Types.ObjectId.isValid(violationPenaltyId)
    ) {
      return res.status(400).json({ message: 'Invalid IDs' });
    }

    const employee = await Employee.findById(employeeId);
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    const violationPenalty = await ViolationPenalty.findById(violationPenaltyId);
    if (!violationPenalty) {
      return res.status(404).json({ message: 'ViolationPenalty not found' });
    }

    let employeeViolation = await EmployeeViolation.findOne({
      employeeId,
      violationPenaltyId
    });

    let currentOccurrence = 1;

    if (employeeViolation) {
      currentOccurrence = employeeViolation.occurrences.length + 1;

      if (currentOccurrence > 4) {
        return res.status(400).json({
          message: 'تم تجاوز العدد الأقصى للتكرارات لهذه المخالفة'
        });
      }
    }

    const occurrenceMap = {
      1: violationPenalty.firstOccurrence,
      2: violationPenalty.secondOccurrence,
      3: violationPenalty.thirdOccurrence,
      4: violationPenalty.fourthOccurrence
    };

    const currentPenalty = occurrenceMap[currentOccurrence];

    //  حساب الخصم
    const baseSalary = employee.salary?.base || 0;
    let calculatedDeduction = 0;

    if (currentPenalty.penaltyType === 'خصم أيام') {
      calculatedDeduction =
        (currentPenalty.daysCount || 0) * (baseSalary / 30);
    } else if (currentPenalty.penaltyType === 'خصم نسبة') {
      calculatedDeduction =
        ((currentPenalty.percentageValue || 0) / 100) * baseSalary;
    }

    const occurrenceEntry = {
      occurrenceNumber: currentOccurrence,
      date: new Date(),
      addedBy: req.user?.name || 'Admin',
      addedById: req.user?.id || null,
      penaltyType: currentPenalty.penaltyType,
      percentageValue: currentPenalty.percentageValue || 0,
      daysCount: currentPenalty.daysCount || 0,
      calculatedDeduction: Number(calculatedDeduction.toFixed(2)), //
      deductFrom: currentPenalty.deductFrom || null,
      decisionText: currentPenalty.decisionText || ''
    };

    if (employeeViolation) {
      employeeViolation.occurrences.push(occurrenceEntry);
      employeeViolation.currentOccurrence = currentOccurrence;
      await employeeViolation.save();
    } else {
      employeeViolation = await EmployeeViolation.create({
        employeeId,
        violationPenaltyId,
        currentOccurrence,
        occurrences: [occurrenceEntry]
      });
    }

    res.status(200).json({
      message: `تم تسجيل المخالفة بنجاح، قيمة الخصم: ${calculatedDeduction.toFixed(2)}`,
      data: employeeViolation
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'حدث خطأ داخلي' });
  }
};

//تكرار التحزير
exports.repeatWarningRecord = async (req, res) => {
  try {
    const { employeeId, violationPenaltyId } = req.body;

    // التحقق من صحة الـ IDs
    if (
      !mongoose.Types.ObjectId.isValid(employeeId) ||
      !mongoose.Types.ObjectId.isValid(violationPenaltyId)
    ) {
      return res.status(400).json({ message: 'Invalid IDs format' });
    }

    // 1️⃣ نجيب الموظف
    const employee = await Employee.findById(employeeId);
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    // 2️⃣ نجيب سجل المخالفة
    const employeeViolation = await EmployeeViolation.findOne({
      employeeId,
      violationPenaltyId
    });

    if (!employeeViolation) {
      return res.status(404).json({
        message: 'لا يوجد سجل سابق لهذه المخالفة'
      });
    }

    // 3️⃣ تحديد رقم التكرار الجديد
    const updatedOccurrence = employeeViolation.currentOccurrence + 1;

    if (updatedOccurrence > 4) {
      return res.status(400).json({ message: 'تجاوزت 4 تكرارات' });
    }

    // 4️⃣ نجيب بيانات العقوبة
    const violationPenalty = await ViolationPenalty.findById(violationPenaltyId);
    if (!violationPenalty) {
      return res.status(404).json({ message: 'ViolationPenalty not found' });
    }

    const occurrenceMap = {
      1: violationPenalty.firstOccurrence,
      2: violationPenalty.secondOccurrence,
      3: violationPenalty.thirdOccurrence,
      4: violationPenalty.fourthOccurrence
    };

    const currentPenalty = occurrenceMap[updatedOccurrence];

    // ==========================
    // 🔥 حساب الخصم حسب النوع
    // ==========================

    let calculatedDeduction = 0;
    let salarySource = 0;

    // نحسب بس لو في خصم
    if (
      currentPenalty.penaltyType === 'خصم نسبة' ||
      currentPenalty.penaltyType === 'خصم أيام'
    ) {

      // نحدد مصدر الخصم
      if (currentPenalty.deductFrom === 'الراتب') {
        salarySource = employee.salary?.base || 0;
      } 
      else if (currentPenalty.deductFrom === 'البدلات') {
        salarySource =
          (employee.salary?.housingAllowance || 0) +
          (employee.salary?.transportAllowance || 0) +
          (employee.salary?.otherAllowance || 0);
      }

      // خصم أيام
      if (currentPenalty.penaltyType === 'خصم أيام') {
        calculatedDeduction =
          (currentPenalty.daysCount || 0) * (salarySource / 30);
      }

      // خصم نسبة
      if (currentPenalty.penaltyType === 'خصم نسبة') {
        calculatedDeduction =
          ((currentPenalty.percentageValue || 0) / 100) * salarySource;
      }
    }

    // ==========================
    // 📝 تجهيز الداتا
    // ==========================

    const newOccurrenceEntry = {
      occurrenceNumber: updatedOccurrence,
      date: new Date(),
      addedBy: req.user?.name || 'Admin',
      addedById: req.user?._id || null,
      penaltyType: currentPenalty.penaltyType,
      percentageValue: currentPenalty.percentageValue || 0,
      daysCount: currentPenalty.daysCount || 0,
      deductFrom: currentPenalty.deductFrom || null,
      calculatedDeduction: Number(calculatedDeduction.toFixed(2)),
      decisionText:
        currentPenalty.penaltyType === 'قرار'
          ? currentPenalty.decisionText || ''
          : currentPenalty.decisionText || ''
    };

    // 5️⃣ حفظ
    employeeViolation.occurrences.push(newOccurrenceEntry);
    employeeViolation.currentOccurrence = updatedOccurrence;

    await employeeViolation.save();

    res.status(200).json({
      success: true,
      message: `تم تسجيل التكرار رقم ${updatedOccurrence} بنجاح`,
      data: employeeViolation
    });

  } catch (error) {
    console.error("Internal Error:", error);
    res.status(500).json({ message: 'حدث خطأ داخلي' });
  }
};


// exports.repeatWarningRecord = async (req, res) => {
//     try {
//         const { employeeId, violationPenaltyId } = req.body;


//         if (!mongoose.Types.ObjectId.isValid(employeeId) || !mongoose.Types.ObjectId.isValid(violationPenaltyId)) {
//             return res.status(400).json({ message: 'Invalid IDs format' });
//         }

//         // البحث عن الموظف
//    const employee = await Employee.findById(employeeId);
// if (!employee) {
//     return res.status(404).json({ message: 'Employee not found' });
// }


//         // المحاولة الأولى: البحث باستخدام الـ User ID (اللي مبعوت في الـ Body)
//         let employeeViolation = await EmployeeViolation.findOne({
//             employeeId: employeeId,
//             violationPenaltyId: violationPenaltyId
//         });


//         if (!employeeViolation) {
//             employeeViolation = await EmployeeViolation.findOne({
//                 employeeId: employee._id,
//                 violationPenaltyId: violationPenaltyId
//             });
//         }

//         if (!employeeViolation) {
//             const allEmpViolations = await EmployeeViolation.find({
//                 $or: [{ employeeId: employeeId }, { employeeId: employee._id }]
//             });


//             return res.status(404).json({
//                 message: 'لا يوجد سجل سابق لهذه المخالفة - راجع الـ Terminal للتفاصيل',
//                 debug: {
//                     sentEmployeeId: employeeId,
//                     foundEmployeeRecord: employee._id,
//                     sentViolationId: violationPenaltyId
//                 }
//             });
//         }
//         const violationPenalty = await ViolationPenalty.findById(violationPenaltyId);
//         const updatedOccurrence = employeeViolation.currentOccurrence + 1;

//         if (updatedOccurrence > 4) return res.status(400).json({ message: 'تجاوزت 4 تكرارات' });

//         const occurrenceMap = {
//             1: violationPenalty.firstOccurrence,
//             2: violationPenalty.secondOccurrence,
//             3: violationPenalty.thirdOccurrence,
//             4: violationPenalty.fourthOccurrence
//         };

//         const currentPenalty = occurrenceMap[updatedOccurrence];
//         const baseSalary = employee.salary?.base || 0;
//         let calculatedDeduction = 0;

//         if (currentPenalty.penaltyType === 'خصم أيام') {
//             calculatedDeduction = (currentPenalty.daysCount || 0) * (baseSalary / 30);
//         } else if (currentPenalty.penaltyType === 'خصم نسبة') {
//             calculatedDeduction = ((currentPenalty.percentageValue || 0) / 100) * baseSalary;
//         }

//         const newOccurrenceEntry = {
//             occurrenceNumber: updatedOccurrence,
//             date: new Date(),
//             addedBy: req.user?.name || 'Admin',
//             penaltyType: currentPenalty.penaltyType,
//             calculatedDeduction: Number(calculatedDeduction.toFixed(2)),
//             decisionText: `(تحذير مكرر) - ${currentPenalty.decisionText || ''}`
//         };

//         employeeViolation.occurrences.push(newOccurrenceEntry);
//         employeeViolation.currentOccurrence = updatedOccurrence;
//         await employeeViolation.save();

//         res.status(200).json({ success: true, data: employeeViolation });

//     } catch (error) {
//         console.error("Internal Error:", error);
//         res.status(500).json({ message: 'حدث خطأ داخلي' });
//     }
// };


exports.getAllRecords = async (req, res) => {
  try {
    const { month, year } = req.query; // جاي من الفرونت مثلا ?month=2&year=2026

    let filter = {};
    if (month && year) {
      // فلترة حسب الشهر والسنة
      const start = new Date(year, month - 1, 1); // بداية الشهر
      const end = new Date(year, month, 0, 23, 59, 59, 999); // آخر يوم في الشهر
      filter.createdAt = { $gte: start, $lte: end };
    }

    
    const records = await EmployeeViolation.find(filter)
  .populate('employeeId', 'name employeeNumber ') // اسم الموظف والرقم الوظيفي
  .populate({
    path: 'violationPenaltyId',
    populate: {
      path: 'violationId',
      select: 'nameAr nameEn descriptionAr descriptionEn'
    }
  })
  .sort({ violationDate: -1 });
    try {
        const { month, year } = req.query; // جاي من الفرونت مثلا ?month=2&year=2026

        let filter = {};
        if (month && year) {
            // فلترة حسب الشهر والسنة
            const start = new Date(year, month - 1, 1); // بداية الشهر
            const end = new Date(year, month, 0, 23, 59, 59, 999); // آخر يوم في الشهر
            filter.createdAt = { $gte: start, $lte: end };
        }


        const records = await EmployeeViolation.find(filter)
            .populate('employeeId', 'name employeeNumber') // اسم الموظف والرقم الوظيفي
            .populate({
                path: 'violationPenaltyId',
                populate: {
                    path: 'violationId',
                    select: 'nameAr nameEn descriptionAr descriptionEn'
                }
            })
            .sort({ violationDate: -1 });


        const formattedData = records.map(r => ({
            id: r._id,
            employeeId: r.employeeId?._id || null,
            employeeName: r.employeeId?.name || 'غير معروف',
            employeeNo: r.employeeId?.employeeNumber || '-',
            
   
    violationPenaltyId: r.violationPenaltyId?._id || null,  
            violationTitleAr: r.violationPenaltyId?.violationId?.nameAr || 'مخالفة غير مسجلة',
            violationTitleEn: r.violationPenaltyId?.violationId?.nameEn || 'Unregistered violation',
            violationDescriptionAr: r.violationPenaltyId?.violationId?.descriptionAr || '-',
            violationDescriptionEn: r.violationPenaltyId?.violationId?.descriptionEn || '-',
            occurrences: r.occurrences.map(o => ({
                occurrenceNumber: o.occurrenceNumber,
                date: o.date,
                addedBy: o.addedBy,
                addedById: o.addedById,
                penaltyType: o.penaltyType,
                percentageValue: o.percentageValue,
                daysCount: o.daysCount,
                deductFrom: o.deductFrom,
                decisionText: o.decisionText
            })),
            currentOccurrence: r.currentOccurrence
        }));

res.status(200).json({ status: 'success', data: formattedData });

  } catch (err) {
    res.status(400).json({ status: 'fail', message: err.message });
  }
        res.status(200).json({ status: 'success', data: formattedData });

    } catch (err) {
        res.status(400).json({ status: 'fail', message: err.message });
    }
};




exports.deleteRecord = async (req, res) => {
    try {
        await EmployeeViolation.findByIdAndDelete(req.params.id);
        res.status(200).json({ status: 'success', data: null });
    } catch (err) {
        res.status(400).json({ status: 'fail', message: err.message });
    }
};






exports.getEmployeeViolations = async (req, res) => {
    try {
        const userId = req.user._id; // الـ ID اللي جاي من اللوجين (User)

        // 1. لازم نحول الـ User ID لموظف عشان نجيب الـ employeeId الصحيح
        const employee = await Employee.findOne({ user: userId });

        if (!employee) {
            return res.status(404).json({
                success: false,
                message: "لم يتم العثور على بيانات موظف مرتبطة بهذا الحساب"
            });
        }

        // 2. البحث عن المخالفات باستخدام الـ ID بتاع الموظف اللي لقيناه
        const records = await EmployeeViolation.find({ employeeId: employee._id })
            .populate({
                path: 'violationPenaltyId',
                populate: {
                    path: 'violationId',
                    select: 'nameAr nameEn descriptionAr descriptionEn'
                }
            })
            .sort({ createdAt: -1 }); 

     
        const formattedData = records.map(r => ({
            id: r._id,
            violationTitleAr: r.violationPenaltyId?.violationId?.nameAr || 'مخالفة غير مسجلة',
            violationTitleEn: r.violationPenaltyId?.violationId?.nameEn || 'Unregistered violation',
            violationDescriptionAr: r.violationPenaltyId?.violationId?.descriptionAr || '-',
            violationDescriptionEn: r.violationPenaltyId?.violationId?.descriptionEn || '-',
            occurrences: r.occurrences.map(o => ({
                occurrenceNumber: o.occurrenceNumber,
                date: o.date,
                penaltyType: o.penaltyType,
                percentageValue: o.percentageValue,
                daysCount: o.daysCount,
                deductFrom: o.deductFrom,
                decisionText: o.decisionText ,
                 addedby:o.addedBy
            })),
            currentOccurrence: r.currentOccurrence
        }));

        res.status(200).json({
            success: true,
            count: formattedData.length,
            data: formattedData
        });

    } catch (err) {
        console.error("Error:", err);
        res.status(400).json({
            success: false,
            message: "حدث خطأ أثناء جلب المخالفات",
            error: err.message
        });
    }
};