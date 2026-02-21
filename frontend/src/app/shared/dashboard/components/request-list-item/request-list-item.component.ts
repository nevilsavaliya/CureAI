import { Component, Input, Output, EventEmitter, HostListener } from '@angular/core';
import { RequestItem, RequestAction } from '../../models/dashboard.models';

/**
 * Request List Item Component
 * 
 * Displays a single request item with avatar, name, subtitle, and action buttons.
 * Supports confirmation dialogs, loading states, and keyboard accessibility.
 * 
 * @example
 * <app-request-list-item
 *   [request]="requestData"
 *   (actionClick)="onActionClick($event)">
 * </app-request-list-item>
 */
@Component({
  selector: 'app-request-list-item',
  templateUrl: './request-list-item.component.html',
  styleUrls: ['./request-list-item.component.css']
})
export class RequestListItemComponent {
  @Input() request!: RequestItem;
  @Output() actionClick = new EventEmitter<{ requestId: string; actionType: 'approve' | 'reject' | 'info' }>();

  imageError = false;
  loadingAction: 'approve' | 'reject' | 'info' | null = null;
  showConfirmDialog = false;
  pendingAction: RequestAction | null = null;

  /**
   * Handle keyboard events for dialog
   */
  @HostListener('document:keydown.escape', ['$event'])
  onEscapeKey(event: KeyboardEvent): void {
    if (this.showConfirmDialog) {
      event.preventDefault();
      this.cancelAction();
    }
  }

  /**
   * Handle action button click
   */
  handleActionClick(action: RequestAction, event: Event): void {
    event.stopPropagation();
    
    // Show confirmation dialog for approve/reject actions
    if (action.type === 'approve' || action.type === 'reject') {
      this.pendingAction = action;
      this.showConfirmDialog = true;
      
      // Focus the confirm button after dialog opens
      setTimeout(() => {
        const confirmButton = document.querySelector('.confirm-confirm') as HTMLElement;
        if (confirmButton) {
          confirmButton.focus();
        }
      }, 100);
    } else {
      // Execute info action immediately
      this.executeAction(action);
    }
  }

  /**
   * Confirm and execute the pending action
   */
  confirmAction(): void {
    if (this.pendingAction) {
      this.executeAction(this.pendingAction);
    }
    this.closeConfirmDialog();
  }

  /**
   * Cancel the pending action
   */
  cancelAction(): void {
    this.closeConfirmDialog();
  }

  /**
   * Close confirmation dialog
   */
  closeConfirmDialog(): void {
    this.showConfirmDialog = false;
    this.pendingAction = null;
  }

  /**
   * Execute the action
   */
  private executeAction(action: RequestAction): void {
    this.loadingAction = action.type;
    
    // Call the action's onClick handler
    action.onClick(this.request.id);
    
    // Emit the action event
    this.actionClick.emit({
      requestId: this.request.id,
      actionType: action.type
    });

    // Reset loading state after a short delay
    setTimeout(() => {
      this.loadingAction = null;
    }, 500);
  }

  /**
   * Handle image load error
   */
  onImageError(event: Event): void {
    this.imageError = true;
  }

  /**
   * Get initials from name
   */
  getInitials(name: string): string {
    if (!name) return '?';
    
    const parts = name.trim().split(' ');
    if (parts.length === 1) {
      return parts[0].charAt(0).toUpperCase();
    }
    
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
  }

  /**
   * Get action button label
   */
  getActionLabel(type: 'approve' | 'reject' | 'info'): string {
    const labels: Record<string, string> = {
      approve: 'Approve request',
      reject: 'Reject request',
      info: 'View details'
    };
    return labels[type] || type;
  }

  /**
   * Get confirmation dialog message
   */
  getConfirmMessage(): string {
    if (!this.pendingAction) return '';
    
    const messages: Record<string, string> = {
      approve: `Are you sure you want to approve the request from ${this.request.name}?`,
      reject: `Are you sure you want to reject the request from ${this.request.name}?`,
      info: ''
    };
    return messages[this.pendingAction.type] || '';
  }

  /**
   * Get ARIA label for the item
   */
  getAriaLabel(): string {
    return `Request from ${this.request.name}, ${this.request.subtitle}`;
  }
}
