const Joi = require("joi");
const mongoose = require("mongoose");

// Helper: validate ObjectId
const objectId = (value, helpers) => {
  if (!mongoose.Types.ObjectId.isValid(value)) {
    return helpers.error("any.invalid");
  }
  return value;
};

// Helper: validate time format HH:mm
const timeString = (value, helpers) => {
  const regex = /^([01]\d|2[0-3]):([0-5]\d)$/; // HH:mm
  if (!regex.test(value)) {
    return helpers.error("string.pattern.base", { name: "HH:mm" });
  }
  return value;
};

exports.meetingValidationSchema = Joi.object({
  title: Joi.string().required().messages({
    "string.empty": "اسم الاجتماع مطلوب",
  }),
  subTitle: Joi.string().allow(null, "").optional(),
  description: Joi.string().allow(null, "").optional(),

  day: Joi.date().required().messages({
    "date.base": "اليوم غير صالح",
    "any.required": "اليوم مطلوب",
  }),

  startTime: Joi.string().pattern(/^([01]\d|2[0-3]):([0-5]\d)$/).required().messages({
    "string.pattern.base": "وقت البداية يجب أن يكون بالشكل HH:mm",
    "any.required": "وقت البداية مطلوب",
  }),
  endTime: Joi.string().pattern(/^([01]\d|2[0-3]):([0-5]\d)$/).required().messages({
    "string.pattern.base": "وقت النهاية يجب أن يكون بالشكل HH:mm",
    "any.required": "وقت النهاية مطلوب",
  }),

  type: Joi.string().valid("online", "offline").required(),
  meetingLink: Joi.when("type", {
    is: "online",
    then: Joi.string().uri().required().messages({
      "any.required": "رابط الاجتماع مطلوب للاجتماعات الأونلاين",
      "string.uri": "رابط الاجتماع غير صالح",
    }),
    otherwise: Joi.string().optional().allow(null, ""),
  }),
  repeatOriginId: Joi.string().custom(objectId, "ObjectId validation").optional().allow(null)
,

  

  attachments: Joi.array().items(
    Joi.object({
      filename: Joi.string(),
      originalname: Joi.string(),
      path: Joi.string(),
    })
  ).optional(),
participants: Joi.alternatives().try(
  Joi.array().items(Joi.string().custom(objectId, "ObjectId validation")),
  Joi.string() // لو جاي سترينج من FormData
).custom((value, helpers) => {
  if (typeof value === "string") {
    try {
      return JSON.parse(value); // نحول النص Array
    } catch {
      return helpers.error("any.invalid");
    }
  }
  return value;
}).messages({
  "array.min": "يجب اختيار مشارك واحد على الأقل",
}),

repeat: Joi.alternatives().try(
  Joi.object({
    isRepeated: Joi.boolean().default(false),
    frequency: Joi.string().valid("daily", "weekly", "monthly").allow(null),
    sameTime: Joi.boolean().default(true),
    repeatEndDate: Joi.date().min("now").optional().default(() => {
      const now = new Date();
      now.setMonth(now.getMonth() + 6);
      return now;
    }),
  }),
  Joi.string()
).custom((value, helpers) => {
  if (typeof value === "string") {
    try {
      return JSON.parse(value);
    } catch {
      return helpers.error("any.invalid");
    }
  }
  return value;
}).default({ isRepeated: false }),


  status: Joi.string().valid("confirmed", "cancelled").default("confirmed"),
});
