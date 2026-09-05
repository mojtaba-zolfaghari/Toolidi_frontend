import { Component, Input } from '@angular/core';

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
    <div *ngIf="overlay" class="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm">
      <div class="flex flex-col items-center gap-3">
        <div class="spinner" [class]="'spinner-' + size"></div>
        <p *ngIf="text" class="text-sm text-gray-500 animate-pulse">{{ text }}</p>
      </div>
    </div>

    <!-- Inline spinner -->
    <div *ngIf="!overlay" class="flex items-center gap-2" [class.justify-center]="center">
      <div class="spinner" [class]="'spinner-' + size"></div>
      <p *ngIf="text" class="text-sm text-gray-500">{{ text }}</p>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .spinner {
      border-radius: 50%;
      border-style: solid;
      border-color: transparent;
      border-top-color: #2563eb;
      border-right-color: #2563eb;
      animation: spin 0.8s linear infinite;
    }
    .spinner-sm { width: 20px; height: 20px; border-width: 2px; }
    .spinner-md { width: 36px; height: 36px; border-width: 3px; }
    .spinner-lg { width: 56px; height: 56px; border-width: 4px; }
    @keyframes spin { to { transform: rotate(360deg); } }
  `]
})
export class LoadingSpinnerComponent {
  @Input() size: 'sm' | 'md' | 'lg' = 'md';
  @Input() text = '';
  @Input() overlay = false;
  @Input() center = false;
}
