import { Component } from '@angular/core';

@Component({
  selector: 'app-offline',
  template: `
    <section dir="rtl" class="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <div class="text-center max-w-md">
        <span class="text-6xl">📡</span>
        <h1 class="mt-4 text-2xl font-extrabold text-gray-800">شبکه اینترنت قطع است</h1>
        <p class="mt-2 text-gray-500">
          برای ادامه کار، اتصال اینternet خود را بررسی کنید.
          صفحه‌ای که در حالت آفلاین باز می‌شود، نسخه کش شده از آخرین بارład reloading.
        </p>
        <button
          class="mt-6 inline-block rounded-xl bg-primary px-6 py-2.5 text-sm font-bold text-white shadow hover:bg-primary-dark transition-colors"
          (click)="retry()">
          تلاش مجدد برای اتصال
        </button>
      </div>
    </section>
  `
})
export class OfflineComponent {
  retry(): void {
    window.location.reload();
  }
}
