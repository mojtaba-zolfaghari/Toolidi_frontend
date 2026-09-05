import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

import {
  SupplierProductionService,
  ProductionSchedule
} from '../../../../core/services/api/supplier-production.service';

@Component({
  selector: 'app-supplier-schedule',
  template: `
    <section dir="rtl" class="mx-auto max-w-7xl space-y-6">
      <!-- Header -->
      <header class="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p class="text-sm font-medium text-primary">پنل تأمین‌کننده</p>
          <h1 class="mt-1 text-3xl font-extrabold text-secondary">زمان‌بندی تولید</h1>
          <p class="mt-2 text-sm text-gray-500">تاریخ شروع و پایان تولید آیتم‌های سفارش را تنظیم کنید</p>
        </div>
        <button type="button" (click)="load()" class="rounded-xl border border-primary px-4 py-2 text-sm font-bold text-primary hover:bg-bg-muted">
          بازخوانی
        </button>
      </header>

      <!-- Messages -->
      <p *ngIf="errorMessage" class="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{{ errorMessage }}</p>
      <p *ngIf="successMessage" class="rounded-xl bg-green-50 px-4 py-3 text-sm text-green-700">{{ successMessage }}</p>

      <!-- Schedule List -->
      <div class="overflow-x-auto rounded-2xl bg-white shadow-card">
        <div *ngIf="loading" class="p-12 text-center text-gray-500">در حال بارگذاری زمان‌بندی‌ها…</div>

        <table *ngIf="!loading && schedules.length" class="w-full min-w-[800px] text-right text-sm">
          <thead>
            <tr class="border-b bg-gray-50 text-gray-500">
              <th class="p-4">شناسه آیتم</th>
              <th class="p-4">وضعیت</th>
              <th class="p-4">تاریخ شروع</th>
              <th class="p-4">تاریخ پایان</th>
              <th class="p-4">تاریخ آماده</th>
              <th class="p-4">یادداشت</th>
              <th class="p-4">عملیات</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let schedule of schedules" class="border-b last:border-0 hover:bg-gray-50/70">
              <td class="p-4 font-bold text-secondary">{{ schedule.orderItemId | slice:0:8 }}…</td>
              <td class="p-4">
                <span class="rounded-full px-3 py-1 text-xs font-bold"
                      [ngClass]="getStatusColor(schedule.status)">
                  {{ getStatusLabel(schedule.status) }}
                </span>
              </td>
              <td class="p-4">{{ schedule.productionStartDate ? (schedule.productionStartDate | persianDate:'yyyy/MM/dd') : '—' }}</td>
              <td class="p-4">{{ schedule.productionEndDate ? (schedule.productionEndDate | persianDate:'yyyy/MM/dd') : '—' }}</td>
              <td class="p-4">{{ schedule.estimatedReadyDate ? (schedule.estimatedReadyDate | persianDate:'yyyy/MM/dd') : '—' }}</td>
              <td class="p-4 text-gray-500 max-w-[120px] truncate">{{ schedule.notes || '—' }}</td>
              <td class="p-4">
                <div class="flex gap-2">
                  <button *ngIf="schedule.status === 'NotStarted'" type="button" (click)="updateStatus(schedule, 'InProgress')"
                          class="rounded-lg bg-blue-500 px-3 py-1.5 text-xs font-bold text-white hover:bg-blue-600">
                    شروع تولید
                  </button>
                  <button *ngIf="schedule.status === 'InProgress'" type="button" (click)="updateStatus(schedule, 'Completed')"
                          class="rounded-lg bg-green-500 px-3 py-1.5 text-xs font-bold text-white hover:bg-green-600">
                    تکمیل تولید
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        <p *ngIf="!loading && !schedules.length" class="p-10 text-center text-gray-400">
          هیچ زمان‌بندی تولیدی ثبت نشده است.
        </p>
      </div>
    </section>
  `
})
export class SupplierScheduleComponent implements OnInit {
  schedules: ProductionSchedule[] = [];
  loading = true;
  errorMessage = '';
  successMessage = '';

  constructor(private readonly productionService: SupplierProductionService) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';

    // For now, load all schedules (in production, this would be filtered by supplier)
    this.productionService.getCapacities().subscribe({
      next: () => {
        // Capacities loaded, now try to load schedules
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });

    // Note: In production, we'd load schedules from a specific order
    // For now, show empty state
    this.schedules = [];
    this.loading = false;
  }

  updateStatus(schedule: ProductionSchedule, newStatus: string): void {
    this.successMessage = '';
    this.errorMessage = '';

    this.productionService.updateScheduleStatus(schedule.id, newStatus).subscribe({
      next: (result) => {
        if (result.isSuccess) {
          schedule.status = newStatus;
          this.successMessage = `وضعیت به "${this.getStatusLabel(newStatus)}" تغییر کرد.`;
        } else {
          this.errorMessage = result.errorMessage ?? 'تغییر وضعیت انجام نشد.';
        }
      },
      error: (error: Error) => {
        this.errorMessage = error.message;
      }
    });
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      'NotStarted': 'شروع نشده',
      'InProgress': 'در حال تولید',
      'Completed': 'تکمیل شده'
    };
    return labels[status] || status;
  }

  getStatusColor(status: string): string {
    const colors: Record<string, string> = {
      'NotStarted': 'bg-gray-100 text-gray-700',
      'InProgress': 'bg-blue-100 text-blue-700',
      'Completed': 'bg-green-100 text-green-700'
    };
    return colors[status] || 'bg-gray-100 text-gray-600';
  }
}
