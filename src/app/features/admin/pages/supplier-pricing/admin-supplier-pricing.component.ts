import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { PersianNumberPipe } from '../../../../shared/persian-number.pipe';
import { Subject, Subscription } from 'rxjs';
import { debounceTime } from 'rxjs/operators';

import {
  AdminService,
  AdminSupplierPricingEntry,
  PricingSettings,
  SitePricePreview,
  CategoryMarginOverride,
  ProductMarginOverride,
  AdminSupplier
} from '../../../../core/services/api/admin.service';
import { Category, CategoryService } from '../../../../core/services/api/category.service';

/**
 * صفحه مدیریت قیمت‌گذاری تأمین‌کنندگان:
 * ۱) فهرست همه رکوردهای قیمت با قیمت سایت محاسبه‌شده (فیلتر تأمین‌کننده/جستجو)
 * ۲) ویرایش تنظیمات حاشیه سود جهانی، مالیات شرکت و ارزش افزوده + override دسته‌بندی/محصول
 * ۳) پیش‌نمایش زنده‌ی قیمت سایت از روی قیمت تأمین‌کننده
 */
@Component({
  selector: 'app-admin-supplier-pricing',
  standalone: true,
  imports: [CommonModule, FormsModule, PersianNumberPipe],
  template: `
    <div class="p-6 space-y-6" dir="rtl">
      <!-- Header -->
      <div class="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 class="text-2xl font-extrabold text-secondary">قیمت‌گذاری تأمین‌کنندگان</h1>
          <p class="text-sm text-gray-500 mt-1">
            قیمت پایه تأمین‌کننده + حاشیه سود − مالیات و ارزش افزوده = قیمت سایت
          </p>
        </div>
        <div class="flex gap-2">
          <button (click)="openSettings()" class="rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-bold text-secondary hover:bg-gray-50">
            ⚙️ تنظیمات قیمت‌گذاری
          </button>
          <button (click)="load()" [disabled]="loading" class="rounded-xl bg-primary px-4 py-2 text-sm font-bold text-white hover:opacity-90 disabled:opacity-40">
            🔄 بازخوانی
          </button>
        </div>
      </div>

      <!-- Alerts -->
      <p *ngIf="errorMessage" class="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{{ errorMessage }}</p>
      <p *ngIf="successMessage" class="rounded-xl bg-green-50 px-4 py-3 text-sm text-green-700">{{ successMessage }}</p>

      <!-- Filters -->
      <div class="flex flex-wrap items-center gap-3 rounded-2xl border border-gray-100 bg-white p-4">
        <input type="text" [(ngModel)]="searchQuery" (ngModelChange)="search$.next($event)"
               placeholder="جستجوی محصول، SKU یا تأمین‌کننده…"
               class="flex-1 min-w-[220px] rounded-xl border border-gray-200 px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
        <select [(ngModel)]="supplierFilter" (ngModelChange)="applyFilters()"
                class="rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30">
          <option value="">همه تأمین‌کنندگان</option>
          <option *ngFor="let s of suppliers" [value]="s.id">{{ s.name }}</option>
        </select>
        <span class="text-xs text-gray-400">{{ filtered.length }} رکورد</span>
      </div>

      <!-- List -->
      <div class="overflow-x-auto rounded-2xl border border-gray-100 bg-white">
        <table class="w-full text-right text-sm">
          <thead class="bg-gray-50 text-xs text-gray-500">
            <tr>
              <th class="px-4 py-3 font-bold">محصول</th>
              <th class="px-4 py-3 font-bold">تأمین‌کننده</th>
              <th class="px-4 py-3 font-bold">قیمت تأمین</th>
              <th class="px-4 py-3 font-bold">حاشیه مؤثر</th>
              <th class="px-4 py-3 font-bold">قیمت سایت</th>
              <th class="px-4 py-3 font-bold">موجودی</th>
              <th class="px-4 py-3 font-bold">وضعیت</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let row of filtered" class="border-t border-gray-50 hover:bg-gray-50/60">
              <td class="px-4 py-3">
                <p class="font-bold text-secondary">{{ row.productName || '—' }}</p>
                <p class="text-xs text-gray-400">{{ row.sku }}</p>
              </td>
              <td class="px-4 py-3 text-gray-600">{{ row.supplierName || '—' }}</td>
              <td class="px-4 py-3 font-mono">{{ row.supplyPrice | persianNumber }}</td>
              <td class="px-4 py-3">
                <span class="rounded-full px-2 py-0.5 text-xs font-bold"
                      [class.bg-indigo-50]="!row.profitMarginPercent"
                      [class.text-indigo-600]="!row.profitMarginPercent"
                      [class.bg-amber-50]="row.profitMarginPercent > 0"
                      [class.text-amber-600]="row.profitMarginPercent > 0">
                  {{ row.effectiveMarginPercent | persianNumber:0:1 }}٪
                  {{ row.profitMarginPercent > 0 ? '(اختصاصی)' : '(پیش‌فرض)' }}
                </span>
              </td>
              <td class="px-4 py-3 font-mono font-bold text-primary">{{ row.suggestedSitePrice | persianNumber }}</td>
              <td class="px-4 py-3 text-gray-600">{{ row.availableQuantity | persianNumber }}</td>
              <td class="px-4 py-3">
                <span class="rounded-full px-2 py-0.5 text-xs font-bold"
                      [class.bg-green-100]="row.isAvailable" [class.text-green-700]="row.isAvailable"
                      [class.bg-gray-100]="!row.isAvailable" [class.text-gray-500]="!row.isAvailable">
                  {{ row.isAvailable ? 'فعال' : 'غیرفعال' }}
                </span>
              </td>
            </tr>
            <tr *ngIf="!loading && !filtered.length">
              <td colspan="7" class="px-4 py-10 text-center text-gray-400">رکوردی یافت نشد.</td>
            </tr>
            <tr *ngIf="loading">
              <td colspan="7" class="px-4 py-10 text-center text-gray-400">در حال بارگذاری…</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Settings drawer -->
      <div *ngIf="settingsOpen" class="fixed inset-0 z-50 flex" dir="rtl">
        <div class="flex-1 bg-black/40" (click)="closeSettings()"></div>
        <div class="w-full max-w-lg overflow-y-auto bg-white p-6 shadow-2xl space-y-5">
          <div class="flex items-center justify-between">
            <h2 class="text-lg font-extrabold text-secondary">⚙️ تنظیمات قیمت‌گذاری</h2>
            <button (click)="closeSettings()" class="text-gray-400 hover:text-gray-600 text-2xl leading-none px-2">×</button>
          </div>

          <p class="rounded-xl bg-blue-50 px-4 py-3 text-xs leading-6 text-blue-700">
            قیمت سایت = (قیمت تأمین × (۱ + حاشیه)) ÷ (۱ − سهم مالیات و ارزش افزوده از سود).
            ارزش افزوده فقط روی سود اعمال می‌شود چون ارزش افزوده خرید تأمین‌کننده قابل کسر است.
          </p>

          <!-- Global numbers -->
          <div class="grid grid-cols-3 gap-3">
            <label class="block">
              <span class="text-xs font-bold text-gray-500">حاشیه جهانی ٪</span>
              <input type="number" min="0" max="200" [(ngModel)]="draft.globalMarginPercent"
                     class="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </label>
            <label class="block">
              <span class="text-xs font-bold text-gray-500">مالیات شرکت ٪</span>
              <input type="number" min="0" max="90" [(ngModel)]="draft.corporateTaxPercent"
                     class="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </label>
            <label class="block">
              <span class="text-xs font-bold text-gray-500">ارزش افزوده ٪</span>
              <input type="number" min="0" max="90" [(ngModel)]="draft.vatPercent"
                     class="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30" />
            </label>
          </div>

          <!-- Category overrides -->
          <div>
            <div class="mb-2 flex items-center justify-between">
              <span class="text-sm font-bold text-secondary">حاشیه اختصاصی دسته‌بندی‌ها</span>
              <button (click)="addCategoryOverride()" class="text-xs font-bold text-primary hover:underline">+ افزودن</button>
            </div>
            <div *ngFor="let o of draft.categoryOverrides; let i = index" class="mb-2 flex items-center gap-2">
              <select [(ngModel)]="o.categoryId" class="flex-1 rounded-xl border border-gray-200 px-3 py-2 text-sm">
                <option value="">— انتخاب دسته —</option>
                <option *ngFor="let c of categories" [value]="c.id">{{ c.name }}</option>
              </select>
              <input type="number" min="0" [(ngModel)]="o.marginPercent" class="w-24 rounded-xl border border-gray-200 px-3 py-2 text-sm" />
              <span class="text-xs text-gray-400">٪</span>
              <button (click)="draft.categoryOverrides.splice(i, 1)" class="text-red-400 hover:text-red-600 px-1">🗑</button>
            </div>
            <p *ngIf="!draft.categoryOverrides.length" class="text-xs text-gray-400">هیچ override دسته‌بندی ثبت نشده — همه از پیش‌فرض جهانی پیروی می‌کنند.</p>
          </div>

          <!-- Product overrides -->
          <div>
            <div class="mb-2 flex items-center justify-between">
              <span class="text-sm font-bold text-secondary">حاشیه اختصاصی محصولات</span>
              <button (click)="addProductOverride()" class="text-xs font-bold text-primary hover:underline">+ افزودن</button>
            </div>
            <div *ngFor="let o of draft.productOverrides; let i = index" class="mb-2 flex items-center gap-2">
              <input type="text" [(ngModel)]="o.productId" placeholder="شناسه محصول (GUID)"
                     class="flex-1 rounded-xl border border-gray-200 px-3 py-2 text-sm font-mono" />
              <input type="number" min="0" [(ngModel)]="o.marginPercent" class="w-24 rounded-xl border border-gray-200 px-3 py-2 text-sm" />
              <span class="text-xs text-gray-400">٪</span>
              <button (click)="draft.productOverrides.splice(i, 1)" class="text-red-400 hover:text-red-600 px-1">🗑</button>
            </div>
            <p *ngIf="!draft.productOverrides.length" class="text-xs text-gray-400">هیچ override محصول ثبت نشده.</p>
          </div>

          <!-- Live preview -->
          <div class="rounded-2xl border border-gray-100 bg-gray-50 p-4">
            <p class="text-sm font-bold text-secondary mb-3">🔍 پیش‌نمایش زنده</p>
            <div class="flex items-end gap-2">
              <label class="flex-1">
                <span class="text-xs font-bold text-gray-500">قیمت تأمین (تومان)</span>
                <input type="number" min="0" [(ngModel)]="previewSupply"
                       (ngModelChange)="preview$.next($event)"
                       class="mt-1 w-full rounded-xl border border-gray-200 px-3 py-2 text-sm" />
              </label>
              <div class="pb-2 text-gray-400">→</div>
              <div class="min-w-[130px] rounded-xl bg-white px-4 py-2.5 text-center shadow-sm">
                <p class="text-xs text-gray-400">قیمت سایت</p>
                <p class="font-mono font-extrabold text-primary">
                  {{ preview ? (preview.sitePrice | persianNumber) : '—' }}
                </p>
              </div>
            </div>
            <div *ngIf="preview" class="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
              <div class="rounded-xl bg-white px-2 py-2">
                <p class="text-gray-400">حاشیه مؤثر</p>
                <p class="font-bold text-secondary">{{ preview.effectiveMarginPercent | persianNumber:0:1 }}٪</p>
              </div>
              <div class="rounded-xl bg-white px-2 py-2">
                <p class="text-gray-400">مالیات + VAT</p>
                <p class="font-bold text-secondary">{{ (preview.corporateTaxPercent + preview.vatPercent) | persianNumber:0:1 }}٪</p>
              </div>
              <div class="rounded-xl bg-white px-2 py-2">
                <p class="text-gray-400">حاشیه خالص</p>
                <p class="font-bold text-green-600">{{ preview.netMarginPercent | persianNumber:0:1 }}٪</p>
              </div>
            </div>
            <p class="mt-2 text-[11px] text-gray-400">پیش‌نمایش با حاشیه‌ی فعلی فرم و نرخ‌های مالیاتی ذخیره‌شده روی سرور محاسبه می‌شود؛ پس از ذخیره، همه ارقام اعمال می‌شوند.</p>
          </div>

          <!-- Actions -->
          <div class="flex gap-2 pt-2">
            <button (click)="saveSettings()" [disabled]="savingSettings"
                    class="flex-1 rounded-xl bg-primary px-4 py-2.5 text-sm font-bold text-white hover:opacity-90 disabled:opacity-40">
              {{ savingSettings ? '…' : 'ذخیره تنظیمات' }}
            </button>
            <button (click)="closeSettings()" class="rounded-xl border border-gray-300 px-4 py-2.5 text-sm font-bold text-gray-600 hover:bg-gray-50">
              انصراف
            </button>
          </div>
        </div>
      </div>
    </div>
  `
})
export class AdminSupplierPricingComponent implements OnInit, OnDestroy {
  entries: AdminSupplierPricingEntry[] = [];
  filtered: AdminSupplierPricingEntry[] = [];
  suppliers: AdminSupplier[] = [];
  categories: Category[] = [];

