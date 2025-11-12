import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, interval, Subscription } from 'rxjs';
import { switchMap, takeWhile } from 'rxjs/operators';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SubscriptionService {
  private apiUrl = 'http://localhost:3000/api';
  private pollingSubscription: Subscription | null = null;

  constructor(private http: HttpClient) { }

  /**
   * Create a payment order for doctor subscription
   */
  createPaymentOrder(): Observable<any> {
    return this.http.post(`${this.apiUrl}/payment/subscription/create-order`, {});
  }

  /**
   * Verify payment after successful transaction
   */
  verifyPayment(paymentData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/payment/subscription/verify`, paymentData);
  }

  /**
   * Get subscription status for a doctor
   */
  getSubscriptionStatus(doctorId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/subscriptions/${doctorId}`);
  }

  /**
   * Initiate UPI payment for subscription
   */
  initiateUPIPayment(planId: string, amount: number): Observable<any> {
    return this.http.post(`${this.apiUrl}/payments/initiate`, {
      planId,
      amount
    });
  }

  /**
   * Get payment status by payment ID
   */
  getPaymentStatus(paymentId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/payments/${paymentId}/status`);
  }

  /**
   * Start polling for payment status with 3-second interval
   * Returns an observable that emits payment status updates
   */
  startPaymentStatusPolling(paymentId: string, callback: (status: any) => void): void {
    // Stop any existing polling
    this.stopPaymentStatusPolling();

    // Poll every 3 seconds
    this.pollingSubscription = interval(3000).pipe(
      switchMap(() => this.getPaymentStatus(paymentId)),
      takeWhile((response) => {
        // Continue polling while status is pending
        return response.status === 'pending';
      }, true) // Include the final emission
    ).subscribe({
      next: (response) => {
        callback(response);
      },
      error: (error) => {
        console.error('Error polling payment status:', error);
        callback({ status: 'error', error: error.error?.message || 'Failed to check payment status' });
      }
    });
  }

  /**
   * Stop payment status polling
   */
  stopPaymentStatusPolling(): void {
    if (this.pollingSubscription) {
      this.pollingSubscription.unsubscribe();
      this.pollingSubscription = null;
    }
  }
}
