import { Component, Input, Output, EventEmitter } from '@angular/core';
import { AppointmentItem } from '../../models/dashboard.models';

/**
 * Appointment List Item Component
 * 
 * Displays a single appointment item with avatar, name, subtitle, and time/status.
 * Supports click handlers and keyboard accessibility.
 * 
 * @example
 * <app-appointment-list-item
 *   [appointment]="appointmentData"
 *   (itemClick)="onItemClick($event)">
 * </app-appointment-list-item>
 */
@Component({
  selector: 'app-appointment-list-item',
  templateUrl: './appointment-list-item.component.html',
  styleUrls: ['./appointment-list-item.component.css']
})
export class AppointmentListItemComponent {
  @Input() appointment!: AppointmentItem;
  @Output() itemClick = new EventEmitter<string>();

  imageError = false;

  /**
   * Handle click event
   */
  handleClick(event?: Event): void {
    if (event && event.type === 'keydown') {
      event.preventDefault();
    }
    
    if (this.appointment.onClick) {
      this.appointment.onClick();
    }
    this.itemClick.emit(this.appointment.id);
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
   * Get status label for display
   */
  getStatusLabel(status: 'ongoing' | 'upcoming' | 'completed'): string {
    const labels: Record<string, string> = {
      ongoing: 'On Going',
      upcoming: 'Upcoming',
      completed: 'Completed'
    };
    return labels[status] || status;
  }

  /**
   * Get ARIA label for accessibility
   */
  getAriaLabel(): string {
    const statusText = this.appointment.status 
      ? this.getStatusLabel(this.appointment.status)
      : this.appointment.time;
    
    return `Appointment with ${this.appointment.name}, ${this.appointment.subtitle}, ${statusText}`;
  }
}
