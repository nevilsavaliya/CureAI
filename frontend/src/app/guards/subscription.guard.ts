import { Injectable } from '@angular/core';
import { Router, CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { SubscriptionService } from '../services/subscription.service';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class SubscriptionGuard implements CanActivate {
  constructor(
    private router: Router,
    private authService: AuthService,
    private subscriptionService: SubscriptionService
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> | boolean {
    const currentUser = this.authService.currentUserValue;
    
    // If not a doctor, allow access (other guards will handle role-based access)
    if (!currentUser || currentUser.role !== 'doctor') {
      return true;
    }

    // Check doctor's subscription status using test payment endpoint
    return this.subscriptionService.getTestPaymentStatus().pipe(
      map(response => {
        if (response.subscriptionStatus === 'active') {
          // Subscription is active, allow access
          return true;
        } else {
          // Subscription is pending or expired, redirect to subscription page
          this.router.navigate(['/subscription']);
          return false;
        }
      }),
      catchError(error => {
        console.error('Error checking subscription status:', error);
        // On error, redirect to subscription page to be safe
        this.router.navigate(['/subscription']);
        return of(false);
      })
    );
  }
}
