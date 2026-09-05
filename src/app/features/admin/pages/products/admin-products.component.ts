import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import {
  AdminService,
  AdminProduct,
  AdminProductDetail,
  AdminProductQueryParams
} from '../../../../core/services/api/admin.service';
import { CategoryService } from '../../../../core/services/api/category.service';
import { ConfirmService } from '../../../../shared/services/confirm.service';
import { TableColumn, TableAction } from '../../../../shared/components/data-table/data-table.component';

/** فیلترهای سمت کلاینت برای لیست مدیر */
interface AdminProductFilters {
  search: string;
  publishStatus: string;
  sellerId: string;
  lowStockOnly: boolean;
  minPrice: number | null;
  maxPrice: number | null;
}

@Component({
  selector: 'app-admin-products',
  templateUrl: './admin-products.component.html',
  styleUrls: ['./admin-products.component.scss']
})
export class AdminProductsComponent implements OnInit {
  products: AdminProduct[] = [];
  loading = true;
  page = 1;
  readonly pageSize = 20;
  totalCount = 0;

  /** فیلترها — همه در یک شیء تا نمایش/پاک‌سازی ساده باشد */
  filters: AdminProductFilters = {
    search: '',
    publishStatus: '',
    sellerId: '',
    lowStockOnly: false,
    minPrice: null,
    maxPrice: null
  };
  /** آیا پنل فیلتر پیشرفته باز است */
  filtersExpanded = false;
  activeFilterCount = 0;

  busyId = '';
  errorMessage = '';
  successMessage = '';

  pendingCount = 0;
  publishedCount = 0;
  draftCount = 0;

  /** دسته‌بندی‌ها برای ویرایش محصول */
  categories: { id: string; name: string }[] = [];

  /** مودال ویرایش محصول */
  editOpen = false;
  editSaving = false;
  editError = '';
  editProductId = '';
  editProductName = '';
  editForm!: FormGroup;

  /** مودال افزایش سریع موجودی */
  restockOpen = false;
  restockSaving = false;
  restockError = '';
  restockProductId = '';
  restockProductName = '';
  restockVariations: { id: string; displayName: string; sku: string; stockQuantity: number; isDefault: boolean }[] = [];
  restockForm!: FormGroup;

  headerActions = [
    { label: 'بازخوانی', icon: '🔄', color: 'ghost' as const, click: () => this.loadProducts() }
  ];

  statusFilterOptions = [
    { value: '', label: 'همه وضعیت‌ها' },
    { value: 'PendingApproval', label: 'در انتظار تأیید' },
    { value: 'Approved', label: 'تأیید شده' },
    { value: 'Published', label: 'منتشر شده' },
    { value: 'Draft', label: 'پیش‌نویس' },
    { value: 'Rejected', label: 'رد شده' }
  ];

  tableColumns: TableColumn[] = [
    { key: 'imageUrl', label: 'تصویر', type: 'image', width: '60px' },
    { key: 'name', label: 'نام محصول', sortable: true },
    { key: 'sku', label: 'SKU' },
    { key: 'price', label: 'قیمت', type: 'currency' },
    { key: 'stockQuantity', label: 'موجودی', type: 'number' },
    { key: 'publishStatus', label: 'وضعیت', type: 'badge', badgeMap: {
      'PendingApproval': { label: 'در انتظار تأیید', color: 'data-table__badge--warning' },
      'Approved': { label: 'تأیید شده', color: 'data-table__badge--info' },
      'Published': { label: 'منتشر شده', color: 'data-table__badge--success' },
      'Draft': { label: 'پیش‌نویس', color: '' },
      'Rejected': { label: 'رد شده', color: 'data-table__badge--danger' }
    }}
  ];

  tableActions: TableAction[] = [
    { label: 'ویرایش', icon: '✏️', color: 'primary', click: (row) => this.openEdit(row) },
    { label: 'افزودن موجودی', icon: '📦', color: 'success', click: (row) => this.openRestock(row), visible: (row) => row.publishStatus !== 'Rejected' },
    { label: 'تأیید', icon: '✅', color: 'success', click: (row) => this.approve(row), visible: (row) => row.publishStatus === 'PendingApproval' },
    { label: 'انتشار', icon: '🚀', color: 'primary', click: (row) => this.publish(row), visible: (row) => row.publishStatus === 'Approved' },
    { label: 'حذف', icon: '🗑️', color: 'danger', click: (row) => this.remove(row) }
  ];

  /** ردیف‌های انتخاب‌شده برای عملیات گروهی */
  selected = new Set<AdminProduct>();
  bulkBusy = false;

