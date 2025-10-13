# Hospital Login Component - Visual Preview

## 🎨 Component Preview

### Login Page Layout

```
┌─────────────────────────────────────────────────────────────┐
│                                                               │
│                    Healthcare Platform                        │
│                      Hospital Portal                          │
│                                                               │
│                     Hospital Login                            │
│                                                               │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │ ⚠️ Your hospital registration is pending verification.  │ │
│  │    Please wait for admin approval.                      │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                               │
│  Email Address                                                │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │ hospital@example.com                                    │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                               │
│  Password                                                     │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │ ••••••••••••                                            │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                               │
│  ☑ Remember me                                                │
│                                                               │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │                      Login                              │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                               │
│                                    Forgot Password?           │
│                                                               │
│  ─────────────────────────────────────────────────────────── │
│                                                               │
│  Don't have an account? Register your hospital               │
│                                                               │
│                  ← Back to main login                         │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

## 🎯 Key Features Visualization

### 1. Verification Status Messages

#### Pending Status
```
┌─────────────────────────────────────────────────────────────┐
│ 🕐 Your hospital registration is pending verification.      │
│    Please wait for admin approval.                          │
└─────────────────────────────────────────────────────────────┘
```
- Yellow/amber background (#fef3c7)
- Clock icon
- Informative message

#### Rejected Status
```
┌─────────────────────────────────────────────────────────────┐
│ ❌ Your hospital registration has been rejected.            │
│    Reason: Incomplete documentation provided                │
└─────────────────────────────────────────────────────────────┘
```
- Red background (#fee2e2)
- Error icon
- Shows specific rejection reason

### 2. Form Validation

#### Email Validation
```
Email Address
┌─────────────────────────────────────────────────────────────┐
│ invalid-email                                               │ ← Red border
└─────────────────────────────────────────────────────────────┘
❌ Please enter a valid email address
```

#### Password Validation
```
Password
┌─────────────────────────────────────────────────────────────┐
│ 1234                                                        │ ← Red border
└─────────────────────────────────────────────────────────────┘
❌ Password must be at least 8 characters
```

### 3. Loading State

```
┌─────────────────────────────────────────────────────────────┐
│                  ⟳ Logging in...                            │ ← Disabled, gray
└─────────────────────────────────────────────────────────────┘
```
- Spinning icon
- "Logging in..." text
- Button disabled during request

### 4. Error Message Display

```
┌─────────────────────────────────────────────────────────────┐
│ ⚠️ Login failed. Please check your credentials and try     │
│    again.                                                   │
└─────────────────────────────────────────────────────────────┘
```
- Red background
- Warning icon
- Clear error message

## 🎨 Color Scheme

### Primary Colors
- **Background Gradient:** #667eea → #764ba2 (Purple-blue)
- **Card Background:** #ffffff (White)
- **Primary Button:** #667eea → #764ba2 (Gradient)
- **Text:** #1f2937 (Dark gray)

### Status Colors
- **Pending:** #fef3c7 (Yellow/amber)
- **Rejected:** #fee2e2 (Red)
- **Success:** #10b981 (Green)
- **Error:** #ef4444 (Red)

### Interactive States
- **Input Focus:** #667eea border with shadow
- **Button Hover:** Lift effect with shadow
- **Link Hover:** #5568d3 (Darker purple)

## 📱 Responsive Behavior

### Desktop (> 640px)
```
┌─────────────────────────────────────────────────────────────┐
│                                                               │
│                    [Full-width card]                          │
│                    Max-width: 450px                           │
│                    Centered on screen                         │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

### Mobile (< 640px)
```
┌───────────────────────────────┐
│                               │
│   [Responsive card]           │
│   Reduced padding             │
│   Smaller fonts               │
│   Full-width inputs           │
│                               │
└───────────────────────────────┘
```

## 🔄 User Flow

### Successful Login Flow
```
1. User enters email & password
   ↓
2. User clicks "Login" button
   ↓
3. Button shows loading state
   ↓
4. Backend validates credentials
   ↓
5. Token stored (localStorage or sessionStorage)
   ↓
6. Redirect to /hospital/dashboard
```

### Pending Verification Flow
```
1. User enters email & password
   ↓
2. User clicks "Login" button
   ↓
3. Backend returns "pending" status
   ↓
4. Yellow alert box appears
   ↓
5. User sees: "Pending verification" message
   ↓
6. User waits for admin approval
```

### Rejected Application Flow
```
1. User enters email & password
   ↓
2. User clicks "Login" button
   ↓
3. Backend returns "rejected" status
   ↓
4. Red alert box appears
   ↓
5. User sees rejection reason
   ↓
6. User can contact admin or re-register
```

## 🎭 Animations

### Page Load
- **Slide-up animation:** Card slides up from bottom with fade-in
- **Duration:** 0.4s
- **Easing:** ease-out

### Button Hover
- **Lift effect:** Button moves up 2px
- **Shadow:** Adds depth with shadow
- **Duration:** 0.3s

### Input Focus
- **Border color:** Changes to primary color
- **Shadow:** Adds focus ring
- **Duration:** 0.3s

### Loading Spinner
- **Rotation:** Continuous 360° spin
- **Duration:** 1s linear infinite

## 🔗 Navigation Links

### Primary Links
1. **Forgot Password** → `/forgot-password`
2. **Register Hospital** → `/hospital/register`
3. **Back to Main Login** → `/login`

### Link Styling
- Default: Purple (#667eea)
- Hover: Darker purple (#5568d3) with underline
- Transition: 0.3s smooth

## 📊 Component State Management

### Form States
```typescript
{
  email: string,           // User input
  password: string,        // User input
  rememberMe: boolean      // Checkbox state
}
```

### UI States
```typescript
{
  loading: boolean,                              // Loading indicator
  errorMessage: string,                          // Error display
  verificationMessage: string,                   // Status message
  verificationStatus: 'pending' | 'verified' | 'rejected' | null
}
```

### Storage Strategy
```typescript
if (rememberMe) {
  localStorage.setItem('hospitalToken', token);
  localStorage.setItem('hospitalData', JSON.stringify(hospital));
} else {
  sessionStorage.setItem('hospitalToken', token);
  sessionStorage.setItem('hospitalData', JSON.stringify(hospital));
}
```

## ✨ Accessibility Features

1. **Semantic HTML:** Proper form elements and labels
2. **ARIA Labels:** Screen reader support
3. **Keyboard Navigation:** Tab order and focus states
4. **Error Messages:** Associated with form fields
5. **Color Contrast:** WCAG AA compliant
6. **Focus Indicators:** Visible focus rings

## 🎯 Success Criteria

✅ All form fields validate correctly
✅ Remember me stores token persistently
✅ Forgot password link navigates correctly
✅ Verification status messages display properly
✅ Successful login redirects to dashboard
✅ Error messages are clear and helpful
✅ Responsive design works on all devices
✅ Loading states provide feedback
✅ Animations are smooth and professional

---

**Component Status:** ✅ Complete and Production-Ready
