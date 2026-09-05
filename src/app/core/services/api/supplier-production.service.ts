import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { ApiService } from '../api.service';
import { Result } from '../../models/api-response.model';

/** Production capacity entry */
export interface ProductionCapacity {
  id: string;
  supplierId: string;
  dailyCapacity: number;
  unit: string;
  effectiveFrom?: string;
  effectiveTo?: string;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

/** Data for creating/updating production capacity */
export interface ProductionCapacityData {
  dailyCapacity: number;
  unit: string;
  effectiveFrom?: string;
  effectiveTo?: string;
}

/** Production schedule for an order item */
export interface ProductionSchedule {
  id: string;
  orderItemId: string;
  supplierId: string;
  productionStartDate?: string;
  productionEndDate?: string;
  estimatedReadyDate?: string;
  status: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}

/** Data for setting production schedule */
export interface ProductionScheduleData {
  productionStartDate?: string;
  productionEndDate?: string;
  estimatedReadyDate?: string;
  status: string;
  notes?: string;
}

/** Order item assigned to supplier */
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

/**
 * سرویس مدیریت ظرفیت تولید و زمان‌بندی سفارشات تأمین‌کننده
 */
@Injectable({ providedIn: 'root' })
export class SupplierProductionService {
  constructor(private readonly api: ApiService) {}

  // ─── Production Capacity ──────────────────────────────────────

  /** دریافت لیست ظرفیت‌های تولید */
  getCapacities(): Observable<Result<ProductionCapacity[]>> {
    return this.api.get<Result<ProductionCapacity[]>>('/v1/supplier/production-capacity');
  }

  /** ایجاد یا به‌روزرسانی ظرفیت تولید */
  createOrUpdateCapacity(data: ProductionCapacityData): Observable<Result<ProductionCapacity>> {
    return this.api.post<Result<ProductionCapacity>>('/v1/supplier/production-capacity', data);
  }

  /** به‌روزرسانی ظرفیت تولید با شناسه */
  updateCapacity(id: string, data: ProductionCapacityData): Observable<Result<ProductionCapacity>> {
    return this.api.put<Result<ProductionCapacity>>(`/v1/supplier/production-capacity/${id}`, data);
  }

  /** حذف ظرفیت تولید (حذف نرم) */
  deleteCapacity(id: string): Observable<Result<boolean>> {
    return this.api.delete<Result<boolean>>(`/v1/supplier/production-capacity/${id}`);
  }

  // ─── Production Schedules ─────────────────────────────────────

  /** تنظیم زمان‌بندی تولید برای یک آیتم سفارش */
  setSchedule(orderItemId: string, data: ProductionScheduleData): Observable<Result<ProductionSchedule>> {
    return this.api.post<Result<ProductionSchedule>>(`/v1/supplier/order-items/${orderItemId}/production-schedule`, data);
  }

  /** دریافت زمان‌بندی‌های تولید یک سفارش */
  getOrderSchedules(orderId: string): Observable<Result<ProductionSchedule[]>> {
    return this.api.get<Result<ProductionSchedule[]>>(`/v1/supplier/orders/${orderId}/production-schedules`);
  }

  /** به‌روزرسانی وضعیت زمان‌بندی تولید */
  updateScheduleStatus(scheduleId: string, status: string, notes?: string): Observable<Result<boolean>> {
    return this.api.put<Result<boolean>>(`/v1/supplier/production-schedules/${scheduleId}/status`, { status, notes });
  }
}
