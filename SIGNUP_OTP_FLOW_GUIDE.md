# Signup with OTP Verification - Complete Guide

## Overview
The signup flow now works exactly like the forgot password flow:
1. User fills signup form → Submits
2. Backend sends OTP to email
3. Frontend redirects to OTP verification page
4. User enters OTP → Account created

## Backend Implementation ✅ COMPLETED

### API Endpoints

#### 1. Submit Signup Details (Sends OTP)
```
POST /api/auth/signup/patient
POST /api/auth/signup/doctor

Request Body (WITHOUT OTP):
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "Test123!",
  "confirmPassword": "Test123!",
  "dateOfBirth": "1990-01-01",
  "bloodGroup": "O+"
}

Response (200 OK):
{
  "success": true,
  "message": "Verification OTP sent to your email. Please check your inbox.",
  "requiresOTP": true,
  "email": "john@example.com"
}
```

#### 2. Verify OTP and Create Account
```
POST /api/auth/signup/patient
POST /api/auth/signup/doctor

Request Body (WITH OTP):
{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "Test123!",
  "confirmPassword": "Test123!",
  "dateOfBirth": "1990-01-01",
  "bloodGroup": "O+",
  "otp": "123456"  // <-- OTP from email
}

Response (201 Created):
{
  "success": true,
  "message": "Account created successfully! You can now login.",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "userId": "...",
    "name": "John Doe",
    "email": "john@example.com",
    "role": "patient"
  }
}
```

#### 3. Resend OTP (Optional)
```
POST /api/auth/resend-otp

Request Body:
{
  "email": "john@example.com"
}

Response:
{
  "success": true,
  "message": "New OTP sent to your email"
}
```

## Frontend Implementation

### Step 1: Update Signup Component

```typescript
// signup.component.ts
export class SignupComponent {
  signupForm: FormGroup;
  showOTPPage = false;
  userEmail = '';
  signupData: any = null;

  constructor(
    private authService: AuthService,
    private router: Router,
    private toastService: ToastService
  ) {}

  // Step 1: Submit signup form
  onSubmit() {
    if (this.signupForm.invalid) {
      return;
    }

    const formData = this.signupForm.value;
    this.signupData = formData; // Store for later use
    this.userEmail = formData.email;

    // Call signup API (without OTP)
    this.authService.signup(formData).subscribe({
      next: (response) => {
        if (response.requiresOTP) {
          // OTP sent, show OTP verification page
          this.showOTPPage = true;
          this.toastService.showSuccess(response.message);
        } else if (response.token) {
          // Account created directly (shouldn't happen with new flow)
          this.handleSuccessfulSignup(response);
        }
      },
      error: (error) => {
        this.toastService.showError(error.error.message || 'Signup failed');
      }
    });
  }

  // Step 2: Verify OTP
  verifyOTP(otp: string) {
    // Add OTP to signup data
    const dataWithOTP = {
      ...this.signupData,
      otp: otp
    };

    // Call signup API again (with OTP)
    this.authService.signup(dataWithOTP).subscribe({
      next: (response) => {
        if (response.token) {
          this.handleSuccessfulSignup(response);
        }
      },
      error: (error) => {
        this.toastService.showError(error.error.message || 'Invalid OTP');
      }
    });
  }

  // Handle successful signup
  handleSuccessfulSignup(response: any) {
    // Store token
    localStorage.setItem('token', response.token);
    localStorage.setItem('user', JSON.stringify(response.user));
    
    // Redirect to dashboard
    if (response.user.role === 'patient') {
      this.router.navigate(['/patient/dashboard']);
    } else if (response.user.role === 'doctor') {
      this.router.navigate(['/doctor/subscription']); // Doctor needs to pay first
    }
  }

  // Resend OTP
  resendOTP() {
    this.authService.resendOTP(this.userEmail).subscribe({
      next: (response) => {
        this.toastService.showSuccess(response.message);
      },
      error: (error) => {
        this.toastService.showError(error.error.message);
      }
    });
  }

  // Go back to signup form
  goBack() {
    this.showOTPPage = false;
  }
}
```

### Step 2: Update Signup Template

