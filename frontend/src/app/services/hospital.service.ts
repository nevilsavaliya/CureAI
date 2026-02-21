import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, of } from 'rxjs';
import { catchError, retry, map } from 'rxjs/operators';
import { environment } from '../../config/environment';

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

export interface HospitalLoginData {
  id: string;
  name: string;
  hospitalName: string;
  email: string;
  apiKey?: string;
  verificationStatus: 'pending' | 'verified' | 'rejected';
}

export interface HospitalLoginResponse {
  success: boolean;
  message?: string;
  token?: string;
  hospital?: HospitalLoginData;
  verificationStatus?: 'pending' | 'verified' | 'rejected';
  rejectionReason?: string;
}

export interface HospitalApiStats {
  totalRequests: number;
  requestsToday: number;
  requestsThisWeek: number;
  requestsThisMonth: number;
  averageResponseTime: number;
  successRate: number;
  remainingRequests: number;
  rateLimit: number;
  lastUpdated?: Date;
}

export interface ApiRequest {
  id: string;
  patientEmail: string;
  timestamp: Date;
  status: 'success' | 'error';
  responseTime?: number;
  endpoint: string;
  errorMessage?: string;
}

export interface HospitalProfileResponse {
  success: boolean;
  message?: string;
  hospital?: Hospital;
}

export interface ApiStatsResponse {
  success: boolean;
  message?: string;
  stats?: HospitalApiStats;
}

export interface ApiRequestsResponse {
  success: boolean;
  message?: string;
  requests?: ApiRequest[];
  total?: number;
  page?: number;
  limit?: number;
}

@Injectable({
  providedIn: 'root'
})
export class HospitalService {
  private apiUrl = environment.apiUrl;
  private profileCache: Hospital | null = null;
  private statsCache: { data: HospitalApiStats; timestamp: number } | null = null;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  constructor(private http: HttpClient) {
    // Listen for logout events to clear cache
    if (typeof window !== 'undefined') {
      window.addEventListener('auth:logout', () => {
        this.clearCache();
      });
    }
  }

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
    ).pipe(
      map(response => {
        // Backend response format: { success: true, count: number, hospitals: [...] }
        console.log('getAllHospitals response:', response);
        return response;
      }),
      catchError(this.handleError)
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
   * Restore hospital access
   * Reactivates a previously revoked hospital
   * @param id - Hospital ID
   * @returns Observable of restoration response
   */
  restoreHospitalAccess(id: string): Observable<HospitalResponse> {
    return this.http.put<HospitalResponse>(
      `${this.apiUrl}/admin/hospitals/${id}/restore`,
      {}
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
    ).pipe(
      map(response => {
        // Backend spreads data directly: { success, message, token, hospital }
        console.log('Hospital login response:', response);
        return response;
      }),
      catchError(this.handleError)
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

  /**
   * Get hospital profile data for the authenticated hospital
   * Includes complete hospital data with API credentials
   * @returns Observable of hospital profile response
   */
  getHospitalProfile(): Observable<HospitalProfileResponse> {
    // Return cached data if available and valid
    if (this.profileCache) {
      return of({
        success: true,
        hospital: this.profileCache
      });
    }

    return this.http.get<HospitalProfileResponse>(
      `${this.apiUrl}/hospitals/profile`
    ).pipe(
      retry(2), // Retry failed requests up to 2 times
      map(response => {
        // Backend spreads data directly: { success: true, hospital: {...} }
        console.log('Hospital profile response:', response);
        
        // Cache successful response
        if (response.success && response.hospital) {
          this.profileCache = response.hospital;
        }
        return response;
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Get API usage statistics for the authenticated hospital
   * Includes performance metrics and rate limit information
   * @returns Observable of API usage statistics response
   */
  getApiUsageStats(): Observable<ApiStatsResponse> {
    // Check cache first
    if (this.statsCache && (Date.now() - this.statsCache.timestamp) < this.CACHE_DURATION) {
      return of({
        success: true,
        stats: this.statsCache.data
      });
    }

    return this.http.get<ApiStatsResponse>(
      `${this.apiUrl}/hospitals/api/usage-stats`
    ).pipe(
      retry(2), // Retry failed requests up to 2 times
      map(response => {
        // Backend spreads data directly: { success: true, message: '...', stats: {...} }
        console.log('API usage stats response:', response);
        
        // Cache successful response
        if (response.success && response.stats) {
          this.statsCache = {
            data: response.stats,
            timestamp: Date.now()
          };
        }
        return response;
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Get recent API requests for the authenticated hospital
   * Includes pagination and sorting capabilities
   * @param page - Page number (default: 1)
   * @param limit - Number of records per page (default: 10)
   * @param sortBy - Sort field (default: 'timestamp')
   * @param sortOrder - Sort order (default: 'desc')
   * @returns Observable of recent API requests response
   */
  getRecentApiRequests(
    page: number = 1,
    limit: number = 10,
    sortBy: string = 'timestamp',
    sortOrder: 'asc' | 'desc' = 'desc'
  ): Observable<ApiRequestsResponse> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('limit', limit.toString())
      .set('sortBy', sortBy)
      .set('sortOrder', sortOrder);

    return this.http.get<ApiRequestsResponse>(
      `${this.apiUrl}/hospitals/api/recent-requests`,
      { params }
    ).pipe(
      retry(2), // Retry failed requests up to 2 times
      map(response => {
        // Backend spreads data directly: { success: true, message: '...', requests: [...], pagination: {...} }
        console.log('Recent API requests response:', response);
        return response;
      }),
      catchError(this.handleError)
    );
  }

  /**
   * Clear cached data
   * Used when user logs out or data needs to be refreshed
   */
  clearCache(): void {
    this.profileCache = null;
    this.statsCache = null;
  }

  /**
   * Handle HTTP errors with proper error messages
   * @param error - HTTP error response
   * @returns Observable error with user-friendly message
   */
  private handleError = (error: HttpErrorResponse): Observable<never> => {
    let errorMessage = 'An unexpected error occurred';

    if (error.error instanceof ErrorEvent) {
      // Client-side or network error
      errorMessage = `Network error: ${error.error.message}`;
    } else {
      // Backend returned an unsuccessful response code
      switch (error.status) {
        case 401:
          errorMessage = 'Authentication failed. Please log in again.';
          break;
        case 403:
          errorMessage = 'Access denied. You do not have permission to access this resource.';
          break;
        case 404:
          errorMessage = 'The requested resource was not found.';
          break;
        case 429:
          errorMessage = 'Too many requests. Please try again later.';
          break;
        case 500:
          errorMessage = 'Server error. Please try again later.';
          break;
        case 503:
          errorMessage = 'Service temporarily unavailable. Please try again later.';
          break;
        default:
          if (error.error?.message) {
            errorMessage = error.error.message;
          } else {
            errorMessage = `Server returned code ${error.status}`;
          }
      }
    }

    console.error('Hospital Service Error:', error);
    return throwError(() => new Error(errorMessage));
  };
}
