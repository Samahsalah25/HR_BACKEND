const express = require('express');
const router = express.Router();
const { createMeeting ,getMyMeetings ,getallMyMeetings ,getMeetingById ,updateMeeting ,deleteMeeting} = require('../controllers/meetingController');
const authenticate=require('../middlesware/authenticate');
const authorizeRoles=require('../middlesware/roleMiddleware');
const validate=require('../middlesware/validate');
const {meetingValidationSchema  }=require('../validations/meetingValidation');
const multer = require("multer");

const upload = multer({ dest: "uploads/meetings" });

router.post('/' ,authenticate ,   upload.single("attachments"), validate(meetingValidationSchema) ,createMeeting);


router.get('/my' ,authenticate ,getMyMeetings)
router.get('/all' ,authenticate ,getallMyMeetings)
router.get('/:id' ,authenticate ,getMeetingById);
router.patch('/:id' ,authenticate , upload.single("attachments") ,validate(meetingValidationSchema) , updateMeeting)
router.delete('/:id' ,authenticate ,deleteMeeting)

module.exports = router;