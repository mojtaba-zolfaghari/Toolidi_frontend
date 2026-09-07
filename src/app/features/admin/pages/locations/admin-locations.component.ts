import { AfterViewInit, Component, OnInit, ViewChild } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { Observable } from 'rxjs';

import { Result } from '../../../../core/models/api-response.model';
import { ConfirmService } from '../../../../shared/services/confirm.service';
import {
  LocationService,
  Province,
  City,
  RegistrationRestriction,
  ProvinceData,
  CityData
} from '../../../../core/services/api/location.service';

type Tab = 'provinces' | 'cities' | 'supplier-restrictions' | 'agent-restrictions';

const TAB_ORDER: Tab[] = ['provinces', 'cities', 'supplier-restrictions', 'agent-restrictions'];

/**
 * مدیریت مکان‌ها (استان/شهر/محدودیت ثبت‌نام) — TASK-FE-REDESIGN-LOCATIONS.
 * کاملاً Angular Material: mat-tab-group برای ناوبری، mat-table با mat-sort و
 * mat-paginator برای هر جدول، mat-form-field/mat-select برای فیلترها و فرم‌ها.
 * هیچ کلاس کمکی Tailwind در قالب استفاده نشده است.
 */
@Component({
  selector: 'app-admin-locations',
  templateUrl: './admin-locations.component.html',
  styleUrls: ['./admin-locations.component.scss']
})
export class AdminLocationsComponent implements OnInit, AfterViewInit {
  // ─── Tab ──────────────────────────────────────────────────────
  readonly tabOrder = TAB_ORDER;
  activeTabIndex = 0;
  activeTab: Tab = 'provinces';

  // ─── Data ─────────────────────────────────────────────────────
  provinces: Province[] = [];
  allCities: City[] = [];
  filteredCities: City[] = [];
  supplierRestrictions: RegistrationRestriction[] = [];
  agentRestrictions: RegistrationRestriction[] = [];

  // ─── Material tables ──────────────────────────────────────────
  readonly provinceColumns = ['name', 'code', 'isActive', 'actions'];
  readonly cityColumns = ['name', 'code', 'province', 'isActive', 'actions'];
  readonly restrictionColumns = ['provinceName', 'cityName', 'actions'];
  readonly provincesDataSource = new MatTableDataSource<Province>([]);
  readonly citiesDataSource = new MatTableDataSource<City>([]);

  @ViewChild('provincePaginator') provincePaginator?: MatPaginator;
  @ViewChild('cityPaginator') cityPaginator?: MatPaginator;
  @ViewChild('provinceSort') provinceSort?: MatSort;
  @ViewChild('citySort') citySort?: MatSort;

  provincePageSize = 10;
  cityPageSize = 10;

  // ─── Header actions ───────────────────────────────────────────
  readonly headerActions: Array<{ label: string; icon?: string; click: () => void }> = [
    { label: 'بازخوانی', click: () => this.loadAll() },
  ];

  // ─── Loading States ───────────────────────────────────────────
  loading = true;
  loadingCities = true;
  loadingSupplierRestrictions = true;
  loadingAgentRestrictions = true;
  saving = false;

  // ─── Messages ─────────────────────────────────────────────────
  errorMessage = '';
  successMessage = '';
  formError = '';

  // ─── Province Form ────────────────────────────────────────────
  provinceForm: FormGroup;
  provinceFormOpen = false;
  editingProvinceId: string | null = null;

  // ─── City Form ────────────────────────────────────────────────
  cityForm: FormGroup;
  cityFormOpen = false;
  editingCityId: string | null = null;
  cityFilterProvinceId = '';

  // ─── Restriction Forms ────────────────────────────────────────
  supplierRestriction: { provinceId: string; cityId: string } = { provinceId: '', cityId: '' };
  supplierCities: City[] = [];
  agentRestriction: { provinceId: string; cityId: string } = { provinceId: '', cityId: '' };
  agentCities: City[] = [];

  private provinceNameMap = new Map<string, string>();

