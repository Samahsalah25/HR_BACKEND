// roleMiddleware.js

const authorizeRoles = (...allowedRoles) => {
    return (req, res, next) => {
   
        if (!req.user || !req.user.role) {
            return res.status(401).json({ message: 'غير مصرح لك بالوصول (بيانات المستخدم غير موجودة)' });
        }

    
        if (!allowedRoles.includes(req.user.role)) {
       
            return res.status(403).json({ message: 'غير مصرح لك بالوصول لهذا المسار' });
        }

   
        next();
    };
};

module.exports = authorizeRoles;