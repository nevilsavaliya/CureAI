# Hospital Dashboard - Visual Preview

## 🎨 Component Layout

```
┌─────────────────────────────────────────────────────────────────────┐
│  Hospital Dashboard                    [🔄] [👤] [Logout]           │
│  Welcome back, City Hospital                                         │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│  💓  Welcome to Your Hospital Dashboard                             │
│      Access patient medical records securely using your API         │
│      credentials. Monitor your API usage and manage your profile.   │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│  API Credentials                                                     │
│  Use these credentials to access patient data via API               │
│                                                                       │
│  ┌──────────────────────────┐  ┌──────────────────────────┐        │
│  │ API Key         [Public] │  │ API Secret      [Private]│        │
│  │ HK_abc123...             │  │ ••••••••••••••••••••••••│        │
│  │ [📋 Copy]                │  │ [📋 Copy]                │        │
│  └──────────────────────────┘  │ ℹ️ Your API Secret was   │        │
│                                 │   sent to your email     │        │
│                                 └──────────────────────────┘        │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│  API Usage Statistics                                                │
│  Monitor your API consumption and performance                        │
│                                                                       │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐               │
│  │ 🕐 Rate Limit│ │ 💰 Total     │ │ 📅 Today     │               │
│  │ 95/100       │ │ 1,234        │ │ 12           │               │
│  │ ▓▓▓▓▓▓▓▓▓░░░ │ │ All time     │ │ Requests     │               │
│  │ Remaining    │ └──────────────┘ └──────────────┘               │
│  └──────────────┘                                                    │
│                                                                       │
│  ┌──────────────┐ ┌──────────────┐ ┌──────────────┐               │
│  │ ✓ Success    │ │ ⚡ Avg Resp  │ │ 📥 This Month│               │
│  │ 98.5%        │ │ 245ms        │ │ 456          │               │
│  │ API reliable │ │ Response time│ │ Monthly reqs │               │
│  └──────────────┘ └──────────────┘ └──────────────┘               │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│  Recent API Requests                                                 │
│  Latest patient data access logs                                     │
│                                                                       │
│  ┌─────────────────────────────────────────────────────────────────┐│
│  │ Patient Email          │ Timestamp      │ Status  │ Response   ││
│  ├─────────────────────────────────────────────────────────────────┤│
│  │ 👤 john.doe@email.com  │ 30 minutes ago │ success │ 234ms      ││
│  │ 👤 jane.smith@mail.com │ 1 hour ago     │ success │ 198ms      ││
│  │ 👤 bob.wilson@test.com │ 2 hours ago    │ success │ 312ms      ││
│  └─────────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│  Quick Access                                                        │
│  Helpful resources and actions                                       │
│                                                                       │
│  ┌──────────────────────────┐  ┌──────────────────────────┐        │
│  │ 📖 API Documentation     │  │ ⚙️ Profile Settings      │        │
│  │ Learn how to integrate   │  │ Manage your hospital     │        │
│  │ our API              →   │  │ profile              →   │        │
│  └──────────────────────────┘  └──────────────────────────┘        │
└─────────────────────────────────────────────────────────────────────┘
```

## 🎨 Color Scheme

