// routes/leaveRoutes.js
const express = require("express");
const router = express.Router();
const { createCompanyLeaves } = require("../controllers/leaveController");
const authenticate=require('../middlesware/authenticate');
const authorizeRoles=require('../middlesware/roleMiddleware');

//admin create leaves; 
router.post("/",authenticate,authenticate,authorizeRoles('ADMIN'), createCompanyLeaves);

module.exports = router;
