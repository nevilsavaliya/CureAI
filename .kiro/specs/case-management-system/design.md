# Case Management & Real-time Messaging System - Design Document

## Overview

This system implements a comprehensive case management platform that enables patients to request consultations, doctors to manage cases, and both parties to communicate in real-time. The design focuses on scalability, real-time updates, and maintaining complete medical history.

## Architecture

### High-Level Architecture

```
┌─────────────────┐         ┌──────────────────┐         ┌─────────────────┐
│  Patient UI     │◄────────┤   API Gateway    │────────►│   Doctor UI     │
│  (Angular)      │         │   (Express.js)   │         │   (Angular)     │
└────────┬────────┘         └────────┬─────────┘         └────────┬────────┘
         │                           │                            │
         │                           │                            │
         └───────────────┬───────────┴────────────┬──────────────┘
                         │                        │
                    ┌────▼────────┐         ┌────▼──────────┐
                    │  WebSocket  │         │   REST API    │
                    │   Server    │         │  Controllers  │
                    └────┬────────┘         └────┬──────────┘
                         │                        │
                         └────────────┬───────────┘
                                      │
                         ┌────────────▼───────────┐
                         │   Business Logic       │
                         │   - Case Service       │
                         │   - Message Service    │
                         │   - Notification Svc   │
                         └────────────┬───────────┘
                                      │
                         ┌────────────▼───────────┐
                         │   MongoDB Database     │
                         │   - Cases Collection   │
                         │   - Messages Collection│
                         │   - Notifications Coll │
                         └────────────────────────┘
```

### Technology Stack

**Backend:**
- Node.js + Express.js for REST API
- Socket.IO for real-time WebSocket communication
- MongoDB for data persistence
- Mongoose for ODM

**Frontend:**
- Angular 15 for UI components
- Socket.IO Client for real-time updates
- RxJS for reactive programming
- Angular Material for UI components

## Data Models

### Case Model

```javascript
{
  _id: ObjectId,
  patientId: ObjectId (ref: Patient),
  doctorId: ObjectId (ref: Doctor),
  status: String, // 'pending', 'ongoing', 'treated', 'rejected'
  
  // Patient Medical Data
  symptoms: [String],
  predictedConditions: [String],
  chatbotHistory: [{
    question: String,
    answer: String,
    timestamp: Date
  }],
  
  // Case Metadata
  createdAt: Date,
  acceptedAt: Date,
  treatedAt: Date,
  rejectedAt: Date,
  
  // Treatment Info
  treatmentNotes: String,
  diagnosis: String,
  prescription: String,
  
  // Feedback
  feedback: {
    rating: Number, // 1-5
    comment: String,
    submittedAt: Date
  },
  
  // Timestamps
  lastMessageAt: Date,
  updatedAt: Date
}
```

### Message Model

```javascript
{
  _id: ObjectId,
  caseId: ObjectId (ref: Case),
  senderId: ObjectId, // Patient or Doctor ID
  senderType: String, // 'patient' or 'doctor'
  receiverId: ObjectId,
  receiverType: String,
  
  content: String,
  messageType: String, // 'text', 'image', 'file'
  
  // Status
  isRead: Boolean,
  readAt: Date,
  
  // Timestamps
  createdAt: Date,
  updatedAt: Date
}
```

### Notification Model

```javascript
{
  _id: ObjectId,
  userId: ObjectId, // Patient or Doctor ID
  userType: String, // 'patient' or 'doctor'
  
  type: String, // 'case_request', 'case_accepted', 'case_rejected', 'case_treated', 'new_message'
  title: String,
  message: String,
  
  // Related Data
  caseId: ObjectId (ref: Case),
  relatedUserId: ObjectId, // The other party in the case
  
  // Status
  isRead: Boolean,
  readAt: Date,
  
  // Timestamps
  createdAt: Date
}
```

## Components and Interfaces

### Backend Components

#### 1. Case Controller (`caseController.js`)

**Endpoints:**
- `POST /api/cases` - Create new case (patient)
- `GET /api/cases` - Get all cases for user
- `GET /api/cases/:id` - Get case details
- `PUT /api/cases/:id/accept` - Accept case (doctor)
- `PUT /api/cases/:id/reject` - Reject case (doctor)
- `PUT /api/cases/:id/mark-treated` - Mark case as treated (doctor)
- `POST /api/cases/:id/feedback` - Submit feedback (patient)

#### 2. Message Controller (`messageController.js`)

**Endpoints:**
- `POST /api/cases/:caseId/messages` - Send message
- `GET /api/cases/:caseId/messages` - Get all messages for case
- `PUT /api/messages/:id/read` - Mark message as read

#### 3. Notification Controller (`notificationController.js`)

**Endpoints:**
- `GET /api/notifications` - Get all notifications for user
- `GET /api/notifications/unread-count` - Get unread count
- `PUT /api/notifications/:id/read` - Mark notification as read
- `PUT /api/notifications/read-all` - Mark all as read

#### 4. WebSocket Service (`socketService.js`)

**Events:**
- `connection` - Client connects
- `join_case` - Join case room for real-time updates
- `send_message` - Send message in real-time
- `typing` - Typing indicator
- `disconnect` - Client disconnects

