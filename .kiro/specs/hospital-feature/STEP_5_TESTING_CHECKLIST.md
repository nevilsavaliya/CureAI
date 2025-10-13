# Step 5: Document Upload - Testing Checklist

## Pre-Testing Setup

### Backend Setup
- [x] Multer installed (`npm install multer`)
- [x] Upload middleware created (`backend/middleware/upload.js`)
- [x] Controller updated (`backend/controllers/hospitalController.js`)
- [x] Routes configured (`backend/routes/hospitalRoutes.js`)
- [x] Static file serving enabled (`backend/server.js`)
- [x] Uploads directory created (`backend/uploads/hospital-documents/`)
- [x] .gitignore updated

### Frontend Setup
- [x] Hospital registration component complete
- [x] File upload UI implemented
- [x] FormData submission configured
- [x] Admin document viewing implemented

---

## Manual Testing Checklist

### 1. Basic Upload Functionality

#### Test 1.1: Single File Upload
- [ ] Navigate to hospital registration form
- [ ] Complete Steps 1-4
- [ ] Click on upload area in Step 5
- [ ] Select a single PDF file (< 10MB)
- [ ] Verify file appears in the uploaded files list
- [ ] Verify file name and size are displayed correctly
- [ ] Click "Submit Registration"
- [ ] Verify success message appears
- [ ] Check confirmation email mentions 1 document

**Expected Result:** ✅ File uploads successfully, registration completes

#### Test 1.2: Multiple File Upload
- [ ] Navigate to hospital registration form
- [ ] Complete Steps 1-4
- [ ] Select multiple files (3-5 files: PDF, JPG, PNG)
- [ ] Verify all files appear in the list
- [ ] Verify correct file count is shown
- [ ] Submit registration
- [ ] Verify success message

**Expected Result:** ✅ All files upload successfully

#### Test 1.3: Drag and Drop Upload
- [ ] Navigate to Step 5
- [ ] Drag a file from file explorer
- [ ] Drop it on the upload area
- [ ] Verify file is added to the list

**Expected Result:** ✅ Drag and drop works correctly

---

### 2. File Type Validation

#### Test 2.1: Valid File Types
- [ ] Upload a PDF file
- [ ] Upload a JPG file
- [ ] Upload a JPEG file
- [ ] Upload a PNG file
- [ ] Verify all are accepted

**Expected Result:** ✅ All valid file types accepted

#### Test 2.2: Invalid File Types
- [ ] Try to upload a .txt file
- [ ] Try to upload a .docx file
- [ ] Try to upload a .xlsx file
- [ ] Try to upload a .zip file
- [ ] Verify error message appears
- [ ] Verify file is not added to list

**Expected Result:** ❌ Invalid file types rejected with clear error message

---

### 3. File Size Validation

#### Test 3.1: Valid File Size
- [ ] Upload a file < 1MB
- [ ] Upload a file around 5MB
- [ ] Upload a file around 9MB
- [ ] Verify all are accepted

**Expected Result:** ✅ Files under 10MB accepted

#### Test 3.2: Oversized File
- [ ] Try to upload a file > 10MB
- [ ] Verify error message appears
- [ ] Verify message mentions "10MB" limit
- [ ] Verify file is not added to list

**Expected Result:** ❌ Oversized file rejected with clear error message

---

### 4. File Count Validation

#### Test 4.1: Maximum Files
- [ ] Upload 10 files (maximum allowed)
- [ ] Verify all 10 files are accepted
- [ ] Try to upload an 11th file
- [ ] Verify error message appears

**Expected Result:** ✅ Up to 10 files accepted, 11th rejected

---

### 5. File Management

#### Test 5.1: Remove File
- [ ] Upload 3 files
- [ ] Click the ✕ button on the second file
- [ ] Verify file is removed from list
- [ ] Verify file count updates
- [ ] Submit registration
- [ ] Verify only 2 files are uploaded

**Expected Result:** ✅ File removal works correctly

#### Test 5.2: Remove All Files
- [ ] Upload 3 files
- [ ] Remove all files one by one
- [ ] Try to submit registration
- [ ] Verify error message: "at least one document required"

**Expected Result:** ❌ Cannot submit without documents

---

### 6. Form Validation

#### Test 6.1: Submit Without Documents
- [ ] Complete Steps 1-4
- [ ] Go to Step 5 without uploading any files
- [ ] Click "Submit Registration"
- [ ] Verify error message appears
- [ ] Verify message says "at least one document"

