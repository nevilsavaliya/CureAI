import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { BaseComponent } from '../base/base.component';
import { ErrorHandlerService } from '../../services/error-handler.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent extends BaseComponent implements OnInit {
  loginForm!: FormGroup;

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private router: Router,
    protected override errorHandler: ErrorHandlerService,
    protected override toastService: ToastService
  ) {
    super(errorHandler, toastService);
  }

  ngOnInit(): void {
    // Redirect if already logged in
    if (this.authService.isLoggedIn()) {
      this.redirectBasedOnRole();
    }

    this.loginForm = this.formBuilder.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]]
    });
  }

  get f() {
    return this.loginForm.controls;
  }

  onSubmit(): void {
    this.clearError();

    if (this.loginForm.invalid) {
      this.error = 'Please fill in all required fields correctly.';
      return;
    }

    this.setLoading(true);
    const { email, password } = this.loginForm.value;

    const sub = this.authService.login(email, password).subscribe({
      next: (response) => {
        this.setLoading(false);
        if (response.success) {
          this.showSuccess('Login successful!');
          this.redirectBasedOnRole();
        } else {
          this.error = response.message || 'Login failed. Please try again.';
        }
      },
      error: (error) => {
        this.handleError(error, 'authentication');
      }
    });

    this.addSubscription(sub);
  }

  private redirectBasedOnRole(): void {
    const role = this.authService.getUserRole();
    switch (role) {
      case 'patient':
        this.router.navigate(['/patient/dashboard']);
        break;
      case 'doctor':
        this.router.navigate(['/doctor/dashboard']);
        break;
      case 'admin':
        this.router.navigate(['/admin/dashboard']);
        break;
      default:
        this.router.navigate(['/']);
    }
  }

  retryLogin(): void {
    this.onSubmit();
  }
}
