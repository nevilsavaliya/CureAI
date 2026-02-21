import { Component, Input, Output, EventEmitter } from '@angular/core';
import { trigger, state, style, transition, animate } from '@angular/animations';

@Component({
  selector: 'app-hamburger-button',
  templateUrl: './hamburger-button.component.html',
  styleUrls: ['./hamburger-button.component.css'],
  animations: [
    trigger('hamburgerAnimation', [
      state('closed', style({
        transform: 'rotate(0deg)'
      })),
      state('open', style({
        transform: 'rotate(90deg)'
      })),
      transition('closed <=> open', animate('200ms ease-in-out'))
    ])
  ]
})
export class HamburgerButtonComponent {
  @Input() isOpen: boolean = false;
  @Output() toggle = new EventEmitter<void>();

  onToggle() {
    this.toggle.emit();
  }
}
