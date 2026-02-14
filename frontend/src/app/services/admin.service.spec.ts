import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { AdminService } from './admin.service';
import { environment } from '../../config/environment';

describe('AdminService', () => {
  let service: AdminService;
  let httpMock: HttpTestingController;
  const apiUrl = environment.apiUrl;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [AdminService]
    });
    service = TestBed.inject(AdminService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getMetrics', () => {
    it('should fetch platform metrics', () => {
      const mockResponse = {
        success: true,
        metrics: {
          totalUsers: 100,
          totalDoctors: 20,
          totalPatients: 80,
          totalCases: 50
        }
      };

      service.getMetrics().subscribe(response => {
        expect(response.success).toBe(true);
        expect(response.metrics.totalUsers).toBe(100);
      });

      const req = httpMock.expectOne(`${apiUrl}/admin/metrics`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });
  });

  describe('getUsers', () => {
    it('should fetch all users without filters', () => {
      const mockResponse = {
        success: true,
        users: []
      };

      service.getUsers().subscribe(response => {
        expect(response.success).toBe(true);
        expect(response.users).toEqual([]);
      });

      const req = httpMock.expectOne(`${apiUrl}/admin/users`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should fetch users with role filter', () => {
      const role = 'doctor';
      const mockResponse = {
        success: true,
        users: [
          { _id: '1', name: 'Dr. Smith', role: 'doctor' }
        ]
      };

      service.getUsers(role).subscribe(response => {
        expect(response.success).toBe(true);
        expect(response.users.length).toBe(1);
      });

      const req = httpMock.expectOne(`${apiUrl}/admin/users?role=${role}`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should fetch users with search filter', () => {
      const search = 'John Doe';
      const mockResponse = {
        success: true,
        users: [
          { _id: '1', name: 'John Doe', role: 'patient' }
        ]
      };

      service.getUsers(undefined, search).subscribe(response => {
        expect(response.success).toBe(true);
        expect(response.users.length).toBe(1);
      });

      const req = httpMock.expectOne(`${apiUrl}/admin/users?search=${encodeURIComponent(search)}`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should fetch users with both role and search filters', () => {
      const role = 'doctor';
      const search = 'Smith';
      const mockResponse = {
        success: true,
        users: [
          { _id: '1', name: 'Dr. Smith', role: 'doctor' }
        ]
      };

      service.getUsers(role, search).subscribe(response => {
        expect(response.success).toBe(true);
        expect(response.users.length).toBe(1);
      });

      const req = httpMock.expectOne(`${apiUrl}/admin/users?role=${role}&search=${encodeURIComponent(search)}`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });
  });

  describe('getUserDetail', () => {
    it('should fetch user detail without collection type', () => {
      const userId = 'user123';
      const mockResponse = {
        success: true,
        user: { _id: userId, name: 'John Doe' }
      };

      service.getUserDetail(userId).subscribe(response => {
        expect(response.success).toBe(true);
        expect(response.user._id).toBe(userId);
      });

      const req = httpMock.expectOne(`${apiUrl}/admin/users/${userId}`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should fetch user detail with collection type', () => {
      const userId = 'user123';
      const collectionType = 'doctors';
      const mockResponse = {
        success: true,
        user: { _id: userId, name: 'Dr. Smith', role: 'doctor' }
      };

      service.getUserDetail(userId, collectionType).subscribe(response => {
        expect(response.success).toBe(true);
        expect(response.user._id).toBe(userId);
      });

      const req = httpMock.expectOne(`${apiUrl}/admin/users/${userId}?collectionType=${collectionType}`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });
  });
});
