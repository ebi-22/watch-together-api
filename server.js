'use strict';

require('dotenv').config();

const http = require('http');
const { Server } = require('socket.io');

const app    = require('./app');
const config = require('./config/config');
const logger = require('./utils/logger');
const { ensureUploadDir }        = require('./utils/fileHelpers');
const { registerSocketHandlers } = require('./socket/socket.handler');

// ── Ensure uploads directory exists ───────────────────────
ensureUploadDir();

// ── Create HTTP server ─────────────────────────────────────
const server = http.createServer(app);

// ── Attach Socket.io ───────────────────────────────────────
const io = new Server(server, {
  cors: {
    origin: config.cors.origins,
    methods: ['GET', 'POST'],
  },
  // Increase ping timeout for large file uploads on slow connections
  pingTimeout: 60000,
  pingInterval: 25000,
});

// Make io available to controllers via req.app.get('io')
app.set('io', io);

// Register all socket event handlers
registerSocketHandlers(io);

// ── Start Listening ────────────────────────────────────────
server.listen(config.port, () => {
  logger.info(`Server running`, {
    env:  config.env,
    port: config.port,
    urls: config.cors.origins,
  });
});

// ── Graceful Shutdown ──────────────────────────────────────
function shutdown(signal) {
  logger.warn(`${signal} received — shutting down gracefully...`);

  server.close(() => {
    logger.info('HTTP server closed.');
    process.exit(0);
  });

  // Force kill if server hangs after 10s
  setTimeout(() => {
    logger.error('Forced shutdown after timeout.');
    process.exit(1);
  }, 10_000);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT',  () => shutdown('SIGINT'));

// Catch unhandled promise rejections (prevent silent failures)
process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled promise rejection', { reason: String(reason) });
});

process.on('uncaughtException', (err) => {
  logger.error('Uncaught exception', { message: err.message, stack: err.stack });
  process.exit(1);
});
