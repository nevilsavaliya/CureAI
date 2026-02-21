# Request List Component

## Overview

The Request List component displays a list of appointment requests with action buttons for approval, rejection, or viewing details. It supports loading states, empty states, error handling, confirmation dialogs, and keyboard navigation. This component is typically used in doctor dashboards to manage incoming appointment requests.

## Location

`frontend/src/app/shared/dashboard/components/request-list/`

## Inputs

| Input | Type | Default | Description |
|-------|------|---------|-------------|
| `config` | `RequestListConfig` | See below | Configuration object containing all list settings |
| `error` | `string \| null` | `null` | Error message to display if data loading fails |

### RequestListConfig Interface

```typescript
interface RequestListConfig {
  title: string;                    // List title
  requests: RequestItem[];          // Array of request items
  showSeeAll?: boolean;             // Show "See All" link
  emptyMessage?: string;            // Message when no requests
  loading?: boolean;                // Show loading skeleton
}

interface RequestItem {
  id: string;                       // Unique identifier
  avatar?: string;                  // Avatar image URL
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
| `seeAllClick` | `EventEmitter<void>` | Emitted when "See All" link is clicked |
| `retry` | `EventEmitter<void>` | Emitted when retry button is clicked in error state |

## Usage Examples

### Basic Usage

```typescript
// In component.ts
requestConfig: RequestListConfig = {
  title: 'Appointment Requests',
  requests: [
    {
      id: '1',
      avatar: '/assets/avatars/patient1.jpg',
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
          onClick: (id) => this.viewRequestDetails(id)
        }
      ]
    }
  ],
  showSeeAll: true,
  emptyMessage: 'No pending requests'
};

// In template
<app-request-list
  [config]="requestConfig"
  (actionClick)="onActionClick($event)"
  (seeAllClick)="navigateToAllRequests()">
</app-request-list>

// Handle action clicks
onActionClick(event: { requestId: string; actionType: string }) {
  console.log(`Action ${event.actionType} on request ${event.requestId}`);
}
```

### With Loading State

```typescript
<app-request-list
  [config]="{
    title: 'Pending Requests',
    requests: [],
    loading: true
  }">
</app-request-list>
```

### With Error Handling

```typescript
<app-request-list
  [config]="requestConfig"
  [error]="errorMessage"
  (retry)="loadRequests()">
</app-request-list>
```

### Minimal Actions (Info Only)

```typescript
requestConfig: RequestListConfig = {
  title: 'Recent Requests',
  requests: [
    {
      id: '1',
      name: 'John Doe',
      subtitle: 'General checkup request',
      actions: [
        {
          icon: 'info',
          type: 'info',
          onClick: (id) => this.viewDetails(id)
        }
      ]
    }
  ]
};
```

### Complete Example with All Features

```typescript
// Component class
export class DoctorDashboardComponent {
  requestConfig: RequestListConfig;
  errorMessage: string | null = null;
  
  ngOnInit() {
    this.loadRequests();
  }
  
  loadRequests() {
    this.requestConfig = {
      title: 'Appointment Requests',
      requests: [],
      loading: true
    };
    
    this.requestService.getPendingRequests().subscribe({
      next: (requests) => {
        this.requestConfig = {
          title: 'Appointment Requests',
          requests: requests.map(req => ({
            id: req.id,
            avatar: req.patient.avatar,
            name: req.patient.name,
            subtitle: req.reason,
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
          })),
          showSeeAll: true,
          loading: false
        };
        this.errorMessage = null;
      },
      error: (error) => {
        this.errorMessage = 'Failed to load requests';
        this.requestConfig.loading = false;
      }
    });
  }
  
  approveRequest(id: string) {
    this.requestService.approve(id).subscribe({
      next: () => {
        this.showNotification('Request approved');
        this.loadRequests();
      }
    });
  }
  
  rejectRequest(id: string) {
    this.requestService.reject(id).subscribe({
      next: () => {
        this.showNotification('Request rejected');
        this.loadRequests();
      }
    });
  }
  
  viewDetails(id: string) {
    this.router.navigate(['/requests', id]);
  }
  
