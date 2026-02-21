# Appointment List Component

## Overview

The Appointment List component displays a list of appointments with patient/doctor information. It supports loading states, empty states, error handling, click handlers, and keyboard navigation. The component is role-agnostic and can display either patient or doctor information depending on the context.

## Location

`frontend/src/app/shared/dashboard/components/appointment-list/`

## Inputs

| Input | Type | Default | Description |
|-------|------|---------|-------------|
| `config` | `AppointmentListConfig` | See below | Configuration object containing all list settings |
| `error` | `string \| null` | `null` | Error message to display if data loading fails |

### AppointmentListConfig Interface

```typescript
interface AppointmentListConfig {
  title: string;                    // List title (e.g., "Today's Appointments")
  appointments: AppointmentItem[];  // Array of appointment items
  showSeeAll?: boolean;             // Show "See All" link
  emptyMessage?: string;            // Message when no appointments
  loading?: boolean;                // Show loading skeleton
}
```

### AppointmentItem Interface

```typescript
interface AppointmentItem {
  id: string;                       // Unique identifier
  avatar?: string;                  // Avatar image URL
  name: string;                     // Patient/Doctor name
  subtitle: string;                 // Diagnosis/reason for visit
  time: string;                     // Time or status (e.g., "12:30 PM", "On Going")
  status?: 'ongoing' | 'upcoming' | 'completed';  // Appointment status
  onClick?: () => void;             // Optional click handler
}
```

## Outputs

| Output | Type | Description |
|--------|------|-------------|
| `appointmentClick` | `EventEmitter<string>` | Emitted when an appointment is clicked, passes appointment ID |
| `seeAllClick` | `EventEmitter<void>` | Emitted when "See All" link is clicked |
| `retry` | `EventEmitter<void>` | Emitted when retry button is clicked in error state |

## Usage Examples

### Basic Usage

```typescript
// In component.ts
appointmentConfig: AppointmentListConfig = {
  title: "Today's Appointments",
  appointments: [
    {
      id: '1',
      avatar: '/assets/avatars/patient1.jpg',
      name: 'John Doe',
      subtitle: 'Regular Checkup',
      time: '10:00 AM',
      status: 'upcoming'
    },
    {
      id: '2',
      name: 'Jane Smith',
      subtitle: 'Follow-up Consultation',
      time: 'On Going',
      status: 'ongoing'
    }
  ],
  showSeeAll: true,
  emptyMessage: 'No appointments scheduled for today'
};

// In template
<app-appointment-list
  [config]="appointmentConfig"
  (appointmentClick)="onAppointmentClick($event)"
  (seeAllClick)="navigateToAllAppointments()">
</app-appointment-list>
```

### With Loading State

```typescript
<app-appointment-list
  [config]="{ 
    title: 'Upcoming Appointments',
    appointments: [],
    loading: true
  }">
</app-appointment-list>
```

### With Error Handling

```typescript
<app-appointment-list
  [config]="appointmentConfig"
  [error]="errorMessage"
  (retry)="loadAppointments()">
</app-appointment-list>
```

### Doctor Dashboard Example

```typescript
// Shows patient information
appointmentConfig: AppointmentListConfig = {
  title: "Today's Appointments",
  appointments: [
    {
      id: '1',
      name: 'Sarah Johnson',
      subtitle: 'Diabetes Follow-up',
      time: '2:30 PM',
      status: 'upcoming',
      onClick: () => this.viewPatientDetails('1')
    }
  ]
};
```

### Patient Dashboard Example

```typescript
// Shows doctor information
appointmentConfig: AppointmentListConfig = {
  title: 'My Appointments',
  appointments: [
    {
      id: '1',
      name: 'Dr. Michael Chen',
      subtitle: 'Cardiology Consultation',
      time: '3:00 PM',
      status: 'upcoming'
    }
  ]
};
```

## Accessibility Features

