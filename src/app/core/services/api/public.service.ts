import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { ApiService } from '../api.service';
import { Result } from '../../models/api-response.model';

/** آمار زنده پلتفرم برای بخش «تولیدی در یک نگاه». */
export interface PlatformStats {
  activeSellers: number;
  activeAgents: number;
  completedOrders: number;
  satisfactionRate: number;
  updatedAt: string;
}

/** اطلاعات فروشنده برای صفحه اصلی */
export interface PublicSeller {
  id: string;
  /** حوزه فعالیت عمومی، بدون نمایش هویت تجاری تأمین‌کننده */
  trade: string;
  city: string;
  province: string;
}

/**
 * سرویس عمومی — داده‌های صفحه اصلی (بدون نیاز به احراز هویت).
 */
@Injectable({ providedIn: 'root' })
export class PublicService {
  constructor(private readonly api: ApiService) {}

  /** دریافت فهرست فروشندگان فعال با اطلاعات تحویل */
  getSellers(): Observable<Result<PublicSeller[]>> {
    return this.api.get<Result<PublicSeller[]>>('/v1/public/sellers');
  }

  /** دریافت آمار واقعی پلتفرم برای صفحه اصلی */
  getPlatformStats(): Observable<Result<PlatformStats>> {
    return this.api.get<Result<PlatformStats>>('/v1/public/platform-stats');
  }

  /** دریافت سفارشات فعال برای نقشه کره‌زمینی */
  getGlobeOrders(): Observable<Result<any>> {
    return this.api.get<Result<any>>('/v1/public/globe-orders');
  }
}
