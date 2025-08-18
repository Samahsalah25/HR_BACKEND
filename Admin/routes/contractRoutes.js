const express = require('express');
const router = express.Router();
const {
  getContracts,
  createContract,
  deleteContract,
} = require('../controllers/contractController');


router.get('/', getContracts);
router.post('/', createContract);
router.delete('/:id', deleteContract);

module.exports = router;
