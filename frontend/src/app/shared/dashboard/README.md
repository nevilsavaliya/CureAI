# Dashboard Shared Module

## Overview

The Dashboard Shared Module provides a comprehensive set of reusable, role-agnostic dashboard components for building consistent user interfaces across doctor and patient dashboards. All components are designed with accessibility, responsiveness, and performance in mind.

## Location

`frontend/src/app/shared/dashboard/`

## Module Structure

```
dashboard/
├── components/              # Reusable dashboard components
│   ├── appointment-list/
│   ├── appointment-list-item/
│   ├── calendar-widget/
│   ├── dashboard-layout/
│   ├── request-list/
│   ├── request-list-item/
│   ├── review-metrics/
│   ├── summary-chart/
│   └── user-details-panel/
├── models/                  # TypeScript interfaces
│   └── dashboard.models.ts
├── services/                # Data and configuration services
│   ├── dashboard-config.service.ts
│   └── dashboard-data.service.ts
├── utils/                   # Helper functions
│   └── dashboard.utils.ts
├── styles/                  # Shared styles
│   ├── skeleton-loader.css
│   └── error-empty-states.css
└── dashboard-shared.module.ts
```

## Components

### Layout Components

#### Dashboard Layout
Responsive CSS Grid-based layout system for arranging dashboard components.

**Key Features:**
- Configurable columns (1-4)
- Responsive breakpoints
- Column spanning support
- Flexible gap sizes

**Documentation:** [components/dashboard-layout/README.md](./components/dashboard-layout/README.md)

---

### Data Display Components

#### Stat Card
Displays key metrics with icons, values, and optional trend indicators.

**Key Features:**
- Multiple color themes
- Trend indicators
- Click handlers
- Loading states

**Documentation:** [../../components/stat-card/README.md](../../components/stat-card/README.md)

#### Summary Chart
SVG-based donut chart for data visualization.

**Key Features:**
- Interactive hover tooltips
- Legend with highlighting
- Entrance animations
- No external dependencies

**Documentation:** [components/summary-chart/README.md](./components/summary-chart/README.md)

#### Review Metrics
Horizontal progress bars for rating distributions.

**Key Features:**
- Animated progress bars
- Percentage calculations
- Color-coded categories
- Responsive layout

**Documentation:** [components/review-metrics/README.md](./components/review-metrics/README.md)

---

### List Components

#### Appointment List
Displays appointments with patient/doctor information.

**Key Features:**
- Loading and empty states
- Keyboard navigation
- Status badges
- Click handlers

**Documentation:** [components/appointment-list/README.md](./components/appointment-list/README.md)

#### Appointment List Item
Individual appointment item with avatar and details.

**Key Features:**
- Avatar with initials fallback
- Status indicators
- Keyboard accessible
- Click interactions

**Documentation:** [components/appointment-list-item/README.md](./components/appointment-list-item/README.md)

#### Request List
Displays appointment requests with action buttons.

**Key Features:**
- Confirmation dialogs
- Action buttons (approve/reject/info)
- Loading states per item
- Keyboard navigation

**Documentation:** [components/request-list/README.md](./components/request-list/README.md)

#### Request List Item
Individual request item with action buttons.

**Key Features:**
- Confirmation dialogs
- Per-action loading states
- Avatar with fallback
- Keyboard accessible

**Documentation:** [components/request-list-item/README.md](./components/request-list-item/README.md)

---

### Detail Components

#### User Details Panel
Displays detailed user information with demographics and actions.

**Key Features:**
- Avatar display
- Demographic grid
- Color-coded tags
- Action buttons
- Expandable sections

**Documentation:** [components/user-details-panel/README.md](./components/user-details-panel/README.md)

#### Calendar Widget
Monthly calendar with date highlighting and event markers.

**Key Features:**
- Month navigation
- Date highlighting
- Event markers
- Keyboard navigation
- Date selection

**Documentation:** [components/calendar-widget/README.md](./components/calendar-widget/README.md)

---

## Services

### Dashboard Config Service
Provides role-specific configurations for dashboard components.

**Methods:**
- `getStatsConfig(role)` - Get stat card configurations
- `getAppointmentListConfig(role, data)` - Transform appointment data
- `getUserDetailsPanelConfig(role, user)` - Configure user details
- `getChartConfig(role, data)` - Get chart configuration

### Dashboard Data Service
Abstracts data fetching for different user roles.

**Methods:**
- `getDoctorDashboardData()` - Fetch doctor dashboard data
- `getPatientDashboardData()` - Fetch patient dashboard data
- `transformCasesToAppointments(cases, role)` - Transform case data

---

## Models

All TypeScript interfaces are defined in `models/dashboard.models.ts`:

