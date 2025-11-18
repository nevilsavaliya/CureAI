# Implementation Plan

- [x] 1. Set up database models and schemas
  - [x] 1.1 Create Case model with all required fields
    - Define Case schema in backend/models/Case.js
    - Add indexes for patientId, doctorId, and status
    - Include patient medical data fields (symptoms, predictions, chatbot history)
    - Add treatment tracking fields and feedback structure
    - _Requirements: 1.3, 3.3, 4.3, 7.1, 8.2_
  
  - [x] 1.2 Create Message model for case communications
    - Define Message schema in backend/models/Message.js
    - Add caseId reference and sender/receiver fields
    - Include message type and read status
    - Add indexes for caseId and createdAt
    - _Requirements: 5.2, 5.5_
  
  - [x] 1.3 Create Notification model for user alerts
    - Define Notification schema in backend/models/Notification.js
    - Add userId, type, and related case fields
    - Include read status and timestamps
    - Add index for userId and isRead
    - _Requirements: 6.1, 6.2, 6.3_

- [x] 2. Implement case management backend APIs
  - [x] 2.1 Create case controller and routes
    - Implement POST /api/cases endpoint for case creation
    - Add GET /api/cases endpoint to fetch user's cases
    - Create GET /api/cases/:id endpoint for case details
    - Add authentication middleware to all routes
    - _Requirements: 1.2, 1.5, 3.2_
  
  - [x] 2.2 Implement case acceptance/rejection logic
    - Create PUT /api/cases/:id/accept endpoint
    - Create PUT /api/cases/:id/reject endpoint
    - Update case status and timestamps
    - Create notifications for patients
    - Validate doctor authorization
    - _Requirements: 2.4, 2.5, 2.6_
  
  - [x] 2.3 Implement treatment status management
    - Create PUT /api/cases/:id/mark-treated endpoint
    - Update case status to 'treated'
    - Create notification for patient
    - Trigger feedback request
    - _Requirements: 7.2, 7.3, 7.4, 7.5_
  
  - [x] 2.4 Implement feedback submission
    - Create POST /api/cases/:id/feedback endpoint
    - Validate rating (1-5 stars) and comment
    - Update case with feedback data
    - Calculate and update doctor's average rating
    - _Requirements: 9.2, 9.3, 9.4, 9.5_

- [x] 3. Implement messaging backend APIs
  - [x] 3.1 Create message controller and routes
    - Implement POST /api/cases/:caseId/messages endpoint
    - Create GET /api/cases/:caseId/messages endpoint
    - Add PUT /api/messages/:id/read endpoint
    - Validate user access to case
    - _Requirements: 5.2, 5.5_
  
  - [x] 3.2 Implement message service logic
    - Create sendMessage function with validation
    - Implement getMessages with pagination
    - Add markAsRead functionality
    - Store messages in database
    - _Requirements: 5.2, 5.5, 5.6_

- [x] 4. Implement notification backend APIs
  - [x] 4.1 Create notification controller and routes
    - Implement GET /api/notifications endpoint
    - Create GET /api/notifications/unread-count endpoint
    - Add PUT /api/notifications/:id/read endpoint
    - Create PUT /api/notifications/read-all endpoint
    - _Requirements: 6.1, 6.4, 6.6_
  
  - [x] 4.2 Implement notification service
    - Create createNotification function
    - Implement notification types (case_request, case_accepted, etc.)
    - Add getNotifications with filtering
    - Implement markAsRead functionality
    - _Requirements: 6.2, 6.3, 6.7_

- [x] 5. Set up WebSocket server for real-time messaging
  - [x] 5.1 Install and configure Socket.IO
    - Install socket.io package
    - Create socketService.js in backend/services
    - Configure CORS for Socket.IO
    - Set up connection authentication using JWT
    - _Requirements: 5.1, 5.6_
  
  - [x] 5.2 Implement WebSocket event handlers
    - Handle 'connection' event with authentication
    - Implement 'join_case' event to join case rooms
    - Create 'send_message' event handler
    - Add 'typing' event for typing indicators
    - Handle 'disconnect' event
    - _Requirements: 5.1, 5.3, 5.4_
  
  - [x] 5.3 Implement message broadcasting
    - Emit 'new_message' to case room participants
    - Broadcast 'message_read' events
    - Send 'case_updated' on status changes
    - Emit 'new_notification' to specific users
    - Broadcast 'user_typing' indicators
    - _Requirements: 5.1, 5.3, 5.4_

