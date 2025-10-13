import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { AuthService, AuthResponse, User } from './auth.service';
import { environment } from '../../environments/environment';

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
    it('should clear token and user from localStorage', () => {
      // Set up initial state
      localStorage.setItem('token', 'test-token');
      localStorage.setItem('currentUser', JSON.stringify({
        id: '1',
        name: 'Test User',
        email: 'test@test.com',
        role: 'patient'
      }));

      service.logout();

      expect(localStorage.getItem('token')).toBeNull();
      expect(localStorage.getItem('currentUser')).toBeNull();
      expect(service.currentUserValue).toBeNull();
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
});
