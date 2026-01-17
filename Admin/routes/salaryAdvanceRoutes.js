// routes/salaryAdvanceRoutes.js
const express = require('express');
const router = express.Router();
const SalaryAdvanceController = require('../controllers/salaryAdvanceController');
const multer = require('multer');
const storage = multer.memoryStorage();
const upload = multer({ storage })
const authenticate = require('../middlesware/authenticate'); // مفروض عندك middleware للتحقق من اليوزر
const salaryAdvance = require('../models/salaryAdvance');
const {getMonthlyInstallments} =require('../controllers/salaryAdvanceController')


/**

 */
router.post(
  '/create',
  authenticate,
  upload.array('attachments'), // اسم الحقول من الـ frontend
  SalaryAdvanceController.createSalaryAdvance
);

/**
 * اعتماد السلفة
 */
router.patch('/approve/:id',authenticate, SalaryAdvanceController.approveSalaryAdvance);

/**
 * رفض السلفة
 */
router.patch('/reject/:id',authenticate , SalaryAdvanceController.rejectSalaryAdvance);

/**
 * جلب كل السلفات
 */
router.get('/',authenticate, SalaryAdvanceController.getSalaryAdvances);
router.get('/my',authenticate, SalaryAdvanceController.getMySalaryAdvances);
router.get('/getMonthlyInstallments' ,authenticate,getMonthlyInstallments) ;
// --- أقساط ---
router.post('/installment/:id/pay', SalaryAdvanceController.payInstallment);
router.post('/installment/:id/postpone', SalaryAdvanceController.postponeInstallment);

module.exports = router;
