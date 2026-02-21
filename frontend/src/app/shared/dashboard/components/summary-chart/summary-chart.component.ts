import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { trigger, transition, style, animate } from '@angular/animations';
import { ChartConfig, ChartDataItem } from '../../models/dashboard.models';

interface ChartSegment {
  data: ChartDataItem;
  startAngle: number;
  endAngle: number;
  path: string;
  percentage: number;
}

@Component({
  selector: 'app-summary-chart',
  templateUrl: './summary-chart.component.html',
  styleUrls: ['./summary-chart.component.css'],
  animations: [
    trigger('chartAnimation', [
      transition(':enter', [
        style({ opacity: 0, transform: 'scale(0.8)' }),
        animate('500ms ease-out', style({ opacity: 1, transform: 'scale(1)' }))
      ])
    ]),
    trigger('segmentAnimation', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('300ms 200ms ease-out', style({ opacity: 1 }))
      ])
    ])
  ]
})
export class SummaryChartComponent implements OnInit, OnChanges {
  @Input() config!: ChartConfig;
  @Input() loading: boolean = false;
  @Input() error: string | null = null;
  @Input() emptyMessage: string = 'No data available';

  @Output() retry = new EventEmitter<void>();

  segments: ChartSegment[] = [];
  total: number = 0;
  hoveredSegment: ChartSegment | null = null;
  selectedSegment: ChartSegment | null = null;

  // Chart dimensions
  readonly size = 200;
  readonly strokeWidth = 40;
  readonly radius = (this.size - this.strokeWidth) / 2;
  readonly centerX = this.size / 2;
  readonly centerY = this.size / 2;

  // Default colors if not provided
  readonly defaultColors = [
    '#4F46E5', // primary
    '#10B981', // success
    '#F59E0B', // warning
    '#EF4444', // danger
    '#3B82F6', // info
    '#8B5CF6', // purple
    '#EC4899', // pink
    '#14B8A6'  // teal
  ];

  ngOnInit(): void {
    this.calculateSegments();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['config']) {
      this.calculateSegments();
    }
  }

  private calculateSegments(): void {
    if (!this.config || !this.config.data || this.config.data.length === 0) {
      this.segments = [];
      this.total = 0;
      return;
    }

    // Calculate total
    this.total = this.config.data.reduce((sum, item) => sum + item.value, 0);

    if (this.total === 0) {
      this.segments = [];
      return;
    }

    // Calculate segments with angles and paths
    let currentAngle = -90; // Start from top
    this.segments = this.config.data.map((dataItem, index) => {
      const percentage = (dataItem.value / this.total) * 100;
      const angleSize = (dataItem.value / this.total) * 360;
      const startAngle = currentAngle;
      const endAngle = currentAngle + angleSize;

      const segment: ChartSegment = {
        data: {
          ...dataItem,
          color: dataItem.color || this.getColor(index)
        },
        startAngle,
        endAngle,
        path: this.createArcPath(startAngle, endAngle),
        percentage
      };

      currentAngle = endAngle;
      return segment;
    });
  }

  private getColor(index: number): string {
    if (this.config.colors && this.config.colors[index]) {
      return this.config.colors[index];
    }
    return this.defaultColors[index % this.defaultColors.length];
  }

  private createArcPath(startAngle: number, endAngle: number): string {
    const start = this.polarToCartesian(startAngle);
    const end = this.polarToCartesian(endAngle);

    const largeArcFlag = endAngle - startAngle > 180 ? 1 : 0;

    // Create donut arc path
    const innerRadius = this.radius - this.strokeWidth;
    const startInner = this.polarToCartesian(startAngle, innerRadius);
    const endInner = this.polarToCartesian(endAngle, innerRadius);

    return [
      `M ${start.x} ${start.y}`,
      `A ${this.radius} ${this.radius} 0 ${largeArcFlag} 1 ${end.x} ${end.y}`,
      `L ${endInner.x} ${endInner.y}`,
      `A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${startInner.x} ${startInner.y}`,
      'Z'
    ].join(' ');
  }

  private polarToCartesian(angle: number, radius: number = this.radius): { x: number; y: number } {
    const angleInRadians = (angle * Math.PI) / 180;
    return {
      x: this.centerX + radius * Math.cos(angleInRadians),
      y: this.centerY + radius * Math.sin(angleInRadians)
    };
  }

  onSegmentHover(segment: ChartSegment | null): void {
    this.hoveredSegment = segment;
  }

  onSegmentClick(segment: ChartSegment): void {
    this.selectedSegment = this.selectedSegment === segment ? null : segment;
  }

  onLegendClick(segment: ChartSegment): void {
    this.selectedSegment = this.selectedSegment === segment ? null : segment;
  }

  isSegmentHighlighted(segment: ChartSegment): boolean {
    if (!this.selectedSegment && !this.hoveredSegment) {
      return false;
    }
    return segment === this.selectedSegment || segment === this.hoveredSegment;
  }

  isSegmentDimmed(segment: ChartSegment): boolean {
    if (!this.selectedSegment && !this.hoveredSegment) {
      return false;
    }
    return segment !== this.selectedSegment && segment !== this.hoveredSegment;
  }

  getTooltipPosition(segment: ChartSegment): { x: number; y: number } {
    const midAngle = (segment.startAngle + segment.endAngle) / 2;
    const tooltipRadius = this.radius - this.strokeWidth / 2;
    return this.polarToCartesian(midAngle, tooltipRadius);
  }

  formatValue(value: number): string {
    return value.toLocaleString();
  }

  formatPercentage(percentage: number): string {
    return percentage.toFixed(1) + '%';
  }

  /**
   * Handle retry action
   */
  onRetry(): void {
    this.retry.emit();
  }

  /**
   * Check if chart has data
   */
  hasData(): boolean {
    return this.config && this.config.data && this.config.data.length > 0 && this.total > 0;
  }
}
