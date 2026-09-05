import { Component, EventEmitter, Input, Output } from '@angular/core';

// ═══════════════════════════════════════════════════════
// TASK-FE-022: Product Quick View Modal
// ═══════════════════════════════════════════════════════
@Component({
  selector: 'app-product-quick-view',
  template: `
    <div *ngIf="visible" class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" (click)="close.emit()">
      <div class="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" (click)="$event.stopPropagation()">
        <div class="flex items-center justify-between p-5 border-b">
          <h2 class="text-lg font-bold text-secondary">پیش‌نمایش محصول</h2>
          <button (click)="close.emit()" class="text-2xl text-gray-400 hover:text-gray-600">×</button>
        </div>
        <div class="p-5 grid grid-cols-1 md:grid-cols-2 gap-6">
          <div class="rounded-xl bg-gray-100 aspect-square flex items-center justify-center text-6xl">
            {{ product?.imageUrl ? '' : '📷' }}
            <img *ngIf="product?.imageUrl" [src]="product!.imageUrl" class="w-full h-full object-cover rounded-xl" alt="">
          </div>
          <div class="space-y-3">
            <h3 class="text-xl font-bold text-secondary">{{ product?.name }}</h3>
            <p class="text-sm text-gray-500">{{ product?.shortDescription }}</p>
            <div class="flex items-baseline gap-3">
              <span class="text-2xl font-extrabold text-primary">{{ product?.unitPrice | number }} تومان</span>
              <span *ngIf="product?.comparePrice" class="text-sm text-gray-400 line-through">{{ product!.comparePrice | number }}</span>
            </div>
            <div *ngIf="product?.ratingAverage" class="flex items-center gap-1 text-sm">
              <span class="text-yellow-500">⭐</span>
              <span class="font-bold">{{ product!.ratingAverage }}</span>
              <span class="text-gray-400">({{ product!.ratingCount }} نظر)</span>
            </div>
            <button class="w-full rounded-xl bg-primary py-3 font-bold text-white hover:bg-primary/90">افزودن به سبد خرید</button>
          </div>
        </div>
      </div>
    </div>
  `
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
    <div *ngIf="error" class="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4" (click)="dismiss()">
      <div class="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center" (click)="$event.stopPropagation()">
        <div class="text-5xl mb-4">⚠️</div>
        <h2 class="text-xl font-bold text-secondary mb-2">خطایی رخ داد</h2>
        <p class="text-sm text-gray-500 mb-6">{{ error }}</p>
        <button (click)="dismiss()" class="rounded-xl bg-primary px-6 py-2.5 font-bold text-white">بستن</button>
      </div>
    </div>
  `
})
export class GlobalErrorComponent {
  error: string | null = null;
  dismiss() { this.error = null; }
}