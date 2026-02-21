# Dashboard Layout Component

## Overview

The Dashboard Layout component provides a responsive CSS Grid-based layout system for arranging dashboard components. It supports configurable columns, gap sizes, and automatic responsive behavior across different screen sizes. This component serves as a container for organizing multiple dashboard widgets in a clean, structured manner.

## Location

`frontend/src/app/shared/dashboard/components/dashboard-layout/`

## Inputs

| Input | Type | Default | Description |
|-------|------|---------|-------------|
| `columns` | `number` | `3` | Number of columns in the grid (1, 2, 3, or 4) |
| `gap` | `'small' \| 'medium' \| 'large'` | `'medium'` | Gap size between grid items |
| `responsive` | `boolean` | `true` | Enable responsive behavior (adapts to screen size) |

## Outputs

This component has no outputs. It's a pure layout container.

## Usage Examples

### Basic Usage

```typescript
// In template
<app-dashboard-layout [columns]="3" [gap]="'medium'">
  <app-stat-card [config]="stat1"></app-stat-card>
  <app-stat-card [config]="stat2"></app-stat-card>
  <app-stat-card [config]="stat3"></app-stat-card>
  <app-appointment-list [config]="appointments"></app-appointment-list>
  <app-summary-chart [config]="chart"></app-summary-chart>
  <app-calendar-widget [config]="calendar"></app-calendar-widget>
</app-dashboard-layout>
```

### Two-Column Layout

```typescript
<app-dashboard-layout [columns]="2" [gap]="'large'">
  <div class="span-2">
    <!-- Full-width header -->
    <h1>Dashboard</h1>
  </div>
  
  <div>
    <!-- Left column content -->
    <app-appointment-list [config]="appointments"></app-appointment-list>
  </div>
  
  <div>
    <!-- Right column content -->
    <app-calendar-widget [config]="calendar"></app-calendar-widget>
  </div>
</app-dashboard-layout>
```

### Four-Column Layout

```typescript
<app-dashboard-layout [columns]="4" [gap]="'small'">
  <app-stat-card [config]="stat1"></app-stat-card>
  <app-stat-card [config]="stat2"></app-stat-card>
  <app-stat-card [config]="stat3"></app-stat-card>
  <app-stat-card [config]="stat4"></app-stat-card>
</app-dashboard-layout>
```

### Doctor Dashboard Example

```typescript
<app-dashboard-layout [columns]="3" [gap]="'medium'" [responsive]="true">
  <!-- Stats Row - spans full width -->
  <div class="span-3">
    <div class="stats-grid">
      <app-stat-card [config]="totalPatientsConfig"></app-stat-card>
      <app-stat-card [config]="todayPatientsConfig"></app-stat-card>
      <app-stat-card [config]="appointmentsConfig"></app-stat-card>
    </div>
  </div>

  <!-- Main Content - 2 columns -->
  <div class="span-2">
    <app-summary-chart [config]="patientSummaryConfig"></app-summary-chart>
    <app-appointment-list [config]="todayAppointmentsConfig"></app-appointment-list>
    <app-request-list [config]="requestsConfig"></app-request-list>
  </div>

  <!-- Sidebar - 1 column -->
  <div>
    <app-user-details-panel [config]="nextPatientConfig"></app-user-details-panel>
    <app-calendar-widget [config]="calendarConfig"></app-calendar-widget>
    <app-review-metrics [config]="reviewsConfig"></app-review-metrics>
  </div>
</app-dashboard-layout>
```

### Patient Dashboard Example

```typescript
<app-dashboard-layout [columns]="2" [gap]="'medium'">
  <!-- Stats Row -->
  <div class="span-2">
    <div class="stats-grid">
      <app-stat-card [config]="upcomingAppointmentsConfig"></app-stat-card>
      <app-stat-card [config]="prescriptionsConfig"></app-stat-card>
    </div>
  </div>

  <!-- Main Content -->
  <div>
    <app-appointment-list [config]="myAppointmentsConfig"></app-appointment-list>
    <app-user-details-panel [config]="doctorDetailsConfig"></app-user-details-panel>
  </div>

  <!-- Sidebar -->
  <div>
    <app-calendar-widget [config]="calendarConfig"></app-calendar-widget>
  </div>
</app-dashboard-layout>
```

### Non-Responsive Layout

```typescript
<!-- Fixed layout that doesn't adapt to screen size -->
<app-dashboard-layout [columns]="3" [responsive]="false">
  <app-stat-card [config]="stat1"></app-stat-card>
  <app-stat-card [config]="stat2"></app-stat-card>
  <app-stat-card [config]="stat3"></app-stat-card>
</app-dashboard-layout>
```

