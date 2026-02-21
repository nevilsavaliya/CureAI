# Review Metrics Component

## Overview

The Review Metrics component displays rating distributions using horizontal progress bars. It's designed to show patient review categories (Excellent, Great, Good, Average) with visual progress indicators, percentages, and smooth animations. The component is standalone and can be used independently or as part of a dashboard layout.

## Location

`frontend/src/app/shared/dashboard/components/review-metrics/`

## Inputs

| Input | Type | Default | Description |
|-------|------|---------|-------------|
| `config` | `ReviewMetricsConfig \| null` | `null` | Metrics configuration object |
| `loading` | `boolean` | `false` | Shows skeleton loader when true |

### ReviewMetricsConfig Interface

```typescript
interface ReviewMetricsConfig {
  title: string;              // Section title
  metrics: ReviewMetric[];    // Array of metrics to display
}

interface ReviewMetric {
  label: string;              // Metric label (e.g., "Excellent")
  value: number;              // Current value
  maxValue: number;           // Maximum value for percentage calculation
  color: string;              // Progress bar color (CSS color value)
}
```

## Outputs

This component has no outputs. It's a pure display component.

## Usage Examples

### Basic Usage

```typescript
// In component.ts
reviewMetricsConfig: ReviewMetricsConfig = {
  title: 'Patients Review',
  metrics: [
    {
      label: 'Excellent',
      value: 85,
      maxValue: 100,
      color: '#10B981'  // Green
    },
    {
      label: 'Great',
      value: 65,
      maxValue: 100,
      color: '#3B82F6'  // Blue
    },
    {
      label: 'Good',
      value: 45,
      maxValue: 100,
      color: '#F59E0B'  // Amber
    },
    {
      label: 'Average',
      value: 25,
      maxValue: 100,
      color: '#EF4444'  // Red
    }
  ]
};

// In template
<app-review-metrics [config]="reviewMetricsConfig"></app-review-metrics>
```

### With Loading State

```typescript
<app-review-metrics
  [config]="reviewMetricsConfig"
  [loading]="isLoadingReviews">
</app-review-metrics>
```

### Doctor Dashboard Example

```typescript
// Show patient satisfaction ratings
reviewMetricsConfig: ReviewMetricsConfig = {
  title: 'Patient Satisfaction',
  metrics: [
    {
      label: 'Excellent (5 stars)',
      value: this.reviews.filter(r => r.rating === 5).length,
      maxValue: this.reviews.length,
      color: '#10B981'
    },
    {
      label: 'Great (4 stars)',
      value: this.reviews.filter(r => r.rating === 4).length,
      maxValue: this.reviews.length,
      color: '#3B82F6'
    },
    {
      label: 'Good (3 stars)',
      value: this.reviews.filter(r => r.rating === 3).length,
      maxValue: this.reviews.length,
      color: '#F59E0B'
    },
    {
      label: 'Average (1-2 stars)',
      value: this.reviews.filter(r => r.rating <= 2).length,
      maxValue: this.reviews.length,
      color: '#EF4444'
    }
  ]
};
```

### Custom Metrics Example

```typescript
// Show any type of metrics
metricsConfig: ReviewMetricsConfig = {
  title: 'Appointment Completion Rate',
  metrics: [
    {
      label: 'Completed',
      value: 180,
      maxValue: 200,
      color: '#10B981'
    },
    {
      label: 'Cancelled',
      value: 15,
      maxValue: 200,
      color: '#EF4444'
    },
    {
      label: 'No-show',
      value: 5,
      maxValue: 200,
      color: '#F59E0B'
    }
  ]
};
```

### Dynamic Data Example

