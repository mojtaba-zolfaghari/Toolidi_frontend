import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { forkJoin } from 'rxjs';

import { Category, CategoryService } from '../../../../core/services/api/category.service';
import {
  AdminProduct,
  AdminService,
} from '../../../../core/services/api/admin.service';
import {
  MarkupScope,
  SettingsService,
  SettingsTabs,
} from '../../../../core/services/api/settings.service';

/** یکی از تب‌های صفحه تنظیمات */
export type SettingsTab = 'basic' | 'payment' | 'sms' | 'markup';

interface SettingField { key: string; control: string; label: string; type: 'text' | 'number' | 'checkbox'; }

/** فیلدهای تب پایه (کلیدهای SiteSetting) */
const BASIC_FIELDS: SettingField[] = [
  { key: 'TaxRate', control: 'taxRate', label: 'نرخ مالیات (٪)', type: 'number' }
];

/** فیلدهای تب پرداخت — همان کلیدهایی که درگاه‌های واقعی می‌خوانند */
const PAYMENT_FIELDS: SettingField[] = [
  { key: 'Payment.ZarinPal.MerchantId', control: 'zarinpalMerchantId', label: 'شناسه مرچنت زرین‌پال', type: 'text' },
  { key: 'Payment.ZarinPal.IsSandbox', control: 'zarinpalSandbox', label: 'زرین‌پال در حالت آزمایشی', type: 'checkbox' },
  { key: 'Payment.SEP.TerminalId', control: 'sepTerminalId', label: 'شناسه ترمینال سپ', type: 'text' },
  { key: 'Payment.SEP.MerchantId', control: 'sepMerchantId', label: 'شناسه مرچنت سپ', type: 'text' },
  { key: 'Payment.SEP.IsSandbox', control: 'sepSandbox', label: 'سپ در حالت آزمایشی', type: 'checkbox' }
];

/** فیلدهای تب پیامک — همان کلیدهایی که SmsServiceFactory می‌خواند */
const SMS_FIELDS: SettingField[] = [
  { key: 'SMS:Provider', control: 'smsProvider', label: 'سرویس‌دهنده (kavenegar / smsir)', type: 'text' },
  { key: 'SMS:ApiKey', control: 'smsApiKey', label: 'کلید API', type: 'text' },
  { key: 'SMS:SenderNumber', control: 'smsSenderNumber', label: 'شماره فرستنده', type: 'text' },
  { key: 'SMS:OrderStatusEnabled', control: 'smsOrderStatusEnabled', label: 'اطلاع‌رسانی وضعیت سفارش با پیامک', type: 'checkbox' }
];

/**
 * صفحه تنظیمات ادمین با تب‌های پایه/پرداخت/پیامک/حاشیه سود.
 * خواندن از API تب‌بندی‌شده، ذخیره از طریق upsert کلید-مقدار.
 */
@Component({
  selector: 'app-admin-settings',
  templateUrl: './admin-settings.component.html',
  styleUrls: ['./admin-settings.component.scss']
})
export class AdminSettingsComponent implements OnInit {
  activeTab: SettingsTab = 'basic';
  activeTabIndex = 0;
  readonly tabs: { id: SettingsTab; label: string; icon: string }[] = [
    { id: 'basic', label: 'پایه', icon: 'settings' },
    { id: 'payment', label: 'پرداخت', icon: 'payments' },
    { id: 'sms', label: 'پیامک', icon: 'sms' },
    { id: 'markup', label: 'حاشیه سود', icon: 'trending_up' }
  ];

  readonly headerActions: Array<{ label: string; click: () => void }> = [
    { label: 'بازخوانی', click: () => this.loadSettings() },
  ];

  loading = true;
  saving = false;
  testing = false;
  smsTestMessage = '';
  smsTestSuccess = false;
  errorMessage = '';
  successMessage = '';

  /** حاشیه سود جهانی */
  globalMarkup = 0;
  /** درصدهای سطح دسته‌بندی (کلید = شناسه دسته) */
  categoryMarkups: { categoryId: string; categoryName: string; percent: number }[] = [];
  /** درصدهای سطح محصول (کلید = شناسه محصول) */
  productMarkups: { productId: string; productName: string; percent: number }[] = [];

  markupCategory = '';
  markupCategoryPercent = 0;
  markupProduct = '';
  markupProductPercent = 0;

