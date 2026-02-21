# Calendar Widget Component

## Overview

The Calendar Widget component displays a monthly calendar with date highlighting, event markers, and navigation controls. It supports keyboard navigation, date selection, month navigation, and is fully accessible. The component is designed to work seamlessly in both doctor and patient dashboards.

## Location

`frontend/src/app/shared/dashboard/components/calendar-widget/`

## Inputs

| Input | Type | Default | Description |
|-------|------|---------|-------------|
| `config` | `CalendarConfig` | See below | Calendar configuration object |
| `loading` | `boolean` | `false` | Shows skeleton loader when true |
| `error` | `string \| null` | `null` | Error message to display |
| `emptyMessage` | `string` | `'No calendar data available'` | Message when no data |

### CalendarConfig Interface

```typescript
interface CalendarConfig {
  currentDate: Date;                    // Current/selected date
  highlightedDates?: Date[];            // Dates to highlight
  events?: CalendarEvent[];             // Events to display
  onDateClick?: (date: Date) => void;   // Date click handler
  onMonthChange?: (month: number, year: number) => void;  // Month change handler
}

interface CalendarEvent {
  date: Date;                           // Event date
  title: string;                        // Event title
  color?: string;                       // Event marker color
}
```

## Outputs

| Output | Type | Description |
|--------|------|-------------|
| `dateClick` | `EventEmitter<Date>` | Emitted when a date is clicked |
| `monthChange` | `EventEmitter<{ month: number; year: number }>` | Emitted when month is changed |
| `retry` | `EventEmitter<void>` | Emitted when retry button is clicked in error state |

## Usage Examples

### Basic Usage

```typescript
// In component.ts
calendarConfig: CalendarConfig = {
  currentDate: new Date(),
  highlightedDates: [
    new Date(2026, 1, 15),
    new Date(2026, 1, 20),
    new Date(2026, 1, 25)
  ]
};

// In template
<app-calendar-widget
  [config]="calendarConfig"
  (dateClick)="onDateClick($event)"
  (monthChange)="onMonthChange($event)">
</app-calendar-widget>

// Handle date clicks
onDateClick(date: Date) {
  console.log('Selected date:', date);
  this.router.navigate(['/appointments'], { 
    queryParams: { date: date.toISOString() } 
  });
}

// Handle month changes
onMonthChange(event: { month: number; year: number }) {
  console.log('Month changed to:', event.month, event.year);
  this.loadAppointmentsForMonth(event.month, event.year);
}
```

### With Events

```typescript
calendarConfig: CalendarConfig = {
  currentDate: new Date(),
  events: [
    {
      date: new Date(2026, 1, 15),
      title: 'Appointment with Dr. Smith',
      color: '#4F46E5'
    },
    {
      date: new Date(2026, 1, 20),
      title: 'Follow-up consultation',
      color: '#10B981'
    },
    {
      date: new Date(2026, 1, 25),
      title: 'Lab results review',
      color: '#F59E0B'
    }
  ]
};
```

### Doctor Dashboard Example

```typescript
// Show dates with appointments
calendarConfig: CalendarConfig = {
  currentDate: new Date(),
  highlightedDates: this.appointmentDates,
  events: this.appointments.map(apt => ({
    date: new Date(apt.date),
    title: `Appointment with ${apt.patientName}`,
    color: this.getStatusColor(apt.status)
  })),
  onDateClick: (date) => this.viewAppointmentsForDate(date)
};
```

### Patient Dashboard Example

```typescript
// Show patient's appointment dates
calendarConfig: CalendarConfig = {
  currentDate: new Date(),
  highlightedDates: this.myAppointmentDates,
  events: this.myAppointments.map(apt => ({
    date: new Date(apt.date),
    title: `Appointment with ${apt.doctorName}`,
    color: '#4F46E5'
  }))
};
```

### With Loading State

```typescript
<app-calendar-widget
  [config]="calendarConfig"
  [loading]="isLoadingCalendar">
</app-calendar-widget>
```

### With Error Handling

```typescript
<app-calendar-widget
  [config]="calendarConfig"
  [error]="errorMessage"
  (retry)="loadCalendarData()">
</app-calendar-widget>
```

