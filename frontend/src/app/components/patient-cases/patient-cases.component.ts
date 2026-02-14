import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { CaseService, Case, Message } from '../../services/case.service';
import { SocketService } from '../../services/socket.service';
import { interval, Subscription, Subject } from 'rxjs';
import { switchMap, distinctUntilChanged, debounceTime, filter } from 'rxjs/operators';

@Component({
  selector: 'app-patient-cases',
  templateUrl: './patient-cases.component.html',
  styleUrls: ['./patient-cases.component.css']
})
export class PatientCasesComponent implements OnInit, OnDestroy {
  userName: string = '';
  cases: Case[] = [];
  filteredCases: Case[] = [];
  selectedCase: Case | null = null;
  messages: Message[] = [];
  
  // Filter and search
  selectedFilter: string = 'all';
  searchQuery: string = '';
  searchStartDate: string = '';
  searchEndDate: string = '';
  sortBy: string = 'date'; // 'date', 'status', 'unread'
  sortOrder: string = 'desc'; // 'asc', 'desc'
  
  // Message input
  messageText: string = '';
  sendingMessage: boolean = false;
  
  // Feedback
  showFeedbackForm: boolean = false;
  feedbackRating: number = 0;
  feedbackComment: string = '';
  submittingFeedback: boolean = false;
  
  // Loading states
  loadingCases: boolean = true;
  loadingMessages: boolean = false;
  
  // Typing indicator
  isOtherUserTyping: boolean = false;
  private typingTimeout: any;
  private isTyping: boolean = false;
  
  // Polling subscription
  private pollingSubscription?: Subscription;
  
  // WebSocket subscriptions
  private socketSubscriptions: Subscription[] = [];
  private useWebSocket: boolean = true;
  
  // Connection status
  connectionStatus: 'connected' | 'polling' | 'disconnected' = 'disconnected';
  
  // Active tab
  activeTab: 'overview' | 'messages' | 'timeline' | 'feedback' = 'overview';
  
  // Debounced reload subject
  private reloadCasesSubject = new Subject<void>();

  constructor(
    private authService: AuthService,
    private caseService: CaseService,
    private socketService: SocketService,
    private router: Router
  ) {}


  ngOnInit(): void {
    const user = this.authService.currentUserValue;
    if (user) {
      this.userName = user.name;
    }
    
    // Set up debounced reload
    const reloadSub = this.reloadCasesSubject
      .pipe(debounceTime(1000))
      .subscribe(() => {
        this.loadCases();
      });
    this.socketSubscriptions.push(reloadSub);
    
    // Connect to WebSocket
    this.connectWebSocket();
    
    this.loadCases();
  }

  ngOnDestroy(): void {
    // Clean up polling
    if (this.pollingSubscription) {
      this.pollingSubscription.unsubscribe();
    }
    
    // Clean up WebSocket subscriptions
    this.socketSubscriptions.forEach(sub => sub.unsubscribe());
    
    // Leave current case room
    if (this.selectedCase) {
      this.socketService.leaveCase(this.selectedCase._id);
    }
  }
  
