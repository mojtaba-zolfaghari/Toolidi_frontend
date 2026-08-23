import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

import { AuthService } from '../../core/services/api/auth.service';
import { AuthStateService } from '../../core/services/auth-state.service';
import { ACCESS_TOKEN_KEY } from '../../core/interceptors/token.interceptor';
import { getRoleFromToken, getUsernameFromToken } from '../../core/utils/jwt.util';

/** آیتم ناوبری سایدبار */
interface NavItem {
  label: string;
  path: string;
  icon: string;
}

/**
 * قالب مشترک پنل مدیریت و فروشنده؛ شامل سایدبار راست‌چین، هدر و ناحیه‌ی محتوا.
 */
@Component({
  selector: 'app-admin-layout',
  templateUrl: './admin-layout.component.html'
})
export class AdminLayoutComponent implements OnInit {
  isAdmin = false;
  username = '';
  roleLabel = '';
  menuOpen = false;

  navItems: NavItem[] = [];

  constructor(
    private readonly router: Router,
    private readonly authService: AuthService,
    private readonly authState: AuthStateService
  ) {}

  ngOnInit(): void {
    const token = localStorage.getItem(ACCESS_TOKEN_KEY) ?? '';
    this.isAdmin = getRoleFromToken(token) === 'Admin';
    this.username = getUsernameFromToken(token) ?? 'کاربر';
    const url = window.location.pathname;
    if (this.isAdmin) {
      this.roleLabel = 'مدیر';
    } else if (url.startsWith('/supplier')) {
      this.roleLabel = 'تأمین‌کننده';
    } else {
      this.roleLabel = 'فروشنده';
    }
    this.buildNav();
  }

  /** ساخت آیتم‌های منو بر اساس نقش */
  private buildNav(): void {
    if (this.isAdmin) {
      this.navItems = [
        { label: 'داشبورد', path: '/admin', icon: 'dashboard' },
        { label: 'محصولات', path: '/admin/products', icon: 'products' },
        { label: 'کاربران', path: '/admin/users', icon: 'users' },
        { label: 'فروشندگان', path: '/admin/sellers', icon: 'sellers' },
        { label: 'قوانین کمیسیون', path: '/admin/commission-rules', icon: 'commission' },
        { label: 'تسویه‌ها', path: '/admin/payouts', icon: 'wallet' },
        { label: 'نظرسنجی‌ها', path: '/admin/surveys', icon: 'report' },
        { label: 'هزینه‌ها', path: '/admin/costs', icon: 'wallet' },
        { label: 'تخفیف‌ها', path: '/admin/discounts', icon: 'discount' },
        { label: 'گزارش‌ها', path: '/admin/reports', icon: 'report' },
        { label: 'تنظیمات', path: '/admin/settings', icon: 'settings' }
      ];
    } else if (this.roleLabel === 'تأمین‌کننده' || this.router.url.startsWith('/supplier')) {
      this.navItems = [
        { label: 'داشبورد', path: '/supplier', icon: 'dashboard' },
        { label: 'محصولات', path: '/supplier/products', icon: 'products' },
        { label: 'سفارشات', path: '/supplier/orders', icon: 'orders' },
        { label: 'پروفایل', path: '/supplier/profile', icon: 'settings' }
      ];
    } else {
      this.navItems = [
        { label: 'داشبورد', path: '/seller', icon: 'dashboard' },
        { label: 'محصولات من', path: '/seller/products', icon: 'products' },
        { label: 'سفارشات من', path: '/seller/orders', icon: 'orders' },
        { label: 'کیف پول و تسویه', path: '/seller/payouts', icon: 'wallet' },
        { label: 'نظرسنجی‌ها', path: '/seller/surveys', icon: 'report' },
        { label: 'سهم هزینه‌ها', path: '/seller/costs', icon: 'wallet' },
        { label: 'پروفایل', path: '/seller/profile', icon: 'settings' }
      ];
    }
  }

  /** فعال بودن لینک جاری */
  isActive(path: string): boolean {
    const url = this.router.url;
    return url === path || url.startsWith(`${path}/`);
  }

  /** بستن منوی موبایل پس از انتخاب */
  navigate(path: string): void {
    this.menuOpen = false;
    this.router.navigateByUrl(path);
  }

  /** خروج از حساب */
  logout(): void {
    this.authService.logout().subscribe(() => {
      this.authState.clear();
      this.router.navigate(['/']);
    });
  }
}