```typescript
// Component class
export class DashboardComponent implements OnInit {
  reviewMetricsConfig: ReviewMetricsConfig | null = null;
  loading = true;
  
  ngOnInit() {
    this.loadReviewMetrics();
  }
  
  loadReviewMetrics() {
    this.reviewService.getReviewStats().subscribe({
      next: (stats) => {
        const total = stats.excellent + stats.great + stats.good + stats.average;
        
        this.reviewMetricsConfig = {
          title: 'Patients Review',
          metrics: [
            {
              label: 'Excellent',
              value: stats.excellent,
              maxValue: total,
              color: '#10B981'
            },
            {
              label: 'Great',
              value: stats.great,
              maxValue: total,
              color: '#3B82F6'
            },
            {
              label: 'Good',
              value: stats.good,
              maxValue: total,
              color: '#F59E0B'
            },
            {
              label: 'Average',
              value: stats.average,
              maxValue: total,
              color: '#EF4444'
            }
          ]
        };
        this.loading = false;
      },
      error: (error) => {
        console.error('Failed to load review metrics:', error);
        this.loading = false;
      }
    });
  }
}
```

## Features

### Animated Progress Bars
- Smooth entrance animation (600ms ease-out)
- Bars animate from 0% to target percentage
- Staggered animation for visual appeal
- Uses Angular animations

### Percentage Display
- Automatically calculates percentage from value/maxValue
- Displays percentage next to each bar
- Rounds to nearest whole number
- Updates dynamically with data changes

### Color-Coded Bars
- Custom color for each metric
- Supports any valid CSS color value
- Visual distinction between categories
- Semantic color meanings

### Responsive Layout
- Adapts to container width
- Stacks vertically on mobile
- Maintains readability at all sizes
- Flexible bar widths

## Accessibility Features

### ARIA Labels
- Section has descriptive title
- Each metric has implicit label from text
- Progress bars use semantic HTML
- Percentages are announced

### Screen Reader Support
- Metrics are announced as: "[Label]: [Percentage]%"
- Visual progress is communicated through percentage
- Title is properly announced
- Loading state is indicated

### Visual Accessibility
- High contrast between bar and background
- Text labels are clearly readable
- Percentage values provide exact information
- Color is not the only indicator (labels + percentages)

### Keyboard Navigation
- Component is not interactive (display only)
- No keyboard navigation needed
- Focus can pass through to next interactive element

## Animations

### Bar Animation
```typescript
trigger('barAnimation', [
  state('void', style({
    width: '0%',
    opacity: 0
  })),
  state('*', style({
    width: '{{width}}%',
    opacity: 1
  }), { params: { width: 0 } }),
  transition('void => *', [
    animate('600ms ease-out')
  ])
])
```

### Animation Behavior
- Bars start at 0% width
- Animate to target percentage
- Smooth easing function
- Opacity fades in simultaneously

## States

### Loading State
- Displays skeleton loaders
- Shows 4 placeholder bars
- Maintains layout structure
- Shimmer animation effect

### Normal State
- Displays all metrics with animations
- Shows calculated percentages
- Color-coded progress bars
- Interactive hover effects (optional)

### Empty State
- If no config provided, component doesn't render
- No error state (display component only)

## Styling

### CSS Classes
- `.review-metrics` - Main container
- `.metrics-title` - Title text
- `.metrics-list` - Metrics container
- `.metric-item` - Individual metric row
- `.metric-label` - Metric label text
- `.metric-bar-container` - Progress bar container
- `.metric-bar` - Progress bar fill
- `.metric-percentage` - Percentage text

### Customization Example

```css
/* Customize container */
.review-metrics {
  padding: 1.5rem;
  background: white;
  border-radius: 0.75rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

/* Customize title */
.review-metrics .metrics-title {
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 1rem;
}

/* Customize metric items */
.review-metrics .metric-item {
  margin-bottom: 1rem;
}

/* Customize progress bars */
.review-metrics .metric-bar-container {
  height: 8px;
  background-color: #E5E7EB;
  border-radius: 4px;
}

.review-metrics .metric-bar {
  height: 100%;
  border-radius: 4px;
  transition: width 0.3s ease;
}

/* Customize percentage */
.review-metrics .metric-percentage {
  font-weight: 600;
  color: #6B7280;
}
```

## Color Recommendations

### Semantic Colors

| Category | Recommended Color | Hex Code | Use Case |
|----------|------------------|----------|----------|
| Excellent/High | Green | `#10B981` | Positive metrics |
| Great/Good | Blue | `#3B82F6` | Above average |
| Average/Medium | Amber | `#F59E0B` | Neutral/Warning |
| Poor/Low | Red | `#EF4444` | Negative metrics |
| Info | Indigo | `#4F46E5` | Informational |

