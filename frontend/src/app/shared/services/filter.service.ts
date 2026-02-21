import { Injectable } from '@angular/core';
import { filterBySearch, sortByProperty, paginate } from '../utils';

/**
 * Service for filtering, sorting, and paginating data
 */
@Injectable({
  providedIn: 'root'
})
export class FilterService {
  /**
   * Apply filters, search, sort, and pagination to data
   */
  applyFilters<T>(
    data: T[],
    options: {
      searchTerm?: string;
      searchProperties?: (keyof T)[];
      filterProperty?: keyof T;
      filterValue?: any;
      sortProperty?: keyof T;
      sortOrder?: 'asc' | 'desc';
      page?: number;
      itemsPerPage?: number;
    }
  ): {
    items: T[];
    totalPages: number;
    totalItems: number;
    currentPage: number;
    hasNext: boolean;
    hasPrev: boolean;
  } {
    let filtered = [...data];

    // Apply property filter
    if (options.filterProperty && options.filterValue !== undefined && options.filterValue !== '') {
      filtered = filtered.filter(item => item[options.filterProperty!] === options.filterValue);
    }

    // Apply search
    if (options.searchTerm && options.searchProperties) {
      filtered = filterBySearch(filtered, options.searchTerm, options.searchProperties);
    }

    // Apply sort
    if (options.sortProperty) {
      filtered = sortByProperty(filtered, options.sortProperty, options.sortOrder || 'asc');
    }

    // Apply pagination
    if (options.page && options.itemsPerPage) {
      return paginate(filtered, options.page, options.itemsPerPage);
    }

    // Return all items if no pagination
    return {
      items: filtered,
      totalPages: 1,
      totalItems: filtered.length,
      currentPage: 1,
      hasNext: false,
      hasPrev: false
    };
  }

  /**
   * Filter by date range
   */
  filterByDateRange<T>(
    data: T[],
    dateProperty: keyof T,
    startDate?: Date | string,
    endDate?: Date | string
  ): T[] {
    if (!startDate && !endDate) return data;

    return data.filter(item => {
      const itemDate = new Date(item[dateProperty] as any);
      
      if (startDate && itemDate < new Date(startDate)) return false;
      if (endDate && itemDate > new Date(endDate)) return false;
      
      return true;
    });
  }

  /**
   * Filter by multiple values
   */
  filterByMultipleValues<T>(
    data: T[],
    property: keyof T,
    values: any[]
  ): T[] {
    if (!values || values.length === 0) return data;
    return data.filter(item => values.includes(item[property]));
  }

  /**
   * Filter by status
   */
  filterByStatus<T extends { status: string }>(
    data: T[],
    status: string
  ): T[] {
    if (!status || status === 'all') return data;
    return data.filter(item => item.status === status);
  }
}
