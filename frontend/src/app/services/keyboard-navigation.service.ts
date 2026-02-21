import { Injectable, Renderer2, RendererFactory2 } from '@angular/core';
import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})
export class KeyboardNavigationService {
  private renderer: Renderer2;
  private shortcuts: Map<string, () => void> = new Map();

  constructor(
    private rendererFactory: RendererFactory2,
    private router: Router
  ) {
    this.renderer = this.rendererFactory.createRenderer(null, null);
    this.initializeKeyboardNavigation();
    this.registerDefaultShortcuts();
  }

  /**
   * Initialize keyboard navigation detection
   * Adds classes to body to differentiate keyboard vs mouse navigation
   */
  private initializeKeyboardNavigation(): void {
    // Detect keyboard navigation
    this.renderer.listen('document', 'keydown', (event: KeyboardEvent) => {
      if (event.key === 'Tab') {
        this.renderer.addClass(document.body, 'keyboard-nav-active');
        this.renderer.removeClass(document.body, 'mouse-nav-active');
      }
    });

    // Detect mouse navigation
    this.renderer.listen('document', 'mousedown', () => {
      this.renderer.addClass(document.body, 'mouse-nav-active');
      this.renderer.removeClass(document.body, 'keyboard-nav-active');
    });

    // Listen for keyboard shortcuts
    this.renderer.listen('document', 'keydown', (event: KeyboardEvent) => {
      this.handleKeyboardShortcut(event);
    });
  }

  /**
   * Register default keyboard shortcuts
   */
  private registerDefaultShortcuts(): void {
    // Escape key - close modals, cancel actions
    this.registerShortcut('Escape', () => {
      // Emit event that components can listen to
      window.dispatchEvent(new CustomEvent('keyboard-escape'));
    });

    // Ctrl/Cmd + K - Focus search (if available)
    this.registerShortcut('k', () => {
      const searchInput = document.querySelector('input[type="search"]') as HTMLInputElement;
      if (searchInput) {
        searchInput.focus();
      }
    }, true);

    // Ctrl/Cmd + / - Show keyboard shortcuts help
    this.registerShortcut('/', () => {
      window.dispatchEvent(new CustomEvent('keyboard-help'));
    }, true);
  }

  /**
   * Register a keyboard shortcut
   * @param key - The key to listen for
   * @param callback - Function to execute when shortcut is triggered
   * @param ctrlOrCmd - Whether Ctrl (Windows/Linux) or Cmd (Mac) must be pressed
   */
  registerShortcut(key: string, callback: () => void, ctrlOrCmd: boolean = false): void {
    const shortcutKey = ctrlOrCmd ? `ctrl+${key}` : key;
    this.shortcuts.set(shortcutKey, callback);
  }

  /**
   * Unregister a keyboard shortcut
   * @param key - The key to unregister
   * @param ctrlOrCmd - Whether the shortcut uses Ctrl/Cmd
   */
  unregisterShortcut(key: string, ctrlOrCmd: boolean = false): void {
    const shortcutKey = ctrlOrCmd ? `ctrl+${key}` : key;
    this.shortcuts.delete(shortcutKey);
  }

  /**
   * Handle keyboard shortcut execution
   * @param event - Keyboard event
   */
  private handleKeyboardShortcut(event: KeyboardEvent): void {
    const key = event.key.toLowerCase();
    const ctrlOrCmd = event.ctrlKey || event.metaKey;

    // Check for Ctrl/Cmd shortcuts
    if (ctrlOrCmd) {
      const shortcutKey = `ctrl+${key}`;
      const callback = this.shortcuts.get(shortcutKey);
      if (callback) {
        event.preventDefault();
        callback();
      }
    } else {
      // Check for simple key shortcuts
      const callback = this.shortcuts.get(key);
      if (callback) {
        // Only trigger if not in an input field
        const target = event.target as HTMLElement;
        if (!['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) {
          event.preventDefault();
          callback();
        }
      }
    }
  }

  /**
   * Focus the first focusable element in a container
   * @param container - The container element
   */
  focusFirstElement(container: HTMLElement): void {
    const focusableElements = this.getFocusableElements(container);
    if (focusableElements.length > 0) {
      (focusableElements[0] as HTMLElement).focus();
    }
  }

  /**
   * Focus the last focusable element in a container
   * @param container - The container element
   */
  focusLastElement(container: HTMLElement): void {
    const focusableElements = this.getFocusableElements(container);
    if (focusableElements.length > 0) {
      (focusableElements[focusableElements.length - 1] as HTMLElement).focus();
    }
  }

  /**
   * Get all focusable elements in a container
   * @param container - The container element
   * @returns Array of focusable elements
   */
  getFocusableElements(container: HTMLElement): Element[] {
    const focusableSelectors = [
      'a[href]',
      'button:not([disabled])',
      'input:not([disabled])',
      'select:not([disabled])',
      'textarea:not([disabled])',
      '[tabindex]:not([tabindex="-1"])',
      '[role="button"]:not([aria-disabled="true"])',
      '[role="link"]:not([aria-disabled="true"])'
    ].join(', ');

    return Array.from(container.querySelectorAll(focusableSelectors));
  }

  /**
   * Trap focus within a container (useful for modals)
   * @param container - The container element
   * @returns Function to remove the focus trap
   */
  trapFocus(container: HTMLElement): () => void {
    const focusableElements = this.getFocusableElements(container);
    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Tab') return;

      if (event.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstElement) {
          event.preventDefault();
          lastElement.focus();
        }
      } else {
        // Tab
        if (document.activeElement === lastElement) {
          event.preventDefault();
          firstElement.focus();
        }
      }
    };

    container.addEventListener('keydown', handleKeyDown);

    // Focus first element
    if (firstElement) {
      firstElement.focus();
    }

    // Return cleanup function
    return () => {
      container.removeEventListener('keydown', handleKeyDown);
    };
  }

  /**
   * Announce message to screen readers
   * @param message - Message to announce
   * @param priority - Priority level (polite or assertive)
   */
  announce(message: string, priority: 'polite' | 'assertive' = 'polite'): void {
    const announcer = document.createElement('div');
    announcer.setAttribute('role', 'status');
    announcer.setAttribute('aria-live', priority);
    announcer.setAttribute('aria-atomic', 'true');
    announcer.className = 'sr-only';
    announcer.textContent = message;

    document.body.appendChild(announcer);

    // Remove after announcement
    setTimeout(() => {
      document.body.removeChild(announcer);
    }, 1000);
  }
}
