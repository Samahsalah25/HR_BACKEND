const ResidencyYear = require('../models/ResidencyYear');
const Employee=require('../models/employee')
exports.createResidencyYear = async (req, res) => {
  try {
    const { year } = req.body;
    const exists = await ResidencyYear.findOne({ year });
    if (exists) return res.status(400).json({ message: ' سنة الإقامة بالفعل موجودة' });

    const newYear = await ResidencyYear.create({ year });
    res.status(201).json(newYear);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getResidencyYears = async (req, res) => {
  try {
    const years = await ResidencyYear.find();
    res.json(years);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Update Residency Year
exports.updateResidencyYear = async (req, res) => {
  try {
    const { id } = req.params;
    const { year } = req.body;

    const residencyYear = await ResidencyYear.findById(id);
    if (!residencyYear) {
      return res.status(404).json({ message: 'الإقامة غير موجودة' });
    }
      const exists = await ResidencyYear.findOne({ year });
    if (exists) return res.status(400).json({ message: ' سنة الإقامة بالفعل موجودة' });


    // check if residency year is used in employees
    const isUsed = await Employee.exists({ "residency.duration": id });

    if (isUsed) {
      return res.status(400).json({
        message: "لا يمكن تعديل عدد سنوات الإقامة لأنها مستخدمة بالفعل عند موظفين"
      });
    }

    if (year) residencyYear.year = year;

    await residencyYear.save();
    res.json({ message: "تم تحديث الإقامة بنجاح", residencyYear });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
// Delete Residency Year
exports.deleteResidencyYear = async (req, res) => {
  try {
    const { id } = req.params;

    const residencyYear = await ResidencyYear.findById(id);
    if (!residencyYear) {
      return res.status(404).json({ message: "الإقامة غير موجودة" });
    }

    // check if residency year is used in employees
    const isUsed = await Employee.exists({ "residency.duration": id });

    if (isUsed) {
      return res.status(400).json({
        message: "لا يمكن حذف مدة الإقامة لأنها مستخدمة بالفعل عند موظفين"
      });
    }

    await residencyYear.deleteOne();
    res.json({ message: "تم حذف الإقامة بنجاح" });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get one Residency Year
exports.getResidencyYearById = async (req, res) => {
  try {
    const { id } = req.params;
    const residencyYear = await ResidencyYear.findById(id);

    if (!residencyYear) {
      return res.status(404).json({ message: "الإقامة غير موجودة" });
    }

    res.json(residencyYear);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
