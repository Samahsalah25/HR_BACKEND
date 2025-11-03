const express = require('express');
const router = express.Router();
const {getAllEmployees ,createEmployee ,getContractsStats  ,getAllContracts,getEmployeeById ,deleteEmployee ,getEmployeesByBranch ,updateEmployee ,getManagerss} = require('../controllers/hrController');
const  authenticate = require('../middlesware/authenticate');
const validate=require('../middlesware/validate');
const authorizeRoles=require('../middlesware/roleMiddleware');
const  {
  createEmployeeSchema,
  updateEmployeeSchema
}=require('../validations/employeeSchemas');
// Login (يوزر يدخل)


// جلب كل الموظفين اللي رولهم Employee
router.get('/' , getAllEmployees);
router.get('/managers' ,getManagerss)
router.get('/getEmployeesByBranch' ,authenticate ,authorizeRoles('HR') ,getEmployeesByBranch)

// get contrcacts

router.get('/getContractsStats' ,authenticate ,authorizeRoles('HR' ,'ADMIN'),getContractsStats) 
router.get('/getAllContracts' ,getAllContracts)
router.get('/getOneemployee/:id' , getEmployeeById)
router.post('/' ,validate(createEmployeeSchema) ,createEmployee)
router.delete('/deleteEmployee/:id' ,deleteEmployee)
router.patch('/updateemployee/:id' ,validate(updateEmployeeSchema),updateEmployee)
                            
module.exports = router;
