// routes/branchRoutes.js
const express = require("express");
const router = express.Router();
const { createBranch, getBranches, updateBranch, deleteBranch } = require("../controllers/branchController");
const authenticate = require("../middlesware/authenticate");
const authorizeRoles=require('../middlesware/roleMiddleware')
// Routes (Admin only)
router.post("/", authenticate,authorizeRoles('ADMIN'), createBranch);
router.get("/", authenticate,authorizeRoles('ADMIN'), getBranches);
router.patch("/:id", authenticate,authorizeRoles('ADMIN'), updateBranch);
router.delete("/:id", authenticate,authorizeRoles('ADMIN'), deleteBranch);

module.exports = router;
