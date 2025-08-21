const Employee = require('../models/employee');
const User = require('../models/user')
const Contract = require('../models/Contract');
const ResidencyYear = require('../models/ResidencyYear');
const LeaveBalance=require('../models/leaveBalanceModel')


exports.createEmployee = async (req, res) => {
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

    if (req.user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'ليس لديك صلاحية' });
    }

    // إنشاء المستخدم
    const user = await User.create({ name, email, password, role });

    // إنشاء الموظف
    let employee = await Employee.create({
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
      user: user._id
    });

    // جلب الـ populated documents لحساب الـ end
    employee = await Employee.findById(employee._id)
      .populate('contract.duration')
      .populate('residency.duration');

    // حساب نهاية العقد
    if (employee.contract.start && employee.contract.duration) {
      const end = new Date(employee.contract.start);
      if (employee.contract.duration.unit === 'years') {
        end.setFullYear(end.getFullYear() + employee.contract.duration.duration);
      } else {
        end.setMonth(end.getMonth() + employee.contract.duration.duration);
      }
      employee.contract.end = end;
    }

    // حساب نهاية الإقامة
    if (employee.residency.start && employee.residency.duration) {
      const end = new Date(employee.residency.start);
      end.setFullYear(end.getFullYear() + employee.residency.duration.year);
      employee.residency.end = end;
    }

    await employee.save(); // حفظ التغييرات

    // جلب رصيد الإجازات الافتراضي من قاعدة بيانات الشركة
    const companyLeaves = await LeaveBalance.findOne({employee:null});
    if (!companyLeaves) {
      return res.status(500).json({ message: 'رصيد الإجازات الافتراضي للشركة غير محدد' });
    }

    // إنشاء رصيد الإجازات للموظف الجديد
    await LeaveBalance.create({
      employee: employee._id,
      annual: companyLeaves.annual,
      sick: companyLeaves.sick,
      marriage: companyLeaves.marriage,
      emergency: companyLeaves.emergency,
      maternity: companyLeaves.maternity,
      unpaid: companyLeaves.unpaid
    });

    res.status(201).json({ user, employee });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'حدث خطأ أثناء إنشاء الموظف', error: error.message });
  }
};