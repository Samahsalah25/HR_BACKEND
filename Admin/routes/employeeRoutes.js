const express = require('express');
const router = express.Router();
const { createEmployee ,employeeStatus ,employeeOverview ,getMyAttendanceRecord ,getEmployees ,getMyAttendanceThroughMonth  ,getMyRequests ,getMyTasks} = require('../controllers/employee');
const authenticate=require('../middlesware/authenticate');
const authorizeRoles=require('../middlesware/roleMiddleware');
const validate=require('../middlesware/validate');
const  {
  createEmployeeSchema,
  updateEmployeeSchema
}=require('../validations/employeeSchemas');

// cloudinary-config.js
const { v2: cloudinary } = require("cloudinary");
const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");

// إعداد Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_KEY,
  api_secret: process.env.CLOUD_SECRET,
});

// إعداد التخزين على Cloudinary
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "employee-documents", // مجلد التخزين على Cloudinary
    allowed_formats: ["jpg", "png", "pdf", "docx", "txt"], // الصيغ المسموحة
  },
});

// إعداد Multer
const upload = multer({ storage });



router.post('/',authenticate,authorizeRoles('HR' ,"ADMIN"), upload.array("documents"), validate(createEmployeeSchema), createEmployee);
router.patch('/:id' ,authenticate ,authorizeRoles('HR' ,"ADMIN"), validate(createEmployeeSchema),createEmployee)
//here get workstartTime and date:
router.get('/status' ,authenticate ,employeeStatus)

// get employees to meating or tasks
router.get('/all' ,authenticate ,getEmployees)

// my enfoo
router.get('/myinfo' ,authenticate ,employeeOverview)

//سجلات الحضور هنا بتاعت الموظف
router.get('/myattendance' ,authenticate ,getMyAttendanceRecord)

//  هنا سجلات حضور الموظف خلال الشهر اللي احنا فيه 
router.get('/myattendancThroughMonth' ,authenticate ,getMyAttendanceThroughMonth )
//getMyTasks
router.get('/getMyTasks' ,authenticate ,getMyTasks)
//getMyRequests
router.get('/getMyRequests' ,authenticate ,getMyRequests)
module.exports = router;
