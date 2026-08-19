import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { ApiService } from '../api.service';

/** درگاه پرداخت قابل انتخاب در تسویه‌حساب */
export interface PaymentGatewayOption {
  id: string;
  name: string;
  displayName: string;
  isSandbox: boolean;
}

/** سرویس درگاه‌های پرداخت فعال */
@Injectable({ providedIn: 'root' })
export class PaymentGatewayService {
  constructor(private readonly api: ApiService) {}

  /** دریافت درگاه‌های فعال بدون اطلاعات محرمانه */
  getGateways(): Observable<PaymentGatewayOption[]> {
    return this.api.get<PaymentGatewayOption[]>('/payment/gateways');
  }
}