  constructor(
    private readonly fb: FormBuilder,
    private readonly locationService: LocationService,
    private readonly confirm: ConfirmService
  ) {
    this.provinceForm = this.fb.group({
      name: ['', [Validators.required, Validators.maxLength(100)]],
      code: ['', [Validators.required, Validators.maxLength(10)]],
      isActive: [true]
    });

    this.cityForm = this.fb.group({
      provinceId: ['', Validators.required],
      name: ['', [Validators.required, Validators.maxLength(100)]],
      code: ['', [Validators.required, Validators.maxLength(10)]],
      isActive: [true]
    });
  }

  ngOnInit(): void {
    this.loadAll();
  }

  ngAfterViewInit(): void {
    // mat-tab bodies render lazily — the paginators/sorts inside the active tab
    // are only available after the tab group's own change detection, so attach
    // deferred here and again whenever data lands (see attachTableControls).
    setTimeout(() => this.attachTableControls());
  }

  /** (Re)attach paginator/sort to the data sources once tab content exists. */
  private attachTableControls(): void {
    this.provincesDataSource.paginator = this.provincePaginator ?? null;
    this.provincesDataSource.sort = this.provinceSort ?? null;
    this.citiesDataSource.paginator = this.cityPaginator ?? null;
    this.citiesDataSource.sort = this.citySort ?? null;
  }

  // ─── Tab Switching (mat-tab-group ↔ state) ────────────────────

  onTabIndexChange(index: number): void {
    this.activeTabIndex = index;
    this.activeTab = TAB_ORDER[index] ?? 'provinces';
    this.clearMessages();

    if (this.activeTab === 'supplier-restrictions' && !this.supplierRestrictions.length && this.loadingSupplierRestrictions) {
      this.loadSupplierRestrictions();
    }
    if (this.activeTab === 'agent-restrictions' && !this.agentRestrictions.length && this.loadingAgentRestrictions) {
      this.loadAgentRestrictions();
    }
    if (this.activeTab === 'cities' && !this.allCities.length && !this.loadingCities) {
      this.loadAllCities();
    }
  }

  // ─── Load All Data ────────────────────────────────────────────

  loadAll(): void {
    this.errorMessage = '';
    this.loadProvinces();
  }

  loadProvinces(): void {
    this.loading = true;
    this.locationService.getProvinces().subscribe({
      next: (result) => {
        this.provinces = result.data ?? [];
        this.provincesDataSource.data = this.provinces;
        this.provinceNameMap.clear();
        for (const p of this.provinces) {
          this.provinceNameMap.set(p.id, p.name);
        }
        this.loading = false;
        setTimeout(() => this.attachTableControls());
        this.loadAllCities();
      },
      error: (error: Error) => {
        this.errorMessage = error.message;
        this.loading = false;
      }
    });
  }

  loadAllCities(): void {
    this.loadingCities = true;
    // Load cities for all provinces
    const requests = this.provinces.map(p => this.locationService.getCitiesByProvince(p.id));
    if (requests.length === 0) {
      this.allCities = [];
      this.applyCityFilter();
      this.loadingCities = false;
      return;
    }

    // Use sequential loading since we need all cities.
    // NB: the cities endpoint does not return provinceId on each city — but we
    // requested per-province, so tag them here (also makes the استان column work).
    let loaded = 0;
    const allCities: City[] = [];
    for (let i = 0; i < requests.length; i++) {
      const provinceId = this.provinces[i].id;
      requests[i].subscribe({
        next: (result) => {
          const cities = (result.data ?? []).map(c => ({ ...c, provinceId }));
          allCities.push(...cities);
          loaded++;
          if (loaded === requests.length) {
            this.allCities = allCities;
            this.applyCityFilter();
            this.loadingCities = false;
            setTimeout(() => this.attachTableControls());
          }
        },
        error: () => {
          loaded++;
          if (loaded === requests.length) {
            this.allCities = allCities;
            this.applyCityFilter();
            this.loadingCities = false;
            setTimeout(() => this.attachTableControls());
          }
        }
      });
    }
  }

  loadSupplierRestrictions(): void {
    this.loadingSupplierRestrictions = true;
    this.locationService.getSupplierRestrictions().subscribe({
      next: (result) => {
        this.supplierRestrictions = result.data ?? [];
        this.loadingSupplierRestrictions = false;
      },
      error: () => { this.loadingSupplierRestrictions = false; }
    });
  }

  loadAgentRestrictions(): void {
    this.loadingAgentRestrictions = true;
    this.locationService.getAgentRestrictions().subscribe({
      next: (result) => {
        this.agentRestrictions = result.data ?? [];
        this.loadingAgentRestrictions = false;
      },
      error: () => { this.loadingAgentRestrictions = false; }
    });
  }

