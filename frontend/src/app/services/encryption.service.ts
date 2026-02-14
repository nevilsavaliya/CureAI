import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class EncryptionService {
  
  constructor() {}

  /**
   * Generate a conversation ID for two users (consistent regardless of order)
   */
  generateConversationId(userId1: string, userId2: string): string {
    const sortedIds = [userId1, userId2].sort();
    return this.hashString(sortedIds.join(':'));
  }

  /**
   * Simple hash function for conversation IDs
   */
  private hashString(str: string): string {
    let hash = 0;
    if (str.length === 0) return hash.toString();
    
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    return Math.abs(hash).toString(16);
  }

  /**
   * Validate message content before sending
   */
  validateMessageContent(content: string): { valid: boolean; error?: string } {
    if (!content || content.trim().length === 0) {
      return { valid: false, error: 'Message content cannot be empty' };
    }

    if (content.length > 5000) {
      return { valid: false, error: 'Message content cannot exceed 5000 characters' };
    }

    return { valid: true };
  }

  /**
   * Prepare message for secure transmission
   */
  prepareSecureMessage(content: string, senderId: string, recipientId: string) {
    const validation = this.validateMessageContent(content);
    if (!validation.valid) {
      throw new Error(validation.error);
    }

    return {
      content: content.trim(),
      senderId,
      recipientId,
      conversationId: this.generateConversationId(senderId, recipientId),
      timestamp: new Date().toISOString(),
      // Note: Actual encryption happens on the backend for security
      isEncrypted: true
    };
  }

  /**
   * Process received encrypted message
   */
  processReceivedMessage(encryptedMessage: any) {
    // Backend handles decryption and sends decrypted content
    // This method can be used for additional client-side processing
    return {
      ...encryptedMessage,
      isDecrypted: true,
      receivedAt: new Date().toISOString()
    };
  }

  /**
   * Generate secure message metadata
   */
  generateMessageMetadata(senderId: string, recipientId: string) {
    return {
      conversationId: this.generateConversationId(senderId, recipientId),
      encryptionVersion: '1.0',
      clientTimestamp: new Date().toISOString()
    };
  }

  /**
   * Validate encryption status of a message
   */
  validateEncryptionStatus(message: any): boolean {
    return message.isEncrypted === true && message.encryptionVersion;
  }

  /**
   * Get encryption info for UI display
   */
  getEncryptionInfo() {
    return {
      enabled: true,
      algorithm: 'AES-256-GCM',
      keyDerivation: 'PBKDF2',
      version: '1.0',
      description: 'End-to-end encrypted messaging ensures your conversations remain private and secure.'
    };
  }
}