**Emitted Events:**
- `new_message` - New message received
- `message_read` - Message marked as read
- `case_updated` - Case status changed
- `new_notification` - New notification
- `user_typing` - Other user is typing

### Frontend Components

#### 1. Cases Dashboard Component

**Patient View:**
- Sidebar with case list (filtered by status)
- Main panel showing selected case details
- Message thread with real-time updates
- Doctor information panel
- Treatment status indicator
- Feedback form (for treated cases)

**Doctor View:**
- Sidebar with case list (filtered by status)
- Main panel showing selected case details
- Message thread with real-time updates
- Patient information panel
- Treatment status controls
- Mark as treated button

#### 2. Notification Component

- Notification icon with badge count
- Dropdown panel with notification list
- Click to navigate to relevant case
- Mark as read functionality

#### 3. Case Request Component (Patient)

- Doctor selection interface
- Case creation form
- Confirmation dialog

#### 4. Case Review Component (Doctor)

- Pending case list
- Patient details view
- Accept/Reject buttons
- Case preview

## Real-time Messaging Implementation

### WebSocket Connection Flow

```
1. User logs in → Establish WebSocket connection
2. User opens case → Join case room (socket.join(caseId))
3. User sends message → Emit to case room
4. Other user receives → Display message instantly
5. User closes case → Leave case room
6. User logs out → Disconnect WebSocket
```

### Message Delivery Strategy

**Primary: WebSocket (Socket.IO)**
- Instant delivery when both users online
- Typing indicators
- Read receipts

**Fallback: HTTP Polling**
- Poll every 5 seconds when WebSocket unavailable
- Fetch new messages via REST API
- Update UI with new messages

**Offline Handling:**
- Messages stored in database
- Delivered when user comes online
- Notification created for offline users

## Error Handling

### Case Creation Errors

- **Duplicate Case**: Check for existing pending case with same doctor
- **Invalid Doctor**: Verify doctor exists and has active subscription
- **Missing Data**: Validate required patient medical data

### Message Errors

- **Case Not Found**: Verify case exists and user has access
- **Unauthorized**: Check user is part of the case
- **Message Too Long**: Limit message length to 5000 characters

### WebSocket Errors

- **Connection Failed**: Fall back to HTTP polling
- **Reconnection**: Implement exponential backoff
- **Message Lost**: Retry mechanism with queue

## Testing Strategy

### Unit Tests

- Case service methods (create, accept, reject, mark treated)
- Message service methods (send, retrieve, mark read)
- Notification service methods (create, retrieve, mark read)
- WebSocket event handlers

### Integration Tests

- Complete case workflow (create → accept → message → treat → feedback)
- Real-time message delivery
- Notification creation and delivery
- Case filtering and search

### End-to-End Tests

- Patient creates case → Doctor accepts → Exchange messages → Doctor marks treated → Patient provides feedback
- Real-time messaging between patient and doctor
- Notification flow for all case status changes

## Security Considerations

### Authentication & Authorization

- JWT tokens for API authentication
- WebSocket authentication using token
- Verify user access to cases (patient/doctor ownership)
- Prevent unauthorized case access

### Data Privacy

- Encrypt sensitive medical data
- HIPAA compliance considerations
- Secure WebSocket connections (WSS)
- Rate limiting on message sending

### Input Validation

- Sanitize message content (prevent XSS)
- Validate case status transitions
- Limit file upload sizes
- Prevent SQL/NoSQL injection

## Performance Optimization

### Database Indexing

```javascript
// Cases Collection
{ patientId: 1, status: 1 }
{ doctorId: 1, status: 1 }
{ createdAt: -1 }

// Messages Collection
{ caseId: 1, createdAt: 1 }
{ senderId: 1, createdAt: -1 }

// Notifications Collection
{ userId: 1, isRead: 1, createdAt: -1 }
```

### Caching Strategy

- Cache active case lists (5-minute TTL)
- Cache doctor/patient profiles
- Cache unread notification counts

### WebSocket Optimization

- Use rooms for case-specific messaging
- Implement connection pooling
- Heartbeat mechanism to detect dead connections
- Compress large messages

## Deployment Considerations

### Environment Variables

```
SOCKET_IO_PORT=3001
SOCKET_IO_CORS_ORIGIN=http://localhost:4200
MESSAGE_POLLING_INTERVAL=5000
MAX_MESSAGE_LENGTH=5000
NOTIFICATION_RETENTION_DAYS=30
```

### Scaling

- Horizontal scaling with Socket.IO Redis adapter
- Load balancer with sticky sessions
- Separate WebSocket server from REST API
- Database replication for read-heavy operations

## Migration Strategy

### Phase 1: Database Setup
- Create new collections (Cases, Messages, Notifications)
- Add indexes
- Migrate existing consultation data to cases

### Phase 2: Backend Implementation
- Implement case management APIs
- Set up WebSocket server
- Create notification system

### Phase 3: Frontend Implementation
- Build cases dashboard components
- Implement real-time messaging UI
- Add notification system

### Phase 4: Testing & Deployment
- Integration testing
- User acceptance testing
- Gradual rollout to users
