const express = require("express");
const router = express.Router();
const {
  getSystemSettings,
  updateSystemSettings
} = require("../controllers/SystemSettingsController");

router.get("/", getSystemSettings);
router.patch("/", updateSystemSettings);

module.exports = router;
//hhehdh