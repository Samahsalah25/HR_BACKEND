const Contract = require('../models/Contract');

const Employee = require('../models/employee');
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



// Update Contract
exports.updateContract = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, duration, unit } = req.body;

    const contract = await Contract.findById(id);
    if (!contract) return res.status(404).json({ message: "Contract not found" });

    // check if contract already used in employees
    const isUsed = await Employee.exists({ "contract.duration": id });

    // always allow name update
    if (name) contract.name = name;

    if (isUsed) {
      // لو مستخدم: duration & unit مش هيتغيروا
      if (duration || unit) {
        return res.status(400).json({ 
          message: "لا يمكن تعديل المدة أو الوحدة لأن العقد مستخدم بالفعل عند موظفين" 
        });
      }
    } else {
      // لو مش مستخدم، نسمح بتعديل كل حاجة
      if (duration) contract.duration = duration;
      if (unit) contract.unit = unit;
    }

    await contract.save();
    res.json({ message: "تم تحديث العقد بنجاح", contract });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};




// Delete Contract
exports.deleteContract = async (req, res) => {
  try {
    const { id } = req.params;

    const contract = await Contract.findById(id);
    if (!contract) {
      return res.status(404).json({ message: 'العقد غير موجود' });
    }

    // check if contract is used in employees
    const isUsed = await Employee.exists({ "contract.duration": id });
    if (isUsed) {
      return res.status(400).json({
        message: "لا يمكن حذف العقد لأنه مستخدم بالفعل عند موظفين"
      });
    }

    await contract.deleteOne();
    res.json({ message: "تم حذف العقد بنجاح" });

  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get one Contract
exports.getContractById = async (req, res) => {
  try {
    const { id } = req.params;
    const contract = await Contract.findById(id);

    if (!contract) {
      return res.status(404).json({ message: "العقد غير موجود" });
    }

    res.json(contract);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
