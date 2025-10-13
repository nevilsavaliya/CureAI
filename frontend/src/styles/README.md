# Shared Styles Documentation

This directory contains shared SCSS files for the Healthcare Platform frontend application.

## Files Overview

### `_variables.scss`
Contains all design tokens including:
- **Colors**: Primary, status colors (success, warning, danger, info), gray scale, backgrounds
- **Typography**: Font families, sizes, weights, line heights
- **Spacing**: Consistent spacing scale (4px increments)
- **Border Radius**: Rounded corner sizes
- **Shadows**: Box shadow variations
- **Breakpoints**: Responsive design breakpoints
- **Z-Index**: Layer management
- **Transitions**: Animation timing
- **Container Widths**: Max-width constraints

### `_mixins.scss`
Reusable style patterns including:
- **Responsive Breakpoints**: `@include sm`, `@include md`, `@include lg`, etc.
- **Flexbox Utilities**: `flex-center`, `flex-between`, `flex-column`, etc.
- **Button Styles**: `button-primary`, `button-secondary`, `button-success`, etc.
- **Card Styles**: `card`, `card-hover`, `card-bordered`
- **Input Styles**: `input-base`, `input-error`
- **Badge Styles**: `badge-success`, `badge-warning`, etc.
- **Text Utilities**: `truncate`, `line-clamp`
- **Scrollbar Styles**: `custom-scrollbar`
- **Gradient Backgrounds**: `gradient-primary`, `gradient-success`
- **Animations**: `fade-in`, `slide-up`, `pulse`
- **Loading Spinner**: `spinner`
- **Accessibility**: `visually-hidden`, `focus-visible`

### `_components.scss`
Pre-built component classes including:
- **Buttons**: `.btn`, `.btn-primary`, `.btn-secondary`, etc.
- **Cards**: `.card`, `.card-header`, `.card-body`, `.card-footer`
- **Forms**: `.form-group`, `.form-control`, `.form-error`
- **Badges**: `.badge`, `.badge-success`, `.badge-warning`, etc.
- **Alerts**: `.alert`, `.alert-success`, `.alert-danger`, etc.
- **Modals**: `.modal`, `.modal-backdrop`, `.modal-header`, etc.
- **Tables**: `.table`, `.table-container`
- **Loading**: `.spinner`, `.loading-overlay`
- **Pagination**: `.pagination`
- **Tabs**: `.tabs`
- **Tooltips**: `.tooltip`
- **Utility Classes**: Text alignment, colors, spacing, display, flex, etc.

### `_index.scss`
Main entry point that imports all other SCSS files in the correct order.

## Usage

### In Component SCSS Files

Import the styles in your component SCSS files:

```scss
@import '../../../styles/index';

.my-component {
  @include card;
  
  .header {
    @include flex-between;
    padding: $spacing-4;
  }
  
  .button {
    @include button-primary;
  }
}
```

### Using Variables

```scss
@import '../../../styles/variables';

.my-element {
  color: $primary;
  padding: $spacing-4;
  border-radius: $radius-lg;
  box-shadow: $shadow-md;
}
```

### Using Mixins

```scss
@import '../../../styles/mixins';

.responsive-container {
  padding: $spacing-4;
  
  @include md {
    padding: $spacing-6;
  }
  
  @include lg {
    padding: $spacing-8;
  }
}

.custom-button {
  @include button-primary;
  @include button-lg;
}
```

### Using Component Classes in HTML

```html
<!-- Buttons -->
<button class="btn btn-primary">Primary Button</button>
<button class="btn btn-secondary btn-sm">Small Secondary</button>

<!-- Cards -->
<div class="card">
  <div class="card-header">
    <h3>Card Title</h3>
  </div>
  <div class="card-body">
    Card content goes here
  </div>
  <div class="card-footer">
    <button class="btn btn-primary">Action</button>
  </div>
</div>

<!-- Forms -->
<div class="form-group">
  <label>Email <span class="required">*</span></label>
  <input type="email" class="form-control" placeholder="Enter email">
  <span class="form-error">This field is required</span>
</div>

<!-- Badges -->
<span class="badge badge-success">Verified</span>
<span class="badge badge-warning">Pending</span>
<span class="badge badge-danger">Rejected</span>

<!-- Alerts -->
<div class="alert alert-success">
  <div class="alert-content">
    <h4>Success!</h4>
    <p>Your changes have been saved.</p>
  </div>
</div>
```

