import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { ACCESS_TOKEN_KEY } from '../interceptors/token.interceptor';

/**
 * گارد احراز هویت؛ در صورت نبود توکن کاربر را به صفحه ورود هدایت می‌کند.
 */
export const AuthGuard: CanActivateFn = () => {
  const router = inject(Router);
  const token = localStorage.getItem(ACCESS_TOKEN_KEY);

  if (token) {
    return true;
  }

  router.navigate(['/login']);
  return false;
};
