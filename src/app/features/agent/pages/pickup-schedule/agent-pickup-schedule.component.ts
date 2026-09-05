import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import {
  AgentPickupService,
  PickupSchedule,
  SupplierOption
} from '../../../../core/services/api/agent-pickup.service';

@Component({
  selector: 'app-agent-pickup-schedule',
  template: `
    <section dir="rtl" class="mx-auto max-w-7xl space-y-6">
      <header class="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p class="text-sm font-medium text-primary">پنل کارپخش</p>
          <h1 class="mt-1 text-3xl font-extrabold text-secondary">زمان‌بندی تحویل</h1>
          <p class="mt-2 text-sm text-gray-500">visitهای خود به تأمین‌کنندگان را برنامه‌ریزی کنید</p>
        </div>
        <div class="flex gap-2">
          <button type="button" (click)="openForm()" class="rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-primary/20">
            زمان‌بندی جدید
          </button>
          <button type="button" (click)="load()" class="rounded-xl border border-primary px-4 py-2 text-sm font-bold text-primary hover:bg-bg-muted">
            بازخوانی
          </button>
        </div>
      </header>

      <p *ngIf="errorMessage" class="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{{ errorMessage }}</p>
      <p *ngIf="successMessage" class="rounded-xl bg-green-50 px-4 py-3 text-sm text-green-700">{{ successMessage }}</p>

      <!-- Schedule List -->
      <div class="overflow-x-auto rounded-2xl bg-white shadow-card">
        <div *ngIf="loading" class="p-12 text-center text-gray-500">در حال بارگذاری زمان‌بندی‌ها…</div>

        <table *ngIf="!loading && schedules.length" class="w-full min-w-[700px] text-right text-sm">
          <thead>
            <tr class="border-b bg-gray-50 text-gray-500">
              <th class="p-4">تأمین‌کننده</th>
              <th class="p-4">تاریخ</th>
              <th class="p-4">بازه زمانی</th>
              <th class="p-4">وضعیت</th>
              <th class="p-4">عملیات</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let schedule of schedules" class="border-b last:border-0 hover:bg-gray-50/70">
              <td class="p-4 font-bold text-secondary">{{ schedule.supplierName || '—' }}</td>
              <td class="p-4">{{ schedule.scheduledPickupDate | persianDate:'yyyy/MM/dd' }}</td>
              <td class="p-4">{{ schedule.timeWindowStart }} - {{ schedule.timeWindowEnd }}</td>
              <td class="p-4">
                <span class="rounded-full px-3 py-1 text-xs font-bold"
                      [ngClass]="getStatusColor(schedule.status)">
                  {{ getStatusLabel(schedule.status) }}
                </span>
              </td>
              <td class="p-4">
                <div class="flex gap-2">
                  <button *ngIf="schedule.status === 'Scheduled'" type="button" (click)="updateStatus(schedule, 'InTransit')"
                          class="rounded-lg bg-blue-500 px-3 py-1.5 text-xs font-bold text-white hover:bg-blue-600">
                    در مسیر
                  </button>
                  <button *ngIf="schedule.status === 'InTransit'" type="button" (click)="updateStatus(schedule, 'Completed')"
                          class="rounded-lg bg-green-500 px-3 py-1.5 text-xs font-bold text-white hover:bg-green-600">
                    تکمیل
                  </button>
                  <button *ngIf="schedule.status === 'Scheduled'" type="button" (click)="updateStatus(schedule, 'Cancelled')"
                          class="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-bold text-red-600 hover:bg-red-50">
                    لغو
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>

        <p *ngIf="!loading && !schedules.length" class="p-10 text-center text-gray-400">
          هیچ زمان‌بندی تحویلی ثبت نشده است.
        </p>
      </div>

      <!-- Create Schedule Modal -->
      <div *ngIf="formOpen" class="fixed inset-0 z-50 flex items-center justify-center bg-secondary/50 p-4" (click)="closeForm()">
        <form [formGroup]="form" (ngSubmit)="save()" (click)="$event.stopPropagation()" class="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
          <div class="flex items-center justify-between">
            <h2 class="text-xl font-bold text-secondary">زمان‌بندی جدید تحویل</h2>
            <button type="button" (click)="closeForm()" class="text-2xl text-gray-400">×</button>
          </div>

          <div class="mt-5 space-y-4">
            <label>
              <span class="mb-1 block text-sm font-medium text-secondary">تأمین‌کننده *</span>
              <select formControlName="supplierId" class="w-full rounded-xl border border-gray-300 px-4 py-2.5 bg-white" [disabled]="suppliersLoading">
                <option value="">انتخاب تأمین‌کننده</option>
                <option *ngFor="let s of suppliers" [value]="s.id">{{ s.name }}{{ s.city ? ' — ' + s.city : '' }}</option>
              </select>
              <span *ngIf="suppliersLoading" class="text-xs text-gray-400">در حال بارگذاری تأمین‌کنندگان…</span>
            </label>

            <label>
              <span class="mb-1 block text-sm font-medium text-secondary">تاریخ تحویل * (شمسی)</span>
              <app-persian-date-picker placeholder="انتخاب تاریخ تحویل" (dateSelected)="onJalaliDateSelected($event)"></app-persian-date-picker>
              <input formControlName="scheduledPickupDate" type="hidden" />
              <span *ngIf="jalaliDateDisplay" class="mt-1 text-xs text-gray-500">{{ jalaliDateDisplay }}</span>
            </label>

            <div class="grid grid-cols-2 gap-4">
              <label>
                <span class="mb-1 block text-sm font-medium text-secondary">شروع بازه *</span>
                <input formControlName="timeWindowStart" type="time" class="w-full rounded-xl border border-gray-300 px-4 py-2.5" />
              </label>
              <label>
                <span class="mb-1 block text-sm font-medium text-secondary">پایان بازه *</span>
                <input formControlName="timeWindowEnd" type="time" class="w-full rounded-xl border border-gray-300 px-4 py-2.5" />
              </label>
            </div>

            <label>
              <span class="mb-1 block text-sm font-medium text-secondary">یادداشت (اختیاری)</span>
              <textarea formControlName="notes" rows="2" class="w-full rounded-xl border border-gray-300 px-4 py-2.5"></textarea>
            </label>
          </div>

          <p *ngIf="formError" class="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{{ formError }}</p>
          <div class="mt-5 flex justify-end gap-3">
            <button type="button" (click)="closeForm()" class="rounded-xl border border-gray-300 px-5 py-2.5">انصراف</button>
            <button type="submit" [disabled]="saving" class="rounded-xl bg-primary px-6 py-2.5 font-bold text-white disabled:opacity-50">
              {{ saving ? 'در حال ذخیره…' : 'ذخیره' }}
            </button>
          </div>
        </form>
      </div>
    </section>
  `
})
export class AgentPickupScheduleComponent implements OnInit {
  schedules: PickupSchedule[] = [];
  suppliers: SupplierOption[] = [];
  form: FormGroup;
  formOpen = false;
  loading = true;
  saving = false;
  suppliersLoading = false;
  errorMessage = '';
  successMessage = '';
  formError = '';
  jalaliDateDisplay = '';

