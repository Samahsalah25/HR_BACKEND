const express = require('express');
const router = express.Router();
const { createResidencyYear, getResidencyYears ,updateResidencyYear ,getResidencyYearById ,deleteResidencyYear} = require('../controllers/ResidencyYear');
const authenticate=require('../middlesware/authenticate');
const authorizeRoles=require('../middlesware/roleMiddleware');
const validate=require('../middlesware/validate');
const {
  createResidencyYearSchema,
  updateResidencyYearSchema
}= require('../validations/residencyValidation');

router.post('/',authenticate,authorizeRoles('ADMIN' ,"HR"),validate(createResidencyYearSchema), createResidencyYear);
router.get('/', getResidencyYears);
router.patch('/:id' ,authenticate ,authorizeRoles('ADMIN' ,"HR") ,validate(updateResidencyYearSchema) ,updateResidencyYear)
router.delete('/:id',authenticate,authorizeRoles('ADMIN',"HR"), deleteResidencyYear)
router.get('/:id',authenticate,authorizeRoles('ADMIN' ,"HR"),getResidencyYearById);
module.exports = router;
