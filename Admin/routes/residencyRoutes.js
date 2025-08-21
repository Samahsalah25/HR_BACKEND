const express = require('express');
const router = express.Router();
const { createResidencyYear, getResidencyYears } = require('../controllers/ResidencyYear');
const authenticate=require('../middlesware/authenticate');
const authorizeRoles=require('../middlesware/roleMiddleware');

router.post('/',authenticate,authorizeRoles('ADMIN'), createResidencyYear);
router.get('/',authenticate,authorizeRoles('ADMIN'), getResidencyYears);

module.exports = router;
