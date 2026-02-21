/**
 * Validation utilities for forms and data
 */

/**
 * Validate email format
 * @param email - Email to validate
 * @returns True if email is valid
 */
export function isValidEmail(email: string): boolean {
  if (!email) return false;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Validate phone number format
 * @param phone - Phone number to validate
 * @returns True if phone is valid
 */
export function isValidPhone(phone: string): boolean {
  if (!phone) return false;
  const phoneRegex = /^[\d\s\-\+\(\)]+$/;
  return phoneRegex.test(phone) && phone.replace(/\D/g, '').length >= 10;
}

/**
 * Validate password strength
 * @param password - Password to validate
 * @returns Object with validation result and strength level
 */
export function validatePassword(password: string): { 
  isValid: boolean; 
  strength: 'weak' | 'medium' | 'strong'; 
  errors: string[] 
} {
  const errors: string[] = [];
  let strength: 'weak' | 'medium' | 'strong' = 'weak';

  if (!password) {
    errors.push('Password is required');
    return { isValid: false, strength, errors };
  }

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters');
  }

  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  if (!hasUpperCase) errors.push('Password must contain an uppercase letter');
  if (!hasLowerCase) errors.push('Password must contain a lowercase letter');
  if (!hasNumber) errors.push('Password must contain a number');

  // Calculate strength
  const criteriaCount = [hasUpperCase, hasLowerCase, hasNumber, hasSpecialChar].filter(Boolean).length;
  
  if (password.length >= 8 && criteriaCount >= 3) {
    strength = 'medium';
  }
  if (password.length >= 12 && criteriaCount === 4) {
    strength = 'strong';
  }

  return {
    isValid: errors.length === 0,
    strength,
    errors
  };
}

/**
 * Validate required field
 * @param value - Value to validate
 * @returns True if value is not empty
 */
export function isRequired(value: any): boolean {
  if (value === null || value === undefined) return false;
  if (typeof value === 'string') return value.trim().length > 0;
  if (Array.isArray(value)) return value.length > 0;
  return true;
}

/**
 * Validate minimum length
 * @param value - Value to validate
 * @param minLength - Minimum length
 * @returns True if value meets minimum length
 */
export function hasMinLength(value: string, minLength: number): boolean {
  return value && value.length >= minLength;
}

/**
 * Validate maximum length
 * @param value - Value to validate
 * @param maxLength - Maximum length
 * @returns True if value is within maximum length
 */
export function hasMaxLength(value: string, maxLength: number): boolean {
  return !value || value.length <= maxLength;
}

/**
 * Validate number range
 * @param value - Number to validate
 * @param min - Minimum value
 * @param max - Maximum value
 * @returns True if number is within range
 */
export function isInRange(value: number, min: number, max: number): boolean {
  return value >= min && value <= max;
}

/**
 * Validate URL format
 * @param url - URL to validate
 * @returns True if URL is valid
 */
export function isValidUrl(url: string): boolean {
  if (!url) return false;
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

/**
 * Sanitize input to prevent XSS
 * @param input - Input to sanitize
 * @returns Sanitized input
 */
export function sanitizeInput(input: string): string {
  if (!input) return '';
  return input
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
}

/**
 * Validate file size
 * @param file - File to validate
 * @param maxSizeMB - Maximum size in MB
 * @returns True if file size is within limit
 */
export function isValidFileSize(file: File, maxSizeMB: number): boolean {
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  return file.size <= maxSizeBytes;
}

/**
 * Validate file type
 * @param file - File to validate
 * @param allowedTypes - Array of allowed MIME types
 * @returns True if file type is allowed
 */
export function isValidFileType(file: File, allowedTypes: string[]): boolean {
  return allowedTypes.includes(file.type);
}

/**
 * Validate Indian Aadhaar number format
 * @param aadhaar - Aadhaar number to validate
 * @returns True if Aadhaar is valid
 */
export function isValidAadhaar(aadhaar: string): boolean {
  if (!aadhaar) return false;
  const aadhaarRegex = /^\d{12}$/;
  return aadhaarRegex.test(aadhaar.replace(/\s/g, ''));
}

/**
 * Validate medical license number format
 * @param license - License number to validate
 * @returns True if license format is valid
 */
export function isValidMedicalLicense(license: string): boolean {
  if (!license) return false;
  // Basic validation - alphanumeric with minimum length
  return /^[A-Z0-9]{5,20}$/i.test(license);
}
