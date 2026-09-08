import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { delay, map } from 'rxjs/operators';

import { Result } from '../../../core/models/api-response.model';

/**
 * TODO(task: TASK-FE-REGISTER-SELLER-ENHANCE, TASK-FE-REGISTER-SUPPLIER-ENHANCE):
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
 * Current backend does NOT expose POST /api/v1/sellers/documents or
 * POST /api/v1/suppliers/documents yet. This service simulates upload
 * progress and returns mock results so UI and validation can be tested now.
 * Replace simulateUploadWithProgress with a real multipart call when the
 * backend is ready.
 */
@Injectable({ providedIn: 'root' })
export class DocumentUploadService {
  readonly allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];
  readonly maxBytes = 5 * 1024 * 1024; // 5 MB

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

  /** Upload one file and emit progress + final result. */
  upload(
    file: File,
    endpoint: string,
    options?: { simulateProgress?: boolean }
  ): Observable<DocumentUploadResult> {
    const validation = this.validate(file);
    if (!validation.ok) {
      return of({ ok: false, fileName: file.name, progress: 100, error: validation.reason });
    }

    return this.simulateUploadWithProgress(file, options).pipe(
      map((progress) => ({
        ok: true,
        fileName: file.name,
        progress,
        error: ''
      }))
    );
  }

  /**
   * Simulate upload progress for UI testing.
   * TODO: replace with real multipart POST when backend endpoints exist.
   */
  private simulateUploadWithProgress(
    file: File,
    options?: { simulateProgress?: boolean }
  ): Observable<number> {
    const steps = options?.simulateProgress ? [0, 30, 70, 100] : [100];
    return of(...steps).pipe(delay(0));
  }

  /** Mock document submission that returns a pending-review status. */
  submitDocuments(endpoint: string, ids: string[]): Observable<Result<{ status: string; estimatedMinutes: number }>> {
    // When backend endpoints exist, POST /api/v1/sellers/documents or
    // POST /api/v1/suppliers/documents should be used here.
    return of({
      isSuccess: true,
      data: { status: 'PendingReview', estimatedMinutes: 180 }
    }).pipe(delay(0));
  }
}

/** A document the seller has uploaded during registration (minimal shape for now). */
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
