import { Component, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { debounceTime, takeUntil } from 'rxjs/operators';

import { slideUp } from '../../shared/animations';
import { CategoryService, CategoryTreeNode } from '../../core/services/api/category.service';
import { Product, ProductService } from '../../core/services/api/product.service';
import { SeoService } from '../../core/services/seo.service';

/**
 * گزینه‌های مرتب‌سازی — مقادیر دقیقاً همان چیزی هستند که بک‌اند در
 * ApplySorting می‌پذیرد (SortBy)؛ فیلتر و مرتب‌سازی سمت سرور انجام می‌شود
 * تا شمارش صفحات و ترتیب با آنچه کاربر می‌بیند یکی باشد.
 */
export type SortOption = 'newest' | 'priceasc' | 'pricedesc' | 'bestselling' | 'rating';

/** برچسب فارسی گزینه‌های مرتب‌سازی */
export const SORT_LABELS: Record<SortOption, string> = {
  newest: 'جدیدترین',
  priceasc: 'ارزان‌ترین',
  pricedesc: 'گران‌ترین',
  bestselling: 'پرفروش‌ترین',
  rating: 'بیشترین امتیاز'
};

/** مدل فیلترهای فروشگاه — منبع یکپارچه‌ی حقیقت که مستقیم به URL نگاشت می‌شود */
interface ShopFilters {
  categoryId: string | null;
  city: string | null;
  search: string;
  sort: SortOption;
  minPrice: number | null;
  maxPrice: number | null;
  page: number;
}

const DEFAULT_FILTERS: ShopFilters = {
  categoryId: null,
  city: null,
  search: '',
  sort: 'newest',
  minPrice: null,
  maxPrice: null,
  page: 1
};

/**
 * صفحه فروشگاه؛ لیست محصولات با درخت دسته‌بندی، جستجو، فیلتر قیمت،
 * مرتب‌سازی و صفحه‌بندی. همه‌ی فیلترها سمت سرور اعمال می‌شوند و در
 * query string منعکس می‌شوند (لینک‌پذیری + بازگشت با دکمه‌ی مرورگر).
 */
@Component({
  selector: 'app-shop',
  templateUrl: './shop.component.html',
  styleUrls: ['./shop.component.scss'],
  animations: [slideUp]
})
export class ShopComponent implements OnInit, OnDestroy {
  products: Product[] = [];
  categories: CategoryTreeNode[] = [];
  cities: { city: string; productCount: number }[] = [];

  /** بارگذاری اولیه (اسکلت) در برابر به‌روزرسانی پس‌زمینه‌ای */
  initialLoading = true;
  loading = false;
  loadError = false;
  private requestVersion = 0;

  pageSize = 12;
  totalPages = 1;
  totalCount = 0;

  readonly sortOptions = Object.entries(SORT_LABELS) as [SortOption, string][];
  readonly priceCap = 50_000_000;

  /** مقادیر لحظه‌ای نوارهای قیمت (پیش از زدن اعمال) */
  priceMin = 0;
  priceMax = 50_000_000;

  mobileFilterOpen = false;

  private searchSubject = new Subject<string>();
  private readonly destroy$ = new Subject<void>();

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly categoryService: CategoryService,
    private readonly productService: ProductService,
    private readonly seo: SeoService
  ) {}

  ngOnInit(): void {
    this.categoryService.getCategoryTree()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result) => (this.categories = result.data ?? []),
        error: () => (this.categories = [])
      });
    this.productService.getProductCities()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result) => (this.cities = result.data ?? []),
        error: () => (this.cities = [])
      });

    // جستجوی زنده با تاخیر — URL بعد از مکث کاربر به‌روز می‌شود
    this.searchSubject
      .pipe(debounceTime(450), takeUntil(this.destroy$))
      .subscribe((term) => {
        this.patchFilters({ search: term.trim(), page: 1 });
      });

    this.route.queryParamMap
      .pipe(takeUntil(this.destroy$))
      .subscribe((params) => {
        this.filters = {
          categoryId: params.get('categoryId'),
          city: params.get('city'),
          search: params.get('search') ?? '',
          sort: (params.get('sort') as SortOption) in SORT_LABELS
            ? (params.get('sort') as SortOption)
            : 'newest',
          minPrice: parseNumber(params.get('minPrice')),
          maxPrice: parseNumber(params.get('maxPrice')),
          page: Math.max(1, Number(params.get('page')) || 1)
        };
        this.priceMin = this.filters.minPrice ?? 0;
        this.priceMax = this.filters.maxPrice ?? this.priceCap;
        this.loadProducts();
        this.applySeo();
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  /** فیلترهای جاری — تنها منبع حقیقت برای نمایش و درخواست */
  filters: ShopFilters = { ...DEFAULT_FILTERS };

  // ─── نمایش ───

  get activeCategoryName(): string {
    return this.findCategory(this.categories, this.filters.categoryId)?.name ?? '';
  }

  get activeCityName(): string {
    return this.filters.city ?? '';
  }

  get sortLabel(): string {
    return SORT_LABELS[this.filters.sort];
  }

  /** عنوان صفحه بر اساس فیلتر فعال */
  get pageTitle(): string {
    return this.activeCategoryName || (this.activeCityName ? `محصولات ${this.activeCityName}` : 'فروشگاه');
  }

  /** چیپ‌های فیلتر فعال برای نوار بالای نتایج */
  get activeFilterChips(): { key: string; label: string; clear: () => void }[] {
    const chips: { key: string; label: string; clear: () => void }[] = [];
    if (this.activeCategoryName) {
      chips.push({ key: 'categoryId', label: this.activeCategoryName, clear: () => this.selectCategory(null) });
    }
    if (this.filters.city) {
      chips.push({ key: 'city', label: `شهر: ${this.filters.city}`, clear: () => this.selectCity(null) });
    }
    if (this.filters.search) {
      chips.push({ key: 'search', label: `«${this.filters.search}»`, clear: () => this.clearSearch() });
    }
    if (this.filters.minPrice !== null || this.filters.maxPrice !== null) {
      const min = this.filters.minPrice ?? 0;
      const max = this.filters.maxPrice ?? this.priceCap;
      chips.push({
        key: 'price',
        label: `${min.toLocaleString('fa-IR')} تا ${max.toLocaleString('fa-IR')} تومان`,
        clear: () => this.clearPrice()
      });
    }
    return chips;
  }

  // ─── رویدادها ───

  selectCategory(id: string | null): void {
    this.patchFilters({ categoryId: id, page: 1 });
  }

  selectCity(city: string | null): void {
    this.patchFilters({ city: city, page: 1 });
  }

  /** تایپ زنده‌ی جستجو (با debounce به URL می‌رود) */
  onSearchInput(term: string): void {
    this.searchSubject.next(term);
  }

  /** جستجوی فوری (دکمه یا Enter) */
  submitSearch(term: string): void {
    this.patchFilters({ search: (term ?? '').trim(), page: 1 });
  }

  clearSearch(): void {
    this.patchFilters({ search: '', page: 1 });
  }

  changeSort(sort: string): void {
    if (sort in SORT_LABELS) {
      this.patchFilters({ sort: sort as SortOption, page: 1 });
    }
  }

  applyPrice(): void {
    this.patchFilters({
      minPrice: this.priceMin > 0 ? this.priceMin : null,
      maxPrice: this.priceMax < this.priceCap ? this.priceMax : null,
      page: 1
    });
  }

  clearPrice(): void {
    this.priceMin = 0;
    this.priceMax = this.priceCap;
    this.patchFilters({ minPrice: null, maxPrice: null, page: 1 });
  }

  clearFilters(): void {
    this.priceMin = 0;
    this.priceMax = this.priceCap;
    this.patchFilters({
      categoryId: null,
      city: null,
      search: '',
      minPrice: null,
      maxPrice: null,
      page: 1
    });
  }

  onPageChange(page: number): void {
    this.patchFilters({ page });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  retry(): void {
    this.loadProducts();
  }

  trackByProductId(_: number, product: Product): string {
    return product.id;
  }

  // ─── هسته ───

  /** به‌روزرسانی فیلترها → بازنویسی URL → queryParamMap خودش loadProducts را صدا می‌زند */
  private patchFilters(patch: Partial<ShopFilters>): void {
    const next: ShopFilters = { ...this.filters, ...patch };
    const queryParams: Record<string, string | number | null> = {
      categoryId: next.categoryId,
      city: next.city,
      search: next.search || null,
      sort: next.sort !== DEFAULT_FILTERS.sort ? next.sort : null,
      minPrice: next.minPrice,
      maxPrice: next.maxPrice,
      page: next.page !== 1 ? next.page : null
    };
    void this.router.navigate([], {
      queryParams,
      queryParamsHandling: '',
      replaceUrl: false
    });
  }

  /** بارگذاری محصولات با فیلترهای فعلی — همه‌ی فیلترها سمت سرور */
  private loadProducts(): void {
    const requestVersion = ++this.requestVersion;
    this.loading = true;
    this.loadError = false;
    this.productService
      .getProducts({
        categoryId: this.filters.categoryId ?? undefined,
        city: this.filters.city || undefined,
        search: this.filters.search || undefined,
        sortBy: this.filters.sort,
        minPrice: this.filters.minPrice ?? undefined,
        maxPrice: this.filters.maxPrice ?? undefined,
        page: this.filters.page,
        pageSize: this.pageSize
      })
      .subscribe({
        next: (result) => {
          if (requestVersion !== this.requestVersion) return;
          const paged = result.data;
          this.products = paged?.items ?? [];
          this.totalCount = paged?.totalCount ?? 0;
          this.totalPages = Math.max(1, Math.ceil(this.totalCount / this.pageSize));
          this.loading = false;
          this.initialLoading = false;
        },
        error: () => {
          if (requestVersion !== this.requestVersion) return;
          this.loading = false;
          this.initialLoading = false;
          this.loadError = true;
        }
      });
  }

  private applySeo(): void {
    const catName = this.activeCategoryName;
    const title = this.filters.search
      ? `نتایج جستجو «${this.filters.search}»`
      : catName
        ? `خرید ${catName}`
        : 'فروشگاه';

    const description = this.filters.search
      ? `نتایج جستجو برای «${this.filters.search}» در فروشگاه تولیدی`
      : catName
        ? `خرید عمده ${catName} با بهترین قیمت از تأمین‌کنندگان معتبر تولیدی`
        : 'فروشگاه محصولات عمده با بهترین قیمت از تأمین‌کنندگان معتبر سراسر ایران';

    this.seo.setPage({
      title,
      description,
      url: 'https://toolidi.ir/shop' + (this.filters.categoryId ? `?categoryId=${this.filters.categoryId}` : ''),
      type: 'website'
    });

    const crumbs = [{ name: 'خانه', url: 'https://toolidi.ir' }];
    crumbs.push({ name: 'فروشگاه', url: 'https://toolidi.ir/shop' });
    if (catName) {
      crumbs.push({ name: catName, url: `https://toolidi.ir/shop?categoryId=${this.filters.categoryId}` });
    }
    this.seo.setJsonLd(this.seo.breadcrumbJsonLd(crumbs));
  }

  private findCategory(nodes: CategoryTreeNode[], id: string | null): CategoryTreeNode | null {
    if (!id) return null;
    for (const node of nodes) {
      if (node.id === id) return node;
      const child = this.findCategory(node.children ?? [], id);
      if (child) return child;
    }
    return null;
  }
}

/** تبدیل امن پارامتر عددی */
function parseNumber(raw: string | null): number | null {
  if (raw === null) return null;
  const value = Number(raw);
  return Number.isFinite(value) ? value : null;
}
