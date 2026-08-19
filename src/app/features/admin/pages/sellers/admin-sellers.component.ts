import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

import { AdminSeller, AdminService, CreateSellerData, SellerDocument } from '../../../../core/services/api/admin.service';

@Component({
  selector: 'app-admin-sellers',
  template: `
    <section dir="rtl" class="mx-auto max-w-7xl space-y-6">
      <header class="flex flex-wrap items-center justify-between gap-4"><div><p class="text-sm font-medium text-primary">مدیریت سامانه</p><h1 class="mt-1 text-3xl font-extrabold text-secondary">فروشندگان</h1><p class="mt-2 text-sm text-gray-500">بررسی اطلاعات و تأیید فروشندگان</p></div><div class="flex gap-2"><button type="button" (click)="openCreate()" class="rounded-xl bg-primary px-5 py-2 text-sm font-bold text-white shadow-lg shadow-primary/20">افزودن فروشنده جدید</button><button type="button" (click)="loadSellers()" class="rounded-xl border border-primary px-4 py-2 text-sm font-bold text-primary hover:bg-bg-muted">بازخوانی</button></div></header>
      <p *ngIf="errorMessage" class="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{{ errorMessage }}</p><p *ngIf="successMessage" class="rounded-xl bg-green-50 px-4 py-3 text-sm text-green-700">{{ successMessage }}</p>
      <div class="overflow-x-auto rounded-2xl bg-white shadow-card"><div *ngIf="loading" class="p-12 text-center text-gray-500">در حال بارگذاری فروشندگان…</div><table *ngIf="!loading" class="w-full min-w-[850px] text-right text-sm"><thead><tr class="border-b bg-gray-50 text-gray-500"><th class="p-4">نام شرکت</th><th class="p-4">نام تماس</th><th class="p-4">ایمیل تماس</th><th class="p-4">تأییدشده</th><th class="p-4">مدارک</th><th class="p-4">عملیات</th></tr></thead><tbody><tr *ngFor="let seller of sellers" class="border-b last:border-0 hover:bg-gray-50/70"><td class="p-4 font-bold text-secondary">{{ seller.companyName }}</td><td class="p-4">{{ seller.contactName || '—' }}</td><td class="p-4">{{ seller.contactEmail || '—' }}</td><td class="p-4"><span class="rounded-full px-3 py-1 text-xs font-bold" [class.bg-green-50]="seller.isVerified" [class.text-green-700]="seller.isVerified" [class.bg-orange-50]="!seller.isVerified" [class.text-orange-700]="!seller.isVerified">{{ seller.isVerified ? 'بله' : 'خیر' }}</span></td><td class="p-4"><button type="button" (click)="showDocuments(seller)" class="font-bold text-primary hover:underline">📄 مشاهده</button></td><td class="p-4"><div class="flex flex-wrap gap-2"><button type="button" (click)="verify(seller)" [disabled]="seller.isVerified || busyId === seller.id" class="rounded-lg bg-accent-success px-3 py-2 text-xs font-bold text-white disabled:opacity-40">تأیید</button><button type="button" (click)="remove(seller)" [disabled]="busyId === seller.id" class="rounded-lg border border-red-200 px-3 py-2 text-xs font-bold text-red-600 hover:bg-red-50 disabled:opacity-50">حذف</button></div></td></tr></tbody></table><p *ngIf="!loading && !sellers.length" class="p-10 text-center text-gray-400">فروشنده‌ای برای نمایش وجود ندارد.</p></div><div *ngIf="!loading && totalPages > 1" class="flex items-center justify-center gap-3 text-sm"><button type="button" (click)="goToPage(page - 1)" [disabled]="page === 1" class="rounded-lg border px-4 py-2 disabled:opacity-40">قبلی</button><span class="text-gray-500">صفحه {{ page }} از {{ totalPages }}</span><button type="button" (click)="goToPage(page + 1)" [disabled]="page === totalPages" class="rounded-lg border px-4 py-2 disabled:opacity-40">بعدی</button></div>
      <div *ngIf="createOpen" class="fixed inset-0 z-50 flex items-center justify-center bg-secondary/50 p-4" (click)="closeCreate()"><form [formGroup]="sellerForm" (ngSubmit)="createSeller()" (click)="$event.stopPropagation()" class="max-h-[90vh] w-full max-w-4xl overflow-y-auto rounded-2xl bg-white p-6 shadow-2xl"><div class="flex items-center justify-between"><h2 class="text-xl font-bold text-secondary">افزودن فروشنده جدید</h2><button type="button" (click)="closeCreate()" class="text-2xl text-gray-400">×</button></div><div class="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2"><label><span class="mb-1 block text-sm font-medium text-secondary">نام شرکت *</span><input formControlName="companyName" class="w-full rounded-xl border border-gray-300 px-4 py-2.5" /></label><label><span class="mb-1 block text-sm font-medium text-secondary">شناسه ملی *</span><input formControlName="nationalId" class="w-full rounded-xl border border-gray-300 px-4 py-2.5" /></label><label><span class="mb-1 block text-sm font-medium text-secondary">نام تماس *</span><input formControlName="contactName" class="w-full rounded-xl border border-gray-300 px-4 py-2.5" /></label><label><span class="mb-1 block text-sm font-medium text-secondary">ایمیل تماس *</span><input type="email" formControlName="contactEmail" class="w-full rounded-xl border border-gray-300 px-4 py-2.5" /></label><label><span class="mb-1 block text-sm font-medium text-secondary">شماره تماس *</span><input formControlName="contactPhone" class="w-full rounded-xl border border-gray-300 px-4 py-2.5" /></label><label><span class="mb-1 block text-sm font-medium text-secondary">استان *</span><input formControlName="province" class="w-full rounded-xl border border-gray-300 px-4 py-2.5" /></label><label><span class="mb-1 block text-sm font-medium text-secondary">شهر *</span><input formControlName="city" class="w-full rounded-xl border border-gray-300 px-4 py-2.5" /></label><label><span class="mb-1 block text-sm font-medium text-secondary">کد پستی *</span><input formControlName="postalCode" class="w-full rounded-xl border border-gray-300 px-4 py-2.5" /></label><label><span class="mb-1 block text-sm font-medium text-secondary">کشور *</span><input formControlName="country" class="w-full rounded-xl border border-gray-300 px-4 py-2.5" /></label><label><span class="mb-1 block text-sm font-medium text-secondary">درصد کمیسیون *</span><input type="number" min="0" max="100" formControlName="commissionRate" class="w-full rounded-xl border border-gray-300 px-4 py-2.5" /></label><label class="md:col-span-2"><span class="mb-1 block text-sm font-medium text-secondary">نشانی *</span><textarea rows="2" formControlName="address" class="w-full rounded-xl border border-gray-300 px-4 py-2.5"></textarea></label></div><p *ngIf="createError" class="mt-4 rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">{{ createError }}</p><div class="mt-5 flex justify-end gap-3"><button type="button" (click)="closeCreate()" class="rounded-xl border border-gray-300 px-5 py-2.5">انصراف</button><button type="submit" [disabled]="creating" class="rounded-xl bg-primary px-6 py-2.5 font-bold text-white disabled:opacity-50">{{ creating ? 'در حال ذخیره…' : 'ثبت فروشنده' }}</button></div></form></div>
      <div *ngIf="documentsSeller" class="fixed inset-0 z-50 flex items-center justify-center bg-secondary/50 p-4" (click)="closeDocuments()"><div class="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl" (click)="$event.stopPropagation()"><div class="flex items-center justify-between"><h2 class="text-xl font-bold text-secondary">مدارک {{ documentsSeller.companyName }}</h2><button type="button" (click)="closeDocuments()" class="text-2xl text-gray-400">×</button></div><p *ngIf="documentsLoading" class="py-8 text-center text-gray-500">در حال بارگذاری مدارک…</p><div *ngIf="!documentsLoading && documents.length" class="mt-5 space-y-2"><a *ngFor="let document of documents" [href]="document.url" target="_blank" rel="noopener" class="block rounded-xl bg-bg-muted px-4 py-3 text-primary hover:underline">{{ document.name || document.type || 'مشاهده مدرک' }}</a></div><p *ngIf="!documentsLoading && !documents.length" class="mt-6 text-center text-gray-400">مدرکی برای این فروشنده ثبت نشده است.</p></div></div>
    </section>
  `
})
export class AdminSellersComponent implements OnInit {
  sellers: AdminSeller[] = [];
  page = 1;
  readonly pageSize = 15;
  totalCount = 0;
  sellerForm: FormGroup;
  createOpen = false;
  creating = false;
  createError = '';
  loading = true;
  busyId = '';
  errorMessage = '';
  successMessage = '';
  documentsSeller: AdminSeller | null = null;
  documents: SellerDocument[] = [];
  documentsLoading = false;

