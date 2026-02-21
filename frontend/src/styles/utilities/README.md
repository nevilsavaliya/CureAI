# Animation Utilities

This directory contains CSS utility classes for animations and transitions throughout the Healthcare Platform.

## Overview

The animation utilities provide ready-to-use CSS classes that can be applied directly to HTML elements for common animation patterns. These utilities work alongside the Angular animation triggers for a complete animation system.

## Files

- `_animations.css` - Animation utility classes, keyframes, and transition helpers

## Usage

### Basic Animations

Apply animation classes directly to elements:

```html
<!-- Fade in animation -->
<div class="animate-fade-in">
  Content fades in
</div>

<!-- Slide up animation -->
<div class="animate-slide-up">
  Content slides up from below
</div>

<!-- Scale in animation -->
<div class="animate-scale-in">
  Content scales up
</div>
```

### Skeleton Loaders

Use skeleton classes for loading states:

```html
<!-- Basic skeleton -->
<div class="skeleton" style="height: 200px;"></div>

<!-- Skeleton text lines -->
<div class="skeleton-text"></div>
<div class="skeleton-text"></div>
<div class="skeleton-text"></div>

<!-- Skeleton avatar -->
<div class="skeleton-avatar"></div>

<!-- Skeleton card -->
<div class="skeleton-card">
  <div class="skeleton" style="height: 20px; width: 60%;"></div>
  <div class="skeleton" style="height: 100px; margin-top: 16px;"></div>
  <div class="skeleton" style="height: 16px; margin-top: 12px;"></div>
</div>
```

### Loading Animations

```html
<!-- Spinning loader -->
<div class="animate-spin">
  <svg><!-- spinner icon --></svg>
</div>

<!-- Pulsing element -->
<div class="animate-pulse">
  Loading...
</div>

<!-- Bouncing element -->
<div class="animate-bounce">
  ↓
</div>
```

### Animation Delays

Add delays to stagger animations:

```html
<div class="animate-fade-in animate-delay-100">First</div>
<div class="animate-fade-in animate-delay-200">Second</div>
<div class="animate-fade-in animate-delay-300">Third</div>
```

### Staggered Children

Automatically stagger child elements:

```html
<div class="stagger-children">
  <div>Item 1</div>
  <div>Item 2</div>
  <div>Item 3</div>
  <div>Item 4</div>
</div>
```

### Transition Utilities

Control transitions on elements:

```html
<!-- Transition all properties -->
<div class="transition-all">
  Smooth transitions on all properties
</div>

<!-- Transition specific properties -->
<div class="transition-opacity">Opacity transitions</div>
<div class="transition-transform">Transform transitions</div>
<div class="transition-colors">Color transitions</div>
<div class="transition-shadow">Shadow transitions</div>

<!-- Control duration -->
<div class="transition-all transition-fast">Fast transition</div>
<div class="transition-all transition-slow">Slow transition</div>
```

### Hover Effects

Add interactive hover effects:

```html
<!-- Lift on hover -->
<div class="hover-lift">
  Lifts up on hover
</div>

<!-- Scale on hover -->
<div class="hover-scale">
  Scales up on hover
</div>

<!-- Opacity on hover -->
<div class="hover-opacity">
  Becomes semi-transparent on hover
</div>
```

### Focus Effects

Add focus indicators:

```html
<!-- Focus ring -->
<button class="focus-ring">
  Button with focus ring
</button>

<!-- Inset focus ring -->
<input class="focus-ring-inset" type="text">
```

### Success/Error Animations

Provide feedback for user actions:

```html
<!-- Success animation -->
<div class="animate-success" *ngIf="isSuccess">
  ✓ Success!
</div>

<!-- Error shake animation -->
<div class="animate-error-shake" *ngIf="hasError">
  ✗ Error occurred
</div>
```

### Page Transitions

Apply to page containers:

```html
<div class="page-enter">
  <!-- Page content -->
</div>
```

### Modal Animations

Use with modal components:

```html
<!-- Modal backdrop -->
<div class="modal-backdrop-enter" *ngIf="isOpen"></div>

<!-- Modal content -->
<div class="modal-enter" *ngIf="isOpen">
  <!-- Modal content -->
</div>
```

### Toast Notifications

Animate toast messages:

```html
<div class="toast-enter">
  Notification message
</div>
```

## Animation Classes Reference

### Fade Animations
- `animate-fade-in` - Fade in (200ms)
- `animate-fade-out` - Fade out (200ms)
- `animate-fade-in-fast` - Fast fade in (150ms)
- `animate-fade-in-slow` - Slow fade in (300ms)

### Slide Animations
- `animate-slide-up` - Slide up from below (300ms)
- `animate-slide-down` - Slide down from above (300ms)
- `animate-slide-in-left` - Slide in from left (200ms)
- `animate-slide-in-right` - Slide in from right (200ms)

### Scale Animations
- `animate-scale-in` - Scale up (200ms)
- `animate-scale-out` - Scale down (200ms)

### Loading Animations
- `animate-spin` - Continuous rotation
- `animate-pulse` - Pulsing opacity
- `animate-bounce` - Bouncing motion

### Skeleton Loaders
- `skeleton` - Basic shimmer effect
- `skeleton-text` - Text line skeleton
- `skeleton-circle` - Circular skeleton
- `skeleton-avatar` - Avatar skeleton (40x40px)
- `skeleton-card` - Card container with padding

### Feedback Animations
- `animate-success` - Success pop animation (300ms)
- `animate-error-shake` - Error shake animation (500ms)

### Page/Modal Animations
- `page-enter` - Page entrance animation
- `page-leave` - Page exit animation
- `modal-enter` - Modal entrance animation
- `modal-leave` - Modal exit animation
- `modal-backdrop-enter` - Backdrop fade in
- `modal-backdrop-leave` - Backdrop fade out

