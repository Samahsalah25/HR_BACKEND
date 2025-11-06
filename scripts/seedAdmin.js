require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../Admin/models/user');
const Employee = require('../Admin/models/employee');
const LeaveBalance = require('..//Admin/models/leaveBalanceModel');
const Contract = require('../Admin//models/Contract');
const ResidencyYear = require('..//Admin/models/ResidencyYear');
const connectDB = require('../config/db');

const seedAdmin = async () => {
  try {
    await connectDB();

    // 🔹 شيك لو فيه أدمن موجود أصلاً
    const adminExists = await User.findOne({ role: 'ADMIN' });
    if (adminExists) {
      console.log('⚠️ Admin already exists');
      return;
    }

    // // 🔹 بيانات افتراضية للعقد والإقامة (لو مش موجودين)
    // let contract = await Contract.findOne();
    // if (!contract) {
    //   contract = await Contract.create({
    //     duration: 1,
    //     unit: 'years'
    //   });
    // }

    // let residency = await ResidencyYear.findOne();
    // if (!residency) {
    //   residency = await ResidencyYear.create({
    //     year: 1
    //   });
    // }

    // 🔹 إنشاء الأدمن في جدول المستخدمين
    const user = await User.create({
      name: 'Super Admin',
      email: 'admin2@hr.com',
      password: 'Admin1234',
      role: 'ADMIN',
    });


                                      
         
                   
    // 🔹 إنشاء الأدمن كموظف برقم مميز علشان يقدر يسجل دخول بنفس النظام
    const employee = await Employee.create({
      name: 'Super Admin',
      jobTitle: 'مدير النظام',
      employeeNumber: 'A-0002', // ← ممكن تغيريها لو حابة
   
      // employmentType: 'دوام كامل',
      // contract: {
      //   start: new Date(),
      //   duration: contract._id
      // },
      // residency: {
      //   start: new Date(),
      //   duration: residency._id
      // },
      workHoursPerWeek: 40,
      salary: 0,
      user: user._id
    });

    // 🔹 نسخ رصيد الإجازات الافتراضي للموظف الأدمن
    // const companyLeaves = await LeaveBalance.findOne({ employee: null });
    // if (companyLeaves) {
    //   const totalLeaveBalance =
    //     companyLeaves.annual +
    //     companyLeaves.sick +
    //     companyLeaves.marriage +
    //     companyLeaves.emergency +
    //     companyLeaves.maternity +
    //     companyLeaves.unpaid;

    //   await LeaveBalance.create({
    //     employee: employee._id,
    //     annual: companyLeaves.annual,
    //     sick: companyLeaves.sick,
    //     marriage: companyLeaves.marriage,
    //     emergency: companyLeaves.emergency,
    //     maternity: companyLeaves.maternity,
    //     unpaid: companyLeaves.unpaid,
    //     remaining: totalLeaveBalance,
    //   });
    // }

    console.log('✅ Admin created successfully:');
    console.log(`   Email: ${user.email}`);
    console.log(`   Employee Number: ${employee.employeeNumber}`);
    return;
  } catch (err) {
    console.error('❌ Error creating admin:', err);
  } finally {

  }
};


module.exports = seedAdmin;