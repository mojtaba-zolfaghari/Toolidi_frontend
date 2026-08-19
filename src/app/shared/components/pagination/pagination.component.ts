import { Component, EventEmitter, Input, Output } from '@angular/core';

/**
 * کامپوننت صفحه‌بندی؛ با دریافت شماره صفحه و تعداد کل صفحات،
 * رویداد تغییر صفحه را منتشر می‌کند.
 */
@Component({
  selector: 'app-pagination',
  templateUrl: './pagination.component.html'
})
export class PaginationComponent {
  @Input() page = 1;
  @Input() totalPages = 1;
  @Input() pageSize = 20;

  @Output() pageChange = new EventEmitter<number>();

  get hasPrev(): boolean {
    return this.page > 1;
  }

  get hasNext(): boolean {
    return this.page < this.totalPages;
  }

  /** رفتن به صفحه مشخص */
  goTo(page: number): void {
    if (page >= 1 && page <= this.totalPages && page !== this.page) {
      this.pageChange.emit(page);
    }
  }
}
