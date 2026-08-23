import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

import { AdminSeller, AdminService } from '../../../../core/services/api/admin.service';
import { FinancialService, Payout } from '../../../../core/services/api/financial.service';

@Component({
  selector: 'app-admin-payouts',
  template: `
    <section dir="rtl" class="mx-auto max-w-7xl space-y-6"><header class="flex flex-wrap items-center justify-between gap-4"><div><p class="text-sm font-medium text-primary">مدیریت مالی</p><h1 class="mt-1 text-3xl font-extrabold text-secondary">تسویه‌های فروشندگان</h1><p class="mt-2 text-sm text-gray-500">ایجاد تسویه و مدیریت وضعیت پرداخت فروشندگان</p></div><div class="flex gap-2"><button type="button" (click)="openCreate()" class="rounded-xl bg-primary px-5 py-2.5 font-bold text-white shadow-lg shadow-primary/20">ایجاد تسویه</button><button type="button" (click)="loadPayouts()" class="rounded-xl border border-primary px-4 py-2 font-bold text-primary">بازخوانی</button></div></header><p *ngIf="errorMessage" class="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{{ errorMessage }}</p><p *ngIf="successMessage" class="rounded-xl bg-green-50 px-4 py-3 text-sm text-green-700">{{ successMessage }}</p>
      <div class="overflow-x-auto rounded-2xl bg-white shadow-card"><div *ngIf="loading" class="p-12 text-center text-gray-500">در حال بارگذاری تسویه‌ها…</div><table *ngIf="!loading" class="w-full min-w-[900px] text-right text-sm"><thead><tr class="border-b bg-gray-50 text-gray-500"><th class="p-4">فروشنده</th><th class="p-4">مبلغ</th><th class="p-4">وضعیت</th><th class="p-4">شروع دوره</th><th class="p-4">پایان دوره</th><th class="p-4">تاریخ پرداخت</th><th class="p-4">عملیات</th></tr></thead><tbody><tr *ngFor="let payout of payouts" class="border-b last:border-0"><td class="p-4 font-bold text-secondary">{{ payout.sellerName || sellerName(payout.sellerId) }}</td><td class="p-4">{{ payout.amount | number }} تومان</td><td class="p-4"><span class="rounded-full px-3 py-1 text-xs font-bold" [class.bg-orange-50]="payout.status === 'Pending'" [class.text-orange-700]="payout.status === 'Pending'" [class.bg-blue-50]="payout.status === 'Processing'" [class.text-blue-700]="payout.status === 'Processing'" [class.bg-green-50]="payout.status === 'Completed'" [class.text-green-700]="payout.status === 'Completed'" [class.bg-red-50]="payout.status === 'Failed'" [class.text-red-700]="payout.status === 'Failed'">{{ statusLabel(payout.status) }}</span></td><td class="p-4">{{ payout.periodStart | persianDate:'yyyy/MM/dd' }}</td><td class="p-4">{{ payout.periodEnd | persianDate:'yyyy/MM/dd' }}</td><td class="p-4">{{ payout.payoutDate ? (payout.payoutDate | persianDate:'yyyy/MM/dd') : '—' }}</td><td class="p-4"><select [value]="payout.status" (change)="changeStatus(payout, $any($event.target).value)" [disabled]="busyId === payout.id || payout.status === 'Completed'" class="rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs"><option value="Pending">در انتظار</option><option value="Processing">در حال پردازش</option><option value="Completed">تکمیل‌شده</option><option value="Failed">ناموفق</option></select></td></tr></tbody></table><p *ngIf="!loading && !payouts.length" class="p-10 text-center text-gray-400">تسویه‌ای برای نمایش وجود ندارد.</p></div>
      <div *ngIf="formOpen" class="fixed inset-0 z-50 flex items-center justify-center bg-secondary/50 p-4" (click)="closeForm()"><form [formGroup]="form" (ngSubmit)="createPayout()" (click)="$event.stopPropagation()" class="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl"><div class="flex items-center justify-between"><h2 class="text-xl font-bold text-secondary">ایجاد تسویه</h2><button type="button" (click)="closeForm()" class="text-2xl text-gray-400">×</button></div><p class="mt-3 rounded-xl bg-bg-muted px-4 py-3 text-sm text-gray-600">مبلغ تسویه بر اساس فروش، کمیسیون و هزینه‌های پرداخت‌نشده توسط سامانه محاسبه می‌شود.</p><div class="mt-5 space-y-4"><label class="block"><span class="mb-1 block text-sm font-medium text-secondary">فروشنده *</span><select formControlName="sellerId" class="w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5"><option value="">انتخاب فروشنده</option><option *ngFor="let seller of sellers" [value]="seller.id">{{ seller.companyName }}</option></select></label><label class="block"><span class="mb-1 block text-sm font-medium text-secondary">دوره تسویه *</span><input formControlName="period" type="month" class="w-full rounded-xl border border-gray-300 px-4 py-2.5" /></label></div><p *ngIf="formError" class="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{{ formError }}</p><div class="mt-5 flex justify-end gap-3"><button type="button" (click)="closeForm()" class="rounded-xl border border-gray-300 px-5 py-2.5">انصراف</button><button type="submit" [disabled]="saving" class="rounded-xl bg-primary px-6 py-2.5 font-bold text-white disabled:opacity-50">{{ saving ? 'در حال ایجاد…' : 'ایجاد تسویه' }}</button></div></form></div>
    </section>
  `
})
export class AdminPayoutsComponent implements OnInit {
  payouts: Payout[] = [];
  sellers: AdminSeller[] = [];
  form: FormGroup;
  formOpen = false;
  loading = true;
  saving = false;
  busyId = '';
  errorMessage = '';
  successMessage = '';
  formError = '';