- [x] 6. Create patient cases dashboard frontend
  - [x] 6.1 Generate cases component for patients
    - Create PatientCasesComponent with routing
    - Design sidebar for case list
    - Create main panel for case details
    - Add navigation link in patient dashboard header
    - _Requirements: 3.1, 3.2_
  
  - [x] 6.2 Implement case list sidebar
    - Display all cases with doctor name and status
    - Add status filters (All, Pending, Ongoing, Treated, Rejected)
    - Implement case selection
    - Show unread message indicators
    - Add search functionality
    - _Requirements: 3.2, 10.1, 10.2, 10.5_
  
  - [x] 6.3 Implement case details panel
    - Display treatment status with visual indicators
    - Show doctor information (email, degree, specialization, rating)
    - Display message thread
    - Add message input and send button
    - Show consultation history
    - _Requirements: 3.3, 3.4, 8.3_
  
  - [x] 6.4 Implement feedback form
    - Show feedback form when case is treated
    - Add 5-star rating component
    - Create comment textarea
    - Implement submit functionality
    - Show success message after submission
    - _Requirements: 3.5, 9.1, 9.2, 9.3_

- [x] 7. Create doctor cases dashboard frontend
  - [x] 7.1 Generate cases component for doctors
    - Create DoctorCasesComponent with routing
    - Design sidebar for case list
    - Create main panel for case details
    - Add navigation link in doctor dashboard header
    - _Requirements: 4.1, 4.2_
  
  - [x] 7.2 Implement case list sidebar
    - Display all accepted cases with patient name and status
    - Add status filters
    - Implement case selection
    - Show unread message indicators
    - Add search functionality
    - _Requirements: 4.2, 10.1, 10.2_
  
  - [x] 7.3 Implement case details panel
    - Display patient information (email, blood group, symptoms)
    - Show chatbot diagnostic data and predictions
    - Display message thread
    - Add message input and send button
    - Show treatment status controls
    - _Requirements: 4.3, 8.2, 8.3_
  
  - [x] 7.4 Implement treatment status controls
    - Add "Mark as Treated" button for ongoing cases
    - Show confirmation dialog
    - Update case status via API
    - Display success message
    - _Requirements: 4.4, 7.2, 7.3, 7.4_

- [x] 8. Implement real-time messaging frontend
  - [x] 8.1 Install and configure Socket.IO client
    - Install socket.io-client package
    - Create SocketService in frontend/src/app/services
    - Implement connection with JWT authentication
    - Handle connection errors and reconnection
    - _Requirements: 5.1, 5.6, 5.7_
  
  - [x] 8.2 Implement message sending and receiving
    - Connect to WebSocket on component init
    - Join case room when case is opened
    - Send messages via WebSocket
    - Listen for new messages and update UI
    - Display messages in chronological order
    - _Requirements: 5.1, 5.2, 5.3_
  
  - [x] 8.3 Implement typing indicators
    - Emit typing event when user types
    - Listen for typing events from other user
    - Display "User is typing..." indicator
    - Clear indicator after timeout
    - _Requirements: 5.4_
  
  - [x] 8.4 Implement message read receipts
    - Mark messages as read when viewed
    - Emit read event via WebSocket
    - Update message status in UI
    - Show read/unread indicators
    - _Requirements: 5.2_

- [x] 9. Implement notification system frontend
  - [x] 9.1 Create notification component
    - Generate NotificationComponent
    - Add notification icon to dashboard headers
    - Create dropdown panel for notifications
    - Display notification count badge
    - _Requirements: 6.1, 6.4_
  
  - [x] 9.2 Implement notification display
    - Fetch notifications on component init
    - Display notification list with icons
    - Show notification types with appropriate styling
    - Implement click to navigate to case
    - Mark notification as read on click
    - _Requirements: 6.2, 6.5, 6.6_
  
  - [x] 9.3 Implement real-time notification updates
    - Listen for new notification events via WebSocket
    - Update notification list in real-time
    - Update badge count
    - Show toast/alert for new notifications
    - _Requirements: 6.2, 6.3_

- [x] 10. Implement case request flow
  - [x] 10.1 Update patient dashboard doctor list
    - Remove direct messaging button
    - Add "Request Consultation" button
    - Show doctor details (specialization, rating, experience)
    - _Requirements: 1.1, 1.2_
  
  - [x] 10.2 Create case request dialog
    - Show confirmation dialog with doctor details
    - Display patient's symptoms and predictions
    - Add "Confirm Request" and "Cancel" buttons
    - Call API to create case
    - Show success message
    - _Requirements: 1.2, 1.3, 1.5_
  
  - [x] 10.3 Implement duplicate case prevention
    - Check for existing pending case with doctor
    - Show error if duplicate exists
    - Suggest viewing existing case
    - _Requirements: 1.4_

