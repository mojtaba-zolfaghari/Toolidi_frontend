import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

import { AdminSeller, AdminService, CreateSellerData, SellerDocument, SellerReport } from '../../../../core/services/api/admin.service';
import { TableColumn, TableAction } from '../../../../shared/components/data-table/data-table.component';
import { LocationService, Province, City } from '../../../../core/services/api/location.service';
import { ConfirmService } from '../../../../shared/services/confirm.service';

type DetailTab = 'info' | 'orders' | 'products' | 'reports' | 'documents';

@Component({
  selector: 'app-admin-sellers',
  templateUrl: './admin-sellers.component.html'
})
export class AdminSellersComponent implements OnInit {
  headerActions = [
    { label: 'افزودن فروشنده', icon: '➕', color: 'primary', click: () => this.openCreate() },
    { label: 'بازخوانی', icon: '🔄', color: 'ghost', click: () => this.loadSellers() }
  ];

  sellers: AdminSeller[] = [];
  page = 1;
  readonly pageSize = 15;
  totalCount = 0;
  verifiedCount = 0;
  sellerForm: FormGroup;
  createOpen = false;
  editingSeller: AdminSeller | null = null;
  creating = false;
  createError = '';
  loading = true;
  busyId = '';
  errorMessage = '';
  successMessage = '';

  // ── جزئیات فروشنده (مودال تب‌دار) ──
  detailSeller: AdminSeller | null = null;
  detailTab: DetailTab = 'info';
  detailOrders: any[] = [];
  detailOrdersTotal = 0;
  detailOrdersPage = 1;
  detailOrdersLoading = false;
  detailError = '';
  detailProducts: any[] = [];
  detailProductsTotal = 0;
  detailProductsPage = 1;
  detailProductsLoading = false;
  report: SellerReport | null = null;
  reportLoading = false;

  // ── مدارک فروشنده ──
  documents: SellerDocument[] = [];
  documentsLoading = false;
  uploading = false;
  uploadError = '';
  selectedDocumentType = 'business_license';
  documentTypes = [
    { value: 'business_license', label: 'جواز کسب' },
    { value: 'national_card', label: 'کارت ملی' },
    { value: 'iban', label: 'شماره شبا' },
    { value: 'other', label: 'سایر' }
  ];

  provinces: Province[] = [];
  cities: City[] = [];
  loadingCities = false;

  tableColumns: TableColumn[] = [
    { key: 'companyName', label: 'نام شرکت', sortable: true },
    { key: 'contactName', label: 'نام تماس' },
    { key: 'contactEmail', label: 'ایمیل تماس' },
    { key: 'isVerified', label: 'تأییدشده', type: 'badge', badgeMap: {
      'true': { label: 'بله', color: 'data-table__badge--success' },
      'false': { label: 'خیر', color: 'data-table__badge--warning' }
    }}
  ];

  tableActions: TableAction[] = [
    { label: 'جزئیات', icon: '👁️', color: 'primary', click: (row) => this.showDetail(row) },
    { label: 'ویرایش', icon: '✏️', color: 'primary', click: (row) => this.openEdit(row) },
    { label: 'تأیید', icon: '✅', color: 'success', click: (row) => this.verify(row), visible: (row) => !row.isVerified },
    { label: 'حذف', icon: '🗑️', color: 'danger', click: (row) => this.remove(row) }
  ];

  constructor(
    private readonly fb: FormBuilder,
    private readonly adminService: AdminService,
    private readonly locationService: LocationService,
    private readonly confirm: ConfirmService
  ) {
    this.sellerForm = this.fb.group({
      companyName: ['', Validators.required],
      nationalId: ['', Validators.required],
      contactName: ['', Validators.required],
      contactEmail: ['', [Validators.required, Validators.email]],
      contactPhone: ['', Validators.required],
      address: ['', Validators.required],
      cityId: ['', Validators.required],
      provinceId: ['', Validators.required],
      postalCode: ['', Validators.required],
      country: ['ایران', Validators.required],
      commissionRate: [10, [Validators.required, Validators.min(0), Validators.max(100)]],
      minimumOrderAmount: [null],
      minimumOrderQuantity: [null]
    });
  }

  ngOnInit(): void {
    this.loadSellers();
    this.locationService.getProvinces().subscribe(result => this.provinces = result.data ?? []);
  }

  onProvinceChange(): void {
    const provinceId = this.sellerForm.get('provinceId')?.value;
    this.cities = [];
    this.sellerForm.get('cityId')?.reset('');
    if (!provinceId) return;
    this.loadingCities = true;
    this.locationService.getCitiesByProvince(provinceId).subscribe({
      next: result => { this.cities = result.data ?? []; this.loadingCities = false; },
      error: () => { this.loadingCities = false; }
    });
  }

