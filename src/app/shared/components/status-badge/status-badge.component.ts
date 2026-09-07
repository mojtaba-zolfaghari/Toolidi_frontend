import { Component, Input, ChangeDetectionStrategy } from '@angular/core';

/**
 * Status badge with color coding for admin redesign.
 * Material token-based pill (TASK-FE-ADMIN-REDESIGN-001-MAT/002-MAT).
 * Supports: pending, processing, shipped, delivered, cancelled, active, inactive,
 *           draft, approved, published, rejected, paid, unpaid, refunded, confirmed
 */
@Component({
    selector: 'app-status-badge',
    template: `
    <span class="status-badge" [ngClass]="'status-badge--' + (token || 'neutral')">
      <span class="status-badge__dot"></span>
      {{ displayLabel }}
    </span>
  `,
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class StatusBadgeComponent {
  @Input() status = '';
  @Input() label?: string;

  get displayLabel(): string {
    if (this.label) return this.label;
    const map: Record<string, string> = {
      draft: 'پیش‌نویس',
      pendingapproval: 'در انتظار تأیید',
      pending: 'در انتظار',
      processing: 'در حال پردازش',
      confirmed: 'تأیید شده',
      approved: 'تأییدشده',
      shipped: 'ارسال شده',
      delivered: 'تحویل شده',
      cancelled: 'لغو شده',
      rejected: 'ردشده',
      active: 'فعال',
      inactive: 'غیرفعال',
      published: 'منتشرشده',
      paid: 'پرداخت شده',
      unpaid: 'پرداخت نشده',
      refunded: 'بازپرداخت شده',
      completed: 'تکمیل‌شده',
      failed: 'ناموفق',
      intransit: 'در مسیر',
    };
    return map[this.status?.toLowerCase()] || this.status || 'نامشخص';
  }

  /** Canonical color token derived from status. */
  get token(): string {
    const map: Record<string, string> = {
      draft: 'neutral',
      pendingapproval: 'warning',
      pending: 'warning',
      processing: 'info',
      confirmed: 'info',
      approved: 'info',
      shipped: 'info',
      delivered: 'success',
      cancelled: 'danger',
      rejected: 'danger',
      active: 'success',
      inactive: 'neutral',
      published: 'success',
      paid: 'success',
      unpaid: 'warning',
      refunded: 'warning',
      completed: 'success',
      failed: 'danger',
      intransit: 'success',
    };
    return map[this.status?.toLowerCase()] || 'neutral';
  }
}
