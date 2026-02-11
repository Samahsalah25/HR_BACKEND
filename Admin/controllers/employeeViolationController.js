const EmployeeViolation = require("../models/EmployeeViolationSchema.js")
const violationPenaltySchema = require("../models/violationPenaltySchema.js")
const Violation = require("../models/ViolationFormSchema")


//HR
exports.createViolationRecord = async (req, res) => {
    try {
        const { employeeId, violationId } = req.body;
        console.log("البيانات اللي جاية من الفورم:", { employeeId, violationId });
        const count = await EmployeeViolation.countDocuments({ employeeId, violationId });
        const occurrence = count + 1;
        const penaltySchema = await violationPenaltySchema.findOne({ violationId });
        if (!penaltySchema) return res.status(404).json({ message: "لم يتم ضبط سلم عقوبات لهذه المخالفة" });
        let penaltyToApply;
        if (occurrence === 1) penaltyToApply = penaltySchema.firstOccurrence;
        else if (occurrence === 2) penaltyToApply = penaltySchema.secondOccurrence;
        else if (occurrence === 3) penaltyToApply = penaltySchema.thirdOccurrence;
        else penaltyToApply = penaltySchema.fourthOccurrence;

        const newRecord = await EmployeeViolation.create({
            employeeId,
            violationId,
            occurrenceNumber: occurrence,
        });

        res.status(201).json({ status: 'success', data: newRecord });
    } catch (err) {
        res.status(400).json({ status: 'fail', message: err.message });
    }
};


// ---------------------------
// Backend: getAllRecords
// ---------------------------
exports.getAllRecords = async (req, res) => {
  try {
    const records = await EmployeeViolation.find()
      .populate('employeeId', 'name employeeNo') // اسم الموظف والرقم الوظيفي
      .populate('violationId', 'nameAr')       // عنوان المخالفة
      .sort({ violationDate: -1 });             // ترتيب حسب تاريخ المخالفة (أحدث أولاً)

    // Format البيانات مباشرة عشان الفرونت
    const formattedData = records.map(r => ({
      id: r._id,
      employeeName: r.employeeId?.name || 'غير معروف',
      employeeNo: r.employeeId?.employeeNo || '-',
      violationTitle: r.violationId?.nameAr || 'مخالفة غير مسجلة',
      date: r.violationDate.toLocaleDateString('en-GB'), // DD/MM/YYYY
      occurrence: r.occurrenceNumber === 1 ? 'أول مرة' :
                  r.occurrenceNumber === 2 ? 'ثاني مرة' :
                  r.occurrenceNumber === 3 ? 'ثالث مرة' : 'رابع مرة فأكثر',
      penalty: r.penalty || { type: '-' }, // لو عايزين نضيف العقوبة كمان
      addedBy: r.addedBy
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