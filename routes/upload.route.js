'use strict';

const { Router } = require('express');
const { upload, handleMulterError } = require('../middleware/multer.middleware');
const { requireRoomId } = require('../middleware/validate.middleware');
const { uploadVideo }   = require('../controllers/upload.controller');

const router = Router();

/**
 * POST /api/upload/:roomId
 *
 * roomId is passed as a URL parameter — this ensures it is available in
 * req.params before multer starts processing the multipart body.
 * Reading roomId from req.body.roomId inside multer's filename() is unreliable
 * because multipart fields and files are streamed simultaneously.
 */
router.post(
  '/:roomId',
  requireRoomId,
  upload.single('video'),
  handleMulterError,
  uploadVideo
);

module.exports = router;
