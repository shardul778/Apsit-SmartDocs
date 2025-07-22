const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Create uploads directory if it doesn't exist
const uploadDir = path.join(__dirname, '..', process.env.UPLOAD_PATH || 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Determine subdirectory based on file type
    let subDir = 'images';
    
    if (file.fieldname === 'logo') {
      subDir = 'logos';
    } else if (file.fieldname === 'signature') {
      subDir = 'signatures';
    } else if (file.mimetype.startsWith('image/')) {
      subDir = 'images';
    } else {
      subDir = 'documents';
    }
    
    // Create subdirectory if it doesn't exist
    const fullPath = path.join(uploadDir, subDir);
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, { recursive: true });
    }
    
    cb(null, fullPath);
  },
  filename: function (req, file, cb) {
    // Generate unique filename: timestamp-originalname
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, uniqueSuffix + ext);
  }
});

// File filter to allow only certain file types
const fileFilter = (req, file, cb) => {
  // Define allowed file types
  const allowedImageTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/svg+xml'];
  const allowedDocumentTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
  
  // Check if file type is allowed
  if (file.fieldname === 'logo' || file.fieldname === 'signature' || file.fieldname.includes('image')) {
    if (allowedImageTypes.includes(file.mimetype)) {
      return cb(null, true);
    }
  } else if (allowedDocumentTypes.includes(file.mimetype)) {
    return cb(null, true);
  }
  
  // Reject file if it doesn't match allowed types
  cb(new Error(`File type not allowed. Allowed types: ${[...allowedImageTypes, ...allowedDocumentTypes].join(', ')}`), false);
};

// Configure multer upload
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024, // Default: 5MB
  },
});

// Error handling middleware for multer
const handleUploadError = (err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    // A Multer error occurred when uploading
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: `File too large. Maximum size is ${(parseInt(process.env.MAX_FILE_SIZE) / (1024 * 1024)).toFixed(2)}MB`,
      });
    }
    return res.status(400).json({
      success: false,
      message: `Upload error: ${err.message}`,
    });
  } else if (err) {
    // An unknown error occurred
    return res.status(400).json({
      success: false,
      message: err.message,
    });
  }
  next();
};

module.exports = {
  upload,
  handleUploadError,
};