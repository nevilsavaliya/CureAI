import { Injectable } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, timer } from 'rxjs';
import { retry, retryWhen, mergeMap, finalize } from 'rxjs/operators';

export interface ErrorDetails {
  message: string;
  statusCode?: number;
  errors?: string[];
  retryable: boolean;
  userFriendly: boolean;
  context?: string;
}

export type ErrorContext =
  | 'authentication'
  | 'case_management'
  | 'messaging'
  | 'user_management'
  | 'hospital'
  | 'notification'
  | 'profile'
  | 'subscription'
  | 'general';

@Injectable({
  providedIn: 'root'
})
export class ErrorHandlerService {
  // Track retry attempts for rate limiting
  private retryAttempts = new Map<string, number>();
  private maxRetries = 3;
  private retryDelay = 1000; // 1 second

  // Context-specific fallback error messages (only used when backend doesn't provide a message)
  private contextMessages: Record<ErrorContext, Record<number, string>> = {
    authentication: {},
    case_management: {},
    messaging: {},
    user_management: {},
    hospital: {},
    notification: {},
    profile: {},
    subscription: {},
    general: {}
  };

  constructor() { }

  /**
   * Handle HTTP errors and return user-friendly error details
   */
  handleError(error: HttpErrorResponse, context?: string | ErrorContext): ErrorDetails {
    const errorContext = this.normalizeContext(context);
    let errorDetails: ErrorDetails = {
      message: 'An unexpected error occurred',
      retryable: false,
      userFriendly: false,
      context: errorContext
    };

    if (error.error instanceof ErrorEvent) {
      // Client-side or network error
      errorDetails = {
        message: 'Network error. Please check your internet connection and try again.',
        retryable: true,
        userFriendly: true,
        context: errorContext
      };
    } else {
      // Backend returned an unsuccessful response code
      errorDetails.statusCode = error.status;

      switch (error.status) {
        case 0:
          // Network error or CORS issue
          errorDetails = {
            message: 'Unable to connect to the server. Please check your internet connection.',
            statusCode: 0,
            retryable: true,
            userFriendly: true,
            context: errorContext
          };
          break;

        case 400:
          // Bad Request - validation errors - prioritize backend message
          errorDetails = {
            message: error.error?.message || this.getContextMessage(errorContext, 400) || 'Invalid request. Please check your input.',
            statusCode: 400,
            errors: error.error?.errors || [],
            retryable: false,
            userFriendly: true,
            context: errorContext
          };
          break;

        case 401:
          // Unauthorized - prioritize backend message over context message
          errorDetails = {
            message: error.error?.message || this.getContextMessage(errorContext, 401) || 'Your session has expired. Please log in again.',
            statusCode: 401,
            retryable: false,
            userFriendly: true,
            context: errorContext
          };
          break;

        case 403:
          // Forbidden
          errorDetails = {
            message: this.getContextMessage(errorContext, 403) || error.error?.message || 'You do not have permission to perform this action.',
            statusCode: 403,
            retryable: false,
            userFriendly: true,
            context: errorContext
          };
          break;

        case 404:
          // Not Found
          errorDetails = {
            message: this.getContextMessage(errorContext, 404) || error.error?.message || 'The requested resource was not found.',
            statusCode: 404,
            retryable: false,
            userFriendly: true,
            context: errorContext
          };
          break;

        case 403:
          // Forbidden
          errorDetails = {
            message: error.error?.message || this.getContextMessage(errorContext, 403) || 'You do not have permission to perform this action.',
            statusCode: 403,
            retryable: false,
            userFriendly: true,
            context: errorContext
          };
          break;

        case 404:
          // Not Found
          errorDetails = {
            message: error.error?.message || this.getContextMessage(errorContext, 404) || 'The requested resource was not found.',
            statusCode: 404,
            retryable: false,
            userFriendly: true,
            context: errorContext
          };
          break;

        case 409:
          // Conflict
          errorDetails = {
            message: error.error?.message || this.getContextMessage(errorContext, 409) || 'A conflict occurred. This action cannot be completed.',
            statusCode: 409,
            retryable: false,
            userFriendly: true,
            context: errorContext
          };
          break;

        case 429:
          // Too Many Requests - rate limiting
          const retryAfter = error.error?.retryAfter || 60;
          errorDetails = {
            message: error.error?.message || this.getContextMessage(errorContext, 429) || `You're sending requests too quickly. Please wait ${retryAfter} seconds and try again.`,
            statusCode: 429,
            retryable: true,
            userFriendly: true,
            context: errorContext
          };
          break;

        case 500:
          // Internal Server Error
          errorDetails = {
            message: error.error?.message || this.getContextMessage(errorContext, 500) || 'A server error occurred. Please try again later.',
            statusCode: 500,
            retryable: true,
            userFriendly: true,
            context: errorContext
          };
          break;

        case 502:
        case 503:
        case 504:
          // Bad Gateway, Service Unavailable, Gateway Timeout
          errorDetails = {
            message: 'The server is temporarily unavailable. Please try again in a few moments.',
            statusCode: error.status,
            retryable: true,
            userFriendly: true,
            context: errorContext
          };
          break;

        default:
          errorDetails = {
            message: error.error?.message || 'An unexpected error occurred. Please try again.',
            statusCode: error.status,
            retryable: error.status >= 500,
            userFriendly: false,
            context: errorContext
          };
      }
    }

    // Log error for debugging
    console.error('Error handled:', {
      context: errorContext,
      status: error.status,
      message: errorDetails.message,
      originalError: error
    });

    return errorDetails;
  }

  /**
   * Get context-specific error message
   */
  private getContextMessage(context: ErrorContext, statusCode: number): string | undefined {
    return this.contextMessages[context]?.[statusCode];
  }

