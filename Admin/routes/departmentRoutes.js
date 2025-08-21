// routes/departmentRoutes.js
const express = require('express');
const router = express.Router();
const { createDepartment, getDepartments } = require('../controllers/departmentController');
const authorizeRoles=require('../middlesware/roleMiddleware');
const authenticate = require("../middlesware/authenticate");

router.post('/', authenticate,authorizeRoles('ADMIN'),createDepartment);
router.get('/',authenticate,authorizeRoles('ADMIN'), getDepartments);

module.exports = router;