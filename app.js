'use strict';

require('dotenv').config();

const express = require('express');
const cors    = require('cors');
const morgan  = require('morgan');

const config  = require('./config/config');
const logger  = require('./utils/logger');

const uploadRoute = require('./routes/upload.route');
const streamRoute = require('./routes/stream.route');
const deleteRoute = require('./routes/delete.route');
const { errorMiddleware } = require('./middleware/error.middleware');

const app = express();

// ── Security & CORS ────────────────────────────────────────
app.use(cors({
  origin: config.cors.origins,
  methods: ['GET', 'POST', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Range'],
  exposedHeaders: ['Content-Range', 'Accept-Ranges', 'Content-Length'],
}));

// ── Request Logging ────────────────────────────────────────
app.use(morgan(
  config.env === 'production' ? 'combined' : 'dev',
  { stream: logger.stream }
));

// ── Body Parsing ───────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// ── Health Check ───────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', env: config.env, timestamp: new Date().toISOString() });
});

// ── API Routes ─────────────────────────────────────────────
app.use('/api/upload', uploadRoute);
app.use('/api/stream', streamRoute);
app.use('/api/delete', deleteRoute);

// ── 404 Handler ────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: 'Route not found.' });
});

// ── Global Error Handler (must be last) ────────────────────
app.use(errorMiddleware);

module.exports = app;
