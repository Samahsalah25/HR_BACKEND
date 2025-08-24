const Joi = require("joi");

// Regex للتحقق من صيغة الوقت HH:mm
const timeRegex = /^([0-1]\d|2[0-3]):([0-5]\d)$/;

const createBranchSchema = Joi.object({
  name: Joi.string().min(2).max(100).required().messages({
    "string.empty": "اسم الفرع مطلوب",
    "string.min": "اسم الفرع يجب أن يكون على الأقل حرفين",
    "string.max": "اسم الفرع لا يجب أن يتعدى 100 حرف",
    "any.required": "اسم الفرع مطلوب"
  }),

  location: Joi.object({
    type: Joi.string().valid("Point").default("Point"),
    coordinates: Joi.array()
      .items(Joi.number().required())
      .length(2)
      .required()
      .messages({
        "array.base": "إحداثيات الموقع يجب أن تكون مصفوفة",
        "array.length": "يجب إرسال خط الطول والعرض [lng, lat]",
        "any.required": "إحداثيات الموقع مطلوبة"
      }),
  }).required(),

  workStart: Joi.string().pattern(timeRegex).required().messages({
    "string.empty": "وقت بداية الدوام مطلوب",
    "string.pattern.base": "صيغة وقت بداية الدوام يجب أن تكون HH:mm"
  }),

  workEnd: Joi.string().pattern(timeRegex).required().messages({
    "string.empty": "وقت نهاية الدوام مطلوب",
    "string.pattern.base": "صيغة وقت نهاية الدوام يجب أن تكون HH:mm"
  }),

  gracePeriod: Joi.number().min(0).default(15).messages({
    "number.base": "فترة السماح يجب أن تكون رقم",
    "number.min": "فترة السماح لا يمكن أن تكون أقل من 0"
  }),

  allowedLateMinutes: Joi.number().min(0).default(30).messages({
    "number.base": "الدقائق المسموح بها يجب أن تكون رقم",
    "number.min": "لا يمكن أن تكون الدقائق أقل من 0"
  }),

  weekendDays: Joi.array()
    .items(Joi.number().min(0).max(6))
    .default([5, 6])
    .messages({
      "array.base": "أيام العطلة يجب أن تكون في شكل مصفوفة",
      "number.base": "كل يوم عطلة يجب أن يكون رقم من 0 إلى 6"
    }),
});

const updateBranchSchema = createBranchSchema.fork(
  ["name", "location", "workStart", "workEnd"],
  (schema) => schema.optional()
);

module.exports = {
  createBranchSchema,
  updateBranchSchema,
};
