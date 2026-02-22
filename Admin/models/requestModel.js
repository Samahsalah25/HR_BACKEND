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
  employee: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },

  type: {
    type: String,
    enum: [
      'إجازة',
      'شكوى',
      'اعتراض',
      'بدل',
      'مطالبة تأمينية',
      'عهدة',
      'تصفية عهدة',
      'مصروف/فاتورة'
    ],
    required: true
  },

  status: {
    type: String,
    enum: ['قيد المراجعة', 'مقبول', 'مرفوض', 'محول'],
    default: 'قيد المراجعة'
  },

  leave: {
    leaveType: { type: String, enum: ['اعتيادية', 'مرضية', 'زواج', 'طارئة', 'ولادة', 'غير مدفوعة'] },
    startDate: Date,
    endDate: Date,
    description: String
  },

  complaint: {
    complaintType: { type: String, enum: ['إدارية', 'تشغيلية', 'أخرى'] },
    description: String,
    submitDate: { type: Date, default: Date.now }
  },

  appeal: {
    appealType: { type: String, enum: ['تقييم وظيفي', 'معاملة مالية', 'أخرى'] },
    description: String,
    submitDate: { type: Date, default: Date.now }
  },

  allowance: {
    allowanceType: { type: String, enum: ['بدل سفر', 'بدل سكن', 'بدل انتقالات', 'بدل شراء أدوات ومعدات', 'أخرى'] },
    amount: Number,
    spendDate: Date,
    description: String
  },

  insurance: {
    claimType: { type: String },
    claimDate: Date,
    description: String
  },

  custody: {
    // custodyType: { type: String, enum: ['أجهزة إلكترونية', 'أدوات مكتبية', 'معدات تشغيل', 'أخرى'] },
    // quantity: Number, 
    custodyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'assets',
    
    },
    status: {
      type: String,
      enum: ['قيد المراجعة', 'مسلمة', 'مستلمة'],
      default: 'قيد المراجعة'
    },
    requestDate: { type: Date, default: Date.now },
    purpose: String,
    duration: { type: String, enum: ['شهر', '3 شهور', '6 شهور', 'سنة', 'غير محددة'] },
    receivedDate: { type: Date },
    receivedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
    },
    returnDate: {
      type: Date,

    },
    returnedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Employee',
    }

  },

  custodyClearance: {
    custodyNumber: String,
    custodyType: String,
    quantity: Number,
    reason: { type: String, enum: ['انتهاء فترة الاستخدام', 'عطل', 'استبدال بعهدة جديدة', 'أخرى'] },
    description: String,
    clearanceDate: Date,
  },

  expense: {
    expenseType: { type: String, enum: ['مصروف', 'فاتورة'] },
    amount: Number,
    spendDate: Date,
    description: String
  },

  attachments: [attachmentSchema],

  decidedAt: Date,
  decidedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  decisionNote: String,
  rejectionReason: String,

  forwardedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },

  notes: [noteSchema]

}, { timestamps: true });

module.exports = mongoose.model('Request', requestSchema);
