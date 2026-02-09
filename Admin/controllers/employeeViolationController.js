const employeeViolationSchema = require("../models/EmployeeViolationSchema.js")
const violationPenaltySchema = require("../models/violationPenaltySchema.js")

exports.createViolationRecord = async (req, res) => {
    try {
        const { employeeId, violationId, violationDate } = req.body;

        const count = await employeeViolationSchema.countDocuments({ employeeId, violationId });
        const occurrence = count + 1;
        const penaltySchema = await violationPenaltySchema.findOne({ violationId });
        if (!penaltySchema) return res.status(404).json({ message: "لم يتم ضبط سلم عقوبات لهذه المخالفة" });
        let penaltyToApply;
        if (occurrence === 1) penaltyToApply = penaltySchema.firstOccurrence;
        else if (occurrence === 2) penaltyToApply = penaltySchema.secondOccurrence;
        else if (occurrence === 3) penaltyToApply = penaltySchema.thirdOccurrence;
        else penaltyToApply = penaltySchema.fourthOccurrence;

        const newRecord = await employeeViolationSchema.create({
            employeeId,
            violationId,
            violationDate,
            occurrenceNumber: occurrence,
            appliedPenalty: penaltyToApply
        });

        res.status(201).json({ status: 'success', data: newRecord });
    } catch (err) {
        res.status(400).json({ status: 'fail', message: err.message });
    }
};

exports.getAllRecords = async (req, res) => {
    try {
        const records = await employeeViolationSchema.find()
            .populate('violationId', 'nameAr')
            .sort('-violationDate');

        const formattedData = records.map(r => ({
            id: r._id,
            violationTitle: r.violationId?.nameAr,
            date: r.violationDate.toLocaleDateString('en-GB'),
            occurrence: r.occurrenceNumber === 1 ? 'أول مرة' : r.occurrenceNumber === 2 ? 'ثاني مرة' : 'تكرار إضافي',
            penaltyType: r.appliedPenalty.penaltyType,
            addedBy: r.addedBy
        }));

        res.status(200).json({ status: 'success', data: formattedData });
    } catch (err) {
        res.status(400).json({ status: 'fail', message: err.message });
    }
};

exports.deleteRecord = async (req, res) => {
    try {
        await employeeViolationSchema.findByIdAndDelete(req.params.id);
        res.status(200).json({ status: 'success', data: null });
    } catch (err) {
        res.status(400).json({ status: 'fail', message: err.message });
    }
};
