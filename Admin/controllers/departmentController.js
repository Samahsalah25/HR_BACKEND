const Department =require('../models/depaertment')
const Employee = require("../models/employee");
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
exports.getDepartmentById = async (req, res) => {
  try {
    const department = await Department.findById(req.params.id);
    if (!department)
      return res.status(404).json({ message: "القسم غير موجود" });

    res.json(department);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Update Department
exports.updateDepartment = async (req, res) => {
  try {
    const { id } = req.params;

    const department = await Department.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true, // ✅ يخلي الـ mongoose يطبق الـ validation
    });

    if (!department)
      return res.status(404).json({ message: "القسم غير موجود" });

    res.json(department);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ message: "اسم القسم مستخدم بالفعل" });
    }
    res.status(500).json({ message: err.message });
  }
};


// Delete Department (if no employees use it)
exports.deleteDepartment = async (req, res) => {
  try {
    const { id } = req.params;

    const department = await Department.findById(id);
    if (!department)
      return res.status(404).json({ message: "القسم غير موجود" });

    const isUsed = await Employee.exists({ department: id });
    if (isUsed) {
      return res
        .status(400)
        .json({ message: "لا يمكن حذف القسم لأنه مستخدم عند موظفين" });
    }

    await department.deleteOne();
    res.json({ message: "تم حذف القسم بنجاح" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};