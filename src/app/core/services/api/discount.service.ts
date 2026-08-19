import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { ApiService } from '../api.service';
import { PagedList, Result } from '../../models/api-response.model';
import { buildQueryString } from './query.util';

/** تخفیف (کد تخفیف سراسری) */
export interface Discount {
  id: string;
  name: string;
  description?: string;
  percentage: number;
  /** در صورت پشتیبانی API، نوع تخفیف */
  type?: 'percentage' | 'fixed';
  /** مقدار نمایشی تخفیف */
  value?: number;
  minOrderAmount?: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
  createdAt: string;
  updatedAt?: string;
}

/** داده‌ی ایجاد یا ویرایش تخفیف */
export interface DiscountData {
  name: string;
  description?: string;
  percentage: number;
  /** در صورت پشتیبانی API، نوع تخفیف */
  type?: 'percentage' | 'fixed';
  /** مقدار نمایشی تخفیف */
  value?: number;
  minOrderAmount?: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
}

/** پارامترهای لیست تخفیف‌ها */
export interface DiscountQueryParams {
  pageNumber?: number;
  pageSize?: number;
}

/** سرویس مدیریت تخفیف‌ها (نقش مدیر) */
@Injectable({ providedIn: 'root' })
export class DiscountService {
  constructor(private readonly api: ApiService) {}

  /** دریافت لیست صفحه‌بندی‌شده تخفیف‌ها */
  getDiscounts(params?: DiscountQueryParams): Observable<Result<PagedList<Discount>>> {
    return this.api.get<Result<PagedList<Discount>>>(`/Discount${buildQueryString(params)}`);
  }

  /** ایجاد تخفیف جدید */
  createDiscount(data: DiscountData): Observable<Result<string>> {
    return this.api.post<Result<string>>('/Discount', data);
  }

  /** ویرایش تخفیف */
  updateDiscount(id: string, data: DiscountData): Observable<Result<boolean>> {
    return this.api.put<Result<boolean>>(`/Discount/${id}`, data);
  }

  /** حذف تخفیف */
  deleteDiscount(id: string): Observable<Result<boolean>> {
    return this.api.delete<Result<boolean>>(`/Discount/${id}`);
  }
}
