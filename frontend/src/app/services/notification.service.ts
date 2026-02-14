import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../config/environment';

export interface Notification {
  _id: string;
  userId: string;
  userType: 'patient' | 'doctor';
  type: 'case_request' | 'case_accepted' | 'case_rejected' | 'case_treated' | 'new_message' | 'feedback_received';
  title: string;
  message: string;
  caseId?: {
    _id: string;
    status: string;
    symptoms: string[];
    createdAt: Date;
  };
  relatedUserId?: string;
  relatedUserType?: 'patient' | 'doctor';
  isRead: boolean;
  readAt?: Date;
  createdAt: Date;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private apiUrl = `${environment.apiUrl}/notifications`;
  
  // Unread count subject
  private unreadCountSubject = new BehaviorSubject<number>(0);
  public unreadCount$ = this.unreadCountSubject.asObservable();
  
  // Notifications list subject
  private notificationsSubject = new BehaviorSubject<Notification[]>([]);
  public notifications$ = this.notificationsSubject.asObservable();

  constructor(private http: HttpClient) {}

  /**
   * Get all notifications for the current user
   */
  getNotifications(params?: { type?: string; isRead?: boolean; limit?: number; skip?: number }): Observable<any> {
    let queryParams = '';
    if (params) {
      const queryArray = [];
      if (params.type) queryArray.push(`type=${params.type}`);
      if (params.isRead !== undefined) queryArray.push(`isRead=${params.isRead}`);
      if (params.limit) queryArray.push(`limit=${params.limit}`);
      if (params.skip) queryArray.push(`skip=${params.skip}`);
      if (queryArray.length > 0) {
        queryParams = '?' + queryArray.join('&');
      }
    }
    
    return this.http.get<any>(`${this.apiUrl}${queryParams}`).pipe(
      tap(response => {
        if (response.success) {
          this.notificationsSubject.next(response.notifications);
        }
      })
    );
  }

  /**
   * Get unread notification count
   */
  getUnreadCount(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/unread-count`).pipe(
      tap(response => {
        if (response.success) {
          this.unreadCountSubject.next(response.unreadCount);
        }
      })
    );
  }

  /**
   * Mark a notification as read
   */
  markAsRead(notificationId: string): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/${notificationId}/read`, {}).pipe(
      tap(response => {
        if (response.success) {
          // Update local state
          const currentNotifications = this.notificationsSubject.value;
          const updatedNotifications = currentNotifications.map(n => 
            n._id === notificationId ? { ...n, isRead: true, readAt: new Date() } : n
          );
          this.notificationsSubject.next(updatedNotifications);
          
          // Decrement unread count
          const currentCount = this.unreadCountSubject.value;
          this.unreadCountSubject.next(Math.max(0, currentCount - 1));
        }
      })
    );
  }

  /**
   * Mark all notifications as read
   */
  markAllAsRead(): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/read-all`, {}).pipe(
      tap(response => {
        if (response.success) {
          // Update local state
          const currentNotifications = this.notificationsSubject.value;
          const updatedNotifications = currentNotifications.map(n => 
            ({ ...n, isRead: true, readAt: new Date() })
          );
          this.notificationsSubject.next(updatedNotifications);
          
          // Reset unread count
          this.unreadCountSubject.next(0);
        }
      })
    );
  }

  /**
   * Add a new notification to the list (for real-time updates)
   */
  addNotification(notification: Notification): void {
    const currentNotifications = this.notificationsSubject.value;
    this.notificationsSubject.next([notification, ...currentNotifications]);
    
    // Increment unread count if notification is unread
    if (!notification.isRead) {
      const currentCount = this.unreadCountSubject.value;
      this.unreadCountSubject.next(currentCount + 1);
    }
  }

  /**
   * Update unread count manually
   */
  updateUnreadCount(count: number): void {
    this.unreadCountSubject.next(count);
  }

  /**
   * Get current unread count value
   */
  getCurrentUnreadCount(): number {
    return this.unreadCountSubject.value;
  }

  /**
   * Get current notifications value
   */
  getCurrentNotifications(): Notification[] {
    return this.notificationsSubject.value;
  }
}
