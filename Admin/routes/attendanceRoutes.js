// routes/attendanceRoutes.js
const express = require('express');
const router = express.Router();
const { checkIn ,checkOut ,getTodayAttendance } = require('../controllers/attendanceController');
const authenticate=require('../middlesware/authenticate');

// تسجيل الحضور (Check-In)
router.post('/checkin', authenticate, checkIn);

// لاحقاً ممكن نضيف:
router.post('/checkout', authenticate, checkOut);

//
router.get("/today/:id", authenticate, getTodayAttendance);

module.exports = router;
