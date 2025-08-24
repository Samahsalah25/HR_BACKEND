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


module.exports = { createCompanyLeaves ,getCompanyLeaves  };
