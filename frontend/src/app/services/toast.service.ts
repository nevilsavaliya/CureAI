import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
}

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  private toastSubject = new Subject<Toast>();
  public toast$ = this.toastSubject.asObservable();

  private toastCounter = 0;

  constructor() {}

  /**
   * Show a success toast
   */
  success(message: string, duration: number = 3000): void {
    this.show(message, 'success', duration);
  }

  /**
   * Show an error toast
   */
  error(message: string, duration: number = 5000): void {
    this.show(message, 'error', duration);
  }

  /**
   * Show a warning toast
   */
  warning(message: string, duration: number = 4000): void {
    this.show(message, 'warning', duration);
  }

  /**
   * Show an info toast
   */
  info(message: string, duration: number = 3000): void {
    this.show(message, 'info', duration);
  }

  /**
   * Show a toast with custom type and duration
   */
  show(message: string, type: 'success' | 'error' | 'warning' | 'info', duration: number = 3000): void {
    const toast: Toast = {
      id: `toast-${++this.toastCounter}-${Date.now()}`,
      message,
      type,
      duration
    };

    this.toastSubject.next(toast);
  }

  /**
   * Show validation errors as a toast
   */
  showValidationErrors(errors: string[]): void {
    if (!errors || errors.length === 0) {
      return;
    }

    const message = errors.length === 1 
      ? errors[0] 
      : `Validation errors:\n${errors.map((err, i) => `${i + 1}. ${err}`).join('\n')}`;

    this.error(message, 6000);
  }
}
