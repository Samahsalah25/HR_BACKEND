const express = require('express');
const router = express.Router();
const authenticate = require('../middlesware/authenticate');
const validate = require('../middlesware/validate');
const { createViolationRecord, repeatWarningRecord, getAllRecords, deleteRecord, getEmployeeViolations,  } = require("../controllers/employeeViolationController.js")

router.post("/createViolationRecord", authenticate, createViolationRecord)
router.post("/repeatWarningRecord", authenticate, repeatWarningRecord)
router.get("/getAllRecords", authenticate, getAllRecords)
router.delete("/deleteRecord/:id", authenticate, deleteRecord)
router.get("/getEmployeeViolations", authenticate, getEmployeeViolations)
// router.get("/getEmployeeViolationsByHR", authenticate, getEmployeeViolationById)



module.exports = router;

