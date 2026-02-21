# Request List Item Component

## Overview

The Request List Item component displays a single appointment request with avatar, name, subtitle, and action buttons. It's a child component used by the Request List component and includes built-in confirmation dialogs for approve/reject actions, loading states, and keyboard accessibility.

## Location

`frontend/src/app/shared/dashboard/components/request-list-item/`

## Inputs

| Input | Type | Required | Description |
|-------|------|----------|-------------|
| `request` | `RequestItem` | Yes | The request data to display |

### RequestItem Interface

```typescript
interface RequestItem {
  id: string;                       // Unique identifier
  avatar?: string;                  // Avatar image URL (optional)
  name: string;                     // Patient name
  subtitle: string;                 // Request reason/details
  actions: RequestAction[];         // Available actions
}

interface RequestAction {
  icon: string;                     // Icon identifier
  type: 'approve' | 'reject' | 'info';  // Action type
  onClick: (id: string) => void;    // Click handler with request ID
}
```

## Outputs

| Output | Type | Description |
|--------|------|-------------|
| `actionClick` | `EventEmitter<{ requestId: string; actionType: 'approve' \| 'reject' \| 'info' }>` | Emitted when an action button is clicked |

## Usage Examples

### Basic Usage

```typescript
// In parent component template
<app-request-list-item
  [request]="requestData"
  (actionClick)="onActionClick($event)">
</app-request-list-item>

// In parent component.ts
requestData: RequestItem = {
  id: '123',
  avatar: '/assets/avatars/patient.jpg',
  name: 'Emily Brown',
  subtitle: 'Requesting consultation for back pain',
  actions: [
    {
      icon: 'check',
      type: 'approve',
      onClick: (id) => this.approveRequest(id)
    },
    {
      icon: 'close',
      type: 'reject',
      onClick: (id) => this.rejectRequest(id)
    },
    {
      icon: 'info',
      type: 'info',
      onClick: (id) => this.viewDetails(id)
    }
  ]
};

onActionClick(event: { requestId: string; actionType: string }) {
  console.log(`Action ${event.actionType} on request ${event.requestId}`);
}
```

### With All Three Actions

```typescript
request = {
  id: '1',
  name: 'John Doe',
  subtitle: 'General checkup request',
  actions: [
    {
      icon: 'check',
      type: 'approve',
      onClick: (id) => this.approve(id)
    },
    {
      icon: 'close',
      type: 'reject',
      onClick: (id) => this.reject(id)
    },
    {
      icon: 'info',
      type: 'info',
      onClick: (id) => this.viewInfo(id)
    }
  ]
};
```

### With Limited Actions (Info Only)

```typescript
request = {
  id: '2',
  name: 'Jane Smith',
  subtitle: 'Follow-up appointment request',
  actions: [
    {
      icon: 'info',
      type: 'info',
      onClick: (id) => this.viewDetails(id)
    }
  ]
};
```

### Without Avatar (Initials Fallback)

```typescript
request = {
  id: '3',
  name: 'Robert Anderson',  // Will show "RA" as initials
  subtitle: 'Urgent consultation needed',
  actions: [
    {
      icon: 'check',
      type: 'approve',
      onClick: (id) => this.approve(id)
    },
    {
      icon: 'close',
      type: 'reject',
      onClick: (id) => this.reject(id)
    }
  ]
  // No avatar - will use initials
};
```

## Features

### Confirmation Dialogs
- Automatically shown for `approve` and `reject` actions
- Not shown for `info` actions (execute immediately)
- Modal overlay prevents background interaction
- Keyboard accessible (Escape to cancel)
- Focus management (auto-focus confirm button)

### Loading States
- Per-action loading indicators
- Prevents multiple clicks during processing
- Visual feedback (spinner or disabled state)
- Automatically resets after 500ms

### Action Buttons
- Icon-based buttons
- Color-coded by action type
- Hover and focus states
- Accessible labels

### Avatar Handling
- Displays avatar image if provided
- Falls back to initials if no avatar
- Handles image load errors gracefully
- Circular avatar design

## Accessibility Features

### ARIA Labels
- Item has descriptive `aria-label`: "Request from [name], [subtitle]"
- Action buttons have contextual labels:
  - Approve: "Approve request"
  - Reject: "Reject request"
  - Info: "View details"
- Dialog has `role="dialog"` and `aria-labelledby`

### Keyboard Navigation
- **Tab**: Navigate between action buttons
- **Enter/Space**: Activate focused button
- **Escape**: Close confirmation dialog
- Visible focus indicators on all interactive elements

### Screen Reader Support
- All content is properly announced
- Action button purposes are clear
- Dialog content is announced when opened
- Loading states are communicated

### Focus Management
- Focus moves to confirm button when dialog opens
- Focus returns to trigger button after dialog closes
- Logical tab order within item

## Confirmation Dialog

### Dialog Structure
```
┌─────────────────────────────────────┐
│  Are you sure you want to approve   │
│  the request from Emily Brown?      │
│                                     │
│  [Cancel]  [Confirm]                │
└─────────────────────────────────────┘
```

### Dialog Behavior
- Shows for `approve` and `reject` actions only
- Blocks background interaction with overlay
- Can be closed with Cancel button or Escape key
- Confirm button executes the action
- Auto-focuses Confirm button on open

### Dialog Messages
- **Approve**: "Are you sure you want to approve the request from [name]?"
- **Reject**: "Are you sure you want to reject the request from [name]?"

## Action Types

### Approve Action
- **Icon**: Checkmark
- **Color**: Green
- **Behavior**: Shows confirmation dialog
- **Use Case**: Accept appointment request

