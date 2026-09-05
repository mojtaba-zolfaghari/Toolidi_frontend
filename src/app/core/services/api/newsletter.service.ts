import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { ApiService } from '../api.service';
import { Result } from '../../models/api-response.model';

/**
 * سرویس خبرنامه؛ ثبت و لغو عضویت ایمیل از فرم فوتر سایت.
 */
@Injectable({ providedIn: 'root' })
export class NewsletterService {
  constructor(private readonly api: ApiService) {}

  /** ثبت ایمیل در خبرنامه */
  subscribe(email: string): Observable<Result<string>> {
    return this.api.post<Result<string>>('/newsletter/subscribe', { email });
  }

  /** لغو عضویت ایمیل */
  unsubscribe(email: string): Observable<Result<boolean>> {
    return this.api.post<Result<boolean>>('/newsletter/unsubscribe', { email });
  }
}