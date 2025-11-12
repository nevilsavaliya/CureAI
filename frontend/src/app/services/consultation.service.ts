import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ConsultationService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  scheduleConsultation(patientId: string, doctorId: string, scheduledDate: string, scheduledTime: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/consultations`, {
      patientId,
      doctorId,
      scheduledDate,
      scheduledTime
    });
  }

  getConsultations(role: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/consultations/${role}`);
  }

  joinConsultation(consultationId: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/consultations/${consultationId}/join`, {});
  }

  updateConsultationStatus(consultationId: string, status: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/consultations/${consultationId}`, { status });
  }
}
