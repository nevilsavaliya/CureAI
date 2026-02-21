import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges, HostListener } from '@angular/core';
import { CalendarConfig, CalendarEvent } from '../../models/dashboard.models';

/**
 * Calendar Widget Component
 * 
 * Displays a monthly calendar with date highlighting and event markers.
 * Supports keyboard navigation, date selection, and month navigation.
 * 
 * @example
 * <app-calendar-widget
 *   [config]="calendarConfig"
 *   (dateClick)="onDateClick($event)"
 *   (monthChange)="onMonthChange($event)">
 * </app-calendar-widget>
 */
@Component({
  selector: 'app-calendar-widget',
  templateUrl: './calendar-widget.component.html',
  styleUrls: ['./calendar-widget.component.css']
})
export class CalendarWidgetComponent implements OnInit, OnChanges {
  @Input() config: CalendarConfig = {
    currentDate: new Date(),
    highlightedDates: [],
    events: []
  };
  @Input() loading: boolean = false;
  @Input() error: string | null = null;
  @Input() emptyMessage: string = 'No calendar data available';

  @Output() dateClick = new EventEmitter<Date>();
  @Output() monthChange = new EventEmitter<{ month: number; year: number }>();
  @Output() retry = new EventEmitter<void>();

  // Calendar state
  currentMonth: number = 0;
  currentYear: number = 0;
  calendarDays: CalendarDay[] = [];
  dayNames: string[] = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
  monthNames: string[] = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  // Keyboard navigation
  private focusedDateIndex: number = -1;

