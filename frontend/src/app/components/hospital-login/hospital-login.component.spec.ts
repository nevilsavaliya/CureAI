import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { HospitalLoginComponent } from './hospital-login.component';
import { HospitalService } from '../../services/hospital.service';

describe('HospitalLoginComponent', () => {
  let component: HospitalLoginComponent;
  let fixture: ComponentFixture<HospitalLoginComponent>;
  let mockHospitalService: jasmine.SpyObj<HospitalService>;
  let mockRouter: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    mockHospitalService = jasmine.createSpyObj('HospitalService', ['loginHospital']);
    mockRouter = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      declarations: [ HospitalLoginComponent ],
      imports: [ ReactiveFormsModule ],
      providers: [
        { provide: HospitalService, useValue: mockHospitalService },
        { provide: Router, useValue: mockRouter }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(HospitalLoginComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize login form with empty values', () => {
    expect(component.loginForm).toBeDefined();
    expect(component.loginForm.get('email')?.value).toBe('');
    expect(component.loginForm.get('password')?.value).toBe('');
    expect(component.loginForm.get('rememberMe')?.value).toBe(false);
  });

  it('should validate email field as required', () => {
    const emailControl = component.loginForm.get('email');
    emailControl?.setValue('');
    expect(emailControl?.hasError('required')).toBe(true);
  });

  it('should validate email format', () => {
    const emailControl = component.loginForm.get('email');
    emailControl?.setValue('invalid-email');
    expect(emailControl?.hasError('email')).toBe(true);
    
    emailControl?.setValue('valid@email.com');
    expect(emailControl?.hasError('email')).toBe(false);
  });

  it('should validate password as required with minimum length', () => {
    const passwordControl = component.loginForm.get('password');
    passwordControl?.setValue('');
    expect(passwordControl?.hasError('required')).toBe(true);
    
    passwordControl?.setValue('short');
    expect(passwordControl?.hasError('minlength')).toBe(true);
    
    passwordControl?.setValue('validpassword');
    expect(passwordControl?.hasError('minlength')).toBe(false);
  });

  it('should not submit if form is invalid', () => {
    component.loginForm.patchValue({
      email: '',
      password: ''
    });
    
    component.onSubmit();
    
    expect(mockHospitalService.loginHospital).not.toHaveBeenCalled();
  });

  it('should successfully login verified hospital and navigate to dashboard', () => {
    const mockResponse: any = {
      success: true,
      token: 'test-token',
      hospital: { _id: '123', name: 'Test Hospital', verificationStatus: 'verified' }
    };
    
    mockHospitalService.loginHospital.and.returnValue(of(mockResponse));
    
    component.loginForm.patchValue({
      email: 'test@hospital.com',
      password: 'password123',
      rememberMe: false
    });
    
    component.onSubmit();
    
    expect(mockHospitalService.loginHospital).toHaveBeenCalledWith('test@hospital.com', 'password123', false);
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/hospital/dashboard']);
  });

  it('should store token in localStorage when rememberMe is true', () => {
    const mockResponse: any = {
      success: true,
      token: 'test-token',
      hospital: { _id: '123', name: 'Test Hospital', verificationStatus: 'verified' }
    };
    
    mockHospitalService.loginHospital.and.returnValue(of(mockResponse));
    spyOn(localStorage, 'setItem');
    
    component.loginForm.patchValue({
      email: 'test@hospital.com',
      password: 'password123',
      rememberMe: true
    });
    
    component.onSubmit();
    
    expect(localStorage.setItem).toHaveBeenCalledWith('hospitalToken', 'test-token');
    expect(localStorage.setItem).toHaveBeenCalledWith('hospitalData', jasmine.any(String));
  });

  it('should store token in sessionStorage when rememberMe is false', () => {
    const mockResponse: any = {
      success: true,
      token: 'test-token',
      hospital: { _id: '123', name: 'Test Hospital', verificationStatus: 'verified' }
    };
    
    mockHospitalService.loginHospital.and.returnValue(of(mockResponse));
    spyOn(sessionStorage, 'setItem');
    
    component.loginForm.patchValue({
      email: 'test@hospital.com',
      password: 'password123',
      rememberMe: false
    });
    
    component.onSubmit();
    
    expect(sessionStorage.setItem).toHaveBeenCalledWith('hospitalToken', 'test-token');
    expect(sessionStorage.setItem).toHaveBeenCalledWith('hospitalData', jasmine.any(String));
  });

  it('should show pending verification message for pending hospital', () => {
    const mockResponse = {
      success: false,
      verificationStatus: 'pending' as const
    };
    
    mockHospitalService.loginHospital.and.returnValue(of(mockResponse));
    
    component.loginForm.patchValue({
      email: 'test@hospital.com',
      password: 'password123'
    });
    
    component.onSubmit();
    
    expect(component.verificationStatus).toBe('pending');
    expect(component.verificationMessage).toContain('pending verification');
  });

  it('should show rejection message for rejected hospital', () => {
    const mockResponse = {
      success: false,
      verificationStatus: 'rejected' as const,
      rejectionReason: 'Invalid documents'
    };
    
    mockHospitalService.loginHospital.and.returnValue(of(mockResponse));
    
    component.loginForm.patchValue({
      email: 'test@hospital.com',
      password: 'password123'
    });
    
    component.onSubmit();
    
    expect(component.verificationStatus).toBe('rejected');
    expect(component.verificationMessage).toContain('rejected');
    expect(component.verificationMessage).toContain('Invalid documents');
  });

  it('should handle login error', () => {
    const mockError = {
      error: { message: 'Invalid credentials' }
    };
    
    mockHospitalService.loginHospital.and.returnValue(throwError(() => mockError));
    
    component.loginForm.patchValue({
      email: 'test@hospital.com',
      password: 'wrongpassword'
    });
    
    component.onSubmit();
    
    expect(component.errorMessage).toBe('Invalid credentials');
    expect(component.loading).toBe(false);
  });

  it('should redirect to dashboard if already logged in', () => {
    spyOn(localStorage, 'getItem').and.returnValue('existing-token');
    
    component.ngOnInit();
    
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/hospital/dashboard']);
  });
});
