const Joi = require('joi');

const createEmployeeSchema = Joi.object({
  name: Joi.string().min(3).max(100).required().messages({
    "string.base": "الاسم يجب أن يكون نص",
    "string.empty": "الاسم مطلوب",
    "string.min": "الاسم يجب أن يكون على الأقل 3 حروف",
    "string.max": "الاسم يجب ألا يزيد عن 100 حرف",
    "any.required": "الاسم مطلوب"
  }),
  email: Joi.string().email().required().messages({
    "string.empty": "البريد الإلكتروني مطلوب",
    "string.email": "البريد الإلكتروني غير صالح",
    "any.required": "البريد الإلكتروني مطلوب"
  }),
  password: Joi.string().min(6).required().messages({
    "string.empty": "كلمة المرور مطلوبة",
    "string.min": "كلمة المرور يجب أن تكون 6 أحرف على الأقل",
    "any.required": "كلمة المرور مطلوبة"
  }),

  jobTitle: Joi.string().allow("").messages({
    "string.base": "المسمى الوظيفي يجب أن يكون نص"
  }),
  employeeNumber: Joi.string().required().messages({
    "string.empty": "رقم الموظف مطلوب",
    "any.required": "رقم الموظف مطلوب"
  }),
  department: Joi.string().hex().length(24).messages({
    "string.hex": "معرّف القسم يجب أن يكون ObjectId صحيح",
    "string.length": "معرّف القسم يجب أن يكون 24 حرف"
  }),
  manager: Joi.string().hex().length(24).messages({
    "string.hex": "معرّف المدير يجب أن يكون ObjectId صحيح",
    "string.length": "معرّف المدير يجب أن يكون 24 حرف"
  }),
  employmentType: Joi.string().valid('Full-Time', 'Part-Time', 'Contract').messages({
    "any.only": "نوع التوظيف يجب أن يكون Full-Time أو Part-Time أو Contract"
  }),

  contractStart: Joi.date().messages({
    "date.base": "تاريخ بداية العقد غير صالح"
  }),
  contractDurationId: Joi.string().hex().length(24).messages({
    "string.hex": "معرّف مدة العقد يجب أن يكون ObjectId صحيح",
    "string.length": "معرّف مدة العقد يجب أن يكون 24 حرف"
  }),

  residencyStart: Joi.date().messages({
    "date.base": "تاريخ بداية الإقامة غير صالح"
  }),
  residencyDurationId: Joi.string().hex().length(24).messages({
    "string.hex": "معرّف مدة الإقامة يجب أن يكون ObjectId صحيح",
    "string.length": "معرّف مدة الإقامة يجب أن يكون 24 حرف"
  }),

  workHoursPerWeek: Joi.number().messages({
    "number.base": "عدد ساعات العمل يجب أن يكون رقم"
  }),
  workplace: Joi.string().hex().length(24).messages({
    "string.hex": "معرّف الفرع يجب أن يكون ObjectId صحيح",
    "string.length": "معرّف الفرع يجب أن يكون 24 حرف"
  }),
    role: Joi.string().valid('ADMIN', 'HR' ,'EMPLOYEE').default('EMPLOYEE'),

  salary: Joi.object({
    base: Joi.number().min(0).messages({
      "number.base": "الراتب الأساسي يجب أن يكون رقم",
      "number.min": "الراتب الأساسي لا يمكن أن يكون أقل من صفر"
    }),
    housingAllowance: Joi.number().min(0).messages({
      "number.base": "بدل السكن يجب أن يكون رقم",
      "number.min": "بدل السكن لا يمكن أن يكون أقل من صفر"
    }),
    transportAllowance: Joi.number().min(0).messages({
      "number.base": "بدل المواصلات يجب أن يكون رقم",
      "number.min": "بدل المواصلات لا يمكن أن يكون أقل من صفر"
    }),
    
  
    otherAllowance: Joi.number().min(0).messages({
      "number.base": "البدلات الأخرى يجب أن تكون رقم",
      "number.min": "البدلات الأخرى لا يمكن أن تكون أقل من صفر"
    })
  }).messages({
    "object.base": "الراتب يجب أن يكون كائن يحتوي على الحقول المناسبة"
  })
});

