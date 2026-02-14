import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor
} from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from '../services/auth.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(private authService: AuthService) { }

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

    return next.handle(request);
  }
}
