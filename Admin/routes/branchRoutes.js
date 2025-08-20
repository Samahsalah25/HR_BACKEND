// routes/branchRoutes.js
const express = require("express");
const router = express.Router();
const { createBranch, getBranches, updateBranch, deleteBranch } = require("../controllers/branchController");
const authenticate = require("../middlesware/authenticate");

// Routes (Admin only)
router.post("/", authenticate, createBranch);
router.get("/", authenticate, getBranches);
router.patch("/:id", authenticate, updateBranch);
router.delete("/:id", authenticate, deleteBranch);

module.exports = router;
