# 404 Not Found Component

A custom 404 error page with illustration, navigation options, and helpful links.

## Features

- Beautiful illustration from `assets/illustrations/404-error.svg`
- Navigation buttons (Go Home, Go Back)
- Quick links to common pages (Login, Sign Up, Hospital Portal)
- Responsive design
- Smooth animations
- Accessibility compliant

## Routing Configuration

The component is automatically displayed for any unmatched routes via the wildcard route:

```typescript
{ path: '**', component: NotFoundComponent }
```

This route should be placed **last** in the routes array to catch all unmatched paths.

## Navigation Actions

### Go Home
Navigates to the root path (`/`), which redirects to the login page.

### Go Back
Uses browser history to navigate to the previous page.

### Quick Links
- **Login** - `/login`
- **Sign Up** - `/signup`
- **Hospital Portal** - `/hospital/login`

## Styling

The component features:
- Full-screen centered layout
- Gradient background
- Floating animation on illustration
- Gradient text effect on "404"
- Smooth hover effects on buttons
- Responsive design for mobile devices

## Customization

To customize the 404 page:

1. **Change Illustration**: Replace `assets/illustrations/404-error.svg` with your own SVG
2. **Modify Text**: Edit the HTML template to change messages
3. **Add/Remove Links**: Update the help-links section in the template
4. **Adjust Styling**: Modify `not-found.component.css`

## Accessibility

- Semantic HTML structure
- Keyboard navigation support
- Alt text for illustration
- High contrast text
- Focus indicators on interactive elements
- Respects `prefers-reduced-motion`

## Browser Support

Works in all modern browsers that support:
- CSS Grid and Flexbox
- CSS Custom Properties
- CSS Animations
- SVG images
