const express = require('express');
const router = express.Router();
const {getRecords ,createRecord} = require('../controllers/licencecontroller');
const authenticate=require('../middlesware/authenticate');
const authorizeRoles=require('../middlesware/roleMiddleware');

router.post('/create' ,authenticate,authorizeRoles('ADMIN'), createRecord);
router.get('/' ,authenticate,authorizeRoles('ADMIN'), getRecords);

module.exports = router;
