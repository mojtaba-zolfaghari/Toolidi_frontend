import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { ApiService } from '../api.service';
import { Result } from '../../models/api-response.model';
import { buildQueryString } from './query.util';

/** خلاصه‌ی فروش برای گزارش‌های روزانه و ماهانه */
export interface SalesReport {
  date?: string;
  month?: string;
  totalOrders: number;
  totalSales: number;
  totalDiscount: number;
  netSales: number;
  trend?: SalesReportPoint[];
}

/** یک نقطه از روند فروش */
export interface SalesReportPoint {
  label: string;
  sales: number;
  orders?: number;
}

/** عملکرد یک فروشنده در گزارش مدیر */
export interface SellerPerformanceReport {
  sellerId: string;
  companyName: string;
  totalOrders: number;
  totalSales: number;
  totalCommission?: number;
  averageOrderValue?: number;
  conversionRate?: number;
  netSales: number;
}

export interface TopProductReport {
  productId: string;
  productName: string;
  sellerName?: string;
  salesAmount: number;
  quantitySold?: number;
  orderCount?: number;
}

/** سرویس گزارش‌های مدیریتی */
@Injectable({ providedIn: 'root' })
export class ReportsService {
  constructor(private readonly api: ApiService) {}

  getDailyReport(date: string): Observable<Result<SalesReport>> {
    return this.api.get<Result<SalesReport>>(`/admin/reports/daily${buildQueryString({ date })}`);
  }

  getMonthlyReport(month: string): Observable<Result<SalesReport>> {
    return this.api.get<Result<SalesReport>>(`/admin/reports/monthly${buildQueryString({ month })}`);
  }

  getSellerPerformance(sellerId?: string): Observable<Result<SellerPerformanceReport[]>> {
    return this.api.get<Result<SellerPerformanceReport[]>>(`/admin/reports/seller-performance${buildQueryString({ sellerId })}`);
  }

  getTopProducts(): Observable<Result<TopProductReport[]>> {
    return this.api.get<Result<TopProductReport[]>>('/admin/reports/top-products');
  }
}
