import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { DoctorService } from './doctor.service';
import { environment } from '../../config/environment';

describe('DoctorService', () => {
  let service: DoctorService;
  let httpMock: HttpTestingController;
  const apiUrl = environment.apiUrl;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [DoctorService]
    });
    service = TestBed.inject(DoctorService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('getMatchingDoctors', () => {
    it('should fetch matching doctors without specialization', () => {
      const mockResponse = {
        success: true,
        doctors: [
          { _id: '1', name: 'Dr. Smith', speciality: 'Cardiology' },
          { _id: '2', name: 'Dr. Jones', speciality: 'Neurology' }
        ]
      };

      service.getMatchingDoctors().subscribe(response => {
        expect(response.success).toBe(true);
        expect(response.doctors.length).toBe(2);
      });

      const req = httpMock.expectOne(`${apiUrl}/doctors/match`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should fetch matching doctors with specialization filter', () => {
      const specialization = 'Cardiology';
      const mockResponse = {
        success: true,
        doctors: [
          { _id: '1', name: 'Dr. Smith', speciality: 'Cardiology' }
        ]
      };

      service.getMatchingDoctors(specialization).subscribe(response => {
        expect(response.success).toBe(true);
        expect(response.doctors.length).toBe(1);
        expect(response.doctors[0].speciality).toBe('Cardiology');
      });

      const req = httpMock.expectOne(`${apiUrl}/doctors/match?specialization=${specialization}`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });
  });
});
