# Hospital Feature - Design Document

## 🏗️ Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                        Frontend (Angular)                    │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Hospital   │  │    Admin     │  │   Patient    │      │
│  │  Interface   │  │  Interface   │  │  Interface   │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ HTTP/REST API
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                     Backend (Node.js/Express)                │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Hospital   │  │    Admin     │  │   Patient    │      │
│  │  Controller  │  │  Controller  │  │  Controller  │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
│                                                               │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │     Auth     │  │   Symptom    │  │    Email     │      │
│  │  Middleware  │  │  Extractor   │  │   Service    │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                      Database (MongoDB)                      │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Hospital   │  │   Patient    │  │     Case     │      │
│  │  Collection  │  │  Collection  │  │  Collection  │      │
│  └──────────────┘  └──────────────┘  └──────────────┘      │
└─────────────────────────────────────────────────────────────┘
```

## 📊 Database Schema

### Hospital Collection
```javascript
{
  _id: ObjectId,
  name: String,                    // Contact person name
  email: String (unique),          // Login email
  password: String (hashed),       // Bcrypt hashed
  hospitalName: String,            // Hospital name
  registrationNumber: String (unique),
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String
  },
  contactNumber: String,
  emergencyContact: String,
  website: String,
  specializations: [String],
  numberOfBeds: Number,
  facilities: [String],
  
  // Verification
  verificationStatus: String,      // 'pending' | 'verified' | 'rejected'
  verifiedAt: Date,
  verifiedBy: ObjectId (Admin),
  rejectionReason: String,
  
  // API Credentials
  apiKey: String (unique),         // HK_[32-char-hex]
  apiSecret: String (hashed),      // 64-char-hex
  apiKeyGeneratedAt: Date,
  
  // Tracking
  lastApiAccess: Date,
  apiAccessCount: Number,
  isActive: Boolean,
  
  createdAt: Date,
  updatedAt: Date
}
```

### Enhanced Patient Collection
```javascript
{
  _id: ObjectId,
  // ... existing fields ...
  
  // Emergency Information
  emergencyContact: {
    name: String,
    relationship: String,
    phone: String
  },
  
  // Medical History
  chronicConditions: [{
    condition: String,
    diagnosedDate: Date,
    notes: String
  }],
  
  currentMedications: [{
    name: String,
    dosage: String,
    frequency: String,
    startDate: Date,
    prescribedBy: String
  }],
  
  pastSurgeries: [{
    surgery: String,
    date: Date,
    hospital: String,
    notes: String
  }],
  
  vaccinations: [{
    vaccine: String,
    date: Date,
    nextDue: Date
  }],
  
  // Auto-extracted from chats
  extractedSymptoms: [{
    symptom: String,
    extractedFrom: String,        // 'chat' | 'consultation' | 'manual'
    extractedAt: Date,
    caseId: ObjectId (Case)
  }],
  
  // Vital Signs
  vitalSigns: [{
    recordedAt: Date,
    bloodPressure: {
      systolic: Number,
      diastolic: Number
    },
    heartRate: Number,
    temperature: Number,
    weight: Number,
    height: Number,
    bmi: Number,
    oxygenSaturation: Number
  }],
  
  // Lab Results
  labResults: [{
    testName: String,
    result: String,
    unit: String,
    normalRange: String,
    date: Date,
    orderedBy: String,
    notes: String
  }]
}
```

## 🔐 Security Architecture

### Authentication Flow

#### Hospital Login
```
1. Hospital enters email + password
2. Backend validates credentials
3. Check verification status
4. Generate JWT token (7 days expiry)
5. Return token + hospital data
```

#### Hospital API Access
```
1. Hospital sends API Key + Secret
2. Backend validates credentials
3. Check verification status & active status
4. Check rate limit
5. Log access
6. Return patient data
```

### API Credential Generation
```javascript
// API Key format
apiKey = "HK_" + crypto.randomBytes(16).toString('hex')
// Example: HK_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6

// API Secret format
apiSecret = crypto.randomBytes(32).toString('hex')
// Example: a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6
```

### Rate Limiting
- **Limit:** 100 requests per hour per hospital
- **Implementation:** Redis or in-memory store
- **Response:** 429 Too Many Requests
- **Headers:**
  - `X-RateLimit-Limit: 100`
  - `X-RateLimit-Remaining: 95`
  - `X-RateLimit-Reset: 1637251200`

## 🎨 UI/UX Design

### Color System
```scss
// Primary Colors
$primary: #667eea;           // Purple-blue
$primary-dark: #5568d3;
$primary-light: #7c8ef5;

