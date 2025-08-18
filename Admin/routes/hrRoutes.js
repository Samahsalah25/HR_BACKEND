const express = require('express');
const router = express.Router();
const {getAllEmployees ,createEmployee ,getContractsStats ,getAllContracts,getEmployeeById ,deleteEmployee} = require('../controllers/hrController');
const  authenticate = require('../middlesware/authenticate');

// Login (يوزر يدخل)


// جلب كل الموظفين اللي رولهم Employee
router.get('/', authenticate, getAllEmployees);
// get contrcacts
router.get('/getContractsStats' ,authenticate,getContractsStats) ;
router.get('/getAllContracts' ,authenticate ,getAllContracts)
router.get('/getOneemployee/:id',authenticate , getEmployeeById)
router.post('/',authenticate ,createEmployee)
router.delete('/deleteEmployee/:id' ,authenticate ,deleteEmployee)

module.exports = router;