  /**
   * Connect to WebSocket and set up event listeners
   */
  connectWebSocket(): void {
    // Connect to socket
    this.socketService.connect();
    
    // Subscribe to connection status
    const connectionSub = this.socketService.getConnectionStatus().subscribe(connected => {
      console.log('WebSocket connection status:', connected);
      this.useWebSocket = connected;
      
      // If disconnected and have selected case, fall back to polling
      if (!connected && this.selectedCase) {
        this.startMessagePolling();
      } else if (connected && this.selectedCase) {
        // If reconnected, stop polling and rejoin case
        this.stopMessagePolling();
        this.socketService.joinCase(this.selectedCase._id);
      }
    });
    this.socketSubscriptions.push(connectionSub);
    
    // Subscribe to detailed connection status
    const statusSub = this.socketService.getConnectionStatusObservable()
      .pipe(distinctUntilChanged())
      .subscribe(status => {
        console.log('Connection status changed:', status);
        this.connectionStatus = status;
      });
    this.socketSubscriptions.push(statusSub);
    
    // Subscribe to new messages
    const messageSub = this.socketService.newMessage$
      .pipe(filter(data => data !== null))
      .subscribe(data => {
        if (data && this.selectedCase && data.caseId === this.selectedCase._id) {
          console.log('Received new message via WebSocket:', data.message);
          
          // Add message to list if not already present
          const exists = this.messages.find(m => m._id === data.message._id);
          if (!exists) {
            this.messages.push(data.message);
            this.messages.sort((a, b) => 
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
          );
          
          // Mark as read if from doctor
          if (data.message.senderType === 'doctor') {
            this.caseService.markMessageAsRead(data.message._id).subscribe();
          }
        }
      }
    });
    this.socketSubscriptions.push(messageSub);
    
    // Subscribe to case updates
    const caseUpdateSub = this.socketService.caseUpdated$
      .pipe(filter(data => data !== null))
      .subscribe(data => {
        if (data && this.selectedCase && data.caseId === this.selectedCase._id) {
          console.log('Case updated via WebSocket:', data);
          
          // Update selected case status
          if (data.status) {
            this.selectedCase.status = data.status as 'pending' | 'ongoing' | 'treated' | 'rejected';
          }
          
          // Trigger debounced reload to update sidebar
          this.reloadCasesSubject.next();
        }
      });
    this.socketSubscriptions.push(caseUpdateSub);
    
    // Subscribe to message read events
    const messageReadSub = this.socketService.messageRead$.subscribe(data => {
      if (data && this.selectedCase && data.caseId === this.selectedCase._id) {
        console.log('Message read via WebSocket:', data);
        
        // Update message read status
        const message = this.messages.find(m => m._id === data.messageId);
        if (message) {
          message.isRead = true;
          message.readAt = data.readAt;
        }
      }
    });
    this.socketSubscriptions.push(messageReadSub);
    
    // Subscribe to typing indicators
    const typingSub = this.socketService.typing$.subscribe(data => {
      if (data && this.selectedCase && data.caseId === this.selectedCase._id) {
        console.log('User typing:', data);
        this.isOtherUserTyping = true;
        
        // Clear existing timeout
        if (this.typingTimeout) {
          clearTimeout(this.typingTimeout);
        }
        
        // Auto-clear typing indicator after 3 seconds
        this.typingTimeout = setTimeout(() => {
          this.isOtherUserTyping = false;
        }, 3000);
      }
    });
    this.socketSubscriptions.push(typingSub);
    
    // Subscribe to stop typing indicators
    const stopTypingSub = this.socketService.stopTyping$.subscribe(data => {
      if (data && this.selectedCase && data.caseId === this.selectedCase._id) {
        console.log('User stopped typing:', data);
        this.isOtherUserTyping = false;
        
        if (this.typingTimeout) {
          clearTimeout(this.typingTimeout);
        }
      }
    });
    this.socketSubscriptions.push(stopTypingSub);
  }
  
  /**
   * Stop message polling
   */
  stopMessagePolling(): void {
    if (this.pollingSubscription) {
      this.pollingSubscription.unsubscribe();
      this.pollingSubscription = undefined;
    }
  }

  loadCases(): void {
    this.loadingCases = true;
    this.caseService.getCases().subscribe({
      next: (response) => {
        if (response.success) {
          this.cases = response.cases;
          this.applyFilters();
        }
        this.loadingCases = false;
      },
      error: (error) => {
        console.error('Error loading cases:', error);
        this.loadingCases = false;
      }
    });
  }

  selectCase(caseItem: Case): void {
    // Leave previous case room
    if (this.selectedCase) {
      this.socketService.leaveCase(this.selectedCase._id);
    }
    
    this.selectedCase = caseItem;
    this.showFeedbackForm = false;
    this.activeTab = 'overview'; // Reset to overview tab
    this.loadMessages();
    
    // Join case room via WebSocket
    if (this.useWebSocket && this.socketService.isConnected()) {
      this.socketService.joinCase(caseItem._id);
    } else {
      // Fall back to polling if WebSocket not available
      this.startMessagePolling();
    }
  }

