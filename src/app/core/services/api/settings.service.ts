import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { ApiService } from '../api.service';
import { Result } from '../../models/api-response.model';

/** تنظیم سامانه */
export interface SiteSetting {
  id?: string;
  key: string;
  value: string;
  description?: string;
}

/** درصد حاشیه سود برای یک دامنه (دسته‌بندی یا محصول) */
export interface MarkupScope {
  scopeId: string;
  percent: number;
}

/** تب‌بندی تنظیمات ادمین (basic / payment / sms / markup) */
export interface SettingsTabs {
  basic: { taxRate: string };
  payment: {
    zarinPalMerchantId: string;
    zarinPalIsSandbox: boolean;
    sepTerminalId: string;
    sepMerchantId: string;
    sepIsSandbox: boolean;
  };
  sms: {
    provider: string;
    apiKey: string;
    senderNumber: string;
    orderStatusEnabled: boolean;
  };
  markup: {
    globalPercent: number;
    hasGlobal: boolean;
    categoryPercents: MarkupScope[];
    productPercents: MarkupScope[];
  };
}

/** نتیجه ارسال پیامک آزمایشی */
export interface SmsTestResult {
  sent: boolean;
  message?: string;
}

/**
 * سرویس تنظیمات مدیریتی؛ خواندن/نوشتن SiteSettingها به شکل کلید-مقدار
 * و مدل تب‌بندی‌شده برای صفحه تنظیمات.
 */
@Injectable({ providedIn: 'root' })
export class SettingsService {
  constructor(private readonly api: ApiService) {}

  /** دریافت همه تنظیمات (کلید-مقدار) */
  getSettings(): Observable<Result<SiteSetting[]>> {
    return this.api.get<Result<SiteSetting[]>>('/v1/admin/settings');
  }

  /** دریافت تنظیمات به شکل تب‌بندی‌شده */
  getTabs(): Observable<Result<SettingsTabs>> {
    return this.api.get<Result<SettingsTabs>>('/v1/admin/settings-tabs');
  }

  /** ذخیره یک تنظیم (upsert بر اساس کلید) */
  updateSetting(key: string, value: string): Observable<Result<boolean>> {
    return this.api.put<Result<boolean>>(`/v1/admin/settings/${encodeURIComponent(key)}`, { value });
  }

  /** ارسال پیامک آزمایشی با تنظیمات ذخیره‌شده */
  testSms(mobileNumber: string): Observable<Result<boolean>> {
    return this.api.post<Result<boolean>>('/v1/admin/settings-tabs/sms/test', { mobileNumber });
  }
}
