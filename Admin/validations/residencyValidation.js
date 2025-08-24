// validation/residencyValidation.js
const Joi = require('joi');

const createResidencyYearSchema = Joi.object({
  year: Joi.number()
    .integer()
    .min(1)
    .required()
    .messages({
      'number.base': 'قيمة السنة لازم تكون رقم صحيح',
      'number.min': 'الإقامة لازم تبدأ من سنة واحدة على الأقل',
      'any.required': 'عدد سنوات الإقامة مطلوب'
    })
});

const updateResidencyYearSchema = Joi.object({
  year: Joi.number()
    .integer()
    .min(1)
    .messages({
      'number.base': 'قيمة السنة لازم تكون رقم صحيح',
      'number.min': 'الإقامة لازم تبدأ من سنة واحدة على الأقل'
    })
}).min(1);

module.exports = {
  createResidencyYearSchema,
  updateResidencyYearSchema
};
