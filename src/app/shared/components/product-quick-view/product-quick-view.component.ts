import { Component, EventEmitter, Input, Output, ChangeDetectionStrategy } from '@angular/core';

// ═══════════════════════════════════════════════════════
// TASK-FE-022: Product Quick View Modal
// ═══════════════════════════════════════════════════════
@Component({
    selector: 'app-product-quick-view',
    template: `
    @if (visible) {
      <div class="quick-view" (click)="close.emit()">
        <div class="quick-view__card" (click)="$event.stopPropagation()">
          <div class="quick-view__head">
            <h2 class="quick-view__title">پیش‌نمایش محصول</h2>
            <button type="button" (click)="close.emit()" class="quick-view__close" aria-label="بستن">×</button>
          </div>
          <div class="quick-view__body">
            <div class="quick-view__media">
              {{ product?.imageUrl ? '' : '📷' }}
              @if (product?.imageUrl) {
                <img [src]="product!.imageUrl" class="quick-view__img" alt="">
              }
            </div>
            <div class="quick-view__info">
              <h3 class="quick-view__name">{{ product?.name }}</h3>
              <p class="quick-view__desc">{{ product?.shortDescription }}</p>
              <div class="quick-view__prices">
                <span class="quick-view__price">{{ $safeNavigationMigration(product?.unitPrice) | persianNumber }} تومان</span>
                @if (product?.comparePrice) {
                  <span class="quick-view__compare">{{ product!.comparePrice | persianNumber }}</span>
                }
              </div>
              @if (product?.ratingAverage) {
                <div class="quick-view__rating">
                  <span class="quick-view__rating-star" aria-hidden="true">⭐</span>
                  <span class="quick-view__rating-value">{{ product!.ratingAverage }}</span>
                  <span class="quick-view__rating-count">({{ product!.ratingCount }} نظر)</span>
                </div>
              }
              <button type="button" class="quick-view__add-btn">افزودن به سبد خرید</button>
            </div>
          </div>
        </div>
      </div>
    }
    `,
    styles: [`
    :host { display: contents; }

    .quick-view {
      position: fixed;
      inset: 0;
      z-index: 50;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1rem;
      background: rgba(0, 0, 0, 0.5);
    }

    .quick-view__card {
      width: 100%;
      max-width: 42rem;
      max-height: 90vh;
      overflow-y: auto;
      border-radius: 1rem;
      background: #fff;
      box-shadow: 0 25px 50px rgba(0, 0, 0, 0.25);
    }

    .quick-view__head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 1.25rem;
      border-bottom: 1px solid #e5e7eb;
    }

    .quick-view__title {
      margin: 0;
      color: #1B2A4A;
      font-size: 1.125rem;
      font-weight: 700;
    }

    .quick-view__close {
      border: none;
      background: none;
      color: #9ca3af;
      font-size: 1.5rem;
      line-height: 1;
      cursor: pointer;
      transition: color 0.15s ease;
    }

    .quick-view__close:hover {
      color: #4b5563;
    }

    .quick-view__body {
      display: grid;
      grid-template-columns: 1fr;
      gap: 1.5rem;
      padding: 1.25rem;

      @media (min-width: 768px) {
        grid-template-columns: repeat(2, 1fr);
      }
    }

    .quick-view__media {
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
      aspect-ratio: 1 / 1;
      border-radius: 0.75rem;
      background: #f3f4f6;
      font-size: 3.75rem;
      overflow: hidden;
    }

    .quick-view__img {
      position: absolute;
      inset: 0;
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    .quick-view__info {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .quick-view__name {
      margin: 0;
      color: #1B2A4A;
      font-size: 1.25rem;
      font-weight: 700;
    }

    .quick-view__desc {
      margin: 0;
      color: #6b7280;
      font-size: 0.875rem;
    }

    .quick-view__prices {
      display: flex;
      align-items: baseline;
      gap: 0.75rem;
    }

    .quick-view__price {
      color: var(--mat-sys-primary, #6C3FC5);
      font-size: 1.5rem;
      font-weight: 800;
    }

    .quick-view__compare {
      color: #9ca3af;
      text-decoration: line-through;
      font-size: 0.875rem;
    }

    .quick-view__rating {
      display: flex;
      align-items: center;
      gap: 0.25rem;
      font-size: 0.875rem;
    }

    .quick-view__rating-value {
      font-weight: 700;
    }

    .quick-view__rating-count {
      color: #9ca3af;
    }

    .quick-view__add-btn {
      width: 100%;
      border: none;
      border-radius: 0.75rem;
      background: var(--mat-sys-primary, #6C3FC5);
      padding: 0.75rem 0;
      color: #fff;
      font-weight: 700;
      cursor: pointer;
      transition: background 0.2s ease;
    }

    .quick-view__add-btn:hover {
      background: #5b32a8;
    }
  `],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class ProductQuickViewComponent {
  @Input() visible = false;
  @Input() product: any = null;
  @Output() close = new EventEmitter<void>();
}

// ═══════════════════════════════════════════════════════
// TASK-FE-029: Global Error Handler
// ═══════════════════════════════════════════════════════
@Component({
    selector: 'app-global-error',
    template: `
    @if (error) {
      <div class="global-error" (click)="dismiss()">
        <div class="global-error__card" (click)="$event.stopPropagation()">
          <div class="global-error__icon" aria-hidden="true">⚠️</div>
          <h2 class="global-error__title">خطایی رخ داد</h2>
          <p class="global-error__message">{{ error }}</p>
          <button type="button" (click)="dismiss()" class="global-error__btn">بستن</button>
        </div>
      </div>
    }
    `,
    styles: [`
    :host { display: contents; }

    .global-error {
      position: fixed;
      inset: 0;
      z-index: 9999;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1rem;
      background: rgba(0, 0, 0, 0.5);
    }

    .global-error__card {
      width: 100%;
      max-width: 28rem;
      padding: 2rem;
      border-radius: 1rem;
      background: #fff;
      box-shadow: 0 25px 50px rgba(0, 0, 0, 0.25);
      text-align: center;
    }

    .global-error__icon {
      margin-bottom: 1rem;
      font-size: 3rem;
      line-height: 1;
    }

    .global-error__title {
      margin: 0 0 0.5rem;
      color: #1B2A4A;
      font-size: 1.25rem;
      font-weight: 700;
    }

    .global-error__message {
      margin: 0 0 1.5rem;
      color: #6b7280;
      font-size: 0.875rem;
    }

    .global-error__btn {
      border: none;
      border-radius: 0.75rem;
      background: var(--mat-sys-primary, #6C3FC5);
      padding: 0.625rem 1.5rem;
      color: #fff;
      font-weight: 700;
      cursor: pointer;
      transition: background 0.2s ease;
    }

    .global-error__btn:hover {
      background: #5b32a8;
    }
  `],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class GlobalErrorComponent {
  error: string | null = null;
  dismiss() { this.error = null; }
}
