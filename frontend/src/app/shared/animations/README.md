# Animation Library

This directory contains reusable Angular animations for the Healthcare Platform UI.

## Overview

The animation library provides a comprehensive set of pre-built animations that follow the design system specifications. All animations are optimized for performance and respect user preferences for reduced motion.

## Available Animations

### Page Transitions

#### `pageTransition`
- **Use case**: Page-level transitions when navigating between routes
- **Duration**: 300ms entrance, 200ms exit
- **Effect**: Fade in with slide up on enter, fade out with slide up on leave

```typescript
@Component({
  animations: [pageTransition]
})
export class MyComponent {}
```

```html
<div [@pageTransition]>
  <!-- Page content -->
</div>
```

#### `routeAnimation`
- **Use case**: Wrapper for route outlet transitions
- **Duration**: 300ms entrance, 200ms exit
- **Effect**: Cross-fade between routes

### List Animations

#### `listAnimation`
- **Use case**: Dashboard cards, list items
- **Duration**: 200ms per item
- **Stagger**: 50ms between items
- **Effect**: Fade in with slide up, staggered

```typescript
@Component({
  animations: [listAnimation]
})
export class DashboardComponent {
  items = [...];
}
```

```html
<div [@listAnimation]="items.length">
  <div *ngFor="let item of items">
    {{ item }}
  </div>
</div>
```

#### `listStagger`
- **Use case**: More pronounced stagger effect
- **Duration**: 250ms per item
- **Stagger**: 75ms between items
- **Effect**: Fade in/out with slide, staggered

#### `tableRowAnimation`
- **Use case**: Table rows
- **Duration**: 200ms per row
- **Stagger**: 30ms between rows
- **Effect**: Fade in with slide from left

### Card Animations

#### `cardEntrance`
- **Use case**: Dashboard stat cards, info cards
- **Duration**: 300ms
- **Effect**: Fade in with slide up and scale

```html
<div class="card" [@cardEntrance]>
  <!-- Card content -->
</div>
```

### Modal Animations

#### `modalAnimation`
- **Use case**: Modal dialogs, popups
- **Duration**: 200ms entrance, 150ms exit
- **Effect**: Scale up/down with fade

```typescript
@Component({
  animations: [modalAnimation, backdropAnimation]
})
export class ModalComponent {
  isOpen = false;
}
```

```html
<div class="modal-backdrop" [@backdropAnimation] *ngIf="isOpen"></div>
<div class="modal" [@modalAnimation] *ngIf="isOpen">
  <!-- Modal content -->
</div>
```

#### `backdropAnimation`
- **Use case**: Modal backdrop overlay
- **Duration**: 200ms entrance, 150ms exit
- **Effect**: Fade in/out

#### `modalSlideUp`
- **Use case**: Mobile-friendly modal animation
- **Duration**: 300ms entrance, 200ms exit
- **Effect**: Slide up from bottom with fade

### Basic Animations

#### `fadeIn` / `fadeOut`
- **Use case**: Simple show/hide transitions
- **Duration**: 200ms / 150ms
- **Effect**: Opacity transition

#### `slideUp` / `slideDown`
- **Use case**: Elements entering from below/above
- **Duration**: 250ms
- **Effect**: Fade with vertical slide

#### `scaleIn`
- **Use case**: Buttons, icons, interactive elements
- **Duration**: 200ms
- **Effect**: Scale from 90% to 100% with fade

### Utility Animations

#### `expandCollapse`
- **Use case**: Accordions, expandable sections
- **Duration**: 250ms expand, 200ms collapse
- **Effect**: Height and opacity transition

```html
<div [@expandCollapse] *ngIf="isExpanded">
  <!-- Expandable content -->
</div>
```

### Feedback Animations

#### `successAnimation`
- **Use case**: Success confirmations, checkmarks
- **Duration**: 300ms
- **Effect**: Bounce scale with fade

```html
<div class="success-icon" [@successAnimation] *ngIf="isSuccess">
  ✓
</div>
```

#### `errorShake`
- **Use case**: Form validation errors
- **Duration**: 500ms total
- **Effect**: Horizontal shake

