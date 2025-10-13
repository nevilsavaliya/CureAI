# Hospital Registration Component - Visual Preview

## Component Structure

```
┌─────────────────────────────────────────────────────────────┐
│                   Healthcare Platform                        │
│              Hospital Registration Portal                    │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│  ████████████████░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░  40%  │ Progress Bar
├─────────────────────────────────────────────────────────────┤
│   ●      ○      ○      ○      ○                             │ Step Indicators
│ Basic  Hospital Contact Special  Docs                       │
│  Info  Details  Address izations                            │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Step Title                                                  │
│  Step description text                                       │
│                                                              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ Form Fields                                            │ │
│  │ [Input boxes with validation]                          │ │
│  │ [Error messages in red]                                │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                              │
│  ┌──────────────┐  ┌──────────────┐                        │
│  │  ← Previous  │  │    Next →    │                        │
│  └──────────────┘  └──────────────┘                        │
│                                                              │
│  Already have an account? Login here                        │
└─────────────────────────────────────────────────────────────┘
```

## Step-by-Step Breakdown

### Step 1: Basic Information
```
┌─────────────────────────────────────────┐
│ Contact Person Name *                   │
│ ┌─────────────────────────────────────┐ │
│ │ Enter your full name                │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ Email Address *                         │
│ ┌─────────────────────────────────────┐ │
│ │ hospital@example.com                │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ Password *                              │
│ ┌─────────────────────────────────┬──┐ │
│ │ ••••••••                        │👁│ │
│ └─────────────────────────────────┴──┘ │
│                                         │
│ Confirm Password *                      │
│ ┌─────────────────────────────────┬──┐ │
│ │ ••••••••                        │👁│ │
│ └─────────────────────────────────┴──┘ │
└─────────────────────────────────────────┘
```

### Step 2: Hospital Details
```
┌─────────────────────────────────────────┐
│ Hospital Name *                         │
│ ┌─────────────────────────────────────┐ │
│ │ Enter hospital name                 │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ Registration Number *                   │
│ ┌─────────────────────────────────────┐ │
│ │ Enter registration number           │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ Number of Beds *                        │
│ ┌─────────────────────────────────────┐ │
│ │ 100                                 │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ Website (Optional)                      │
│ ┌─────────────────────────────────────┐ │
│ │ https://www.example.com             │ │
│ └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

### Step 3: Contact & Address
```
┌─────────────────────────────────────────┐
│ Contact Number *    Emergency Contact * │
│ ┌──────────────┐    ┌──────────────┐   │
│ │ +1234567890  │    │ +1234567890  │   │
│ └──────────────┘    └──────────────┘   │
│                                         │
│ Street Address *                        │
│ ┌─────────────────────────────────────┐ │
│ │ 123 Main Street                     │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ City *              State *             │
│ ┌──────────────┐    ┌──────────────┐   │
│ │ New York     │    │ NY           │   │
│ └──────────────┘    └──────────────┘   │
│                                         │
│ ZIP Code *          Country *           │
│ ┌──────────────┐    ┌──────────────┐   │
│ │ 10001        │    │ USA          │   │
│ └──────────────┘    └──────────────┘   │
└─────────────────────────────────────────┘
```

### Step 4: Specializations & Facilities
```
┌─────────────────────────────────────────┐
│ Specializations * (Select at least one) │
│                                         │
│ ┌──────────────┐  ┌──────────────┐    │
│ │☑ Cardiology  │  │☐ Neurology   │    │
│ └──────────────┘  └──────────────┘    │
│ ┌──────────────┐  ┌──────────────┐    │
│ │☑ Orthopedics │  │☐ Pediatrics  │    │
│ └──────────────┘  └──────────────┘    │
│ ┌──────────────┐  ┌──────────────┐    │
│ │☐ Oncology    │  │☐ Dermatology │    │
│ └──────────────┘  └──────────────┘    │
│                                         │
│ 2 selected                              │
│                                         │
│ Facilities (Optional)                   │
│                                         │
│ ┌──────────────┐  ┌──────────────┐    │
│ │☑ ICU         │  │☑ Emergency   │    │
│ └──────────────┘  └──────────────┘    │
│ ┌──────────────┐  ┌──────────────┐    │
│ │☐ Laboratory  │  │☐ Pharmacy    │    │
│ └──────────────┘  └──────────────┘    │
│                                         │
│ 2 selected                              │
└─────────────────────────────────────────┘
```

### Step 5: Document Upload
```
┌─────────────────────────────────────────┐
│ Required Documents *                    │
│ Please upload: Registration Certificate,│
│ Medical License, and other documents    │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │           📄                        │ │
│ │  Click to upload or drag and drop  │ │
│ │  PDF, JPG, PNG (Max 10MB each)     │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ Uploaded Documents (2)                  │
│ ┌─────────────────────────────────────┐ │
│ │ 📎 registration.pdf (245 KB)    ✕  │ │
│ │ 📎 license.jpg (189 KB)         ✕  │ │
│ └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

## Color Scheme

### Primary Colors
- **Background Gradient**: Purple-blue (#667eea to #764ba2)
- **Card Background**: White (#ffffff)
- **Primary Button**: Purple-blue gradient
- **Success**: Green (#10b981)
- **Error**: Red (#ef4444)

### Status Colors
- **Active Step**: Purple-blue (#667eea)
- **Completed Step**: Green (#10b981)
- **Inactive Step**: Gray (#e5e7eb)

## Responsive Behavior

### Desktop (> 768px)
- Full width card (max 700px)
- Two-column layout for contact fields
- Grid layout for checkboxes (2-3 columns)

### Tablet (768px)
- Single column layout
- Adjusted spacing
- Smaller step indicators

### Mobile (< 480px)
- Compact step labels (only active shown)
- Single column for all fields
- Touch-friendly buttons
- Stacked navigation buttons

## Animations

1. **Page Load**: Slide up animation (0.5s)
2. **Step Change**: Fade in animation (0.3s)
3. **Progress Bar**: Smooth width transition (0.3s)
4. **Button Hover**: Lift effect with shadow
5. **Input Focus**: Border color change with glow

## User Flow

```
Start
  ↓
Step 1: Basic Info
  ↓ (Validate)
Step 2: Hospital Details
  ↓ (Validate)
Step 3: Contact & Address
  ↓ (Validate)
Step 4: Specializations
  ↓ (Check at least 1)
Step 5: Documents
  ↓ (Check at least 1 file)
Submit
  ↓
Success Toast
  ↓
Redirect to Login (2s delay)
```

## Error Handling

### Validation Errors
- Show below each field
- Red border on invalid input
- Clear, specific messages
- Only show after user interaction

### Submission Errors
- Toast notification
- Keep user on current step
- Display server error message
- Allow retry

### Success Flow
- Green toast notification
- Success message
- Automatic redirect
- Clear instructions

## Accessibility Features

- Semantic HTML
- Label associations
- Keyboard navigation
- Focus indicators
- Error announcements
- Touch-friendly targets (min 44px)
- High contrast text
- Clear visual hierarchy
