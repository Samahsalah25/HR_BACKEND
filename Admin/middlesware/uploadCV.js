const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../../config/cloudinary');

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'applicants_cv',
    resource_type: 'raw', // PDF أو Word
    public_id: (req, file) => Date.now() + '-' + file.originalname
  },
});

const parser = multer({ storage });

module.exports = parser;
