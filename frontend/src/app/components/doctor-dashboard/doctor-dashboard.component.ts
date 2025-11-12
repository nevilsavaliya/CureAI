import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { MessageService } from '../../services/message.service';
import { ConsultationService } from '../../services/consultation.service';
import { MatSnackBar } from '@angular/material/snack-bar';

interface Conversation {
  patient: {
    _id: string;
    name: string;
    email: string;
    bloodGroup?: string;
  };
  lastMessage: string;
  lastMessageTime: Date;
  unreadCount: number;
  symptoms?: string;
  predictions?: Array<{
    name: string;
    confidence: number;
    description: string;
    specialization: string[];
  }>;
}

interface Message {
  _id: string;
  senderId: any;
  recipientId: any;
  content: string;
  isRead: boolean;
  sentAt: Date;
}

@Component({
  selector: 'app-doctor-dashboard',
  templateUrl: './doctor-dashboard.component.html',
  styleUrls: ['./doctor-dashboard.component.css']
})
export class DoctorDashboardComponent implements OnInit {
  userName: string = '';
  conversations: Conversation[] = [];
  selectedConversation: Conversation | null = null;
  messages: Message[] = [];
  replyText: string = '';
  loading: boolean = false;
  showMessagingView: boolean = false;
  
  // Booking modal
  showBookingModal: boolean = false;
  bookingLoading: boolean = false;
  bookingData = {
    date: '',
    time: ''
  };
  minDate: string = '';
  
  // Consultations
  upcomingConsultations: any[] = [];

  constructor(
    public authService: AuthService,
    private messageService: MessageService,
    private consultationService: ConsultationService,
    private snackBar: MatSnackBar,
    private router: Router
  ) {
    // Set minimum date to today
    const today = new Date();
    this.minDate = today.toISOString().split('T')[0];
  }

  ngOnInit(): void {
    const user = this.authService.currentUserValue;
    if (user) {
      this.userName = user.name;
    }
    this.loadConversations();
    this.loadUpcomingConsultations();
  }

  loadConversations(): void {
    this.loading = true;
    this.messageService.getDoctorConversations().subscribe({
      next: (response) => {
        this.loading = false;
        if (response.success) {
          this.conversations = response.conversations;
        }
      },
      error: (error) => {
        this.loading = false;
        console.error('Error loading conversations:', error);
      }
    });
  }

  openConversation(conversation: Conversation): void {
    this.selectedConversation = conversation;
    this.showMessagingView = true;
    this.loadMessages(conversation.patient._id);
  }

  loadMessages(patientId: string): void {
    this.messageService.getMessages(patientId).subscribe({
      next: (response) => {
        if (response.success) {
          this.messages = response.messages;
          // Mark messages as read
          this.messages.forEach(msg => {
            if (!msg.isRead && msg.recipientId._id === this.authService.currentUserValue?.id) {
              this.messageService.markAsRead(msg._id).subscribe();
            }
          });
        }
      },
      error: (error) => {
        console.error('Error loading messages:', error);
      }
    });
  }

  sendReply(): void {
    if (!this.replyText.trim() || !this.selectedConversation) {
      return;
    }

    const recipientId = this.selectedConversation.patient._id;
    this.messageService.sendMessage(recipientId, this.replyText).subscribe({
      next: (response) => {
        if (response.success) {
          this.replyText = '';
          this.loadMessages(recipientId);
          this.loadConversations(); // Refresh conversation list
        }
      },
      error: (error) => {
        alert('Failed to send message. Please try again.');
        console.error('Error:', error);
      }
    });
  }

  backToConversations(): void {
    this.showMessagingView = false;
    this.selectedConversation = null;
    this.messages = [];
    this.loadConversations();
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  // Booking methods
  openBookingModal(): void {
    this.showBookingModal = true;
    this.bookingData = { date: '', time: '' };
  }

  closeBookingModal(): void {
    this.showBookingModal = false;
    this.bookingData = { date: '', time: '' };
  }

  confirmBooking(): void {
    if (!this.bookingData.date || !this.bookingData.time || !this.selectedConversation) {
      return;
    }

    this.bookingLoading = true;
    const patientId = this.selectedConversation.patient._id;
    const doctorId = this.authService.currentUserValue?.id;

    if (!doctorId) {
      this.snackBar.open('Doctor ID not found', 'Close', { duration: 3000 });
      this.bookingLoading = false;
      return;
    }

    this.consultationService.scheduleConsultation(
      patientId,
      doctorId,
      this.bookingData.date,
      this.bookingData.time
    ).subscribe({
      next: (response) => {
        this.bookingLoading = false;
        if (response.success) {
          this.snackBar.open('Consultation booked successfully! Email notifications sent.', 'Close', {
            duration: 5000,
            horizontalPosition: 'center',
            verticalPosition: 'top'
          });
          this.closeBookingModal();
          this.loadUpcomingConsultations();
        }
      },
      error: (error) => {
        this.bookingLoading = false;
        this.snackBar.open('Failed to book consultation. Please try again.', 'Close', {
          duration: 3000
        });
        console.error('Error booking consultation:', error);
      }
    });
  }

  loadUpcomingConsultations(): void {
    this.consultationService.getConsultations('doctor').subscribe({
      next: (response) => {
        if (response.success) {
          // Filter for upcoming consultations
          const now = new Date();
          this.upcomingConsultations = response.consultations
            .filter((c: any) => {
              const consultationDate = new Date(c.scheduledDate);
              return consultationDate >= now && c.status !== 'completed' && c.status !== 'cancelled';
            })
            .map((c: any) => ({
              ...c,
              patientName: c.patientId?.name || 'Unknown Patient',
              videoLink: c.videoLink || c.roomId
            }))
            .sort((a: any, b: any) => new Date(a.scheduledDate).getTime() - new Date(b.scheduledDate).getTime());
        }
      },
      error: (error) => {
        console.error('Error loading consultations:', error);
      }
    });
  }

  joinVideoCall(videoLink: string): void {
    if (videoLink) {
      window.open(videoLink, '_blank');
    } else {
      this.snackBar.open('Video link not available yet', 'Close', { duration: 3000 });
    }
  }
}
