import { Injectable } from '@angular/core';
import {
  HttpErrorResponse,
  HttpEvent,
  HttpHandler,
  HttpInterceptor,
  HttpRequest
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Router } from '@angular/router';

/** کلید ذخیره‌سازی توکن دسترسی در localStorage */
export const ACCESS_TOKEN_KEY = 'access_token';
/** کلید ذخیره‌سازی توکن تازه‌سازی در localStorage */
export const REFRESH_TOKEN_KEY = 'refresh_token';

/**
 * اینترسپتور توکن
 * به تمام درخواست‌ها هدر Authorization با توکن Bearer اضافه می‌کند
 * و در صورت دریافت خطای 401، نشست کاربر را پاک کرده و به صفحه ورود هدایت می‌کند.
 */
@Injectable()
export class TokenInterceptor implements HttpInterceptor {
  constructor(private readonly router: Router) {}

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    const token = localStorage.getItem(ACCESS_TOKEN_KEY);

    // افزودن هدر احراز هویت در صورت وجود توکن
    let authRequest = request;
    if (token) {
      authRequest = request.clone({
        setHeaders: { Authorization: `Bearer ${token}` }
      });
    }

    return next.handle(authRequest).pipe(
      catchError((error: HttpErrorResponse) => {
        // در صورت 401 فقط در مسیرهای محافظت‌شده: هدایت به صفحه ورود
        if (error.status === 401) {
          const protectedPaths = ['/profile', '/orders', '/cart', '/checkout', '/seller', '/admin'];
          const isProtected = protectedPaths.some(p => window.location.pathname.startsWith(p));
          if (isProtected) {
            localStorage.removeItem(ACCESS_TOKEN_KEY);
            localStorage.removeItem(REFRESH_TOKEN_KEY);
            this.router.navigate(['/login']);
          }
        }
        return throwError(() => error);
      })
    );
  }
}
