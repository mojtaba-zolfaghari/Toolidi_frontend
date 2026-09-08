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
 * TODO(task: TASK-FE-LANDING-SUPPLIER-BENEFITS)
 * صفحه لندینگ مزایای ثبت‌نام تولیدکننده
 *
 * - فاکتورهای اعتماد: شبکه فروشندگان تاییدشده، درخواست سفارش عمده، پرداخت سریع، تایید مدارک
 * - فقط Angular Material (mat-card, mat-button, mat-icon)
 * - بدون Tailwind
 * - ریسپانسیو
 */
@Component({
    selector: 'app-supplier-benefits',
    templateUrl: './supplier-benefits.component.html',
    styleUrls: ['./supplier-benefits.component.scss'],
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true,
    imports: [RouterLink, NgFor, DecimalPipe, MatButtonModule, MatCardModule, MatGridListModule, MatIconModule, MatRippleModule]
})
export class SupplierBenefitsComponent {
  readonly benefits = [
    {
      icon: 'storefront',
      title: 'شبکه فروشندگان تاییدشده',
      description: 'دسترسی به بیش از ۱۲۰۰ فروشنده تأییدشده در تمام ۳۱ استان — بدون نیاز به معرفی یا میانی.',
      color: '#047857'
    },
    {
      icon: 'request_quote',
      title: 'درخواست سفارش عمده',
      description: 'فروشندگان از پلتفرم می‌توانند سفارشات با Minimum Order پویا، زمان-lead و ظرفیت مشخص ارسال کنند.',
      color: '#b45309'
    },
    {
      icon: 'speed',
      title: 'تسویه سریع و شفاف',
      description: 'پس از تأیید تحویل، تحت شرایطی که در قرارداد مشخص است، بهترین شرایط تسویه برای شما.',
      color: '#1d4ed8'
    },
    {
      icon: 'gavel',
      title: 'تایید سریع مدارک',
      description: 'فرآیند بررسی اسناد تجاری و هویتی با پاسخگویی تحت ۳ روز کاری — بدون bureaucracy پیچیده.',
      color: '#7c3aed'
    },
    {
      icon: 'inventory_2',
      title: 'مدیریت موجودی و سفارشات',
      description: 'داشبورد یکپارچه باindikات موجودی، سفارش‌های بسته‌به‌بسته، تسویه‌ها و گزارش مالی.',
      color: '#be185d'
    },
    {
      icon: 'trending_up',
      title: 'رشد پایدار و بازار',
      description: 'دسترسی به histogramهای فروش، لیست فروشندگان aktif و рентабельность پیشنهاد شما در شبکه.',
      color: '#d97706'
    }
  ];

  readonly stats = {
    suppliers: 2840,
    products: 51200,
    orders: 187000,
    cities: 31
  };

  constructor(private readonly meta: Meta) {
    this.meta.updateTag({ title: 'مزایای تولیدکننده | تولیدی — شبکه تأمین سراسری' });
    this.meta.updateTag({ name: 'description', content: 'تولیدکنندگان و کارخانه‌ها در شبکه تولیدی: فروش به فروشندگان تاییدشده، درخواست سفارش عمده، تسویه سریع و تایید مدارک سریع.' });
  }
}
