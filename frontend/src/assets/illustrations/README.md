# Illustrations

Medical-themed SVG illustrations for the healthcare platform.

## Available Illustrations

### Authentication Pages

#### login-hero.svg
- **Usage**: Login page hero section
- **Description**: Abstract medical/healthcare themed illustration with checkmark and document elements
- **Colors**: Primary gradient (purple/blue)
- **Dimensions**: 500x400px

#### signup-welcome.svg
- **Usage**: Signup page hero section
- **Description**: Welcoming illustration with smiling character and decorative elements
- **Colors**: Green to blue gradient
- **Dimensions**: 500x400px

#### otp-verification.svg
- **Usage**: OTP verification page
- **Description**: Illustration showing OTP input boxes with security lock
- **Colors**: Primary purple with green accents
- **Dimensions**: 400x300px

### Dashboard & Features

#### doctor-consultation.svg
- **Usage**: Patient dashboard, consultation features
- **Description**: Doctor and patient consultation scene with medical records
- **Colors**: Purple, green, neutral tones
- **Dimensions**: 400x300px

#### medical-team.svg
- **Usage**: About section, team pages, hospital dashboard
- **Description**: Three medical professionals standing together
- **Colors**: Purple, blue, orange with red/green/orange crosses
- **Dimensions**: 400x300px

#### health-data.svg
- **Usage**: Analytics pages, doctor dashboard
- **Description**: Charts and graphs representing health data
- **Colors**: Multi-color (purple, green, blue, orange)
- **Dimensions**: 400x300px

### Empty States

#### empty-cases.svg
- **Usage**: Cases list when no cases exist
- **Description**: Empty clipboard/document with "No cases yet" message
- **Colors**: Gray tones with purple accent
- **Dimensions**: 400x300px

### Feedback & Status

#### success-checkmark.svg
- **Usage**: Success messages, confirmation screens
- **Description**: Large checkmark in circle with sparkle effects
- **Colors**: Green gradient
- **Dimensions**: 300x300px

#### 404-error.svg
- **Usage**: 404 error page
- **Description**: Sad face with "404" text and question marks
- **Colors**: Purple with gray and decorative colors
- **Dimensions**: 500x400px

## Usage in Components

### Basic Usage

```html
<img src="assets/illustrations/login-hero.svg" alt="Welcome to healthcare platform">
```

### With Styling

```html
<div class="illustration-container">
  <img 
    src="assets/illustrations/doctor-consultation.svg" 
    alt="Doctor consultation"
    class="illustration">
</div>
```

```css
.illustration-container {
  max-width: 400px;
  margin: 0 auto;
}

.illustration {
  width: 100%;
  height: auto;
  display: block;
}
```

### Responsive Usage

```html
<picture>
  <source media="(max-width: 768px)" srcset="assets/illustrations/login-hero.svg">
  <img src="assets/illustrations/login-hero.svg" alt="Welcome">
</picture>
```

## Design Guidelines

### Color Palette

All illustrations use the design system color palette:
- **Primary**: #667eea (purple)
- **Secondary**: #764ba2 (darker purple)
- **Success**: #10b981 (green)
- **Info**: #3b82f6 (blue)
- **Warning**: #f59e0b (orange)
- **Error**: #ef4444 (red)
- **Neutral**: Gray scale

### Style Characteristics

- **Flat design**: Simple, modern aesthetic
- **Rounded shapes**: Friendly and approachable
- **Minimal details**: Focus on clarity
- **Consistent stroke width**: 2-4px typically
- **Opacity layers**: Used for depth (0.1-0.5)

### Optimization

All illustrations are:
- ✅ Optimized for web delivery
- ✅ Using minimal SVG code
- ✅ Compressed without quality loss
- ✅ Accessible with proper alt text
- ✅ Scalable without pixelation

## Adding New Illustrations

1. Create SVG with viewBox (not fixed width/height)
2. Use design system colors
3. Keep file size under 10KB
4. Test at different sizes
5. Add to this README with description
6. Ensure accessibility (meaningful alt text)

### SVG Template

```xml
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 300" fill="none">
  <!-- Your illustration content -->
</svg>
```

## Accessibility

Always provide meaningful alt text:

```html
<!-- Good -->
<img src="assets/illustrations/empty-cases.svg" 
     alt="No medical cases found. Start by creating a new case.">

<!-- Bad -->
<img src="assets/illustrations/empty-cases.svg" alt="illustration">
```

For decorative illustrations:

```html
<img src="assets/illustrations/login-hero.svg" 
     alt="" 
     role="presentation">
```

## Performance

- All SVGs are inline-optimized
- Average file size: 2-5KB
- Load time: < 50ms
- Can be lazy-loaded for below-fold content

```html
<img src="assets/illustrations/health-data.svg" 
     alt="Health analytics" 
     loading="lazy">
```

## Browser Support

SVG illustrations are supported in:
- ✅ Chrome (all versions)
- ✅ Firefox (all versions)
- ✅ Safari (all versions)
- ✅ Edge (all versions)
- ✅ Mobile browsers (iOS Safari, Chrome Mobile)

## License

These illustrations are custom-created for the healthcare platform and are part of the project assets.
