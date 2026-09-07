import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { Router } from '@angular/router';
import { SeoService } from '../../core/services/seo.service';
import { getCurrentRole, navigateAfterLogin } from '../../core/utils/auth-redirect.util';

interface RoleOption {
  title: string;
  description: string;
  route: string;
  matIcon: string;
  tint: string;
  cta: string;
  ariaLabel: string;
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
    styles: [
        `
      .role-card {
        cursor: pointer;
        transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;
        border: 1px solid rgb(229 231 235);
      }
      .role-card:hover {
        transform: translateY(-4px);
        box-shadow: 0 12px 28px rgb(0 0 0 / 0.12);
        border-color: rgb(124 58 237 / 0.45);
      }
      .role-icon {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 3.5rem;
        height: 3.5rem;
        border-radius: 1rem;
      }
      .role-icon mat-icon {
        font-size: 1.9rem;
        width: 1.9rem;
        height: 1.9rem;
      }

      /* ─── صفحه ─── */
      .al-page {
        max-width: 64rem;
        margin-inline: auto;
        padding: 3rem 1rem;
      }
      .al-head {
        max-width: 42rem;
        margin-inline: auto;
        text-align: center;
      }
      .al-head__kicker {
        font-size: 0.875rem;
        font-weight: 700;
        color: var(--mat-sys-primary, #7c3aed);
      }
      .al-head__title {
        margin-top: 0.5rem;
        font-size: 1.875rem;
        font-weight: 800;
        color: var(--mat-sys-secondary, #1e293b);
      }
      .al-head__sub {
        margin-top: 0.75rem;
        color: #6b7280;
      }
      .al-grid {
        margin-top: 2.5rem;
        display: grid;
        gap: 1.25rem;
        grid-template-columns: 1fr;
      }
      @media (min-width: 768px) {
        .al-grid {
          grid-template-columns: repeat(2, minmax(0, 1fr));
        }
      }
      @media (min-width: 1024px) {
        .al-grid {
          grid-template-columns: repeat(4, minmax(0, 1fr));
        }
      }
      .role-card__body {
        display: flex;
        flex-direction: column;
        align-items: center;
        text-align: center;
        padding: 1.5rem 1rem 1rem;
      }
      .role-card__title {
        margin-top: 1rem;
        font-size: 1.125rem;
        font-weight: 700;
        color: var(--mat-sys-secondary, #1e293b);
      }
      .role-card__desc {
        margin-top: 0.5rem;
        min-height: 2.5rem;
        font-size: 0.875rem;
        line-height: 1.5;
        color: #6b7280;
      }
      .role-card__cta {
        margin-top: 1rem;
        width: 100%;
      }
      .al-login-hint {
        max-width: 42rem;
        margin: 2.5rem auto 0;
        border: 1px solid rgb(229 231 235);
        border-radius: 1rem;
        background: var(--mat-sys-surface, #fff);
        padding: 1.25rem;
        text-align: center;
        box-shadow: 0 1px 2px rgb(0 0 0 / 0.05);
      }
      .al-login-hint__text {
        font-size: 0.875rem;
        color: #4b5563;
      }
      .al-login-hint__link {
        font-weight: 700;
        color: var(--mat-sys-primary, #7c3aed);
        text-decoration: none;
      }
      .al-login-hint__link:hover {
        text-decoration: underline;
      }
    `,
    ],
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
      description: 'مشاهده محصولات و ثبت سفارش عمده',
      route: '/auth/login',
      matIcon: 'shopping_cart',
      tint: 'rgb(237 233 254)',
      cta: 'ورود / ثبت‌نام خریدار',
      ariaLabel: 'ورود یا ثبت‌نام به عنوان خریدار',
    },
    {
      title: 'فروشنده',
      description: 'ساخت فروشگاه و عرضه محصولات',
      route: '/auth/seller-register',
      matIcon: 'storefront',
      tint: 'rgb(220 252 231)',
      cta: 'ثبت‌نام فروشنده',
      ariaLabel: 'ثبت‌نام به عنوان فروشنده',
    },
    {
      title: 'تأمین‌کننده',
      description: 'تأمین کالا و همکاری در زنجیره تأمین',
      route: '/auth/supplier-register',
      matIcon: 'inventory_2',
      tint: 'rgb(254 249 195)',
      cta: 'ثبت‌نام تأمین‌کننده',
      ariaLabel: 'ثبت‌نام به عنوان تأمین‌کننده',
    },
    {
      title: 'کارپخش',
      description: 'مدیریت ارسال و دریافت درآمد',
      route: '/auth/agent-register',
      matIcon: 'electric_moped',
      tint: 'rgb(224 242 254)',
      cta: 'ثبت‌نام کارپخش',
      ariaLabel: 'ثبت‌نام به عنوان کارپخش',
    },
  ];
}
