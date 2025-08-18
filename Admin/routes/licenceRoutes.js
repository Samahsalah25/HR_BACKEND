const express = require('express');
const router = express.Router();
const {getRecords ,createRecord} = require('../controllers/licencecontroller');

const authenticate  = require('../middlesware/authenticate'); 

router.post('/create' ,authenticate, createRecord);
router.get('/' ,authenticate, getRecords);

module.exports = router;
