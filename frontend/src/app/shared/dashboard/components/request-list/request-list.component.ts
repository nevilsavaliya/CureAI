import { Component, Input, Output, EventEmitter, HostListener } from '@angular/core';
import { RequestListConfig, RequestItem } from '../../models/dashboard.models';

/**
 * Request List Component
 * 
 * Displays a list of appointment requests with action buttons.
 * Supports loading states, empty states, action handlers, and keyboard navigation.
 * 
 * @example
 * <app-request-list
 *   [config]="requestConfig"
 *   (actionClick)="onActionClick($event)">
 * </app-request-list>
 */
@Component({
  selector: 'app-request-list',
  templateUrl: './request-list.component.html',
  styleUrls: ['./request-list.component.css']
})
export class RequestListComponent {
  @Input() config: RequestListConfig = {
    title: 'Appointment Requests',
    requests: [],
    showSeeAll: false,
    emptyMessage: 'No pending requests',
    loading: false
  };
  @Input() error: string | null = null;

  @Output() actionClick = new EventEmitter<{ requestId: string; actionType: 'approve' | 'reject' | 'info' }>();
  @Output() seeAllClick = new EventEmitter<void>();
  @Output() retry = new EventEmitter<void>();

  private focusedIndex: number = -1;

  /**
   * Handle action button click from request item
   */
  onActionClick(event: { requestId: string; actionType: 'approve' | 'reject' | 'info' }): void {
    this.actionClick.emit(event);
  }

  /**
   * Handle see all link click
   */
  onSeeAllClick(): void {
    this.seeAllClick.emit();
  }

  /**
   * Track by function for ngFor optimization
   */
  trackByRequestId(index: number, item: RequestItem): string {
    return item.id;
  }

  /**
   * Handle keyboard navigation within the list
   */
  @HostListener('keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    if (!this.config.requests || this.config.requests.length === 0) {
      return;
    }

    const target = event.target as HTMLElement;
    
    // Only handle navigation if we're not in an action button
    if (target.classList.contains('action-button')) {
      return;
    }

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        this.focusedIndex = Math.min(this.focusedIndex + 1, this.config.requests.length - 1);
        this.focusRequest(this.focusedIndex);
        break;
      case 'ArrowUp':
        event.preventDefault();
        this.focusedIndex = Math.max(this.focusedIndex - 1, 0);
        this.focusRequest(this.focusedIndex);
        break;
      case 'Home':
        event.preventDefault();
        this.focusedIndex = 0;
        this.focusRequest(this.focusedIndex);
        break;
      case 'End':
        event.preventDefault();
        this.focusedIndex = this.config.requests.length - 1;
        this.focusRequest(this.focusedIndex);
        break;
    }
  }

  /**
   * Focus a request item by index
   */
  private focusRequest(index: number): void {
    const requestItems = document.querySelectorAll('.request-item');
    if (requestItems[index]) {
      const firstButton = requestItems[index].querySelector('.action-button') as HTMLElement;
      if (firstButton) {
        firstButton.focus();
      }
    }
  }

  /**
   * Handle retry action
   */
  onRetry(): void {
    this.retry.emit();
  }
}
