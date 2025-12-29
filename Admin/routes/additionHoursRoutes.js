// routes/additionHoursRoutes.js
const express = require('express');
const router = express.Router();
const additionHoursController = require('../controllers/additionHoursController');
const authenticate=require('../middlesware/authenticate');


router.get("/payroll/my",authenticate,additionHoursController.getMyMonthlyPayroll);
router.get('/getMonthlyPayrollForHr' ,authenticate ,additionHoursController.getMonthlyPayrollForHr)
router.get('/:attendanceId', additionHoursController.getAdditionHours);
router.patch('/:id', additionHoursController.updateAdditionHours);


module.exports = router;