### Toast Animations
- `toast-enter` - Toast slide in from right
- `toast-leave` - Toast slide out to right

### Delay Classes
- `animate-delay-75` - 75ms delay
- `animate-delay-100` - 100ms delay
- `animate-delay-150` - 150ms delay
- `animate-delay-200` - 200ms delay
- `animate-delay-300` - 300ms delay
- `animate-delay-500` - 500ms delay
- `animate-delay-700` - 700ms delay
- `animate-delay-1000` - 1000ms delay

### Duration Classes
- `animate-duration-fast` - 150ms duration
- `animate-duration-base` - 200ms duration
- `animate-duration-slow` - 300ms duration
- `animate-duration-slower` - 500ms duration

### Iteration Classes
- `animate-once` - Play animation once
- `animate-infinite` - Loop animation infinitely

### Fill Mode Classes
- `animate-fill-forwards` - Retain final state
- `animate-fill-backwards` - Apply initial state before animation
- `animate-fill-both` - Both forwards and backwards

### Transition Classes
- `transition-none` - No transitions
- `transition-all` - Transition all properties
- `transition-colors` - Transition color properties
- `transition-opacity` - Transition opacity
- `transition-shadow` - Transition box-shadow
- `transition-transform` - Transition transform
- `transition-fast` - 150ms duration
- `transition-base` - 200ms duration
- `transition-slow` - 300ms duration

### Hover Effect Classes
- `hover-lift` - Lift up with shadow on hover
- `hover-scale` - Scale to 105% on hover
- `hover-scale-sm` - Scale to 102% on hover
- `hover-opacity` - Reduce opacity to 80% on hover
- `hover-brightness` - Increase brightness on hover

### Focus Effect Classes
- `focus-ring` - Outer focus ring
- `focus-ring-inset` - Inner focus ring

### Stagger Classes
- `stagger-children` - Stagger child animations (up to 10 children)

## Accessibility

### Reduced Motion

All animations respect the `prefers-reduced-motion` media query. When users have reduced motion enabled:

- Most animations are disabled
- Transitions are instant (0.01ms)
- Skeleton loaders use subtle pulse instead of shimmer
- Hover transforms are disabled
- Opacity changes are preserved (less disruptive)

### Implementation

The reduced motion support is automatic. No additional code needed:

```css
@media (prefers-reduced-motion: reduce) {
  /* Animations are automatically disabled */
}
```

### Testing Reduced Motion

To test reduced motion in your browser:

**Chrome/Edge:**
1. Open DevTools
2. Press Cmd/Ctrl + Shift + P
3. Type "Emulate CSS prefers-reduced-motion"
4. Select "prefers-reduced-motion: reduce"

**Firefox:**
1. Type `about:config` in address bar
2. Search for `ui.prefersReducedMotion`
3. Set to `1`

**macOS System-wide:**
1. System Preferences → Accessibility
2. Display → Reduce motion

## Performance Tips

1. **Use transform and opacity**: These properties are GPU-accelerated
2. **Avoid animating layout properties**: Don't animate width, height, margin, padding
3. **Keep durations short**: 150-300ms is optimal
4. **Limit simultaneous animations**: Too many animations can cause jank
5. **Use will-change sparingly**: Only for elements that will definitely animate

## Examples

### Dashboard Card Grid

```html
<div class="stagger-children">
  <div class="card hover-lift">
    <h3>Total Cases</h3>
    <p>150</p>
  </div>
  <div class="card hover-lift">
    <h3>Pending</h3>
    <p>25</p>
  </div>
  <div class="card hover-lift">
    <h3>Completed</h3>
    <p>125</p>
  </div>
</div>
```

### Loading State

```html
<div *ngIf="isLoading" class="skeleton-card">
  <div class="skeleton" style="height: 24px; width: 40%;"></div>
  <div class="skeleton" style="height: 120px; margin-top: 16px;"></div>
  <div class="skeleton-text" style="margin-top: 12px;"></div>
  <div class="skeleton-text"></div>
</div>

<div *ngIf="!isLoading" class="animate-fade-in">
  <!-- Actual content -->
</div>
```

### Interactive Button

```html
<button class="btn btn-primary hover-lift focus-ring transition-all">
  Click Me
</button>
```

### Success Message

```html
<div *ngIf="showSuccess" class="animate-success">
  <svg class="text-success"><!-- checkmark icon --></svg>
  <span>Successfully saved!</span>
</div>
```

### Form Error

```html
<div class="form-field" [class.animate-error-shake]="hasError">
  <input type="text" [class.error]="hasError">
  <span *ngIf="hasError" class="text-error animate-fade-in">
    This field is required
  </span>
</div>
```

### Modal

```html
<div class="modal-backdrop modal-backdrop-enter" *ngIf="isOpen" (click)="close()"></div>
<div class="modal modal-enter" *ngIf="isOpen">
  <h2>Modal Title</h2>
  <p>Modal content</p>
  <button (click)="close()">Close</button>
</div>
```

## Combining with Angular Animations

CSS utilities work great alongside Angular animations:

```typescript
@Component({
  animations: [pageTransition]
})
export class MyComponent {}
```

```html
<!-- Angular animation on container -->
<div [@pageTransition]>
  <!-- CSS animation on children -->
  <div class="stagger-children">
    <div class="card">Card 1</div>
    <div class="card">Card 2</div>
    <div class="card">Card 3</div>
  </div>
</div>
```

## Browser Support

All animation utilities work in modern browsers:
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Print Styles

Animations are automatically disabled when printing to avoid issues with PDF generation and printed output.
