import { Component } from '@angular/core';

/**
 * اسپینر بارگذاری با انیمیشن نبض (pulse).
 * برای نمایش حالت‌های در حال بارگذاری در سراسر برنامه استفاده می‌شود.
 */
@Component({
  selector: 'app-spinner',
  template: `
    <div class="flex flex-col items-center justify-center gap-3 py-10" role="status" aria-live="polite">
      <span class="relative flex h-12 w-12">
        <span class="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-25"></span>
        <span class="relative inline-flex h-12 w-12 animate-pulse rounded-full bg-primary/20"></span>
        <span class="absolute inset-0 m-auto h-5 w-5 rounded-full bg-primary"></span>
      </span>
      <span class="text-sm text-gray-400">{{ label }}</span>
    </div>
  `
})
export class SpinnerComponent {
  /** متن نمایشی زیر اسپینر */
  label = 'در حال بارگذاری…';
}
