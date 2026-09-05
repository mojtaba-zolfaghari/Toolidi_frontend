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
  comparePrice?: number | null;
  costPrice?: number | null;
  shortDescription?: string | null;
  fullDescription?: string | null;
  isTaxable?: boolean;
  taxRate?: number | null;
  weight?: number | null;
  length?: number | null;
  width?: number | null;
  height?: number | null;
  isPhysical?: boolean;
  isDigital?: boolean;
  imageUrl?: string;
  publishStatus: string;
  isActive: boolean;
  isDeleted: boolean;
  isFeatured: boolean;
  isNewArrival: boolean;
  isBestSeller: boolean;
  createdAt: string;
  publishedAt?: string;
  /** مجموع موجودی تنوع‌های فعال (null = بدون تنوع) */
  stockQuantity?: number | null;
}

/** تنوع محصول برای مودال ویرایش/افزایش موجودی */
export interface AdminProductVariation {
  id: string;
  productId: string;
  sku: string;
  displayName: string;
  priceAdjustment: number;
  stockQuantity: number;
  isDefault: boolean;
  isActive?: boolean;
}

/** جزئیات کامل محصول برای مودال ویرایش مدیر */
export interface AdminProductDetail {
  id: string;
  sellerId: string;
  categoryId: string;
  name: string;
  sku: string;
  shortDescription?: string | null;
  fullDescription?: string | null;
  unitPrice: number;
  comparePrice?: number | null;
  costPrice?: number | null;
  isTaxable: boolean;
  taxRate?: number | null;
  weight?: number | null;
  length?: number | null;
  width?: number | null;
  height?: number | null;
  isPhysical: boolean;
  isDigital: boolean;
  publishStatus: string;
  variations: AdminProductVariation[];
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
  cityId?: string;
  provinceId?: string;
  postalCode: string;
  country: string;
  commissionRate: number;
}

/** مدرک ثبت‌شده برای فروشنده */
export interface SellerDocument {
  id?: string;
  name: string;
  url: string;
  type?: string;
  documentType?: string;
  fileName?: string;
  contentType?: string;
  fileSizeBytes?: number;
  isVerified?: boolean;
  verificationNote?: string;
  createdAt?: string;
}

/** سفارش یک فروشنده در جزئیات (سمت ادمین) */
export interface AdminSellerOrder {
  orderId: string;
  orderNumber: string;
  status: string;
  totalAmount: number;
  createdAt: string;
  itemCount: number;
}

/** گزارش تجمیعی یک فروشنده (سمت ادمین) */
export interface SellerReport {
  orderCount: number;
  completedOrderCount: number;
  revenue: number;
  commissionOwed: number;
  productCount: number;
  pendingDocuments: number;
}

/** تأمین‌کننده قابل مدیریت در پنل مدیر */
export interface AdminSupplier {
  id: string;
  name: string;
  contactInfo: string;
  location: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/** داده‌ی ایجاد/ویرایش تأمین‌کننده */
export interface CreateSupplierData {
  name: string;
  contactInfo: string;
  location: string;
  cityId?: string;
  provinceId?: string;
}

/** کارپخش قابل مدیریت در پنل مدیر */
export interface AdminAgent {
  id: string;
  fullName: string;
  nationalId: string;
  phone: string;
  email: string;
  city: string;
  province: string;
  vehicleType?: string | null;
  vehiclePlate?: string | null;
  isVerified: boolean;
  status: string;
  maxConcurrentOrders: number;
  rating: number;
  ratingCount: number;
  totalOrdersCompleted: number;
  totalOrdersCancelled: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/** داده‌ی ایجاد/ویرایش کارپخش */
export interface CreateAgentData {
  fullName: string;
  nationalId: string;
  phone: string;
  email: string;
  city: string;
  province: string;
  cityId?: string;
  provinceId?: string;
  vehicleType?: string | null;
  vehiclePlate?: string | null;
}

/** فیلترهای فهرست کاربران مدیر */
export interface AdminUserQueryParams {
  page?: number;
  pageSize?: number;
  search?: string;
  role?: string;
  status?: 'Active' | 'Inactive';
}

/** سفارش کاربر در مودال جزئیات (سمت ادمین) */
export interface AdminUserOrder {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  isPaid: boolean;
  grandTotal: number;
  itemCount: number;
  createdAt: string;
}

/** آدرس کاربر در مودال جزئیات (سمت ادمین) */
export interface AdminUserAddress {
  id: string;
  addressType: string;
  addressLine: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
  phoneNumber?: string;
}

/** فیلترهای فهرست محصولات مدیر */
export interface AdminProductQueryParams {
  publishStatus?: string;
  sellerId?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}

/** داشبورد مدیریت */
export interface AdminDashboardData {
  totalOrders: number;
  totalRevenue: number;
  totalUsers: number;
  totalSellers: number;
  conversionRate: number;
  dailySales: { label: string; value: number }[];
  weeklySales: { label: string; value: number }[];
  monthlySales: { label: string; value: number }[];
  recentOrders: { id: string; orderNumber: string; status: string; totalAmount: number; createdAt: string }[];
  lowStockAlerts: { productName: string; sku: string; stockQuantity: number }[];
}

/** سرویس عملیات مدیریتی کاربران، محصولات، فروشندگان و گزارش‌ها */
@Injectable({ providedIn: 'root' })
export class AdminService {
  constructor(private readonly api: ApiService) {}

