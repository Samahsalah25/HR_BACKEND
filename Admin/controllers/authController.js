const User = require('../models/user');
const generateToken = require('../../utlis/generateToken');
const setTokenCookie= require('../../utlis/setTokenCookie');
const Employee=require('../models/employee')
// @desc Register user
exports.register = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) return res.status(400).json({ message: 'User already exists' });

    const user = await User.create({ name, email, password, role });

    const token = generateToken(user._id, user.role);
    setTokenCookie(res, token);

    res.status(201).json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Login user
exports.login = async (req, res) => {
  try {
    const { employeeNumber, password } = req.body;

    const employee = await Employee.findOne({ employeeNumber }).populate('user');
    if (!employee || !employee.user) {
      return res.status(401).json({ message: 'الرقم التعريفي او كلمة المرور غير صحيحة' });
    }
    const user = employee.user;

    const isMatch = await user.matchPassword(password);
    if (!isMatch) return res.status(401).json({ message: 'الرقم التعريفي او كلمة المرور غير صحيحة' });

    const token = generateToken(user._id, user.role);
   
    setTokenCookie(res, token);
   

    res.json({
      _id: user._id,
      name: user.name,
      role: user.role,
      employeeNumber: employee.employeeNumber 
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// controllers/authController.js أو حسب مكانك
exports.logout = (req, res) => {
  try {
   res.clearCookie("token", {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
});


    res.status(200).json({
      success: true,
      message: "تم تسجيل الخروج بنجاح",
    });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({
      success: false,
      message: "حدث خطأ أثناء تسجيل الخروج",
    });
  }
};


// controllers/authController.js
exports.getMe = async (req, res) => {
  try {
    // هات اليوزر من الـ token
    const user = await User.findById(req.user._id).select("-password");
    if (!user) {
      return res.status(404).json({ success: false, message: "المستخدم غير موجود" });
    }

    // هات الامبلوي اللي مربوط باليوزر ده
    const employee = await Employee.findOne({ user: user._id })
      .populate("department", "name")
      .populate("workplace", "name location");

    res.json({
      success: true,
      user: {
        ...user.toObject(),
        employee: employee ? employee.toObject() : null,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};