### Core Interfaces
- `StatCardConfig` - Stat card configuration
- `AppointmentListConfig` - Appointment list configuration
- `AppointmentItem` - Individual appointment data
- `ChartConfig` - Chart configuration
- `ChartDataItem` - Chart data point
- `UserDetailsPanelConfig` - User details configuration
- `UserDetails` - User information
- `DemographicInfo` - Demographic field
- `Tag` - Color-coded tag
- `ActionButton` - Action button configuration
- `DetailSection` - Expandable section
- `RequestListConfig` - Request list configuration
- `RequestItem` - Individual request data
- `RequestAction` - Request action button
- `CalendarConfig` - Calendar configuration
- `CalendarEvent` - Calendar event
- `ReviewMetricsConfig` - Review metrics configuration
- `ReviewMetric` - Individual metric
- `DashboardLayoutConfig` - Layout configuration

### Composite Interfaces
- `DashboardData` - Base dashboard data
- `DoctorDashboardData` - Doctor-specific dashboard data
- `PatientDashboardData` - Patient-specific dashboard data

---

## Usage

### Importing the Module

```typescript
// In your feature module
import { DashboardSharedModule } from './shared/dashboard/dashboard-shared.module';

@NgModule({
  imports: [
    CommonModule,
    DashboardSharedModule  // Import the shared module
  ],
  declarations: [
    DoctorDashboardComponent,
    PatientDashboardComponent
  ]
})
export class DashboardModule { }
```

### Using Components

```typescript
// In component.ts
import { DashboardDataService } from './shared/dashboard/services/dashboard-data.service';
import { DoctorDashboardData } from './shared/dashboard/models/dashboard.models';

export class DoctorDashboardComponent implements OnInit {
  dashboardData: DoctorDashboardData;
  loading = true;

  constructor(private dashboardDataService: DashboardDataService) {}

  ngOnInit() {
    this.dashboardDataService.getDoctorDashboardData().subscribe({
      next: (data) => {
        this.dashboardData = data;
        this.loading = false;
      }
    });
  }
}
```

```html
<!-- In template -->
<app-dashboard-layout [columns]="3" [gap]="'medium'">
  <!-- Stats -->
  <div class="span-3">
    <div class="stats-grid">
      <app-stat-card
        *ngFor="let stat of dashboardData.stats"
        [config]="stat">
      </app-stat-card>
    </div>
  </div>

  <!-- Main Content -->
  <div class="span-2">
    <app-summary-chart
      [config]="dashboardData.patientSummary"
      [loading]="loading">
    </app-summary-chart>

    <app-appointment-list
      [config]="dashboardData.todayAppointments"
      [loading]="loading"
      (appointmentClick)="onAppointmentClick($event)">
    </app-appointment-list>
  </div>

  <!-- Sidebar -->
  <div>
    <app-user-details-panel
      [config]="dashboardData.nextPatient"
      [loading]="loading">
    </app-user-details-panel>

    <app-calendar-widget
      [config]="dashboardData.calendar"
      [loading]="loading">
    </app-calendar-widget>
  </div>
</app-dashboard-layout>
```

---

## Design Principles

### 1. Role-Agnostic Components
Components don't know about user roles. They receive configured data and display it consistently.

### 2. Composition Over Inheritance
Build complex UIs by composing simple, focused components.

### 3. Configuration-Driven
Use services to provide role-specific configurations rather than hardcoding logic in components.

### 4. Accessibility First
All components are built with WCAG 2.1 AA compliance in mind.

### 5. Responsive by Default
Components adapt to different screen sizes automatically.

### 6. Performance Optimized
Efficient rendering, minimal re-renders, and optimized bundle size.

---

## Accessibility Features

### ARIA Support
- Proper ARIA labels on all interactive elements
- Role attributes for semantic sections
- Live regions for dynamic content
- Descriptive labels for screen readers

### Keyboard Navigation
- All interactive elements accessible via keyboard
- Logical tab order
- Arrow key navigation where appropriate
- Visible focus indicators

### Screen Reader Support
- Meaningful content announcements
- State changes communicated
- Loading and error states announced
- Proper heading hierarchy

### Visual Accessibility
- High contrast ratios (WCAG AA)
- Color not sole indicator
- Scalable text (up to 200%)
- Touch-friendly targets (44x44px minimum)

---

## Responsive Design

### Breakpoints

```css
--breakpoint-sm: 640px;   /* Small tablets */
--breakpoint-md: 768px;   /* Tablets */
--breakpoint-lg: 1024px;  /* Desktops */
--breakpoint-xl: 1280px;  /* Large desktops */
```

### Mobile (< 640px)
- Single column layout
- Stacked components
- Touch-friendly interactions
- Optimized font sizes

### Tablet (640px - 1024px)
- Two column layout
- Balanced content distribution
- Hybrid touch/mouse interactions

### Desktop (> 1024px)
- Multi-column layouts (3-4 columns)
- Optimal information density
- Mouse-optimized interactions
- Larger visualizations

