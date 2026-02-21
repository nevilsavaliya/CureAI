# Avatar Component

A flexible avatar component that displays user profile images with automatic fallback to initials.

## Features

- **Image Support**: Display user profile pictures
- **Automatic Fallback**: Shows initials when no image is available
- **Color Generation**: Generates consistent colors based on user name
- **Status Indicators**: Online, offline, busy, away status badges
- **Multiple Sizes**: 6 size variants (xs to 2xl)
- **Accessibility**: Proper ARIA labels and alt text
- **Error Handling**: Gracefully handles broken image URLs

## Usage

### Basic Usage

```typescript
import { AvatarComponent } from '@app/shared/components/avatar';

@Component({
  selector: 'app-example',
  standalone: true,
  imports: [AvatarComponent],
  template: `
    <app-avatar name="John Doe"></app-avatar>
  `
})
export class ExampleComponent {}
```

### With Image

```html
<app-avatar 
  src="https://example.com/avatar.jpg" 
  name="John Doe">
</app-avatar>
```

### Different Sizes

```html
<app-avatar name="John Doe" size="xs"></app-avatar>
<app-avatar name="John Doe" size="sm"></app-avatar>
<app-avatar name="John Doe" size="md"></app-avatar> <!-- default -->
<app-avatar name="John Doe" size="lg"></app-avatar>
<app-avatar name="John Doe" size="xl"></app-avatar>
<app-avatar name="John Doe" size="2xl"></app-avatar>
```

### With Status Indicator

```html
<app-avatar name="John Doe" status="online"></app-avatar>
<app-avatar name="John Doe" status="offline"></app-avatar>
<app-avatar name="John Doe" status="busy"></app-avatar>
<app-avatar name="John Doe" status="away"></app-avatar>
```

### Custom Colors

```html
<app-avatar 
  name="John Doe" 
  backgroundColor="#667eea" 
  textColor="#ffffff">
</app-avatar>
```

### Complete Example

```html
<app-avatar 
  src="assets/images/user-avatar.jpg"
  name="Dr. Sarah Johnson"
  size="lg"
  status="online">
</app-avatar>
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `src` | `string` | `undefined` | URL of the avatar image |
| `name` | `string` | `undefined` | User's name (used for initials) |
| `size` | `'xs' \| 'sm' \| 'md' \| 'lg' \| 'xl' \| '2xl'` | `'md'` | Size of the avatar |
| `status` | `'online' \| 'offline' \| 'busy' \| 'away'` | `undefined` | Status indicator |
| `backgroundColor` | `string` | auto-generated | Custom background color |
| `textColor` | `string` | auto-calculated | Custom text color |

## Size Reference

| Size | Pixels | Use Case |
|------|--------|----------|
| xs   | 24px   | Inline mentions, small lists |
| sm   | 32px   | Compact lists, comments |
| md   | 40px   | Default, most UI elements |
| lg   | 48px   | User profiles, cards |
| xl   | 64px   | Profile headers |
| 2xl  | 96px   | Large profile displays |

## Initials Logic

- **Single name**: First 2 characters (e.g., "John" → "JO")
- **Multiple names**: First letter of first and last name (e.g., "John Doe" → "JD")
- **No name**: Question mark ("?")

## Color Generation

The component automatically generates a consistent color for each user based on their name. The same name will always produce the same color, ensuring visual consistency across the application.

Available colors:
- Primary Purple (#667eea)
- Secondary Purple (#764ba2)
- Success Green (#10b981)
- Info Blue (#3b82f6)
- Warning Orange (#f59e0b)
- Error Red (#ef4444)
- Purple (#8b5cf6)
- Pink (#ec4899)
- Teal (#14b8a6)
- Orange (#f97316)

## Status Indicators

Status badges appear in the bottom-right corner:

- **Online**: Green circle
- **Offline**: Gray circle
- **Busy**: Red circle
- **Away**: Orange circle

## Common Use Cases

### User List

```html
<div class="user-list">
  <div class="user-item" *ngFor="let user of users">
    <app-avatar 
      [src]="user.avatar" 
      [name]="user.name" 
      size="sm"
      [status]="user.status">
    </app-avatar>
    <span>{{ user.name }}</span>
  </div>
</div>
```

### Profile Header

```html
<div class="profile-header">
  <app-avatar 
    [src]="user.avatar" 
    [name]="user.name" 
    size="2xl">
  </app-avatar>
  <div class="profile-info">
    <h2>{{ user.name }}</h2>
    <p>{{ user.role }}</p>
  </div>
</div>
```

### Chat Messages

```html
<div class="message">
  <app-avatar 
    [src]="message.sender.avatar" 
    [name]="message.sender.name" 
    size="sm">
  </app-avatar>
  <div class="message-content">
    <strong>{{ message.sender.name }}</strong>
    <p>{{ message.text }}</p>
  </div>
</div>
```

### Doctor Cards

```html
<div class="doctor-card">
  <app-avatar 
    [src]="doctor.photo" 
    [name]="doctor.name" 
    size="lg"
    status="online">
  </app-avatar>
  <h3>{{ doctor.name }}</h3>
  <p>{{ doctor.specialization }}</p>
</div>
```

## Styling

The avatar component uses CSS custom properties from the design system. You can override styles if needed:

```css
app-avatar {
  /* Add border */
  border: 2px solid var(--color-primary-500);
  border-radius: var(--radius-full);
}

/* Add shadow */
app-avatar {
  box-shadow: var(--shadow-md);
}
```

## Accessibility

The component includes proper accessibility features:

- ARIA labels for screen readers
- Alt text for images
- Status indicators have descriptive labels
- Keyboard navigation support (when used in interactive elements)

```html
<!-- Screen reader will announce: "John Doe, online status" -->
<app-avatar name="John Doe" status="online"></app-avatar>
```

## Error Handling

If an image fails to load:
1. The component automatically falls back to initials
2. No error is thrown to the user
3. A warning is logged to the console (development only)

## Performance

- Images are lazy-loaded by the browser
- Color generation is cached
- No external dependencies
- Minimal re-renders

## Browser Support

Works in all modern browsers:
- ✅ Chrome
- ✅ Firefox
- ✅ Safari
- ✅ Edge
- ✅ Mobile browsers

## Examples Gallery

```html
<!-- Medical professionals -->
<app-avatar name="Dr. Sarah Johnson" size="lg"></app-avatar>
<app-avatar name="Nurse Emily Brown" size="md"></app-avatar>
<app-avatar name="Patient John Doe" size="md"></app-avatar>

<!-- With images -->
<app-avatar 
  src="assets/images/doctor-1.jpg" 
  name="Dr. Michael Chen" 
  size="lg"
  status="online">
</app-avatar>

<!-- Group display -->
<div class="avatar-group">
  <app-avatar name="User 1" size="sm"></app-avatar>
  <app-avatar name="User 2" size="sm"></app-avatar>
  <app-avatar name="User 3" size="sm"></app-avatar>
  <span>+5 more</span>
</div>
```
