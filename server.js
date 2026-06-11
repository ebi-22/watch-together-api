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

// ── Configure HTTP Server Timeouts ──────────────────────────
// Set timeout to 10 minutes (600s) for large file uploads
server.requestTimeout = 10 * 60 * 1000;
server.keepAliveTimeout = 65 * 1000;
server.headersTimeout = 66 * 1000;

// ── Attach Socket.io ───────────────────────────────────────
const io = new Server(server, {
  cors: {
    origin: config.cors.origins,
    methods: ['GET', 'POST'],
  },
  // Increase ping/connect timeouts for large file uploads
  pingTimeout: 300000,      // 5 minutes
  pingInterval: 60000,      // 1 minute
  connectTimeout: 300000,   // 5 minutes
  transports: ['websocket', 'polling'],
  maxHttpBufferSize: 50 * 1024 * 1024,
});

// Make io available to controllers via req.app.get('io')
app.set('io', io);

// Register all socket event handlers
registerSocketHandlers(io);

// ── Start Listening ────────────────────────────────────────
server.listen(config.port, '0.0.0.0', () => {
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
