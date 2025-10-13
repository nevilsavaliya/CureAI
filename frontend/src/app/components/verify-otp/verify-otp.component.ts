import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-verify-otp',
  templateUrl: './verify-otp.component.html',
  styleUrls: ['./verify-otp.component.css']
})
export class VerifyOtpComponent implements OnInit {
  otp = '';
  email = '';
  type = ''; // 'signup' or 'forgot-password'
  role = ''; // 'patient' or 'doctor'
  loading = false;
  errorMessage = '';
  successMessage = '';
  resendLoading = false;

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
  }

  onSubmit(): void {
    this.errorMessage = '';
    this.successMessage = '';

    if (!this.otp || this.otp.length !== 6) {
      this.errorMessage = 'Please enter a valid 6-digit OTP';
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
      return;
    }

    const userData = JSON.parse(signupData);
    userData.otp = this.otp;

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
          
          this.successMessage = 'Account verified successfully! Redirecting...';
          
          setTimeout(() => {
            if (this.role === 'patient') {
              this.router.navigate(['/patient/dashboard']);
            } else {
              this.router.navigate(['/subscription']);
            }
          }, 1000);
        } else {
          this.errorMessage = response.message || 'Verification failed';
        }
      },
      error: (error) => {
        this.loading = false;
        this.errorMessage = error.error?.message || 'Verification failed. Please try again.';
      }
    });
  }

  verifyForgotPasswordOtp(): void {
    // TODO: Implement forgot password OTP verification
    this.loading = false;
    this.errorMessage = 'Forgot password OTP verification not yet implemented';
  }

  resendOtp(): void {
    this.errorMessage = '';
    this.successMessage = '';
    this.resendLoading = true;

    if (this.type === 'signup') {
      const signupData = sessionStorage.getItem('signupData');
      
      if (!signupData) {
        this.resendLoading = false;
        this.errorMessage = 'Session expired. Please sign up again.';
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
          }
        },
        error: (error) => {
          this.resendLoading = false;
          this.errorMessage = error.error?.message || 'Failed to resend OTP';
        }
      });
    } else if (this.type === 'forgot-password') {
      // TODO: Implement forgot password OTP resend
      this.resendLoading = false;
      this.errorMessage = 'Forgot password OTP resend not yet implemented';
    }
  }

  onOtpInput(event: any): void {
    // Only allow numbers
    const value = event.target.value.replace(/[^0-9]/g, '');
    this.otp = value.slice(0, 6);
  }
}
