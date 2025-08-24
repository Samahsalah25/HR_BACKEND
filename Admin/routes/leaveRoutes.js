// routes/leaveRoutes.js
const express = require("express");
const router = express.Router();
const { createCompanyLeaves ,getCompanyLeaves  } = require("../controllers/leaveController");
const authenticate=require('../middlesware/authenticate');
const authorizeRoles=require('../middlesware/roleMiddleware');
const createCompanyLeavesSchema=require('../validations/leavevalidation');
const validate=require('../middlesware/validate');
//admin create leaves; 
router.post("/",authenticate,authenticate,authorizeRoles('ADMIN'),validate(createCompanyLeavesSchema),createCompanyLeaves);
router.get('/' ,authenticate ,authorizeRoles('ADMIN') ,getCompanyLeaves )
module.exports = router;
