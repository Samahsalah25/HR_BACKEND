const Joi = require('joi');

const createRequestSchema = Joi.object({
  type: Joi.string()
    .valid(
      'إجازة',
      'شكوى',
      'اعتراض',
      'بدل',
      'مطالبة تأمينية',
      'عهدة',
      'تصفية عهدة',
      'مصروف/فاتورة'
    )
    .required()
    .messages({
      'any.required': 'نوع الطلب مطلوب',
      'any.only': 'نوع الطلب غير صالح'
    }),

  // إجازة
  leave: Joi.object({
    leaveType: Joi.string()
      .valid('اعتيادية', 'مرضية', 'زواج', 'طارئة', 'ولادة', 'غير مدفوعة')
      .required(),
    startDate: Joi.date().required(),
    endDate: Joi.date().required(),
    description: Joi.string().allow('', null)
  }).optional(),

  // شكوى
  complaint: Joi.object({
    complaintType: Joi.string()
      .valid('إدارية', 'تشغيلية', 'أخرى')
      .required(),
    description: Joi.string().required()
  }).optional(),

  // اعتراض
  appeal: Joi.object({
    appealType: Joi.string()
      .valid('تقييم وظيفي', 'معاملة مالية', 'أخرى')
      .required(),
    description: Joi.string().allow('', null)
  }).optional(),

  // بدل
  allowance: Joi.object({
    allowanceType: Joi.string()
      .valid('بدل سفر', 'بدل سكن', 'بدل انتقالات', 'بدل شراء أدوات ومعدات', 'أخرى')
      .required(),
    amount: Joi.number().min(0).required(),
    spendDate: Joi.date().required(),
    description: Joi.string().allow('', null)
  }).optional(),

  // مطالبة تأمينية
  insurance: Joi.object({
    claimType: Joi.string().required(),
    claimDate: Joi.date().required(),
    description: Joi.string().allow('', null)
  }).optional(),

  // عهدة
  custody: Joi.object({
    custodyType: Joi.string()
      .valid('أجهزة إلكترونية', 'أدوات مكتبية', 'معدات تشغيل', 'أخرى')
      .required(),
    quantity: Joi.number().min(1).required(),
    purpose: Joi.string().required(),
    duration: Joi.string()
      .valid('شهر', '3 شهور', '6 شهور', 'سنة', 'غير محددة')
      .required(),
    requestDate: Joi.date().required(),
    description: Joi.string().allow('', null)
  }).optional(),

  // تصفية عهدة
  custodyClearance: Joi.object({
    custodyNumber: Joi.string().required(), // نفس الـ mongoose
    custodyType: Joi.string().required(),
    quantity: Joi.number().min(1).required(),
    reason: Joi.string()
      .valid('انتهاء فترة الاستخدام', 'عطل', 'استبدال بعهدة جديدة', 'أخرى')
      .required(),
    description: Joi.string().allow('', null)
  }).optional(),

  // مصروف / فاتورة
  expense: Joi.object({
    expenseType: Joi.string()
      .valid('مصروف', 'فاتورة')
      .required(),
    amount: Joi.number().min(0).required(),
    spendDate: Joi.date().required(),
    description: Joi.string().allow('', null)
  }).optional()
});

// updateRequestSchema (كل الحقول optional)
const updateRequestSchema = createRequestSchema.fork(
  [
    'leave',
    'complaint',
    'appeal',
    'allowance',
    'insurance',
    'custody',
    'custodyClearance',
    'expense'
  ],
  field => field.optional()
);

const addNoteSchema = Joi.object({
  text: Joi.string().min(1).required().messages({
    'string.base': 'النص يجب أن يكون نص',
    'string.empty': 'النص مطلوب',
    'string.min': 'النص يجب أن يحتوي على حرف واحد على الأقل',
    'any.required': 'النص مطلوب'
  })
});

module.exports = { createRequestSchema, updateRequestSchema, addNoteSchema };
