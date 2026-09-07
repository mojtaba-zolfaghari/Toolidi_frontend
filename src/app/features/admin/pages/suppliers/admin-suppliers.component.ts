import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';

import {
  AdminSupplier,
  AdminService,
  CreateSupplierData
} from '../../../../core/services/api/admin.service';
import { ConfirmService } from '../../../../shared/services/confirm.service';
import { TableColumn, TableAction } from '../../../../shared/components/data-table/data-table.component';
import { LocationService, Province, City } from '../../../../core/services/api/location.service';

/**
 * پنل مدیریت تأمین‌کنندگان (تولیدکنندگان) — TASK-FE-032
 * فهرست، افزودن، ویرایش، مشاهده و حذف تأمین‌کننده از طریق SupplierController.
 */
@Component({
    selector: 'app-admin-suppliers',
    templateUrl: './admin-suppliers.component.html',
    styleUrls: ['./admin-suppliers.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class AdminSuppliersComponent implements OnInit {
  suppliers: AdminSupplier[] = [];
  filteredSuppliers: AdminSupplier[] = [];
  selectedSupplier: AdminSupplier | null = null;

  isLoading = false;
  isDialogOpen = false;
  dialogMode: 'add' | 'edit' | 'view' = 'add';
  searchQuery = '';
  saving = false;
  busyId = '';

  errorMessage = '';
  successMessage = '';

  activeCount = 0;
  provinces: Province[] = [];
  cities: City[] = [];
  loadingCities = false;

  supplierForm: FormGroup;

  tableColumns: TableColumn[] = [
    { key: 'name', label: 'نام شرکت / تولیدکننده', sortable: true },
    { key: 'contactInfo', label: 'اطلاعات تماس' },
    { key: 'location', label: 'موقعیت' },
    { key: 'isActive', label: 'وضعیت', type: 'badge', badgeMap: {
      'true': { label: 'فعال', color: 'data-table__badge--success' },
      'false': { label: 'غیرفعال', color: 'data-table__badge--danger' }
    }},
    { key: 'createdAt', label: 'تاریخ ثبت', type: 'date' }
  ];

  tableActions: TableAction[] = [
    { label: 'مشاهده', icon: '👁️', color: 'secondary', click: (row) => this.openDialog('view', row) },
    { label: 'ویرایش', icon: '✏️', color: 'primary', click: (row) => this.openDialog('edit', row) },
    { label: 'حذف', icon: '🗑️', color: 'danger', click: (row) => this.deleteSupplier(row) }
  ];

  constructor(
    private readonly fb: FormBuilder,
    private readonly adminService: AdminService,
    private readonly locationService: LocationService,
    private readonly confirm: ConfirmService
  ) {
    this.supplierForm = this.fb.group({
      name: ['', Validators.required],
      contactInfo: ['', Validators.required],
      location: ['', Validators.required],
      provinceId: ['', Validators.required],
      cityId: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    this.loadSuppliers();
    this.locationService.getProvinces().subscribe(result => this.provinces = result.data ?? []);
  }

  onProvinceChange(): void {
    const provinceId = this.supplierForm.get('provinceId')?.value;
    this.cities = [];
    this.supplierForm.patchValue({ cityId: '' });
    if (!provinceId) return;
    this.loadingCities = true;
    this.locationService.getCitiesByProvince(provinceId).subscribe({
      next: result => { this.cities = result.data ?? []; this.loadingCities = false; },
      error: () => { this.loadingCities = false; }
    });
  }

  onCityChange(): void {
    const city = this.cities.find(item => String(item.id) === String(this.supplierForm.get('cityId')?.value));
    const province = this.provinces.find(item => String(item.id) === String(this.supplierForm.get('provinceId')?.value));
    if (city && province) this.supplierForm.patchValue({ location: `${city.name}، ${province.name}` }, { emitEvent: false });
  }

  loadSuppliers(): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.adminService.getSuppliers().subscribe({
      next: (result) => {
        this.suppliers = result.data ?? [];
        this.filteredSuppliers = this.suppliers;
        this.activeCount = this.suppliers.filter(s => s.isActive).length;
        this.isLoading = false;
      },
      error: (error: Error) => {
        this.errorMessage = error.message || 'خطا در دریافت لیست تولیدکنندگان';
        this.isLoading = false;
      }
    });
  }

  filterSuppliers(): void {
    const query = this.searchQuery.trim().toLowerCase();
    if (!query) {
      this.filteredSuppliers = this.suppliers;
      return;
    }
    this.filteredSuppliers = this.suppliers.filter(supplier =>
      (supplier.name ?? '').toLowerCase().includes(query) ||
      (supplier.contactInfo ?? '').toLowerCase().includes(query) ||
      (supplier.location ?? '').toLowerCase().includes(query)
    );
  }

  openDialog(mode: 'add' | 'edit' | 'view', supplier?: AdminSupplier): void {
    this.dialogMode = mode;
    this.errorMessage = '';
    if (supplier) {
      this.selectedSupplier = supplier;
      this.supplierForm.patchValue({
        name: supplier.name,
        contactInfo: supplier.contactInfo,
        location: supplier.location
      });
      // Prefill استان/شهر selects by matching names so the required validators pass (edit only).
      if (mode === 'edit') {
        const province = this.provinces.find(p => p.name === (supplier.location ?? '').split('،').pop()?.trim());
        this.supplierForm.patchValue({ provinceId: province?.id ?? '', cityId: '' });
        this.cities = [];
        if (province) {
          this.loadingCities = true;
          this.locationService.getCitiesByProvince(province.id).subscribe({
            next: result => {
              this.cities = result.data ?? [];
              this.loadingCities = false;
              const city = this.cities.find(c => (supplier.location ?? '').startsWith(c.name));
              if (city) this.supplierForm.patchValue({ cityId: city.id });
            },
            error: () => { this.loadingCities = false; }
          });
        }
      }
    } else {
      this.selectedSupplier = null;
      this.supplierForm.reset();
    }
    this.isDialogOpen = true;
  }

  closeDialog(): void {
    if (this.saving) {
      return;
    }
    this.isDialogOpen = false;
    this.selectedSupplier = null;
    this.supplierForm.reset();
  }

  headerActions = [
    { label: 'افزودن تولیدکننده', icon: '➕', color: 'primary', click: () => this.openDialog('add') },
    { label: 'بازخوانی', icon: '🔄', color: 'ghost', click: () => this.loadSuppliers() }
  ];

  invalid(control: string): boolean {
    const field = this.supplierForm.get(control);
    return !!field && field.invalid && (field.dirty || field.touched);
  }

  saveSupplier(): void {
    this.supplierForm.markAllAsTouched();
    if (this.supplierForm.invalid || this.saving || !this.selectedSupplier && this.dialogMode === 'edit') {
      return;
    }

    this.saving = true;
    const raw = this.supplierForm.getRawValue();
    const province = this.provinces.find(p => String(p.id) === String(raw.provinceId));
    const city = this.cities.find(c => String(c.id) === String(raw.cityId));
    const data: CreateSupplierData = {
      name: String(raw.name ?? '').trim(),
      contactInfo: String(raw.contactInfo ?? '').trim(),
      location: city && province ? `${city.name}، ${province.name}` : String(raw.location ?? '').trim()
    };

    if (this.dialogMode === 'add') {
      this.adminService.createSupplier(data).subscribe({
        next: (result) => {
          this.saving = false;
          if (result.isSuccess) {
            this.successMessage = 'تولیدکننده با موفقیت ایجاد شد';
            this.loadSuppliers();
            this.closeDialog();
          } else {
            this.errorMessage = result.errorMessage ?? 'خطا در ایجاد تولیدکننده';
          }
        },
        error: (error: Error) => {
          this.saving = false;
          this.errorMessage = error.message || 'خطا در ایجاد تولیدکننده';
        }
      });
    } else if (this.dialogMode === 'edit' && this.selectedSupplier) {
      this.adminService.updateSupplier(this.selectedSupplier.id, data).subscribe({
        next: (result) => {
          this.saving = false;
          if (result.isSuccess) {
            this.successMessage = 'تولیدکننده با موفقیت ویرایش شد';
            this.loadSuppliers();
            this.closeDialog();
          } else {
            this.errorMessage = result.errorMessage ?? 'خطا در ویرایش تولیدکننده';
          }
        },
        error: (error: Error) => {
          this.saving = false;
          this.errorMessage = error.message || 'خطا در ویرایش تولیدکننده';
        }
      });
    }
  }

  deleteSupplier(supplier: AdminSupplier): void {
    this.confirm.confirmDanger(`آیا از حذف «${supplier.name}» اطمینان دارید؟`).subscribe(ok => {
      if (!ok) return;
      this.busyId = supplier.id;
      this.errorMessage = '';
      this.adminService.deleteSupplier(supplier.id).subscribe({
        next: (result) => {
          this.busyId = '';
          if (result.isSuccess) {
            this.successMessage = 'تولیدکننده با موفقیت حذف شد';
            this.loadSuppliers();
          } else {
            this.errorMessage = result.errorMessage ?? 'خطا در حذف تولیدکننده';
          }
        },
        error: (error: Error) => {
          this.busyId = '';
          this.errorMessage = error.message || 'خطا در حذف تولیدکننده';
        }
      });
    });
  }
}
