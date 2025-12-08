const express = require('express');
const router = express.Router();
const { createApplicant, getAllApplicants  ,getApplicantById,
  updateStatus,
  updateNotes} = require('../controllers/applicantController');

const uploadCV = require('../middlesware/uploadCV');
const validate =require("../middlesware/validate")
const {validateApplicant} =require("../validations/applicantValidator");

// POST applicant (Public)
router.post('/', uploadCV.single('cv') ,validateApplicant, createApplicant);

// GET all applicants (Protected – HR)
router.get('/', getAllApplicants);

// GET single applicant
router.get("/:id", getApplicantById);

// UPDATE status
router.patch("/:id/status", updateStatus);

// UPDATE notes
router.patch("/:id/notes", updateNotes);

module.exports = router;
