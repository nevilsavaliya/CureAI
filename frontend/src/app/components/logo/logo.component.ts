import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-logo',
  templateUrl: './logo.component.html',
  styleUrls: ['./logo.component.css']
})
export class LogoComponent {
  @Input() size: 'small' | 'medium' | 'large' = 'medium';
  @Input() variant: 'default' | 'white' | 'icon-only' = 'default';
  @Input() clickable: boolean = false;

  getSizeClass(): string {
    return `logo-${this.size}`;
  }

  getVariantClass(): string {
    return `logo-${this.variant}`;
  }
}
