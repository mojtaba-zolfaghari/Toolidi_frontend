import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { ApiService } from '../api.service';
import { PagedList, Result } from '../../models/api-response.model';
import { buildQueryString } from './query.util';

/** آیتم سفارش */
export interface OrderItem {
  id: string;
  orderId: string;
  productId: string;
  productName: string;
  sku: string;
  quantity: number;
  unitPrice: number;
  discountAmount: number;
  taxAmount: number;
  totalPrice: number;
}

/** سابقه‌ی تغییر وضعیت سفارش */
export interface OrderHistory {
  id: string;
  orderId: string;
  previousStatus: string;
  newStatus: string;
  comments?: string;
  changedBy: string;
  createdAt: string;
}

/** سفارش */
export interface Order {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  paymentMethod: number;
  isPaid: boolean;
  totalAmount: number;
  discountAmount: number;
  taxAmount: number;
  shippingAmount: number;
  grandTotal: number;
  couponCode?: string;
  shippingTrackingCode?: string;
  deliveryDate?: string;
  userNotes?: string;
  createdAt: string;
  updatedAt: string;
  items: OrderItem[];
  history: OrderHistory[];
}

/** داده‌ی ایجاد سفارش */
export interface CreateOrderData {
  shippingAddressId: string;
  billingAddressId: string;
  shippingMethodId?: string;
  userNotes?: string;
}

/** پارامترهای لیست سفارش‌ها */
export interface OrderQueryParams {
  page?: number;
  pageSize?: number;
}

/** وضعیت پیگیری سفارش */
export interface OrderTracking {
  id: string;
  orderNumber: string;
  status: string;
  deliveryDate?: string;
  trackingCode?: string;
  carrierName?: string;
  currentLocation?: string;
  history: OrderTrackingHistory[];
}

/** یک مرحله از زمان‌بندی سفارش */
export interface OrderTimelineStage {
  key: string;
  label: string;
  icon: string;
  completed: boolean;
  current: boolean;
  date?: string;
  note?: string;
}

/** زمان‌بندی ۶ مرحله‌ای سفارش */
export interface OrderTimeline {
  orderId: string;
  orderNumber: string;
  currentStatus: string;
  stages: OrderTimelineStage[];
}

/** زمان تقریبی تحویل یک آیتم سبد خرید */
export interface EstimatedDelivery {
  productId: string;
  productName: string;
  quantity: number;
  supplierName: string;
  supplierId: string;
  dailyCapacity: number;
  unit: string;
  capacitySet: boolean;
  productionDays: number;
  estimatedReadyDate?: string;
  estimatedDeliveryDate?: string;
}

/** یک سابقه از پیگیری سفارش */
export interface OrderTrackingHistory {
  status: string;
  changedAt: string;
  note?: string;
}

/**
 * سرویس سفارش‌ها؛ ایجاد، لیست، لغو، تغییر وضعیت و پیگیری.
 */
@Injectable({ providedIn: 'root' })
export class OrderService {
  constructor(private readonly api: ApiService) {}

  /** ایجاد سفارش از سبد خرید کاربر جاری */
  createOrder(data: CreateOrderData): Observable<Result<string>> {
    return this.api.post<Result<string>>('/v1/orders', data);
  }

  /** دریافت لیست سفارش‌های کاربر جاری */
  getOrders(params?: OrderQueryParams): Observable<Result<PagedList<Order>>> {
    return this.api.get<Result<PagedList<Order>>>(`/v1/orders${buildQueryString(params)}`);
  }

  /** دریافت یک سفارش با شناسه */
  getOrderById(id: string): Observable<Result<Order>> {
    return this.api.get<Result<Order>>(`/v1/orders/${id}`);
  }

  /** دریافت یک سفارش با شماره سفارش (رشته ORD-...) */
  getOrderOrderByNumber(orderNumber: string): Observable<Result<Order>> {
    return this.api.get<Result<Order>>(`/v1/orders/by-order-number/${encodeURIComponent(orderNumber)}`);
  }

  /** لغو یک سفارش */
  cancelOrder(id: string): Observable<Result<boolean>> {
    return this.api.post<Result<boolean>>(`/v1/orders/${id}/cancel`, {});
  }

  /** تغییر وضعیت سفارش (نقش فروشنده یا مدیر) */
  updateOrderStatus(id: string, status: string): Observable<Result<boolean>> {
    return this.api.put<Result<boolean>>(`/v1/orders/${id}/status`, { status });
  }

  /** دریافت اطلاعات پیگیری سفارش */
  trackOrder(id: string): Observable<Result<OrderTracking>> {
    return this.api.get<Result<OrderTracking>>(`/v1/orders/${id}/track`);
  }

  /** دریافت زمان تقریبی تحویل بر اساس سبد خرید */
  getEstimatedDelivery(): Observable<Result<EstimatedDelivery[]>> {
    return this.api.get<Result<EstimatedDelivery[]>>(`/v1/checkout/estimated-delivery`);
  }

  /** دریافت زمان‌بندی ۶ مرحله‌ای سفارش */
  getOrderTimeline(orderId: string): Observable<Result<OrderTimeline>> {
    return this.api.get<Result<OrderTimeline>>(`/v1/orders/${orderId}/timeline`);
  }
}
