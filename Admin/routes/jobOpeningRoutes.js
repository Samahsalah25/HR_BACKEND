// routes/jobOpeningRoutes.js
const express = require('express');
const { createJobOpening, getAllJobOpenings ,getJobOpeningById,
  updateJobOpening,
  deleteJobOpening,
  changeJobOpeningStatus ,getPublishedJobs, getPublishedJobById  }=require("../controllers/jobOpeningController.js") ;
const authenticate =require( "../middlesware/authenticate.js");
const validate=require("../middlesware/validate.js");
const router = express.Router();
const createJobOpeningSchema=require("../validations/jobOpeningValidator.js")

router.post("/", authenticate,validate(createJobOpeningSchema) , createJobOpening);
// get public
// جلب كل الوظائف المنشورة
router.get('/jobs', getPublishedJobs);

// جلب وظيفة واحدة بالتفاصيل
router.get('/jobs/:id', getPublishedJobById);


router.get("/", authenticate, getAllJobOpenings);
router.get("/:id", authenticate, getJobOpeningById);
router.patch("/:id", authenticate, validate(createJobOpeningSchema) ,updateJobOpening);
router.delete("/:id", authenticate, deleteJobOpening);
router.patch("/:id/status",authenticate, changeJobOpeningStatus);



module.exports = router;
