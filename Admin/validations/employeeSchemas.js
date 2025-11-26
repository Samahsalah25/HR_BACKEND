const Joi = require('joi');

// ✅ إنشاء موظف
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
  department: Joi.string().hex().length(24).messages({
    "string.hex": "معرّف القسم يجب أن يكون ObjectId صحيح",
    "string.length": "معرّف القسم يجب أن يكون 24 حرف"
  }),
  manager: Joi.string().hex().length(24).allow(null).optional().messages({
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
  residencyNationality: Joi.string().allow("").messages({
    "string.base": "الجنسية يجب أن تكون نص"
  }),
  residencyAdditionNumber: Joi.string().allow("").messages({
    "string.base": "رقم الإضافة يجب أن يكون نص"
  }),
  residencyIssuingAuthority: Joi.string().allow("").messages({
    "string.base": "الجهة المصدرة يجب أن تكون نص"
  }),
  residencyInsuranceNumber: Joi.string().allow("").messages({
    "string.base": "الرقم التأميني يجب أن يكون نص"
  }),
  residencyType: Joi.string().allow("").messages({
    "string.base": "نوع الإقامة يجب أن يكون نص"
  }),
  workHoursPerWeek: Joi.number().messages({
    "number.base": "عدد ساعات العمل يجب أن يكون رقم"
  }),
  workplace: Joi.string().hex().length(24).messages({
    "string.hex": "معرّف الفرع يجب أن يكون ObjectId صحيح",
    "string.length": "معرّف الفرع يجب أن يكون 24 حرف"
  }),
  role: Joi.string().valid('ADMIN', 'HR', 'EMPLOYEE', 'Manager').default('EMPLOYEE'),

  // 💰 الراتب
  salary: Joi.object({
    base: Joi.number().min(0),
    housingAllowance: Joi.number().min(0),
    transportAllowance: Joi.number().min(0),
    otherAllowance: Joi.number().min(0)
  }),

  // 📞 بيانات الاتصال
  contactInfo: Joi.object({
    phone: Joi.string().allow("").messages({
      "string.base": "رقم الهاتف يجب أن يكون نص"
    }),
    address: Joi.string().allow("").messages({
      "string.base": "العنوان يجب أن يكون نص"
    })
  }).optional(),

  // 🏦 بيانات البنك
  bankInfo: Joi.object({
    iban: Joi.string().allow("").messages({
      "string.base": "رقم IBAN يجب أن يكون نص"
    }),
    bankName: Joi.string().allow("").messages({
      "string.base": "اسم البنك يجب أن يكون نص"
    }),
    swift: Joi.string().allow("").messages({
      "string.base": "رمز SWIFT يجب أن يكون نص"
    }),
    accountNumber: Joi.string().allow("").messages({
      "string.base": "رقم الحساب يجب أن يكون نص"
    })
  }).optional()
});


// ✅ تحديث موظف
const updateEmployeeSchema = Joi.object({
  name: Joi.string().min(3).max(100),
  jobTitle: Joi.string().allow(""),
  email: Joi.string().email(),
  department: Joi.string().hex().length(24),
  manager: Joi.string().hex().length(24).allow(null).optional(),
  employmentType: Joi.string().valid('Full-Time', 'Part-Time', 'Contract'),
  contractStart: Joi.date(),
  contractDurationId: Joi.string().hex().length(24),
  residencyStart: Joi.date(),
  residencyDurationId: Joi.string().hex().length(24),
  residencyNationality: Joi.string().allow(""),
  residencyAdditionNumber: Joi.string().allow(""),
  residencyIssuingAuthority: Joi.string().allow(""),
  residencyInsuranceNumber: Joi.string().allow(""),
  residencyType: Joi.string().allow(""),
  workHoursPerWeek: Joi.number(),
  workplace: Joi.string().hex().length(24),
  role: Joi.string().valid('ADMIN', 'HR', 'EMPLOYEE', 'Manager'),
  salary: Joi.object({
    base: Joi.number().min(0),
    housingAllowance: Joi.number().min(0),
    transportAllowance: Joi.number().min(0),
    otherAllowance: Joi.number().min(0)
  }),
  contactInfo: Joi.object({
    phone: Joi.string().allow(""),
    address: Joi.string().allow("")
  }).optional(),
  bankInfo: Joi.object({
    iban: Joi.string().allow(""),
    bankName: Joi.string().allow(""),
    swift: Joi.string().allow(""),
    accountNumber: Joi.string().allow("")
  }).optional()
}).min(1);


module.exports = {
  createEmployeeSchema,
  updateEmployeeSchema
};