  loadMessages(): void {
    if (!this.selectedCase) return;
    
    this.loadingMessages = true;
    this.caseService.getCaseMessages(this.selectedCase._id).subscribe({
      next: (response) => {
        if (response.success) {
          this.messages = response.messages;
          this.markMessagesAsRead();
        }
        this.loadingMessages = false;
      },
      error: (error) => {
        console.error('Error loading messages:', error);
        this.loadingMessages = false;
      }
    });
  }

  startMessagePolling(): void {
    // Stop existing polling
    if (this.pollingSubscription) {
      this.pollingSubscription.unsubscribe();
    }
    
    // Poll every 5 seconds
    this.pollingSubscription = interval(5000)
      .pipe(
        switchMap(() => {
          if (this.selectedCase) {
            return this.caseService.getCaseMessages(this.selectedCase._id);
          }
          return [];
        })
      )
      .subscribe({
        next: (response: any) => {
          if (response.success && response.messages) {
            // Only update if there are actually new messages
            const hasNewMessages = response.messages.length > this.messages.length ||
              (response.messages.length > 0 && this.messages.length > 0 &&
               response.messages[response.messages.length - 1]._id !== this.messages[this.messages.length - 1]._id);
            
            if (hasNewMessages) {
              this.messages = response.messages;
              this.markMessagesAsRead();
            }
          }
        },
        error: (error) => {
          console.error('Error polling messages:', error);
        }
      });
  }

  markMessagesAsRead(): void {
    const unreadMessages = this.messages.filter(m => !m.isRead && m.senderType === 'doctor');
    unreadMessages.forEach(message => {
      this.caseService.markMessageAsRead(message._id).subscribe();
    });
  }

  /**
   * Handle message input typing
   */
  onMessageInput(): void {
    if (!this.selectedCase || !this.useWebSocket || !this.socketService.isConnected()) {
      return;
    }
    
    // Emit typing indicator if not already typing
    if (!this.isTyping) {
      this.isTyping = true;
      this.socketService.emitTyping(this.selectedCase._id);
    }
    
    // Clear existing timeout
    if (this.typingTimeout) {
      clearTimeout(this.typingTimeout);
    }
    
    // Stop typing after 2 seconds of inactivity
    this.typingTimeout = setTimeout(() => {
      this.stopTyping();
    }, 2000);
  }
  
  /**
   * Stop typing indicator
   */
  stopTyping(): void {
    if (this.isTyping && this.selectedCase) {
      this.isTyping = false;
      this.socketService.emitStopTyping(this.selectedCase._id);
    }
  }

  sendMessage(): void {
    if (!this.messageText.trim() || !this.selectedCase || this.sendingMessage) {
      return;
    }
    
    // Stop typing indicator
    this.stopTyping();
    
    this.sendingMessage = true;
    const messageContent = this.messageText;
    
    // Send via REST API (which will also broadcast via WebSocket)
    this.caseService.sendMessage(this.selectedCase._id, messageContent).subscribe({
      next: (response) => {
        if (response.success) {
          this.messageText = '';
          
          // Message will be received via WebSocket, but add immediately for better UX
          if (!this.useWebSocket || !this.socketService.isConnected()) {
            this.messages.push(response.message);
            this.messages.sort((a, b) => 
              new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
            );
          }
        }
        this.sendingMessage = false;
      },
      error: (error) => {
        console.error('Error sending message:', error);
        alert('Failed to send message. Please try again.');
        this.sendingMessage = false;
      }
    });
  }

  applyFilters(): void {
    let filtered = [...this.cases];
    
    // Apply status filter
    if (this.selectedFilter !== 'all') {
      filtered = filtered.filter(c => c.status === this.selectedFilter);
    }
    
    // Apply text search
    if (this.searchQuery.trim()) {
      const query = this.searchQuery.toLowerCase();
      filtered = filtered.filter(c => 
        c.doctorId.name.toLowerCase().includes(query) ||
        c.doctorId.speciality.toLowerCase().includes(query)
      );
    }
    
    // Apply date range filter
    if (this.searchStartDate) {
      const startDate = new Date(this.searchStartDate);
      startDate.setHours(0, 0, 0, 0);
      filtered = filtered.filter(c => new Date(c.createdAt) >= startDate);
    }
    
    if (this.searchEndDate) {
      const endDate = new Date(this.searchEndDate);
      endDate.setHours(23, 59, 59, 999);
      filtered = filtered.filter(c => new Date(c.createdAt) <= endDate);
    }
    
    // Apply sorting
    this.applySorting(filtered);
    
    this.filteredCases = filtered;
  }

