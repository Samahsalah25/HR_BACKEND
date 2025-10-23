const Residency = require("../models/residencyModel");
const Employee = require("../models/employee");

// إضافة إقامة جديدة لموظف
exports.createResidency = async (req, res) => {
  try {
    const { employeeId, residencyNumber, issuingAuthority, residencyType, issueDate, expiryDate, status } = req.body;

    const employee = await Employee.findById(employeeId);
    if (!employee) {
      return res.status(404).json({ success: false, message: "الموظف غير موجود" });
    }

    const newResidency = await Residency.create({
      employee: employeeId,
      residencyNumber,
      issuingAuthority,
      residencyType,
      issueDate,
      expiryDate,
      status
    });

    res.status(201).json({
      success: true,
      message: "تم إضافة الإقامة بنجاح",
      data: newResidency
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "حدث خطأ أثناء إضافة الإقامة",
      error: error.message
    });
  }
};

//  جلب كل الإقامات مع بيانات الموظف
exports.getAllResidencies = async (req, res) => {
  try {
    const residencies = await Residency.find().populate("employee", "name employeeNumber jobTitle department");
    res.status(200).json({
      success: true,
      data: residencies
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "حدث خطأ أثناء جلب الإقامات",
      error: error.message
    });
  }
};

// جلب إقامة موظف محدد
exports.getResidencyByEmployee = async (req, res) => {
  try {
    const { id} = req.params;

    const residency = await Residency.findOne({ employee: id }).populate("employee", "name employeeNumber jobTitle department");

    if (!residency) {
      return res.status(404).json({ success: false, message: "لا توجد إقامة لهذا الموظف" });
    }

    res.status(200).json({
      success: true,
      data: residency
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "حدث خطأ أثناء جلب الإقامة",
      error: error.message
    });
  }
};

// تعديل بيانات الإقامة
exports.updateResidency = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const residency = await Residency.findByIdAndUpdate(id, updates, { new: true });

    if (!residency) {
      return res.status(404).json({ success: false, message: "الإقامة غير موجودة" });
    }

    res.status(200).json({
      success: true,
      message: "تم تحديث الإقامة بنجاح",
      data: residency
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "حدث خطأ أثناء تحديث الإقامة",
      error: error.message
    });
  }
};

//  حذف إقامة
exports.deleteResidency = async (req, res) => {
  try {
    const { id } = req.params;

    const residency = await Residency.findByIdAndDelete(id);

    if (!residency) {
      return res.status(404).json({ success: false, message: "الإقامة غير موجودة" });
    }

    res.status(200).json({
      success: true,
      message: "تم حذف الإقامة بنجاح"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "حدث خطأ أثناء حذف الإقامة",
      error: error.message
    });
  }
};

//  Get Residency by ID
exports.getResidencyById = async (req, res) => {
  try {
    const { id } = req.params;

    const residency = await Residency.findById(id)
      .populate("employee", "name employeeNumber jobTitle department")
    

    if (!residency) {
      return res.status(404).json({
        success: false,
        message: "لم يتم العثور على الإقامة المطلوبة"
      });
    }

    res.status(200).json({
      success: true,
      residency
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "حدث خطأ أثناء جلب بيانات الإقامة",
      error: error.message
    });
  }
};