  // ─── Province CRUD ────────────────────────────────────────────

  openProvinceForm(province?: Province): void {
    this.formError = '';
    if (province) {
      this.editingProvinceId = province.id;
      this.provinceForm.patchValue({
        name: province.name,
        code: province.code,
        isActive: province.isActive
      });
    } else {
      this.editingProvinceId = null;
      this.provinceForm.reset({ name: '', code: '', isActive: true });
    }
    this.provinceFormOpen = true;
  }

  closeProvinceForm(): void {
    if (!this.saving) this.provinceFormOpen = false;
  }

  saveProvince(): void {
    this.provinceForm.markAllAsTouched();
    if (this.provinceForm.invalid) {
      this.formError = 'لطفاً همه فیلدهای الزامی را تکمیل کنید.';
      return;
    }

    this.saving = true;
    this.formError = '';
    const value = this.provinceForm.getRawValue();
    const data: ProvinceData = { name: value.name.trim(), code: value.code.trim(), isActive: value.isActive };

    const request$: Observable<Result<unknown>> = this.editingProvinceId
      ? this.locationService.updateProvince(this.editingProvinceId, data)
      : this.locationService.createProvince(data);

    request$.subscribe({
      next: (result: Result<unknown>) => {
        this.saving = false;
        if (result.isSuccess) {
          this.provinceFormOpen = false;
          this.successMessage = this.editingProvinceId ? 'استان ویرایش شد.' : 'استان جدید ایجاد شد.';
          this.loadProvinces();
        } else {
          this.formError = result.errorMessage ?? 'ذخیره استان انجام نشد.';
        }
      },
      error: (error: Error) => { this.saving = false; this.formError = error.message; }
    });
  }

  viewCitiesForProvince(province: Province): void {
    this.cityFilterProvinceId = province.id;
    this.activeTabIndex = TAB_ORDER.indexOf('cities');
    this.activeTab = 'cities';
    this.applyCityFilter();
  }

  // ─── City CRUD ────────────────────────────────────────────────

  filterCitiesByProvince(provinceId: string): void {
    this.cityFilterProvinceId = provinceId;
    this.applyCityFilter();
  }

  private applyCityFilter(): void {
    if (!this.cityFilterProvinceId) {
      this.filteredCities = [...this.allCities];
    } else {
      this.filteredCities = this.allCities.filter(c => c.provinceId === this.cityFilterProvinceId);
    }
    this.citiesDataSource.data = this.filteredCities;
  }

  openCityForm(city?: City): void {
    this.formError = '';
    if (city) {
      this.editingCityId = city.id;
      this.cityForm.patchValue({
        provinceId: city.provinceId,
        name: city.name,
        code: city.code,
        isActive: city.isActive
      });
    } else {
      this.editingCityId = null;
      this.cityForm.reset({ provinceId: this.cityFilterProvinceId || '', name: '', code: '', isActive: true });
    }
    this.cityFormOpen = true;
  }

  closeCityForm(): void {
    if (!this.saving) this.cityFormOpen = false;
  }

  saveCity(): void {
    this.cityForm.markAllAsTouched();
    if (this.cityForm.invalid) {
      this.formError = 'لطفاً همه فیلدهای الزامی را تکمیل کنید.';
      return;
    }

    this.saving = true;
    this.formError = '';
    const value = this.cityForm.getRawValue();
    const data: CityData = { provinceId: value.provinceId, name: value.name.trim(), code: value.code.trim(), isActive: value.isActive };

    const request$: Observable<Result<unknown>> = this.editingCityId
      ? this.locationService.updateCity(this.editingCityId, data)
      : this.locationService.createCity(data);

    request$.subscribe({
      next: (result: Result<unknown>) => {
        this.saving = false;
        if (result.isSuccess) {
          this.cityFormOpen = false;
          this.successMessage = this.editingCityId ? 'شهر ویرایش شد.' : 'شهر جدید ایجاد شد.';
          this.loadAllCities();
        } else {
          this.formError = result.errorMessage ?? 'ذخیره شهر انجام نشد.';
        }
      },
      error: (error: Error) => { this.saving = false; this.formError = error.message; }
    });
  }

