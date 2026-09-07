import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

import { FinancialService, FinancialTransaction, WalletSummary } from '../../../../core/services/api/financial.service';

@Component({
  selector: 'app-seller-payouts',
  template: `
    <section dir="rtl" class="mx-auto max-w-7xl space-y-6"><header class="flex flex-wrap items-center justify-between gap-4"><div><p class="text-sm font-medium text-primary">مدیریت مالی</p><h1 class="mt-1 text-3xl font-extrabold text-secondary">کیف پول و تسویه</h1><p class="mt-2 text-sm text-gray-500">موجودی، برداشت و تاریخچه تراکنش‌های شما</p></div><div class="flex gap-2"><button type="button" (click)="openWithdrawal()" class="rounded-xl bg-primary px-5 py-2.5 font-bold text-white shadow-lg shadow-primary/20">درخواست برداشت</button><button type="button" (click)="load()" class="rounded-xl border border-primary px-4 py-2 font-bold text-primary">بازخوانی</button></div></header><p *ngIf="errorMessage" class="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{{ errorMessage }}</p><p *ngIf="successMessage" class="rounded-xl bg-green-50 px-4 py-3 text-sm text-green-700">{{ successMessage }}</p>
      <div *ngIf="loading" class="rounded-2xl bg-white p-12 text-center text-gray-500 shadow-card">در حال بارگذاری اطلاعات مالی…</div><ng-container *ngIf="!loading"><div class="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4"><div class="rounded-2xl bg-gradient-to-br from-secondary to-secondary-light p-5 text-white shadow-card"><span class="text-sm text-white/70">موجودی کل</span><strong class="mt-2 block text-2xl">{{ wallet?.totalBalance ?? 0 | persianNumber }} تومان</strong></div><div class="rounded-2xl bg-white p-5 shadow-card"><span class="text-sm text-gray-500">در انتظار</span><strong class="mt-2 block text-2xl text-orange-600">{{ wallet?.pendingAmount ?? 0 | persianNumber }} تومان</strong></div><div class="rounded-2xl bg-white p-5 shadow-card"><span class="text-sm text-gray-500">پرداخت‌شده</span><strong class="mt-2 block text-2xl text-blue-600">{{ wallet?.paidAmount ?? 0 | persianNumber }} تومان</strong></div><div class="rounded-2xl bg-gradient-to-br from-accent-success to-emerald-700 p-5 text-white shadow-card"><span class="text-sm text-white/70">قابل برداشت</span><strong class="mt-2 block text-2xl">{{ wallet?.availableForWithdrawal ?? 0 | persianNumber }} تومان</strong></div></div><div class="overflow-x-auto rounded-2xl bg-white p-6 shadow-card"><h2 class="mb-5 text-xl font-bold text-secondary">تاریخچه تراکنش‌ها</h2><table class="w-full min-w-[750px] text-right text-sm"><thead><tr class="border-b text-gray-500"><th class="p-3">تاریخ</th><th class="p-3">نوع</th><th class="p-3">شرح</th><th class="p-3">مبلغ</th><th class="p-3">وضعیت</th></tr></thead><tbody><tr *ngFor="let transaction of transactions" class="border-b last:border-0"><td class="p-3">{{ transaction.date | persianDate:'yyyy/MM/dd HH:mm' }}</td><td class="p-3">{{ transactionType(transaction.type) }}</td><td class="p-3">{{ transaction.description || '—' }}</td><td class="p-3 font-bold" [class.text-green-600]="transaction.amount >= 0" [class.text-red-600]="transaction.amount < 0">{{ transaction.amount | persianNumber }} تومان</td><td class="p-3"><span class="rounded-full bg-bg-muted px-3 py-1 text-xs">{{ transactionStatus(transaction.status) }}</span></td></tr></tbody></table><p *ngIf="!transactions.length" class="py-8 text-center text-gray-400">تراکنشی برای نمایش وجود ندارد.</p></div></ng-container>
      <div *ngIf="formOpen" class="fixed inset-0 z-50 flex items-center justify-center bg-secondary/50 p-4" (click)="closeWithdrawal()"><form [formGroup]="form" (ngSubmit)="requestWithdrawal()" (click)="$event.stopPropagation()" class="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl"><div class="flex items-center justify-between"><h2 class="text-xl font-bold text-secondary">درخواست برداشت وجه</h2><button type="button" (click)="closeWithdrawal()" class="text-2xl text-gray-400">×</button></div><div class="mt-5 space-y-4"><label class="block"><span class="mb-1 block text-sm font-medium text-secondary">مبلغ برداشت *</span><input formControlName="amount" type="number" min="1" [max]="wallet?.availableForWithdrawal ?? null" class="w-full rounded-xl border border-gray-300 px-4 py-2.5" /><small *ngIf="form.get('amount')?.touched && form.get('amount')?.invalid" class="text-red-600">مبلغ باید معتبر و کمتر از موجودی قابل برداشت باشد.</small></label><label class="block"><span class="mb-1 block text-sm font-medium text-secondary">شماره حساب/شبا *</span><input formControlName="bankAccount" class="w-full rounded-xl border border-gray-300 px-4 py-2.5" placeholder="IR… یا شماره حساب" /></label></div><p *ngIf="formError" class="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{{ formError }}</p><div class="mt-5 flex justify-end gap-3"><button type="button" (click)="closeWithdrawal()" class="rounded-xl border border-gray-300 px-5 py-2.5">انصراف</button><button type="submit" [disabled]="saving" class="rounded-xl bg-primary px-6 py-2.5 font-bold text-white disabled:opacity-50">{{ saving ? 'در حال ارسال…' : 'ثبت درخواست' }}</button></div></form></div>
    </section>
  `
})
export class SellerPayoutsComponent implements OnInit {
  wallet: WalletSummary | null = null;
  transactions: FinancialTransaction[] = [];
  form: FormGroup;
  loading = true;
  saving = false;
  formOpen = false;
  errorMessage = '';
  formError = '';
  successMessage = '';

