import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { ToastService } from '../../services/toast.service';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../config/environment';

interface PaymentHistory {
  _id: string;
  amount: number;
  paymentDate: Date;
  status: 'completed' | 'pending' | 'failed';
  transactionId: string;
  month: string;
}

interface PaymentStatus {
  isActive: boolean;
  lastPaymentDate: Date | null;
  nextPaymentDue: Date | null;
  daysUntilDue: number;
  isShadowBanned: boolean;
}

@Component({
  selector: 'app-doctor-payment',
  templateUrl: './doctor-payment.component.html',
  styleUrls: ['./doctor-payment.component.css']
})
export class DoctorPaymentComponent implements OnInit {
  loading = true;
  paymentHistory: PaymentHistory[] = [];
  paymentStatus: PaymentStatus | null = null;
  monthlyFee = 30; // ₹30 per month
  processingPayment = false;

  constructor(
    private authService: AuthService,
    private toastService: ToastService,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    this.loadPaymentData();
  }

  loadPaymentData(): void {
    this.loading = true;
    
    // Load payment status
    this.http.get<any>(`${environment.apiUrl}/doctor/payment-status`).subscribe({
      next: (response) => {
        this.paymentStatus = response.data;
        this.loadPaymentHistory();
      },
      error: (error) => {
        console.error('Error loading payment status:', error);
        this.toastService.show('Failed to load payment status', 'error');
        this.loading = false;
      }
    });
  }

  loadPaymentHistory(): void {
    this.http.get<any>(`${environment.apiUrl}/doctor/payment-history`).subscribe({
      next: (response) => {
        this.paymentHistory = response.data;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading payment history:', error);
        this.toastService.show('Failed to load payment history', 'error');
        this.loading = false;
      }
    });
  }

  makePayment(): void {
    if (this.processingPayment) return;

    this.processingPayment = true;
    
    this.http.post<any>(`${environment.apiUrl}/doctor/make-payment`, {
      amount: this.monthlyFee
    }).subscribe({
      next: (response) => {
        this.processingPayment = false;
        if (response.success) {
          this.toastService.show('Payment successful! Your account is now active.', 'success');
          // Reload payment data to show updated status
          this.loadPaymentData();
          // Also reload the page after a short delay to ensure all components refresh
          setTimeout(() => {
            window.location.reload();
          }, 1500);
        }
      },
      error: (error) => {
        this.processingPayment = false;
        console.error('Error processing payment:', error);
        this.toastService.show(
          error.error?.message || 'Payment failed. Please try again.',
          'error'
        );
      }
    });
  }

  getStatusClass(): string {
    if (!this.paymentStatus) return '';
    
    if (this.paymentStatus.isShadowBanned) return 'status-banned';
    if (this.paymentStatus.daysUntilDue <= 3) return 'status-warning';
    if (this.paymentStatus.isActive) return 'status-active';
    return 'status-inactive';
  }

  getStatusText(): string {
    if (!this.paymentStatus) return 'Loading...';
    
    if (this.paymentStatus.isShadowBanned) return 'Account Suspended';
    if (this.paymentStatus.daysUntilDue <= 0) return 'Payment Overdue';
    if (this.paymentStatus.daysUntilDue <= 3) return 'Payment Due Soon';
    if (this.paymentStatus.isActive) return 'Active';
    return 'Inactive';
  }

  formatDate(date: Date | null): string {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  }

  getPaymentStatusIcon(status: string): string {
    switch (status) {
      case 'completed': return '✓';
      case 'pending': return '⏳';
      case 'failed': return '✗';
      default: return '?';
    }
  }

  shouldShowPaymentButton(): boolean {
    if (!this.paymentStatus) return true;
    
    // Show button if account is shadow banned
    if (this.paymentStatus.isShadowBanned) return true;
    
    // Show button if payment is due within 7 days
    if (this.paymentStatus.daysUntilDue <= 7) return true;
    
    // Show button if account is not active
    if (!this.paymentStatus.isActive) return true;
    
    return false;
  }
}
