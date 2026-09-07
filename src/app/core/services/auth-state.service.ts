import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

import { ACCESS_TOKEN_KEY } from '../interceptors/token.interceptor';
import { getRoleFromToken, getUsernameFromToken } from '../utils/jwt.util';

/** اطلاعات کاربر وارد شده (استخراج‌شده از توکن) */
export interface AuthUser {
  role: string | null;
  username: string | null;
}

/**
 * سرویس وضعیت احراز هویت؛ وضعیت کاربر جاری را به صورت واکنشی
 * در اختیار کامپوننت‌ها (مثلاً هدر) قرار می‌دهد.
 */
@Injectable({ providedIn: 'root' })
export class AuthStateService {
  private readonly userSubject = new BehaviorSubject<AuthUser | null>(null);

  /** جریان وضعیت کاربر جاری */
  readonly currentUser$: Observable<AuthUser | null> = this.userSubject.asObservable();

  constructor() {
    this.refresh();
  }

  /** بازخوانی وضعیت کاربر از توکن ذخیره‌شده */
  refresh(): void {
    const token = localStorage.getItem(ACCESS_TOKEN_KEY) ?? sessionStorage.getItem(ACCESS_TOKEN_KEY) ?? null;
    if (!token) {
      this.userSubject.next(null);
      return;
    }

    this.userSubject.next({
      role: getRoleFromToken(token),
      username: getUsernameFromToken(token)
    });
  }

  /** پاک‌کردن وضعیت کاربر (پس از خروج) */
  clear(): void {
    this.userSubject.next(null);
  }
}
