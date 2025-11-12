# Design Document

## Overview

This document outlines the technical design for the Healthcare Platform MVP, a three-tier web application that connects patients with doctors through symptom analysis and consultation services. The system follows a clean separation of concerns with Angular frontend, Express.js backend API, and MongoDB database.

The platform enables patients to input symptoms via a chatbot interface, receive static disease predictions, view matching doctors, schedule consultations, and conduct video calls. Doctors can subscribe to the platform, view patient records, message patients, and conduct consultations. Administrators can manage users and monitor platform metrics.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (Angular)                       │
│  - Patient UI (Chatbot, Doctor List, Messaging, Video)      │
│  - Doctor UI (Dashboard, Patient Records, Subscription)     │
│  - Admin UI (User Management, Metrics)                      │
│  - Authentication UI (Login, Signup)                        │
└────────────────────┬────────────────────────────────────────┘
                     │
                     │ REST API (HTTP/HTTPS)
                     │
┌────────────────────▼────────────────────────────────────────┐
│                  Backend (Express.js)                        │
│  - Authentication Service                                    │
│  - User Management Service                                   │
│  - Symptom Processing Service                               │
│  - Disease Prediction Service (Static)                      │
│  - Doctor Matching Service                                   │
│  - Messaging Service                                         │
│  - Consultation Service                                      │
│  - Subscription Service                                      │
│  - Feedback Service                                          │
│  - Video Call Integration Service                           │
└────────────────────┬────────────────────────────────────────┘
                     │
                     │ MongoDB Driver
                     │
