# User Details Panel Component

## Overview

The User Details Panel component displays detailed information about a user (patient or doctor) including avatar, demographic information, medical tags, action buttons, and expandable sections. It's designed to be role-agnostic and can display either patient or doctor details depending on the context.

## Location

`frontend/src/app/shared/dashboard/components/user-details-panel/`

## Inputs

| Input | Type | Default | Description |
|-------|------|---------|-------------|
| `config` | `UserDetailsPanelConfig` | Required | Panel configuration object |
| `loading` | `boolean` | `false` | Shows skeleton loader when true |
| `error` | `string \| null` | `null` | Error message to display |
| `emptyMessage` | `string` | `'No user details available'` | Message when no data |

### UserDetailsPanelConfig Interface

```typescript
interface UserDetailsPanelConfig {
  title: string;                  // Panel title
  user: UserDetails;              // User information
  actions?: ActionButton[];       // Action buttons
  sections?: DetailSection[];     // Expandable sections
}

interface UserDetails {
  avatar?: string;                // Avatar image URL
  name: string;                   // User name
  subtitle: string;               // Reason/specialization
  demographics?: DemographicInfo[];  // Demographic data
  tags?: Tag[];                   // Color-coded tags
}

interface DemographicInfo {
  label: string;                  // Field label
  value: string;                  // Field value
}

interface Tag {
  text: string;                   // Tag text
  color: 'primary' | 'warning' | 'danger' | 'success' | 'info';  // Tag color
}

interface ActionButton {
  icon: string;                   // Icon identifier
  label: string;                  // Button label
  onClick: () => void;            // Click handler
}

interface DetailSection {
  title: string;                  // Section title
  content: string | string[];     // Section content
}
```

## Outputs

| Output | Type | Description |
|--------|------|-------------|
| `actionClick` | `EventEmitter<{ action: string; button: ActionButton }>` | Emitted when action button is clicked |
| `retry` | `EventEmitter<void>` | Emitted when retry button is clicked in error state |

## Usage Examples

### Patient Details (Doctor Dashboard)

```typescript
// In component.ts
patientDetailsConfig: UserDetailsPanelConfig = {
  title: 'Next Patient',
  user: {
    avatar: '/assets/avatars/patient.jpg',
    name: 'Sarah Johnson',
    subtitle: 'Diabetes Follow-up',
    demographics: [
      { label: 'Date of Birth', value: 'Jan 15, 1985' },
      { label: 'Sex', value: 'Female' },
      { label: 'Weight', value: '65 kg' },
      { label: 'Last Appointment', value: 'Dec 10, 2025' },
      { label: 'Height', value: '165 cm' },
      { label: 'Registration Date', value: 'Mar 5, 2023' }
    ],
    tags: [
      { text: 'Asthma', color: 'warning' },
      { text: 'Hypertension', color: 'danger' },
      { text: 'Type 2 Diabetes', color: 'info' }
    ]
  },
  actions: [
    {
      icon: 'phone',
      label: 'Call',
      onClick: () => this.callPatient()
    },
    {
      icon: 'document',
      label: 'Documents',
      onClick: () => this.viewDocuments()
    },
    {
      icon: 'chat',
      label: 'Chat',
      onClick: () => this.openChat()
    }
  ],
  sections: [
    {
      title: 'Last Prescriptions',
      content: [
        'Metformin 500mg - 2x daily',
        'Lisinopril 10mg - 1x daily',
        'Albuterol Inhaler - as needed'
      ]
    },
    {
      title: 'Medical Notes',
      content: 'Patient reports improved blood sugar control. Continue current medication regimen.'
    }
  ]
};

// In template
<app-user-details-panel
  [config]="patientDetailsConfig"
  (actionClick)="onActionClick($event)">
</app-user-details-panel>
```

### Doctor Details (Patient Dashboard)

