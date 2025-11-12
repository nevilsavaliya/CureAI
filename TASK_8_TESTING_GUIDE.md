# Task 8 Testing Guide

## Admin Functionality Testing

### Prerequisites
1. Backend server running on `http://localhost:3000`
2. Frontend server running on `http://localhost:4200`
3. MongoDB database with sample data (patients, doctors, admins)
4. Admin user credentials: `admin@gmail.com` / `admin@123`

## Test Cases

### 1. Admin Login
**Steps:**
1. Navigate to `http://localhost:4200/login`
2. Enter email: `admin@gmail.com`
3. Enter password: `admin@123`
4. Click Login

**Expected Result:**
- Successfully redirected to admin dashboard
- Welcome message displays admin name
- Navigation tabs visible (Platform Metrics, User Management)

### 2. Platform Metrics View
**Steps:**
1. After login, verify you're on the "Platform Metrics" tab (should be active by default)
2. Observe the metrics cards

**Expected Result:**
- Metrics grid displays 7 cards:
  - Total Registered Users (sum of patients + doctors + admins)
  - Total Patients
  - Total Doctors
  - Total Admins
  - Active Users (7 days)
  - Symptom Submissions
  - Disease Predictions
- Each card shows:
  - Icon
  - Numeric value
  - Label
- No loading spinner visible
- No error messages

**API Call:**
```
GET http://localhost:3000/api/admin/metrics
Authorization: Bearer <token>
```

**Expected Response:**
```json
{
  "success": true,
  "totalPatients": 10,
  "totalDoctors": 5,
  "totalAdmins": 1,
  "totalRegisteredUsers": 16,
  "totalSymptoms": 25,
  "totalPredictions": 20,
  "activeUsers": 8
}
```

### 3. User Management View
**Steps:**
1. Click on "User Management" tab
2. Wait for users to load

**Expected Result:**
- Tab switches to User Management
- Filters section visible with:
  - Role dropdown (All Roles, Patients, Doctors, Admins)
  - Search input field
  - Apply Filters button
  - Clear button
- Users table displays with columns:
  - Name
  - Email
  - Role (with colored badge)
  - Collection Type
  - Registration Date
  - Last Login
  - Status (Active/Inactive badge)
  - Details (collection-specific fields)

**API Call:**
```
GET http://localhost:3000/api/admin/users
Authorization: Bearer <token>
```

### 4. Filter Users by Role - Patients
**Steps:**
1. In User Management view
2. Select "Patients" from role dropdown
3. Click "Apply Filters"

**Expected Result:**
- Table shows only patient users
- Each row displays:
  - Patient name and email
  - Role badge: "PATIENT" (blue)
  - Collection Type: "patient"
  - Details column shows:
    - Blood Group
    - Date of Birth

**API Call:**
```
GET http://localhost:3000/api/admin/users?role=patient
Authorization: Bearer <token>
```

### 5. Filter Users by Role - Doctors
**Steps:**
1. Select "Doctors" from role dropdown
2. Click "Apply Filters"

**Expected Result:**
- Table shows only doctor users
- Each row displays:
  - Doctor name and email
  - Role badge: "DOCTOR" (purple)
  - Collection Type: "doctor"
  - Details column shows:
    - Speciality
    - Degree
    - Experience (years)
    - Subscription Status

**API Call:**
```
GET http://localhost:3000/api/admin/users?role=doctor
Authorization: Bearer <token>
```

### 6. Filter Users by Role - Admins
**Steps:**
1. Select "Admins" from role dropdown
2. Click "Apply Filters"

**Expected Result:**
- Table shows only admin users
- Each row displays:
  - Admin name and email
  - Role badge: "ADMIN" (orange)
  - Collection Type: "admin"
  - Details column shows: "Admin User"

**API Call:**
```
GET http://localhost:3000/api/admin/users?role=admin
Authorization: Bearer <token>
```

### 7. Search Users by Name
**Steps:**
1. Clear any existing filters by clicking "Clear"
2. Enter a partial name in search field (e.g., "john")
3. Click "Apply Filters" or press Enter

**Expected Result:**
- Table shows only users whose name contains "john" (case-insensitive)
- Users from all collections (patients, doctors, admins) are included in search
- Results sorted by creation date (newest first)

**API Call:**
```
GET http://localhost:3000/api/admin/users?search=john
Authorization: Bearer <token>
```

### 8. Search Users by Email
**Steps:**
1. Enter a partial email in search field (e.g., "gmail")
2. Click "Apply Filters"

**Expected Result:**
- Table shows only users whose email contains "gmail"
- Users from all collections are included

**API Call:**
```
GET http://localhost:3000/api/admin/users?search=gmail
Authorization: Bearer <token>
```

### 9. Combined Filter - Role and Search
**Steps:**
1. Select "Doctors" from role dropdown
2. Enter search term (e.g., "smith")
3. Click "Apply Filters"

**Expected Result:**
- Table shows only doctors whose name or email contains "smith"