  navigateToAllRequests() {
    this.router.navigate(['/requests']);
  }
}
```

## Features

### Confirmation Dialogs
- Approve and reject actions show confirmation dialogs
- Info actions execute immediately
- Dialogs are keyboard accessible
- Can be cancelled with Escape key

### Loading States
- Per-item loading indicators during action execution
- Prevents multiple clicks during processing
- Visual feedback for user actions

### Action Buttons
- Three action types: approve, reject, info
- Icon-based buttons
- Hover and focus states
- Accessible labels

### Empty State
- Displays when no requests
- Custom empty message
- Friendly visual presentation

## Accessibility Features

### ARIA Labels and Roles
- List container has `role="list"` and descriptive `aria-label`
- Each request item has `role="listitem"`
- Action buttons have descriptive labels
- Confirmation dialogs use `role="dialog"`
- Loading state uses `aria-busy="true"`

### Keyboard Navigation
- **Arrow Down**: Move focus to next request
- **Arrow Up**: Move focus to previous request
- **Home**: Move focus to first request
- **End**: Move focus to last request
- **Tab**: Navigate between action buttons within a request
- **Enter/Space**: Activate focused button
- **Escape**: Close confirmation dialog

### Screen Reader Support
- Request items announce: "Request from [name], [subtitle]"
- Action buttons announce their purpose
- Confirmation dialogs are properly announced
- Loading and error states are communicated

### Focus Management
- Visible focus indicators
- Logical tab order
- Focus moves to confirm button when dialog opens
- Focus returns to trigger button after dialog closes

## Confirmation Dialog

### Dialog Behavior
- Shows for `approve` and `reject` actions
- Does not show for `info` actions
- Displays custom message based on action type
- Has "Confirm" and "Cancel" buttons
- Can be closed with Escape key

### Dialog Messages
- **Approve**: "Are you sure you want to approve the request from [name]?"
- **Reject**: "Are you sure you want to reject the request from [name]?"

## States

### Loading State
- Displays skeleton loaders for 3 request items
- Maintains layout structure
- Shows shimmer animation

### Empty State
- Displays custom empty message
- Shows friendly icon
- Provides context

### Error State
- Displays error message
- Shows retry button
- Maintains accessibility

### Normal State
- Displays request items
- Shows action buttons
- Enables all interactions

## Styling

### CSS Classes
- `.request-list` - Main container
- `.request-list-header` - Title and "See All" link
- `.request-list-content` - Scrollable content area
- `.request-item` - Individual request (via child component)
- `.action-button` - Action buttons
- `.action-button-approve` - Approve button
- `.action-button-reject` - Reject button
- `.action-button-info` - Info button
- `.confirm-dialog` - Confirmation dialog
- `.confirm-overlay` - Dialog overlay

### Customization Example

```css
/* Customize action buttons */
.request-list .action-button-approve {
  background-color: #10B981;
  color: white;
}

.request-list .action-button-reject {
  background-color: #EF4444;
  color: white;
}

/* Customize dialog */
.request-list .confirm-dialog {
  border-radius: 0.75rem;
  padding: 1.5rem;
}
```

## Child Components

This component uses:
- `app-request-list-item` - Renders individual request items

## Troubleshooting

### Issue: Requests not displaying
**Solution**: Verify that the `requests` array is populated and each item has required fields:

```typescript
// Check your data
console.log('Requests:', this.requestConfig.requests);

// Required fields
requests: [{
  id: '1',        // Required
  name: 'John',   // Required
  subtitle: 'Reason',  // Required
  actions: [...]  // Required, must have at least one action
}]
```

### Issue: Action buttons not working
**Solution**: Ensure each action has a valid `onClick` handler:

```typescript
// Correct
actions: [
  {
    icon: 'check',
    type: 'approve',
    onClick: (id) => this.handleApprove(id)  // Must be a function
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
**Solution**: Confirmation dialogs only show for `approve` and `reject` actions. `info` actions execute immediately:

```typescript
// Shows dialog
type: 'approve'  // ✓
type: 'reject'   // ✓

// No dialog
type: 'info'     // Executes immediately
```

### Issue: Multiple actions executing
**Solution**: This can happen if the loading state isn't properly managed. The component has built-in protection, but ensure your action handlers don't execute multiple times:

```typescript
approveRequest(id: string) {
  // Add guard
  if (this.isProcessing) return;
  this.isProcessing = true;
  
  this.service.approve(id).subscribe({
    next: () => {
      this.isProcessing = false;
      this.loadRequests();
    },
    error: () => {
      this.isProcessing = false;
    }
  });
}
```

### Issue: Keyboard navigation not working
**Solution**: Ensure the list container has focus. Click on the list or tab to it first. Navigation only works when the list is focused.

### Issue: "See All" link not showing
**Solution**: Set `showSeeAll: true` in the config and subscribe to the event:

```typescript
config = {
  // ...
  showSeeAll: true
};

<app-request-list (seeAllClick)="navigateToAll()">
```

### Issue: Dialog won't close with Escape
**Solution**: Ensure the dialog component is properly handling keyboard events. This should work by default, but check if any parent components are preventing event propagation.

## Performance Considerations

### TrackBy Function
The component uses `trackByRequestId` for efficient list rendering. Angular will only re-render items that have changed.

### Action Debouncing
Consider debouncing action handlers if they trigger expensive operations:

```typescript
import { debounceTime, Subject } from 'rxjs';

private actionSubject = new Subject<string>();

ngOnInit() {
  this.actionSubject.pipe(
    debounceTime(300)
  ).subscribe(id => this.executeAction(id));
}

approveRequest(id: string) {
  this.actionSubject.next(id);
}
```

## Related Components

- `request-list-item` - Child component for individual items
- `appointment-list` - Similar list structure
- `user-details-panel` - Often displayed alongside

## Requirements Satisfied

- 5.1: Display appointment request list
- 5.2: Provide action buttons for each request
- 5.3: Show request status and context
- 9.2: Responsive layout
- 9.4: Keyboard accessibility
- 10.1: Angular component implementation