┌────────────────────▼────────────────────────────────────────┐
│                    Database (MongoDB)                        │
│  Collections:                                                │
│  - patients (includes auth credentials)                     │
│  - doctors (includes auth credentials)                      │
│  - admins (includes auth credentials)                       │
│  - symptoms                                                  │
│  - predictions                                               │
│  - messages                                                  │
│  - consultations                                             │
│  - feedback                                                  │
│  - otps (for password reset)                                │
└─────────────────────────────────────────────────────────────┘
```

### Technology Stack

**Frontend:**
- Framework: Angular 15+
- UI Components: Angular Material
- HTTP Client: Angular HttpClient
- Routing: Angular Router
- State Management: RxJS
- Video Call: WebRTC with Simple-Peer or PeerJS

**Backend:**
- Runtime: Node.js 18+
- Framework: Express.js 4.x
- Authentication: JWT (jsonwebtoken)
- Password Hashing: bcrypt
- Validation: express-validator
- CORS: cors middleware
- Environment: dotenv

**Database:**
- Database: MongoDB 6.0+
- ODM: Mongoose
- Schema Validation: Mongoose schemas

**Development Tools:**
- API Testing: Postman/Thunder Client
- Version Control: Git

## Components and Interfaces

### Frontend Components

#### 1. Authentication Module

**Components:**
- `LoginComponent`: Login form with email/password (supports admin hardcoded login)
- `SignupComponent`: Registration form with role selection and dynamic fields
  - Common fields: name, dateOfBirth, email, password, confirmPassword
  - Patient-specific: bloodGroup
  - Doctor-specific: degree, speciality, experienceYears
- `AuthGuard`: Route protection based on authentication status
- `RoleGuard`: Route protection based on user role
- `SubscriptionGuard`: Protects doctor routes until subscription is active

**Services:**
- `AuthService`: Handles login, signup, token management, and session
- `PaymentService`: Handles doctor subscription payment integration

**API Endpoints Used:**
- `POST /api/auth/login` - Checks patients, doctors, and admins collections
- `POST /api/auth/signup/patient` - Creates patient in patients collection
- `POST /api/auth/signup/doctor` - Creates doctor in doctors collection (subscription pending)
- `POST /api/auth/logout`
- `GET /api/auth/verify`
- `POST /api/payment/subscription` - Process doctor subscription payment

**Signup Flow:**
1. User selects role (patient or doctor)
2. Common fields displayed for all users
3. Role-specific fields appear based on selection
4. Password and confirmPassword validation
5. For patients: Create account → Redirect to patient dashboard
6. For doctors: Create account → Redirect to mandatory subscription page → After payment → Redirect to doctor dashboard
7. Admin: No signup, only login with admin@gmail.com / admin@123

#### 2. Patient Module

**Components:**
- `PatientDashboardComponent`: Main patient interface with chatbot
- `ChatbotComponent`: Symptom input chat interface
- `DiseasePredictionComponent`: Displays predicted disease
- `DoctorListComponent`: Shows only registered doctors with active subscriptions
- `PatientMessagingComponent`: Send messages to doctors, view conversation history
- `ConsultationNotificationComponent`: View consultation details sent via email
- `FeedbackFormComponent`: Post-consultation feedback form

**Note:** Patients can only message doctors, not schedule consultations. Doctors schedule consultations and video links are sent via email.

**Services:**
- `SymptomService`: Submit symptoms to backend
- `PredictionService`: Fetch disease predictions
- `DoctorService`: Get doctor recommendations
- `MessagingService`: Send/receive messages
- `ConsultationService`: Schedule and manage consultations
- `VideoService`: Handle WebRTC connections
- `FeedbackService`: Submit feedback

**API Endpoints Used:**
- `POST /api/symptoms`
- `GET /api/predictions/:patientId`
- `GET /api/doctors/match/:diseaseId`
- `GET /api/messages/:userId`
- `POST /api/messages`
- `GET /api/consultations/:patientId`
- `POST /api/consultations`
- `PUT /api/consultations/:id`
- `POST /api/feedback`

#### 3. Doctor Module

**Components:**
- `DoctorSignupComponent`: Doctor registration with degree, speciality, experience
- `SubscriptionComponent`: Mandatory 30 Rs/month subscription payment (UPI integration)
- `DoctorDashboardComponent`: Main doctor interface with patient messages
- `PatientMessagesComponent`: View messages from patients who completed chatbot
- `PatientDetailComponent`: Detailed patient information (symptoms, predictions, blood group)
- `DoctorMessagingComponent`: Reply to patient messages
- `ConsultationBookingComponent`: Book video consultations with patients
- `DoctorConsultationListComponent`: View scheduled consultations with join links
- `FeedbackFormComponent`: Shared with patient module

**Note:** Doctors see patients only after they complete chatbot diagnosis and send a message. Doctors can book consultations which send video links via email to both parties.

**Services:**
- `DoctorProfileService`: Manage doctor profile
- `SubscriptionService`: Handle subscription payments
- `PatientRecordService`: Fetch patient records
- `MessagingService`: Shared with patient module
- `ConsultationService`: Shared with patient module

**API Endpoints Used:**
- `POST /api/doctors/profile`
- `PUT /api/doctors/profile/:id`
- `POST /api/subscriptions`
- `GET /api/subscriptions/:doctorId`
- `GET /api/patients/records/:doctorId`
- `GET /api/patients/:id`

#### 4. Admin Module

**Components:**
- `AdminDashboardComponent`: Platform metrics overview
- `UserManagementComponent`: List all users
- `PatientListComponent`: Manage patients
- `DoctorListComponent`: Manage doctors
- `UserDetailComponent`: View detailed user information

**Services:**
- `AdminService`: Fetch platform metrics
- `UserManagementService`: Manage users

**API Endpoints Used:**
- `GET /api/admin/metrics`
- `GET /api/admin/users`
- `GET /api/admin/users/:id`
- `GET /api/admin/patients`
- `GET /api/admin/doctors`

### Backend API Endpoints

#### Authentication Endpoints

```
POST /api/auth/signup
Request Body: { name, email, password, role }
Response: { success, message, userId }

POST /api/auth/login
Request Body: { email, password }
Response: { success, token, user: { id, name, email, role } }

POST /api/auth/logout
Headers: Authorization: Bearer <token>
Response: { success, message }

GET /api/auth/verify
Headers: Authorization: Bearer <token>
Response: { valid, user: { id, name, email, role } }
```

#### Patient Endpoints

```
POST /api/symptoms
Headers: Authorization: Bearer <token>
Request Body: { patientId, symptomText, timestamp }
Response: { success, symptomId, prediction }

GET /api/predictions/:patientId
Headers: Authorization: Bearer <token>
Response: { predictions: [{ disease, confidence, description }] }

GET /api/doctors/match/:diseaseId
Headers: Authorization: Bearer <token>
Response: { doctors: [{ id, name, specialization, experience, contact }] }
```

#### Doctor Endpoints

```
POST /api/doctors/profile
Headers: Authorization: Bearer <token>
Request Body: { doctorId, specialization, qualifications, experience, contact }
Response: { success, profileId }

