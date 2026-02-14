import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { HospitalDashboardComponent } from './hospital-dashboard.component';
import { AuthService } from '../../services/auth.service';
import { HospitalService } from '../../services/hospital.service';
import { ToastService } from '../../services/toast.service';

describe('HospitalDashboardComponent', () => {
  let component: HospitalDashboardComponent;
  let fixture: ComponentFixture<HospitalDashboardComponent>;
  let mockAuthService: jasmine.SpyObj<AuthService>;
  let mockHospitalService: jasmine.SpyObj<HospitalService>;
  let mockToastService: jasmine.SpyObj<ToastService>;
  let mockRouter: jasmine.SpyObj<Router>;

  beforeEach(async () => {
    mockAuthService = jasmine.createSpyObj('AuthService', ['logout'], {
      currentUserValue: { name: 'Test Hospital', role: 'hospital' }
    });
    mockHospitalService = jasmine.createSpyObj('HospitalService', ['getHospitalProfile']);
    mockToastService = jasmine.createSpyObj('ToastService', ['show', 'success', 'error', 'warning']);
    mockRouter = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      declarations: [ HospitalDashboardComponent ],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        { provide: HospitalService, useValue: mockHospitalService },
        { provide: ToastService, useValue: mockToastService },
        { provide: Router, useValue: mockRouter }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(HospitalDashboardComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load hospital name from auth service on init', () => {
    fixture.detectChanges();
    expect(component.hospitalName).toBe('Test Hospital');
  });

  it('should calculate usage percentage correctly', () => {
    component.state.apiStats = {
      totalRequests: 1000,
      requestsToday: 50,
      requestsThisWeek: 300,
      requestsThisMonth: 800,
      averageResponseTime: 250,
      successRate: 98.5,
      remainingRequests: 50,
      rateLimit: 100,
      lastUpdated: new Date()
    };
    
    expect(component.getUsagePercentage()).toBe(50);
  });

  it('should return green color for low usage', () => {
    component.state.apiStats = {
      totalRequests: 1000,
      requestsToday: 50,
      requestsThisWeek: 300,
      requestsThisMonth: 800,
      averageResponseTime: 250,
      successRate: 98.5,
      remainingRequests: 80,
      rateLimit: 100,
      lastUpdated: new Date()
    };
    
    expect(component.getUsageColor()).toBe('#10b981');
  });

  it('should return orange color for medium usage', () => {
    component.state.apiStats = {
      totalRequests: 1000,
      requestsToday: 50,
      requestsThisWeek: 300,
      requestsThisMonth: 800,
      averageResponseTime: 250,
      successRate: 98.5,
      remainingRequests: 40,
      rateLimit: 100,
      lastUpdated: new Date()
    };
    
    expect(component.getUsageColor()).toBe('#f59e0b');
  });

  it('should return red color for high usage', () => {
    component.state.apiStats = {
      totalRequests: 1000,
      requestsToday: 50,
      requestsThisWeek: 300,
      requestsThisMonth: 800,
      averageResponseTime: 250,
      successRate: 98.5,
      remainingRequests: 10,
      rateLimit: 100,
      lastUpdated: new Date()
    };
    
    expect(component.getUsageColor()).toBe('#ef4444');
  });

  it('should format timestamp correctly for minutes ago', () => {
    const now = new Date();
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60000);
    
    expect(component.formatTimestamp(fiveMinutesAgo)).toBe('5 minutes ago');
  });

  it('should format timestamp correctly for hours ago', () => {
    const now = new Date();
    const twoHoursAgo = new Date(now.getTime() - 2 * 3600000);
    
    expect(component.formatTimestamp(twoHoursAgo)).toBe('2 hours ago');
  });

  it('should format timestamp correctly for days ago', () => {
    const now = new Date();
    const threeDaysAgo = new Date(now.getTime() - 3 * 86400000);
    
    expect(component.formatTimestamp(threeDaysAgo)).toBe('3 days ago');
  });

  it('should copy API key to clipboard', async () => {
    component.state.hospital = {
      _id: '123',
      name: 'Test Hospital',
      email: 'test@hospital.com',
      hospitalName: 'Test Hospital',
      registrationNumber: 'REG123',
      address: {
        street: '123 Main St',
        city: 'Test City',
        state: 'Test State',
        zipCode: '12345',
        country: 'Test Country'
      },
      contactNumber: '1234567890',
      emergencyContact: '0987654321',
      specializations: ['General'],
      numberOfBeds: 100,
      facilities: ['ICU'],
      verificationStatus: 'verified',
      apiKey: 'HK_test123',
      apiAccessCount: 50,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    spyOn(navigator.clipboard, 'writeText').and.returnValue(Promise.resolve());
    
    component.copyApiKey();
    
    await fixture.whenStable();
    
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('HK_test123');
    expect(component.apiKeyCopied).toBe(true);
    expect(mockToastService.success).toHaveBeenCalledWith('API Key copied to clipboard successfully!');
  });

  it('should show warning when trying to copy API secret', (done) => {
    component.copyApiSecret();
    
    setTimeout(() => {
      expect(mockToastService.warning).toHaveBeenCalledWith(
        jasmine.stringContaining('API Secret cannot be copied')
      );
      done();
    }, 600);
  });

  it('should toggle API secret visibility', () => {
    expect(component.showApiSecret).toBe(false);
    
    component.toggleApiSecretVisibility();
    expect(component.showApiSecret).toBe(true);
    
    component.toggleApiSecretVisibility();
    expect(component.showApiSecret).toBe(false);
  });

  it('should navigate to API docs', () => {
    component.goToApiDocs();
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/hospital/api-docs']);
  });

  it('should show info toast for profile management', () => {
    component.goToProfile();
    expect(mockToastService.info).toHaveBeenCalledWith(jasmine.stringContaining('Profile management feature is coming soon'));
  });

  it('should refresh data and show info toast', () => {
    component.refreshData();
    
    expect(mockToastService.info).toHaveBeenCalledWith('Refreshing dashboard data...');
  });

  it('should show logout confirmation dialog', () => {
    component.logout();
    
    expect(component.showLogoutConfirm).toBe(true);
  });

  it('should confirm logout and navigate to login page', (done) => {
    component.confirmLogout();
    
    expect(mockAuthService.logout).toHaveBeenCalled();
    expect(mockToastService.info).toHaveBeenCalledWith('Logging out...');
    
    setTimeout(() => {
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/hospital/login']);
      done();
    }, 1100);
  });
});
