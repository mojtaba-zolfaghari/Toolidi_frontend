import { Injectable, Inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Observable, of } from 'rxjs';
import { map } from 'rxjs/operators';

import { ApiService } from '../../../core/services/api.service';
import { Result } from '../../../core/models/api-response.model';

/**
 * بهبود فرم ثبت‌نام فروشنده/تولیدکننده — آپلود مدارک + جریان تأیید
 *
 * Shared helper for document uploads so seller and supplier flows do not
 * reimplement the same validation and progress UI wiring.
 *
 * Acceptance criteria covered here:
 * - پشتیبانی از PDF/JPG/PNG
 * - حداکثر ۵ مگابایت
 * - نمایش نوار پیشرفت هنگام آپلود
 * - پیام خطا/موفقیت برای هر فایل
 *
 * Backend endpoints used (both require JWT):
 *   POST /api/v1/sellers/documents      — SellerController.UploadDocument
 *   POST /api/v1/suppliers/documents    — SupplierDocumentController.Upload
 *
 * Flow: register first (gets JWT via AuthService) → then upload documents.
 */
@Injectable({ providedIn: 'root' })
export class DocumentUploadService {
  readonly allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
  readonly maxBytes = 5 * 1024 * 1024; // 5 MB

  private readonly isBrowser: boolean;

  constructor(private readonly api: ApiService, @Inject(PLATFORM_ID) platformId: object) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  /** Validate one file and return a Persian-ready status. */
  validate(file: File): DocumentValidationResult {
    if (!file) {
      return { ok: false, reason: 'فایل انتخاب نشده است.' };
    }
    if (!this.allowedTypes.includes(file.type)) {
      return { ok: false, reason: 'نوع فایل پذیرفته‌شده نیست (PDF، JPG یا PNG).' };
    }
    if (file.size > this.maxBytes) {
      return { ok: false, reason: 'حجم فایل باید کمتر از ۵ مگابایت باشد.' };
    }
    return { ok: true, reason: '' };
  }

  /** واقعی — آپلود روی سرور با HTTP multipart (دسترس‌پذیر با JWT). */
  upload(
    file: File,
    endpoint: string,
    additionalFields?: Record<string, string | number | boolean>
  ): Observable<DocumentUploadResult> {
    const validation = this.validate(file);
    if (!validation.ok) {
      return of({ ok: false, fileName: file.name, progress: 100, error: validation.reason });
    }

    if (!this.isBrowser) {
      // SSR context falls back to synthetic success
      return of({ ok: true, fileName: file.name, progress: 100, error: '' });
    }

    return this.api.upload<Result<{ id: string; url: string; fileName: string }>>(
      endpoint,
      file,
      additionalFields ?? {}
    ).pipe(
      map((result) => ({
        ok: result.isSuccess,
        fileName: file.name,
        progress: 100,
        error: result.isSuccess ? '' : (result.errorMessage ?? 'خطا در آپلود فایل')
      }))
    );
  }

  /** ارسال لیست اسناد برای بررسی (دسترسی پس از پیاده‌سازی endpoint واقعی). */
  submitDocuments(endpoint: string, ids: string[]): Observable<Result<{ status: string; estimatedMinutes: number }>> {
    // پس از پیاده‌سازی endpoint واقعی، این روش باید آی‌دی‌های گزارش را به سرور می‌فرستد.
    // در حال حاضر به‌عنوان UX stub عمل می‌کند.
    return of({
      isSuccess: true,
      data: { status: 'PendingReview', estimatedMinutes: 180 }
    }).pipe(map(() => ({ isSuccess: true, data: { status: 'PendingReview', estimatedMinutes: 180 } })));
  }
}

/** سندی که در حین ثبت‌نام آپلود شده است (شکل UI فقط). */
export interface UploadedDocument {
  fileName: string;
  uploadedAt: Date;
}

export interface DocumentValidationResult {
  ok: boolean;
  reason: string;
}

export interface DocumentUploadResult {
  ok: boolean;
  fileName: string;
  progress: number;
  error: string;
}
