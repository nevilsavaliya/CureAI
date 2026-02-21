import { Component, Input } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-icon',
  template: `
    <span 
      class="icon" 
      [class]="'icon-' + size"
      [style.color]="color"
      [innerHTML]="iconSvg">
    </span>
  `,
  styles: [`
    .icon {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      line-height: 1;
    }

    .icon-xs {
      width: 12px;
      height: 12px;
    }

    .icon-sm {
      width: 16px;
      height: 16px;
    }

    .icon-md {
      width: 20px;
      height: 20px;
    }

    .icon-lg {
      width: 24px;
      height: 24px;
    }

    .icon-xl {
      width: 32px;
      height: 32px;
    }

    .icon-2xl {
      width: 48px;
      height: 48px;
    }

    :host ::ng-deep svg {
      width: 100%;
      height: 100%;
      display: block;
    }
  `],
  standalone: true
})
export class IconComponent {
  @Input() name: string = '';
  @Input() size: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' = 'md';
  @Input() color?: string;

  iconSvg: SafeHtml = '';

  private iconCache = new Map<string, string>();

  constructor(
    private http: HttpClient,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit() {
    this.loadIcon();
  }

  ngOnChanges() {
    this.loadIcon();
  }

  private loadIcon() {
    if (!this.name) return;

    // Check cache first
    if (this.iconCache.has(this.name)) {
      this.iconSvg = this.sanitizer.bypassSecurityTrustHtml(
        this.iconCache.get(this.name)!
      );
      return;
    }

    // Load from assets
    const iconPath = `assets/icons/${this.name}.svg`;
    this.http.get(iconPath, { responseType: 'text' }).subscribe({
      next: (svg) => {
        this.iconCache.set(this.name, svg);
        this.iconSvg = this.sanitizer.bypassSecurityTrustHtml(svg);
      },
      error: (err) => {
        console.warn(`Icon "${this.name}" not found at ${iconPath}`);
      }
    });
  }
}
