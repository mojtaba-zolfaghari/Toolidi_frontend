import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Observable } from 'rxjs';

import { Result } from '../core/models/api-response.model';
import { BarChartDatum } from '../shared/components/bar-chart/bar-chart.component';
import { AdminProduct, AdminSeller, AdminService, AdminUser } from '../core/services/api/admin.service';
import { Discount, DiscountData, DiscountService } from '../core/services/api/discount.service';
import { ProductService } from '../core/services/api/product.service';

/** تب‌های پنل مدیریت */
export type AdminTab = 'users' | 'products' | 'sellers' | 'discounts' | 'reports' | 'settings';

/** تنظیمات سامانه (ذخیره‌سازی محلی) */
interface AppSettings {
  taxRate: number;
  zarinpalMerchantId: string;
  sepMerchantId: string;
}

const SETTINGS_KEY = 'toolidi_admin_settings';

/** پنل مدیریت کاربران، محصولات، فروشندگان، تخفیف‌ها، گزارش‌ها و تنظیمات */
@Component({
  selector: 'app-admin-panel',
  templateUrl: './admin-panel.component.html'
})
export class AdminPanelComponent implements OnInit {
  activeTab: AdminTab = 'users';

  users: AdminUser[] = [];
  products: AdminProduct[] = [];
  sellers: AdminSeller[] = [];
  discounts: Discount[] = [];

  userTotal = 0;
  productTotal = 0;
  sellerTotal = 0;
  discountTotal = 0;

  usersLoading = true;
  productsLoading = false;
  sellersLoading = false;
  discountsLoading = false;

  errorMessage = '';
  actionMessage = '';

  // فرم تخفیف
  discountForm: DiscountData = {
    name: '',
    description: '',
    percentage: 0,
    startDate: '',
    endDate: '',
    isActive: true
  };
  editingDiscountId: string | null = null;

  // تنظیمات
  settings: AppSettings = { taxRate: 9, zarinpalMerchantId: '', sepMerchantId: '' };
  settingsMessage = '';

  constructor(
    private readonly route: ActivatedRoute,
    private readonly adminService: AdminService,
    private readonly productService: ProductService,
    private readonly discountService: DiscountService
  ) {}

  ngOnInit(): void {
    this.settings = this.loadSettings();

    // خواندن تب از پارامتر کوئری (برای لینک‌های سایدبار)
    this.route.queryParamMap.subscribe((params) => {
      const tab = params.get('tab') as AdminTab | null;
      if (tab && this.isValidTab(tab)) {
        this.selectTab(tab);
      } else {
        this.loadUsers();
      }
    });
  }

  private isValidTab(tab: string): tab is AdminTab {
    return ['users', 'products', 'sellers', 'discounts', 'reports', 'settings'].includes(tab);
  }

  // ===== کاربران =====

  loadUsers(): void {
    this.usersLoading = true;
    this.errorMessage = '';
    this.adminService.getUsers({ pageNumber: 1, pageSize: 100 }).subscribe({
      next: (result) => {
        this.users = result.data?.items ?? [];
        this.userTotal = result.data?.totalCount ?? 0;
        this.usersLoading = false;
      },
      error: (err: Error) => {
        this.errorMessage = err.message;
        this.usersLoading = false;
      }
    });
  }

  toggleUser(user: AdminUser): void {
    this.actionMessage = '';
    this.adminService.toggleUserStatus(user.id, !user.isActive).subscribe({
      next: (result) => {
        if (result.isSuccess) {
          user.isActive = !user.isActive;
          this.actionMessage = 'وضعیت کاربر به‌روزرسانی شد.';
        } else {
          this.errorMessage = result.errorMessage ?? 'تغییر وضعیت کاربر انجام نشد.';
        }
      },
      error: (err: Error) => (this.errorMessage = err.message)
    });
  }

  changeRole(user: AdminUser, roleId: string): void {
    const trimmedRoleId = roleId.trim();
    if (!trimmedRoleId) {
      this.errorMessage = 'شناسه نقش را وارد کنید.';
      return;
    }
    this.adminService.updateUserRole(user.id, trimmedRoleId).subscribe({
      next: (result) => {
        this.actionMessage = result.isSuccess ? 'نقش کاربر به‌روزرسانی شد.' : (result.errorMessage ?? 'تغییر نقش انجام نشد.');
      },
      error: (err: Error) => (this.errorMessage = err.message)
    });
  }

  // ===== محصولات =====

  loadProducts(): void {
    this.productsLoading = true;
    this.errorMessage = '';
    this.adminService.getAdminProducts({ page: 1, pageSize: 100 }).subscribe({
      next: (result) => {
        this.products = result.data?.items ?? [];
        this.productTotal = result.data?.totalCount ?? 0;
        this.productsLoading = false;
      },
      error: (err: Error) => {
        this.errorMessage = err.message;
        this.productsLoading = false;
      }
    });
  }

  approveProduct(product: AdminProduct): void {
    this.productService.approveProduct(product.id).subscribe({
      next: (result) => {
        this.actionMessage = result.isSuccess ? 'محصول تأیید شد.' : (result.errorMessage ?? 'تأیید محصول انجام نشد.');
        if (result.isSuccess) {
          product.publishStatus = 'Approved';
        }
      },
      error: (err: Error) => (this.errorMessage = err.message)
    });
  }

  publishProduct(product: AdminProduct): void {
    this.productService.publishProduct(product.id).subscribe({
      next: (result) => {
        this.actionMessage = result.isSuccess ? 'محصول منتشر شد.' : (result.errorMessage ?? 'انتشار محصول انجام نشد.');
        if (result.isSuccess) {
          product.publishStatus = 'Published';
        }
      },
      error: (err: Error) => (this.errorMessage = err.message)
    });
  }

