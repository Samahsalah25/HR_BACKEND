const Joi = require('joi');

const createRequestSchema = Joi.object({
  type: Joi.string()
    .valid('إجازة', 'شكوى', 'اعتراض', 'بدل', 'مطالبة تأمينية')
    .required()
    .messages({
      'any.required': 'نوع الطلب مطلوب',
      'any.only': 'نوع الطلب يجب أن يكون أحد القيم: إجازة، شكوى، اعتراض، بدل، مطالبة تأمينية'
    }),

leave: Joi.object({
  leaveType: Joi.string()
    .valid('اعتيادية','مرضية','زواج','طارئة','ولادة','غير مدفوعة')
    .required()
    .messages({
      'any.only': 'نوع الإجازة غير صالح، يجب أن يكون واحد من: اعتيادية, مرضية, زواج, طارئة, ولادة, غير مدفوعة',
      'any.required': 'نوع الإجازة مطلوب'
    }),
  startDate: Joi.date().required(),
  endDate: Joi.date().required(),
  description: Joi.string().allow('', null)
}).optional(),
 

  complaint: Joi.object({
    description: Joi.string().required()
  }).optional(),

  appeal: Joi.object({
    appealType: Joi.string().required(),
    description: Joi.string().allow('', null)
  }).optional(),

  allowance: Joi.object({
    allowanceType: Joi.string().required(),
    amount: Joi.number().min(0).required(),
    spendDate: Joi.date().optional(),
    description: Joi.string().allow('', null)
  }).optional(),

  insurance: Joi.object({
    claimType: Joi.string().required(),
    claimDate: Joi.date().optional(),
    description: Joi.string().allow('', null)
  }).optional()
});

const updateRequestSchema = Joi.object({
  type: Joi.string()
    .valid('إجازة', 'شكوى', 'اعتراض', 'بدل', 'مطالبة تأمينية')
    .messages({
      'any.only': 'نوع الطلب يجب أن يكون أحد القيم: إجازة، شكوى، اعتراض، بدل، مطالبة تأمينية'
    }),

leave: Joi.object({
  leaveType: Joi.string()
    .valid('اعتيادية','مرضية','زواج','طارئة','ولادة','غير مدفوعة')
    .required()
    .messages({
      'any.only': 'نوع الإجازة غير صالح، يجب أن يكون واحد من: اعتيادية, مرضية, زواج, طارئة, ولادة, غير مدفوعة',
      'any.required': 'نوع الإجازة مطلوب'
    }),
  startDate: Joi.date().required(),
  endDate: Joi.date().required(),
  description: Joi.string().allow('', null)
}).optional(),


  complaint: Joi.object({
    description: Joi.string()
  }).optional(),

  appeal: Joi.object({
    appealType: Joi.string(),
    description: Joi.string().allow('', null)
  }).optional(),

  allowance: Joi.object({
    allowanceType: Joi.string(),
    amount: Joi.number().min(0),
    spendDate: Joi.date().optional(),
    description: Joi.string().allow('', null)
  }).optional(),

  insurance: Joi.object({
    claimType: Joi.string(),
    claimDate: Joi.date().optional(),
    description: Joi.string().allow('', null)
  }).optional()
}).min(1).messages({
  'object.min': 'يجب إرسال حقل واحد على الأقل للتعديل'
});

const addNoteSchema = Joi.object({
  text: Joi.string().min(1).required().messages({
    "string.base": "النص يجب أن يكون نص",
    "string.empty": "النص مطلوب",
    "string.min": "النص يجب أن يحتوي على حرف واحد على الأقل",
    "any.required": "النص مطلوب"
  })
});
module.exports={createRequestSchema ,updateRequestSchema ,addNoteSchema };