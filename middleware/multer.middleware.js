'use strict';

const multer  = require('multer');
const path    = require('path');
const config  = require('../config/config');
const logger  = require('../utils/logger');

const storage = multer.memoryStorage();

// Middleware to extract and validate roomId early
const extractRoomId = (req, res, next) => {
  const roomId = req.params.roomId || req.body.roomId;
  if (!roomId || typeof roomId !== 'string' || !roomId.trim()) {
    return next(new Error('INVALID_ROOM_ID'));
  }
  const safe = path.basename(roomId.trim()).replace(/[^a-zA-Z0-9_-]/g, '');
  if (!safe) return next(new Error('INVALID_ROOM_ID'));
  
  req.safeRoomId = safe;
  next();
};

const fileFilter = (_req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();

  const mimeOk = config.upload.allowedMimeTypes.includes(file.mimetype) || file.mimetype === 'application/octet-stream';
  const extOk  = config.upload.allowedExtensions.includes(ext);

  if (!mimeOk || !extOk) {
    logger.warn('Rejected file upload — invalid type', {
      mimetype: file.mimetype,
      ext,
    });
    return cb(Object.assign(new Error('INVALID_FILE_TYPE'), { status: 415 }));
  }

  cb(null, true);
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: config.upload.maxFileSizeBytes,
    files: 1,
  },
});

/**
 * Multer error handler — converts multer errors into clean API responses.
 * Must be used after the multer middleware.
 */
function handleMulterError(err, _req, res, next) {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({
        error: `File too large. Maximum allowed size is ${config.upload.maxFileSizeLabel}.`,
      });
    }
    return res.status(400).json({ error: `Upload error: ${err.message}` });
  }

  if (err && err.message === 'INVALID_FILE_TYPE') {
    return res.status(415).json({
      error: `Unsupported file type. Allowed types: ${config.upload.allowedExtensions.join(', ')}`,
    });
  }

  if (err && err.message === 'INVALID_ROOM_ID') {
    return res.status(400).json({ error: 'A valid roomId is required.' });
  }

  next(err);
}

module.exports = { upload, handleMulterError, extractRoomId };
