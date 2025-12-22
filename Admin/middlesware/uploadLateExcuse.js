const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const cloudinary = require("../../config/cloudinary");

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: "late_excuses",
    resource_type: "raw", // pdf / image
    public_id: (req, file) =>
      Date.now() + "-" + file.originalname,
  },
});

const uploadLateExcuseFile = multer({ storage });

module.exports = uploadLateExcuseFile;
