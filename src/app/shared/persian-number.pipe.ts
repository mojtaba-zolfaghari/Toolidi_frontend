import { Pipe, PipeTransform } from '@angular/core';

/**
 * اعداد را با ارقام فارسی (۰-۹) و جداکننده‌ی هزارگان فارسی نمایش می‌دهد.
 * لوله‌ی number خود انگولار با locale فارسی فقط جداکننده را محلی می‌کند و
 * شکل ارقام لاتین می‌ماند؛ این لوله مستقیماً از Intl با locale fa-IR
 * استفاده می‌کند تا خروجی همیشه ارقام فارسی باشد.
 */
@Pipe({
  name: 'persianNumber',
  pure: true,
  standalone: true
})
export class PersianNumberPipe implements PipeTransform {
  transform(value: number | string | null | undefined, minFractionDigits = 0, maxFractionDigits = minFractionDigits): string {
    if (value === null || value === undefined || value === '') return '';

    const numeric = typeof value === 'number' ? value : Number(value);
    if (Number.isNaN(numeric)) return String(value);

    return new Intl.NumberFormat('fa-IR', {
      minimumFractionDigits: minFractionDigits,
      maximumFractionDigits: maxFractionDigits
    }).format(numeric);
  }
}
