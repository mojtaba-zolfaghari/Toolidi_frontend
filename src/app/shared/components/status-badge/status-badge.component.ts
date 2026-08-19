import { Component, Input } from '@angular/core';

/**
 * نشان وضعیت با رنگ‌بندی مشخص (پیش‌نویس / در انتظار / تأییدشده / منتشرشده / ردشده).
 */
@Component({
  selector: 'app-status-badge',
  template: `
    <span class="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold" [class]="badgeClasses">
      <span class="h-1.5 w-1.5 rounded-full" [class]="dotClasses"></span>
      {{ displayLabel }}
    </span>
  `
})
export class StatusBadgeComponent {
  @Input() status = '';
  @Input() label?: string;

  /** برچسب فارسی وضعیت */
  get displayLabel(): string {
    if (this.label) {
      return this.label;
    }
    switch (this.status?.toLowerCase()) {
      case 'draft':
        return 'پیش‌نویس';
      case 'pendingapproval':
      case 'pending':
        return 'در انتظار تأیید';
      case 'approved':
        return 'تأییدشده';
      case 'published':
        return 'منتشرشده';
      case 'rejected':
        return 'ردشده';
      default:
        return this.status || 'نامشخص';
    }
  }

  /** کلاس‌های رنگ نشان */
  get badgeClasses(): string {
    switch (this.status?.toLowerCase()) {
      case 'draft':
        return 'bg-gray-100 text-gray-600';
      case 'pendingapproval':
      case 'pending':
        return 'bg-amber-50 text-amber-700';
      case 'approved':
        return 'bg-blue-50 text-blue-700';
      case 'published':
        return 'bg-green-50 text-green-700';
      case 'rejected':
        return 'bg-red-50 text-red-700';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  }

  /** کلاس رنگ نقطه */
  get dotClasses(): string {
    switch (this.status?.toLowerCase()) {
      case 'draft':
        return 'bg-gray-400';
      case 'pendingapproval':
      case 'pending':
        return 'bg-amber-500';
      case 'approved':
        return 'bg-blue-500';
      case 'published':
        return 'bg-green-500';
      case 'rejected':
        return 'bg-red-500';
      default:
        return 'bg-gray-400';
    }
  }
}
