import { Component, EventEmitter, Input, Output, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AdminService } from '../../services/admin.service';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-add-admin-modal',
  templateUrl: './add-admin-modal.component.html',
  styleUrls: ['./add-admin-modal.component.css']
})
export class AddAdminModalComponent implements OnInit, OnDestroy {
  @Input() isVisible: boolean = false;
  @Output() adminAdded = new EventEmitter<any>();
  @Output() cancelled = new EventEmitter<void>();

  adminForm: FormGroup;
  loading: boolean = false;
  error: string = '';
  success: string = '';
  
  private destroy$ = new Subject<void>();

  constructor(
    private formBuilder: FormBuilder,
    private adminService: AdminService
  ) {
    this.adminForm = this.createForm();
  }

  ngOnInit(): void {
    // Reset form when modal becomes visible
    if (this.isVisible) {
      this.resetForm();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private createForm(): FormGroup {
    return this.formBuilder.group({
      name: ['', [
        Validators.required,
        Validators.minLength(2),
        Validators.maxLength(50),
        Validators.pattern(/^[a-zA-Z\s]+$/)
      ]],
      email: ['', [
        Validators.required,
        Validators.email,
        Validators.maxLength(100)
      ]],
      password: ['', [
        Validators.required,
        Validators.minLength(8),
        Validators.maxLength(128),
        Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
      ]],
      confirmPassword: ['', [Validators.required]]
    }, {
      validators: this.passwordMatchValidator
    });
  }

  private passwordMatchValidator(form: FormGroup) {
    const password = form.get('password');
    const confirmPassword = form.get('confirmPassword');
    
    if (password && confirmPassword && password.value !== confirmPassword.value) {
      confirmPassword.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    }
    
    if (confirmPassword?.hasError('passwordMismatch')) {
      const errors = { ...confirmPassword.errors };
      delete errors['passwordMismatch'];
      confirmPassword.setErrors(Object.keys(errors).length ? errors : null);
    }
    
    return null;
  }

  // Form validation helpers
  isFieldInvalid(fieldName: string): boolean {
    const field = this.adminForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getFieldError(fieldName: string): string {
    const field = this.adminForm.get(fieldName);
    if (!field || !field.errors || !this.isFieldInvalid(fieldName)) {
      return '';
    }

    const errors = field.errors;
    
    switch (fieldName) {
      case 'name':
        if (errors['required']) return 'Name is required';
        if (errors['minlength']) return 'Name must be at least 2 characters';
        if (errors['maxlength']) return 'Name cannot exceed 50 characters';
        if (errors['pattern']) return 'Name can only contain letters and spaces';
        break;
        
      case 'email':
        if (errors['required']) return 'Email is required';
        if (errors['email']) return 'Please enter a valid email address';
        if (errors['maxlength']) return 'Email cannot exceed 100 characters';
        if (errors['emailExists']) return 'This email is already registered';
        break;
        
      case 'password':
        if (errors['required']) return 'Password is required';
        if (errors['minlength']) return 'Password must be at least 8 characters';
        if (errors['maxlength']) return 'Password cannot exceed 128 characters';
        if (errors['pattern']) return 'Password must contain uppercase, lowercase, number, and special character';
        break;
        
      case 'confirmPassword':
        if (errors['required']) return 'Please confirm your password';
        if (errors['passwordMismatch']) return 'Passwords do not match';
        break;
    }
    
    return 'Invalid input';
  }

  // Email uniqueness validation
  private validateEmailUniqueness(email: string): void {
    if (!email || !this.adminForm.get('email')?.valid) {
      return;
    }

    this.adminService.getUsers('admins', { search: email })
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          if (response.success && response.users) {
            const existingAdmin = response.users.find((admin: any) => 
              admin.email.toLowerCase() === email.toLowerCase()
            );
            
            if (existingAdmin) {
              const emailControl = this.adminForm.get('email');
              if (emailControl) {
                emailControl.setErrors({ emailExists: true });
              }
            }
          }
        },
        error: (error) => {
          console.error('Error checking email uniqueness:', error);
        }
      });
  }

  onEmailBlur(): void {
    const email = this.adminForm.get('email')?.value;
    if (email) {
      this.validateEmailUniqueness(email);
    }
  }

  // Form submission
  onSubmit(): void {
    if (this.adminForm.invalid) {
      this.markAllFieldsAsTouched();
      return;
    }

    this.createAdmin();
  }

  private markAllFieldsAsTouched(): void {
    Object.keys(this.adminForm.controls).forEach(key => {
      this.adminForm.get(key)?.markAsTouched();
    });
  }

  private createAdmin(): void {
    this.loading = true;
    this.error = '';
    this.success = '';

    const formData = this.adminForm.value;
    const adminData = {
      name: formData.name.trim(),
      email: formData.email.toLowerCase().trim(),
      password: formData.password
    };

    this.adminService.addAdmin(adminData)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response) => {
          this.loading = false;
          
          if (response.success) {
            this.success = 'Admin user created successfully!';
            
            // Emit success event with the new admin data
            this.adminAdded.emit({
              admin: response.data?.admin || response.data,
              message: response.message || 'Admin created successfully'
            });
            
            // Close modal after a brief delay to show success message
            setTimeout(() => {
              this.closeModal();
            }, 1500);
          } else {
            this.error = response.message || 'Failed to create admin user';
          }
        },
        error: (error) => {
          this.loading = false;
          console.error('Error creating admin:', error);
          
          if (error.error?.code === 'ADMIN_006') {
            // Handle duplicate email error
            const emailControl = this.adminForm.get('email');
            if (emailControl) {
              emailControl.setErrors({ emailExists: true });
            }
            this.error = 'An admin with this email already exists';
          } else {
            this.error = error.error?.message || 'Failed to create admin user. Please try again.';
          }
        }
      });
  }

  // Modal actions
  closeModal(): void {
    this.resetForm();
    this.cancelled.emit();
  }

  private resetForm(): void {
    this.adminForm.reset();
    this.loading = false;
    this.error = '';
    this.success = '';
    
    // Reset form validation state
    Object.keys(this.adminForm.controls).forEach(key => {
      const control = this.adminForm.get(key);
      if (control) {
        control.setErrors(null);
        control.markAsUntouched();
        control.markAsPristine();
      }
    });
  }

  // Utility methods
  isFormValid(): boolean {
    return this.adminForm.valid;
  }

  hasFormErrors(): boolean {
    return this.adminForm.invalid && this.adminForm.touched;
  }

  getPasswordStrength(): string {
    const password = this.adminForm.get('password')?.value || '';
    
    if (password.length === 0) return '';
    if (password.length < 8) return 'weak';
    
    let score = 0;
    if (/[a-z]/.test(password)) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/\d/.test(password)) score++;
    if (/[@$!%*?&]/.test(password)) score++;
    
    if (score < 3) return 'weak';
    if (score === 3) return 'medium';
    return 'strong';
  }

  getPasswordStrengthClass(): string {
    const strength = this.getPasswordStrength();
    switch (strength) {
      case 'weak': return 'password-weak';
      case 'medium': return 'password-medium';
      case 'strong': return 'password-strong';
      default: return '';
    }
  }
}