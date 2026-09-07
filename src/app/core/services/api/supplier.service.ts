import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from '../api.service';
import { Result } from '../../models/api-response.model';

export interface SupplierProduct {
  id: string;
  name: string;
  sku: string;
  price: number;
  stockQuantity: number;
  categoryName: string;
  imageUrl: string;
  isActive: boolean;
}

export interface SupplierOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  productName: string;
  quantity: number;
  totalAmount: number;
  status: string;
  createdAt: string;
  city: string;
}

/** رکورد قیمت تأمین‌کننده برای یک محصول */
export interface SupplierProductPricing {
  id: string;
  supplierId: string;
  productId: string;
  productName: string;
  sku: string;
  /** قیمت تأمین‌کننده (تومان) */
  supplyPrice: number;
  /** حاشیه سود خالص درخواستی (درصد) — صفر یعنی پیش‌فرض سایت */
  profitMarginPercent: number;
  /** حاشیه سود مؤثر بعد از اعمال تنظیمات */
  effectiveMarginPercent: number;
  /** قیمت پیشنهادی سایت (با حاشیه سود و تعدیل مالیات/ارزش افزوده) */
  suggestedSitePrice: number;
  availableQuantity: number;
  leadTimeHours: number;
  minOrderQuantity: number;
  supplierSku?: string;
  isAvailable: boolean;
}

export interface SupplierDashboard {
  totalProducts: number;
  activeProducts: number;
  totalOrders: number;
  pendingOrders: number;
  totalRevenue: number;
  averageRating: number;
  deliverySuccessRate: number;
  citiesServed: number;
}

@Injectable({ providedIn: 'root' })
export class SupplierService {
  constructor(private readonly api: ApiService) {}

  getDashboard(): Observable<Result<SupplierDashboard>> {
    return this.api.get<Result<SupplierDashboard>>('/v1/suppliers/dashboard');
  }

  getProducts(): Observable<Result<SupplierProduct[]>> {
    return this.api.get<Result<SupplierProduct[]>>('/v1/suppliers/products');
  }

  getOrders(): Observable<Result<SupplierOrder[]>> {
    return this.api.get<Result<SupplierOrder[]>>('/v1/suppliers/orders');
  }

  /** فهرست قیمت‌های تأمین‌کننده جاری برای محصولات */
  getMyPricing(): Observable<Result<SupplierProductPricing[]>> {
    return this.api.get<Result<SupplierProductPricing[]>>('/v1/supplier-products/my');
  }

  /** ثبت/به‌روزرسانی قیمت تأمین‌کننده برای یک محصول */
  upsertPricing(data: {
    productId: string;
    supplyPrice: number;
    profitMarginPercent?: number;
    availableQuantity?: number;
    leadTimeHours?: number;
    minOrderQuantity?: number;
    supplierSku?: string;
  }): Observable<Result<SupplierProductPricing>> {
    return this.api.post<Result<SupplierProductPricing>>('/v1/supplier-products/my', data);
  }

  getProfile(): Observable<Result<any>> {
    return this.api.get<Result<any>>('/v1/suppliers/profile');
  }

  updateProfile(data: any): Observable<Result<any>> {
    return this.api.put<Result<any>>('/v1/suppliers/profile', data);
  }
}
