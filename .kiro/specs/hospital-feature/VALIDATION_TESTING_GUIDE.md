# Hospital Registration Form Validation - Testing Guide

## 🧪 Manual Testing Guide

This guide will help you test all the validation features implemented in the hospital registration form.

## 🚀 Getting Started

1. Start the frontend application:
   ```bash
   cd frontend
   npm start
   ```

2. Navigate to: `http://localhost:4200/hospital/register`

## 📋 Test Cases

### Step 1: Basic Information

#### Test Case 1.1: Name Validation
- **Action:** Leave name field empty and click "Next"
- **Expected:** Red border, error message "Name is required"
- **Action:** Enter "A" (1 character)
- **Expected:** Error message "Name must be at least 2 characters"
- **Action:** Enter "John Doe"
- **Expected:** Green border, no error message ✅

#### Test Case 1.2: Email Validation
- **Action:** Leave email field empty
- **Expected:** Error message "Email is required"
- **Action:** Enter "invalid-email"
- **Expected:** Error message "Please enter a valid email"
- **Action:** Enter "test@hospital.com"
- **Expected:** Green border, no error message ✅

#### Test Case 1.3: Password Validation
- **Action:** Leave password field empty
- **Expected:** Error message "Password is required"
- **Action:** Enter "123" (less than 8 characters)
- **Expected:** Error message "Password must be at least 8 characters"
- **Action:** Enter "password123"
- **Expected:** 
  - Password strength indicator appears
  - Shows "Weak Password" in red/orange
  - Help text displayed
- **Action:** Enter "Password123!"
- **Expected:** 
  - Shows "Strong Password" in green
  - Green strength bar at 100%
  - Green border on field ✅

#### Test Case 1.4: Password Confirmation
- **Action:** Enter different password in confirm field
- **Expected:** Error message "Passwords do not match"
- **Action:** Enter matching password
- **Expected:** Green border, no error message ✅

#### Test Case 1.5: Password Visibility Toggle
- **Action:** Click eye icon on password field
- **Expected:** Password becomes visible
- **Action:** Click eye icon again
- **Expected:** Password becomes hidden ✅

#### Test Case 1.6: Step Navigation
- **Action:** Try to click "Next" with invalid data
- **Expected:** 
  - Cannot proceed to next step
  - Toast error message appears
  - All invalid fields show red borders
- **Action:** Fill all fields correctly and click "Next"
- **Expected:** Progress to Step 2 ✅

### Step 2: Hospital Details

#### Test Case 2.1: Hospital Name Validation
- **Action:** Leave hospital name empty
- **Expected:** Error message "Hospital name is required"
- **Action:** Enter "AB" (2 characters)
- **Expected:** Error message "Hospital name must be at least 3 characters"
- **Action:** Enter "City General Hospital"
- **Expected:** Green border ✅

#### Test Case 2.2: Registration Number Validation
- **Action:** Leave registration number empty
- **Expected:** Error message "Registration number is required"
- **Action:** Enter "1234" (4 characters)
- **Expected:** Error message "Registration number must be at least 5 characters"
- **Action:** Enter "REG123456"
- **Expected:** Green border ✅

#### Test Case 2.3: Number of Beds Validation
- **Action:** Leave number of beds empty
- **Expected:** Error message "Number of beds is required"
- **Action:** Enter "0"
- **Expected:** Error message "Must be at least 1"
- **Action:** Enter "100"
- **Expected:** Green border ✅

#### Test Case 2.4: Website Validation (Optional)
- **Action:** Leave website empty
- **Expected:** No error (optional field) ✅
- **Action:** Enter "invalid-url"
- **Expected:** Error message "Please enter a valid URL"
- **Action:** Enter "https://cityhospital.com"
- **Expected:** Green border ✅

### Step 3: Contact & Address

#### Test Case 3.1: Contact Number Validation
- **Action:** Leave contact number empty
- **Expected:** Error message "Contact number is required"
- **Action:** Enter "123" (too short)
- **Expected:** Error message "Please enter a valid phone number"
- **Action:** Enter "+1234567890"
- **Expected:** Green border ✅

