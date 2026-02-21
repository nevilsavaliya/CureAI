import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, retryWhen } from 'rxjs/operators';
import { environment } from '../../config/environment';
import { ErrorHandlerService } from './error-handler.service';

export interface Case {
  _id: string;
  patientId: string | {
    _id: string;
    name: string;
    email: string;
    bloodGroup?: string;
  };
  doctorId: {
    _id: string;
    name: string;
    email: string;
    degree: string;
    speciality: string;
    experienceYears: number;
    rating: number;
  };
  status: 'pending' | 'ongoing' | 'treated' | 'rejected';
  symptoms: string[];
  predictedConditions: string[];
  predictionConfidence?: Array<{
    condition: string;
    confidence: number;
  }>;
  chatbotHistory: Array<{
    question: string;
    answer: string;
    timestamp: Date;
  }>;
  createdAt: Date;
  acceptedAt?: Date;
  treatedAt?: Date;
  rejectedAt?: Date;
  lastMessageAt?: Date;
  feedback?: {
    rating: number;
    comment: string;
    submittedAt: Date;
  };
  unreadCount?: number;
}

export interface Message {
  _id: string;
  caseId: string;
  senderId: string;
  senderType: 'patient' | 'doctor';
  receiverId: string;
  receiverType: 'patient' | 'doctor';
  content: string;
  isRead: boolean;
  readAt?: Date;
  createdAt: Date;
}

@Injectable({
  providedIn: 'root'
})
export class CaseService {
  private apiUrl = `${environment.apiUrl}/cases`;

  constructor(
    private http: HttpClient,
    private errorHandler: ErrorHandlerService
  ) {}

  // Create a new case
  createCase(doctorId: string, symptoms?: string[], predictedConditions?: string[], chatbotHistory?: any[]): Observable<any> {
    return this.http.post(`${this.apiUrl}`, { 
      doctorId,
      symptoms,
      predictedConditions,
      chatbotHistory
    }).pipe(
      catchError((error: HttpErrorResponse) => {
        const errorDetails = this.errorHandler.handleError(error, 'Failed to create case');
        return throwError(() => errorDetails);
      })
    );
  }

  // Get all cases for the current user
  getCases(page?: number, limit?: number): Observable<any> {
    let url = this.apiUrl;
    const params: string[] = [];
    
    if (page !== undefined) {
      params.push(`page=${page}`);
    }
    if (limit !== undefined) {
      params.push(`limit=${limit}`);
    }
    
    if (params.length > 0) {
      url += '?' + params.join('&');
    }
    
    return this.http.get(url).pipe(
      retryWhen(this.errorHandler.retryStrategy(2, 1000)),
      catchError((error: HttpErrorResponse) => {
        const errorDetails = this.errorHandler.handleError(error, 'Failed to load cases');
        return throwError(() => errorDetails);
      })
    );
  }

  // Get a specific case by ID
  getCaseById(caseId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/${caseId}`).pipe(
      retryWhen(this.errorHandler.retryStrategy(2, 1000)),
      catchError((error: HttpErrorResponse) => {
        const errorDetails = this.errorHandler.handleError(error, 'Failed to load case details');
        return throwError(() => errorDetails);
      })
    );
  }

  // Get messages for a case
  getCaseMessages(caseId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/${caseId}/messages`).pipe(
      retryWhen(this.errorHandler.retryStrategy(2, 1000)),
      catchError((error: HttpErrorResponse) => {
        const errorDetails = this.errorHandler.handleError(error, 'Failed to load messages');
        return throwError(() => errorDetails);
      })
    );
  }

  // Send a message in a case
  sendMessage(caseId: string, content: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/${caseId}/messages`, { content }).pipe(
      catchError((error: HttpErrorResponse) => {
        const errorDetails = this.errorHandler.handleError(error, 'Failed to send message');
        return throwError(() => errorDetails);
      })
    );
  }

  // Mark message as read
  markMessageAsRead(messageId: string): Observable<any> {
    return this.http.put(`${environment.apiUrl}/messages/${messageId}/read`, {}).pipe(
      catchError((error: HttpErrorResponse) => {
        const errorDetails = this.errorHandler.handleError(error, 'Failed to mark message as read');
        return throwError(() => errorDetails);
      })
    );
  }

  // Submit feedback for a treated case
  submitFeedback(caseId: string, rating: number, comment: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/${caseId}/feedback`, { rating, comment }).pipe(
      catchError((error: HttpErrorResponse) => {
        const errorDetails = this.errorHandler.handleError(error, 'Failed to submit feedback');
        return throwError(() => errorDetails);
      })
    );
  }

  // Accept a case (doctor)
  acceptCase(caseId: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/${caseId}/accept`, {}).pipe(
      catchError((error: HttpErrorResponse) => {
        const errorDetails = this.errorHandler.handleError(error, 'Failed to accept case');
        return throwError(() => errorDetails);
      })
    );
  }

  // Reject a case (doctor)
  rejectCase(caseId: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/${caseId}/reject`, {}).pipe(
      catchError((error: HttpErrorResponse) => {
        const errorDetails = this.errorHandler.handleError(error, 'Failed to reject case');
        return throwError(() => errorDetails);
      })
    );
  }

  // Mark case as treated (doctor)
  markAsTreated(caseId: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/${caseId}/mark-treated`, {}).pipe(
      catchError((error: HttpErrorResponse) => {
        const errorDetails = this.errorHandler.handleError(error, 'Failed to mark case as treated');
        return throwError(() => errorDetails);
      })
    );
  }

  // Schedule video consultation (doctor)
  scheduleVideoConsultation(caseId: string, scheduledDate: string, scheduledTime: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/${caseId}/schedule-consultation`, { 
      scheduledDate, 
      scheduledTime 
    }).pipe(
      catchError((error: HttpErrorResponse) => {
        const errorDetails = this.errorHandler.handleError(error, 'Failed to schedule video consultation');
        return throwError(() => errorDetails);
      })
    );
  }
}