  private searchTimeout: ReturnType<typeof setTimeout> | null = null;

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.totalCount / this.pageSize));
  }

  constructor(
    private readonly adminService: AdminService,
    private readonly categoryService: CategoryService,
    private readonly confirm: ConfirmService,
    private readonly fb: FormBuilder
  ) {
    this.editForm = this.buildEditForm();
    this.restockForm = this.buildRestockForm();
  }

  ngOnInit(): void {
    this.loadProducts();
    this.categoryService.getCategories().subscribe({
      next: (paged) => {
        this.categories = (paged.items ?? []).map(c => ({ id: c.id, name: c.name }));
      },
      error: () => { /* دسته‌بندی‌ها اختیاری است */ }
    });
  }

  // ─── Data loading ────────────────────────────────────────────

  loadProducts(): void {
    this.loading = true;
    this.errorMessage = '';
    this.successMessage = '';

    const params: AdminProductQueryParams = {
      page: this.page,
      pageSize: this.pageSize,
    };
    if (this.filters.publishStatus) params.publishStatus = this.filters.publishStatus;
    if (this.filters.search.trim()) params.search = this.filters.search.trim();
    if (this.filters.sellerId.trim()) params.sellerId = this.filters.sellerId.trim();

    this.adminService.getAdminProducts(params).subscribe({
      next: (result) => {
        let items = result.data?.items ?? [];
        // فیلترهای سمت کلاینت (قیمت و موجودی کم) که سمت سرور پشتیبانی نمی‌شوند
        if (this.filters.lowStockOnly) {
          items = items.filter(p => p.stockQuantity == null || p.stockQuantity < 5);
        }
        if (this.filters.minPrice != null) {
          items = items.filter(p => p.unitPrice >= this.filters.minPrice!);
        }
        if (this.filters.maxPrice != null) {
          items = items.filter(p => p.unitPrice <= this.filters.maxPrice!);
        }
        this.products = items;
        this.totalCount = result.data?.totalCount ?? items.length;
        this.loading = false;
        this.computeSummaryCounts();
        this.countActiveFilters();
      },
      error: (error: Error) => {
        this.errorMessage = error.message || 'خطا در بارگذاری محصولات';
        this.loading = false;
      }
    });
  }

  onSearchChange(): void {
    if (this.searchTimeout) clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => {
      this.page = 1;
      this.loadProducts();
    }, 400);
  }

  onFilterChange(): void {
    this.page = 1;
    this.loadProducts();
  }

  /** پاک‌سازی همه فیلترها و بازخوانی */
  clearFilters(): void {
    this.filters = { search: '', publishStatus: '', sellerId: '', lowStockOnly: false, minPrice: null, maxPrice: null };
    this.page = 1;
    this.loadProducts();
  }

  toggleFilters(): void {
    this.filtersExpanded = !this.filtersExpanded;
  }

  private countActiveFilters(): void {
    this.activeFilterCount = [
      this.filters.publishStatus,
      this.filters.sellerId.trim(),
      this.filters.lowStockOnly ? 'x' : '',
      this.filters.minPrice != null ? 'x' : '',
      this.filters.maxPrice != null ? 'x' : ''
    ].filter(v => v !== '').length;
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.page = page;
      this.loadProducts();
    }
  }

  // ─── Product edit dialog ─────────────────────────────────────

  private buildEditForm(): FormGroup {
    return this.fb.group({
      categoryId: ['', Validators.required],
      name: ['', Validators.required],
      sku: ['', Validators.required],
      shortDescription: [''],
      fullDescription: [''],
      unitPrice: [0, [Validators.required, Validators.min(0)]],
      comparePrice: [null as number | null],
      costPrice: [null as number | null],
      isTaxable: [true],
      taxRate: [null as number | null],
      weight: [null as number | null],
      length: [null as number | null],
      width: [null as number | null],
      height: [null as number | null],
      isPhysical: [true],
      isDigital: [false]
    });
  }

  openEdit(product: AdminProduct): void {
    this.editProductId = product.id;
    this.editProductName = product.name;
    this.editError = '';
    this.editForm = this.buildEditForm();
    this.editForm.patchValue({
      categoryId: product.categoryId,
      name: product.name,
      sku: product.sku,
      shortDescription: product.shortDescription ?? '',
      fullDescription: product.fullDescription ?? '',
      unitPrice: product.unitPrice,
      comparePrice: product.comparePrice ?? null,
      costPrice: product.costPrice ?? null,
      isTaxable: product.isTaxable ?? true,
      taxRate: product.taxRate ?? null,
      weight: product.weight ?? null,
      length: product.length ?? null,
      width: product.width ?? null,
      height: product.height ?? null,
      isPhysical: product.isPhysical ?? true,
      isDigital: product.isDigital ?? false
    });
    this.editOpen = true;

    // جزئیات کامل (توضیحات/تنوع‌ها) از سرور برای پیش‌پر کردن دقیق‌تر
    this.adminService.getAdminProductDetail(product.id).subscribe({
      next: (detail) => {
        if (!detail.isSuccess || !detail.data || detail.data.id !== this.editProductId) return;
        const d = detail.data;
        this.editForm.patchValue({
          shortDescription: d.shortDescription ?? '',
          fullDescription: d.fullDescription ?? '',
          comparePrice: d.comparePrice ?? null,
          costPrice: d.costPrice ?? null,
          isTaxable: d.isTaxable,
          taxRate: d.taxRate ?? null,
          weight: d.weight ?? null,
          length: d.length ?? null,
          width: d.width ?? null,
          height: d.height ?? null,
          isPhysical: d.isPhysical,
          isDigital: d.isDigital
        });
        this.restockVariations = d.variations
          .filter(v => v.isActive !== false)
          .map(v => ({ id: v.id, displayName: v.displayName, sku: v.sku, stockQuantity: v.stockQuantity, isDefault: v.isDefault }));
      },
      error: () => { /* fallback: همان داده‌های ردیف */ }
    });
  }

  closeEdit(): void {
    if (!this.editSaving) this.editOpen = false;
  }

  saveEdit(): void {
    this.editForm.markAllAsTouched();
    if (this.editForm.invalid) return;
    const raw = this.editForm.getRawValue();
    this.editSaving = true;
    this.editError = '';
    this.adminService.updateProduct(this.editProductId, {
      categoryId: raw.categoryId,
      name: String(raw.name).trim(),
      sku: String(raw.sku).trim(),
      shortDescription: raw.shortDescription ? String(raw.shortDescription) : undefined,
      fullDescription: raw.fullDescription ? String(raw.fullDescription) : undefined,
      unitPrice: Number(raw.unitPrice) || 0,
      comparePrice: raw.comparePrice != null ? Number(raw.comparePrice) : undefined,
      costPrice: raw.costPrice != null ? Number(raw.costPrice) : undefined,
      isTaxable: !!raw.isTaxable,
      taxRate: raw.taxRate != null ? Number(raw.taxRate) : undefined,
      weight: raw.weight != null ? Number(raw.weight) : undefined,
      length: raw.length != null ? Number(raw.length) : undefined,
      width: raw.width != null ? Number(raw.width) : undefined,
      height: raw.height != null ? Number(raw.height) : undefined,
      isPhysical: !!raw.isPhysical,
      isDigital: !!raw.isDigital
    }).subscribe({
      next: (result) => {
        this.editSaving = false;
        if (result.isSuccess) {
          this.editOpen = false;
          this.successMessage = `محصول «${this.editProductName}» ذخیره شد.`;
          this.loadProducts();
        } else {
          this.editError = result.errorMessage ?? 'ذخیره انجام نشد.';
        }
      },
      error: (error: Error) => {
        this.editSaving = false;
        this.editError = error.message;
      }
    });
  }

  // ─── Quick restock ───────────────────────────────────────────

  private buildRestockForm(): FormGroup {
    return this.fb.group({
      variationId: [''],
      quantity: [10, [Validators.required, Validators.min(1)]]
    });
  }

  openRestock(product: AdminProduct): void {
    this.restockProductId = product.id;
    this.restockProductName = product.name;
    this.restockError = '';
    this.restockVariations = [];
    this.restockForm = this.buildRestockForm();
    this.restockOpen = true;

    this.adminService.getAdminProductDetail(product.id).subscribe({
      next: (detail) => {
        if (!detail.isSuccess || !detail.data || detail.data.id !== this.restockProductId) return;
        this.restockVariations = detail.data.variations
          .filter(v => v.isActive !== false)
          .map(v => ({ id: v.id, displayName: v.displayName, sku: v.sku, stockQuantity: v.stockQuantity, isDefault: v.isDefault }));
      },
      error: () => { /* بدون تنوع هم قابل استفاده است */ }
    });
  }

  closeRestock(): void {
    if (!this.restockSaving) this.restockOpen = false;
  }

  restockVariationLabel(v: { displayName: string; sku: string; stockQuantity: number; isDefault: boolean }): string {
    const parts = [v.displayName || v.sku];
    if (v.isDefault) parts.push('پیش‌فرض');
    parts.push(`موجودی: ${v.stockQuantity}`);
    return parts.join(' — ');
  }

  saveRestock(): void {
    this.restockForm.markAllAsTouched();
    if (this.restockForm.invalid) return;
    const raw = this.restockForm.getRawValue();
    this.restockSaving = true;
    this.restockError = '';
    this.adminService.restockProduct(
      this.restockProductId,
      Number(raw.quantity),
      raw.variationId ? String(raw.variationId) : null
    ).subscribe({
      next: (result) => {
        this.restockSaving = false;
        if (result.isSuccess) {
          this.restockOpen = false;
          this.successMessage = `موجودی «${this.restockProductName}» به‌روزرسانی شد.`;
          this.loadProducts();
        } else {
          this.restockError = result.errorMessage ?? 'به‌روزرسانی موجودی انجام نشد.';
        }
      },
      error: (error: Error) => {
        this.restockSaving = false;
        this.restockError = error.message;
      }
    });
  }

  // ─── Status actions ──────────────────────────────────────────

  approve(product: AdminProduct): void {
    this.busyId = product.id;
    this.clearMessages();
    this.adminService.approveProduct(product.id).subscribe({
      next: (result) => {
        this.busyId = '';
        if (result.isSuccess) {
          product.publishStatus = 'Approved';
          this.successMessage = `محصول «${product.name}» تأیید شد.`;
          this.computeSummaryCounts();
        } else {
          this.errorMessage = result.errorMessage ?? 'تأیید محصول انجام نشد.';
        }
      },
      error: (error: Error) => { this.busyId = ''; this.errorMessage = error.message; }
    });
  }

  publish(product: AdminProduct): void {
    this.busyId = product.id;
    this.clearMessages();
    this.adminService.publishProduct(product.id).subscribe({
      next: (result) => {
        this.busyId = '';
        if (result.isSuccess) {
          product.publishStatus = 'Published';
          this.successMessage = `محصول «${product.name}» منتشر شد.`;
          this.computeSummaryCounts();
        } else {
          this.errorMessage = result.errorMessage ?? 'انتشار محصول انجام نشد.';
        }
      },
      error: (error: Error) => { this.busyId = ''; this.errorMessage = error.message; }
    });
  }

  remove(product: AdminProduct): void {
    this.confirm.confirmDanger(`آیا از حذف محصول «${product.name}» مطمئن هستید؟`).subscribe(ok => {
      if (!ok) return;
      this.busyId = product.id;
      this.clearMessages();
      this.adminService.deleteProduct(product.id).subscribe({
        next: (result) => {
          this.busyId = '';
          if (result.isSuccess) {
            this.successMessage = `محصول «${product.name}» حذف شد.`;
            this.loadProducts();
          } else {
            this.errorMessage = result.errorMessage ?? 'حذف محصول انجام نشد.';
          }
        },
        error: (error: Error) => { this.busyId = ''; this.errorMessage = error.message; }
      });
    });
  }

  // ─── Bulk ────────────────────────────────────────────────────

  onSelectionChange(rows: AdminProduct[]): void {
    this.selected = new Set(rows);
  }

  clearSelection(): void {
    this.selected.clear();
  }

  bulkApprove(): void {
    this.applyBulkStatus('Approved', 'محصولات انتخابی تأیید شدند.');
  }

  bulkReject(): void {
    this.confirm.confirmDanger('آیا از رد محصولات انتخاب‌شده مطمئن هستید؟', 'رد گروهی', 'رد محصولات').subscribe(ok => {
      if (!ok) return;
      this.applyBulkStatus('Rejected', 'محصولات انتخابی رد شدند.');
    });
  }

  private applyBulkStatus(status: string, successMessage: string): void {
    const ids = Array.from(this.selected).map(p => p.id);
    if (!ids.length) return;
    this.bulkBusy = true;
    this.clearMessages();
    this.adminService.bulkUpdateProductStatus(ids, status).subscribe({
      next: (result) => {
        this.bulkBusy = false;
        if (result.isSuccess) {
          const failed = (result.data ?? []).filter(e => !e.success);
          if (failed.length) {
            this.errorMessage = `${failed.length} مورد انجام نشد.`;
          } else {
            this.successMessage = successMessage;
          }
          this.clearSelection();
          this.loadProducts();
        } else {
          this.errorMessage = result.errorMessage ?? 'عملیات گروهی انجام نشد.';
        }
      },
      error: (error: Error) => { this.bulkBusy = false; this.errorMessage = error.message; }
    });
  }

  private clearMessages(): void {
    this.errorMessage = '';
    this.successMessage = '';
  }

  private computeSummaryCounts(): void {
    const list = this.products;
    this.pendingCount = list.filter(p => p.publishStatus === 'PendingApproval').length;
    this.publishedCount = list.filter(p => p.publishStatus === 'Published').length;
    this.draftCount = list.filter(p => p.publishStatus === 'Draft').length;
  }
}
