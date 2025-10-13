# Responsive Breakpoints Guide

## Overview
This guide documents the responsive breakpoints used throughout the Healthcare Platform and provides examples of how layouts adapt at each breakpoint.

---

## Breakpoint System

### Standard Breakpoints
```scss
// Mobile (default - mobile-first)
// 320px - 639px

// Small Mobile
$breakpoint-sm: 640px;

// Tablet
$breakpoint-md: 768px;

// Desktop
$breakpoint-lg: 1024px;

// Large Desktop
$breakpoint-xl: 1280px;

// Extra Large Desktop
$breakpoint-2xl: 1536px;
```

### Common Device Sizes
- **iPhone SE:** 375px × 667px
- **iPhone 12/13/14:** 390px × 844px
- **Samsung Galaxy S20:** 360px × 800px
- **iPad:** 768px × 1024px
- **iPad Pro:** 1024px × 1366px
- **Desktop:** 1280px+ × variable

---

## Layout Patterns by Breakpoint

### 1. Grid Layouts

#### Mobile (< 640px)
```
┌─────────────────┐
│   Card 1        │
├─────────────────┤
│   Card 2        │
├─────────────────┤
│   Card 3        │
└─────────────────┘
```
- Single column
- Full width cards
- Vertical stacking

#### Tablet (640px - 1023px)
```
┌─────────┬─────────┐
│ Card 1  │ Card 2  │
├─────────┼─────────┤
│ Card 3  │ Card 4  │
└─────────┴─────────┘
```
- Two columns
- Equal width cards
- Better space utilization

#### Desktop (1024px+)
```
┌─────┬─────┬─────┬─────┐
│ C1  │ C2  │ C3  │ C4  │
└─────┴─────┴─────┴─────┘
```
- Three or four columns
- Compact layout
- Maximum information density

---

### 2. Split Layouts (Dashboard)

#### Mobile (< 1024px)
```
┌─────────────────┐
│   Chatbot       │
│   Section       │
│                 │
└─────────────────┘
┌─────────────────┐
│   Results       │
│   Section       │
│                 │
└─────────────────┘
```
- Vertical stacking
- Full width sections
- Scroll to see all content

#### Desktop (1024px+)
```
┌─────────┬─────────┐
│ Chatbot │ Results │
│ Section │ Section │
│         │         │
└─────────┴─────────┘
```
- Side-by-side layout
- 50/50 split
- No scrolling needed

---

### 3. Navigation

#### Mobile (< 768px)
```
┌─────────────────┐
│ ☰  Logo    👤   │
└─────────────────┘
```
- Hamburger menu
- Compact header
- Icons only

#### Tablet/Desktop (768px+)
```
┌─────────────────────────────┐
│ Logo  Home  Cases  Profile  │
└─────────────────────────────┘
```
- Full navigation
- Text labels
- Horizontal layout

---

### 4. Forms

#### Mobile (< 640px)
```
┌─────────────────┐
│ Name            │
├─────────────────┤
│ Email           │
├─────────────────┤
│ Phone           │
├─────────────────┤
│ [Submit Button] │
└─────────────────┘
```
- Single column
- Full width inputs
- Stacked fields

#### Desktop (640px+)
```
┌─────────┬─────────┐
│ Name    │ Email   │
├─────────┴─────────┤
│ Phone             │
├───────────────────┤
│  [Submit Button]  │
└───────────────────┘
```
- Two column layout
- Better space usage
- Grouped fields

---

### 5. Tables

#### Mobile (< 768px)
```
┌─────────────────┐
│ Name    | Status │
│ John    | Active │
│ Jane    | Active │
└─────────────────┘
← Scroll →
```
- Horizontal scroll
- Reduced columns
- Smaller fonts

#### Desktop (768px+)
```
┌────────────────────────────────┐
│ Name  | Email      | Status    │
│ John  | j@mail.com | Active    │
│ Jane  | jane@m.com | Active    │
└────────────────────────────────┘
```
- All columns visible
- No scrolling
- Full information

---

### 6. Modals

#### Mobile (< 768px)
```
┌─────────────────┐
│ ×          Title│
├─────────────────┤
│                 │
│   Content       │
│                 │
├─────────────────┤
│ [Cancel] [OK]   │
└─────────────────┘
```
- 95% width
- Full height
- Stacked buttons

#### Desktop (768px+)
```
    ┌───────────┐
    │ × Title   │
    ├───────────┤
    │           │
    │  Content  │
    │           │
    ├───────────┤
    │ [Cancel]  │
    │    [OK]   │
    └───────────┘
```
- Fixed max-width
- Centered
- Inline buttons

---

## Component-Specific Breakpoints

### Login Page
```scss
// Mobile: < 1024px
- Single column
- Form only
- No side image

// Desktop: 1024px+
- Split screen
- Form + image
- 50/50 layout
```

### Patient Dashboard
```scss
// Mobile: < 1024px
- Chatbot full width
- Results below
- Vertical scroll

// Desktop: 1024px+
- Side-by-side
- Fixed height
- No vertical scroll
```

