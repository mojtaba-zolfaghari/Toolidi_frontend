import { Component, OnDestroy, OnInit } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';

import { routeAnimations } from './shared/animations';
import { AuthService } from './core/services/api/auth.service';
import { AuthStateService, AuthUser } from './core/services/auth-state.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss'],
  animations: [routeAnimations]
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'toolidi';
  currentUser: AuthUser | null = null;
  menuOpen = false;
  isAdminArea = false;
  searchQuery = '';
  newsletterEmail = '';

  private subscription?: Subscription;

  constructor(
    private readonly authState: AuthStateService,
    private readonly authService: AuthService,
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    this.subscription = this.authState.currentUser$.subscribe((user) => {
      this.currentUser = user;
    });

    // پنهان‌کردن هدر و فوتر عمومی داخل پنل مدیریت/فروشنده
    this.router.events
      .pipe(filter((event): event is NavigationEnd => event instanceof NavigationEnd))
      .subscribe((event) => {
        this.isAdminArea =
          event.urlAfterRedirects.startsWith('/admin') ||
          event.urlAfterRedirects.startsWith('/seller');
      });
    this.isAdminArea = this.router.url.startsWith('/admin') || this.router.url.startsWith('/seller');

    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        void navigator.serviceWorker.register('/sw.js').catch(() => undefined);
      });
    }
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
  }

  /** آماده‌سازی وضعیت انیمیشن برای انتقال بین صفحات */
  prepareRoute(outlet: RouterOutlet): string {
    return outlet?.isActivated
      ? (outlet.activatedRoute.snapshot.routeConfig?.path ?? 'default')
      : 'default';
  }

  /** باز و بسته کردن منوی موبایل */
  toggleMenu(): void {
    this.menuOpen = !this.menuOpen;
  }

  /** بستن منوی موبایل پس از انتخاب مسیر */
  closeMenu(): void {
    this.menuOpen = false;
  }

  /** خروج از حساب کاربری و هدایت به صفحه اصلی */
  logout(): void {
    this.closeMenu();
    this.authService.logout().subscribe(() => {
      this.authState.clear();
      this.router.navigate(['/']);
    });
  }

  /** هدایت به صفحه فروشگاه با عبارت جستجو */
  onSearch(): void {
    const term = this.searchQuery.trim();
    if (!term) {
      return;
    }
    this.router.navigate(['/shop'], { queryParams: { search: term } });
    this.searchQuery = '';
  }

  /** عضویت در خبرنامه */
  onNewsletterSubmit(): void {
    const email = this.newsletterEmail.trim();
    if (email) {
      // TODO: integrate with newsletter API
      this.newsletterEmail = '';
    }
  }
}
