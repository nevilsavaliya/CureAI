import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { NotificationService, Notification } from '../../services/notification.service';
import { SocketService } from '../../services/socket.service';
import { trigger, transition, style, animate } from '@angular/animations';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../config/environment';

@Component({
  selector: 'app-doctor-layout',
  templateUrl: './doctor-layout.component.html',
  styleUrls: ['./doctor-layout.component.css'],
  animations: [
    trigger('pageTransition', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('300ms', style({ opacity: 1 }))
      ])
    ])
  ]
})
export class DoctorLayoutComponent implements OnInit, OnDestroy {
  userName: string = '';
  mobileNavOpen: boolean = false;
  showNotifications: boolean = false;
  notifications: Notification[] = [];
  unreadCount: number = 0;
  loading: boolean = false;
  paymentPending: boolean = false;
  
  private subscriptions: Subscription[] = [];

  constructor(
    private authService: AuthService,
    private router: Router,
    private notificationService: NotificationService,
    private socketService: SocketService,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    const user = this.authService.currentUserValue;
    this.userName = user?.name || 'Doctor';
    
    // Check payment status
    this.checkPaymentStatus();
    
    // Load notifications
    this.loadNotifications();
    
    // Subscribe to notification updates
    const notifSub = this.notificationService.notifications$.subscribe(
      notifications => {
        this.notifications = notifications;
      }
    );
    this.subscriptions.push(notifSub);
    
    // Subscribe to unread count
    const countSub = this.notificationService.unreadCount$.subscribe(
      count => {
        this.unreadCount = count;
      }
    );
    this.subscriptions.push(countSub);
    
    // Listen for real-time notifications via socket
    this.socketService.notification$.pipe(
      filter(notification => notification !== null)
    ).subscribe(
      (notification: Notification) => {
        this.notificationService.addNotification(notification);
      }
    );
  }
  
  ngOnDestroy(): void {
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }
  
  loadNotifications(): void {
    this.loading = true;
    this.notificationService.getNotifications({ limit: 20 }).subscribe({
      next: (response) => {
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading notifications:', error);
        this.loading = false;
      }
    });
    
    // Load unread count
    this.notificationService.getUnreadCount().subscribe();
  }

  getInitials(name: string): string {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  }

  toggleMobileNav(): void {
    this.mobileNavOpen = !this.mobileNavOpen;
  }

  closeMobileNav(): void {
    this.mobileNavOpen = false;
  }

  toggleNotifications(): void {
    this.showNotifications = !this.showNotifications;
    if (this.showNotifications) {
      this.loadNotifications();
    }
  }

  closeNotifications(): void {
    this.showNotifications = false;
  }
  
  onNotificationClick(notification: Notification): void {
    // Mark as read
    if (!notification.isRead) {
      this.notificationService.markAsRead(notification._id).subscribe();
    }
    
    // Navigate based on notification type
    if (notification.caseId) {
      this.router.navigate(['/doctor/cases']);
      this.closeNotifications();
    }
  }
  
  markAllAsRead(): void {
    this.notificationService.markAllAsRead().subscribe();
  }
  
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
  
  getTimeAgo(date: Date): string {
    const now = new Date();
    const notifDate = new Date(date);
    const diffMs = now.getTime() - notifDate.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return notifDate.toLocaleDateString();
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  checkPaymentStatus(): void {
    this.http.get<any>(`${environment.apiUrl}/doctor/payment-status`).subscribe({
      next: (response) => {
        const paymentStatus = response.data;
        this.paymentPending = !paymentStatus.isActive || paymentStatus.isShadowBanned;
        
        // If payment is pending and not on payment page, redirect
        if (this.paymentPending && !this.router.url.includes('/doctor/payment')) {
          this.router.navigate(['/doctor/payment']);
        }
      },
      error: (error) => {
        console.error('Error checking payment status:', error);
      }
    });
  }

  isNavDisabled(route: string): boolean {
    // Only disable if payment is pending and not the payment or logout route
    return this.paymentPending && route !== '/doctor/payment';
  }
}
