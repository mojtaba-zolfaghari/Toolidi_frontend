import { NgClass, NgFor, NgIf } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatBadgeModule } from '@angular/material/badge';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router, RouterLink, RouterOutlet } from '@angular/router';
import { interval, merge, of, Subject, Subscription } from 'rxjs';
import { catchError, startWith, switchMap, takeUntil } from 'rxjs/operators';

import { AuthService } from '../../../core/services/api/auth.service';
import { AuthStateService } from '../../../core/services/auth-state.service';
import { OrderChatService } from '../../../core/services/api/order-chat.service';
import { ACCESS_TOKEN_KEY } from '../../../core/interceptors/token.interceptor';
import { getRoleFromToken, getUsernameFromToken } from '../../../core/utils/jwt.util';
import { AdminService } from '../../../core/services/api/admin.service';

/** آیتم ناوبری سایدبار */
export interface NavItem {
  label: string;
  path: string;
  /** ایموجی قدیمی (fallback) */
  icon: string;
  /** نام آیکون Material (ترجیحی) */
  matIcon?: string;
  /** شمارنده اختیاری (مثلاً تعداد در انتظار تأیید) */
  badge?: () => number;
}

/** گروه ناوبری سایدبار */
export interface NavGroup {
  label?: string;
  items: NavItem[];
}

/**
 * قالب مشترک پنل مدیریت و فروشنده؛ MatSidenav راست‌چین، MatToolbar و ناحیه‌ی محتوا.
 * Standalone و فقط داخل چانک لِزی پنل بارگذاری می‌شود تا Material از باندل اولیه خارج بماند.
 * نشان چت سفارش (پیام‌های نخوانده‌ی فروشنده/تأمین‌کننده) هر ۳۰ ثانیه poll می‌شود.
*/
@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [NgClass, NgFor, NgIf, MatBadgeModule, MatButtonModule, MatIconModule, MatListModule, MatSidenavModule, MatToolbarModule, MatTooltipModule, RouterLink, RouterOutlet],
  templateUrl: './admin-layout.component.html',
  styleUrls: ['./admin-layout.component.scss']
})
export class AdminLayoutComponent implements OnInit, OnDestroy {
  isAdmin = false;
  isSupplier = false;
  username = '';
  roleLabel = '';
  menuOpen = false;
  isMobile = false;
  pendingApprovals = 0;

  /** مجموع پیام‌های نخوانده‌ی چت سفارش‌ها (نشان سایدبار) */
  unreadChatCount = 0;
  private chatPolling?: Subscription;
  private readonly destroy$ = new Subject<void>();

  roleLoggedIn: string | undefined;
  navGroups: NavGroup[] = [];

  constructor(
    private readonly router: Router,
    private readonly authService: AuthService,
    private readonly authState: AuthStateService,
    private readonly adminService: AdminService,
    private readonly orderChatService: OrderChatService
  ) {
    this.isMobile = typeof window !== 'undefined' && window.innerWidth < 960;
  }

