import { ComponentFixture, TestBed, fakeAsync, tick } from '@angular/core/testing';
import { Router } from '@angular/router';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { of, throwError } from 'rxjs';

import { HospitalDashboardComponent } from './hospital-dashboard.component';
import { AuthService } from '../../services/auth.service';
import { HospitalService, Hospital, HospitalApiStats, ApiRequest } from '../../services/hospital.service';
import { ToastService } from '../../services/toast.service';
import { environment } from '../../../config/environment';

describe('HospitalDashboardComponent Integration Tests', () => {
  let component: HospitalDashboardComponent;
  let fixture: ComponentFixture<HospitalDashboardComponent>;
  let mockAuthService: jasmine.SpyObj<AuthService>;
  let mockHospitalService: jasmine.SpyObj<HospitalService>;
  let mockToastService: jasmine.SpyObj<ToastService>;
  let mockRouter: jasmine.SpyObj<Router>;
  let httpMock: HttpTestingController;

  const mockHospital: Hospital = {
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

  const mockApiStats: HospitalApiStats = {
    totalRequests: 1000,
    requestsToday: 50,
    requestsThisWeek: 300,
    requestsThisMonth: 800,
    averageResponseTime: 250,
    successRate: 98.5,
    remainingRequests: 4000,
    rateLimit: 5000,
    lastUpdated: new Date()
  };

  const mockApiRequests: ApiRequest[] = [
    {
      id: '1',
      patientEmail: 'patient1@example.com',
      timestamp: new Date(),
      status: 'success',
      responseTime: 200,
      endpoint: '/api/patients/123'
    },
    {
      id: '2',
      patientEmail: 'patient2@example.com',
      timestamp: new Date(),
      status: 'error',
      responseTime: 500,
      endpoint: '/api/patients/456',
      errorMessage: 'Patient not found'
    }
  ];

  beforeEach(async () => {
    mockAuthService = jasmine.createSpyObj('AuthService', [
      'isLoggedIn', 'isTokenExpired', 'logout'
    ], {
      currentUserValue: { name: 'Test Hospital', role: 'hospital' }
    });

    mockHospitalService = jasmine.createSpyObj('HospitalService', [
      'getHospitalProfile', 'getApiUsageStats', 'getRecentApiRequests', 'clearCache'
    ]);

    mockToastService = jasmine.createSpyObj('ToastService', [
      'success', 'error', 'warning', 'info'
    ]);

    mockRouter = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      declarations: [HospitalDashboardComponent],
      imports: [HttpClientTestingModule],
      providers: [
        { provide: AuthService, useValue: mockAuthService },
        { provide: HospitalService, useValue: mockHospitalService },
        { provide: ToastService, useValue: mockToastService },
        { provide: Router, useValue: mockRouter }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(HospitalDashboardComponent);
    component = fixture.componentInstance;
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  describe('Complete Dashboard Loading Sequence', () => {
    it('should load dashboard data in correct sequence from login to data display', fakeAsync(() => {
      // Setup authentication
      mockAuthService.isLoggedIn.and.returnValue(true);
      mockAuthService.isTokenExpired.and.returnValue(false);

      // Setup service responses
      mockHospitalService.getHospitalProfile.and.returnValue(of({
        success: true,
        hospital: mockHospital
      }));

      mockHospitalService.getApiUsageStats.and.returnValue(of({
        success: true,
        stats: mockApiStats
      }));

      mockHospitalService.getRecentApiRequests.and.returnValue(of({
        success: true,
        requests: mockApiRequests,
        total: 2,
        page: 1,
        limit: 10
      }));

      // Initialize component
      fixture.detectChanges();
      tick();

      // Verify authentication check
      expect(mockAuthService.isLoggedIn).toHaveBeenCalled();
      expect(mockAuthService.isTokenExpired).toHaveBeenCalled();

      // Verify data loading sequence
      expect(mockHospitalService.getHospitalProfile).toHaveBeenCalled();
      expect(mockHospitalService.getApiUsageStats).toHaveBeenCalled();
      expect(mockHospitalService.getRecentApiRequests).toHaveBeenCalledWith(1, 10);

      // Verify component state
      expect(component.state.hospital).toEqual(mockHospital);
      expect(component.state.apiStats).toEqual(mockApiStats);
      expect(component.state.recentRequests).toEqual(mockApiRequests);
      expect(component.state.loading).toBe(false);

      // Verify success toast is shown
      tick(100);
      expect(mockToastService.success).toHaveBeenCalledWith('Dashboard loaded successfully!');
    }));

    it('should handle authentication failure during dashboard load', fakeAsync(() => {
      // Setup authentication failure
      mockAuthService.isLoggedIn.and.returnValue(false);
      mockAuthService.isTokenExpired.and.returnValue(true);

      // Initialize component
      fixture.detectChanges();
      tick();

      // Verify authentication check
      expect(mockAuthService.isLoggedIn).toHaveBeenCalled();

      // Verify error handling
      expect(mockToastService.error).toHaveBeenCalledWith('Your session has expired. Please log in again.');
      expect(mockAuthService.logout).toHaveBeenCalled();

      // Verify navigation to login
      tick(1100);
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/hospital/login']);
    }));

    it('should handle partial data loading failures gracefully', fakeAsync(() => {
      // Setup authentication
      mockAuthService.isLoggedIn.and.returnValue(true);
      mockAuthService.isTokenExpired.and.returnValue(false);

      // Setup mixed responses (profile success, stats fail, requests success)
      mockHospitalService.getHospitalProfile.and.returnValue(of({
        success: true,
        hospital: mockHospital
      }));

      mockHospitalService.getApiUsageStats.and.returnValue(throwError({
        status: 500,
        message: 'Server error'
      }));

      mockHospitalService.getRecentApiRequests.and.returnValue(of({
        success: true,
        requests: mockApiRequests,
        total: 2,
        page: 1,
        limit: 10
      }));

      // Initialize component
      fixture.detectChanges();
      tick();

      // Verify successful data is loaded
      expect(component.state.hospital).toEqual(mockHospital);
      expect(component.state.recentRequests).toEqual(mockApiRequests);

      // Verify error handling for failed stats
      expect(component.state.errors.stats).toContain('Statistics service temporarily unavailable');
      expect(component.state.apiStats).toBeTruthy(); // Fallback stats should be provided

      // Verify loading completes despite partial failure
      expect(component.state.loading).toBe(false);
    }));
  });

  describe('Logout Process Integration', () => {
    it('should complete full logout process from dashboard to login redirect', fakeAsync(() => {
      // Setup initial state
      component.state.hospital = mockHospital;
      component.state.apiStats = mockApiStats;

      // Start logout process
      component.logout();
      expect(component.showLogoutConfirm).toBe(true);

      // Confirm logout
      component.confirmLogout();

      // Verify logout process
      expect(mockToastService.info).toHaveBeenCalledWith('Logging out...');
      expect(mockAuthService.logout).toHaveBeenCalled();

      // Wait for success message and navigation
      tick(1000);
      expect(mockToastService.success).toHaveBeenCalledWith('Logged out successfully. Thank you for using our service!');

      tick(100);
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/hospital/login']);
    }));

    it('should handle logout errors gracefully', fakeAsync(() => {
      // Setup logout to throw error
      mockAuthService.logout.and.throwError('Logout failed');

      // Start logout process
      component.confirmLogout();

      // Verify error handling
      expect(mockToastService.error).toHaveBeenCalledWith('Error during logout. Redirecting to login page...');

      // Verify navigation still occurs
      tick(1600);
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/hospital/login']);
    }));
  });

  describe('Data Refresh and Error Recovery Flows', () => {
    beforeEach(() => {
      // Setup initial successful state
      mockAuthService.isLoggedIn.and.returnValue(true);
      mockAuthService.isTokenExpired.and.returnValue(false);
      component.state.hospital = mockHospital;
    });

    it('should handle manual data refresh successfully', fakeAsync(() => {
      // Setup refresh responses
      mockHospitalService.getHospitalProfile.and.returnValue(of({
        success: true,
        hospital: mockHospital
      }));

      mockHospitalService.getApiUsageStats.and.returnValue(of({
        success: true,
        stats: mockApiStats
      }));

      mockHospitalService.getRecentApiRequests.and.returnValue(of({
        success: true,
        requests: mockApiRequests,
        total: 2,
        page: 1,
        limit: 10
      }));

      // Trigger refresh
      component.refreshData();

      // Verify refresh initiated
      expect(mockToastService.info).toHaveBeenCalledWith('Refreshing dashboard data...');
      expect(component.actionLoading.refreshingAll).toBe(true);

      // Wait for data loading
      tick();

      // Verify data is refreshed
      expect(mockHospitalService.getHospitalProfile).toHaveBeenCalled();
      expect(mockHospitalService.getApiUsageStats).toHaveBeenCalled();
      expect(mockHospitalService.getRecentApiRequests).toHaveBeenCalled();

      // Wait for success message
      tick(3000);
      expect(mockToastService.success).toHaveBeenCalledWith('Dashboard data refreshed successfully!');
      expect(component.actionLoading.refreshingAll).toBe(false);
    }));

    it('should handle individual stats refresh', fakeAsync(() => {
      mockHospitalService.getApiUsageStats.and.returnValue(of({
        success: true,
        stats: mockApiStats
      }));

      // Trigger stats refresh
      component.refreshStats();

      // Verify refresh initiated
      expect(mockToastService.info).toHaveBeenCalledWith('Refreshing API statistics...');
      expect(mockHospitalService.getApiUsageStats).toHaveBeenCalled();

      tick();

      // Wait for success message
      tick(1500);
      expect(mockToastService.success).toHaveBeenCalledWith('API statistics updated!');
    }));

    it('should handle individual requests refresh', fakeAsync(() => {
      mockHospitalService.getRecentApiRequests.and.returnValue(of({
        success: true,
        requests: mockApiRequests,
        total: 2,
        page: 1,
        limit: 10
      }));

      // Trigger requests refresh
      component.refreshRequests();

      // Verify refresh initiated
      expect(mockToastService.info).toHaveBeenCalledWith('Refreshing recent requests...');
      expect(mockHospitalService.getRecentApiRequests).toHaveBeenCalled();

      tick();

      // Wait for success message
      tick(1500);
      expect(mockToastService.success).toHaveBeenCalledWith('Recent requests updated!');
    }));

    it('should handle error recovery with retry mechanism', fakeAsync(() => {
      // Setup initial failure then success
      let callCount = 0;
      mockHospitalService.getHospitalProfile.and.callFake(() => {
        callCount++;
        if (callCount === 1) {
          return throwError({ status: 500, message: 'Server error' });
        }
        return of({ success: true, hospital: mockHospital });
      });

      // Set initial error state
      component.state.errors.profile = 'Failed to load profile';

      // Trigger retry
      component.retryProfileLoad(1);

      // Verify retry initiated
      expect(mockToastService.info).toHaveBeenCalledWith('Retrying... (Attempt 1/3)');

      // Wait for retry delay
      tick(1000);

      // Verify retry call
      expect(mockHospitalService.getHospitalProfile).toHaveBeenCalled();
      expect(component.state.errors.profile).toBeNull();

      tick();

      // Verify successful recovery
      expect(component.state.hospital).toEqual(mockHospital);
    }));

    it('should handle maximum retry attempts exceeded', fakeAsync(() => {
      // Setup to always fail
      mockHospitalService.getHospitalProfile.and.returnValue(throwError({
        status: 500,
        message: 'Server error'
      }));

      // Trigger retry with max attempts
      component.retryProfileLoad(4);

      // Verify error message for max attempts
      expect(mockToastService.error).toHaveBeenCalledWith('Failed to load profile after multiple attempts. Please refresh the page.');
    }));

    it('should handle network errors with appropriate user feedback', fakeAsync(() => {
      // Setup authentication
      mockAuthService.isLoggedIn.and.returnValue(true);
      mockAuthService.isTokenExpired.and.returnValue(false);

      // Setup network error
      mockHospitalService.getHospitalProfile.and.returnValue(throwError({
        status: 0,
        message: 'Network error'
      }));

      mockHospitalService.getApiUsageStats.and.returnValue(of({
        success: true,
        stats: mockApiStats
      }));

      mockHospitalService.getRecentApiRequests.and.returnValue(of({
        success: true,
        requests: mockApiRequests,
        total: 2,
        page: 1,
        limit: 10
      }));

      // Initialize component
      fixture.detectChanges();
      tick();

      // Verify network error handling
      expect(component.state.errors.profile).toContain('Network connection failed');
      expect(mockToastService.error).toHaveBeenCalledWith('Network error. Please check your connection and try again.');

      // Verify other data still loads
      expect(component.state.apiStats).toEqual(mockApiStats);
      expect(component.state.recentRequests).toEqual(mockApiRequests);
    }));
  });

  describe('Auto-refresh and Visibility Handling', () => {
    beforeEach(() => {
      mockAuthService.isLoggedIn.and.returnValue(true);
      mockAuthService.isTokenExpired.and.returnValue(false);
      component.state.hospital = mockHospital;
    });

    it('should handle page visibility changes and refresh data', fakeAsync(() => {
      // Setup service responses
      mockHospitalService.getApiUsageStats.and.returnValue(of({
        success: true,
        stats: mockApiStats
      }));

      mockHospitalService.getRecentApiRequests.and.returnValue(of({
        success: true,
        requests: mockApiRequests,
        total: 2,
        page: 1,
        limit: 10
      }));

      // Initialize component
      fixture.detectChanges();
      tick();

      // Reset call counts
      mockHospitalService.getApiUsageStats.calls.reset();
      mockHospitalService.getRecentApiRequests.calls.reset();

      // Simulate page becoming visible
      Object.defineProperty(document, 'hidden', { value: false, configurable: true });
      document.dispatchEvent(new Event('visibilitychange'));

      tick();

      // Verify auto-refresh is triggered
      expect(mockHospitalService.getApiUsageStats).toHaveBeenCalled();
      expect(mockHospitalService.getRecentApiRequests).toHaveBeenCalled();
    }));

    it('should handle authentication expiry during auto-refresh', fakeAsync(() => {
      // Initialize component
      fixture.detectChanges();
      tick();

      // Simulate authentication expiry
      mockAuthService.isLoggedIn.and.returnValue(false);
      mockAuthService.isTokenExpired.and.returnValue(true);

      // Simulate page becoming visible
      Object.defineProperty(document, 'hidden', { value: false, configurable: true });
      document.dispatchEvent(new Event('visibilitychange'));

      tick();

      // Verify authentication error handling
      expect(mockToastService.error).toHaveBeenCalledWith('Your session has expired. Please log in again.');
      expect(mockAuthService.logout).toHaveBeenCalled();

      tick(1100);
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/hospital/login']);
    }));
  });

  describe('User Interaction Flows', () => {
    beforeEach(() => {
      component.state.hospital = mockHospital;
    });

    it('should handle API key copy with success feedback', fakeAsync(() => {
      spyOn(navigator.clipboard, 'writeText').and.returnValue(Promise.resolve());

      component.copyApiKey();

      tick();

      expect(navigator.clipboard.writeText).toHaveBeenCalledWith('HK_test123');
      expect(component.apiKeyCopied).toBe(true);
      expect(mockToastService.success).toHaveBeenCalledWith('API Key copied to clipboard successfully!');

      // Verify feedback resets
      tick(2000);
      expect(component.apiKeyCopied).toBe(false);
    }));

    it('should handle API key copy failure with fallback', fakeAsync(() => {
      spyOn(navigator.clipboard, 'writeText').and.returnValue(Promise.reject('Copy failed'));
      spyOn(window, 'prompt').and.returnValue('');

      component.copyApiKey();

      tick();

      expect(mockToastService.error).toHaveBeenCalledWith('Failed to copy API Key. Please try selecting and copying manually.');
      expect(window.prompt).toHaveBeenCalledWith('Copy this API Key manually:', 'HK_test123');
    }));

    it('should navigate to API docs correctly', () => {
      component.goToApiDocs();
      expect(mockRouter.navigate).toHaveBeenCalledWith(['/hospital/api-docs']);
    });

    it('should show appropriate message for profile management', () => {
      component.goToProfile();
      expect(mockToastService.info).toHaveBeenCalledWith(jasmine.stringContaining('Profile management feature is coming soon'));
    });
  });
});
