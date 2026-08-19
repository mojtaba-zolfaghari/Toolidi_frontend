import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Observable } from 'rxjs';

import { Discount, DiscountData, DiscountService } from '../../../../core/services/api/discount.service';
import { Result } from '../../../../core/models/api-response.model';

@Component({
  selector: 'app-admin-discounts',
  template: `
    <section dir="rtl" class="mx-auto max-w-7xl space-y-6">
      <header class="flex flex-wrap items-center justify-between gap-4"><div><p class="text-sm font-medium text-primary">مدیریت سامانه</p><h1 class="mt-1 text-3xl font-extrabold text-secondary">تخفیف‌ها</h1><p class="mt-2 text-sm text-gray-500">ایجاد، ویرایش و حذف کدهای تخفیف</p></div><div class="flex gap-2"><button type="button" (click)="openCreate()" class="rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-primary/20 hover:bg-primary-dark">افزودن تخفیف جدید</button><button type="button" (click)="loadDiscounts()" class="rounded-xl border border-primary px-4 py-2 text-sm font-bold text-primary hover:bg-bg-muted">بازخوانی</button></div></header>
      <p *ngIf="errorMessage" class="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{{ errorMessage }}</p><p *ngIf="successMessage" class="rounded-xl bg-green-50 px-4 py-3 text-sm text-green-700">{{ successMessage }}</p>
      <div class="overflow-x-auto rounded-2xl bg-white shadow-card"><div *ngIf="loading" class="p-12 text-center text-gray-500">در حال بارگذاری تخفیف‌ها…</div><table *ngIf="!loading" class="w-full min-w-[900px] text-right text-sm"><thead><tr class="border-b bg-gray-50 text-gray-500"><th class="p-4">کد</th><th class="p-4">نوع</th><th class="p-4">مقدار</th><th class="p-4">شروع</th><th class="p-4">پایان</th><th class="p-4">وضعیت</th><th class="p-4">عملیات</th></tr></thead><tbody><tr *ngFor="let discount of discounts" class="border-b last:border-0 hover:bg-gray-50/70"><td class="p-4 font-bold text-secondary">{{ discount.name }}</td><td class="p-4">{{ discount.type === 'fixed' ? 'مبلغ ثابت' : 'درصدی' }}</td><td class="p-4">{{ discount.value ?? discount.percentage }} {{ discount.type === 'fixed' ? 'تومان' : '٪' }}</td><td class="p-4">{{ discount.startDate | date:'yyyy/MM/dd' }}</td><td class="p-4">{{ discount.endDate | date:'yyyy/MM/dd' }}</td><td class="p-4"><span [class.text-green-600]="discount.isActive" [class.text-red-600]="!discount.isActive">{{ discount.isActive ? 'فعال' : 'غیرفعال' }}</span></td><td class="p-4"><div class="flex gap-3"><button type="button" (click)="openEdit(discount)" class="font-bold text-primary hover:underline">ویرایش</button><button type="button" (click)="remove(discount)" class="font-bold text-red-600 hover:underline">حذف</button></div></td></tr></tbody></table><p *ngIf="!loading && !discounts.length" class="p-10 text-center text-gray-400">تخفیفی برای نمایش وجود ندارد.</p></div>

      <div *ngIf="formOpen" class="fixed inset-0 z-50 flex items-center justify-center bg-secondary/50 p-4" (click)="closeForm()"><form [formGroup]="form" (ngSubmit)="save()" (click)="$event.stopPropagation()" class="w-full max-w-3xl rounded-2xl bg-white p-6 shadow-2xl"><div class="flex items-center justify-between"><h2 class="text-xl font-bold text-secondary">{{ editingId ? 'ویرایش تخفیف' : 'افزودن تخفیف جدید' }}</h2><button type="button" (click)="closeForm()" class="text-2xl text-gray-400">×</button></div><div class="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2"><label><span class="mb-1 block text-sm font-medium text-secondary">کد تخفیف *</span><input formControlName="code" class="w-full rounded-xl border border-gray-300 px-4 py-2.5" placeholder="مثلاً NOWRUZ20" /><small *ngIf="invalid('code')" class="text-red-600">کد تخفیف الزامی است.</small></label><label><span class="mb-1 block text-sm font-medium text-secondary">نوع *</span><select formControlName="type" class="w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5"><option value="percentage">درصدی</option><option value="fixed">مبلغ ثابت</option></select></label><label><span class="mb-1 block text-sm font-medium text-secondary">مقدار *</span><input formControlName="value" type="number" min="0" class="w-full rounded-xl border border-gray-300 px-4 py-2.5" /><small *ngIf="invalid('value')" class="text-red-600">مقدار معتبر وارد کنید.</small></label><label><span class="mb-1 block text-sm font-medium text-secondary">حداقل مبلغ سفارش</span><input formControlName="minOrderAmount" type="number" min="0" class="w-full rounded-xl border border-gray-300 px-4 py-2.5" /></label><label><span class="mb-1 block text-sm font-medium text-secondary">تاریخ شروع *</span><input formControlName="startDate" type="date" class="w-full rounded-xl border border-gray-300 px-4 py-2.5" /></label><label><span class="mb-1 block text-sm font-medium text-secondary">تاریخ پایان *</span><input formControlName="endDate" type="date" class="w-full rounded-xl border border-gray-300 px-4 py-2.5" /></label></div><label class="mt-5 flex items-center gap-2 text-sm font-medium text-secondary"><input formControlName="isActive" type="checkbox" class="h-4 w-4 accent-primary" /> تخفیف فعال است</label><p *ngIf="formError" class="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{{ formError }}</p><div class="mt-6 flex justify-end gap-3"><button type="button" (click)="closeForm()" class="rounded-xl border border-gray-300 px-5 py-2.5">انصراف</button><button type="submit" [disabled]="saving" class="rounded-xl bg-primary px-6 py-2.5 font-bold text-white disabled:opacity-50">{{ saving ? 'در حال ذخیره…' : 'ذخیره' }}</button></div></form></div>
    </section>
  `
})
export class AdminDiscountsComponent implements OnInit {
  discounts: Discount[] = [];
  form: FormGroup;
  formOpen = false;
  editingId: string | null = null;
  loading = true;
  saving = false;
  errorMessage = '';
  successMessage = '';
  formError = '';

