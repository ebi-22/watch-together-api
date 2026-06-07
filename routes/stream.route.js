'use strict';

const { Router } = require('express');
const { requireRoomId } = require('../middleware/validate.middleware');
const { streamVideo }   = require('../controllers/stream.controller');

const router = Router();

/**
 * GET /api/stream/:roomId
 * Streams the video in chunks using HTTP Range requests.
 */
router.get('/:roomId', requireRoomId, streamVideo);

module.exports = router;
