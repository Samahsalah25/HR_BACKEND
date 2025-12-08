const Joi = require("joi");

// CREATE Interview
exports.createInterviewValidation = Joi.object({
  applicant: Joi.string().required().messages({
    "any.required": "المتقدم مطلوب",
    "string.empty": "المتقدم مطلوب",
  }),

  title: Joi.string().required().messages({
    "any.required": "عنوان المقابلة مطلوب",
    "string.empty": "عنوان المقابلة مطلوب",
  }),

  interviewer: Joi.string().required().messages({
    "any.required": "المُحاور مطلوب",
    "string.empty": "المُحاور مطلوب",
  }),

  date: Joi.date().required().messages({
    "any.required": "تاريخ المقابلة مطلوب",
    "date.base": "صيغة التاريخ غير صحيحة",
  }),

  type: Joi.string()
    .valid("online", "onsite")
    .required()
    .messages({
      "any.required": "نوع المقابلة مطلوب",
      "any.only": "نوع المقابلة يجب أن يكون online أو onsite",
    }),

  location: Joi.string().allow("", null),
});


// UPDATE Interview (يمكن تعديل أي حاجة)
exports.updateInterviewValidation = Joi.object({
  title: Joi.string().optional(),
  interviewer: Joi.string().optional(),
  date: Joi.date().optional(),
  type: Joi.string().valid("online", "onsite").optional(),
  location: Joi.string().allow("", null),
  notes: Joi.string().allow("", null),
  rating: Joi.number().min(1).max(10).optional(),
});


// UPDATE Interview Result
exports.updateInterviewResultValidation = Joi.object({
  result: Joi.string().valid("pending", "passed", "failed").required().messages({
    "any.required": "نتيجة المقابلة مطلوبة",
    "any.only": "النتيجة يجب أن تكون passed أو failed أو pending",
  }),

  rating: Joi.number().min(1).max(10).allow(null),

  notes: Joi.string().allow("", null),
});