PUT /api/doctors/profile/:id
Headers: Authorization: Bearer <token>
Request Body: { specialization, qualifications, experience, contact }
Response: { success, message }

POST /api/subscriptions
Headers: Authorization: Bearer <token>
Request Body: { doctorId, planId, paymentInfo }
Response: { success, subscriptionId, expiryDate }

GET /api/subscriptions/:doctorId
Headers: Authorization: Bearer <token>
Response: { active, plan, expiryDate }

GET /api/patients/records/:doctorId
Headers: Authorization: Bearer <token>
Response: { patients: [{ id, name, symptoms, disease, date }] }

GET /api/patients/:id
Headers: Authorization: Bearer <token>
Response: { patient: { id, name, age, gender, symptoms, predictions } }
```

#### Messaging Endpoints

```
POST /api/messages
Headers: Authorization: Bearer <token>
Request Body: { senderId, recipientId, content, timestamp }
Response: { success, messageId }

GET /api/messages/:userId
Headers: Authorization: Bearer <token>
Query: ?conversationWith=<otherUserId>
Response: { messages: [{ id, senderId, recipientId, content, timestamp, read }] }

PUT /api/messages/:id/read
Headers: Authorization: Bearer <token>
Response: { success }
```

#### Consultation Endpoints

```
POST /api/consultations
Headers: Authorization: Bearer <token>
Request Body: { patientId, doctorId, scheduledDate, scheduledTime }
Response: { success, consultationId }

GET /api/consultations/:userId
Headers: Authorization: Bearer <token>
Query: ?role=<patient|doctor>
Response: { consultations: [{ id, patientId, doctorId, date, time, status }] }

PUT /api/consultations/:id
Headers: Authorization: Bearer <token>
Request Body: { status }
Response: { success, message }

POST /api/consultations/:id/join
Headers: Authorization: Bearer <token>
Response: { success, roomId, token }
```

#### Feedback Endpoints

```
POST /api/feedback
Headers: Authorization: Bearer <token>
Request Body: { consultationId, userId, rating, comment }
Response: { success, feedbackId }

GET /api/feedback/doctor/:doctorId
Response: { averageRating, totalReviews, feedback: [{ rating, comment, date }] }
```

#### Admin Endpoints

```
GET /api/admin/metrics
Headers: Authorization: Bearer <token>
Response: { totalPatients, totalDoctors, totalSymptoms, totalPredictions, activeUsers }

GET /api/admin/users
Headers: Authorization: Bearer <token>
Query: ?role=<patient|doctor>&search=<term>
Response: { users: [{ id, name, email, role, registrationDate, status }] }

