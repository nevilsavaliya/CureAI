import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class MessageService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  sendMessage(recipientId: string, content: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/messages`, { recipientId, content });
  }

  getMessages(conversationWith: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/messages/${conversationWith}`, {
      params: { conversationWith }
    });
  }

  markAsRead(messageId: string): Observable<any> {
    return this.http.put(`${this.apiUrl}/messages/${messageId}/read`, {});
  }

  getDoctorConversations(): Observable<any> {
    return this.http.get(`${this.apiUrl}/conversations/doctor`);
  }
}
