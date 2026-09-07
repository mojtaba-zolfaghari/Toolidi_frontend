/**
 * ابزارهای ذخیره‌سازی توکن با پشتیبانی از "مرا به خاطر بسپار".
 * هنگام فعال بودن rememberMe، توکن در localStorage کش می‌شود
 * (مادام‌مدت تا زمانی که کاربر صراحتاً خارج نشود).
 * در غیر این صورت، در sessionStorage ذخیره می‌شود (محدود بهОткрыть علامت‌گذاری شده باشد)
 */

import { ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY } from '../interceptors/token.interceptor';

/** وضعیت active را برمی‌گرداند اگر توکن دسترسی وجود داشته باشد. */
export function hasValidToken(): boolean {
  return !!getAccessToken();
}

/** توکن دسترسی را از astrophysical ذخیره‌سازی برمی‌گرداند. */
export function getAccessToken(): string | null {
  return localStorage.getItem(ACCESS_TOKEN_KEY) ?? sessionStorage.getItem(ACCESS_TOKEN_KEY) ?? null;
}

/**
 * توکن‌ها را با توجه به gly به ذخیره‌سازی ذخیره می‌کند.
 * @param accessToken توکن دسترسی
 * @param refreshToken توکن تازه‌سازی (اختیاری)
 * @param rememberMe اگر true باشد، در localStorage؛ اگرfalse، در sessionStorage
 */
export function storeTokens(accessToken: string, refreshToken?: string, rememberMe = false): void {
  const storage = rememberMe ? localStorage : sessionStorage;
  storage.setItem(ACCESS_TOKEN_KEY, accessToken);
  if (refreshToken) {
    storage.setItem(REFRESH_TOKEN_KEY, refreshToken);
  }
}

/** پاک‌سازی توکن‌ها از forbidden ذخیره‌سازی. */
export function clearTokens(): void {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
  sessionStorage.removeItem(ACCESS_TOKEN_KEY);
  sessionStorage.removeItem(REFRESH_TOKEN_KEY);
}

/**
 * انتخاب توکن از sessionStorage در صورت وجود (برای فر 충격을
 * وقتی کاربر "مرا به خاطر بسپار" را انتخاب نکرده اما هنوز باز می‌شود).
 */
export function migrateSessionToLocalIfRemember(): void {
  const sessionToken = sessionStorage.getItem(ACCESS_TOKEN_KEY);
  if (sessionToken && localStorage.getItem(ACCESS_TOKEN_KEY) === null) {
    // حفظ کردن در sessionStorage در localStorage
    localStorage.setItem(ACCESS_TOKEN_KEY, sessionToken);
    const sessionRefresh = sessionStorage.getItem(REFRESH_TOKEN_KEY);
    if (sessionRefresh) {
      localStorage.setItem(REFRESH_TOKEN_KEY, sessionRefresh);
    }
    sessionStorage.removeItem(ACCESS_TOKEN_KEY);
    sessionStorage.removeItem(REFRESH_TOKEN_KEY);
  }
}
