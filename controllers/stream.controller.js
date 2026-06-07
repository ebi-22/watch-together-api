'use strict';

const fs     = require('fs');
const config = require('../config/config');
const { getVideoPath, getVideoStat } = require('../utils/fileHelpers');
const logger = require('../utils/logger');

/**
 * GET /api/stream/:roomId
 *
 * Implements YouTube-style HTTP Range streaming (RFC 7233).
 * - Supports partial content (206) for seeking without re-downloading
 * - Configurable chunk size from config
 * - Sets proper Cache-Control headers
 * - Handles range boundary errors with 416
 */
function streamVideo(req, res, next) {
  try {
    const roomId   = req.safeRoomId;
    const videoPath = getVideoPath(roomId);
    const stat     = getVideoStat(roomId);

    if (!stat) {
      return res.status(404).json({ error: 'Video not found for this room.' });
    }

    const fileSize = stat.size;
    const rangeHeader = req.headers.range;

    // ── No Range header: send full file ──────────────────────
    if (!rangeHeader) {
      res.writeHead(200, {
        'Content-Type':  'video/mp4',
        'Content-Length': fileSize,
        'Accept-Ranges': 'bytes',
        'Cache-Control': `public, max-age=${config.stream.cacheMaxAge}`,
      });
      fs.createReadStream(videoPath).pipe(res);
      return;
    }

    // ── Parse Range header ────────────────────────────────────
    const [startStr, endStr] = rangeHeader.replace(/bytes=/, '').split('-');
    const start = parseInt(startStr, 10);

    // Cap chunk size to config value (10MB) for adaptive streaming
    const end = endStr
      ? Math.min(parseInt(endStr, 10), fileSize - 1)
      : Math.min(start + config.stream.chunkSize - 1, fileSize - 1);

    // ── Validate range ────────────────────────────────────────
    if (isNaN(start) || start < 0 || start >= fileSize || start > end) {
      res.setHeader('Content-Range', `bytes */${fileSize}`);
      return res.status(416).json({ error: 'Range Not Satisfiable.' });
    }

    const chunkSize = end - start + 1;

    logger.debug('Streaming chunk', {
      roomId,
      range: `${start}-${end}/${fileSize}`,
      chunkMB: (chunkSize / (1024 * 1024)).toFixed(2),
    });

    res.writeHead(206, {
      'Content-Range':  `bytes ${start}-${end}/${fileSize}`,
      'Accept-Ranges':  'bytes',
      'Content-Length': chunkSize,
      'Content-Type':   'video/mp4',
      'Cache-Control':  `public, max-age=${config.stream.cacheMaxAge}`,
    });

    const stream = fs.createReadStream(videoPath, { start, end });

    // Destroy stream cleanly if client disconnects mid-stream
    req.on('close', () => stream.destroy());

    stream.pipe(res);
  } catch (err) {
    next(err);
  }
}

module.exports = { streamVideo };
