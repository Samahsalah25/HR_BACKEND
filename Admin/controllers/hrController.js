const Employee = require('../models/employee');
const User = require('../models/user');
const Department = require('../models/depaertment'); // لاحظ spelling
const LeaveBalance=require('../models/leaveBalanceModel')
const mongoose=require('mongoose')
const Contract=require('../models/Contract') ;
const ResidencyYear =require('../models/ResidencyYear')

const getAllEmployees = async (req, res) => {
  try {
    const employees = await Employee.find()
      .populate('user', 'name role email')
      .populate('department', 'name')
      .populate('contract.duration')
      .populate('residency.duration');

    // فلترة الموظفين اللي رولهم Employee
   const filtered = employees.filter(emp => 
  ["EMPLOYEE", "Manager", "HR"].includes(emp.user.role)
);

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
        role:emp.user.role ,
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
      residencyAdditionNumber,
      residencyIssuingAuthority,
      residencyInsuranceNumber,
      residencyNationality,
      residencyType,
      workHoursPerWeek,
      workplace,
      salary,
      role
    } = req.body;

    // ✅ تأكيد إن اللي بيضيف HR فقط
    if (req.user.role !== "HR") {
      return res.status(403).json({ message: "ليس لديك صلاحية لإضافة موظف جديد" });
    }

    // ✅ تأكد من وجود البريد الإلكتروني مسبقًا
    const existingUser = await User.findOne({ email }).session(session);
    if (existingUser) {
      return res.status(400).json({ message: `البريد الإلكتروني ${email} مستخدم بالفعل` });
    }

    // ✅ تأكد من عدم تكرار رقم الموظف
    const existingEmployee = await Employee.findOne({ employeeNumber }).session(session);
    if (existingEmployee) {
      return res.status(400).json({ message: `رقم الموظف ${employeeNumber} مستخدم بالفعل` });
    }

    // ✅ استرجاع بيانات العقد (اختياري)
    let contractDuration = null;
    if (contractDurationId) {
      contractDuration = await Contract.findById(contractDurationId).session(session);
      if (!contractDuration) {
        return res.status(400).json({ message: "لم يتم العثور على مدة العقد." });
      }
    }

    // ✅ استرجاع بيانات الإقامة (اختياري)
    let residencyDuration = null;
    if (residencyDurationId) {
      residencyDuration = await ResidencyYear.findById(residencyDurationId).session(session);
      if (!residencyDuration) {
        return res.status(400).json({ message: "لم يتم العثور على مدة الإقامة." });
      }
    }

    // ✅ إنشاء المستخدم
    const user = await User.create([{ name, email, password, role: role || "EMPLOYEE" }], { session });

    // ✅ إنشاء الموظف
    let employee = await Employee.create([{
      name,
      jobTitle,
      employeeNumber,
      department,
      manager,
      employmentType,
      contract: {
        start: contractStart || null,
        duration: contractDuration?._id || null
      },
      residency: {
        nationality: residencyNationality || "",
        start: residencyStart || null,
        duration: residencyDuration?._id || null,
        additionNumber: residencyAdditionNumber || "",
        issuingAuthority: residencyIssuingAuthority || "",
        insuranceNumber: residencyInsuranceNumber || "",
        type: residencyType || ""
      },
      workHoursPerWeek: workHoursPerWeek || 0,
      workplace,
      salary,
      user: user[0]._id
    }], { session });

    employee = employee[0];

    // ✅ حساب تاريخ نهاية العقد تلقائيًا
    if (employee.contract.start && contractDuration) {
      const end = new Date(employee.contract.start);
      if (contractDuration.unit === "years") {
        end.setFullYear(end.getFullYear() + contractDuration.duration);
      } else if (contractDuration.unit === "months") {
        end.setMonth(end.getMonth() + contractDuration.duration);
      }
      employee.contract.end = end;
    }

    // ✅ حساب تاريخ نهاية الإقامة تلقائيًا
    if (employee.residency.start && residencyDuration) {
      const end = new Date(employee.residency.start);
      end.setFullYear(end.getFullYear() + residencyDuration.year);
      employee.residency.end = end;
    }

    await employee.save({ session });

    // ✅ إنشاء رصيد الإجازات الافتراضي
    const companyLeaves = await LeaveBalance.findOne({ employee: null }).session(session);
    if (!companyLeaves) {
      throw new Error("رصيد الإجازات الافتراضي للشركة غير محدد");
    }

    const totalLeaveBalance =
      companyLeaves.annual +
      companyLeaves.sick +
      companyLeaves.marriage +
      companyLeaves.emergency +
      companyLeaves.maternity +
      companyLeaves.unpaid;

    await LeaveBalance.create([{
      employee: employee._id,
      annual: companyLeaves.annual,
      sick: companyLeaves.sick,
      marriage: companyLeaves.marriage,
      emergency: companyLeaves.emergency,
      maternity: companyLeaves.maternity,
      unpaid: companyLeaves.unpaid,
      remaining: totalLeaveBalance
    }], { session });

    await session.commitTransaction();
    session.endSession();

    // ✅ جلب الموظف بعد الـ populate
    const populatedEmployee = await Employee.findById(employee._id)
      .populate("contract.duration")
      .populate("residency.duration");

    res.status(201).json({
      message: "تم إنشاء الموظف بنجاح",
      user: user[0],
      employee: populatedEmployee
    });

  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error("❌ Error details:", error);
    res.status(500).json({
      message: "حدث خطأ أثناء إنشاء الموظف",
      error: error.message
    });
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
// controllers/hrController.js
const getEmployeeById = async (req, res) => {
  try {
    const employee = await Employee.findById(req.params.id)
      .populate("user", "email role")
      .populate("department", "name")
      .populate("manager", "name")
      .populate("contract.duration", "duration unit")
      .populate("residency.duration", "duration unit")
      .populate("workplace", "name");

    if (!employee) {
      return res.status(404).json({ message: "الموظف غير موجود" });
    }

    // ✅ هنا هنرجع نسخة كاملة للـ frontend
    const result = {
      id: employee._id,
      name: employee.name,
      email: employee.user?.email,
      role: employee.user?.role,
      employeeNumber: employee.employeeNumber,
      jobTitle: employee.jobTitle,

      department: employee.department?._id || null,
      departmentName: employee.department?.name || null,

      manager: employee.manager?._id || null,
      managerName: employee.manager?.name || null,

      employmentType: employee.employmentType,

      contractStart: employee.contract?.start,
      contractEnd: employee.contract?.end,
      contractDurationId: employee.contract?.duration?._id || null,
      contractDuration: employee.contract?.duration
        ? `${employee.contract.duration.duration} ${employee.contract.duration.unit === "years" ? "سنة" : "شهر"}`
        : null,

      residencyStart: employee.residency?.start,
      residencyEnd: employee.residency?.end,
      residencyDurationId: employee.residency?.duration?._id || null,
      residencyDuration: employee.residency?.duration
        ? `${employee.residency.duration.duration} ${employee.residency.duration.unit === "years" ? "سنة" : "شهر"}`
        : null,

      workplace: employee.workplace?._id || null,
      workplaceName: employee.workplace?.name || null,

      workHoursPerWeek: employee.workHoursPerWeek,

      salary: {
        base: employee.salary?.base || 0,
        housingAllowance: employee.salary?.housingAllowance || 0,
        transportAllowance: employee.salary?.transportAllowance || 0,
        otherAllowance: employee.salary?.otherAllowance || 0,
      },
    };

    res.json(result);
  } catch (err) {
    console.error("❌ خطأ في getEmployeeById:", err);
    res.status(500).json({ message: "حصل خطأ في السيرفر" });
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

// GET /api/managers
const getManagerss = async (req, res) => {
  try {
    const managers = await Employee.find()
      .populate({
        path: "user",
        match: { role: "Manager" }, 
        select: "role name email", 
      })
      .select("name jobTitle"); 

    
    const filtered = managers.filter(emp => emp.user !== null);

    res.json(filtered);
  } catch (err) {
    console.error("Error fetching managers:", err);
    res.status(500).json({ message: "Error fetching managers" });
  }
};


//update employee here
// Update Employee
const updateEmployee = async (req, res) => {
  try {
    const { id } = req.params;    
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
    // if (!['HR', 'ADMIN'].includes(req.user.role)) {
    //   return res.status(403).json({ message: "ليس لديك صلاحية" });
    // }

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
   console.error("Update employee error:", error);
res.status(500).json({ message: "خطأ أثناء تحديث الموظف", error: error.message });

  }
};




module.exports = { getAllEmployees ,createEmployee ,getContractsStats ,getManagerss ,getAllContracts , getEmployeeById ,deleteEmployee ,getEmployeesByBranch ,updateEmployee}; 
