const express = require("express");
const router = express.Router();
const  authenticate = require('../middlesware/authenticate');
const endServiceController = require("../controllers/EndservivesController");


// =====================================================
//  1) إنشاء طلب إنهاء خدمة
// POST /api/end-service
// =====================================================
router.post(
  "/", authenticate ,
  endServiceController.createEndService
);


// =====================================================
//  2) جلب العهد الحالية للموظف
// GET /api/end-service/custody/:employeeId
// =====================================================
router.get(
  "/custody/:employeeId",
  endServiceController.getEmployeeCustody
);


// =====================================================
//  3) جلب الطلبات المعلقة
// GET /api/end-service/pending/:employeeId
// =====================================================
router.get(
  "/pending/:employeeId",
  endServiceController.getPendingRequests
);


// =====================================================
//  4) رصيد الإجازات
// GET /api/end-service/leave/:employeeId
// =====================================================
router.get(
  "/leave/:employeeId",
  endServiceController.getLeaveBalance
);


// =====================================================
//  5) حساب المخالصة
// GET /api/end-service/calculate/:id
// =====================================================
router.get(
  "/calculate/:id",
  endServiceController.calculateSettlement
);


// =====================================================
//  6) إضافة خصم
// POST /api/end-service/:id/deduction
// =====================================================
router.post(
  "/:id/deduction",
  endServiceController.addDeduction
);


// =====================================================
//  7) إضافة مبلغ إضافي
// POST /api/end-service/:id/addition
// =====================================================
router.post(
  "/:id/addition",
  endServiceController.addAddition
);


// =====================================================
//  8) الإنهاء النهائي
// POST /api/end-service/:id/complete
// =====================================================
router.post(
  "/:id/complete",
  endServiceController.completeEndService
);


// =====================================================
//  9) جلب كل العمليات
// GET /api/end-service
// =====================================================
router.get(
  "/",
  endServiceController.getAllEndServices
);


// =====================================================
//  10) تفاصيل عملية واحدة
// GET /api/end-service/:id
// =====================================================
router.get(
  "/:id",
  endServiceController.getEndServiceDetails
);


module.exports = router;