const updateEmployeeSchema = Joi.object({
  name: Joi.string().min(3).max(100).messages({
    "string.base": "الاسم يجب أن يكون نص",
    "string.min": "الاسم يجب أن يكون على الأقل 3 حروف",
    "string.max": "الاسم يجب ألا يزيد عن 100 حرف"
  }),
  jobTitle: Joi.string().allow("").messages({
    "string.base": "المسمى الوظيفي يجب أن يكون نص"
  }),
  employeeNumber: Joi.string().messages({
    "string.base": "رقم الموظف يجب أن يكون نص"
  }),
  department: Joi.string().hex().length(24).messages({
    "string.hex": "معرّف القسم يجب أن يكون ObjectId صحيح",
    "string.length": "معرّف القسم يجب أن يكون 24 حرف"
  }),
  manager: Joi.string().hex().length(24).messages({
    "string.hex": "معرّف المدير يجب أن يكون ObjectId صحيح",
    "string.length": "معرّف المدير يجب أن يكون 24 حرف"
  }),
  employmentType: Joi.string().valid('Full-Time', 'Part-Time', 'Contract').messages({
    "any.only": "نوع التوظيف يجب أن يكون Full-Time أو Part-Time أو Contract"
  }),

  contractStart: Joi.date().messages({
    "date.base": "تاريخ بداية العقد غير صالح"
  }),
  contractDurationId: Joi.string().hex().length(24).messages({
    "string.hex": "معرّف مدة العقد يجب أن يكون ObjectId صحيح",
    "string.length": "معرّف مدة العقد يجب أن يكون 24 حرف"
  }),

  residencyStart: Joi.date().messages({
    "date.base": "تاريخ بداية الإقامة غير صالح"
  }),
  residencyDurationId: Joi.string().hex().length(24).messages({
    "string.hex": "معرّف مدة الإقامة يجب أن يكون ObjectId صحيح",
    "string.length": "معرّف مدة الإقامة يجب أن يكون 24 حرف"
  }),

  workHoursPerWeek: Joi.number().messages({
    "number.base": "عدد ساعات العمل يجب أن يكون رقم"
  }),
  workplace: Joi.string().hex().length(24).messages({
    "string.hex": "معرّف الفرع يجب أن يكون ObjectId صحيح",
    "string.length": "معرّف الفرع يجب أن يكون 24 حرف"
  }),

  salary: Joi.object({
    base: Joi.number().min(0).messages({
      "number.base": "الراتب الأساسي يجب أن يكون رقم",
      "number.min": "الراتب الأساسي لا يمكن أن يكون أقل من صفر"
    }),
    housingAllowance: Joi.number().min(0).messages({
      "number.base": "بدل السكن يجب أن يكون رقم",
      "number.min": "بدل السكن لا يمكن أن يكون أقل من صفر"
    }),
    transportAllowance: Joi.number().min(0).messages({
      "number.base": "بدل المواصلات يجب أن يكون رقم",
      "number.min": "بدل المواصلات لا يمكن أن يكون أقل من صفر"
    }),
    role: Joi.string().valid('ADMIN', 'HR' ,'EMPLOYEE').default('EMPLOYEE'),
    otherAllowance: Joi.number().min(0).messages({
      "number.base": "البدلات الأخرى يجب أن تكون رقم",
      "number.min": "البدلات الأخرى لا يمكن أن تكون أقل من صفر"
    })
  }).messages({
    "object.base": "الراتب يجب أن يكون كائن يحتوي على الحقول المناسبة"
  })
}).min(1).messages({
  "object.min": "يجب إرسال حقل واحد على الأقل للتعديل"
});

module.exports = {
  createEmployeeSchema,
  updateEmployeeSchema
};
