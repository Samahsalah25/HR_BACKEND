const Joi = require("joi");

const loginSchema = Joi.object({
  employeeNumber: Joi.string().required().messages({
    "string.empty": "رقم التعريفي مطلوب",
    "any.required": "رقم التعريفي مطلوب"
  }),
  password: Joi.string().min(6).required().messages({
    "string.empty": "كلمة المرور مطلوبة",
    "string.min": "كلمة المرور يجب أن تكون 6 أحرف على الأقل",
    "any.required": "كلمة المرور مطلوبة"
  })
});

module.exports = loginSchema;
