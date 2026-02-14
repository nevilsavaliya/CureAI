import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { SymptomService, FollowUpQuestion, PredictionWithConfidence, DoctorRecommendation } from '../../services/symptom.service';
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
  speciality?: string; // backward compatibility
  specializations?: string[]; // main field
  experienceYears: number;
  contactNumber: string;
  rating: number;
  totalReviews: number;
  isGeneralMedicine?: boolean;
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
  matchedDoctors: Doctor[] = [];
  loading: boolean = false;
  showResults: boolean = false;

  selectedDoctor: Doctor | null = null;
  showCaseRequestModal: boolean = false;
  isCreatingCase: boolean = false;
  caseRequestError: string = '';
  existingCaseId: string = '';
  currentSymptoms: string[] = [];
  requestedDoctorIds: Set<string> = new Set();

  // New conversation-based properties
  conversationId: string | null = null;
  followUpQuestions: FollowUpQuestion[] = [];
  currentQuestionIndex: number = 0;
  answeredQuestions: number = 0;
  canProceedToPrediction: boolean = false;
  showingFollowUpQuestions: boolean = false;
  currentAnswer: string = '';
  selectedOption: string = '';
  scaleValue: number = 5;

  // Predictions with confidence
  predictionsWithConfidence: PredictionWithConfidence[] = [];
  recommendedDoctors: DoctorRecommendation[] = [];

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

    // Start conversation with new API
    this.symptomService.startConversation(userSymptom).subscribe({
      next: (response) => {
        this.loading = false;
        
        if (response.success) {
          this.conversationId = response.conversationId;
          this.followUpQuestions = response.questions || [];
          this.answeredQuestions = 0;
          this.currentQuestionIndex = 0;
          this.canProceedToPrediction = response.canProceedToPrediction || false;
          
          if (this.followUpQuestions.length > 0) {
            this.showingFollowUpQuestions = true;
            this.addBotMessage('I have a few follow-up questions to better understand your condition:');
            this.displayCurrentQuestion();
          } else {
            this.addBotMessage('Thank you. Let me analyze your symptoms...');
            this.getPredictions();
          }
        }
      },
      error: (error) => {
        this.loading = false;
        console.error('Error:', error);
        this.addBotMessage('Sorry, I encountered an error. Please try again later.');
      }
    });
  }

  displayCurrentQuestion(): void {
    if (this.currentQuestionIndex < this.followUpQuestions.length) {
      const question = this.followUpQuestions[this.currentQuestionIndex];
      this.addBotMessage(question.questionText);
      
      // Reset answer fields
      this.currentAnswer = '';
      this.selectedOption = '';
      this.scaleValue = question.min && question.max ? Math.floor((question.min + question.max) / 2) : 5;
    }
  }

  submitFollowUpAnswer(): void {
    if (!this.conversationId) return;

    const question = this.followUpQuestions[this.currentQuestionIndex];
    let answer = '';

    // Get answer based on question type
    switch (question.questionType) {
      case 'multiple_choice':
        answer = this.selectedOption;
        break;
      case 'yes_no':
        answer = this.selectedOption;
        break;
      case 'scale':
        answer = this.scaleValue.toString();
        break;
      case 'text':
        answer = this.currentAnswer;
        break;
    }

    if (!answer.trim()) {
      return;
    }

    // Display user's answer
    this.addUserMessage(answer);
    this.loading = true;

    // Submit answer to backend
    this.symptomService.submitAnswer(this.conversationId, question.questionId, answer).subscribe({
      next: (response) => {
        this.loading = false;
        
        if (response.success) {
          this.answeredQuestions++;
          this.canProceedToPrediction = response.canProceedToPrediction || false;
          
          // Move to next question or finish
          this.currentQuestionIndex++;
          
          if (this.currentQuestionIndex < this.followUpQuestions.length) {
            this.displayCurrentQuestion();
          } else {
            this.showingFollowUpQuestions = false;
            if (this.canProceedToPrediction) {
              this.addBotMessage('Thank you for answering the questions. Let me analyze your symptoms...');
              this.getPredictions();
            } else {
              this.addBotMessage('Please answer a few more questions to get accurate predictions.');
            }
          }
        }
      },
      error: (error) => {
        this.loading = false;
        this.addBotMessage('Sorry, I encountered an error. Please try again.');
        console.error('Error:', error);
      }
    });
  }

  skipQuestion(): void {
    this.currentQuestionIndex++;
    
    if (this.currentQuestionIndex < this.followUpQuestions.length) {
      this.addBotMessage('Okay, let\'s move to the next question.');
      this.displayCurrentQuestion();
    } else {
      this.showingFollowUpQuestions = false;
      if (this.canProceedToPrediction) {
        this.addBotMessage('Thank you. Let me analyze your symptoms...');
        this.getPredictions();
      } else {
        this.addBotMessage('I need more information to provide accurate predictions. Please start a new consultation.');
      }
    }
  }

  getPredictions(): void {
    if (!this.conversationId) return;

    this.loading = true;

    this.symptomService.getPrediction(this.conversationId).subscribe({
      next: (response) => {
        this.loading = false;
        
        if (response.success) {
          this.predictionsWithConfidence = response.predictions || [];
          this.recommendedDoctors = response.recommendedDoctors || [];
          this.showResults = true;

          // Convert to old format for compatibility
          this.predictedDiseases = this.predictionsWithConfidence.map(p => ({
            name: p.disease,
            confidence: p.confidence,
            description: '',
            specialization: p.specializations
          }));

          this.matchingDoctors = this.recommendedDoctors.map(d => ({
            _id: d._id,
            name: d.name,
            email: d.email,
            degree: d.degree,
            specializations: d.specializations,
            experienceYears: d.experienceYears,
            contactNumber: '',
            rating: d.rating,
            totalReviews: d.totalReviews,
            isGeneralMedicine: d.isGeneralMedicine
          }));

          // Bot response
          if (this.predictionsWithConfidence.length > 0) {
            this.addBotMessage(`Based on your symptoms, here are the possible conditions:`);
            this.addBotMessage(`I found ${this.matchingDoctors.length} doctors who can help you.`);
          } else {
            this.addBotMessage('I couldn\'t determine specific conditions. I recommend consulting with a General Medicine doctor.');
          }
        }
      },
      error: (error) => {
        this.loading = false;
        this.addBotMessage('Sorry, I encountered an error analyzing your symptoms.');
        console.error('Error:', error);
      }
    });
  }

  getCurrentQuestion(): FollowUpQuestion | null {
    if (this.currentQuestionIndex < this.followUpQuestions.length) {
      return this.followUpQuestions[this.currentQuestionIndex];
    }
    return null;
  }

  getProgressPercentage(): number {
    if (this.followUpQuestions.length === 0) return 0;
    return (this.answeredQuestions / this.followUpQuestions.length) * 100;
  }

  startNewConsultation(): void {
    this.chatMessages = [];
    this.predictedDiseases = [];
    this.matchingDoctors = [];
    this.matchedDoctors = [];
    this.showResults = false;
    this.currentSymptoms = [];
    this.requestedDoctorIds.clear();
    
    // Reset conversation state
    this.conversationId = null;
    this.followUpQuestions = [];
    this.currentQuestionIndex = 0;
    this.answeredQuestions = 0;
    this.canProceedToPrediction = false;
    this.showingFollowUpQuestions = false;
    this.predictionsWithConfidence = [];
    this.recommendedDoctors = [];
    
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

  getSpecialization(doctor: Doctor | null): string {
    if (!doctor) return '';
    if (doctor.speciality) return doctor.speciality;
    if (doctor.specializations && doctor.specializations.length > 0) {
      return doctor.specializations[0];
    }
    return '';
  }

  getConfidenceClass(confidence: number): string {
    if (confidence >= 70) return 'confidence-high';
    if (confidence >= 50) return 'confidence-medium';
    return 'confidence-low';
  }

  hasLowConfidencePredictions(): boolean {
    return this.predictionsWithConfidence.length > 0 && 
           this.predictionsWithConfidence.every(p => p.confidence < 50);
  }
}
