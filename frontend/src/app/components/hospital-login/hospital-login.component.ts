import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { HospitalService } from '../../services/hospital.service';

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

  constructor(
    private formBuilder: FormBuilder,
    private hospitalService: HospitalService,
    private router: Router
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

  onSubmit(): void {
    this.errorMessage = '';
    this.verificationMessage = '';
    this.verificationStatus = null;

    if (this.loginForm.invalid) {
      return;
    }

    this.loading = true;
    const { email, password, rememberMe } = this.loginForm.value;

    this.hospitalService.loginHospital(email, password, rememberMe).subscribe({
      next: (response) => {
        this.loading = false;
        
        if (response.success && response.token && response.hospital) {
          // Store token and hospital data
          if (rememberMe) {
            localStorage.setItem('hospitalToken', response.token);
            localStorage.setItem('hospitalData', JSON.stringify(response.hospital));
          } else {
            sessionStorage.setItem('hospitalToken', response.token);
            sessionStorage.setItem('hospitalData', JSON.stringify(response.hospital));
          }
          
          // Redirect to hospital dashboard
          this.router.navigate(['/hospital/dashboard']);
        } else if (response.verificationStatus) {
          // Handle verification status messages
          this.verificationStatus = response.verificationStatus;
          
          if (response.verificationStatus === 'pending') {
            this.verificationMessage = 'Your hospital registration is pending verification. Please wait for admin approval.';
          } else if (response.verificationStatus === 'rejected') {
            this.verificationMessage = `Your hospital registration has been rejected. Reason: ${response.rejectionReason || 'Not specified'}`;
          }
        }
      },
      error: (error) => {
        this.loading = false;
        this.errorMessage = error.error?.message || 'Login failed. Please check your credentials and try again.';
      }
    });
  }
}
