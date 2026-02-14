import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../config/environment';
import { EncryptionService } from './encryption.service';

@Injectable({
  providedIn: 'root'
})
export class MessageService {
  private apiUrl = environment.apiUrl;

  constructor(
    private http: HttpClient,
    private encryptionService: EncryptionService
  ) {}

  sendMessage(recipientId: string, content: string, senderId?: string): Observable<any> {
    // Validate and prepare secure message
    const secureMessage = this.encryptionService.prepareSecureMessage(
      content, 
      senderId || 'current-user', 
      recipientId
    );
    
    return this.http.post(`${this.apiUrl}/messages`, { 
      recipientId, 
      content: secureMessage.content 
    }).pipe(
      map(response => ({
        ...response,
        encryptionInfo: this.encryptionService.getEncryptionInfo()
      }))
    );
  }

  getMessages(conversationWith: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/messages/${conversationWith}`, {
      params: { conversationWith }
    }).pipe(
      map(response => {
        if (response && response.messages) {
          // Process received encrypted messages
          response.messages = response.messages.map((message: any) => 
            this.encryptionService.processReceivedMessage(message)
          );
        }
        return response;
      })
    );
  }

  markAsRead(messageId: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/messages/${messageId}/read`, {});
  }

  getDoctorConversations(): Observable<any> {
    return this.http.get(`${this.apiUrl}/conversations/doctor`);
  }

  // Case-specific messaging methods
  sendCaseMessage(caseId: string, content: string, senderId?: string): Observable<any> {
    // Validate and prepare secure message
    const validation = this.encryptionService.validateMessageContent(content);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    return this.http.post(`${this.apiUrl}/cases/${caseId}/messages`, { 
      content: content.trim()
    }).pipe(
      map(response => ({
        ...response,
        encryptionInfo: this.encryptionService.getEncryptionInfo()
      }))
    );
  }

  getCaseMessages(caseId: string, page: number = 1, limit: number = 50): Observable<any> {
    return this.http.get(`${this.apiUrl}/cases/${caseId}/messages`, {
      params: { 
        page: page.toString(), 
        limit: limit.toString() 
      }
    }).pipe(
      map(response => {
        if (response && response.messages) {
          // Process received encrypted messages
          response.messages = response.messages.map((message: any) => 
            this.encryptionService.processReceivedMessage(message)
          );
        }
        return response;
      })
    );
  }

  markCaseMessageAsRead(messageId: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/messages/${messageId}/read`, {});
  }

  // Encryption utilities
  getEncryptionStatus(): any {
    return this.encryptionService.getEncryptionInfo();
  }

  validateMessageSecurity(message: any): boolean {
    return this.encryptionService.validateEncryptionStatus(message);
  }
}
