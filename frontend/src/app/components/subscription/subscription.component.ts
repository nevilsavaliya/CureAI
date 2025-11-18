import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { SubscriptionService } from '../../services/subscription.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-subscription',
  templateUrl: './subscription.component.html',
  styleUrls: ['./subscription.component.css']
})
export class SubscriptionComponent implements OnInit, OnDestroy {
  loading = false;
  error = '';
  success = false;
  redirectCountdown = 0;

  planDetails = {
    id: 'monthly-plan',
    name: 'Monthly Subscription',
    price: 30,
    duration: '30 days',
    features: [
      'Access to patient messages',
      'View patient medical history',
      'Book video consultations',
      'Receive consultation notifications',
      'Manage your doctor profile'
    ]
  };

  private redirectTimer: any = null;

  constructor(
    private subscriptionService: SubscriptionService,
    private authService: AuthService,
    private router: Router
  ) { }

  ngOnInit(): void {
    // Check if doctor already has active subscription
    this.checkExistingSubscription();
  }

  /**
   * Check if doctor already has an active subscription
   */
  checkExistingSubscription(): void {
    this.subscriptionService.getTestPaymentStatus().subscribe({
      next: (response) => {
        if (response.subscriptionStatus === 'active') {
          // Doctor already has active subscription, redirect to dashboard
          this.success = true;
          this.startSuccessCountdown();
        }
      },
      error: (error) => {
        // If error checking status, continue with normal flow
        console.log('No existing subscription found, showing payment form');
      }
    });
  }

  ngOnDestroy(): void {
    // Clean up timers
    if (this.redirectTimer) {
      clearInterval(this.redirectTimer);
    }
  }

  /**
   * Pay with UPI - Simplified test payment
   */
  payWithUPI(): void {
    this.loading = true;
    this.error = '';
    this.success = false;

    // Simulate UPI payment processing
    this.subscriptionService.simulateTestPayment().subscribe({
      next: (response) => {
        if (response.success) {
          this.loading = false;
          this.success = true;
          this.startSuccessCountdown();
        } else {
          this.error = response.message || 'Payment failed. Please try again.';
          this.loading = false;
        }
      },
      error: (error) => {
        console.error('Error processing UPI payment:', error);
        
        // Handle specific case where doctor already has subscription
        if (error.error?.message?.includes('already have an active subscription')) {
          this.success = true;
          this.loading = false;
          this.startSuccessCountdown();
        } else {
          this.error = error.error?.message || 'Payment failed. Please try again.';
          this.loading = false;
        }
      }
    });
  }

  /**
   * Start success countdown and redirect
   */
  startSuccessCountdown(): void {
    this.redirectCountdown = 3;
    this.redirectTimer = setInterval(() => {
      this.redirectCountdown--;
      if (this.redirectCountdown <= 0) {
        clearInterval(this.redirectTimer);
        this.router.navigate(['/doctor/dashboard']);
      }
    }, 1000);
  }

  /**
   * Retry payment
   */
  retryPayment(): void {
    this.error = '';
    this.success = false;
    this.payWithUPI();
  }

  /**
   * Navigate to dashboard
   */
  goToDashboard(): void {
    this.router.navigate(['/doctor/dashboard']);
  }

  /**
   * Navigate back to login
   */
  goToLogin(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
