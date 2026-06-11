'use strict';

require('dotenv').config();
const path = require('path');

const GB = 1024 * 1024 * 1024;

const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT, 10) || 4000,

  cors: {
    origins: (process.env.ALLOWED_ORIGINS || 'http://localhost:5173')
      .split(',')
      .map((o) => o.trim()),
  },

  upload: {
    maxFileSizeBytes: (parseFloat(process.env.MAX_FILE_SIZE_GB) || 3) * GB,
    maxFileSizeLabel: `${process.env.MAX_FILE_SIZE_GB || 3}GB`,
    dir: path.resolve(__dirname, '..', process.env.UPLOAD_DIR || 'uploads'),
    allowedMimeTypes: [
      'video/mp4',
      'video/webm',
      'video/x-matroska',   // .mkv
      'video/quicktime',    // .mov
      'video/x-msvideo',   // .avi
      'video/mpeg',
    ],
    allowedExtensions: ['.mp4', '.webm', '.mkv', '.mov', '.avi', '.mpeg', '.mpg'],
  },

  stream: {
    chunkSize: 10 * 1024 * 1024,   // 10MB chunks (YouTube-style adaptive)
    cacheMaxAge: 3600,             // 1 hour browser cache for stream responses
  },
};

module.exports = config;
