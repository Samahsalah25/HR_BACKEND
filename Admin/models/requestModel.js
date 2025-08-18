const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema({
  text: { type: String, required: true },
  by: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  at: { type: Date, default: Date.now }
}, { _id: false });

const attachmentSchema = new mongoose.Schema({
  filename: String,
  url: String
}, { _id: false });

const requestSchema = new mongoose.Schema({
  // صاحب الطلب (من Employee)
  employee: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },

  // نوع الطلب (بالعربي)
  type: {
    type: String,
    enum: ['إجازة', 'شكوى', 'اعتراض', 'بدل', 'مطالبة تأمينية'],
    required: true
  },

  // الحالة
  status: {
    type: String,
    enum: ['قيد المراجعة', 'مقبول', 'مرفوض', 'محول'],
    default: 'قيد المراجعة'
  },

  // تفاصيل حسب النوع:
  leave: {
    leaveType: { 
      type: String, 
      enum: ['سنوية', 'مرضية', 'بدون مرتب', 'أخرى'] 
    },
    startDate: Date,
    endDate: Date,
    description: String
  },

  complaint: {
    description: String
  },

  appeal: {
    appealType: { type: String }, // زي: "خصم"، "تأخير"…
    description: String
  },

  allowance: {
    allowanceType: { type: String }, // نوع المطالبة
    amount: { type: Number },
    spendDate: { type: Date },
    description: String
  },

  insurance: {
    claimType: { type: String },
    claimDate: { type: Date },
    description: String
  },

  // مرفقات عامة لأي نوع
  attachments: [attachmentSchema],

  // قرارات
  decidedAt: Date,
  decidedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  decisionNote: String,
  rejectionReason: String,

  // تحويل
 // بدل enum القديم
forwardedTo: { 
  type: mongoose.Schema.Types.ObjectId, 
  ref: 'User', 
  default: null 
},

  // ملاحظات
  notes: [noteSchema],

}, { timestamps: true });

module.exports = mongoose.model('Request', requestSchema);
