import { Component, OnInit } from '@angular/core';

import { AgentPickupService, ReadyItem } from '../../../../core/services/api/agent-pickup.service';

@Component({
  selector: 'app-agent-ready-items',
  template: `
    <section dir="rtl" class="mx-auto max-w-7xl space-y-6">
      <header class="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p class="text-sm font-medium text-primary">پنل کارپخش</p>
          <h1 class="mt-1 text-3xl font-extrabold text-secondary">آیتم‌های آماده تحویل</h1>
          <p class="mt-2 text-sm text-gray-500">محصولات تکمیل‌شده توسط تأمین‌کنندگان که آماده جمع‌آوری هستند</p>
        </div>
        <button type="button" (click)="load()" class="rounded-xl border border-primary px-4 py-2 text-sm font-bold text-primary hover:bg-bg-muted">
          بازخوانی
        </button>
      </header>

      <p *ngIf="errorMessage" class="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{{ errorMessage }}</p>

      <div class="overflow-x-auto rounded-2xl bg-white shadow-card">
        <div *ngIf="loading" class="p-12 text-center text-gray-500">در حال بارگذاری آیتم‌ها…</div>

        <table *ngIf="!loading && readyItems.length" class="w-full min-w-[760px] text-right text-sm">
          <thead>
            <tr class="border-b bg-gray-50 text-gray-500">
              <th class="p-4">شماره سفارش</th>
              <th class="p-4">تأمین‌کننده</th>
              <th class="p-4">محصول</th>
              <th class="p-4">تعداد</th>
              <th class="p-4">تاریخ آماده</th>
              <th class="p-4">وضعیت</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let item of readyItems" class="border-b last:border-0 hover:bg-gray-50/70">
              <td class="p-4 font-mono text-xs text-secondary">#{{ item.orderNumber }}</td>
              <td class="p-4">
                <div class="font-bold text-secondary">{{ item.supplierName }}</div>
                <div class="text-xs text-gray-500">{{ item.supplierLocation }}</div>
              </td>
              <td class="p-4 text-secondary">{{ item.productName }}</td>
              <td class="p-4">{{ item.quantity | number:'1.0-0':'fa-IR' }}</td>
              <td class="p-4">{{ item.estimatedReadyDate ? (item.estimatedReadyDate | persianDate:'yyyy/MM/dd') : '—' }}</td>
              <td class="p-4">
                <span class="rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-700">آماده تحویل</span>
              </td>
            </tr>
          </tbody>
        </table>

        <p *ngIf="!loading && !readyItems.length" class="p-10 text-center text-gray-400">
          هیچ آیتم آماده‌ای برای تحویل وجود ندارد.
        </p>
      </div>
    </section>
  `
})
export class AgentReadyItemsComponent implements OnInit {
  readyItems: ReadyItem[] = [];
  loading = true;
  errorMessage = '';

  constructor(private readonly pickupService: AgentPickupService) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.errorMessage = '';
    this.pickupService.getReadyItems().subscribe({
      next: (result) => {
        this.readyItems = result.data ?? [];
        this.loading = false;
      },
      error: (error: Error) => {
        this.errorMessage = error.message;
        this.loading = false;
      }
    });
  }
}