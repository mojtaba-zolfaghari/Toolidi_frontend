import { Component, Input } from '@angular/core';
import { Router } from '@angular/router';

import { Product } from '../../../core/services/api/product.service';
import { CartService } from '../../../core/services/api/cart.service';

/**
 * کارت محصول؛ نمایش تصویر، نام، قیمت و امتیاز با دکمه افزودن به سبد.
 */
@Component({
  selector: 'app-product-card',
  templateUrl: './product-card.component.html'
})
export class ProductCardComponent {
  @Input() product!: Product;

  constructor(
    private readonly router: Router,
    private readonly cartService: CartService
  ) {}

  /** هدایت به صفحه جزئیات محصول */
  openDetail(): void {
    this.router.navigate(['/product', this.product.id]);
  }

  /** افزودن محصول به سبد خرید */
  addToCart(): void {
    this.cartService.addItem(this.product.id, undefined, 1).subscribe({
      next: () => this.router.navigate(['/cart']),
      error: () => {
        /* اینترسپتور توکن در صورت 401 کاربر را به صفحه ورود می‌برد */
      }
    });
  }
}
