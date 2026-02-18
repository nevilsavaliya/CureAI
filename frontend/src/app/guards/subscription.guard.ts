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

    // Check if this is a new signup (coming from signup flow)
    const isNewSignup = sessionStorage.getItem('newDoctorSignup') === 'true';
    
    if (isNewSignup) {
      // New doctor signup - check subscription status
      console.log('🔍 New doctor signup detected, checking subscription...');
      
      return this.subscriptionService.getTestPaymentStatus().pipe(
        map(response => {
          if (response.subscriptionStatus === 'active') {
            // Subscription is active, clear flag and allow access
            sessionStorage.removeItem('newDoctorSignup');
            return true;
          } else {
            // Subscription is pending, redirect to subscription page
            console.log('⚠️ Subscription pending, redirecting to payment...');
            this.router.navigate(['/subscription']);
            return false;
          }
        }),
        catchError(error => {
          console.error('Error checking subscription status:', error);
          // On error for new signup, redirect to subscription page
          this.router.navigate(['/subscription']);
          return of(false);
        })
      );
    } else {
      // Existing doctor login - allow access without subscription check
      console.log('✅ Existing doctor login, allowing access to dashboard');
      return true;
    }
  }
}

