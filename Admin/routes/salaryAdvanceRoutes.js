// routes/salaryAdvanceRoutes.js
const express = require('express');
const router = express.Router();
const SalaryAdvanceController = require('../controllers/salaryAdvanceController');
const multer = require('multer');
const upload = multer({ dest: 'uploads/' }); // مؤقت للملفات قبل رفعها للـ Cloudinary
const authenticate = require('../middlesware/authenticate'); // مفروض عندك middleware للتحقق من اليوزر



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

module.exports = router;
