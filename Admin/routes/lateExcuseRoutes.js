const express = require("express");
const router = express.Router();

const authenticate = require("../middlesware/authenticate");
const uploadLateExcuseFile = require("../middlesware/uploadLateExcuse");
const { createLateExcuse } = require("../controllers/lateExcuseController");

router.post(
  "/",
  authenticate,
  uploadLateExcuseFile.single("file"),
  createLateExcuse
);

module.exports = router;
