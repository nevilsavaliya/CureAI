import { Injectable } from '@angular/core';
import { getInitials, getAvatarColor } from '../utils';

/**
 * Helper service for user-related operations
 */
@Injectable({
  providedIn: 'root'
})
export class UserHelperService {
  /**
   * Get user initials
   */
  getUserInitials(name: string): string {
    return getInitials(name);
  }

  /**
   * Get user avatar color
   */
  getUserAvatarColor(name: string): string {
    return getAvatarColor(name);
  }

  /**
   * Get role badge class
   */
  getRoleBadgeClass(role: string): string {
    const roleClasses: Record<string, string> = {
      'admin': 'role-admin',
      'root_admin': 'role-root-admin',
      'doctor': 'role-doctor',
      'patient': 'role-patient',
      'hospital': 'role-hospital'
    };
    return roleClasses[role] || 'role-default';
  }

  /**
   * Get role display text
   */
  getRoleDisplayText(role: string): string {
    const roleTexts: Record<string, string> = {
      'admin': 'Admin',
      'root_admin': 'Root Admin',
      'doctor': 'Doctor',
      'patient': 'Patient',
      'hospital': 'Hospital'
    };
    return roleTexts[role] || role;
  }

  /**
   * Format user display name
   */
  formatUserDisplayName(user: any): string {
    if (!user) return 'Unknown User';
    
    if (user.name) return user.name;
    if (user.email) return user.email.split('@')[0];
    
    return 'Unknown User';
  }

  /**
   * Get user status class
   */
  getUserStatusClass(isActive: boolean): string {
    return isActive ? 'status-active' : 'status-inactive';
  }

  /**
   * Get user status text
   */
  getUserStatusText(isActive: boolean): string {
    return isActive ? 'Active' : 'Inactive';
  }

  /**
   * Check if user is admin
   */
  isAdmin(role: string): boolean {
    return role === 'admin' || role === 'root_admin';
  }

  /**
   * Check if user is root admin
   */
  isRootAdmin(role: string, email?: string): boolean {
    return role === 'root_admin' || email === 'admin@gmail.com';
  }

  /**
   * Format user contact info
   */
  formatContactInfo(user: any): string {
    const parts: string[] = [];
    
    if (user.email) parts.push(user.email);
    if (user.contactNumber || user.phone) {
      parts.push(user.contactNumber || user.phone);
    }
    
    return parts.join(' • ');
  }

  /**
   * Get user specializations display
   */
  getSpecializationsDisplay(user: any): string {
    if (user.specializations && Array.isArray(user.specializations)) {
      return user.specializations.join(', ');
    }
    if (user.speciality) {
      return user.speciality;
    }
    return 'General Medicine';
  }

  /**
   * Format doctor experience
   */
  formatExperience(years: number): string {
    if (years === 0) return 'Less than 1 year';
    if (years === 1) return '1 year';
    return `${years} years`;
  }

  /**
   * Format rating display
   */
  formatRating(rating: number, totalReviews?: number): string {
    const ratingStr = rating.toFixed(1);
    if (totalReviews) {
      return `${ratingStr} (${totalReviews} reviews)`;
    }
    return ratingStr;
  }

  /**
   * Get rating stars array
   */
  getRatingStars(rating: number): { full: number; half: boolean; empty: number } {
    const full = Math.floor(rating);
    const half = rating % 1 >= 0.5;
    const empty = 5 - full - (half ? 1 : 0);
    
    return { full, half, empty };
  }

  /**
   * Check if user profile is complete
   */
  isProfileComplete(user: any, requiredFields: string[]): boolean {
    return requiredFields.every(field => {
      const value = user[field];
      return value !== null && value !== undefined && value !== '';
    });
  }

  /**
   * Get profile completion percentage
   */
  getProfileCompletionPercentage(user: any, requiredFields: string[]): number {
    const completedFields = requiredFields.filter(field => {
      const value = user[field];
      return value !== null && value !== undefined && value !== '';
    }).length;
    
    return Math.round((completedFields / requiredFields.length) * 100);
  }

  /**
   * Sort users by name
   */
  sortByName<T extends { name: string }>(users: T[], order: 'asc' | 'desc' = 'asc'): T[] {
    return [...users].sort((a, b) => {
      const comparison = a.name.localeCompare(b.name);
      return order === 'asc' ? comparison : -comparison;
    });
  }

  /**
   * Sort users by role
   */
  sortByRole<T extends { role: string }>(users: T[]): T[] {
    const roleOrder = ['root_admin', 'admin', 'doctor', 'hospital', 'patient'];
    
    return [...users].sort((a, b) => {
      const aIndex = roleOrder.indexOf(a.role);
      const bIndex = roleOrder.indexOf(b.role);
      return aIndex - bIndex;
    });
  }

  /**
   * Filter users by role
   */
  filterByRole<T extends { role: string }>(users: T[], role: string): T[] {
    if (!role || role === 'all') return users;
    return users.filter(user => user.role === role);
  }

  /**
   * Get user statistics
   */
  getUserStatistics<T extends { role: string }>(users: T[]): {
    total: number;
    admins: number;
    doctors: number;
    patients: number;
    hospitals: number;
  } {
    return {
      total: users.length,
      admins: users.filter(u => u.role === 'admin' || u.role === 'root_admin').length,
      doctors: users.filter(u => u.role === 'doctor').length,
      patients: users.filter(u => u.role === 'patient').length,
      hospitals: users.filter(u => u.role === 'hospital').length
    };
  }
}
