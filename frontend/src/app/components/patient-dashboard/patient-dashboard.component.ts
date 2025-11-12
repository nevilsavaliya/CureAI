import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { SymptomService } from '../../services/symptom.service';
import { DoctorService } from '../../services/doctor.service';
import { MessageService } from '../../services/message.service';

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
export class PatientDashboardComponent implements OnInit {
  userName: string = '';
  symptomText: string = '';
  chatMessages: ChatMessage[] = [];
  predictedDiseases: Disease[] = [];
  matchingDoctors: Doctor[] = [];
  loading: boolean = false;
  showResults: boolean = false;

  selectedDoctor: Doctor | null = null;
  showMessageModal: boolean = false;
  messageText: string = '';

  constructor(
    private authService: AuthService,
    private symptomService: SymptomService,
    private doctorService: DoctorService,
    private messageService: MessageService,
    private router: Router
  ) {}

  ngOnInit(): void {
    const user = this.authService.currentUserValue;
    if (user) {
      this.userName = user.name;
    }
    
    // Welcome message
    this.addBotMessage('Hello! I\'m your healthcare assistant. Please describe your symptoms and I\'ll help you find the right doctor.');
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
    this.addBotMessage('Hello! I\'m your healthcare assistant. Please describe your symptoms and I\'ll help you find the right doctor.');
  }

  openMessageModal(doctor: Doctor): void {
    this.selectedDoctor = doctor;
    this.showMessageModal = true;
    this.messageText = '';
  }

  closeMessageModal(): void {
    this.showMessageModal = false;
    this.selectedDoctor = null;
  }

  sendMessage(): void {
    if (!this.messageText.trim() || !this.selectedDoctor) {
      return;
    }

    const recipientId = this.selectedDoctor._id;
    this.messageService.sendMessage(recipientId, this.messageText).subscribe({
      next: (response) => {
        if (response.success) {
          alert('Message sent successfully!');
          this.closeMessageModal();
        }
      },
      error: (error) => {
        alert('Failed to send message. Please try again.');
        console.error('Error:', error);
      }
    });
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
