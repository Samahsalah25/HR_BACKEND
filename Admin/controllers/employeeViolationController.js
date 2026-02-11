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
};

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
};



exports.deleteRecord = async (req, res) => {
    try {
        await EmployeeViolation.findByIdAndDelete(req.params.id);
        res.status(200).json({ status: 'success', data: null });
    } catch (err) {
        res.status(400).json({ status: 'fail', message: err.message });
    }
};



//Emp
exports.getEmployeeViolations = async (req, res) => {
    try {
        const { employeeId } = req.params;
        const violations = await EmployeeViolation.find(employeeId)
            .populate('employeeId', 'name')
            .populate('violationId', 'nameAr',)//all vio
            .sort('-violationDate');
        res.status(200).json({
            success: true,
            data: violations
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};