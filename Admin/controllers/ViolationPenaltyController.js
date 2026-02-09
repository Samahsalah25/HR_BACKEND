const violationPenaltySchema = require("../models/violationPenaltySchema.js")
const Violation = require("../models/ViolationFormSchema")

exports.createPenalty = async (req, res) => {
    try {
        const newPenalty = await violationPenaltySchema.create(req.body);
        res.status(201).json({
            status: "success",
            data: newPenalty
        });
    } catch (err) {
        res.status(400).json({ status: "fail", message: err.message });
    }
};

exports.getAllViolationPenalty = async (req, res) => {
  try {
    const violationPenalty = await violationPenaltySchema.find()
      .populate("violationId", "nameAr nameEn descriptionAr descriptionEn") 
      .select("firstOccurrence secondOccurrence thirdOccurrence fourthOccurrence");

    if (violationPenalty.length === 0) {
      return res.status(404).json({
        status: "fail",
        message: "no violationPenalty"
      });
    }

    res.status(200).json({
      status: "success",
      data: violationPenalty
    });
  } catch (err) {
    res.status(400).json({ status: "fail", message: err.message });
  }
};



exports.updatePenaltyByViolation = async (req, res) => {
    try {

        const updatedPenalty = await violationPenaltySchema.findByIdAndUpdate(
            req.params.id,
            req.body,
            {
                new: true,
                runValidators: true
            }
        );

        if (!updatedPenalty) {
            return res.status(404).json({
                status: "fail",
                message: "Not Founded"
            });
        }

        res.status(200).json({
            status: "success",
            message: "Success",
            data: updatedPenalty
        });
    } catch (err) {
        res.status(400).json({
            status: "fail",
            message: err.message
        });
    }
};

exports.getViolationPenaltyById = async (req, res) => {
  try {
    const penalty = await violationPenaltySchema.findById(req.params.id)
      .populate("violationId", "nameAr nameEn descriptionAr descriptionEn")
      .select("firstOccurrence secondOccurrence thirdOccurrence fourthOccurrence");

    if (!penalty) {
      return res.status(404).json({ status: "fail", message: "Penalty not found" });
    }

    res.status(200).json({ status: "success", data: penalty });
  } catch (err) {
    res.status(400).json({ status: "fail", message: err.message });
  }
};
