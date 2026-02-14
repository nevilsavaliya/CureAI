import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../config/environment';

@Injectable({
  providedIn: 'root'
})
export class SubscriptionService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  /**
   * Get subscription status for a doctor
   */
  getSubscriptionStatus(doctorId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/subscriptions/${doctorId}`);
  }

  /**
   * Simulate test payment (now used for UPI payment)
   */
  simulateTestPayment(): Observable<any> {
    return this.http.post(`${this.apiUrl}/test-payment/simulate`, {
      amount: 30,
      planName: 'Monthly Subscription'
    });
  }

  /**
   * Get test payment subscription status
   */
  getTestPaymentStatus(): Observable<any> {
    return this.http.get(`${this.apiUrl}/test-payment/status`);
  }

  /**
   * Reset test subscription (for testing)
   */
  resetTestSubscription(): Observable<any> {
    return this.http.post(`${this.apiUrl}/test-payment/reset`, {});
  }
}
