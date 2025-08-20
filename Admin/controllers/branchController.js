// controllers/branchController.js
const Branch = require("../models/branchSchema");


const createBranch = async (req, res) => {
  try {
    const branch = new Branch(req.body);
    await branch.save();
    res.status(201).json({ success: true, data: branch });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};


const getBranches = async (req, res) => {
  try {
    const branches = await Branch.find();
    res.json({ success: true, data: branches });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};


const updateBranch = async (req, res) => {
  try {
    const branch = await Branch.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!branch) return res.status(404).json({ success: false, error: "الفرع غير موجود" });
    res.json({ success: true, data: branch });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
};


const deleteBranch = async (req, res) => {
  try {
    const branch = await Branch.findByIdAndDelete(req.params.id);
    if (!branch) return res.status(404).json({ success: false, error: "الفرع غير موجود" });
    res.json({ success: true, message: "تم حذف الفرع" });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = { createBranch, getBranches, updateBranch, deleteBranch };
