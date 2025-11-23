const express = require('express');
const multer = require('multer');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const config = require('../config');
const { requireApiKey } = require('../middleware/auth');
const { noCache } = require('../middleware/cache');
const { getMediaCategory, isAllowedMimeType, generateUniqueFilename, buildMediaUrl, formatFileSize } = require('../utils/helpers');

const router = express.Router();

// Configure multer storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const category = getMediaCategory(file.mimetype);
    if (!category) {
      return cb(new Error('File type not allowed'));
    }
    cb(null, path.join(config.uploadsDir, category));
  },
  filename: (req, file, cb) => {
    const uuid = uuidv4();
    const filename = generateUniqueFilename(file.originalname, uuid);
    cb(null, filename);
  },
});

// File filter
const fileFilter = (req, file, cb) => {
  if (isAllowedMimeType(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`File type ${file.mimetype} is not allowed`), false);
  }
};

// Initialize multer
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: config.maxFileSize,
  },
});

/**
 * POST /upload
 * Upload a single file
 */
router.post('/', requireApiKey, noCache, upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'No file provided. Use "file" field in multipart form data.',
    });
  }

  const category = getMediaCategory(req.file.mimetype);
  const url = buildMediaUrl(req, req.file.filename, category);

  res.status(201).json({
    success: true,
    file: {
      id: path.basename(req.file.filename, path.extname(req.file.filename)),
      filename: req.file.filename,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
      size: req.file.size,
      sizeFormatted: formatFileSize(req.file.size),
      category,
      url,
    },
  });
});

/**
 * POST /upload/multiple
 * Upload multiple files (up to 10)
 */
router.post('/multiple', requireApiKey, noCache, upload.array('files', 10), (req, res) => {
  if (!req.files || req.files.length === 0) {
    return res.status(400).json({
      error: 'Bad Request',
      message: 'No files provided. Use "files" field in multipart form data.',
    });
  }

  const uploadedFiles = req.files.map((file) => {
    const category = getMediaCategory(file.mimetype);
    const url = buildMediaUrl(req, file.filename, category);

    return {
      id: path.basename(file.filename, path.extname(file.filename)),
      filename: file.filename,
      originalName: file.originalname,
      mimeType: file.mimetype,
      size: file.size,
      sizeFormatted: formatFileSize(file.size),
      category,
      url,
    };
  });

  res.status(201).json({
    success: true,
    count: uploadedFiles.length,
    files: uploadedFiles,
  });
});

// Error handling for multer errors
router.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({
        error: 'File Too Large',
        message: `File size exceeds the maximum allowed size of ${formatFileSize(config.maxFileSize)}`,
      });
    }
    return res.status(400).json({
      error: 'Upload Error',
      message: err.message,
    });
  }

  if (err.message.includes('not allowed')) {
    return res.status(415).json({
      error: 'Unsupported Media Type',
      message: err.message,
    });
  }

  next(err);
});

module.exports = router;
