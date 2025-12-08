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
// const { v2: cloudinary } = require("cloudinary");
// const multer = require("multer");
// const { CloudinaryStorage } = require("multer-storage-cloudinary");

// // إعداد Cloudinary
// cloudinary.config({
//   cloud_name: process.env.CLOUD_NAME,
//   api_key: process.env.CLOUD_KEY,
//   api_secret: process.env.CLOUD_SECRET,
// });

// // إعداد التخزين على Cloudinary
// const storage = new CloudinaryStorage({
//   cloudinary,
//   params: {
//     folder: "employee-documents", // مجلد التخزين على Cloudinary
//     allowed_formats: ["jpg", "png", "pdf", "docx", "txt"], // الصيغ المسموحة
//   },
// });

// // إعداد Multer
// const upload = multer({ storage });
const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("cloudinary").v2;

cloudinary.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.CLOUD_KEY,
  api_secret: process.env.CLOUD_SECRET,
});

console.log("Cloudinary Config:", process.env.CLOUD_NAME, process.env.CLOUD_KEY, process.env.CLOUD_SECRET);

// إعداد التخزين على Cloudinary
const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "employee-documents", // مجلد التخزين على Cloudinary
   allowed_formats: [
  "jpg", "jpeg", "png", "gif", "webp", // صور
  "pdf", "docx", "doc", "txt", // مستندات
  "mp4", "mov", "avi", // فيديو
  "mp3", "wav", "aac", // صوت
  "zip", "tar", "rar", // ملفات مضغوطة
  "csv", "xls", "xlsx" // ملفات أخرى
]
 // الصيغ المسموحة
  },
});

// إعداد Multer
const upload = multer({ storage });

// إضافة لوجات داخل الميدل وير:
const fileUploadMiddleware = upload.array("newDocuments", 5); // اسم الحقل في FormData
const logUpload = (req, res, next) => {
  console.log("Cloudinary Config:", process.env.CLOUD_NAME, process.env.CLOUD_KEY, process.env.CLOUD_SECRET);
  console.log("Received request body:", req.body);
  console.log("Received files:", req.files);

  // إذا لم يتم إرسال ملفات، اترك رسالة تحذير
  if (!req.files || req.files.length === 0) {
    console.error("No files were uploaded!");
  } else {
    console.log("Files uploaded:", req.files);
  }
  next();
};


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
  "/updateemployee/:id",
  logUpload,  // الميدل وير الخاص باللوجات
  fileUploadMiddleware, // ميدل وير الرفع
  (req, res, next) => {
    // هنا ممكن تكمل الفحص لو الملفات تم رفعها بنجاح
    if (req.files) {
      console.log("Files uploaded successfully:", req.files);
    }
    next(); // الانتقال للخطوة التالية في مسار الـ API
  },
  validate(updateEmployeeSchema),  // فحص البيانات
  updateEmployee  // المنطق النهائي بعد الرفع
);
                            
module.exports = router;
