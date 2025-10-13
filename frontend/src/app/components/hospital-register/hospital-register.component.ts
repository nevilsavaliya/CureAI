import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { HospitalService } from '../../services/hospital.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-hospital-register',
  templateUrl: './hospital-register.component.html',
  styleUrls: ['./hospital-register.component.css']
})
export class HospitalRegisterComponent implements OnInit {
  currentStep = 1;
  totalSteps = 5;
  
  // Form groups for each step
  basicInfoForm!: FormGroup;
  hospitalDetailsForm!: FormGroup;
  contactAddressForm!: FormGroup;
  specializationsForm!: FormGroup;
  documentsForm!: FormGroup;
  
  // Options for dropdowns
  specializations = [
    'Cardiology', 'Neurology', 'Orthopedics', 'Pediatrics', 'Oncology',
    'Dermatology', 'Psychiatry', 'Radiology', 'Emergency Medicine',
    'General Surgery', 'Internal Medicine', 'Obstetrics & Gynecology'
  ];
  
  facilities = [
    'ICU', 'Emergency Room', 'Operating Theater', 'Laboratory',
    'Radiology', 'Pharmacy', 'Blood Bank', 'Ambulance Service',
    'Dialysis Unit', 'Maternity Ward', 'Pediatric Ward', 'Cafeteria'
  ];
  
  selectedSpecializations: string[] = [];
  selectedFacilities: string[] = [];
  
  // Document upload
  uploadedDocuments: File[] = [];
  
  isSubmitting = false;
  showPassword = false;
  showConfirmPassword = false;
  registrationSuccess = false;
  registeredEmail = '';

  constructor(
    private fb: FormBuilder,
    private hospitalService: HospitalService,
    private router: Router,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    this.initializeForms();
  }

