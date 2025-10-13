# Hospital Registration - Manual Testing Guide

## 🧪 Test Scenarios

### Test 1: Successful Registration Flow

#### Prerequisites
- Backend server running on `http://localhost:3000`
- Frontend server running on `http://localhost:4200`
- MongoDB connected

#### Steps
1. Navigate to `http://localhost:4200/hospital/register`
2. **Step 1 - Basic Information**:
   - Enter name: "John Doe"
   - Enter email: "test.hospital@example.com"
   - Enter password: "SecurePass123!"
   - Confirm password: "SecurePass123!"
   - Click "Next"
   
3. **Step 2 - Hospital Details**:
   - Enter hospital name: "City General Hospital"
   - Enter registration number: "REG123456"
   - Enter number of beds: "200"
   - Enter website: "https://cityhospital.com" (optional)
   - Click "Next"
   
4. **Step 3 - Contact & Address**:
   - Enter contact number: "+1234567890"
   - Enter emergency contact: "+0987654321"
   - Enter street: "123 Main Street"
   - Enter city: "New York"
   - Enter state: "NY"
   - Enter ZIP code: "10001"
   - Enter country: "USA"
   - Click "Next"
   
5. **Step 4 - Specializations & Facilities**:
   - Select at least one specialization (e.g., "Cardiology", "Emergency Medicine")
   - Select facilities (optional, e.g., "ICU", "Emergency Room")
   - Click "Next"
   
6. **Step 5 - Document Upload**:
   - Upload at least one document (PDF, JPG, or PNG)
   - Verify file appears in uploaded files list
   - Click "Submit Registration"

#### Expected Results
- ✅ Success message displayed
- ✅ Confirmation email sent to the provided email
- ✅ Hospital record created in database with status "pending"
- ✅ Documents saved to `backend/uploads/hospital-documents/`
- ✅ "Go to Login" button appears
- ✅ Next steps clearly displayed

#### Backend Verification
```bash
# Check MongoDB for the new hospital
mongo
use healthcare_db
db.hospitals.find({ email: "test.hospital@example.com" })

# Expected output:
# {
#   _id: ObjectId("..."),
#   name: "John Doe",
#   email: "test.hospital@example.com",
#   hospitalName: "City General Hospital",
#   registrationNumber: "REG123456",
#   verificationStatus: "pending",
#   ...
# }
```

---

### Test 2: Form Validation

#### Test 2.1: Empty Required Fields
1. Navigate to registration page
2. Click "Next" without filling any fields
3. **Expected**: Error messages appear for all required fields

#### Test 2.2: Invalid Email Format
1. Enter email: "invalid-email"
2. Move to next field
3. **Expected**: "Please enter a valid email" error

#### Test 2.3: Weak Password
1. Enter password: "123"
2. **Expected**: 
   - Password strength indicator shows "Weak"
   - Red color indicator
   - Error message about minimum 8 characters

#### Test 2.4: Password Mismatch
1. Enter password: "SecurePass123!"
2. Enter confirm password: "DifferentPass123!"
3. Click "Next"
4. **Expected**: "Passwords do not match" error

#### Test 2.5: Invalid Phone Number
1. Enter contact number: "abc123"
2. **Expected**: "Please enter a valid phone number" error

#### Test 2.6: Invalid ZIP Code
1. Enter ZIP code: "abc"
2. **Expected**: "Please enter a valid ZIP code" error

#### Test 2.7: Invalid Website URL
1. Enter website: "not-a-url"
2. **Expected**: "Please enter a valid URL" error

#### Test 2.8: No Specialization Selected
1. Complete steps 1-3
2. On step 4, don't select any specialization
3. Click "Next"
4. **Expected**: "Please select at least one specialization" error

#### Test 2.9: No Document Uploaded
1. Complete steps 1-4
2. On step 5, don't upload any document
3. Click "Submit Registration"
4. **Expected**: "Please upload at least one document" error

---

### Test 3: File Upload Validation

#### Test 3.1: Invalid File Type
1. Try to upload a .txt or .doc file
2. **Expected**: Error message "Only PDF, JPG, and PNG files are allowed"

#### Test 3.2: File Too Large
1. Try to upload a file larger than 10MB
2. **Expected**: Error message "File size too large. Maximum size is 10MB"

#### Test 3.3: Multiple Files
1. Upload 3 different documents (PDF, JPG, PNG)
2. **Expected**: All files appear in the uploaded files list
3. Click remove button on one file
4. **Expected**: File removed from list

