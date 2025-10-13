# Logo Component

A reusable logo component for the CureAI Healthcare Platform.

## Usage

### Basic Usage
```html
<app-logo></app-logo>
```

### Size Variants
```html
<!-- Small logo (32px icon) -->
<app-logo size="small"></app-logo>

<!-- Medium logo (48px icon) - Default -->
<app-logo size="medium"></app-logo>

<!-- Large logo (64px icon) -->
<app-logo size="large"></app-logo>
```

### Style Variants
```html
<!-- Default colored logo -->
<app-logo variant="default"></app-logo>

<!-- White logo (for dark backgrounds) -->
<app-logo variant="white"></app-logo>

<!-- Icon only (no text) -->
<app-logo variant="icon-only"></app-logo>
```

### Clickable Logo
```html
<!-- Makes logo clickable and routes to home -->
<app-logo [clickable]="true"></app-logo>
```

### Combined Examples
```html
<!-- Small white clickable logo -->
<app-logo size="small" variant="white" [clickable]="true"></app-logo>

<!-- Large icon-only logo -->
<app-logo size="large" variant="icon-only"></app-logo>

<!-- Medium default logo (most common) -->
<app-logo size="medium" variant="default"></app-logo>
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `size` | `'small' \| 'medium' \| 'large'` | `'medium'` | Size of the logo |
| `variant` | `'default' \| 'white' \| 'icon-only'` | `'default'` | Visual style variant |
| `clickable` | `boolean` | `false` | Makes logo clickable and routes to home |

## Examples in Context

### Navigation Header
```html
<header class="navbar">
  <app-logo size="small" [clickable]="true"></app-logo>
  <!-- other nav items -->
</header>
```

### Login Page
```html
<div class="login-container">
  <app-logo size="large"></app-logo>
  <form>
    <!-- login form -->
  </form>
</div>
```

### Dark Background
```html
<div class="dark-section">
  <app-logo variant="white" size="medium"></app-logo>
</div>
```

### Mobile Menu
```html
<div class="mobile-menu">
  <app-logo size="small" variant="icon-only"></app-logo>
</div>
```

## Design Notes

- The logo includes a medical cross icon with a heartbeat line
- Colors match the design system:
  - Primary: `#667eea` (purple-blue)
  - Success: `#10b981` (green for heartbeat)
  - Text: `#374151` (dark gray)
- Responsive: Automatically adjusts on mobile screens
- Accessible: Maintains proper contrast ratios
