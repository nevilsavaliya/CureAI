import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-error-display',
  templateUrl: './error-display.component.html',
  styleUrls: ['./error-display.component.css']
})
export class ErrorDisplayComponent {
  @Input() error: string | null = null;
  @Input() title: string = '';
  @Input() retryable: boolean = false;
  @Input() dismissible: boolean = true;
  @Input() type: 'error' | 'warning' | 'info' = 'error';
  @Input() displayType: 'inline' | 'toast' | 'page' | 'banner' = 'inline';
  
  @Output() retry = new EventEmitter<void>();
  @Output() dismiss = new EventEmitter<void>();

  onRetry(): void {
    this.retry.emit();
  }

  onDismiss(): void {
    this.dismiss.emit();
  }

  getIconClass(): string {
    switch (this.type) {
      case 'error':
        return 'error-icon';
      case 'warning':
        return 'warning-icon';
      case 'info':
        return 'info-icon';
      default:
        return 'error-icon';
    }
  }

  getContainerClass(): string {
    let baseClass = 'error-container';
    
    // Add type class
    switch (this.type) {
      case 'error':
        baseClass += ' error-type';
        break;
      case 'warning':
        baseClass += ' warning-type';
        break;
      case 'info':
        baseClass += ' info-type';
        break;
    }
    
    // Add display type class
    baseClass += ` error-display-${this.displayType}`;
    
    return baseClass;
  }
}