// Status Colors
$success: #10b981;           // Green (verified)
$warning: #f59e0b;           // Orange (pending)
$danger: #ef4444;            // Red (rejected)
$info: #3b82f6;              // Blue

// Neutral Colors
$gray-50: #f9fafb;
$gray-100: #f3f4f6;
$gray-200: #e5e7eb;
$gray-300: #d1d5db;
$gray-400: #9ca3af;
$gray-500: #6b7280;
$gray-600: #4b5563;
$gray-700: #374151;
$gray-800: #1f2937;
$gray-900: #111827;

// Background
$bg-primary: #ffffff;
$bg-secondary: #f5f5f5;
$bg-tertiary: #f9fafb;
```

### Typography
```scss
// Font Family
$font-primary: 'Inter', 'Segoe UI', -apple-system, sans-serif;
$font-mono: 'Fira Code', 'Courier New', monospace;

// Font Sizes
$text-xs: 0.75rem;      // 12px
$text-sm: 0.875rem;     // 14px
$text-base: 1rem;       // 16px
$text-lg: 1.125rem;     // 18px
$text-xl: 1.25rem;      // 20px
$text-2xl: 1.5rem;      // 24px
$text-3xl: 1.875rem;    // 30px
$text-4xl: 2.25rem;     // 36px

// Font Weights
$font-normal: 400;
$font-medium: 500;
$font-semibold: 600;
$font-bold: 700;
```

### Spacing System
```scss
$spacing-1: 0.25rem;    // 4px
$spacing-2: 0.5rem;     // 8px
$spacing-3: 0.75rem;    // 12px
$spacing-4: 1rem;       // 16px
$spacing-5: 1.25rem;    // 20px
$spacing-6: 1.5rem;     // 24px
$spacing-8: 2rem;       // 32px
$spacing-10: 2.5rem;    // 40px
$spacing-12: 3rem;      // 48px
```

### Component Designs

#### Login Page Layout
```
┌─────────────────────────────────────────────────────────┐
│  [Logo]                                                  │
├──────────────────────┬──────────────────────────────────┤
│                      │                                   │
│   Login Form         │     Doctor Image                  │
│   ┌────────────┐     │     (Background)                  │
│   │ Email      │     │                                   │
│   ├────────────┤     │                                   │
│   │ Password   │     │                                   │
│   ├────────────┤     │                                   │
│   │ [Login]    │     │                                   │
│   └────────────┘     │                                   │
│                      │                                   │
│   Don't have account?│                                   │
│   [Sign Up]          │                                   │
│                      │                                   │
└──────────────────────┴──────────────────────────────────┘
```

#### Hospital Dashboard Layout
```
┌─────────────────────────────────────────────────────────┐
│  [Logo]  Hospital Dashboard              [Profile] [⚙]  │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  Welcome, City Hospital                                 │
│                                                          │
│  ┌──────────────────┐  ┌──────────────────┐            │
│  │ API Credentials  │  │  API Usage       │            │
│  │ Key: HK_abc...   │  │  95/100 requests │            │
│  │ [Copy]           │  │  [View Details]  │            │
│  └──────────────────┘  └──────────────────┘            │
│                                                          │
│  ┌────────────────────────────────────────────────────┐ │
│  │ Recent API Requests                                │ │
│  │ ┌────────────────────────────────────────────────┐ │ │
│  │ │ Patient: John Doe | Time: 10:30 AM | Success  │ │ │
│  │ │ Patient: Jane Smith | Time: 09:15 AM | Success│ │ │
│  │ └────────────────────────────────────────────────┘ │ │
│  └────────────────────────────────────────────────────┘ │
│                                                          │
│  [API Documentation] [Profile Settings]                 │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

#### Admin Hospital Management
```
┌─────────────────────────────────────────────────────────┐
│  Hospital Management                                     │
├─────────────────────────────────────────────────────────┤
│  [Pending: 5] [Verified: 23] [Rejected: 2]             │
│                                                          │
│  ┌────────────────────────────────────────────────────┐ │
│  │ City Hospital                    [Pending]         │ │
│  │ Registration: REG123456                            │ │
│  │ Email: contact@cityhospital.com                    │ │
│  │ [View Details] [Verify] [Reject]                   │ │
│  ├────────────────────────────────────────────────────┤ │
│  │ General Hospital                 [Verified]        │ │
│  │ Registration: REG789012                            │ │
│  │ Email: admin@generalhospital.com                   │ │
│  │ [View Details] [Revoke Access]                     │ │
│  └────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────┘
```

## 🔄 Data Flow Diagrams

