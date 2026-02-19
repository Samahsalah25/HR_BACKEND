const Joi = require('joi');

const assetValidationSchema = Joi.object({
    assetType: Joi.string()
        .valid('أجهزة إلكترونية', 'أدوات مكتبية', 'معدات تشغيل', 'أخرى')
        .required()
        .messages({
            'any.only': 'قيمة "نوع العهدة" غير صالحة، يرجى الاختيار من القائمة المحددة.',
            'any.required': 'حقل "نوع العهدة" مطلوب ولا يمكن تركه فارغاً.'
        }),

    assetName: Joi.string().min(3).required().messages({
        'string.base': 'يجب أن يكون "اسم الأصل" نصاً.',
        'string.empty': 'حقل "اسم الأصل" مطلوب.',
        'string.min': 'يجب ألا يقل "اسم الأصل" عن 3 أحرف.',
        'any.required': 'حقل "اسم الأصل" إلزامي لإتمام العملية.'
    }),

    description: Joi.string().required().messages({
        'string.empty': 'حقل "الوصف" مطلوب.',
        'any.required': 'يرجى إدخال وصف تفصيلي للأصل.'
    }),

    serialNumber: Joi.string(),
    brand: Joi.string(),
    model: Joi.string(),
    purchasePrice: Joi.number().min(0).messages({
        'number.base': 'يجب أن تكون قيمة "سعر الشراء" رقماً.'
    }),
    supplierName: Joi.string(),
    invoiceNumber: Joi.string(),
    warrantyPeriod: Joi.string()
});

module.exports = {
    assetValidationSchema
};