  applySorting(cases: Case[]): void {
    const sortMultiplier = this.sortOrder === 'asc' ? 1 : -1;
    
    cases.sort((a, b) => {
      let comparison = 0;
      
      switch (this.sortBy) {
        case 'date':
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        
        case 'status':
          const statusOrder: { [key: string]: number } = {
            'pending': 1,
            'ongoing': 2,
            'treated': 3,
            'rejected': 4
          };
          comparison = (statusOrder[a.status as string] || 5) - (statusOrder[b.status as string] || 5);
          break;
        
        case 'unread':
          const aUnread = a.unreadCount || 0;
          const bUnread = b.unreadCount || 0;
          comparison = aUnread - bUnread;
          break;
        
        default:
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }
      
      return comparison * sortMultiplier;
    });
  }

  setSortBy(sortBy: string): void {
    if (this.sortBy === sortBy) {
      // Toggle sort order if clicking the same sort option
      this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortBy = sortBy;
      this.sortOrder = sortBy === 'unread' ? 'desc' : 'desc'; // Default to desc for most sorts
    }
    this.applyFilters();
  }

  setFilter(filter: string): void {
    this.selectedFilter = filter;
    this.applyFilters();
  }

  onSearchChange(): void {
    this.applyFilters();
  }

  getStatusClass(status: string): string {
    const statusClasses: { [key: string]: string } = {
      'pending': 'status-pending',
      'ongoing': 'status-ongoing',
      'treated': 'status-treated',
      'rejected': 'status-rejected'
    };
    return statusClasses[status] || '';
  }

  getStatusLabel(status: string): string {
    const labels: { [key: string]: string } = {
      'pending': 'Pending',
      'ongoing': 'Ongoing',
      'treated': 'Treated',
      'rejected': 'Rejected'
    };
    return labels[status] || status;
  }

  getCaseCount(status: string): number {
    if (status === 'all') {
      return this.cases.length;
    }
    return this.cases.filter(c => c.status === status).length;
  }

  openFeedbackForm(): void {
    this.showFeedbackForm = true;
    this.feedbackRating = 0;
    this.feedbackComment = '';
  }

  setRating(rating: number): void {
    this.feedbackRating = rating;
  }

  submitFeedback(): void {
    if (!this.selectedCase || this.feedbackRating === 0 || this.submittingFeedback) {
      return;
    }
    
    this.submittingFeedback = true;
    this.caseService.submitFeedback(
      this.selectedCase._id,
      this.feedbackRating,
      this.feedbackComment
    ).subscribe({
      next: (response) => {
        if (response.success) {
          alert('Thank you for your feedback!');
          this.showFeedbackForm = false;
          this.loadCases();
          if (this.selectedCase) {
            this.selectedCase.feedback = {
              rating: this.feedbackRating,
              comment: this.feedbackComment,
              submittedAt: new Date()
            };
          }
        }
        this.submittingFeedback = false;
      },
      error: (error) => {
        console.error('Error submitting feedback:', error);
        alert('Failed to submit feedback. Please try again.');
        this.submittingFeedback = false;
      }
    });
  }

  goToDashboard(): void {
    this.router.navigate(['/patient/dashboard']);
  }

  printTimeline(): void {
    if (!this.selectedCase) {
      return;
    }
    
    // Create a printable HTML document
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      alert('Please allow popups to print the timeline');
      return;
    }
    