  getUsers(params?: AdminUserQueryParams): Observable<Result<PagedList<AdminUser>>> {
    // Backend GetUsersQuery binds: page, pageSize, role, status (Active/Inactive), search.
    return this.api.get<Result<PagedList<AdminUser>>>(`/v1/admin/users${buildQueryString(params)}`);
  }

  getUserOrders(userId: string, page = 1, pageSize = 10): Observable<Result<PagedList<AdminUserOrder>>> {
    return this.api.get<Result<PagedList<AdminUserOrder>>>(`/v1/admin/users/${userId}/orders?page=${page}&pageSize=${pageSize}`);
  }

  getUserAddresses(userId: string): Observable<Result<AdminUserAddress[]>> {
    return this.api.get<Result<AdminUserAddress[]>>(`/v1/admin/users/${userId}/addresses`);
  }

  getUserById(userId: string): Observable<Result<AdminUser>> {
    return this.api.get<Result<AdminUser>>(`/v1/admin/users/${userId}`);
  }

  updateUserRole(userId: string, roleId: string): Observable<Result<boolean>> {
    return this.api.put<Result<boolean>>(`/v1/admin/users/${userId}/role`, roleId);
  }

  toggleUserStatus(userId: string, isActive: boolean): Observable<Result<boolean>> {
    return this.api.put<Result<boolean>>(`/v1/admin/users/${userId}/status`, { isActive });
  }

