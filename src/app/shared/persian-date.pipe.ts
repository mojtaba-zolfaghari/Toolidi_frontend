import { Pipe, PipeTransform } from '@angular/core';

/**
 * Formats API dates with the Persian calendar and Persian numerals.
 * The input remains an ISO/Gregorian value; only its presentation changes.
 */
@Pipe({
  name: 'persianDate',
  pure: true,
  standalone: true
})
export class PersianDatePipe implements PipeTransform {
  transform(value: string | Date | number | null | undefined, format = 'yyyy/MM/dd'): string {
    if (value === null || value === undefined || value === '') return '';

    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) return '';

    const includeTime = format.includes('HH') || format.includes('hh');
    const includeMonthOnly = format === 'yyyy/MM';
    const formatter = new Intl.DateTimeFormat('fa-IR-u-ca-persian-nu-arabext', {
      year: 'numeric',
      month: includeMonthOnly ? '2-digit' : '2-digit',
      day: includeMonthOnly ? undefined : '2-digit',
      hour: includeTime ? '2-digit' : undefined,
      minute: includeTime ? '2-digit' : undefined,
      hour12: false
    });

    const parts = formatter.formatToParts(date);
    const get = (type: string): string => parts.find((part) => part.type === type)?.value ?? '';
    const datePart = includeMonthOnly
      ? `${get('year')}/${get('month')}`
      : `${get('year')}/${get('month')}/${get('day')}`;

    if (!includeTime) return datePart;
    const timePart = `${get('hour')}:${get('minute')}`;
    return format.includes(' - ') ? `${datePart} - ${timePart}` : `${datePart} ${timePart}`;
  }
}
