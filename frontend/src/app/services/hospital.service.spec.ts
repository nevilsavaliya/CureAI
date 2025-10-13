import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { HospitalService, Hospital, HospitalResponse, HospitalLoginResponse } from './hospital.service';
import { environment } from '../../environments/environment';

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
});
