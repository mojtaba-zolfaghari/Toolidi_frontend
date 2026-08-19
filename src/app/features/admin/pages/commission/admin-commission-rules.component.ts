import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Observable } from 'rxjs';

import { AdminProduct, AdminSeller, AdminService } from '../../../../core/services/api/admin.service';
import { Category, CategoryService } from '../../../../core/services/api/category.service';
import { CommissionRule, CommissionRuleData, FinancialService } from '../../../../core/services/api/financial.service';
import { Result } from '../../../../core/models/api-response.model';

@Component({
  selector: 'app-admin-commission-rules',
  template: `
    <section dir="rtl" class="mx-auto max-w-7xl space-y-6"><header class="flex flex-wrap items-center justify-between gap-4"><div><p class="text-sm font-medium text-primary">مدیریت مالی</p><h1 class="mt-1 text-3xl font-extrabold text-secondary">قوانین کمیسیون</h1><p class="mt-2 text-sm text-gray-500">تعیین نرخ کمیسیون برای فروشنده، دسته‌بندی یا محصول</p></div><button type="button" (click)="openCreate()" class="rounded-xl bg-primary px-5 py-2.5 font-bold text-white shadow-lg shadow-primary/20">افزودن قانون کمیسیون</button></header><p *ngIf="errorMessage" class="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{{ errorMessage }}</p><p *ngIf="successMessage" class="rounded-xl bg-green-50 px-4 py-3 text-sm text-green-700">{{ successMessage }}</p>
      <div class="overflow-x-auto rounded-2xl bg-white shadow-card"><div *ngIf="loading" class="p-12 text-center text-gray-500">در حال بارگذاری قوانین…</div><table *ngIf="!loading" class="w-full min-w-[950px] text-right text-sm"><thead><tr class="border-b bg-gray-50 text-gray-500"><th class="p-4">فروشنده</th><th class="p-4">دسته‌بندی</th><th class="p-4">محصول</th><th class="p-4">نرخ (%)</th><th class="p-4">مبلغ ثابت</th><th class="p-4">شروع</th><th class="p-4">پایان</th><th class="p-4">عملیات</th></tr></thead><tbody><tr *ngFor="let rule of rules" class="border-b last:border-0"><td class="p-4 font-bold text-secondary">{{ sellerName(rule.sellerId) }}</td><td class="p-4">{{ categoryName(rule.categoryId) }}</td><td class="p-4">{{ productName(rule.productId) }}</td><td class="p-4">{{ rule.commissionRate | number:'1.0-2' }}٪</td><td class="p-4">{{ rule.fixedAmount ?? 0 | number }} تومان</td><td class="p-4">{{ rule.startDate ? (rule.startDate | date:'yyyy/MM/dd') : '—' }}</td><td class="p-4">{{ rule.endDate ? (rule.endDate | date:'yyyy/MM/dd') : '—' }}</td><td class="p-4"><div class="flex gap-3"><button type="button" (click)="openEdit(rule)" class="font-bold text-primary hover:underline">ویرایش</button><button type="button" (click)="remove(rule)" class="font-bold text-red-600 hover:underline">حذف</button></div></td></tr></tbody></table><p *ngIf="!loading && !rules.length" class="p-10 text-center text-gray-400">قانونی برای نمایش وجود ندارد.</p></div>
      <div *ngIf="formOpen" class="fixed inset-0 z-50 flex items-center justify-center bg-secondary/50 p-4" (click)="closeForm()"><form [formGroup]="form" (ngSubmit)="save()" (click)="$event.stopPropagation()" class="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl"><div class="flex items-center justify-between"><h2 class="text-xl font-bold text-secondary">{{ editingId ? 'ویرایش قانون کمیسیون' : 'افزودن قانون کمیسیون' }}</h2><button type="button" (click)="closeForm()" class="text-2xl text-gray-400">×</button></div><div class="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2"><label><span class="mb-1 block text-sm font-medium text-secondary">فروشنده *</span><select formControlName="sellerId" class="w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5"><option value="">انتخاب فروشنده</option><option *ngFor="let seller of sellers" [value]="seller.id">{{ seller.companyName }}</option></select></label><label><span class="mb-1 block text-sm font-medium text-secondary">دسته‌بندی</span><select formControlName="categoryId" class="w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5"><option value="">همه دسته‌بندی‌ها</option><option *ngFor="let category of categories" [value]="category.id">{{ category.name }}</option></select></label><label class="md:col-span-2"><span class="mb-1 block text-sm font-medium text-secondary">محصول</span><select formControlName="productId" class="w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5"><option value="">همه محصولات</option><option *ngFor="let product of products" [value]="product.id">{{ product.name }} — {{ product.sku }}</option></select></label><label><span class="mb-1 block text-sm font-medium text-secondary">نرخ کمیسیون (%) *</span><input formControlName="commissionRate" type="number" min="0" max="100" class="w-full rounded-xl border border-gray-300 px-4 py-2.5" /></label><label><span class="mb-1 block text-sm font-medium text-secondary">مبلغ ثابت</span><input formControlName="fixedAmount" type="number" min="0" class="w-full rounded-xl border border-gray-300 px-4 py-2.5" /></label><label><span class="mb-1 block text-sm font-medium text-secondary">تاریخ شروع</span><input formControlName="startDate" type="date" class="w-full rounded-xl border border-gray-300 px-4 py-2.5" /></label><label><span class="mb-1 block text-sm font-medium text-secondary">تاریخ پایان</span><input formControlName="endDate" type="date" class="w-full rounded-xl border border-gray-300 px-4 py-2.5" /></label></div><p *ngIf="formError" class="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{{ formError }}</p><div class="mt-5 flex justify-end gap-3"><button type="button" (click)="closeForm()" class="rounded-xl border border-gray-300 px-5 py-2.5">انصراف</button><button type="submit" [disabled]="saving" class="rounded-xl bg-primary px-6 py-2.5 font-bold text-white disabled:opacity-50">{{ saving ? 'در حال ذخیره…' : 'ذخیره' }}</button></div></form></div>
    </section>
  `
})
export class AdminCommissionRulesComponent implements OnInit {
  rules: CommissionRule[] = [];
  sellers: AdminSeller[] = [];
  categories: Category[] = [];
  products: AdminProduct[] = [];
  form: FormGroup;
  formOpen = false;
  editingId: string | null = null;
  loading = true;
  saving = false;
  errorMessage = '';
  successMessage = '';
  formError = '';

