const Joi = require("joi");

const attachmentSchema = Joi.object({
  filename: Joi.string().required().messages({
    "string.base": "اسم الملف يجب أن يكون نص",
    "any.required": "اسم الملف مطلوب"
  }),
  url: Joi.string().required().messages({
    "string.base": "رابط الملف يجب أن يكون نص",
    "any.required": "رابط الملف مطلوب"
  })
});

const createRecordSchema = Joi.object({
  category: Joi.string().valid("سجل تجاري", "تراخيص").required().messages({
    "any.only": "الفئة يجب أن تكون 'سجل تجاري' أو 'تراخيص'",
    "any.required": "الفئة مطلوبة"
  }),
  type: Joi.string().required().messages({
    "string.base": "نوع السجل يجب أن يكون نص",
    "any.required": "نوع السجل مطلوب"
  }),
  number: Joi.string().allow("").messages({
    "string.base": "رقم السجل يجب أن يكون نص"
  }),
  branch: Joi.string().allow("").messages({
    "string.base": "الفرع يجب أن يكون نص"
  }),
  issueDate: Joi.date().messages({
    "date.base": "تاريخ الإصدار غير صالح"
  }),
  expiryDate: Joi.date().messages({
    "date.base": "تاريخ الانتهاء غير صالح"
  }),
  attachments: Joi.array().items(attachmentSchema).messages({
    "array.base": "المرفقات يجب أن تكون مصفوفة"
  })
});

const updateRecordSchema = Joi.object({
  category: Joi.string().valid("سجل تجاري", "تراخيص").messages({
    "any.only": "الفئة يجب أن تكون 'سجل تجاري' أو 'تراخيص'"
  }),
  type: Joi.string().messages({
    "string.base": "نوع السجل يجب أن يكون نص"
  }),
  number: Joi.string().messages({
    "string.base": "رقم السجل يجب أن يكون نص"
  }),
  branch: Joi.string().messages({
    "string.base": "الفرع يجب أن يكون نص"
  }),
  issueDate: Joi.date().messages({
    "date.base": "تاريخ الإصدار غير صالح"
  }),
  expiryDate: Joi.date().messages({
    "date.base": "تاريخ الانتهاء غير صالح"
  }),
  attachments: Joi.array().items(attachmentSchema).messages({
    "array.base": "المرفقات يجب أن تكون مصفوفة"
  })
}).min(1).messages({
  "object.min": "يجب إرسال حقل واحد على الأقل للتعديل"
});

module.exports = { createRecordSchema, updateRecordSchema };
