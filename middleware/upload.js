const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure the uploads directory exists
const uploadDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Set up storage engine
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Create a unique filename to avoid overwriting
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  },
});

// File filter to accept only common document and image types
const fileFilter = (req, file, cb) => {
  const allowedExt = /\.(jpeg|jpg|png|pdf|doc|docx)$/i;
  if (allowedExt.test(path.extname(file.originalname))) {
    return cb(null, true);
  }
  cb(new Error('File type not supported! Only images, PDFs, and DOCs are allowed.'));
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 1024 * 1024 * 10, // 10MB file size limit
  },
  fileFilter: fileFilter,
});

module.exports = upload;
