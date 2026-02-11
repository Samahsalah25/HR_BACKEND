
const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true
  },
  assignedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // HR user
    required: true
  },
  assignDate: {
    type: Date,
    default: Date.now
  },
  priority: { type: String, enum: ['عالية', 'متوسطة', 'منخفضة'], default: 'متوسطة' }
  ,
  dueDate: {
    type: Date,
    required: true
  },
  completedDate: {
    type: Date,

  },
  status: {
    type: String,
    enum: ['قيد العمل', 'مكتملة', 'متأخرة'],
    default: 'قيد العمل'
  },
  progressPercentage: {
    type: Number,
    min: 0,
    max: 100,
    default: 0
  },
  attachments: [{
    filename: String,
    originalname: String,
    url: String,
    uploadDate: {
      type: Date,
      default: Date.now
    }
  }],
  notes: {
    type: String
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Middleware to update status based on progress and due date
taskSchema.pre('save', function (next) {
  const now = new Date();

  // إذا تم تعديل status يدويًا، لا تعدله
  if (!this.isModified('status')) {
    if (this.progressPercentage >= 100) this.status = 'مكتملة';
    else if (now > this.dueDate && this.status !== 'مكتملة') this.status = 'متأخرة';
    else if (this.progressPercentage < 100) this.status = 'قيد العمل';
  }

  this.lastUpdated = now;
  next();
});


module.exports = mongoose.model('Task', taskSchema);