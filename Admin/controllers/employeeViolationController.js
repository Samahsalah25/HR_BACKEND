const EmployeeViolation = require("../models/EmployeeViolationSchema.js")
const ViolationPenalty = require("../models/violationPenaltySchema.js")

const Violation = require("../models/ViolationFormSchema")

const mongoose = require('mongoose');

//HR
// exports.createViolationRecord = async (req, res) => {
//     try {
//         const { employeeId, violationId } = req.body;
//         console.log("البيانات اللي جاية من الفورم:", { employeeId, violationId });
//         const count = await EmployeeViolation.countDocuments({ employeeId, violationId });
//         const occurrence = count + 1;
//         const penaltySchema = await violationPenaltySchema.findOne({ violationId });
//         if (!penaltySchema) return res.status(404).json({ message: "لم يتم ضبط سلم عقوبات لهذه المخالفة" });
//         let penaltyToApply;
//         if (occurrence === 1) penaltyToApply = penaltySchema.firstOccurrence;
//         else if (occurrence === 2) penaltyToApply = penaltySchema.secondOccurrence;
//         else if (occurrence === 3) penaltyToApply = penaltySchema.thirdOccurrence;
//         else penaltyToApply = penaltySchema.fourthOccurrence;

//         const newRecord = await EmployeeViolation.create({
//             employeeId,
//             violationId,
//             occurrenceNumber: occurrence,
//         });

//         res.status(201).json({ status: 'success', data: newRecord });
//     } catch (err) {
//         res.status(400).json({ status: 'fail', message: err.message });
//     }
// };


/**
 * إضافة مخالفة لموظف
 * body: {
 *   employeeId: ObjectId,
 *   violationPenaltyId: ObjectId,
 *   addedBy: "Admin Name"
 * }
 */
const Employee = require('../models/employee');


