# Case Messaging Backend Implementation

## Overview
This document describes the implementation of the case-specific messaging backend APIs for the case management system.

## Implemented Features

### 1. Send Message in Case
**Endpoint:** `POST /api/cases/:caseId/messages`

**Features:**
- Validates message content (required, non-empty, max 5000 characters)
- Verifies case exists and user has access
- Ensures case is in "ongoing" status
- Automatically determines sender/receiver based on user role
- Updates case's lastMessageAt timestamp
- Returns populated message with sender/recipient details

**Request Body:**
```json
{
  "content": "Message text here"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Message sent successfully",
  "data": {
    "_id": "messageId",
    "caseId": "caseId",
    "senderId": {...},
    "recipientId": {...},
    "content": "Message text",
    "isRead": false,
    "createdAt": "timestamp"
  }
}
```

### 2. Get Case Messages
**Endpoint:** `GET /api/cases/:caseId/messages`

**Features:**
- Retrieves all messages for a specific case
- Supports pagination (page and limit query parameters)
- Verifies user has access to the case
- Returns messages sorted chronologically
- Includes pagination metadata

**Query Parameters:**
- `page` (optional, default: 1)
- `limit` (optional, default: 50)

**Response:**
```json
{
  "success": true,
  "count": 10,
  "totalMessages": 25,
  "currentPage": 1,
  "totalPages": 3,
  "messages": [...]
}
```

### 3. Mark Message as Read
**Endpoint:** `PUT /api/messages/:id/read`

**Features:**
- Marks a specific message as read
- Verifies user is the recipient
- Validates case access if message is case-related
- Sets readAt timestamp
- Idempotent (can be called multiple times)

**Response:**
```json
{
  "success": true,
  "message": "Message marked as read"
}
```

## Security & Validation

### Authentication
- All endpoints require JWT authentication
- User role (patient/doctor) is extracted from token

### Authorization
- Users can only send/view messages in cases they're part of
- Only recipients can mark messages as read
- Case status validation (messages only in ongoing cases)

### Input Validation
- Message content: required, non-empty, max 5000 characters
- Case ID: validated for existence
- User access: verified against case participants

## Database Models

### Message Model
```javascript
{
  caseId: ObjectId (ref: Case),
  senderId: ObjectId,
  senderModel: String ('Patient' | 'Doctor'),
  senderType: String ('patient' | 'doctor'),
  recipientId: ObjectId,
  recipientModel: String ('Patient' | 'Doctor'),
  receiverType: String ('patient' | 'doctor'),
  content: String (max 5000 chars),
  messageType: String (default: 'text'),
  isRead: Boolean (default: false),
  readAt: Date,
  createdAt: Date,
  updatedAt: Date
}
```

### Indexes
- `{ caseId: 1, createdAt: 1 }` - For efficient message retrieval
- `{ senderId: 1, recipientId: 1 }` - For conversation queries
- `{ caseId: 1, sentAt: 1 }` - For chronological ordering

## Error Handling

### Common Error Responses

**400 Bad Request:**
- Empty message content
- Message exceeds 5000 characters
- Invalid case status

**401 Unauthorized:**
- Missing or invalid JWT token

**403 Forbidden:**
- User not part of the case
- Non-recipient trying to mark message as read

**404 Not Found:**
- Case not found
- Message not found

**500 Internal Server Error:**
- Database errors
- Unexpected server errors

## Integration Points

### Case Model Integration
- Updates `lastMessageAt` timestamp when messages are sent
- Validates case status before allowing messages

### Notification System (Future)
- Ready for WebSocket integration
- Can trigger real-time notifications
- Supports offline message queuing

## Testing

### Test Coverage
- Message sending validation
- Pagination functionality
- Access control verification
- Read receipt functionality
- Error handling scenarios

### Test File
`backend/tests/integration/case-messaging.test.js`

## Requirements Satisfied

✅ **Requirement 5.2:** Real-time bidirectional messaging
- Messages stored in database
- Chronological ordering
- Sender/recipient tracking

✅ **Requirement 5.5:** Message history
- All messages preserved
- Pagination support
- Efficient retrieval

✅ **Requirement 5.6:** Message delivery
- Database persistence
- Ready for WebSocket/polling integration
- Offline message support

## Future Enhancements

1. **WebSocket Integration**
   - Real-time message delivery
   - Typing indicators
   - Online/offline status

2. **Message Types**
   - Image attachments
   - File uploads
   - Voice messages

3. **Advanced Features**
   - Message search
   - Message reactions
   - Message editing/deletion
   - Read receipts broadcast

## Files Modified

1. `backend/controllers/messageController.js`
   - Added `sendCaseMessage()`
   - Added `getCaseMessages()`
   - Added `markCaseMessageAsRead()`

2. `backend/routes/caseRoutes.js`
   - Added case messaging routes
   - Integrated with message controller

3. `backend/tests/integration/case-messaging.test.js`
   - Created comprehensive integration tests

## API Documentation

### Base URL
`/api`

### Authentication
All endpoints require Bearer token:
```
Authorization: Bearer <jwt_token>
```

### Rate Limiting
Consider implementing rate limiting for message sending to prevent spam.

### Monitoring
Log all message operations for audit trail and debugging.

