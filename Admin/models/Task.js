
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
  dueDate: {
    type: Date,
    required: true
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
    path: String,
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
taskSchema.pre('save', function(next) {
  const now = new Date();
  
  // If progress is 100%, mark as completed
  if (this.progressPercentage >= 100) {
    this.status = 'مكتملة';
  }
  // If due date passed and not completed, mark as overdue
  else if (now > this.dueDate && this.status !== 'مكتملة') {
    this.status = 'متأخرة';
  }
  // Otherwise, keep as in progress
  else if (this.progressPercentage < 100) {
    this.status = 'قيد العمل';
  }
  
  this.lastUpdated = now;
  next();
});

module.exports = mongoose.model('Task', taskSchema);