const Joi = require('joi');
const mongoose = require('mongoose');

const objectIdValidation = (value, helpers) => {
  if (!mongoose.Types.ObjectId.isValid(value)) {
    return helpers.error('any.invalid');
  }
  return value;
};


// Joi schema لبقية الحقول
const applicantSchema = Joi.object({
  name: Joi.string().required().messages({
    "any.required": "الاسم مطلوب",
    "string.empty": "الاسم لا يمكن أن يكون فارغ"
  }),
  mobile: Joi.string().required().messages({
    "any.required": "رقم الموبايل مطلوب",
    "string.empty": "رقم الموبايل لا يمكن أن يكون فارغ"
  }),
  email: Joi.string().email().required().messages({
    "any.required": "البريد الإلكتروني مطلوب",
    "string.email": "صيغة البريد الإلكتروني غير صحيحة"
  }),
  age: Joi.number().optional().min(18).messages({
    "number.min": "يجب أن يكون العمر 18 سنة على الأقل"
  }),
  experience: Joi.string().optional(),
  jobOpening: Joi.string().required().messages({
    "any.required": "الوظيفة مطلوبة",
    "string.empty": "الوظيفة لا يمكن أن تكون فارغة"
  }),
  status: Joi.string().valid('new', 'screened', 'interview', 'rejected', 'hired').optional(),
  notes: Joi.string().optional()
});

// Middleware للفالديشن مع ملف CV
exports.validateApplicant = (req, res, next) => {

  if (!req.file) {
    return res.status(400).json({ success: false, message: "ملف السيرة الذاتية مطلوب" });
  }

 
  const allowedTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];
  if (!allowedTypes.includes(req.file.mimetype)) {
    return res.status(400).json({ success: false, message: "صيغة الملف غير مدعومة. يجب أن يكون PDF أو DOC/DOCX" });
  }


  const { error } = applicantSchema.validate(req.body);
  if (error) {
    return res.status(400).json({ success: false, message: error.details[0].message });
  }

  next();
};