  categories: Category[] = [];
  productSearch = '';
  productResults: AdminProduct[] = [];
  searchingProducts = false;
  private searchTimer: ReturnType<typeof setTimeout> | null = null;

  form: FormGroup;
  private readonly fields: SettingField[] = [...BASIC_FIELDS, ...PAYMENT_FIELDS, ...SMS_FIELDS];

  constructor(
    private readonly fb: FormBuilder,
    private readonly settingsService: SettingsService,
    private readonly categoryService: CategoryService,
    private readonly adminService: AdminService
  ) {
    this.form = this.fb.group({
      taxRate: [9, [Validators.required, Validators.min(0), Validators.max(100)]],
      zarinpalMerchantId: [''], zarinpalSandbox: [true],
      sepTerminalId: [''], sepMerchantId: [''], sepSandbox: [true],
      smsProvider: ['kavenegar'], smsApiKey: [''], smsSenderNumber: [''],
      smsOrderStatusEnabled: [true],
      globalMarkup: [0, [Validators.min(0), Validators.max(200)]]
    });
  }

  ngOnInit(): void {
    this.loadSettings();
    this.loadCategories();
  }

  selectTab(tab: SettingsTab): void {
    this.activeTab = tab;
    this.activeTabIndex = this.tabs.findIndex((t) => t.id === tab);
    this.clearMessages();
  }

  /** mat-tab-group ↔ state sync */
  onTabIndexChange(index: number): void {
    this.activeTabIndex = index;
    this.activeTab = this.tabs[index]?.id ?? 'basic';
    this.clearMessages();
  }

  /** نمایش نام محصول در فیلد autocomplete پس از انتخاب */
  displayProduct(product: AdminProduct): string {
    return product ? product.name : '';
  }

  private clearMessages(): void {
    this.errorMessage = '';
    this.successMessage = '';
    this.smsTestMessage = '';
  }

  private loadCategories(): void {
    this.categoryService.getCategories().subscribe({
      next: (page) => { this.categories = page.items ?? []; },
      error: () => { this.categories = []; }
    });
  }

  loadSettings(): void {
    this.loading = true;
    this.errorMessage = '';
    this.settingsService.getTabs().subscribe({
      next: (result) => {
        if (result.isSuccess && result.data) this.applyTabs(result.data);
        else this.errorMessage = result.errorMessage ?? 'خواندن تنظیمات انجام نشد.';
        this.loading = false;
      },
      error: (error: Error) => { this.errorMessage = error.message; this.loading = false; }
    });
  }

  save(): void {
    this.form.markAllAsTouched();
    if (this.form.get('taxRate')?.invalid || this.form.get('globalMarkup')?.invalid) {
      this.errorMessage = 'لطفاً مقادیر تنظیمات را بررسی کنید.';
      return;
    }
    this.saving = true;
    this.errorMessage = '';
    const values = this.form.getRawValue();

    const requests = this.fields.map((field) =>
      this.settingsService.updateSetting(field.key, this.toApiValue(field, values[field.control])));
    requests.push(this.settingsService.updateSetting('Pricing.GlobalMarkupPercent', String(values['globalMarkup'] ?? 0)));
    for (const cm of this.categoryMarkups)
      requests.push(this.settingsService.updateSetting(`Pricing.CategoryMarkupPercent.${cm.categoryId}`, String(cm.percent)));
    for (const pm of this.productMarkups)
      requests.push(this.settingsService.updateSetting(`Pricing.ProductMarkupPercent.${pm.productId}`, String(pm.percent)));

    forkJoin(requests).subscribe({
      next: (results) => {
        this.saving = false;
        const failed = results.find((result) => !result.isSuccess);
        if (failed) this.errorMessage = failed.errorMessage ?? 'ذخیره تنظیمات انجام نشد.';
        else this.successMessage = 'تنظیمات با موفقیت ذخیره شد.';
      },
      error: (error: Error) => { this.saving = false; this.errorMessage = error.message; }
    });
  }

