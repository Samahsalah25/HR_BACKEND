const express = require('express');
const router = express.Router();
const {getAllEmployees ,createEmployee ,getContractsStats ,getAllContracts,getEmployeeById ,deleteEmployee ,getEmployeesByBranch ,updateEmployee} = require('../controllers/hrController');
const  authenticate = require('../middlesware/authenticate');
const validate=require('../middlesware/validate');
const authorizeRoles=require('../middlesware/roleMiddleware');
const  {
  createEmployeeSchema,
  updateEmployeeSchema
}=require('../validations/employeeSchemas');
// Login (يوزر يدخل)


// جلب كل الموظفين اللي رولهم Employee
router.get('/', authenticate ,authorizeRoles('HR' ,'ADMIN') , getAllEmployees);

router.get('/getEmployeesByBranch' ,authenticate ,authorizeRoles('HR') ,getEmployeesByBranch)
// get contrcacts
router.get('/getContractsStats' ,authenticate ,authorizeRoles('HR'),getContractsStats) ;
router.get('/getAllContracts' ,authenticate ,authorizeRoles('HR'),getAllContracts)
router.get('/getOneemployee/:id',authenticate ,authorizeRoles('HR' ,'ADMIN') , getEmployeeById)
router.post('/',authenticate ,authorizeRoles('HR') ,validate(createEmployeeSchema) ,createEmployee)
router.delete('/deleteEmployee/:id' ,authenticate ,authorizeRoles('HR' ,'ADMIN'),deleteEmployee)
router.patch('/updateemployee/:id' ,authenticate ,authorizeRoles('HR' ,'ADMIN') ,validate(updateEmployeeSchema),updateEmployee)
module.exports = router;
