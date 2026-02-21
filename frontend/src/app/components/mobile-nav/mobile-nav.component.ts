import { Component, Input, Output, EventEmitter } from '@angular/core';
import { Router } from '@angular/router';
import { trigger, state, style, transition, animate } from '@angular/animations';

@Component({
  selector: 'app-mobile-nav',
  templateUrl: './mobile-nav.component.html',
  styleUrls: ['./mobile-nav.component.css'],
  animations: [
    trigger('slideIn', [
      state('closed', style({
        transform: 'translateX(-100%)'
      })),
      state('open', style({
        transform: 'translateX(0)'
      })),
      transition('closed => open', animate('300ms ease-out')),
      transition('open => closed', animate('250ms ease-in'))
    ]),
    trigger('fadeIn', [
      state('closed', style({
        opacity: 0,
        visibility: 'hidden'
      })),
      state('open', style({
        opacity: 1,
        visibility: 'visible'
      })),
      transition('closed => open', animate('200ms ease-out')),
      transition('open => closed', animate('150ms ease-in'))
    ])
  ]
})
export class MobileNavComponent {
  @Input() isOpen: boolean = false;
  @Input() userRole: 'patient' | 'doctor' | 'hospital' | 'admin' = 'patient';
  @Input() userName: string = '';
  @Output() close = new EventEmitter<void>();
  @Output() logoutClick = new EventEmitter<void>();

  constructor(private router: Router) {}

  closeMenu() {
    this.close.emit();
  }

  navigateTo(route: string) {
    this.router.navigate([route]);
    this.closeMenu();
  }

  onLogout() {
    this.logoutClick.emit();
    this.closeMenu();
  }

  getNavItems() {
    switch (this.userRole) {
      case 'patient':
        return [
          { label: 'Dashboard', route: '/patient/dashboard', icon: 'home' },
          { label: 'My Cases', route: '/patient/cases', icon: 'folder' }
        ];
      case 'doctor':
        return [
          { label: 'Dashboard', route: '/doctor/dashboard', icon: 'home' },
          { label: 'My Cases', route: '/doctor/cases', icon: 'folder' }
        ];
      case 'hospital':
        return [
          { label: 'Dashboard', route: '/hospital/dashboard', icon: 'home' }
        ];
      case 'admin':
        return [
          { label: 'Overview', route: '/admin/dashboard', icon: 'chart-line' },
          { label: 'Users', route: '/admin/users', icon: 'users' },
          { label: 'Hospitals', route: '/admin/hospitals', icon: 'hospital' }
        ];
      default:
        return [];
    }
  }
}
