const express = require('express');
const router = express.Router();
const {createAbsencePenalty} = require('../controllers/absesncePenaltyController');
const authenticate=require('../middlesware/authenticate');


router.post("/",authenticate,createAbsencePenalty);


module.exports = router;
