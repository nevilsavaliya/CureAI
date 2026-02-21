import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { NotificationService, Notification } from '../../services/notification.service';
import { SocketService } from '../../services/socket.service';

@Component({
  selector: 'app-notifications',
  templateUrl: './notifications.component.html',
  styleUrls: ['./notifications.component.css']
})
export class NotificationsComponent implements OnInit, OnDestroy {
  notifications: Notification[] = [];
  unreadCount: number = 0;
  showDropdown: boolean = false;
  loading: boolean = false;
  
  private subscriptions: Subscription[] = [];

  constructor(
    private notificationService: NotificationService,
    private socketService: SocketService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadNotifications();
    this.loadUnreadCount();
    this.subscribeToNotifications();
    this.subscribeToRealTimeNotifications();
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }

  /**
   * Load notifications from API
   */
  loadNotifications(): void {
    this.loading = true;
    this.notificationService.getNotifications({ limit: 20 }).subscribe({
      next: (response) => {
        this.loading = false;
        if (response.success) {
          // Service already updates the notifications$ observable
          // Component will receive updates via subscription
          this.notifications = response.data || [];
        }
      },
      error: (error) => {
        this.loading = false;
        console.error('Error loading notifications:', error);
      }
    });
  }

  /**
   * Load unread count
   */
  loadUnreadCount(): void {
    this.notificationService.getUnreadCount().subscribe({
      next: (response) => {
        if (response.success) {
          this.unreadCount = response.unreadCount;
        }
      },
      error: (error) => {
        console.error('Error loading unread count:', error);
      }
    });
  }

  /**
   * Subscribe to notification service observables
   */
  subscribeToNotifications(): void {
    // Subscribe to notifications list
    const notificationsSub = this.notificationService.notifications$.subscribe(
      notifications => {
        this.notifications = notifications;
      }
    );
    this.subscriptions.push(notificationsSub);

    // Subscribe to unread count
    const unreadCountSub = this.notificationService.unreadCount$.subscribe(
      count => {
        this.unreadCount = count;
      }
    );
    this.subscriptions.push(unreadCountSub);
  }

  /**
   * Subscribe to real-time notification updates via WebSocket
   */
  subscribeToRealTimeNotifications(): void {
    // Ensure socket is connected
    this.socketService.connect();

    // Subscribe to new notifications
    const socketSub = this.socketService.notification$.subscribe(
      notification => {
        if (notification) {
          console.log('Real-time notification received:', notification);
          
          // Add new notification to the list
          this.notificationService.addNotification(notification);
          
          // Show toast notification
          this.showToast(notification);
        }
      }
    );
    this.subscriptions.push(socketSub);
  }

  /**
   * Toggle dropdown visibility
   */
  toggleDropdown(): void {
    this.showDropdown = !this.showDropdown;
  }

  /**
   * Close dropdown
   */
  closeDropdown(): void {
    this.showDropdown = false;
  }

  /**
   * Handle notification click
   */
  onNotificationClick(notification: Notification): void {
    // Mark as read if not already read
    if (!notification.isRead) {
      this.notificationService.markAsRead(notification._id).subscribe({
        error: (error) => {
          console.error('Error marking notification as read:', error);
        }
      });
    }

    // Navigate to the relevant case
    if (notification.caseId) {
      const caseId = typeof notification.caseId === 'string' 
        ? notification.caseId 
        : notification.caseId._id;
      
      // Determine which cases page to navigate to based on user type
      if (notification.userType === 'patient') {
        this.router.navigate(['/patient/cases'], { queryParams: { caseId } });
      } else if (notification.userType === 'doctor') {
        this.router.navigate(['/doctor/cases'], { queryParams: { caseId } });
      }
    }

    // Close dropdown
    this.closeDropdown();
  }

  /**
   * Mark all notifications as read
   */
  markAllAsRead(): void {
    this.notificationService.markAllAsRead().subscribe({
      next: (response) => {
        if (response.success) {
          console.log('All notifications marked as read');
        }
      },
      error: (error) => {
        console.error('Error marking all as read:', error);
      }
    });
  }

  /**
   * Get icon class for notification type
   */
  getNotificationIcon(type: string): string {
    switch (type) {
      case 'case_request':
        return '📋';
      case 'case_accepted':
        return '✅';
      case 'case_rejected':
        return '❌';
      case 'case_treated':
        return '🏥';
      case 'new_message':
        return '💬';
      case 'feedback_received':
        return '⭐';
      default:
        return '🔔';
    }
  }

  /**
   * Get notification type class for styling
   */
  getNotificationClass(type: string): string {
    switch (type) {
      case 'case_request':
        return 'notification-request';
      case 'case_accepted':
        return 'notification-success';
      case 'case_rejected':
        return 'notification-error';
      case 'case_treated':
        return 'notification-info';
      case 'new_message':
        return 'notification-message';
      case 'feedback_received':
        return 'notification-feedback';
      default:
        return 'notification-default';
    }
  }

  /**
   * Format notification time
   */
  getTimeAgo(date: Date): string {
    const now = new Date();
    const notificationDate = new Date(date);
    const diffMs = now.getTime() - notificationDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) {
      return 'Just now';
    } else if (diffMins < 60) {
      return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    } else if (diffDays < 7) {
      return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    } else {
      return notificationDate.toLocaleDateString();
    }
  }

  /**
   * Show toast notification for new notifications
   */
  private showToast(notification: Notification): void {
    // Create toast element
    const toast = document.createElement('div');
    toast.className = 'notification-toast';
    toast.innerHTML = `
      <div class="toast-icon">${this.getNotificationIcon(notification.type)}</div>
      <div class="toast-content">
        <div class="toast-title">${notification.title}</div>
        <div class="toast-message">${notification.message}</div>
      </div>
    `;
    
    document.body.appendChild(toast);
    
    // Show toast
    setTimeout(() => {
      toast.classList.add('show');
    }, 100);
    
    // Hide and remove toast after 5 seconds
    setTimeout(() => {
      toast.classList.remove('show');
      setTimeout(() => {
        document.body.removeChild(toast);
      }, 300);
    }, 5000);
  }
}
