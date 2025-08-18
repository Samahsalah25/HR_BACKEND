const express = require('express');
const router = express.Router();
const { createResidencyYear, getResidencyYears } = require('../controllers/ResidencyYear');

router.post('/', createResidencyYear);
router.get('/', getResidencyYears);

module.exports = router;
