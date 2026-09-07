import { Component, Input, ChangeDetectionStrategy } from '@angular/core';

/**
 * TASK-FE-028: Loading Spinner Component
 * - Multiple sizes (sm, md, lg)
 * - Optional text label
 * - Full-page overlay mode
 */
@Component({
    selector: 'app-loading-spinner',
    template: `
    <!-- Full-page overlay -->
    @if (overlay) {
      <div class="spinner-overlay">
        <div class="spinner-overlay__inner">
          <div class="spinner" [ngClass]="'spinner--' + size"></div>
          @if (text) {
            <p class="spinner-overlay__text">{{ text }}</p>
          }
        </div>
      </div>
    }
    
    <!-- Inline spinner -->
    @if (!overlay) {
      <div class="spinner-inline" [class.is-centered]="center">
        <div class="spinner" [ngClass]="'spinner--' + size"></div>
        @if (text) {
          <p class="spinner-inline__text">{{ text }}</p>
        }
      </div>
    }
    `,
    styles: [`
    :host { display: block; }

    .spinner-overlay {
      position: fixed;
      inset: 0;
      z-index: 50;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(255, 255, 255, 0.8);
      backdrop-filter: blur(4px);
    }

    .spinner-overlay__inner {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.75rem;
    }

    .spinner-overlay__text {
      margin: 0;
      color: #6b7280;
      font-size: 0.875rem;
      animation: spinnerPulse 1.6s ease-in-out infinite;
    }

    .spinner-inline {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .spinner-inline.is-centered {
      justify-content: center;
    }

    .spinner-inline__text {
      margin: 0;
      color: #6b7280;
      font-size: 0.875rem;
    }

    .spinner {
      border-radius: 50%;
      border-style: solid;
      border-color: transparent;
      border-top-color: var(--mat-sys-primary, #6C3FC5);
      border-right-color: var(--mat-sys-primary, #6C3FC5);
      animation: spin 0.8s linear infinite;
    }

    .spinner--sm { width: 20px; height: 20px; border-width: 2px; }
    .spinner--md { width: 36px; height: 36px; border-width: 3px; }
    .spinner--lg { width: 56px; height: 56px; border-width: 4px; }

    @keyframes spin { to { transform: rotate(360deg); } }
    @keyframes spinnerPulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.55; }
    }
  `],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class LoadingSpinnerComponent {
  @Input() size: 'sm' | 'md' | 'lg' = 'md';
  @Input() text = '';
  @Input() overlay = false;
  @Input() center = false;
}