  constructor(private readonly fb: FormBuilder, private readonly discountService: DiscountService) {
    this.form = this.fb.group({
      code: ['', [Validators.required, Validators.maxLength(100)]],
      type: ['percentage', Validators.required],
      value: [null, [Validators.required, Validators.min(0)]],
      minOrderAmount: [null, [Validators.min(0)]],
      startDate: ['', Validators.required],
      endDate: ['', Validators.required],
      isActive: [true]
    });
  }

  ngOnInit(): void { this.loadDiscounts(); }

  loadDiscounts(): void {
    this.loading = true;
    this.discountService.getDiscounts({ pageNumber: 1, pageSize: 100 }).subscribe({
      next: (result) => { this.discounts = result.data?.items ?? []; this.loading = false; },
      error: (error: Error) => { this.errorMessage = error.message; this.loading = false; }
    });
  }

  openCreate(): void {
    this.editingId = null;
    this.form.reset({ type: 'percentage', value: null, minOrderAmount: null, startDate: '', endDate: '', isActive: true });
    this.formError = '';
    this.formOpen = true;
  }

  openEdit(discount: Discount): void {
    this.editingId = discount.id;
    this.form.patchValue({
      code: discount.name,
      type: discount.type ?? 'percentage',
      value: discount.value ?? discount.percentage,
      minOrderAmount: discount.minOrderAmount ?? null,
      startDate: this.toDateInput(discount.startDate),
      endDate: this.toDateInput(discount.endDate),
      isActive: discount.isActive
    });
    this.formError = '';
    this.formOpen = true;
  }

  closeForm(): void { if (!this.saving) { this.formOpen = false; } }

  invalid(control: string): boolean {
    const field = this.form.get(control);
    return !!field && field.invalid && (field.dirty || field.touched);
  }

  save(): void {
    this.form.markAllAsTouched();
    const value = this.form.getRawValue();
    if (this.form.invalid) { this.formError = 'لطفاً همه فیلدهای الزامی را صحیح تکمیل کنید.'; return; }
    if (value.endDate < value.startDate) { this.formError = 'تاریخ پایان باید بعد از تاریخ شروع باشد.'; return; }
    this.saving = true;
    this.formError = '';
    const data: DiscountData = {
      name: value.code.trim(),
      description: '',
      percentage: Number(value.value),
      type: value.type,
      value: Number(value.value),
      minOrderAmount: value.minOrderAmount == null ? undefined : Number(value.minOrderAmount),
      startDate: new Date(`${value.startDate}T00:00:00`).toISOString(),
      endDate: new Date(`${value.endDate}T23:59:59`).toISOString(),
      isActive: !!value.isActive
    };
    const request: Observable<Result<unknown>> = this.editingId
      ? this.discountService.updateDiscount(this.editingId, data)
      : this.discountService.createDiscount(data);
    request.subscribe({
      next: (result) => {
        this.saving = false;
        if (result.isSuccess) { this.formOpen = false; this.successMessage = this.editingId ? 'تخفیف ویرایش شد.' : 'تخفیف جدید ایجاد شد.'; this.loadDiscounts(); }
        else { this.formError = result.errorMessage ?? 'ذخیره تخفیف انجام نشد.'; }
      },
      error: (error: Error) => { this.saving = false; this.formError = error.message; }
    });
  }

  remove(discount: Discount): void {
    if (!window.confirm(`آیا از حذف تخفیف «${discount.name}» مطمئن هستید؟`)) return;
    this.discountService.deleteDiscount(discount.id).subscribe({
      next: (result) => { if (result.isSuccess) { this.successMessage = 'تخفیف حذف شد.'; this.loadDiscounts(); } else this.errorMessage = result.errorMessage ?? 'حذف تخفیف انجام نشد.'; },
      error: (error: Error) => { this.errorMessage = error.message; }
    });
  }

  private toDateInput(value: string): string { return value ? value.slice(0, 10) : ''; }
}
