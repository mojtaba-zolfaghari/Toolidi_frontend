import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { ACCESS_TOKEN_KEY } from '../interceptors/token.interceptor';
import { getRoleFromToken } from '../utils/jwt.util';
import { getLandingPath } from '../utils/auth-redirect.util';

/**
 * گارد نقش؛ بررسی می‌کند کاربر یکی از نقش‌های مجاز را داشته باشد.
 *
 * در صورت عدم دسترسی:
 * - کاربر وارد‌شده به پنل نقش خودش هدایت می‌شود (نه صفحه اصلی)
 * - کاربر مهمان به صفحه ورود می‌رود
 *
 * مثال استفاده: canActivate: [AuthGuard, RoleGuard('Seller')]
 */
export function RoleGuard(...allowedRoles: string[]): CanActivateFn {
  return () => {
    const router = inject(Router);
    const token = localStorage.getItem(ACCESS_TOKEN_KEY);
    const role = token ? getRoleFromToken(token) : null;

    if (role && allowedRoles.includes(role)) {
      return true;
    }

    if (role) {
      // وارد شده ولی دسترسی ندارد — به پنل نقش خودش برگرد
      router.navigateByUrl(getLandingPath(role));
    } else {
      router.navigate(['/auth/login']);
    }
    return false;
  };
}
