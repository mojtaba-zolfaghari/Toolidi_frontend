import { Component, OnInit } from '@angular/core';
import { SeoService } from '../../core/services/seo.service';
import { Router } from '@angular/router';

import {
  Cart,
  CartItem,
  CartService,
  GuestCartItem
} from '../../core/services/api/cart.service';
import { AuthStateService } from '../../core/services/auth-state.service';

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
  minimumOrderAmount?: number;
  minimumOrderQuantity?: number;
  items: CartItem[];
  subtotal: number;
  itemCount: number;
}

/** آیتم سبد مهمان — هم شکل CartItem برای استفاده‌ی مشترک در قالب */
export interface GuestCartDisplayItem {
  id: string;
  productVariationId: string;
  productName: string;
  variationName: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  imageUrl?: string;
  sellerId: string;
  sellerName: string;
  sellerCity: string;
  sellerProvince: string;
  sellerRating: number;
  cityDeliveryDays: number;
  nationwideDeliveryDays: number;
  categoryName?: string;
}

/**
 * صفحه سبد خرید؛ از سبد کاربر لاگین‌شده (API) یا سبد مهمان (localStorage)
 * تغذیه می‌شود و آیتم‌ها را بر اساس فروشنده گروه می‌کند.
 */
@Component({
  selector: 'app-cart',
  templateUrl: './cart.component.html',
  styleUrls: ['./cart.component.scss']
})
export class CartComponent implements OnInit {
  constructor(
    private readonly cartService: CartService,
    private readonly authState: AuthStateService,
    private readonly router: Router,
    private readonly seo: SeoService
  ) {}

  cart: Cart | null = null;
  loading = true;
  errorMessage = '';

  /** کاربر لاگین‌شده؟ */
  isLoggedIn = false;

  /** حالت مهمان — سبد از localStorage می‌آید */
  isGuest = false;
  guestItems: GuestCartDisplayItem[] = [];

  /** گروه‌های فروشنده */
  sellerGroups: SellerGroup[] = [];

  /** آیا سبد در حال به‌روزرسانی است */
  updating = false;

  ngOnInit(): void {
    this.seo.setPage({
      title: 'سبد خرید — تولیدی',
      description: 'سبد خرید شما. محصولات را بررسی کنید و سفارش خود را نهایی کنید.',
      url: 'https://toolidi.ir/cart',
      type: 'website',
    });
    this.authState.currentUser$.subscribe((user) => {
      this.isLoggedIn = !!user;
    });
    this.load();
  }