```html
<!-- signup.component.html -->
<div class="signup-container">
  <!-- Signup Form (Step 1) -->
  <div *ngIf="!showOTPPage" class="signup-form">
    <h2>Create Account</h2>
    
    <form [formGroup]="signupForm" (ngSubmit)="onSubmit()">
      <div class="form-group">
        <label>I am a</label>
        <select formControlName="role">
          <option value="patient">Patient</option>
          <option value="doctor">Doctor</option>
        </select>
      </div>

      <div class="form-group">
        <label>Full Name</label>
        <input type="text" formControlName="name" placeholder="Enter your name">
      </div>

      <div class="form-group">
        <label>Date of Birth</label>
        <input type="date" formControlName="dateOfBirth">
      </div>

      <div class="form-group">
        <label>Email</label>
        <input type="email" formControlName="email" placeholder="Enter your email">
      </div>

      <div class="form-group">
        <label>Password</label>
        <input type="password" formControlName="password" placeholder="Enter password">
      </div>

      <div class="form-group">
        <label>Confirm Password</label>
        <input type="password" formControlName="confirmPassword" placeholder="Confirm password">
      </div>

      <div class="form-group" *ngIf="signupForm.get('role')?.value === 'patient'">
        <label>Blood Group</label>
        <select formControlName="bloodGroup">
          <option value="">Select Blood Group</option>
          <option value="A+">A+</option>
          <option value="A-">A-</option>
          <option value="B+">B+</option>
          <option value="B-">B-</option>
          <option value="AB+">AB+</option>
          <option value="AB-">AB-</option>
          <option value="O+">O+</option>
          <option value="O-">O-</option>
        </select>
      </div>

      <!-- Doctor-specific fields -->
      <div *ngIf="signupForm.get('role')?.value === 'doctor'">
        <div class="form-group">
          <label>Degree</label>
          <input type="text" formControlName="degree" placeholder="e.g., MBBS, MD">
        </div>

        <div class="form-group">
          <label>Specializations</label>
          <input type="text" formControlName="specializations" 
                 placeholder="e.g., Cardiology, Internal Medicine">
          <small>Separate multiple specializations with commas</small>
        </div>

        <div class="form-group">
          <label>Experience (Years)</label>
          <input type="number" formControlName="experienceYears" placeholder="Years of experience">
        </div>
      </div>

      <p class="info-text">
        📧 We'll send an OTP to your email for verification
      </p>

      <button type="submit" class="btn-primary" [disabled]="signupForm.invalid">
        Sign Up
      </button>
    </form>

    <p class="login-link">
      Already have an account? <a routerLink="/login">Login here</a>
    </p>
  </div>

  <!-- OTP Verification (Step 2) -->
  <div *ngIf="showOTPPage" class="otp-verification">
    <button class="back-button" (click)="goBack()">
      ← Back
    </button>

    <h2>Verify Your Email</h2>
    <p class="subtitle">
      We've sent a 6-digit OTP to<br>
      <strong>{{ userEmail }}</strong>
    </p>

    <div class="otp-input-container">
      <input type="text" 
             #otpInput
             maxlength="6" 
             placeholder="Enter 6-digit OTP"
             (input)="onOTPInput($event)">
    </div>

    <button class="btn-primary" (click)="verifyOTP(otpInput.value)">
      Verify & Create Account
    </button>

    <p class="resend-text">
      Didn't receive OTP? 
      <a href="javascript:void(0)" (click)="resendOTP()">Resend OTP</a>
    </p>

    <p class="info-text">
      ⏱️ OTP expires in 10 minutes
    </p>
  </div>
</div>
```

### Step 3: Update Auth Service

```typescript
// auth.service.ts
export class AuthService {
  private apiUrl = 'http://localhost:3000/api/auth';

  constructor(private http: HttpClient) {}

  // Signup (handles both steps)
  signup(data: any): Observable<any> {
    const endpoint = data.role === 'doctor' ? 
      `${this.apiUrl}/signup/doctor` : 
      `${this.apiUrl}/signup/patient`;
    
    return this.http.post(endpoint, data);
  }

  // Resend OTP
  resendOTP(email: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/resend-otp`, { email });
  }
}
```

### Step 4: Add Styling

```css
/* signup.component.css */
.signup-container {
  max-width: 500px;
  margin: 50px auto;
  padding: 30px;
  background: white;
  border-radius: 10px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

.otp-verification {
  text-align: center;
}

.back-button {
  float: left;
  background: none;
  border: none;
  color: #667eea;
  cursor: pointer;
  font-size: 16px;
}

.subtitle {
  color: #666;
  margin: 20px 0;
}

.otp-input-container {
  margin: 30px 0;
}

.otp-input-container input {
  width: 200px;
  height: 60px;
  font-size: 24px;
  text-align: center;
  letter-spacing: 10px;
  border: 2px solid #ddd;
  border-radius: 8px;
}

.resend-text {
  margin-top: 20px;
  color: #666;
}

.resend-text a {
  color: #667eea;
  text-decoration: none;
}

.info-text {
  margin-top: 15px;
  color: #999;
  font-size: 14px;
}
```

## Testing the Flow

### 1. Test Backend API
```bash
cd backend
node tests/test-signup-api.js
```

### 2. Test Email Delivery
```bash
cd backend
node tests/test-signup-otp.js
# Check your email for OTP
```

### 3. Test Complete Flow
1. Open frontend: `http://localhost:4200/signup`
2. Fill signup form
3. Click "Sign Up"
4. Check email for OTP
5. Enter OTP on verification page
6. Account created!

## Error Handling

### Common Errors

**400 Bad Request - Email already registered**
```json
{
  "success": false,
  "message": "Email is already registered. Please login instead."
}
```

**400 Bad Request - Invalid OTP**
```json
{
  "success": false,
  "message": "Invalid or expired OTP"
}
```

**400 Bad Request - OTP expired**
```json
{
  "success": false,
  "message": "Invalid or expired OTP"
}
```

**500 Internal Server Error - Email not sent**
```json
{
  "success": false,
  "message": "Failed to send OTP. Please try again."
}
```

## Security Features

✅ OTP expires in 10 minutes
✅ OTP can only be used once
✅ Rate limiting: 1 OTP per minute per email
✅ Email must be verified before account creation
✅ Password hashing with bcrypt
✅ JWT token authentication

## Flow Diagram

```
User fills form
      ↓
Click "Sign Up"
      ↓
POST /api/auth/signup/patient (without OTP)
      ↓
Backend sends OTP to email
      ↓
Response: { requiresOTP: true, email: "..." }
      ↓
Frontend shows OTP page
      ↓
User checks email, enters OTP
      ↓
POST /api/auth/signup/patient (with OTP)
      ↓
Backend verifies OTP
      ↓
Account created!
      ↓
Response: { token: "...", user: {...} }
      ↓
Redirect to dashboard
```

## Next Steps

1. ✅ Backend implementation complete
2. 🔄 Update frontend signup component
3. 🔄 Add OTP verification page
4. 🔄 Test complete flow
5. 🔄 Add loading states and error handling
6. 🔄 Add OTP resend functionality
7. 🔄 Add countdown timer for OTP expiry

## Support

If OTP email is not received:
- Check spam folder
- Verify EMAIL_USER and EMAIL_PASSWORD in .env
- Run: `node tests/test-signup-otp.js`
- Check backend logs for errors
