'use strict';

const { Router } = require('express');
const { upload, handleMulterError, extractRoomId } = require('../middleware/multer.middleware');
const { requireRoomId } = require('../middleware/validate.middleware');
const { uploadVideo }   = require('../controllers/upload.controller');

const router = Router();

router.post(
  '/:roomId',
  extractRoomId,
  upload.single('chunk'),
  handleMulterError,
  uploadVideo
);

module.exports = router;
