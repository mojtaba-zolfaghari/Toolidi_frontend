import { Component, OnInit } from '@angular/core';

import { Category, CategoryService } from '../../core/services/api/category.service';
import { Product, ProductService } from '../../core/services/api/product.service';

/**
 * صفحه اصلی؛ نمایش دسته‌بندی‌ها و لیست محصولات از API.
 */
@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss']
})
export class HomeComponent implements OnInit {
  categories: Category[] = [];
  products: Product[] = [];
  loading = true;

  constructor(
    private readonly categoryService: CategoryService,
    private readonly productService: ProductService
  ) {}

  ngOnInit(): void {
    // دریافت دسته‌بندی‌ها
    this.categoryService.getCategories().subscribe({
      next: (paged) => (this.categories = paged.items ?? []),
      error: () => (this.categories = [])
    });

    // دریافت محصولات (بک‌اند فعلاً فیلتر featured/new/best ندارد؛ همه محصولات نمایش داده می‌شود)
    this.productService.getProducts({ page: 1, pageSize: 20 }).subscribe({
      next: (result) => {
        this.products = result.data?.items ?? [];
        this.loading = false;
      },
      error: () => {
        this.products = [];
        this.loading = false;
      }
    });
  }
}
