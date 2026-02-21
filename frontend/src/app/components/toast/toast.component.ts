import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { ToastService, Toast } from '../../services/toast.service';
import { trigger, transition, style, animate } from '@angular/animations';

@Component({
  selector: 'app-toast',
  templateUrl: './toast.component.html',
  styleUrls: ['./toast.component.css'],
  animations: [
    trigger('slideIn', [
      transition(':enter', [
        style({ transform: 'translateX(100%)', opacity: 0 }),
        animate('300ms cubic-bezier(0.4, 0, 0.2, 1)', style({ transform: 'translateX(0)', opacity: 1 }))
      ]),
      transition(':leave', [
        animate('200ms cubic-bezier(0.4, 0, 1, 1)', style({ transform: 'translateX(100%)', opacity: 0 }))
      ])
    ])
  ]
})
export class ToastComponent implements OnInit, OnDestroy {
  toasts: Toast[] = [];
  private toastSubscription?: Subscription;

  constructor(private toastService: ToastService) {}

  ngOnInit(): void {
    this.toastSubscription = this.toastService.toast$.subscribe((toast) => {
      this.addToast(toast);
    });
  }

  ngOnDestroy(): void {
    if (this.toastSubscription) {
      this.toastSubscription.unsubscribe();
    }
  }

  addToast(toast: Toast): void {
    this.toasts.push(toast);

    // Auto-remove toast after duration
    if (toast.duration && toast.duration > 0) {
      setTimeout(() => {
        this.removeToast(toast.id);
      }, toast.duration);
    }
  }

  removeToast(id: string): void {
    this.toasts = this.toasts.filter(t => t.id !== id);
  }

  getToastClass(type: string): string {
    return `toast-${type}`;
  }

  getProgressDuration(toast: Toast): string {
    return toast.duration ? `${toast.duration}ms` : '3000ms';
  }
}
