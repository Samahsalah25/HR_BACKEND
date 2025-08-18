const mongoose = require('mongoose');

const employeeSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    jobTitle: { type: String },
    employeeNumber: { type: String, unique: true },
    department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
    manager: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee' },
    employmentType: { type: String, enum: ['Full-Time', 'Part-Time', 'Contract'] },

    contract: {
      start: { type: Date },
      duration: { type: mongoose.Schema.Types.ObjectId, ref: 'Contract' },
      end: { type: Date } // هنا مش هنحسبها بالـ getter
    },

    residency: {
      start: { type: Date },
      duration: { type: mongoose.Schema.Types.ObjectId, ref: 'ResidencyYear' },
      end: { type: Date } // نفس الشيء
    },

    workHoursPerWeek: { type: Number },
    workplace: { type: String },
    salary: {
      base: { type: Number, default: 0 },
      housingAllowance: { type: Number, default: 0 },
      transportAllowance: { type: Number, default: 0 },
      otherAllowance: { type: Number, default: 0 },
      total: { type: Number, default: 0 }
    },

    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
  },
  { timestamps: true }
);

// حساب الـ total قبل الحفظ
employeeSchema.pre('save', function(next) {
  this.salary.total =
    (this.salary.base || 0) +
    (this.salary.housingAllowance || 0) +
    (this.salary.transportAllowance || 0) +
    (this.salary.otherAllowance || 0);
  next();
});

module.exports = mongoose.model('Employee', employeeSchema);
