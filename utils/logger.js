'use strict';

const config = require('../config/config');

const LEVELS = { error: 0, warn: 1, info: 2, debug: 3 };
const COLORS = {
  error: '\x1b[31m', // red
  warn:  '\x1b[33m', // yellow
  info:  '\x1b[36m', // cyan
  debug: '\x1b[90m', // gray
  reset: '\x1b[0m',
};

const currentLevel = config.env === 'production' ? 'info' : 'debug';

function log(level, message, meta = {}) {
  if (LEVELS[level] > LEVELS[currentLevel]) return;

  const ts = new Date().toISOString();
  const metaStr = Object.keys(meta).length ? ` ${JSON.stringify(meta)}` : '';
  const color = COLORS[level] || '';

  // eslint-disable-next-line no-console
  console.log(
    `${color}[${ts}] [${level.toUpperCase()}] ${message}${metaStr}${COLORS.reset}`
  );
}

const logger = {
  error: (msg, meta) => log('error', msg, meta),
  warn:  (msg, meta) => log('warn',  msg, meta),
  info:  (msg, meta) => log('info',  msg, meta),
  debug: (msg, meta) => log('debug', msg, meta),

  /** Morgan-compatible stream for HTTP request logging */
  stream: {
    write: (message) => log('info', message.trim()),
  },
};

module.exports = logger;
