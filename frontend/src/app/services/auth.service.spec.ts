import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { AuthService, AuthResponse, User } from './auth.service';
import { environment } from '../../config/environment';

describe('AuthService', () => {
  let service: AuthService;
  let httpMock: HttpTestingController;
  const apiUrl = environment.apiUrl;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [AuthService]
    });
    service = TestBed.inject(AuthService);
    httpMock = TestBed.inject(HttpTestingController);
    
    // Clear localStorage before each test
    localStorage.clear();
  });

  afterEach(() => {
    httpMock.verify();
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('signupPatient', () => {
    it('should signup patient and store token', () => {
      const userData = {
        name: 'Test Patient',
        email: 'patient@test.com',
        password: 'password123'
      };

      const mockResponse: AuthResponse = {
        success: true,
        token: 'test-token',
        user: {
          id: '1',
          name: 'Test Patient',
          email: 'patient@test.com',
          role: 'patient'
        }
      };

      service.signupPatient(userData).subscribe(response => {
        expect(response.success).toBe(true);
        expect(response.token).toBe('test-token');
        expect(localStorage.getItem('token')).toBe('test-token');
        expect(service.currentUserValue).toEqual(mockResponse.user || null);
      });

      const req = httpMock.expectOne(`${apiUrl}/auth/signup/patient`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(userData);
      req.flush(mockResponse);
    });
  });

  describe('signupDoctor', () => {
    it('should signup doctor and store token', () => {
      const userData = {
        name: 'Test Doctor',
        email: 'doctor@test.com',
        password: 'password123',
        specialization: 'Cardiology'
      };

      const mockResponse: AuthResponse = {
        success: true,
        token: 'test-token',
        user: {
          id: '2',
          name: 'Test Doctor',
          email: 'doctor@test.com',
          role: 'doctor'
        }
      };

      service.signupDoctor(userData).subscribe(response => {
        expect(response.success).toBe(true);
        expect(response.token).toBe('test-token');
        expect(localStorage.getItem('token')).toBe('test-token');
        expect(service.currentUserValue).toEqual(mockResponse.user || null);
      });

      const req = httpMock.expectOne(`${apiUrl}/auth/signup/doctor`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(userData);
      req.flush(mockResponse);
    });
  });

  describe('login', () => {
    it('should login user and store token', () => {
      const email = 'test@test.com';
      const password = 'password123';

      const mockResponse: AuthResponse = {
        success: true,
        token: 'test-token',
        user: {
          id: '1',
          name: 'Test User',
          email: 'test@test.com',
          role: 'patient'
        }
      };

      service.login(email, password).subscribe(response => {
        expect(response.success).toBe(true);
        expect(response.token).toBe('test-token');
        expect(localStorage.getItem('token')).toBe('test-token');
        expect(service.currentUserValue).toEqual(mockResponse.user || null);
      });

      const req = httpMock.expectOne(`${apiUrl}/auth/login`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ email, password });
      req.flush(mockResponse);
    });

    it('should handle login failure', () => {
      const email = 'test@test.com';
      const password = 'wrongpassword';

      const mockResponse: AuthResponse = {
        success: false,
        message: 'Invalid credentials'
      };

      service.login(email, password).subscribe(response => {
        expect(response.success).toBe(false);
        expect(response.message).toBe('Invalid credentials');
        expect(localStorage.getItem('token')).toBeNull();
        expect(service.currentUserValue).toBeNull();
      });

      const req = httpMock.expectOne(`${apiUrl}/auth/login`);
      expect(req.request.method).toBe('POST');
      req.flush(mockResponse);
    });
  });

  describe('logout', () => {
    it('should clear all authentication data from localStorage', () => {
      // Set up initial state with various auth-related data
      localStorage.setItem('token', 'test-token');
      localStorage.setItem('currentUser', JSON.stringify({
        id: '1',
        name: 'Test User',
        email: 'test@test.com',
        role: 'patient'
      }));
      localStorage.setItem('hospitalData', 'test-hospital-data');
      localStorage.setItem('hospitalToken', 'test-hospital-token');
      localStorage.setItem('hospitalProfile', 'test-hospital-profile');

      // Mock window.dispatchEvent to test event dispatch
      const dispatchEventSpy = spyOn(window, 'dispatchEvent');

      service.logout();

      // Verify all auth-related data is cleared
      expect(localStorage.getItem('token')).toBeNull();
      expect(localStorage.getItem('currentUser')).toBeNull();
      expect(localStorage.getItem('hospitalData')).toBeNull();
      expect(localStorage.getItem('hospitalToken')).toBeNull();
      expect(localStorage.getItem('hospitalProfile')).toBeNull();
      expect(service.currentUserValue).toBeNull();

      // Verify logout event is dispatched
      expect(dispatchEventSpy).toHaveBeenCalledWith(new CustomEvent('auth:logout'));
    });

    it('should handle logout event dispatch failure gracefully', () => {
      // Mock window.dispatchEvent to throw an error
      spyOn(window, 'dispatchEvent').and.throwError('Event dispatch failed');
      spyOn(console, 'warn'); // Spy on console.warn to verify error handling

      localStorage.setItem('token', 'test-token');
      localStorage.setItem('currentUser', JSON.stringify({
        id: '1',
        name: 'Test User',
        email: 'test@test.com',
        role: 'patient'
      }));

      // Should not throw error
      expect(() => service.logout()).not.toThrow();

      // Verify data is still cleared despite event dispatch failure
      expect(localStorage.getItem('token')).toBeNull();
      expect(localStorage.getItem('currentUser')).toBeNull();
      expect(service.currentUserValue).toBeNull();
      expect(console.warn).toHaveBeenCalledWith('Failed to dispatch logout event:', jasmine.any(Error));
    });
  });

  describe('getToken', () => {
    it('should return token from localStorage', () => {
      localStorage.setItem('token', 'test-token');
      expect(service.getToken()).toBe('test-token');
    });

    it('should return null if no token exists', () => {
      expect(service.getToken()).toBeNull();
    });
  });

  describe('isLoggedIn', () => {
    it('should return true if token exists', () => {
      localStorage.setItem('token', 'test-token');
      expect(service.isLoggedIn()).toBe(true);
    });

    it('should return false if no token exists', () => {
      expect(service.isLoggedIn()).toBe(false);
    });
  });

  describe('getUserRole', () => {
    it('should return user role if user exists', () => {
      const user: User = {
        id: '1',
        name: 'Test User',
        email: 'test@test.com',
        role: 'patient'
      };
      
      localStorage.setItem('currentUser', JSON.stringify(user));
      
      // Create new service instance to load from localStorage
      const newService = new AuthService(TestBed.inject(HttpClientTestingModule) as any);
      
      expect(newService.getUserRole()).toBe('patient');
    });

    it('should return null if no user exists', () => {
      expect(service.getUserRole()).toBeNull();
    });
  });

  describe('verifyToken', () => {
    it('should verify token', () => {
      const mockResponse = {
        success: true,
        valid: true
      };

      service.verifyToken().subscribe(response => {
        expect(response.success).toBe(true);
        expect(response.valid).toBe(true);
      });

      const req = httpMock.expectOne(`${apiUrl}/auth/verify`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });
  });

  describe('isTokenExpired', () => {
    it('should return true if no token exists', () => {
      expect(service.isTokenExpired()).toBe(true);
    });

    it('should return true if token is expired', () => {
      // Create an expired token (expired 1 hour ago)
      const expiredTime = Math.floor(Date.now() / 1000) - 3600;
      const payload = { exp: expiredTime };
      const token = 'header.' + btoa(JSON.stringify(payload)) + '.signature';
      
      localStorage.setItem('token', token);
      expect(service.isTokenExpired()).toBe(true);
    });

    it('should return false if token is valid', () => {
      // Create a valid token (expires in 1 hour)
      const futureTime = Math.floor(Date.now() / 1000) + 3600;
      const payload = { exp: futureTime };
      const token = 'header.' + btoa(JSON.stringify(payload)) + '.signature';
      
      localStorage.setItem('token', token);
      expect(service.isTokenExpired()).toBe(false);
    });

    it('should return true if token is malformed', () => {
      localStorage.setItem('token', 'invalid-token');
      expect(service.isTokenExpired()).toBe(true);
    });
  });

  describe('refreshSession', () => {
    it('should return false and logout if token is expired', (done) => {
      // Create an expired token
      const expiredTime = Math.floor(Date.now() / 1000) - 3600;
      const payload = { exp: expiredTime };
      const token = 'header.' + btoa(JSON.stringify(payload)) + '.signature';
      
      localStorage.setItem('token', token);
      localStorage.setItem('currentUser', JSON.stringify({
        id: '1',
        name: 'Test User',
        email: 'test@test.com',
        role: 'patient'
      }));

      service.refreshSession().subscribe(isValid => {
        expect(isValid).toBe(false);
        expect(localStorage.getItem('token')).toBeNull();
        expect(localStorage.getItem('currentUser')).toBeNull();
        done();
      });
    });

    it('should return true if token is valid and verification succeeds', (done) => {
      // Create a valid token
      const futureTime = Math.floor(Date.now() / 1000) + 3600;
      const payload = { exp: futureTime };
      const token = 'header.' + btoa(JSON.stringify(payload)) + '.signature';
      
      localStorage.setItem('token', token);

      const mockResponse = {
        success: true,
        valid: true
      };

      service.refreshSession().subscribe(isValid => {
        expect(isValid).toBe(true);
        done();
      });

      const req = httpMock.expectOne(`${apiUrl}/auth/verify`);
      req.flush(mockResponse);
    });

    it('should return false and logout if verification fails', (done) => {
      // Create a valid token
      const futureTime = Math.floor(Date.now() / 1000) + 3600;
      const payload = { exp: futureTime };
      const token = 'header.' + btoa(JSON.stringify(payload)) + '.signature';
      
      localStorage.setItem('token', token);
      localStorage.setItem('currentUser', JSON.stringify({
        id: '1',
        name: 'Test User',
        email: 'test@test.com',
        role: 'patient'
      }));

      const mockResponse = {
        success: false,
        valid: false
      };

      service.refreshSession().subscribe(isValid => {
        expect(isValid).toBe(false);
        expect(localStorage.getItem('token')).toBeNull();
        expect(localStorage.getItem('currentUser')).toBeNull();
        done();
      });

      const req = httpMock.expectOne(`${apiUrl}/auth/verify`);
      req.flush(mockResponse);
    });
  });

  describe('currentUser observable', () => {
    it('should emit current user value', (done) => {
      const user: User = {
        id: '1',
        name: 'Test User',
        email: 'test@test.com',
        role: 'patient'
      };

      service.currentUser.subscribe(currentUser => {
        if (currentUser) {
          expect(currentUser).toEqual(user);
          done();
        }
      });

      // Trigger login to update currentUser
      const mockResponse: AuthResponse = {
        success: true,
        token: 'test-token',
        user: user
      };

      service.login('test@test.com', 'password123').subscribe();

      const req = httpMock.expectOne(`${apiUrl}/auth/login`);
      req.flush(mockResponse);
    });
  });

  describe('Session Management', () => {
    it('should automatically logout when token expires', (done) => {
      // Create an expired token (expired 1 hour ago)
      const expiredTime = Math.floor(Date.now() / 1000) - 3600;
      const payload = { exp: expiredTime };
      const token = 'header.' + btoa(JSON.stringify(payload)) + '.signature';
      
      localStorage.setItem('token', token);
      localStorage.setItem('currentUser', JSON.stringify({
        id: '1',
        name: 'Test User',
        email: 'test@test.com',
        role: 'patient'
      }));

      // Create new service instance to trigger token expiration check
      const newService = new AuthService(TestBed.inject(HttpClientTestingModule) as any);

      // Check that logout was called automatically
      setTimeout(() => {
        expect(localStorage.getItem('token')).toBeNull();
        expect(localStorage.getItem('currentUser')).toBeNull();
        expect(newService.currentUserValue).toBeNull();
        done();
      }, 100);
    });

    it('should set up automatic logout timer for valid token', (done) => {
      // Create a token that expires in 2 seconds
      const futureTime = Math.floor(Date.now() / 1000) + 2;
      const payload = { exp: futureTime };
      const token = 'header.' + btoa(JSON.stringify(payload)) + '.signature';
      
      localStorage.setItem('token', token);
      localStorage.setItem('currentUser', JSON.stringify({
        id: '1',
        name: 'Test User',
        email: 'test@test.com',
        role: 'patient'
      }));

      // Create new service instance to trigger token expiration check
      const newService = new AuthService(TestBed.inject(HttpClientTestingModule) as any);

      // Token should still be valid initially
      expect(newService.isLoggedIn()).toBe(true);

      // Wait for automatic logout (should happen before token expires)
      setTimeout(() => {
        expect(localStorage.getItem('token')).toBeNull();
        expect(localStorage.getItem('currentUser')).toBeNull();
        expect(newService.currentUserValue).toBeNull();
        done();
      }, 2500); // Wait a bit longer than token expiration
    });

    it('should start session validation and refresh session', (done) => {
      // Create a valid token
      const futureTime = Math.floor(Date.now() / 1000) + 3600;
      const payload = { exp: futureTime };
      const token = 'header.' + btoa(JSON.stringify(payload)) + '.signature';
      
      localStorage.setItem('token', token);
      localStorage.setItem('currentUser', JSON.stringify({
        id: '1',
        name: 'Test User',
        email: 'test@test.com',
        role: 'patient'
      }));

      const mockResponse = {
        success: true,
        valid: true
      };

      // Start session validation
      service.startSessionValidation();

      // Should make a verification request
      setTimeout(() => {
        const req = httpMock.expectOne(`${apiUrl}/auth/verify`);
        req.flush(mockResponse);
        done();
      }, 100);
    });

    it('should handle session validation failure', (done) => {
      // Create a valid token
      const futureTime = Math.floor(Date.now() / 1000) + 3600;
      const payload = { exp: futureTime };
      const token = 'header.' + btoa(JSON.stringify(payload)) + '.signature';
      
      localStorage.setItem('token', token);
      localStorage.setItem('currentUser', JSON.stringify({
        id: '1',
        name: 'Test User',
        email: 'test@test.com',
        role: 'patient'
      }));

      const mockResponse = {
        success: false,
        valid: false
      };

      service.refreshSession().subscribe(isValid => {
        expect(isValid).toBe(false);
        expect(localStorage.getItem('token')).toBeNull();
        expect(localStorage.getItem('currentUser')).toBeNull();
        done();
      });

      const req = httpMock.expectOne(`${apiUrl}/auth/verify`);
      req.flush(mockResponse);
    });

    it('should handle session validation network error', (done) => {
      // Create a valid token
      const futureTime = Math.floor(Date.now() / 1000) + 3600;
      const payload = { exp: futureTime };
      const token = 'header.' + btoa(JSON.stringify(payload)) + '.signature';
      
      localStorage.setItem('token', token);
      localStorage.setItem('currentUser', JSON.stringify({
        id: '1',
        name: 'Test User',
        email: 'test@test.com',
        role: 'patient'
      }));

      service.refreshSession().subscribe(isValid => {
        expect(isValid).toBe(false);
        expect(localStorage.getItem('token')).toBeNull();
        expect(localStorage.getItem('currentUser')).toBeNull();
        done();
      });

      const req = httpMock.expectOne(`${apiUrl}/auth/verify`);
      req.error(new ErrorEvent('Network error'));
    });
  });

  describe('Enhanced Logout Functionality', () => {
    it('should clear all hospital-related data on logout', () => {
      // Set up various auth and hospital-related data
      localStorage.setItem('token', 'test-token');
      localStorage.setItem('currentUser', JSON.stringify({
        id: '1',
        name: 'Test User',
        email: 'test@test.com',
        role: 'patient'
      }));
      localStorage.setItem('hospitalData', 'test-hospital-data');
      localStorage.setItem('hospitalToken', 'test-hospital-token');
      localStorage.setItem('hospitalProfile', 'test-hospital-profile');

      service.logout();

      // Verify all data is cleared
      expect(localStorage.getItem('token')).toBeNull();
      expect(localStorage.getItem('currentUser')).toBeNull();
      expect(localStorage.getItem('hospitalData')).toBeNull();
      expect(localStorage.getItem('hospitalToken')).toBeNull();
      expect(localStorage.getItem('hospitalProfile')).toBeNull();
      expect(service.currentUserValue).toBeNull();
    });

    it('should clear token expiration timer on logout', () => {
      // Create a valid token
      const futureTime = Math.floor(Date.now() / 1000) + 3600;
      const payload = { exp: futureTime };
      const token = 'header.' + btoa(JSON.stringify(payload)) + '.signature';
      
      localStorage.setItem('token', token);
      localStorage.setItem('currentUser', JSON.stringify({
        id: '1',
        name: 'Test User',
        email: 'test@test.com',
        role: 'patient'
      }));

      // Create new service instance to set up timer
      const newService = new AuthService(TestBed.inject(HttpClientTestingModule) as any);
      
      // Spy on clearTimeout to verify timer is cleared
      const clearTimeoutSpy = spyOn(window, 'clearTimeout');

      newService.logout();

      expect(clearTimeoutSpy).toHaveBeenCalled();
    });

    it('should dispatch auth:logout event to clear service caches', () => {
      const dispatchEventSpy = spyOn(window, 'dispatchEvent');

      localStorage.setItem('token', 'test-token');
      localStorage.setItem('currentUser', JSON.stringify({
        id: '1',
        name: 'Test User',
        email: 'test@test.com',
        role: 'patient'
      }));

      service.logout();

      expect(dispatchEventSpy).toHaveBeenCalledWith(new CustomEvent('auth:logout'));
    });
  });
});
