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
  updateInterviewResult ,getInterviewsOverview ,getMyInterviews
} = require("../controllers/interviewController");
const validate=require("../middlesware/validate");
const  authenticate = require('../middlesware/authenticate');

router.post("/", validate(createInterviewValidation), createInterview); 
router.get("/myinterviews",authenticate,getMyInterviews);
router.get("/overview", getInterviewsOverview);


router.get("/applicant/:applicantId", getApplicantInterviews);

router.patch("/:id", validate(updateInterviewValidation), updateInterview);
router.patch("/:id/result", validate(updateInterviewResultValidation) ,updateInterviewResult);

module.exports = router;