```html
<div class="form-field" [@errorShake]="errorState">
  <!-- Form field -->
</div>
```

#### `toastAnimation`
- **Use case**: Toast notifications
- **Duration**: 250ms entrance, 200ms exit
- **Effect**: Slide in from right with fade

### Other Animations

#### `rotate`
- **Use case**: Icon rotations, indicators
- **Duration**: 200ms
- **Effect**: Smooth rotation

#### `bounce`
- **Use case**: Attention-grabbing elements
- **Duration**: 600ms
- **Effect**: Playful bounce

## Usage Guidelines

### Import Animations

```typescript
import { pageTransition, listAnimation, modalAnimation } from '@app/shared/animations';

@Component({
  selector: 'app-my-component',
  templateUrl: './my-component.component.html',
  animations: [pageTransition, listAnimation, modalAnimation]
})
export class MyComponent {}
```

### Apply to Elements

```html
<!-- Simple trigger -->
<div [@fadeIn]>Content</div>

<!-- With state binding -->
<div [@listAnimation]="items.length">
  <div *ngFor="let item of items">{{ item }}</div>
</div>

<!-- With conditional -->
<div [@modalAnimation] *ngIf="isVisible">Modal</div>
```

### Animation Callbacks

```html
<div [@fadeIn] (@fadeIn.done)="onAnimationDone()">
  Content
</div>
```

```typescript
onAnimationDone() {
  console.log('Animation completed');
}
```

## Performance Considerations

1. **Hardware Acceleration**: All animations use `transform` and `opacity` properties which are GPU-accelerated
2. **Duration**: Animations are kept between 150-300ms for optimal perceived performance
3. **Reduced Motion**: Animations respect `prefers-reduced-motion` media query (implemented in CSS)
4. **Stagger Limits**: List animations use reasonable stagger delays to avoid long animation sequences

## Accessibility

All animations are designed with accessibility in mind:

- Durations follow WCAG guidelines (< 5 seconds)
- Animations can be disabled via CSS `prefers-reduced-motion` media query
- No essential information is conveyed through animation alone
- Animations enhance but don't block user interactions

## Browser Support

These animations work in all modern browsers:
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Examples

### Dashboard with Staggered Cards

```typescript
@Component({
  animations: [listAnimation, cardEntrance]
})
export class DashboardComponent {
  cards = [
    { title: 'Total Cases', value: 150 },
    { title: 'Pending', value: 25 },
    { title: 'Completed', value: 125 }
  ];
}
```

```html
<div class="dashboard" [@listAnimation]="cards.length">
  <div class="card" *ngFor="let card of cards" [@cardEntrance]>
    <h3>{{ card.title }}</h3>
    <p>{{ card.value }}</p>
  </div>
</div>
```

### Modal with Backdrop

```typescript
@Component({
  animations: [modalAnimation, backdropAnimation]
})
export class ModalComponent {
  isOpen = false;
  
  open() {
    this.isOpen = true;
  }
  
  close() {
    this.isOpen = false;
  }
}
```

```html
<div class="modal-backdrop" [@backdropAnimation] *ngIf="isOpen" (click)="close()"></div>
<div class="modal" [@modalAnimation] *ngIf="isOpen">
  <h2>Modal Title</h2>
  <p>Modal content</p>
  <button (click)="close()">Close</button>
</div>
```

### Page Transition

```typescript
@Component({
  animations: [pageTransition]
})
export class PageComponent {}
```

```html
<div class="page-container" [@pageTransition]>
  <!-- Page content -->
</div>
```

## Customization

To create custom animations based on these patterns:

```typescript
import { trigger, transition, style, animate } from '@angular/animations';

export const customAnimation = trigger('customAnimation', [
  transition(':enter', [
    style({ /* initial state */ }),
    animate('duration easing', style({ /* final state */ }))
  ])
]);
```

## Testing

Animations can be disabled in tests:

```typescript
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { NoopAnimationsModule } from '@angular/platform-browser/animations';

TestBed.configureTestingModule({
  imports: [NoopAnimationsModule] // Disables animations
});
```
