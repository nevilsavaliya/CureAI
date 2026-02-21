import { Component, Input, Output, EventEmitter } from '@angular/core';
import { StatCardConfig } from '../../shared/dashboard/models/dashboard.models';

@Component({
  selector: 'app-stat-card',
  templateUrl: './stat-card.component.html',
  styleUrls: ['./stat-card.component.css']
})
export class StatCardComponent {
  @Input() title: string = '';
  @Input() value: string | number = '';
  @Input() subtitle: string = '';
  @Input() icon: string = '';
  @Input() trend?: { value: number; direction: 'up' | 'down' };
  @Input() color: 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'secondary' = 'primary';
  @Input() loading: boolean = false;
  @Input() config?: StatCardConfig;
  
  @Output() cardClick = new EventEmitter<void>();

  ngOnInit() {
    // If config is provided, use it to populate individual properties
    if (this.config) {
      this.title = this.config.title;
      this.value = this.config.value;
      this.subtitle = this.config.subtitle || '';
      this.icon = this.config.icon;
      this.color = this.config.color;
      this.trend = this.config.trend;
      this.loading = this.config.loading || false;
    }
  }

  getColorClass(): string {
    return `stat-card-${this.color}`;
  }

  getTrendClass(): string {
    if (!this.trend) return '';
    return this.trend.direction === 'up' ? 'trend-up' : 'trend-down';
  }

  getTrendIcon(): string {
    if (!this.trend) return '';
    return this.trend.direction === 'up' ? '↑' : '↓';
  }

  formatTrendValue(): string {
    if (!this.trend) return '';
    const sign = this.trend.direction === 'up' ? '+' : '';
    return `${sign}${this.trend.value}%`;
  }

  onCardClick(): void {
    this.cardClick.emit();
  }

  isClickable(): boolean {
    return this.cardClick.observed;
  }

  getAriaLabel(): string {
    let label = `${this.title}: ${this.value}`;
    if (this.subtitle) {
      label += `, ${this.subtitle}`;
    }
    if (this.trend) {
      label += `, ${this.trend.direction === 'up' ? 'increased' : 'decreased'} by ${this.trend.value} percent`;
    }
    return label;
  }
}
