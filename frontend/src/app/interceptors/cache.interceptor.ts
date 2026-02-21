import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor,
  HttpResponse
} from '@angular/common/http';
import { Observable, of, tap } from 'rxjs';
import { CacheService } from '../services/cache.service';

@Injectable()
export class CacheInterceptor implements HttpInterceptor {
  constructor(private cacheService: CacheService) {}

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    // Only cache GET requests
    if (request.method !== 'GET') {
      // For mutation requests (POST, PUT, DELETE), invalidate related cache
      return next.handle(request).pipe(
        tap((event) => {
          if (event instanceof HttpResponse && event.status >= 200 && event.status < 300) {
            this.invalidateRelatedCache(request.url);
          }
        })
      );
    }

    // Check if URL is cacheable
    if (!this.cacheService.isCacheable(request.url)) {
      return next.handle(request);
    }

    // Try to get cached response
    const cachedResponse = this.cacheService.get(request.url);
    if (cachedResponse) {
      console.log('📦 Cache HIT:', request.url);
      return of(cachedResponse.clone());
    }

    console.log('🔍 Cache MISS:', request.url);

    // If not cached, make the request and cache the response
    return next.handle(request).pipe(
      tap((event) => {
        if (event instanceof HttpResponse) {
          // Determine TTL based on endpoint
          const ttl = this.getTTL(request.url);
          this.cacheService.set(request.url, event.clone(), ttl);
        }
      })
    );
  }

  /**
   * Invalidate cache entries related to a mutation
   * @param url The URL of the mutation request
   */
  private invalidateRelatedCache(url: string): void {
    // Invalidate cases cache when case-related mutations occur
    if (url.includes('/cases')) {
      this.cacheService.invalidatePattern(/\/cases/);
      console.log('🗑️ Invalidated cases cache');
    }

    // Invalidate users cache when user-related mutations occur
    if (url.includes('/users') || url.includes('/admin/users')) {
      this.cacheService.invalidatePattern(/\/users/);
      console.log('🗑️ Invalidated users cache');
    }

    // Invalidate hospitals cache when hospital-related mutations occur
    if (url.includes('/hospitals')) {
      this.cacheService.invalidatePattern(/\/hospitals/);
      console.log('🗑️ Invalidated hospitals cache');
    }

    // Invalidate doctors cache when doctor-related mutations occur
    if (url.includes('/doctors')) {
      this.cacheService.invalidatePattern(/\/doctors/);
      console.log('🗑️ Invalidated doctors cache');
    }

    // Invalidate audit logs cache when new logs are created
    if (url.includes('/audit-logs')) {
      this.cacheService.invalidatePattern(/\/audit-logs/);
      console.log('🗑️ Invalidated audit logs cache');
    }
  }

  /**
   * Get TTL (Time To Live) for different endpoints
   * @param url The request URL
   * @returns TTL in milliseconds
   */
  private getTTL(url: string): number {
    // Short TTL for frequently changing data (1 minute)
    if (url.includes('/cases') || url.includes('/notifications')) {
      return 1 * 60 * 1000;
    }

    // Medium TTL for moderately changing data (5 minutes)
    if (url.includes('/users') || url.includes('/doctors')) {
      return 5 * 60 * 1000;
    }

    // Long TTL for rarely changing data (15 minutes)
    if (url.includes('/hospitals') || url.includes('/audit-logs')) {
      return 15 * 60 * 1000;
    }

    // Default TTL (5 minutes)
    return 5 * 60 * 1000;
  }
}
