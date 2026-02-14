import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../config/environment';

export interface FollowUpQuestion {
  questionId: string;
  questionText: string;
  questionType: 'multiple_choice' | 'yes_no' | 'scale' | 'text';
  options?: string[];
  min?: number;
  max?: number;
}

export interface SymptomConversation {
  conversationId: string;
  questions: FollowUpQuestion[];
  answeredCount: number;
  totalQuestions: number;
  canProceedToPrediction: boolean;
}

export interface PredictionWithConfidence {
  disease: string;
  confidence: number;
  specializations: string[];
}

export interface DoctorRecommendation {
  _id: string;
  name: string;
  email: string;
  degree: string;
  specializations: string[];
  experienceYears: number;
  rating: number;
  totalReviews: number;
  isGeneralMedicine: boolean;
  relevanceScore?: number;
}

@Injectable({
  providedIn: 'root'
})
export class SymptomService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  submitSymptom(symptomText: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/symptoms`, { symptomText });
  }

  getSymptoms(): Observable<any> {
    return this.http.get(`${this.apiUrl}/symptoms`);
  }

  // New conversation-based endpoints
  startConversation(initialSymptom: string): Observable<any> {
    console.log('Starting conversation with URL:', `${this.apiUrl}/symptoms/conversation`);
    return this.http.post(`${this.apiUrl}/symptoms/conversation`, { initialSymptom });
  }

  submitAnswer(conversationId: string, questionId: string, answer: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/symptoms/conversation/${conversationId}/answer`, {
      questionId,
      answer
    });
  }

  getPrediction(conversationId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/symptoms/conversation/${conversationId}/prediction`);
  }

  getConversationHistory(conversationId: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/symptoms/conversation/${conversationId}`);
  }
}
