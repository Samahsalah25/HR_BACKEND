const Contract = require('../models/Contract');

// @desc Get all contracts
exports.getContracts = async (req, res) => {
  try {
    const contracts = await Contract.find({});
    res.json(contracts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Create a new contract

exports.createContract = async (req, res) => {
  try {
    const { name, duration, unit } = req.body;
    if (!name) return res.status(400).json({ message: 'Contract name is required' });
    if (!duration) return res.status(400).json({ message: 'Contract duration is required' });

    const exists = await Contract.findOne({ name });
    if (exists) return res.status(400).json({ message: 'Contract already exists' });

    const contract = await Contract.create({ name, duration, unit });
    res.status(201).json(contract);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// @desc Delete a contract
exports.deleteContract = async (req, res) => {
  try {
    const contract = await Contract.findById(req.params.id);
    if (!contract) return res.status(404).json({ message: 'Contract not found' });

    await contract.remove();
    res.json({ message: 'Contract deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