  // ===== فروشندگان =====

  loadSellers(): void {
    this.sellersLoading = true;
    this.errorMessage = '';
    this.adminService.getSellers({ page: 1, pageSize: 100 }).subscribe({
      next: (result) => {
        this.sellers = result.data?.items ?? [];
        this.sellerTotal = result.data?.totalCount ?? 0;
        this.sellersLoading = false;
      },
      error: (err: Error) => {
        this.errorMessage = err.message;
        this.sellersLoading = false;
      }
    });
  }

  verifySeller(seller: AdminSeller): void {
    this.adminService.verifySeller(seller.id).subscribe({
      next: (result) => {
        this.actionMessage = result.isSuccess ? 'فروشنده تأیید شد.' : (result.errorMessage ?? 'تأیید فروشنده انجام نشد.');
        if (result.isSuccess) {
          seller.isVerified = true;
        }
      },
      error: (err: Error) => (this.errorMessage = err.message)
    });
  }

  // ===== تخفیف‌ها =====

  loadDiscounts(): void {
    this.discountsLoading = true;
    this.errorMessage = '';
    this.discountService.getDiscounts({ pageNumber: 1, pageSize: 100 }).subscribe({
      next: (result) => {
        this.discounts = result.data?.items ?? [];
        this.discountTotal = result.data?.totalCount ?? 0;
        this.discountsLoading = false;
      },
      error: (err: Error) => {
        this.errorMessage = err.message;
        this.discountsLoading = false;
      }
    });
  }

  editDiscount(discount: Discount): void {
    this.editingDiscountId = discount.id;
    this.discountForm = {
      name: discount.name,
      description: discount.description ?? '',
      percentage: discount.percentage,
      startDate: this.toDateInput(discount.startDate),
      endDate: this.toDateInput(discount.endDate),
      isActive: discount.isActive
    };
    this.actionMessage = '';
  }

  cancelDiscountEdit(): void {
    this.editingDiscountId = null;
    this.resetDiscountForm();
  }

  saveDiscount(): void {
    if (!this.discountForm.name.trim() || this.discountForm.percentage <= 0) {
      this.errorMessage = 'نام تخفیف و درصد معتبر وارد کنید.';
      return;
    }
    const data: DiscountData = {
      ...this.discountForm,
      startDate: new Date(this.discountForm.startDate).toISOString(),
      endDate: new Date(this.discountForm.endDate).toISOString()
    };

    const request: Observable<Result<unknown>> = this.editingDiscountId
      ? this.discountService.updateDiscount(this.editingDiscountId, data)
      : this.discountService.createDiscount(data);

    request.subscribe({
      next: (result) => {
        if (result.isSuccess) {
          this.actionMessage = this.editingDiscountId ? 'تخفیف ویرایش شد.' : 'تخفیف جدید ایجاد شد.';
          this.cancelDiscountEdit();
          this.loadDiscounts();
        } else {
          this.errorMessage = result.errorMessage ?? 'ذخیره تخفیف انجام نشد.';
        }
      },
      error: (err: Error) => (this.errorMessage = err.message)
    });
  }

  deleteDiscount(discount: Discount): void {
    this.discountService.deleteDiscount(discount.id).subscribe({
      next: (result) => {
        this.actionMessage = result.isSuccess ? 'تخفیف حذف شد.' : (result.errorMessage ?? 'حذف تخفیف انجام نشد.');
        if (result.isSuccess) {
          this.loadDiscounts();
        }
      },
      error: (err: Error) => (this.errorMessage = err.message)
    });
  }

  private resetDiscountForm(): void {
    this.discountForm = {
      name: '',
      description: '',
      percentage: 0,
      startDate: '',
      endDate: '',
      isActive: true
    };
  }

  private toDateInput(value: string): string {
    return value ? value.slice(0, 10) : '';
  }

  // ===== گزارش‌ها =====

  get productStatusChart(): BarChartDatum[] {
    const counts = new Map<string, number>();
    for (const product of this.products) {
      const key = product.publishStatus || 'نامشخص';
      counts.set(key, (counts.get(key) ?? 0) + 1);
    }
    return Array.from(counts.entries()).map(([label, value]) => ({ label, value }));
  }

  get publishedProductsCount(): number {
    return this.products.filter((product) => product.publishStatus === 'Published').length;
  }

  get verifiedSellersCount(): number {
    return this.sellers.filter((seller) => seller.isVerified).length;
  }

  // ===== تنظیمات =====

  saveSettings(): void {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(this.settings));
    this.settingsMessage = 'تنظیمات با موفقیت ذخیره شد (به صورت محلی).';
  }

  private loadSettings(): AppSettings {
    try {
      const raw = localStorage.getItem(SETTINGS_KEY);
      if (raw) {
        return { ...{ taxRate: 9, zarinpalMerchantId: '', sepMerchantId: '' }, ...JSON.parse(raw) };
      }
    } catch {
      /* مقدار نامعتبر نادیده گرفته می‌شود */
    }
    return { taxRate: 9, zarinpalMerchantId: '', sepMerchantId: '' };
  }

  // ===== تب‌بندی =====

  selectTab(tab: AdminTab): void {
    this.activeTab = tab;
    if (tab === 'products' && !this.products.length) {
      this.loadProducts();
    }
    if (tab === 'sellers' && !this.sellers.length) {
      this.loadSellers();
    }
    if (tab === 'discounts' && !this.discounts.length) {
      this.loadDiscounts();
    }
    if (tab === 'reports' && !this.products.length) {
      this.loadProducts();
      this.loadSellers();
    }
  }
}
