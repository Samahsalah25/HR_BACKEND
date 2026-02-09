const express = require('express');
const router = express.Router();
const authenticate = require('../middlesware/authenticate');
const validate = require('../middlesware/validate');
const { createPenalty, getAllViolationPenalty, updatePenaltyByViolation ,getViolationPenaltyById } = require("../controllers/ViolationPenaltyController.js")



router.post("/createPenalty", authenticate, createPenalty)
router.get("/getAllViolationPenalty", authenticate, getAllViolationPenalty)
router.get("/getViolationPenaltyById/:id",authenticate ,getViolationPenaltyById)

router.patch("/updatePenaltyByViolation/:id", authenticate, updatePenaltyByViolation)

module.exports = router;

