const Joi = require("joi");

const createDepartmentSchema = Joi.object({
  name: Joi.string()
    .min(3)
    .max(100)
    .required()
    .messages({
      "string.base": "الاسم يجب أن يكون نص",
      "string.empty": "اسم القسم مطلوب",
      "string.min": "اسم القسم يجب أن يحتوي على 3 أحرف على الأقل",
      "any.required": "اسم القسم مطلوب",
    }),
  description: Joi.string().allow("", null).optional(), 
});

const updateDepartmentSchema = Joi.object({
  name: Joi.string()
    .min(3)
    .max(100)
    .messages({
      "string.base": "الاسم يجب أن يكون نص",
      "string.empty": "اسم القسم مطلوب",
      "string.min": "اسم القسم يجب أن يحتوي على 3 أحرف على الأقل",
    }),
  description: Joi.string().allow("", null).optional(), 
}).min(1);


module.exports = {
  createDepartmentSchema,
  updateDepartmentSchema,
};
