# Empty State Component

A reusable component for displaying empty states with illustrations, messages, and optional call-to-action buttons.

## Usage

### Basic Usage

```html
<app-empty-state
  illustration="empty-cases"
  title="No cases found"
  message="You don't have any cases yet. Start by requesting a consultation.">
</app-empty-state>
```

### With Call-to-Action Button

```html
<app-empty-state
  illustration="empty-cases"
  title="No cases found"
  message="You don't have any cases yet. Start by requesting a consultation."
  [showCta]="true"
  ctaText="Start Consultation"
  ctaIcon="plus">
</app-empty-state>
```

## Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `illustration` | string | `'empty-cases'` | Name of the illustration file (without path or extension) |
| `title` | string | `'No items found'` | Main heading text |
| `message` | string | `'There are no items to display at the moment.'` | Descriptive message |
| `ctaText` | string | `undefined` | Text for the call-to-action button |
| `ctaIcon` | string | `undefined` | Icon for the CTA button (`'plus'`, `'refresh'`, `'search'`, or `'arrow'`) |
| `showCta` | boolean | `false` | Whether to show the CTA button |

## Available Illustrations

The following illustrations are available in `assets/illustrations/`:
- `empty-cases` - For empty case lists
- `404-error` - For 404 pages
- `doctor-consultation` - For consultation-related empty states
- `health-data` - For health data empty states
- `medical-team` - For team/staff empty states

## Examples

### Patient Cases (No Cases)

```html
<app-empty-state
  illustration="empty-cases"
  title="No cases yet"
  message="You haven't requested any consultations. Start by describing your symptoms to our AI assistant."
  [showCta]="true"
  ctaText="Start Diagnosis"
  ctaIcon="plus">
</app-empty-state>
```

### Doctor Cases (No Pending Cases)

```html
<app-empty-state
  illustration="empty-cases"
  title="No pending cases"
  message="You're all caught up! There are no pending consultation requests at the moment."
  [showCta]="true"
  ctaText="Refresh"
  ctaIcon="refresh">
</app-empty-state>
```

### Search Results (No Results)

```html
<app-empty-state
  illustration="empty-cases"
  title="No results found"
  message="Try adjusting your search criteria or filters to find what you're looking for."
  [showCta]="true"
  ctaText="Clear Filters"
  ctaIcon="refresh">
</app-empty-state>
```

## Styling

The component uses CSS custom properties (design tokens) for consistent styling:
- Colors: `--color-gray-*`, `--color-primary-*`
- Spacing: `--spacing-*`
- Typography: `--font-size-*`, `--font-weight-*`
- Shadows: `--shadow-*`
- Transitions: `--transition-*`

## Accessibility

- Semantic HTML structure
- Alt text for illustrations
- Keyboard accessible buttons
- Respects `prefers-reduced-motion` for animations

## Animation

The component includes subtle fade-in-up animations for the illustration and content. These animations are automatically disabled for users who prefer reduced motion.
