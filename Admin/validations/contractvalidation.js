// validations/contractValidation.js
const Joi = require("joi");

const createContractSchema = Joi.object({
  name: Joi.string()
    .min(3)
    .max(100)
    .required()
    .messages({
      "string.empty": "اسم العقد مطلوب",
      "string.min": "اسم العقد يجب أن يكون على الأقل 3 أحرف",
      "string.max": "اسم العقد يجب ألا يزيد عن 100 حرف",
      "any.required": "اسم العقد مطلوب"
    }),

  duration: Joi.number()
    .integer()
    .min(1)
    .required()
    .messages({
      "number.base": "مدة العقد يجب أن تكون رقم صحيح",
      "number.min": "مدة العقد يجب أن تكون على الأقل سنة أو شهر واحد",
      "any.required": "مدة العقد مطلوبة"
    }),

  unit: Joi.string()
    .valid("years", "months")
    .required()
    .messages({
      "any.only": "الوحدة يجب أن تكون إما years أو months",
      "any.required": "الوحدة مطلوبة"
    }),
});

const updateContractSchema = Joi.object({
  name: Joi.string().min(3).max(100).messages({
    "string.empty": "اسم العقد مطلوب",
    "string.min": "اسم العقد يجب أن يكون على الأقل 3 أحرف",
    "string.max": "اسم العقد يجب ألا يزيد عن 100 حرف"
  }),

  duration: Joi.number().integer().min(1).messages({
    "number.base": "مدة العقد يجب أن تكون رقم صحيح",
    "number.min": "مدة العقد يجب أن تكون على الأقل سنة أو شهر واحد"
  }),

  unit: Joi.string().valid("years", "months").messages({
    "any.only": "الوحدة يجب أن تكون إما years أو months"
  }),
}).min(1).messages({
  "object.min": "يجب إدخال حقل واحد على الأقل للتحديث"
});

module.exports = {
  createContractSchema,
  updateContractSchema
};
