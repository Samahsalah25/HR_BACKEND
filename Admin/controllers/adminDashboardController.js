const Employee = require("../models/employee");
const Branch = require("../models/branchSchema");
const Department = require("../models/depaertment");
const LeaveBalance =require("../models/leaveBalanceModel")
const ResidencyYear = require("../models/ResidencyYear"); // لو عندك الموديل دا عشان نحسب السنين
// utils/geocoding.js
const axios = require("axios");


exports.getDashboardStats = async (req, res) => {
  try {
    // عدد الموظفين الكلي
    const totalEmployees = await Employee.countDocuments();

    // عدد الفروع
    const totalBranches = await Branch.countDocuments();

    // عدد الأقسام
    const totalDepartments = await Department.countDocuments();

    // تجميع الموظفين حسب القسم
    const employeesByDept = await Employee.aggregate([
      {
        $group: {
          _id: "$department",
          count: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: "departments",
          localField: "_id",
          foreignField: "_id",
          as: "department",
        },
      },
      {
        $unwind: "$department",
      },
      {
        $project: {
          _id: 0,
          departmentId: "$department._id",
          departmentName: "$department.name",
          employeeCount: "$count",
        },
      },
    ]);

    // حساب النسبة المئوية لكل قسم
    const departmentsWithPercentage = employeesByDept.map((dept) => ({
      ...dept,
      percentage:
        totalEmployees > 0
          ? ((dept.employeeCount / totalEmployees) * 100).toFixed(2)
          : 0,
    }));

    // إرسال النتيجة
    res.status(200).json({
      success: true,
      totalEmployees,
      totalBranches,
      totalDepartments,
      departments: departmentsWithPercentage,
    });
  } catch (err) {
    console.error("Dashboard Error:", err);
    res.status(500).json({
      success: false,
      message: "حدث خطأ أثناء تحميل البيانات",
      error: err.message,
    });
  }
};


// احذف const fetch = require("node-fetch");

// async function getAddressFromCoordinates(lat, lng) {
//   try {
//     const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=ar`;
//     const res = await fetch(url);
//     const data = await res.json();
//     return data.display_name || "غير محدد";
//   } catch (error) {
//     console.error("Geocoding error:", error.message);
//     return "غير محدد";
//   }
// }