  initializeForms(): void {
    // Step 1: Basic Information
    this.basicInfoForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', Validators.required]
    }, { validators: this.passwordMatchValidator });

    // Step 2: Hospital Details
    this.hospitalDetailsForm = this.fb.group({
      hospitalName: ['', [Validators.required, Validators.minLength(3)]],
      registrationNumber: ['', [Validators.required, Validators.minLength(5)]],
      numberOfBeds: ['', [Validators.required, Validators.min(1)]],
      website: ['', Validators.pattern('https?://.+')]
    });

    // Step 3: Contact & Address
    this.contactAddressForm = this.fb.group({
      contactNumber: ['', [Validators.required, Validators.pattern('^[+]?[0-9]{10,15}$')]],
      emergencyContact: ['', [Validators.required, Validators.pattern('^[+]?[0-9]{10,15}$')]],
      street: ['', Validators.required],
      city: ['', Validators.required],
      state: ['', Validators.required],
      zipCode: ['', [Validators.required, Validators.pattern('^[0-9]{5,10}$')]],
      country: ['', Validators.required]
    });

    // Step 4: Specializations & Facilities
    this.specializationsForm = this.fb.group({
      specializations: [[]],
      facilities: [[]]
    });

    // Step 5: Documents
    this.documentsForm = this.fb.group({
      documents: [null]
    });
  }

  passwordMatchValidator(group: FormGroup): { [key: string]: boolean } | null {
    const password = group.get('password')?.value;
    const confirmPassword = group.get('confirmPassword')?.value;
    return password === confirmPassword ? null : { passwordMismatch: true };
  }

  getPasswordStrength(): string {
    const password = this.basicInfoForm.get('password')?.value || '';
    if (password.length === 0) return '';
    if (password.length < 8) return 'weak';
    
    let strength = 0;
    if (password.length >= 12) strength++;
    if (/[a-z]/.test(password)) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^a-zA-Z0-9]/.test(password)) strength++;
    
    if (strength <= 2) return 'weak';
    if (strength <= 3) return 'medium';
    return 'strong';
  }

  getPasswordStrengthColor(): string {
    const strength = this.getPasswordStrength();
    if (strength === 'weak') return '#ef4444';
    if (strength === 'medium') return '#f59e0b';
    if (strength === 'strong') return '#10b981';
    return '#d1d5db';
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPasswordVisibility(): void {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  toggleSpecialization(spec: string): void {
    const index = this.selectedSpecializations.indexOf(spec);
    if (index > -1) {
      this.selectedSpecializations.splice(index, 1);
    } else {
      this.selectedSpecializations.push(spec);
    }
    this.specializationsForm.patchValue({ specializations: this.selectedSpecializations });
  }

  toggleFacility(facility: string): void {
    const index = this.selectedFacilities.indexOf(facility);
    if (index > -1) {
      this.selectedFacilities.splice(index, 1);
    } else {
      this.selectedFacilities.push(facility);
    }
    this.specializationsForm.patchValue({ facilities: this.selectedFacilities });
  }

  onFileSelect(event: any): void {
    const files = event.target.files;
    const maxSize = 10 * 1024 * 1024; // 10MB in bytes
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    
    if (files) {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        
        // Validate file size
        if (file.size > maxSize) {
          this.toastService.error(`File "${file.name}" is too large. Maximum size is 10MB.`);
          continue;
        }
        
        // Validate file type
        if (!allowedTypes.includes(file.type)) {
          this.toastService.error(`File "${file.name}" has an invalid type. Only PDF, JPG, and PNG files are allowed.`);
          continue;
        }
        
        // Check for duplicates
        const isDuplicate = this.uploadedDocuments.some(doc => 
          doc.name === file.name && doc.size === file.size
        );
        
        if (isDuplicate) {
          this.toastService.warning(`File "${file.name}" is already uploaded.`);
          continue;
        }
        
        this.uploadedDocuments.push(file);
      }
      
      // Clear the input so the same file can be selected again if removed
      event.target.value = '';
    }
  }

  removeDocument(index: number): void {
    this.uploadedDocuments.splice(index, 1);
  }

  getCurrentForm(): FormGroup {
    switch (this.currentStep) {
      case 1: return this.basicInfoForm;
      case 2: return this.hospitalDetailsForm;
      case 3: return this.contactAddressForm;
      case 4: return this.specializationsForm;
      case 5: return this.documentsForm;
      default: return this.basicInfoForm;
    }
  }

  nextStep(): void {
    const currentForm = this.getCurrentForm();
    
    // Additional validation for Step 4
    if (this.currentStep === 4 && this.selectedSpecializations.length === 0) {
      this.toastService.error('Please select at least one specialization');
      return;
    }
    
    // Additional validation for Step 5
    if (this.currentStep === 5 && this.uploadedDocuments.length === 0) {
      this.toastService.error('Please upload at least one document');
      return;
    }
    
    if (currentForm.valid) {
      if (this.currentStep < this.totalSteps) {
        this.currentStep++;
      }
    } else {
      this.markFormGroupTouched(currentForm);
      this.toastService.error('Please fill in all required fields correctly');
    }
  }

  previousStep(): void {
    if (this.currentStep > 1) {
      this.currentStep--;
    }
  }

  markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
    });
  }

  getProgressPercentage(): number {
    return (this.currentStep / this.totalSteps) * 100;
  }

  async submitRegistration(): Promise<void> {
    // Validate all forms
    if (!this.validateAllForms()) {
      if (!this.basicInfoForm.valid) {
        this.currentStep = 1;
        this.toastService.error('Please complete Basic Information correctly');
      } else if (!this.hospitalDetailsForm.valid) {
        this.currentStep = 2;
        this.toastService.error('Please complete Hospital Details correctly');
      } else if (!this.contactAddressForm.valid) {
        this.currentStep = 3;
        this.toastService.error('Please complete Contact & Address correctly');
      } else if (this.selectedSpecializations.length === 0) {
        this.currentStep = 4;
        this.toastService.error('Please select at least one specialization');
      } else if (this.uploadedDocuments.length === 0) {
        this.currentStep = 5;
        this.toastService.error('Please upload at least one document');
      }
      return;
    }

    this.isSubmitting = true;

    try {
      // Prepare form data
      const formData = new FormData();
      
      // Basic info
      formData.append('name', this.basicInfoForm.value.name);
      formData.append('email', this.basicInfoForm.value.email);
      formData.append('password', this.basicInfoForm.value.password);
      
      // Hospital details
      formData.append('hospitalName', this.hospitalDetailsForm.value.hospitalName);
      formData.append('registrationNumber', this.hospitalDetailsForm.value.registrationNumber);
      formData.append('numberOfBeds', this.hospitalDetailsForm.value.numberOfBeds);
      if (this.hospitalDetailsForm.value.website) {
        formData.append('website', this.hospitalDetailsForm.value.website);
      }
      
      // Contact & Address
      formData.append('contactNumber', this.contactAddressForm.value.contactNumber);
      formData.append('emergencyContact', this.contactAddressForm.value.emergencyContact);
      formData.append('address[street]', this.contactAddressForm.value.street);
      formData.append('address[city]', this.contactAddressForm.value.city);
      formData.append('address[state]', this.contactAddressForm.value.state);
      formData.append('address[zipCode]', this.contactAddressForm.value.zipCode);
      formData.append('address[country]', this.contactAddressForm.value.country);
      
      // Specializations & Facilities
      formData.append('specializations', JSON.stringify(this.selectedSpecializations));
      formData.append('facilities', JSON.stringify(this.selectedFacilities));
      
      // Documents
      this.uploadedDocuments.forEach((file, index) => {
        formData.append('documents', file, file.name);
      });

      this.hospitalService.registerHospital(formData).subscribe({
        next: (response) => {
          this.isSubmitting = false;
          if (response.success) {
            this.registrationSuccess = true;
            this.registeredEmail = this.basicInfoForm.value.email;
            this.toastService.success('Registration submitted successfully!');
          }
        },
        error: (error) => {
          this.isSubmitting = false;
          const errorMessage = error.error?.message || 'Registration failed. Please try again.';
          this.toastService.error(errorMessage);
        }
      });
    } catch (error) {
      this.isSubmitting = false;
      this.toastService.error('An error occurred during registration');
    }
  }

  goToLogin(): void {
    this.router.navigate(['/hospital/login']);
  }

  // Helper methods for validation
  isFieldInvalid(formGroup: FormGroup, fieldName: string): boolean {
    const field = formGroup.get(fieldName);
    return !!(field && field.invalid && field.touched);
  }

  getFieldError(formGroup: FormGroup, fieldName: string): string {
    const field = formGroup.get(fieldName);
    if (!field || !field.errors || !field.touched) {
      return '';
    }

    if (field.errors['required']) {
      return `${this.getFieldLabel(fieldName)} is required`;
    }
    if (field.errors['email']) {
      return 'Please enter a valid email address';
    }
    if (field.errors['minlength']) {
      const minLength = field.errors['minlength'].requiredLength;
      return `Must be at least ${minLength} characters`;
    }
    if (field.errors['min']) {
      const min = field.errors['min'].min;
      return `Must be at least ${min}`;
    }
    if (field.errors['pattern']) {
      if (fieldName.includes('Number') || fieldName.includes('Contact')) {
        return 'Please enter a valid phone number';
      }
      if (fieldName === 'zipCode') {
        return 'Please enter a valid ZIP code';
      }
      if (fieldName === 'website') {
        return 'Please enter a valid URL (e.g., https://example.com)';
      }
      return 'Invalid format';
    }
    return 'Invalid value';
  }

  getFieldLabel(fieldName: string): string {
    const labels: { [key: string]: string } = {
      'name': 'Name',
      'email': 'Email',
      'password': 'Password',
      'confirmPassword': 'Confirm Password',
      'hospitalName': 'Hospital Name',
      'registrationNumber': 'Registration Number',
      'numberOfBeds': 'Number of Beds',
      'website': 'Website',
      'contactNumber': 'Contact Number',
      'emergencyContact': 'Emergency Contact',
      'street': 'Street Address',
      'city': 'City',
      'state': 'State',
      'zipCode': 'ZIP Code',
      'country': 'Country'
    };
    return labels[fieldName] || fieldName;
  }

  // Validate entire form before submission
  validateAllForms(): boolean {
    let isValid = true;
    const forms = [
      this.basicInfoForm,
      this.hospitalDetailsForm,
      this.contactAddressForm
    ];

    forms.forEach(form => {
      if (!form.valid) {
        this.markFormGroupTouched(form);
        isValid = false;
      }
    });

    if (this.selectedSpecializations.length === 0) {
      isValid = false;
    }

    if (this.uploadedDocuments.length === 0) {
      isValid = false;
    }

    return isValid;
  }
}
