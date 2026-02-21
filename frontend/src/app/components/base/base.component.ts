import { Component, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { ErrorHandlerService, ErrorDetails } from '../../services/error-handler.service';
import { ToastService } from '../../services/toast.service';

@Component({
  template: ''
})
export class BaseComponent implements OnDestroy {
  loading: boolean = false;
  error: string = '';
  
  // Expose Math for templates
  Math = Math;
  
  private errorDetails: ErrorDetails | null = null;
  private subscriptions: Subscription[] = [];

  constructor(
    protected errorHandler: ErrorHandlerService,
    protected toastService: ToastService
  ) {}

  ngOnDestroy(): void {
    this.unsubscribeAll();
  }

  /**
   * Unsubscribe from all subscriptions
   */
  protected unsubscribeAll(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
    this.subscriptions = [];
  }

  /**
   * Add subscription to be managed
   */
  protected addSubscription(subscription: Subscription): void {
    this.subscriptions.push(subscription);
  }

  /**
   * Set loading state
   */
  protected setLoading(loading: boolean): void {
    this.loading = loading;
  }

  /**
   * Clear error state
   */
  protected clearError(): void {
    this.error = '';
    this.errorDetails = null;
  }

  /**
   * Handle error with context
   */
  protected handleError(error: any, context?: string): void {
    this.setLoading(false);
    this.errorDetails = this.errorHandler.handleError(error, context);
    this.error = this.errorDetails.message;
    this.toastService.show(this.errorDetails.message, 'error');
  }

  /**
   * Show success toast
   */
  protected showSuccess(message: string): void {
    this.toastService.show(message, 'success');
  }

  /**
   * Show info toast
   */
  protected showInfo(message: string): void {
    this.toastService.show(message, 'info');
  }

  /**
   * Show warning toast
   */
  protected showWarning(message: string): void {
    this.toastService.show(message, 'warning');
  }

  /**
   * Check if error is retryable
   */
  protected isErrorRetryable(): boolean {
    return this.errorDetails?.retryable || false;
  }

  /**
   * Safe execute with loading and error handling
   */
  protected async safeExecute<T>(
    operation: () => Promise<T>,
    successMessage?: string,
    errorContext?: string
  ): Promise<T | null> {
    try {
      this.setLoading(true);
      this.clearError();
      const result = await operation();
      if (successMessage) {
        this.showSuccess(successMessage);
      }
      return result;
    } catch (error) {
      this.handleError(error, errorContext);
      return null;
    } finally {
      this.setLoading(false);
    }
  }

  /**
   * Track by ID for ngFor
   */
  trackById(index: number, item: any): any {
    return item._id || item.id || index;
  }

  /**
   * Track by index for ngFor
   */
  trackByIndex(index: number): number {
    return index;
  }
}
