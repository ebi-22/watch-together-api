'use strict';

const logger = require('../utils/logger');

/**
 * Validate that a request body contains a non-empty roomId string.
 */
function requireRoomId(req, res, next) {
  const roomId = req.body?.roomId || req.params?.roomId;

  if (!roomId || typeof roomId !== 'string' || !roomId.trim()) {
    return res.status(400).json({ error: 'roomId is required and must be a non-empty string.' });
  }

  // Attach sanitized value for downstream use
  req.safeRoomId = roomId.trim().replace(/[^a-zA-Z0-9_-]/g, '');

  if (!req.safeRoomId) {
    return res.status(400).json({ error: 'roomId contains invalid characters.' });
  }

  next();
}

module.exports = { requireRoomId };