## Features

### Month Navigation
- Previous/Next month buttons
- Displays current month and year
- Smooth transitions between months
- Emits `monthChange` event

### Date Highlighting
- Highlights current date (today)
- Highlights specified dates
- Visual distinction for highlighted dates
- Supports multiple highlighted dates

### Event Markers
- Small colored dots on dates with events
- Multiple events per date supported
- Custom colors for different event types
- Hover to see event count

### Date Selection
- Click dates to select
- Only current month dates are clickable
- Previous/next month dates are dimmed
- Emits `dateClick` event

### Keyboard Navigation
- **Arrow Keys**: Navigate between dates
- **Enter/Space**: Select focused date
- **Tab**: Move to navigation buttons
- Visible focus indicators

## Accessibility Features

### ARIA Labels and Roles
- Calendar has `role="application"` with descriptive label
- Navigation buttons have clear labels:
  - "Previous month"
  - "Next month"
- Dates have descriptive labels including day, month, year
- Current date is announced as "Today"
- Event markers are announced

### Keyboard Navigation
- **Arrow Left**: Move to previous day
- **Arrow Right**: Move to next day
- **Arrow Up**: Move to same day previous week
- **Arrow Down**: Move to same day next week
- **Enter/Space**: Select focused date
- **Tab**: Navigate to month controls
- Focus indicator clearly visible

### Screen Reader Support
- Month and year are announced
- Day names are properly labeled
- Dates announce: "[Day] [Month] [Date], [Year]"
- Today is announced as "Today, [full date]"
- Events are announced: "[Date] has [count] event(s)"
- Highlighted dates are indicated

### Focus Management
- Logical focus order
- Focus visible on all interactive elements
- Focus maintained during month navigation
- Initial focus on today's date

## Calendar Layout

### Grid Structure
```
┌─────────────────────────────────────┐
│  ← February 2026 →                  │
├─────────────────────────────────────┤
│ Su  Mo  Tu  We  Th  Fr  Sa         │
├─────────────────────────────────────┤
│ 26  27  28  29  30  31  1          │
│ 2   3   4   5   6   7   8          │
│ 9   10  11  12  13  14  15         │
│ 16  17  18  19  20  21  22         │
│ 23  24  25  26  27  28  1          │
│ 2   3   4   5   6   7   8          │
└─────────────────────────────────────┘
```

### Date States
- **Current Month**: Normal appearance, clickable
- **Other Months**: Dimmed, not clickable
- **Today**: Highlighted with special styling
- **Highlighted Dates**: Colored background
- **Dates with Events**: Small colored dot indicator

## States

### Loading State
- Displays skeleton loader
- Maintains calendar dimensions
- Shows shimmer animation
- Hides calendar content

### Empty State
- Shows when no calendar data
- Displays custom empty message
- Provides context

### Error State
- Displays error message
- Shows retry button
- Maintains layout

### Normal State
- Displays interactive calendar
- Shows all dates and events
- Enables navigation

## Styling

### CSS Classes
- `.calendar-widget` - Main container
- `.calendar-header` - Month/year and navigation
- `.calendar-nav-button` - Navigation buttons
- `.calendar-month-year` - Month and year display
- `.calendar-grid` - Calendar grid container
- `.calendar-day-names` - Day name headers
- `.calendar-day-name` - Individual day name
- `.calendar-dates` - Dates grid
- `.calendar-date` - Individual date cell
- `.calendar-date-current-month` - Current month dates
- `.calendar-date-other-month` - Other month dates
- `.calendar-date-today` - Today's date
- `.calendar-date-highlighted` - Highlighted dates
- `.calendar-date-has-events` - Dates with events
- `.calendar-event-marker` - Event indicator dot

### Customization Example

```css
/* Customize calendar size */
.calendar-widget {
  width: 350px;
}

/* Customize today's date */
.calendar-date-today {
  background-color: #4F46E5;
  color: white;
  font-weight: bold;
}

/* Customize highlighted dates */
.calendar-date-highlighted {
  background-color: #E0E7FF;
  border: 2px solid #4F46E5;
}

/* Customize event markers */
.calendar-event-marker {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background-color: #10B981;
}
```

