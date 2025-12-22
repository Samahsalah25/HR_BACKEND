const express = require("express");
const router = express.Router();

const authenticate = require("../middlesware/authenticate");
const uploadLateExcuseFile = require("../middlesware/uploadLateExcuse");
const { createLateExcuse  ,  getPendingExcuses,
  approveExcuse,
  rejectExcuse ,getExcuseByAttendance } = require("../controllers/lateExcuseController");

router.post(
  "/",
  authenticate,
  uploadLateExcuseFile.single("file"),
  createLateExcuse
);
router.get("/pending", authenticate, getPendingExcuses);
// gg
router.get('/by-attendance/:attendanceId' ,authenticate ,getExcuseByAttendance)
// قبول العذر
router.patch("/:id/approve", authenticate, approveExcuse);

// رفض العذر + خصم
router.patch("/:id/reject", authenticate, rejectExcuse);


module.exports = router;
