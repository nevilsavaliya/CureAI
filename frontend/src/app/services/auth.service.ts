import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, tap, map, catchError } from 'rxjs';
import { environment } from '../../config/environment';

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

export interface AuthResponse {
  success: boolean;
  token?: string;
  user?: User;
  message?: string;
  requiresOTP?: boolean;
  email?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = environment.apiUrl;
  private currentUserSubject: BehaviorSubject<User | null>;
  public currentUser: Observable<User | null>;
  private tokenExpirationTimer: any;

  constructor(private http: HttpClient) {
    const storedUser = localStorage.getItem('currentUser');
    this.currentUserSubject = new BehaviorSubject<User | null>(
      storedUser ? JSON.parse(storedUser) : null
    );
    this.currentUser = this.currentUserSubject.asObservable();
    
    // Check token expiration on service initialization
    this.checkTokenExpiration();
  }

  public get currentUserValue(): User | null {
    return this.currentUserSubject.value;
  }

  signupPatient(userData: any): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/auth/signup/patient`, userData).pipe(
      tap(response => {
        if (response.success && response.token && response.user) {
          localStorage.setItem('token', response.token);
          localStorage.setItem('currentUser', JSON.stringify(response.user));
          this.currentUserSubject.next(response.user);
        }
      })
    );
  }

  signupDoctor(userData: any): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/auth/signup/doctor`, userData).pipe(
      tap(response => {
        if (response.success && response.token && response.user) {
          localStorage.setItem('token', response.token);
          localStorage.setItem('currentUser', JSON.stringify(response.user));
          this.currentUserSubject.next(response.user);
        }
      })
    );
  }

  login(email: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/auth/login`, {
      email,
      password
    }).pipe(
      tap(response => {
        if (response.success && response.token && response.user) {
          // Store token and user in localStorage
          localStorage.setItem('token', response.token);
          localStorage.setItem('currentUser', JSON.stringify(response.user));
          this.currentUserSubject.next(response.user);
        }
      })
    );
  }

  logout(): void {
    // Clear token expiration timer
    if (this.tokenExpirationTimer) {
      clearTimeout(this.tokenExpirationTimer);
      this.tokenExpirationTimer = null;
    }

    // Remove all authentication tokens from localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('currentUser');
    
    // Clear any hospital-specific data that might be cached
    localStorage.removeItem('hospitalData');
    localStorage.removeItem('hospitalToken');
    localStorage.removeItem('hospitalProfile');
    
    // Clear currentUser observable and BehaviorSubject
    this.currentUserSubject.next(null);
    
    // Clear any cached service data
    this.clearServiceCaches();
  }

  /**
   * Clear cached data from other services
   * This method can be called by other services to register their cache clearing methods
   */
  private clearServiceCaches(): void {
    // Clear hospital service cache if available
    try {
      // We'll use a global event to notify other services to clear their caches
      window.dispatchEvent(new CustomEvent('auth:logout'));
    } catch (error) {
      console.warn('Failed to dispatch logout event:', error);
    }
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  getUserRole(): string | null {
    const user = this.currentUserValue;
    return user ? user.role : null;
  }

  verifyToken(): Observable<any> {
    return this.http.get(`${this.apiUrl}/auth/verify`);
  }

  /**
   * Check if the current token is expired
   * @returns boolean indicating if token is expired
   */
  isTokenExpired(): boolean {
    const token = this.getToken();
    if (!token) {
      return true;
    }

    try {
      // Decode JWT token to check expiration
      const payload = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Math.floor(Date.now() / 1000);
      return payload.exp < currentTime;
    } catch (error) {
      console.warn('Failed to decode token:', error);
      return true;
    }
  }

  /**
   * Check token expiration and set up automatic logout
   */
  private checkTokenExpiration(): void {
    const token = this.getToken();
    if (!token) {
      return;
    }

    try {
      // Decode JWT token to get expiration time
      const payload = JSON.parse(atob(token.split('.')[1]));
      const expirationTime = payload.exp * 1000; // Convert to milliseconds
      const currentTime = Date.now();
      const timeUntilExpiration = expirationTime - currentTime;

      if (timeUntilExpiration <= 0) {
        // Token is already expired, logout immediately
        this.logout();
        return;
      }

      // Set timer for automatic logout before token expires
      // Logout 1 minute before actual expiration to be safe
      const logoutTime = Math.max(timeUntilExpiration - 60000, 0);
      
      this.tokenExpirationTimer = setTimeout(() => {
        console.log('Token expired, logging out automatically');
        this.logout();
      }, logoutTime);

    } catch (error) {
      console.warn('Failed to check token expiration:', error);
      // If we can't decode the token, it's probably invalid
      this.logout();
    }
  }

  /**
   * Refresh the session by validating the current token
   * This can be called periodically for active users
   * @returns Observable indicating if session is still valid
   */
  refreshSession(): Observable<boolean> {
    if (this.isTokenExpired()) {
      this.logout();
      return new Observable<boolean>(observer => {
        observer.next(false);
        observer.complete();
      });
    }

    return this.verifyToken().pipe(
      tap((response: any) => {
        if (response.success) {
          // Reset the expiration timer
          this.checkTokenExpiration();
        } else {
          this.logout();
        }
      }),
      map((response: any) => response.success),
      catchError(() => {
        this.logout();
        return new Observable<boolean>(observer => {
          observer.next(false);
          observer.complete();
        });
      })
    );
  }

  /**
   * Start periodic session validation for active users
   * Call this when user becomes active (e.g., on page focus)
   */
  startSessionValidation(): void {
    // Validate session every 5 minutes
    const validationInterval = 5 * 60 * 1000;
    
    const validateSession = () => {
      if (this.isLoggedIn()) {
        this.refreshSession().subscribe();
      }
    };

    // Initial validation
    validateSession();
    
    // Set up periodic validation
    setInterval(validateSession, validationInterval);
  }
}
