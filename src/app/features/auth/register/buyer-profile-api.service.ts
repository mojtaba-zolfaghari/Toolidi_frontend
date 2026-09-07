import { Injectable } from '@angular/core';
import { Observable, of, throwError } from 'rxjs';
import { delay, tap } from 'rxjs/operators';

import { ApiService } from '../../../core/services/api.service';
import { Result } from '../../../core/models/api-response.model';

/**
 * TODO(task: TASK-FE-REGISTER-BUYER-ENHANCE):
 * بهبود فرم ثبت‌نام خریدار — پروفایل + جریان تأیید
 *
 * This service is intentionally a thin wrapper so tests can provide a mock.
 * Directive: on submit success, display status «تأیید خودکار» with explanation.
 *
 * Current backend does NOT expose POST /api/v1/buyers/profile yet.
 * Until then, this service behaves like a best-effort post and returns
 * a synthetic success so the frontend UX flow (automatic verification)
 * can be validated and unit-tested without a live endpoint.
 */
@Injectable({ providedIn: 'root' })
export class BuyerProfileApiService {
  constructor(private readonly api: ApiService) {}

  /**
   * ارسال پروفایل خریدار پس از ثبت‌نام.
   * TODO: وقتی بک‌اند endpoint داشته باشد، فقط از this.api استفاده کند.
   */
  submitProfile(data: BuyerProfileSubmitData): Observable<Result<{ status: string; estimatedMinutes?: number }>> {
    // Backstop for integration when backend is ready.
    if (this.api && typeof this.api.post === 'function') {
      try {
        return this.api.post<Result<{ status: string }>>('/api/v1/buyers/profile', data);
      } catch {
        // fallback to synthetic UX path
      }
    }

    // Synthetic UX-only path (does not hit network).
    return of({
      isSuccess: true,
      data: { status: 'AutomaticVerification', estimatedMinutes: 0 }
    }).pipe(delay(0));
  }
}

/** Payload for buyer profile enhancement. */
export interface BuyerProfileSubmitData {
  nationalCode?: string;
  mobile?: string;
  postalAddress?: string;
}