  constructor(private readonly fb: FormBuilder, private readonly financialService: FinancialService) {
    this.form = this.fb.group({ amount: [null, [Validators.required, Validators.min(1)]], bankAccount: ['', Validators.required] });
  }

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading = true; this.errorMessage = '';
    let completed = 0;
    const finish = (): void => { completed += 1; if (completed === 2) this.loading = false; };
    this.financialService.getWallet().subscribe({ next: (result) => { this.wallet = result.data ?? null; finish(); }, error: (error: Error) => { this.errorMessage = error.message; finish(); } });
    this.financialService.getTransactions().subscribe({ next: (result) => { this.transactions = result.data ?? []; finish(); }, error: () => { this.transactions = []; finish(); } });
  }

  openWithdrawal(): void { this.form.reset({ amount: null, bankAccount: '' }); this.formError = ''; this.formOpen = true; }
  closeWithdrawal(): void { if (!this.saving) this.formOpen = false; }

  requestWithdrawal(): void {
    this.form.markAllAsTouched();
    const value = this.form.getRawValue();
    const available = this.wallet?.availableForWithdrawal ?? 0;
    if (this.form.invalid || Number(value.amount) > available) { this.formError = 'مبلغ برداشت معتبر نیست یا از موجودی قابل برداشت بیشتر است.'; return; }
    this.saving = true; this.formError = '';
    this.financialService.requestWithdrawal({ amount: Number(value.amount), bankAccount: String(value.bankAccount).trim() }).subscribe({ next: (result) => { this.saving = false; if (result.isSuccess) { this.formOpen = false; this.successMessage = 'درخواست برداشت با موفقیت ثبت شد.'; this.load(); } else this.formError = result.errorMessage ?? 'ثبت درخواست برداشت انجام نشد.'; }, error: (error: Error) => { this.saving = false; this.formError = error.message; } });
  }

  transactionType(type: string): string { return ({ Sale: 'فروش', Commission: 'کمیسیون', Withdrawal: 'برداشت', Payout: 'تسویه', Cost: 'هزینه' } as Record<string, string>)[type] ?? type; }
  transactionStatus(status: string): string { return ({ Pending: 'در انتظار', Processing: 'در حال پردازش', Completed: 'تکمیل‌شده', Failed: 'ناموفق' } as Record<string, string>)[status] ?? status; }
}
