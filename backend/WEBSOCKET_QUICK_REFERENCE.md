# WebSocket Quick Reference

## For Backend Developers

### Broadcasting from Controllers

```javascript
const socketService = require('../services/socketService');

// Broadcast new message
socketService.emitNewMessage(caseId, messageObject);

// Broadcast message read
socketService.emitMessageRead(caseId, messageId, userId);

// Broadcast case update
socketService.emitCaseUpdated(caseId, {
  status: 'ongoing',
  acceptedAt: new Date()
});

// Send notification to user
socketService.emitNotification(userId, notificationObject);
```

### Error Handling Pattern

```javascript
try {
  socketService.emitNewMessage(caseId, message);
} catch (socketError) {
  console.error('Failed to broadcast via WebSocket:', socketError);
  // Continue - message is saved in DB
}
```

## For Frontend Developers

### Connection Setup

```typescript
import { io, Socket } from 'socket.io-client';

const socket: Socket = io('http://localhost:3000', {
  auth: {
    token: localStorage.getItem('token')
  }
});

// Listen for authentication
socket.on('authenticated', (data) => {
  console.log('Connected:', data.userId);
});

socket.on('error', (error) => {
  console.error('Socket error:', error.message);
});
```

### Join Case Room

```typescript
// When opening a case
socket.emit('join_case', { caseId: '123456' });

socket.on('joined_case', (data) => {
  console.log('Joined case:', data.caseId);
});

// When closing a case
socket.emit('leave_case', { caseId: '123456' });
```

### Receive Messages

```typescript
socket.on('new_message', (data) => {
  // Add message to UI
  this.messages.push(data.message);
});

socket.on('message_read', (data) => {
  // Update message read status in UI
  const msg = this.messages.find(m => m._id === data.messageId);
  if (msg) {
    msg.isRead = true;
    msg.readAt = data.readAt;
  }
});
```

### Typing Indicators

```typescript
// When user starts typing
onTyping() {
  socket.emit('typing', { caseId: this.currentCaseId });
}

// When user stops typing (debounce this)
onStopTyping() {
  socket.emit('stop_typing', { caseId: this.currentCaseId });
}

// Listen for other user typing
socket.on('user_typing', (data) => {
  this.showTypingIndicator = true;
  this.typingUser = data.userRole;
});

socket.on('user_stop_typing', (data) => {
  this.showTypingIndicator = false;
});
```

### Receive Notifications

```typescript
socket.on('new_notification', (notification) => {
  // Add to notification list
  this.notifications.unshift(notification);
  
  // Update badge count
  this.unreadCount++;
  
  // Show toast notification
  this.showToast(notification.title, notification.message);
});
```

### Case Updates

```typescript
socket.on('case_updated', (data) => {
  // Update case in UI
  const caseItem = this.cases.find(c => c._id === data.caseId);
  if (caseItem) {
    caseItem.status = data.status;
    if (data.acceptedAt) caseItem.acceptedAt = data.acceptedAt;
    if (data.treatedAt) caseItem.treatedAt = data.treatedAt;
  }
});
```

### Cleanup

```typescript
ngOnDestroy() {
  // Leave case room
  if (this.currentCaseId) {
    this.socket.emit('leave_case', { caseId: this.currentCaseId });
  }
  
  // Disconnect socket
  this.socket.disconnect();
}
```

## Event Reference

### Client → Server

| Event | Data | Description |
|-------|------|-------------|
| `join_case` | `{ caseId }` | Join case room |
| `leave_case` | `{ caseId }` | Leave case room |
| `send_message` | `{ caseId, message }` | Send message (also use REST API) |
| `typing` | `{ caseId }` | Start typing indicator |
| `stop_typing` | `{ caseId }` | Stop typing indicator |

### Server → Client

| Event | Data | Description |
|-------|------|-------------|
| `authenticated` | `{ userId, role }` | Authentication successful |
| `joined_case` | `{ caseId }` | Joined case room |
| `new_message` | `{ caseId, message }` | New message received |
| `message_read` | `{ caseId, messageId, readBy, readAt }` | Message marked as read |
| `case_updated` | `{ caseId, status, ... }` | Case status changed |
| `new_notification` | `{ notification }` | New notification |
| `user_typing` | `{ caseId, userId, userRole }` | User is typing |
| `user_stop_typing` | `{ caseId, userId }` | User stopped typing |
| `error` | `{ message }` | Error occurred |

## Testing

### Test Connection

```bash
node backend/test-socket-connection.js
```

### Test from Browser Console

```javascript
const socket = io('http://localhost:3000', {
  auth: { token: 'your-jwt-token' }
});

socket.on('authenticated', (data) => console.log('Auth:', data));
socket.on('error', (err) => console.error('Error:', err));

// Join case
socket.emit('join_case', { caseId: '123' });

// Listen for messages
socket.on('new_message', (data) => console.log('Message:', data));
```

## Troubleshooting

### Connection Fails
- Check JWT token is valid
- Verify CORS settings
- Check browser console for errors

### Messages Not Received
- Verify you've joined the case room
- Check case access permissions
- Verify socket is authenticated

### High Latency
- Check network connection
- Verify server resources
- Consider Redis adapter for scaling

## Best Practices

1. **Always join case room** before expecting messages
2. **Leave case room** when navigating away
3. **Implement fallback** to HTTP polling
4. **Handle reconnection** with exponential backoff
5. **Validate data** before emitting events
6. **Clean up** socket listeners on component destroy
7. **Use try-catch** for error handling
8. **Log errors** for debugging
9. **Test offline scenarios**
10. **Implement retry logic** for failed connections
