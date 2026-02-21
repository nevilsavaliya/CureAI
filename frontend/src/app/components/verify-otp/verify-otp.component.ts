import { Component, OnInit, ViewChildren, QueryList, ElementRef, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-verify-otp',
  templateUrl: './verify-otp.component.html',
  styleUrls: ['./verify-otp.component.css']
})
export class VerifyOtpComponent implements OnInit, OnDestroy {
  @ViewChildren('otpInput') otpInputs!: QueryList<ElementRef>;

  otpDigits: string[] = ['', '', '', '', '', ''];
  email = '';
  type = ''; // 'signup' or 'forgot-password'
  role = ''; // 'patient' or 'doctor'
  loading = false;
  errorMessage = '';
  successMessage = '';
  resendLoading = false;
  resendCountdown = 60; // 60 seconds countdown
  verified = false;
  hasError = false;
  
  private countdownInterval: any;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService
  ) { }

  ngOnInit(): void {
    // Get email, type, and role from query params
    this.route.queryParams.subscribe(params => {
      this.email = params['email'] || '';
      this.type = params['type'] || '';
      this.role = params['role'] || '';

      if (!this.email || !this.type) {
        this.errorMessage = 'Invalid verification link';
      }
    });

    // Start countdown timer
    this.startCountdown();

    // Auto-focus first input after view init
    setTimeout(() => {
      this.focusInput(0);
    }, 100);
  }

  ngOnDestroy(): void {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
    }
  }

  startCountdown(): void {
    this.resendCountdown = 60;
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
    }
    
    this.countdownInterval = setInterval(() => {
      this.resendCountdown--;
      if (this.resendCountdown <= 0) {
        clearInterval(this.countdownInterval);
      }
    }, 1000);
  }

  focusInput(index: number): void {
    const inputs = this.otpInputs?.toArray();
    if (inputs && inputs[index]) {
      inputs[index].nativeElement.focus();
    }
  }

  onDigitInput(event: any, index: number): void {
    const value = event.target.value;
    
    // Only allow numbers
    const numericValue = value.replace(/[^0-9]/g, '');
    this.otpDigits[index] = numericValue.slice(-1); // Take only last digit
    
    // Clear error state when user starts typing
    this.hasError = false;
    this.errorMessage = '';

    // Auto-advance to next input
    if (numericValue && index < 5) {
      this.focusInput(index + 1);
    }

    // Auto-submit when all digits are filled
    if (this.isOtpComplete() && index === 5) {
      setTimeout(() => {
        this.onSubmit();
      }, 100);
    }
  }

  onKeyDown(event: KeyboardEvent, index: number): void {
    // Handle backspace
    if (event.key === 'Backspace') {
      if (!this.otpDigits[index] && index > 0) {
        // Move to previous input if current is empty
        this.focusInput(index - 1);
      } else {
        // Clear current input
        this.otpDigits[index] = '';
      }
      this.hasError = false;
      this.errorMessage = '';
    }
    
    // Handle arrow keys
    if (event.key === 'ArrowLeft' && index > 0) {
      event.preventDefault();
      this.focusInput(index - 1);
    }
    
    if (event.key === 'ArrowRight' && index < 5) {
      event.preventDefault();
      this.focusInput(index + 1);
    }
  }

  onPaste(event: ClipboardEvent): void {
    event.preventDefault();
    const pastedData = event.clipboardData?.getData('text') || '';
    const numericData = pastedData.replace(/[^0-9]/g, '').slice(0, 6);
    
    // Fill in the digits
    for (let i = 0; i < numericData.length && i < 6; i++) {
      this.otpDigits[i] = numericData[i];
    }
    
    // Focus the next empty input or last input
    const nextEmptyIndex = this.otpDigits.findIndex(d => !d);
    if (nextEmptyIndex !== -1) {
      this.focusInput(nextEmptyIndex);
    } else {
      this.focusInput(5);
      // Auto-submit if all digits are filled
      if (this.isOtpComplete()) {
        setTimeout(() => {
          this.onSubmit();
        }, 100);
      }
    }
  }

  isOtpComplete(): boolean {
    return this.otpDigits.every(digit => digit !== '');
  }

  getOtpString(): string {
    return this.otpDigits.join('');
  }

  onSubmit(): void {
    this.errorMessage = '';
    this.successMessage = '';
    this.hasError = false;

    if (!this.isOtpComplete()) {
      this.errorMessage = 'Please enter all 6 digits';
      this.hasError = true;
      return;
    }

    this.loading = true;

    if (this.type === 'signup') {
      this.verifySignupOtp();
    } else if (this.type === 'forgot-password') {
      this.verifyForgotPasswordOtp();
    }
  }

  verifySignupOtp(): void {
    const signupData = sessionStorage.getItem('signupData');
    
    if (!signupData) {
      this.loading = false;
      this.errorMessage = 'Session expired. Please sign up again.';
      this.hasError = true;
      return;
    }

    const userData = JSON.parse(signupData);
    userData.otp = this.getOtpString();

    const verifyMethod = this.role === 'patient' 
      ? this.authService.signupPatient(userData)
      : this.authService.signupDoctor(userData);

    verifyMethod.subscribe({
      next: (response) => {
        this.loading = false;
        
        if (response.success && response.token && response.user) {
          localStorage.setItem('token', response.token);
          localStorage.setItem('user', JSON.stringify(response.user));
          sessionStorage.removeItem('signupData');
          sessionStorage.removeItem('signupEmail');
          
          this.verified = true;
          this.successMessage = 'Account verified successfully! Redirecting...';
          
          setTimeout(() => {
            if (this.role === 'patient') {
              this.router.navigate(['/patient/dashboard']);
            } else {
              // Redirect doctors to payment page instead of subscription
              this.router.navigate(['/doctor/payment']);
            }
          }, 2000);
        } else {
          this.errorMessage = response.message || 'Verification failed';
          this.hasError = true;
        }
      },
      error: (error) => {
        this.loading = false;
        this.errorMessage = error.error?.message || 'Verification failed. Please try again.';
        this.hasError = true;
      }
    });
  }

  verifyForgotPasswordOtp(): void {
    // TODO: Implement forgot password OTP verification
    this.loading = false;
    this.errorMessage = 'Forgot password OTP verification not yet implemented';
    this.hasError = true;
  }

  resendOtp(): void {
    this.errorMessage = '';
    this.successMessage = '';
    this.hasError = false;
    this.resendLoading = true;

    if (this.type === 'signup') {
      const signupData = sessionStorage.getItem('signupData');
      
      if (!signupData) {
        this.resendLoading = false;
        this.errorMessage = 'Session expired. Please sign up again.';
        this.hasError = true;
        return;
      }

      const userData = JSON.parse(signupData);
      
      const resendMethod = this.role === 'patient'
        ? this.authService.signupPatient(userData)
        : this.authService.signupDoctor(userData);

      resendMethod.subscribe({
        next: (response) => {
          this.resendLoading = false;
          if (response.requiresOTP) {
            this.successMessage = 'OTP resent successfully!';
            this.startCountdown();
            // Clear success message after 3 seconds
            setTimeout(() => {
              this.successMessage = '';
            }, 3000);
          }
        },
        error: (error) => {
          this.resendLoading = false;
          this.errorMessage = error.error?.message || 'Failed to resend OTP';
          this.hasError = true;
        }
      });
    } else if (this.type === 'forgot-password') {
      // TODO: Implement forgot password OTP resend
      this.resendLoading = false;
      this.errorMessage = 'Forgot password OTP resend not yet implemented';
      this.hasError = true;
    }
  }

  onOtpInput(event: any): void {
    // Legacy method - kept for compatibility but not used with new design
  }
}
