const express = require("express");
const router = express.Router();
const additionController = require("../controllers/additionController");
const authenticate=require('../middlesware/authenticate');

// إضافة جديدة (موظف واحد / قسم / كل الموظفين)
router.post("/",authenticate, additionController.createAddition);

// تحديث حالة المكافأة (مقبول / مرفوض / مدفوع)
router.patch("/:id/status", additionController.updateAdditionStatus);

// جلب كل الإضافات
router.get("/", additionController.getAllAdditions);
router.get("/employee-additions/:employeeId",additionController.getEmployeeAdditions);


module.exports = router;