  /**
   * Normalize context string to ErrorContext type
   */
  private normalizeContext(context?: string | ErrorContext): ErrorContext {
    if (!context) {
      return 'general';
    }

    // Map common context strings to ErrorContext
    const contextMap: Record<string, ErrorContext> = {
      'auth': 'authentication',
      'login': 'authentication',
      'signup': 'authentication',
      'case': 'case_management',
      'cases': 'case_management',
      'message': 'messaging',
      'messages': 'messaging',
      'chat': 'messaging',
      'user': 'user_management',
      'users': 'user_management',
      'admin': 'user_management',
      'hospital': 'hospital',
      'notification': 'notification',
      'notifications': 'notification',
      'profile': 'profile',
      'subscription': 'subscription'
    };

    const normalized = context.toLowerCase().replace(/[^a-z]/g, '');
    return contextMap[normalized] || (context as ErrorContext) || 'general';
  }

  /**
   * Get user-friendly error message
   */
  getUserFriendlyMessage(error: any, defaultMessage: string = 'An error occurred', context?: string | ErrorContext): string {
    if (error instanceof HttpErrorResponse) {
      const errorDetails = this.handleError(error, context);
      return errorDetails.message;
    }

    if (error?.error?.message) {
      return error.error.message;
    }

    if (error?.message) {
      return error.message;
    }

    return defaultMessage;
  }

  /**
   * Get formatted error message with context
   */
  getFormattedErrorMessage(error: HttpErrorResponse, context?: string | ErrorContext): string {
    const errorDetails = this.handleError(error, context);

    // If there are validation errors, format them
    if (errorDetails.errors && errorDetails.errors.length > 0) {
      return this.formatValidationErrors(errorDetails.errors);
    }

    return errorDetails.message;
  }

  /**
   * Check if error should show toast notification
   */
  shouldShowToast(error: HttpErrorResponse): boolean {
    // Don't show toast for 401 (handled by interceptor redirect)
    if (error.status === 401) {
      return false;
    }

    // Show toast for all other errors
    return true;
  }

  /**
   * Get toast type based on error
   */
  getToastType(error: HttpErrorResponse): 'error' | 'warning' | 'info' {
    if (error.status === 429) {
      return 'warning'; // Rate limit
    }

    if (error.status >= 500) {
      return 'error'; // Server error
    }

    if (error.status === 404) {
      return 'warning'; // Not found
    }

    return 'error'; // Default to error
  }

  /**
   * Check if error is retryable
   */
  isRetryable(error: HttpErrorResponse): boolean {
    const errorDetails = this.handleError(error);
    return errorDetails.retryable;
  }

  /**
   * Retry strategy for HTTP requests
   */
  retryStrategy(maxRetries: number = 3, delayMs: number = 1000) {
    return (errors: Observable<any>) => {
      return errors.pipe(
        mergeMap((error, index) => {
          const retryAttempt = index + 1;

          // Don't retry if max attempts reached
          if (retryAttempt > maxRetries) {
            return throwError(() => error);
          }

          // Don't retry client errors (4xx) except 429 (rate limit)
          if (error instanceof HttpErrorResponse) {
            if (error.status >= 400 && error.status < 500 && error.status !== 429) {
              return throwError(() => error);
            }
          }

          // Exponential backoff
          const delay = delayMs * Math.pow(2, retryAttempt - 1);
          console.log(`Retry attempt ${retryAttempt}/${maxRetries} after ${delay}ms`);

          return timer(delay);
        }),
        finalize(() => {
          console.log('Retry strategy completed');
        })
      );
    };
  }

  /**
   * Format validation errors for display
   */
  formatValidationErrors(errors: string[]): string {
    if (!errors || errors.length === 0) {
      return '';
    }

    if (errors.length === 1) {
      return errors[0];
    }

    return errors.map((err, index) => `${index + 1}. ${err}`).join('\n');
  }

  /**
   * Check if error is a network error
   */
  isNetworkError(error: HttpErrorResponse): boolean {
    return error.status === 0 || error.error instanceof ErrorEvent;
  }

  /**
   * Check if error is an authentication error
   */
  isAuthError(error: HttpErrorResponse): boolean {
    return error.status === 401;
  }

  /**
   * Check if error is a permission error
   */
  isPermissionError(error: HttpErrorResponse): boolean {
    return error.status === 403;
  }

  /**
   * Check if error is a validation error
   */
  isValidationError(error: HttpErrorResponse): boolean {
    return error.status === 400;
  }

  /**
   * Check if error is a rate limit error
   */
  isRateLimitError(error: HttpErrorResponse): boolean {
    return error.status === 429;
  }

  /**
   * Get retry delay for rate limit errors
   */
  getRateLimitRetryDelay(error: HttpErrorResponse): number {
    if (error.status === 429 && error.error?.retryAfter) {
      return error.error.retryAfter * 1000; // Convert to milliseconds
    }
    return 60000; // Default 60 seconds
  }

  /**
   * Clear retry attempts for a specific key
   */
  clearRetryAttempts(key: string): void {
    this.retryAttempts.delete(key);
  }

  /**
   * Get retry attempts for a specific key
   */
  getRetryAttempts(key: string): number {
    return this.retryAttempts.get(key) || 0;
  }

  /**
   * Increment retry attempts for a specific key
   */
  incrementRetryAttempts(key: string): number {
    const current = this.getRetryAttempts(key);
    const updated = current + 1;
    this.retryAttempts.set(key, updated);
    return updated;
  }

  /**
   * Check if max retries reached for a specific key
   */
  hasReachedMaxRetries(key: string): boolean {
    return this.getRetryAttempts(key) >= this.maxRetries;
  }
}
