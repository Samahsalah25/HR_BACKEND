// const jwt = require('jsonwebtoken');
// const User = require('../models/user');

// const authenticate = async (req, res, next) => {
//   try {
//     const token = req.cookies.token; 
//     if (!token) return res.status(401).json({ message: 'Unauthorized user' });
//     console.log('cookieToken' ,token)

//     const decoded = jwt.verify(token, process.env.JWT_SECRET);
//     const user = await User.findById(decoded.id);
//     if (!user) return res.status(401).json({ message: 'User not found' });

//     req.user = user; 
//     next();
//   } catch (error) {
//     console.error(error);
//     res.status(401).json({ message: 'Unauthorized' });
//   }
// };

// module.exports = authenticate;

const jwt = require('jsonwebtoken');
const User = require('../models/user');

const authenticate = async (req, res, next) => {
  try {
    let token;

    // 1) من الكوكي (للموقع)
    if (req.cookies?.token) {
      token = req.cookies.token;
    }

    // 2) من Authorization header (للموبايل)
    else if (req.headers.authorization?.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({ message: 'Unauthorized user' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }

    req.user = user;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Token expired' });
    }

    console.error(error);
    res.status(401).json({ message: 'Invalid token' });
  }
};

module.exports = authenticate;
