const express = require('express');
const router = express.Router();
const { createEmployee } = require('../controllers/employee');
const authenticate=require('../middlesware/authenticate');
const authorizeRoles=require('../middlesware/roleMiddleware');
const validate=require('../middlesware/validate');
const  {
  createEmployeeSchema,
  updateEmployeeSchema
}=require('../validations/employeeSchemas');

router.post('/',authenticate,authorizeRoles('HR'), validate(createEmployeeSchema),createEmployee);



module.exports = router;
