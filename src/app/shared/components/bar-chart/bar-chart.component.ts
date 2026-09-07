import { Component, Input } from '@angular/core';

/** یک ستون نمودار */
export interface BarChartDatum {
  label: string;
  value: number;
}

/**
 * نمودار میله‌ای سبک بدون وابستگی خارجی؛ برای روند فروش و گزارش‌ها.
 */
@Component({
  selector: 'app-bar-chart',
  template: `
    <div class="w-full" role="img" [attr.aria-label]="ariaLabel">
      <div class="flex items-end gap-2 h-48">
        <div
          *ngFor="let item of normalized"
          class="flex flex-1 flex-col items-center justify-end h-full min-w-0">
          <span class="mb-1 text-xs font-bold text-secondary">{{ item.value | persianNumber }}</span>
          <div
            class="w-full rounded-t-lg transition-all"
            [style.height.%]="item.percent"
            [style.background-color]="color"
            [title]="item.label + ': ' + (item.value | persianNumber)">
          </div>
        </div>
      </div>
      <div class="flex gap-2 mt-2">
        <span
          *ngFor="let item of normalized"
          class="flex-1 truncate text-center text-xs text-gray-500"
          [title]="item.label">{{ item.label }}</span>
      </div>
    </div>
  `
})
export class BarChartComponent {
  @Input() data: BarChartDatum[] = [];
  @Input() color = '#6C3FC5';
  @Input() ariaLabel = 'نمودار';

  /** داده‌های نرمال‌شده با درصد ارتفاع نسبت به بیشینه */
  get normalized(): Array<BarChartDatum & { percent: number }> {
    const max = Math.max(...this.data.map((item) => item.value), 1);
    return this.data.map((item) => ({
      ...item,
      percent: Math.max(4, (item.value / max) * 100)
    }));
  }
}
