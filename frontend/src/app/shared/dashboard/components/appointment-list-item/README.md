# Appointment List Item Component

## Overview

The Appointment List Item component displays a single appointment with avatar, name, subtitle, and time/status information. It's a child component used by the Appointment List component and supports click handlers, keyboard accessibility, and automatic fallback to initials when avatars are unavailable.

## Location

`frontend/src/app/shared/dashboard/components/appointment-list-item/`

## Inputs

| Input | Type | Required | Description |
|-------|------|----------|-------------|
| `appointment` | `AppointmentItem` | Yes | The appointment data to display |

### AppointmentItem Interface

```typescript
interface AppointmentItem {
  id: string;                       // Unique identifier
  avatar?: string;                  // Avatar image URL (optional)
  name: string;                     // Patient/Doctor name
  subtitle: string;                 // Diagnosis/reason for visit
  time: string;                     // Time or status text
  status?: 'ongoing' | 'upcoming' | 'completed';  // Visual status indicator
  onClick?: () => void;             // Optional click handler
}
```

## Outputs

| Output | Type | Description |
|--------|------|-------------|
| `itemClick` | `EventEmitter<string>` | Emitted when the item is clicked, passes appointment ID |

## Usage Examples

### Basic Usage

```typescript
// In parent component template
<app-appointment-list-item
  [appointment]="appointmentData"
  (itemClick)="onItemClick($event)">
</app-appointment-list-item>

// In parent component.ts
appointmentData: AppointmentItem = {
  id: '123',
  avatar: '/assets/avatars/patient.jpg',
  name: 'John Doe',
  subtitle: 'Regular Checkup',
  time: '10:00 AM',
  status: 'upcoming'
};

onItemClick(appointmentId: string) {
  console.log('Clicked appointment:', appointmentId);
  this.router.navigate(['/appointments', appointmentId]);
}
```

### With Status Badge

```typescript
// Ongoing appointment
appointment = {
  id: '1',
  name: 'Sarah Johnson',
  subtitle: 'Diabetes Follow-up',
  time: 'On Going',
  status: 'ongoing'  // Shows green "On Going" badge
};

// Upcoming appointment
appointment = {
  id: '2',
  name: 'Mike Wilson',
  subtitle: 'Annual Physical',
  time: '2:30 PM',
  status: 'upcoming'  // Shows blue badge
};

// Completed appointment
appointment = {
  id: '3',
  name: 'Emily Brown',
  subtitle: 'Lab Results Review',
  time: '9:00 AM',
  status: 'completed'  // Shows gray badge
};
```

### Without Avatar (Initials Fallback)

```typescript
// Component automatically generates initials
appointment = {
  id: '4',
  name: 'Robert Anderson',  // Will show "RA" as initials
  subtitle: 'Consultation',
  time: '11:00 AM'
  // No avatar provided - will use initials
};
```

### With Click Handler

```typescript
appointment = {
  id: '5',
  name: 'Lisa Chen',
  subtitle: 'Follow-up',
  time: '3:00 PM',
  onClick: () => {
    // Custom click logic
    this.openAppointmentDetails('5');
  }
};
```

## Accessibility Features

### ARIA Labels
- Automatically generates descriptive ARIA labels
- Format: "Appointment with [name], [subtitle], [time/status]"
- Example: "Appointment with John Doe, Regular Checkup, 10:00 AM"

### Keyboard Navigation
- Fully keyboard accessible when clickable
- **Tab**: Focus the item
- **Enter**: Activate the appointment
- **Space**: Activate the appointment
- Focus indicator is clearly visible

### Screen Reader Support
- All content is properly announced
- Status is announced as part of the ARIA label
- Image alt text uses patient/doctor name
- Fallback initials are announced correctly

### Focus Management
- Maintains focus during interactions
- Visible focus ring for keyboard users
- Proper tab order

## Visual States

### Default State
- Shows avatar or initials
- Displays name and subtitle
- Shows time or status text
- Subtle hover effect

### Hover State
- Background color change
- Cursor changes to pointer (if clickable)
- Smooth transition animation

### Focus State
- Visible focus ring
- Maintains hover styling
- Clear visual indicator

### Active State
- Pressed appearance
- Immediate visual feedback

## Avatar Handling

### With Valid Avatar URL
```typescript
avatar: 'https://example.com/avatar.jpg'
// Displays the image
```

