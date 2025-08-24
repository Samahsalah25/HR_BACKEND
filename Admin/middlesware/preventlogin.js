const jwt = require("jsonwebtoken");

const preventLoggedIn = (req, res, next) => {
  try {
    const token = req.cookies?.token || req.headers.authorization?.split(" ")[1];
    if (token) {
      try {
        jwt.verify(token, process.env.JWT_SECRET);
        return res.status(400).json({ message: "أنت مسجل دخول بالفعل" });
      } catch (err) {

        return next();
      }
    }

   
    next();
  } catch (error) {
    next(error);
  }
};

module.exports=preventLoggedIn;