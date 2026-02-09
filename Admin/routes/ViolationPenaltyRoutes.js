const express = require('express');
const router = express.Router();
const authenticate = require('../middlesware/authenticate');
const validate = require('../middlesware/validate');
const { createPenalty, getAllViolationPenalty, updatePenaltyByViolation } = require("../controllers/ViolationPenaltyController.js")



router.post("/createPenalty", authenticate, createPenalty)
router.get("/getAllViolationPenalty", authenticate, getAllViolationPenalty)
router.patch("/updatePenaltyByViolation/:id", authenticate, updatePenaltyByViolation)


module.exports = router;

