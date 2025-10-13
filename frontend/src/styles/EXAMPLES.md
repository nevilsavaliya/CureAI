# Shared Styles - Visual Examples

This document provides visual examples of how to use the shared styles system.

## 🎨 Color Palette

### Primary Colors
```scss
$primary: #667eea;       // Main brand color
$primary-dark: #5568d3;  // Hover states
$primary-light: #7c8ef5; // Light backgrounds
```

### Status Colors
```scss
$success: #10b981;  // ✅ Verified, Success
$warning: #f59e0b;  // ⚠️ Pending, Warning
$danger: #ef4444;   // ❌ Rejected, Error
$info: #3b82f6;     // ℹ️ Information
```

## 🔘 Button Examples

### HTML
```html
<!-- Primary Button -->
<button class="btn btn-primary">Primary Action</button>

<!-- Secondary Button -->
<button class="btn btn-secondary">Secondary Action</button>

<!-- Success Button -->
<button class="btn btn-success">Verify</button>

<!-- Danger Button -->
<button class="btn btn-danger">Delete</button>

<!-- Small Button -->
<button class="btn btn-primary btn-sm">Small</button>

<!-- Large Button -->
<button class="btn btn-primary btn-lg">Large</button>

<!-- Block Button (Full Width) -->
<button class="btn btn-primary btn-block">Full Width</button>

<!-- Disabled Button -->
<button class="btn btn-primary" disabled>Disabled</button>
```

### SCSS (Custom Button)
```scss
@import '../../../styles/index';

.custom-button {
  @include button-primary;
  @include button-lg;
  
  // Add custom styles
  border-radius: $radius-full;
  
  &:hover {
    transform: scale(1.05);
  }
}
```

## 📦 Card Examples

### HTML
```html
<!-- Basic Card -->
<div class="card">
  <div class="card-header">
    <h3>Card Title</h3>
  </div>
  <div class="card-body">
    <p>Card content goes here.</p>
  </div>
  <div class="card-footer">
    <button class="btn btn-primary">Action</button>
    <button class="btn btn-secondary">Cancel</button>
  </div>
</div>

<!-- Hoverable Card -->
<div class="card card-hover">
  <h4>Hover Me</h4>
  <p>This card lifts on hover</p>
</div>

<!-- Bordered Card -->
<div class="card card-bordered">
  <p>Card with border instead of shadow</p>
</div>
```

### SCSS (Custom Card)
```scss
@import '../../../styles/index';

.stats-card {
  @include card;
  @include gradient-primary;
  color: $text-white;
  
  .number {
    font-size: $text-4xl;
    font-weight: $font-bold;
  }
  
  .label {
    font-size: $text-sm;
    opacity: 0.9;
  }
}
```

## 📝 Form Examples

### HTML
```html
<!-- Text Input -->
<div class="form-group">
  <label>Email Address <span class="required">*</span></label>
  <input type="email" class="form-control" placeholder="Enter your email">
  <span class="form-help">We'll never share your email</span>
</div>

<!-- Input with Error -->
<div class="form-group">
  <label>Password <span class="required">*</span></label>
  <input type="password" class="form-control error" placeholder="Enter password">
  <span class="form-error">Password must be at least 8 characters</span>
</div>

<!-- Textarea -->
<div class="form-group">
  <label>Message</label>
  <textarea class="form-control" placeholder="Enter your message"></textarea>
</div>

<!-- Select -->
<div class="form-group">
  <label>Country</label>
  <select class="form-control">
    <option>Select a country</option>
    <option>United States</option>
    <option>Canada</option>
  </select>
</div>

<!-- Checkbox -->
<div class="checkbox-group">
  <input type="checkbox" id="terms">
  <label for="terms">I agree to the terms and conditions</label>
</div>

<!-- Radio -->
<div class="radio-group">
  <input type="radio" id="patient" name="role">
  <label for="patient">Patient</label>
</div>
<div class="radio-group">
  <input type="radio" id="doctor" name="role">
  <label for="doctor">Doctor</label>
</div>
```