**Expected Result:** ❌ Cannot submit without documents

#### Test 6.2: Submit With Documents
- [ ] Complete Steps 1-4
- [ ] Upload 2-3 documents
- [ ] Click "Submit Registration"
- [ ] Verify registration succeeds

**Expected Result:** ✅ Registration succeeds with documents

---

### 7. Backend Storage

#### Test 7.1: File Storage
- [ ] Complete a registration with 3 files
- [ ] SSH/access backend server
- [ ] Navigate to `backend/uploads/hospital-documents/`
- [ ] Verify 3 files exist
- [ ] Verify filenames are unique (timestamp-based)
- [ ] Verify files are readable

**Expected Result:** ✅ Files stored correctly on disk

#### Test 7.2: Database Storage
- [ ] Complete a registration
- [ ] Query MongoDB for the hospital record
- [ ] Verify `documents` array exists
- [ ] Verify each document has:
  - `type` field
  - `url` field (path to file)
  - `uploadedAt` timestamp
- [ ] Verify document count matches uploaded files

**Expected Result:** ✅ Document metadata stored in database

---

### 8. Admin Document Viewing

#### Test 8.1: View Documents in Admin Panel
- [ ] Login as admin
- [ ] Navigate to Hospital Management
- [ ] Find a hospital with uploaded documents
- [ ] Click "View Details"
- [ ] Scroll to Documents section
- [ ] Verify documents are displayed
- [ ] Verify document count is correct

**Expected Result:** ✅ Documents visible in admin panel

#### Test 8.2: Download Documents
- [ ] In hospital details modal
- [ ] Click on a document link
- [ ] Verify file downloads or opens in browser
- [ ] Verify file content is correct
- [ ] Test with PDF, JPG, and PNG files

**Expected Result:** ✅ Documents can be downloaded/viewed

#### Test 8.3: Document Metadata
- [ ] In hospital details modal
- [ ] Verify each document shows:
  - Document icon
  - Upload date
  - File name (in URL)
- [ ] Verify dates are formatted correctly

**Expected Result:** ✅ Document metadata displayed correctly

---

### 9. Error Handling

#### Test 9.1: Network Error During Upload
- [ ] Start registration process
- [ ] Upload files
- [ ] Disconnect internet
- [ ] Click "Submit Registration"
- [ ] Verify error message appears
- [ ] Reconnect internet
- [ ] Retry submission
- [ ] Verify registration succeeds

**Expected Result:** ✅ Graceful error handling, retry works

#### Test 9.2: Server Error
- [ ] Stop backend server
- [ ] Try to submit registration
- [ ] Verify error message appears
- [ ] Start backend server
- [ ] Retry submission
- [ ] Verify registration succeeds

**Expected Result:** ✅ Clear error message, retry works

#### Test 9.3: Partial Upload Failure
- [ ] Upload 5 files
- [ ] Simulate failure for 1 file (if possible)
- [ ] Verify error message
- [ ] Verify which files failed
- [ ] Retry upload

**Expected Result:** ✅ Clear indication of which files failed

---

### 10. Email Notifications

#### Test 10.1: Confirmation Email
- [ ] Complete registration with documents
- [ ] Check email inbox
- [ ] Verify confirmation email received
- [ ] Verify email mentions document count
- [ ] Verify email has correct hospital details

**Expected Result:** ✅ Confirmation email sent with document info

#### Test 10.2: Verification Email (Admin Action)
- [ ] Admin verifies hospital
- [ ] Check hospital email inbox
- [ ] Verify verification email received
- [ ] Verify email contains API credentials

**Expected Result:** ✅ Verification email sent after admin approval

---

### 11. Security Testing

#### Test 11.1: File Type Bypass Attempt
- [ ] Rename a .exe file to .pdf
- [ ] Try to upload it
- [ ] Verify it's rejected (MIME type check)

**Expected Result:** ✅ File type validation cannot be bypassed

#### Test 11.2: Path Traversal Attempt
- [ ] Try to upload file with name: `../../etc/passwd.pdf`
- [ ] Verify filename is sanitized
- [ ] Verify file stored with safe name

**Expected Result:** ✅ Path traversal prevented

#### Test 11.3: Unauthorized Document Access
- [ ] Get document URL from admin panel
- [ ] Logout
- [ ] Try to access document URL directly
- [ ] Verify access is allowed (static serving)
- [ ] Note: In production, add authentication

