const Insurance = require("../models/InsuranceModel");
const Employee = require("../models/employee");

//  إنشاء تأمين جديد
exports.createInsurance = async (req, res) => {
  try {
    const { name, percentage } = req.body;

    const exists = await Insurance.findOne({ name });
    if (exists) {
      return res.status(400).json({ message: "اسم التأمين موجود بالفعل" });
    }

    const insurance = await Insurance.create({
      name,
      percentage,
    });

    res.status(201).json(insurance);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ➤ عرض كل التأمينات
exports.getInsurances = async (req, res) => {
  try {
    const insurances = await Insurance.find();
    res.json(insurances);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

//  تأمين واحد
exports.getInsuranceById = async (req, res) => {
  try {
    const insurance = await Insurance.findById(req.params.id);

    if (!insurance) {
      return res.status(404).json({ message: "التأمين غير موجود" });
    }

    res.json(insurance);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

//  تعديل تأمين
exports.updateInsurance = async (req, res) => {
  try {
    const { id } = req.params;

    const insurance = await Insurance.findByIdAndUpdate(id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!insurance) {
      return res.status(404).json({ message: "التأمين غير موجود" });
    }

    res.json(insurance);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ message: "اسم التأمين مستخدم بالفعل" });
    }
    res.status(500).json({ message: err.message });
  }
};

//  حذف تأمين (مع منع الحذف لو مستخدم)
exports.deleteInsurance = async (req, res) => {
  try {
    const { id } = req.params;

    const insurance = await Insurance.findById(id);
    if (!insurance) {
      return res.status(404).json({ message: "التأمين غير موجود" });
    }

    // لو في موظفين مربوطين بيه (اختياري لو ربطتيه لاحقاً)
    const isUsed = await Employee.exists({
      "insurances.insurance": id,
    });

    if (isUsed) {
      return res.status(400).json({
        message: "لا يمكن حذف التأمين لأنه مستخدم عند موظفين",
      });
    }

    await insurance.deleteOne();
    res.json({ message: "تم حذف التأمين بنجاح" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};