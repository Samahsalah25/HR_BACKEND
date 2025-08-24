// routes/branchRoutes.js
const express = require("express");
const router = express.Router();
const { createBranch, getBranches, updateBranch, deleteBranch } = require("../controllers/branchController");
const authenticate = require("../middlesware/authenticate");
const authorizeRoles=require('../middlesware/roleMiddleware')
const validate=require('../middlesware/validate');
const {
  createBranchSchema,
  updateBranchSchema,
}=require('../validations/branchvalidation');
// Routes (Admin only)
router.post("/", authenticate,authorizeRoles('ADMIN'),validate(createBranchSchema), createBranch);
router.get("/", authenticate,authorizeRoles('ADMIN'), getBranches);
router.patch("/:id", authenticate,authorizeRoles('ADMIN') ,validate(updateBranchSchema), updateBranch);
router.delete("/:id", authenticate,authorizeRoles('ADMIN'), deleteBranch);

module.exports = router;
