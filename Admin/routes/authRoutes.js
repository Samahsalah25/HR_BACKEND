const express = require('express');
const { register, login ,logout ,getMe } = require('../controllers/authController');
const router = express.Router();
const authenticate=require('../middlesware/authenticate');
const authorizeRoles=require('../middlesware/roleMiddleware');
const validate=require('../middlesware/validate');
const loginSchema=require('../validations/authvalidation')
const preventLoggedIn=require('../middlesware/preventlogin');


router.post('/register', register);
router.post('/login',preventLoggedIn,validate(loginSchema), login);
router.post('/logout' ,authenticate ,logout)
router.get('/me' ,authenticate ,getMe)
module.exports = router;
