import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';

import { ApiService } from '../api.service';
import { Result } from '../../models/api-response.model';
import { ACCESS_TOKEN_KEY } from '../../interceptors/token.interceptor';

/** کلید ذخیره‌سازی سبد مهمان در localStorage */
export const GUEST_CART_KEY = 'guest_cart_items';

/** آیتم سبد مهمان (قبل از ورود) */
export interface GuestCartItem {
  productVariationId: string;
  quantity: number;
  /** اسنپ‌شات نمایشی محصول (برای نمایش سبد مهمان بدون فراخوانی API) */
  name?: string;
  imageUrl?: string;
  unitPrice?: number;
  categoryName?: string;
  sellerCity?: string;
  cityDeliveryDays?: number;
  nationwideDeliveryDays?: number;
  hasDiscount?: boolean;
  discountPercent?: number;
}

/** آیتم سبد خرید */
export interface CartItem {
  id: string;
  productVariationId: string;
  productName: string;
  variationName: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  /** آدرس تصویر محصول */
  imageUrl?: string;
  /** شناسه فروشنده */
  sellerId: string;
  /** نام فروشنده */
  sellerName: string;
  /** شهر فروشنده */
  sellerCity: string;
  /** استان فروشنده */
  sellerProvince: string;
  /** امتیاز فروشنده */
  sellerRating: number;
  /** آدرس لوگوی فروشنده */
  sellerLogoUrl?: string;
  /** زمان تحویل در شهر فروشنده */
  cityDeliveryDays: number;
  /** زمان تحویل سراسری */
  nationwideDeliveryDays: number;
  /** حداقل مبلغ سفارش از این فروشنده (تومان) */
  minimumOrderAmount?: number;
  /** حداقل تعداد سفارش از این فروشنده */
  minimumOrderQuantity?: number;
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
  private readonly countSubject = new BehaviorSubject<number>(0);

  /** تعداد کالاهای فعلی سبد، برای نشان‌دادن در هدر و دکمه شناور. */
  readonly itemCount$ = this.countSubject.asObservable();

  /** ذخیره‌ی آیتم‌های سبد مهمان در localStorage */
  saveGuestCart(items: GuestCartItem[]): void {
    localStorage.setItem(GUEST_CART_KEY, JSON.stringify(items));
  }

  /** خواندن آیتم‌های سبد مهمان از localStorage */
  getGuestCart(): GuestCartItem[] {
    const raw = localStorage.getItem(GUEST_CART_KEY);
    if (!raw) return [];
    try {
      return JSON.parse(raw) as GuestCartItem[];
    } catch {
      return [];
    }
  }

  /** ادغام سبد مهمان با سبد کاربر — درخواست POST به /v1/cart/merge */
  mergeGuestCart(items: GuestCartItem[]): Observable<Result<boolean>> {
    if (!items.length) {
      return of({ isSuccess: true } as Result<boolean>);
    }
    const guestCartItems = items.map((item) => ({
      productVariationId: item.productVariationId,
      quantity: item.quantity
    }));
    return this.api.post<Result<boolean>>('/v1/cart/merge', { guestCartItems }).pipe(
      tap(() => {
        localStorage.removeItem(GUEST_CART_KEY);
      })
    );
  }

  constructor(private readonly api: ApiService) {}

  /** تازه‌سازی شمارنده سبد از backend — برای مهمان از localStorage */
  refreshCount(): void {
    const token = localStorage.getItem(ACCESS_TOKEN_KEY) ?? sessionStorage.getItem(ACCESS_TOKEN_KEY) ?? null;
    if (!token) {
      this.countSubject.next(this.getGuestCart().reduce((total, item) => total + (item.quantity || 0), 0));
      return;
    }
    this.getCart().subscribe({
      next: (result) => this.setCount(result.data?.items ?? []),
      error: () => this.countSubject.next(0)
    });
  }

  private setCount(items: CartItem[]): void {
    this.countSubject.next(items.reduce((total, item) => total + (item.quantity || 0), 0));
  }

  /** دریافت سبد خرید کاربر جاری (در نبود سبد مقدار null برمی‌گردد) */
  getCart(): Observable<Result<Cart | null>> {
    return this.api.get<Result<Cart | null>>('/v1/cart').pipe(
      tap((result) => this.setCount(result.data?.items ?? []))
    );
  }

  /**
   * افزودن آیتم به سبد خرید.
   * بک‌اند دو فیلد جدا می‌گیرد: productVariationId (محصول تنوع‌دار) یا
   * productId (محصول ساده — بک‌اند خودش تنوع پیش‌فرض را می‌سازد/پیدا می‌کند).
   * ارسال شناسه‌ی محصول در فیلد productVariationId باعث خطای VariationNotFound می‌شود.
   */
  addItem(productId: string, variationId?: string, quantity = 1): Observable<Result<string>> {
    const payload: Record<string, unknown> = { quantity };
    if (variationId) {
      payload['productVariationId'] = variationId;
    } else {
      payload['productId'] = productId;
    }
    return this.api.post<Result<string>>('/v1/cart/items', payload).pipe(tap(() => this.refreshCount()));
  }

  /** افزودن آیتم به سبد مهمان (بدون احراز هویت) — با اسنپ‌شات نمایشی محصول */
  addGuestItem(
    productId: string,
    variationId?: string,
    quantity = 1,
    snapshot?: Omit<GuestCartItem, 'productVariationId' | 'quantity'>
  ): void {
    const items = this.getGuestCart();
    const id = variationId ?? productId;
    const index = items.findIndex((item) => item.productVariationId === id);
    if (index >= 0) {
      items[index].quantity += quantity;
    } else {
      items.push({
        productVariationId: id,
        quantity,
        ...snapshot
      });
    }
    this.saveGuestCart(items);
  }

  /** تغییر تعداد یک آیتم سبد مهمان */
  updateGuestItem(productVariationId: string, quantity: number): void {
    const items = this.getGuestCart();
    const index = items.findIndex((item) => item.productVariationId === productVariationId);
    if (index >= 0) {
      if (quantity < 1) {
        items.splice(index, 1);
      } else {
        items[index].quantity = quantity;
      }
      this.saveGuestCart(items);
    }
  }

  /** حذف یک آیتم از سبد مهمان */
  removeGuestItem(productVariationId: string): void {
    this.updateGuestItem(productVariationId, 0);
  }

  /** به‌روزرسانی تعداد یک آیتم سبد */
  updateItem(itemId: string, quantity: number): Observable<Result<boolean>> {
    return this.api.put<Result<boolean>>(`/v1/cart/items/${itemId}`, { quantity }).pipe(tap(() => this.refreshCount()));
  }

  /** حذف یک آیتم از سبد */
  removeItem(itemId: string): Observable<Result<boolean>> {
    return this.api.delete<Result<boolean>>(`/v1/cart/items/${itemId}`).pipe(tap(() => this.refreshCount()));
  }

  /** خالی‌کردن کامل سبد خرید */
  clearCart(): Observable<Result<boolean>> {
    return this.api.delete<Result<boolean>>('/v1/cart/clear').pipe(tap(() => this.countSubject.next(0)));
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
