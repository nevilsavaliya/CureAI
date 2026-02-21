/**
 * String manipulation utilities
 */

/**
 * Generate initials from name
 * @param name - Full name
 * @returns Initials (max 2 characters)
 */
export function getInitials(name: string): string {
  if (!name) return '';
  
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) {
    return parts[0].substring(0, 2).toUpperCase();
  }
  
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Generate random color for avatar
 * @param seed - Seed string for consistent color
 * @returns Hex color code
 */
export function getAvatarColor(seed: string): string {
  const colors = [
    '#667eea', '#764ba2', '#f093fb', '#4facfe',
    '#43e97b', '#fa709a', '#fee140', '#30cfd0',
    '#a8edea', '#fed6e3', '#c471f5', '#fa71cd'
  ];
  
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  return colors[Math.abs(hash) % colors.length];
}

/**
 * Format file size to human readable format
 * @param bytes - File size in bytes
 * @returns Formatted file size string
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Pluralize word based on count
 * @param count - Count
 * @param singular - Singular form
 * @param plural - Plural form (optional, defaults to singular + 's')
 * @returns Pluralized string
 */
export function pluralize(count: number, singular: string, plural?: string): string {
  const pluralForm = plural || singular + 's';
  return count === 1 ? singular : pluralForm;
}

/**
 * Format phone number
 * @param phone - Phone number
 * @returns Formatted phone number
 */
export function formatPhoneNumber(phone: string): string {
  if (!phone) return '';
  
  const cleaned = phone.replace(/\D/g, '');
  
  if (cleaned.length === 10) {
    return `(${cleaned.substring(0, 3)}) ${cleaned.substring(3, 6)}-${cleaned.substring(6)}`;
  }
  
  return phone;
}

/**
 * Mask sensitive data
 * @param value - Value to mask
 * @param visibleChars - Number of visible characters at start and end
 * @returns Masked string
 */
export function maskSensitiveData(value: string, visibleChars: number = 4): string {
  if (!value || value.length <= visibleChars * 2) return value;
  
  const start = value.substring(0, visibleChars);
  const end = value.substring(value.length - visibleChars);
  const masked = '*'.repeat(value.length - visibleChars * 2);
  
  return start + masked + end;
}

/**
 * Generate slug from text
 * @param text - Text to convert
 * @returns URL-friendly slug
 */
export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/**
 * Highlight search term in text
 * @param text - Text to highlight in
 * @param searchTerm - Term to highlight
 * @returns HTML string with highlighted term
 */
export function highlightText(text: string, searchTerm: string): string {
  if (!searchTerm) return text;
  
  const regex = new RegExp(`(${searchTerm})`, 'gi');
  return text.replace(regex, '<mark>$1</mark>');
}

/**
 * Extract domain from email
 * @param email - Email address
 * @returns Domain part of email
 */
export function extractEmailDomain(email: string): string {
  if (!email || !email.includes('@')) return '';
  return email.split('@')[1];
}

/**
 * Generate random string
 * @param length - Length of string
 * @param charset - Character set to use
 * @returns Random string
 */
export function generateRandomString(
  length: number,
  charset: 'alphanumeric' | 'alpha' | 'numeric' = 'alphanumeric'
): string {
  const charsets = {
    alphanumeric: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789',
    alpha: 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz',
    numeric: '0123456789'
  };
  
  const chars = charsets[charset];
  let result = '';
  
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return result;
}

/**
 * Convert string to kebab-case
 * @param text - Text to convert
 * @returns Kebab-case string
 */
export function toKebabCase(text: string): string {
  return text
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/[\s_]+/g, '-')
    .toLowerCase();
}

/**
 * Convert string to camelCase
 * @param text - Text to convert
 * @returns camelCase string
 */
export function toCamelCase(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-zA-Z0-9]+(.)/g, (_, chr) => chr.toUpperCase());
}

/**
 * Convert string to PascalCase
 * @param text - Text to convert
 * @returns PascalCase string
 */
export function toPascalCase(text: string): string {
  const camel = toCamelCase(text);
  return camel.charAt(0).toUpperCase() + camel.slice(1);
}

/**
 * Remove HTML tags from string
 * @param html - HTML string
 * @returns Plain text
 */
export function stripHtmlTags(html: string): string {
  return html.replace(/<[^>]*>/g, '');
}

/**
 * Escape HTML special characters
 * @param text - Text to escape
 * @returns Escaped text
 */
export function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;'
  };
  
  return text.replace(/[&<>"']/g, m => map[m]);
}

/**
 * Check if string is empty or whitespace
 * @param text - Text to check
 * @returns True if empty or whitespace
 */
export function isEmptyOrWhitespace(text: string | null | undefined): boolean {
  return !text || text.trim().length === 0;
}

/**
 * Limit text to word boundary
 * @param text - Text to limit
 * @param maxLength - Maximum length
 * @returns Limited text
 */
export function limitToWordBoundary(text: string, maxLength: number): string {
  if (!text || text.length <= maxLength) return text;
  
  const truncated = text.substring(0, maxLength);
  const lastSpace = truncated.lastIndexOf(' ');
  
  if (lastSpace > 0) {
    return truncated.substring(0, lastSpace) + '...';
  }
  
  return truncated + '...';
}
