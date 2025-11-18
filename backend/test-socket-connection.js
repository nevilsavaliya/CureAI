/**
 * Simple test to verify Socket.IO server initialization
 * Run with: node test-socket-connection.js
 */

require('dotenv').config();
const http = require('http');
const express = require('express');
const socketService = require('./services/socketService');

const app = express();
const server = http.createServer(app);

// Initialize Socket.IO
socketService.initialize(server);

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  console.log(`✓ Server started on port ${PORT}`);
  console.log(`✓ Socket.IO server initialized`);
  console.log(`✓ WebSocket endpoint: ws://localhost:${PORT}`);
  console.log('\nSocket.IO is ready to accept connections!');
  console.log('\nTest connection with:');
  console.log('  - Frontend: socket.io-client');
  console.log('  - Auth: Pass JWT token in handshake.auth.token');
  console.log('\nPress Ctrl+C to stop the server');
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n\nShutting down gracefully...');
  server.close(() => {
    console.log('Server closed');
    process.exit(0);
  });
});
