const express = require("express");
const router = express.Router();
const { createAdminPenalty ,getAllPenalties , getEmployeePenalties,getPenaltyDetail ,getDepartmentsByBranch ,getEmployeesByBranchAndDepartment } = require("../controllers/administrativePenalty");
const authenticate = require("../middlesware/authenticate"); // لو عندك middleware لتسجيل الدخول

router.post("/", authenticate, createAdminPenalty);
router.get('/getAllPenalties' ,authenticate ,getAllPenalties)
router.get(
  "/employees/by-branch-department",
  authenticate,        // لو عندك auth
  getEmployeesByBranchAndDepartment
);
router.get(
  "/departments/by-branch",
  authenticate,        // لو عندك auth
  getDepartmentsByBranch
);
router.get('/getEmployeePenalties/:employeeId', authenticate,getEmployeePenalties)

router.get('/getPenaltyDetail/:type/:id' ,authenticate ,getPenaltyDetail)
module.exports = router;
