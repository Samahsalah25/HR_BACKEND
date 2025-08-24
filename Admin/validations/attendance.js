const Joi = require("joi");

const locationSchema = Joi.object({
  latitude: Joi.number().min(-90).max(90).required().messages({
    "number.base": "خط العرض يجب أن يكون رقم",
    "number.min": "خط العرض يجب ألا يقل عن -90",
    "number.max": "خط العرض يجب ألا يزيد عن 90",
    "any.required": "خط العرض مطلوب"
  }),
  longitude: Joi.number().min(-180).max(180).required().messages({
    "number.base": "خط الطول يجب أن يكون رقم",
    "number.min": "خط الطول يجب ألا يقل عن -180",
    "number.max": "خط الطول يجب ألا يزيد عن 180",
    "any.required": "خط الطول مطلوب"
  })
});

module.exports=locationSchema;