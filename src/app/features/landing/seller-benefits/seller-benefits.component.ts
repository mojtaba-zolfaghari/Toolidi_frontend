import { Component, ChangeDetectionStrategy } from '@angular/core';
import { Meta } from '@angular/platform-browser';
import { RouterLink } from '@angular/router';
import { DecimalPipe, NgFor } from '@angular/common';

import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatIconModule } from '@angular/material/icon';
import { MatRippleModule } from '@angular/material/core';

/**
 * TODO(task: TASK-FE-LANDING-SELLER-BENEFITS)
 * صفحه لندینگ مزایای ثبت‌نام فروشنده
 *
 * - فاکتورهای اعتماد: شبکه تامین‌کنندگان، نشان اعتماد خریدار، پشتیبانی لجستیک، ابزارهای آنالیتیکس
 * - فقط Angular Material (mat-card, mat-button, mat-icon)
 * - بدون Tailwind
 * - ریسپانسیو
 */
@Component({
    selector: 'app-seller-benefits',
    templateUrl: './seller-benefits.component.html',
    styleUrls: ['./seller-benefits.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [RouterLink, NgFor, DecimalPipe, MatButtonModule, MatCardModule, MatGridListModule, MatIconModule, MatRippleModule]
})
export class SellerBenefitsComponent {
  readonly benefits = [
    {
      icon: 'inventory_2',
      title: 'شبکه تامین‌کنندگان تاییدشده',
      description: 'وصول به تأمین‌کنندگان داخلی و بین‌المللیِ ط분야 و معتبر در شبکه تولیدی — بدون جستجوی خسته‌کننده.',
      color: '#6557d8'
    },
    {
      icon: 'stars',
      title: 'نشان اعتماد خریدار',
      description: 'با بررسی اسناد و سابقه فروش، نشان اعتمادِ تولیدی به فروشگاهت نماد زده شود — خریداران با اعتماد خرید می‌کنند.',
      color: '#047857'
    },
    {
      icon: 'local_shipping',
      title: 'پشتیبان لجستیک',
      description: 'پلتفرم پیکینگی تولیدی برای ارسال تازه‌ها، لوسترها و سفارش‌های ویژه به تمام نقاط کشور.',
      color: '#b45309'
    },
    {
      icon: 'analytics',
      title: 'ابزارهای آنالیتیکس',
      description: 'متریک‌های فروش، mediastinian، روندهای فصلی، تخفیف‌ 이란의‌های روبه‌نمی‌خور — همه در داشبورد فروشگاه.',
      color: '#7c3aed'
    },
    {
      icon: 'campaign',
      title: 'ابزارهای مارکتینگ',
      description: 'کاتالوگ‌های درخشان، تبلیغات هدفمند و پیشنهادهای شخصی‌سازی‌شده برای جلب خریداران.',
      color: '#d97706'
    },
    {
      icon: 'account_balance',
      title: 'پرداخت سریع و شفاف',
      description: 'تسویه‌ها پس از تأیید تحویل به خریدار، به همراه گزارش‌های مالی قابل زیرس是一种.',
      color: '#0369a1'
    }
  ];

  readonly stats = {
    sellers: 1240,
    products: 43800,
    orders: 91000,
    growth: 22
  };

  constructor(private readonly meta: Meta) {
    this.meta.updateTag({ title: 'مزایای فروشنده | تولیدی — بازار B2B تولیدی' });
    this.meta.updateTag({ name: 'description', content: 'فروشندهọc网络被确认后，加入到已验证的供应商网络中，享受物流支持、营销工具和快速透明的付款.' });
  }
}
