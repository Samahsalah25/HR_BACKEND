const express = require('express');
const router = express.Router();
const {attendanceDaily ,attendanceRange ,attendanceLate ,attendanceAbsence 
    ,attendanceByEmployee ,contractsReport ,leaveBalancesReport ,leaveBalancesFullReport ,
generateSalaryReport ,generateResidencyReport ,generateResidencyExpiringReport ,contractsExpiringReport
,employeeReport ,newEmployeesReport ,branchOverviewReport ,departmentsPerBranchReport 
,employeesPerBranchReport ,departmentsSummaryReport ,departmentEmployeesDetailedReport 
,departmentsWithoutEmployeesReport,departmentSalaryAnalyticsReport ,recordsMasterReport ,expiredRecordsReport  
,recordsByBranchReport ,recordsEndingIn3Months }= require('../controllers/reportsForexcel');

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
router.get('/contract/contractsExpiringReport' ,contractsExpiringReport) //contract expired here


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
router.get('/employee/employeeReport' ,employeeReport )   // تقارير الl employee
router.get('/employee/newEmployeesReport' ,newEmployeesReport) // / تقرير ب اخر موظفين موجودين


//get branches
router.get('/branches/branchOverviewReport' ,branchOverviewReport) ///1... view branch
router.get('/branches/employeesPerBranchReport' ,employeesPerBranchReport) //2) employee count in every branch
router.get('/branches/newEmployeesReport' ,newEmployeesReport) //3 new employees   New Employees Per Branch (آخر 90 يوما
router.get('/brances/departmentsPerBranchReport' ,departmentsPerBranchReport ) //4) Departments Inside Each Branch

//get departments
router.get('/departments/departmentsSummaryReport' ,departmentsSummaryReport) //1)قائمة الأقسام + عدد الموظفين بكل قسم
router.get('/departments/departmentEmployeesDetailedReport' ,departmentEmployeesDetailedReport ) //2) تفاصيل موظفي كل قسم
router.get('/departments/departmentsWithoutEmployeesReport' ,departmentsWithoutEmployeesReport) //3) الأقسام بدون موظفين
router.get('/departments/departmentSalaryAnalyticsReport' ,departmentSalaryAnalyticsReport ) //4)متوسط الرواتب في كل قسم

// reports residency

router.get('/residency/recordsMasterReport' ,recordsMasterReport) //1)//1) تقرير جميع السجلات
router.get('/residency/expiredRecordsReport' ,expiredRecordsReport ) ////السجلات المنتهية2..)  
router.get('/residency/recordsByBranchReport' ,recordsByBranchReport) //3) السجلات حسب الفروع
router.get('/residency/recordsEndingIn3Months' ,recordsEndingIn3Months ) //4) السجلات اللي هتنتهي خلال 3 شهور


module.exports = router;



