# Icon Component

A reusable icon component for displaying SVG icons throughout the application.

## Features

- **Lazy Loading**: Icons are loaded on-demand from assets
- **Caching**: Icons are cached after first load for performance
- **Flexible Sizing**: Multiple size options (xs, sm, md, lg, xl, 2xl)
- **Color Customization**: Pass any color value
- **Type Safety**: TypeScript support with icon name types
- **Standalone**: Can be used independently without module imports

## Usage

### Basic Usage

```typescript
import { IconComponent } from '@app/shared/components/icon';

@Component({
  selector: 'app-example',
  standalone: true,
  imports: [IconComponent],
  template: `
    <app-icon name="user"></app-icon>
  `
})
export class ExampleComponent {}
```

### With Size

```html
<app-icon name="user" size="xs"></app-icon>
<app-icon name="user" size="sm"></app-icon>
<app-icon name="user" size="md"></app-icon> <!-- default -->
<app-icon name="user" size="lg"></app-icon>
<app-icon name="user" size="xl"></app-icon>
<app-icon name="user" size="2xl"></app-icon>
```

### With Custom Color

```html
<app-icon name="heart" color="#ef4444"></app-icon>
<app-icon name="star" color="var(--color-warning-500)"></app-icon>
<app-icon name="check" [color]="isSuccess ? 'green' : 'gray'"></app-icon>
```

### In Buttons

```html
<button class="btn btn-primary">
  <app-icon name="plus" size="sm"></app-icon>
  <span>Add New</span>
</button>
```

### In Forms

```html
<div class="input-group">
  <app-icon name="email" size="sm" color="var(--color-gray-400)"></app-icon>
  <input type="email" placeholder="Email address">
</div>
```

## Available Icons

### User & Authentication
- `user` - User profile icon
- `lock` - Lock/security icon
- `email` - Email/mail icon
- `logout` - Logout icon
- `eye` - Show password
- `eye-off` - Hide password

### Medical & Healthcare
- `doctor` - Doctor icon
- `patient` - Patient icon
- `hospital` - Hospital building icon
- `heart` - Heart icon
- `activity` - Activity/heartbeat icon
- `clipboard` - Medical clipboard

### Navigation
- `chevron-right` - Right arrow
- `chevron-left` - Left arrow
- `chevron-up` - Up arrow
- `chevron-down` - Down arrow
- `menu` - Hamburger menu

### Actions
- `plus` - Add/create
- `minus` - Remove/subtract
- `edit` - Edit/modify
- `trash` - Delete
- `close` - Close/dismiss
- `check` - Confirm/success
- `refresh` - Reload/refresh
- `upload` - Upload file
- `download` - Download file

### Communication
- `message-circle` - Chat/message
- `bell` - Notifications
- `phone` - Phone call

### Information
- `info` - Information
- `alert-circle` - Alert/warning
- `alert-triangle` - Warning triangle
- `star` - Rating/favorite

### Utilities
- `search` - Search
- `filter` - Filter
- `calendar` - Date/calendar
- `clock` - Time
- `settings` - Settings/preferences
- `loader` - Loading spinner
- `file-text` - Document/file

## Size Reference

| Size | Pixels | Use Case |
|------|--------|----------|
| xs   | 12px   | Inline text icons |
| sm   | 16px   | Form inputs, small buttons |
| md   | 20px   | Default, most UI elements |
| lg   | 24px   | Larger buttons, headers |
| xl   | 32px   | Feature icons, empty states |
| 2xl  | 48px   | Hero sections, large displays |

## Styling

The icon component uses `currentColor` for stroke, so it inherits the text color by default. You can override this with the `color` input.

```css
/* Icons inherit text color */
.text-primary app-icon {
  /* Icon will be primary color */
}

/* Or use the color input */
<app-icon name="heart" color="red"></app-icon>
```

## Performance

- Icons are cached after first load
- SVG files are optimized and minified
- Lazy loading prevents unnecessary network requests
- Shared cache across all icon instances

## Accessibility

- Icons should be accompanied by text labels or ARIA labels
- Decorative icons should have `aria-hidden="true"`
- Interactive icons should have proper ARIA roles

```html
<!-- With visible label -->
<button>
  <app-icon name="plus"></app-icon>
  <span>Add Item</span>
</button>

<!-- With ARIA label -->
<button aria-label="Add item">
  <app-icon name="plus"></app-icon>
</button>

<!-- Decorative only -->
<div>
  <app-icon name="star" aria-hidden="true"></app-icon>
  <span>Featured</span>
</div>
```

## Adding New Icons

1. Add the SVG file to `frontend/src/assets/icons/`
2. Ensure the SVG uses `stroke="currentColor"` for color inheritance
3. Optimize the SVG (remove unnecessary attributes)
4. Update the `IconName` type in `icon.service.ts`
5. Add to the available icons list in the service

### SVG Format

```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <!-- icon paths -->
</svg>
```

## Icon Service

For programmatic icon usage, use the `IconService`:

```typescript
import { IconService } from '@app/shared/services';

constructor(private iconService: IconService) {}

ngOnInit() {
  // Get icon SVG
  this.iconService.getIcon('user').subscribe(svg => {
    // Use SVG string
  });

  // Preload icons
  this.iconService.preloadIcons(['user', 'doctor', 'hospital']);

  // Get available icons
  const icons = this.iconService.getAvailableIcons();
}
```