  getProvinceName(provinceId: string): string {
    return this.provinceNameMap.get(provinceId) ?? '—';
  }

  // ─── Paginator/sort refresh helpers ───────────────────────────

  onProvincePage(): void {
    // paginator state is kept by MatPaginator itself; hook kept for analytics
  }

  onCityPage(): void {
    // paginator state is kept by MatPaginator itself; hook kept for analytics
  }

  // ─── Supplier Restrictions ────────────────────────────────────

  onSupplierProvinceChange(): void {
    this.supplierRestriction.cityId = '';
    this.supplierCities = [];
    if (this.supplierRestriction.provinceId) {
      this.locationService.getCitiesByProvince(this.supplierRestriction.provinceId).subscribe({
        next: (result) => { this.supplierCities = result.data ?? []; },
        error: () => { this.supplierCities = []; }
      });
    }
  }

  addSupplierRestriction(): void {
    if (!this.supplierRestriction.provinceId) return;

    this.locationService.addSupplierRestriction({
      provinceId: this.supplierRestriction.provinceId || undefined,
      cityId: this.supplierRestriction.cityId || undefined
    }).subscribe({
      next: (result) => {
        if (result.isSuccess) {
          this.successMessage = 'محدودیت فروشنده اضافه شد.';
          this.supplierRestriction = { provinceId: '', cityId: '' };
          this.supplierCities = [];
          this.loadSupplierRestrictions();
        } else {
          this.errorMessage = result.errorMessage ?? 'افزودن محدودیت انجام نشد.';
        }
      },
      error: (error: Error) => { this.errorMessage = error.message; }
    });
  }

  removeSupplierRestriction(restriction: RegistrationRestriction): void {
    this.confirm.confirmDanger('آیا از حذف این محدودیت مطمئن هستید؟').subscribe(ok => {
      if (!ok) return;
      this.locationService.removeSupplierRestriction(restriction.id).subscribe({
        next: (result) => {
          if (result.isSuccess) {
            this.successMessage = 'محدودیت حذف شد.';
            this.loadSupplierRestrictions();
          } else {
            this.errorMessage = result.errorMessage ?? 'حذف محدودیت انجام نشد.';
          }
        },
        error: (error: Error) => { this.errorMessage = error.message; }
      });
    });
  }

  // ─── Agent Restrictions ───────────────────────────────────────

  onAgentProvinceChange(): void {
    this.agentRestriction.cityId = '';
    this.agentCities = [];
    if (this.agentRestriction.provinceId) {
      this.locationService.getCitiesByProvince(this.agentRestriction.provinceId).subscribe({
        next: (result) => { this.agentCities = result.data ?? []; },
        error: () => { this.agentCities = []; }
      });
    }
  }

  addAgentRestriction(): void {
    if (!this.agentRestriction.provinceId) return;

    this.locationService.addAgentRestriction({
      provinceId: this.agentRestriction.provinceId || undefined,
      cityId: this.agentRestriction.cityId || undefined
    }).subscribe({
      next: (result) => {
        if (result.isSuccess) {
          this.successMessage = 'محدودیت کارپخش اضافه شد.';
          this.agentRestriction = { provinceId: '', cityId: '' };
          this.agentCities = [];
          this.loadAgentRestrictions();
        } else {
          this.errorMessage = result.errorMessage ?? 'افزودن محدودیت انجام نشد.';
        }
      },
      error: (error: Error) => { this.errorMessage = error.message; }
    });
  }

  removeAgentRestriction(restriction: RegistrationRestriction): void {
    this.confirm.confirmDanger('آیا از حذف این محدودیت مطمئن هستید؟').subscribe(ok => {
      if (!ok) return;
      this.locationService.removeAgentRestriction(restriction.id).subscribe({
        next: (result) => {
          if (result.isSuccess) {
            this.successMessage = 'محدودیت حذف شد.';
            this.loadAgentRestrictions();
          } else {
            this.errorMessage = result.errorMessage ?? 'حذف محدودیت انجام نشد.';
          }
        },
        error: (error: Error) => { this.errorMessage = error.message; }
      });
    });
  }

  // ─── Helpers ──────────────────────────────────────────────────

  private clearMessages(): void {
    this.errorMessage = '';
    this.successMessage = '';
  }
}
