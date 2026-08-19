import { Component, EventEmitter, Input, Output } from '@angular/core';

/**
 * کامپوننت صفحه‌بندی؛ ناوبری کامل با «اولین/قبلی/شماره صفحات/بعدی/آخرین».
 */
@Component({
  selector: 'app-pagination',
  templateUrl: './pagination.component.html'
})
export class PaginationComponent {
  @Input() page = 1;
  @Input() totalPages = 1;

  @Output() pageChange = new EventEmitter<number>();

  get hasPrev(): boolean {
    return this.page > 1;
  }

  get hasNext(): boolean {
    return this.page < this.totalPages;
  }

  /** پنجره‌ی شماره صفحات قابل نمایش (حداکثر ۵ عدد با بیضی) */
  get pages(): Array<number | '…'> {
    const total = this.totalPages;
    if (total <= 7) {
      return Array.from({ length: total }, (_, index) => index + 1);
    }

    const current = this.page;
    const windowStart = Math.max(2, current - 1);
    const windowEnd = Math.min(total - 1, current + 1);
    const result: Array<number | '…'> = [1];

    if (windowStart > 2) {
      result.push('…');
    }

    for (let index = windowStart; index <= windowEnd; index += 1) {
      result.push(index);
    }

    if (windowEnd < total - 1) {
      result.push('…');
    }

    result.push(total);
    return result;
  }

  /** رفتن به صفحه مشخص */
  goTo(page: number): void {
    if (page >= 1 && page <= this.totalPages && page !== this.page) {
      this.pageChange.emit(page);
    }
  }

  /** پرش به اولین صفحه */
  first(): void {
    this.goTo(1);
  }

  /** پرش به آخرین صفحه */
  last(): void {
    this.goTo(this.totalPages);
  }
}