  constructor(private readonly fb: FormBuilder, private readonly adminService: AdminService) {
    this.sellerForm = this.fb.group({
      companyName: ['', Validators.required], nationalId: ['', Validators.required], contactName: ['', Validators.required],
      contactEmail: ['', [Validators.required, Validators.email]], contactPhone: ['', Validators.required], address: ['', Validators.required],
      city: ['', Validators.required], province: ['', Validators.required], postalCode: ['', Validators.required], country: ['ایران', Validators.required],
      commissionRate: [10, [Validators.required, Validators.min(0), Validators.max(100)]]
    });
  }

  ngOnInit(): void { this.loadSellers(); }

  loadSellers(): void {
    this.loading = true;
    this.errorMessage = '';
    this.adminService.getSellers({ page: this.page, pageSize: this.pageSize }).subscribe({
      next: (result) => { this.sellers = result.data?.items ?? []; this.totalCount = result.data?.totalCount ?? this.sellers.length; this.loading = false; },
      error: (error: Error) => { this.errorMessage = error.message; this.loading = false; }
    });
  }

  get totalPages(): number { return Math.max(1, Math.ceil(this.totalCount / this.pageSize)); }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) { this.page = page; this.loadSellers(); }
  }

  verify(seller: AdminSeller): void {
    this.busyId = seller.id;
    this.errorMessage = '';
    this.adminService.verifySeller(seller.id).subscribe({
      next: (result) => {
        this.busyId = '';
        if (result.isSuccess) { seller.isVerified = true; this.successMessage = 'فروشنده با موفقیت تأیید شد.'; }
        else { this.errorMessage = result.errorMessage ?? 'تأیید فروشنده انجام نشد.'; }
      },
      error: (error: Error) => { this.busyId = ''; this.errorMessage = error.message; }
    });
  }

  showDocuments(seller: AdminSeller): void {
    this.documentsSeller = seller;
    this.documents = [];
    this.documentsLoading = true;
    this.adminService.getSellerDocuments(seller.id).subscribe({
      next: (result) => { this.documents = result.data ?? []; this.documentsLoading = false; },
      error: () => { this.documents = []; this.documentsLoading = false; }
    });
  }

  openCreate(): void {
    this.sellerForm.reset({ country: 'ایران', commissionRate: 10 });
    this.createError = '';
    this.createOpen = true;
  }

  closeCreate(): void { if (!this.creating) this.createOpen = false; }

  createSeller(): void {
    this.sellerForm.markAllAsTouched();
    if (this.sellerForm.invalid) { this.createError = 'لطفاً همه فیلدهای الزامی را تکمیل کنید.'; return; }
    this.creating = true;
    this.createError = '';
    const data = this.sellerForm.getRawValue() as CreateSellerData;
    this.adminService.createSeller(data).subscribe({
      next: (result) => {
        this.creating = false;
        if (result.isSuccess) { this.createOpen = false; this.successMessage = 'فروشنده جدید با موفقیت ثبت شد.'; this.loadSellers(); }
        else this.createError = result.errorMessage ?? 'ثبت فروشنده انجام نشد.';
      },
      error: (error: Error) => { this.creating = false; this.createError = error.message; }
    });
  }

  remove(seller: AdminSeller): void {
    if (!window.confirm(`آیا از حذف فروشنده «${seller.companyName}» مطمئن هستید؟`)) return;
    this.busyId = seller.id;
    this.clearMessages();
    this.adminService.deleteSeller(seller.id).subscribe({
      next: (result) => { this.busyId = ''; if (result.isSuccess) { this.successMessage = 'فروشنده حذف شد.'; this.loadSellers(); } else this.errorMessage = result.errorMessage ?? 'حذف فروشنده انجام نشد.'; },
      error: (error: Error) => { this.busyId = ''; this.errorMessage = error.message; }
    });
  }

  private clearMessages(): void { this.errorMessage = ''; this.successMessage = ''; }

  closeDocuments(): void { this.documentsSeller = null; }
}
