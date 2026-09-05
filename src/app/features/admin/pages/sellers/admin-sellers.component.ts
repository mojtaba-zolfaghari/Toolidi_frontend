import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

import { AdminSeller, AdminService, CreateSellerData, SellerDocument } from '../../../../core/services/api/admin.service';
import { TableColumn, TableAction } from '../../../../shared/components/data-table/data-table.component';
import { LocationService, Province, City } from '../../../../core/services/api/location.service';
import { ConfirmService } from '../../../../shared/services/confirm.service';

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
  creating = false;
  createError = '';
  loading = true;
  busyId = '';
  errorMessage = '';
  successMessage = '';
  documentsSeller: AdminSeller | null = null;
  documents: SellerDocument[] = [];
  documentsLoading = false;
  provinces: Province[] = [];
  cities: City[] = [];
  loadingCities = false;

  tableColumns: TableColumn[] = [
    { key: 'companyName', label: 'نام شرکت', sortable: true },
    { key: 'contactName', label: 'نام تماس' },
    { key: 'contactEmail', label: 'ایمیل تماس' },
    { key: 'isVerified', label: 'تأییدشده', type: 'badge', badgeMap: {
      'true': { label: 'بله', color: 'bg-green-100 text-green-700' },
      'false': { label: 'خیر', color: 'bg-orange-100 text-orange-700' }
    }}
  ];

  tableActions: TableAction[] = [
    { label: 'مدارک', icon: '📄', color: 'primary', click: (row) => this.showDocuments(row) },
    { label: 'تأیید', icon: '✅', color: 'success', click: (row) => this.verify(row), visible: (row) => !row.isVerified },
    { label: 'حذف', icon: '🗑️', color: 'danger', click: (row) => this.remove(row) }
  ];

  constructor(private readonly fb: FormBuilder, private readonly adminService: AdminService, private readonly locationService: LocationService, private readonly confirm: ConfirmService) {
    this.sellerForm = this.fb.group({
      companyName: ['', Validators.required], nationalId: ['', Validators.required], contactName: ['', Validators.required],
      contactEmail: ['', [Validators.required, Validators.email]], contactPhone: ['', Validators.required], address: ['', Validators.required],
      cityId: ['', Validators.required], provinceId: ['', Validators.required], postalCode: ['', Validators.required], country: ['ایران', Validators.required],
      commissionRate: [10, [Validators.required, Validators.min(0), Validators.max(100)]]
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
  closeDocuments(): void { this.documentsSeller = null; }
}
