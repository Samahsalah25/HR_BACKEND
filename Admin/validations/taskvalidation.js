const Joi = require('joi');

// Schema للفانكشن createTask
const createTaskSchema = Joi.object({
  title: Joi.string().trim().required().messages({
    'string.empty': 'حقل العنوان مطلوب',
    'any.required': 'حقل العنوان مطلوب'
  }),
  description: Joi.string().trim().required().messages({
    'string.empty': 'حقل الوصف مطلوب',
    'any.required': 'حقل الوصف مطلوب'
  }),
  assignedTo: Joi.string().length(24).hex().required().messages({
    'string.empty': 'يجب اختيار الموظف',
    'string.length': 'assignedTo يجب أن يكون معرف MongoDB صالح',
    'any.required': 'يجب اختيار الموظف'
  }),
  dueDate: Joi.date().iso().required().messages({
    'date.format': 'التاريخ يجب أن يكون بصيغة ISO (YYYY-MM-DD)',
    'any.required': 'حقل تاريخ الاستحقاق مطلوب'
  }),
  attachment: Joi.object({
    originalname: Joi.string().required().messages({
      'any.required': 'اسم الملف الأصلي مطلوب'
    }),
    filename: Joi.string().required().messages({
      'any.required': 'اسم الملف محفوظ مطلوب'
    }),
    path: Joi.string().required().messages({
      'any.required': 'مسار الملف مطلوب'
    }),
  }).optional()
});

// Schema للفانكشن updateTask مع مسجات
const updateTaskSchema = Joi.object({
  title: Joi.string().trim().optional().messages({
    'string.empty': 'حقل العنوان لا يمكن أن يكون فارغًا'
  }),
  description: Joi.string().trim().optional().messages({
    'string.empty': 'حقل الوصف لا يمكن أن يكون فارغًا'
  }),
  dueDate: Joi.date().iso().optional().messages({
    'date.format': 'التاريخ يجب أن يكون بصيغة ISO (YYYY-MM-DD)'
  }),
  assignDate: Joi.date().iso().optional().messages({
    'date.format': 'تاريخ الإسناد يجب أن يكون بصيغة ISO (YYYY-MM-DD)'
  }),
  attachment: Joi.object({
    originalname: Joi.string().required().messages({
      'any.required': 'اسم الملف الأصلي مطلوب'
    }),
    filename: Joi.string().required().messages({
      'any.required': 'اسم الملف محفوظ مطلوب'
    }),
    path: Joi.string().required().messages({
      'any.required': 'مسار الملف مطلوب'
    }),
  }).optional()
});

module.exports = {
  createTaskSchema,
  updateTaskSchema
};