  searchQuery = '';
  supplierFilter = '';
  loading = false;
  errorMessage = '';
  successMessage = '';

  settingsOpen = false;
  savingSettings = false;
  draft: PricingSettings = {
    globalMarginPercent: 20,
    corporateTaxPercent: 25,
    vatPercent: 10,
    categoryOverrides: [],
    productOverrides: []
  };

  previewSupply = 1_000_000;
  preview: SitePricePreview | null = null;

  /** تریگر جستجو (دبیانس‌شده) — از قالب فراخوانی می‌شود */
  readonly search$ = new Subject<string>();
  /** تریگر پیش‌نمایش (دبیانس‌شده) — از قالب فراخوانی می‌شود */
  readonly preview$ = new Subject<number>();
  private readonly subs: Subscription[] = [];

  constructor(
    private readonly adminService: AdminService,
    private readonly categoryService: CategoryService
  ) {}

  ngOnInit(): void {
    this.load();
    this.adminService.getSuppliers().subscribe({
      next: r => (this.suppliers = r.data ?? []),
      error: () => (this.suppliers = [])
    });
    this.categoryService.getCategories().subscribe({
      next: r => (this.categories = r.items ?? []),
      error: () => (this.categories = [])
    });

    this.subs.push(
      this.search$.pipe(debounceTime(300)).subscribe(() => this.applyFilters()),
      this.preview$.pipe(debounceTime(400)).subscribe(() => this.refreshPreview())
    );
  }

