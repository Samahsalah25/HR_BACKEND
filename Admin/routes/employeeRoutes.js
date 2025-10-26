const express = require('express');
const router = express.Router();
const { createEmployee ,employeeStatus ,employeeOverview ,getMyAttendanceRecord ,getEmployees ,getMyAttendanceThroughMonth  ,getMyRequests ,getMyTasks} = require('../controllers/employee');
const authenticate=require('../middlesware/authenticate');
const authorizeRoles=require('../middlesware/roleMiddleware');
const validate=require('../middlesware/validate');
const  {
  createEmployeeSchema,
  updateEmployeeSchema
}=require('../validations/employeeSchemas');

router.post('/',authenticate,authorizeRoles('HR' ,"ADMIN"), validate(createEmployeeSchema),createEmployee);

//here get workstartTime and date:
router.get('/status' ,authenticate ,employeeStatus)

// get employees to meating or tasks
router.get('/all' ,authenticate ,getEmployees)

// my enfoo
router.get('/myinfo' ,authenticate ,employeeOverview)

//سجلات الحضور هنا بتاعت الموظف
router.get('/myattendance' ,authenticate ,getMyAttendanceRecord)

//  هنا سجلات حضور الموظف خلال الشهر اللي احنا فيه 
router.get('/myattendancThroughMonth' ,authenticate ,getMyAttendanceThroughMonth )
//getMyTasks
router.get('/getMyTasks' ,authenticate ,getMyTasks)
//getMyRequests
router.get('/getMyRequests' ,authenticate ,getMyRequests)
module.exports = router;
