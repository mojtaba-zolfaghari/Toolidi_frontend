import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { ApiService } from '../api.service';
import { Result } from '../../models/api-response.model';

/** پرداخت */
export interface Payment {
  id: string;
  orderId: string;
  gatewayId: string;
  gatewayName?: string;
  paymentNumber: string;
  amount: number;
  status: string;
  transactionId?: string;
  authorityCode?: string;
  paymentDate?: string;
  verificationDate?: string;
  refundAmount: number;
  refundDate?: string;
  errorMessage?: string;
  createdAt: string;
}

/** نتیجه‌ی درخواست پرداخت (شامل آدرس هدایت به درگاه) */
export interface PaymentRequestResult {
  paymentId: string;
  authorityCode?: string;
  redirectUrl?: string;
}

/** داده‌ی درخواست پرداخت */
export interface RequestPaymentData {
  orderId: string;
  gatewayId: string;
}

/** داده‌ی بازپرداخت */
export interface RefundPaymentData {
  amount?: number;
  reason?: string;
}

/**
 * سرویس پرداخت؛ درخواست پرداخت، وضعیت و بازپرداخت.
 */
@Injectable({ providedIn: 'root' })
export class PaymentService {
  constructor(private readonly api: ApiService) {}

  /** درخواست پرداخت برای یک سفارش با درگاه مشخص */
  requestPayment(orderId: string, gatewayId: string): Observable<Result<PaymentRequestResult>> {
    return this.api.post<Result<PaymentRequestResult>>('/v1/payments/request', { orderId, gatewayId });
  }

  /** دریافت وضعیت یک پرداخت */
  getPaymentStatus(paymentId: string): Observable<Result<Payment>> {
    return this.api.get<Result<Payment>>(`/v1/payments/${paymentId}/status`);
  }

  /** بازپرداخت یک پرداخت (نقش مدیر) */
  refundPayment(paymentId: string, amount?: number): Observable<Result<boolean>> {
    const body: RefundPaymentData = { amount };
    return this.api.post<Result<boolean>>(`/v1/payments/${paymentId}/refund`, body);
  }
}
