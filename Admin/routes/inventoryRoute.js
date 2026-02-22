const express = require('express');
const router = express.Router();
const authenticate = require('../middlesware/authenticate');
const validate = require('../middlesware/validate');
const { createAssets, updateAssets, deleteAssets, getAssetsById, getAllAssets } = require("../controllers/inventoryController.js")
const authorizeRoles = require('../middlesware/roleMiddleware');

const {
    assetValidationSchema
} = require('../validations/assetValidationSchemaValidation.js');


router.post("/createAssets", authenticate, authorizeRoles("ADMIN"), validate(assetValidationSchema), createAssets)

router.patch("/updateAssets/:id", authenticate, authorizeRoles("ADMIN"), updateAssets)

router.delete("/deleteAssets/:id", authenticate, authorizeRoles("ADMIN"), deleteAssets)

router.get("/getAssetsById/:id", authenticate, authorizeRoles("ADMIN"), getAssetsById)

router.get("/getAllAssets", authenticate, authorizeRoles("ADMIN" ,"HR"), getAllAssets)



module.exports = router;

