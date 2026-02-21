import { Injectable } from '@angular/core';
import { formatDate, getRelativeTime } from '../utils';

/**
 * Helper service for case-related operations
 */
@Injectable({
  providedIn: 'root'
})
export class CaseHelperService {
  /**
   * Get status badge class
   */
  getStatusClass(status: string): string {
    const statusClasses: Record<string, string> = {
      'pending': 'status-pending',
      'ongoing': 'status-ongoing',
      'treated': 'status-treated',
      'completed': 'status-completed',
      'rejected': 'status-rejected',
      'cancelled': 'status-cancelled'
    };
    return statusClasses[status] || 'status-default';
  }

  /**
   * Get status display text
   */
  getStatusText(status: string): string {
    const statusTexts: Record<string, string> = {
      'pending': 'Pending',
      'ongoing': 'Ongoing',
      'treated': 'Treated',
      'completed': 'Completed',
      'rejected': 'Rejected',
      'cancelled': 'Cancelled'
    };
    return statusTexts[status] || status;
  }

  /**
   * Get priority class
   */
  getPriorityClass(priority: string): string {
    const priorityClasses: Record<string, string> = {
      'high': 'priority-high',
      'medium': 'priority-medium',
      'low': 'priority-low',
      'urgent': 'priority-urgent'
    };
    return priorityClasses[priority] || 'priority-default';
  }

  /**
   * Calculate case duration
   */
  calculateDuration(startDate: Date | string, endDate?: Date | string): string {
    const start = new Date(startDate);
    const end = endDate ? new Date(endDate) : new Date();
    
    const diffMs = end.getTime() - start.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const diffHours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (diffDays > 0) {
      return `${diffDays} day${diffDays > 1 ? 's' : ''}`;
    }
    return `${diffHours} hour${diffHours > 1 ? 's' : ''}`;
  }

  /**
   * Format case date
   */
  formatCaseDate(date: Date | string): string {
    return formatDate(date, 'datetime');
  }

  /**
   * Get relative case time
   */
  getRelativeCaseTime(date: Date | string): string {
    return getRelativeTime(date);
  }

  /**
   * Check if case is urgent
   */
  isUrgent(createdAt: Date | string, status: string): boolean {
    if (status !== 'pending') return false;
    
    const created = new Date(createdAt);
    const now = new Date();
    const hoursSinceCreation = (now.getTime() - created.getTime()) / (1000 * 60 * 60);
    
    return hoursSinceCreation > 24;
  }

  /**
   * Get confidence level class
   */
  getConfidenceClass(confidence: number): string {
    if (confidence >= 80) return 'confidence-high';
    if (confidence >= 60) return 'confidence-medium';
    return 'confidence-low';
  }

  /**
   * Format confidence percentage
   */
  formatConfidence(confidence: number): string {
    return `${Math.round(confidence)}%`;
  }

  /**
   * Extract symptoms from case
   */
  extractSymptoms(caseData: any): string[] {
    if (Array.isArray(caseData.symptoms)) {
      return caseData.symptoms;
    }
    if (typeof caseData.symptoms === 'string') {
      return caseData.symptoms.split(',').map((s: string) => s.trim());
    }
    return [];
  }

  /**
   * Get case summary
   */
  getCaseSummary(caseData: any): string {
    const symptoms = this.extractSymptoms(caseData);
    const conditions = caseData.predictedConditions || [];
    
    if (symptoms.length > 0 && conditions.length > 0) {
      return `${symptoms.slice(0, 2).join(', ')} - ${conditions[0]}`;
    }
    if (symptoms.length > 0) {
      return symptoms.slice(0, 3).join(', ');
    }
    return 'No symptoms recorded';
  }

  /**
   * Check if case has unread messages
   */
  hasUnreadMessages(caseData: any): boolean {
    return caseData.unreadCount && caseData.unreadCount > 0;
  }

  /**
   * Get unread count badge text
   */
  getUnreadBadgeText(count: number): string {
    return count > 99 ? '99+' : count.toString();
  }

  /**
   * Sort cases by priority
   */
  sortByPriority<T extends { status: string; createdAt: Date | string }>(cases: T[]): T[] {
    return [...cases].sort((a, b) => {
      // Pending cases first
      if (a.status === 'pending' && b.status !== 'pending') return -1;
      if (a.status !== 'pending' && b.status === 'pending') return 1;
      
      // Then by creation date (oldest first for pending)
      if (a.status === 'pending' && b.status === 'pending') {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }
      
      // For other statuses, newest first
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }

  /**
   * Group cases by status
   */
  groupByStatus<T extends { status: string }>(cases: T[]): Record<string, T[]> {
    return cases.reduce((groups, caseItem) => {
      const status = caseItem.status;
      if (!groups[status]) {
        groups[status] = [];
      }
      groups[status].push(caseItem);
      return groups;
    }, {} as Record<string, T[]>);
  }

  /**
   * Get case statistics
   */
  getCaseStatistics<T extends { status: string }>(cases: T[]): {
    total: number;
    pending: number;
    ongoing: number;
    treated: number;
    rejected: number;
  } {
    return {
      total: cases.length,
      pending: cases.filter(c => c.status === 'pending').length,
      ongoing: cases.filter(c => c.status === 'ongoing').length,
      treated: cases.filter(c => c.status === 'treated').length,
      rejected: cases.filter(c => c.status === 'rejected').length
    };
  }
}