  ngOnInit(): void {
    const token = localStorage.getItem(ACCESS_TOKEN_KEY) ?? '';
    const role = getRoleFromToken(token);
    this.isAdmin = role === 'Admin';
    this.isSupplier = role === 'Supplier';
    this.username = getUsernameFromToken(token) ?? 'کاربر';
    if (role === 'Admin') {
      this.roleLabel = 'مدیر';
    } else if (role === 'Agent') {
      this.roleLabel = 'کارپخش';
    } else if (role === 'Supplier') {
      this.roleLabel = 'تأمین‌کننده';
    } else {
      this.roleLabel = 'فروشنده';
    }
    this.roleLoggedIn = this.roleLabel;
    this.menuOpen = !this.isMobile;
    this.buildNav();

    if (this.isAdmin) {
      this.loadPendingCount();
    }

    // نشان چت سفارش: فروشنده و تأمین‌کننده (و مدیر) گفتگو دارند.
    if (this.isAdmin || role === 'Seller' || this.isSupplier) {
      this.startChatBadgePolling();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.chatPolling?.unsubscribe();
  }

  /** Poll نقش‌های پنلی برای شمار پیام‌های نخوانده‌ی چت سفارش‌ها */
  private startChatBadgePolling(): void {
    // هر ۳۰ ثانیه؛ و بلافاصله پس از بازکردن گفتگو (badgeRefresh$) —
    // خطاها بی‌صدا رد می‌شوند تا poll زنده بماند.
    const ticks = merge(
      interval(30_000).pipe(startWith(0)),
      this.orderChatService.badgeRefresh$
    );
    this.chatPolling = ticks
      .pipe(
        takeUntil(this.destroy$),
        switchMap(() =>
          this.orderChatService.getMyThreads().pipe(
            catchError(() => of(null))
          )
        )
      )
      .subscribe(result => {
        const threads = result?.isSuccess ? (result.data ?? []) : [];
        this.unreadChatCount = threads.reduce((sum, t) => sum + (t.unreadCount ?? 0), 0);
      });
  }

  /** باز کردن چت‌ها (مسیر سفارشات همان پنل) از روی نشان هدر */
  openChats(): void {
    const target = this.isAdmin ? '/admin' : this.isSupplier ? '/supplier/orders' : '/seller/orders';
    this.router.navigateByUrl(target);
  }

  /** شمارش محصولات در انتظار تأیید برای نشان کنار منو */
  private loadPendingCount(): void {
    this.adminService.getAdminProducts({ publishStatus: 'PendingApproval', pageSize: 1 }).subscribe({
      next: r => {
        this.pendingApprovals = r.data?.totalCount ?? r.data?.items?.length ?? 0;
      },
      error: () => { /* غیرحیاتی — بی‌صدا رد می‌شود */ }
    });
  }

  /** ساخت گروه‌های منو بر اساس نقش */
  private buildNav(): void {
    if (this.isAdmin) {
      this.navGroups = [
        {
          label: undefined,
          items: [{ label: 'داشبورد', path: '/admin', icon: '🏠', matIcon: 'dashboard' }]
        },
        {
          label: 'فروشگاه',
          items: [
            { label: 'محصولات', path: '/admin/products', icon: '📦', matIcon: 'inventory_2', badge: () => this.pendingApprovals },
            { label: 'استودیو ایمپورت', path: '/admin/import-studio', icon: '⬇️', matIcon: 'download' },
            { label: 'تخفیف‌ها', path: '/admin/discounts', icon: '🏷️', matIcon: 'sell' }
          ]
        },
        {
          label: 'شرکا',
          items: [
            { label: 'فروشندگان', path: '/admin/sellers', icon: '🏬', matIcon: 'storefront' },
            { label: 'تأیید مدارک فروشندگان', path: '/admin/sellers/verification', icon: '✅', matIcon: 'fact_check' },
            { label: 'تأمین‌کنندگان', path: '/admin/suppliers', icon: '🏭', matIcon: 'factory' },
            { label: 'تأیید مدارک تولیدکنندگان', path: '/admin/suppliers/verification', icon: '📋', matIcon: 'rule' },
            { label: 'کارپخش‌ها', path: '/admin/agents', icon: '🛵', matIcon: 'two_wheeler' },
            { label: 'کاربران', path: '/admin/users', icon: '👥', matIcon: 'group' }
          ]
        },
        {
          label: 'مالی و گزارش',
          items: [
            { label: 'گزارش‌ها', path: '/admin/reports', icon: '📊', matIcon: 'bar_chart' },
            { label: 'تسویه‌ها', path: '/admin/payouts', icon: '💳', matIcon: 'payments' },
            { label: 'سهم هزینه‌ها', path: '/admin/costs', icon: '🧮', matIcon: 'calculate' },
            { label: 'قیمت‌گذاری تأمین', path: '/admin/supplier-pricing', icon: '🏭', matIcon: 'price_change' }
          ]
        },
        {
          label: 'سیستم',
          items: [
            { label: 'تنظیمات', path: '/admin/settings', icon: '⚙️', matIcon: 'settings' }
          ]
        }
      ];
    } else if (this.isSupplier) {
      this.navGroups = [
        {
          label: undefined,
          items: [
            { label: 'داشبورد', path: '/supplier', icon: '🏠', matIcon: 'dashboard' },
            { label: 'محصولات', path: '/supplier/products', icon: '📦', matIcon: 'inventory_2' },
            { label: 'سفارشات', path: '/supplier/orders', icon: '🧾', matIcon: 'receipt_long', badge: () => this.unreadChatCount },
            { label: 'ظرفیت تولید', path: '/supplier/production-capacity', icon: '🏭', matIcon: 'factory' },
            { label: 'زمان‌بندی تولید', path: '/supplier/production-schedule', icon: '📅', matIcon: 'schedule' },
            { label: 'پروفایل', path: '/supplier/profile', icon: '⚙️', matIcon: 'settings' }
          ]
        }
      ];
    } else if (this.roleLabel === 'کارپخش') {
      this.navGroups = [
        {
          label: undefined,
          items: [
            { label: 'آیتم‌های آماده', path: '/agent/ready-items', icon: '📦', matIcon: 'inventory_2' },
            { label: 'زمان‌بندی تحویل', path: '/agent/pickup-schedule', icon: '📅', matIcon: 'schedule' },
            { label: 'درآمد و تسویه', path: '/agent/earnings', icon: '💰', matIcon: 'wallet' }
          ]
        }
      ];
    } else {
      this.navGroups = [
        {
          label: undefined,
          items: [
            { label: 'داشبورد', path: '/seller', icon: '🏠', matIcon: 'dashboard' },
            { label: 'محصولات من', path: '/seller/products', icon: '📦', matIcon: 'inventory_2' },
            { label: 'سفارشات من', path: '/seller/orders', icon: '🧾', matIcon: 'receipt_long', badge: () => this.unreadChatCount },
            { label: 'کیف پول و تسویه', path: '/seller/payouts', icon: '💳', matIcon: 'payments' },
            { label: 'نظرسنجی‌ها', path: '/seller/surveys', icon: '📝', matIcon: 'fact_check' },
            { label: 'سهم هزینه‌ها', path: '/seller/costs', icon: '🧮', matIcon: 'calculate' },
            { label: 'تامینتو', path: '/seller/tamineto', icon: '🤝', matIcon: 'handshake' },
            { label: 'پروفایل', path: '/seller/profile', icon: '⚙️', matIcon: 'settings' }
          ]
        }
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
