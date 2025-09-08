// routes/departmentRoutes.js
const express = require('express');
const router = express.Router();
const { createDepartment, getDepartments ,getDepartmentById ,updateDepartment ,deleteDepartment } = require('../controllers/departmentController');
const authorizeRoles=require('../middlesware/roleMiddleware');
const authenticate = require("../middlesware/authenticate");
const validate=require('../middlesware/validate');
const {
  createDepartmentSchema,
  updateDepartmentSchema,
}=require('../validations/departmentValidation');

router.post('/', authenticate,authorizeRoles('HR') ,validate(createDepartmentSchema),createDepartment);
router.get('/', getDepartments);
router.get('/:id',authenticate,authorizeRoles('HR'), getDepartmentById);
router.patch('/:id',authenticate,authorizeRoles('HR') ,validate(updateDepartmentSchema), updateDepartment);
router.delete('/:id',authenticate,authorizeRoles('HR'), deleteDepartment);
module.exports = router;