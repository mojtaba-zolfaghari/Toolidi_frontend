import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

import { ApiService } from '../api.service';
import { Result } from '../../models/api-response.model';

/** آیتم سبد خرید */
export interface CartItem {
  id: string;
  productVariationId: string;
  productName: string;
  variationName: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
}

/** سبد خرید کاربر جاری */
export interface Cart {
  id: string;
  items: CartItem[];
  subtotal: number;
  discountAmount: number;
  totalPrice: number;
  discountCode?: string;
}

/**
 * سرویس سبد خرید؛ مدیریت آیتم‌ها، تخفیف و تسویه‌ی سبد.
 * تمام مسیرها نیازمند احراز هویت هستند.
 */
@Injectable({ providedIn: 'root' })
export class CartService {
  constructor(private readonly api: ApiService) {}

  /** دریافت سبد خرید کاربر جاری (در نبود سبد مقدار null برمی‌گردد) */
  getCart(): Observable<Result<Cart | null>> {
    return this.api.get<Result<Cart | null>>('/v1/cart');
  }

  /**
   * افزودن آیتم به سبد خرید.
   * بک‌اند شناسه‌ی «تنوع محصول» (productVariationId) دریافت می‌کند؛
   * در صورت نبود تنوع، شناسه‌ی محصول به عنوان تنوع در نظر گرفته می‌شود.
   */
  addItem(productId: string, variationId?: string, quantity = 1): Observable<Result<string>> {
    return this.api.post<Result<string>>('/v1/cart/items', {
      productVariationId: variationId ?? productId,
      quantity
    });
  }

  /** به‌روزرسانی تعداد یک آیتم سبد */
  updateItem(itemId: string, quantity: number): Observable<Result<boolean>> {
    return this.api.put<Result<boolean>>(`/v1/cart/items/${itemId}`, { quantity });
  }

  /** حذف یک آیتم از سبد */
  removeItem(itemId: string): Observable<Result<boolean>> {
    return this.api.delete<Result<boolean>>(`/v1/cart/items/${itemId}`);
  }

  /** خالی‌کردن کامل سبد خرید */
  clearCart(): Observable<Result<boolean>> {
    return this.api.delete<Result<boolean>>('/v1/cart/clear');
  }

  /** اعمال کد تخفیف روی سبد */
  applyDiscount(couponCode: string): Observable<Result<Cart>> {
    return this.api.post<Result<Cart>>('/v1/cart/apply-discount', { code: couponCode });
  }

  /** حذف کد تخفیف از سبد */
  removeDiscount(): Observable<Result<boolean>> {
    return this.api.delete<Result<boolean>>('/v1/cart/remove-discount');
  }
}
