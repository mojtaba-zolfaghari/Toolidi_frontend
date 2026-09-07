import { Component, ChangeDetectionStrategy } from '@angular/core';

/**
 * کامپوننت جای‌گذاری برای صفحاتی که هنوز پیاده‌سازی نشده‌اند.
 */
@Component({
    selector: 'app-placeholder',
    template: `
    <section class="container mx-auto px-4 py-24 text-center">
      <h1 class="text-2xl font-bold text-secondary mb-4">این بخش به‌زودی در دسترس خواهد بود</h1>
      <p class="text-gray-500">در حال تکمیل این صفحه هستیم.</p>
    </section>
  `,
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class PlaceholderComponent {}