- [x] 11. Implement case review for doctors
  - [x] 11.1 Create pending cases notification panel
    - Show notification icon with pending count
    - Create dropdown with pending case list
    - Display patient name and symptoms preview
    - Add "View Details" button
    - _Requirements: 2.1, 2.2_
  
  - [x] 11.2 Create case review dialog
    - Show complete patient information
    - Display symptoms, predictions, and chatbot history
    - Show patient blood group and email
    - Add "Accept" and "Reject" buttons
    - _Requirements: 2.3, 2.4, 2.5_
  
  - [x] 11.3 Implement accept/reject actions
    - Call API to accept or reject case
    - Show confirmation dialogs
    - Update notification list
    - Navigate to case if accepted
    - Show success messages
    - _Requirements: 2.4, 2.5, 2.6_

- [x] 12. Implement case filtering and search
  - [x] 12.1 Add filter controls to case list
    - Create filter buttons for status (All, Pending, Ongoing, Treated, Rejected)
    - Implement filter logic
    - Update case list based on selected filter
    - Show case count for each status
    - _Requirements: 10.1, 10.4_
  
  - [x] 12.2 Implement search functionality
    - Add search input to case list
    - Search by doctor/patient name
    - Search by date range
    - Update case list with search results
    - _Requirements: 10.2_
  
  - [x] 12.3 Implement case sorting
    - Sort cases by date (newest first)
    - Add sort options (date, status, unread messages)
    - Update case list based on sort selection
    - _Requirements: 10.3_

- [-] 13. Add case history and medical records display
  - [x] 13.1 Display chatbot diagnostic data
    - Show original symptoms entered by patient
    - Display predicted conditions from chatbot
    - Show chatbot conversation history
    - Format data in readable layout
    - _Requirements: 8.2, 8.3_
  
  - [x] 13.2 Display consultation history
    - Show all messages exchanged
    - Display treatment timeline with status changes
    - Show timestamps for all events
    - Add export/print functionality
    - _Requirements: 8.3, 8.4, 8.5_
  
  - [x] 13.3 Preserve case data after completion
    - Ensure treated cases remain accessible
    - Maintain complete message history
    - Keep all medical data intact
    - Allow viewing but prevent editing
    - _Requirements: 8.6_

- [ ] 14. Implement HTTP polling fallback
  - [x] 14.1 Create polling service
    - Implement polling mechanism for messages
    - Poll every 5 seconds when WebSocket unavailable
    - Fetch new messages via REST API
    - Update UI with new messages
    - _Requirements: 5.6, 5.7_
  
  - [x] 14.2 Implement automatic fallback
    - Detect WebSocket connection failure
    - Automatically switch to HTTP polling
    - Show connection status indicator
    - Attempt WebSocket reconnection periodically
    - _Requirements: 5.6, 5.7_

- [x] 15. Add error handling and validation
  - [x] 15.1 Implement backend .validation
    - Validate case creation data
    - Check for duplicate cases
    - Validate message content length
    - Verify user authorization for actions
    - _Requirements: 1.4, 5.2_
  
  - [x] 15.2 Implement frontend error handling
    - Show user-friendly error messages
    - Handle API errors gracefully
    - Display connection status
    - Implement retry mechanisms
    - _Requirements: All_

- [-] 16. Testing and optimization
  - [x] 16.1 Write unit tests for backend services
    - Test case service methods
    - Test message service methods
    - Test notification service methods
    - Test WebSocket event handlers
    - _Requirements: All_
  
  - [ ] 16.2 Write integration tests
    - Test complete case workflow
    - Test real-time messaging
    - Test notification delivery
    - Test case filtering and search
    - _Requirements: All_
  
  - [x] 16.3 Perform end-to-end testing
    - Test patient creates case flow
    - Test doctor accepts/rejects case
    - Test real-time messaging between users
    - Test treatment completion and feedback
    - _Requirements: All_
  
  - [x] 16.4 Optimize performance
    - Add database indexes
    - Implement caching for case lists
    - Optimize WebSocket connections
    - Test with multiple concurrent users
    - _Requirements: All_
