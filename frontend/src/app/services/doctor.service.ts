import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class DoctorService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getMatchingDoctors(specialization?: string): Observable<any> {
    let url = `${this.apiUrl}/doctors/match`;
    if (specialization) {
      url += `?specialization=${specialization}`;
    }
    return this.http.get(url);
  }
}
