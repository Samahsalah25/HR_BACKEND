require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../Admin/models/user');
const connectDB = require('../config/db');
const seedAdmin = async () => {
  try {
    await connectDB();

    const adminExists = await User.findOne({ role: 'ADMIN' });
    if (adminExists) {
      console.log('⚠️ Admin already exists');
   return;
    }

    const admin = await User.create({
      name: 'Super Admin',
      email: 'admin@hr.com',
      password: 'Admin1234',
      role: 'ADMIN',
    });

    console.log('✅ Admin created:', admin.email);
    return;
  } catch (err) {
    console.error(err);
   return;
  }
};


module.exports = seedAdmin;