GET /api/admin/users/:id
Headers: Authorization: Bearer <token>
Response: { user: { id, name, email, role, profile, activityHistory } }
```

### Backend Services

#### 1. Authentication Service

**Responsibilities:**
- User registration with role assignment
- Password hashing with bcrypt
- JWT token generation and validation
- Session management

**Methods:**
- `signup(name, email, password, role)`: Create new user
- `login(email, password)`: Authenticate and return token
- `verifyToken(token)`: Validate JWT token
- `hashPassword(password)`: Hash password with bcrypt
- `comparePassword(password, hash)`: Verify password

#### 2. User Management Service

**Responsibilities:**
- CRUD operations for users
- Profile management for patients and doctors
- User search and filtering

**Methods:**
- `createUser(userData)`: Create user record
- `getUserById(userId)`: Fetch user details
- `updateUser(userId, updates)`: Update user information
- `getAllUsers(filters)`: Get filtered user list
- `getUsersByRole(role)`: Get users by role

#### 3. Symptom Processing Service

**Responsibilities:**
- Store patient symptom submissions
- Format symptom data for prediction engine
- Maintain symptom history

**Methods:**
- `saveSymptom(patientId, symptomText)`: Store symptom entry
- `getSymptomsByPatient(patientId)`: Retrieve patient symptoms
- `formatSymptomForPrediction(symptomText)`: Prepare data for prediction

#### 4. Disease Prediction Service (Static)

**Responsibilities:**
- Return hardcoded disease predictions
- Map symptoms to predefined diseases
- Calculate static confidence scores

**Methods:**
- `predictDisease(symptomText)`: Return static prediction
- `getStaticPredictions()`: Load hardcoded disease data
- `mapSymptomToDisease(symptom)`: Match symptom to disease

**Static Data Structure:**
```javascript
const staticPredictions = {
  'fever headache': {
    diseases: [
      { name: 'Influenza', confidence: 85, description: 'Common flu...' },
      { name: 'Dengue', confidence: 60, description: 'Mosquito-borne...' }
    ]
  },
  'chest pain': {
    diseases: [
      { name: 'Angina', confidence: 75, description: 'Heart condition...' },
      { name: 'Acid Reflux', confidence: 65, description: 'Digestive issue...' }
    ]
  }
  // More mappings...
}
```

#### 5. Doctor Matching Service

**Responsibilities:**
- Map diseases to medical specializations
- Query doctors by specialization
- Rank doctors by experience and ratings

**Methods:**
- `matchDoctors(diseaseId)`: Find matching doctors
- `getDoctorsBySpecialization(specialization)`: Query doctors
- `rankDoctors(doctors)`: Sort by experience and rating

**Disease-Specialization Mapping:**
```javascript
const diseaseSpecializationMap = {
  'Influenza': ['General Medicine', 'Internal Medicine'],
  'Angina': ['Cardiology'],
  'Migraine': ['Neurology'],
  'Arthritis': ['Orthopedics'],
  'Eczema': ['Dermatology']
  // More mappings...
}
```

#### 6. Messaging Service

**Responsibilities:**
- Store and retrieve messages
- Mark messages as read
- Get conversation history

**Methods:**
- `sendMessage(senderId, recipientId, content)`: Create message
- `getMessages(userId, otherUserId)`: Get conversation
- `markAsRead(messageId)`: Update read status
- `getUnreadCount(userId)`: Count unread messages

#### 7. Consultation Service

**Responsibilities:**
- Schedule consultations
- Update consultation status
- Generate video call room credentials

**Methods:**
- `scheduleConsultation(patientId, doctorId, date, time)`: Create consultation
- `getConsultations(userId, role)`: Fetch user consultations
- `updateStatus(consultationId, status)`: Update consultation
- `generateRoomToken(consultationId)`: Create video room access

#### 8. Subscription Service

**Responsibilities:**
- Process doctor subscriptions
- Validate subscription status
- Handle subscription renewals

**Methods:**
- `createSubscription(doctorId, planId, paymentInfo)`: Process subscription
- `validateSubscription(doctorId)`: Check active status
- `getSubscriptionDetails(doctorId)`: Fetch subscription info

#### 9. Feedback Service

**Responsibilities:**
- Store consultation feedback
- Calculate doctor ratings
- Retrieve feedback history

**Methods:**
- `submitFeedback(consultationId, userId, rating, comment)`: Save feedback
- `getDoctorRating(doctorId)`: Calculate average rating
- `getFeedbackByDoctor(doctorId)`: Get doctor reviews

#### 10. Video Call Integration Service

**Responsibilities:**
- Generate WebRTC room credentials
- Manage video call sessions
- Handle signaling for peer connections

**Methods:**
- `createRoom(consultationId)`: Initialize video room
- `getRoomCredentials(consultationId, userId)`: Get access token
- `endCall(consultationId)`: Close video session

## Data Models

### MongoDB Collections and Schemas

#### Patients Collection

```javascript
{
  _id: ObjectId,
  name: String (required),
  email: String (required, unique, indexed),
  password: String (required, hashed),
  dateOfBirth: Date (required),
  bloodGroup: String (required),
  gender: String (enum: ['male', 'female', 'other']),
  contactNumber: String,
  address: String,
  medicalHistory: String,
  allergies: [String],
  createdAt: Date (default: Date.now),
  updatedAt: Date,
  lastLogin: Date,
  isActive: Boolean (default: true)
}
```

#### Doctors Collection

```javascript
{
  _id: ObjectId,
  name: String (required),
  email: String (required, unique, indexed),
  password: String (required, hashed),
  dateOfBirth: Date (required),
  degree: String (required),
  speciality: String (required),
  experienceYears: Number (required),
  contactNumber: String,
  clinicAddress: String,
  licenseNumber: String,
  rating: Number (default: 0),
  totalReviews: Number (default: 0),
  subscriptionStatus: String (enum: ['pending', 'active', 'expired'], default: 'pending'),
  subscriptionStartDate: Date,
  subscriptionExpiryDate: Date,
  paymentInfo: {
    transactionId: String,
    amount: Number,
    paymentDate: Date,
    upiId: String
  },
  createdAt: Date (default: Date.now),
  updatedAt: Date,
  lastLogin: Date,
  isActive: Boolean (default: true)
}
```

#### Admins Collection

```javascript
{
  _id: ObjectId,
  name: String (required),
  email: String (required, unique, indexed),
  password: String (required, hashed),
  createdAt: Date (default: Date.now),
  updatedAt: Date,
  lastLogin: Date,
  isActive: Boolean (default: true)
}
```

#### Symptoms Collection

```javascript
{
  _id: ObjectId,
  patientId: ObjectId (ref: 'Patients', required, indexed),
  symptomText: String (required),
  submittedAt: Date (default: Date.now, indexed)
}
```

#### Predictions Collection

```javascript
{
  _id: ObjectId,
  patientId: ObjectId (ref: 'Patients', required, indexed),
  symptomId: ObjectId (ref: 'Symptoms', required),
  diseases: [{
    name: String (required),
    confidence: Number (required),
    description: String,
    specialization: [String]
  }],
  createdAt: Date (default: Date.now)
}
```

#### Messages Collection

```javascript
{
  _id: ObjectId,
  senderId: ObjectId (ref: 'Users', required, indexed),
  recipientId: ObjectId (ref: 'Users', required, indexed),
  content: String (required),
  isRead: Boolean (default: false),
  sentAt: Date (default: Date.now, indexed),
  readAt: Date
}

