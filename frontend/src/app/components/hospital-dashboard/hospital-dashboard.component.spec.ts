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
    component.apiUsageStats.rateLimit = 100;
    component.apiUsageStats.remainingRequests = 50;
    
    expect(component.getUsagePercentage()).toBe(50);
  });

  it('should return green color for low usage', () => {
    component.apiUsageStats.rateLimit = 100;
    component.apiUsageStats.remainingRequests = 80;
    
    expect(component.getUsageColor()).toBe('#10b981');
  });

  it('should return orange color for medium usage', () => {
    component.apiUsageStats.rateLimit = 100;
    component.apiUsageStats.remainingRequests = 40;
    
    expect(component.getUsageColor()).toBe('#f59e0b');
  });

  it('should return red color for high usage', () => {
    component.apiUsageStats.rateLimit = 100;
    component.apiUsageStats.remainingRequests = 10;
    
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
    component.apiKey = 'HK_test123';
    spyOn(navigator.clipboard, 'writeText').and.returnValue(Promise.resolve());
    
    component.copyApiKey();
    
    await fixture.whenStable();
    
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('HK_test123');
    expect(component.apiKeyCopied).toBe(true);
    expect(mockToastService.show).toHaveBeenCalledWith('API Key copied to clipboard!', 'success');
  });

  it('should show warning when trying to copy API secret', () => {
    component.copyApiSecret();
    
    expect(mockToastService.show).toHaveBeenCalledWith(
      jasmine.stringContaining('API Secret cannot be copied'),
      'warning'
    );
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
    expect(mockToastService.show).toHaveBeenCalledWith('Profile management coming soon!', 'info');
  });

  it('should refresh data and show success toast', () => {
    spyOn(component, 'loadHospitalData');
    
    component.refreshData();
    
    expect(component.loadHospitalData).toHaveBeenCalled();
    expect(mockToastService.show).toHaveBeenCalledWith('Data refreshed successfully!', 'success');
  });

  it('should logout and navigate to login page', () => {
    component.logout();
    
    expect(mockAuthService.logout).toHaveBeenCalled();
    expect(mockRouter.navigate).toHaveBeenCalledWith(['/hospital/login']);
  });
});
