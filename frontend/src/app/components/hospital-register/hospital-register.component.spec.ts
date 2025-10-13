import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { HospitalRegisterComponent } from './hospital-register.component';
import { HospitalService } from '../../services/hospital.service';
import { ToastService } from '../../services/toast.service';

describe('HospitalRegisterComponent', () => {
  let component: HospitalRegisterComponent;
  let fixture: ComponentFixture<HospitalRegisterComponent>;
  let mockHospitalService: jasmine.SpyObj<HospitalService>;
  let mockToastService: jasmine.SpyObj<ToastService>;
  let mockRouter: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    mockHospitalService = jasmine.createSpyObj('HospitalService', ['registerHospital']);
    mockToastService = jasmine.createSpyObj('ToastService', ['success', 'error', 'warning']);
    mockRouter = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      declarations: [ HospitalRegisterComponent ],
      imports: [ ReactiveFormsModule ],
      providers: [
        { provide: HospitalService, useValue: mockHospitalService },
        { provide: ToastService, useValue: mockToastService },
        { provide: Router, useValue: mockRouter }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(HospitalRegisterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize with step 1', () => {
    expect(component.currentStep).toBe(1);
    expect(component.totalSteps).toBe(5);
  });

  it('should initialize all forms', () => {
    expect(component.basicInfoForm).toBeDefined();
    expect(component.hospitalDetailsForm).toBeDefined();
    expect(component.contactAddressForm).toBeDefined();
    expect(component.specializationsForm).toBeDefined();
    expect(component.documentsForm).toBeDefined();
  });

  it('should validate password match', () => {
    component.basicInfoForm.patchValue({
      password: 'password123',
      confirmPassword: 'password456'
    });
    
    expect(component.basicInfoForm.hasError('passwordMismatch')).toBe(true);
    
    component.basicInfoForm.patchValue({
      password: 'password123',
      confirmPassword: 'password123'
    });
    
    expect(component.basicInfoForm.hasError('passwordMismatch')).toBe(false);
  });

  it('should calculate password strength correctly', () => {
    component.basicInfoForm.patchValue({ password: '' });
    expect(component.getPasswordStrength()).toBe('');
    
    component.basicInfoForm.patchValue({ password: 'weak' });
    expect(component.getPasswordStrength()).toBe('weak');
    
    component.basicInfoForm.patchValue({ password: 'Medium123' });
    expect(component.getPasswordStrength()).toBe('medium');
    
    component.basicInfoForm.patchValue({ password: 'Strong123!@#' });
    expect(component.getPasswordStrength()).toBe('strong');
  });

  it('should toggle password visibility', () => {
    expect(component.showPassword).toBe(false);
    component.togglePasswordVisibility();
    expect(component.showPassword).toBe(true);
    component.togglePasswordVisibility();
    expect(component.showPassword).toBe(false);
  });

  it('should toggle specialization selection', () => {
    expect(component.selectedSpecializations).toEqual([]);
    
    component.toggleSpecialization('Cardiology');
    expect(component.selectedSpecializations).toContain('Cardiology');
    
    component.toggleSpecialization('Cardiology');
    expect(component.selectedSpecializations).not.toContain('Cardiology');
  });

  it('should toggle facility selection', () => {
    expect(component.selectedFacilities).toEqual([]);
    
    component.toggleFacility('ICU');
    expect(component.selectedFacilities).toContain('ICU');
    
    component.toggleFacility('ICU');
    expect(component.selectedFacilities).not.toContain('ICU');
  });

  it('should calculate progress percentage correctly', () => {
    component.currentStep = 1;
    expect(component.getProgressPercentage()).toBe(20);
    
    component.currentStep = 3;
    expect(component.getProgressPercentage()).toBe(60);
    
    component.currentStep = 5;
    expect(component.getProgressPercentage()).toBe(100);
  });

  it('should move to next step when form is valid', () => {
    component.basicInfoForm.patchValue({
      name: 'John Doe',
      email: 'john@hospital.com',
      password: 'password123',
      confirmPassword: 'password123'
    });
    
    component.currentStep = 1;
    component.nextStep();
    
    expect(component.currentStep).toBe(2);
  });

  it('should not move to next step when form is invalid', () => {
    component.basicInfoForm.patchValue({
      name: '',
      email: 'invalid-email'
    });
    
    component.currentStep = 1;
    component.nextStep();
    
    expect(component.currentStep).toBe(1);
    expect(mockToastService.error).toHaveBeenCalled();
  });

  it('should require at least one specialization on step 4', () => {
    component.currentStep = 4;
    component.selectedSpecializations = [];
    
    component.nextStep();
    
    expect(component.currentStep).toBe(4);
    expect(mockToastService.error).toHaveBeenCalledWith('Please select at least one specialization');
  });

  it('should require at least one document on step 5', () => {
    component.currentStep = 5;
    component.uploadedDocuments = [];
    
    component.nextStep();
    
    expect(component.currentStep).toBe(5);
    expect(mockToastService.error).toHaveBeenCalledWith('Please upload at least one document');
  });

  it('should move to previous step', () => {
    component.currentStep = 3;
    component.previousStep();
    expect(component.currentStep).toBe(2);
  });

  it('should not move to previous step from step 1', () => {
    component.currentStep = 1;
    component.previousStep();
    expect(component.currentStep).toBe(1);
  });

  it('should handle file selection with valid files', () => {
    const mockFile = new File(['content'], 'test.pdf', { type: 'application/pdf' });
    const mockEvent = {
      target: {
        files: [mockFile],
        value: 'test.pdf'
      }
    };
    
    component.onFileSelect(mockEvent);
    
    expect(component.uploadedDocuments.length).toBe(1);
    expect(component.uploadedDocuments[0].name).toBe('test.pdf');
  });

  it('should reject files that are too large', () => {
    const largeFile = new File(['x'.repeat(11 * 1024 * 1024)], 'large.pdf', { type: 'application/pdf' });
    const mockEvent = {
      target: {
        files: [largeFile],
        value: 'large.pdf'
      }
    };
    
    component.onFileSelect(mockEvent);
    
    expect(component.uploadedDocuments.length).toBe(0);
    expect(mockToastService.error).toHaveBeenCalledWith(jasmine.stringContaining('too large'));
  });

  it('should remove document by index', () => {
    const mockFile = new File(['content'], 'test.pdf', { type: 'application/pdf' });
    component.uploadedDocuments = [mockFile];
    
    component.removeDocument(0);
    
    expect(component.uploadedDocuments.length).toBe(0);
  });

  it('should successfully submit registration', async () => {
    const mockResponse = { success: true, message: 'Registration successful' };
    mockHospitalService.registerHospital.and.returnValue(of(mockResponse));
    
    // Fill all forms
    component.basicInfoForm.patchValue({
      name: 'John Doe',
      email: 'john@hospital.com',
      password: 'password123',
      confirmPassword: 'password123'
    });
    
    component.hospitalDetailsForm.patchValue({
      hospitalName: 'City Hospital',
      registrationNumber: 'REG123456',
      numberOfBeds: 100,
      website: 'https://hospital.com'
    });
    
    component.contactAddressForm.patchValue({
      contactNumber: '+1234567890',
      emergencyContact: '+0987654321',
      street: '123 Main St',
      city: 'New York',
      state: 'NY',
      zipCode: '10001',
      country: 'USA'
    });
    
    component.selectedSpecializations = ['Cardiology'];
    component.uploadedDocuments = [new File(['content'], 'test.pdf', { type: 'application/pdf' })];
    
    await component.submitRegistration();
    
    expect(mockHospitalService.registerHospital).toHaveBeenCalled();
    expect(component.registrationSuccess).toBe(true);
    expect(mockToastService.success).toHaveBeenCalled();
  });

  it('should handle registration error', async () => {
    const mockError = { error: { message: 'Registration failed' } };
    mockHospitalService.registerHospital.and.returnValue(throwError(() => mockError));
    
    // Fill all forms
    component.basicInfoForm.patchValue({
      name: 'John Doe',
      email: 'john@hospital.com',
      password: 'password123',
      confirmPassword: 'password123'
    });
    
    component.hospitalDetailsForm.patchValue({
      hospitalName: 'City Hospital',
      registrationNumber: 'REG123456',
      numberOfBeds: 100
    });
    
    component.contactAddressForm.patchValue({
      contactNumber: '+1234567890',
      emergencyContact: '+0987654321',
      street: '123 Main St',
      city: 'New York',
      state: 'NY',
      zipCode: '10001',
      country: 'USA'
    });
    
    component.selectedSpecializations = ['Cardiology'];
    component.uploadedDocuments = [new File(['content'], 'test.pdf', { type: 'application/pdf' })];
    
    await component.submitRegistration();
    
    expect(mockToastService.error).toHaveBeenCalledWith('Registration failed');
    expect(component.isSubmitting).toBe(false);
  });

  it('should navigate to login page', () => {
    component.goToLogin();
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/hospital/login']);
  });
});