// Compound index on senderId and recipientId for conversation queries
```

#### Consultations Collection

```javascript
{
  _id: ObjectId,
  patientId: ObjectId (ref: 'Patients', required, indexed),
  doctorId: ObjectId (ref: 'Doctors', required, indexed),
  scheduledDate: Date (required),
  scheduledTime: String (required),
  status: String (enum: ['scheduled', 'in-progress', 'completed', 'cancelled'], default: 'scheduled'),
  roomId: String,
  createdAt: Date (default: Date.now),
  startedAt: Date,
  endedAt: Date
}
```

#### OTPs Collection

```javascript
{
  _id: ObjectId,
  email: String (required, indexed),
  otp: String (required),
  createdAt: Date (default: Date.now, expires: 600), // TTL index: 10 minutes
  used: Boolean (default: false)
}
```

#### Feedback Collection

```javascript
{
  _id: ObjectId,
  consultationId: ObjectId (ref: 'Consultations', required, indexed),
  userId: ObjectId (ref: 'Users', required),
  userRole: String (enum: ['patient', 'doctor'], required),
  rating: Number (required, min: 1, max: 5),
  comment: String,
  submittedAt: Date (default: Date.now)
}

// Compound index on consultationId and userRole
```

### Mongoose Schema Definitions

All schemas will include:
- Automatic timestamps (`timestamps: true`)
- Schema validation rules
- Virtual properties where needed
- Pre-save hooks for data processing
- Instance and static methods

## Error Handling

### Backend Error Handling Strategy

#### 1. Error Types

```javascript
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

// Specific error classes
class ValidationError extends AppError {
  constructor(message) {
    super(message, 400);
  }
}

class AuthenticationError extends AppError {
  constructor(message = 'Authentication failed') {
    super(message, 401);
  }
}

class AuthorizationError extends AppError {
  constructor(message = 'Access denied') {
    super(message, 403);
  }
}

class NotFoundError extends AppError {
  constructor(resource) {
    super(`${resource} not found`, 404);
  }
}