#### Test Case 3.2: Emergency Contact Validation
- **Action:** Leave emergency contact empty
- **Expected:** Error message "Emergency contact is required"
- **Action:** Enter "abc" (non-numeric)
- **Expected:** Error message "Please enter a valid phone number"
- **Action:** Enter "+9876543210"
- **Expected:** Green border ✅

#### Test Case 3.3: Address Fields Validation
- **Action:** Leave any address field empty
- **Expected:** Error message for that field
- **Action:** Fill all address fields
- **Expected:** All fields show green borders ✅

#### Test Case 3.4: ZIP Code Validation
- **Action:** Enter "123" (too short)
- **Expected:** Error message "Please enter a valid ZIP code"
- **Action:** Enter "12345"
- **Expected:** Green border ✅

### Step 4: Specializations & Facilities

#### Test Case 4.1: Specialization Selection
- **Action:** Try to click "Next" without selecting any specialization
- **Expected:** 
  - Toast error message "Please select at least one specialization"
  - Error message below checkboxes
  - Cannot proceed to next step
- **Action:** Select "Cardiology"
- **Expected:** 
  - "✓ 1 specialization(s) selected" appears in green
  - Error message disappears
- **Action:** Select "Neurology" and "Orthopedics"
- **Expected:** "✓ 3 specialization(s) selected" ✅

#### Test Case 4.2: Facility Selection (Optional)
- **Action:** Don't select any facilities
- **Expected:** No error (optional) ✅
- **Action:** Select some facilities
- **Expected:** Count displayed ✅

### Step 5: Document Upload

#### Test Case 5.1: Document Upload Requirement
- **Action:** Try to submit without uploading documents
- **Expected:** 
  - Toast error message "Please upload at least one document"
  - Error message below upload area
  - Cannot submit
- **Action:** Upload a document
- **Expected:** 
  - Document appears in list
  - Shows file name and size
  - Error message disappears ✅

#### Test Case 5.2: File Size Validation
- **Action:** Try to upload a file larger than 10MB
- **Expected:** 
  - Toast error message "File '[name]' is too large. Maximum size is 10MB."
  - File is not added to list ✅

#### Test Case 5.3: File Type Validation
- **Action:** Try to upload a .txt or .doc file
- **Expected:** 
  - Toast error message "File '[name]' has an invalid type. Only PDF, JPG, and PNG files are allowed."
  - File is not added to list ✅

#### Test Case 5.4: Valid File Upload
- **Action:** Upload a PDF file (< 10MB)
- **Expected:** 
  - File appears in list
  - Shows file icon, name, and size
  - Remove button (✕) appears ✅

#### Test Case 5.5: Duplicate File Detection
- **Action:** Try to upload the same file twice
- **Expected:** 
  - Toast warning message "File '[name]' is already uploaded."
  - File is not added again ✅

#### Test Case 5.6: Multiple File Upload
- **Action:** Select multiple files at once
- **Expected:** 
  - All valid files are added
  - Invalid files show error messages
  - File count updates ✅

#### Test Case 5.7: Remove Document
- **Action:** Click remove button (✕) on a document
- **Expected:** 
  - Document is removed from list
  - File count updates
  - Can select the same file again ✅

### Final Submission

#### Test Case 6.1: Incomplete Form Submission
- **Action:** Go back to Step 1 and clear the name field
- **Action:** Navigate to Step 5 and click "Submit Registration"
- **Expected:** 
  - Form navigates back to Step 1
  - Toast error message "Please complete Basic Information correctly"
  - Name field shows error ✅

#### Test Case 6.2: Complete Form Submission
- **Action:** Fill all required fields correctly
- **Action:** Select at least one specialization
- **Action:** Upload at least one document
- **Action:** Click "Submit Registration"
- **Expected:** 
  - Loading state appears ("Submitting...")
  - Button is disabled during submission
  - Success message appears
  - Redirects to login page after 2 seconds ✅

## 🎨 Visual Validation Tests

### Test Case 7.1: Error State Styling
- **Expected Visual:**
  - Red border on invalid fields
  - Light red background on invalid fields
  - Red error text below fields
  - Shake animation when error appears

### Test Case 7.2: Success State Styling
- **Expected Visual:**
  - Green border on valid fields
  - Green checkmarks for selections
  - Green success messages

