import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

import { FinancialService, FinancialTransaction, WalletSummary } from '../../../../core/services/api/financial.service';

/** کیف پول و تسویه فروشنده — BEM + متریال (جانشین کلاس‌های Tailwind) */
@Component({
    selector: 'app-seller-payouts',
    styleUrls: ['./seller-payouts.component.scss'],
    template: `
    <section class="payouts" dir="rtl">
      <header class="payouts__header">
        <div>
          <p class="payouts__eyebrow">مدیریت مالی</p>
          <h1 class="payouts__title">کیف پول و تسویه</h1>
          <p class="payouts__subtitle">موجودی، برداشت و تاریخچه تراکنش‌های شما</p>
        </div>
        <div class="payouts__actions">
          <button type="button" mat-flat-button color="primary" (click)="openWithdrawal()">درخواست برداشت</button>
          <button type="button" mat-stroked-button color="primary" (click)="load()">بازخوانی</button>
        </div>
      </header>
    
      @if (errorMessage) {
        <p class="payouts__alert payouts__alert--error">{{ errorMessage }}</p>
      }
      @if (successMessage) {
        <p class="payouts__alert payouts__alert--success">{{ successMessage }}</p>
      }
    
      @if (loading) {
        <div class="payouts__loading">در حال بارگذاری اطلاعات مالی…</div>
      }
    
      @if (!loading) {
        <div class="payouts__cards">
          <div class="payouts__card payouts__card--primary">
            <span class="payouts__card-label">موجودی کل</span>
            <strong class="payouts__card-value">{{ wallet?.totalBalance ?? 0 | persianNumber }} تومان</strong>
          </div>
          <div class="payouts__card">
            <span class="payouts__card-label">در انتظار</span>
            <strong class="payouts__card-value payouts__card-value--warn">{{ wallet?.pendingAmount ?? 0 | persianNumber }} تومان</strong>
          </div>
          <div class="payouts__card">
            <span class="payouts__card-label">پرداخت‌شده</span>
            <strong class="payouts__card-value payouts__card-value--info">{{ wallet?.paidAmount ?? 0 | persianNumber }} تومان</strong>
          </div>
          <div class="payouts__card payouts__card--success">
            <span class="payouts__card-label">قابل برداشت</span>
            <strong class="payouts__card-value">{{ wallet?.availableForWithdrawal ?? 0 | persianNumber }} تومان</strong>
          </div>
        </div>
        <div class="payouts__table-card">
          <h2 class="payouts__section-title">تاریخچه تراکنش‌ها</h2>
          <div class="payouts__table-wrap">
            <table class="payouts__table">
              <thead>
                <tr><th>تاریخ</th><th>نوع</th><th>شرح</th><th>مبلغ</th><th>وضعیت</th></tr>
              </thead>
              <tbody>
                @for (transaction of transactions; track transaction) {
                  <tr>
                    <td>{{ transaction.date | persianDate:'yyyy/MM/dd HH:mm' }}</td>
                    <td>{{ transactionType(transaction.type) }}</td>
                    <td>{{ transaction.description || '—' }}</td>
                    <td class="payouts__amount" [class.payouts__amount--neg]="transaction.amount < 0">
                      {{ transaction.amount | persianNumber }} تومان
                    </td>
                    <td><span class="payouts__status-chip">{{ transactionStatus(transaction.status) }}</span></td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
          @if (!transactions.length) {
            <p class="payouts__empty">تراکنشی برای نمایش وجود ندارد.</p>
          }
        </div>
      }
    
      <!-- مودال درخواست برداشت -->
      @if (formOpen) {
        <div class="payouts__modal-overlay" (click)="closeWithdrawal()">
          <form [formGroup]="form" (ngSubmit)="requestWithdrawal()" (click)="$event.stopPropagation()" class="payouts__modal">
            <div class="payouts__modal-head">
              <h2 class="payouts__modal-title">درخواست برداشت وجه</h2>
              <button type="button" class="payouts__modal-close" (click)="closeWithdrawal()" aria-label="بستن">×</button>
            </div>
            <label class="payouts__field">
              <span class="payouts__field-label">مبلغ برداشت *</span>
              <input formControlName="amount" type="number" min="1" [max]="wallet?.availableForWithdrawal ?? null" class="payouts__input" />
              @if (form.get('amount')?.touched && form.get('amount')?.invalid) {
                <small class="payouts__field-error">
                  مبلغ باید معتبر و کمتر از موجودی قابل برداشت باشد.
                </small>
              }
            </label>
            <label class="payouts__field">
              <span class="payouts__field-label">شماره حساب/شبا *</span>
              <input formControlName="bankAccount" class="payouts__input" placeholder="IR… یا شماره حساب" />
            </label>
            @if (formError) {
              <p class="payouts__alert payouts__alert--error">{{ formError }}</p>
            }
            <div class="payouts__modal-actions">
              <button type="button" mat-stroked-button (click)="closeWithdrawal()">انصراف</button>
              <button type="submit" mat-flat-button color="primary" [disabled]="saving">
                {{ saving ? 'در حال ارسال…' : 'ثبت درخواست' }}
              </button>
            </div>
          </form>
        </div>
      }
    </section>
    `,
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
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
