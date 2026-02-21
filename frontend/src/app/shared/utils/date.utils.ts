/**
 * Date formatting and manipulation utilities
 */

/**
 * Format a date to a readable string
 * @param date - Date to format
 * @param format - Format type ('short', 'long', 'time', 'datetime', 'relative')
 * @returns Formatted date string
 */
export function formatDate(date: Date | string | undefined, format: 'short' | 'long' | 'time' | 'datetime' | 'relative' = 'short'): string {
  if (!date) return 'N/A';
  
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  if (isNaN(dateObj.getTime())) {
    return 'Invalid Date';
  }

  switch (format) {
    case 'short':
      return dateObj.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    
    case 'long':
      return dateObj.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        weekday: 'long'
      });
    
    case 'time':
      return dateObj.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit'
      });
    
    case 'datetime':
      return dateObj.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    
    case 'relative':
      return getRelativeTime(dateObj);
    
    default:
      return dateObj.toLocaleDateString();
  }
}

/**
 * Get relative time string (e.g., "2 hours ago", "just now")
 * @param date - Date to compare
 * @returns Relative time string
 */
export function getRelativeTime(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - dateObj.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);
  const diffWeek = Math.floor(diffDay / 7);
  const diffMonth = Math.floor(diffDay / 30);
  const diffYear = Math.floor(diffDay / 365);

  if (diffSec < 60) return 'just now';
  if (diffMin < 60) return `${diffMin} ${diffMin === 1 ? 'minute' : 'minutes'} ago`;
  if (diffHour < 24) return `${diffHour} ${diffHour === 1 ? 'hour' : 'hours'} ago`;
  if (diffDay < 7) return `${diffDay} ${diffDay === 1 ? 'day' : 'days'} ago`;
  if (diffWeek < 4) return `${diffWeek} ${diffWeek === 1 ? 'week' : 'weeks'} ago`;
  if (diffMonth < 12) return `${diffMonth} ${diffMonth === 1 ? 'month' : 'months'} ago`;
  return `${diffYear} ${diffYear === 1 ? 'year' : 'years'} ago`;
}

/**
 * Check if a date is today
 * @param date - Date to check
 * @returns True if date is today
 */
export function isToday(date: Date | string): boolean {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const today = new Date();
  return dateObj.toDateString() === today.toDateString();
}

/**
 * Check if a date is within the last N days
 * @param date - Date to check
 * @param days - Number of days
 * @returns True if date is within the last N days
 */
export function isWithinDays(date: Date | string, days: number): boolean {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffMs = now.getTime() - dateObj.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  return diffDays <= days;
}

/**
 * Format date for input fields (YYYY-MM-DD)
 * @param date - Date to format
 * @returns Formatted date string for input
 */
export function formatDateForInput(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const year = dateObj.getFullYear();
  const month = String(dateObj.getMonth() + 1).padStart(2, '0');
  const day = String(dateObj.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Format time for input fields (HH:MM)
 * @param date - Date to format
 * @returns Formatted time string for input
 */
export function formatTimeForInput(date: Date | string): string {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const hours = String(dateObj.getHours()).padStart(2, '0');
  const minutes = String(dateObj.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

/**
 * Parse date range from start and end date strings
 * @param startDate - Start date string
 * @param endDate - End date string
 * @returns Object with parsed start and end dates
 */
export function parseDateRange(startDate: string, endDate: string): { start: Date | null; end: Date | null } {
  return {
    start: startDate ? new Date(startDate) : null,
    end: endDate ? new Date(endDate) : null
  };
}

/**
 * Check if a date is between two dates
 * @param date - Date to check
 * @param startDate - Start date
 * @param endDate - End date
 * @returns True if date is between start and end dates
 */
export function isDateBetween(date: Date | string, startDate: Date | string, endDate: Date | string): boolean {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  const startObj = typeof startDate === 'string' ? new Date(startDate) : startDate;
  const endObj = typeof endDate === 'string' ? new Date(endDate) : endDate;
  
  return dateObj >= startObj && dateObj <= endObj;
}