class DatabaseError extends AppError {
  constructor(message) {
    super(message, 500);
  }
}
```

#### 2. Global Error Handler Middleware

```javascript
const errorHandler = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    res.status(err.statusCode).json({
      status: err.status,
      error: err,
      message: err.message,
      stack: err.stack
    });
  } else {
    // Production: don't leak error details
    if (err.isOperational) {
      res.status(err.statusCode).json({
        status: err.status,
        message: err.message
      });
    } else {
      console.error('ERROR:', err);
      res.status(500).json({
        status: 'error',
        message: 'Something went wrong'
      });
    }
  }
};
```

#### 3. Async Error Wrapper

```javascript
const catchAsync = (fn) => {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
};
```

#### 4. Validation Error Handling

```javascript
const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    throw new ValidationError(errors.array()[0].msg);
  }
  next();
};
```

### Frontend Error Handling

#### 1. HTTP Interceptor

```typescript
@Injectable()
export class ErrorInterceptor implements HttpInterceptor {
  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    return next.handle(req).pipe(
      catchError((error: HttpErrorResponse) => {
        let errorMessage = 'An error occurred';
        
        if (error.error instanceof ErrorEvent) {
          // Client-side error
          errorMessage = error.error.message;
        } else {
          // Server-side error
          errorMessage = error.error.message || error.message;
        }
        
        // Show user-friendly error message
        this.notificationService.showError(errorMessage);
        
        return throwError(() => new Error(errorMessage));
      })
    );
  }
}
```

#### 2. Service-Level Error Handling

```typescript
login(email: string, password: string): Observable<any> {
  return this.http.post('/api/auth/login', { email, password })
    .pipe(
      catchError(error => {
        if (error.status === 401) {
          return throwError(() => new Error('Invalid credentials'));
        }
        return throwError(() => new Error('Login failed. Please try again.'));
      })
    );
}
```

## Testing Strategy

### Backend Testing

#### 1. Unit Tests

**Tools:** Jest, Supertest

**Coverage:**
- Service layer methods
- Utility functions
- Data validation logic
- Static prediction logic

**Example Test Structure:**
```javascript
describe('Authentication Service', () => {
  describe('signup', () => {
    it('should create a new user with hashed password', async () => {
      // Test implementation
    });
    
    it('should throw error for duplicate email', async () => {
      // Test implementation
    });
  });
});
```

#### 2. Integration Tests

**Coverage:**
- API endpoint responses
- Database operations
- Authentication flow
- Role-based access control

**Example:**
```javascript
describe('POST /api/auth/signup', () => {
  it('should register a new patient', async () => {
    const response = await request(app)
      .post('/api/auth/signup')
      .send({ name: 'Test', email: 'test@test.com', password: 'pass123', role: 'patient' });
    
    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
  });
});
```

#### 3. API Tests

**Tools:** Postman/Newman

**Coverage:**
- All REST endpoints
- Request/response validation
- Error scenarios
- Authentication headers

### Frontend Testing

#### 1. Unit Tests

**Tools:** Jasmine, Karma

**Coverage:**
- Component logic
- Service methods
- Pipes and directives
- Form validation

**Example:**
```typescript
describe('LoginComponent', () => {
  it('should call authService.login on form submit', () => {
    spyOn(authService, 'login');
    component.loginForm.setValue({ email: 'test@test.com', password: 'pass' });
    component.onSubmit();
    expect(authService.login).toHaveBeenCalled();
  });
});
```

#### 2. Integration Tests

**Tools:** Jasmine, Karma

**Coverage:**
- Component-service interaction
- Routing behavior
- Guard functionality

#### 3. End-to-End Tests

**Tools:** Protractor or Cypress

**Coverage:**
- Complete user workflows
- Login to consultation flow
- Doctor subscription flow
- Admin user management

**Example Flow:**
```typescript
describe('Patient Symptom Submission Flow', () => {
  it('should allow patient to submit symptoms and view doctors', () => {
    // Login as patient
    // Navigate to chatbot
    // Enter symptoms
    // Verify disease prediction displayed
    // Verify doctor list displayed
  });
});
```

### Testing Priorities for MVP

**High Priority (Must Test):**
- Authentication and authorization
- Symptom submission and prediction
- Doctor matching logic
- Database CRUD operations

**Medium Priority (Should Test):**
- Messaging functionality
- Consultation scheduling
- Subscription processing

**Low Priority (Nice to Test):**
- Admin metrics calculation
- Feedback aggregation
- UI component rendering

## Security Considerations

### 1. Authentication Security

- Passwords hashed with bcrypt (salt rounds: 10)
- JWT tokens with expiration (24 hours)
- Secure token storage in httpOnly cookies or localStorage with XSS protection
- Token refresh mechanism for extended sessions

### 2. Authorization

- Role-based middleware on all protected routes
- User ownership validation (users can only access their own data)
- Admin-only endpoints protected with role check

### 3. Data Protection

- Input validation on all endpoints using express-validator
- SQL injection prevention through Mongoose parameterized queries
- XSS protection with input sanitization
- CORS configuration to allow only frontend origin

### 4. API Security

- Rate limiting on authentication endpoints
- Request size limits
- HTTPS enforcement in production
- Helmet.js for security headers

### 5. Database Security

- MongoDB connection with authentication
- Environment variables for sensitive credentials
- Database user with minimal required permissions
- Regular backups

## Deployment Considerations

### Development Environment

**Frontend:**
- Run with `ng serve` on `http://localhost:4200`
- Proxy configuration for API calls to backend