  /** حذف نرم کاربر */
  deleteUser(userId: string): Observable<Result<boolean>> {
    return this.api.delete<Result<boolean>>(`/v1/admin/users/${userId}`);
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

  updateSeller(sellerId: string, data: CreateSellerData): Observable<Result<boolean>> {
    return this.api.put<Result<boolean>>(`/admin/sellers/${sellerId}`, data);
  }

  getSellerOrders(sellerId: string, page = 1, pageSize = 10): Observable<Result<PagedList<AdminSellerOrder>>> {
    return this.api.get<Result<PagedList<AdminSellerOrder>>>(`/admin/sellers/${sellerId}/orders?page=${page}&pageSize=${pageSize}`);
  }

  getSellerProducts(sellerId: string, page = 1, pageSize = 20): Observable<Result<PagedList<AdminProduct>>> {
    return this.api.get<Result<PagedList<AdminProduct>>>(`/admin/sellers/${sellerId}/products?page=${page}&pageSize=${pageSize}`);
  }

  getSellerReport(sellerId: string): Observable<Result<SellerReport>> {
    return this.api.get<Result<SellerReport>>(`/admin/sellers/${sellerId}/reports`);
  }

  uploadSellerDocument(sellerId: string, file: File, documentType: string): Observable<Result<string>> {
    const form = new FormData();
    form.append('file', file, file.name);
    form.append('documentType', documentType);
    return this.api.post<Result<string>>(`/admin/sellers/${sellerId}/documents`, form);
  }

  verifySellerDocument(documentId: string, note?: string): Observable<Result<boolean>> {
    return this.api.put<Result<boolean>>(`/admin/sellers/documents/${documentId}/verify`, { note });
  }

  rejectSellerDocument(documentId: string, note?: string): Observable<Result<boolean>> {
    return this.api.put<Result<boolean>>(`/admin/sellers/documents/${documentId}/reject`, { note });
  }

  // ─── Supplier Management (تأمین‌کنندگان) ───────────────────────

  /** فهرست تأمین‌کنندگان */
  getSuppliers(): Observable<Result<AdminSupplier[]>> {
    return this.api.get<Result<AdminSupplier[]>>('/v1/suppliers');
  }

  /** ایجاد تأمین‌کننده */
  createSupplier(data: CreateSupplierData): Observable<Result<string>> {
    return this.api.post<Result<string>>('/v1/suppliers', data);
  }

  /** ویرایش تأمین‌کننده */
  updateSupplier(id: string, data: CreateSupplierData): Observable<Result<boolean>> {
    return this.api.put<Result<boolean>>(`/v1/suppliers/${id}`, { ...data, id });
  }

  /** حذف نرم تأمین‌کننده */
  deleteSupplier(supplierId: string): Observable<Result<boolean>> {
    return this.api.delete<Result<boolean>>(`/v1/suppliers/${supplierId}`);
  }

  // ─── Agent Management (کارپخش‌ها) ─────────────────────────────

  /** فهرست کارپخش‌ها */
  getAgents(): Observable<Result<AdminAgent[]>> {
    return this.api.get<Result<AdminAgent[]>>('/v1/agents');
  }

  /** ایجاد کارپخش */
  createAgent(data: CreateAgentData): Observable<Result<string>> {
    return this.api.post<Result<string>>('/v1/agents', data);
  }

  /** ویرایش کارپخش */
  updateAgent(id: string, data: CreateAgentData): Observable<Result<boolean>> {
    return this.api.put<Result<boolean>>(`/v1/agents/${id}`, { ...data, id });
  }

  /** حذف نرم کارپخش */
  deleteAgent(agentId: string): Observable<Result<boolean>> {
    return this.api.delete<Result<boolean>>(`/v1/agents/${agentId}`);
  }

  /** دریافت داده‌های داشبورد مدیریت */
  getDashboard(): Observable<Result<AdminDashboardData>> {
    return this.api.get<Result<AdminDashboardData>>('/v1/admin/dashboard');
  }

  /** گزارش فروش روزانه */
  getDailyReport(date: string): Observable<Result<SalesReport>> {
    return this.api.get<Result<SalesReport>>(`/v1/admin/reports/daily${buildQueryString({ date })}`);
  }

  /** گزارش فروش ماهانه */
  getMonthlyReport(month: string): Observable<Result<SalesReport>> {
    return this.api.get<Result<SalesReport>>(`/v1/admin/reports/monthly${buildQueryString({ month })}`);
  }

  /** تأیید محصول توسط مدیر */
  approveProduct(productId: string): Observable<Result<boolean>> {
    return this.api.post<Result<boolean>>(`/v1/products/${productId}/approve`, {});
  }

  /** انتشار محصول تأییدشده */
  publishProduct(productId: string): Observable<Result<boolean>> {
    return this.api.post<Result<boolean>>(`/v1/products/${productId}/publish`, {});
  }

  /** حذف نرم محصول */
  deleteProduct(productId: string): Observable<Result<boolean>> {
    return this.api.delete<Result<boolean>>(`/v1/products/${productId}`);
  }

  /** جزئیات محصول برای مودال ویرایش مدیر (همه وضعیت‌ها) */
  getAdminProductDetail(productId: string): Observable<Result<AdminProductDetail>> {
    return this.api.get<Result<AdminProductDetail>>(`/admin/products/${productId}`);
  }

  /** ویرایش محصول توسط مدیر (همان PUT /v1/products/{id} که نقش Admin را می‌پذیرد) */
  updateProduct(productId: string, data: Record<string, unknown>): Observable<Result<boolean>> {
    return this.api.put<Result<boolean>>(`/v1/products/${productId}`, data);
  }

  /** افزایش سریع موجودی (تعداد مثبت = افزایش، منفی = کاهش) */
  restockProduct(productId: string, quantity: number, variationId?: string | null): Observable<Result<number>> {
    return this.api.post<Result<number>>(`/admin/products/${productId}/restock`, {
      quantity,
      variationId: variationId ?? null
    });
  }

  /** تغییر وضعیت انتشار گروهی محصولات (TASK-BE-ADMIN-NEW-ENDPOINTS) */
  bulkUpdateProductStatus(productIds: string[], status: string): Observable<Result<Array<{ productId: string; success: boolean; error?: string }>>> {
    return this.api.post<Result<Array<{ productId: string; success: boolean; error?: string }>>>(
      `/admin/products/bulk`,
      { productIds, status }
    );
  }
}
