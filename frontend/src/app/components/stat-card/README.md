# Stat Card Component

## Overview

The Stat Card component displays key metrics with icons, values, and optional trend indicators. It's designed to be reusable across different dashboard types and supports various color themes, loading states, and click interactions.

## Location

`frontend/src/app/components/stat-card/`

## Inputs

| Input | Type | Default | Description |
|-------|------|---------|-------------|
| `title` | `string` | `''` | The title/label of the statistic |
| `value` | `string \| number` | `''` | The main value to display |
| `subtitle` | `string` | `''` | Optional subtitle text below the value |
| `icon` | `string` | `''` | Icon identifier (e.g., 'patient-icon', 'appointment-icon') |
| `color` | `'primary' \| 'success' \| 'warning' \| 'danger' \| 'info' \| 'secondary'` | `'primary'` | Color theme for the card |
| `trend` | `{ value: number; direction: 'up' \| 'down' }` | `undefined` | Optional trend indicator |
| `loading` | `boolean` | `false` | Shows skeleton loader when true |
| `config` | `StatCardConfig` | `undefined` | Alternative way to pass all properties as a single object |

## Outputs

| Output | Type | Description |
|--------|------|-------------|
| `cardClick` | `EventEmitter<void>` | Emitted when the card is clicked (only if subscribed to) |

## Usage Examples

### Basic Usage

```typescript
<app-stat-card
  title="Total Patients"
  value="2000+"
  subtitle="Active patients"
  icon="patient-icon"
  color="primary">
</app-stat-card>
```

### With Trend Indicator

```typescript
<app-stat-card
  title="Today's Appointments"
  value="24"
  subtitle="Scheduled for today"
  icon="appointment-icon"
  color="success"
  [trend]="{ value: 12, direction: 'up' }">
</app-stat-card>
```

### Using Config Object

```typescript
// In component.ts
statConfig: StatCardConfig = {
  title: 'Total Revenue',
  value: '$45,000',
  subtitle: 'This month',
  icon: 'dollar-icon',
  color: 'info',
  trend: { value: 8, direction: 'up' },
  loading: false
};

// In template
<app-stat-card [config]="statConfig"></app-stat-card>
```

### With Click Handler

```typescript
<app-stat-card
  title="Pending Cases"
  value="12"
  icon="clock-icon"
  color="warning"
  (cardClick)="navigateToPendingCases()">
</app-stat-card>
```

### With Loading State

```typescript
<app-stat-card
  title="Total Patients"
  value="2000+"
  icon="patient-icon"
  color="primary"
  [loading]="isLoading">
</app-stat-card>
```

## Accessibility Features

### ARIA Labels
- The component automatically generates descriptive ARIA labels including title, value, subtitle, and trend information
- Example: "Total Patients: 2000+, Active patients, increased by 12 percent"

### Keyboard Navigation
- When clickable (has cardClick subscriber), the card is keyboard accessible via Tab and Enter/Space keys
- Focus indicators are visible for keyboard navigation

### Screen Reader Support
- All content is properly announced to screen readers
- Trend direction is announced as "increased" or "decreased"
- Loading state is announced via aria-busy attribute

## Styling

### Color Variants

The component supports six color variants:
- `primary` - Blue theme (default)
- `success` - Green theme
- `warning` - Orange/Yellow theme
- `danger` - Red theme
- `info` - Light blue theme
- `secondary` - Gray theme

### Custom Styling

You can override styles by targeting these CSS classes:
- `.stat-card` - Main container
- `.stat-card-primary`, `.stat-card-success`, etc. - Color-specific classes
- `.stat-card-icon` - Icon container
- `.stat-card-content` - Content area
- `.stat-card-trend` - Trend indicator
- `.trend-up`, `.trend-down` - Trend direction classes

## Loading State

When `loading` is true:
- A skeleton loader animation is displayed
- Content is hidden but maintains layout
- Shimmer effect provides visual feedback

## Troubleshooting

### Issue: Card is not clickable
**Solution**: Make sure you're subscribing to the `cardClick` output event. The card only becomes clickable when there's a subscriber.

```typescript
// This makes it clickable
<app-stat-card (cardClick)="handleClick()"></app-stat-card>

// This does NOT make it clickable
<app-stat-card></app-stat-card>
```

### Issue: Icon not displaying
**Solution**: Ensure the icon identifier matches your icon system. The component expects icon classes or identifiers that are defined in your global styles.

### Issue: Trend indicator not showing
**Solution**: Verify that the trend object has both `value` and `direction` properties:

```typescript
// Correct
[trend]="{ value: 12, direction: 'up' }"

// Incorrect - missing direction
[trend]="{ value: 12 }"
```

### Issue: Config object not working
**Solution**: Make sure the config object implements the `StatCardConfig` interface and is passed as a property binding:

```typescript
// Correct
<app-stat-card [config]="myConfig"></app-stat-card>

// Incorrect - missing brackets
<app-stat-card config="myConfig"></app-stat-card>
```

## Related Components

- `dashboard-layout` - Use for arranging multiple stat cards in a grid
- `appointment-list` - Often displayed alongside stat cards
- `summary-chart` - Complementary data visualization component

## Requirements Satisfied

- 1.1: Base statistics card component with configuration
- 2.1: Display total patient count with icon indicator
- 2.2: Display today's patient count with current date
- 2.3: Display today's appointment count with current date
- 9.4: Touch-friendly interactive elements
- 10.1: Angular component implementation