```typescript
doctorDetailsConfig: UserDetailsPanelConfig = {
  title: 'Your Doctor',
  user: {
    avatar: '/assets/avatars/doctor.jpg',
    name: 'Dr. Michael Chen',
    subtitle: 'Cardiologist',
    demographics: [
      { label: 'Specialization', value: 'Cardiology' },
      { label: 'Experience', value: '15 years' },
      { label: 'Hospital', value: 'City Medical Center' },
      { label: 'Rating', value: '4.9/5.0' }
    ],
    tags: [
      { text: 'Board Certified', color: 'success' },
      { text: 'Top Rated', color: 'primary' }
    ]
  },
  actions: [
    {
      icon: 'calendar',
      label: 'Book Appointment',
      onClick: () => this.bookAppointment()
    },
    {
      icon: 'chat',
      label: 'Message',
      onClick: () => this.sendMessage()
    }
  ]
};
```

### Minimal Configuration

```typescript
minimalConfig: UserDetailsPanelConfig = {
  title: 'User Details',
  user: {
    name: 'John Doe',
    subtitle: 'General Consultation'
  }
  // No avatar, demographics, tags, actions, or sections
};
```

### With Loading State

```typescript
<app-user-details-panel
  [config]="userDetailsConfig"
  [loading]="isLoading">
</app-user-details-panel>
```

### With Error Handling

```typescript
<app-user-details-panel
  [config]="userDetailsConfig"
  [error]="errorMessage"
  (retry)="loadUserDetails()">
</app-user-details-panel>
```

## Features

### Avatar Display
- Shows user avatar image
- Automatic fallback to initials if image unavailable
- Handles image load errors gracefully
- Circular avatar with border

### Demographic Grid
- Responsive 2-column grid layout
- Label-value pairs
- Adapts to mobile (single column)
- Clean, organized presentation

### Color-Coded Tags
- Five color variants (primary, success, warning, danger, info)
- Pill-shaped design
- Wraps to multiple lines if needed
- Semantic color meanings

### Action Buttons
- Icon-based buttons
- Hover and focus states
- Keyboard accessible
- Customizable click handlers

### Expandable Sections
- Click to expand/collapse
- Smooth animations
- Supports single or multiple content items
- Maintains state across interactions

## Accessibility Features

### ARIA Labels and Roles
- Panel has descriptive `aria-label`
- Action buttons have contextual labels
- Expandable sections use `aria-expanded`
- Tags have proper role attributes

### Keyboard Navigation
- **Tab**: Navigate between action buttons and sections
- **Enter/Space**: Activate buttons or toggle sections
- **Escape**: Close expanded sections (optional)
- Visible focus indicators

### Screen Reader Support
- Avatar announces user name
- Demographics are announced as label-value pairs
- Tags are announced with their text
- Action buttons announce: "[Action] [User Name]"
- Section state changes are announced

### Focus Management
- Logical tab order
- Focus visible on all interactive elements
- Focus maintained during interactions

## States

### Loading State
- Displays skeleton loaders
- Maintains layout structure
- Shows shimmer animation
- Hides actual content

### Empty State
- Shows when no user data
- Displays custom empty message
- Provides context

### Error State
- Displays error message
- Shows retry button
- Maintains accessibility

### Normal State
- Displays all user information
- Enables all interactions
- Shows expandable sections

## Styling

### CSS Classes
- `.user-details-panel` - Main container
- `.panel-header` - Title section
- `.user-avatar` - Avatar container
- `.user-avatar-image` - Avatar image
- `.user-avatar-initials` - Initials fallback
- `.user-info` - Name and subtitle
- `.demographics-grid` - Demographic information grid
- `.demographic-item` - Individual demographic field
- `.tags-container` - Tags wrapper
- `.tag` - Individual tag
- `.tag-primary`, `.tag-success`, etc. - Tag color variants
- `.action-buttons` - Action buttons container
- `.action-button` - Individual action button
- `.detail-section` - Expandable section
- `.section-header` - Section title (clickable)
- `.section-content` - Section content (expandable)

### Customization Example

