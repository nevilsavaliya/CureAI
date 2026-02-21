import { Component } from '@angular/core';
import { BaseComponent } from './base.component';
import { ErrorHandlerService } from '../../services/error-handler.service';
import { ToastService } from '../../services/toast.service';
import { FilterService } from '../../shared/services/filter.service';

/**
 * Base component for paginated lists with filtering and sorting
 */
@Component({
  template: ''
})
export class PaginatedBaseComponent<T> extends BaseComponent {
  // Data
  allItems: T[] = [];
  filteredItems: T[] = [];
  displayedItems: T[] = [];

  // Pagination
  currentPage: number = 1;
  itemsPerPage: number = 10;
  totalPages: number = 1;
  totalItems: number = 0;

  // Filtering
  searchTerm: string = '';
  selectedFilter: string = 'all';

  // Sorting
  sortBy: string = '';
  sortOrder: 'asc' | 'desc' = 'asc';

  constructor(
    protected override errorHandler: ErrorHandlerService,
    protected override toastService: ToastService,
    protected filterService: FilterService
  ) {
    super(errorHandler, toastService);
  }

  /**
   * Apply filters, sort, and pagination
   */
  protected applyFiltersAndPagination(
    searchProperties?: (keyof T)[],
    filterProperty?: keyof T
  ): void {
    const result = this.filterService.applyFilters(this.allItems, {
      searchTerm: this.searchTerm,
      searchProperties,
      filterProperty,
      filterValue: this.selectedFilter !== 'all' ? this.selectedFilter : undefined,
      sortProperty: this.sortBy as keyof T,
      sortOrder: this.sortOrder,
      page: this.currentPage,
      itemsPerPage: this.itemsPerPage
    });

    this.displayedItems = result.items;
    this.totalPages = result.totalPages;
    this.totalItems = result.totalItems;
    this.currentPage = result.currentPage;
  }

  /**
   * Handle search input
   */
  onSearch(searchTerm: string): void {
    this.searchTerm = searchTerm;
    this.currentPage = 1;
    this.applyFiltersAndPagination();
  }

  /**
   * Handle filter change
   */
  onFilterChange(filter: string): void {
    this.selectedFilter = filter;
    this.currentPage = 1;
    this.applyFiltersAndPagination();
  }

  /**
   * Handle sort change
   */
  onSortChange(sortBy: string, sortOrder?: 'asc' | 'desc'): void {
    this.sortBy = sortBy;
    if (sortOrder) {
      this.sortOrder = sortOrder;
    } else {
      // Toggle sort order if same column
      this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
    }
    this.applyFiltersAndPagination();
  }

  /**
   * Go to specific page
   */
  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages) return;
    this.currentPage = page;
    this.applyFiltersAndPagination();
  }

  /**
   * Go to next page
   */
  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.applyFiltersAndPagination();
    }
  }

  /**
   * Go to previous page
   */
  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.applyFiltersAndPagination();
    }
  }

  /**
   * Change items per page
   */
  changeItemsPerPage(itemsPerPage: number): void {
    this.itemsPerPage = itemsPerPage;
    this.currentPage = 1;
    this.applyFiltersAndPagination();
  }

  /**
   * Get page numbers for pagination
   */
  getPageNumbers(): number[] {
    const pages: number[] = [];
    const maxVisible = 5;
    
    if (this.totalPages <= maxVisible) {
      for (let i = 1; i <= this.totalPages; i++) {
        pages.push(i);
      }
    } else {
      const start = Math.max(1, this.currentPage - 2);
      const end = Math.min(this.totalPages, start + maxVisible - 1);
      
      for (let i = start; i <= end; i++) {
        pages.push(i);
      }
    }
    
    return pages;
  }

  /**
   * Check if has next page
   */
  hasNextPage(): boolean {
    return this.currentPage < this.totalPages;
  }

  /**
   * Check if has previous page
   */
  hasPreviousPage(): boolean {
    return this.currentPage > 1;
  }

  /**
   * Get pagination info text
   */
  getPaginationInfo(): string {
    const start = (this.currentPage - 1) * this.itemsPerPage + 1;
    const end = Math.min(this.currentPage * this.itemsPerPage, this.totalItems);
    return `Showing ${start}-${end} of ${this.totalItems}`;
  }

  /**
   * Reset pagination
   */
  resetPagination(): void {
    this.currentPage = 1;
    this.searchTerm = '';
    this.selectedFilter = 'all';
    this.sortBy = '';
    this.sortOrder = 'asc';
  }
}
