import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { HospitalService, Hospital, HospitalResponse, HospitalLoginResponse, HospitalProfileResponse, ApiStatsResponse, ApiRequestsResponse, HospitalApiStats, ApiRequest } from './hospital.service';
import { environment } from '../../config/environment';

describe('HospitalService', () => {
  let service: HospitalService;
  let httpMock: HttpTestingController;
  const apiUrl = environment.apiUrl;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [HospitalService]
    });
    service = TestBed.inject(HospitalService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getAllHospitals', () => {
    it('should fetch all hospitals without filters', () => {
      const mockResponse: HospitalResponse = {
        success: true,
        hospitals: [],
        count: 0
      };

      service.getAllHospitals().subscribe(response => {
        expect(response).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(`${apiUrl}/admin/hospitals`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should fetch hospitals with status filter', () => {
      const mockResponse: HospitalResponse = {
        success: true,
        hospitals: [],
        count: 0
      };

      service.getAllHospitals('pending').subscribe(response => {
        expect(response).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(`${apiUrl}/admin/hospitals?status=pending`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should fetch hospitals with search filter', () => {
      const mockResponse: HospitalResponse = {
        success: true,
        hospitals: [],
        count: 0
      };

      service.getAllHospitals(undefined, 'City Hospital').subscribe(response => {
        expect(response).toEqual(mockResponse);
      });

      const req = httpMock.expectOne(`${apiUrl}/admin/hospitals?search=City%20Hospital`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });
  });

  describe('getHospitalById', () => {
    it('should fetch hospital by id', () => {
      const hospitalId = '123';
      const mockResponse: HospitalResponse = {
        success: true,
        hospital: {
          _id: hospitalId,
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
          verificationStatus: 'pending',
          apiAccessCount: 0,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        }
      };

      service.getHospitalById(hospitalId).subscribe(response => {
        expect(response).toEqual(mockResponse);
        expect(response.hospital?._id).toBe(hospitalId);
      });

      const req = httpMock.expectOne(`${apiUrl}/admin/hospitals/${hospitalId}`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });
  });

  describe('verifyHospital', () => {
    it('should verify hospital', () => {
      const hospitalId = '123';
      const mockResponse: HospitalResponse = {
        success: true,
        message: 'Hospital verified successfully'
      };

      service.verifyHospital(hospitalId).subscribe(response => {
        expect(response.success).toBe(true);
        expect(response.message).toBe('Hospital verified successfully');
      });

      const req = httpMock.expectOne(`${apiUrl}/admin/hospitals/${hospitalId}/verify`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual({});
      req.flush(mockResponse);
    });
  });

  describe('rejectHospital', () => {
    it('should reject hospital without reason', () => {
      const hospitalId = '123';
      const mockResponse: HospitalResponse = {
        success: true,
        message: 'Hospital rejected'
      };

      service.rejectHospital(hospitalId).subscribe(response => {
        expect(response.success).toBe(true);
      });

      const req = httpMock.expectOne(`${apiUrl}/admin/hospitals/${hospitalId}/reject`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual({});
      req.flush(mockResponse);
    });

    it('should reject hospital with reason', () => {
      const hospitalId = '123';
      const reason = 'Invalid documents';
      const mockResponse: HospitalResponse = {
        success: true,
        message: 'Hospital rejected'
      };

      service.rejectHospital(hospitalId, reason).subscribe(response => {
        expect(response.success).toBe(true);
      });

      const req = httpMock.expectOne(`${apiUrl}/admin/hospitals/${hospitalId}/reject`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual({ reason });
      req.flush(mockResponse);
    });
  });

  describe('revokeHospitalAccess', () => {
    it('should revoke hospital access without reason', () => {
      const hospitalId = '123';
      const mockResponse: HospitalResponse = {
        success: true,
        message: 'Hospital access revoked'
      };

      service.revokeHospitalAccess(hospitalId).subscribe(response => {
        expect(response.success).toBe(true);
      });

      const req = httpMock.expectOne(`${apiUrl}/admin/hospitals/${hospitalId}/revoke`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual({});
      req.flush(mockResponse);
    });

    it('should revoke hospital access with reason', () => {
      const hospitalId = '123';
      const reason = 'Policy violation';
      const mockResponse: HospitalResponse = {
        success: true,
        message: 'Hospital access revoked'
      };

      service.revokeHospitalAccess(hospitalId, reason).subscribe(response => {
        expect(response.success).toBe(true);
      });

      const req = httpMock.expectOne(`${apiUrl}/admin/hospitals/${hospitalId}/revoke`);
      expect(req.request.method).toBe('PUT');
      expect(req.request.body).toEqual({ reason });
      req.flush(mockResponse);
    });
  });

  describe('registerHospital', () => {
    it('should register a new hospital', () => {
      const formData = new FormData();
      formData.append('name', 'Test Hospital');
      formData.append('email', 'test@hospital.com');

      const mockResponse: HospitalResponse = {
        success: true,
        message: 'Hospital registered successfully'
      };

      service.registerHospital(formData).subscribe(response => {
        expect(response.success).toBe(true);
        expect(response.message).toBe('Hospital registered successfully');
      });

      const req = httpMock.expectOne(`${apiUrl}/hospitals/register`);
      expect(req.request.method).toBe('POST');
      req.flush(mockResponse);
    });
  });

  describe('loginHospital', () => {
    it('should login hospital successfully', () => {
      const email = 'test@hospital.com';
      const password = 'password123';
      const mockResponse: HospitalLoginResponse = {
        success: true,
        token: 'test-token',
        verificationStatus: 'verified'
      };

      service.loginHospital(email, password).subscribe(response => {
        expect(response.success).toBe(true);
        expect(response.token).toBe('test-token');
        expect(response.verificationStatus).toBe('verified');
      });

      const req = httpMock.expectOne(`${apiUrl}/hospitals/login`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ email, password, rememberMe: false });
      req.flush(mockResponse);
    });

    it('should login hospital with rememberMe flag', () => {
      const email = 'test@hospital.com';
      const password = 'password123';
      const mockResponse: HospitalLoginResponse = {
        success: true,
        token: 'test-token',
        verificationStatus: 'verified'
      };

      service.loginHospital(email, password, true).subscribe(response => {
        expect(response.success).toBe(true);
      });

      const req = httpMock.expectOne(`${apiUrl}/hospitals/login`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ email, password, rememberMe: true });
      req.flush(mockResponse);
    });
  });

  describe('getPendingHospitalsCount', () => {
    it('should fetch pending hospitals count', () => {
      const mockResponse: HospitalResponse = {
        success: true,
        count: 5
      };

      service.getPendingHospitalsCount().subscribe(response => {
        expect(response.success).toBe(true);
        expect(response.count).toBe(5);
      });

      const req = httpMock.expectOne(`${apiUrl}/admin/hospitals?status=pending`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });
  });

  describe('getHospitalStatistics', () => {
    it('should fetch hospital statistics', () => {
      const mockResponse = {
        success: true,
        statistics: {
          total: 10,
          pending: 3,
          verified: 6,
          rejected: 1
        }
      };

      service.getHospitalStatistics().subscribe(response => {
        expect(response.success).toBe(true);
        expect(response.statistics.total).toBe(10);
      });

      const req = httpMock.expectOne(`${apiUrl}/admin/hospitals/statistics`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });
  });

  describe('getHospitalProfile', () => {
    it('should fetch hospital profile data', () => {
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
        apiKey: 'test-api-key',
        apiAccessCount: 50,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const mockResponse: HospitalProfileResponse = {
        success: true,
        hospital: mockHospital
      };

      service.getHospitalProfile().subscribe(response => {
        expect(response.success).toBe(true);
        expect(response.hospital).toEqual(mockHospital);
      });

      const req = httpMock.expectOne(`${apiUrl}/hospitals/profile`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should return cached profile data on subsequent calls', () => {
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
        apiKey: 'test-api-key',
        apiAccessCount: 50,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const mockResponse: HospitalProfileResponse = {
        success: true,
        hospital: mockHospital
      };

      // First call - should make HTTP request
      service.getHospitalProfile().subscribe(response => {
        expect(response.success).toBe(true);
        expect(response.hospital).toEqual(mockHospital);
      });

      const req = httpMock.expectOne(`${apiUrl}/hospitals/profile`);
      req.flush(mockResponse);

      // Second call - should return cached data without HTTP request
      service.getHospitalProfile().subscribe(response => {
        expect(response.success).toBe(true);
        expect(response.hospital).toEqual(mockHospital);
      });

      // No additional HTTP request should be made
      httpMock.expectNone(`${apiUrl}/hospitals/profile`);
    });
  });

  describe('getApiUsageStats', () => {
    it('should fetch API usage statistics', () => {
      const mockStats: HospitalApiStats = {
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

      const mockResponse: ApiStatsResponse = {
        success: true,
        stats: mockStats
      };

      service.getApiUsageStats().subscribe(response => {
        expect(response.success).toBe(true);
        expect(response.stats).toEqual(mockStats);
      });

      const req = httpMock.expectOne(`${apiUrl}/hospitals/api/usage-stats`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should return cached stats data within cache duration', () => {
      const mockStats: HospitalApiStats = {
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

      const mockResponse: ApiStatsResponse = {
        success: true,
        stats: mockStats
      };

      // First call - should make HTTP request
      service.getApiUsageStats().subscribe(response => {
        expect(response.success).toBe(true);
        expect(response.stats).toEqual(mockStats);
      });

      const req = httpMock.expectOne(`${apiUrl}/hospitals/api/usage-stats`);
      req.flush(mockResponse);

      // Second call within cache duration - should return cached data
      service.getApiUsageStats().subscribe(response => {
        expect(response.success).toBe(true);
        expect(response.stats).toEqual(mockStats);
      });

      // No additional HTTP request should be made
      httpMock.expectNone(`${apiUrl}/hospitals/api/usage-stats`);
    });
  });

  describe('getRecentApiRequests', () => {
    it('should fetch recent API requests with default parameters', () => {
      const mockRequests: ApiRequest[] = [
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

      const mockResponse: ApiRequestsResponse = {
        success: true,
        requests: mockRequests,
        total: 2,
        page: 1,
        limit: 10
      };

      service.getRecentApiRequests().subscribe(response => {
        expect(response.success).toBe(true);
        expect(response.requests).toEqual(mockRequests);
        expect(response.total).toBe(2);
      });

      const req = httpMock.expectOne(`${apiUrl}/hospitals/api/recent-requests?page=1&limit=10&sortBy=timestamp&sortOrder=desc`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should fetch recent API requests with custom parameters', () => {
      const mockRequests: ApiRequest[] = [];
      const mockResponse: ApiRequestsResponse = {
        success: true,
        requests: mockRequests,
        total: 0,
        page: 2,
        limit: 5
      };

      service.getRecentApiRequests(2, 5, 'status', 'asc').subscribe(response => {
        expect(response.success).toBe(true);
        expect(response.requests).toEqual(mockRequests);
      });

      const req = httpMock.expectOne(`${apiUrl}/hospitals/api/recent-requests?page=2&limit=5&sortBy=status&sortOrder=asc`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });
  });

  describe('clearCache', () => {
    it('should clear cached data', () => {
      // Set up some cached data first
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
        apiKey: 'test-api-key',
        apiAccessCount: 50,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const mockResponse: HospitalProfileResponse = {
        success: true,
        hospital: mockHospital
      };

      // First call to cache data
      service.getHospitalProfile().subscribe();
      const req = httpMock.expectOne(`${apiUrl}/hospitals/profile`);
      req.flush(mockResponse);

      // Clear cache
      service.clearCache();

      // Next call should make HTTP request again (not use cache)
      service.getHospitalProfile().subscribe();
      const req2 = httpMock.expectOne(`${apiUrl}/hospitals/profile`);
      req2.flush(mockResponse);
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors in getHospitalProfile', () => {
      const errorEvent = new ErrorEvent('Network error', {
        message: 'Connection failed'
      });

      service.getHospitalProfile().subscribe({
        next: () => fail('Should have failed'),
        error: (error) => {
          expect(error.message).toContain('Network error');
        }
      });

      const req = httpMock.expectOne(`${apiUrl}/hospitals/profile`);
      req.error(errorEvent);
    });

    it('should handle 401 authentication errors', () => {
      service.getHospitalProfile().subscribe({
        next: () => fail('Should have failed'),
        error: (error) => {
          expect(error.message).toBe('Authentication failed. Please log in again.');
        }
      });

      const req = httpMock.expectOne(`${apiUrl}/hospitals/profile`);
      req.flush({ message: 'Unauthorized' }, { status: 401, statusText: 'Unauthorized' });
    });

    it('should handle 403 permission errors', () => {
      service.getApiUsageStats().subscribe({
        next: () => fail('Should have failed'),
        error: (error) => {
          expect(error.message).toBe('Access denied. You do not have permission to access this resource.');
        }
      });

      const req = httpMock.expectOne(`${apiUrl}/hospitals/api/usage-stats`);
      req.flush({ message: 'Forbidden' }, { status: 403, statusText: 'Forbidden' });
    });

    it('should handle 404 not found errors', () => {
      service.getRecentApiRequests().subscribe({
        next: () => fail('Should have failed'),
        error: (error) => {
          expect(error.message).toBe('The requested resource was not found.');
        }
      });

      const req = httpMock.expectOne(`${apiUrl}/hospitals/api/recent-requests?page=1&limit=10&sortBy=timestamp&sortOrder=desc`);
      req.flush({ message: 'Not Found' }, { status: 404, statusText: 'Not Found' });
    });

    it('should handle 429 rate limit errors', () => {
      service.getApiUsageStats().subscribe({
        next: () => fail('Should have failed'),
        error: (error) => {
          expect(error.message).toBe('Too many requests. Please try again later.');
        }
      });

      const req = httpMock.expectOne(`${apiUrl}/hospitals/api/usage-stats`);
      req.flush({ message: 'Too Many Requests' }, { status: 429, statusText: 'Too Many Requests' });
    });

    it('should handle 500 server errors', () => {
      service.getHospitalProfile().subscribe({
        next: () => fail('Should have failed'),
        error: (error) => {
          expect(error.message).toBe('Server error. Please try again later.');
        }
      });

      const req = httpMock.expectOne(`${apiUrl}/hospitals/profile`);
      req.flush({ message: 'Internal Server Error' }, { status: 500, statusText: 'Internal Server Error' });
    });

    it('should retry failed requests up to 2 times for getHospitalProfile', () => {
      let requestCount = 0;
      
      service.getHospitalProfile().subscribe({
        next: () => fail('Should have failed'),
        error: (error) => {
          expect(error.message).toBe('Server error. Please try again later.');
          expect(requestCount).toBe(3); // Initial request + 2 retries
        }
      });

      // Handle initial request and retries
      for (let i = 0; i < 3; i++) {
        const req = httpMock.expectOne(`${apiUrl}/hospitals/profile`);
        requestCount++;
        req.flush({ message: 'Server Error' }, { status: 500, statusText: 'Internal Server Error' });
      }
    });

    it('should retry failed requests up to 2 times for getApiUsageStats', () => {
      let requestCount = 0;
      
      service.getApiUsageStats().subscribe({
        next: () => fail('Should have failed'),
        error: (error) => {
          expect(error.message).toBe('Server error. Please try again later.');
          expect(requestCount).toBe(3); // Initial request + 2 retries
        }
      });

      // Handle initial request and retries
      for (let i = 0; i < 3; i++) {
        const req = httpMock.expectOne(`${apiUrl}/hospitals/api/usage-stats`);
        requestCount++;
        req.flush({ message: 'Server Error' }, { status: 500, statusText: 'Internal Server Error' });
      }
    });

    it('should retry failed requests up to 2 times for getRecentApiRequests', () => {
      let requestCount = 0;
      
      service.getRecentApiRequests().subscribe({
        next: () => fail('Should have failed'),
        error: (error) => {
          expect(error.message).toBe('Server error. Please try again later.');
          expect(requestCount).toBe(3); // Initial request + 2 retries
        }
      });

      // Handle initial request and retries
      for (let i = 0; i < 3; i++) {
        const req = httpMock.expectOne(`${apiUrl}/hospitals/api/recent-requests?page=1&limit=10&sortBy=timestamp&sortOrder=desc`);
        requestCount++;
        req.flush({ message: 'Server Error' }, { status: 500, statusText: 'Internal Server Error' });
      }
    });
  });

  describe('Cache Management', () => {
    it('should clear cache when auth:logout event is dispatched', () => {
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
        apiKey: 'test-api-key',
        apiAccessCount: 50,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const mockResponse: HospitalProfileResponse = {
        success: true,
        hospital: mockHospital
      };

      // First call to cache data
      service.getHospitalProfile().subscribe();
      const req = httpMock.expectOne(`${apiUrl}/hospitals/profile`);
      req.flush(mockResponse);

      // Dispatch logout event
      window.dispatchEvent(new CustomEvent('auth:logout'));

      // Next call should make HTTP request again (cache should be cleared)
      service.getHospitalProfile().subscribe();
      const req2 = httpMock.expectOne(`${apiUrl}/hospitals/profile`);
      req2.flush(mockResponse);
    });

    it('should expire stats cache after cache duration', (done) => {
      const mockStats: HospitalApiStats = {
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

      const mockResponse: ApiStatsResponse = {
        success: true,
        stats: mockStats
      };

      // Mock Date.now to control cache expiration
      const originalDateNow = Date.now;
      let currentTime = 1000000;
      spyOn(Date, 'now').and.callFake(() => currentTime);

      // First call - should make HTTP request
      service.getApiUsageStats().subscribe();
      const req1 = httpMock.expectOne(`${apiUrl}/hospitals/api/usage-stats`);
      req1.flush(mockResponse);

      // Advance time beyond cache duration (5 minutes + 1 second)
      currentTime += (5 * 60 * 1000) + 1000;

      // Second call - should make HTTP request again (cache expired)
      service.getApiUsageStats().subscribe(() => {
        // Restore original Date.now
        Date.now = originalDateNow;
        done();
      });
      
      const req2 = httpMock.expectOne(`${apiUrl}/hospitals/api/usage-stats`);
      req2.flush(mockResponse);
    });
  });
});
