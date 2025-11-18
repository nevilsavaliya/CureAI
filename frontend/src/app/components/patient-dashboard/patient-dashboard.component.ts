import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { SymptomService } from '../../services/symptom.service';
import { DoctorService } from '../../services/doctor.service';
import { CaseService } from '../../services/case.service';
import { SocketService } from '../../services/socket.service';
import { NotificationService } from '../../services/notification.service';

interface ChatMessage {
  text: string;
  isUser: boolean;
  timestamp: Date;
}

interface Disease {
  name: string;
  confidence: number;
  description: string;
  specialization: string[];
}

interface Doctor {
  _id: string;
  name: string;
  email: string;
  degree: string;
  speciality: string;
  experienceYears: number;
  contactNumber: string;
  rating: number;
  totalReviews: number;
}

@Component({
  selector: 'app-patient-dashboard',
  templateUrl: './patient-dashboard.component.html',
  styleUrls: ['./patient-dashboard.component.css']
})
export class PatientDashboardComponent implements OnInit, OnDestroy {
  userName: string = '';
  symptomText: string = '';
  chatMessages: ChatMessage[] = [];
  predictedDiseases: Disease[] = [];
  matchingDoctors: Doctor[] = [];
  loading: boolean = false;
  showResults: boolean = false;

  selectedDoctor: Doctor | null = null;
  showCaseRequestModal: boolean = false;
  isCreatingCase: boolean = false;
  caseRequestError: string = '';
  existingCaseId: string = '';
  currentSymptoms: string[] = [];
  requestedDoctorIds: Set<string> = new Set();

  constructor(
    private authService: AuthService,
    private symptomService: SymptomService,
    private doctorService: DoctorService,
    private caseService: CaseService,
    private socketService: SocketService,
    private notificationService: NotificationService,
    private router: Router
  ) {}

  ngOnInit(): void {
    const user = this.authService.currentUserValue;
    if (user) {
      this.userName = user.name;
    }
    
    // Connect to WebSocket for real-time updates
    this.socketService.connect();
    
    // Welcome message
    this.addBotMessage('Hello! I\'m your healthcare assistant. Please describe your symptoms and I\'ll help you find the right doctor.');
  }

  ngOnDestroy(): void {
    // Disconnect socket when component is destroyed
    this.socketService.disconnect();
  }

  addBotMessage(text: string): void {
    this.chatMessages.push({
      text,
      isUser: false,
      timestamp: new Date()
    });
  }

  addUserMessage(text: string): void {
    this.chatMessages.push({
      text,
      isUser: true,
      timestamp: new Date()
    });
  }

  submitSymptom(): void {
    if (!this.symptomText.trim()) {
      return;
    }

    const userSymptom = this.symptomText;
    this.addUserMessage(userSymptom);
    
    // Store symptoms for case creation
    this.currentSymptoms.push(userSymptom);
    
    // Reset requested doctors when analyzing new symptoms
    if (this.currentSymptoms.length === 1) {
      this.requestedDoctorIds.clear();
    }
    
    this.symptomText = '';
    this.loading = true;

    this.addBotMessage('Analyzing your symptoms...');

    this.symptomService.submitSymptom(userSymptom).subscribe({
      next: (response) => {
        this.loading = false;
        
        if (response.success && response.prediction) {
          this.predictedDiseases = response.prediction.diseases;
          this.showResults = true;

          // Bot response
          this.addBotMessage(`Based on your symptoms, here are the possible conditions:`);
          
          // Get matching doctors
          if (this.predictedDiseases.length > 0) {
            const topDisease = this.predictedDiseases[0];
            const specialization = topDisease.specialization[0];
            
            this.doctorService.getMatchingDoctors(specialization).subscribe({
              next: (doctorResponse) => {
                if (doctorResponse.success) {
                  this.matchingDoctors = doctorResponse.doctors;
                  this.addBotMessage(`I found ${this.matchingDoctors.length} doctors who can help you.`);
                }
              },
              error: (error) => {
                console.error('Error fetching doctors:', error);
              }
            });
          }
        }
      },
      error: (error) => {
        this.loading = false;
        this.addBotMessage('Sorry, I encountered an error. Please try again or make sure you have created your patient profile first.');
        console.error('Error:', error);
      }
    });
  }

  startNewConsultation(): void {
    this.chatMessages = [];
    this.predictedDiseases = [];
    this.matchingDoctors = [];
    this.showResults = false;
    this.currentSymptoms = [];
    this.requestedDoctorIds.clear();
    this.addBotMessage('Hello! I\'m your healthcare assistant. Please describe your symptoms and I\'ll help you find the right doctor.');
  }

  requestConsultation(doctor: Doctor): void {
    this.selectedDoctor = doctor;
    this.showCaseRequestModal = true;
    this.caseRequestError = '';
    this.existingCaseId = '';
  }

  closeCaseRequestModal(): void {
    this.showCaseRequestModal = false;
    this.selectedDoctor = null;
    this.caseRequestError = '';
    this.existingCaseId = '';
  }

  getSymptomsList(): string {
    return this.currentSymptoms.join(', ');
  }

  getChatbotHistory(): Array<{ question: string; answer: string; timestamp: Date }> {
    const history: Array<{ question: string; answer: string; timestamp: Date }> = [];
    
    for (let i = 0; i < this.chatMessages.length - 1; i++) {
      if (this.chatMessages[i].isUser && !this.chatMessages[i + 1].isUser) {
        history.push({
          question: this.chatMessages[i].text,
          answer: this.chatMessages[i + 1].text,
          timestamp: this.chatMessages[i].timestamp
        });
      }
    }
    
    return history;
  }

  confirmCaseRequest(): void {
    if (!this.selectedDoctor || this.isCreatingCase) {
      return;
    }

    this.isCreatingCase = true;
    this.caseRequestError = '';
    this.existingCaseId = '';

    // Prepare case data
    const symptoms = this.currentSymptoms;
    const predictedConditions = this.predictedDiseases.map(d => d.name);
    const chatbotHistory = this.getChatbotHistory();

    this.caseService.createCase(
      this.selectedDoctor._id,
      symptoms,
      predictedConditions,
      chatbotHistory
    ).subscribe({
      next: (response) => {
        this.isCreatingCase = false;
        if (response.success) {
          // Add doctor to requested list
          this.requestedDoctorIds.add(this.selectedDoctor!._id);
          
          alert('Consultation request sent successfully! The doctor will review your case.');
          this.closeCaseRequestModal();
          // Optionally navigate to cases page
          // this.router.navigate(['/patient/cases']);
        }
      },
      error: (error) => {
        this.isCreatingCase = false;
        console.error('Error creating case:', error);
        
        // Handle duplicate case error
        if (error.error && error.error.message) {
          this.caseRequestError = error.error.message;
          if (error.error.caseId) {
            this.existingCaseId = error.error.caseId;
          }
          // Also mark as requested if it's a duplicate
          this.requestedDoctorIds.add(this.selectedDoctor!._id);
        } else {
          this.caseRequestError = 'Failed to create consultation request. Please try again.';
        }
      }
    });
  }

  viewExistingCase(): void {
    if (this.existingCaseId) {
      this.closeCaseRequestModal();
      this.router.navigate(['/patient/cases'], { 
        queryParams: { caseId: this.existingCaseId } 
      });
    }
  }

  /**
   * Check if a doctor has already been requested for current symptoms
   */
  isDoctorRequested(doctorId: string): boolean {
    return this.requestedDoctorIds.has(doctorId);
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
