const express = require('express');
const router = express.Router();
const {
  getContracts,
  createContract,
  deleteContract,
} = require('../controllers/contractController');
const authorizeRoles=require('../middlesware/roleMiddleware');
const authenticate = require("../middlesware/authenticate");
router.get('/',authenticate,authorizeRoles('ADMIN'), getContracts);
router.post('/',authenticate,authorizeRoles('ADMIN'), createContract);
router.delete('/:id',authenticate,authorizeRoles('ADMIN'), deleteContract);

module.exports = router;
