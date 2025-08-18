const Department =require('../models/depaertment')
exports.createDepartment = async (req, res) => {
  try {
    const { name  } = req.body;
    const exists = await Department.findOne({ name });
    if (exists) return res.status(400).json({ message: 'Department already exists' });

    const department = await Department.create({ name });
    res.status(201).json(department);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// عرض كل الأقسام
exports.getDepartments = async (req, res) => {
  try {
    const departments = await Department.find();
    res.json(departments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};