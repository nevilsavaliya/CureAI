# Doctor Login Test Guide

## Overview

This guide helps you verify that doctors appearing in the patient's matched doctor list can successfully log in to the system.

## Prerequisites

1. Backend server running on `http://localhost:3000`
2. Frontend server running on `http://localhost:4200`
3. MongoDB running

## Step-by-Step Testing

### Step 1: Clean Database (Optional)

```bash
cd backend
npm run clean
```

This removes all existing users so you can start fresh.

### Step 2: Create Test Doctor

#### Option A: Via Frontend Signup

1. Open `http://localhost:4200/signup`
2. Select "Doctor" role
3. Fill in the form:
   - **Name**: Dr. Test Doctor
   - **Email**: testdoctor@example.com
   - **Password**: test123
   - **Confirm Password**: test123
   - **Date of Birth**: 1980-01-01
   - **Degree**: MBBS, MD
   - **Speciality**: General Medicine (or comma-separated: "General Medicine, Internal Medicine")
   - **Experience Years**: 10
4. Click "Sign Up"
5. You'll be redirected to subscription page

#### Option B: Via API (Postman/cURL)

```bash
curl -X POST http://localhost:3000/api/auth/signup/doctor \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Dr. Test Doctor",
    "email": "testdoctor@example.com",
    "password": "test123",
    "confirmPassword": "test123",
    "dateOfBirth": "1980-01-01",
    "degree": "MBBS, MD",
    "specializations": ["General Medicine", "Internal Medicine", "Infectious Disease"],
    "experienceYears": 10
  }'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Doctor registered successfully. Please complete subscription to access dashboard.",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "userId": "...",
    "name": "Dr. Test Doctor",
    "email": "testdoctor@example.com",
    "role": "doctor",
    "subscriptionStatus": "pending"
  }
}
```

### Step 3: Activate Doctor Subscription

The doctor needs an active subscription to appear in patient's list.

#### Option A: Via MongoDB Directly

```javascript
// Connect to MongoDB
mongo healthcare-platform

// Update doctor subscription
db.doctors.updateOne(
  { email: "testdoctor@example.com" },
  {
    $set: {
      subscriptionStatus: "active",
      subscriptionStartDate: new Date(),
      subscriptionExpiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    }
  }
)
```

#### Option B: Via Payment Flow (Frontend)

1. Login as doctor
2. Complete the subscription payment
3. Subscription will be activated

### Step 4: Verify Doctor Appears in Patient List

1. **Create/Login as Patient**
   - Email: testpatient@example.com
   - Password: test123

2. **Submit Symptoms**
   - Go to patient dashboard
   - Enter symptoms: "I have fever, headache, and body pain"
   - Submit

3. **Check Doctor List**
   - After symptom analysis, you should see "Dr. Test Doctor" in the matched doctors list
   - The doctor should have:
     - ✅ Active subscription status
     - ✅ Matching specializations
     - ✅ Match score displayed

### Step 5: Test Doctor Login

1. **Logout from Patient Account**

2. **Login as Doctor**
   - Go to `http://localhost:4200/login`
   - Email: testdoctor@example.com
   - Password: test123
   - Click "Login"

3. **Verify Successful Login**
   - Should redirect to `/doctor/dashboard`
   - Should see doctor dashboard with:
     - Patient messages
     - Consultation booking options
     - Profile information

### Step 6: Verify Doctor Can Interact

1. **Check Messages**
   - Doctor should see messages from patients
   - Can reply to messages

2. **Book Consultation**
   - Select a patient
   - Book a consultation
   - Verify email sent

3. **View Profile**
   - Check specializations are displayed correctly
   - Verify subscription status is "active"

## Troubleshooting

### Doctor Not Appearing in Patient List

**Problem**: Doctor doesn't show up after symptom submission

**Solutions**:
1. Check subscription status:
   ```javascript
   db.doctors.findOne({ email: "testdoctor@example.com" })
   ```
   - `subscriptionStatus` should be "active"
   - `isActive` should be true

2. Check specializations match:
   ```javascript
   // Doctor's specializations
   db.doctors.findOne(
     { email: "testdoctor@example.com" },
     { specializations: 1 }
   )
   
   // Patient's recommended specializations
   db.predictions.findOne(
     { patientId: ObjectId("...") },
     { recommendedSpecializations: 1 }
   ).sort({ createdAt: -1 })
   ```

3. Verify doctor matching API:
   ```bash
   curl -X GET "http://localhost:3000/api/doctors/match?specializations=General Medicine,Internal Medicine" \
     -H "Authorization: Bearer <patient_token>"
   ```

### Doctor Cannot Login

**Problem**: Login fails with "Invalid credentials"

**Solutions**:
1. Verify email and password are correct
2. Check doctor exists in database:
   ```javascript
   db.doctors.findOne({ email: "testdoctor@example.com" })
   ```
3. Try password reset if needed

### Doctor Login Redirects to Subscription Page

**Problem**: Doctor logs in but redirected to subscription page

**Solution**: Activate subscription (see Step 3)

### Frontend Shows "Speciality" Instead of "Specializations"

**Problem**: UI shows single speciality field

**Solution**: The backend now supports both:
- Single speciality (backward compatible)
- Multiple specializations (new feature)

Frontend can be updated to show multiple specializations, but backend will work with both.

## API Endpoints Reference

### Doctor Signup
```
POST /api/auth/signup/doctor
Body: {
  name, email, password, confirmPassword,
  dateOfBirth, degree, experienceYears,
  specializations: ["spec1", "spec2"] OR speciality: "spec1"
}
```

### Doctor Login
```
POST /api/auth/login
Body: { email, password }
```

### Get Matched Doctors
```
GET /api/doctors/match?specializations=spec1,spec2
Headers: Authorization: Bearer <token>
```

### Get All Specializations
```
GET /api/doctors/specializations
```

## Database Queries

### Check Doctor Details
```javascript
db.doctors.findOne({ email: "testdoctor@example.com" })
```

### Update Doctor Subscription
```javascript
db.doctors.updateOne(
  { email: "testdoctor@example.com" },
  { $set: { subscriptionStatus: "active" } }
)
```

### Check All Active Doctors
```javascript
db.doctors.find({
  subscriptionStatus: "active",
  isActive: true
}).pretty()
```

### View Doctor Specializations
```javascript
db.doctors.find(
  {},
  { name: 1, email: 1, specializations: 1, subscriptionStatus: 1 }
).pretty()
```

## Success Criteria

✅ Doctor can sign up with multiple specializations
✅ Doctor appears in patient's matched doctor list
✅ Doctor can log in with email and password
✅ Doctor is redirected to dashboard after login
✅ Doctor can view and interact with patients
✅ Doctor's specializations match predicted diseases

## Next Steps

After verifying doctor login works:

1. **Test Multiple Doctors**
   - Create 3-5 doctors with different specializations
   - Verify matching algorithm ranks them correctly

2. **Test Different Symptoms**
   - Try various symptom combinations
   - Verify appropriate doctors are matched

3. **Test Full Workflow**
   - Patient submits symptoms
   - Patient sees matched doctors
   - Patient messages doctor
   - Doctor logs in and responds
   - Doctor books consultation

4. **Update Frontend**
   - Add multi-select for specializations in signup
   - Display all specializations in doctor cards
   - Show match scores to patients

## Summary

The system now supports:
- ✅ Doctors with multiple specializations
- ✅ ML-based doctor matching
- ✅ Doctor login and authentication
- ✅ Backward compatibility with single speciality

All doctors appearing in the patient's list can successfully log in and access their dashboard!
