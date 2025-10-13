import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { CaseService, Case, Message } from './case.service';
import { ErrorHandlerService } from './error-handler.service';
import { environment } from '../../environments/environment';

describe('CaseService', () => {
  let service: CaseService;
  let httpMock: HttpTestingController;
  let errorHandlerService: jasmine.SpyObj<ErrorHandlerService>;
  const apiUrl = `${environment.apiUrl}/cases`;

  beforeEach(() => {
    const errorHandlerSpy = jasmine.createSpyObj('ErrorHandlerService', ['handleError', 'retryStrategy']);
    errorHandlerSpy.retryStrategy.and.returnValue((errors: any) => errors);

    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        CaseService,
        { provide: ErrorHandlerService, useValue: errorHandlerSpy }
      ]
    });
    
    service = TestBed.inject(CaseService);
    httpMock = TestBed.inject(HttpTestingController);
    errorHandlerService = TestBed.inject(ErrorHandlerService) as jasmine.SpyObj<ErrorHandlerService>;
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('createCase', () => {
    it('should create a new case', () => {
      const doctorId = 'doctor123';
      const symptoms = ['fever', 'cough'];
      const predictedConditions = ['flu'];
      const mockResponse = {
        success: true,
        case: { _id: 'case123', doctorId, symptoms }
      };

      service.createCase(doctorId, symptoms, predictedConditions).subscribe(response => {
        expect(response.success).toBe(true);
        expect(response.case._id).toBe('case123');
      });

      const req = httpMock.expectOne(apiUrl);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ doctorId, symptoms, predictedConditions, chatbotHistory: undefined });
      req.flush(mockResponse);
    });
  });

  describe('getCases', () => {
    it('should fetch all cases', () => {
      const mockResponse = {
        success: true,
        cases: []
      };

      service.getCases().subscribe(response => {
        expect(response.success).toBe(true);
        expect(response.cases).toEqual([]);
      });

      const req = httpMock.expectOne(apiUrl);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });
  });

  describe('getCaseById', () => {
    it('should fetch case by id', () => {
      const caseId = 'case123';
      const mockResponse = {
        success: true,
        case: { _id: caseId, status: 'pending' }
      };

      service.getCaseById(caseId).subscribe(response => {
        expect(response.success).toBe(true);
        expect(response.case._id).toBe(caseId);
      });

      const req = httpMock.expectOne(`${apiUrl}/${caseId}`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });
  });

  describe('getCaseMessages', () => {
    it('should fetch messages for a case', () => {
      const caseId = 'case123';
      const mockResponse = {
        success: true,
        messages: []
      };

      service.getCaseMessages(caseId).subscribe(response => {
        expect(response.success).toBe(true);
        expect(response.messages).toEqual([]);
      });

      const req = httpMock.expectOne(`${apiUrl}/${caseId}/messages`);
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });
  });

  describe('sendMessage', () => {
    it('should send a message', () => {
      const caseId = 'case123';
      const content = 'Hello doctor';
      const mockResponse = {
        success: true,
        message: { _id: 'msg123', content }
      };

      service.sendMessage(caseId, content).subscribe(response => {
        expect(response.success).toBe(true);
        expect(response.message.content).toBe(content);
      });

      const req = httpMock.expectOne(`${apiUrl}/${caseId}/messages`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ content });
      req.flush(mockResponse);
    });
  });

  describe('markMessageAsRead', () => {
    it('should mark message as read', () => {
      const messageId = 'msg123';
      const mockResponse = {
        success: true
      };

      service.markMessageAsRead(messageId).subscribe(response => {
        expect(response.success).toBe(true);
      });

      const req = httpMock.expectOne(`${environment.apiUrl}/messages/${messageId}/read`);
      expect(req.request.method).toBe('PUT');
      req.flush(mockResponse);
    });
  });

  describe('submitFeedback', () => {
    it('should submit feedback', () => {
      const caseId = 'case123';
      const rating = 5;
      const comment = 'Great service';
      const mockResponse = {
        success: true
      };

      service.submitFeedback(caseId, rating, comment).subscribe(response => {
        expect(response.success).toBe(true);
      });

      const req = httpMock.expectOne(`${apiUrl}/${caseId}/feedback`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ rating, comment });
      req.flush(mockResponse);
    });
  });

  describe('acceptCase', () => {
    it('should accept a case', () => {
      const caseId = 'case123';
      const mockResponse = {
        success: true
      };

      service.acceptCase(caseId).subscribe(response => {
        expect(response.success).toBe(true);
      });

      const req = httpMock.expectOne(`${apiUrl}/${caseId}/accept`);
      expect(req.request.method).toBe('PUT');
      req.flush(mockResponse);
    });
  });

  describe('rejectCase', () => {
    it('should reject a case', () => {
      const caseId = 'case123';
      const mockResponse = {
        success: true
      };

      service.rejectCase(caseId).subscribe(response => {
        expect(response.success).toBe(true);
      });

      const req = httpMock.expectOne(`${apiUrl}/${caseId}/reject`);
      expect(req.request.method).toBe('PUT');
      req.flush(mockResponse);
    });
  });

  describe('markAsTreated', () => {
    it('should mark case as treated', () => {
      const caseId = 'case123';
      const mockResponse = {
        success: true
      };

      service.markAsTreated(caseId).subscribe(response => {
        expect(response.success).toBe(true);
      });

      const req = httpMock.expectOne(`${apiUrl}/${caseId}/mark-treated`);
      expect(req.request.method).toBe('PUT');
      req.flush(mockResponse);
    });
  });

  describe('scheduleVideoConsultation', () => {
    it('should schedule video consultation', () => {
      const caseId = 'case123';
      const scheduledDate = '2024-12-10';
      const scheduledTime = '14:00';
      const mockResponse = {
        success: true
      };

      service.scheduleVideoConsultation(caseId, scheduledDate, scheduledTime).subscribe(response => {
        expect(response.success).toBe(true);
      });

      const req = httpMock.expectOne(`${apiUrl}/${caseId}/schedule-consultation`);
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual({ scheduledDate, scheduledTime });
      req.flush(mockResponse);
    });
  });
});
