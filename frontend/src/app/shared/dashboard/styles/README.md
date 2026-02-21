# Dashboard Shared Styles

This directory contains shared CSS styles for dashboard components, providing consistent loading, error, and empty states across all dashboard components.

## Files

### skeleton-loader.css

Provides skeleton loading animations for all dashboard components.

**Features:**
- Shimmer animation effect
- Multiple skeleton variants (avatar, line, button, circle, etc.)
- Component-specific skeleton layouts
- Dark mode support
- Accessibility-friendly (respects prefers-reduced-motion)

**Usage:**
```css
@import '../../styles/skeleton-loader.css';
```

**Available Classes:**
- `.skeleton` - Base skeleton style
- `.skeleton-line` - Text line skeleton
- `.skeleton-avatar` - Circular avatar skeleton
- `.skeleton-icon` - Icon skeleton
- `.skeleton-button` - Button skeleton
- `.skeleton-circle` - Large circular skeleton (for charts)
- `.skeleton-rectangle` - Rectangular skeleton
- `.skeleton-bar` - Progress bar skeleton
- `.skeleton-time` - Time badge skeleton
- `.skeleton-tag` - Tag skeleton

**Component-Specific Layouts:**
- `.stat-card-loading` - Stat card skeleton layout
- `.skeleton-item` - List item skeleton layout
- `.skeleton-chart` - Chart skeleton layout
- `.skeleton-calendar` - Calendar skeleton layout
- `.skeleton-user-panel` - User details panel skeleton layout

### error-empty-states.css

Provides consistent error and empty state UI for all dashboard components.

**Features:**
- Error state with retry functionality
- Empty state with friendly messages
- Warning state for partial errors
- Inline error/warning messages
- Responsive design
- Dark mode support
- Fade-in animations

**Usage:**
```css
@import '../../styles/error-empty-states.css';
```

**Available Classes:**

**Empty States:**
- `.empty-state` - Base empty state container
- `.empty-state-small` - Smaller empty state
- `.empty-state-large` - Larger empty state
- `.empty-icon` - Empty state icon
- `.empty-message` - Empty state message
- `.empty-action` - Empty state action container
- `.empty-action-button` - Empty state action button

**Error States:**
- `.error-state` - Base error state container
- `.error-state-small` - Smaller error state
- `.error-state-large` - Larger error state
- `.error-icon` - Error state icon
- `.error-message` - Error state message
- `.error-message-title` - Error title
- `.error-message-subtitle` - Error subtitle
- `.error-actions` - Error actions container
- `.error-action-button` - Error action button (e.g., Retry)
- `.error-action-button-secondary` - Secondary error action button

**Warning States:**
- `.warning-state` - Base warning state container
- `.warning-icon` - Warning state icon
- `.warning-message` - Warning state message

**Inline Messages:**
- `.inline-error` - Inline error message
- `.inline-warning` - Inline warning message

## Component Integration

All dashboard components should import both shared style files:

```css
/* Import shared styles */
@import '../../styles/skeleton-loader.css';
@import '../../styles/error-empty-states.css';
```

## Component Implementation Pattern

### TypeScript Component

```typescript
export class MyDashboardComponent {
  @Input() loading: boolean = false;
  @Input() error: string | null = null;
  @Input() emptyMessage: string = 'No data available';
  
  @Output() retry = new EventEmitter<void>();

  onRetry(): void {
    this.retry.emit();
  }

  hasData(): boolean {
    return this.data && this.data.length > 0;
  }
}
```

### HTML Template

```html
<div class="component-container">
  <!-- Loading State -->
  <div *ngIf="loading" class="skeleton-loader" aria-live="polite" aria-busy="true">
    <div class="skeleton-avatar"></div>
    <div class="skeleton-content">
      <div class="skeleton-line skeleton-line-title"></div>
      <div class="skeleton-line skeleton-line-subtitle"></div>
    </div>
  </div>

  <!-- Error State -->
  <div *ngIf="!loading && error" class="error-state" role="alert" aria-live="assertive">
    <div class="error-icon">
      <svg><!-- error icon --></svg>
    </div>
    <p class="error-message-title">Failed to load data</p>
    <p class="error-message-subtitle">{{ error }}</p>
    <div class="error-actions">
      <button class="error-action-button" (click)="onRetry()">
        <svg class="retry-icon"><!-- retry icon --></svg>
        Retry
      </button>
    </div>
  </div>

  <!-- Empty State -->
  <div *ngIf="!loading && !error && !hasData()" class="empty-state" role="status" aria-live="polite">
    <div class="empty-icon">
      <svg><!-- empty icon --></svg>
    </div>
    <p class="empty-message">{{ emptyMessage }}</p>
  </div>

  <!-- Content -->
  <div *ngIf="!loading && !error && hasData()">
    <!-- Component content -->
  </div>
</div>
```

## Accessibility

All loading, error, and empty states include proper ARIA attributes:

- `aria-live="polite"` for loading and empty states
- `aria-live="assertive"` for error states
- `aria-busy="true"` for loading states
- `role="alert"` for error states
- `role="status"` for empty states
- Proper `aria-label` attributes for icons and actions

## Responsive Design

All states are responsive and adapt to different screen sizes:

- Mobile (< 640px): Smaller icons, stacked layouts
- Tablet (640px - 1024px): Medium sizing
- Desktop (> 1024px): Full sizing

## Dark Mode

Both style files include dark mode support using `@media (prefers-color-scheme: dark)`.

## Animation

- Skeleton loaders use a shimmer animation
- Error/empty states use a fade-in animation
- Retry button includes a spin animation on click
- All animations respect `prefers-reduced-motion` for accessibility

## Browser Support

These styles are compatible with all modern browsers that support:
- CSS Grid
- CSS Flexbox
- CSS Custom Properties (CSS Variables)
- CSS Animations
- Media Queries

## Customization

You can customize the styles by overriding CSS custom properties in your component:

```css
.my-component {
  --color-bg-skeleton: #f0f0f0;
  --color-bg-skeleton-shimmer: #e0e0e0;
  --color-error: #ef4444;
  --color-warning: #f59e0b;
}
```

## Best Practices

1. Always show loading state while fetching data
2. Provide clear error messages with retry functionality
3. Use friendly, helpful empty state messages
4. Ensure all states are keyboard accessible
5. Test with screen readers
6. Respect user's motion preferences
7. Provide appropriate ARIA labels
8. Use semantic HTML elements
9. Test on different screen sizes
10. Consider dark mode users

## Examples

See the following components for implementation examples:
- `appointment-list.component.ts/html/css`
- `summary-chart.component.ts/html/css`
- `user-details-panel.component.ts/html/css`
- `request-list.component.ts/html/css`
- `calendar-widget.component.ts/html/css`
- `review-metrics.component.ts/html/css`
- `stat-card.component.ts/html/css`
