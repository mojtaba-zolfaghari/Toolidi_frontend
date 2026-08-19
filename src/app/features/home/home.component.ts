import { Component, OnInit } from '@angular/core';

import { Category, CategoryService } from '../../core/services/api/category.service';
import { Product, ProductService } from '../../core/services/api/product.service';

/** صفحه اصلی برندمحور؛ نمایش معرفی، مزایا، دسته‌بندی‌ها و محصولات منتخب */
@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {
  categories: Category[] = [];
  products: Product[] = [];
  featuredProducts: Product[] = [];
  loading = true;

  constructor(
    private readonly categoryService: CategoryService,
    private readonly productService: ProductService
  ) {}

  ngOnInit(): void {
    // همان درخواست قبلی دسته‌بندی‌ها
    this.categoryService.getCategories().subscribe({
      next: (paged) => (this.categories = paged.items ?? []),
      error: () => (this.categories = [])
    });

    // همان درخواست قبلی محصولات؛ انتخاب محصولات منتخب فقط در لایه نمایش انجام می‌شود.
    this.productService.getProducts({ page: 1, pageSize: 20 }).subscribe({
      next: (result) => {
        this.products = result.data?.items ?? [];
        this.featuredProducts = this.products.filter((product) => product.isFeatured || product.isNewArrival);
        this.loading = false;
      },
      error: () => {
        this.products = [];
        this.featuredProducts = [];
        this.loading = false;
      }
    });
  }
}
