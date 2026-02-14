import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../config/environment';

@Injectable({
  providedIn: 'root'
})
export class ProfileService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  savePatientProfile(profileData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/patients/profile`, profileData);
  }

  saveDoctorProfile(profileData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/doctors/profile`, profileData);
  }

  getProfile(): Observable<any> {
    return this.http.get(`${this.apiUrl}/profiles`);
  }
}
