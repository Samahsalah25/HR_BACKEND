const licence = require('../models/licence');
const multer = require('multer');
const path = require('path');

// إعداد Multer لتخزين الملفات
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/'); // فولدر التحميل
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const upload = multer({ storage });

exports.createRecord = [
  upload.array('attachments'),
  async (req, res) => {
    try {
      const { category, type, number, branch, issueDate, expiryDate, status } = req.body;

      if (!category || !type) {
        return res.status(400).json({ message: 'Category و Type مطلوبين' });
      }

      const attachments = req.files ? req.files.map(file => ({
        filename: file.originalname,
        url: `/uploads/${file.filename}`
      })) : [];

      const record = await licence.create({
        category,
        type,
        number,
        branch,
        issueDate,
        expiryDate,
        status,
        attachments
      });

      res.status(201).json(record);
    } catch (err) {
      console.error(err);
      res.status(500).json({ message: 'خطأ أثناء إنشاء السجل' });
    }
  }
];

//get all records
exports.getRecords = async (req, res) => {
  try {
    const { category } = req.query;  
    const filter = category ? { category } : {};
    let records = await licence.find(filter).sort({ createdAt: -1 });

    const now = new Date();
    records = records.map(record => {
      if (record.expiryDate && new Date(record.expiryDate) < now) {
        record.status = 'منتهي';
      } else {
        record.status = 'متاح';
      }
      return record;
    });

    res.json(records);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'خطأ أثناء جلب السجلات' });
  }
};

// Get single record
exports.getRecordById = async (req, res) => {
  try {
    const record = await licence.findById(req.params.id);
    if (!record) return res.status(404).json({ message: "السجل غير موجود" });
    res.json(record);
  } catch (err) {
    res.status(500).json({ message: 'خطأ أثناء جلب السجل', error: err.message });
  }
};

// Update Record
exports.updateRecord = async (req, res) => {
  try {
    const record = await licence.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!record) return res.status(404).json({ message: "السجل غير موجود" });
    res.json(record);
  } catch (err) {
    res.status(500).json({ message: 'خطأ أثناء تحديث السجل', error: err.message });
  }
};

// Delete Record
exports.deleteRecord = async (req, res) => {
  try {
    const record = await licence.findByIdAndDelete(req.params.id);
    if (!record) return res.status(404).json({ message: "السجل غير موجود" });
    res.json({ message: "تم حذف السجل بنجاح" });
  } catch (err) {
    res.status(500).json({ message: 'خطأ أثناء حذف السجل', error: err.message });
  }
};