// routes/additionHoursRoutes.js
const express = require('express');
const router = express.Router();
const additionHoursController = require('../controllers/additionHoursController');

router.get('/:attendanceId', additionHoursController.getAdditionHours);
router.patch('/:id', additionHoursController.updateAdditionHours);

module.exports = router;
