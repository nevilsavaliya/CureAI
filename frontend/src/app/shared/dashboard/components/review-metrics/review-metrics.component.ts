import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { ReviewMetricsConfig, ReviewMetric } from '../../models/dashboard.models';

@Component({
  selector: 'app-review-metrics',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './review-metrics.component.html',
  styleUrls: ['./review-metrics.component.css'],
  animations: [
    trigger('barAnimation', [
      state('void', style({
        width: '0%',
        opacity: 0
      })),
      state('*', style({
        width: '{{width}}%',
        opacity: 1
      }), { params: { width: 0 } }),
      transition('void => *', [
        animate('600ms ease-out')
      ])
    ])
  ]
})
export class ReviewMetricsComponent {
  @Input() config: ReviewMetricsConfig | null = null;
  @Input() loading: boolean = false;

  /**
   * Calculate percentage for a metric
   */
  getPercentage(metric: ReviewMetric): number {
    if (!metric.maxValue || metric.maxValue === 0) {
      return 0;
    }
    return Math.round((metric.value / metric.maxValue) * 100);
  }

  /**
   * Get animation state for progress bar
   */
  getAnimationState(metric: ReviewMetric): { value: string; params: { width: number } } {
    return {
      value: 'visible',
      params: { width: this.getPercentage(metric) }
    };
  }

  /**
   * Track by function for ngFor optimization
   */
  trackByLabel(index: number, metric: ReviewMetric): string {
    return metric.label;
  }
}