## 🏷️ Badge Examples

### HTML
```html
<span class="badge badge-success">Verified</span>
<span class="badge badge-warning">Pending</span>
<span class="badge badge-danger">Rejected</span>
<span class="badge badge-info">New</span>
<span class="badge badge-primary">Featured</span>
```

## 🚨 Alert Examples

### HTML
```html
<!-- Success Alert -->
<div class="alert alert-success">
  <div class="alert-icon">✓</div>
  <div class="alert-content">
    <h4>Success!</h4>
    <p>Your hospital has been verified successfully.</p>
  </div>
</div>

<!-- Warning Alert -->
<div class="alert alert-warning">
  <div class="alert-icon">⚠</div>
  <div class="alert-content">
    <h4>Warning</h4>
    <p>Your API key will expire in 7 days.</p>
  </div>
</div>

<!-- Danger Alert -->
<div class="alert alert-danger">
  <div class="alert-icon">✕</div>
  <div class="alert-content">
    <h4>Error</h4>
    <p>Failed to process your request. Please try again.</p>
  </div>
</div>

<!-- Info Alert -->
<div class="alert alert-info">
  <div class="alert-icon">ℹ</div>
  <div class="alert-content">
    <h4>Information</h4>
    <p>Your application is under review.</p>
  </div>
</div>
```

## 🪟 Modal Example

### HTML
```html
<div class="modal-backdrop">
  <div class="modal">
    <div class="modal-header">
      <h3>Modal Title</h3>
      <button class="close-btn">×</button>
    </div>
    <div class="modal-body">
      <p>Modal content goes here.</p>
    </div>
    <div class="modal-footer">
      <button class="btn btn-secondary">Cancel</button>
      <button class="btn btn-primary">Confirm</button>
    </div>
  </div>
</div>
```

## 📊 Table Example

### HTML
```html
<div class="table-container">
  <table class="table">
    <thead>
      <tr>
        <th>Hospital Name</th>
        <th>Status</th>
        <th>Registration Date</th>
        <th>Actions</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td>City Hospital</td>
        <td><span class="badge badge-success">Verified</span></td>
        <td>2024-01-15</td>
        <td>
          <button class="btn btn-sm btn-primary">View</button>
        </td>
      </tr>
      <tr>
        <td>General Hospital</td>
        <td><span class="badge badge-warning">Pending</span></td>
        <td>2024-01-20</td>
        <td>
          <button class="btn btn-sm btn-primary">View</button>
        </td>
      </tr>
    </tbody>
  </table>
</div>
```

## ⏳ Loading Examples

### HTML
```html
<!-- Spinner -->
<div class="spinner"></div>

<!-- Small Spinner -->
<div class="spinner spinner-sm"></div>

<!-- Large Spinner -->
<div class="spinner spinner-lg"></div>

<!-- Centered Spinner -->
<div class="spinner spinner-center"></div>

<!-- Loading Overlay -->
<div class="loading-overlay">
  <div class="spinner spinner-lg"></div>
</div>
```

## 📑 Tabs Example

### HTML
```html
<div class="tabs">
  <button class="active">Overview</button>
  <button>Details</button>
  <button>Settings</button>
</div>
```

## 🔢 Pagination Example

### HTML
```html
<div class="pagination">
  <button disabled>Previous</button>
  <button class="active">1</button>
  <button>2</button>
  <button>3</button>
  <button>Next</button>
</div>
```

## 💡 Tooltip Example

### HTML
```html
<div class="tooltip">
  Hover me
  <span class="tooltip-text">This is a tooltip</span>
</div>
```

## 📱 Responsive Layout Example

### SCSS
```scss
@import '../../../styles/index';

.container {
  padding: $spacing-4;
  
  @include sm {
    padding: $spacing-6;
  }
  
  @include md {
    padding: $spacing-8;
    max-width: $container-md;
    margin: 0 auto;
  }
  
  @include lg {
    max-width: $container-lg;
  }
}

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

## 🎭 Animation Examples

### SCSS
```scss
@import '../../../styles/index';

