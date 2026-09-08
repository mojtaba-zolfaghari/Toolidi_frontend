import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { Router } from '@angular/router';
import { SeoService } from '../../core/services/seo.service';
import { getCurrentRole, navigateAfterLogin } from '../../core/utils/auth-redirect.util';

interface RoleOption {
  title: string;
  description: string;
  route: string;
  matIcon: string;
  /** رنگ شاخص نقش — روی کارت به‌صورت CSS variable تزریق می‌شود */
  accent: string;
  accentSoft: string;
  cta: string;
  ariaLabel: string;
  features: string[];
}

/**
 * صفحه فرود احراز هویت؛ انتخاب نوع کاربر (خریدار، فروشنده، تأمین‌کننده، کارپخش)
 * و هدایت به جریان ورود/ثبت‌نام مخصوص همان نقش — TASK-FE-LOGIN-002.
 *
 * کاربر واردشده مستقیم به پنل نقش خودش فرستاده می‌شود (انتخاب نقش برای او بی‌معناست).
 */
@Component({
    selector: 'app-auth-landing',
    templateUrl: './auth-landing.component.html',
    styleUrls: ['./auth-landing.component.scss'],
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class AuthLandingComponent implements OnInit {
  constructor(
    private readonly seo: SeoService,
    private readonly router: Router,
  ) {}

  ngOnInit(): void {
    // کاربر واردشده نیازی به انتخاب نقش ندارد — مستقیم به پنل خودش می‌رود.
    if (getCurrentRole()) {
      navigateAfterLogin(this.router, getCurrentRole());
      return;
    }

    this.seo.setPage({
      title: 'ورود و ثبت‌نام — تولیدی',
      description:
        'به تولیدی خوش آمدید. به‌عنوان خریدار، فروشنده، تأمین‌کننده یا کارپخش وارد شوید یا ثبت‌نام کنید.',
      url: 'https://toolidi.ir/auth',
      type: 'website',
    });
  }

  readonly roles: RoleOption[] = [
    {
      title: 'خریدار',
      description: 'خرید عمده از تولیدکنندگان و فروشندگان سراسر ایران',
      route: '/auth/register',
      matIcon: 'shopping_cart',
      accent: '#4f8de8',
      accentSoft: 'rgba(79, 141, 232, 0.12)',
      cta: 'ورود / ثبت‌نام خریدار',
      ariaLabel: 'ورود یا ثبت‌نام به عنوان خریدار',
      features: ['پیشنهادهای شخصی', 'پیگیری ساده سفارش', 'خرید مطمئن'],
    },
    {
      title: 'فروشنده',
      description: 'فروشگاه بسازید و محصولات را به تمام ایران عرضه کنید',
      route: '/auth/seller-register',
      matIcon: 'storefront',
      accent: '#2bb98a',
      accentSoft: 'rgba(43, 185, 138, 0.12)',
      cta: 'ثبت‌نام فروشنده',
      ariaLabel: 'ثبت‌نام به عنوان فروشنده',
      features: ['کاتالوگ یکپارچه', 'فروش سراسری', 'پرداخت امن'],
    },
    {
      title: 'تأمین‌کننده',
      description: 'محصولات کارخانه را به هزاران فروشنده بفروشید',
      route: '/auth/supplier-register',
      matIcon: 'inventory_2',
      accent: '#e0a52e',
      accentSoft: 'rgba(224, 165, 46, 0.12)',
      cta: 'ثبت‌نام تأمین‌کننده',
      ariaLabel: 'ثبت‌نام به عنوان تأمین‌کننده',
      features: ['فروش به ۳۱ استان', 'مدیریت یکپارچه', 'قرارداد شفاف'],
    },
    {
      title: 'کارپخش',
      description: 'به شبکه پیک‌های شهری بپیوندید و درآمد کسب کنید',
      route: '/auth/agent-register',
      matIcon: 'electric_moped',
      accent: '#8c7cff',
      accentSoft: 'rgba(140, 124, 255, 0.12)',
      cta: 'ثبت‌نام کارپخش',
      ariaLabel: 'ثبت‌نام به عنوان کارپخش',
      features: ['سفارش‌های نزدیک', 'پرداخت امن', 'امتیاز حرفه‌ای'],
    },
  ];
}
