const Employee = require('../models/employee');
const User = require('../models/user');
const Department = require('../models/depaertment'); // لاحظ spelling
const LeaveBalance=require('../models/leaveBalanceModel')
const getAllEmployees = async (req, res) => {
  try {
    const employees = await Employee.find()
      .populate('user', 'name role email')
      .populate('department', 'name')
      .populate('contract.duration')
      .populate('residency.duration');

    // فلترة الموظفين اللي رولهم Employee
    const filtered = employees.filter(emp => emp.user.role === 'EMPLOYEE');

    const result = filtered.map(emp => {
      // معالجة مدة العقد
      let contractDurationText = null;
      if (emp.contract.duration) {
        const dur = emp.contract.duration.duration;
        const unit = emp.contract.duration.unit;
        if (unit === 'years') {
          contractDurationText = `${dur} سنة`;
        } else {
          contractDurationText = `${dur} شهر`;
        }
      }

      // معالجة مدة الإقامة
      let residencyDurationText = null;
      if (emp.residency.duration) {
        residencyDurationText = `${emp.residency.duration.year} سنة`;
      }

      return {
        _id: emp._id,
        name: emp.name,
        email: emp.user.email,
        department: emp.department ? emp.department.name : null,
        jobTitle: emp.jobTitle,
        contractStart: emp.contract.start,
        contractEnd: emp.contract.end,
        contractDuration: contractDurationText,
        residencyStart: emp.residency.start,
        residencyEnd: emp.residency.end,
        residencyDuration: residencyDurationText
      };
    });

    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'حدث خطأ أثناء جلب الموظفين' });
  }
};


//Hr can create employee

const createEmployee = async (req, res) => {
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
      contractDurationId, // هنبعت _id للـ Contract
      residencyStart,
      residencyDurationId, // هنبعت _id للـ ResidencyYear
      workHoursPerWeek,
      workplace,
      salary,
      role
    } = req.body;

    if (req.user.role !== 'HR') {
      return res.status(403).json({ message: 'ليس لديك صلاحية' });
    }

    const user = await User.create({ name, email, password, role:"EMPLOYEE" });

    let employee = await Employee.create({
      name,
      jobTitle,
      employeeNumber,
      department,
      manager,
      employmentType,
      contract: {
        start: contractStart,
        duration: contractDurationId
      },
      residency: {
        start: residencyStart,
        duration: residencyDurationId
      },
      workHoursPerWeek,
      workplace,
      salary,
      user: user._id
    });

    // جلب الـ populated documents عشان نحسب الـ end
    employee = await Employee.findById(employee._id)
      .populate('contract.duration')
      .populate('residency.duration');

    // حساب الـ end للـ contract
    if (employee.contract.start && employee.contract.duration) {
      const end = new Date(employee.contract.start);
      if (employee.contract.duration.unit === 'years') {
        end.setFullYear(end.getFullYear() + employee.contract.duration.duration);
      } else {
        end.setMonth(end.getMonth() + employee.contract.duration.duration);
      }
      employee.contract.end = end;
    }

    // حساب الـ end للإقامة
    if (employee.residency.start && employee.residency.duration) {
      const end = new Date(employee.residency.start);
      end.setFullYear(end.getFullYear() + employee.residency.duration.year);
      employee.residency.end = end;
    }

    await employee.save(); // حفظ التغييرات

    await LeaveBalance.create({
      employee: employee._id,
      annual: 21,  // عدد الأيام المبدئي
      sick: 7,
      unpaid: 0
    });

    res.status(201).json({ user, employee });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'حدث خطأ أثناء إنشاء الموظف' });
  }
};

