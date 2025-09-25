// Admin/routes/notificationRoutes.js
const express = require("express");
const router = express.Router();
const {getNotifications ,markRead ,markAllRead} = require("../controllers/notificationController");

// middleware المصادقة — عدّل المسار حسب مشروعك
const authenticate=require('../middlesware/authenticate');

// GET /api/notifications?limit=20&skip=0
router.get("/", authenticate, getNotifications);

// POST /api/notifications/:id/read
router.post("/:id/read", authenticate, markRead);

// POST /api/notifications/mark-all-read
router.post("/mark-all-read", authenticate, markAllRead);

module.exports = router;
