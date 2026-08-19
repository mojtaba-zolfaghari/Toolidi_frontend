import { Component, OnInit } from '@angular/core';

import { slideUp } from '../../shared/animations';
import { Category, CategoryService } from '../../core/services/api/category.service';
import { Product, ProductService } from '../../core/services/api/product.service';

/** صفحه اصلی برندمحور؛ نمایش معرفی، مزایا، دسته‌بندی‌ها و محصولات منتخب */
@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.scss'],
  animations: [slideUp]
})
export class HomeComponent implements OnInit {
  categories: Category[] = [];
  featuredProducts: Product[] = [];
  loading = true;
  categoriesLoading = true;

  constructor(
    private readonly categoryService: CategoryService,
    private readonly productService: ProductService
  ) {}

  ngOnInit(): void {
    this.loadCategories();
    this.loadFeaturedProducts();
  }

  /** دریافت دسته‌بندی‌های فعال */
  private loadCategories(): void {
    this.categoryService.getCategories().subscribe({
      next: (paged) => {
        this.categories = (paged.items ?? []).filter((category) => category.isActive);
        this.categoriesLoading = false;
      },
      error: () => {
        this.categories = [];
        this.categoriesLoading = false;
      }
    });
  }

  /** دریافت فقط محصولات منتخب (isFeatured) */
  private loadFeaturedProducts(): void {
    this.productService.getProducts({ isFeatured: true, page: 1, pageSize: 8 }).subscribe({
      next: (result) => {
        this.featuredProducts = result.data?.items ?? [];
        this.loading = false;
      },
      error: () => {
        this.featuredProducts = [];
        this.loading = false;
      }
    });
  }
}
