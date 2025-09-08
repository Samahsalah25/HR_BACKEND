const fs = require("fs");
const path = require("path");

const cleanupUploadedFile = (req) => {
  if (req.file) {
    const filePath = path.join(__dirname, "..", "uploads", "meetings", req.file.filename);
    fs.unlink(filePath, (err) => {
      if (err) console.error("Error deleting uploaded file:", err);
    });
  }

  if (req.files && req.files.length > 0) {
    req.files.forEach((file) => {
      const filePath = path.join(__dirname, "..", "uploads", "meetings", file.filename);
      fs.unlink(filePath, (err) => {
        if (err) console.error("Error deleting uploaded file:", err);
      });
    });
  }
};

module.exports = { cleanupUploadedFile };
