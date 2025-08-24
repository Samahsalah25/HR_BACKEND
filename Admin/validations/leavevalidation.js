const Joi = require('joi');

const createCompanyLeavesSchema = Joi.object({
  annual: Joi.number().integer().min(0).required().messages({
    "number.base": "عدد أيام الإجازة السنوية يجب أن يكون رقم",
    "number.min": "عدد أيام الإجازة السنوية لا يمكن أن يكون أقل من صفر",
    "any.required": "عدد أيام الإجازة السنوية مطلوب"
  }),
  sick: Joi.number().integer().min(0).required().messages({
    "number.base": "عدد أيام الإجازة المرضية يجب أن يكون رقم",
    "number.min": "عدد أيام الإجازة المرضية لا يمكن أن يكون أقل من صفر",
    "any.required": "عدد أيام الإجازة المرضية مطلوب"
  }),
  marriage: Joi.number().integer().min(0).required().messages({
    "number.base": "عدد أيام إجازة الزواج يجب أن يكون رقم",
    "number.min": "عدد أيام إجازة الزواج لا يمكن أن يكون أقل من صفر",
    "any.required": "عدد أيام إجازة الزواج مطلوب"
  }),
  emergency: Joi.number().integer().min(0).required().messages({
    "number.base": "عدد أيام إجازة الطوارئ يجب أن يكون رقم",
    "number.min": "عدد أيام إجازة الطوارئ لا يمكن أن يكون أقل من صفر",
    "any.required": "عدد أيام إجازة الطوارئ مطلوب"
  }),
  maternity: Joi.number().integer().min(0).required().messages({
    "number.base": "عدد أيام إجازة الأمومة يجب أن يكون رقم",
    "number.min": "عدد أيام إجازة الأمومة لا يمكن أن يكون أقل من صفر",
    "any.required": "عدد أيام إجازة الأمومة مطلوب"
  }),
  unpaid: Joi.number().integer().min(0).required().messages({
    "number.base": "عدد أيام الإجازة بدون راتب يجب أن يكون رقم",
    "number.min": "عدد أيام الإجازة بدون راتب لا يمكن أن يكون أقل من صفر",
    "any.required": "عدد أيام الإجازة بدون راتب مطلوب"
  })
});
module.exports=createCompanyLeavesSchema