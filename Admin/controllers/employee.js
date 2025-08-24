const Employee = require('../models/employee');
const User = require('../models/user')
const Contract = require('../models/Contract');
const ResidencyYear = require('../models/ResidencyYear');
const LeaveBalance=require('../models/leaveBalanceModel')
const mongoose=require('mongoose')


exports.createEmployee = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const {
      name,
      email,
      password,
      jobTitle,
      employeeNumber,
      department,
      manager,
      employmentType,
      contractStart,
      contractDurationId,
      residencyStart,
      residencyDurationId,
      workHoursPerWeek,
      workplace,
      salary,
      role
    } = req.body;

    if (req.user.role !== "HR") {
      return res.status(403).json({ message: "ليس لديك صلاحية" });
    }

    // ✅ تشيك مسبق على الايميل
    const emailExists = await User.findOne({ email }).session(session);
    if (emailExists) {
      return res.status(400).json({ message: "البريد الإلكتروني مستخدم بالفعل" });
    }

    // ✅ تشيك مسبق على رقم الموظف
    const empNumExists = await Employee.findOne({ employeeNumber }).session(session);
    if (empNumExists) {
      return res.status(400).json({ message: "رقم الموظف مستخدم بالفعل" });
    }

    // إنشاء المستخدم
    const user = await User.create([{ name, email, password, role }], { session });

    // إنشاء الموظف
    let employee = await Employee.create([{
      name,
      jobTitle,
      employeeNumber,
      department,
      manager,
      employmentType,
      contract: { start: contractStart, duration: contractDurationId },
      residency: { start: residencyStart, duration: residencyDurationId },
      workHoursPerWeek,
      workplace,
      salary,
      user: user[0]._id
    }], { session });

    employee = employee[0];

    // جلب رصيد الإجازات الافتراضي
    const companyLeaves = await LeaveBalance.findOne({ employee: null }).session(session);
    if (!companyLeaves) {
      throw new Error("رصيد الإجازات الافتراضي للشركة غير محدد");
    }

    await LeaveBalance.create([{
      employee: employee._id,
      annual: companyLeaves.annual,
      sick: companyLeaves.sick,
      marriage: companyLeaves.marriage,
      emergency: companyLeaves.emergency,
      maternity: companyLeaves.maternity,
      unpaid: companyLeaves.unpaid
    }], { session });

    // ✅ لو كله تمام نعمل commit
    await session.commitTransaction();
    session.endSession();

    // ✅ بعد الكوميت نعمل populate براحه
    const populatedEmployee = await Employee.findById(employee._id)
      .populate("contract.duration")
      .populate("residency.duration");

    res.status(201).json({ user: user[0], employee: populatedEmployee });

  } catch (error) {
    await session.abortTransaction();
    session.endSession();

    // ✅ مسك errors بتاعت الـ duplicate keys
    if (error.code === 11000) {
      if (error.keyPattern?.employeeNumber) {
        return res.status(400).json({ message: "رقم الموظف مستخدم بالفعل" });
      }
      if (error.keyPattern?.email) {
        return res.status(400).json({ message: "البريد الإلكتروني مستخدم بالفعل" });
      }
      return res.status(400).json({ message: "قيمة مكررة في البيانات" });
    }

    console.error(error);
    res.status(500).json({ message: "حدث خطأ أثناء إنشاء الموظف", error: error.message });
  }
};