## Features

### CSS Grid Layout
- Modern CSS Grid-based layout
- Flexible column configuration
- Automatic row creation
- Efficient rendering

### Responsive Behavior
- Automatically adapts to screen size
- Mobile: 1 column
- Tablet: 2 columns
- Desktop: Configured columns (3 or 4)
- Can be disabled with `responsive="false"`

### Column Spanning
- Child elements can span multiple columns
- Use CSS classes: `span-2`, `span-3`, `span-4`
- Useful for full-width headers or featured content

### Gap Sizes
- **Small**: 0.5rem (8px)
- **Medium**: 1rem (16px)
- **Large**: 1.5rem (24px)

## Responsive Breakpoints

### Default Behavior (responsive="true")

| Screen Size | Breakpoint | Columns |
|-------------|------------|---------|
| Mobile | < 640px | 1 column |
| Tablet | 640px - 1024px | 2 columns |
| Desktop | > 1024px | Configured columns (1-4) |

### Breakpoint Values
```css
--breakpoint-sm: 640px;   /* Small tablets */
--breakpoint-md: 768px;   /* Tablets */
--breakpoint-lg: 1024px;  /* Desktops */
--breakpoint-xl: 1280px;  /* Large desktops */
```

## Column Spanning

### Using Span Classes

```html
<app-dashboard-layout [columns]="3">
  <!-- Spans 2 columns -->
  <div class="span-2">
    <app-summary-chart [config]="chartConfig"></app-summary-chart>
  </div>
  
  <!-- Spans 1 column (default) -->
  <div>
    <app-calendar-widget [config]="calendarConfig"></app-calendar-widget>
  </div>
  
  <!-- Spans full width (3 columns) -->
  <div class="span-3">
    <app-appointment-list [config]="appointmentsConfig"></app-appointment-list>
  </div>
</app-dashboard-layout>
```

### Available Span Classes
- `.span-1` - Spans 1 column (default, not needed)
- `.span-2` - Spans 2 columns
- `.span-3` - Spans 3 columns
- `.span-4` - Spans 4 columns

## Accessibility Features

### Semantic HTML
- Uses semantic container elements
- Proper document structure
- No accessibility barriers

### Keyboard Navigation
- Layout doesn't interfere with keyboard navigation
- Tab order follows visual order
- Focus moves naturally through grid items

### Screen Reader Support
- Layout is transparent to screen readers
- Content is announced in logical order
- No hidden or inaccessible content

## Styling

### CSS Classes
- `.dashboard-layout` - Main container
- `.columns-1`, `.columns-2`, `.columns-3`, `.columns-4` - Column count classes
- `.gap-small`, `.gap-medium`, `.gap-large` - Gap size classes
- `.responsive` - Responsive behavior class

### CSS Grid Properties
```css
.dashboard-layout {
  display: grid;
  grid-template-columns: repeat(var(--columns), 1fr);
  gap: var(--gap-size);
}
```

### Customization Example

```css
/* Override column configuration */
.dashboard-layout.columns-3 {
  grid-template-columns: 2fr 1fr 1fr;  /* Custom column widths */
}

/* Override gap sizes */
.dashboard-layout.gap-medium {
  gap: 1.25rem;  /* Custom gap */
}

/* Custom responsive behavior */
@media (max-width: 768px) {
  .dashboard-layout.responsive {
    grid-template-columns: 1fr;  /* Force single column */
  }
}

/* Add custom span classes */
.span-full {
  grid-column: 1 / -1;  /* Span all columns */
}
```

## Layout Patterns

### Sidebar Layout
```html
<app-dashboard-layout [columns]="3">
  <!-- Main content (2 columns) -->
  <div class="span-2">
    <app-appointment-list></app-appointment-list>
    <app-summary-chart></app-summary-chart>
  </div>
  
  <!-- Sidebar (1 column) -->
  <div>
    <app-calendar-widget></app-calendar-widget>
    <app-user-details-panel></app-user-details-panel>
  </div>
</app-dashboard-layout>
```

### Header + Content Layout
```html
<app-dashboard-layout [columns]="3">
  <!-- Full-width header -->
  <div class="span-3">
    <h1>Dashboard</h1>
    <div class="stats-grid">
      <app-stat-card></app-stat-card>
      <app-stat-card></app-stat-card>
      <app-stat-card></app-stat-card>
    </div>
  </div>
  
  <!-- Content columns -->
  <div><app-appointment-list></app-appointment-list></div>
  <div><app-summary-chart></app-summary-chart></div>
  <div><app-calendar-widget></app-calendar-widget></div>
</app-dashboard-layout>
```

