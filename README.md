# 🎬 WatchSync (API Server)

The robust, modular Node.js backend for the WatchSync application. It handles large media uploads, YouTube-style chunked video streaming, and real-time Socket.io state synchronization.

This repository contains the backend application.

## ✨ Features
* **YouTube-Style Streaming:** Implements RFC 7233 HTTP Range requests (206 Partial Content), allowing clients to seek instantly without fully buffering large video files.
* **Large File Handling:** Configured with `multer` to safely accept and process video uploads up to 3GB.
* **Sub-100ms Sync:** Uses `Socket.io` to broadcast Play, Pause, and Seek events instantly to all viewers in a specific room.
* **Auto-Cleanup:** Rooms are automatically tracked in-memory and destroyed when empty.
* **Security & Validation:** Protects against path traversal attacks and cleans up invalid file uploads.

## 🚀 Quick Start

### Prerequisites
Make sure you have Node.js installed on your machine.

### Installation

1. Clone this repository:
   ```bash
   git clone https://github.com/ebi-22/watch-together-api.git
   cd watch-together-api
   ```

2. Install the dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the root directory (use `.env.example` if available, or create your own):
   ```env
   PORT=4000
   NODE_ENV=development
   CORS_ORIGIN=http://localhost:5173
   MAX_FILE_SIZE_MB=3000
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

The server will start on `http://localhost:4000`.

## 📂 Architecture
This project follows a clean, production-ready MVC/Router architecture:
* `/routes` - Express route definitions
* `/controllers` - Business logic for streams, uploads, and deletions
* `/middleware` - Multer, validation, and error handlers
* `/socket` - Real-time Socket.io event handlers
* `/utils` - File system helpers and structured logging

## 📦 Tech Stack
* **Runtime:** Node.js
* **Framework:** Express.js
* **Real-time:** Socket.io
* **File Uploads:** Multer
* **Logging:** Morgan

---
*Built for long-distance movie nights.*
