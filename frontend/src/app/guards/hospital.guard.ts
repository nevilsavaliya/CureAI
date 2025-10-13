import { Injectable } from '@angular/core';
import { Router, CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class HospitalGuard implements CanActivate {
  constructor(
    private router: Router,
    private authService: AuthService
  ) {}

  canActivate(_route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    const currentUser = this.authService.currentUserValue;
    
    // Check if user is authenticated
    if (!currentUser) {
      // Not logged in, redirect to hospital login
      this.router.navigate(['/hospital/login'], { queryParams: { returnUrl: state.url } });
      return false;
    }

    // Check if user is a hospital
    if (currentUser.role !== 'hospital') {
      // Not a hospital, redirect to appropriate dashboard based on role
      this.redirectToDashboard(currentUser.role);
      return false;
    }

    // Check if hospital is verified
    // The verification status is stored in localStorage along with user data
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      const userData = JSON.parse(storedUser);
      
      // Check verification status
      if (userData.verificationStatus === 'pending') {
        // Hospital is pending verification
        this.router.navigate(['/hospital/pending-verification']);
        return false;
      }
      
      if (userData.verificationStatus === 'rejected') {
        // Hospital was rejected
        this.router.navigate(['/hospital/rejected']);
        return false;
      }
      
      // Hospital is verified, allow access
      if (userData.verificationStatus === 'verified') {
        return true;
      }
    }

    // If verification status is not found or invalid, redirect to login
    this.router.navigate(['/hospital/login']);
    return false;
  }

  private redirectToDashboard(role: string): void {
    switch (role) {
      case 'patient':
        this.router.navigate(['/patient/dashboard']);
        break;
      case 'doctor':
        this.router.navigate(['/doctor/dashboard']);
        break;
      case 'admin':
        this.router.navigate(['/admin/dashboard']);
        break;
      default:
        this.router.navigate(['/login']);
    }
  }
}
