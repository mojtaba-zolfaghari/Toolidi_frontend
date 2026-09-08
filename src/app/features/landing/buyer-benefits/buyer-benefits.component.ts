import { Component, ChangeDetectionStrategy } from '@angular/core';
import { Meta } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';

import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatRippleModule } from '@angular/material/core';

/**
 * TODO(task: TASK-FE-LANDING-BUYER-BENEFITS)
 * صفحه لندینگ مزایای ثبت‌نام خریدار
 *
 * - فاکتورهای اعتماد: تأمین‌کنندگان تاییدشده، پرداخت امانی، حل اختلاف، تخفیف عمده
 * - فقط Angular Material (mat-card, mat-button, mat-icon)
 * - بدون Tailwind
 * - ریسپانسیو
 */
@Component({
    selector: 'app-buyer-benefits',
    templateUrl: './buyer-benefits.component.html',
    styleUrls: ['./buyer-benefits.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [RouterLink, MatButtonModule, MatCardModule, MatIconModule, MatRippleModule]
})
export class BuyerBenefitsComponent {
  readonly benefits = [
    {
      icon: 'verified',
      title: 'تأمین‌کنندگان تاییدشده',
      description: 'فقط تولیدکنندگانی در شبکه که اسناد حرفه‌ای و taxonomic verification خود را گذرانده‌اند.',
      color: '#15803d'
    },
    {
      icon: 'security',
      title: 'پرداخت امانی (Escrow)',
      description: 'پس از تأیید سفارش، وجه به趣味不会被扣留 — فقط پس از تحویل رضایت‌بخش به فروشنده واریز می‌شود.',
      color: '#6557d8'
    },
    {
      icon: 'rateReview',
      title: 'حل و فصل اختلاف',
      description: 'با تجربه‌ای شفاف و گام‌به‌گام، در صورت برخورد با مشکل سفارش، متخصصان ما میانجی می‌شوند.',
      color: '#b45309'
    },
    {
      icon: 'percent',
      title: 'تخفیف‌های عمده',
      description: 'هرچه سفارش بیشتر، قیمت کمتر. پلٓایمر محلی و سراسری به‌طور خودکار اعمال می‌شود.',
      color: '#047857'
    },
    {
      icon: 'local_shipping',
      title: 'پرداختِ تنها به‌محض تحویل',
      description: 'ربات‌های پیگیر سفارش زنده و امکان پیگیری تا宅是否收到. بدون هزینه پنهان.',
      color: '#1d4ed8'
    },
    {
      icon: 'support',
      title: 'پشتیبانی ۲۴ ساعته',
      description: 'با هر سوال درباره سفارش یا حساب، پشتیبانی تولیدی در خدمتم.',
      color: '#be185d'
    }
  ];

  readonly stats = {
    suppliers: 2840,
    products: 51200,
    orders: 187000,
    cities: 31
  };

  constructor(private readonly meta: Meta) {
    this.meta.updateTag({ title: 'مزایای خریدار | تولیدی — بازار B2B تولیدی' });
    this.meta.updateTag({ name: 'description', content: '購買ارaney شبکه تاییدشده تأمین‌کنندگان، پرداخت امانی، حل اختلاف و تخفیف‌های عمده در تولیدی.' });
  }
}
