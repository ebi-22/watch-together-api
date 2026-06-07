'use strict';

const { videoExists } = require('../utils/fileHelpers');
const logger          = require('../utils/logger');

/**
 * POST /api/upload
 * Handles video upload. Multer middleware runs before this controller.
 * On success, notifies room members via Socket.io.
 */
function uploadVideo(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No video file provided.' });
    }

    const roomId = req.safeRoomId;

    logger.info('Upload complete', {
      roomId,
      originalName: req.file.originalname,
      size: `${(req.file.size / (1024 * 1024)).toFixed(2)} MB`,
    });

    // Notify all sockets in this room that the video is ready
    const io = req.app.get('io');
    io.to(roomId).emit('video_ready', { roomId });

    return res.status(201).json({
      success: true,
      message: 'Video uploaded successfully.',
      roomId,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { uploadVideo };
