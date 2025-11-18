import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { SocketService } from '../../services/socket.service';

@Component({
  selector: 'app-connection-status',
  templateUrl: './connection-status.component.html',
  styleUrls: ['./connection-status.component.css']
})
export class ConnectionStatusComponent implements OnInit, OnDestroy {
  connectionStatus: 'connected' | 'polling' | 'disconnected' = 'disconnected';
  showStatus = false;
  private statusSubscription?: Subscription;
  private hideTimeout?: any;

  constructor(private socketService: SocketService) {}

  ngOnInit(): void {
    // Subscribe to connection status changes
    this.statusSubscription = this.socketService.getConnectionStatusObservable().subscribe(
      (status) => {
        const previousStatus = this.connectionStatus;
        this.connectionStatus = status;

        // Show status indicator when connection changes
        if (previousStatus !== status) {
          this.showStatus = true;

          // Auto-hide after 5 seconds if connected
          if (status === 'connected') {
            this.hideTimeout = setTimeout(() => {
              this.showStatus = false;
            }, 5000);
          } else {
            // Keep showing if not connected
            if (this.hideTimeout) {
              clearTimeout(this.hideTimeout);
            }
          }
        }
      }
    );
  }

  ngOnDestroy(): void {
    if (this.statusSubscription) {
      this.statusSubscription.unsubscribe();
    }
    if (this.hideTimeout) {
      clearTimeout(this.hideTimeout);
    }
  }

  getStatusText(): string {
    switch (this.connectionStatus) {
      case 'connected':
        return 'Connected';
      case 'polling':
        return 'Using fallback mode';
      case 'disconnected':
        return 'Disconnected';
      default:
        return 'Unknown';
    }
  }

  getStatusClass(): string {
    switch (this.connectionStatus) {
      case 'connected':
        return 'status-connected';
      case 'polling':
        return 'status-polling';
      case 'disconnected':
        return 'status-disconnected';
      default:
        return '';
    }
  }

  getStatusIcon(): string {
    switch (this.connectionStatus) {
      case 'connected':
        return '✓';
      case 'polling':
        return '⟳';
      case 'disconnected':
        return '✗';
      default:
        return '';
    }
  }

  dismissStatus(): void {
    this.showStatus = false;
  }
}
