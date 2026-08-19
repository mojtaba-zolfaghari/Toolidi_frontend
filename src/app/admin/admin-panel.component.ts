import { Component, OnInit } from '@angular/core';

import { AdminProduct, AdminSeller, AdminService, AdminUser } from '../core/services/api/admin.service';
import { ProductService } from '../core/services/api/product.service';

/** پنل مدیریت کاربران، محصولات و فروشندگان */
@Component({
  selector: 'app-admin-panel',
  templateUrl: './admin-panel.component.html'
})
export class AdminPanelComponent implements OnInit {
  activeTab: 'users' | 'products' | 'sellers' = 'users';
  users: AdminUser[] = [];
  products: AdminProduct[] = [];
  sellers: AdminSeller[] = [];
  userTotal = 0;
  productTotal = 0;
  sellerTotal = 0;
  usersLoading = true;
  productsLoading = false;
  sellersLoading = false;
  errorMessage = '';
  actionMessage = '';

  constructor(
    private readonly adminService: AdminService,
    private readonly productService: ProductService
  ) {}

  ngOnInit(): void {
    this.loadUsers();
  }

  /** بارگذاری کاربران */
  loadUsers(): void {
    this.usersLoading = true;
    this.errorMessage = '';
    this.adminService.getUsers({ pageNumber: 1, pageSize: 50 }).subscribe({
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

  /** بارگذاری همه محصولات با وضعیت انتشار */
  loadProducts(): void {
    this.productsLoading = true;
    this.errorMessage = '';
    this.adminService.getAdminProducts({ page: 1, pageSize: 50 }).subscribe({
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

  /** بارگذاری فروشندگان */
  loadSellers(): void {
    this.sellersLoading = true;
    this.errorMessage = '';
    this.adminService.getSellers({ page: 1, pageSize: 50 }).subscribe({
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

  /** تغییر تب پنل */
  selectTab(tab: 'users' | 'products' | 'sellers'): void {
    this.activeTab = tab;
    if (tab === 'products' && !this.products.length) {
      this.loadProducts();
    }
    if (tab === 'sellers' && !this.sellers.length) {
      this.loadSellers();
    }
  }

  /** فعال یا غیرفعال کردن کاربر */
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

  /** تغییر نقش کاربر با شناسه نقش */
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

  /** تأیید محصول توسط مدیر */
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

  /** انتشار محصول تأییدشده */
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

  /** تأیید فروشنده */
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
}
