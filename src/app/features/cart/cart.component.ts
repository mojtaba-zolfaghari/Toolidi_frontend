import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

import { Cart, CartService } from '../../core/services/api/cart.service';

/**
 * صفحه سبد خرید؛ نمایش آیتم‌ها، تغییر تعداد، حذف و اعمال تخفیف.
 */
@Component({
  selector: 'app-cart',
  templateUrl: './cart.component.html'
})
export class CartComponent implements OnInit {
  cart: Cart | null = null;
  loading = true;
  errorMessage = '';

  constructor(
    private readonly cartService: CartService,
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    this.load();
  }

  /** بارگذاری سبد خرید */
  load(): void {
    this.loading = true;
    this.cartService.getCart().subscribe({
      next: (result) => {
        this.cart = result.data ?? null;
        this.loading = false;
      },
      error: () => {
        this.cart = null;
        this.loading = false;
      }
    });
  }

  /** تغییر تعداد آیتم */
  updateQuantity(itemId: string, quantity: number): void {
    if (quantity < 1) {
      return;
    }
    this.cartService.updateItem(itemId, quantity).subscribe(() => this.load());
  }

  /** حذف آیتم از سبد */
  removeItem(itemId: string): void {
    this.cartService.removeItem(itemId).subscribe(() => this.load());
  }

  /** خالی‌کردن سبد */
  clearCart(): void {
    this.cartService.clearCart().subscribe(() => this.load());
  }

  /** اعمال کد تخفیف */
  applyDiscount(code: string): void {
    const trimmed = (code ?? '').trim();
    if (!trimmed) {
      return;
    }
    this.errorMessage = '';
    this.cartService.applyDiscount(trimmed).subscribe({
      next: () => this.load(),
      error: (err: Error) => (this.errorMessage = err?.message ?? 'کد تخفیف نامعتبر است.')
    });
  }
}
