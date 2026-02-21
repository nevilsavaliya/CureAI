# Summary Chart Component

## Overview

The Summary Chart component displays data visualizations using SVG-based donut charts. It supports interactive features like hover tooltips, click interactions, legend highlighting, and entrance animations. The component is built without external chart libraries for better performance and smaller bundle size.

## Location

`frontend/src/app/shared/dashboard/components/summary-chart/`

## Inputs

| Input | Type | Default | Description |
|-------|------|---------|-------------|
| `config` | `ChartConfig` | Required | Chart configuration object |
| `loading` | `boolean` | `false` | Shows skeleton loader when true |
| `error` | `string \| null` | `null` | Error message to display |
| `emptyMessage` | `string` | `'No data available'` | Message when no data |

### ChartConfig Interface

```typescript
interface ChartConfig {
  title: string;              // Chart title
  data: ChartDataItem[];      // Data points to visualize
  type: 'donut' | 'pie' | 'bar';  // Chart type (currently supports donut)
  legend?: boolean;           // Show legend (default: true)
  colors?: string[];          // Custom color palette
}

interface ChartDataItem {
  label: string;              // Data label
  value: number;              // Numeric value
  color?: string;             // Optional custom color
}
```

## Outputs

| Output | Type | Description |
|--------|------|-------------|
| `retry` | `EventEmitter<void>` | Emitted when retry button is clicked in error state |

## Usage Examples

### Basic Donut Chart

```typescript
// In component.ts
chartConfig: ChartConfig = {
  title: 'Patient Summary',
  type: 'donut',
  data: [
    { label: 'New Patients', value: 450 },
    { label: 'Returning Patients', value: 1200 },
    { label: 'Follow-ups', value: 350 }
  ],
  legend: true
};

// In template
<app-summary-chart [config]="chartConfig"></app-summary-chart>
```

### With Custom Colors

```typescript
chartConfig: ChartConfig = {
  title: 'Appointment Status',
  type: 'donut',
  data: [
    { label: 'Completed', value: 85, color: '#10B981' },
    { label: 'Pending', value: 12, color: '#F59E0B' },
    { label: 'Cancelled', value: 3, color: '#EF4444' }
  ],
  legend: true
};
```

### With Loading State

```typescript
<app-summary-chart
  [config]="chartConfig"
  [loading]="isLoadingData">
</app-summary-chart>
```

### With Error Handling

```typescript
<app-summary-chart
  [config]="chartConfig"
  [error]="errorMessage"
  (retry)="loadChartData()">
</app-summary-chart>
```

### Using Color Palette

```typescript
chartConfig: ChartConfig = {
  title: 'Department Distribution',
  type: 'donut',
  data: [
    { label: 'Cardiology', value: 120 },
    { label: 'Neurology', value: 95 },
    { label: 'Pediatrics', value: 150 },
    { label: 'Orthopedics', value: 80 }
  ],
  colors: ['#4F46E5', '#10B981', '#F59E0B', '#EF4444'],
  legend: true
};
```

## Features

### Interactive Hover
- Hover over chart segments to see tooltips
- Tooltip shows label, value, and percentage
- Other segments dim when one is hovered
- Smooth transitions

### Click Interactions
- Click segments to select/deselect
- Selected segment remains highlighted
- Click again to deselect
- Legend items are also clickable

### Legend
- Automatically generated from data
- Shows color indicators
- Displays labels and values
- Clickable for segment highlighting
- Responsive layout

### Animations
- Entrance animation on component load
- Smooth segment transitions
- Fade-in effects for tooltips
- Scale animation for chart appearance

## Accessibility Features

### ARIA Labels and Roles
- Chart container has `role="img"` with descriptive label
- Each segment has ARIA labels with data information
- Legend has proper list semantics
- Tooltips use `aria-live` regions

### Keyboard Navigation
- Chart segments are keyboard focusable
- **Tab**: Navigate between segments
- **Enter/Space**: Select/deselect segment
- **Escape**: Clear selection
- Visible focus indicators

### Screen Reader Support
- Chart data is announced as "Chart showing [title]"
- Each segment announces: "[label]: [value] ([percentage]%)"
- Legend items are properly announced
- State changes are communicated

### Color Contrast
- Default colors meet WCAG AA standards
- Text labels have sufficient contrast
- Focus indicators are clearly visible

## Chart Dimensions

The chart uses fixed dimensions optimized for dashboard layouts:
- **Size**: 200x200 pixels
- **Stroke Width**: 40 pixels (donut thickness)
- **Radius**: 80 pixels
- **Center**: 100, 100

These can be customized by modifying the component's readonly properties.

## Color System

### Default Color Palette

If no colors are specified, the component uses these defaults:

```typescript
const defaultColors = [
  '#4F46E5',  // Primary (Indigo)
  '#10B981',  // Success (Green)
  '#F59E0B',  // Warning (Amber)
  '#EF4444',  // Danger (Red)
  '#3B82F6',  // Info (Blue)
  '#8B5CF6',  // Purple
  '#EC4899',  // Pink
  '#14B8A6'   // Teal
];
```

