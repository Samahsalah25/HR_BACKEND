const jwt = require('jsonwebtoken');
const generateToken = (id, role, expiresIn) => {
  return jwt.sign({ id, role }, process.env.JWT_SECRET, {
    expiresIn: expiresIn || process.env.JWT_EXPIRES_IN,
  });
};


module.exports = generateToken;
