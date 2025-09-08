const express = require('express');
const router = express.Router();
const { createEmployee ,employeeStatus ,employeeOverview ,getMyAttendanceRecord ,getMyRequests ,getMyTasks} = require('../controllers/employee');
const authenticate=require('../middlesware/authenticate');
const authorizeRoles=require('../middlesware/roleMiddleware');
const validate=require('../middlesware/validate');
const  {
  createEmployeeSchema,
  updateEmployeeSchema
}=require('../validations/employeeSchemas');

router.post('/',authenticate,authorizeRoles('HR'), validate(createEmployeeSchema),createEmployee);

//here get workstartTime and date:
router.get('/status' ,authenticate ,employeeStatus)

// my enfoo
router.get('/myinfo' ,authenticate ,employeeOverview)

//سجلات الحضور هنا بتاعت الموظف
router.get('/myattendance' ,authenticate ,getMyAttendanceRecord)
//getMyTasks
router.get('/getMyTasks' ,authenticate ,getMyTasks)
//getMyRequests
router.get('/getMyRequests' ,authenticate ,getMyRequests)
module.exports = router;