.fade-in-element {
  @include fade-in;
}

.slide-up-element {
  @include slide-up;
}

.pulsing-element {
  @include pulse;
}
```

## 🛠️ Utility Classes

### HTML
```html
<!-- Text Alignment -->
<p class="text-left">Left aligned</p>
<p class="text-center">Center aligned</p>
<p class="text-right">Right aligned</p>

<!-- Text Colors -->
<p class="text-primary">Primary text</p>
<p class="text-secondary">Secondary text</p>
<p class="text-success">Success text</p>
<p class="text-danger">Danger text</p>

<!-- Font Weights -->
<p class="font-normal">Normal weight</p>
<p class="font-medium">Medium weight</p>
<p class="font-semibold">Semibold weight</p>
<p class="font-bold">Bold weight</p>

<!-- Flex Utilities -->
<div class="flex-center">Centered content</div>
<div class="flex-between">Space between</div>
<div class="flex-column">Column layout</div>

<!-- Spacing -->
<div class="mt-4">Margin top 16px</div>
<div class="mb-6">Margin bottom 24px</div>

<!-- Shadows -->
<div class="shadow">Base shadow</div>
<div class="shadow-lg">Large shadow</div>

<!-- Border Radius -->
<div class="rounded">Rounded corners</div>
<div class="rounded-lg">Large rounded</div>
<div class="rounded-full">Full circle</div>

<!-- Text Truncation -->
<p class="truncate">This text will be truncated with ellipsis...</p>
<p class="line-clamp-2">This text will be clamped to 2 lines...</p>
```

## 🎨 Custom Component Example

### SCSS
```scss
@import '../../../styles/index';

.hospital-card {
  @include card-hover;
  
  .header {
    @include flex-between;
    padding-bottom: $spacing-4;
    border-bottom: 1px solid $border-light;
    
    .name {
      font-size: $text-xl;
      font-weight: $font-semibold;
      color: $text-primary;
    }
    
    .status {
      @include badge-success;
    }
  }
  
  .info {
    padding: $spacing-4 0;
    
    .label {
      font-size: $text-sm;
      color: $text-secondary;
      margin-bottom: $spacing-2;
    }
    
    .value {
      font-size: $text-base;
      color: $text-primary;
    }
  }
  
  .actions {
    @include flex-end;
    gap: $spacing-3;
    padding-top: $spacing-4;
    border-top: 1px solid $border-light;
  }
  
  @include md {
    padding: $spacing-8;
  }
}
```

### HTML
```html
<div class="hospital-card">
  <div class="header">
    <span class="name">City Hospital</span>
    <span class="status">Verified</span>
  </div>
  <div class="info">
    <div class="label">Registration Number</div>
    <div class="value">REG123456</div>
  </div>
  <div class="info">
    <div class="label">Email</div>
    <div class="value">contact@cityhospital.com</div>
  </div>
  <div class="actions">
    <button class="btn btn-secondary btn-sm">View Details</button>
    <button class="btn btn-primary btn-sm">Edit</button>
  </div>
</div>
```

## 🎯 Best Practices

1. **Use Variables:** Always use color and spacing variables instead of hardcoding values
2. **Use Mixins:** Leverage mixins for repeated patterns
3. **Mobile First:** Start with mobile styles, then add larger breakpoints
4. **Semantic Classes:** Use component classes that describe purpose, not appearance
5. **Consistent Spacing:** Stick to the spacing scale for margins and padding
6. **Accessibility:** Include focus states and ARIA attributes
7. **Performance:** Use utility classes in HTML when possible to reduce CSS size

## 📚 Quick Reference

### Common Patterns

```scss
// Card with hover effect
@include card-hover;

// Primary button
@include button-primary;

// Flex center
@include flex-center;

// Responsive padding
padding: $spacing-4;
@include md {
  padding: $spacing-6;
}

// Custom scrollbar
@include custom-scrollbar;

// Gradient background
@include gradient-primary;

// Fade in animation
@include fade-in;
```

This examples file provides a comprehensive reference for using the shared styles system!
