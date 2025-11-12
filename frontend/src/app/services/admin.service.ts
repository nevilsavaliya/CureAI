import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  private apiUrl = 'http://localhost:3000/api';

  constructor(private http: HttpClient) {}

  // Get platform metrics
  getMetrics(): Observable<any> {
    return this.http.get(`${this.apiUrl}/admin/metrics`);
  }

  // Get all users with optional filters
  getUsers(role?: string, search?: string): Observable<any> {
    let url = `${this.apiUrl}/admin/users`;
    const params: string[] = [];
    
    if (role) {
      params.push(`role=${role}`);
    }
    if (search) {
      params.push(`search=${encodeURIComponent(search)}`);
    }
    
    if (params.length > 0) {
      url += '?' + params.join('&');
    }
    
    return this.http.get(url);
  }

  // Get user detail
  getUserDetail(id: string, collectionType?: string): Observable<any> {
    let url = `${this.apiUrl}/admin/users/${id}`;
    if (collectionType) {
      url += `?collectionType=${collectionType}`;
    }
    return this.http.get(url);
  }
}
