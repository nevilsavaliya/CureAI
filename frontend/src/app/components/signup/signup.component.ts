import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-signup',
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.css']
})
export class SignupComponent implements OnInit {
  signupForm!: FormGroup;
  loading = false;
  errorMessage = '';
  successMessage = '';
  selectedRole = 'patient';

  roles = [
    { value: 'patient', label: 'Patient' },
    { value: 'doctor', label: 'Doctor' }
  ];

  bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];
  
  specialities = [
    'General Medicine',
    'Cardiology',
    'Neurology',
    'Orthopedics',
    'Dermatology',
    'Pediatrics',
    'Psychiatry',
    'Internal Medicine'
  ];

  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.signupForm = this.formBuilder.group({
      role: ['patient', [Validators.required]],
      name: ['', [Validators.required]],
      dateOfBirth: ['', [Validators.required, SignupComponent.dateOfBirthValidator]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]],
      // Patient-specific fields
      bloodGroup: [''],
      // Doctor-specific fields
      degree: [''],
      speciality: [''],
      experienceYears: ['']
    }, { validators: SignupComponent.passwordMatchValidator });

    // Listen to role changes
    this.signupForm.get('role')?.valueChanges.subscribe(role => {
      this.selectedRole = role;
      this.updateValidators();
    });

    // Initialize validators
    this.updateValidators();
  }

  // Custom validator to check if passwords match
  static passwordMatchValidator(control: AbstractControl): ValidationErrors | null {
    const password = control.get('password');
    const confirmPassword = control.get('confirmPassword');

    if (!password || !confirmPassword) {
      return null;
    }

    return password.value === confirmPassword.value ? null : { passwordMismatch: true };
  }

  // Custom validator to check if date of birth is not in the future
  static dateOfBirthValidator(control: AbstractControl): ValidationErrors | null {
    if (!control.value) {
      return null;
    }

    const selectedDate = new Date(control.value);
    const today = new Date();
    
    // Set time to midnight for accurate comparison
    today.setHours(0, 0, 0, 0);
    selectedDate.setHours(0, 0, 0, 0);

    if (selectedDate > today) {
      return { futureDate: true };
    }

    // Optional: Check if date is too far in the past (e.g., more than 150 years)
    const minDate = new Date();
    minDate.setFullYear(minDate.getFullYear() - 150);
    minDate.setHours(0, 0, 0, 0);

    if (selectedDate < minDate) {
      return { tooOld: true };
    }

    return null;
  }

  // Get max date for date picker (today)
  get maxDate(): string {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // Get min date for date picker (150 years ago)
  get minDate(): string {
    const minDate = new Date();
    minDate.setFullYear(minDate.getFullYear() - 150);
    const year = minDate.getFullYear();
    const month = String(minDate.getMonth() + 1).padStart(2, '0');
    const day = String(minDate.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  updateValidators(): void {
    const bloodGroupControl = this.signupForm.get('bloodGroup');
    const degreeControl = this.signupForm.get('degree');
    const specialityControl = this.signupForm.get('speciality');
    const experienceYearsControl = this.signupForm.get('experienceYears');

    if (this.selectedRole === 'patient') {
      // Patient: bloodGroup required
      bloodGroupControl?.setValidators([Validators.required]);
      degreeControl?.clearValidators();
      specialityControl?.clearValidators();
      experienceYearsControl?.clearValidators();
    } else if (this.selectedRole === 'doctor') {
      // Doctor: degree, speciality, experienceYears required
      bloodGroupControl?.clearValidators();
      degreeControl?.setValidators([Validators.required]);
      specialityControl?.setValidators([Validators.required]);
      experienceYearsControl?.setValidators([Validators.required, Validators.min(0)]);
    }

    bloodGroupControl?.updateValueAndValidity();
    degreeControl?.updateValueAndValidity();
    specialityControl?.updateValueAndValidity();
    experienceYearsControl?.updateValueAndValidity();
  }

  get f() {
    return this.signupForm.controls;
  }

  onSubmit(): void {
    this.errorMessage = '';
    this.successMessage = '';

    if (this.signupForm.invalid) {
      Object.keys(this.signupForm.controls).forEach(key => {
        this.signupForm.get(key)?.markAsTouched();
      });
      return;
    }

    this.loading = true;
    const formData = this.signupForm.value;

    if (formData.role === 'patient') {
      this.authService.signupPatient(formData).subscribe({
        next: (response) => {
          this.loading = false;
          if (response.success && response.token && response.user) {
            // Store token and redirect to patient dashboard
            localStorage.setItem('token', response.token);
            localStorage.setItem('user', JSON.stringify(response.user));
            this.successMessage = 'Registration successful! Redirecting...';
            setTimeout(() => {
              this.router.navigate(['/patient/dashboard']);
            }, 1000);
          }
        },
        error: (error) => {
          this.loading = false;
          this.errorMessage = error.error?.message || 'Registration failed. Please try again.';
        }
      });
    } else if (formData.role === 'doctor') {
      this.authService.signupDoctor(formData).subscribe({
        next: (response) => {
          this.loading = false;
          if (response.success && response.token && response.user) {
            // Store token and redirect to subscription page
            localStorage.setItem('token', response.token);
            localStorage.setItem('user', JSON.stringify(response.user));
            this.successMessage = 'Registration successful! Redirecting to subscription...';
            setTimeout(() => {
              this.router.navigate(['/subscription']);
            }, 1000);
          }
        },
        error: (error) => {
          this.loading = false;
          this.errorMessage = error.error?.message || 'Registration failed. Please try again.';
        }
      });
    }
  }
}
