# Hospital Feature - Requirements & Design Specification

## 📋 Overview

Enable hospitals to register, get verified by admin, and access patient medical data via API for emergency situations.

## 🎯 Goals

1. Allow hospitals to register and get verified
2. Provide secure API access to patient medical records
3. Store comprehensive patient health data
4. Extract symptoms from chat history automatically
5. Enhance UI/UX with professional design

## 👥 User Stories

### Hospital User Stories

**As a Hospital Administrator, I want to:**
- Register my hospital with complete details
- Wait for admin verification
- Receive API credentials via email after verification
- Access patient medical data using API credentials
- View patient's emergency information quickly

### Admin User Stories

**As an Admin, I want to:**
- View all hospital registration requests
- Verify or reject hospital applications
- Generate and send API credentials automatically
- Revoke hospital access if needed
- Monitor hospital API usage

### Patient User Stories

**As a Patient, I want to:**
- Have my medical history stored securely
- Know that hospitals can access my data in emergencies
- Have my symptoms automatically extracted from chats
- Store comprehensive health records

## 🔧 Functional Requirements

### 1. Hospital Registration & Management

#### 1.1 Hospital Registration
- **Input Fields:**
  - Contact Person Name
  - Email (unique)
  - Password
  - Hospital Name
  - Registration Number (unique)
  - Address (street, city, state, zip, country)
  - Contact Number
  - Emergency Contact
  - Website (optional)
  - Specializations (multi-select)
  - Number of Beds
  - Facilities (multi-select)
  - Documents Upload (registration certificate, license, etc.)

- **Validation:**
  - Email must be unique and valid
  - Registration number must be unique
  - Password minimum 8 characters
  - All required fields must be filled

- **Process:**
  1. Hospital submits registration form
  2. Status set to "pending"
  3. Admin receives notification
  4. Hospital receives confirmation email

#### 1.2 Hospital Verification (Admin)
- **Actions:**
  - View all pending hospitals
  - Review hospital details and documents
  - Verify or Reject application
  - Add rejection reason if rejecting

- **Verification Process:**
  1. Admin reviews application
  2. Admin clicks "Verify"
  3. System generates API credentials:
     - API Key: `HK_[32-char-hex]`
     - API Secret: `[64-char-hex]`
  4. Email sent to hospital with credentials
  5. Hospital status changed to "verified"

#### 1.3 Hospital Login
- **Credentials:** Email + Password
- **Access Control:**
  - Only verified hospitals can login
  - Pending hospitals see "waiting for verification" message
  - Rejected hospitals see rejection reason

### 2. Patient Medical Records Enhancement

#### 2.1 Basic Information (Existing)
- Name, Email, DOB, Gender
- Blood Group ⭐ (Critical for emergencies)
- Contact Number, Address

#### 2.2 Emergency Information ⭐
- Emergency Contact:
  - Name
  - Relationship
  - Phone Number

#### 2.3 Medical History
- **Chronic Conditions:**
  - Condition name
  - Diagnosed date
  - Notes

- **Current Medications:**
  - Medication name
  - Dosage
  - Frequency
  - Start date
  - Prescribed by

- **Past Surgeries:**
  - Surgery type
  - Date
  - Hospital
  - Notes

- **Allergies:** ⭐ (Critical)
  - List of allergies

- **Vaccinations:**
  - Vaccine name
  - Date administered
  - Next due date

#### 2.4 Extracted Symptoms (Auto-generated)
- **Source:** Chat messages with doctors
- **Extraction Method:** Keyword matching
- **Keywords:** fever, cough, headache, pain, nausea, vomiting, diarrhea, fatigue, weakness, dizziness, chest pain, shortness of breath, sore throat, etc.
- **Storage:**
  - Symptom name
  - Extracted from (chat/consultation/manual)
  - Extracted date
  - Related case ID

#### 2.5 Vital Signs History
- Blood Pressure (systolic/diastolic)
- Heart Rate
- Temperature
- Weight, Height, BMI
- Oxygen Saturation
- Recorded date

#### 2.6 Lab Results
- Test name
- Result value
- Unit
- Normal range
- Date
- Ordered by
- Notes

### 3. Hospital API Access

#### 3.1 API Endpoint
```
POST /api/hospitals/api/patient-data
```

#### 3.2 Request Format
```json
{
  "apiKey": "HK_abc123...",
  "apiSecret": "secret123...",
  "patientEmail": "patient@example.com"
}
```

#### 3.3 Response Format
```json
{
  "success": true,
  "patient": {
    "id": "...",
    "name": "John Doe",
    "age": 35,
    "bloodGroup": "O+",
    "allergies": ["Penicillin", "Peanuts"],
    "emergencyContact": {
      "name": "Jane Doe",
      "relationship": "Spouse",
      "phone": "+1234567890"
    },
    "chronicConditions": [...],
    "currentMedications": [...],
    "pastSurgeries": [...],
    "extractedSymptoms": [...],
    "vitalSigns": [...],
    "labResults": [...],
    "recentCases": [...]
  },
  "accessedBy": {
    "hospital": "City Hospital",
    "accessTime": "2024-11-18T10:30:00Z"
  }
}
```

