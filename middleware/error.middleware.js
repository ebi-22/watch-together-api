'use strict';

const config = require('../config/config');
const logger = require('../utils/logger');

/**
 * Global error-handling middleware.
 * Must be registered LAST in app.js (4 arguments).
 */
// eslint-disable-next-line no-unused-vars
function errorMiddleware(err, req, res, next) {
  const status = err.status || err.statusCode || 500;
  const message =
    config.env === 'production' && status === 500
      ? 'Internal server error.'
      : err.message || 'Something went wrong.';

  logger.error(`[${req.method}] ${req.path} → ${status}: ${message}`, {
    stack: config.env !== 'production' ? err.stack : undefined,
  });

  if (res.headersSent) return;

  res.status(status).json({ error: message });
}

module.exports = { errorMiddleware };
