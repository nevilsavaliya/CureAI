import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { successAnimation } from '../../animations/page-animations';

@Component({
  selector: 'app-success-checkmark',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './success-checkmark.component.html',
  styleUrls: ['./success-checkmark.component.css'],
  animations: [successAnimation]
})
export class SuccessCheckmarkComponent {
  @Input() size: 'sm' | 'md' | 'lg' = 'md';
  @Input() message: string = 'Success!';
  @Input() showMessage: boolean = true;

  get checkmarkSize(): number {
    switch (this.size) {
      case 'sm':
        return 40;
      case 'lg':
        return 120;
      default:
        return 80;
    }
  }
}