### Color Formats

All CSS color formats are supported:
```typescript
color: '#10B981'              // Hex
color: 'rgb(16, 185, 129)'    // RGB
color: 'rgba(16, 185, 129, 1)' // RGBA
color: 'hsl(160, 84%, 39%)'   // HSL
color: 'green'                // Named color
```

## Percentage Calculation

### Formula
```typescript
percentage = Math.round((value / maxValue) * 100)
```

### Examples
```typescript
// 85 out of 100 = 85%
{ value: 85, maxValue: 100 }  // Shows 85%

// 45 out of 200 = 22.5% → 23%
{ value: 45, maxValue: 200 }  // Shows 23%

// 0 out of 100 = 0%
{ value: 0, maxValue: 100 }   // Shows 0%

// 100 out of 100 = 100%
{ value: 100, maxValue: 100 } // Shows 100%
```

## Troubleshooting

### Issue: Bars not displaying
**Solution**: Verify that config is provided and metrics array is not empty:

```typescript
// Check your data
console.log('Config:', this.reviewMetricsConfig);
console.log('Metrics:', this.reviewMetricsConfig?.metrics);

// Ensure config is not null
if (!this.reviewMetricsConfig) {
  this.reviewMetricsConfig = {
    title: 'Metrics',
    metrics: []
  };
}
```

### Issue: Percentage showing 0% or NaN
**Solution**: Ensure maxValue is not 0 and both value and maxValue are numbers:

```typescript
// Correct
metrics: [
  { label: 'Test', value: 50, maxValue: 100, color: '#10B981' }
]

// Incorrect - maxValue is 0
metrics: [
  { label: 'Test', value: 50, maxValue: 0, color: '#10B981' }  // ✗
]

// Incorrect - values are strings
metrics: [
  { label: 'Test', value: '50', maxValue: '100', color: '#10B981' }  // ✗
]
```

### Issue: Bars showing wrong width
**Solution**: Check that value doesn't exceed maxValue:

```typescript
// Correct
{ value: 85, maxValue: 100 }  // 85%

// Incorrect - value exceeds maxValue
{ value: 150, maxValue: 100 }  // Will show 150% (overflow)

// Fix by capping value
value: Math.min(actualValue, maxValue)
```

### Issue: Colors not showing
**Solution**: Ensure color values are valid CSS colors:

```typescript
// Valid
color: '#10B981'           // ✓
color: 'rgb(16, 185, 129)' // ✓
color: 'green'             // ✓

// Invalid
color: '10B981'            // ✗ Missing #
color: 'not-a-color'       // ✗ Invalid color name
```

### Issue: Animations not playing
**Solution**: Animations play on component initialization. If updating data dynamically, animations won't replay. To force replay:

```typescript
// Temporarily set config to null, then restore
const tempConfig = this.reviewMetricsConfig;
this.reviewMetricsConfig = null;
setTimeout(() => {
  this.reviewMetricsConfig = tempConfig;
}, 0);
```

### Issue: Bars too thin/thick
**Solution**: Customize the bar height in CSS:

```css
.review-metrics .metric-bar-container {
  height: 12px;  /* Adjust as needed */
}
```

### Issue: Loading state not showing
**Solution**: Ensure loading input is set to true:

```typescript
<app-review-metrics
  [config]="config"
  [loading]="true">  <!-- Must be true -->
</app-review-metrics>
```

## Performance Considerations

### Change Detection
- Component is standalone with OnPush strategy (if configured)
- Efficient updates on config changes
- Minimal re-renders

### Animation Performance
- Uses CSS transforms for smooth animations
- Hardware-accelerated when possible
- No layout thrashing

### Memory Management
- No event listeners to clean up
- No subscriptions to manage
- Lightweight component

## Related Components

- `summary-chart` - Alternative data visualization
- `stat-card` - Complementary metric display
- `dashboard-layout` - Use for arranging components

## Requirements Satisfied

- 2.5: Display patients review section with rating categories
- 9.3: Visual progress bars
- 10.1: Angular component implementation
