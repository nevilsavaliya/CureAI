import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../config/environment';

@Component({
  selector: 'app-forgot-password',
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.css']
})
export class ForgotPasswordComponent {
  step: number = 1; // 1: Email, 2: OTP, 3: New Password
  email: string = '';
  otp: string = '';
  newPassword: string = '';
  confirmPassword: string = '';
  loading: boolean = false;
  message: string = '';
  error: string = '';

  constructor(
    private http: HttpClient,
    private router: Router
  ) {}

  requestOTP(): void {
    if (!this.email) {
      this.error = 'Please enter your email';
      return;
    }

    this.loading = true;
    this.error = '';
    this.message = '';
    
    this.http.post(`${environment.apiUrl}/password/request-otp`, { email: this.email })
      .subscribe({
        next: (response: any) => {
          this.loading = false;
          if (response.success) {
            this.message = response.message;
            this.step = 2;
          }
        },
        error: (error) => {
          this.loading = false;
          this.error = error.error?.message || 'Failed to send OTP';
        }
      });
  }

  verifyOTP(): void {
    if (!this.otp || this.otp.length !== 6) {
      this.error = 'Please enter 6-digit OTP';
      return;
    }

    this.loading = true;
    this.error = '';
    this.message = '';
    
    this.http.post(`${environment.apiUrl}/password/verify-otp`, { 
      email: this.email, 
      otp: this.otp 
    }).subscribe({
      next: (response: any) => {
        this.loading = false;
        if (response.success) {
          this.message = 'OTP verified! Set your new password';
          this.step = 3;
        }
      },
      error: (error) => {
        this.loading = false;
        this.error = error.error?.message || 'Invalid OTP';
      }
    });
  }

  resetPassword(): void {
    if (!this.newPassword || this.newPassword.length < 6) {
      this.error = 'Password must be at least 6 characters';
      return;
    }

    if (this.newPassword !== this.confirmPassword) {
      this.error = 'Passwords do not match';
      return;
    }

    this.loading = true;
    this.error = '';
    this.message = '';
    
    this.http.post(`${environment.apiUrl}/password/reset-password`, {
      email: this.email,
      otp: this.otp,
      newPassword: this.newPassword
    }).subscribe({
      next: (response: any) => {
        this.loading = false;
        if (response.success) {
          alert('Password reset successfully! You can now login.');
          this.router.navigate(['/login']);
        }
      },
      error: (error) => {
        this.loading = false;
        this.error = error.error?.message || 'Failed to reset password';
      }
    });
  }

  goBack(): void {
    if (this.step > 1) {
      this.step--;
      this.error = '';
      this.message = '';
    } else {
      this.router.navigate(['/login']);
    }
  }
}
