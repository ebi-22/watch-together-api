'use strict';

const { videoExists } = require('../utils/fileHelpers');
const logger          = require('../utils/logger');
const fs = require('fs');
const path = require('path');
const config = require('../config/config');

function uploadVideo(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No video chunk provided.' });
    }

    const roomId = req.safeRoomId;
    const chunkIndex = parseInt(req.body.chunkIndex, 10);
    const totalChunks = parseInt(req.body.totalChunks, 10);

    if (isNaN(chunkIndex) || isNaN(totalChunks)) {
      return res.status(400).json({ error: 'Missing chunking metadata.' });
    }

    const tempFilePath = path.join(config.upload.dir, `${roomId}.tmp`);
    const finalFilePath = path.join(config.upload.dir, `${roomId}.mp4`);

    // If it's the very first chunk, remove any stale temp file to start fresh
    if (chunkIndex === 0 && fs.existsSync(tempFilePath)) {
      fs.unlinkSync(tempFilePath);
    }

    // Append buffer to the temporary file
    fs.appendFileSync(tempFilePath, req.file.buffer);

    // If it's the final chunk
    if (chunkIndex === totalChunks - 1) {
      // Rename temp file to final .mp4
      fs.renameSync(tempFilePath, finalFilePath);

      logger.info('Upload complete', {
        roomId,
        originalName: req.file.originalname,
        chunks: totalChunks,
      });

      // Notify all sockets in this room that the video is ready
      const io = req.app.get('io');
      io.to(roomId).emit('video_ready', { roomId });

      return res.status(201).json({
        success: true,
        message: 'Video uploaded successfully.',
        roomId,
      });
    }

    // Acknowledge chunk success
    return res.status(200).json({
      success: true,
      message: `Chunk ${chunkIndex} received.`,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { uploadVideo };