exports.createViolationRecord = async (req, res) => {
  try {
    const { employeeId, violationPenaltyId,  } = req.body;

    if (!mongoose.Types.ObjectId.isValid(employeeId) || !mongoose.Types.ObjectId.isValid(violationPenaltyId)) {
      return res.status(400).json({ message: 'Invalid IDs' });
    }

    // جلب العقوبة المرتبطة بالمخالفة
    const violationPenalty = await ViolationPenalty.findById(violationPenaltyId);
    if (!violationPenalty) {
      return res.status(404).json({ message: 'ViolationPenalty not found' });
    }

    // هل الموظف أخذ هذه المخالفة قبل كدا؟
    let employeeViolation = await EmployeeViolation.findOne({ employeeId, violationPenaltyId });

    let currentOccurrence = 1;

    if (employeeViolation) {
      currentOccurrence = employeeViolation.occurrences.length + 1;

      if (currentOccurrence > 4) {
        return res.status(400).json({ message: 'تم تجاوز العدد الأقصى للتكرارات لهذه المخالفة' });
      }
    }

    // اختيار بيانات التكرار المناسب
    const occurrenceMap = {
      1: violationPenalty.firstOccurrence,
      2: violationPenalty.secondOccurrence,
      3: violationPenalty.thirdOccurrence,
      4: violationPenalty.fourthOccurrence
    };

    const currentPenalty = occurrenceMap[currentOccurrence];

   const occurrenceEntry = {
  occurrenceNumber: currentOccurrence,
  date: new Date(),
  addedBy: req.user?.name || 'Admin',
  addedById: req.user?.id || null, // ID المستخدم
  penaltyType: currentPenalty.penaltyType,
  percentageValue: currentPenalty.percentageValue || 0,
  daysCount: currentPenalty.daysCount || 0,
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
      message: `تم تسجيل المخالفة للتكرار رقم ${currentOccurrence}`,
      data: employeeViolation
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'حدث خطأ داخلي' });
  }
    try {
        const { employeeId, violationPenaltyId } = req.body;

        if (!mongoose.Types.ObjectId.isValid(employeeId) || !mongoose.Types.ObjectId.isValid(violationPenaltyId)) {
            return res.status(400).json({ message: 'Invalid IDs' });
        }

        // جلب بيانات الموظف عشان نحسب من الراتب
        const employee = await Employee.findOne({ user: employeeId });
        if (!employee) {
            return res.status(404).json({ message: 'Employee not found' });
        }

        // جلب العقوبة المرتبطة بالمخالفة
        const violationPenalty = await ViolationPenalty.findById(violationPenaltyId);
        if (!violationPenalty) {
            return res.status(404).json({ message: 'ViolationPenalty not found' });
        }

        // هل الموظف أخذ هذه المخالفة قبل كدا؟
        let employeeViolation = await EmployeeViolation.findOne({ employeeId, violationPenaltyId });

        let currentOccurrence = 1;

        if (employeeViolation) {
            currentOccurrence = employeeViolation.occurrences.length + 1;

            if (currentOccurrence > 4) {
                return res.status(400).json({ message: 'تم تجاوز العدد الأقصى للتكرارات لهذه المخالفة' });
            }
        }

        // اختيار بيانات التكرار المناسب
        const occurrenceMap = {
            1: violationPenalty.firstOccurrence,
            2: violationPenalty.secondOccurrence,
            3: violationPenalty.thirdOccurrence,
            4: violationPenalty.fourthOccurrence
        };

        const currentPenalty = occurrenceMap[currentOccurrence];

        // --- الحسبة الجديدة بناءً على طلبك ---
        const baseSalary = employee.salary?.base || 0;
        let calculatedDeduction = 0;

        // بنشوف نوع العقوبة المكتوب في الـ Penalty
        if (currentPenalty.penaltyType === 'خصم أيام') {
            const dayValue = baseSalary / 30;
            calculatedDeduction = (currentPenalty.daysCount || 0) * dayValue;
        }
        else if (currentPenalty.penaltyType === 'خصم نسبة') {
            calculatedDeduction = ((currentPenalty.percentageValue || 0) / 100) * baseSalary;
        }

        const occurrenceEntry = {
            occurrenceNumber: currentOccurrence,
            date: new Date(),
            addedBy: req.user?.name || 'Admin',
            addedById: req.user?.id || null,
            penaltyType: currentPenalty.penaltyType,
            percentageValue: currentPenalty.percentageValue || 0,
            daysCount: currentPenalty.daysCount || 0,
            calculatedDeduction: Number(calculatedDeduction.toFixed(2)), // بنخزن الرقم هنا
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

        if (!mongoose.Types.ObjectId.isValid(employeeId) || !mongoose.Types.ObjectId.isValid(violationPenaltyId)) {
            return res.status(400).json({ message: 'Invalid IDs' });
        }

        const employee = await Employee.findOne({ user: employeeId });
        if (!employee) {
            return res.status(404).json({ message: 'Employee not found' });
        }

        let employeeViolation = await EmployeeViolation.findOne({ employeeId: employee._id, violationPenaltyId });

        if (!employeeViolation) {
            return res.status(404).json({ message: 'لا يوجد سجل سابق لهذه المخالفة لإصدار تحذير مكرر' });
        }

        const violationPenalty = await ViolationPenalty.findById(violationPenaltyId);

        // --- التعديل هنا: بنزود رقم التكرار الحالي بمقدار 1 ---
        const updatedOccurrence = employeeViolation.currentOccurrence + 1;

        // شرط حماية عشان لو السكيما عندك آخرها 4 تكرارات
        if (updatedOccurrence > 4) {
            return res.status(400).json({ message: 'تم تجاوز الحد الأقصى للتكرارات المسموح بها' });
        }

        const occurrenceMap = {
            1: violationPenalty.firstOccurrence,
            2: violationPenalty.secondOccurrence,
            3: violationPenalty.thirdOccurrence,
            4: violationPenalty.fourthOccurrence
        };

        // بنجيب بيانات العقوبة بناءً على الرقم الجديد بعد الزيادة
        const currentPenalty = occurrenceMap[updatedOccurrence];

        const baseSalary = employee.salary?.base || 0;
        let calculatedDeduction = 0;

        if (currentPenalty.penaltyType === 'خصم أيام') {
            calculatedDeduction = (currentPenalty.daysCount || 0) * (baseSalary / 30);
        } else if (currentPenalty.penaltyType === 'خصم نسبة') {
            calculatedDeduction = ((currentPenalty.percentageValue || 0) / 100) * baseSalary;
        }

        const newOccurrenceEntry = {
            occurrenceNumber: updatedOccurrence, // بنخزن الرقم الجديد في السجل
            date: new Date(),
            addedBy: req.user?.name || 'Admin',
            addedById: req.user?.id || null,
            penaltyType: currentPenalty.penaltyType,
            percentageValue: currentPenalty.percentageValue || 0,
            daysCount: currentPenalty.daysCount || 0,
            calculatedDeduction: Number(calculatedDeduction.toFixed(2)),
            deductFrom: currentPenalty.deductFrom || null,
            decisionText: `(تحذير مكرر) - ${currentPenalty.decisionText || ''}`
        };

        employeeViolation.occurrences.push(newOccurrenceEntry);

        employeeViolation.currentOccurrence = updatedOccurrence;

        await employeeViolation.save();

        res.status(200).json({
            success: true,
            message: `تم إضافة تكرار إضافي للتحذير بنجاح (المستوى الجديد: ${updatedOccurrence})`,
            data: employeeViolation
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'حدث خطأ أثناء تسجيل تكرار التحذير' });
    }
};

// ---------------------------
// Backend: getAllRecords
// ---------------------------
// ---------------------------
// Backend: getAllRecords with month/year filter
// ---------------------------
// ---------------------------
// Backend: getAllRecords
// ---------------------------
// ---------------------------
// Backend: getAllRecords with month/year filter
// ---------------------------
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
  .populate('employeeId', 'name employeeNumber _id') // اسم الموظف والرقم الوظيفي
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
            employeeName: r.employeeId?.name || 'غير معروف',
            employeeNo: r.employeeId?.employeeNumber || '-',
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