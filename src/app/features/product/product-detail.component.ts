import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { CartService } from '../../core/services/api/cart.service';
import { Product, ProductService } from '../../core/services/api/product.service';

/**
 * صفحه جزئیات محصول؛ دریافت محصول با شناسه یا اسلاگ و افزودن به سبد.
 */
@Component({
  selector: 'app-product-detail',
  templateUrl: './product-detail.component.html'
})
export class ProductDetailComponent implements OnInit {
  product: Product | null = null;
  loading = true;
  errorMessage = '';
  quantity = 1;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly productService: ProductService,
    private readonly cartService: CartService
  ) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe((params) => {
      const id = params.get('id');
      const slug = params.get('slug');
      this.loading = true;
      this.errorMessage = '';

      const request = id
        ? this.productService.getProductById(id)
        : this.productService.getProductBySlug(slug ?? '');

      request.subscribe({
        next: (result) => {
          this.product = result.data ?? null;
          this.loading = false;
        },
        error: (err: Error) => {
          this.errorMessage = err?.message ?? 'محصول یافت نشد.';
          this.loading = false;
        }
      });
    });
  }

  /** کم و زیاد کردن تعداد */
  changeQuantity(delta: number): void {
    this.quantity = Math.max(1, this.quantity + delta);
  }

  /** افزودن محصول به سبد خرید */
  addToCart(): void {
    if (!this.product) {
      return;
    }

    this.cartService.addItem(this.product.id, undefined, this.quantity).subscribe({
      next: () => this.router.navigate(['/cart']),
      error: () => {
        /* اینترسپتور توکن در صورت 401 کاربر را به صفحه ورود می‌برد */
      }
    });
  }
}
