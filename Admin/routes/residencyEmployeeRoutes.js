const express = require("express");
const router = express.Router();
const {
  createResidency,
  getAllResidencies,
  getResidencyByEmployee,
  updateResidency,
  deleteResidency ,
  getResidencyById
} = require("../controllers/residencyController");

router.post("/", createResidency); 
router.get("/", getAllResidencies); 
router.get("/employee/:id", getResidencyByEmployee); 
router.patch("/:id", updateResidency);
router.delete("/:id", deleteResidency); 
router.get("/:id", getResidencyById);
module.exports = router;
