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

/** یک پاره‌ی ارسال از یک فروشنده (تولید + تحویل به پست) */
export interface ConsolidatedShippingLeg {
  sellerId: string;
  sellerName: string;
  originCity: string;
  originProvince: string;
  productionLeadDays: number;
  handOffDays: number;
  etaDays: number;
  weightKg: number;
  itemCount: number;
}

/** یک گزینه‌ی ارسال تجمیعی برای انتخاب خریدار */
export interface ConsolidatedShippingOption {
  shippingMethodId: string;
  methodName: string;
  totalCost: number;
  isFreeShipping: boolean;
  maxEtaDays: number;
  transitDays: number;
  isRecommended: boolean;
  isFastest: boolean;
  legs: ConsolidatedShippingLeg[];
}

/** نتیجه‌ی محاسبه‌ی ارسال هوشمند */
export interface ConsolidatedShippingResult {
  city: string;
  province: string;
  sellerCount: number;
  totalWeightKg: number;
  subtotal: number;
  slowestLegEtaDays: number;
  options: ConsolidatedShippingOption[];
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

  /**
   * محاسبه‌ی ارسال هوشمند تجمیعی سبد:
   * طولانی‌ترین زمان تولید تأمین‌کننده‌ها + تحویل فروشنده + زمان حمل روش،
   * به‌صورت گزینه‌های ترکیبی برای انتخاب خریدار.
   */
  calculateConsolidated(payload: {
    userAddressId?: string;
    city?: string;
    province?: string;
  }): Observable<Result<ConsolidatedShippingResult>> {
    return this.api.post<Result<ConsolidatedShippingResult>>('/shipping/calculate-consolidated', payload);
  }
}