### Custom Colors

You can provide custom colors in three ways:

```typescript
// 1. In the config colors array
config = {
  colors: ['#FF0000', '#00FF00', '#0000FF']
};

// 2. In individual data items
data: [
  { label: 'Item 1', value: 100, color: '#FF0000' },
  { label: 'Item 2', value: 200, color: '#00FF00' }
];

// 3. Mix of both (data item colors take precedence)
```

## States

### Loading State
- Displays skeleton loader
- Maintains chart dimensions
- Shows shimmer animation
- Hides chart content

### Empty State
- Shows when data array is empty or total is 0
- Displays custom empty message
- Shows friendly icon
- Provides context

### Error State
- Displays error message
- Shows retry button
- Maintains layout
- Accessible error announcement

### Normal State
- Renders interactive chart
- Shows legend
- Enables all interactions

## Styling

### CSS Classes
- `.summary-chart` - Main container
- `.chart-container` - SVG container
- `.chart-svg` - SVG element
- `.chart-segment` - Individual segments
- `.chart-segment-highlighted` - Highlighted state
- `.chart-segment-dimmed` - Dimmed state
- `.chart-legend` - Legend container
- `.legend-item` - Individual legend items
- `.chart-tooltip` - Tooltip element

### Customization Example

```css
/* Override chart size */
.summary-chart .chart-svg {
  width: 250px;
  height: 250px;
}

/* Customize legend */
.summary-chart .chart-legend {
  gap: 0.75rem;
}

/* Tooltip styling */
.summary-chart .chart-tooltip {
  background: rgba(0, 0, 0, 0.9);
  color: white;
  padding: 0.5rem;
  border-radius: 0.25rem;
}
```

## Mathematical Calculations

### Percentage Calculation
```typescript
percentage = (value / total) * 100
```

### Angle Calculation
```typescript
angleSize = (value / total) * 360
startAngle = previousEndAngle
endAngle = startAngle + angleSize
```

### Polar to Cartesian Conversion
```typescript
x = centerX + radius * cos(angleInRadians)
y = centerY + radius * sin(angleInRadians)
```

### Arc Path Generation
The component generates SVG path commands for donut segments using the arc command with proper large-arc-flag calculation.

## Troubleshooting

### Issue: Chart not displaying
**Solution**: Verify that:
1. Config object is provided
2. Data array is not empty
3. All values are positive numbers
4. Total of all values is greater than 0

```typescript
// Check your data
console.log('Config:', this.chartConfig);
console.log('Data:', this.chartConfig.data);
console.log('Total:', this.chartConfig.data.reduce((sum, item) => sum + item.value, 0));
```

### Issue: Colors not showing correctly
**Solution**: Ensure colors are valid CSS color values:

```typescript
// Valid formats
color: '#FF0000'           // Hex
color: 'rgb(255, 0, 0)'    // RGB
color: 'rgba(255, 0, 0, 1)' // RGBA
color: 'red'               // Named color

// Invalid
color: 'FF0000'            // Missing #
color: '#FFF'              // Use 6-digit hex
```

### Issue: Segments overlapping or gaps
**Solution**: This usually indicates a calculation error. Ensure all values are positive numbers:

```typescript
// Correct
data: [
  { label: 'A', value: 100 },
  { label: 'B', value: 200 }
]

// Incorrect - negative values
data: [
  { label: 'A', value: -100 },  // ✗
  { label: 'B', value: 200 }
]
```

### Issue: Tooltip not showing
**Solution**: Ensure you're hovering over the actual segment path. The tooltip appears at the segment's midpoint. If the chart is very small, the tooltip might be hard to see.

### Issue: Legend items not clickable
**Solution**: Verify that the legend is enabled and items have proper event handlers:

```typescript
config = {
  // ...
  legend: true  // Must be true
};
```

### Issue: Animations not playing
**Solution**: Animations play on component initialization. If you're updating data dynamically, the animations won't replay. To force replay, you can:

```typescript
// Temporarily remove and re-add the component
this.showChart = false;
setTimeout(() => this.showChart = true, 0);
```

### Issue: Chart too small/large
**Solution**: The chart has fixed dimensions. To resize, modify the component's size constants or use CSS transform:

```css
.summary-chart .chart-svg {
  transform: scale(1.5);  /* 150% size */
  transform-origin: center;
}
```

## Performance Considerations

### SVG Rendering
- Native SVG is performant for small to medium datasets
- Recommended maximum: 10-12 segments
- For more segments, consider grouping smaller values

### Change Detection
- Component uses default change detection
- Recalculates segments on config changes
- Efficient path generation

### Memory Management
- No memory leaks from event listeners
- Proper cleanup on component destroy
- Efficient DOM updates

## Related Components

- `review-metrics` - Alternative data visualization
- `stat-card` - Complementary metric display
- `dashboard-layout` - Use for arranging charts

## Requirements Satisfied

- 2.4: Patient summary chart with distribution visualization
- 9.3: Multi-column grid layout on desktop
- 10.1: Angular component implementation
