import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

import { AdminSeller, AdminService } from '../../../../core/services/api/admin.service';
import { CostItem, CostItemData, CostService } from '../../../../core/services/api/cost.service';

@Component({
  selector: 'app-admin-costs',
  template: `
    <section dir="rtl" class="mx-auto max-w-7xl space-y-6"><header class="flex flex-wrap items-center justify-between gap-4"><div><p class="text-sm font-medium text-primary">مدیریت مالی</p><h1 class="mt-1 text-3xl font-extrabold text-secondary">هزینه‌های جاری</h1><p class="mt-2 text-sm text-gray-500">ثبت هزینه و توزیع خودکار سهم بین فروشندگان</p></div><div class="flex gap-2"><button type="button" (click)="openCreate()" class="rounded-xl bg-primary px-5 py-2.5 font-bold text-white shadow-lg shadow-primary/20">ثبت هزینه جدید</button><button type="button" (click)="loadCosts()" class="rounded-xl border border-primary px-4 py-2 font-bold text-primary">بازخوانی</button></div></header><p *ngIf="errorMessage" class="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{{ errorMessage }}</p><p *ngIf="successMessage" class="rounded-xl bg-green-50 px-4 py-3 text-sm text-green-700">{{ successMessage }}</p><div class="overflow-x-auto rounded-2xl bg-white shadow-card"><div *ngIf="loading" class="p-12 text-center text-gray-500">در حال بارگذاری هزینه‌ها…</div><table *ngIf="!loading" class="w-full min-w-[850px] text-right text-sm"><thead><tr class="border-b bg-gray-50 text-gray-500"><th class="p-4">عنوان</th><th class="p-4">مبلغ</th><th class="p-4">نوع</th><th class="p-4">ماه</th><th class="p-4">وضعیت</th><th class="p-4">عملیات</th></tr></thead><tbody><tr *ngFor="let cost of costs" class="border-b last:border-0"><td class="p-4 font-bold text-secondary">{{ cost.name }}</td><td class="p-4">{{ cost.amount | number }} تومان</td><td class="p-4">{{ costTypeLabel(cost.costType) }}</td><td class="p-4">{{ cost.month || (cost.createdAt | persianDate:'yyyy/MM') }}</td><td class="p-4"><span class="rounded-full bg-green-50 px-3 py-1 text-xs font-bold text-green-700">توزیع‌شده</span></td><td class="p-4"><button type="button" (click)="distribute(cost)" class="font-bold text-primary hover:underline">توزیع مجدد</button></td></tr></tbody></table><p *ngIf="!loading && !costs.length" class="p-10 text-center text-gray-400">هزینه‌ای برای نمایش وجود ندارد.</p></div>
      <div *ngIf="formOpen" class="fixed inset-0 z-50 flex items-center justify-center bg-secondary/50 p-4" (click)="closeForm()"><form [formGroup]="form" (ngSubmit)="save()" (click)="$event.stopPropagation()" class="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl"><div class="flex items-center justify-between"><h2 class="text-xl font-bold text-secondary">ثبت هزینه جدید</h2><button type="button" (click)="closeForm()" class="text-2xl text-gray-400">×</button></div><p class="mt-3 rounded-xl bg-bg-muted px-4 py-3 text-sm text-gray-600">پس از ثبت، هزینه به‌صورت خودکار بین فروشندگان فعال توزیع می‌شود.</p><div class="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2"><label><span class="mb-1 block text-sm font-medium text-secondary">عنوان *</span><input formControlName="name" class="w-full rounded-xl border border-gray-300 px-4 py-2.5" /></label><label><span class="mb-1 block text-sm font-medium text-secondary">مبلغ *</span><input formControlName="amount" type="number" min="1" class="w-full rounded-xl border border-gray-300 px-4 py-2.5" /></label><label><span class="mb-1 block text-sm font-medium text-secondary">نوع هزینه *</span><select formControlName="costType" class="w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5"><option value="Server">سرور</option><option value="SMS">پیامک</option><option value="Advertising">تبلیغات</option><option value="Other">سایر</option></select></label><label><span class="mb-1 block text-sm font-medium text-secondary">تاریخ هزینه *</span><input formControlName="costDate" type="date" class="w-full rounded-xl border border-gray-300 px-4 py-2.5" /></label><label class="md:col-span-2"><span class="mb-1 block text-sm font-medium text-secondary">توضیحات</span><textarea formControlName="description" rows="3" class="w-full rounded-xl border border-gray-300 px-4 py-2.5"></textarea></label></div><p *ngIf="formError" class="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{{ formError }}</p><div class="mt-5 flex justify-end gap-3"><button type="button" (click)="closeForm()" class="rounded-xl border border-gray-300 px-5 py-2.5">انصراف</button><button type="submit" [disabled]="saving" class="rounded-xl bg-primary px-6 py-2.5 font-bold text-white disabled:opacity-50">{{ saving ? 'در حال ثبت…' : 'ثبت هزینه' }}</button></div></form></div>
    </section>
  `
})
export class AdminCostsComponent implements OnInit {
  costs: CostItem[] = [];
  sellers: AdminSeller[] = [];
  form: FormGroup;
  formOpen = false;
  loading = true;
  saving = false;
  errorMessage = '';
  successMessage = '';
  formError = '';

