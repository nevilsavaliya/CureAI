import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-empty-state',
  templateUrl: './empty-state.component.html',
  styleUrls: ['./empty-state.component.css']
})
export class EmptyStateComponent {
  @Input() illustration: string = 'empty-cases';
  @Input() title: string = 'No items found';
  @Input() message: string = 'There are no items to display at the moment.';
  @Input() ctaText?: string;
  @Input() ctaIcon?: string;
  @Input() showCta: boolean = false;

  get illustrationPath(): string {
    return `assets/illustrations/${this.illustration}.svg`;
  }

  onCtaClick(): void {
    // Emit event or handle CTA click
    // This can be extended with an @Output() EventEmitter if needed
  }
}
