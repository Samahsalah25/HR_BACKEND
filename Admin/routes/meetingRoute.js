const express = require('express');
const router = express.Router();
const { createMeeting ,getMyMeetings ,getMeetingById ,updateMeeting ,deleteMeeting} = require('../controllers/meetingController');
const authenticate=require('../middlesware/authenticate');
const authorizeRoles=require('../middlesware/roleMiddleware');
const validate=require('../middlesware/validate');
const {meetingValidationSchema  }=require('../validations/meetingValidation');


router.post('/' ,authenticate ,validate(meetingValidationSchema) ,createMeeting);


router.get('/my' ,authenticate ,getMyMeetings)
router.get('/:id' ,authenticate ,getMeetingById);
router.patch('/:id' ,authenticate ,validate(meetingValidationSchema) , updateMeeting)
router.delete('/:id' ,authenticate ,deleteMeeting)
module.exports = router;