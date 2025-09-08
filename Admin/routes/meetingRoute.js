const express = require('express');
const router = express.Router();
const { createMeeting ,getMyMeetings} = require('../controllers/meetingController');
const authenticate=require('../middlesware/authenticate');
const authorizeRoles=require('../middlesware/roleMiddleware');
const validate=require('../middlesware/validate');
const {meetingValidationSchema  }=require('../validations/meetingValidation');


router.post('/' ,authenticate ,validate(meetingValidationSchema) ,createMeeting);


router.get('/my' ,authenticate ,getMyMeetings)



module.exports = router;