import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { ApiService } from '../api.service';
import { Result } from '../../models/api-response.model';

/** روش ارسال سفارش */
export interface ShippingMethod {
  id: string;
  name: string;
  englishName?: string;
  description?: string;
  baseCost: number;
  costPerKg?: number;
  freeShippingThreshold?: number;
  estimatedDeliveryDays?: number;
  maxWeight?: number;
  displayOrder: number;
}

/**
 * سرویس روش‌های ارسال.
 */
@Injectable({ providedIn: 'root' })
export class ShippingService {
  constructor(private readonly api: ApiService) {}

  /** دریافت لیست روش‌های ارسال فعال */
  getShippingMethods(): Observable<Result<ShippingMethod[]>> {
    return this.api.get<Result<ShippingMethod[]>>('/shipping/methods');
  }
}
