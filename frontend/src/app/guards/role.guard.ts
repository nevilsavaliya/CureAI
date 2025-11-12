import { Injectable } from '@angular/core';
import { Router, CanActivate, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class RoleGuard implements CanActivate {
  constructor(
    private router: Router,
    private authService: AuthService
  ) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    const currentUser = this.authService.currentUserValue;
    
    if (!currentUser) {
      // Not logged in, redirect to login
      this.router.navigate(['/login']);
      return false;
    }

    // Check if route has required roles
    const requiredRoles = route.data['roles'] as Array<string>;
    
    if (requiredRoles && !requiredRoles.includes(currentUser.role)) {
      // Role not authorized, redirect to appropriate dashboard
      this.redirectToDashboard(currentUser.role);
      return false;
    }

    return true;
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