  ngOnDestroy(): void {
    this.subs.forEach(s => s.unsubscribe());
  }

  load(): void {
    this.loading = true;
    this.errorMessage = '';
    this.adminService.getAllSupplierPricing().subscribe({
      next: result => {
        this.entries = result.data ?? [];
        this.applyFilters();
        this.loading = false;
      },
      error: (err: Error) => {
        this.errorMessage = err.message || 'خطا در دریافت قیمت‌ها';
        this.loading = false;
      }
    });
  }

  applyFilters(): void {
    const q = this.searchQuery.trim().toLowerCase();
    this.filtered = this.entries.filter(row => {
      const matchesSupplier = !this.supplierFilter || row.supplierId === this.supplierFilter;
      const matchesSearch =
        !q ||
        (row.productName ?? '').toLowerCase().includes(q) ||
        (row.sku ?? '').toLowerCase().includes(q) ||
        (row.supplierName ?? '').toLowerCase().includes(q);
      return matchesSupplier && matchesSearch;
    });
  }

  // ─── Settings editor ─────────────────────────────────────────

  openSettings(): void {
    this.adminService.getPricingSettings().subscribe({
      next: result => {
        if (result.isSuccess && result.data) {
          this.draft = {
            globalMarginPercent: result.data.globalMarginPercent,
            corporateTaxPercent: result.data.corporateTaxPercent,
            vatPercent: result.data.vatPercent,
            categoryOverrides: [...result.data.categoryOverrides],
            productOverrides: [...result.data.productOverrides]
          };
        }
        this.settingsOpen = true;
      },
      error: (err: Error) => (this.errorMessage = err.message)
    });
  }

