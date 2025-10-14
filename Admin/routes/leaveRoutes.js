// routes/leaveRoutes.js
const express = require("express");
const router = express.Router();
const { createCompanyLeaves ,getCompanyLeaves  ,deleteLeaveById ,updateLeaveById ,getLeaveById  } = require("../controllers/leaveController");
const authenticate=require('../middlesware/authenticate');
const authorizeRoles=require('../middlesware/roleMiddleware');
const createCompanyLeavesSchema=require('../validations/leavevalidation');
const validate=require('../middlesware/validate');
//admin create leaves; 
router.post("/",authenticate,authenticate,validate(createCompanyLeavesSchema),createCompanyLeaves);
router.get('/' ,authenticate ,getCompanyLeaves )
router.get('/:id' ,authenticate ,getLeaveById)
router.patch('/:id' ,authenticate ,updateLeaveById)
router.delete('/:id' ,authenticate ,deleteLeaveById)
module.exports = router;