### Primary Colors
- **Background Gradient**: Purple-blue (#667eea → #764ba2)
- **Cards**: White (#ffffff)
- **Text Primary**: Dark gray (#1f2937)
- **Text Secondary**: Medium gray (#6b7280)

### Status Colors
- **Success**: Green (#10b981) - Used for success badges, checkmarks
- **Warning**: Orange (#f59e0b) - Used for medium usage warnings
- **Error**: Red (#ef4444) - Used for high usage warnings, errors
- **Info**: Blue (#3b82f6) - Used for informational elements

### Interactive Elements
- **Primary Button**: Purple gradient with hover effect
- **Secondary Button**: White with gray border
- **Icon Buttons**: Light gray background with hover
- **Copy Button**: Purple with green on success

## 📱 Responsive Breakpoints

### Desktop (> 1024px)
```
┌─────────────────────────────────────────────────────────┐
│  [Header with all elements in one row]                  │
├─────────────────────────────────────────────────────────┤
│  [Welcome Card - Full Width]                            │
├─────────────────────────────────────────────────────────┤
│  [API Key Card]          [API Secret Card]              │
├─────────────────────────────────────────────────────────┤
│  [Rate] [Total] [Today]                                 │
│  [Success] [Response] [Month]                           │
├─────────────────────────────────────────────────────────┤
│  [Recent Requests Table - Full Width]                   │
├─────────────────────────────────────────────────────────┤
│  [API Docs Card]         [Profile Card]                 │
└─────────────────────────────────────────────────────────┘
```

### Tablet (768px - 1024px)
```
┌─────────────────────────────────────┐
│  [Header - Adjusted spacing]        │
├─────────────────────────────────────┤
│  [Welcome Card]                     │
├─────────────────────────────────────┤
│  [API Key Card]                     │
│  [API Secret Card]                  │
├─────────────────────────────────────┤
│  [Rate] [Total]                     │
│  [Today] [Success]                  │
│  [Response] [Month]                 │
├─────────────────────────────────────┤
│  [Recent Requests - Scrollable]     │
├─────────────────────────────────────┤
│  [API Docs Card]                    │
│  [Profile Card]                     │
└─────────────────────────────────────┘
```

### Mobile (< 768px)
```
┌─────────────────────┐
│  [Header Stacked]   │
│  Title              │
│  [Actions]          │
├─────────────────────┤
│  [Welcome Card]     │
├─────────────────────┤
│  [API Key Card]     │
├─────────────────────┤
│  [API Secret Card]  │
├─────────────────────┤
│  [Rate Limit]       │
├─────────────────────┤
│  [Total Requests]   │
├─────────────────────┤
│  [Today]            │
├─────────────────────┤
│  [Success Rate]     │
├─────────────────────┤
│  [Avg Response]     │
├─────────────────────┤
│  [This Month]       │
├─────────────────────┤
│  [Requests Table]   │
│  (Horizontal scroll)│
├─────────────────────┤
│  [API Docs Card]    │
├─────────────────────┤
│  [Profile Card]     │
└─────────────────────┘
```

## 🎭 Interactive States

### Copy Button States
```
Normal:     [📋 Copy]           (Purple background)
Hover:      [📋 Copy]           (Darker purple)
Clicked:    [✓ Copied!]         (Green background)
After 2s:   [📋 Copy]           (Back to normal)
```

### Card Hover Effects
```
Normal:     Card with subtle shadow
Hover:      Card lifts up 2px, shadow increases
            Arrow icons slide right 4px
```

### Progress Bar Colors
```
0-50%:      Green (#10b981)
50-80%:     Orange (#f59e0b)
80-100%:    Red (#ef4444)
```

### Status Badges
```
Success:    [success]  (Green background, green text)
Error:      [error]    (Red background, red text)
```

## 🔤 Typography

### Font Sizes
- **Page Title**: 1.75rem (28px) - Bold
- **Section Title**: 1.25rem (20px) - Bold
- **Card Title**: 1rem (16px) - Semibold
- **Body Text**: 0.95rem (15px) - Regular
- **Small Text**: 0.875rem (14px) - Regular
- **Tiny Text**: 0.8rem (13px) - Regular
- **Stat Value**: 1.75rem (28px) - Bold
- **Code**: 0.875rem (14px) - Monospace

### Font Weights
- **Bold**: 700 (Titles, stat values)
- **Semibold**: 600 (Card titles, labels)
- **Medium**: 500 (Buttons, badges)
- **Regular**: 400 (Body text)

## 🎯 Key Features Visualization

### 1. Welcome Message
```
┌─────────────────────────────────────────────────┐
│  💓  Welcome to Your Hospital Dashboard         │
│      Access patient medical records securely... │
└─────────────────────────────────────────────────┘
```
- Large medical icon with gradient background
- Bold heading
- Descriptive subtitle
- Full-width card

### 2. API Credentials
```
┌──────────────────────────┐
│ API KEY         [Public] │
│ HK_abc123def456...       │
│ [📋 Copy]                │
└──────────────────────────┘
```
- Monospace font for credentials
- Color-coded badges (green for public, red for private)
- Copy button with icon
- Security note for secret

### 3. Rate Limit Display
```
┌──────────────────────────┐
│ 🕐 Rate Limit            │
│ 95/100                   │
│ ▓▓▓▓▓▓▓▓▓░░░░░░░░░░░░░░ │
│ Requests remaining       │
└──────────────────────────┘
```
- Large stat value
- Visual progress bar
- Dynamic color based on usage
- Highlighted card style

### 4. Recent Requests Table
```
┌─────────────────────────────────────────────┐
│ Patient Email    │ Time    │ Status │ Speed │
├─────────────────────────────────────────────┤
│ 👤 john@mail.com │ 30m ago │ ✓      │ 234ms │
└─────────────────────────────────────────────┘
```
- User icon for each row
- Relative timestamps
- Color-coded status badges
- Monospace response times

### 5. Quick Access Cards
```
┌──────────────────────────┐
│ 📖 API Documentation     │
│ Learn how to integrate   │
│ our API              →   │
└──────────────────────────┘
```
- Large icon on left
- Title and description
- Arrow indicator on right
- Hover effects (lift, arrow slide)

## 🎬 Animations

### Page Load
1. Header fades in (0.2s)
2. Welcome card slides up (0.3s)
3. Sections fade in sequentially (0.4s each)

### Interactions
- **Button Hover**: Scale 1.02, shadow increase (0.2s)
- **Card Hover**: Translate Y -2px, shadow increase (0.2s)
- **Copy Success**: Background color change (0.3s)
- **Progress Bar**: Width animation (0.3s ease)
- **Arrow Slide**: Transform X +4px (0.2s)

## 📊 Data Display Examples

### Empty State
```
┌─────────────────────────────────────┐
│           📄                         │
│     No API Requests Yet              │
│  Start using your API credentials    │
│  to access patient data              │
└─────────────────────────────────────┘
```

### Loading State
```
┌─────────────────────────────────────┐
│           ⟳                          │
│     Loading dashboard...             │
└─────────────────────────────────────┘
```

### Success Toast
```
┌─────────────────────────────────────┐
│ ✓ API Key copied to clipboard!      │
└─────────────────────────────────────┘
```

## 🎨 Design Principles

1. **Clarity**: Clear hierarchy, readable fonts, sufficient spacing
2. **Consistency**: Uniform card styles, consistent icons, predictable interactions
3. **Feedback**: Visual feedback for all actions, loading states, success/error messages
4. **Accessibility**: High contrast, keyboard navigation, screen reader support
5. **Responsiveness**: Adapts to all screen sizes, touch-friendly on mobile
6. **Performance**: Smooth animations, optimized rendering, lazy loading

## 🚀 User Flow

```
Login → Hospital Dashboard → View Credentials → Copy API Key
                           ↓
                    View Usage Stats → Monitor Rate Limit
                           ↓
                    Check Recent Requests → Review Access Logs
                           ↓
                    Quick Access → API Docs / Profile
```

This dashboard provides a comprehensive, user-friendly interface for hospitals to manage their API access and monitor usage effectively.
