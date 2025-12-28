// routes/additionHoursRoutes.js
const express = require('express');
const router = express.Router();
const additionHoursController = require('../controllers/additionHoursController');
const authenticate=require('../middlesware/authenticate');

router.get('/:attendanceId', additionHoursController.getAdditionHours);
router.get("/payroll/my",authenticate,additionHoursController.getMyMonthlyPayroll);
router.patch('/:id', additionHoursController.updateAdditionHours);


module.exports = router;
