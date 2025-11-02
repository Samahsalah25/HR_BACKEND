// routes/attendanceRoutes.js
const express = require('express');
const router = express.Router();
const authenticate=require('../middlesware/authenticate');
const authorizeRoles=require('../middlesware/roleMiddleware');
const validate=require('../middlesware/validate');
const {getDashboardStats ,getCompanySummary ,getNewEmployees ,getEmployeesByLeaveType ,getCompanyLeavePolicy  ,getResidencyData ,getBranchesDetails ,residencyRoutes ,getBranchesWithDepartments ,getEmployeesSummary ,getContractsSummary} =require('../controllers/adminDashboardController');
const Department =require("../models/depaertment")
router.get("/states",authenticate , getDashboardStats);
router.get("/branches" ,authenticate ,getCompanySummary)
router.get('/newEmployees' ,authenticate ,getNewEmployees)
router.get("/branches-details" ,authenticate, getBranchesDetails);
router.get("/departments-details", authenticate, getBranchesWithDepartments);
                                                                                        
                                                                  
           
                                  
                                              
router.get("/employees-summary" ,authenticate, getEmployeesSummary);
router.get("/residencies",authenticate, getResidencyData)
router.get("/getContractsSummary" ,authenticate ,getContractsSummary)
router.get("/getCompanyLeavePolicy" ,authenticate ,getCompanyLeavePolicy )
router.get("/type/:type" ,authenticate, getEmployeesByLeaveType);
module.exports = router;
