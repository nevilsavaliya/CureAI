import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-skeleton-loader',
  templateUrl: './skeleton-loader.component.html',
  styleUrls: ['./skeleton-loader.component.css']
})
export class SkeletonLoaderComponent {
  @Input() type: 'list' | 'card' | 'text' | 'circle' | 'table' = 'list';
  @Input() count: number = 3;
  @Input() height: string = '60px';
  @Input() width: string = '100%';

  get items(): number[] {
    return Array(this.count).fill(0).map((_, i) => i);
  }
}