// get contrcsts state
const getContractsStats  = async (req, res) => {
  try {
    const today = new Date();
    const next30Days = new Date();
    next30Days.setDate(today.getDate() + 30);

    const employees = await Employee.find()
      .populate('contract.duration')
      .populate('residency.duration');

    // --- العقود ---
    const totalContracts = employees.filter(emp => emp.contract.end).length;
    const activeContracts = employees.filter(
      emp => emp.contract.end && emp.contract.end > today
    ).length;
    const expiringContracts = employees.filter(
      emp => emp.contract.end && emp.contract.end > today && emp.contract.end <= next30Days
    ).length;

    // --- الإقامات ---
    const totalResidencies = employees.filter(emp => emp.residency.end).length;
    const activeResidencies = employees.filter(
      emp => emp.residency.end && emp.residency.end > today
    ).length;
    const expiringResidencies = employees.filter(
      emp => emp.residency.end && emp.residency.end > today && emp.residency.end <= next30Days
    ).length;

    res.json({
      contracts: {
        total: totalContracts,
        active: activeContracts,
        expiringSoon: expiringContracts
      },
      residencies: {
        total: totalResidencies,
        active: activeResidencies,
        expiringSoon: expiringResidencies
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'خطأ أثناء جلب الإحصائيات' });
  }
};

//get all contracts

const getAllContracts = async (req, res) => {
  try {
    const today = new Date();

    const employees = await Employee.find()
      .populate('user', 'name') // نجيب اسم الموظف
      .populate('contract.duration'); // نجيب تفاصيل العقد

    const contracts = employees
      .filter(emp => emp.contract && emp.contract.start && emp.contract.end) // اللي عنده عقد
      .map(emp => {
        const remainingDays = Math.ceil((emp.contract.end - today) / (1000 * 60 * 60 * 24));

        return {
          employeeName: emp.user.name,
          contractStart: emp.contract.start,
          contractEnd: emp.contract.end,
          contractDuration: emp.contract.duration
            ? `${emp.contract.duration.duration} ${emp.contract.duration.unit === 'years' ? 'سنة' : 'شهر'}`
            : null,
          remainingDays: remainingDays > 0 ? remainingDays : 0
        };
      });

    res.json(contracts);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'خطأ أثناء جلب العقود' });
  }
};

//get one employee
const getEmployeeById = async (req, res) => {
  try {
    const { id } = req.params;

    const employee = await Employee.findById(id)
      .populate('user', 'name email role')
      .populate('department', 'name')
      .populate('contract.duration')
      .populate('residency.duration');

    if (!employee) {
      return res.status(404).json({ message: 'الموظف غير موجود' });
    }

    // صياغة الريسبونس
    const result = {
      id: employee._id,
      name: employee.name,
      email: employee.user.email,
      role: employee.user.role,
      department: employee.department ? employee.department.name : null,
      jobTitle: employee.jobTitle,
      contractStart: employee.contract.start,
      contractEnd: employee.contract.end,
      contractDuration: employee.contract.duration
        ? `${employee.contract.duration.duration} ${employee.contract.duration.unit === 'years' ? 'سنة' : 'شهر'}`
        : null,
      residencyStart: employee.residency.start,
      residencyEnd: employee.residency.end,
      residencyDuration: employee.residency.duration
        ? `${employee.residency.duration.year} سنة`
        : null
    };

    res.json(result);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'حدث خطأ أثناء جلب بيانات الموظف' });
  }
};

//delete employee

const deleteEmployee = async (req, res) => {
  try {
    const { id } = req.params; 

    
    const employee = await Employee.findById(id);
    if (!employee) {
      return res.status(404).json({ message: 'الموظف غير موجود' });
    }

  
    if (employee.user) {
      await User.findByIdAndDelete(employee.user);
    }

    await Employee.findByIdAndDelete(id);

    res.json({ message: 'تم حذف الموظف واليوزر الخاص به بنجاح' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'حدث خطأ أثناء حذف الموظف' });
  }
};

module.exports = { getAllEmployees ,createEmployee ,getContractsStats ,getAllContracts , getEmployeeById ,deleteEmployee}; 
