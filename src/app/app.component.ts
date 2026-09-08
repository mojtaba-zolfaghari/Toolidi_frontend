import { Component, isDevMode, OnDestroy, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { Subscription } from 'rxjs';
import { filter } from 'rxjs/operators';

import { routeAnimations } from './shared/animations';
import { AuthService } from './core/services/api/auth.service';
import { NewsletterService } from './core/services/api/newsletter.service';
import { AuthStateService, AuthUser } from './core/services/auth-state.service';

@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    styleUrls: ['./app.component.scss'],
    animations: [routeAnimations],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'تولیدی';
  currentUser: AuthUser | null = null;
  menuOpen = false;
  isAdminArea = false;
  isStandaloneAuthPage = false;
  searchQuery = '';
  mobileSearchOpen = false;
  mobileSearchQuery = '';
  newsletterEmail = '';
  newsletterSubmitting = false;
  newsletterMessage: { type: 'success' | 'error'; text: string } | null = null;

  private subscription?: Subscription;

  constructor(
    private readonly authState: AuthStateService,
    private readonly authService: AuthService,
    private readonly newsletterService: NewsletterService,
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
          event.urlAfterRedirects.startsWith('/seller') ||
          event.urlAfterRedirects.startsWith('/agent') ||
          event.urlAfterRedirects.startsWith('/supplier');
        const path = event.urlAfterRedirects.split('?')[0];
        this.isStandaloneAuthPage = path === '/auth/agent-register' || path === '/auth/seller-register' || path === '/auth/supplier-register' || path === '/auth/register';
      });
    this.isAdminArea = this.router.url.startsWith('/admin') || this.router.url.startsWith('/seller') || this.router.url.startsWith('/agent') || this.router.url.startsWith('/supplier');
    const path = this.router.url.split('?')[0];
    this.isStandaloneAuthPage = path === '/auth/agent-register' || path === '/auth/seller-register' || path === '/auth/supplier-register' || path === '/auth/register';

    // Only register the service worker in production builds — /sw.js does not
    // exist on the dev server, so registering it there logs a 404 console error
    // on every page load (and fails the e2e console-error checks).
    if (!isDevMode() && 'serviceWorker' in navigator) {
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

  /** باز کردن جستجوی موبایل */
  onMobileSearch(): void {
    this.mobileSearchOpen = true;
  }

  /** بستن جستجوی موبایل */
  closeMobileSearch(): void {
    this.mobileSearchOpen = false;
    this.mobileSearchQuery = '';
  }

  /** ارسال جستجوی موبایل */
  onMobileSearchSubmit(): void {
    const term = this.mobileSearchQuery.trim();
    if (!term) {
      return;
    }
    this.router.navigate(['/shop'], { queryParams: { search: term } });
    this.closeMobileSearch();
  }

  /** عضویت در خبرنامه */
  onNewsletterSubmit(): void {
    const email = this.newsletterEmail.trim();
    this.newsletterMessage = null;

    if (!email) {
      this.newsletterMessage = { type: 'error', text: 'لطفاً ایمیل خود را وارد کنید.' };
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      this.newsletterMessage = { type: 'error', text: 'فرمت ایمیل واردشده صحیح نیست.' };
      return;
    }

    if (this.newsletterSubmitting) {
      return;
    }

    this.newsletterSubmitting = true;
    this.newsletterService.subscribe(email).subscribe({
      next: (result) => {
        this.newsletterSubmitting = false;
        if (result.isSuccess) {
          this.newsletterEmail = '';
          this.newsletterMessage = { type: 'success', text: 'عضویت شما در خبرنامه با موفقیت ثبت شد.' };
        } else {
          this.newsletterMessage = {
            type: 'error',
            text: result.errorMessage || 'ثبت عضویت در خبرنامه انجام نشد؛ لطفاً دوباره تلاش کنید.'
          };
        }
      },
      error: (err: unknown) => {
        this.newsletterSubmitting = false;
        const message = err instanceof Error ? err.message : '';
        this.newsletterMessage = {
          type: 'error',
          text: message || 'خطا در ارتباط با سرور؛ لطفاً دوباره تلاش کنید.'
        };
      }
    });
  }
}
