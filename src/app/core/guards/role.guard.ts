import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { ACCESS_TOKEN_KEY } from '../interceptors/token.interceptor';
import { getRoleFromToken } from '../utils/jwt.util';

/**
 * گارد نقش؛ بررسی می‌کند کاربر یکی از نقش‌های مجاز را داشته باشد.
 * در غیر این صورت کاربر به صفحه اصلی هدایت می‌شود.
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

    router.navigate(['/']);
    return false;
  };
}
