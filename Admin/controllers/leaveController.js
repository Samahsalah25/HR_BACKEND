// controllers/leaveController.js
const LeaveBalance = require("../models/leaveBalanceModel");
const Employee = require("../models/employee");

const createCompanyLeaves = async (req, res) => {
  try {
    const { annual, sick, marriage, emergency, maternity, unpaid } = req.body;

    if (!annual || !sick || !marriage || !emergency || !maternity || unpaid === undefined) {
      return res.status(400).json({
        success: false,
        message: "يرجى تحديد جميع أنواع الإجازات وعدد الأيام"
      });
    }


    const companyLeaves = new LeaveBalance({
      employee: null, 
      annual,
      sick,
      marriage,
      emergency,
      maternity,
      unpaid
    });

    await companyLeaves.save();

    res.status(201).json({
      success: true,
      message: "تم إنشاء الإجازات الافتراضية للشركة بنجاح",
      data: companyLeaves
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "حدث خطأ أثناء إنشاء الإجازات",
      error: error.message
    });
  }
};
const getCompanyLeaves = async (req, res) => {
  try {
    const companyLeaves = await LeaveBalance.findOne({ employee: null });
    if (!companyLeaves) {
      return res.status(404).json({
        success: false,
        message: "لم يتم إعداد الإجازات الافتراضية للشركة بعد"
      });
    }

    res.json({
      success: true,
      data: companyLeaves
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "حدث خطأ أثناء جلب الإجازات",
      error: error.message
    });
  }
};
const getLeaveById = async (req, res) => {
  try {
    const { id } = req.params;
    const leave = await LeaveBalance.findById(id).populate("employee", "name");

    if (!leave) {
      return res.status(404).json({
        success: false,
        message: "لم يتم العثور على الإجازة المطلوبة",
      });
    }

    res.json({
      success: true,
      data: leave,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "حدث خطأ أثناء جلب الإجازة",
      error: error.message,
    });
  }
};

//  تعديل إعدادات الإجازة حسب الـ ID
const updateLeaveById = async (req, res) => {
  try {
    const { id } = req.params;
    const { annual, sick, marriage, emergency, maternity, unpaid } = req.body;

    const updatedLeave = await LeaveBalance.findByIdAndUpdate(
      id,
      { annual, sick, marriage, emergency, maternity, unpaid },
      { new: true }
    );

    if (!updatedLeave) {
      return res.status(404).json({
        success: false,
        message: "لم يتم العثور على الإجازة المطلوبة للتعديل",
      });
    }

    res.json({
      success: true,
      message: "تم تحديث الإجازة بنجاح",
      data: updatedLeave,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "حدث خطأ أثناء تحديث الإجازة",
      error: error.message,
    });
  }
};


const deleteLeaveById = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await LeaveBalance.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: "لم يتم العثور على الإجازة المطلوبة للحذف",
      });
    }

    res.json({
      success: true,
      message: "تم حذف الإجازة بنجاح",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "حدث خطأ أثناء حذف الإجازة",
      error: error.message,
    });
  }
};


module.exports = { createCompanyLeaves ,getCompanyLeaves ,deleteLeaveById ,updateLeaveById ,getLeaveById  };
