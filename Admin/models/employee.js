const mongoose = require('mongoose');

const employeeSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    jobTitle: { type: String },
    // رققم الموظف السيستم بيكريته تلقائي مع الكريت
    employeeNumber: { type: String, unique: true },

    department: { type: mongoose.Schema.Types.ObjectId, ref: 'Department' },
    manager: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', default: null },

    employmentType: { type: String, enum: ['Full-Time', 'Part-Time', 'Contract'] },
//  العقد بيجي من جدول العقود +وقت الكريت بحسب البداية والنهايو بتاعت العقد
    contract: {
      start: { type: Date },
      duration: { type: mongoose.Schema.Types.ObjectId, ref: 'Contract' },
      end: { type: Date }
    },
    // nationality: { type: String },
      nationality: {
  type: String,
  enum: [
    "Egyptian",
    "Saudi Arabian",
    "Emirati",
    "Kuwaiti",
    "Qatari",
    "Bahraini",
    "Omani",
    "Jordanian",
    "Palestinian",
    "Syrian",
    "Lebanese",
    "Iraqi",
    "Yemeni",
    "Sudanese",
    "Moroccan",
    "Algerian",
    "Tunisian",
    "Libyan",
    "Turkish",
    "Pakistani",
    "Indian",
    "Bangladeshi",
    "Filipino",
    "Nepali",
    "Sri Lankan",
    "Indonesian",
    "British",
    "American",
    "Canadian",
    "French",
    "German",
    "Other"
  ]
} ,

//   والالاقامة  بيجي من جدول الاقامات ...والبداية والنهايه بحسيهم في الكريت لما اخد قيمة العقد برضو  والباقي تيكست عادي بيضاف
    residency: {
  
      start: { type: Date },
      duration: { type: mongoose.Schema.Types.ObjectId, ref: 'ResidencyYear' },
      end: { type: Date },
      additionNumber: { type: String },
      issuingAuthority: { type: String },
      insuranceNumber: { type: String },
      type: { type: String }
    },
//  ساعات العمل الاسبوعيه تيكست عادي
    workHoursPerWeek: { type: Number },
    //  الفرع التابع له الموظف id جاي من جدول الفروع
    workplace: { type: mongoose.Schema.Types.ObjectId, ref: "Branch" },

    //  الرواتب
    salary: {
      base: { type: Number, default: 0 },
      housingAllowance: { type: Number, default: 0 },
      transportAllowance: { type: Number, default: 0 },
      otherAllowance: { type: Number, default: 0 },
      total: { type: Number, default: 0 }
    },

    // بيانات الاتصال
    contactInfo: {
      phone: { type: String },
      address: { type: String }
    },

    //  بيانات الحساب البنكي
    bankInfo: {
      iban: { type: String },
      bankName: { type: String },
      swift: { type: String },
      accountNumber: { type: String } 
    },
    //  الملف اللي هيرفعه الموظف الل غالبا فيه بياناه زي ملف pdf
    documents: [
  {
    name: { type: String },      
    url: { type: String },      
    uploadedAt: { type: Date, default: Date.now }
  }
],

//  حالة الموظف دا  لو اكتيف يبقي عقد شغال معانا غير نشط يبقي عقده انتهي
status: {
  type: String,
  enum: ["active", "terminated"],
  default: "active"
},

//   ال  forign key الل ي جاي من اليوزر بنستخدمه كتير
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' } ,
    // التأمين
    //   في الكريت بناخد بس ال  id وبنحسب قيمته من الكريت عادي
 insurance: {
  insuranceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Insurance"
  },
  name: String,
  employeePercentage: Number,
  companyPercentage: Number
}
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