### ARIA Labels and Roles
- List container has `role="list"` and descriptive `aria-label`
- Each appointment item has `role="listitem"`
- Status badges have appropriate ARIA labels
- Loading state uses `aria-busy="true"`
- Error state uses `role="alert"`

### Keyboard Navigation
- **Arrow Down**: Move focus to next appointment
- **Arrow Up**: Move focus to previous appointment
- **Home**: Move focus to first appointment
- **End**: Move focus to last appointment
- **Enter/Space**: Activate focused appointment

### Screen Reader Support
- Appointment items announce: "Appointment with [name], [subtitle], [time/status]"
- Empty state is properly announced
- Loading state provides feedback
- Error messages are announced immediately

### Focus Management
- Visible focus indicators on all interactive elements
- Logical tab order
- Focus is maintained during keyboard navigation

## States

### Loading State
- Displays skeleton loaders for 3 appointment items
- Maintains layout structure
- Shows shimmer animation

### Empty State
- Displays custom empty message
- Shows friendly icon
- Provides context-appropriate messaging

### Error State
- Displays error message
- Shows retry button
- Maintains accessibility

### Normal State
- Displays appointment items with avatars
- Shows status badges
- Enables all interactions

## Styling

### CSS Classes
- `.appointment-list` - Main container
- `.appointment-list-header` - Title and "See All" link
- `.appointment-list-content` - Scrollable content area
- `.appointment-item` - Individual appointment (via child component)
- `.see-all-link` - "See All" link styling

### Customization
You can override styles by targeting the component classes or using CSS custom properties.

## Child Components

This component uses:
- `app-appointment-list-item` - Renders individual appointment items

## Troubleshooting

### Issue: Appointments not displaying
**Solution**: Verify that the `appointments` array in the config is populated and each item has required fields (`id`, `name`, `subtitle`, `time`).

```typescript
// Check your data structure
console.log(this.appointmentConfig.appointments);
```

### Issue: Click events not firing
**Solution**: Make sure you're subscribing to the output event:

```typescript
// Correct
<app-appointment-list (appointmentClick)="handleClick($event)">

// Also works - using onClick in item
appointments: [{
  id: '1',
  name: 'John',
  subtitle: 'Checkup',
  time: '10:00 AM',
  onClick: () => this.handleClick('1')  // This will be called
}]
```

### Issue: Keyboard navigation not working
**Solution**: Ensure the list container has focus. Click on the list or tab to it first. Only appointments with `onClick` handlers are keyboard navigable.

### Issue: Avatar not showing, displaying initials instead
**Solution**: This is expected behavior. The component falls back to initials when:
- No avatar URL is provided
- Avatar image fails to load
- Avatar URL is invalid

To fix, provide valid avatar URLs:
```typescript
avatar: 'https://example.com/avatar.jpg'  // Must be accessible
```

### Issue: Status badge not displaying
**Solution**: Ensure the `status` property is set to one of the valid values:

```typescript
status: 'ongoing' | 'upcoming' | 'completed'
```

### Issue: "See All" link not showing
**Solution**: Set `showSeeAll: true` in the config and subscribe to the event:

```typescript
config = {
  // ...
  showSeeAll: true
};

<app-appointment-list (seeAllClick)="navigateToAll()">
```

## Performance Considerations

### TrackBy Function
The component uses `trackByAppointmentId` for efficient list rendering. Angular will only re-render items that have changed.

### Virtual Scrolling
For very long lists (100+ items), consider implementing virtual scrolling or pagination.

## Related Components

- `appointment-list-item` - Child component for individual items
- `user-details-panel` - Often displayed alongside appointment list
- `calendar-widget` - Complementary date selection component
- `dashboard-layout` - Use for arranging multiple components

## Requirements Satisfied

- 1.2: Base appointment list component with configuration
- 3.1: Display appointment list with patient/doctor information
- 3.2: Show status badges and appointment times
- 3.3: Provide "See All" link functionality
- 9.2: Vertical stacking on mobile devices
- 10.1: Angular component implementation
