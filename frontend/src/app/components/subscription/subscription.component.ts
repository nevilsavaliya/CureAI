import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { SubscriptionService } from '../../services/subscription.service';
import { AuthService } from '../../services/auth.service';
import * as QRCode from 'qrcode';

declare var Razorpay: any;

interface PaymentState {
  loading: boolean;
  paymentInitiated: boolean;
  paymentDetails: {
    paymentId: string;
    txnId: string;
    merchantVPA: string;
    amount: number;
    qrCodeData: string;
  } | null;
  status: 'idle' | 'pending' | 'completed' | 'failed' | 'timeout';
  error: string | null;
  errorCode: string | null;
  recommendedAction: string | null;
  isRetryable: boolean;
  qrCodeImage: string | null;
  redirectCountdown: number;
  checkingStatus: boolean;
}

@Component({
  selector: 'app-subscription',
  templateUrl: './subscription.component.html',
  styleUrls: ['./subscription.component.css']
})
export class SubscriptionComponent implements OnInit, OnDestroy {
  loading = false;
  error = '';
  
  // Payment state management
  paymentState: PaymentState = {
    loading: false,
    paymentInitiated: false,
    paymentDetails: null,
    status: 'idle',
    error: null,
    errorCode: null,
    recommendedAction: null,
    isRetryable: false,
    qrCodeImage: null,
    redirectCountdown: 0,
    checkingStatus: false
  };

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
    // Load Razorpay script for fallback
    this.loadRazorpayScript();
  }

  ngOnDestroy(): void {
    // Clean up polling and timers
    this.subscriptionService.stopPaymentStatusPolling();
    if (this.redirectTimer) {
      clearInterval(this.redirectTimer);
    }
  }

  /**
   * Load Razorpay checkout script dynamically
   */
  loadRazorpayScript(): void {
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    document.body.appendChild(script);
  }

  /**
   * Initiate UPI payment process
   */
  initiatePayment(): void {
    this.paymentState.loading = true;
    this.paymentState.error = null;
    this.paymentState.status = 'idle';

    this.subscriptionService.initiateUPIPayment(this.planDetails.id, this.planDetails.price).subscribe({
      next: (response) => {
        if (response.success) {
          this.paymentState.paymentInitiated = true;
          this.paymentState.paymentDetails = {
            paymentId: response.paymentId,
            txnId: response.txnId,
            merchantVPA: response.merchantVPA,
            amount: response.amount,
            qrCodeData: response.qrCodeData
          };
          this.paymentState.status = 'pending';
          this.paymentState.loading = false;

          // Generate QR code image
          this.generateQRCode(response.qrCodeData);

          // Start polling for payment status
          this.startStatusPolling(response.paymentId);
        } else {
          this.paymentState.error = response.message || 'Failed to initiate payment';
          this.paymentState.loading = false;
          this.paymentState.status = 'failed';
        }
      },
      error: (error) => {
        console.error('Error initiating payment:', error);
        this.paymentState.error = error.error?.message || 'Failed to initiate payment. Please try again.';
        this.paymentState.loading = false;
        this.paymentState.status = 'failed';
      }
    });
  }

  /**
   * Generate QR code image from UPI data
   */
  async generateQRCode(qrData: string): Promise<void> {
    try {
      const qrCodeDataUrl = await QRCode.toDataURL(qrData, {
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
      this.paymentState.qrCodeImage = qrCodeDataUrl;
    } catch (error) {
      console.error('Error generating QR code:', error);
      this.paymentState.error = 'Failed to generate QR code';
    }
  }

  /**
   * Start polling for payment status
   */
  startStatusPolling(paymentId: string): void {
    this.subscriptionService.startPaymentStatusPolling(paymentId, (response) => {
      if (response.status === 'completed') {
        this.handlePaymentSuccess(response);
      } else if (response.status === 'failed') {
        this.handlePaymentFailure(response);
      } else if (response.status === 'timeout') {
        this.handlePaymentTimeout(response);
      } else if (response.status === 'error') {
        this.handlePaymentError(response);
      }
      // Continue polling if status is still 'pending'
    });
  }

  /**
   * Handle successful payment
   */
  handlePaymentSuccess(response: any): void {
    this.paymentState.status = 'completed';
    this.paymentState.loading = false;
    this.paymentState.error = null;
    
    // Stop polling
    this.subscriptionService.stopPaymentStatusPolling();

    // Start countdown and auto-redirect
    this.paymentState.redirectCountdown = 3;
    this.redirectTimer = setInterval(() => {
      this.paymentState.redirectCountdown--;
      if (this.paymentState.redirectCountdown <= 0) {
        clearInterval(this.redirectTimer);
        this.router.navigate(['/doctor-dashboard']);
      }
    }, 1000);
  }

  /**
   * Handle failed payment
   */
  handlePaymentFailure(response: any): void {
    this.paymentState.status = 'failed';
    this.paymentState.loading = false;
    this.paymentState.error = this.getErrorMessage(response);
    this.paymentState.errorCode = response.errorCode || null;
    this.paymentState.recommendedAction = this.getRecommendedAction(response);
    this.paymentState.isRetryable = this.isRetryableError(response);
    
    // Stop polling
    this.subscriptionService.stopPaymentStatusPolling();
  }

  /**
   * Handle payment timeout
   */
  handlePaymentTimeout(response: any): void {
    this.paymentState.status = 'timeout';
    this.paymentState.loading = false;
    this.paymentState.error = 'Payment verification timed out.';
    this.paymentState.errorCode = 'TIMEOUT';
    this.paymentState.recommendedAction = 'If you completed the payment, please use the "Check Payment Status" button to verify. Otherwise, you can start a new payment.';
    this.paymentState.isRetryable = true;
    
    // Stop polling
    this.subscriptionService.stopPaymentStatusPolling();
  }

  /**
   * Handle payment error
   */
  handlePaymentError(response: any): void {
    this.paymentState.status = 'failed';
    this.paymentState.loading = false;
    this.paymentState.error = this.getErrorMessage(response);
    this.paymentState.errorCode = response.errorCode || 'ERROR';
    this.paymentState.recommendedAction = this.getRecommendedAction(response);
    this.paymentState.isRetryable = true;
    
    // Stop polling
    this.subscriptionService.stopPaymentStatusPolling();
  }

  /**
   * Get user-friendly error message
   */
  getErrorMessage(response: any): string {
    if (response.message) {
      return response.message;
    }
    
    if (response.error) {
      return response.error;
    }
    
    // Default error messages based on error code
    const errorMessages: { [key: string]: string } = {
      '03': 'Merchant VPA not found. Please contact support.',
      '04': 'Merchant not found. Please contact support.',
      '91': 'Payment timeout. Your payment may still be processing.',
      '111': 'Invalid payment details. Please try again.',
      'OL01': 'Transaction reference not found. Please try again.',
      'OL16': 'Invalid merchant configuration. Please contact support.',
      'OL95': 'Invalid IP address. Please contact support.',
      'OL96': 'Missing required information. Please try again.',
      'UO1': 'Duplicate payment request. Please refresh the page.',
      'XP': 'Transaction not permitted. Please contact support.',
      'NETWORK_ERROR': 'Network connection error. Please check your internet connection.',
      'TIMEOUT': 'Payment verification timed out.'
    };
    
    if (response.errorCode && errorMessages[response.errorCode]) {
      return errorMessages[response.errorCode];
    }
    
    return 'An error occurred during payment processing. Please try again.';
  }

  /**
   * Get recommended action for error
   */
  getRecommendedAction(response: any): string {
    const actions: { [key: string]: string } = {
      '03': 'Please contact our support team for assistance.',
      '04': 'Please contact our support team for assistance.',
      '91': 'Check your UPI app to see if the payment was completed. If yes, use "Check Payment Status" button.',
      '111': 'Please start a new payment with correct details.',
      'OL01': 'Please start a new payment.',
      'OL16': 'Please contact our support team for assistance.',
      'OL95': 'Please contact our support team for assistance.',
      'OL96': 'Please try again or contact support if the issue persists.',
      'UO1': 'Please refresh the page and try again.',
      'XP': 'Please contact our support team for assistance.',
      'NETWORK_ERROR': 'Please check your internet connection and try again.',
      'TIMEOUT': 'If you completed the payment, use "Check Payment Status" button. Otherwise, start a new payment.'
    };
    
    if (response.errorCode && actions[response.errorCode]) {
      return actions[response.errorCode];
    }
    
    return 'Please try again or contact support if the issue persists.';
  }

  /**
   * Check if error is retryable
   */
  isRetryableError(response: any): boolean {
    const retryableCodes = ['91', '111', 'OL01', 'OL96', 'UO1', 'NETWORK_ERROR', 'TIMEOUT'];
    return response.errorCode ? retryableCodes.includes(response.errorCode) : true;
  }

  /**
   * Retry payment after failure
   */
  retryPayment(): void {
    // Reset payment state
    this.paymentState = {
      loading: false,
      paymentInitiated: false,
      paymentDetails: null,
      status: 'idle',
      error: null,
      errorCode: null,
      recommendedAction: null,
      isRetryable: false,
      qrCodeImage: null,
      redirectCountdown: 0,
      checkingStatus: false
    };

    // Stop any existing polling
    this.subscriptionService.stopPaymentStatusPolling();

    // Initiate new payment
    this.initiatePayment();
  }

  /**
   * Manually check payment status
   */
  checkPaymentStatus(): void {
    if (!this.paymentState.paymentDetails?.paymentId) {
      return;
    }

    this.paymentState.checkingStatus = true;
    this.paymentState.error = null;

    this.subscriptionService.getPaymentStatus(this.paymentState.paymentDetails.paymentId).subscribe({
      next: (response) => {
        this.paymentState.checkingStatus = false;
        
        if (response.payment.status === 'completed') {
          this.handlePaymentSuccess(response);
        } else if (response.payment.status === 'failed') {
          this.paymentState.error = 'Payment has failed. Please try a new payment.';
          this.paymentState.recommendedAction = 'Start a new payment to activate your subscription.';
        } else if (response.payment.status === 'pending') {
          this.paymentState.error = 'Payment is still pending. Please wait or complete the payment in your UPI app.';
          this.paymentState.recommendedAction = 'If you have completed the payment, please wait a few moments and check again.';
        } else {
          this.paymentState.error = 'Unable to determine payment status. Please try again.';
          this.paymentState.recommendedAction = 'Please try checking again in a few moments.';
        }
      },
      error: (error) => {
        console.error('Error checking payment status:', error);
        this.paymentState.checkingStatus = false;
        this.paymentState.error = 'Failed to check payment status. Please try again.';
        this.paymentState.recommendedAction = 'Please check your internet connection and try again.';
      }
    });
  }

  /**
   * Initiate Razorpay payment (fallback method)
   */
  initiateRazorpayPayment(): void {
    this.loading = true;
    this.error = '';

    this.subscriptionService.createPaymentOrder().subscribe({
      next: (response) => {
        if (response.success) {
          this.openRazorpayCheckout(response.order);
        } else {
          this.error = response.message || 'Failed to create payment order';
          this.loading = false;
        }
      },
      error: (error) => {
        console.error('Error creating payment order:', error);
        this.error = error.error?.message || 'Failed to create payment order. Please try again.';
        this.loading = false;
      }
    });
  }

  /**
   * Open Razorpay checkout modal
   */
  openRazorpayCheckout(order: any): void {
    const user = this.authService.currentUserValue;
    
    const options = {
      key: order.keyId,
      amount: order.amount,
      currency: order.currency,
      name: 'Healthcare Platform',
      description: 'Doctor Monthly Subscription',
      order_id: order.orderId,
      prefill: {
        name: user?.name || '',
        email: user?.email || '',
        contact: ''
      },
      theme: {
        color: '#4CAF50'
      },
      handler: (response: any) => {
        this.handleRazorpaySuccess(response);
      },
      modal: {
        ondismiss: () => {
          this.loading = false;
          this.error = 'Payment cancelled. Please try again to activate your subscription.';
        }
      }
    };

    const razorpay = new Razorpay(options);
    razorpay.open();
  }

  /**
   * Handle successful Razorpay payment
   */
  handleRazorpaySuccess(response: any): void {
    const paymentData = {
      orderId: response.razorpay_order_id,
      paymentId: response.razorpay_payment_id,
      signature: response.razorpay_signature
    };

    this.subscriptionService.verifyPayment(paymentData).subscribe({
      next: (verifyResponse) => {
        if (verifyResponse.success) {
          this.loading = false;
          alert('Subscription activated successfully! Redirecting to dashboard...');
          this.router.navigate(['/doctor-dashboard']);
        } else {
          this.error = verifyResponse.message || 'Payment verification failed';
          this.loading = false;
        }
      },
      error: (error) => {
        console.error('Error verifying payment:', error);
        this.error = error.error?.message || 'Payment verification failed. Please contact support.';
        this.loading = false;
      }
    });
  }

  /**
   * Navigate to dashboard
   */
  goToDashboard(): void {
    this.router.navigate(['/doctor-dashboard']);
  }

  /**
   * Navigate back to login
   */
  goToLogin(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