  loadSellers(): void {
    this.loading = true;
    this.errorMessage = '';
    this.adminService.getSellers({ page: this.page, pageSize: this.pageSize }).subscribe({
      next: (result) => {
        this.sellers = result.data?.items ?? [];
        this.totalCount = result.data?.totalCount ?? this.sellers.length;
        this.verifiedCount = this.sellers.filter(s => s.isVerified).length;
        this.loading = false;
      },
      error: (error: Error) => { this.errorMessage = error.message; this.loading = false; }
    });
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= Math.ceil(this.totalCount / this.pageSize)) { this.page = page; this.loadSellers(); }
  }

  verify(seller: AdminSeller): void {
    this.busyId = seller.id;
    this.errorMessage = '';
    this.adminService.verifySeller(seller.id).subscribe({
      next: (result) => {
        this.busyId = '';
        if (result.isSuccess) { seller.isVerified = true; this.verifiedCount++; this.successMessage = 'فروشنده با موفقیت تأیید شد.'; }
        else { this.errorMessage = result.errorMessage ?? 'تأیید فروشنده انجام نشد.'; }
      },
      error: (error: Error) => { this.busyId = ''; this.errorMessage = error.message; }
    });
  }

  // ── مودال تب‌دار جزئیات ──────────────────────────────

  showDetail(seller: AdminSeller): void {
    this.detailSeller = seller;
    this.detailTab = 'info';
    this.detailOrders = [];
    this.detailOrdersTotal = 0;
    this.detailOrdersPage = 1;
    this.detailProducts = [];
    this.detailProductsTotal = 0;
    this.detailProductsPage = 1;
    this.report = null;
    this.documents = [];
    this.detailError = '';
    this.uploadError = '';
    this.loadReport();
    this.loadDocuments();
  }

  closeDetail(): void { this.detailSeller = null; }

  switchTab(tab: DetailTab): void {
    this.detailTab = tab;
    if (tab === 'orders' && this.detailOrders.length === 0) this.loadOrders();
    if (tab === 'products' && this.detailProducts.length === 0) this.loadProducts();
    if (tab === 'documents' && this.documents.length === 0) this.loadDocuments();
  }

  loadOrders(page = 1): void {
    if (!this.detailSeller) return;
    this.detailOrdersLoading = true;
    this.detailError = '';
    this.adminService.getSellerOrders(this.detailSeller.id, page, 10).subscribe({
      next: (result) => {
        this.detailOrders = result.data?.items ?? [];
        this.detailOrdersTotal = result.data?.totalCount ?? this.detailOrders.length;
        this.detailOrdersPage = page;
        this.detailOrdersLoading = false;
      },
      error: (error: Error) => { this.detailOrdersLoading = false; this.detailError = error.message; }
    });
  }

  loadProducts(page = 1): void {
    if (!this.detailSeller) return;
    this.detailProductsLoading = true;
    this.detailError = '';
    this.adminService.getSellerProducts(this.detailSeller.id, page, 20).subscribe({
      next: (result) => {
        this.detailProducts = result.data?.items ?? [];
        this.detailProductsTotal = result.data?.totalCount ?? this.detailProducts.length;
        this.detailProductsPage = page;
        this.detailProductsLoading = false;
      },
      error: (error: Error) => { this.detailProductsLoading = false; this.detailError = error.message; }
    });
  }

  loadReport(): void {
    if (!this.detailSeller) return;
    this.reportLoading = true;
    this.adminService.getSellerReport(this.detailSeller.id).subscribe({
      next: (result) => { this.report = result.data ?? null; this.reportLoading = false; },
      error: () => { this.report = null; this.reportLoading = false; }
    });
  }

  // ── مدارک ────────────────────────────────────────────

  loadDocuments(): void {
    if (!this.detailSeller) return;
    this.documentsLoading = true;
    this.adminService.getSellerDocuments(this.detailSeller.id).subscribe({
      next: (result) => { this.documents = result.data ?? []; this.documentsLoading = false; },
      error: () => { this.documents = []; this.documentsLoading = false; }
    });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file || !this.detailSeller) { input.value = ''; return; }
    this.uploading = true;
    this.uploadError = '';
    this.adminService.uploadSellerDocument(this.detailSeller.id, file, this.selectedDocumentType).subscribe({
      next: (result) => {
        this.uploading = false;
        input.value = '';
        if (result.isSuccess) { this.successMessage = 'مدرک با موفقیت بارگذاری شد.'; this.loadDocuments(); this.loadReport(); }
        else this.uploadError = result.errorMessage ?? 'بارگذاری مدرک انجام نشد.';
      },
      error: (error: Error) => { this.uploading = false; input.value = ''; this.uploadError = error.message; }
    });
  }

  verifyDocument(doc: SellerDocument): void {
    if (!doc.id) return;
    this.adminService.verifySellerDocument(doc.id).subscribe({
      next: (result) => { if (result.isSuccess) { this.loadDocuments(); this.loadReport(); this.successMessage = 'مدرک تأیید شد.'; } },
      error: (error: Error) => { this.uploadError = error.message; }
    });
  }

  rejectDocument(doc: SellerDocument): void {
    if (!doc.id) return;
    const note = window.prompt('دلیل رد مدرک (اختیاری):');
    if (note === null) return;
    this.adminService.rejectSellerDocument(doc.id, note || undefined).subscribe({
      next: (result) => { if (result.isSuccess) { this.loadDocuments(); this.loadReport(); this.successMessage = 'مدرک رد شد.'; } },
      error: (error: Error) => { this.uploadError = error.message; }
    });
  }

  // ── ایجاد / ویرایش ───────────────────────────────────

  openCreate(): void {
    this.editingSeller = null;
    this.sellerForm.reset({ country: 'ایران', commissionRate: 10 });
    this.cities = [];
    this.createError = '';
    this.createOpen = true;
  }

  openEdit(seller: AdminSeller): void {
    this.editingSeller = seller;
    this.sellerForm.patchValue({
      companyName: seller.companyName ?? '',
      nationalId: seller.nationalId ?? '',
      contactName: seller.contactName ?? '',
      contactEmail: seller.contactEmail ?? '',
      contactPhone: seller.contactPhone ?? '',
      address: seller.address ?? '',
      postalCode: seller.postalCode ?? '',
      country: seller.country ?? 'ایران',
      commissionRate: seller.commissionRate ?? 10,
      minimumOrderAmount: seller.minimumOrderAmount ?? null,
      minimumOrderQuantity: seller.minimumOrderQuantity ?? null
    });
    // Prefill استان/شهر selects by matching names so the edit form passes validation.
    const province = this.provinces.find(p => p.name === seller.province);
    this.sellerForm.get('provinceId')?.setValue(province?.id ?? '');
    this.cities = [];
    this.sellerForm.get('cityId')?.reset('');
    if (province) {
      this.loadingCities = true;
      this.locationService.getCitiesByProvince(province.id).subscribe({
        next: result => {
          this.cities = result.data ?? [];
          this.loadingCities = false;
          const city = this.cities.find(c => c.name === seller.city);
          if (city) this.sellerForm.get('cityId')?.setValue(city.id);
        },
        error: () => { this.loadingCities = false; }
      });
    }
    this.createError = '';
    this.createOpen = true;
  }

  closeCreate(): void { if (!this.creating) this.createOpen = false; }

  submitSeller(): void {
    this.sellerForm.markAllAsTouched();
    if (this.sellerForm.invalid) { this.createError = 'لطفاً همه فیلدهای الزامی را تکمیل کنید.'; return; }
    this.creating = true;
    this.createError = '';
    const raw = this.sellerForm.getRawValue();
    const province = this.provinces.find(p => p.id === raw.provinceId);
    const city = this.cities.find(c => c.id === raw.cityId);
    const data: CreateSellerData = {
      companyName: raw.companyName,
      nationalId: raw.nationalId,
      contactName: raw.contactName,
      contactEmail: raw.contactEmail,
      contactPhone: raw.contactPhone,
      address: raw.address,
      city: city?.name ?? '',
      province: province?.name ?? '',
      cityId: raw.cityId,
      provinceId: raw.provinceId,
      postalCode: raw.postalCode,
      country: raw.country,
      commissionRate: raw.commissionRate,
      minimumOrderAmount: raw.minimumOrderAmount ?? null,
      minimumOrderQuantity: raw.minimumOrderQuantity ?? null,
      isActive: this.editingSeller?.isActive ?? true
    };
    const handle = {
      next: (result: { isSuccess: boolean; errorMessage?: string }) => {
        this.creating = false;
        if (result.isSuccess) {
          this.createOpen = false;
          this.successMessage = this.editingSeller ? 'تغییرات فروشنده ذخیره شد.' : 'فروشنده جدید با موفقیت ثبت شد.';
          this.loadSellers();
          if (this.detailSeller?.id === this.editingSeller?.id && this.detailSeller) this.showDetail(this.detailSeller);
        }
        else this.createError = result.errorMessage ?? 'ذخیره فروشنده انجام نشد.';
      },
      error: (error: Error) => { this.creating = false; this.createError = error.message; }
    };
    if (this.editingSeller) {
      this.adminService.updateSeller(this.editingSeller.id, data).subscribe(handle);
    } else {
      this.adminService.createSeller(data).subscribe(handle);
    }
  }

  remove(seller: AdminSeller): void {
    this.confirm.confirmDanger(`آیا از حذف فروشنده «${seller.companyName}» مطمئن هستید؟`).subscribe(ok => {
      if (!ok) return;
      this.busyId = seller.id;
      this.clearMessages();
      this.adminService.deleteSeller(seller.id).subscribe({
        next: (result) => { this.busyId = ''; if (result.isSuccess) { this.successMessage = 'فروشنده حذف شد.'; this.loadSellers(); } else this.errorMessage = result.errorMessage ?? 'حذف فروشنده انجام نشد.'; },
        error: (error: Error) => { this.busyId = ''; this.errorMessage = error.message; }
      });
    });
  }

  private clearMessages(): void { this.errorMessage = ''; this.successMessage = ''; }
}