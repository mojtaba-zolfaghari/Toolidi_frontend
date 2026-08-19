import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { ApiService } from '../api.service';
import { PagedList, Result } from '../../models/api-response.model';
import { buildQueryString } from './query.util';

/** تصویر محصول */
export interface ProductImage {
  id: string;
  imageUrl: string;
  altText?: string;
  isPrimary: boolean;
  displayOrder: number;
}

/** تنوع محصول (رنگ/سایز و…) */
export interface ProductVariation {
  id: string;
  sku: string;
  displayName: string;
  priceAdjustment: number;
  stockQuantity: number;
  isDefault: boolean;
  imageUrl?: string;
}

/** مشخصه‌ی فنی محصول */
export interface ProductAttribute {
  id: string;
  name: string;
  value: string;
}

/** درخواست افزودن تصویر محصول (ImageUrl می‌تواند base64 باشد) */
export interface ProductImageRequest {
  imageUrl: string;
  altText?: string;
  displayOrder: number;
  isPrimary: boolean;
}

/** درخواست افزودن/ویرایش مشخصه */
export interface ProductAttributeRequest {
  name: string;
  value: string;
}

/** درخواست افزودن/ویرایش تنوع */
export interface ProductVariationRequest {
  sku: string;
  displayName: string;
  priceAdjustment: number;
  stockQuantity: number;
  isDefault: boolean;
}

/** درخواست اعمال تخفیف روی محصول */
export interface ProductDiscountRequest {
  price: number;
  startDate: string;
  endDate: string;
  variationId?: string;
}

/** محصول (اطلاعات عمومی بازگشتی از API) */
export interface Product {
  id: string;
  categoryId: string;
  brandId?: string;
  name: string;
  sku: string;
  slug: string;
  publishStatus?: string;
  imageUrl?: string;
  shortDescription?: string;
  fullDescription?: string;
  unitPrice: number;
  comparePrice?: number;
  taxRate?: number;
  weight?: number;
  length?: number;
  width?: number;
  height?: number;
  isPhysical: boolean;
  isDigital: boolean;
  isFeatured: boolean;
  isNewArrival: boolean;
  isBestSeller: boolean;
  digitalFileUrl?: string;
  viewCount: number;
  ratingAverage?: number;
  ratingCount: number;
  stockQuantity?: number;
  categoryName?: string;
  images?: ProductImage[];
  variations?: ProductVariation[];
  attributes?: ProductAttribute[];
}

/** داده‌ی ایجاد محصول جدید */
export interface CreateProductData {
  categoryId: string;
  /** در APIهای قدیمی اختیاری است و در نسخه‌های دارای برند ذخیره می‌شود. */
  brandId?: string;
  name: string;
  sku: string;
  shortDescription?: string;
  fullDescription?: string;
  unitPrice: number;
  comparePrice?: number;
  costPrice?: number;
  isTaxable?: boolean;
  taxRate?: number;
  weight?: number;
  length?: number;
  width?: number;
  height?: number;
  isPhysical?: boolean;
  isDigital?: boolean;
  digitalFileUrl?: string;
  metaTitle?: string;
  metaDescription?: string;
  metaKeywords?: string;
  seoCanonicalUrl?: string;
}

/** داده‌ی به‌روزرسانی محصول */
export type UpdateProductData = CreateProductData;

/** پارامترهای فیلتر لیست محصولات */
export interface ProductQueryParams {
  categoryId?: string;
  search?: string;
  page?: number;
  pageSize?: number;
  isFeatured?: boolean;
  isNewArrival?: boolean;
  isBestSeller?: boolean;
}

/**
 * سرویس محصولات؛ دریافت، ایجاد، ویرایش و مدیریت انتشار محصول.
 */
@Injectable({ providedIn: 'root' })
export class ProductService {
  constructor(private readonly api: ApiService) {}

