import { Component, Input, Output, EventEmitter, HostListener } from '@angular/core';
import { AppointmentListConfig, AppointmentItem } from '../../models/dashboard.models';

/**
 * Appointment List Component
 * 
 * Displays a list of appointments with patient/doctor information.
 * Supports loading states, empty states, click handlers, and keyboard navigation.
 * 
 * @example
 * <app-appointment-list
 *   [config]="appointmentConfig"
 *   (appointmentClick)="onAppointmentClick($event)">
 * </app-appointment-list>
 */
@Component({
  selector: 'app-appointment-list',
  templateUrl: './appointment-list.component.html',
  styleUrls: ['./appointment-list.component.css']
})
export class AppointmentListComponent {
  @Input() config: AppointmentListConfig = {
    title: 'Appointments',
    appointments: [],
    showSeeAll: false,
    emptyMessage: 'No appointments found',
    loading: false
  };
  @Input() error: string | null = null;

  @Output() appointmentClick = new EventEmitter<string>();
  @Output() seeAllClick = new EventEmitter<void>();
  @Output() retry = new EventEmitter<void>();

  private focusedIndex: number = -1;

  /**
   * Handle appointment item click
   */
  onAppointmentClick(appointmentId: string): void {
    this.appointmentClick.emit(appointmentId);
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
  trackByAppointmentId(index: number, item: AppointmentItem): string {
    return item.id;
  }

  /**
   * Handle keyboard navigation within the list
   */
  @HostListener('keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    if (!this.config.appointments || this.config.appointments.length === 0) {
      return;
    }

    const clickableAppointments = this.config.appointments.filter(a => a.onClick);
    if (clickableAppointments.length === 0) {
      return;
    }

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        this.focusedIndex = Math.min(this.focusedIndex + 1, clickableAppointments.length - 1);
        this.focusAppointment(this.focusedIndex);
        break;
      case 'ArrowUp':
        event.preventDefault();
        this.focusedIndex = Math.max(this.focusedIndex - 1, 0);
        this.focusAppointment(this.focusedIndex);
        break;
      case 'Home':
        event.preventDefault();
        this.focusedIndex = 0;
        this.focusAppointment(this.focusedIndex);
        break;
      case 'End':
        event.preventDefault();
        this.focusedIndex = clickableAppointments.length - 1;
        this.focusAppointment(this.focusedIndex);
        break;
    }
  }

  /**
   * Focus an appointment item by index
   */
  private focusAppointment(index: number): void {
    const listItems = document.querySelectorAll('.appointment-item[tabindex="0"]');
    if (listItems[index]) {
      (listItems[index] as HTMLElement).focus();
    }
  }

  /**
   * Handle retry action
   */
  onRetry(): void {
    this.retry.emit();
  }
}