    let html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Consultation Timeline - Case ${this.selectedCase._id}</title>
        <style>
          body {
            font-family: Arial, sans-serif;
            padding: 40px;
            max-width: 800px;
            margin: 0 auto;
          }
          h1 {
            color: #333;
            border-bottom: 3px solid #667eea;
            padding-bottom: 10px;
          }
          .case-info {
            background: #f5f5f5;
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 30px;
          }
          .case-info p {
            margin: 5px 0;
          }
          .timeline-event {
            margin-bottom: 25px;
            padding-left: 30px;
            border-left: 3px solid #667eea;
            position: relative;
          }
          .timeline-event::before {
            content: '';
            position: absolute;
            left: -8px;
            top: 5px;
            width: 12px;
            height: 12px;
            border-radius: 50%;
            background: #667eea;
            border: 2px solid white;
            box-shadow: 0 0 0 2px #667eea;
          }
          .timeline-header {
            font-weight: bold;
            color: #333;
            margin-bottom: 5px;
          }
          .timeline-date {
            color: #999;
            font-size: 12px;
          }
          .timeline-content {
            color: #666;
            margin-top: 5px;
          }
          @media print {
            body {
              padding: 20px;
            }
          }
        </style>
      </head>
      <body>
        <h1>Consultation Timeline</h1>
        <div class="case-info">
          <p><strong>Case ID:</strong> ${this.selectedCase._id}</p>
          <p><strong>Patient:</strong> ${this.userName}</p>
          <p><strong>Doctor:</strong> Dr. ${this.selectedCase.doctorId.name}</p>
          <p><strong>Status:</strong> ${this.getStatusLabel(this.selectedCase.status)}</p>
          <p><strong>Created:</strong> ${new Date(this.selectedCase.createdAt).toLocaleString()}</p>
        </div>
        
