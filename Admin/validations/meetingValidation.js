const Joi = require("joi");
const mongoose = require("mongoose");

// Helper: validate ObjectId
const objectId = (value, helpers) => {
  if (!mongoose.Types.ObjectId.isValid(value)) {
    return helpers.error("any.invalid");
  }
  return value;
};

exports.meetingValidationSchema = Joi.object({
  title: Joi.string().required().messages({
    "string.empty": "اسم الاجتماع مطلوب",
  }),
  subTitle: Joi.string().allow(null, "").optional(),
  description: Joi.string().allow(null, "").optional(),

  startTime: Joi.date().required().messages({
    "date.base": "وقت البداية غير صالح",
    "any.required": "وقت البداية مطلوب",
  }),
  endTime: Joi.date().greater(Joi.ref("startTime")).required().messages({
    "date.greater": "وقت النهاية يجب أن يكون بعد وقت البداية",
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

  participants: Joi.array().items(Joi.string().custom(objectId, "ObjectId validation")).min(1).messages({
    "array.min": "يجب اختيار مشارك واحد على الأقل",
  }),

  attachments: Joi.array().items(
    Joi.object({
      filename: Joi.string(),
      originalname: Joi.string(),
      path: Joi.string(),
    })
  ).optional(),

  repeat: Joi.object({
    isRepeated: Joi.boolean().default(false),
    frequency: Joi.string().valid("daily", "weekly", "monthly", "custom").allow(null),
    sameTime: Joi.boolean().default(true),

    customTimes: Joi.when("sameTime", {
      is: false,
      then: Joi.array().items(
        Joi.object({
          occurrenceNumber: Joi.number().required(),
          startTime: Joi.date().required(),
          endTime: Joi.date().greater(Joi.ref("startTime")).required(),
        })
      ).min(1).required(),
      otherwise: Joi.forbidden(), // لو sameTime = true مينفعش يرفع customTimes
    }),
  }).default({ isRepeated: false }),



  status: Joi.string().valid("confirmed", "cancelled").default("confirmed"),
});

