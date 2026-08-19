import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { forkJoin } from 'rxjs';

import { SettingsService, SiteSetting } from '../../../../core/services/api/settings.service';

interface SettingField { key: string; control: string; label: string; type: 'text' | 'number' | 'checkbox'; }

@Component({
  selector: 'app-admin-settings',
  template: `
    <section dir="rtl" class="mx-auto max-w-5xl space-y-6"><header class="flex flex-wrap items-center justify-between gap-4"><div><p class="text-sm font-medium text-primary">مدیریت سامانه</p><h1 class="mt-1 text-3xl font-extrabold text-secondary">تنظیمات</h1><p class="mt-2 text-sm text-gray-500">نرخ مالیات و اطلاعات درگاه‌های پرداخت</p></div><button type="button" (click)="loadSettings()" class="rounded-xl border border-primary px-4 py-2 text-sm font-bold text-primary hover:bg-bg-muted">بازخوانی</button></header><p *ngIf="errorMessage" class="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{{ errorMessage }}</p><p *ngIf="successMessage" class="rounded-xl bg-green-50 px-4 py-3 text-sm text-green-700">{{ successMessage }}</p>
      <form [formGroup]="form" (ngSubmit)="save()" class="space-y-6 rounded-2xl bg-white p-6 shadow-card"><div *ngIf="loading" class="py-8 text-center text-gray-500">در حال بارگذاری تنظیمات…</div><ng-container *ngIf="!loading"><div class="grid grid-cols-1 gap-4 md:grid-cols-2"><ng-container *ngFor="let field of fields"><label *ngIf="field.type !== 'checkbox'" class="block"><span class="mb-1 block text-sm font-medium text-secondary">{{ field.label }}</span><input [formControlName]="field.control" [type]="field.type" [min]="field.type === 'number' ? 0 : null" [max]="field.type === 'number' ? 100 : null" class="w-full rounded-xl border border-gray-300 px-4 py-2.5" /><small *ngIf="form.get(field.control)?.invalid && form.get(field.control)?.touched" class="text-red-600">مقدار واردشده معتبر نیست.</small></label><label *ngIf="field.type === 'checkbox'" class="flex items-center gap-3 rounded-xl border border-gray-200 px-4 py-3 text-sm font-medium text-secondary"><input [formControlName]="field.control" type="checkbox" class="h-4 w-4 accent-primary" />{{ field.label }}</label></ng-container></div><div class="rounded-xl bg-bg-muted p-4 text-sm text-gray-600"><p class="font-bold text-secondary">نکته</p><p class="mt-1">تغییرات درگاه‌ها و نرخ مالیات پس از ذخیره در تنظیمات سامانه اعمال می‌شوند. روش‌های ارسال از تنظیمات سرویس حمل‌ونقل مدیریت می‌شوند.</p></div><div class="flex justify-end"><button type="submit" [disabled]="saving" class="rounded-xl bg-primary px-7 py-2.5 font-bold text-white shadow-lg shadow-primary/20 disabled:opacity-50">{{ saving ? 'در حال ذخیره…' : 'ذخیره تنظیمات' }}</button></div></ng-container></form>
    </section>
  `
})
export class AdminSettingsComponent implements OnInit {
  form: FormGroup;
  loading = true;
  saving = false;
  errorMessage = '';
  successMessage = '';
  readonly fields: SettingField[] = [
    { key: 'TaxRate', control: 'taxRate', label: 'نرخ مالیات (٪)', type: 'number' },
    { key: 'Payment.ZarinPal.MerchantId', control: 'zarinpalMerchantId', label: 'شناسه مرچنت زرین‌پال', type: 'text' },
    { key: 'Payment.ZarinPal.IsSandbox', control: 'zarinpalSandbox', label: 'زرین‌پال در حالت آزمایشی است', type: 'checkbox' },
    { key: 'Payment.SEP.TerminalId', control: 'sepTerminalId', label: 'شناسه ترمینال SEP', type: 'text' },
    { key: 'Payment.SEP.MerchantId', control: 'sepMerchantId', label: 'شناسه مرچنت SEP', type: 'text' },
    { key: 'Payment.SEP.IsSandbox', control: 'sepSandbox', label: 'SEP در حالت آزمایشی است', type: 'checkbox' }
  ];

  constructor(private readonly fb: FormBuilder, private readonly settingsService: SettingsService) {
    this.form = this.fb.group({
      taxRate: [9, [Validators.required, Validators.min(0), Validators.max(100)]],
      zarinpalMerchantId: [''], zarinpalSandbox: [true],
      sepTerminalId: [''], sepMerchantId: [''], sepSandbox: [true]
    });
  }

  ngOnInit(): void { this.loadSettings(); }

  loadSettings(): void {
    this.loading = true;
    this.errorMessage = '';
    this.settingsService.getSettings().subscribe({
      next: (result) => { this.applySettings(result.data ?? []); this.loading = false; },
      error: (error: Error) => { this.errorMessage = error.message; this.loading = false; }
    });
  }

  save(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) { this.errorMessage = 'لطفاً مقادیر تنظیمات را بررسی کنید.'; return; }
    this.saving = true;
    this.errorMessage = '';
    const values = this.form.getRawValue();
    const requests = this.fields.map((field) => this.settingsService.updateSetting(field.key, this.toApiValue(field, values[field.control])));
    forkJoin(requests).subscribe({
      next: (results) => { this.saving = false; const failed = results.find((result) => !result.isSuccess); this.successMessage = failed ? '' : 'تنظیمات با موفقیت ذخیره شد.'; if (failed) this.errorMessage = failed.errorMessage ?? 'ذخیره تنظیمات انجام نشد.'; },
      error: (error: Error) => { this.saving = false; this.errorMessage = error.message; }
    });
  }

  private applySettings(settings: SiteSetting[]): void {
    const values: Record<string, string> = {};
    for (const setting of settings) values[setting.key] = setting.value;
    this.form.patchValue({
      taxRate: this.numberValue(values['TaxRate'], 9),
      zarinpalMerchantId: values['Payment.ZarinPal.MerchantId'] ?? '',
      zarinpalSandbox: this.booleanValue(values['Payment.ZarinPal.IsSandbox'], true),
      sepTerminalId: values['Payment.SEP.TerminalId'] ?? '',
      sepMerchantId: values['Payment.SEP.MerchantId'] ?? '',
      sepSandbox: this.booleanValue(values['Payment.SEP.IsSandbox'], true)
    });
  }

  private toApiValue(field: SettingField, value: unknown): string { return field.type === 'checkbox' ? String(!!value).toLowerCase() : String(value ?? ''); }
  private numberValue(value: string | undefined, fallback: number): number { const parsed = Number(value); return Number.isFinite(parsed) ? parsed : fallback; }
  private booleanValue(value: string | undefined, fallback: boolean): boolean { return value === undefined ? fallback : value.toLowerCase() === 'true'; }
}
