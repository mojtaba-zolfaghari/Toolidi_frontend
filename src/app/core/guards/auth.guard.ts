import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { ACCESS_TOKEN_KEY } from '../interceptors/token.interceptor';

/**
 * گارد احراز هویت؛ در صورت نبود توکن کاربر را به صفحه ورود هدایت می‌کند
 * و مسیر درخواستی را در returnUrl ذخیره می‌کند تا پس از ورود به همان‌جا برگردد.
 */
export const AuthGuard: CanActivateFn = (_route, state) => {
  const router = inject(Router);
  const token = localStorage.getItem(ACCESS_TOKEN_KEY);

  if (token) {
    return true;
  }

  router.navigate(['/auth/login'], { queryParams: { returnUrl: state.url } });
  return false;
};
