import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { HospitalService } from '../../services/hospital.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-hospital-login',
  templateUrl: './hospital-login.component.html',
  styleUrls: ['./hospital-login.component.css']
})
export class HospitalLoginComponent implements OnInit {
  loginForm!: FormGroup;
  loading = false;
  errorMessage = '';
  verificationMessage = '';
  verificationStatus: 'pending' | 'verified' | 'rejected' | null = null;
  private lastSubmitTime = 0;
  private readonly SUBMIT_DEBOUNCE_TIME = 1000; // 1 second

  constructor(
    private formBuilder: FormBuilder,
    private hospitalService: HospitalService,
    private router: Router,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    // Check if already logged in as hospital
    const token = localStorage.getItem('hospitalToken');
    if (token) {
      this.router.navigate(['/hospital/dashboard']);
    }

    this.loginForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      rememberMe: [false]
    });
  }

  get f() {
    return this.loginForm.controls;
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
    });
  }

  onSubmit(): void {
    // Prevent multiple submissions with debounce
    const currentTime = Date.now();
    if (this.loading) {
      console.log('⚠️ Login already in progress, ignoring duplicate submission');
      return;
    }
    
    if (currentTime - this.lastSubmitTime < this.SUBMIT_DEBOUNCE_TIME) {
      console.log('⚠️ Submit too soon after last attempt, ignoring');
      this.toastService.warning('Please wait a moment before trying again.');
      return;
    }
    
    this.lastSubmitTime = currentTime;

    this.errorMessage = '';
    this.verificationMessage = '';
    this.verificationStatus = null;

    if (this.loginForm.invalid) {
      this.markFormGroupTouched(this.loginForm);
      return;
    }

    this.loading = true;
    const { email, password, rememberMe } = this.loginForm.value;

    console.log('🚀 Starting hospital login request...', { email, passwordLength: password.length, rememberMe });
    
    this.hospitalService.loginHospital(email, password, rememberMe).subscribe({
      next: (response) => {
        console.log('✅ Hospital login response received:', {
          success: response.success,
          hasToken: !!response.token,
          hasHospital: !!response.hospital,
          message: response.message,
          verificationStatus: response.verificationStatus,
          fullResponse: response
        });
        
        this.loading = false;
        
        if (response.success && response.token && response.hospital) {
          console.log('✅ Login successful, storing data and redirecting...');
          console.log('🏥 Hospital data:', {
            id: response.hospital.id,
            name: response.hospital.hospitalName,
            email: response.hospital.email,
            verificationStatus: response.hospital.verificationStatus
          });
          console.log('🔍 Full hospital object from backend:', response.hospital);
          
          // Show success message
          this.toastService.success(`Welcome back, ${response.hospital.hospitalName || response.hospital.name}!`);
          
          // Store token and hospital data
          if (rememberMe) {
            console.log('💾 Storing in localStorage (remember me = true)');
            localStorage.setItem('hospitalToken', response.token);
            localStorage.setItem('hospitalData', JSON.stringify(response.hospital));
          } else {
            console.log('💾 Storing in sessionStorage (remember me = false)');
            sessionStorage.setItem('hospitalToken', response.token);
            sessionStorage.setItem('hospitalData', JSON.stringify(response.hospital));
          }
          
          console.log('🔄 Navigating to hospital dashboard...');
          // Redirect to hospital dashboard
          this.router.navigate(['/hospital/dashboard']).then(
            (success) => {
              console.log('✅ Navigation result:', success);
              if (!success) {
                console.log('❌ Navigation failed - check routing configuration');
                this.toastService.error('Navigation failed. Please try accessing the dashboard directly.');
              }
            }
          ).catch(
            (error) => {
              console.log('❌ Navigation error:', error);
              this.toastService.error('Navigation error. Please try again.');
            }
          );
        } else if (response.verificationStatus) {
          console.log('⚠️ Hospital not verified:', response.verificationStatus);
          // Handle verification status messages
          this.verificationStatus = response.verificationStatus;
          
          if (response.verificationStatus === 'pending') {
            this.verificationMessage = 'Your hospital registration is pending verification. Please wait for admin approval.';
          } else if (response.verificationStatus === 'rejected') {
            this.verificationMessage = `Your hospital registration has been rejected. Reason: ${response.rejectionReason || 'Not specified'}`;
          }
        } else {
          console.log('❌ Unexpected response format:', response);
          this.errorMessage = 'Login response was invalid. Please try again.';
        }
      },
      error: (error) => {
        console.log('❌ Hospital login error:', {
          status: error.status,
          message: error.message,
          errorData: error.error
        });
        
        this.loading = false;
        
        // Provide more specific error messages
        if (error.status === 401) {
          this.errorMessage = 'Invalid email or password. Please check your credentials and try again.';
          this.toastService.error('Invalid credentials. Please check your email and password.');
        } else if (error.status === 429) {
          this.errorMessage = 'Too many login attempts. Please wait a few minutes before trying again.';
          this.toastService.warning('Too many attempts. Please wait before trying again.');
        } else if (error.status === 0) {
          this.errorMessage = 'Unable to connect to the server. Please check your internet connection.';
          this.toastService.error('Connection failed. Please check your internet connection.');
        } else {
          this.errorMessage = error.error?.message || 'Login failed. Please try again later.';
          this.toastService.error('Login failed. Please try again.');
        }
      }
    });
  }
}