## Responsive Design

The styles use a mobile-first approach. Use the responsive mixins to add styles for larger screens:

```scss
.container {
  padding: $spacing-4;
  
  @include sm {
    // Styles for screens >= 640px
    padding: $spacing-6;
  }
  
  @include md {
    // Styles for screens >= 768px
    padding: $spacing-8;
  }
  
  @include lg {
    // Styles for screens >= 1024px
    max-width: $container-lg;
    margin: 0 auto;
  }
}
```

## Color System

### Primary Colors
- `$primary`: #667eea (Purple-blue)
- `$primary-dark`: #5568d3
- `$primary-light`: #7c8ef5

### Status Colors
- `$success`: #10b981 (Green - verified)
- `$warning`: #f59e0b (Orange - pending)
- `$danger`: #ef4444 (Red - rejected)
- `$info`: #3b82f6 (Blue)

### Gray Scale
- `$gray-50` to `$gray-900` (9 shades)

## Typography

### Font Families
- Primary: 'Inter', 'Segoe UI', sans-serif
- Monospace: 'Fira Code', 'Courier New', monospace

### Font Sizes
- `$text-xs`: 12px
- `$text-sm`: 14px
- `$text-base`: 16px
- `$text-lg`: 18px
- `$text-xl`: 20px
- `$text-2xl`: 24px
- `$text-3xl`: 30px
- `$text-4xl`: 36px

## Spacing Scale

All spacing uses a consistent 4px base unit:
- `$spacing-1`: 4px
- `$spacing-2`: 8px
- `$spacing-3`: 12px
- `$spacing-4`: 16px
- `$spacing-5`: 20px
- `$spacing-6`: 24px
- `$spacing-8`: 32px
- `$spacing-10`: 40px
- `$spacing-12`: 48px

## Best Practices

1. **Always import variables first** when using multiple SCSS files
2. **Use mixins for repeated patterns** instead of duplicating code
3. **Use component classes** for common UI elements
4. **Follow the spacing scale** for consistent layouts
5. **Use the color variables** instead of hardcoding colors
6. **Test responsive designs** at all breakpoints
7. **Use semantic class names** that describe purpose, not appearance

## Examples

### Creating a Custom Card Component

```scss
@import '../../../styles/index';

.custom-card {
  @include card;
  
  &:hover {
    transform: translateY(-4px);
    box-shadow: $shadow-lg;
  }
  
  .title {
    font-size: $text-xl;
    font-weight: $font-semibold;
    color: $primary;
    margin-bottom: $spacing-3;
  }
  
  .content {
    color: $text-secondary;
    line-height: $leading-relaxed;
  }
  
  @include md {
    padding: $spacing-8;
  }
}
```

### Creating a Responsive Grid

```scss
@import '../../../styles/index';

.grid {
  display: grid;
  gap: $spacing-4;
  grid-template-columns: 1fr;
  
  @include sm {
    grid-template-columns: repeat(2, 1fr);
  }
  
  @include lg {
    grid-template-columns: repeat(3, 1fr);
    gap: $spacing-6;
  }
}
```

## Integration with Angular

To use these styles globally in your Angular application, import them in your `styles.css` or `styles.scss`:

```scss
// In src/styles.scss (rename from styles.css if needed)
@import 'styles/index';

// Add any global styles here
body {
  font-family: $font-primary;
  color: $text-primary;
  background: $bg-secondary;
}
```

Or import in individual component SCSS files as shown in the examples above.