### Test Case 7.3: Password Strength Indicator
- **Expected Visual:**
  - Weak: Red/orange bar at 33%, red text
  - Medium: Orange bar at 66%, orange text
  - Strong: Green bar at 100%, green text
  - Smooth transitions between states

### Test Case 7.4: Progress Bar
- **Expected Visual:**
  - Progress bar fills as you move through steps
  - Step circles change color (gray → purple → green)
  - Active step is highlighted
  - Completed steps show green checkmark

## 📱 Responsive Design Tests

### Test Case 8.1: Mobile View (< 768px)
- **Action:** Resize browser to mobile width
- **Expected:**
  - Form remains usable
  - Buttons stack vertically
  - Checkbox grid becomes single column
  - Step labels may hide on very small screens
  - All validation still works ✅

### Test Case 8.2: Tablet View (768px - 1024px)
- **Action:** Resize browser to tablet width
- **Expected:**
  - Form layout adjusts appropriately
  - Two-column layouts may become single column
  - All features remain accessible ✅

## ⚡ Performance Tests

### Test Case 9.1: Real-Time Validation
- **Action:** Type in various fields
- **Expected:**
  - Validation updates smoothly
  - No lag or delay
  - Password strength updates in real-time ✅

### Test Case 9.2: Large File Handling
- **Action:** Try to upload a 9.9MB file
- **Expected:**
  - File uploads successfully
  - Size validation works correctly
  - No performance issues ✅

## 🔄 Navigation Tests

### Test Case 10.1: Back Navigation
- **Action:** Navigate to Step 3, then click "Previous"
- **Expected:**
  - Returns to Step 2
  - Form data is preserved
  - Validation state is preserved ✅

### Test Case 10.2: Step Jumping on Error
- **Action:** Complete all steps, go back and invalidate Step 2
- **Action:** Try to submit from Step 5
- **Expected:**
  - Automatically jumps to Step 2
  - Shows specific error message
  - Highlights invalid fields ✅

## ✅ Validation Summary Checklist

Use this checklist to verify all validation features:

- [ ] All required fields show error when empty
- [ ] Email format validation works
- [ ] Password minimum length enforced
- [ ] Password confirmation matching works
- [ ] Password strength indicator displays correctly
- [ ] Phone number format validation works
- [ ] ZIP code format validation works
- [ ] URL format validation works (optional field)
- [ ] Number of beds minimum value enforced
- [ ] At least one specialization required
- [ ] At least one document required
- [ ] File size validation (10MB max)
- [ ] File type validation (PDF, JPG, PNG only)
- [ ] Duplicate file detection works
- [ ] Cannot proceed to next step with invalid data
- [ ] Cannot submit with invalid data
- [ ] Form jumps to first invalid step on submit
- [ ] Error messages are clear and helpful
- [ ] Success states show green borders
- [ ] Password visibility toggle works
- [ ] File remove functionality works
- [ ] Progress bar updates correctly
- [ ] Responsive design works on mobile
- [ ] All animations work smoothly
- [ ] Toast notifications appear for errors

## 🐛 Known Issues / Edge Cases

Document any issues found during testing:

1. **Issue:** [Description]
   - **Steps to Reproduce:** [Steps]
   - **Expected:** [Expected behavior]
   - **Actual:** [Actual behavior]
   - **Severity:** [Low/Medium/High]

## 📊 Test Results

| Test Category | Total Tests | Passed | Failed | Notes |
|---------------|-------------|--------|--------|-------|
| Basic Info Validation | 6 | - | - | |
| Hospital Details | 4 | - | - | |
| Contact & Address | 4 | - | - | |
| Specializations | 2 | - | - | |
| Document Upload | 7 | - | - | |
| Final Submission | 2 | - | - | |
| Visual Validation | 4 | - | - | |
| Responsive Design | 2 | - | - | |
| Performance | 2 | - | - | |
| Navigation | 2 | - | - | |
| **TOTAL** | **35** | **-** | **-** | |

---

**Testing Date:** _____________
**Tester:** _____________
**Browser:** _____________
**Device:** _____________
**Status:** ⬜ Not Started | ⬜ In Progress | ⬜ Complete
