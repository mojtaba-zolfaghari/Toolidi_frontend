import { Pipe, PipeTransform } from '@angular/core';

/**
 * Converts Western Arabic numerals (0-9) to Persian/Farsi numerals (۰-۹).
 * Usage: {{ 12345 | persianNumber }} → ۱۲۳۴۵
 * Usage: {{ 12345.67 | persianNumber:'2' }} → ۱۲٬۳۴۵٫۶۷
 */
@Pipe({ name: 'persianNumber', standalone: true })
export class PersianNumberPipe implements PipeTransform {
  private static readonly persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];

  transform(value: unknown, decimalPlaces?: number): string {
    if (value === null || value === undefined || value === '') return '';

    let numStr: string;
    if (typeof value === 'number') {
      numStr = decimalPlaces !== undefined
        ? value.toFixed(decimalPlaces)
        : value.toString();
    } else {
      numStr = String(value);
    }

    // Convert digits
    let result = numStr.replace(/[0-9]/g, (d) => PersianNumberPipe.persianDigits[parseInt(d)]);

    // Format with Persian thousand separator (٬) and decimal (٫)
    if (decimalPlaces !== undefined || numStr.includes('.')) {
      const parts = result.split('.');
      // Add thousand separators to integer part
      parts[0] = parts[0].replace(/\B(?=(\D{3})+(?!\D))/g, '٬');
      result = parts.join('٫');
    }

    return result;
  }
}