**Backend:**
- Run with `nodemon` on `http://localhost:3000`
- Environment variables in `.env` file
- MongoDB local instance or MongoDB Atlas

### Production Environment

**Frontend:**
- Build with `ng build --prod`
- Serve static files through Nginx or CDN
- Environment-specific configuration

**Backend:**
- Process manager (PM2) for Node.js
- Environment variables from hosting platform
- MongoDB Atlas for database
- Load balancing for scalability

**Video Call Service:**
- WebRTC signaling server (can be integrated in Express backend)
- STUN/TURN servers for NAT traversal
- Consider third-party services (Twilio, Agora) for production

## Implementation Notes

### Static Prediction Implementation

For the MVP, the disease prediction will use a simple keyword matching system:

```javascript
const symptomKeywords = {
  fever: ['fever', 'temperature', 'hot'],
  headache: ['headache', 'head pain', 'migraine'],
  cough: ['cough', 'coughing'],
  chest_pain: ['chest pain', 'chest pressure']
};

const diseaseRules = [
  {
    symptoms: ['fever', 'headache', 'cough'],
    disease: 'Influenza',
    confidence: 85,
    specialization: ['General Medicine']
  },
  {
    symptoms: ['chest_pain'],
    disease: 'Angina',
    confidence: 75,
    specialization: ['Cardiology']
  }
];
```

### Video Call Implementation Options

**Option 1: Simple WebRTC with PeerJS**
- Lightweight peer-to-peer connection
- Suitable for MVP
- Requires STUN server configuration

**Option 2: Third-Party Service (Recommended for MVP)**
- Jitsi Meet (Free, open-source)
- Whereby API (Simple integration)
- Daily.co (Easy embed)
- Generate unique room links
- Send links via email to both doctor and patient
- Better reliability and scalability

**Email Video Link Flow:**
```javascript
// When doctor books consultation
const videoLink = generateVideoRoomLink(consultationId);
await emailService.sendConsultationEmail(patientEmail, {
  doctorName,
  patientName,
  date,
  time,
  videoLink
});
await emailService.sendConsultationEmail(doctorEmail, {
  doctorName,
  patientName,
  date,
  time,
  videoLink
});
```

### Subscription Payment Integration

**UPI Payment Integration:**
- Mandatory 30 Rs/month subscription for doctors
- Payment gateway integration with UPI
- Target UPI ID: 9909232769@superyes
- Payment options: Razorpay, PhonePe, or Paytm gateway
- Store payment transaction details in doctor document
- Validate subscription status before granting dashboard access
- Auto-calculate expiry date (30 days from payment)

**Implementation Approach:**
```javascript
// Razorpay Integration Example
const razorpayOptions = {
  amount: 3000, // 30 Rs in paise
  currency: 'INR',
  receipt: `doctor_sub_${doctorId}`,
  notes: {
    upiId: '9909232769@superyes',
    purpose: 'Doctor Monthly Subscription'
  }
};
```

## Future Enhancements (Post-MVP)

1. **Machine Learning Integration**
   - Replace static predictions with trained ML model
   - Adaptive questioning based on symptom patterns

2. **Advanced Features**
   - Digital Health ID with blockchain
   - Smart health reports generation
   - Risk scoring algorithms
   - Preventive health alerts
   - Reward points system

3. **Scalability**
   - Microservices architecture
   - Redis caching layer
   - Message queue for async processing
   - CDN for static assets

4. **Analytics**
   - Doctor performance analytics
   - Patient engagement metrics
   - Disease trend analysis
   - Platform usage dashboards