  ngOnInit(): void {
    this.initializeCalendar();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['config']) {
      this.initializeCalendar();
    }
  }

  /**
   * Initialize calendar with current date
   */
  private initializeCalendar(): void {
    const date = this.config.currentDate || new Date();
    this.currentMonth = date.getMonth();
    this.currentYear = date.getFullYear();
    this.generateCalendarDays();
  }

  /**
   * Generate calendar days for the current month
   */
  private generateCalendarDays(): void {
    this.calendarDays = [];
    
    // Get first day of the month
    const firstDay = new Date(this.currentYear, this.currentMonth, 1);
    const firstDayOfWeek = firstDay.getDay();
    
    // Get last day of the month
    const lastDay = new Date(this.currentYear, this.currentMonth + 1, 0);
    const daysInMonth = lastDay.getDate();
    
    // Get last day of previous month
    const prevMonthLastDay = new Date(this.currentYear, this.currentMonth, 0);
    const daysInPrevMonth = prevMonthLastDay.getDate();
    
    // Add days from previous month
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      const day = daysInPrevMonth - i;
      const date = new Date(this.currentYear, this.currentMonth - 1, day);
      this.calendarDays.push({
        date,
        day,
        isCurrentMonth: false,
        isToday: false,
        isHighlighted: false,
        hasEvent: false,
        events: []
      });
    }
    
    // Add days from current month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(this.currentYear, this.currentMonth, day);
      const isToday = this.isToday(date);
      const isHighlighted = this.isHighlighted(date);
      const events = this.getEventsForDate(date);
      
      this.calendarDays.push({
        date,
        day,
        isCurrentMonth: true,
        isToday,
        isHighlighted,
        hasEvent: events.length > 0,
        events
      });
    }
    
    // Add days from next month to complete the grid
    const remainingDays = 42 - this.calendarDays.length; // 6 weeks * 7 days
    for (let day = 1; day <= remainingDays; day++) {
      const date = new Date(this.currentYear, this.currentMonth + 1, day);
      this.calendarDays.push({
        date,
        day,
        isCurrentMonth: false,
        isToday: false,
        isHighlighted: false,
        hasEvent: false,
        events: []
      });
    }
  }

  /**
   * Check if a date is today
   */
  private isToday(date: Date): boolean {
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
  }

  /**
   * Check if a date is highlighted
   */
  private isHighlighted(date: Date): boolean {
    if (!this.config.highlightedDates || this.config.highlightedDates.length === 0) {
      return false;
    }
    
    return this.config.highlightedDates.some(highlightedDate => 
      this.isSameDate(date, highlightedDate)
    );
  }

  /**
   * Get events for a specific date
   */
  private getEventsForDate(date: Date): CalendarEvent[] {
    if (!this.config.events || this.config.events.length === 0) {
      return [];
    }
    
    return this.config.events.filter(event => 
      this.isSameDate(date, event.date)
    );
  }

  /**
   * Check if two dates are the same day
   */
  private isSameDate(date1: Date, date2: Date): boolean {
    return date1.getDate() === date2.getDate() &&
           date1.getMonth() === date2.getMonth() &&
           date1.getFullYear() === date2.getFullYear();
  }

  /**
   * Navigate to previous month
   */
  onPreviousMonth(): void {
    if (this.currentMonth === 0) {
      this.currentMonth = 11;
      this.currentYear--;
    } else {
      this.currentMonth--;
    }
    
    this.generateCalendarDays();
    this.monthChange.emit({ month: this.currentMonth, year: this.currentYear });
  }

  /**
   * Navigate to next month
   */
  onNextMonth(): void {
    if (this.currentMonth === 11) {
      this.currentMonth = 0;
      this.currentYear++;
    } else {
      this.currentMonth++;
    }
    
    this.generateCalendarDays();
    this.monthChange.emit({ month: this.currentMonth, year: this.currentYear });
  }

  /**
   * Handle date click
   */
  onDateClick(calendarDay: CalendarDay): void {
    if (calendarDay.isCurrentMonth) {
      this.dateClick.emit(calendarDay.date);
      
      if (this.config.onDateClick) {
        this.config.onDateClick(calendarDay.date);
      }
    }
  }

  /**
   * Handle keyboard navigation
   */
  @HostListener('keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    if (!this.calendarDays.length) return;

    // Initialize focus if not set
    if (this.focusedDateIndex === -1) {
      const todayIndex = this.calendarDays.findIndex(day => day.isToday && day.isCurrentMonth);
      this.focusedDateIndex = todayIndex !== -1 ? todayIndex : 0;
    }

    let newIndex = this.focusedDateIndex;

    switch (event.key) {
      case 'ArrowLeft':
        event.preventDefault();
        newIndex = Math.max(0, this.focusedDateIndex - 1);
        break;
      case 'ArrowRight':
        event.preventDefault();
        newIndex = Math.min(this.calendarDays.length - 1, this.focusedDateIndex + 1);
        break;
      case 'ArrowUp':
        event.preventDefault();
        newIndex = Math.max(0, this.focusedDateIndex - 7);
        break;
      case 'ArrowDown':
        event.preventDefault();
        newIndex = Math.min(this.calendarDays.length - 1, this.focusedDateIndex + 7);
        break;
      case 'Enter':
      case ' ':
        event.preventDefault();
        if (this.focusedDateIndex >= 0 && this.focusedDateIndex < this.calendarDays.length) {
          this.onDateClick(this.calendarDays[this.focusedDateIndex]);
        }
        break;
      default:
        return;
    }

    this.focusedDateIndex = newIndex;
  }

  /**
   * Get month and year display string
   */
  get monthYearDisplay(): string {
    return `${this.monthNames[this.currentMonth]} ${this.currentYear}`;
  }

  /**
   * Track by function for ngFor optimization
   */
  trackByDate(index: number, item: CalendarDay): string {
    return item.date.toISOString();
  }

  /**
   * Check if a date is focused (for keyboard navigation)
   */
  isFocused(index: number): boolean {
    return this.focusedDateIndex === index;
  }

  /**
   * Handle retry action
   */
  onRetry(): void {
    this.retry.emit();
  }
}

/**
 * Calendar Day Interface
 */
interface CalendarDay {
  date: Date;
  day: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  isHighlighted: boolean;
  hasEvent: boolean;
  events: CalendarEvent[];
}
