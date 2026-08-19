import { HttpParams } from '@angular/common/http';

/**
 * تبدیل یک آبجکت پارامترها به رشته‌ی کوئری‌استرینگ (با علامت ?).
 * مقادیر undefined، null و رشته‌ی خالی نادیده گرفته می‌شوند.
 */
export function buildQueryString(params?: object): string {
  if (!params) {
    return '';
  }

  let httpParams = new HttpParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') {
      httpParams = httpParams.set(key, String(value));
    }
  }

  const query = httpParams.toString();
  return query ? `?${query}` : '';
}