### Reject Action
- **Icon**: Close/X
- **Color**: Red
- **Behavior**: Shows confirmation dialog
- **Use Case**: Decline appointment request

### Info Action
- **Icon**: Information
- **Color**: Blue
- **Behavior**: Executes immediately (no dialog)
- **Use Case**: View request details

## States

### Normal State
- All buttons enabled
- No loading indicators
- Hover effects active

### Loading State
- Specific action button shows loading
- Other buttons remain enabled
- Visual spinner or disabled appearance

### Dialog Open State
- Background dimmed with overlay
- Dialog centered on screen
- Focus trapped in dialog

## Styling

### CSS Classes
- `.request-item` - Main container
- `.request-avatar` - Avatar container
- `.request-avatar-image` - Avatar image
- `.request-avatar-initials` - Initials fallback
- `.request-info` - Text content area
- `.request-name` - Name text
- `.request-subtitle` - Subtitle text
- `.request-actions` - Action buttons container
- `.action-button` - Individual action button
- `.action-button-approve` - Approve button
- `.action-button-reject` - Reject button
- `.action-button-info` - Info button
- `.action-button-loading` - Loading state
- `.confirm-dialog` - Confirmation dialog
- `.confirm-overlay` - Dialog overlay
- `.confirm-content` - Dialog content
- `.confirm-actions` - Dialog buttons
- `.confirm-cancel` - Cancel button
- `.confirm-confirm` - Confirm button

### Customization Example

```css
/* Customize action buttons */
.request-item .action-button-approve {
  background-color: #10B981;
  color: white;
  padding: 0.5rem;
  border-radius: 0.375rem;
}

.request-item .action-button-reject {
  background-color: #EF4444;
  color: white;
}

.request-item .action-button-info {
  background-color: #3B82F6;
  color: white;
}

/* Customize dialog */
.confirm-dialog {
  max-width: 400px;
  padding: 1.5rem;
  border-radius: 0.75rem;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
}
```

## Avatar Handling

### With Valid Avatar URL
```typescript
avatar: 'https://example.com/avatar.jpg'
// Displays the image
```

### Without Avatar URL
```typescript
// No avatar property
name: 'John Doe'  // Shows "JD"
```

### Avatar Load Error
```typescript
avatar: 'https://invalid-url.com/missing.jpg'
// Falls back to initials automatically
```

### Initials Generation
- Single name: First letter (e.g., "John" → "J")
- Multiple names: First + last initial (e.g., "John Doe" → "JD")
- Empty name: Shows "?" as fallback

## Troubleshooting

### Issue: Action buttons not working
**Solution**: Ensure each action has a valid `onClick` handler:

```typescript
// Correct
actions: [
  {
    icon: 'check',
    type: 'approve',
    onClick: (id) => this.handleApprove(id)  // Function required
  }
]

// Incorrect
actions: [
  {
    icon: 'check',
    type: 'approve'
    // Missing onClick
  }
]
```

### Issue: Confirmation dialog not showing
**Solution**: Dialogs only show for `approve` and `reject` actions:

```typescript
// Shows dialog
type: 'approve'  // ✓
type: 'reject'   // ✓

// No dialog (executes immediately)
type: 'info'     // ✓ This is expected behavior
```

### Issue: Action executing multiple times
**Solution**: The component has built-in protection with loading states. If still occurring, check your action handler:

```typescript
// Add guard in your handler
approveRequest(id: string) {
  if (this.isProcessing[id]) return;
  this.isProcessing[id] = true;
  
  this.service.approve(id).subscribe({
    next: () => {
      delete this.isProcessing[id];
    },
    error: () => {
      delete this.isProcessing[id];
    }
  });
}
```

### Issue: Dialog won't close with Escape
**Solution**: Ensure no parent components are preventing event propagation:

```typescript
// In parent component, don't stop propagation
@HostListener('keydown.escape', ['$event'])
onEscape(event: KeyboardEvent) {
  // Don't do this:
  // event.stopPropagation();
}
```

### Issue: Avatar not displaying
**Solution**: Check:
1. Avatar URL is valid and accessible
2. Image has proper CORS headers
3. Check browser console for errors

```typescript
// Verify URL
console.log('Avatar URL:', this.request.avatar);
```

### Issue: Initials showing wrong letters
**Solution**: Verify name format:

```typescript
// Correct
name: 'John Doe'  // Shows "JD"

// Single name
name: 'John'  // Shows "J"

// Multiple middle names
name: 'John Michael Doe'  // Shows "JD" (first and last)
```

### Issue: Loading state not clearing
**Solution**: The component automatically clears loading after 500ms. If it persists, check if your action handler is throwing an error:

```typescript
// Add error handling
onClick: (id) => {
  try {
    this.handleAction(id);
  } catch (error) {
    console.error('Action failed:', error);
  }
}
```

### Issue: Focus not returning after dialog closes
**Solution**: This should happen automatically. If not, ensure the trigger button still exists in the DOM and hasn't been removed.

## Performance Considerations

### Event Handling
- Click events are properly stopped from propagating
- Efficient event delegation
- No memory leaks from event listeners

### Dialog Management
- Dialog is conditionally rendered (not hidden)
- Minimal DOM manipulation
- Efficient state updates

### Image Loading
- Images load lazily
- Automatic fallback prevents broken images
- No additional requests for initials

## Related Components

- `request-list` - Parent component that uses this component
- `appointment-list-item` - Similar structure for appointments
- `user-details-panel` - Similar avatar and name display

## Requirements Satisfied

- 5.2: Display request with action buttons
- 5.3: Show request status and context
- 9.4: Keyboard accessibility
- 10.1: Angular component implementation
