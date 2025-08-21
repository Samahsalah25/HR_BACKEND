const express = require('express');
const router = express.Router();
const { createEmployee } = require('../controllers/employee');
const authenticate=require('../middlesware/authenticate');
const authorizeRoles=require('../middlesware/roleMiddleware');

router.post('/add',authenticate,authorizeRoles('ADMIN'),  createEmployee);

module.exports = router;
