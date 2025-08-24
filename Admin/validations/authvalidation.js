const Joi = require("joi");

const loginSchema = Joi.object({
  email: Joi.string().email().required().messages({
    "string.empty": "البريد الإلكتروني مطلوب",
    "string.email": "البريد الإلكتروني غير صالح",
    "any.required": "البريد الإلكتروني مطلوب"
  }),
  password: Joi.string().min(6).required().messages({
    "string.empty": "كلمة المرور مطلوبة",
    "string.min": "كلمة المرور يجب أن تكون 6 أحرف على الأقل",
    "any.required": "كلمة المرور مطلوبة"
  })
});

module.exports=loginSchema;