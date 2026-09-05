import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

import {
  SupplierProductionService,
  ProductionCapacity,
  ProductionCapacityData
} from '../../../../core/services/api/supplier-production.service';

@Component({
  selector: 'app-supplier-capacity',
  template: `
    <section dir="rtl" class="mx-auto max-w-7xl space-y-6">
      <!-- Header -->
      <header class="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p class="text-sm font-medium text-primary">پنل تأمین‌کننده</p>
          <h1 class="mt-1 text-3xl font-extrabold text-secondary">ظرفیت تولید</h1>
          <p class="mt-2 text-sm text-gray-500">تعداد واحدهای قابل تولید در روز را تنظیم کنید</p>
        </div>
        <div class="flex gap-2">
          <button type="button" (click)="openForm()" class="rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-primary/20 hover:bg-primary-dark">
            افزودن ظرفیت جدید
          </button>
          <button type="button" (click)="load()" class="rounded-xl border border-primary px-4 py-2 text-sm font-bold text-primary hover:bg-bg-muted">
            بازخوانی
          </button>
        </div>
      </header>

      <!-- Messages -->
      <p *ngIf="errorMessage" class="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{{ errorMessage }}</p>
      <p *ngIf="successMessage" class="rounded-xl bg-green-50 px-4 py-3 text-sm text-green-700">{{ successMessage }}</p>

      <!-- Conflict Warning -->
      <p *ngIf="conflictWarning" class="rounded-xl bg-yellow-50 px-4 py-3 text-sm text-yellow-700 flex items-center gap-2">
        <span>⚠️</span> {{ conflictWarning }}
      </p>

      <!-- Capacity List -->
      <div class="overflow-x-auto rounded-2xl bg-white shadow-card">
        <div *ngIf="loading" class="p-12 text-center text-gray-500">در حال بارگذاری ظرفیت‌ها…</div>

        <div *ngIf="!loading && capacities.length" class="grid grid-cols-1 gap-4 p-6 sm:grid-cols-2 lg:grid-cols-3">
          <div *ngFor="let cap of capacities" class="rounded-xl border border-gray-200 p-5 transition-shadow hover:shadow-md">
            <div class="mb-3 flex items-center justify-between">
              <span class="text-2xl">🏭</span>
              <span class="rounded-full px-3 py-1 text-xs font-bold"
                    [class.bg-green-50]="cap.isActive"
                    [class.text-green-700]="cap.isActive"
                    [class.bg-red-50]="!cap.isActive"
                    [class.text-red-700]="!cap.isActive">
                {{ cap.isActive ? 'فعال' : 'غیرفعال' }}
              </span>
            </div>
            <p class="text-2xl font-extrabold text-secondary">{{ cap.dailyCapacity | number:'1.0-0':'fa-IR' }} <span class="text-sm font-normal text-gray-500">{{ cap.unit }}</span></p>
            <p class="mt-1 text-xs text-gray-400">ظرفیت روزانه</p>
            <div class="mt-3 space-y-1 text-xs text-gray-500">
              <p *ngIf="cap.effectiveFrom">از: {{ cap.effectiveFrom | persianDate:'yyyy/MM/dd' }}</p>
              <p *ngIf="cap.effectiveTo">تا: {{ cap.effectiveTo | persianDate:'yyyy/MM/dd' }}</p>
              <p *ngIf="!cap.effectiveFrom && !cap.effectiveTo">بدون محدوده تاریخ</p>
            </div>
            <div class="mt-4 flex gap-2">
              <button type="button" (click)="editForm(cap)" class="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-bold text-primary hover:bg-gray-50">ویرایش</button>
              <button type="button" (click)="confirmDelete(cap)" class="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-bold text-red-600 hover:bg-red-50">حذف</button>
            </div>
          </div>
        </div>

        <p *ngIf="!loading && !capacities.length" class="p-10 text-center text-gray-400">
          هنوز ظرفیت تولیدی ثبت نشده است.
        </p>
      </div>

      <!-- Capacity Form Modal -->
      <div *ngIf="formOpen" class="fixed inset-0 z-50 flex items-center justify-center bg-secondary/50 p-4" (click)="closeForm()">
        <form [formGroup]="form" (ngSubmit)="save()" (click)="$event.stopPropagation()" class="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
          <div class="flex items-center justify-between">
            <h2 class="text-xl font-bold text-secondary">{{ editingId ? 'ویرایش ظرفیت' : 'افزودن ظرفیت جدید' }}</h2>
            <button type="button" (click)="closeForm()" class="text-2xl text-gray-400">×</button>
          </div>

          <div class="mt-5 space-y-4">
            <label>
              <span class="mb-1 block text-sm font-medium text-secondary">ظرفیت روزانه *</span>
              <input formControlName="dailyCapacity" type="number" min="1" class="w-full rounded-xl border border-gray-300 px-4 py-2.5" placeholder="مثلاً 100" />
            </label>

            <label>
              <span class="mb-1 block text-sm font-medium text-secondary">واحد *</span>
              <select formControlName="unit" class="w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5">
                <option value="units">واحد</option>
                <option value="kg">کیلوگرم</option>
                <option value="meter">متر</option>
                <option value="box">جعبه</option>
              </select>
            </label>

            <div class="grid grid-cols-2 gap-4">
              <label>
                <span class="mb-1 block text-sm font-medium text-secondary">تاریخ شروع (اختیاری)</span>
                <input formControlName="effectiveFrom" type="date" class="w-full rounded-xl border border-gray-300 px-4 py-2.5" />
              </label>
              <label>
                <span class="mb-1 block text-sm font-medium text-secondary">تاریخ پایان (اختیاری)</span>
                <input formControlName="effectiveTo" type="date" class="w-full rounded-xl border border-gray-300 px-4 py-2.5" />
              </label>
            </div>

            <p *ngIf="rangeWarning" class="rounded-xl bg-yellow-50 px-4 py-2 text-xs text-yellow-700 flex items-center gap-2">
              <span>⚠️</span> {{ rangeWarning }}
            </p>
          </div>

          <p *ngIf="formError" class="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{{ formError }}</p>

          <div class="mt-5 flex justify-end gap-3">
            <button type="button" (click)="closeForm()" class="rounded-xl border border-gray-300 px-5 py-2.5">انصراف</button>
            <button type="submit" [disabled]="saving" class="rounded-xl bg-primary px-6 py-2.5 font-bold text-white disabled:opacity-50">
              {{ saving ? 'در حال ذخیره…' : (editingId ? 'به‌روزرسانی' : 'ذخیره') }}
            </button>
          </div>
        </form>
      </div>

      <!-- Delete Confirmation Modal -->
      <div *ngIf="deleteOpen" class="fixed inset-0 z-50 flex items-center justify-center bg-secondary/50 p-4" (click)="closeDelete()">
        <div class="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl" (click)="$event.stopPropagation()">
          <div class="flex items-center gap-3">
            <span class="text-3xl">🗑️</span>
            <h2 class="text-xl font-bold text-secondary">حذف ظرفیت</h2>
          </div>
          <p class="mt-3 text-sm text-gray-600">آیا از حذف این ظرفیت اطمینان دارید؟ این عمل قابل بازگشت است (حذف نرم).</p>
          <p class="mt-2 text-sm font-bold text-secondary" *ngIf="deletingCap">
            {{ deletingCap.dailyCapacity }} {{ deletingCap.unit }}
            <span *ngIf="deletingCap.effectiveFrom || deletingCap.effectiveTo">
              ({{ deletingCap.effectiveFrom | persianDate:'yyyy/MM/dd' }} تا {{ deletingCap.effectiveTo | persianDate:'yyyy/MM/dd' }})
            </span>
          </p>
          <p *ngIf="deleteError" class="mt-3 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{{ deleteError }}</p>
          <div class="mt-5 flex justify-end gap-3">
            <button type="button" (click)="closeDelete()" class="rounded-xl border border-gray-300 px-5 py-2.5">انصراف</button>
            <button type="button" (click)="executeDelete()" [disabled]="deleting" class="rounded-xl bg-red-600 px-6 py-2.5 font-bold text-white disabled:opacity-50">
              {{ deleting ? 'در حال حذف…' : 'حذف' }}
            </button>
          </div>
        </div>
      </div>
    </section>
  `
})
export class SupplierCapacityComponent implements OnInit {
  capacities: ProductionCapacity[] = [];
  form: FormGroup;
  formOpen = false;
  deleteOpen = false;
  deletingCap: ProductionCapacity | null = null;
  editingId: string | null = null;
  loading = true;
  saving = false;
  deleting = false;
  errorMessage = '';
  successMessage = '';
  formError = '';
  deleteError = '';
  conflictWarning = '';
  rangeWarning = '';