  /** بارگذاری سبد (کاربر یا مهمان) و گروه‌بندی آیتم‌ها */
  load(): void {
    this.loading = true;
    this.errorMessage = '';
    this.isGuest = !this.isLoggedIn;

    if (this.isGuest) {
      const raw = this.cartService.getGuestCart();
      this.guestItems = raw.map((item, index) => this.toDisplayItem(item, index));
      this.cart = null;
      this.groupBySeller();
      this.loading = false;
      return;
    }

    this.cartService.getCart().subscribe({
      next: (result) => {
        this.cart = result.data ?? null;
        this.guestItems = [];
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

  /** تبدیل آیتم مهمان به شکل نمایشی با مقادیر پیش‌فرض */
  private toDisplayItem(item: GuestCartItem, index: number): GuestCartDisplayItem {
    return {
      id: `guest-${index}`,
      productVariationId: item.productVariationId,
      productName: item.name ?? 'محصول',
      variationName: '',
      quantity: item.quantity,
      unitPrice: item.unitPrice ?? 0,
      lineTotal: (item.unitPrice ?? 0) * item.quantity,
      imageUrl: item.imageUrl,
      sellerId: 'guest-seller',
      sellerName: 'سبد شما',
      sellerCity: item.sellerCity ?? '',
      sellerProvince: '',
      sellerRating: 0,
      cityDeliveryDays: item.cityDeliveryDays ?? 0,
      nationwideDeliveryDays: item.nationwideDeliveryDays ?? 0
    };
  }

  /** گروه‌بندی آیتم‌ها بر اساس فروشنده (بر اساس شناسه، نه هویت شیء) */
  private groupBySeller(): void {
    const items: (CartItem | GuestCartDisplayItem)[] = this.isGuest
      ? this.guestItems
      : (this.cart?.items ?? []);

    if (!items.length) {
      this.sellerGroups = [];
      return;
    }

    const groupMap = new Map<string, SellerGroup>();

    for (const item of items) {
      const key = item.sellerId || 'unknown';
      if (!groupMap.has(key)) {
        groupMap.set(key, {
          sellerId: item.sellerId,
          sellerName: item.sellerName || 'فروشنده ناشناخته',
          sellerCity: item.sellerCity || '',
          sellerProvince: (item as CartItem).sellerProvince ?? '',
          sellerRating: item.sellerRating || 0,
          sellerLogoUrl: (item as CartItem).sellerLogoUrl,
          cityDeliveryDays: item.cityDeliveryDays || 1,
          nationwideDeliveryDays: item.nationwideDeliveryDays || 3,
          minimumOrderAmount: (item as CartItem).minimumOrderAmount,
          minimumOrderQuantity: (item as CartItem).minimumOrderQuantity,
          items: [],
          subtotal: 0,
          itemCount: 0
        });
      }
      const group = groupMap.get(key)!;
      group.items.push(item as CartItem);
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
    return this.isGuest ? this.guestItems.length : (this.cart?.items?.length ?? 0);
  }

  /** مبلغ قابل پرداخت */
  get payableTotal(): number {
    if (this.isGuest) {
      return this.guestItems.reduce((sum, item) => sum + item.lineTotal, 0);
    }
    return this.cart?.totalPrice ?? 0;
  }

  /** تغییر تعداد آیتم (کاربر یا مهمان) */
  updateQuantity(itemId: string, quantity: number): void {
    if (quantity < 1 || this.updating) {
      return;
    }
    this.updating = true;
    if (this.isGuest) {
      const item = this.guestItems.find((i) => i.id === itemId);
      if (item) {
        this.cartService.updateGuestItem(item.productVariationId, quantity);
      }
      this.load();
      this.updating = false;
      return;
    }
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

  /** حذف آیتم از سبد (کاربر یا مهمان) */
  removeItem(itemId: string): void {
    if (this.updating) return;
    this.updating = true;
    if (this.isGuest) {
      const item = this.guestItems.find((i) => i.id === itemId);
      if (item) {
        this.cartService.removeGuestItem(item.productVariationId);
      }
      this.load();
      this.updating = false;
      return;
    }
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
    if (this.isGuest) {
      this.updating = true;
      for (const item of group.items) {
        this.cartService.removeGuestItem((item as GuestCartDisplayItem).productVariationId);
      }
      this.load();
      this.updating = false;
      return;
    }
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
    if (this.isGuest) {
      this.cartService.saveGuestCart([]);
      this.load();
      return;
    }
    this.cartService.clearCart().subscribe(() => this.load());
  }

  /** ادامه خرید — به تسویه‌حساب یا ورود */
  proceedToCheckout(): void {
    if (this.isGuest) {
      this.router.navigate(['/auth/login'], { queryParams: { returnUrl: '/checkout' } });
      return;
    }
    this.router.navigate(['/checkout']);
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

  /** بررسی حداقل سفارش برای هر گروه فروشنده */
  getMinimumWarning(group: SellerGroup): string | null {
    if (group.minimumOrderAmount && group.minimumOrderAmount > 0 && group.subtotal < group.minimumOrderAmount) {
      const diff = group.minimumOrderAmount - group.subtotal;
      return `حداقل سفارش از این فروشنده ${this.formatCurrency(group.minimumOrderAmount)} است. ${this.formatCurrency(diff)} دیگر نیاز است.`;
    }
    if (group.minimumOrderQuantity && group.minimumOrderQuantity > 0 && group.itemCount < group.minimumOrderQuantity) {
      const diff = group.minimumOrderQuantity - group.itemCount;
      return `حداقل تعداد سفارش از این فروشنده ${group.minimumOrderQuantity} عدد است. ${diff} عدد دیگر نیاز است.`;
    }
    return null;
  }

  /** آیا تمام گروه‌ها شرط حداقل سفارش را رعایت کرده‌اند */
  get allMinimumsMet(): boolean {
    return this.sellerGroups.every(g => this.getMinimumWarning(g) === null);
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('fa-IR').format(amount) + ' تومان';
  }
}
