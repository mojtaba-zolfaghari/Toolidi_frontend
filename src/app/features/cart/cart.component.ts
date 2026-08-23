import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

import { Cart, CartItem, CartService } from '../../core/services/api/cart.service';

/** گروه آیتم‌های سبد بر اساس فروشنده */
export interface SellerGroup {
  sellerId: string;
  sellerName: string;
  sellerCity: string;
  sellerProvince: string;
  sellerRating: number;
  sellerLogoUrl?: string;
  cityDeliveryDays: number;
  nationwideDeliveryDays: number;
  items: CartItem[];
  subtotal: number;
  itemCount: number;
}

/**
 * صفحه سبد خرید بازطراحی‌شده؛ گروه‌بندی آیتم‌ها بر اساس فروشنده
 * با نمایش زمان تحویل، امتیاز فروشنده و خلاصه سفارش به تفکیک.
 */
@Component({
  selector: 'app-cart',
  templateUrl: './cart.component.html',
  styleUrls: ['./cart.component.scss']
})
export class CartComponent implements OnInit {
  cart: Cart | null = null;
  loading = true;
  errorMessage = '';

  /** گروه‌های فروشنده */
  sellerGroups: SellerGroup[] = [];

  /** آیا سبد در حال به‌روزرسانی است */
  updating = false;

  constructor(
    private readonly cartService: CartService,
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    this.load();
  }

  /** بارگذاری سبد خرید و گروه‌بندی آیتم‌ها */
  load(): void {
    this.loading = true;
    this.cartService.getCart().subscribe({
      next: (result) => {
        this.cart = result.data ?? null;
        this.groupBySeller();
        this.loading = false;
      },
      error: () => {
        this.cart = null;
        this.sellerGroups = [];
        this.loading = false;
      }
    });
  }

  /** گروه‌بندی آیتم‌ها بر اساس فروشنده */
  private groupBySeller(): void {
    if (!this.cart?.items?.length) {
      this.sellerGroups = [];
      return;
    }

    const groupMap = new Map<string, SellerGroup>();

    for (const item of this.cart.items) {
      const key = item.sellerId || 'unknown';
      if (!groupMap.has(key)) {
        groupMap.set(key, {
          sellerId: item.sellerId,
          sellerName: item.sellerName || 'فروشنده ناشناخته',
          sellerCity: item.sellerCity || '',
          sellerProvince: item.sellerProvince || '',
          sellerRating: item.sellerRating || 0,
          sellerLogoUrl: item.sellerLogoUrl,
          cityDeliveryDays: item.cityDeliveryDays || 1,
          nationwideDeliveryDays: item.nationwideDeliveryDays || 3,
          items: [],
          subtotal: 0,
          itemCount: 0
        });
      }
      const group = groupMap.get(key)!;
      group.items.push(item);
      group.subtotal += item.lineTotal;
      group.itemCount += item.quantity;
    }

    this.sellerGroups = Array.from(groupMap.values());
  }

  /** مجموع کل سبد */
  get totalItems(): number {
    return this.sellerGroups.reduce((sum, g) => sum + g.itemCount, 0);
  }

  /** تعداد فروشندگان */
  get sellerCount(): number {
    return this.sellerGroups.length;
  }

  /** تعداد کل آیتم‌ها (برای نمایش) */
  get totalItemCount(): number {
    return this.cart?.items?.length ?? 0;
  }

  /** تغییر تعداد آیتم */
  updateQuantity(itemId: string, quantity: number): void {
    if (quantity < 1 || this.updating) {
      return;
    }
    this.updating = true;
    this.cartService.updateItem(itemId, quantity).subscribe({
      next: () => {
        this.load();
        this.updating = false;
      },
      error: () => {
        this.updating = false;
      }
    });
  }

  /** حذف آیتم از سبد */
  removeItem(itemId: string): void {
    if (this.updating) return;
    this.updating = true;
    this.cartService.removeItem(itemId).subscribe({
      next: () => {
        this.load();
        this.updating = false;
      },
      error: () => {
        this.updating = false;
      }
    });
  }

  /** حذف تمام آیتم‌های یک فروشنده */
  removeSellerGroup(group: SellerGroup): void {
    if (this.updating) return;
    this.updating = true;
    const ids = group.items.map(i => i.id);
    let completed = 0;
    for (const id of ids) {
      this.cartService.removeItem(id).subscribe({
        next: () => {
          completed++;
          if (completed === ids.length) {
            this.load();
            this.updating = false;
          }
        },
        error: () => {
          completed++;
          if (completed === ids.length) {
            this.load();
            this.updating = false;
          }
        }
      });
    }
  }

  /** خالی‌کردن سبد */
  clearCart(): void {
    this.cartService.clearCart().subscribe(() => this.load());
  }

  /** اعمال کد تخفیف */
  applyDiscount(code: string): void {
    const trimmed = (code ?? '').trim();
    if (!trimmed) return;
    this.errorMessage = '';
    this.cartService.applyDiscount(trimmed).subscribe({
      next: () => this.load(),
      error: (err: Error) => (this.errorMessage = err?.message ?? 'کد تخفیف نامعتبر است.')
    });
  }

  /** متن زمان تحویل */
  getDeliveryText(group: SellerGroup): string {
    if (group.cityDeliveryDays <= 0) return 'ارسال فوری';
    const days = group.cityDeliveryDays;
    if (days === 1) return 'تحویل فردا';
    return `تحویل طی ${days} روز`;
  }

  /** ستاره‌های امتیاز */
  getStars(rating: number): number[] {
    return [1, 2, 3, 4, 5];
  }
}