  constructor(
    private readonly fb: FormBuilder,
    private readonly pickupService: AgentPickupService
  ) {
    this.form = this.fb.group({
      supplierId: ['', Validators.required],
      scheduledPickupDate: ['', Validators.required],
      timeWindowStart: ['09:00', Validators.required],
      timeWindowEnd: ['12:00', Validators.required],
      notes: ['']
    });
  }

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.errorMessage = '';
    this.pickupService.getSchedules().subscribe({
      next: (result) => {
        this.schedules = result.data ?? [];
        this.loading = false;
      },
      error: (error: Error) => {
        this.errorMessage = error.message;
        this.loading = false;
      }
    });
  }

  openForm(): void {
    this.form.reset({ supplierId: '', scheduledPickupDate: '', timeWindowStart: '09:00', timeWindowEnd: '12:00', notes: '' });
    this.formError = '';
    this.jalaliDateDisplay = '';
    this.formOpen = true;
    this.loadSuppliers();
  }

  loadSuppliers(): void {
    this.suppliersLoading = true;
    this.pickupService.getSuppliers().subscribe({
      next: (result) => {
        this.suppliers = result.data ?? [];
        this.suppliersLoading = false;
      },
      error: () => {
        this.suppliers = [];
        this.suppliersLoading = false;
      }
    });
  }

  onJalaliDateSelected(jalaliDate: string): void {
    // jalaliDate is like "1405/6/11"
    this.jalaliDateDisplay = jalaliDate;
    // Convert Jalali to Gregorian for the API
    const parts = jalaliDate.split('/').map(Number);
    const gregorianDate = this.jalaliToGregorian(parts[0], parts[1], parts[2]);
    this.form.patchValue({ scheduledPickupDate: gregorianDate });
  }

  private jalaliToGregorian(jy: number, jm: number, jd: number): string {
    // JDN-based conversion (well-known algorithm)
    const jdn = 365 * (jy - 1) + Math.floor((3 + jy) / 8) + 31 * (jm - 1) + (jm < 7 ? 0 : 1)
      - Math.floor((jy - 1) / 100) + Math.floor((jy - 1) / 400) + jd + 68;
    // JDN to Gregorian
    const l = jdn + 68569 + 16842;
    const n = Math.floor(4 * l / 146097);
    const l2 = l - Math.floor((146097 * n + 3) / 4);
    const i = Math.floor(4000 * (l2 + 1) / 1461001);
    const l3 = l2 - Math.floor(1461 * i / 4) + 31;
    const j = Math.floor(80 * l3 / 2447);
    const day = l3 - Math.floor(2447 * j / 80);
    const l4 = j < 11 ? j + 2 : j - 10;
    const yr = 100 * (n - 49) + i + j;
    return `${yr}-${String(l4).padStart(2, '0')}-${String(Math.max(1, day)).padStart(2, '0')}`;
  }

  closeForm(): void {
    if (!this.saving) this.formOpen = false;
  }

  save(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) {
      this.formError = 'لطفاً همه فیلدهای الزامی را تکمیل کنید.';
      return;
    }

    const value = this.form.getRawValue();
    if (value.timeWindowStart >= value.timeWindowEnd) {
      this.formError = 'زمان پایان باید بعد از زمان شروع باشد.';
      return;
    }

    this.saving = true;
    this.formError = '';

    this.pickupService.createSchedule({
      supplierId: value.supplierId,
      scheduledPickupDate: new Date(value.scheduledPickupDate).toISOString(),
      timeWindowStart: value.timeWindowStart,
      timeWindowEnd: value.timeWindowEnd,
      notes: value.notes || undefined
    }).subscribe({
      next: (result) => {
        this.saving = false;
        if (result.isSuccess) {
          this.formOpen = false;
          this.successMessage = 'زمان‌بندی جدید ایجاد شد.';
          this.load();
        } else {
          this.formError = result.errorMessage ?? 'ایجاد زمان‌بندی انجام نشد.';
        }
      },
      error: (error: Error) => {
        this.saving = false;
        this.formError = error.message;
      }
    });
  }

  updateStatus(schedule: PickupSchedule, newStatus: string): void {
    this.successMessage = '';
    this.errorMessage = '';
    this.pickupService.updateStatus(schedule.id, newStatus).subscribe({
      next: (result) => {
        if (result.isSuccess) {
          schedule.status = newStatus;
          this.successMessage = `وضعیت به "${this.getStatusLabel(newStatus)}" تغییر کرد.`;
        } else {
          this.errorMessage = result.errorMessage ?? 'تغییر وضعیت انجام نشد.';
        }
      },
      error: (error: Error) => { this.errorMessage = error.message; }
    });
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      'Scheduled': 'برنامه‌ریزی شده',
      'InTransit': 'در مسیر',
      'Completed': 'تکمیل شده',
      'Cancelled': 'لغو شده'
    };
    return labels[status] || status;
  }

  getStatusColor(status: string): string {
    const colors: Record<string, string> = {
      'Scheduled': 'bg-blue-100 text-blue-700',
      'InTransit': 'bg-yellow-100 text-yellow-700',
      'Completed': 'bg-green-100 text-green-700',
      'Cancelled': 'bg-red-100 text-red-700'
    };
    return colors[status] || 'bg-gray-100 text-gray-600';
  }
}
