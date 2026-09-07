import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-empty-state',
  template: `
    <div class="empty-state">
      <div class="empty-state__icon" aria-hidden="true">{{ icon }}</div>
      <h3 class="empty-state__title">{{ title }}</h3>
      <p class="empty-state__message">{{ message }}</p>
      <button *ngIf="actionLabel" type="button" (click)="action.emit()" class="empty-state__action">
        {{ actionLabel }}
      </button>
    </div>
  `,
  styles: [`
    :host { display: block; }

    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 3rem 1.5rem;
      text-align: center;
    }

    .empty-state__icon {
      margin-bottom: 1rem;
      font-size: 3rem;
      line-height: 1;
    }

    .empty-state__title {
      margin: 0 0 0.5rem;
      color: #1B2A4A;
      font-size: 1.125rem;
      font-weight: 700;
    }

    .empty-state__message {
      max-width: 24rem;
      margin: 0 0 1.5rem;
      color: #6b7280;
      font-size: 0.875rem;
    }

    .empty-state__action {
      border: none;
      border-radius: 0.75rem;
      background: var(--mat-sys-primary, #6C3FC5);
      padding: 0.625rem 1.5rem;
      color: #fff;
      font-size: 0.875rem;
      font-weight: 700;
      cursor: pointer;
      transition: background 0.2s ease;
    }

    .empty-state__action:hover {
      background: #5b32a8;
    }
  `]
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
