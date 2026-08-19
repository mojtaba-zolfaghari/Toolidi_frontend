import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

/**
 * سرویس پایه ارتباط با سرور (API)
 * تمام درخواست‌های HTTP برنامه از این سرویس عبور می‌کنند.
 */
@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly baseUrl: string = environment.apiUrl;

  constructor(private readonly http: HttpClient) {}

  /** درخواست GET */
  get<T>(url: string): Observable<T> {
    return this.http
      .get<T>(`${this.baseUrl}${url}`)
      .pipe(catchError((error) => this.handleError(error)));
  }

  /** درخواست POST */
  post<T>(url: string, body: unknown): Observable<T> {
    return this.http
      .post<T>(`${this.baseUrl}${url}`, body)
      .pipe(catchError((error) => this.handleError(error)));
  }

  /** درخواست PUT */
  put<T>(url: string, body: unknown): Observable<T> {
    return this.http
      .put<T>(`${this.baseUrl}${url}`, body)
      .pipe(catchError((error) => this.handleError(error)));
  }

  /** درخواست DELETE */
  delete<T>(url: string): Observable<T> {
    return this.http
      .delete<T>(`${this.baseUrl}${url}`)
      .pipe(catchError((error) => this.handleError(error)));
  }

  /** مدیریت خطاها با پیام‌های فارسی */
  private handleError(error: HttpErrorResponse): Observable<never> {
    let message = 'خطا در ارتباط با سرور';

    if (error.status === 0) {
      message = 'خطا در ارتباط با سرور؛ لطفاً اتصال اینترنت خود را بررسی کنید.';
    } else if (error.status === 400) {
      message = 'درخواست نامعتبر است؛ لطفاً اطلاعات وارد شده را بررسی کنید.';
    } else if (error.status === 401) {
      message = 'احراز هویت انجام نشده است؛ لطفاً دوباره وارد شوید.';
    } else if (error.status === 403) {
      message = 'شما مجوز دسترسی به این بخش را ندارید.';
    } else if (error.status === 404) {
      message = 'مورد درخواستی یافت نشد.';
    } else if (error.status >= 500) {
      message = 'خطای سرور؛ لطفاً بعداً دوباره تلاش کنید.';
    }

    console.error('API Error:', error);
    return throwError(() => new Error(message));
  }
}
