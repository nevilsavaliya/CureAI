import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-progress-indicator',
  templateUrl: './progress-indicator.component.html',
  styleUrls: ['./progress-indicator.component.css']
})
export class ProgressIndicatorComponent {
  @Input() show: boolean = false;
  @Input() message: string = 'Processing...';
  @Input() type: 'spinner' | 'dots' | 'bar' = 'spinner';
  @Input() size: 'small' | 'medium' | 'large' = 'small';
  @Input() inline: boolean = false;
}