  constructor(private readonly fb: FormBuilder, private readonly costService: CostService, private readonly adminService: AdminService) {
    this.form = this.fb.group({ name: ['', Validators.required], amount: [null, [Validators.required, Validators.min(1)]], costType: ['Other', Validators.required], costDate: ['', Validators.required], description: [''] });
  }

  ngOnInit(): void { this.loadCosts(); this.adminService.getSellers({ page: 1, pageSize: 100 }).subscribe({ next: (result) => this.sellers = result.data?.items ?? [], error: () => this.sellers = [] }); }
  loadCosts(): void { this.loading = true; this.costService.getCosts({ pageNumber: 1, pageSize: 100 }).subscribe({ next: (result) => { this.costs = result.data?.items ?? []; this.loading = false; }, error: (error: Error) => { this.errorMessage = error.message; this.loading = false; } }); }
  openCreate(): void { this.form.reset({ name: '', amount: null, costType: 'Other', costDate: new Date().toISOString().slice(0, 10), description: '' }); this.formError = ''; this.formOpen = true; }
  closeForm(): void { if (!this.saving) this.formOpen = false; }

  save(): void {
    this.form.markAllAsTouched(); const value = this.form.getRawValue(); if (this.form.invalid) { this.formError = 'عنوان، مبلغ و تاریخ هزینه را تکمیل کنید.'; return; }
    const data: CostItemData = { sellerId: this.sellers[0]?.id ?? '00000000-0000-0000-0000-000000000000', name: value.name.trim(), amount: Number(value.amount), costType: value.costType, description: value.description || undefined, month: value.costDate.slice(0, 7) };
    this.saving = true; this.formError = ''; this.costService.createCost(data).subscribe({ next: (result) => { this.saving = false; if (result.isSuccess) { this.formOpen = false; this.successMessage = 'هزینه ثبت و توزیع شد.'; this.loadCosts(); } else this.formError = result.errorMessage ?? 'ثبت هزینه انجام نشد.'; }, error: (error: Error) => { this.saving = false; this.formError = error.message; } });
  }

  distribute(cost: CostItem): void { this.costService.distributeCost(cost.id).subscribe({ next: (result) => { if (result.isSuccess) this.successMessage = 'توزیع هزینه انجام شد.'; else this.errorMessage = result.errorMessage ?? 'توزیع هزینه انجام نشد.'; }, error: (error: Error) => this.errorMessage = error.message }); }
  costTypeLabel(type: string): string { return ({ Server: 'سرور', SMS: 'پیامک', Advertising: 'تبلیغات', Other: 'سایر' } as Record<string, string>)[type] ?? type; }
}
