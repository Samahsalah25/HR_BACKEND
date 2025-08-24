const User = require('../models/user');
const generateToken = require('../../utlis/generateToken');
const setTokenCookie = require('../../utlis/setTokenCookie');

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
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });

    const isMatch = await user.matchPassword(password);
    if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });

    const token = generateToken(user._id, user.role);
    setTokenCookie(res, token);

    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc Logout user
exports.logout = (req, res) => {
  res.cookie('token', '', {
    httpOnly: true,
    expires: new Date(0)
  });
  res.json({ message: 'Logged out successfully' });
};
// controllers/authController.js
exports.getMe = async (req, res) => {
  try {
    // الـ middleware تبع الـ auth بيحط req.user من التوكن
    const user = await User.findById(req.user.id)
      .populate({
        path: 'employee',
        populate: [
          { path: 'department', select: 'name' },
          { path: 'workplace', select: 'name location' },
          { path: 'manager', select: 'name jobTitle' }
        ]
      });

    if (!user) return res.status(404).json({ message: 'User not found' });

    res.json({
      success: true,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        employee: user.employee
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
