import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpErrorResponse
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(
    private authService: AuthService,
    private router: Router
  ) { }

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    let token: string | null = null;
    let tokenType = 'none';

    // Check if this is a hospital API request
    if (request.url.includes('/api/hospitals/')) {
      // For hospital endpoints, use hospital token
      token = localStorage.getItem('hospitalToken') || sessionStorage.getItem('hospitalToken');
      tokenType = 'hospital';
    } else {
      // For regular endpoints, use regular user token
      token = this.authService.getToken();
      tokenType = 'user';
    }

    console.log('🔐 Auth Interceptor:', {
      url: request.url,
      method: request.method,
      tokenType: tokenType,
      hasToken: !!token,
      tokenLength: token?.length
    });

    // Clone request and add authorization header if token exists
    if (token) {
      request = request.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      });
    }

    return next.handle(request).pipe(
      catchError((error: HttpErrorResponse) => {
        // Handle 401 Unauthorized errors
        if (error.status === 401) {
          // Don't redirect if this is a login attempt (login, register, or forgot-password endpoints)
          const isLoginAttempt = request.url.includes('/login') || 
                                 request.url.includes('/register') || 
                                 request.url.includes('/forgot-password');
          
          if (isLoginAttempt) {
            console.log('🔒 401 on login attempt - not redirecting, letting component handle it');
            // Let the component handle the error
            return throwError(() => error);
          }
          
          console.log('🔒 401 Unauthorized - Logging out and redirecting to login');
          
          // Determine which login page to redirect to based on the request URL
          let loginRoute = '/login';
          if (request.url.includes('/api/hospitals/')) {
            loginRoute = '/hospital/login';
          }
          
          // Logout user and clear all auth data
          this.authService.logout();
          
          // Redirect to appropriate login page with message
          this.router.navigate([loginRoute], {
            queryParams: { 
              message: 'Your session has expired. Please log in again.',
              returnUrl: this.router.url
            }
          });
        }

        // Handle 403 Forbidden errors
        if (error.status === 403) {
          console.log('🚫 403 Forbidden - Access denied');
          
          // Don't redirect if this is a login attempt
          const isLoginAttempt = request.url.includes('/login') || 
                                 request.url.includes('/register');
          
          if (!isLoginAttempt) {
            this.router.navigate(['/unauthorized']);
          }
        }

        return throwError(() => error);
      })
    );
  }
}
