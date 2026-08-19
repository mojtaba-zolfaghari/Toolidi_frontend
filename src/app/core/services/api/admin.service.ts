import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { ApiService } from '../api.service';
import { PagedList, Result } from '../../models/api-response.model';
import { buildQueryString } from './query.util';
import { SalesReport } from './reports.service';

/** کاربر قابل مدیریت در پنل مدیر */
export interface AdminUser {
  id: string;
  nationalCode: string;
  username: string;
  mobileNumber?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  roleId?: string;
  roleName?: string;
  isActive: boolean;
  createdAt: string;
  lastLoginAt?: string;
}

/** محصول قابل مدیریت در پنل مدیر */
export interface AdminProduct {
  id: string;
  sellerId: string;
  categoryId: string;
  name: string;
  sku: string;
  unitPrice: number;
  imageUrl?: string;
  publishStatus: string;
  isActive: boolean;
  isDeleted: boolean;
  isFeatured: boolean;
  isNewArrival: boolean;
  isBestSeller: boolean;
  createdAt: string;
  publishedAt?: string;
}

/** فروشنده قابل مدیریت در پنل مدیر */
export interface AdminSeller {
  id: string;
  companyName: string;
  nationalId?: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  address?: string;
  city?: string;
  province?: string;
  postalCode?: string;
  country?: string;
  commissionRate?: number;
  isVerified: boolean;
  isActive: boolean;
  createdAt: string;
}

/** داده‌ی ایجاد فروشنده */
export interface CreateSellerData {
  companyName: string;
  nationalId: string;
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  address: string;
  city: string;
  province: string;
  postalCode: string;
  country: string;
  commissionRate: number;
}

/** مدرک ثبت‌شده برای فروشنده */
export interface SellerDocument {
  name: string;
  url: string;
  type?: string;
}

/** فیلترهای فهرست کاربران مدیر */
export interface AdminUserQueryParams {
  pageNumber?: number;
  pageSize?: number;
  searchTerm?: string;
  roleId?: string;
  isActive?: boolean;
}

/** فیلترهای فهرست محصولات مدیر */
export interface AdminProductQueryParams {
  publishStatus?: string;
  sellerId?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}

/** سرویس عملیات مدیریتی کاربران، محصولات، فروشندگان و گزارش‌ها */
@Injectable({ providedIn: 'root' })
export class AdminService {
  constructor(private readonly api: ApiService) {}

  getUsers(params?: AdminUserQueryParams): Observable<Result<PagedList<AdminUser>>> {
    return this.api.get<Result<PagedList<AdminUser>>>(`/admin/Admin${buildQueryString(params)}`);
  }

  getUserById(userId: string): Observable<Result<AdminUser>> {
    return this.api.get<Result<AdminUser>>(`/admin/Admin/${userId}`);
  }

  updateUserRole(userId: string, roleId: string): Observable<Result<boolean>> {
    return this.api.put<Result<boolean>>(`/admin/Admin/${userId}/role`, roleId);
  }

  toggleUserStatus(userId: string, isActive: boolean): Observable<Result<boolean>> {
    return this.api.put<Result<boolean>>(`/admin/Admin/${userId}/status`, { isActive });
  }

  /** حذف نرم کاربر */
  deleteUser(userId: string): Observable<Result<boolean>> {
    return this.api.delete<Result<boolean>>(`/admin/Admin/${userId}`);
  }

  getAdminProducts(params?: AdminProductQueryParams): Observable<Result<PagedList<AdminProduct>>> {
    return this.api.get<Result<PagedList<AdminProduct>>>(`/admin/products${buildQueryString(params)}`);
  }

  getSellers(params?: { page?: number; pageSize?: number }): Observable<Result<PagedList<AdminSeller>>> {
    return this.api.get<Result<PagedList<AdminSeller>>>(`/admin/sellers${buildQueryString(params)}`);
  }

  /** ایجاد فروشنده توسط مدیر */
  createSeller(data: CreateSellerData): Observable<Result<string>> {
    return this.api.post<Result<string>>('/admin/sellers', data);
  }

  /** حذف نرم فروشنده */
  deleteSeller(sellerId: string): Observable<Result<boolean>> {
    return this.api.delete<Result<boolean>>(`/admin/sellers/${sellerId}`);
  }

  verifySeller(sellerId: string): Observable<Result<boolean>> {
    return this.api.put<Result<boolean>>(`/admin/sellers/${sellerId}/verify`, {});
  }

  getSellerDocuments(sellerId: string): Observable<Result<SellerDocument[]>> {
    return this.api.get<Result<SellerDocument[]>>(`/admin/sellers/${sellerId}/documents`);
  }

  /** گزارش فروش روزانه */
  getDailyReport(date: string): Observable<Result<SalesReport>> {
    return this.api.get<Result<SalesReport>>(`/admin/reports/daily${buildQueryString({ date })}`);
  }

  /** گزارش فروش ماهانه */
  getMonthlyReport(month: string): Observable<Result<SalesReport>> {
    return this.api.get<Result<SalesReport>>(`/admin/reports/monthly${buildQueryString({ month })}`);
  }
}
