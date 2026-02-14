import { Component, Input } from '@angular/core';
import { EncryptionService } from '../../services/encryption.service';

@Component({
  selector: 'app-encryption-indicator',
  template: `
    <div class="encryption-indicator" [class.encrypted]="isEncrypted" [title]="tooltipText">
      <span class="encryption-icon">🔒</span>
      <span class="encryption-text" *ngIf="showText">{{ statusText }}</span>
    </div>
  `,
  styles: [`
    .encryption-indicator {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      padding: 2px 6px;
      border-radius: 12px;
      font-size: 0.75rem;
      font-weight: 500;
      background: #f3f4f6;
      color: #6b7280;
      border: 1px solid #e5e7eb;
    }

    .encryption-indicator.encrypted {
      background: #dcfce7;
      color: #166534;
      border-color: #bbf7d0;
    }

    .encryption-icon {
      font-size: 0.875rem;
    }

    .encryption-text {
      font-size: 0.75rem;
    }

    .encryption-indicator:hover {
      background: #e5e7eb;
    }

    .encryption-indicator.encrypted:hover {
      background: #bbf7d0;
    }
  `]
})
export class EncryptionIndicatorComponent {
  @Input() isEncrypted: boolean = false;
  @Input() showText: boolean = true;
  @Input() message?: any;

  constructor(private encryptionService: EncryptionService) {}

  get statusText(): string {
    return this.isEncrypted ? 'Encrypted' : 'Not Encrypted';
  }

  get tooltipText(): string {
    if (this.isEncrypted) {
      const info = this.encryptionService.getEncryptionInfo();
      return `End-to-end encrypted with ${info.algorithm}. ${info.description}`;
    }
    return 'This message is not encrypted';
  }
}