  constructor(
    private readonly fb: FormBuilder,
    private readonly productionService: SupplierProductionService
  ) {
    this.form = this.fb.group({
      dailyCapacity: [null, [Validators.required, Validators.min(1)]],
      unit: ['units', Validators.required],
      effectiveFrom: [''],
      effectiveTo: ['']
    });

    this.form.valueChanges.subscribe(() => {
      this.checkFormRange();
      this.checkConflicts();
    });
  }

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.errorMessage = '';
    this.conflictWarning = '';
    this.productionService.getCapacities().subscribe({
      next: (result) => {
        this.capacities = result.data ?? [];
        this.loading = false;
      },
      error: (error: Error) => {
        this.errorMessage = error.message;
        this.loading = false;
      }
    });
  }

  openForm(): void {
    this.editingId = null;
    this.form.reset({ dailyCapacity: null, unit: 'units', effectiveFrom: '', effectiveTo: '' });
    this.formError = '';
    this.rangeWarning = '';
    this.conflictWarning = '';
    this.formOpen = true;
  }

  editForm(cap: ProductionCapacity): void {
    this.editingId = cap.id;
    this.form.patchValue({
      dailyCapacity: cap.dailyCapacity,
      unit: cap.unit,
      effectiveFrom: cap.effectiveFrom ? cap.effectiveFrom.slice(0, 10) : '',
      effectiveTo: cap.effectiveTo ? cap.effectiveTo.slice(0, 10) : ''
    });
    this.formError = '';
    this.rangeWarning = '';
    this.formOpen = true;
  }

  closeForm(): void {
    if (!this.saving) this.formOpen = false;
  }

  confirmDelete(cap: ProductionCapacity): void {
    this.deletingCap = cap;
    this.deleteError = '';
    this.deleteOpen = true;
  }

  closeDelete(): void {
    if (!this.deleting) {
      this.deleteOpen = false;
      this.deletingCap = null;
    }
  }

  executeDelete(): void {
    if (!this.deletingCap) return;
    this.deleting = true;
    this.deleteError = '';
    this.productionService.deleteCapacity(this.deletingCap.id).subscribe({
      next: (result) => {
        this.deleting = false;
        if (result.isSuccess) {
          this.successMessage = 'ظرفیت حذف شد.';
          this.deleteOpen = false;
          this.deletingCap = null;
          this.load();
        } else {
          this.deleteError = result.errorMessage ?? 'حذف ظرفیت انجام نشد.';
        }
      },
      error: (error: Error) => {
        this.deleting = false;
        this.deleteError = error.message;
      }
    });
  }

  save(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) {
      this.formError = 'لطفاً همه فیلدهای الزامی را تکمیل کنید.';
      return;
    }

    const value = this.form.getRawValue();
    if (value.effectiveFrom && value.effectiveTo && value.effectiveFrom > value.effectiveTo) {
      this.formError = 'تاریخ پایان باید بعد از تاریخ شروع باشد.';
      return;
    }

    this.saving = true;
    this.formError = '';
    this.conflictWarning = '';

    const data: ProductionCapacityData = {
      dailyCapacity: value.dailyCapacity,
      unit: value.unit,
      effectiveFrom: value.effectiveFrom || undefined,
      effectiveTo: value.effectiveTo || undefined
    };

    if (this.editingId) {
      this.productionService.updateCapacity(this.editingId, data).subscribe({
        next: (result) => {
          this.saving = false;
          if (result.isSuccess) {
            this.formOpen = false;
            this.successMessage = 'ظرفیت ویرایش شد.';
            this.load();
          } else {
            this.formError = result.errorMessage ?? 'به‌روزرسانی ظرفیت انجام نشد.';
          }
        },
        error: (error: Error) => {
          this.saving = false;
          this.formError = error.message;
        }
      });
    } else {
      this.productionService.createOrUpdateCapacity(data).subscribe({
        next: (result) => {
          this.saving = false;
          if (result.isSuccess) {
            this.formOpen = false;
            this.successMessage = 'ظرفیت جدید اضافه شد.';
            this.load();
          } else {
            this.formError = result.errorMessage ?? 'ذخیره ظرفیت انجام نشد.';
          }
        },
        error: (error: Error) => {
          this.saving = false;
          this.formError = error.message;
        }
      });
    }
  }

  private checkFormRange(): void {
    const from = this.form.get('effectiveFrom')?.value;
    const to = this.form.get('effectiveTo')?.value;
    this.rangeWarning = '';
    if (from && to && from > to) {
      this.rangeWarning = 'تاریخ پایان باید بعد از تاریخ شروع باشد.';
    }
  }

  private checkConflicts(): void {
    const from = this.form.get('effectiveFrom')?.value;
    const to = this.form.get('effectiveTo')?.value;
    this.conflictWarning = '';

    if (!from && !to) return;

    const newStart = from ? new Date(from).getTime() : null;
    const newEnd = to ? new Date(to).getTime() : null;

    const conflicts = this.capacities.filter((cap) => {
      if (this.editingId && cap.id === this.editingId) return false;

      const capStart = cap.effectiveFrom ? new Date(cap.effectiveFrom).getTime() : null;
      const capEnd = cap.effectiveTo ? new Date(cap.effectiveTo).getTime() : null;

      const rangesOverlap = (aStart: number | null, aEnd: number | null, bStart: number | null, bEnd: number | null): boolean => {
        if (aStart === null && aEnd === null) return false;
        const start = Math.max(aStart ?? -Infinity, bStart ?? -Infinity);
        const end = Math.min(aEnd ?? Infinity, bEnd ?? Infinity);
        return start <= end;
      };

      return rangesOverlap(newStart, newEnd, capStart, capEnd);
    });

    if (conflicts.length > 0) {
      const first = conflicts[0];
      const fromStr = first.effectiveFrom ? new Date(first.effectiveFrom).toLocaleDateString('fa-IR') : 'بدون شروع';
      const toStr = first.effectiveTo ? new Date(first.effectiveTo).toLocaleDateString('fa-IR') : 'بدون پایان';
      this.conflictWarning = `تداخل با رکورد موجود (${fromStr} تا ${toStr}) شناسایی شد. در صورت ذخیره، ظرفیت‌های همپوشانی ایجاد می‌شود.`;
    }
  }
}