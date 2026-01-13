const mongoose = require('mongoose');

const salaryAdvanceInstallmentSchema = new mongoose.Schema({
  salaryAdvance: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SalaryAdvance',
    required: true
  },

  employee: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true
  },

  installmentNumber: {
    type: Number,
    required: true
  },

  dueDate: {
    type: Date,
    required: true
  },

  amount: {
    type: Number,
    required: true
  },

  status: {
    type: String,
    enum: ['unpaid', 'paid', 'postponed'],
    default: 'unpaid'
  },

  paidAt: Date,
  postponedTo: Date

}, { timestamps: true });

module.exports = mongoose.model(
  'SalaryAdvanceInstallment',
  salaryAdvanceInstallmentSchema
);
