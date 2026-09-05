import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-empty-state',
  template: `
    <div class="flex flex-col items-center justify-center py-12 px-6 text-center">
      <div class="mb-4 text-5xl">{{ icon }}</div>
      <h3 class="text-lg font-bold text-secondary mb-2">{{ title }}</h3>
      <p class="text-sm text-gray-500 max-w-sm mb-6">{{ message }}</p>
      <button *ngIf="actionLabel" (click)="action.emit()"
              class="rounded-xl bg-primary px-6 py-2.5 text-sm font-bold text-white hover:bg-primary/90 transition-colors">
        {{ actionLabel }}
      </button>
    </div>
  `
})
export class EmptyStateComponent {
  @Input() icon = '📭';
  @Input() title = 'موردی یافت نشد';
  @Input() message = '';
  @Input() actionLabel = '';
  @Output() action = new EventEmitter<void>();
}

@Component({
  selector: 'app-empty-cart',
  template: `
    <app-empty-state
      icon="🛒"
      title="سبد خرید خالی است"
      message="محصولات مورد علاقه‌تان را به سبد اضافه کنید."
      actionLabel="مشاهده محصولات"
      (action)="onNavigate.emit()">
    </app-empty-state>
  `
})
export class EmptyCartComponent {
  @Output() onNavigate = new EventEmitter<void>();
}

@Component({
  selector: 'app-empty-orders',
  template: `
    <app-empty-state
      icon="📦"
      title="هنوز سفارشی ثبت نکرده‌اید"
      message="اولین سفارش خود را ثبت کنید و از تخفیف ویژه بهره‌مند شوید."
      actionLabel="مشاهده محصولات"
      (action)="onNavigate.emit()">
    </app-empty-state>
  `
})
export class EmptyOrdersComponent {
  @Output() onNavigate = new EventEmitter<void>();
}

@Component({
  selector: 'app-empty-search',
  template: `
    <app-empty-state
      icon="🔍"
      [title]="'نتیجه‌ای برای «' + query + '» یافت نشد'"
      message="کلمات کلیدی دیگری را امتحان کنید یا دسته‌بندی‌ها را مرور کنید."
      actionLabel="پاک کردن جستجو"
      (action)="onClear.emit()">
    </app-empty-state>
  `
})
export class EmptySearchComponent {
  @Input() query = '';
  @Output() onClear = new EventEmitter<void>();
}