        <div class="timeline-event">
          <div class="timeline-header">Case Created</div>
          <div class="timeline-date">${new Date(this.selectedCase.createdAt).toLocaleString()}</div>
          <div class="timeline-content">You requested a consultation with Dr. ${this.selectedCase.doctorId.name}</div>
        </div>
    `;
    
    if (this.selectedCase.acceptedAt) {
      html += `
        <div class="timeline-event">
          <div class="timeline-header">Case Accepted</div>
          <div class="timeline-date">${new Date(this.selectedCase.acceptedAt).toLocaleString()}</div>
          <div class="timeline-content">Dr. ${this.selectedCase.doctorId.name} accepted your consultation request</div>
        </div>
      `;
    }
    
    if (this.selectedCase.rejectedAt) {
      html += `
        <div class="timeline-event">
          <div class="timeline-header">Case Rejected</div>
          <div class="timeline-date">${new Date(this.selectedCase.rejectedAt).toLocaleString()}</div>
          <div class="timeline-content">Dr. ${this.selectedCase.doctorId.name} was unable to accept your consultation request</div>
        </div>
      `;
    }
    
    // Add messages
    this.messages.forEach(message => {
      const sender = message.senderType === 'patient' ? 'You' : `Dr. ${this.selectedCase!.doctorId.name}`;
      html += `
        <div class="timeline-event">
          <div class="timeline-header">${sender}</div>
          <div class="timeline-date">${new Date(message.createdAt).toLocaleString()}</div>
          <div class="timeline-content">${message.content}</div>
        </div>
      `;
    });
    
    if (this.selectedCase.treatedAt) {
      html += `
        <div class="timeline-event">
          <div class="timeline-header">Treatment Completed</div>
          <div class="timeline-date">${new Date(this.selectedCase.treatedAt).toLocaleString()}</div>
          <div class="timeline-content">Dr. ${this.selectedCase.doctorId.name} marked this case as treated</div>
        </div>
      `;
    }
    
    if (this.selectedCase.feedback) {
      html += `
        <div class="timeline-event">
          <div class="timeline-header">Feedback Submitted</div>
          <div class="timeline-date">${new Date(this.selectedCase.feedback.submittedAt).toLocaleString()}</div>
          <div class="timeline-content">You rated this consultation ${this.selectedCase.feedback.rating}/5 stars</div>
        </div>
      `;
    }
    
    html += `
      </body>
      </html>
    `;
    
    printWindow.document.write(html);
    printWindow.document.close();
    printWindow.focus();
    
    // Wait for content to load then print
    setTimeout(() => {
      printWindow.print();
    }, 250);
  }

  exportCaseHistory(): void {
    if (!this.selectedCase) {
      return;
    }
    
    // Create a formatted text document with case history
    let content = '='.repeat(60) + '\n';
    content += 'MEDICAL CASE HISTORY\n';
    content += '='.repeat(60) + '\n\n';
    
    content += `Case ID: ${this.selectedCase._id}\n`;
    content += `Patient: ${this.userName}\n`;
    content += `Doctor: Dr. ${this.selectedCase.doctorId.name}\n`;
    content += `Specialization: ${this.selectedCase.doctorId.speciality}\n`;
    content += `Status: ${this.getStatusLabel(this.selectedCase.status)}\n`;
    content += `Created: ${new Date(this.selectedCase.createdAt).toLocaleString()}\n`;
    
    if (this.selectedCase.acceptedAt) {
      content += `Accepted: ${new Date(this.selectedCase.acceptedAt).toLocaleString()}\n`;
    }
    if (this.selectedCase.treatedAt) {
      content += `Treated: ${new Date(this.selectedCase.treatedAt).toLocaleString()}\n`;
    }
    
    content += '\n' + '-'.repeat(60) + '\n';
    content += 'SYMPTOMS\n';
    content += '-'.repeat(60) + '\n';
    if (this.selectedCase.symptoms && this.selectedCase.symptoms.length > 0) {
      this.selectedCase.symptoms.forEach((symptom, index) => {
        content += `${index + 1}. ${symptom}\n`;
      });
    } else {
      content += 'No symptoms recorded\n';
    }
    
    if (this.selectedCase.predictedConditions && this.selectedCase.predictedConditions.length > 0) {
      content += '\n' + '-'.repeat(60) + '\n';
      content += 'PREDICTED CONDITIONS\n';
      content += '-'.repeat(60) + '\n';
      this.selectedCase.predictedConditions.forEach((condition, index) => {
        content += `${index + 1}. ${condition}\n`;
      });
    }
    
    if (this.selectedCase.chatbotHistory && this.selectedCase.chatbotHistory.length > 0) {
      content += '\n' + '-'.repeat(60) + '\n';
      content += 'CHATBOT DIAGNOSTIC CONVERSATION\n';
      content += '-'.repeat(60) + '\n';
      this.selectedCase.chatbotHistory.forEach((entry, index) => {
        content += `\nExchange ${index + 1}:\n`;
        content += `Q: ${entry.question}\n`;
        content += `A: ${entry.answer}\n`;
        if (entry.timestamp) {
          content += `Time: ${new Date(entry.timestamp).toLocaleString()}\n`;
        }
      });
    }
    
    content += '\n' + '-'.repeat(60) + '\n';
    content += 'CONSULTATION MESSAGES\n';
    content += '-'.repeat(60) + '\n';
    if (this.messages && this.messages.length > 0) {
      this.messages.forEach((message, index) => {
        const sender = message.senderType === 'patient' ? 'You' : `Dr. ${this.selectedCase!.doctorId.name}`;
        content += `\n[${new Date(message.createdAt).toLocaleString()}] ${sender}:\n`;
        content += `${message.content}\n`;
      });
    } else {
      content += 'No messages exchanged\n';
    }
    
    if (this.selectedCase.feedback) {
      content += '\n' + '-'.repeat(60) + '\n';
      content += 'FEEDBACK\n';
      content += '-'.repeat(60) + '\n';
      content += `Rating: ${'★'.repeat(this.selectedCase.feedback.rating)}${'☆'.repeat(5 - this.selectedCase.feedback.rating)} (${this.selectedCase.feedback.rating}/5)\n`;
      if (this.selectedCase.feedback.comment) {
        content += `Comment: ${this.selectedCase.feedback.comment}\n`;
      }
      content += `Submitted: ${new Date(this.selectedCase.feedback.submittedAt).toLocaleString()}\n`;
    }
    
    content += '\n' + '='.repeat(60) + '\n';
    content += 'END OF CASE HISTORY\n';
    content += '='.repeat(60) + '\n';
    
    // Create and download the file
    const blob = new Blob([content], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `case-history-${this.selectedCase._id}-${new Date().toISOString().split('T')[0]}.txt`;
    link.click();
    window.URL.revokeObjectURL(url);
    
    alert('Case history exported successfully!');
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  getConfidenceClass(confidence: number): string {
    if (confidence >= 70) return 'confidence-high';
    if (confidence >= 50) return 'confidence-medium';
    return 'confidence-low';
  }
}
