import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { tap } from 'rxjs/operators';

import { ApiService } from '../api.service';
import { Result } from '../../models/api-response.model';
import { ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY } from '../../interceptors/token.interceptor';

/** پروفایل کاربر در پاسخ ورود یا دریافت کاربر جاری */
export interface UserProfile {
  id: string;
  nationalCode: string;
  username: string;
  mobileNumber?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  roleName: string;
  isActive: boolean;
  isOtpRequired: boolean;
  createdAt: string;
  lastLoginAt?: string;
}

/** پاسخ ورود حاوی توکن‌های دسترسی */
export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  expiresInMinutes: number;
  tokenType: string;
  user?: UserProfile;
}

/** داده‌ی ثبت‌نام مشتری */
export interface RegisterCustomerData {
  nationalCode: string;
  username: string;
  password: string;
  confirmPassword: string;
}

/** داده‌ی ثبت‌نام فروشنده */
export interface RegisterSellerData {
  nationalCode: string;
  username: string;
  password: string;
  confirmPassword: string;
}

/**
 * سرویس احراز هویت؛ شامل ورود، ثبت‌نام، خروج و دریافت کاربر جاری.
 * توکن‌های دریافتی در localStorage ذخیره می‌شوند تا اینترسپتور
 * آن‌ها را به هدر Authorization اضافه کند.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  constructor(private readonly api: ApiService) {}

  /** ورود کاربر با کد ملی (یا نام کاربری) و رمز عبور */
  login(nationalCode: string, password: string): Observable<Result<LoginResponse>> {
    return this.api
      .post<Result<LoginResponse>>('/Auth/login', {
        username: nationalCode,
        password,
        rememberMe: false
      })
      .pipe(tap((result) => this.storeTokens(result)));
  }

  /** ثبت‌نام مشتری جدید */
  registerCustomer(data: RegisterCustomerData): Observable<Result<LoginResponse>> {
    return this.api
      .post<Result<LoginResponse>>('/Auth/register/customer', data)
      .pipe(tap((result) => this.storeTokens(result)));
  }

  /** ثبت‌نام فروشنده‌ی جدید */
  registerSeller(data: RegisterSellerData): Observable<Result<LoginResponse>> {
    return this.api
      .post<Result<LoginResponse>>('/Auth/register/seller', data)
      .pipe(tap((result) => this.storeTokens(result)));
  }

  /** خروج کاربر و پاک‌کردن توکن‌ها از حافظه‌ی مرورگر */
  logout(): Observable<void> {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    return of(undefined);
  }

  /**
   * بروزرسانی توکن دسترسی.
   * توجه: بک‌اند فعلی endpoint بروزرسانی توکن ندارد؛
   * این متد تا پیاده‌سازی بک‌اند خطا برمی‌گرداند.
   */
  refreshToken(): Observable<Result<LoginResponse>> {
    return throwError(() => new Error('بروزرسانی توکن هنوز در بک‌اند پیاده‌سازی نشده است.'));
  }

  /** دریافت اطلاعات کاربر جاری (نیازمند احراز هویت) */
  getCurrentUser(): Observable<Result<UserProfile>> {
    return this.api.get<Result<UserProfile>>('/Profile');
  }

  /** ذخیره‌ی توکن‌های دسترسی و تازه‌سازی در localStorage */
  private storeTokens(result: Result<LoginResponse>): void {
    if (result.isSuccess && result.data) {
      localStorage.setItem(ACCESS_TOKEN_KEY, result.data.accessToken);
      localStorage.setItem(REFRESH_TOKEN_KEY, result.data.refreshToken);
    }
  }
}
