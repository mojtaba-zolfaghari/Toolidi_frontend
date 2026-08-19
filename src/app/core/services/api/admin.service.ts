import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { ApiService } from '../api.service';
import { PagedList, Result } from '../../models/api-response.model';
import { buildQueryString } from './query.util';

/** کاربر قابل مدیریت در پنل مدیر */
export interface AdminUser {
  id: string;
  nationalCode: string;
  username: string;
  mobileNumber?: string;
  email?: string;
  firstName?: string;
  lastName?: string;
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
  contactName: string;
  contactEmail: string;
  contactPhone: string;
  isVerified: boolean;
  isActive: boolean;
  createdAt: string;
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

/**
 * سرویس عملیات مدیریتی کاربران، محصولات و فروشندگان.
 */
@Injectable({ providedIn: 'root' })
export class AdminService {
  constructor(private readonly api: ApiService) {}

  /** دریافت فهرست صفحه‌بندی‌شده کاربران */
  getUsers(params?: AdminUserQueryParams): Observable<Result<PagedList<AdminUser>>> {
    return this.api.get<Result<PagedList<AdminUser>>>(`/admin/Admin${buildQueryString(params)}`);
  }

  /** دریافت یک کاربر */
  getUserById(userId: string): Observable<Result<AdminUser>> {
    return this.api.get<Result<AdminUser>>(`/admin/Admin/${userId}`);
  }

  /** تغییر نقش کاربر با شناسه نقش */
  updateUserRole(userId: string, roleId: string): Observable<Result<boolean>> {
    return this.api.put<Result<boolean>>(`/admin/Admin/${userId}/role`, roleId);
  }

  /** فعال یا غیرفعال کردن کاربر */
  toggleUserStatus(userId: string, isActive: boolean): Observable<Result<boolean>> {
    return this.api.put<Result<boolean>>(`/admin/Admin/${userId}/status`, { isActive });
  }

  /** دریافت همه محصولات برای مدیریت انتشار */
  getAdminProducts(params?: AdminProductQueryParams): Observable<Result<PagedList<AdminProduct>>> {
    return this.api.get<Result<PagedList<AdminProduct>>>(`/admin/products${buildQueryString(params)}`);
  }

  /** دریافت فهرست فروشندگان */
  getSellers(params?: { page?: number; pageSize?: number }): Observable<Result<PagedList<AdminSeller>>> {
    return this.api.get<Result<PagedList<AdminSeller>>>(`/admin/sellers${buildQueryString(params)}`);
  }

  /** تأیید فروشنده */
  verifySeller(sellerId: string): Observable<Result<boolean>> {
    return this.api.put<Result<boolean>>(`/admin/sellers/${sellerId}/verify`, {});
  }
}
