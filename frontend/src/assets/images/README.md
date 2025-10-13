# CureAI Image Assets

This directory contains the logo and background image assets for the CureAI Healthcare Platform.

## Available Logos

### 1. `logo.svg` (Primary Logo)
- **Dimensions:** 200x60px
- **Usage:** Main logo for light backgrounds
- **Colors:** 
  - Primary: #667eea (Purple-blue)
  - Accent: #10b981 (Green)
  - Text: #374151 (Dark gray)
- **Best for:** Headers, navigation bars, login pages

### 2. `logo-icon.svg` (Icon Only)
- **Dimensions:** 60x60px
- **Usage:** Favicon, mobile app icon, compact spaces
- **Colors:**
  - Background: #667eea (Purple-blue)
  - Cross: White
  - Heartbeat: #10b981 (Green)
- **Best for:** Favicons, mobile icons, small spaces

### 3. `logo-white.svg` (White Version)
- **Dimensions:** 200x60px
- **Usage:** Logo for dark backgrounds
- **Colors:**
  - Primary: White
  - Accent: #10b981 (Green)
  - AI text: #a5b4fc (Light purple)
- **Best for:** Dark mode, colored backgrounds, footers

## Design Elements

### Medical Cross
- Represents healthcare and medical services
- Centered circle with cross design
- Professional and recognizable

### Heartbeat Line
- Symbolizes life, health monitoring, and vitality
- Green color represents health and wellness
- Adds dynamic element to the design

### Typography
- Font: Inter (fallback: Arial, sans-serif)
- "Cure" in dark gray/white
- "AI" in brand purple/light purple
- Tagline: "Healthcare Platform"

## Usage Guidelines

1. **Minimum Size:** Do not scale below 120px width for full logo
2. **Clear Space:** Maintain at least 10px padding around logo
3. **Background:** Use appropriate version based on background color
4. **Modifications:** Do not modify colors or proportions

## Integration Example

```html
<!-- In Angular component -->
<img src="assets/images/logo.svg" alt="CureAI Healthcare Platform" class="logo">

<!-- For dark backgrounds -->
<img src="assets/images/logo-white.svg" alt="CureAI Healthcare Platform" class="logo">

<!-- Icon only -->
<img src="assets/images/logo-icon.svg" alt="CureAI" class="logo-icon">
```

## Medical Background Images

### 1. `doctor-consultation.svg`
- **Dimensions:** 800x1000px
- **Usage:** Login page background, consultation pages
- **Features:**
  - Professional doctor figure with white coat
  - Stethoscope and clipboard
  - Medical cross patterns
  - Subtle gradient background
- **Best for:** Login pages, doctor-related interfaces

### 2. `medical-team.svg`
- **Dimensions:** 800x1000px
- **Usage:** Signup page background, team pages
- **Features:**
  - Three healthcare professionals
  - Mix of doctors and nurses
  - Heartbeat line pattern
  - DNA helix and medical symbols
- **Best for:** Signup pages, about team sections

### 3. `hospital-building.svg`
- **Dimensions:** 800x1000px
- **Usage:** Hospital registration background
- **Features:**
  - Modern hospital building with medical cross
  - Emergency entrance
  - Ambulance
  - Windows and architectural details
- **Best for:** Hospital registration, facility pages

### 4. `nurse-care.svg`
- **Dimensions:** 800x1000px
- **Usage:** Patient care pages, nursing interfaces
- **Features:**
  - Nurse in scrubs with medical chart
  - IV stand and heart rate monitor
  - Medical equipment
  - Caring and professional atmosphere
- **Best for:** Patient care pages, nursing sections

## Usage Guidelines - Background Images

1. **Responsive Design:** Images scale well for different screen sizes
2. **Split Screen Layout:** Designed for 50/50 split with form on left, image on right
3. **Color Harmony:** All images use the brand color palette (#667eea, #10b981)
4. **Opacity:** Can be used with overlay for better text readability
5. **Mobile:** Consider hiding or adjusting for mobile viewports

## Integration Example - Background Images

```html
<!-- Login page with doctor background -->
<div class="login-container">
  <div class="login-form">
    <!-- Form content -->
  </div>
  <div class="login-image">
    <img src="assets/images/doctor-consultation.svg" alt="Doctor Consultation">
  </div>
</div>

<!-- Signup page with medical team -->
<div class="signup-container">
  <div class="signup-form">
    <!-- Form content -->
  </div>
  <div class="signup-image">
    <img src="assets/images/medical-team.svg" alt="Medical Team">
  </div>
</div>

<!-- Hospital registration with building -->
<div class="hospital-register-container">
  <div class="register-form">
    <!-- Form content -->
  </div>
  <div class="register-image">
    <img src="assets/images/hospital-building.svg" alt="Hospital Building">
  </div>
</div>
```

## CSS Example for Split Screen Layout

```css
.login-container {
  display: flex;
  min-height: 100vh;
}

.login-form {
  flex: 1;
  padding: 2rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.login-image {
  flex: 1;
  background: linear-gradient(135deg, #667eea 0%, #10b981 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 2rem;
}

.login-image img {
  max-width: 100%;
  height: auto;
  object-fit: contain;
}

@media (max-width: 768px) {
  .login-container {
    flex-direction: column;
  }
  
  .login-image {
    display: none; /* Hide on mobile */
  }
}
```

## File Formats

All assets are provided in SVG format for:
- Scalability without quality loss
- Small file size
- Easy color modifications if needed
- Crisp display on all screen resolutions
- Perfect for responsive design
