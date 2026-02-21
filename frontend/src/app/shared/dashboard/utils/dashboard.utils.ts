/**
 * Dashboard Utilities
 * 
 * This file contains helper functions for dashboard components.
 * These utilities handle common operations like data transformation,
 * formatting, and calculations.
 */

import { AppointmentItem, ChartDataItem } from '../models/dashboard.models';

// ============================================================================
// Date and Time Utilities
// ============================================================================

/**
 * Format a date to a readable string (e.g., "Jan 15, 2024")
 */
export function formatDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric' 
  });
}

/**
 * Format a time to 12-hour format (e.g., "2:30 PM")
 */
export function formatTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleTimeString('en-US', { 
    hour: 'numeric', 
    minute: '2-digit',
    hour12: true 
  });
}

/**
 * Check if a date is today
 */
export function isToday(date: Date | string): boolean {
  const d = typeof date === 'string' ? new Date(date) : date;
  const today = new Date();
  return d.getDate() === today.getDate() &&
         d.getMonth() === today.getMonth() &&
         d.getFullYear() === today.getFullYear();
}

/**
 * Check if a date is in the past
 */
export function isPast(date: Date | string): boolean {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d < new Date();
}

/**
 * Get the number of days between two dates
 */
export function daysBetween(date1: Date | string, date2: Date | string): number {
  const d1 = typeof date1 === 'string' ? new Date(date1) : date1;
  const d2 = typeof date2 === 'string' ? new Date(date2) : date2;
  const diffTime = Math.abs(d2.getTime() - d1.getTime());
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

// ============================================================================
// String Utilities
// ============================================================================

/**
 * Get initials from a name (e.g., "John Doe" -> "JD")
 */
export function getInitials(name: string): string {
  if (!name) return '';
  
  const parts = name.trim().split(' ');
  if (parts.length === 1) {
    return parts[0].charAt(0).toUpperCase();
  }
  
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

/**
 * Truncate text to a maximum length with ellipsis
 */
export function truncateText(text: string, maxLength: number): string {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength - 3) + '...';
}

// ============================================================================
// Number Utilities
// ============================================================================

/**
 * Format a number with commas (e.g., 1000 -> "1,000")
 */
export function formatNumber(num: number): string {
  return num.toLocaleString('en-US');
}

/**
 * Calculate percentage
 */
export function calculatePercentage(value: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((value / total) * 100);
}

/**
 * Format a number as a percentage string
 */
export function formatPercentage(value: number, total: number): string {
  return `${calculatePercentage(value, total)}%`;
}

// ============================================================================
// Chart Utilities
// ============================================================================

/**
 * Calculate the total value of chart data items
 */
export function calculateChartTotal(data: ChartDataItem[]): number {
  return data.reduce((sum, item) => sum + item.value, 0);
}

/**
 * Calculate percentages for chart data items
 */
export function calculateChartPercentages(data: ChartDataItem[]): Array<ChartDataItem & { percentage: number }> {
  const total = calculateChartTotal(data);
  return data.map(item => ({
    ...item,
    percentage: calculatePercentage(item.value, total)
  }));
}

/**
 * Generate default colors for chart items if not provided
 */
export function generateChartColors(count: number): string[] {
  const defaultColors = [
    '#4F46E5', // primary
    '#10B981', // success
    '#F59E0B', // warning
    '#EF4444', // danger
    '#3B82F6', // info
    '#8B5CF6', // purple
    '#EC4899', // pink
    '#14B8A6', // teal
  ];
  
  const colors: string[] = [];
  for (let i = 0; i < count; i++) {
    colors.push(defaultColors[i % defaultColors.length]);
  }
  return colors;
}

// ============================================================================
// Appointment Utilities
// ============================================================================

/**
 * Sort appointments by time (earliest first)
 */
export function sortAppointmentsByTime(appointments: AppointmentItem[]): AppointmentItem[] {
  return [...appointments].sort((a, b) => {
    // Handle "On Going" status - should be first
    if (a.status === 'ongoing') return -1;
    if (b.status === 'ongoing') return 1;
    
    // Parse time strings and compare
    const timeA = parseTimeString(a.time);
    const timeB = parseTimeString(b.time);
    
    return timeA.getTime() - timeB.getTime();
  });
}

/**
 * Parse a time string like "2:30 PM" to a Date object (today's date)
 */
function parseTimeString(timeStr: string): Date {
  if (timeStr === 'On Going' || timeStr === 'Ongoing') {
    return new Date(); // Current time for ongoing appointments
  }
  
  const today = new Date();
  const [time, period] = timeStr.split(' ');
  const [hours, minutes] = time.split(':').map(Number);
  
  let hour24 = hours;
  if (period === 'PM' && hours !== 12) {
    hour24 = hours + 12;
  } else if (period === 'AM' && hours === 12) {
    hour24 = 0;
  }
  
  today.setHours(hour24, minutes, 0, 0);
  return today;
}

/**
 * Filter appointments for today
 */
export function filterTodayAppointments(appointments: AppointmentItem[]): AppointmentItem[] {
  // This is a placeholder - in real implementation, you'd check the appointment date
  return appointments;
}

// ============================================================================
// Calendar Utilities
// ============================================================================

/**
 * Get the number of days in a month
 */
export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

/**
 * Get the first day of the month (0 = Sunday, 6 = Saturday)
 */
export function getFirstDayOfMonth(year: number, month: number): number {
  return new Date(year, month, 1).getDay();
}

/**
 * Generate calendar grid data for a given month
 */
export interface CalendarDay {
  date: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  hasEvent: boolean;
}

export function generateCalendarGrid(year: number, month: number, highlightedDates: Date[] = []): CalendarDay[] {
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  const today = new Date();
  
  const grid: CalendarDay[] = [];
  
  // Add empty cells for days before the first day of the month
  for (let i = 0; i < firstDay; i++) {
    const prevMonth = month === 0 ? 11 : month - 1;
    const prevYear = month === 0 ? year - 1 : year;
    const daysInPrevMonth = getDaysInMonth(prevYear, prevMonth);
    const date = daysInPrevMonth - firstDay + i + 1;
    
    grid.push({
      date,
      isCurrentMonth: false,
      isToday: false,
      hasEvent: false
    });
  }
  
  // Add days of the current month
  for (let date = 1; date <= daysInMonth; date++) {
    const currentDate = new Date(year, month, date);
    const isTodayDate = currentDate.toDateString() === today.toDateString();
    const hasEvent = highlightedDates.some(d => 
      d.getDate() === date && 
      d.getMonth() === month && 
      d.getFullYear() === year
    );
    
    grid.push({
      date,
      isCurrentMonth: true,
      isToday: isTodayDate,
      hasEvent
    });
  }
  
  // Add empty cells to complete the grid (6 rows x 7 days = 42 cells)
  const remainingCells = 42 - grid.length;
  for (let i = 1; i <= remainingCells; i++) {
    grid.push({
      date: i,
      isCurrentMonth: false,
      isToday: false,
      hasEvent: false
    });
  }
  
  return grid;
}

// ============================================================================
// Color Utilities
// ============================================================================

/**
 * Get color class based on status
 */
export function getStatusColor(status: string): string {
  const statusColors: { [key: string]: string } = {
    'ongoing': 'success',
    'upcoming': 'info',
    'completed': 'secondary',
    'pending': 'warning',
    'cancelled': 'danger'
  };
  
  return statusColors[status.toLowerCase()] || 'secondary';
}

/**
 * Get color for tag based on condition
 */
export function getConditionColor(condition: string): 'primary' | 'warning' | 'danger' | 'success' | 'info' {
  const conditionColors: { [key: string]: 'primary' | 'warning' | 'danger' | 'success' | 'info' } = {
    'asthma': 'warning',
    'hypertension': 'danger',
    'diabetes': 'danger',
    'fever': 'warning',
    'cold': 'info',
    'flu': 'warning',
    'allergy': 'info',
    'chronic': 'danger'
  };
  
  const lowerCondition = condition.toLowerCase();
  for (const key in conditionColors) {
    if (lowerCondition.includes(key)) {
      return conditionColors[key];
    }
  }
  
  return 'primary';
}

// ============================================================================
// Validation Utilities
// ============================================================================

/**
 * Check if a value is empty (null, undefined, empty string, empty array)
 */
export function isEmpty(value: any): boolean {
  if (value === null || value === undefined) return true;
  if (typeof value === 'string') return value.trim().length === 0;
  if (Array.isArray(value)) return value.length === 0;
  if (typeof value === 'object') return Object.keys(value).length === 0;
  return false;
}

/**
 * Safely get a nested property value
 */
export function getNestedValue(obj: any, path: string, defaultValue: any = null): any {
  const keys = path.split('.');
  let result = obj;
  
  for (const key of keys) {
    if (result === null || result === undefined) {
      return defaultValue;
    }
    result = result[key];
  }
  
  return result !== undefined ? result : defaultValue;
}
