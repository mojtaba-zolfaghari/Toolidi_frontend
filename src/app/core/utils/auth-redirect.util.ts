import { Router } from '@angular/router';

import { ACCESS_TOKEN_KEY } from '../interceptors/token.interceptor';
import { getRoleFromToken } from '../utils/jwt.util';

/**
 * مسیر فرود پیش‌فرض هر نقش پس از ورود.
 * نقش ناشناخته → صفحه اصلی فروشگاه.
 */
const ROLE_LANDING_PATHS: Record<string, string> = {
  Admin: '/admin',
  Agent: '/agent/ready-items',
  Seller: '/seller',
  Supplier: '/supplier'
};

/**
 * مسیر فرود مناسب برای نقش کاربر را برمی‌گرداند.
 * ترتیب بررسی returnUrl و سپس نقش است.
 *
 * @param role نقش کاربر (از توکن JWT)
 * @param returnUrl مسیر بازگشت اختیاری (فقط مسیرهای داخلی و غیر پنلی پذیرفته می‌شوند)
 */
export function getLandingPath(role: string | null, returnUrl?: string | null): string {
  // بازگشت به مسیر درخواستی کاربر — فقط مسیر داخلیِ امن و بدون پنل نقش‌محور
  if (returnUrl && returnUrl.startsWith('/') && !returnUrl.startsWith('//')) {
    if (!ROLE_LANDING_PATHS[role ?? ''] || !isPanelPath(returnUrl)) {
      return returnUrl;
    }
  }

  return ROLE_LANDING_PATHS[role ?? ''] ?? '/';
}

/** آیا مسیر مربوط به یکی از پنل‌های نقش‌محور است؟ */
function isPanelPath(url: string): boolean {
  return /^\/(admin|seller|supplier|agent)(\/|$)/.test(url);
}

/**
 * پس از ورود موفق، کاربر را به مسیر مناسب هدایت می‌کند:
 * اولویت با returnUrl (در صورت وجود) و سپس مسیر فرود نقش است.
 */
export function navigateAfterLogin(router: Router, role: string | null, returnUrl?: string | null): void {
  void router.navigateByUrl(getLandingPath(role, returnUrl));
}

/**
 * استخراج returnUrl از query params با اعتبارسنجی اولیه.
 */
export function extractReturnUrl(queryParams: Record<string, unknown> | null): string | null {
  const value = queryParams?.['returnUrl'];
  if (typeof value !== 'string' || !value.startsWith('/') || value.startsWith('//')) {
    return null;
  }
  return value;
}

/**
 * نقش کاربر وارد‌شده را از توکن ذخیره‌شده می‌خواند.
 */
export function getCurrentRole(): string | null {
  const token = localStorage.getItem(ACCESS_TOKEN_KEY);
  return token ? getRoleFromToken(token) : null;
}
