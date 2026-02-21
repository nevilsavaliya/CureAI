import { Component, Input, Output, EventEmitter, HostListener } from '@angular/core';
import { UserDetailsPanelConfig, ActionButton } from '../../models/dashboard.models';

/**
 * User Details Panel Component
 * 
 * Displays detailed information about a user (patient or doctor) including:
 * - Avatar with fallback to initials
 * - Demographic information in a grid layout
 * - Color-coded tags (e.g., medical conditions)
 * - Action buttons (call, document, chat)
 * - Expandable detail sections with keyboard navigation
 * 
 * @example
 * <app-user-details-panel
 *   [config]="userDetailsConfig"
 *   [loading]="isLoading"
 *   (actionClick)="onActionClick($event)">
 * </app-user-details-panel>
 */
@Component({
  selector: 'app-user-details-panel',
  templateUrl: './user-details-panel.component.html',
  styleUrls: ['./user-details-panel.component.css']
})
export class UserDetailsPanelComponent {
  @Input() config!: UserDetailsPanelConfig;
  @Input() loading = false;
  @Input() error: string | null = null;
  @Input() emptyMessage: string = 'No user details available';
  
  @Output() actionClick = new EventEmitter<{ action: string; button: ActionButton }>();
  @Output() retry = new EventEmitter<void>();

  imageError = false;
  expandedSections: Set<string> = new Set();

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
   * Handle action button click
   */
  handleActionClick(button: ActionButton, event?: Event): void {
    if (event && event.type === 'keydown') {
      event.preventDefault();
    }
    
    if (button.onClick) {
      button.onClick();
    }
    
    this.actionClick.emit({ action: button.label, button });
  }

  /**
   * Toggle section expansion
   */
  toggleSection(sectionTitle: string): void {
    if (this.expandedSections.has(sectionTitle)) {
      this.expandedSections.delete(sectionTitle);
    } else {
      this.expandedSections.add(sectionTitle);
    }
  }

  /**
   * Check if section is expanded
   */
  isSectionExpanded(sectionTitle: string): boolean {
    return this.expandedSections.has(sectionTitle);
  }

  /**
   * Get tag color class
   */
  getTagColorClass(color: string): string {
    return `tag-${color}`;
  }

  /**
   * Get ARIA label for action button
   */
  getActionAriaLabel(button: ActionButton): string {
    return `${button.label} ${this.config?.user?.name || 'user'}`;
  }

  /**
   * Get section content as array
   */
  getSectionContentArray(content: string | string[]): string[] {
    return Array.isArray(content) ? content : [content];
  }

  /**
   * Get unique user ID for ARIA labels
   */
  getUserId(): string {
    return this.config?.user?.name?.replace(/\s+/g, '-').toLowerCase() || 'user';
  }

  /**
   * Handle retry action
   */
  onRetry(): void {
    this.retry.emit();
  }

  /**
   * Check if panel has data
   */
  hasData(): boolean {
    return !!(this.config && this.config.user && this.config.user.name);
  }
}