### Equal Columns Layout
```html
<app-dashboard-layout [columns]="4" [gap]="'small'">
  <app-stat-card [config]="stat1"></app-stat-card>
  <app-stat-card [config]="stat2"></app-stat-card>
  <app-stat-card [config]="stat3"></app-stat-card>
  <app-stat-card [config]="stat4"></app-stat-card>
</app-dashboard-layout>
```

## Troubleshooting

### Issue: Layout not displaying correctly
**Solution**: Ensure you're using valid column and gap values:

```typescript
// Valid columns
[columns]="1"  // ✓
[columns]="2"  // ✓
[columns]="3"  // ✓
[columns]="4"  // ✓

// Invalid columns
[columns]="5"  // ✗ Not supported
[columns]="0"  // ✗ Invalid
```

### Issue: Items not spanning correctly
**Solution**: Verify span class matches or is less than total columns:

```html
<!-- Correct - span-2 in 3-column layout -->
<app-dashboard-layout [columns]="3">
  <div class="span-2">Content</div>
</app-dashboard-layout>

<!-- Incorrect - span-4 in 3-column layout -->
<app-dashboard-layout [columns]="3">
  <div class="span-4">Content</div>  <!-- Will overflow -->
</app-dashboard-layout>
```

### Issue: Responsive behavior not working
**Solution**: Ensure responsive is set to true (default):

```typescript
<!-- Responsive (default) -->
<app-dashboard-layout [columns]="3">

<!-- Explicitly responsive -->
<app-dashboard-layout [columns]="3" [responsive]="true">

<!-- Not responsive -->
<app-dashboard-layout [columns]="3" [responsive]="false">
```

### Issue: Gaps too large/small
**Solution**: Choose appropriate gap size or customize in CSS:

```typescript
<!-- Small gap (8px) -->
<app-dashboard-layout [gap]="'small'">

<!-- Medium gap (16px) - default -->
<app-dashboard-layout [gap]="'medium'">

<!-- Large gap (24px) -->
<app-dashboard-layout [gap]="'large'">
```

### Issue: Layout breaking on mobile
**Solution**: This is expected if responsive is disabled. Enable responsive mode:

```typescript
<!-- Enable responsive -->
<app-dashboard-layout [columns]="3" [responsive]="true">
```

### Issue: Content overflowing
**Solution**: Ensure child components have proper max-width or use span classes:

```css
/* Prevent overflow in child components */
.dashboard-layout > * {
  min-width: 0;  /* Allow grid items to shrink */
  overflow: hidden;  /* Prevent overflow */
}
```

### Issue: Uneven column widths
**Solution**: By default, all columns are equal width (1fr). To customize:

```css
/* Custom column widths */
.dashboard-layout.columns-3 {
  grid-template-columns: 2fr 1fr 1fr;  /* First column is 2x wider */
}
```

## Performance Considerations

### CSS Grid Performance
- Native CSS Grid is highly performant
- No JavaScript calculations needed
- Hardware-accelerated rendering
- Efficient layout recalculation

### Responsive Performance
- Uses CSS media queries (no JavaScript)
- Minimal reflows on resize
- Efficient breakpoint handling

### Memory Usage
- Lightweight component
- No event listeners
- No subscriptions
- Minimal overhead

## Best Practices

### Do's
- ✓ Use appropriate column count for content
- ✓ Enable responsive mode for better mobile experience
- ✓ Use span classes for featured content
- ✓ Keep gap size consistent across dashboard
- ✓ Test on different screen sizes

### Don'ts
- ✗ Don't use more than 4 columns (hard to read)
- ✗ Don't disable responsive on mobile-first apps
- ✗ Don't nest dashboard-layout components
- ✗ Don't use fixed widths on child components
- ✗ Don't mix different gap sizes in same dashboard

## Related Components

All dashboard components work within this layout:
- `stat-card` - Statistics display
- `appointment-list` - Appointment listings
- `summary-chart` - Data visualizations
- `user-details-panel` - User information
- `request-list` - Request management
- `calendar-widget` - Date selection
- `review-metrics` - Rating displays

## Requirements Satisfied

- 9.1: Responsive layout adaptation
- 9.2: Vertical stacking on mobile
- 9.3: Multi-column grid on desktop
- 10.1: Angular component implementation
