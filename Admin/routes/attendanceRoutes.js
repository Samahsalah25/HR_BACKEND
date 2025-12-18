// routes/attendanceRoutes.js
const express = require('express');
const router = express.Router();
const { checkIn ,checkOut ,getTodayAttendance ,dailyState ,dailyStateBranch 
    ,dailyAttendanceTable  ,dailyAttendanceTableOnebranch
     ,getMonthlyAttendanceForEmployee 
     ,monthlyReport 
    ,monthlyReportoneBranch ,dailyEmployeeAttendance  ,monthlyEmployeeAttendance ,getYearlyAttendanceSummary ,dailyAttendanceReport } = require('../controllers/attendanceController');
const authenticate=require('../middlesware/authenticate');
const getClientTime=require('../middlesware/clientTime');
const authorizeRoles=require('../middlesware/roleMiddleware');
const validate=require('../middlesware/validate');
const locationSchema=require('../validations/attendance');
// تسجيل الحضور (Check-In)

router.post('/checkin', authenticate,getClientTime, validate(locationSchema), checkIn);

// لاحقاً ممكن نضيف:
router.post('/checkout', authenticate, validate(locationSchema), checkOut);

//daily state and percent  لكل الفروع هنا
router.get('/dailyState' ,authenticate,authorizeRoles('HR'),dailyState) ;

//  لفرع معين بقي   النسب
router.get('/dailyStateOnrbrach' ,authenticate,authorizeRoles('HR'),dailyStateBranch) ;

//dailyAttendanceTable   لكل الفروع 
router.get('/dailyAttendanceTable' ,authenticate,authorizeRoles('HR',"Admin"),dailyAttendanceTable)

//  هنجيب جدول الحضور لفرع معين
 router.get('/dailyAttendanceTableOnebranch' ,authenticate ,authorizeRoles('HR'),dailyAttendanceTableOnebranch)

router.get('/dailyAttendanceReport' .authenticate , dailyAttendanceReport) ;


// تسجيل حضور اليوم جه امتي ومشي امتي
router.get("/today/:id", authenticate,authorizeRoles('HR'), getTodayAttendance);   //done


// سجل الحضور الشهري لموظف معين
router.get('/getMonthlyAttendanceForEmployee/:id' ,getMonthlyAttendanceForEmployee)
//////////////////////////////////////////////////////////////////////
//تقرير شهري لكل الحضور  بتاع كل الفروع
router.get('/monthlyReport'  ,monthlyReport)
//  تقرير شهري لفرع معين 
router.get('/monthreportonebranch' ,authenticate ,authorizeRoles('HR') ,monthlyReportoneBranch) ;

//  بيانات تاخير موظف معين من حيث بقي الحضور والتاخير
router.get('/dailyEmployeeAttendance/:id' ,authenticate , authorizeRoles('HR'),dailyEmployeeAttendance ); //

//  بيانات تاخير الموظف الشهري
 router.get('/monthlyEmployeeAttendance/:id' ,authenticate, authorizeRoles('HR'),monthlyEmployeeAttendance)

 //getYearlyAttendanceSummary 
 router.get('/getYearlyAttendanceSummary' ,authenticate ,getYearlyAttendanceSummary )
module.exports = router;
