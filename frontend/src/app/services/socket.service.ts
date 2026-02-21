import { Injectable } from '@angular/core';
import { io, Socket } from 'socket.io-client';
import { BehaviorSubject, Observable, interval, Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';
import { AuthService } from './auth.service';
import { CaseService } from './case.service';
import { environment } from '../../config/environment';

export interface SocketMessage {
  caseId: string;
  message: any;
}

export interface TypingIndicator {
  caseId: string;
  userId: string;
  userRole: string;
}

export interface MessageReadEvent {
  caseId: string;
  messageId: string;
  readBy: string;
  readAt: Date;
}

export interface CaseUpdateEvent {
  caseId: string;
  status?: string;
  [key: string]: any;
}

@Injectable({
  providedIn: 'root'
})
export class SocketService {
  private socket: Socket | null = null;
  private socketUrl = environment.socketUrl;
  
  // Connection status
  private connectedSubject = new BehaviorSubject<boolean>(false);
  public connected$ = this.connectedSubject.asObservable();
  
  // Message events
  private newMessageSubject = new BehaviorSubject<SocketMessage | null>(null);
  public newMessage$ = this.newMessageSubject.asObservable();
  
  // Typing indicators
  private typingSubject = new BehaviorSubject<TypingIndicator | null>(null);
  public typing$ = this.typingSubject.asObservable();
  
  private stopTypingSubject = new BehaviorSubject<TypingIndicator | null>(null);
  public stopTyping$ = this.stopTypingSubject.asObservable();
  
  // Message read events
  private messageReadSubject = new BehaviorSubject<MessageReadEvent | null>(null);
  public messageRead$ = this.messageReadSubject.asObservable();
  
  // Case update events
  private caseUpdatedSubject = new BehaviorSubject<CaseUpdateEvent | null>(null);
  public caseUpdated$ = this.caseUpdatedSubject.asObservable();
  
  // Notification events
  private notificationSubject = new BehaviorSubject<any>(null);
  public notification$ = this.notificationSubject.asObservable();
  
  // Current case room
  private currentCaseId: string | null = null;

  // Polling mechanism
  private pollingInterval = 5000; // 5 seconds
  private pollingSubscription: Subscription | null = null;
  private isPollingActive = false;
  private lastMessageTimestamp: { [caseId: string]: Date } = {};
  private usingPolling = false;

  // Reconnection mechanism
  private reconnectionInterval = 30000; // 30 seconds
  private reconnectionSubscription: Subscription | null = null;
  private connectionAttempts = 0;
  private maxConnectionAttempts = 10;
  private lastConnectionAttempt = 0;
  private connectionCooldown = 3000; // 3 seconds cooldown between attempts

  // Connection status subject
  private connectionStatusSubject = new BehaviorSubject<'connected' | 'polling' | 'disconnected'>('disconnected');
  public connectionStatus$ = this.connectionStatusSubject.asObservable();

  constructor(
    private authService: AuthService,
    private caseService: CaseService
  ) {
    // Auto-connect when user is authenticated
    this.authService.currentUser.subscribe(user => {
      if (user) {
        // User is logged in, connect socket
        const token = this.authService.getToken();
        if (token) {
          this.connect();
        }
      } else {
        // User logged out, disconnect socket
        this.disconnect();
      }
    });
  }

  /**
   * Connect to Socket.IO server with JWT authentication
   */
  connect(): void {
    // If already connected, just return
    if (this.socket?.connected) {
      console.log('Socket already connected');
      return;
    }

    // If socket exists but disconnected, try to reconnect
    if (this.socket && !this.socket.connected) {
      console.log('Reconnecting existing socket...');
      this.socket.connect();
      return;
    }

    const token = this.authService.getToken();
    
    if (!token) {
      console.error('No authentication token available for socket connection');
      return;
    }

    console.log('Connecting to Socket.IO server at:', this.socketUrl);

    try {
      this.socket = io(this.socketUrl, {
        auth: {
          token: token
        },
        reconnection: true,
        reconnectionDelay: 2000,
        reconnectionDelayMax: 10000,
        reconnectionAttempts: 5,
        timeout: 10000,
        transports: ['websocket', 'polling'],
        autoConnect: true,
        forceNew: false
      });

      this.setupEventListeners();
    } catch (error) {
      console.error('Error creating socket connection:', error);
      this.connectionStatusSubject.next('disconnected');
    }
  }

  /**
   * Set up Socket.IO event listeners
   */
  private setupEventListeners(): void {
    if (!this.socket) return;

    // Connection events
    this.socket.on('connect', () => {
      // console.log('Socket connected:', this.socket?.id);
      this.connectedSubject.next(true);
      
      // Only update status if it's not already connected
      if (this.connectionStatusSubject.value !== 'connected') {
        this.connectionStatusSubject.next('connected');
      }
      
      this.connectionAttempts = 0;
      
      // Stop polling when WebSocket connects
      if (this.isPollingActive) {
        this.stopPolling();
      }
      
      // Stop reconnection attempts
      this.stopReconnectionAttempts();
    });

    this.socket.on('authenticated', (data) => {
      console.log('Socket authenticated:', data);
    });

    this.socket.on('disconnect', (reason) => {
      console.log('Socket disconnected:', reason);
      this.connectedSubject.next(false);
      
      // Only switch to polling if it's a transport error, not a client disconnect
      if (reason === 'io server disconnect' || reason === 'transport close' || reason === 'transport error') {
        this.handleConnectionFailure();
      }
    });

    this.socket.on('connect_error', (error) => {
      console.error('Socket connection error:', error.message);
      this.connectedSubject.next(false);
      
      // Check if error is due to authentication
      if (error.message.includes('authentication') || error.message.includes('token')) {
        console.error('Socket authentication failed - token may be invalid');
        // Try to refresh token from localStorage
        const token = this.authService.getToken();
        if (token && this.socket) {
          this.socket.auth = { token };
        }
      }
      
      // Only switch to polling after multiple failed attempts
      // Socket.IO will handle reconnection automatically
      if (this.connectionAttempts > 2) {
        this.handleConnectionFailure();
      }
      this.connectionAttempts++;
    });

    this.socket.on('error', (error) => {
      console.error('Socket error:', error);
    });

    // Reconnection events
    this.socket.on('reconnect', (attemptNumber) => {
      console.log('Socket reconnected after', attemptNumber, 'attempts');
      this.connectedSubject.next(true);
      
      // Only update status if it's not already connected
      if (this.connectionStatusSubject.value !== 'connected') {
        this.connectionStatusSubject.next('connected');
      }
      
      this.connectionAttempts = 0;
      
      // Stop polling when reconnected
      if (this.isPollingActive) {
        this.stopPolling();
      }
      
      // Rejoin current case room if any
      if (this.currentCaseId) {
        this.joinCase(this.currentCaseId);
      }
    });

    this.socket.on('reconnect_attempt', (attemptNumber) => {
      console.log('Socket reconnection attempt:', attemptNumber);
    });

    this.socket.on('reconnect_error', (error) => {
      console.error('Socket reconnection error:', error.message);
    });

    this.socket.on('reconnect_failed', () => {
      console.error('Socket reconnection failed - switching to polling');
      
      // Start polling after all reconnection attempts fail
      this.handleConnectionFailure();
      
      // Don't start custom reconnection attempts - Socket.IO will handle it
      // this.startReconnectionAttempts();
    });

    // Case room events
    this.socket.on('joined_case', (data) => {
      console.log('Joined case room:', data.caseId);
    });

    // Message events
    this.socket.on('new_message', (data: SocketMessage) => {
      console.log('New message received via socket:', data);
      // Ensure we emit the message even if it's for the current case
      this.newMessageSubject.next(data);
    });

    this.socket.on('message_sent', (data) => {
      console.log('Message sent confirmation:', data);
      // Also emit as new message for immediate display
      if (data.message) {
        this.newMessageSubject.next({
          caseId: data.caseId || data.message.caseId,
          message: data.message
        });
      }
    });

    this.socket.on('message_read', (data: MessageReadEvent) => {
      console.log('Message read:', data);
      this.messageReadSubject.next(data);
    });

    // Typing indicators
    this.socket.on('user_typing', (data: TypingIndicator) => {
      console.log('User typing:', data);
      this.typingSubject.next(data);
    });

    this.socket.on('user_stop_typing', (data: TypingIndicator) => {
      console.log('User stopped typing:', data);
      this.stopTypingSubject.next(data);
    });

    // Case updates
    this.socket.on('case_updated', (data: CaseUpdateEvent) => {
      console.log('Case updated:', data);
      this.caseUpdatedSubject.next(data);
    });

    // Notifications
    this.socket.on('new_notification', (data) => {
      console.log('New notification received via socket:', data);
      this.notificationSubject.next(data);
    });

    this.socket.on('notification', (data) => {
      console.log('Notification event received via socket:', data);
      this.notificationSubject.next(data);
    });
  }

  /**
   * Join a case room for real-time updates
   */
  joinCase(caseId: string): void {
    this.currentCaseId = caseId;

    // Initialize timestamp for this case
    if (!this.lastMessageTimestamp[caseId]) {
      this.lastMessageTimestamp[caseId] = new Date();
    }

    if (!this.socket?.connected) {
      console.error('Socket not connected, will use polling');
      return;
    }

    console.log('Joining case room:', caseId);
    this.socket.emit('join_case', { caseId });
  }

  /**
   * Leave a case room
   */
  leaveCase(caseId: string): void {
    if (this.socket?.connected) {
      console.log('Leaving case room:', caseId);
      this.socket.emit('leave_case', { caseId });
    }
    
    if (this.currentCaseId === caseId) {
      this.currentCaseId = null;
      // Clean up timestamp
      delete this.lastMessageTimestamp[caseId];
    }
  }

  /**
   * Send a message via WebSocket or REST API fallback
   */
  sendMessage(caseId: string, message: any): void {
    if (this.socket?.connected) {
      console.log('Sending message via socket:', { caseId, message });
      this.socket.emit('send_message', { caseId, message }, (acknowledgment: any) => {
        if (acknowledgment) {
          console.log('Message send acknowledged:', acknowledgment);
        }
      });
    } else {
      // Fallback to REST API when socket not connected
      console.log('Socket not connected, sending via REST API');
      this.caseService.sendMessage(caseId, message.content || message).subscribe({
        next: (response) => {
          console.log('Message sent via REST API:', response);
          // Emit the message locally for immediate display
          if (response.success && response.message) {
            this.newMessageSubject.next({
              caseId: caseId,
              message: response.message
            });
          }
          // Trigger immediate poll to get the sent message
          if (this.isPollingActive) {
            this.pollForMessages();
          }
        },
        error: (error) => {
          console.error('Error sending message via REST API:', error);
        }
      });
    }
  }

  /**
   * Emit typing indicator
   */
  emitTyping(caseId: string): void {
    if (!this.socket?.connected) {
      return;
    }

    this.socket.emit('typing', { caseId });
  }

  /**
   * Emit stop typing indicator
   */
  emitStopTyping(caseId: string): void {
    if (!this.socket?.connected) {
      return;
    }

    this.socket.emit('stop_typing', { caseId });
  }

  /**
   * Mark message as read via WebSocket
   */
  markMessageAsRead(caseId: string, messageId: string): void {
    if (!this.socket?.connected) {
      return;
    }

    this.socket.emit('mark_message_read', { caseId, messageId });
  }

  /**
   * Handle WebSocket connection failure - switch to polling
   */
  private handleConnectionFailure(): void {
    // Respect cooldown period to prevent rapid switching
    const now = Date.now();
    if (now - this.lastConnectionAttempt < this.connectionCooldown) {
      console.log('Connection cooldown active, skipping state change');
      return;
    }
    this.lastConnectionAttempt = now;
    
    // Prevent duplicate status updates
    const currentStatus = this.connectionStatusSubject.value;
    
    if (!this.isPollingActive && this.currentCaseId) {
      console.log('WebSocket connection failed - switching to HTTP polling fallback');
      if (currentStatus !== 'polling') {
        this.connectionStatusSubject.next('polling');
      }
      this.startPolling();
    } else if (!this.currentCaseId) {
      if (currentStatus !== 'disconnected') {
        this.connectionStatusSubject.next('disconnected');
      }
    }
  }

  /**
   * Start periodic reconnection attempts
   */
  private startReconnectionAttempts(): void {
    if (this.reconnectionSubscription) {
      return; // Already attempting reconnection
    }

    console.log('Starting periodic WebSocket reconnection attempts...');
    
    this.reconnectionSubscription = interval(this.reconnectionInterval).subscribe(() => {
      if (this.connectionAttempts >= this.maxConnectionAttempts) {
        console.log('Max reconnection attempts reached');
        this.stopReconnectionAttempts();
        return;
      }

      if (!this.socket?.connected) {
        this.connectionAttempts++;
        console.log(`Attempting WebSocket reconnection (${this.connectionAttempts}/${this.maxConnectionAttempts})...`);
        this.attemptReconnection();
      } else {
        // Successfully connected, stop attempts
        this.stopReconnectionAttempts();
      }
    });
  }

  /**
   * Stop periodic reconnection attempts
   */
  private stopReconnectionAttempts(): void {
    if (this.reconnectionSubscription) {
      console.log('Stopping reconnection attempts');
      this.reconnectionSubscription.unsubscribe();
      this.reconnectionSubscription = null;
    }
  }

  /**
   * Attempt to reconnect WebSocket
   */
  private attemptReconnection(): void {
    if (this.socket?.connected) {
      return;
    }

    // Try to reconnect
    if (this.socket) {
      this.socket.connect();
    } else {
      // Socket was destroyed, create new connection
      this.connect();
    }
  }

  /**
   * Start HTTP polling for messages when WebSocket is unavailable
   */
  private startPolling(): void {
    if (this.isPollingActive) {
      console.log('Polling already active');
      return;
    }

    console.log('Starting HTTP polling for messages (every 5 seconds)...');
    this.isPollingActive = true;
    this.usingPolling = true;

    // Poll immediately, then every 5 seconds
    this.pollForMessages();

    this.pollingSubscription = interval(this.pollingInterval).subscribe(() => {
      this.pollForMessages();
    });
  }

  /**
   * Stop HTTP polling
   */
  private stopPolling(): void {
    if (!this.isPollingActive) {
      return;
    }

    console.log('Stopping HTTP polling...');
    this.isPollingActive = false;
    this.usingPolling = false;

    if (this.pollingSubscription) {
      this.pollingSubscription.unsubscribe();
      this.pollingSubscription = null;
    }
  }

  /**
   * Poll for new messages via REST API
   */
  private pollForMessages(): void {
    if (!this.currentCaseId) {
      return;
    }

    // Fetch messages for the current case
    this.caseService.getCaseMessages(this.currentCaseId).subscribe({
      next: (response) => {
        if (response.success && response.messages) {
          this.processPolledMessages(this.currentCaseId!, response.messages);
        }
      },
      error: (error) => {
        console.error('Error polling for messages:', error);
      }
    });
  }

  /**
   * Process messages received from polling
   */
  private processPolledMessages(caseId: string, messages: any[]): void {
    if (!messages || messages.length === 0) {
      return;
    }

    // Get the last known timestamp for this case
    const lastTimestamp = this.lastMessageTimestamp[caseId];

    // Filter for new messages only
    const newMessages = messages.filter((msg: any) => {
      const msgDate = new Date(msg.createdAt);
      return !lastTimestamp || msgDate > lastTimestamp;
    });

    if (newMessages.length > 0) {
      // Update last timestamp
      const latestMessage = newMessages[newMessages.length - 1];
      this.lastMessageTimestamp[caseId] = new Date(latestMessage.createdAt);

      // Emit each new message
      newMessages.forEach((message: any) => {
        console.log('New message from polling:', message);
        this.newMessageSubject.next({
          caseId: caseId,
          message: message
        });
      });
    }
  }

  /**
   * Check if currently using polling fallback
   */
  isUsingPolling(): boolean {
    return this.usingPolling;
  }

  /**
   * Disconnect from Socket.IO server
   */
  disconnect(): void {
    this.stopPolling();
    this.stopReconnectionAttempts();
    
    if (this.socket) {
      console.log('Disconnecting socket...');
      this.socket.disconnect();
      this.socket.removeAllListeners();
      this.socket = null;
      this.connectedSubject.next(false);
      this.connectionStatusSubject.next('disconnected');
      this.currentCaseId = null;
      this.connectionAttempts = 0;
    }
  }

  /**
   * Force reconnection (useful after token refresh or network recovery)
   */
  forceReconnect(): void {
    console.log('Forcing socket reconnection...');
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    this.connectionAttempts = 0;
    this.connect();
  }

  /**
   * Check if socket is connected
   */
  isConnected(): boolean {
    return this.socket?.connected || false;
  }

  /**
   * Get current connection status as observable
   */
  getConnectionStatus(): Observable<boolean> {
    return this.connected$;
  }

  /**
   * Get new notification events as observable
   */
  onNewNotification(): Observable<any> {
    return this.notification$;
  }

  /**
   * Get new message events as observable (filtered by case ID if provided)
   */
  onNewMessage(caseId?: string): Observable<SocketMessage | null> {
    if (caseId) {
      return this.newMessage$.pipe(
        filter(data => data !== null && data.caseId === caseId)
      );
    }
    return this.newMessage$;
  }

  /**
   * Get typing indicator events as observable (filtered by case ID if provided)
   */
  onTyping(caseId?: string): Observable<TypingIndicator | null> {
    if (caseId) {
      return this.typing$.pipe(
        filter(data => data !== null && data.caseId === caseId)
      );
    }
    return this.typing$;
  }

  /**
   * Get stop typing events as observable (filtered by case ID if provided)
   */
  onStopTyping(caseId?: string): Observable<TypingIndicator | null> {
    if (caseId) {
      return this.stopTyping$.pipe(
        filter(data => data !== null && data.caseId === caseId)
      );
    }
    return this.stopTyping$;
  }

  /**
   * Get current connection status
   */
  getConnectionStatusObservable(): Observable<'connected' | 'polling' | 'disconnected'> {
    return this.connectionStatus$;
  }

  /**
   * Get current connection status value
   */
  getCurrentConnectionStatus(): 'connected' | 'polling' | 'disconnected' {
    return this.connectionStatusSubject.value;
  }

  /**
   * Check if socket is ready to receive real-time updates
   */
  isReady(): boolean {
    return this.socket?.connected || false;
  }

  /**
   * Get socket ID (useful for debugging)
   */
  getSocketId(): string | undefined {
    return this.socket?.id;
  }
}