### Without Avatar URL
```typescript
// No avatar property
// Automatically generates initials from name
name: 'John Doe'  // Shows "JD"
```

### Avatar Load Error
```typescript
avatar: 'https://invalid-url.com/missing.jpg'
// Falls back to initials automatically
// Error is handled gracefully
```

### Initials Generation Logic
- Single name: First letter (e.g., "John" → "J")
- Multiple names: First letter of first and last name (e.g., "John Doe" → "JD")
- Empty name: Shows "?" as fallback

## Status Badges

### Status Types and Colors

| Status | Display Text | Color | Use Case |
|--------|-------------|-------|----------|
| `ongoing` | "On Going" | Green | Currently in progress |
| `upcoming` | "Upcoming" | Blue | Scheduled for future |
| `completed` | "Completed" | Gray | Past appointment |

### Without Status
If no status is provided, only the time is displayed without a badge.

## Styling

### CSS Classes
- `.appointment-item` - Main container
- `.appointment-avatar` - Avatar container
- `.appointment-avatar-image` - Avatar image
- `.appointment-avatar-initials` - Initials fallback
- `.appointment-info` - Text content area
- `.appointment-name` - Name text
- `.appointment-subtitle` - Subtitle text
- `.appointment-time` - Time/status container
- `.status-badge` - Status badge
- `.status-ongoing`, `.status-upcoming`, `.status-completed` - Status-specific classes

### Customization Example

```css
/* Override in parent component or global styles */
.appointment-item {
  padding: 1rem;
  border-radius: 0.5rem;
}

.appointment-avatar {
  width: 48px;
  height: 48px;
}

.status-badge {
  font-size: 0.75rem;
  padding: 0.25rem 0.5rem;
}
```

## Troubleshooting

### Issue: Item not clickable
**Solution**: Ensure either the `onClick` property is set in the appointment object OR you're subscribing to the `itemClick` output:

```typescript
// Option 1: Using onClick
appointment = {
  id: '1',
  name: 'John',
  subtitle: 'Checkup',
  time: '10:00 AM',
  onClick: () => this.handleClick()
};

// Option 2: Using itemClick output
<app-appointment-list-item 
  [appointment]="appointment"
  (itemClick)="handleClick($event)">
</app-appointment-list-item>
```

### Issue: Avatar not displaying
**Solution**: Check the following:
1. Avatar URL is valid and accessible
2. Image has proper CORS headers if from external domain
3. Check browser console for image load errors

```typescript
// Verify URL is accessible
avatar: 'https://example.com/avatar.jpg'

// Check in browser console
// Look for 404 or CORS errors
```

### Issue: Initials showing wrong letters
**Solution**: Verify the name format. The component expects space-separated first and last names:

```typescript
// Correct
name: 'John Doe'  // Shows "JD"

// Single name
name: 'John'  // Shows "J"

// Multiple middle names
name: 'John Michael Doe'  // Shows "JD" (first and last)
```

### Issue: Status badge not showing
**Solution**: Ensure the status value is one of the valid options:

```typescript
// Valid statuses
status: 'ongoing'    // ✓
status: 'upcoming'   // ✓
status: 'completed'  // ✓

// Invalid - won't show badge
status: 'pending'    // ✗
status: 'cancelled'  // ✗
```

### Issue: Click event firing twice
**Solution**: This happens when both `onClick` and `itemClick` are used. Choose one approach:

```typescript
// Use EITHER onClick in the data
appointment = {
  onClick: () => this.handleClick()
};

// OR itemClick output (not both)
<app-appointment-list-item (itemClick)="handleClick($event)">
```

### Issue: Keyboard navigation not working
**Solution**: The item must be clickable (have onClick or itemClick subscriber) to be keyboard accessible. Also ensure the parent list component is properly handling keyboard events.

## Performance Considerations

### Image Loading
- Images are loaded lazily by the browser
- Failed images automatically fall back to initials
- No additional HTTP requests for initials

### Event Handling
- Click events are properly stopped from propagating
- Efficient event delegation
- No memory leaks from event listeners

## Related Components

- `appointment-list` - Parent component that uses this component
- `user-details-panel` - Similar avatar and name display pattern
- `request-list-item` - Similar structure for request items

## Requirements Satisfied

- 3.1: Display appointment with avatar, name, diagnosis, and time
- 3.2: Show status badges and specific times
- 3.5: Show profile images with fallback
- 9.4: Keyboard accessibility
- 10.1: Angular component implementation
