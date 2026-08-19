import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

import { AdminProduct, AdminSeller, AdminService } from '../../core/services/api/admin.service';
import { Product, ProductService } from '../../core/services/api/product.service';
import { SellerService } from '../../core/services/api/seller.service';
import { ACCESS_TOKEN_KEY } from '../../core/interceptors/token.interceptor';
import { getRoleFromToken } from '../../core/utils/jwt.util';

/** وضعیت‌های انتشار محصول در بک‌اند */
const STATUS_OPTIONS = [
  { value: 'Draft', label: 'پیش‌نویس' },
  { value: 'PendingApproval', label: 'در انتظار تأیید' },
  { value: 'Approved', label: 'تأییدشده' },
  { value: 'Published', label: 'منتشرشده' },
  { value: 'Rejected', label: 'ردشده' }
];

/** صفحه فهرست محصولات برای مدیر و فروشنده */
@Component({
  selector: 'app-product-list',
  templateUrl: './product-list.component.html'
})
export class ProductListComponent implements OnInit {
  isAdmin = false;

  adminProducts: AdminProduct[] = [];
  sellerProducts: Product[] = [];
  sellers: AdminSeller[] = [];

  page = 1;
  pageSize = 10;
  totalCount = 0;

  statusFilter = '';
  sellerFilter = '';
  search = '';

  loading = true;
  actionLoading = false;
  errorMessage = '';
  actionMessage = '';

  statusOptions = STATUS_OPTIONS;

  constructor(
    private readonly router: Router,
    private readonly adminService: AdminService,
    private readonly sellerService: SellerService,
    private readonly productService: ProductService
  ) {}

  ngOnInit(): void {
    const token = localStorage.getItem(ACCESS_TOKEN_KEY) ?? '';
    this.isAdmin = getRoleFromToken(token) === 'Admin';
    if (this.isAdmin) {
      this.loadSellers();
    }
    this.load();
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.totalCount / this.pageSize));
  }

  /** بارگذاری لیست محصولات بر اساس نقش */
  load(): void {
    this.loading = true;
    this.errorMessage = '';

    if (this.isAdmin) {
      this.adminService
        .getAdminProducts({
          publishStatus: this.statusFilter || undefined,
          sellerId: this.sellerFilter || undefined,
          search: this.search || undefined,
          page: this.page,
          pageSize: this.pageSize
        })
        .subscribe({
          next: (result) => {
            this.adminProducts = result.data?.items ?? [];
            this.totalCount = result.data?.totalCount ?? 0;
            this.loading = false;
          },
          error: (err: Error) => {
            this.errorMessage = err.message;
            this.loading = false;
          }
        });
    } else {
      this.sellerService.getProducts({ page: this.page, pageSize: this.pageSize }).subscribe({
        next: (result) => {
          this.sellerProducts = result.data?.items ?? [];
          this.totalCount = result.data?.totalCount ?? 0;
          this.loading = false;
        },
        error: (err: Error) => {
          this.errorMessage = err.message;
          this.loading = false;
        }
      });
    }
  }

  /** بارگذاری فروشندگان برای فیلتر (مدیر) */
  private loadSellers(): void {
    this.adminService.getSellers({ page: 1, pageSize: 100 }).subscribe({
      next: (result) => (this.sellers = result.data?.items ?? []),
      error: () => (this.sellers = [])
    });
  }

  /** اعمال فیلترها */
  applyFilters(): void {
    this.page = 1;
    this.load();
  }

  /** تغییر صفحه */
  onPageChange(page: number): void {
    this.page = page;
    this.load();
  }

  /** ایجاد محصول جدید */
  createProduct(): void {
    const base = this.isAdmin ? '/admin' : '/seller';
    this.router.navigate([`${base}/products/new`]);
  }

  /** ویرایش محصول برای مدیر یا فروشنده */
  editProduct(id: string): void {
    const base = this.isAdmin ? '/admin' : '/seller';
    this.router.navigate([`${base}/products/edit/${id}`]);
  }

  /** تأیید محصول (مدیر) */
  approve(product: AdminProduct): void {
    this.actionMessage = '';
    this.actionLoading = true;
    this.productService.approveProduct(product.id).subscribe({
      next: (result) => {
        this.actionLoading = false;
        if (result.isSuccess) {
          product.publishStatus = 'Approved';
          this.actionMessage = 'محصول تأیید شد.';
        } else {
          this.errorMessage = result.errorMessage ?? 'تأیید محصول انجام نشد.';
        }
      },
      error: (err: Error) => {
        this.actionLoading = false;
        this.errorMessage = err.message;
      }
    });
  }

  /** انتشار محصول (مدیر) */
  publish(product: AdminProduct): void {
    this.actionMessage = '';
    this.actionLoading = true;
    this.productService.publishProduct(product.id).subscribe({
      next: (result) => {
        this.actionLoading = false;
        if (result.isSuccess) {
          product.publishStatus = 'Published';
          this.actionMessage = 'محصول منتشر شد.';
        } else {
          this.errorMessage = result.errorMessage ?? 'انتشار محصول انجام نشد.';
        }
      },
      error: (err: Error) => {
        this.actionLoading = false;
        this.errorMessage = err.message;
      }
    });
  }

  /** انتشار محصول فروشنده */
  publishSellerProduct(product: Product): void {
    this.actionMessage = '';
    this.actionLoading = true;
    this.productService.publishProduct(product.id).subscribe({
      next: (result) => {
        this.actionLoading = false;
        if (result.isSuccess) this.actionMessage = 'محصول منتشر شد.';
        else this.errorMessage = result.errorMessage ?? 'انتشار محصول انجام نشد.';
      },
      error: (err: Error) => { this.actionLoading = false; this.errorMessage = err.message; }
    });
  }

  /** رد محصول در نبود endpoint اختصاصی؛ حذف نرم به عنوان اقدام جایگزین */
  reject(product: AdminProduct): void {
    if (window.confirm('محصول رد شود؟ این اقدام محصول را به صورت نرم حذف می‌کند.')) this.removeProduct(product.id);
  }

  /** حذف (نرم) محصول — مدیر و فروشنده */
  removeProduct(id: string): void {
    if (!confirm('آیا از حذف این محصول مطمئن هستید؟')) {
      return;
    }
    this.actionMessage = '';
    this.actionLoading = true;
    this.productService.deleteProduct(id).subscribe({
      next: (result) => {
        this.actionLoading = false;
        if (result.isSuccess) {
          this.actionMessage = 'محصول حذف شد.';
          this.load();
        } else {
          this.errorMessage = result.errorMessage ?? 'حذف محصول انجام نشد.';
        }
      },
      error: (err: Error) => {
        this.actionLoading = false;
        this.errorMessage = err.message;
      }
    });
  }

  /** نام فروشنده بر اساس شناسه */
  sellerName(sellerId: string): string {
    return this.sellers.find((seller) => seller.id === sellerId)?.companyName ?? sellerId;
  }

  /** برچسب فارسی وضعیت */
  statusLabel(status: string): string {
    return this.statusOptions.find((option) => option.value === status)?.label ?? (status || 'نامشخص');
  }

  /** کلاس رنگ وضعیت */
  statusClass(status: string): string {
    switch (status) {
      case 'PendingApproval':
      case 'Draft':
        return 'bg-orange-50 text-orange-600';
      case 'Approved':
        return 'bg-blue-50 text-blue-600';
      case 'Published':
        return 'bg-green-50 text-green-600';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  }
}
