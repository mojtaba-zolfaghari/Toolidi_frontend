import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { slideUp } from '../../shared/animations';
import { CategoryService, CategoryTreeNode } from '../../core/services/api/category.service';
import { Product, ProductService } from '../../core/services/api/product.service';

/** گزینه‌های مرتب‌سازی محصولات */
export type SortOption = 'newest' | 'price-asc' | 'price-desc' | 'best';

/**
 * صفحه فروشگاه؛ لیست محصولات با درخت دسته‌بندی، جستجو، فیلتر قیمت،
 * مرتب‌سازی و صفحه‌بندی کامل.
 */
@Component({
  selector: 'app-shop',
  templateUrl: './shop.component.html',
  styleUrls: ['./shop.component.scss'],
  animations: [slideUp]
})
export class ShopComponent implements OnInit {
  products: Product[] = [];
  categories: CategoryTreeNode[] = [];
  loading = false;

  page = 1;
  pageSize = 12;
  totalPages = 1;
  totalCount = 0;

  categoryId: string | null = null;
  search = '';
  sort: SortOption = 'newest';
  minPrice: number | null = null;
  maxPrice: number | null = null;

  /** مقدار لحظه‌ای نوارهای قیمت (پیش از اعمال) */
  priceMin = 0;
  priceMax = 50_000_000;

  /** بیشینه‌ی نوار قیمت (تومان) */
  readonly priceCap = 50_000_000;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly categoryService: CategoryService,
    private readonly productService: ProductService
  ) {}

  ngOnInit(): void {
    this.categoryService.getCategoryTree().subscribe({
      next: (result) => (this.categories = result.data ?? []),
      error: () => (this.categories = [])
    });

    this.route.queryParamMap.subscribe((params) => {
      this.categoryId = params.get('categoryId');
      this.search = params.get('search') ?? '';
      this.page = Number(params.get('page') ?? 1) || 1;
      this.sort = (params.get('sort') as SortOption) || 'newest';
      const min = Number(params.get('minPrice'));
      const max = Number(params.get('maxPrice'));
      this.minPrice = params.get('minPrice') && Number.isFinite(min) ? min : null;
      this.maxPrice = params.get('maxPrice') && Number.isFinite(max) ? max : null;
      this.priceMin = this.minPrice ?? 0;
      this.priceMax = this.maxPrice ?? this.priceCap;
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
        isBestSeller: this.sort === 'best' ? true : undefined,
        page: this.page,
        pageSize: this.pageSize
      })
      .subscribe({
        next: (result) => {
          const paged = result.data;
          this.products = this.applyClientFilters(paged?.items ?? []);
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

  /** اعمال فیلتر قیمت و مرتب‌سازی در سمت کلاینت (روی صفحه‌ی جاری) */
  private applyClientFilters(items: Product[]): Product[] {
    let result = items.filter((product) => {
      if (this.minPrice !== null && product.unitPrice < this.minPrice) {
        return false;
      }
      if (this.maxPrice !== null && product.unitPrice > this.maxPrice) {
        return false;
      }
      return true;
    });

    if (this.sort === 'price-asc') {
      result = [...result].sort((a, b) => a.unitPrice - b.unitPrice);
    } else if (this.sort === 'price-desc') {
      result = [...result].sort((a, b) => b.unitPrice - a.unitPrice);
    }

    return result;
  }

  /** انتخاب یک دسته‌بندی */
  selectCategory(id: string | null): void {
    this.navigate({ categoryId: id || null, page: 1 });
  }

  /** جستجوی محصولات */
  submitSearch(term: string): void {
    this.navigate({ search: term || null, page: 1 });
  }

  /** تغییر مرتب‌سازی */
  changeSort(sort: SortOption): void {
    this.navigate({ sort, page: 1 });
  }

  /** اعمال فیلتر قیمت از نوارها */
  applyPrice(): void {
    const min = this.priceMin > 0 ? this.priceMin : null;
    const max = this.priceMax < this.priceCap ? this.priceMax : null;
    this.navigate({ minPrice: min, maxPrice: max, page: 1 });
  }

  /** پاک‌کردن همه فیلترها */
  clearFilters(): void {
    this.navigate({
      categoryId: null,
      search: null,
      sort: null,
      minPrice: null,
      maxPrice: null,
      page: 1
    });
  }

  /** تغییر صفحه */
  onPageChange(page: number): void {
    this.navigate({ page });
  }

  /** نمایش عنوان دسته‌ی انتخاب‌شده */
  get activeCategoryName(): string {
    const found = this.findCategory(this.categories, this.categoryId);
    return found?.name ?? '';
  }

  private findCategory(
    nodes: CategoryTreeNode[],
    id: string | null
  ): CategoryTreeNode | null {
    if (!id) {
      return null;
    }
    for (const node of nodes) {
      if (node.id === id) {
        return node;
      }
      const child = this.findCategory(node.children ?? [], id);
      if (child) {
        return child;
      }
    }
    return null;
  }

  /** ناوبری با ادغام پارامترهای کوئری */
  private navigate(params: Record<string, string | number | null>): void {
    this.router.navigate(['/shop'], {
      queryParams: params,
      queryParamsHandling: 'merge'
    });
  }
}
