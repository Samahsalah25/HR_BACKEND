const Employee = require('../models/employee');
const User = require('../models/user');
const Department = require('../models/depaertment'); // لاحظ spelling
const LeaveBalance=require('../models/leaveBalanceModel')
const mongoose=require('mongoose')
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
      salary
    } = req.body;

    if (req.user.role !== 'HR') {
      return res.status(403).json({ message: 'ليس لديك صلاحية' });
    }

    // تحقق من البريد الإلكتروني
    const existingUser = await User.findOne({ email }).session(session);
    if (existingUser) {
      return res.status(400).json({ message: `البريد الإلكتروني ${email} مستخدم بالفعل` });
    }

    // تحقق من رقم الموظف
    const existingEmployee = await Employee.findOne({ employeeNumber }).session(session);
    if (existingEmployee) {
      return res.status(400).json({ message: `رقم الموظف ${employeeNumber} مستخدم بالفعل` });
    }

    // إنشاء المستخدم
    const user = await User.create([{ name, email, password, role: "EMPLOYEE" }], { session });

    // إنشاء الموظف
    let employee = await Employee.create([{
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
      user: user[0]._id
    }], { session });

    employee = employee[0];

    // حساب end
    if (employee.contract.start && employee.contract.duration) {
      const end = new Date(employee.contract.start);
      if (employee.contract.duration.unit === 'years') {
        end.setFullYear(end.getFullYear() + employee.contract.duration.duration);
      } else {
        end.setMonth(end.getMonth() + employee.contract.duration.duration);
      }
      employee.contract.end = end;
    }

    if (employee.residency.start && employee.residency.duration) {
      const end = new Date(employee.residency.start);
      end.setFullYear(end.getFullYear() + employee.residency.duration.year);
      employee.residency.end = end;
    }

    await employee.save({ session });

    // رصيد الإجازات
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

    await session.commitTransaction();
    session.endSession();

    res.status(201).json({ user: user[0], employee });

  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error(error);
    res.status(500).json({ message: 'حدث خطأ أثناء إنشاء الموظف', error: error.message });
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

const getEmployeesByBranch = async (req, res) => {
  try {
    if (req.user.role !== 'HR' && req.user.role !== 'ADMIN') {
      return res.status(403).json({ message: 'ليس لديك صلاحية' });
    }

    let employees;

    if (req.user.role === 'ADMIN') {
      employees = await Employee.find()
        .populate("department", "name")
        .populate("workplace", "name")
        .populate("contract.duration")
        .populate("residency.duration")
        .populate("user", "email");
    } else {
      const hrEmployee = await Employee.findOne({ user: req.user._id });
      if (!hrEmployee) {
        return res.status(404).json({ message: 'لم يتم العثور على بيانات الـ HR' });
      }

      employees = await Employee.find({ workplace: hrEmployee.workplace })
        .populate("department", "name")
        .populate("workplace", "name")
        .populate("contract.duration")
        .populate("residency.duration")
        .populate("user", "email");
    }

    // helper لتنسيق التاريخ
    const formatDate = (date) => {
      if (!date) return null;
      const d = new Date(date);
      const day = d.getDate().toString().padStart(2, "0");
      const month = (d.getMonth() + 1).toString().padStart(2, "0");
      const year = d.getFullYear();
      return `${day}/${month}/${year}`;
    };

    // عمل فورمات للبيانات
    const formatted = employees.map(emp => {
      return {
        _id: emp._id,
        name: emp.name,
        email: emp.user?.email || "",
        department: emp.department?.name || "غير محدد",
        jobTitle: emp.jobTitle || "",
        contractStart: formatDate(emp.contract?.start),
        contractEnd: formatDate(emp.contract?.end),
        contractDuration: emp.contract?.duration 
          ? `${emp.contract.duration.duration} ${emp.contract.duration.unit === "years" ? "سنة" : "شهر"}`
          : null,
        residencyStart: formatDate(emp.residency?.start),
        residencyEnd: formatDate(emp.residency?.end),
        residencyDuration: emp.residency?.duration 
          ? `${emp.residency.duration.year} سنة`
          : null
      }
    });

    res.json(formatted);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server Error" });
  }
};


//update employee here
// Update Employee
const updateEmployee = async (req, res) => {
  try {
    const { id } = req.params; // ID الموظف من البارامز
    const {
      name,
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

    // HR/Admin فقط يقدروا يعدلوا
    if (!['HR', 'ADMIN'].includes(req.user.role)) {
      return res.status(403).json({ message: "ليس لديك صلاحية" });
    }

    // جلب الموظف
    let employee = await Employee.findById(id)
      .populate("contract.duration")
      .populate("residency.duration")
      .populate("user");

    if (!employee) {
      return res.status(404).json({ message: "الموظف غير موجود" });
    }

    // تحديث البيانات
    if (name) {
      employee.name = name;
      if (employee.user) employee.user.name = name; // لو عايزة تحدث كمان الـ user
    }
    if (jobTitle) employee.jobTitle = jobTitle;
    if (employeeNumber) employee.employeeNumber = employeeNumber;
    if (department) employee.department = department;
    if (manager) employee.manager = manager;
    if (employmentType) employee.employmentType = employmentType;
    if (workHoursPerWeek) employee.workHoursPerWeek = workHoursPerWeek;
    if (workplace) employee.workplace = workplace;
    if (salary) employee.salary = salary;

    // --- العقد ---
    if (contractStart) employee.contract.start = contractStart;
    if (contractDurationId) employee.contract.duration = contractDurationId;

    // --- الإقامة ---
    if (residencyStart) employee.residency.start = residencyStart;
    if (residencyDurationId) employee.residency.duration = residencyDurationId;

    await employee.populate([
  { path: "contract.duration" },
  { path: "residency.duration" }
]);

    // حساب الـ end للـ contract
    if (employee.contract.start && employee.contract.duration) {
      const end = new Date(employee.contract.start);
      if (employee.contract.duration.unit === "years") {
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

    await employee.save();
    if (employee.user) await employee.user.save(); 

    res.json({ message: "تم تحديث بيانات الموظف بنجاح", employee });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "خطأ أثناء تحديث الموظف", error: error.message });
  }
};




module.exports = { getAllEmployees ,createEmployee ,getContractsStats ,getAllContracts , getEmployeeById ,deleteEmployee ,getEmployeesByBranch ,updateEmployee}; 
