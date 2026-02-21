import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-cases-header',
  templateUrl: './cases-header.component.html',
  styleUrls: ['./cases-header.component.css']
})
export class CasesHeaderComponent {
  @Input() userName: string = '';
  @Input() connectionStatus: 'connected' | 'polling' | 'disconnected' = 'disconnected';
  @Output() dashboardClick = new EventEmitter<void>();
  @Output() logoutClick = new EventEmitter<void>();

  onDashboardClick(): void {
    this.dashboardClick.emit();
  }

  onLogoutClick(): void {
    this.logoutClick.emit();
  }
}
