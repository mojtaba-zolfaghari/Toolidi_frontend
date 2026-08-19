import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { CategoryService, CategoryTreeNode } from '../../core/services/api/category.service';
import { Product, ProductService } from '../../core/services/api/product.service';

/**
 * صفحه فروشگاه؛ لیست محصولات با فیلتر دسته‌بندی، جستجو و صفحه‌بندی.
 */
@Component({
  selector: 'app-shop',
  templateUrl: './shop.component.html',
  styleUrls: ['./shop.component.scss']
})
export class ShopComponent implements OnInit {
  products: Product[] = [];
  categories: CategoryTreeNode[] = [];
  loading = false;

  page = 1;
  pageSize = 20;
  totalPages = 1;
  totalCount = 0;

  categoryId: string | null = null;
  search = '';

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly categoryService: CategoryService,
    private readonly productService: ProductService
  ) {}

  ngOnInit(): void {
    // درخت دسته‌بندی برای سایدبار
    this.categoryService.getCategoryTree().subscribe({
      next: (result) => (this.categories = result.data ?? []),
      error: () => (this.categories = [])
    });

    // خواندن پارامترهای کوئری و بارگذاری محصولات
    this.route.queryParamMap.subscribe((params) => {
      this.categoryId = params.get('categoryId');
      this.search = params.get('search') ?? '';
      this.page = Number(params.get('page') ?? 1) || 1;
      this.loadProducts();
    });
  }

  /** بارگذاری محصولات با فیلترهای فعلی */
  loadProducts(): void {
    this.loading = true;
    this.productService
      .getProducts({
        categoryId: this.categoryId ?? undefined,
        search: this.search || undefined,
        page: this.page,
        pageSize: this.pageSize
      })
      .subscribe({
        next: (result) => {
          const paged = result.data;
          this.products = paged?.items ?? [];
          this.totalCount = paged?.totalCount ?? 0;
          this.totalPages = Math.max(1, Math.ceil((paged?.totalCount ?? 0) / this.pageSize));
          this.loading = false;
        },
        error: () => {
          this.products = [];
          this.loading = false;
        }
      });
  }

  /** انتخاب یک دسته‌بندی */
  selectCategory(id: string | null): void {
    const queryParams = id ? { categoryId: id, page: 1 } : { page: 1 };
    this.router.navigate(['/shop'], { queryParams });
  }

  /** جستجوی محصولات */
  submitSearch(term: string): void {
    this.router.navigate(['/shop'], {
      queryParams: { search: term || null, page: 1 },
      queryParamsHandling: 'merge'
    });
  }

  /** تغییر صفحه */
  onPageChange(page: number): void {
    this.router.navigate([], {
      queryParams: { page },
      queryParamsHandling: 'merge'
    });
  }
}