  testSms(): void {
    const provider = String(this.form.get('smsProvider')?.value ?? '').trim();
    const apiKey = String(this.form.get('smsApiKey')?.value ?? '').trim();
    if (!apiKey) { this.smsTestSuccess = false; this.smsTestMessage = 'ابتدا کلید API را ذخیره کنید.'; return; }
    const mobile = window.prompt('شماره موبایل برای دریافت پیامک آزمایشی:', '');
    if (!mobile) return;

    this.testing = true;
    this.smsTestMessage = '';
    // Save the SMS settings first so the test uses the latest values.
    const saves = SMS_FIELDS.map((field) =>
      this.settingsService.updateSetting(field.key, this.toApiValue(field, this.form.getRawValue()[field.control])));
    forkJoin(saves).subscribe({
      next: () => this.settingsService.testSms(mobile).subscribe({
        next: (result) => {
          this.testing = false;
          this.smsTestSuccess = result.isSuccess;
          this.smsTestMessage = result.isSuccess
            ? 'پیامک آزمایشی ارسال شد.'
            : (result.errorMessage ?? 'ارسال پیام آزمایشی ناموفق بود.');
        },
        error: (error: Error) => { this.testing = false; this.smsTestSuccess = false; this.smsTestMessage = error.message; }
      }),
      error: (error: Error) => { this.testing = false; this.smsTestSuccess = false; this.smsTestMessage = error.message; }
    });
    void provider;
  }

  addCategoryMarkup(): void {
    if (!this.markupCategory) return;
    const existing = this.categoryMarkups.find((c) => c.categoryId === this.markupCategory);
    const name = this.categories.find((c) => c.id === this.markupCategory)?.name ?? this.markupCategory;
    if (existing) existing.percent = this.markupCategoryPercent;
    else this.categoryMarkups.push({ categoryId: this.markupCategory, categoryName: name, percent: this.markupCategoryPercent });
    this.markupCategory = '';
    this.markupCategoryPercent = 0;
  }

  removeCategoryMarkup(categoryId: string): void {
    this.categoryMarkups = this.categoryMarkups.filter((c) => c.categoryId !== categoryId);
  }

  searchProducts(): void {
    const term = this.productSearch.trim();
    if (term.length < 2) { this.productResults = []; return; }
    if (this.searchTimer) clearTimeout(this.searchTimer);
    this.searchTimer = setTimeout(() => {
      this.searchingProducts = true;
      this.adminService.getAdminProducts({ search: term, page: 1, pageSize: 8 }).subscribe({
        next: (result) => {
          this.productResults = result.data?.items ?? [];
          this.searchingProducts = false;
        },
        error: () => { this.searchingProducts = false; }
      });
    }, 300);
  }

  addProductMarkup(product: AdminProduct): void {
    if (!product || this.productMarkups.some((p) => p.productId === product.id)) return;
    this.productMarkups.push({ productId: product.id, productName: product.name, percent: this.markupProductPercent });
    this.productResults = this.productResults.filter((p) => p.id !== product.id);
    this.productSearch = '';
    this.markupProductPercent = 0;
  }

  removeProductMarkup(productId: string): void {
    this.productMarkups = this.productMarkups.filter((p) => p.productId !== productId);
  }

  trackScope(index: number, scope: MarkupScope): string { return scope.scopeId; }

  private applyTabs(tabs: SettingsTabs): void {
    this.form.patchValue({
      taxRate: Number(tabs.basic.taxRate) || 9,
      zarinpalMerchantId: tabs.payment.zarinPalMerchantId,
      zarinpalSandbox: tabs.payment.zarinPalIsSandbox,
      sepTerminalId: tabs.payment.sepTerminalId,
      sepMerchantId: tabs.payment.sepMerchantId,
      sepSandbox: tabs.payment.sepIsSandbox,
      smsProvider: tabs.sms.provider || 'kavenegar',
      smsApiKey: tabs.sms.apiKey,
      smsSenderNumber: tabs.sms.senderNumber,
      smsOrderStatusEnabled: tabs.sms.orderStatusEnabled,
      globalMarkup: tabs.markup.globalPercent
    });
    this.globalMarkup = tabs.markup.globalPercent;
    const catNames = new Map(this.categories.map((c) => [c.id, c.name]));
    this.categoryMarkups = tabs.markup.categoryPercents.map((scope) => ({
      categoryId: scope.scopeId,
      categoryName: catNames.get(scope.scopeId) ?? scope.scopeId,
      percent: scope.percent
    }));
    this.productMarkups = tabs.markup.productPercents.map((scope) => ({
      productId: scope.scopeId,
      productName: scope.scopeId,
      percent: scope.percent
    }));
  }

  private toApiValue(field: SettingField, value: unknown): string {
    return field.type === 'checkbox' ? String(!!value).toLowerCase() : String(value ?? '');
  }
}
