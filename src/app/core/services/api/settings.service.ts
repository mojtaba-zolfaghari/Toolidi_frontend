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

/** سرویس تنظیمات مدیریتی */
@Injectable({ providedIn: 'root' })
export class SettingsService {
  constructor(private readonly api: ApiService) {}

  getSettings(): Observable<Result<SiteSetting[]>> {
    return this.api.get<Result<SiteSetting[]>>('/settings');
  }

  updateSetting(key: string, value: string): Observable<Result<boolean>> {
    return this.api.put<Result<boolean>>(`/settings/${encodeURIComponent(key)}`, { value });
  }
}