exports.getCompanySummary = async (req, res) => {
  try {
    const totalEmployees = await Employee.countDocuments();
    const totalBranches = await Branch.countDocuments();
    const totalDepartments = await Department.countDocuments();

    const branches = await Branch.find().lean();
    const employees = await Employee.find()
      .populate("workplace", "name location")
      .populate("department", "name");

    const branchData = await Promise.all(
      branches.map(async (branch) => {
        const branchEmployees = employees.filter(
          (emp) =>
            emp.workplace &&
            emp.workplace._id.toString() === branch._id.toString()
        );

        // الأقسام اللي في الفرع
        const departmentMap = {};
        branchEmployees.forEach((emp) => {
          if (emp.department) {
            const deptName = emp.department.name;
            departmentMap[deptName] = (departmentMap[deptName] || 0) + 1;
          }
        });

        // تحديد الإحداثيات وتحويلها إلى عنوان نصي
        let locationName = "غير محدد";
        if (branch.location?.coordinates?.length === 2) {
          // ⚠️ تصحيح ترتيب الإحداثيات [lng, lat] → Nominatim يحتاج lat, lng
          const [lng, lat] = branch.location.coordinates;
          console.log(`Branch: ${branch.name}, Lat: ${lat}, Lng: ${lng}`); // للتأكد
          locationName = await getAddressFromCoordinates(lat, lng);
        }

        return {
          branchId: branch._id,
          branchName: branch.name,
          location: locationName,
          departments: Object.keys(departmentMap).map((name) => ({
            departmentName: name,
            employeeCount: departmentMap[name],
          })),
          totalEmployeesInBranch: branchEmployees.length,
        };
      })
    );

    res.json({
      success: true,
      totals: {
        totalEmployees,
        totalBranches,
        totalDepartments,
      },
      branches: branchData,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({
      success: false,
      message: "حدث خطأ أثناء تحميل ملخص الشركة",
      error: err.message,
    });
  }
};

async function getAddressFromCoordinates(lat, lng) {
  try {
    const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=ar`;

    const { data } = await axios.get(url, {
      headers: {
       "User-Agent": "HR-Dashboard/1.0 (malaksalah@gmail.com)"

      }
    });

    if (data && data.display_name) {
      return data.display_name;
    } else {
      return "غير محدد";
    }
  } catch (error) {
    console.error("Geocoding error:", error.message);
    return "غير محدد";
  }
}




exports.getNewEmployees = async (req, res) => {
  try {
    const months = parseInt(req.query.months) || 3; // المدة بالافتراضي 3 شهور
    const cutoffDate = new Date();
    cutoffDate.setMonth(cutoffDate.getMonth() - months); // تاريخ البداية

    const newEmployees = await Employee.find({
      "contract.start": { $gte: cutoffDate }
    })
      .populate("department", "name")
      .select("name jobTitle contract.start department");

    const formatted = newEmployees.map(emp => ({
      name: emp.name,
      jobTitle: emp.jobTitle,
      department: emp.department ? emp.department.name : "غير محدد",
      startDate: emp.contract?.start
    }));

    res.status(200).json({
      success: true,
      months,
      totalNewEmployees: formatted.length,
      newEmployees: formatted
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "حدث خطأ أثناء جلب الموظفين الجدد" });
  }
};

const dayNames = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];
exports.getBranchesDetails = async (req, res) => {
  try {
    const branches = await Branch.find();
    const results = [];

    for (const branch of branches) {
      // عدد الموظفين في كل فرع
      const employeesInBranch = await Employee.find({ workplace: branch._id }).populate("department", "name");

      // عدد الأقسام المميزة
      const uniqueDepartments = [
        ...new Set(employeesInBranch.map(emp => emp.department?.name).filter(Boolean))
      ];

      // ⚙️ إحداثيات الموقع
      const lat = branch.location.coordinates[1];
      const lng = branch.location.coordinates[0];

      // ✅ العنوان بالعربي من الإحداثيات
      const address = await getAddressFromCoordinates(lat, lng);

      results.push({
        branchId: branch._id,
        branchName: branch.name,
        location: address, // ← بدل الإحداثيات
        workStart: branch.workStart,
        workEnd: branch.workEnd,
        gracePeriod: branch.gracePeriod,
        allowedLateMinutes: branch.allowedLateMinutes,
        weekendDays: branch.weekendDays.map(d => dayNames[d] || d),
        totalDepartments: uniqueDepartments.length,
        totalEmployees: employeesInBranch.length,
      });
    }

    res.status(200).json({
      success: true,
      totalBranches: results.length,
      branches: results
    });
  } catch (error) {
    console.error("Error in getBranchesDetails:", error);
    res.status(500).json({ success: false, message: "حدث خطأ أثناء جلب تفاصيل الفروع" });
  }
}; 

// exports.getBranchesWithDepartments = async (req, res) => {
//   try {
//     const branches = await Branch.find();

//     const branchDetails = [];

//     for (const branch of branches) {
//       // نجيب كل الأقسام اللي ليها موظفين في الفرع ده
//       const employeesInBranch = await Employee.find({ workplace: branch._id }).populate("department manager", "name description");

//       // نجهز خريطة الأقسام داخل الفرع
//       const departmentsMap = new Map();

//       for (const emp of employeesInBranch) {
//         const deptId = emp.department?._id?.toString();
//         if (!deptId) continue;

//         if (!departmentsMap.has(deptId)) {
//           departmentsMap.set(deptId, {
//             departmentId: emp.department._id,
//             departmentName: emp.department.name,
//             description: emp.department.description,
//             employees: [],
//           });
//         }

//         departmentsMap.get(deptId).employees.push(emp);
//       }

//       // نجهز الأقسام بالتفاصيل المطلوبة
//       const departments = Array.from(departmentsMap.values()).map((dept) => {
//         const manager = dept.employees.find((e) => !e.manager)?.name || "غير محدد";
//         return {
//           departmentId: dept.departmentId,
//           departmentName: dept.departmentName,
//           description: dept.description,
//           manager,
//           employeeCount: dept.employees.length,
//         };
//       });

//       branchDetails.push({
//         branchId: branch._id,
//         branchName: branch.name,
//         departments,
//       });
//     }

//     res.status(200).json({
//       success: true,
//       totalBranches: branchDetails.length,
//       branches: branchDetails,
//     });
//   }  catch (error) {
//   console.error("Error fetching branches with departments:", error.message);
//   res.status(500).json({
//     success: false,
//     message: "حدث خطأ أثناء جلب تفاصيل الفروع والأقسام",
//   });
// }
// };
exports.getBranchesWithDepartments = async (req, res) => {
  try {
    // 1️⃣ كل الأقسام في الشركة (حتى بدون موظفين)
    const allDepartments = await Department.find().lean();

    // 2️⃣ كل الفروع
    const branches = await Branch.find();

    // 3️⃣ كل الموظفين مع بيانات القسم والمدير
    const employees = await Employee.find()
      .populate("department manager", "name description")
      .populate("workplace", "name")
      .lean();

    const branchDetails = [];

    // 4️⃣ بناء تفاصيل الفروع
    for (const branch of branches) {
      const employeesInBranch = employees.filter(
        (emp) => emp.workplace?._id?.toString() === branch._id.toString()
      );

      const departmentsMap = new Map();

      for (const emp of employeesInBranch) {
        const dept = emp.department;
        if (!dept) continue;

        if (!departmentsMap.has(dept._id.toString())) {
          departmentsMap.set(dept._id.toString(), {
            departmentId: dept._id,
            departmentName: dept.name,
            description: dept.description,
            manager: emp.manager ? emp.manager.name : "غير محدد",
            employeeCount: 0,
          });
        }

        departmentsMap.get(dept._id.toString()).employeeCount += 1;
      }

      branchDetails.push({
        branchId: branch._id,
        branchName: branch.name,
        departments: Array.from(departmentsMap.values()),
      });
    }

    // 5️⃣ الإخراج النهائي
    res.status(200).json({
      success: true,
      allDepartments: allDepartments.map((dept) => ({
        departmentId: dept._id,
        departmentName: dept.name,
        description: dept.description,
      })),
      branches: branchDetails,
    });
  } catch (error) {
    console.error("Error fetching branches with departments:", error.message);
    res.status(500).json({
      success: false,
      message: "حدث خطأ أثناء جلب تفاصيل الفروع والأقسام",
    });
  }
};



// exports.getEmployeesSummary = async (req, res) => {
//   try {
//     const employees = await Employee.find()
//       .populate("department", "name")
//       .populate("contract.duration", "name") // ← نجيب اسم مدة العقد
//       .lean();

//     const summaries = [];

//     for (const emp of employees) {
//       // نحاول نجيب الإجازات
//       const leaveBalance = await LeaveBalance.findOne({ employee: emp._id }).lean();

//       summaries.push({
//         name: emp.name || "غير محدد",
//         employeeNumber: emp.employeeNumber || "غير محدد",
//         department: emp.department?.name || "غير محدد",
//         contractDurationName: emp.contract?.duration?.name || "غير محدد",
//         contractPeriod:
//           emp.contract?.start && emp.contract?.end
//             ? `${new Date(emp.contract.start).toLocaleDateString("ar-EG")} - ${new Date(emp.contract.end).toLocaleDateString("ar-EG")}`
//             : "غير محدد",
//         carriedLeaves: leaveBalance?.remaining || 0,
//       });
//     }

//     res.status(200).json({
//       success: true,
//       totalEmployees: summaries.length,
//       employees: summaries,
//     });
//   } catch (error) {
//     console.error("❌ خطأ أثناء جلب ملخص الموظفين:", error);
//     res.status(500).json({
//       success: false,
//       message: "حدث خطأ أثناء جلب ملخص الموظفين",
//       error: error.message,
//     });
//   }
// };   
exports.getEmployeesSummary = async (req, res) => {
  try {
    const employees = await Employee.find()
      .populate("department", "name") // اسم القسم
      .populate("contract.duration", "name") // مدة العقد
      .populate({
        path: "user", // نجيب المستخدم المرتبط بالموظف
        select: "role", // نجيب فقط الدور (role)
      })
      .lean();

    const summaries = [];

    for (const emp of employees) {
      // نحاول نجيب الإجازات الخاصة بالموظف
      const leaveBalance = await LeaveBalance.findOne({ employee: emp._id }).lean();

      summaries.push({
        name: emp.name || "غير محدد",
        employeeNumber: emp.employeeNumber || "غير محدد",
        department: emp.department?.name || "غير محدد",
        role: emp.user?.role || "غير محدد", // ✅ أضفنا الدور
        contractDurationName: emp.contract?.duration?.name || "غير محدد",
           residencyNationality: emp.residency?.nationality || " غير محدد" ,
        contractPeriod:
          emp.contract?.start && emp.contract?.end
            ? `${new Date(emp.contract.start).toLocaleDateString("ar-EG")} - ${new Date(
                emp.contract.end
              ).toLocaleDateString("ar-EG")}`
            : "غير محدد",
      carriedLeaves: leaveBalance?.annual || 0,

      });
    }

    res.status(200).json({
      success: true,
      totalEmployees: summaries.length,
      employees: summaries,
    });
  } catch (error) {
    console.error("❌ خطأ أثناء جلب ملخص الموظفين:", error);
    res.status(500).json({
      success: false,
      message: "حدث خطأ أثناء جلب ملخص الموظفين",
      error: error.message,
    });
  }
};

     
/// contract 

exports.getContractsSummary = async (req, res) => {
  try {
    const employees = await Employee.find()
      .populate("contract.duration", "name unit") 
      .populate("department", "name");

    const contractList = employees.map((emp) => {
      // نحسب الحالة حسب تاريخ اليوم
      let status = "مستمرة";
      const now = new Date();

      if (emp.contract?.end && emp.contract.end < now) {
        status = "منتهية";
      } else if (emp.contract?.end && emp.contract.end - now <= 30 * 24 * 60 * 60 * 1000) {
        status = "قريبة من الانتهاء";
      }

      return {
        employeeName: emp.name || "غير محدد",
        department: emp.department?.name || "غير محدد",
        contractDuration: emp.contract?.duration?.name || "غير محددة",
        unit: emp.contract?.duration?.unit || "غير محددة",
        startDate: emp.contract?.start
          ? emp.contract.start.toLocaleDateString("ar-EG")
          : "غير محدد",
        endDate: emp.contract?.end
          ? emp.contract.end.toLocaleDateString("ar-EG")
          : "غير محدد",
        status,
      };
    });

    res.status(200).json({
      success: true,
      total: contractList.length,
      contracts: contractList,
    });
  } catch (error) {
    console.error("Error fetching contracts:", error);
    res.status(500).json({
      success: false,
      message: "حدث خطأ أثناء جلب العقود",
      error: error.message,
    });
  }
};

// controllers/leaveBalanceController.js

exports.getCompanyLeavePolicy = async (req, res) => {
  try {
    const policy = await LeaveBalance.findOne({ employee: null });
    if (!policy) {
      return res.status(404).json({
        success: false,
        message: "لم يتم العثور على سياسة الإجازات الخاصة بالشركة"
      });
    }

    res.status(200).json({
      success: true,
      data: policy
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "حدث خطأ أثناء جلب سياسة الإجازات",
      error: error.message
    });
  }
};


// controllers/adminDashboardController.js



// exports.getEmployeesByLeaveType = async (req, res) => {
//   try {
//     const { type } = req.params;

//     // الأنواع المسموح بها من الإجازات
//     const validTypes = ["annual", "sick", "marriage", "emergency", "maternity", "unpaid"];
//     if (!validTypes.includes(type)) {
//       return res.status(400).json({
//         success: false,
//         message: `نوع الإجازة "${type}" غير صحيح`
//       });
//     }

//     //  عدد الأيام الأصلي لكل نوع إجازة (رصيد الشركة)
//     const totalDaysByType = {
//       annual: 21,
//       sick: 7,
//       marriage: 3,
//       emergency: 5,
//       maternity: 90,
//       unpaid: 0
//     };

//     // جلب جميع السجلات اللي عندها موظف موجود فعلاً
//     const balances = await LeaveBalance.find({
//       employee: { $exists: true, $ne: null }
//     }).populate("employee", "name employeeNumber");

//     //  بناء التقرير فقط للموظفين الموجودين فعلاً
//     const report = balances
//       .filter(b => b.employee) // استبعاد اللي اتحذف موظفهم
//       .map(b => ({
//         employeeName: b.employee.name,
//         employeeNumber: b.employee.employeeNumber,
//         leaveType: type,
//         totalDays: totalDaysByType[type],
//         usedDays: totalDaysByType[type] - (b[type] || 0),
//         remainingDays: b[type] || 0
//       }));
//     res.status(200).json({
//       success: true,
//       count: report.length,
//       data: report
//     });

//   } catch (error) {
//     console.error(" خطأ في getEmployeesByLeaveType:", error);
//     res.status(500).json({
//       success: false,
//       message: "حدث خطأ أثناء جلب تقرير الإجازات",
//       error: error.message
//     });
//   }
// };
exports.getEmployeesByLeaveType = async (req, res) => {
  try {
    const { type } = req.params;

    // الأنواع المسموح بها من الإجازات
    const validTypes = ["annual", "sick", "marriage", "emergency", "maternity", "unpaid"];
    if (!validTypes.includes(type)) {
      return res.status(400).json({
        success: false,
        message: `نوع الإجازة "${type}" غير صحيح`
      });
    }

    //  جلب رصيد الشركة الأساسي (document اللي employee = null)
    const companyBase = await LeaveBalance.findOne({ employee: null });
    if (!companyBase) {
      return res.status(404).json({
        success: false,
        message: "لم يتم العثور على رصيد الإجازات الأساسي للشركة"
      });
    }

    // جلب جميع سجلات الموظفين اللي عندهم رصيد إجازات
    const balances = await LeaveBalance.find({
      employee: { $exists: true, $ne: null }
    }).populate("employee", "name employeeNumber");

    // 👇 بناء التقرير
    const report = balances
      .filter(b => b.employee)
      .map(b => {
        // الرصيد الأساسي لهذا النوع من الشركة
        const totalDays = companyBase[type] ?? 0;
        // الباقي فعلاً عند الموظف
        const remainingDays = b[type] ?? totalDays;
        // المأخوذ نحسبه بالطرح
        const usedDays = totalDays - remainingDays;

        return {
          employeeName: b.employee.name,
          employeeNumber: b.employee.employeeNumber,
          leaveType: type,
          totalDays,
          usedDays: usedDays < 0 ? 0 : usedDays,
          remainingDays: remainingDays < 0 ? 0 : remainingDays
        };
      });

    res.status(200).json({
      success: true,
      count: report.length,
      data: report
    });

  } catch (error) {
    console.error("خطأ في getEmployeesByLeaveType:", error);
    res.status(500).json({
      success: false,
      message: "حدث خطأ أثناء جلب تقرير الإجازات",
      error: error.message
    });
  }
};




// ✅ عرض جميع بيانات الإقامة

exports.getResidencyData = async (req, res) => {
  try {
    const employees = await Employee.find()
      .populate("residency.duration", "year") 
      .select("name residency");

    const residencyList = employees.map((emp) => {
      const r = emp.residency || {};
      const today = new Date();


      let status = "غير محددة";
      if (r.end) {
        const endDate = new Date(r.end);
        const diffDays = (endDate - today) / (1000 * 60 * 60 * 24);
        if (diffDays < 0) status = "منتهية";
        else if (diffDays <= 30) status = "قرب الانتهاء";
        else status = "سارية";
      }

      return {
        name: emp.name || "لم يتم التحديد",
        additionNumber: r.additionNumber || "لم يتم التحديد",
        duration:
          r.duration?.year ? `${r.duration.year} سنوات` : "لم يتم التحديد", 
        start: r.start
          ? new Date(r.start).toISOString().split("T")[0]
          : "لم يتم التحديد",
        end: r.end
          ? new Date(r.end).toISOString().split("T")[0]
          : "لم يتم التحديد",
        status,
      };
    });

    res.json({ success: true, residencyList });
  } catch (error) {
    console.error(" Error fetching residency data:", error);
    res
      .status(500)
      .json({ success: false, message: "خطأ في جلب بيانات الإقامة", error: error.message });
  }
};