#### 3.4 Security
- API Key + Secret authentication
- Rate limiting: 100 requests per hour per hospital
- Access logging for audit trail
- Only verified and active hospitals can access
- HTTPS only

### 4. UI/UX Enhancements

#### 4.1 Login & Signup Pages
- **Background:** Doctor/medical professional image
- **Logo:** Healthcare Platform logo (top-left)
- **Design:** Modern, clean, professional
- **Colors:** Medical theme (blues, greens, white)
- **Layout:** Split screen (form on left, image on right)

#### 4.2 Hospital Dashboard
- **Sections:**
  - API Credentials display
  - API usage statistics
  - Recent patient data requests
  - Hospital profile
  - Documentation

#### 4.3 Admin Hospital Management
- **Sections:**
  - Pending hospitals (with count badge)
  - Verified hospitals
  - Rejected hospitals
  - Hospital details modal
  - Verify/Reject actions

## 🎨 Design Requirements

### Color Palette
- Primary: `#667eea` (Purple-blue)
- Secondary: `#10b981` (Green - for verified)
- Danger: `#ef4444` (Red - for rejected)
- Warning: `#f59e0b` (Orange - for pending)
- Background: `#f5f5f5`
- Text: `#333333`

### Typography
- Font Family: 'Inter', 'Segoe UI', sans-serif
- Headings: Bold, 24-32px
- Body: Regular, 14-16px
- Small text: 12-13px

### Components
- Cards with shadow and rounded corners
- Gradient buttons
- Status badges (pending/verified/rejected)
- Loading spinners
- Toast notifications
- Modal dialogs

## 🔒 Security Requirements

1. **Authentication:**
   - JWT tokens for hospital login
   - API Key + Secret for API access
   - Bcrypt password hashing

2. **Authorization:**
   - Role-based access control
   - Only verified hospitals can access API
   - Admin-only verification actions

3. **Data Protection:**
   - HTTPS only
   - API credentials encrypted in database
   - Audit logging for all API access
   - Rate limiting to prevent abuse

4. **Privacy:**
   - Patient consent implied by registration
   - Access logging for transparency
   - Hospital information in access logs

## 📊 Success Metrics

1. Hospital registration completion rate
2. Admin verification time (target: < 24 hours)
3. API response time (target: < 500ms)
4. API error rate (target: < 1%)
5. Patient data completeness (target: > 80%)

## 🚀 Implementation Priority

### Phase 1: Core Backend (High Priority)
- ✅ Hospital model
- ✅ Enhanced patient model
- ✅ Hospital controllers
- ✅ Admin controllers
- ✅ Email service
- ⏳ Routes
- ⏳ Middleware
- ⏳ API authentication

### Phase 2: Admin Interface (High Priority)
- Hospital list view
- Verification workflow
- Hospital details modal
- Status management

### Phase 3: Hospital Interface (Medium Priority)
- Registration form
- Login page
- Dashboard
- API documentation page

### Phase 4: UI Enhancement (Medium Priority)
- Add logo
- Add doctor images
- Redesign login/signup
- Improve overall aesthetics

### Phase 5: Advanced Features (Low Priority)
- Symptom extraction from AI
- Real-time notifications
- API analytics dashboard
- Bulk patient data export

## 📝 Acceptance Criteria

### Hospital Registration
- [ ] Hospital can register with all required fields
- [ ] Duplicate email/registration number is rejected
- [ ] Status is set to "pending" after registration
- [ ] Confirmation email is sent

### Admin Verification
- [ ] Admin can view all pending hospitals
- [ ] Admin can verify hospital
- [ ] API credentials are generated automatically
- [ ] Email with credentials is sent to hospital
- [ ] Admin can reject with reason

### Hospital API Access
- [ ] Hospital can authenticate with API credentials
- [ ] Patient data is returned in correct format
- [ ] All medical records are included
- [ ] Symptoms are extracted from chats
- [ ] Access is logged for audit

### UI Enhancement
- [ ] Login page has doctor background image
- [ ] Logo is visible on all pages
- [ ] Design is modern and professional
- [ ] Mobile responsive
- [ ] Loading states are shown

## 🧪 Testing Requirements

1. **Unit Tests:**
   - Hospital model validation
   - API credential generation
   - Symptom extraction logic

2. **Integration Tests:**
   - Hospital registration flow
   - Verification workflow
   - API authentication
   - Patient data retrieval

3. **E2E Tests:**
   - Complete hospital registration to API access
   - Admin verification process
   - Emergency patient data access

## 📚 Documentation Requirements

1. **API Documentation:**
   - Endpoint details
   - Request/response examples
   - Error codes
   - Rate limits

2. **User Guides:**
   - Hospital registration guide
   - Admin verification guide
   - API integration guide

3. **Developer Documentation:**
   - Architecture overview
   - Database schema
   - Security considerations
