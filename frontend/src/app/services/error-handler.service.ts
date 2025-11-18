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
}

@Injectable({
  providedIn: 'root'
})
export class ErrorHandlerService {
  // Track retry attempts for rate limiting
  private retryAttempts = new Map<string, number>();
  private maxRetries = 3;
  private retryDelay = 1000; // 1 second

  constructor() {}

  /**
   * Handle HTTP errors and return user-friendly error details
   */
  handleError(error: HttpErrorResponse, context?: string): ErrorDetails {
    let errorDetails: ErrorDetails = {
      message: 'An unexpected error occurred',
      retryable: false,
      userFriendly: false
    };

    if (error.error instanceof ErrorEvent) {
      // Client-side or network error
      errorDetails = {
        message: 'Network error. Please check your internet connection and try again.',
        retryable: true,
        userFriendly: true
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
            userFriendly: true
          };
          break;

        case 400:
          // Bad Request - validation errors
          errorDetails = {
            message: error.error?.message || 'Invalid request. Please check your input.',
            statusCode: 400,
            errors: error.error?.errors || [],
            retryable: false,
            userFriendly: true
          };
          break;

        case 401:
          // Unauthorized
          errorDetails = {
            message: 'Your session has expired. Please log in again.',
            statusCode: 401,
            retryable: false,
            userFriendly: true
          };
          break;

        case 403:
          // Forbidden
          errorDetails = {
            message: error.error?.message || 'You do not have permission to perform this action.',
            statusCode: 403,
            retryable: false,
            userFriendly: true
          };
          break;

        case 404:
          // Not Found
          errorDetails = {
            message: error.error?.message || 'The requested resource was not found.',
            statusCode: 404,
            retryable: false,
            userFriendly: true
          };
          break;

        case 409:
          // Conflict - duplicate case
          errorDetails = {
            message: error.error?.message || 'A conflict occurred. This action cannot be completed.',
            statusCode: 409,
            retryable: false,
            userFriendly: true
          };
          break;

        case 429:
          // Too Many Requests - rate limiting
          const retryAfter = error.error?.retryAfter || 60;
          errorDetails = {
            message: `You're sending messages too quickly. Please wait ${retryAfter} seconds and try again.`,
            statusCode: 429,
            retryable: true,
            userFriendly: true
          };
          break;

        case 500:
          // Internal Server Error
          errorDetails = {
            message: 'A server error occurred. Please try again later.',
            statusCode: 500,
            retryable: true,
            userFriendly: true
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
            userFriendly: true
          };
          break;

        default:
          errorDetails = {
            message: error.error?.message || 'An unexpected error occurred. Please try again.',
            statusCode: error.status,
            retryable: error.status >= 500,
            userFriendly: false
          };
      }
    }

    // Add context if provided
    if (context) {
      errorDetails.message = `${context}: ${errorDetails.message}`;
    }

    // Log error for debugging
    console.error('Error handled:', {
      context,
      status: error.status,
      message: errorDetails.message,
      originalError: error
    });

    return errorDetails;
  }

  /**
   * Get user-friendly error message
   */
  getUserFriendlyMessage(error: any, defaultMessage: string = 'An error occurred'): string {
    if (error instanceof HttpErrorResponse) {
      const errorDetails = this.handleError(error);
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
