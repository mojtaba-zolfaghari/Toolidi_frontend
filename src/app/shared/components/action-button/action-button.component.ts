import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';

/**
 * Action button wrapping Material MatButton (TASK-FE-ADMIN-REDESIGN-002-MAT).
 * Variants: primary, secondary, danger, warning, success, ghost.
 */
@Component({
    selector: 'app-action-button',
    templateUrl: './action-button.component.html',
    styleUrls: ['./action-button.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class ActionButtonComponent {
  @Input() label = '';
  @Input() icon = '';
  @Input() color: 'primary' | 'secondary' | 'danger' | 'warning' | 'success' | 'ghost' = 'primary';
  @Input() size: 'sm' | 'md' | 'lg' = 'md';
  @Input() disabled = false;
  @Input() loading = false;
  @Input() iconOnly = false;
  @Input() fullWidth = false;

  @Output() clicked = new EventEmitter<void>();

  get classes(): string {
    const sizeMap: Record<string, string> = {
      sm: 'action-button--sm',
      md: 'action-button--md',
      lg: 'action-button--lg'
    };
    const variantMap: Record<string, string> = {
      primary: 'action-button--primary',
      secondary: 'action-button--secondary',
      danger: 'action-button--danger',
      warning: 'action-button--warning',
      success: 'action-button--success',
      ghost: 'action-button--ghost'
    };
    return [
      'action-button',
      sizeMap[this.size] || sizeMap['md'],
      variantMap[this.color] || variantMap['primary'],
      this.fullWidth ? 'action-button--full' : ''
    ].join(' ');
  }

  onClick(): void {
    if (!this.disabled && !this.loading) {
      this.clicked.emit();
    }
  }
}
