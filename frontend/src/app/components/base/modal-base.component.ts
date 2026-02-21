import { Component, EventEmitter, Output } from '@angular/core';
import { BaseComponent } from './base.component';

/**
 * Base component for modal dialogs
 */
@Component({
  template: ''
})
export class ModalBaseComponent extends BaseComponent {
  @Output() close = new EventEmitter<void>();
  @Output() confirm = new EventEmitter<any>();

  isVisible: boolean = false;
  isSubmitting: boolean = false;

  /**
   * Open modal
   */
  open(): void {
    this.isVisible = true;
    this.clearError();
    this.onOpen();
  }

  /**
   * Close modal
   */
  closeModal(): void {
    if (this.isSubmitting) return;
    
    this.isVisible = false;
    this.clearError();
    this.onClose();
    this.close.emit();
  }

  /**
   * Handle confirm action
   */
  async onConfirm(data?: any): Promise<void> {
    this.isSubmitting = true;
    this.clearError();
    
    try {
      await this.handleConfirm(data);
      this.confirm.emit(data);
      this.closeModal();
    } catch (error) {
      this.handleError(error, 'Modal confirmation');
    } finally {
      this.isSubmitting = false;
    }
  }

  /**
   * Override this method to handle confirmation logic
   */
  protected async handleConfirm(data?: any): Promise<void> {
    // Override in child components
  }

  /**
   * Override this method to handle modal open
   */
  protected onOpen(): void {
    // Override in child components
  }

  /**
   * Override this method to handle modal close
   */
  protected onClose(): void {
    // Override in child components
  }

  /**
   * Handle backdrop click
   */
  onBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('modal-backdrop')) {
      this.closeModal();
    }
  }

  /**
   * Handle escape key
   */
  onEscapeKey(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      this.closeModal();
    }
  }
}
