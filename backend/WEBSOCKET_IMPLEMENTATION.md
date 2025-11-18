# WebSocket Implementation Guide

## Overview

This document describes the WebSocket (Socket.IO) implementation for real-time messaging and notifications in the Case Management System.

## Architecture

### Components

1. **Socket Service** (`services/socketService.js`)
   - Manages WebSocket connections
   - Handles authentication
   - Provides broadcasting methods

2. **Server Integration** (`server.js`)
   - Initializes Socket.IO with HTTP server
   - Configures CORS for WebSocket connections

3. **Controller Integration**
   - Message Controller: Broadcasts new messages and read receipts
   - Case Controller: Broadcasts case status updates and notifications
   - Notification Controller: Notifications are broadcast when created

## Socket.IO Events

### Client → Server Events

#### 1. Connection & Authentication
```javascript
// Client connects with JWT token
socket = io('http://localhost:3000', {
  auth: {
    token: 'your-jwt-token'
  }
});

// Server responds with:
socket.on('authenticated', (data) => {
  console.log('Authenticated:', data.userId, data.role);
});

// Or on error:
socket.on('error', (error) => {
  console.error('Auth error:', error.message);
});
```

#### 2. Join Case Room
```javascript
// Join a case room to receive real-time updates
socket.emit('join_case', { caseId: '123456' });

// Server confirms:
socket.on('joined_case', (data) => {
  console.log('Joined case:', data.caseId);
});
```

#### 3. Leave Case Room
```javascript
// Leave a case room
socket.emit('leave_case', { caseId: '123456' });
```

#### 4. Send Message
```javascript
// Send a message (also saved via REST API)
socket.emit('send_message', {
  caseId: '123456',
  message: messageObject
});

// Server confirms:
socket.on('message_sent', (data) => {
  console.log('Message sent:', data.messageId);
});
```

#### 5. Typing Indicators
```javascript
// Start typing
socket.emit('typing', { caseId: '123456' });

// Stop typing
socket.emit('stop_typing', { caseId: '123456' });
```

### Server → Client Events

#### 1. New Message
```javascript
// Receive new message in real-time
socket.on('new_message', (data) => {
  console.log('New message in case:', data.caseId);
  console.log('Message:', data.message);
  // Update UI with new message
});
```

#### 2. Message Read
```javascript
// Receive notification when message is read
socket.on('message_read', (data) => {
  console.log('Message read:', data.messageId);
  console.log('Read by:', data.readBy);
  console.log('Read at:', data.readAt);
  // Update UI to show read status
});
```

#### 3. Case Updated
```javascript
// Receive case status updates
socket.on('case_updated', (data) => {
  console.log('Case updated:', data.caseId);
  console.log('New status:', data.status);
  // Update UI with new case status
});
```

#### 4. New Notification
```javascript
// Receive new notification
socket.on('new_notification', (notification) => {
  console.log('New notification:', notification.title);
  console.log('Message:', notification.message);
  // Show notification in UI
  // Update notification badge count
});
```

#### 5. User Typing
```javascript
// Receive typing indicator
socket.on('user_typing', (data) => {
  console.log('User typing in case:', data.caseId);
  console.log('User:', data.userId, data.userRole);
  // Show "User is typing..." indicator
});

socket.on('user_stop_typing', (data) => {
  console.log('User stopped typing:', data.userId);
  // Hide typing indicator
});
```

## Authentication Flow

1. Client obtains JWT token via login API
2. Client connects to Socket.IO with token in handshake
3. Server verifies token using `authService.verifyToken()`
4. If valid, server attaches `userId` and `userRole` to socket
5. Server stores socket connection in `userSockets` Map
6. Client receives `authenticated` event
7. Client can now emit and receive events

## Broadcasting Methods

### From Backend Controllers

#### Broadcast New Message
```javascript
const socketService = require('../services/socketService');

// After saving message to database
socketService.emitNewMessage(caseId, messageObject);
```

#### Broadcast Message Read
```javascript
socketService.emitMessageRead(caseId, messageId, userId);
```

#### Broadcast Case Update
```javascript
socketService.emitCaseUpdated(caseId, {
  status: 'ongoing',
  acceptedAt: new Date()
});
```

#### Broadcast Notification
```javascript
socketService.emitNotification(userId, notificationObject);
```

## Room Management

### Case Rooms
- Each case has a dedicated room: `case_${caseId}`
- Users join room when viewing a case
- Users leave room when closing a case
- Messages and updates are broadcast to all users in the room

### User Tracking
- Active socket connections are tracked in `userSockets` Map
- Map structure: `userId → socketId`
- Used to send notifications to specific users
- Cleaned up on disconnect

## Error Handling

### Connection Errors
- Invalid/missing token → Disconnect with error message
- Expired token → Disconnect with error message
- Connection failure → Client should retry with exponential backoff

### Event Errors
- Missing required data → Emit error event to client
- Unauthorized access → Emit error event to client
- Socket.IO not initialized → Log error, continue with REST API

## Fallback Strategy

If WebSocket connection fails:
1. Client detects connection failure
2. Client falls back to HTTP polling (every 5 seconds)
3. Client polls REST API endpoints for new messages/notifications
4. Client periodically attempts to reconnect WebSocket

## Testing

### Manual Testing

1. Start the server:
```bash
npm start
```

2. Test Socket.IO initialization:
```bash
node test-socket-connection.js
```

3. Connect from frontend with Socket.IO client

### Integration Testing

Run the case messaging integration tests:
```bash
npm run test:case-messaging
```

## Configuration

### Environment Variables

```env
# Frontend URL for CORS
FRONTEND_URL=http://localhost:4200

# JWT Secret for authentication
JWT_SECRET=your-secret-key

# Server port
PORT=3000
```

### Socket.IO Options

```javascript
{
  cors: {
    origin: process.env.FRONTEND_URL,
    methods: ['GET', 'POST'],
    credentials: true
  },
  pingTimeout: 60000,    // 60 seconds
  pingInterval: 25000    // 25 seconds
}
```

## Security Considerations

1. **Authentication**: All connections must provide valid JWT token
2. **Authorization**: Users can only join case rooms they have access to
3. **CORS**: Configured to allow only frontend origin
4. **Rate Limiting**: Consider adding rate limiting for message sending
5. **Input Validation**: All event data is validated before processing

## Performance Optimization

1. **Connection Pooling**: Reuse socket connections
2. **Room-based Broadcasting**: Only send to relevant users
3. **Heartbeat Mechanism**: Detect and clean up dead connections
4. **Message Compression**: Socket.IO handles compression automatically

## Troubleshooting

### Connection Issues
- Check JWT token is valid and not expired
- Verify CORS configuration matches frontend URL
- Check firewall/proxy settings for WebSocket support

### Message Not Received
- Verify user has joined the case room
- Check user is authenticated
- Verify case access permissions
- Check browser console for errors

### High Latency
- Check network connection
- Verify server resources (CPU, memory)
- Consider using Redis adapter for horizontal scaling

## Future Enhancements

1. **Redis Adapter**: For multi-server deployments
2. **Message Queuing**: For offline message delivery
3. **File Sharing**: Support for image/file messages
4. **Video Call**: WebRTC integration for video consultations
5. **Push Notifications**: Mobile push notifications for offline users

## References

- [Socket.IO Documentation](https://socket.io/docs/v4/)
- [Socket.IO Client API](https://socket.io/docs/v4/client-api/)
- [JWT Authentication](https://jwt.io/)
