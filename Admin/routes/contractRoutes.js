const express = require('express');
const router = express.Router();
const {
  getContracts,
  createContract,
  deleteContract,
  updateContract ,getContractById 
} = require('../controllers/contractController');
const authorizeRoles=require('../middlesware/roleMiddleware');
const authenticate = require("../middlesware/authenticate");
const  {
  createContractSchema,
  updateContractSchema
}= require('../validations/contractvalidation');
const validate=require('../middlesware/validate');


router.get('/', getContracts);
router.get('/:id',authenticate,authorizeRoles('HR'), getContractById);
router.post('/',authenticate,authorizeRoles('ADMIN') ,validate(createContractSchema), createContract);
router.patch('/:id' ,authenticate ,authorizeRoles('ADMIN'),validate(updateContractSchema),updateContract)
router.delete('/:id',authenticate,authorizeRoles('HR'), deleteContract);

module.exports = router;
