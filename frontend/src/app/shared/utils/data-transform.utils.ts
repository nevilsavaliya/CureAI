/**
 * Data transformation and manipulation utilities
 */

/**
 * Sort array by property
 * @param array - Array to sort
 * @param property - Property to sort by
 * @param order - Sort order ('asc' or 'desc')
 * @returns Sorted array
 */
export function sortByProperty<T>(array: T[], property: keyof T, order: 'asc' | 'desc' = 'asc'): T[] {
  return [...array].sort((a, b) => {
    const aVal = a[property];
    const bVal = b[property];
    
    if (aVal === bVal) return 0;
    
    const comparison = aVal > bVal ? 1 : -1;
    return order === 'asc' ? comparison : -comparison;
  });
}

/**
 * Filter array by search term across multiple properties
 * @param array - Array to filter
 * @param searchTerm - Search term
 * @param properties - Properties to search in
 * @returns Filtered array
 */
export function filterBySearch<T>(array: T[], searchTerm: string, properties: (keyof T)[]): T[] {
  if (!searchTerm) return array;
  
  const lowerSearch = searchTerm.toLowerCase();
  
  return array.filter(item => {
    return properties.some(prop => {
      const value = item[prop];
      if (value === null || value === undefined) return false;
      return String(value).toLowerCase().includes(lowerSearch);
    });
  });
}

/**
 * Group array by property
 * @param array - Array to group
 * @param property - Property to group by
 * @returns Object with grouped items
 */
export function groupBy<T>(array: T[], property: keyof T): Record<string, T[]> {
  return array.reduce((groups, item) => {
    const key = String(item[property]);
    if (!groups[key]) {
      groups[key] = [];
    }
    groups[key].push(item);
    return groups;
  }, {} as Record<string, T[]>);
}

/**
 * Paginate array
 * @param array - Array to paginate
 * @param page - Current page (1-indexed)
 * @param itemsPerPage - Items per page
 * @returns Paginated array and metadata
 */
export function paginate<T>(array: T[], page: number, itemsPerPage: number): {
  items: T[];
  totalPages: number;
  totalItems: number;
  currentPage: number;
  hasNext: boolean;
  hasPrev: boolean;
} {
  const totalItems = array.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const currentPage = Math.max(1, Math.min(page, totalPages));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const items = array.slice(startIndex, endIndex);

  return {
    items,
    totalPages,
    totalItems,
    currentPage,
    hasNext: currentPage < totalPages,
    hasPrev: currentPage > 1
  };
}

/**
 * Calculate average of numeric property
 * @param array - Array to calculate from
 * @param property - Numeric property
 * @returns Average value
 */
export function calculateAverage<T>(array: T[], property: keyof T): number {
  if (array.length === 0) return 0;
  
  const sum = array.reduce((acc, item) => {
    const value = item[property];
    return acc + (typeof value === 'number' ? value : 0);
  }, 0);
  
  return sum / array.length;
}

/**
 * Get unique values from array property
 * @param array - Array to extract from
 * @param property - Property to get unique values from
 * @returns Array of unique values
 */
export function getUniqueValues<T>(array: T[], property: keyof T): any[] {
  const values = array.map(item => item[property]);
  return [...new Set(values)];
}

/**
 * Deep clone object
 * @param obj - Object to clone
 * @returns Cloned object
 */
export function deepClone<T>(obj: T): T {
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return new Date(obj.getTime()) as any;
  if (obj instanceof Array) return obj.map(item => deepClone(item)) as any;
  
  const clonedObj = {} as T;
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      clonedObj[key] = deepClone(obj[key]);
    }
  }
  return clonedObj;
}

/**
 * Merge objects deeply
 * @param target - Target object
 * @param source - Source object
 * @returns Merged object
 */
export function deepMerge<T>(target: T, source: Partial<T>): T {
  const output = { ...target };
  
  if (isObject(target) && isObject(source)) {
    Object.keys(source).forEach(key => {
      if (isObject(source[key as keyof T])) {
        if (!(key in target)) {
          Object.assign(output, { [key]: source[key as keyof T] });
        } else {
          (output as any)[key] = deepMerge(
            (target as any)[key],
            (source as any)[key]
          );
        }
      } else {
        Object.assign(output, { [key]: source[key as keyof T] });
      }
    });
  }
  
  return output;
}

function isObject(item: any): boolean {
  return item && typeof item === 'object' && !Array.isArray(item);
}

/**
 * Convert object to query string
 * @param obj - Object to convert
 * @returns Query string
 */
export function toQueryString(obj: Record<string, any>): string {
  return Object.keys(obj)
    .filter(key => obj[key] !== null && obj[key] !== undefined && obj[key] !== '')
    .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(obj[key])}`)
    .join('&');
}

/**
 * Parse query string to object
 * @param queryString - Query string to parse
 * @returns Parsed object
 */
export function parseQueryString(queryString: string): Record<string, string> {
  if (!queryString) return {};
  
  return queryString
    .replace(/^\?/, '')
    .split('&')
    .reduce((acc, pair) => {
      const [key, value] = pair.split('=');
      if (key) {
        acc[decodeURIComponent(key)] = decodeURIComponent(value || '');
      }
      return acc;
    }, {} as Record<string, string>);
}

/**
 * Truncate text with ellipsis
 * @param text - Text to truncate
 * @param maxLength - Maximum length
 * @param suffix - Suffix to add (default: '...')
 * @returns Truncated text
 */
export function truncateText(text: string, maxLength: number, suffix: string = '...'): string {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength - suffix.length) + suffix;
}

/**
 * Capitalize first letter of string
 * @param text - Text to capitalize
 * @returns Capitalized text
 */
export function capitalizeFirst(text: string): string {
  if (!text) return '';
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/**
 * Convert camelCase to Title Case
 * @param text - Text to convert
 * @returns Title case text
 */
export function camelToTitle(text: string): string {
  if (!text) return '';
  return text
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, str => str.toUpperCase())
    .trim();
}

/**
 * Format number with commas
 * @param num - Number to format
 * @returns Formatted number string
 */
export function formatNumber(num: number): string {
  return num.toLocaleString('en-US');
}

/**
 * Format percentage
 * @param value - Value to format
 * @param decimals - Number of decimal places
 * @returns Formatted percentage string
 */
export function formatPercentage(value: number, decimals: number = 1): string {
  return `${value.toFixed(decimals)}%`;
}

/**
 * Calculate percentage
 * @param value - Current value
 * @param total - Total value
 * @param decimals - Number of decimal places
 * @returns Percentage value
 */
export function calculatePercentage(value: number, total: number, decimals: number = 1): number {
  if (total === 0) return 0;
  return Number(((value / total) * 100).toFixed(decimals));
}

/**
 * Debounce function
 * @param func - Function to debounce
 * @param wait - Wait time in milliseconds
 * @returns Debounced function
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: any;
  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Throttle function
 * @param func - Function to throttle
 * @param limit - Time limit in milliseconds
 * @returns Throttled function
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;
  return function executedFunction(...args: Parameters<T>) {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}