  constructor(private readonly fb: FormBuilder, private readonly financialService: FinancialService, private readonly adminService: AdminService) {
    this.form = this.fb.group({ sellerId: ['', Validators.required], period: ['', Validators.required] });
  }

  ngOnInit(): void {
    this.loadPayouts();
    this.adminService.getSellers({ page: 1, pageSize: 100 }).subscribe({ next: (result) => this.sellers = result.data?.items ?? [], error: () => this.sellers = [] });
  }

  loadPayouts(): void {
    this.loading = true;
    this.financialService.getPayouts().subscribe({ next: (result) => { this.payouts = result.data ?? []; this.loading = false; }, error: (error: Error) => { this.errorMessage = error.message; this.loading = false; } });
  }

  openCreate(): void { this.form.reset({ sellerId: '', period: new Date().toISOString().slice(0, 7) }); this.formError = ''; this.formOpen = true; }
  closeForm(): void { if (!this.saving) this.formOpen = false; }

  createPayout(): void {
    this.form.markAllAsTouched();
    const value = this.form.getRawValue();
    if (this.form.invalid) { this.formError = 'فروشنده و دوره تسویه را انتخاب کنید.'; return; }
    const [year, month] = String(value.period).split('-').map(Number);
    const periodStart = new Date(Date.UTC(year, month - 1, 1)).toISOString();
    const periodEnd = new Date(Date.UTC(year, month, 0, 23, 59, 59)).toISOString();
    this.saving = true; this.formError = '';
    this.financialService.createPayout({ sellerId: value.sellerId, periodStart, periodEnd }).subscribe({ next: (result) => { this.saving = false; if (result.isSuccess) { this.formOpen = false; this.successMessage = 'تسویه با موفقیت ایجاد شد.'; this.loadPayouts(); } else this.formError = result.errorMessage ?? 'ایجاد تسویه انجام نشد.'; }, error: (error: Error) => { this.saving = false; this.formError = error.message; } });
  }

  changeStatus(payout: Payout, status: string): void {
    if (!status || status === payout.status) return;
    this.busyId = payout.id; this.errorMessage = '';
    this.financialService.updatePayoutStatus(payout.id, status).subscribe({ next: (result) => { this.busyId = ''; if (result.isSuccess) { payout.status = status; this.successMessage = 'وضعیت تسویه به‌روزرسانی شد.'; } else this.errorMessage = result.errorMessage ?? 'تغییر وضعیت انجام نشد.'; }, error: (error: Error) => { this.busyId = ''; this.errorMessage = error.message; } });
  }

  sellerName(id: string): string { return this.sellers.find((seller) => seller.id === id)?.companyName ?? id; }
  statusLabel(status: string): string { return ({ Pending: 'در انتظار', Processing: 'در حال پردازش', Completed: 'تکمیل‌شده', Failed: 'ناموفق' } as Record<string, string>)[status] ?? status; }
}
