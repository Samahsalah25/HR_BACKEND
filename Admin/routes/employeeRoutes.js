const express = require('express');
const router = express.Router();
const { createEmployee } = require('../controllers/employee');
const authenticate=require('../middlesware/authenticate');

router.post('/add',authenticate,  createEmployee);

module.exports = router;
