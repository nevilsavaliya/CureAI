import { Component, Input, Output, EventEmitter } from '@angular/core';

export interface FilterTab {
  id: string;
  label: string;
  icon: string;
  count: number;
}

@Component({
  selector: 'app-filter-tabs',
  templateUrl: './filter-tabs.component.html',
  styleUrls: ['./filter-tabs.component.css']
})
export class FilterTabsComponent {
  @Input() tabs: FilterTab[] = [];
  @Input() activeFilter: string = 'all';
  @Output() filterChange = new EventEmitter<string>();

  onFilterChange(filterId: string): void {
    this.filterChange.emit(filterId);
  }

  getIconPath(icon: string): string {
    const icons: { [key: string]: string } = {
      'pending': 'M12 6v6l4 2',
      'ongoing': 'M22 4l-10 10.01L9 11.01',
      'treated': 'M22 4l-10 10.01L9 11.01',
      'all': 'M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01'
    };
    return icons[icon] || icons['all'];
  }
}
