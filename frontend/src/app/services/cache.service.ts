import { Injectable } from '@angular/core';
import { HttpResponse } from '@angular/common/http';

interface CacheEntry {
  response: HttpResponse<any>;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

@Injectable({
  providedIn: 'root'
})
export class CacheService {
  private cache = new Map<string, CacheEntry>();
  private readonly DEFAULT_TTL = 5 * 60 * 1000; // 5 minutes default

  constructor() {
    // Listen for logout events to clear cache
    window.addEventListener('auth:logout', () => {
      this.clearAll();
    });
  }

  /**
   * Get cached response for a URL
   * @param url The request URL
   * @returns Cached response or null if not found or expired
   */
  get(url: string): HttpResponse<any> | null {
    const entry = this.cache.get(url);
    
    if (!entry) {
      return null;
    }

    // Check if cache entry has expired
    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(url);
      return null;
    }

    return entry.response;
  }

  /**
   * Store a response in cache
   * @param url The request URL
   * @param response The HTTP response to cache
   * @param ttl Time to live in milliseconds (optional)
   */
  set(url: string, response: HttpResponse<any>, ttl?: number): void {
    const entry: CacheEntry = {
      response,
      timestamp: Date.now(),
      ttl: ttl || this.DEFAULT_TTL
    };
    
    this.cache.set(url, entry);
  }

  /**
   * Invalidate cache for a specific URL
   * @param url The request URL to invalidate
   */
  invalidate(url: string): void {
    this.cache.delete(url);
  }

  /**
   * Invalidate cache entries matching a pattern
   * @param pattern RegExp pattern to match URLs
   */
  invalidatePattern(pattern: RegExp): void {
    const keysToDelete: string[] = [];
    
    this.cache.forEach((_, key) => {
      if (pattern.test(key)) {
        keysToDelete.push(key);
      }
    });
    
    keysToDelete.forEach(key => this.cache.delete(key));
  }

  /**
   * Clear all cached entries
   */
  clearAll(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getStats(): { size: number; entries: string[] } {
    return {
      size: this.cache.size,
      entries: Array.from(this.cache.keys())
    };
  }

  /**
   * Check if a URL is cacheable
   * @param url The request URL
   * @returns true if the URL should be cached
   */
  isCacheable(url: string): boolean {
    // Don't cache authentication endpoints
    if (url.includes('/auth/')) {
      return false;
    }

    // Don't cache real-time endpoints
    if (url.includes('/messages') || url.includes('/notifications')) {
      return false;
    }

    // Don't cache mutation endpoints (handled by method check in interceptor)
    return true;
  }
}