---

## Styling

### Design System Variables

```css
/* Colors */
--color-primary: #4F46E5;
--color-success: #10B981;
--color-warning: #F59E0B;
--color-danger: #EF4444;
--color-info: #3B82F6;
--color-secondary: #6B7280;

/* Spacing */
--spacing-2: 0.5rem;
--spacing-4: 1rem;
--spacing-6: 1.5rem;
--spacing-8: 2rem;

/* Typography */
--font-size-sm: 0.875rem;
--font-size-base: 1rem;
--font-size-lg: 1.125rem;
--font-size-xl: 1.25rem;

/* Shadows */
--shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
--shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
--shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1);

/* Border Radius */
--radius-sm: 0.375rem;
--radius-md: 0.5rem;
--radius-lg: 0.75rem;
```

### Shared Styles

#### Skeleton Loaders
Located in `styles/skeleton-loader.css`
- Shimmer animation
- Maintains layout during loading
- Consistent across all components

#### Error and Empty States
Located in `styles/error-empty-states.css`
- Friendly error messages
- Empty state illustrations
- Retry functionality

---

## Performance Considerations

### Bundle Size
- No heavy external dependencies
- Tree-shakeable imports
- Lazy loading support
- Optimized SVG usage

### Rendering Performance
- OnPush change detection where applicable
- TrackBy functions for lists
- Efficient DOM updates
- Minimal re-renders

### Data Loading
- Loading states prevent layout shift
- Skeleton loaders maintain structure
- Error boundaries prevent crashes
- Retry mechanisms for failed requests

---

## Testing

### Unit Tests
Each component has comprehensive unit tests covering:
- Rendering with different inputs
- User interactions
- Edge cases
- Accessibility features

### Integration Tests
Test component composition and data flow:
- Multiple components working together
- Service integration
- Role-based configurations

### E2E Tests
Test complete user flows:
- Doctor dashboard workflows
- Patient dashboard workflows
- Responsive behavior

---

## Browser Support

### Supported Browsers
- Chrome/Edge (latest 2 versions)
- Firefox (latest 2 versions)
- Safari (latest 2 versions)
- Mobile Safari (iOS 12+)
- Chrome Mobile (Android 8+)

### Required Features
- CSS Grid
- CSS Custom Properties
- ES6+ JavaScript
- SVG support

---

## Migration Guide

### From Old Dashboard Components

1. **Import the shared module**
   ```typescript
   import { DashboardSharedModule } from './shared/dashboard/dashboard-shared.module';
   ```

2. **Replace old components with new ones**
   ```html
   <!-- Old -->
   <div class="stat-card">...</div>
   
   <!-- New -->
   <app-stat-card [config]="statConfig"></app-stat-card>
   ```

3. **Use configuration services**
   ```typescript
   // Old - hardcoded logic
   this.stats = this.calculateStats();
   
   // New - configuration service
   this.stats = this.dashboardConfigService.getStatsConfig('doctor');
   ```

4. **Update data fetching**
   ```typescript
   // Old - multiple service calls
   this.caseService.getCases().subscribe(...);
   this.doctorService.getDoctors().subscribe(...);
   
   // New - unified data service
   this.dashboardDataService.getDoctorDashboardData().subscribe(...);
   ```

---

## Troubleshooting

### Common Issues

#### Components not displaying
- Verify module is imported
- Check that config objects are properly formatted
- Ensure data is not null/undefined

#### Styling issues
- Check that global styles are loaded
- Verify CSS custom properties are supported
- Check for conflicting styles

#### Performance issues
- Use TrackBy functions in lists
- Enable OnPush change detection
- Lazy load dashboard routes

#### Accessibility issues
- Test with keyboard navigation
- Use screen reader for testing
- Check color contrast ratios

---

## Contributing

### Adding New Components

1. Create component in `components/` directory
2. Add interfaces to `models/dashboard.models.ts`
3. Export component in `dashboard-shared.module.ts`
4. Write comprehensive tests
5. Create README documentation
6. Update this main README

### Code Style

- Follow Angular style guide
- Use TypeScript strict mode
- Write descriptive comments
- Include JSDoc for public APIs
- Use meaningful variable names

---

## Resources

### Documentation
- [Angular Documentation](https://angular.io/docs)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [CSS Grid Guide](https://css-tricks.com/snippets/css/complete-guide-grid/)

### Tools
- [Lighthouse](https://developers.google.com/web/tools/lighthouse) - Performance and accessibility auditing
- [axe DevTools](https://www.deque.com/axe/devtools/) - Accessibility testing
- [Chrome DevTools](https://developers.google.com/web/tools/chrome-devtools) - Debugging and profiling

---

## License

This module is part of the healthcare application and follows the project's license terms.

---

## Support

For issues, questions, or contributions, please refer to the project's main documentation or contact the development team.
