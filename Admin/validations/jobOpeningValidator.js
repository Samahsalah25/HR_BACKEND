const Joi = require('joi');
const mongoose = require('mongoose');

const objectIdValidation = (value, helpers) => {
  if (!mongoose.Types.ObjectId.isValid(value)) {
    return helpers.error('any.invalid');
  }
  return value;
};

const createJobOpeningSchema = Joi.object({
  title: Joi.string().trim().required().messages({
    "string.base": "عنوان الوظيفة يجب أن يكون نص",
    "any.required": "عنوان الوظيفة مطلوب",
    "string.empty": "عنوان الوظيفة لا يمكن أن يكون فارغ"
  }),
  department: Joi.string().custom(objectIdValidation).required().messages({
    "any.invalid": "القسم غير صالح",
    "any.required": "القسم مطلوب"
  }),
  experienceRequired: Joi.string().trim().allow("").messages({
    "string.base": "الخبرة المطلوبة يجب أن تكون نص"
  }),
  skills: Joi.array().items(Joi.string().trim()).messages({
    "array.base": "المهارات يجب أن تكون مصفوفة من النصوص"
  }),
  employmentType: Joi.string().valid("full-time", "part-time", "internship").required().messages({
    "any.only": "نوع الوظيفة يجب أن يكون full-time أو part-time أو internship",
    "any.required": "نوع الوظيفة مطلوب"
  }),
  salaryRange: Joi.object({
    min: Joi.number().integer().min(0).messages({
      "number.base": "الحد الأدنى للراتب يجب أن يكون رقم",
      "number.min": "الحد الأدنى للراتب لا يمكن أن يكون أقل من صفر"
    }),
    max: Joi.number().integer().min(0).messages({
      "number.base": "الحد الأقصى للراتب يجب أن يكون رقم",
      "number.min": "الحد الأقصى للراتب لا يمكن أن يكون أقل من صفر"
    })
  }).messages({
    "object.base": "راتب الوظيفة يجب أن يكون كائن يحتوي على min و max"
  }),
  description: Joi.string().trim().allow("").messages({
    "string.base": "وصف الوظيفة يجب أن يكون نص"
  })
});


module.exports = createJobOpeningSchema;
