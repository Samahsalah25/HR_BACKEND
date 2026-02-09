const Violation = require("../models/ViolationFormSchema")

exports.createViolation = async (req, res, next) => {
    try {
        const { nameEn, nameAr, descriptionEn, descriptionAr } = req.body
        const violation = await Violation.create({ nameEn, nameAr, descriptionEn, descriptionAr })
        res.status(201).json({ status: 'success', data: violation });
    } catch (error) {
        res.status(400).json({ status: 'fail', message: err.message });
    }
}

exports.getAllViolations = async (req, res, next) => {
    try {
        const violations = await Violation.find().select("nameEn nameAr");
        if (violations.length === 0) {
            return res.status(404).json({
                status: "fail",
                message: "no violation "
            });
        }
        res.status(200).json({ status: "success", data: violations });
    } catch (err) {
        res.status(404).json({ status: "fail", message: err.message });
    }
};

exports.getViolationById = async (req, res, next) => {
    try {
        const violation = await Violation.findById(req.params.id);

        if (!violation) {
            return res.status(404).json({
                status: "fail",
                message: "لا توجد مخالفة بهذا الرقم التعريفى"
            });
        }
        res.status(200).json({
            status: "success",
            data: violation
        });
    } catch (err) {
        res.status(400).json({
            status: "fail",
            message: "err.message"
        });
    }
};

exports.updateViolation = async (req, res, next) => {
    try {
        const updatedViolation = await Violation.findByIdAndUpdate(
            req.params.id,
            req.body,
            {
                new: true,
                runValidators: true
            }
        );
        if (!updatedViolation) {
            return res.status(404).json({
                status: "fail",
                message: "Not Founded"
            });
        }
        res.status(200).json({
            status: "success",
            data: updatedViolation
        });
    } catch (err) {
        res.status(400).json({
            status: "fail",
            message: err.message
        });
    }
};

exports.deleteViolation = async (req, res, next) => {
    try {

        const { id } = req.params
        const violation = await Violation.findByIdAndDelete(id);

        if (!violation) {
            return res.status(404).json({
                status: "fail",
                message: "not found violation"
            });
        }

        res.status(200).json({
            status: "delete success",
            data: null
        });
    } catch (err) {
        res.status(400).json({
            status: "fail",
            message: err.message
        });
    }
};