const express = require("express");
const router = express.Router();
const { createAdminPenalty ,getAllPenalties ,getPenaltyDetail } = require("../controllers/administrativePenalty");
const authenticate = require("../middlesware/authenticate"); // لو عندك middleware لتسجيل الدخول

router.post("/", authenticate, createAdminPenalty);
router.get('/getAllPenalties' ,authenticate ,getAllPenalties)
router.get('/getPenaltyDetail/:type/:id' ,authenticate ,getPenaltyDetail)
module.exports = router;