  closeSettings(): void {
    if (this.savingSettings) return;
    this.settingsOpen = false;
    this.preview = null;
  }

  addCategoryOverride(): void {
    this.draft.categoryOverrides.push({ categoryId: '', categoryName: '', marginPercent: 25 });
  }

  addProductOverride(): void {
    this.draft.productOverrides.push({ productId: '', productName: '', marginPercent: 25 });
  }

  saveSettings(): void {
    const payload = {
      globalMarginPercent: Number(this.draft.globalMarginPercent),
      corporateTaxPercent: Number(this.draft.corporateTaxPercent),
      vatPercent: Number(this.draft.vatPercent),
      // Send full replacement lists; drop rows with empty ids.
      categoryOverrides: this.draft.categoryOverrides.filter(o => !!o.categoryId),
      productOverrides: this.draft.productOverrides.filter(o => !!o.productId)
    };

    this.savingSettings = true;
    this.errorMessage = '';
    this.adminService.updatePricingSettings(payload).subscribe({
      next: result => {
        this.savingSettings = false;
        if (result.isSuccess) {
          this.successMessage = 'تنظیمات قیمت‌گذاری ذخیره شد — قیمت‌های سایت ظرف ۳۰ ثانیه به‌روز می‌شوند.';
          this.load();
          this.closeSettings();
        } else {
          this.errorMessage = result.errorMessage ?? 'ذخیره تنظیمات انجام نشد.';
        }
      },
      error: (err: Error) => {
        this.savingSettings = false;
        this.errorMessage = err.message || 'خطا در ذخیره تنظیمات';
      }
    });
  }

  // ─── Live preview ────────────────────────────────────────────

  refreshPreview(): void {
    const supply = Number(this.previewSupply);
    if (!supply || supply <= 0) {
      this.preview = null;
      return;
    }
    // Pass the draft global margin so the preview reflects unsaved edits;
    // tax rates come from the saved server settings.
    this.adminService.previewSitePrice({
      supplyPrice: supply,
      marginPercent: Number(this.draft.globalMarginPercent)
    }).subscribe({
      next: result => (this.preview = result.isSuccess ? (result.data ?? null) : null),
      error: () => (this.preview = null)
    });
  }
}