#### Test 3.4: Duplicate File
1. Upload a file
2. Try to upload the same file again
3. **Expected**: Warning message "File already uploaded"

---

### Test 4: Duplicate Registration Prevention

#### Test 4.1: Duplicate Email
1. Complete registration with email "test@example.com"
2. Try to register again with same email
3. **Expected**: Error "Hospital with this email or registration number already exists"

#### Test 4.2: Duplicate Registration Number
1. Complete registration with registration number "REG123"
2. Try to register again with same registration number but different email
3. **Expected**: Error "Hospital with this email or registration number already exists"

---

### Test 5: Navigation and Progress

#### Test 5.1: Progress Bar
1. Start registration
2. Observe progress bar at each step
3. **Expected**: 
   - Step 1: 20% complete
   - Step 2: 40% complete
   - Step 3: 60% complete
   - Step 4: 80% complete
   - Step 5: 100% complete

#### Test 5.2: Step Indicators
1. Navigate through steps
2. **Expected**:
   - Current step highlighted in purple
   - Completed steps show green checkmark
   - Future steps grayed out

#### Test 5.3: Previous Button
1. Navigate to step 3
2. Click "Previous"
3. **Expected**: Returns to step 2 with data preserved

#### Test 5.4: Data Persistence
1. Fill out step 1
2. Navigate to step 2
3. Go back to step 1
4. **Expected**: All previously entered data still present

---

### Test 6: Password Features

#### Test 6.1: Password Visibility Toggle
1. Enter password
2. Click eye icon
3. **Expected**: Password becomes visible
4. Click again
5. **Expected**: Password hidden again

#### Test 6.2: Password Strength Indicator
1. Enter "pass" → **Expected**: Weak (red)
2. Enter "password123" → **Expected**: Medium (orange)
3. Enter "SecureP@ss123!" → **Expected**: Strong (green)

---

### Test 7: Responsive Design

#### Test 7.1: Mobile View (< 480px)
1. Resize browser to mobile width
2. **Expected**:
   - Single column layout
   - Step labels simplified
   - Buttons stack vertically
   - Form fields full width

#### Test 7.2: Tablet View (768px)
1. Resize browser to tablet width
2. **Expected**:
   - Adjusted spacing
   - Readable text
   - Touch-friendly buttons

---

### Test 8: Backend API Testing

#### Test 8.1: Direct API Call
```bash
curl -X POST http://localhost:3000/api/hospitals/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Jane Smith",
    "email": "api.test@example.com",
    "password": "SecurePass123!",
    "hospitalName": "API Test Hospital",
    "registrationNumber": "API123456",
    "contactNumber": "+1234567890",
    "emergencyContact": "+0987654321",
    "address": {
      "street": "456 Test St",
      "city": "Boston",
      "state": "MA",
      "zipCode": "02101",
      "country": "USA"
    },
    "specializations": ["Cardiology"],
    "numberOfBeds": 150
  }'
```

**Expected Response**:
```json
{
  "success": true,
  "message": "Hospital registered successfully. Your application is pending admin verification.",
  "hospital": {
    "id": "...",
    "name": "Jane Smith",
    "hospitalName": "API Test Hospital",
    "email": "api.test@example.com",
    "verificationStatus": "pending",
    "documentsUploaded": 0
  }
}
```

#### Test 8.2: Missing Required Fields
```bash
curl -X POST http://localhost:3000/api/hospitals/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test"
  }'
```

**Expected Response**: 400 Bad Request with validation errors

#### Test 8.3: Invalid Email Format
```bash
curl -X POST http://localhost:3000/api/hospitals/register \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test",
    "email": "invalid-email",
    "password": "pass123"
  }'
```

**Expected Response**: 400 Bad Request with email validation error

---

### Test 9: Email Notification

#### Test 9.1: Confirmation Email
1. Complete registration
2. Check email inbox for confirmation
3. **Expected Email Contains**:
   - Subject: "Hospital Registration Received"
   - Hospital name
   - Registration number
   - Contact email
   - Number of documents submitted
   - Message about admin review

---

### Test 10: Success Screen

#### Test 10.1: Success Message Display
1. Complete registration successfully
2. **Expected**:
   - Green checkmark icon with animation
   - "Registration Submitted Successfully! 🎉" title
   - Confirmation email notice
   - Verification timeline (24-48 hours)
   - API credentials notice
   - "What Happens Next?" section with 4 steps
   - "Go to Login" button
   - Support contact link

