const express = require('express');
const router = express.Router();
const {getAllEmployees ,createEmployee ,getContractsStats  ,getAllContracts,getEmployeeById ,deleteEmployee ,getEmployeesByBranch ,updateEmployee ,getManagerss} = require('../controllers/hrController');
const  authenticate = require('../middlesware/authenticate');
const validate=require('../middlesware/validate');
const authorizeRoles=require('../middlesware/roleMiddleware');
const  {
  createEmployeeSchema,
  updateEmployeeSchema
}=require('../validations/employeeSchemas');
// Login (يوزر يدخل)

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


// جلب كل الموظفين اللي رولهم Employee
router.get('/' , getAllEmployees);
router.get('/managers' ,getManagerss)
router.get('/getEmployeesByBranch' ,authenticate ,authorizeRoles('HR') ,getEmployeesByBranch)

// get contrcacts

router.get('/getContractsStats' ,authenticate ,authorizeRoles('HR' ,'ADMIN'),getContractsStats) 
router.get('/getAllContracts' ,getAllContracts)
router.get('/getOneemployee/:id' , getEmployeeById)
router.post('/' ,validate(createEmployeeSchema) ,createEmployee)
router.delete('/deleteEmployee/:id' ,deleteEmployee)
router.patch(
  '/updateemployee/:id',
  upload.array("newDocuments"), // ← الاسم لازم يطابق اسم الحقل في FormData من الفرونت
  validate(updateEmployeeSchema),
  updateEmployee
);
                            
module.exports = router;
