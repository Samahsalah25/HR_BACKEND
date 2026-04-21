const express = require("express");
const router = express.Router();

const authenticate = require("../middlesware/authenticate");
const authorizeRoles = require("../middlesware/roleMiddleware");

const {
  createInsurance,
  getInsurances,
  getInsuranceById,
  updateInsurance,
  deleteInsurance,
} = require("../controllers/InsuranceController");

// ➤ إنشاء تأمين
router.post(
  "/",
  authenticate,
  
  createInsurance
);

//  كل التأمينات
router.get(
  "/",
  authenticate,
  getInsurances
);

//  تأمين واحد
router.get(
  "/:id",
  authenticate,
  getInsuranceById
);

//  تعديل
router.patch(
  "/:id",
  authenticate,
 
  updateInsurance
);

//  حذف
router.delete(
  "/:id",
  authenticate,

  deleteInsurance
);

module.exports = router;