## Date Utilities

### Date Comparison
The component includes utilities for comparing dates:
- `isSameDate(date1, date2)` - Check if two dates are the same day
- `isToday(date)` - Check if a date is today
- `isHighlighted(date)` - Check if a date is highlighted

### Date Generation
- Generates calendar grid with proper week alignment
- Includes dates from previous/next months to fill grid
- Always shows 6 weeks (42 days) for consistent layout

## Troubleshooting

### Issue: Calendar not displaying
**Solution**: Verify that the config object is provided with a valid currentDate:

```typescript
// Correct
config = {
  currentDate: new Date()  // Valid Date object
};

// Incorrect
config = {
  currentDate: '2026-02-21'  // String, not Date object
};
```

### Issue: Dates not clickable
**Solution**: Only current month dates are clickable. Previous/next month dates are dimmed and non-interactive. This is by design.

### Issue: Highlighted dates not showing
**Solution**: Ensure dates are Date objects and match exactly (same day, month, year):

```typescript
// Correct
highlightedDates: [
  new Date(2026, 1, 15),  // Month is 0-indexed (1 = February)
  new Date(2026, 1, 20)
]

// Incorrect - strings won't work
highlightedDates: [
  '2026-02-15',  // ✗
  '2026-02-20'   // ✗
]

// Convert strings to Date objects
highlightedDates: dateStrings.map(str => new Date(str))
```

### Issue: Events not showing
**Solution**: Verify event dates are Date objects and events array is properly formatted:

```typescript
// Correct
events: [
  {
    date: new Date(2026, 1, 15),
    title: 'Appointment',
    color: '#4F46E5'
  }
]

// Check your data
console.log('Events:', this.config.events);
console.log('Event dates:', this.config.events.map(e => e.date));
```

### Issue: Month navigation not working
**Solution**: Ensure you're subscribing to the `monthChange` event if you need to react to it:

```typescript
<app-calendar-widget
  [config]="config"
  (monthChange)="onMonthChange($event)">
</app-calendar-widget>

onMonthChange(event: { month: number; year: number }) {
  // Load data for new month
  this.loadDataForMonth(event.month, event.year);
}
```

### Issue: Keyboard navigation not working
**Solution**: Ensure the calendar has focus. Click on it or tab to it first. The calendar must be focused for keyboard navigation to work.

### Issue: Wrong month displayed
**Solution**: Check that the currentDate in config is correct:

```typescript
// Display February 2026
config = {
  currentDate: new Date(2026, 1, 1)  // Month is 0-indexed
};

// Common mistake - using 1-indexed month
config = {
  currentDate: new Date(2026, 2, 1)  // This is March, not February!
};
```

### Issue: Today not highlighted
**Solution**: The component automatically highlights today based on the system date. If it's not showing:
1. Check system date is correct
2. Verify you're viewing the current month
3. Check CSS for `.calendar-date-today` class

### Issue: Event markers overlapping
**Solution**: If multiple events on same date, markers stack. Limit to 3-4 events per date or implement a count indicator:

```typescript
// Group events by date and show count
const eventsPerDate = this.groupEventsByDate(events);
// Show "3 events" instead of 3 dots
```

## Performance Considerations

### Date Calculations
- Efficient date comparison algorithms
- Minimal recalculations on month change
- Cached calendar grid generation

### Change Detection
- Uses default change detection
- Recalculates grid only when config changes
- Efficient DOM updates

### Memory Management
- No memory leaks from event listeners
- Proper cleanup on component destroy
- Efficient date object handling

## Related Components

- `appointment-list` - Often displayed alongside calendar
- `user-details-panel` - Complementary information display
- `dashboard-layout` - Use for arranging components

## Requirements Satisfied

- 6.1: Display monthly calendar widget
- 6.2: Highlight current date
- 6.3: Show day names as column headers
- 6.4: Display dates in grid format with proper alignment
- 6.5: Allow navigation between months
- 9.2: Responsive layout
- 10.1: Angular component implementation
