'use strict';

const fs   = require('fs');
const path = require('path');
const config = require('../config/config');

/**
 * Returns the full absolute path for a room's video file.
 * @param {string} roomId
 * @returns {string}
 */
function getVideoPath(roomId) {
  // Sanitize roomId to prevent path traversal attacks
  const safe = path.basename(roomId);
  return path.join(config.upload.dir, `${safe}.mp4`);
}

/**
 * Check whether a video file exists for the given room.
 * @param {string} roomId
 * @returns {boolean}
 */
function videoExists(roomId) {
  return fs.existsSync(getVideoPath(roomId));
}

/**
 * Get stat info for a room's video file.
 * Returns null if the file does not exist.
 * @param {string} roomId
 * @returns {fs.Stats|null}
 */
function getVideoStat(roomId) {
  const p = getVideoPath(roomId);
  if (!fs.existsSync(p)) return null;
  return fs.statSync(p);
}

/**
 * Delete a room's video file.
 * @param {string} roomId
 * @returns {Promise<void>}
 */
function deleteVideoFile(roomId) {
  return new Promise((resolve, reject) => {
    const p = getVideoPath(roomId);
    fs.unlink(p, (err) => {
      if (err) return reject(err);
      resolve();
    });
  });
}

/**
 * Ensure the uploads directory exists.
 */
function ensureUploadDir() {
  if (!fs.existsSync(config.upload.dir)) {
    fs.mkdirSync(config.upload.dir, { recursive: true });
  }
}

module.exports = { getVideoPath, videoExists, getVideoStat, deleteVideoFile, ensureUploadDir };
