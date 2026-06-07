'use strict';

const path   = require('path');
const logger = require('../utils/logger');
const { videoExists } = require('../utils/fileHelpers');

/**
 * In-memory room registry.
 * Tracks { [roomId]: { hostSocketId, memberCount } }
 */
const rooms = new Map();

/**
 * Register all Socket.io event handlers.
 * @param {import('socket.io').Server} io
 */
function registerSocketHandlers(io) {
  io.on('connection', (socket) => {
    logger.info('Socket connected', { socketId: socket.id });

    // ── join_room ───────────────────────────────────────────
    socket.on('join_room', ({ roomId, isHost } = {}) => {
      if (!roomId || typeof roomId !== 'string') return;

      const safe = path.basename(roomId).replace(/[^a-zA-Z0-9_-]/g, '');
      if (!safe) return;

      socket.join(safe);

      // Track room state
      if (!rooms.has(safe)) {
        rooms.set(safe, { hostSocketId: null, memberCount: 0 });
      }
      const room = rooms.get(safe);
      room.memberCount += 1;
      if (isHost) room.hostSocketId = socket.id;

      // Attach room info to socket for cleanup on disconnect
      socket.data.roomId = safe;
      socket.data.isHost = isHost;

      logger.info('Socket joined room', {
        socketId: socket.id,
        roomId: safe,
        isHost,
        members: room.memberCount,
      });

      // If a video already exists for this room, notify the joining user
      if (videoExists(safe)) {
        socket.emit('video_ready', { roomId: safe });
      }
    });

    // ── Playback events (host → viewers) ───────────────────
    socket.on('play', ({ roomId, time } = {}) => {
      if (!isValidPlaybackEvent(roomId, time)) return;
      logger.debug('Play event', { roomId, time });
      socket.to(roomId).emit('play', time);
    });

    socket.on('pause', ({ roomId, time } = {}) => {
      if (!isValidPlaybackEvent(roomId, time)) return;
      logger.debug('Pause event', { roomId, time });
      socket.to(roomId).emit('pause', time);
    });

    socket.on('seek', ({ roomId, time } = {}) => {
      if (!isValidPlaybackEvent(roomId, time)) return;
      logger.debug('Seek event', { roomId, time });
      socket.to(roomId).emit('seek', time);
    });

    // ── Heartbeat sync (host → viewers, every 2s) ───────────
    socket.on('sync', ({ roomId, time } = {}) => {
      if (!isValidPlaybackEvent(roomId, time)) return;
      socket.to(roomId).emit('sync', time);
    });

    // ── disconnect ──────────────────────────────────────────
    socket.on('disconnect', (reason) => {
      const { roomId, isHost } = socket.data || {};
      logger.info('Socket disconnected', { socketId: socket.id, reason, roomId });

      if (roomId && rooms.has(roomId)) {
        const room = rooms.get(roomId);
        room.memberCount = Math.max(0, room.memberCount - 1);

        if (isHost) {
          room.hostSocketId = null;
          // Notify remaining viewers that the host left
          io.to(roomId).emit('host_disconnected');
          logger.warn('Host disconnected from room', { roomId });
        }

        // Clean up empty rooms
        if (room.memberCount === 0) {
          rooms.delete(roomId);
          logger.info('Room closed (no members)', { roomId });
        }
      }
    });
  });
}

/**
 * Validate common playback event payload.
 */
function isValidPlaybackEvent(roomId, time) {
  return (
    typeof roomId === 'string' &&
    roomId.length > 0 &&
    typeof time === 'number' &&
    isFinite(time) &&
    time >= 0
  );
}

module.exports = { registerSocketHandlers };
