'use strict';

const { videoExists, deleteVideoFile } = require('../utils/fileHelpers');
const logger = require('../utils/logger');

/**
 * DELETE /api/delete/:roomId
 * Deletes the uploaded video for a room and notifies all room members.
 */
async function deleteVideo(req, res, next) {
  try {
    const roomId = req.safeRoomId;

    if (!videoExists(roomId)) {
      return res.status(404).json({ error: 'No video found for this room.' });
    }

    await deleteVideoFile(roomId);

    logger.info('Video deleted', { roomId });

    // Notify all sockets in this room
    const io = req.app.get('io');
    io.to(roomId).emit('video_deleted', { roomId });

    return res.status(200).json({
      success: true,
      message: 'Video deleted successfully.',
      roomId,
    });
  } catch (err) {
    next(err);
  }
}

module.exports = { deleteVideo };
