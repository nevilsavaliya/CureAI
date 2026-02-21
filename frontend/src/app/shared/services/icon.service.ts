import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError, shareReplay } from 'rxjs/operators';

export type IconName = 
  | 'user' | 'lock' | 'email' | 'hospital' | 'doctor' | 'patient'
  | 'phone' | 'search' | 'calendar' | 'download' | 'filter' | 'info'
  | 'chevron-right' | 'chevron-left' | 'chevron-up' | 'chevron-down'
  | 'menu' | 'loader' | 'minus' | 'plus' | 'bell' | 'clipboard'
  | 'eye' | 'eye-off' | 'message-circle' | 'trash' | 'alert-circle'
  | 'alert-triangle' | 'settings' | 'edit' | 'clock' | 'refresh'
  | 'activity' | 'logout' | 'check' | 'heart' | 'star' | 'file-text'
  | 'close' | 'upload';

@Injectable({
  providedIn: 'root'
})
export class IconService {
  private iconCache = new Map<string, Observable<string>>();

  constructor(private http: HttpClient) {}

  /**
   * Get an icon SVG string by name
   * @param name - The icon name (without .svg extension)
   * @returns Observable of SVG string
   */
  getIcon(name: IconName | string): Observable<string> {
    if (this.iconCache.has(name)) {
      return this.iconCache.get(name)!;
    }

    const iconPath = `assets/icons/${name}.svg`;
    const icon$ = this.http.get(iconPath, { responseType: 'text' }).pipe(
      catchError((error) => {
        console.warn(`Icon "${name}" not found at ${iconPath}`);
        return of('');
      }),
      shareReplay(1)
    );

    this.iconCache.set(name, icon$);
    return icon$;
  }

  /**
   * Preload multiple icons into cache
   * @param names - Array of icon names to preload
   */
  preloadIcons(names: (IconName | string)[]): void {
    names.forEach(name => this.getIcon(name).subscribe());
  }

  /**
   * Get all available icon names
   */
  getAvailableIcons(): IconName[] {
    return [
      'user', 'lock', 'email', 'hospital', 'doctor', 'patient',
      'phone', 'search', 'calendar', 'download', 'filter', 'info',
      'chevron-right', 'chevron-left', 'chevron-up', 'chevron-down',
      'menu', 'loader', 'minus', 'plus', 'bell', 'clipboard',
      'eye', 'eye-off', 'message-circle', 'trash', 'alert-circle',
      'alert-triangle', 'settings', 'edit', 'clock', 'refresh',
      'activity', 'logout', 'check', 'heart', 'star', 'file-text',
      'close', 'upload'
    ];
  }

  /**
   * Clear the icon cache
   */
  clearCache(): void {
    this.iconCache.clear();
  }
}