```css
/* Customize avatar size */
.user-details-panel .user-avatar {
  width: 80px;
  height: 80px;
}

/* Customize demographic grid */
.user-details-panel .demographics-grid {
  grid-template-columns: 1fr;  /* Single column */
  gap: 0.5rem;
}

/* Customize tags */
.user-details-panel .tag {
  font-size: 0.75rem;
  padding: 0.25rem 0.75rem;
  border-radius: 1rem;
}

/* Customize action buttons */
.user-details-panel .action-button {
  padding: 0.75rem;
  border-radius: 0.5rem;
}
```

## Tag Colors

### Color Meanings

| Color | Use Case | Example |
|-------|----------|---------|
| `primary` | General information | "Board Certified", "Verified" |
| `success` | Positive status | "Healthy", "Controlled", "Top Rated" |
| `warning` | Caution | "Asthma", "Allergies", "Monitor" |
| `danger` | Critical | "Hypertension", "High Risk", "Urgent" |
| `info` | Informational | "Type 2 Diabetes", "Chronic Condition" |

## Troubleshooting

### Issue: Avatar not displaying
**Solution**: Check the following:
1. Avatar URL is valid and accessible
2. Image has proper CORS headers
3. Check browser console for errors

```typescript
// Verify URL
console.log('Avatar URL:', this.config.user.avatar);

// The component will automatically fall back to initials
```

### Issue: Demographics not showing in grid
**Solution**: Ensure demographics array is properly formatted:

```typescript
// Correct
demographics: [
  { label: 'Age', value: '35' },
  { label: 'Gender', value: 'Male' }
]

// Incorrect - missing label or value
demographics: [
  { label: 'Age' },  // ✗ Missing value
  { value: 'Male' }  // ✗ Missing label
]
```

### Issue: Action buttons not working
**Solution**: Verify that onClick handlers are provided:

```typescript
// Correct
actions: [
  {
    icon: 'phone',
    label: 'Call',
    onClick: () => this.callUser()  // Must be a function
  }
]

// Incorrect
actions: [
  {
    icon: 'phone',
    label: 'Call'
    // Missing onClick
  }
]
```

### Issue: Sections not expanding
**Solution**: Ensure sections are properly configured:

```typescript
// Correct
sections: [
  {
    title: 'Medical History',
    content: 'Patient history details...'
  }
]

// Also correct - array content
sections: [
  {
    title: 'Medications',
    content: ['Med 1', 'Med 2', 'Med 3']
  }
]
```

### Issue: Tags showing wrong colors
**Solution**: Use only valid color values:

```typescript
// Valid colors
color: 'primary' | 'success' | 'warning' | 'danger' | 'info'

// Invalid - will default to primary
color: 'blue'  // ✗
color: 'red'   // ✗
```

### Issue: Initials showing "?"
**Solution**: This happens when the name is empty or undefined:

```typescript
// Correct
user: {
  name: 'John Doe',  // Will show "JD"
  subtitle: 'Consultation'
}

// Incorrect
user: {
  name: '',  // Will show "?"
  subtitle: 'Consultation'
}
```

### Issue: Action click event not firing
**Solution**: Make sure you're subscribing to the output event:

```typescript
<app-user-details-panel
  [config]="config"
  (actionClick)="handleAction($event)">  // Must subscribe
</app-user-details-panel>

// In component
handleAction(event: { action: string; button: ActionButton }) {
  console.log('Action clicked:', event.action);
}
```

## Performance Considerations

### Image Loading
- Images load lazily
- Automatic fallback prevents broken images
- No additional requests for initials

### Section Expansion
- Smooth CSS transitions
- No layout thrashing
- Efficient DOM updates

### Change Detection
- Uses default change detection
- Efficient updates on config changes

## Related Components

- `appointment-list` - Often displayed alongside
- `calendar-widget` - Complementary scheduling component
- `request-list` - Similar user information display

## Requirements Satisfied

- 4.1: Display user details panel with avatar and information
- 4.2: Show demographic information
- 4.3: Display last appointment date and other details
- 4.4: Show medical history with condition tags
- 4.5: Provide action buttons for contact and documents
- 4.6: Display expandable sections
- 9.2: Responsive layout
- 10.1: Angular component implementation
