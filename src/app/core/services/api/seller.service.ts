import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { ApiService } from '../api.service';
import { PagedList, Result } from '../../models/api-response.model';
import { Product } from './product.service';
import { buildQueryString } from './query.util';

/** خلاصه‌ی داشبورد فروشنده برای ماه جاری */
export interface DashboardSummary {
  sellerId: string;
  periodStart: string;
  periodEnd: string;
  totalSales: number;
  totalOrders: number;
  totalProductsSold: number;
  totalCommission: number;
  totalCosts: number;
  netProfit: number;
  averageRating: number;
  activeProducts: number;
  openOrders: number;
}

/** یک نقطه از روند فروش یا سفارش */
export interface SalesTrend {
  date: string;
  salesAmount: number;
  orders: number;
  productsSold: number;
}

/** آمار سفارش‌های فروشنده */
export interface OrderStats {
  periodStart: string;
  periodEnd: string;
  totalOrders: number;
  totalSales: number;
  averageOrderValue: number;
  pendingOrders: number;
  processingOrders: number;
  shippedOrders: number;
  deliveredOrders: number;
  cancelledOrders: number;
  returnedOrders: number;
  trend: SalesTrend[];
}

/** عملکرد یک محصول فروشنده */
export interface ProductStats {
  productId: string;
  productName: string;
  categoryId: string;
  views: number;
  purchases: number;
  conversionRate: number;
  quantitySold: number;
  salesAmount: number;
  orderCount: number;
}

/** آمار تفصیلی فروشنده */
export interface SellerStatistics {
  sellerId: string;
  periodStart: string;
  periodEnd: string;
  totalSales: number;
  totalOrders: number;
  totalProductsSold: number;
  averageOrderValue: number;
  totalViews: number;
  conversionRate: number;
  averageRating: number;
  activeProducts: number;
  salesTrend: SalesTrend[];
}

/** جزئیات کمیسیون یک سفارش */
export interface CommissionBreakdown {
  orderId: string;
  orderNumber: string;
  orderDate: string;
  productId: string;
  productName: string;
  categoryId: string;
  saleAmount: number;
  commissionRate: number;
  fixedAmount: number;
  commissionAmount: number;
  periodStart: string;
  periodEnd: string;
}

/**
 * سرویس فروشنده؛ داشبورد و آمار عملکرد (نیازمند نقش فروشنده).
 */
@Injectable({ providedIn: 'root' })
export class SellerService {
  constructor(private readonly api: ApiService) {}

  /** دریافت خلاصه‌ی داشبورد ماه جاری */
  getDashboard(): Observable<Result<DashboardSummary>> {
    return this.api.get<Result<DashboardSummary>>('/seller/dashboard');
  }

  /** دریافت آمار تفصیلی و روند فروش */
  getStatistics(): Observable<Result<SellerStatistics>> {
    return this.api.get<Result<SellerStatistics>>('/seller/statistics');
  }

  /** دریافت آمار عملکرد محصولات */
  getProductStats(): Observable<Result<ProductStats[]>> {
    return this.api.get<Result<ProductStats[]>>('/seller/products/stats');
  }

  /** دریافت آمار سفارش‌ها بر اساس وضعیت */
  getOrderStats(): Observable<Result<OrderStats>> {
    return this.api.get<Result<OrderStats>>('/seller/orders/stats');
  }

  /** دریافت جزئیات کمیسیون به تفکیک سفارش و محصول */
  getCommissionBreakdown(): Observable<Result<CommissionBreakdown[]>> {
    return this.api.get<Result<CommissionBreakdown[]>>('/seller/commissions');
  }

  /** دریافت فهرست محصولات فروشنده‌ی جاری */
  getProducts(params?: { page?: number; pageSize?: number }): Observable<Result<PagedList<Product>>> {
    return this.api.get<Result<PagedList<Product>>>(`/Seller/products${buildQueryString(params)}`);
  }
}
