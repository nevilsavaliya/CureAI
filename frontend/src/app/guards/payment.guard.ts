import { Injectable } from '@angular/core';
import { CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot, Router } from '@angular/router';
import { Observable } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../config/environment';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class PaymentGuard implements CanActivate {
  constructor(
    private http: HttpClient,
    private router: Router,
    private authService: AuthService
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> | boolean {
    const user = this.authService.currentUserValue;
    
    // Only apply to doctors
    if (!user || user.role !== 'doctor') {
      return true;
    }

    // Allow access to payment and logout routes
    if (state.url.includes('/doctor/payment') || state.url.includes('/logout')) {
      return true;
    }

    // Check payment status
    return this.http.get<any>(`${environment.apiUrl}/doctor/payment-status`).pipe(
      map(response => {
        const paymentStatus = response.data;
        
        // If subscription is not active, redirect to payment
        if (!paymentStatus.isActive || paymentStatus.isShadowBanned) {
          this.router.navigate(['/doctor/payment']);
          return false;
        }
        
        return true;
      }),
      catchError(() => {
        // On error, allow access but log the issue
        console.error('Failed to check payment status');
        return [true];
      })
    );
  }
}
