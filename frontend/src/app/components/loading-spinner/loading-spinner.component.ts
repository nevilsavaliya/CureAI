import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-loading-spinner',
  templateUrl: './loading-spinner.component.html',
  styleUrls: ['./loading-spinner.component.css']
})
export class LoadingSpinnerComponent {
  @Input() size: 'small' | 'medium' | 'large' = 'medium';
  @Input() message: string = 'Loading...';
  @Input() overlay: boolean = false;
  @Input() fullScreen: boolean = false;

  getSizeClass(): string {
    return `spinner-${this.size}`;
  }

  getContainerClass(): string {
    let classes = 'loading-container';
    
    if (this.overlay) {
      classes += ' loading-overlay';
    }
    
    if (this.fullScreen) {
      classes += ' loading-fullscreen';
    }
    
    return classes;
  }
}