  constructor(private readonly fb: FormBuilder, private readonly financialService: FinancialService, private readonly adminService: AdminService, private readonly categoryService: CategoryService) {
    this.form = this.fb.group({
      sellerId: ['', Validators.required], categoryId: [''], productId: [''],
      commissionRate: [0, [Validators.required, Validators.min(0), Validators.max(100)]], fixedAmount: [null, Validators.min(0)],
      startDate: [''], endDate: ['']
    });
  }

  ngOnInit(): void {
    this.loadRules();
    this.adminService.getSellers({ page: 1, pageSize: 100 }).subscribe({ next: (result) => this.sellers = result.data?.items ?? [], error: () => this.sellers = [] });
    this.adminService.getAdminProducts({ page: 1, pageSize: 100 }).subscribe({ next: (result) => this.products = result.data?.items ?? [], error: () => this.products = [] });
    this.categoryService.getCategories().subscribe({ next: (result) => this.categories = result.items ?? [], error: () => this.categories = [] });
  }

  loadRules(): void {
    this.loading = true;
    this.financialService.getCommissionRules().subscribe({ next: (result) => { this.rules = result.data ?? []; this.loading = false; }, error: (error: Error) => { this.errorMessage = error.message; this.loading = false; } });
  }

  openCreate(): void { this.editingId = null; this.form.reset({ sellerId: '', categoryId: '', productId: '', commissionRate: 0, fixedAmount: null, startDate: '', endDate: '' }); this.formError = ''; this.formOpen = true; }

  openEdit(rule: CommissionRule): void { this.editingId = rule.id; this.form.patchValue({ sellerId: rule.sellerId, categoryId: rule.categoryId ?? '', productId: rule.productId ?? '', commissionRate: rule.commissionRate, fixedAmount: rule.fixedAmount ?? null, startDate: this.dateInput(rule.startDate), endDate: this.dateInput(rule.endDate) }); this.formError = ''; this.formOpen = true; }

  closeForm(): void { if (!this.saving) this.formOpen = false; }

  save(): void {
    this.form.markAllAsTouched();
    const value = this.form.getRawValue();
    if (this.form.invalid) { this.formError = 'فروشنده و نرخ کمیسیون را صحیح وارد کنید.'; return; }
    if (value.startDate && value.endDate && value.endDate < value.startDate) { this.formError = 'تاریخ پایان باید بعد از تاریخ شروع باشد.'; return; }
    const data: CommissionRuleData = { sellerId: value.sellerId, categoryId: value.categoryId || undefined, productId: value.productId || undefined, commissionRate: Number(value.commissionRate), fixedAmount: value.fixedAmount == null ? undefined : Number(value.fixedAmount), startDate: value.startDate ? new Date(`${value.startDate}T00:00:00`).toISOString() : undefined, endDate: value.endDate ? new Date(`${value.endDate}T23:59:59`).toISOString() : undefined };
    const request: Observable<Result<unknown>> = this.editingId ? this.financialService.updateCommissionRule(this.editingId, data) : this.financialService.createCommissionRule(data);
    this.saving = true; this.formError = '';
    request.subscribe({ next: (result) => { this.saving = false; if (result.isSuccess) { this.formOpen = false; this.successMessage = this.editingId ? 'قانون کمیسیون ویرایش شد.' : 'قانون کمیسیون ایجاد شد.'; this.loadRules(); } else this.formError = result.errorMessage ?? 'ذخیره قانون انجام نشد.'; }, error: (error: Error) => { this.saving = false; this.formError = error.message; } });
  }

  remove(rule: CommissionRule): void { if (!window.confirm('آیا از حذف این قانون کمیسیون مطمئن هستید؟')) return; this.financialService.deleteCommissionRule(rule.id).subscribe({ next: (result) => { if (result.isSuccess) { this.successMessage = 'قانون کمیسیون حذف شد.'; this.loadRules(); } else this.errorMessage = result.errorMessage ?? 'حذف قانون انجام نشد.'; }, error: (error: Error) => this.errorMessage = error.message }); }

  sellerName(id: string): string { return this.sellers.find((seller) => seller.id === id)?.companyName ?? id; }
  categoryName(id?: string): string { return id ? this.categories.find((category) => category.id === id)?.name ?? id : 'همه'; }
  productName(id?: string): string { return id ? this.products.find((product) => product.id === id)?.name ?? id : 'همه'; }
  private dateInput(value?: string): string { return value ? value.slice(0, 10) : ''; }
}