### Hospital Registration Flow
```
Hospital                Backend              Database           Email
   │                       │                    │                │
   │──Register Form───────>│                    │                │
   │                       │──Save Hospital────>│                │
   │                       │<──Hospital ID──────│                │
   │                       │──Send Confirmation─────────────────>│
   │<──Success Message─────│                    │                │
   │                       │                    │                │
```

### Hospital Verification Flow
```
Admin                  Backend              Database           Email
   │                       │                    │                │
   │──Click Verify────────>│                    │                │
   │                       │──Generate API Keys─│                │
   │                       │──Update Status────>│                │
   │                       │<──Success──────────│                │
   │                       │──Send Credentials──────────────────>│
   │<──Success Message─────│                    │                │
   │                       │                    │                │
```

### Patient Data API Flow
```
Hospital               Backend              Database           Patient
   │                       │                    │                │
   │──API Request─────────>│                    │                │
   │  (Key + Secret)       │──Validate Creds───│                │
   │                       │──Check Rate Limit──│                │
   │                       │──Get Patient Data─>│                │
   │                       │<──Patient Record───│                │
   │                       │──Get Cases────────>│                │
   │                       │<──Case History─────│                │
   │                       │──Log Access───────>│                │
   │<──Patient Data────────│                    │                │
   │                       │                    │                │
```

## 🧩 Component Structure

### Frontend Components

```
src/app/
├── components/
│   ├── hospital/
│   │   ├── hospital-register/
│   │   │   ├── hospital-register.component.ts
│   │   │   ├── hospital-register.component.html
│   │   │   └── hospital-register.component.css
│   │   ├── hospital-login/
│   │   ├── hospital-dashboard/
│   │   └── hospital-api-docs/
│   │
│   └── admin/
│       └── admin-hospitals/
│           ├── admin-hospitals.component.ts
│           ├── admin-hospitals.component.html
│           ├── admin-hospitals.component.css
│           └── hospital-details-modal/
│
├── services/
│   ├── hospital.service.ts
│   └── symptom-extractor.service.ts
│
├── guards/
│   └── hospital.guard.ts
│
└── models/
    └── hospital.model.ts
```

### Backend Structure

```
backend/
├── models/
│   ├── Hospital.js ✅
│   └── Patient.js ✅ (enhanced)
│
├── controllers/
│   ├── hospitalController.js ✅
│   └── hospitalAdminController.js ✅
│
├── routes/
│   ├── hospitalRoutes.js (TODO)
│   └── hospitalAdminRoutes.js (TODO)
│
├── middleware/
│   ├── hospitalApiAuth.js (TODO)
│   └── rateLimiter.js (TODO)
│
└── services/
    ├── emailService.js ✅ (enhanced)
    └── symptomExtractor.js (TODO)
```

## 📱 Responsive Design Breakpoints

```scss
// Mobile First Approach
$breakpoint-sm: 640px;   // Small devices
$breakpoint-md: 768px;   // Medium devices
$breakpoint-lg: 1024px;  // Large devices
$breakpoint-xl: 1280px;  // Extra large devices
$breakpoint-2xl: 1536px; // 2X Extra large devices
```

## 🎯 Performance Considerations

1. **Database Indexing:**
   - Index on `Hospital.email`
   - Index on `Hospital.apiKey`
   - Index on `Patient.email`
   - Compound index on `Hospital.verificationStatus` + `createdAt`

2. **Caching:**
   - Cache hospital verification status
   - Cache patient data for 5 minutes
   - Cache API rate limits in Redis

3. **Lazy Loading:**
   - Lazy load hospital dashboard components
   - Lazy load admin hospital management
   - Image lazy loading

4. **API Optimization:**
   - Pagination for hospital lists
   - Limit patient data response size
   - Use projection to return only needed fields

## 🔍 Monitoring & Logging

### Metrics to Track
- Hospital registration rate
- Verification time (admin response time)
- API request count per hospital
- API response time
- API error rate
- Patient data access frequency

### Logs to Capture
- Hospital registration attempts
- Verification actions
- API access logs (who, when, which patient)
- Failed authentication attempts
- Rate limit violations

## 🚀 Deployment Considerations

1. **Environment Variables:**
   - `JWT_SECRET` - For token generation
   - `API_RATE_LIMIT` - Requests per hour
   - `EMAIL_USER` - For sending credentials
   - `EMAIL_PASSWORD` - Email service password

2. **Database Migrations:**
   - Add new fields to Patient collection
   - Create Hospital collection
   - Create indexes

3. **Backward Compatibility:**
   - Existing patients work without new fields
   - Gradual rollout of symptom extraction
   - Optional emergency contact initially