#### Test 10.2: Login Navigation
1. On success screen, click "Go to Login"
2. **Expected**: Redirected to `/hospital/login`

---

## 🐛 Common Issues and Solutions

### Issue 1: File Upload Fails
**Symptom**: Error when uploading documents
**Solution**: 
- Check `backend/uploads/hospital-documents/` directory exists
- Verify file permissions
- Check file size and type

### Issue 2: Email Not Sent
**Symptom**: Registration succeeds but no email received
**Solution**:
- Check email service configuration in `.env`
- Verify SMTP credentials
- Check spam folder
- Note: Registration still succeeds even if email fails

### Issue 3: Duplicate Error on First Registration
**Symptom**: "Hospital already exists" on first attempt
**Solution**:
- Check if test data exists in database
- Clear test data: `db.hospitals.deleteMany({ email: /test/ })`

### Issue 4: Form Data Not Persisting
**Symptom**: Data lost when navigating between steps
**Solution**:
- Check browser console for errors
- Verify FormGroup initialization
- Check Angular reactive forms setup

---

## ✅ Test Completion Checklist

- [ ] Test 1: Successful registration flow
- [ ] Test 2: All form validations
- [ ] Test 3: File upload validations
- [ ] Test 4: Duplicate prevention
- [ ] Test 5: Navigation and progress
- [ ] Test 6: Password features
- [ ] Test 7: Responsive design
- [ ] Test 8: Backend API
- [ ] Test 9: Email notification
- [ ] Test 10: Success screen

---

## 📊 Test Results Template

```
Test Date: ___________
Tester: ___________

| Test # | Test Name | Status | Notes |
|--------|-----------|--------|-------|
| 1 | Successful Registration | ⬜ Pass ⬜ Fail | |
| 2.1 | Empty Fields Validation | ⬜ Pass ⬜ Fail | |
| 2.2 | Email Validation | ⬜ Pass ⬜ Fail | |
| 2.3 | Password Strength | ⬜ Pass ⬜ Fail | |
| 2.4 | Password Mismatch | ⬜ Pass ⬜ Fail | |
| 2.5 | Phone Validation | ⬜ Pass ⬜ Fail | |
| 2.6 | ZIP Code Validation | ⬜ Pass ⬜ Fail | |
| 2.7 | URL Validation | ⬜ Pass ⬜ Fail | |
| 2.8 | Specialization Required | ⬜ Pass ⬜ Fail | |
| 2.9 | Document Required | ⬜ Pass ⬜ Fail | |
| 3.1 | Invalid File Type | ⬜ Pass ⬜ Fail | |
| 3.2 | File Size Limit | ⬜ Pass ⬜ Fail | |
| 3.3 | Multiple Files | ⬜ Pass ⬜ Fail | |
| 3.4 | Duplicate File | ⬜ Pass ⬜ Fail | |
| 4.1 | Duplicate Email | ⬜ Pass ⬜ Fail | |
| 4.2 | Duplicate Reg Number | ⬜ Pass ⬜ Fail | |
| 5.1 | Progress Bar | ⬜ Pass ⬜ Fail | |
| 5.2 | Step Indicators | ⬜ Pass ⬜ Fail | |
| 5.3 | Previous Button | ⬜ Pass ⬜ Fail | |
| 5.4 | Data Persistence | ⬜ Pass ⬜ Fail | |
| 6.1 | Password Toggle | ⬜ Pass ⬜ Fail | |
| 6.2 | Password Strength | ⬜ Pass ⬜ Fail | |
| 7.1 | Mobile Responsive | ⬜ Pass ⬜ Fail | |
| 7.2 | Tablet Responsive | ⬜ Pass ⬜ Fail | |
| 8.1 | API Direct Call | ⬜ Pass ⬜ Fail | |
| 8.2 | API Missing Fields | ⬜ Pass ⬜ Fail | |
| 8.3 | API Invalid Email | ⬜ Pass ⬜ Fail | |
| 9.1 | Confirmation Email | ⬜ Pass ⬜ Fail | |
| 10.1 | Success Screen | ⬜ Pass ⬜ Fail | |
| 10.2 | Login Navigation | ⬜ Pass ⬜ Fail | |

Overall Status: ⬜ All Pass ⬜ Some Failures

Notes:
_______________________________________
_______________________________________
```

---

**Testing Guide Version**: 1.0
**Last Updated**: December 2, 2024
