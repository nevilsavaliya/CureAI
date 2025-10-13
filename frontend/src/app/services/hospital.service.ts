import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Hospital {
  _id: string;
  name: string;
  email: string;
  hospitalName: string;
  registrationNumber: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  contactNumber: string;
  emergencyContact: string;
  website?: string;
  specializations: string[];
  numberOfBeds: number;
  facilities: string[];
  verificationStatus: 'pending' | 'verified' | 'rejected';
  verifiedAt?: Date;
  verifiedBy?: string;
  rejectionReason?: string;
  apiKey?: string;
  apiKeyGeneratedAt?: Date;
  lastApiAccess?: Date;
  apiAccessCount: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface HospitalResponse {
  success: boolean;
  message?: string;
  hospital?: Hospital;
  hospitals?: Hospital[];
  count?: number;
}

export interface HospitalLoginResponse {
  success: boolean;
  message?: string;
  token?: string;
  hospital?: Hospital;
  verificationStatus?: 'pending' | 'verified' | 'rejected';
  rejectionReason?: string;
}

@Injectable({
  providedIn: 'root'
})
export class HospitalService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  /**
   * Get all hospitals with optional filters
   * @param status - Optional filter by verification status (pending/verified/rejected)
   * @param search - Optional search term for hospital name or email
   * @returns Observable of hospital list response
   */
  getAllHospitals(status?: string, search?: string): Observable<HospitalResponse> {
    let params = new HttpParams();
    
    if (status) {
      params = params.set('status', status);
    }
    
    if (search) {
      params = params.set('search', search);
    }
    
    return this.http.get<HospitalResponse>(
      `${this.apiUrl}/admin/hospitals`,
      { params }
    );
  }

  /**
   * Get specific hospital details by ID
   * @param id - Hospital ID
   * @returns Observable of hospital detail response
   */
  getHospitalById(id: string): Observable<HospitalResponse> {
    return this.http.get<HospitalResponse>(
      `${this.apiUrl}/admin/hospitals/${id}`
    );
  }

  /**
   * Verify a hospital application
   * Generates API credentials and sends them via email
   * @param id - Hospital ID
   * @returns Observable of verification response
   */
  verifyHospital(id: string): Observable<HospitalResponse> {
    return this.http.put<HospitalResponse>(
      `${this.apiUrl}/admin/hospitals/${id}/verify`,
      {}
    );
  }

  /**
   * Reject a hospital application
   * @param id - Hospital ID
   * @param reason - Optional rejection reason
   * @returns Observable of rejection response
   */
  rejectHospital(id: string, reason?: string): Observable<HospitalResponse> {
    const body = reason ? { reason } : {};
    
    return this.http.put<HospitalResponse>(
      `${this.apiUrl}/admin/hospitals/${id}/reject`,
      body
    );
  }

  /**
   * Revoke hospital access
   * Deactivates the hospital and invalidates API credentials
   * @param id - Hospital ID
   * @param reason - Optional revocation reason
   * @returns Observable of revocation response
   */
  revokeHospitalAccess(id: string, reason?: string): Observable<HospitalResponse> {
    const body = reason ? { reason } : {};
    
    return this.http.put<HospitalResponse>(
      `${this.apiUrl}/admin/hospitals/${id}/revoke`,
      body
    );
  }

  /**
   * Register a new hospital
   * @param formData - FormData containing hospital registration details and documents
   * @returns Observable of registration response
   */
  registerHospital(formData: FormData): Observable<HospitalResponse> {
    return this.http.post<HospitalResponse>(
      `${this.apiUrl}/hospitals/register`,
      formData
    );
  }

  /**
   * Hospital login
   * @param email - Hospital email
   * @param password - Hospital password
   * @param rememberMe - Remember me flag
   * @returns Observable of login response
   */
  loginHospital(email: string, password: string, rememberMe: boolean = false): Observable<HospitalLoginResponse> {
    return this.http.post<HospitalLoginResponse>(
      `${this.apiUrl}/hospitals/login`,
      { email, password, rememberMe }
    );
  }

  /**
   * Get count of pending hospitals
   * @returns Observable of hospital response with count
   */
  getPendingHospitalsCount(): Observable<HospitalResponse> {
    return this.http.get<HospitalResponse>(
      `${this.apiUrl}/admin/hospitals?status=pending`
    );
  }

  /**
   * Get hospital statistics
   * @returns Observable of hospital statistics response
   */
  getHospitalStatistics(): Observable<any> {
    return this.http.get<any>(
      `${this.apiUrl}/admin/hospitals/statistics`
    );
  }
}
