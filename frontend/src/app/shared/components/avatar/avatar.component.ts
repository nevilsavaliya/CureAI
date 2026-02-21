import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-avatar',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div 
      class="avatar" 
      [class]="'avatar-' + size"
      [style.background-color]="backgroundColor"
      [attr.aria-label]="name || 'User avatar'">
      <img 
        *ngIf="src && !imageError" 
        [src]="src" 
        [alt]="name || 'Avatar'"
        (error)="onImageError()"
        class="avatar-image">
      <span 
        *ngIf="!src || imageError" 
        class="avatar-initials"
        [style.color]="textColor">
        {{ initials }}
      </span>
      <span 
        *ngIf="status" 
        class="avatar-status"
        [class]="'status-' + status"
        [attr.aria-label]="status + ' status'">
      </span>
    </div>
  `,
  styles: [`
    .avatar {
      position: relative;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      border-radius: var(--radius-full, 9999px);
      overflow: hidden;
      flex-shrink: 0;
      font-weight: var(--font-weight-medium, 500);
      user-select: none;
      background-color: var(--color-gray-200);
    }

    .avatar-xs {
      width: 24px;
      height: 24px;
      font-size: var(--font-size-xs, 0.75rem);
    }

    .avatar-sm {
      width: 32px;
      height: 32px;
      font-size: var(--font-size-sm, 0.875rem);
    }

    .avatar-md {
      width: 40px;
      height: 40px;
      font-size: var(--font-size-base, 1rem);
    }

    .avatar-lg {
      width: 48px;
      height: 48px;
      font-size: var(--font-size-lg, 1.125rem);
    }

    .avatar-xl {
      width: 64px;
      height: 64px;
      font-size: var(--font-size-xl, 1.25rem);
    }

    .avatar-2xl {
      width: 96px;
      height: 96px;
      font-size: var(--font-size-2xl, 1.5rem);
    }

    .avatar-image {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .avatar-initials {
      text-transform: uppercase;
      line-height: 1;
    }

    .avatar-status {
      position: absolute;
      bottom: 0;
      right: 0;
      width: 25%;
      height: 25%;
      border-radius: var(--radius-full, 9999px);
      border: 2px solid #fff;
    }

    .status-online {
      background-color: var(--color-success-500, #10b981);
    }

    .status-offline {
      background-color: var(--color-gray-400, #9ca3af);
    }

    .status-busy {
      background-color: var(--color-error-500, #ef4444);
    }

    .status-away {
      background-color: var(--color-warning-500, #f59e0b);
    }
  `]
})
export class AvatarComponent {
  @Input() src?: string;
  @Input() name?: string;
  @Input() size: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' = 'md';
  @Input() status?: 'online' | 'offline' | 'busy' | 'away';
  @Input() backgroundColor?: string;
  @Input() textColor?: string;

  imageError = false;

  get initials(): string {
    if (!this.name) return '?';
    
    const parts = this.name.trim().split(' ');
    if (parts.length === 1) {
      return parts[0].substring(0, 2).toUpperCase();
    }
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  ngOnInit() {
    if (!this.backgroundColor) {
      this.backgroundColor = this.generateColor(this.name || '');
    }
    if (!this.textColor) {
      this.textColor = this.getContrastColor(this.backgroundColor);
    }
  }

  onImageError() {
    this.imageError = true;
  }

  private generateColor(str: string): string {
    // Generate a consistent color based on the name
    const colors = [
      '#667eea', // primary
      '#764ba2', // secondary
      '#10b981', // success
      '#3b82f6', // info
      '#f59e0b', // warning
      '#ef4444', // error
      '#8b5cf6', // purple
      '#ec4899', // pink
      '#14b8a6', // teal
      '#f97316', // orange
    ];
    
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    return colors[Math.abs(hash) % colors.length];
  }

  private getContrastColor(hexColor: string): string {
    // Convert hex to RGB
    const hex = hexColor.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);
    
    // Calculate luminance
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    
    // Return white or black based on luminance
    return luminance > 0.5 ? '#000000' : '#ffffff';
  }
}
