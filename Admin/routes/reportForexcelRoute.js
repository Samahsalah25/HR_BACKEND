const express = require('express');
const router = express.Router();
const {attendanceDaily ,attendanceRange ,attendanceLate ,attendanceAbsence 
    ,attendanceByEmployee ,contractsReport ,leaveBalancesReport ,leaveBalancesFullReport ,
generateSalaryReport ,generateResidencyReport ,generateResidencyExpiringReport ,contractsExpiringReport
,employeeReport ,newEmployeesReport}= require('../controllers/reportsForexcel');

// Daily
router.get('/attendance/daily', attendanceDaily);

// Range (generic attendance period)
router.get('/attendance/range', attendanceRange);

// Late
router.get('/attendance/late', attendanceLate);

// Absence
router.get('/attendance/absence', attendanceAbsence);

// By employee
router.get('/attendance/employee/:employeeId', attendanceByEmployee);


//  contract
// Contracts Report
router.get('/contracts/report', contractsReport);
router.get('/contract/contractsExpiringReport' ,contractsExpiringReport)


//leaves الاجازات القيد المراجعه كلها بتاعت كل الموظفين
router.get('/leaves/leavependingReport' ,leaveBalancesReport)

// رصيد الاجازات عموما لكل الموظفين
router.get('/leave/leaveBalancesFullReport' ,leaveBalancesFullReport)



// salaries
router.get("/salaries/generateSalaryReport" ,generateSalaryReport)

// الاقامات
//  ريبورت بالاقامات كلها هنا 
router.get('/residence/generateResidencyReport' ,generateResidencyReport)
//ريبورت بالاقامات اللي قربت تنتهي
router.get('/residency/generateResidencyExpiringReport' ,generateResidencyExpiringReport)

//get employee  all employee
router.get('/employee/employeeReport' ,employeeReport )
router.get('/employee/newEmployeesReport' ,newEmployeesReport)
module.exports = router;



