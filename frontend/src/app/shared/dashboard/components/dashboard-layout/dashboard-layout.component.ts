import { Component, Input, OnInit } from '@angular/core';

/**
 * Dashboard Layout Component
 * 
 * Provides a responsive CSS Grid-based layout system for dashboard components.
 * Supports configurable columns, gap sizes, and responsive breakpoints.
 * 
 * @example
 * <app-dashboard-layout [columns]="3" [gap]="'medium'" [responsive]="true">
 *   <div class="span-2">Content spanning 2 columns</div>
 *   <div>Regular content</div>
 * </app-dashboard-layout>
 */
@Component({
  selector: 'app-dashboard-layout',
  templateUrl: './dashboard-layout.component.html',
  styleUrls: ['./dashboard-layout.component.css']
})
export class DashboardLayoutComponent implements OnInit {
  /**
   * Number of columns in the grid layout (1, 2, 3, or 4)
   * @default 3
   */
  @Input() columns: number = 3;

  /**
   * Gap size between grid items
   * @default 'medium'
   */
  @Input() gap: 'small' | 'medium' | 'large' = 'medium';

  /**
   * Enable responsive behavior (adapts to screen size)
   * @default true
   */
  @Input() responsive: boolean = true;

  /**
   * CSS classes to apply to the layout container
   */
  layoutClasses: string = '';

  ngOnInit(): void {
    this.updateLayoutClasses();
  }

  ngOnChanges(): void {
    this.updateLayoutClasses();
  }

  /**
   * Updates the CSS classes based on input properties
   */
  private updateLayoutClasses(): void {
    const classes: string[] = ['dashboard-layout'];

    // Add column class
    classes.push(`columns-${this.columns}`);

    // Add gap class
    classes.push(`gap-${this.gap}`);

    // Add responsive class
    if (this.responsive) {
      classes.push('responsive');
    }

    this.layoutClasses = classes.join(' ');
  }
}