**API Call:**
```
GET http://localhost:3000/api/admin/users?role=doctor&search=smith
Authorization: Bearer <token>
```

### 10. Clear Filters
**Steps:**
1. Apply any filters (role and/or search)
2. Click "Clear" button

**Expected Result:**
- Role dropdown resets to "All Roles"
- Search input clears
- Table reloads showing all users from all collections

### 11. Verify Collection-Specific Fields

**For Patients:**
- Blood Group should display (e.g., "O+", "A-", "B+")
- Date of Birth should display in formatted date

**For Doctors:**
- Speciality should display (e.g., "Cardiology", "Neurology")
- Degree should display (e.g., "MBBS, MD")
- Experience should display as number with "years" (e.g., "10 years")
- Subscription Status should display (e.g., "active", "pending", "expired")

**For Admins:**
- Should simply show "Admin User" text

### 12. Active Users Calculation
**Steps:**
1. Note the "Active Users (7 days)" metric
2. Verify it counts users who logged in within last 7 days

**Verification:**
- Check lastLogin field in users table
- Users with lastLogin within last 7 days should be counted
- Count should include patients + doctors + admins

### 13. Total Registered Users Calculation
**Steps:**
1. Note individual counts:
   - Total Patients
   - Total Doctors
   - Total Admins
2. Note Total Registered Users

**Verification:**
- Total Registered Users = Total Patients + Total Doctors + Total Admins

### 14. Error Handling - Network Error
**Steps:**
1. Stop the backend server
2. Refresh the admin dashboard
3. Try to load metrics or users

**Expected Result:**
- Error message displays: "Failed to load metrics" or "Failed to load users"
- Retry button appears
- Clicking retry attempts to reload data

### 15. Loading States
**Steps:**
1. Observe when switching between tabs
2. Observe when applying filters

**Expected Result:**
- "Loading metrics..." or "Loading users..." message displays briefly
- Content appears after data loads
- No flickering or layout shifts

## Backend API Testing (Using Postman/Thunder Client)

### Test 1: Get Metrics
```
GET http://localhost:3000/api/admin/metrics
Headers:
  Authorization: Bearer <admin_token>
```

### Test 2: Get All Users
```
GET http://localhost:3000/api/admin/users
Headers:
  Authorization: Bearer <admin_token>
```

### Test 3: Get Users by Role
```
GET http://localhost:3000/api/admin/users?role=patient
GET http://localhost:3000/api/admin/users?role=doctor
GET http://localhost:3000/api/admin/users?role=admin
Headers:
  Authorization: Bearer <admin_token>
```

### Test 4: Search Users
```
GET http://localhost:3000/api/admin/users?search=john
Headers:
  Authorization: Bearer <admin_token>
```

### Test 5: Combined Filters
```
GET http://localhost:3000/api/admin/users?role=doctor&search=smith
Headers:
  Authorization: Bearer <admin_token>
```

### Test 6: Get User Detail
```
GET http://localhost:3000/api/admin/users/:userId
GET http://localhost:3000/api/admin/users/:userId?collectionType=patient
Headers:
  Authorization: Bearer <admin_token>
```

## Database Verification

### Verify Separate Collections
```javascript
// In MongoDB shell or Compass
use healthcare_db

// Count documents in each collection
db.patients.countDocuments()
db.doctors.countDocuments()
db.admins.countDocuments()

// Verify no User collection exists (or is empty)
db.users.countDocuments()  // Should be 0 or collection shouldn't exist

// Check sample patient
db.patients.findOne()

// Check sample doctor
db.doctors.findOne()

// Check admin
db.admins.findOne({ email: "admin@gmail.com" })
```

## Success Criteria

✅ Admin can log in successfully
✅ Platform metrics display correctly with all 7 metrics
✅ Total Registered Users = sum of all three collections
✅ Active Users counts across all three collections
✅ User Management displays users from all collections
✅ Role filtering works for patient, doctor, and admin
✅ Search works across all collections
✅ Combined filters work correctly
✅ Collection-specific fields display properly
✅ Role badges display with correct colors
✅ Status badges show active/inactive correctly
✅ Clear filters resets all filters
✅ Error handling works when backend is down
✅ Loading states display appropriately
✅ No console errors in browser
✅ No server errors in backend logs

## Common Issues and Solutions

### Issue: Metrics show 0 for all values
**Solution:** Ensure database has sample data in patients, doctors, and admins collections

### Issue: Users table is empty
**Solution:** Check that users exist in the separate collections (not in old User collection)

### Issue: "Failed to load metrics" error
**Solution:** 
- Verify backend server is running
- Check admin authentication token is valid
- Verify admin routes are properly configured

### Issue: Collection-specific fields not showing
**Solution:** Verify the user documents in database have the required fields (bloodGroup for patients, speciality/degree/experienceYears for doctors)

### Issue: Active users count is 0
**Solution:** Update lastLogin field for some users to be within last 7 days
