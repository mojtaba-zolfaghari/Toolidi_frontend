import { ChangeDetectionStrategy, Component, Input } from '@angular/core';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { Product } from '../../../core/services/api/product.service';
import { CartService } from '../../../core/services/api/cart.service';
import { AuthStateService } from '../../../core/services/auth-state.service';
import { CartButtonState } from '../add-to-cart-button/add-to-cart-button.component';

/**
 * کارت محصول؛ نمایش تصویر، نام، قیمت و امتیاز با دکمه افزودن به سبد.
 * دکمه دارای انیمیشن ripple، spinner و checkmark است.
 */
@Component({
    selector: 'app-product-card',
    templateUrl: './product-card.component.html',
    styleUrls: ['./product-card.component.scss'],
    // OnPush: کارت‌ها فقط با تغییر ورودی ورِندر می‌شوند؛ مهم برای گرید‌های فروشگاه/صفحه اصلی.
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: false
})
export class ProductCardComponent {
  @Input() product!: Product;

  /** وضعیت دکمه افزودن به سبد */
  cartState: CartButtonState = 'idle';

  /** srcset با پشتیبانی WebP */
  get imageSrcset(): string {
    const base = this.primaryImageUrl;
    if (!base) return '';
    const webp = base.replace(/\.(jpg|jpeg|png|webp)$/i, '.webp');
    return `${base} 1x, ${webp} 1x`;
  }

  constructor(
    private readonly router: Router,
    private readonly cartService: CartService,
    private readonly authState: AuthStateService
  ) {}

  /** تصویر اصلی محصول با پشتیبانی از هر دو قرارداد قدیمی و جدید API. */
  get primaryImageUrl(): string {
    const primary = this.product.images?.find((image) => image.isPrimary) ?? this.product.images?.[0];
    return primary?.imageUrl ?? this.product.imageUrl ?? '';
  }

  /** درصد تخفیف معتبر برای نمایش کارت */
  get discountPercent(): number {
    if (this.product.discountPercent && this.product.discountPercent > 0) {
      return this.product.discountPercent;
    }
    if (this.product.comparePrice && this.product.comparePrice > this.product.unitPrice) {
      return Math.round((1 - this.product.unitPrice / this.product.comparePrice) * 100);
    }
    return 0;
  }

  /** مبلغ صرفه‌جویی معتبر برای نمایش کارت */
  get discountAmount(): number {
    if (this.product.discountAmount && this.product.discountAmount > 0) {
      return this.product.discountAmount;
    }
    return this.product.comparePrice && this.product.comparePrice > this.product.unitPrice
      ? this.product.comparePrice - this.product.unitPrice
      : 0;
  }

  /** شهر مبدا برای نمایش؛ مقدارهای خالی یا خراب (فقط علامت سؤال) به «نامشخص» تبدیل می‌شوند */
  get sellerCityDisplay(): string {
    const city = this.product.sellerCity?.trim() ?? '';
    if (!city || /^[?؟]+$/.test(city)) {
      return 'نامشخص';
    }
    return city;
  }

  /** آیا حفاظت بازگشت وجه روی این محصول فعال است (تأمین‌کننده یا فروشنده تایید شده یا ضمانت پلتفرم). */
  get isRefundCovered(): boolean {
    const e = this.product.refundEligibility;
    if (!e) return false;
    return !!(e.supplierVerified || e.sellerVerified || e.platformGuarantee);
  }

  /** هدایت به صفحه جزئیات محصول */
  openDetail(): void {
    this.router.navigate(['/product', this.product.id]);
  }

  /** افزودن محصول به سبد خرید با انیمیشن */
  async addToCart(): Promise<void> {
    if (this.cartState !== 'idle') {
      return;
    }
    this.cartState = 'adding';

    const user = await firstValueFrom(this.authState.currentUser$);
    if (user) {
      // کاربر وارد شده — مستقیم به API
      this.cartService.addItem(this.product.id, undefined, 1).subscribe({
        next: () => {
          this.cartState = 'success';
          setTimeout(() => { this.cartState = 'idle'; }, 1500);
        },
        error: () => { this.cartState = 'idle'; }
      });
    } else {
      // کاربر مهمان — ذخیره در localStorage با اسنپ‌شات نمایشی
      this.cartService.addGuestItem(this.product.id, undefined, 1, {
        name: this.product.name,
        imageUrl: this.product.imageUrl ?? this.product.images?.find((image) => image.isPrimary)?.imageUrl,
        unitPrice: this.product.unitPrice,
        categoryName: this.product.categoryName,
        sellerCity: this.product.sellerCity,
        cityDeliveryDays: this.product.cityDeliveryDays,
        nationwideDeliveryDays: this.product.nationwideDeliveryDays,
        hasDiscount: this.product.hasDiscount,
        discountPercent: this.product.discountPercent
      });
      this.cartState = 'success';
      // به‌روزرسانی شمارنده سبد مهمان
      const count = this.cartService.getGuestCart().reduce((t, i) => t + i.quantity, 0);
      setTimeout(() => { this.cartState = 'idle'; }, 1500);
    }
  }
}