  /** دریافت لیست محصولات با فیلتر و صفحه‌بندی */
  getProducts(params?: ProductQueryParams): Observable<Result<PagedList<Product>>> {
    return this.api.get<Result<PagedList<Product>>>(`/v1/products${buildQueryString(params)}`);
  }

  /** دریافت یک محصول با شناسه */
  getProductById(id: string): Observable<Result<Product>> {
    return this.api.get<Result<Product>>(`/v1/products/${id}`);
  }

  /** دریافت یک محصول با اسلاگ */
  getProductBySlug(slug: string): Observable<Result<Product>> {
    return this.api.get<Result<Product>>(`/v1/products/slug/${slug}`);
  }

  /** ایجاد محصول جدید (نیازمند نقش فروشنده یا مدیر) */
  createProduct(data: CreateProductData): Observable<Result<string>> {
    return this.api.post<Result<string>>('/v1/products', data);
  }

  /** به‌روزرسانی محصول متعلق به فروشنده */
  updateProduct(id: string, data: UpdateProductData): Observable<Result<Product>> {
    return this.api.put<Result<Product>>(`/v1/products/${id}`, data);
  }

  /** حذف (نرم) یک محصول */
  deleteProduct(id: string): Observable<Result<boolean>> {
    return this.api.delete<Result<boolean>>(`/v1/products/${id}`);
  }

  /** تأیید محصول توسط مدیر */
  approveProduct(id: string): Observable<Result<boolean>> {
    return this.api.post<Result<boolean>>(`/v1/products/${id}/approve`, {});
  }

  /** انتشار محصول تأییدشده توسط فروشنده */
  publishProduct(id: string): Observable<Result<boolean>> {
    return this.api.post<Result<boolean>>(`/v1/products/${id}/publish`, {});
  }

  /** افزودن تصویر به محصول */
  uploadImage(productId: string, data: ProductImageRequest): Observable<Result<string>> {
    return this.api.post<Result<string>>(`/v1/products/${productId}/images`, data);
  }

  /** حذف تصویر محصول */
  deleteImage(imageId: string): Observable<Result<boolean>> {
    return this.api.delete<Result<boolean>>(`/v1/products/images/${imageId}`);
  }

  /** افزودن مشخصه به محصول */
  addAttribute(productId: string, data: ProductAttributeRequest): Observable<Result<string>> {
    return this.api.post<Result<string>>(`/v1/products/${productId}/attributes`, data);
  }

  /** ویرایش مشخصه محصول */
  updateAttribute(attributeId: string, data: ProductAttributeRequest): Observable<Result<boolean>> {
    return this.api.put<Result<boolean>>(`/v1/products/attributes/${attributeId}`, data);
  }

  /** حذف مشخصه محصول */
  deleteAttribute(attributeId: string): Observable<Result<boolean>> {
    return this.api.delete<Result<boolean>>(`/v1/products/attributes/${attributeId}`);
  }

  /** افزودن تنوع به محصول */
  addVariation(productId: string, data: ProductVariationRequest): Observable<Result<string>> {
    return this.api.post<Result<string>>(`/v1/products/${productId}/variations`, data);
  }

  /** ویرایش تنوع محصول */
  updateVariation(variationId: string, data: ProductVariationRequest): Observable<Result<boolean>> {
    return this.api.put<Result<boolean>>(`/v1/products/variations/${variationId}`, data);
  }

  /** حذف تنوع محصول */
  deleteVariation(variationId: string): Observable<Result<boolean>> {
    return this.api.delete<Result<boolean>>(`/v1/products/variations/${variationId}`);
  }

  /** اعمال تخفیف روی محصول */
  applyDiscount(productId: string, data: ProductDiscountRequest): Observable<Result<string>> {
    return this.api.post<Result<string>>(`/v1/products/${productId}/discount`, data);
  }

  /** حذف تخفیف محصول */
  removeDiscount(productId: string): Observable<Result<boolean>> {
    return this.api.delete<Result<boolean>>(`/v1/products/${productId}/discount`);
  }
}
