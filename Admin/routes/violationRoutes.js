const express = require('express');
const router = express.Router();
const validate = require('../middlesware/validate');
const { createViolation, getAllViolations, getViolationById, updateViolation, deleteViolation } = require("../controllers/violationController.js")
const authenticate = require('../middlesware/authenticate');

router.post("/createViolation", authenticate, validate, createViolation)
router.get("/getAllViolations", authenticate, getAllViolations)
router.get("/getViolationById/:id", authenticate, getViolationById);
router.patch("/updateViolation/:id", authenticate, updateViolation)
router.delete("/deleteViolation/:id", authenticate, deleteViolation)

module.exports = router;