**Expected Result:** ⚠️ Currently public, should add auth in production

---

### 12. Performance Testing

#### Test 12.1: Large File Upload
- [ ] Upload a 9.5MB file
- [ ] Monitor upload progress
- [ ] Verify upload completes
- [ ] Check upload time (should be reasonable)

**Expected Result:** ✅ Large files upload successfully

#### Test 12.2: Multiple Simultaneous Uploads
- [ ] Open 3 browser tabs
- [ ] Start registration in each
- [ ] Upload files in all tabs simultaneously
- [ ] Verify all uploads succeed

**Expected Result:** ✅ Concurrent uploads work correctly

---

### 13. Browser Compatibility

#### Test 13.1: Chrome
- [ ] Test all upload functionality in Chrome
- [ ] Verify drag-and-drop works
- [ ] Verify file selection works

**Expected Result:** ✅ Works in Chrome

#### Test 13.2: Firefox
- [ ] Test all upload functionality in Firefox
- [ ] Verify drag-and-drop works
- [ ] Verify file selection works

**Expected Result:** ✅ Works in Firefox

#### Test 13.3: Safari
- [ ] Test all upload functionality in Safari
- [ ] Verify drag-and-drop works
- [ ] Verify file selection works

**Expected Result:** ✅ Works in Safari

#### Test 13.4: Edge
- [ ] Test all upload functionality in Edge
- [ ] Verify drag-and-drop works
- [ ] Verify file selection works

**Expected Result:** ✅ Works in Edge

---

### 14. Mobile Testing

#### Test 14.1: Mobile Upload (iOS)
- [ ] Open registration on iPhone/iPad
- [ ] Navigate to Step 5
- [ ] Tap upload area
- [ ] Select file from device
- [ ] Verify upload works

**Expected Result:** ✅ Works on iOS

#### Test 14.2: Mobile Upload (Android)
- [ ] Open registration on Android device
- [ ] Navigate to Step 5
- [ ] Tap upload area
- [ ] Select file from device
- [ ] Verify upload works

**Expected Result:** ✅ Works on Android

---

### 15. Edge Cases

#### Test 15.1: Special Characters in Filename
- [ ] Upload file with name: `test (1) [copy].pdf`
- [ ] Verify upload succeeds
- [ ] Verify filename is handled correctly

**Expected Result:** ✅ Special characters handled

#### Test 15.2: Very Long Filename
- [ ] Upload file with 200+ character name
- [ ] Verify upload succeeds
- [ ] Verify filename is truncated if needed

**Expected Result:** ✅ Long filenames handled

#### Test 15.3: Duplicate Filenames
- [ ] Upload `document.pdf`
- [ ] Upload another `document.pdf`
- [ ] Verify both files stored with unique names
- [ ] Verify no overwrite occurs

**Expected Result:** ✅ Duplicate names handled with unique storage names

---

## Test Results Summary

### Pass/Fail Tracking

| Category | Tests | Passed | Failed | Notes |
|----------|-------|--------|--------|-------|
| Basic Upload | 3 | - | - | |
| File Type Validation | 2 | - | - | |
| File Size Validation | 2 | - | - | |
| File Count Validation | 1 | - | - | |
| File Management | 2 | - | - | |
| Form Validation | 2 | - | - | |
| Backend Storage | 2 | - | - | |
| Admin Viewing | 3 | - | - | |
| Error Handling | 3 | - | - | |
| Email Notifications | 2 | - | - | |
| Security | 3 | - | - | |
| Performance | 2 | - | - | |
| Browser Compatibility | 4 | - | - | |
| Mobile Testing | 2 | - | - | |
| Edge Cases | 3 | - | - | |
| **TOTAL** | **36** | **-** | **-** | |

---

## Issues Found

### Critical Issues
- [ ] None found

### Major Issues
- [ ] None found

### Minor Issues
- [ ] None found

### Enhancement Suggestions
- [ ] Add document preview functionality
- [ ] Add progress bar for large uploads
- [ ] Add document categorization
- [ ] Add cloud storage integration

---

## Sign-Off

### Tested By
- **Name:** _________________
- **Date:** _________________
- **Role:** _________________

### Approved By
- **Name:** _________________
- **Date:** _________________
- **Role:** _________________

---

**Testing Status:** ⏳ Pending Manual Testing
**Last Updated:** December 1, 2024