### Hospital Dashboard
```scss
// Mobile: < 768px
- Single column stats
- Stacked credentials
- Scrollable tables

// Tablet: 768px - 1023px
- Two column stats
- Two column credentials
- Scrollable tables

// Desktop: 1024px+
- Three column stats
- Two column credentials
- Full width tables
```

### Admin Dashboard
```scss
// Mobile: < 768px
- Single column metrics
- Stacked filters
- Scrollable tabs

// Desktop: 768px+
- Multi-column metrics
- Inline filters
- Full width tabs
```

---

## Touch Target Guidelines

### Minimum Sizes
```scss
// Buttons
min-height: 44px;  // WCAG 2.1 AA
min-width: 44px;

// Mobile buttons
@media (max-width: 640px) {
  min-height: 48px;  // Recommended
  width: 100%;       // Full width
}
```

### Spacing
```scss
// Between interactive elements
gap: 12px;  // Minimum

// Mobile spacing
@media (max-width: 640px) {
  gap: 16px;  // More comfortable
}
```

---

## Typography Scale

### Headings
```scss
// Mobile
h1: 1.5rem (24px)
h2: 1.25rem (20px)
h3: 1.125rem (18px)

// Desktop
h1: 2rem (32px)
h2: 1.5rem (24px)
h3: 1.25rem (20px)
```

### Body Text
```scss
// Mobile
body: 14px
small: 12px

// Desktop
body: 16px
small: 14px
```

### Form Inputs
```scss
// Mobile (prevents iOS zoom)
input: 16px

// Desktop
input: 14-16px
```

---

## Common Media Queries

### Mobile Only
```scss
@media (max-width: 639px) {
  // Mobile-specific styles
}
```

### Tablet and Up
```scss
@media (min-width: 640px) {
  // Tablet and desktop styles
}
```

### Desktop Only
```scss
@media (min-width: 1024px) {
  // Desktop-specific styles
}
```

### Between Breakpoints
```scss
@media (min-width: 640px) and (max-width: 1023px) {
  // Tablet-only styles
}
```

---

## Testing Checklist

### For Each Breakpoint
- [ ] Layout doesn't break
- [ ] Text is readable
- [ ] Images scale properly
- [ ] Buttons are accessible
- [ ] Forms are usable
- [ ] Navigation works
- [ ] Modals fit screen
- [ ] Tables are readable
- [ ] No horizontal scroll
- [ ] Performance is good

### Device-Specific
- [ ] iPhone SE (375px)
- [ ] iPhone 12 (390px)
- [ ] Android (360px)
- [ ] iPad (768px)
- [ ] iPad Pro (1024px)
- [ ] Desktop (1280px+)

---

## Best Practices

### 1. Mobile-First
Start with mobile styles, enhance for larger screens:
```scss
// ✅ Good
.component {
  padding: 1rem;  // Mobile
  
  @media (min-width: 768px) {
    padding: 2rem;  // Desktop
  }
}

// ❌ Avoid
.component {
  padding: 2rem;  // Desktop
  
  @media (max-width: 767px) {
    padding: 1rem;  // Mobile
  }
}
```

### 2. Use Relative Units
```scss
// ✅ Good
font-size: 1rem;
padding: 1.5rem;

// ❌ Avoid
font-size: 16px;
padding: 24px;
```

### 3. Test at Boundaries
Always test at breakpoint boundaries:
- 639px / 640px
- 767px / 768px
- 1023px / 1024px

### 4. Consider Touch
```scss
// ✅ Good - Touch-friendly
button {
  min-height: 44px;
  padding: 12px 24px;
}

// ❌ Avoid - Too small
button {
  height: 32px;
  padding: 4px 8px;
}
```

---

## Quick Reference

### Breakpoint Mixins
```scss
@import 'styles/mixins';

.component {
  // Mobile (default)
  padding: 1rem;
  
  // Tablet
  @include md {
    padding: 1.5rem;
  }
  
  // Desktop
  @include lg {
    padding: 2rem;
  }
}
```

### Common Patterns
```scss
// Stack to Grid
.grid {
  display: grid;
  grid-template-columns: 1fr;
  
  @include md {
    grid-template-columns: repeat(2, 1fr);
  }
  
  @include lg {
    grid-template-columns: repeat(3, 1fr);
  }
}

// Hide on Mobile
.desktop-only {
  display: none;
  
  @include lg {
    display: block;
  }
}

// Show on Mobile Only
.mobile-only {
  display: block;
  
  @include lg {
    display: none;
  }
}
```

---

## Resources

### Testing Tools
- Chrome DevTools (Device Mode)
- Firefox Responsive Design Mode
- Safari Responsive Design Mode
- BrowserStack (Real devices)

### Documentation
- [MDN Media Queries](https://developer.mozilla.org/en-US/docs/Web/CSS/Media_Queries)
- [WCAG Touch Target Size](https://www.w3.org/WAI/WCAG21/Understanding/target-size.html)
- [Responsive Web Design Basics](https://web.dev/responsive-web-design-basics/)

