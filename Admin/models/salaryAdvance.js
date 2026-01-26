// const mongoose = require('mongoose');

// const salaryAdvanceSchema = new mongoose.Schema({
// type: {
//   type: String,
//   default: 'سلفة من الراتب', // أي سلفة تتعمل تلقائي النوع ده
// },

//   employee: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'Employee',
//     required: true
//   },

//   amount: {
//     type: Number,
//     required: true
//   },

//   installmentsCount: {
//     type: Number,
//     required: true
//   },

//   installmentAmount: {
//     type: Number,
//     required: true
//   },

//   startDate: {
//     type: Date,
//     required: true
//   },

//   notes: String,

//   attachments: [{
//     filename: String,
//     url: String
//   }],

//   status: {
//     type: String,
//     enum: [
//       'pending',      // في انتظار الاعتماد
//       'approved',     // معتمدة
//       'paid',         // اتدفعت للموظف
//       'completed',    // اتسددت بالكامل
//       'rejected'
//     ],
//     default: 'pending'
//   },

//   totalPaid: {
//     type: Number,
//     default: 0
//   },

//   remainingAmount: {
//     type: Number
//   },

//   createdBy: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'User'
//   }
//   ,
//   approvedBy: {
//   type: mongoose.Schema.Types.ObjectId,
//   ref: 'User'
// },

// approvedAt: {
//   type: Date
// },
// rejectedBy: {
//   type: mongoose.Schema.Types.ObjectId,
//   ref: 'User',
// },
// rejectedAt: {
//   type: Date,
// },



// }, { timestamps: true });

// module.exports = mongoose.model('SalaryAdvance', salaryAdvanceSchema);
const mongoose = require('mongoose');

const salaryAdvanceSchema = new mongoose.Schema({
  type: { type: String, default: 'سلفة من الراتب' },

  employee: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },

  amount: { type: Number, required: true },
  installmentsCount: { type: Number, required: true },
  installmentAmount: { type: Number, required: true },
  startDate: { type: Date, required: true },
  notes: String,
  attachments: [{ filename: String, url: String }],

  status: {
    type: String,
    enum: ['pending', 'approved', 'completed', 'rejected', 'forwarded'],
    default: 'pending'
  },

  totalPaid: { type: Number, default: 0 },
  remainingAmount: { type: Number },

  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

  // تتبع كل الأحداث
  hrApprovedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  hrApprovedAt: { type: Date },

  adminApprovedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  adminApprovedAt: { type: Date },

  rejectedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  rejectedAt: { type: Date },

  forwardedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  forwardedAt: { type: Date },

  requiresAdminApproval: { type: Boolean, default: false },

}, { timestamps: true });

module.exports = mongoose.model('SalaryAdvance', salaryAdvanceSchema);
