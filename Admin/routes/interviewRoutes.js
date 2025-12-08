const express = require("express");
const router = express.Router();
const {
  createInterviewValidation,
  updateInterviewValidation,
  updateInterviewResultValidation
} = require("../validations/interviewvalidation");

const {
  createInterview,
  getApplicantInterviews,
  updateInterview,
  updateInterviewResult
} = require("../controllers/interviewController");
const validate=require("../middlesware/validate");

router.post("/", validate(createInterviewValidation), createInterview); 
router.get("/:applicantId", getApplicantInterviews);
router.patch("/:id", validate(updateInterviewValidation), updateInterview);
router.patch("/:id/result", validate(updateInterviewResultValidation) ,updateInterviewResult);

module.exports = router;
