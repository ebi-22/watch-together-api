'use strict';

const { Router } = require('express');
const { requireRoomId } = require('../middleware/validate.middleware');
const { deleteVideo }   = require('../controllers/delete.controller');

const router = Router();

/**
 * DELETE /api/delete/:roomId
 * Deletes the video file for the given room.
 */
router.delete('/:roomId', requireRoomId, deleteVideo);

module.exports = router;
