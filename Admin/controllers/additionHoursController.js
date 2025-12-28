// controllers/additionHoursController.js
const AdditionHours = require("../models/AdditionHours");
const Employee = require("../models/employee");

exports.getAdditionHours = async (req, res) => {
  try {
    const { attendanceId } = req.params;
    const addition = await AdditionHours.findOne({ attendanceId })
      .populate({ path: 'employeeId', select: 'name salary' });
    if (!addition) return res.status(404).json({ message: "ساعات الإضافة غير موجودة" });
    res.json({ success: true, addition });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "حدث خطأ" });
  }
};

exports.updateAdditionHours = async (req, res) => {
  try {
    const { id } = req.params;
    const { discountPercent } = req.body;
    const addition = await AdditionHours.findById(id).populate('employeeId');
    if (!addition) return res.status(404).json({ message: "غير موجود" });

    const salary = addition.employeeId.salary.total || 0;
    const discountValue = (salary * discountPercent) / 100;
    addition.discountPercent = discountPercent;
    addition.amount = salary + discountValue;
    await addition.save();

    res.json({ success: true, addition });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "حدث خطأ" });
  }
};
