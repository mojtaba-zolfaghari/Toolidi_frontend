import { Component, OnInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Subject, Subscription, debounceTime, distinctUntilChanged, switchMap, of, catchError } from 'rxjs';
import { ProductService, SearchSuggestions, SearchSuggestionProduct, SearchSuggestionCategory, SearchSuggestionSupplier } from '../../core/services/api/product.service';
import { ApiService } from '../../core/services/api.service';

interface BlogResult {
  id: string;
  title: string;
  slug: string;
  excerpt?: string;
  coverImageUrl?: string;
  publishedAt?: string;
  authorName?: string;
}

@Component({
  selector: 'app-search-page',
  template: `
    <div class="search-page">
      <!-- Header -->
      <div class="search-header">
        <div class="search-header-inner">
          <a routerLink="/" class="search-logo">
            <span class="search-logo-mark">T</span>
            <span>تولیدی</span>
          </a>

          <div class="search-box">
            <svg class="search-box-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z"/>
            </svg>
            <input
              #searchInput
              type="text"
              [(ngModel)]="query"
              (input)="onInput($event)"
              (keydown.enter)="search()"
              placeholder="جستجو کنید..."
              class="search-box-input"
              autofocus
            />
            <button *ngIf="query" type="button" (click)="clearQuery()" class="search-box-clear">✕</button>
            <button type="button" (click)="search()" class="search-box-submit">
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
                <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z"/>
              </svg>
            </button>
          </div>
        </div>
      </div>

      <!-- Tabs -->
      <div class="search-tabs-wrap" *ngIf="query.length >= 2">
        <div class="search-tabs">
          <button
            *ngFor="let tab of tabs"
            type="button"
            [class.active]="activeTab === tab.id"
            (click)="setTab(tab.id)"
            class="search-tab">
            <span class="search-tab-icon">{{ tab.icon }}</span>
            <span>{{ tab.label }}</span>
            <span *ngIf="getTabCount(tab.id) > 0" class="search-tab-count">{{ getTabCount(tab.id) | number:'1.0-0':'fa-IR' }}</span>
          </button>
        </div>
      </div>

      <!-- Results -->
      <div class="search-results-wrap" *ngIf="query.length >= 2">
        <div class="search-results">

          <!-- Loading -->
          <div *ngIf="loading" class="search-loading">
            <div class="search-loading-spinner"></div>
            <span>در حال جستجوی «{{ query }}»...</span>
          </div>

          <!-- PRODUCTS TAB -->
          <div *ngIf="activeTab === 'products' && !loading">
            <div *ngIf="suggestions?.products?.length; else noProducts" class="search-results-grid">
              <a *ngFor="let p of suggestions!.products"
                 [routerLink]="['/product', 'slug', p.slug]"
                 class="search-result-card">
                <div class="search-result-img" *ngIf="p.imageUrl">
                  <img [src]="p.imageUrl" [alt]="p.name" loading="lazy" />
                </div>
                <div *ngIf="!p.imageUrl" class="search-result-img-placeholder">📦</div>
                <div class="search-result-body">
                  <h3 class="search-result-title">{{ p.name }}</h3>
                  <div class="search-result-meta">
                    <span class="search-result-badge">📂 {{ p.categoryName }}</span>
                    <span class="search-result-badge">🏭 {{ p.supplierName }}</span>
                  </div>
                  <div class="search-result-price">{{ p.price | number:'1.0-0':'fa-IR' }} تومان</div>
                </div>
              </a>
            </div>
            <ng-template #noProducts>
              <div class="search-empty-state">
                <span class="search-empty-icon">📦</span>
                <p>محصولی برای «{{ query }}» یافت نشد</p>
              </div>
            </ng-template>
          </div>

          <!-- BLOG TAB -->
          <div *ngIf="activeTab === 'blog' && !loading">
            <div *ngIf="blogResults.length; else noBlog" class="search-results-list">
              <a *ngFor="let b of blogResults"
                 [routerLink]="['/blog', b.slug]"
                 class="search-blog-card">
                <div class="search-blog-img" *ngIf="b.coverImageUrl">
                  <img [src]="b.coverImageUrl" [alt]="b.title" loading="lazy" />
                </div>
                <div class="search-blog-body">
                  <h3 class="search-blog-title">{{ b.title }}</h3>
                  <p *ngIf="b.excerpt" class="search-blog-excerpt">{{ b.excerpt }}</p>
                  <div class="search-blog-meta">
                    <span *ngIf="b.authorName">✍️ {{ b.authorName }}</span>
                    <span *ngIf="b.publishedAt">📅 {{ b.publishedAt }}</span>
                  </div>
                </div>
              </a>
            </div>
            <ng-template #noBlog>
              <div class="search-empty-state">
                <span class="search-empty-icon">📝</span>
                <p>مقاله‌ای برای «{{ query }}» یافت نشد</p>
              </div>
            </ng-template>
          </div>

          <!-- SUPPLIERS TAB -->
          <div *ngIf="activeTab === 'suppliers' && !loading">
            <div *ngIf="suggestions?.suppliers?.length; else noSuppliers" class="search-results-list">
              <a *ngFor="let s of suggestions!.suppliers"
                 [routerLink]="['/shop']"
                 [queryParams]="{ city: s.city }"
                 class="search-supplier-card">
                <div class="search-supplier-avatar">
                  <span>{{ s.companyName.charAt(0) }}</span>
                </div>
                <div class="search-supplier-body">
                  <h3 class="search-supplier-name">{{ s.companyName }}</h3>
                  <div class="search-supplier-meta">
                    <span>📍 {{ s.city }}، {{ s.province }}</span>
                    <span>📦 {{ s.productCount | number:'1.0-0':'fa-IR' }} محصول</span>
                  </div>
                </div>
                <span class="search-supplier-arrow">←</span>
              </a>
            </div>
            <ng-template #noSuppliers>
              <div class="search-empty-state">
                <span class="search-empty-icon">🏭</span>
                <p>تأمین‌کننده‌ای برای «{{ query }}» یافت نشد</p>
              </div>
            </ng-template>
          </div>

          <!-- CATEGORIES (shown in products tab) -->
          <div *ngIf="activeTab === 'products' && !loading && suggestions?.categories?.length" class="search-categories-section">
            <h3 class="search-section-title">📂 دسته‌بندی‌های مرتبط</h3>
            <div class="search-categories-grid">
              <a *ngFor="let c of suggestions!.categories"
                 [routerLink]="['/shop']"
                 [queryParams]="{ categoryId: c.id }"
                 class="search-category-chip">
                <span>{{ c.name }}</span>
                <small>{{ c.productCount | number:'1.0-0':'fa-IR' }} محصول</small>
              </a>
            </div>
          </div>

          <!-- No results at all -->
          <div *ngIf="!loading && query.length >= 2 && !hasAnyResults" class="search-no-results">
            <span class="search-no-results-icon">🔍</span>
            <h3>نتیجه‌ای یافت نشد</h3>
            <p>برای «{{ query }}» نتیجه‌ای پیدا نشد. کلمات کلیدی دیگری امتحان کنید.</p>
          </div>

        </div>
      </div>

      <!-- Empty state (no query) -->
      <div *ngIf="query.length < 2" class="search-welcome">
        <div class="search-welcome-inner">
          <span class="search-welcome-icon">🔍</span>
          <h2>در تولیدی جستجو کنید</h2>
          <p>محصولات، مقالات وبلاگ و تأمین‌کنندگان را پیدا کنید</p>
          <div class="search-suggestions">
            <span>پیشنهادات:</span>
            <button *ngFor="let s of quickSuggestions" type="button" (click)="quickSearch(s)" class="search-suggestion-chip">{{ s }}</button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; min-height: 100vh; background: #f7f8fc; }

    /* ─── Header ─── */
    .search-header {
      position: sticky;
      top: 0;
      z-index: 50;
      background: #fff;
      border-bottom: 1px solid #eef1f6;
      box-shadow: 0 2px 12px rgba(0,0,0,.04);
    }
    .search-header-inner {
      max-width: 800px;
      margin: 0 auto;
      display: flex;
      align-items: center;
      gap: 20px;
      padding: 12px 20px;
    }
    .search-logo {
      display: flex;
      align-items: center;
      gap: 8px;
      text-decoration: none;
      color: #1d2b49;
      font-weight: 900;
      font-size: 16px;
      flex-shrink: 0;
    }
    .search-logo-mark {
      display: grid;
      place-items: center;
      width: 32px;
      height: 32px;
      border-radius: 10px;
      background: #f5c86b;
      color: #261c46;
      font-size: 14px;
    }

    /* ─── Search Box ─── */
    .search-box {
      flex: 1;
      position: relative;
      display: flex;
      align-items: center;
    }
    .search-box-icon {
      position: absolute;
      right: 14px;
      width: 18px;
      height: 18px;
      color: #b4bdcd;
      pointer-events: none;
    }
    .search-box-input {
      width: 100%;
      height: 48px;
      border: 2px solid #e5eaf2;
      border-radius: 24px;
      padding: 0 100px 0 20px;
      background: #f5f7fb;
      color: #1d2b49;
      font-size: 15px;
      outline: none;
      transition: all .2s ease;
    }
    .search-box-input:focus {
      border-color: #8176e3;
      background: #fff;
      box-shadow: 0 0 0 4px rgba(101,87,216,.1);
    }
    .search-box-input::placeholder { color: #b4bdcd; }
    .search-box-clear {
      position: absolute;
      left: 52px;
      display: grid;
      place-items: center;
      width: 26px;
      height: 26px;
      border-radius: 50%;
      border: 0;
      background: #e5eaf2;
      color: #6b7694;
      font-size: 11px;
      cursor: pointer;
      transition: background .15s;
    }
    .search-box-clear:hover { background: #d0d5e0; }
    .search-box-submit {
      position: absolute;
      left: 4px;
      display: grid;
      place-items: center;
      width: 40px;
      height: 40px;
      border-radius: 50%;
      border: 0;
      background: #6557d8;
      color: #fff;
      cursor: pointer;
      transition: background .15s;
    }
    .search-box-submit:hover { background: #5448c0; }

    /* ─── Tabs ─── */
    .search-tabs-wrap {
      background: #fff;
      border-bottom: 1px solid #eef1f6;
    }
    .search-tabs {
      max-width: 800px;
      margin: 0 auto;
      display: flex;
      gap: 4px;
      padding: 0 20px;
    }
    .search-tab {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 12px 16px;
      border: 0;
      border-bottom: 2px solid transparent;
      background: 0;
      color: #6b7694;
      font-size: 13px;
      font-weight: 700;
      cursor: pointer;
      transition: all .15s;
      white-space: nowrap;
    }
    .search-tab:hover { color: #1d2b49; }
    .search-tab.active {
      color: #6557d8;
      border-bottom-color: #6557d8;
    }
    .search-tab-icon { font-size: 15px; }
    .search-tab-count {
      padding: 1px 7px;
      border-radius: 999px;
      background: #f0f2f6;
      font-size: 10px;
      color: #8892a8;
    }
    .search-tab.active .search-tab-count {
      background: #f0eeff;
      color: #6557d8;
    }

    /* ─── Results ─── */
    .search-results-wrap {
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
    }
    .search-loading {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 32px 0;
      color: #8892a8;
      font-size: 14px;
      justify-content: center;
    }
    .search-loading-spinner {
      width: 20px;
      height: 20px;
      border: 2px solid #e5eaf2;
      border-top-color: #6557d8;
      border-radius: 50%;
      animation: spin .6s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    /* ─── Product cards ─── */
    .search-results-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 16px;
    }
    .search-result-card {
      display: flex;
      gap: 14px;
      padding: 16px;
      border: 1px solid #eef1f6;
      border-radius: 16px;
      background: #fff;
      text-decoration: none;
      color: #1d2b49;
      transition: all .15s ease;
    }
    .search-result-card:hover {
      border-color: #c8cfe0;
      box-shadow: 0 8px 24px rgba(0,0,0,.06);
      transform: translateY(-2px);
    }
    .search-result-img {
      width: 72px;
      height: 72px;
      flex-shrink: 0;
      border-radius: 12px;
      overflow: hidden;
      background: #f0f2f6;
    }
    .search-result-img img { width: 100%; height: 100%; object-fit: cover; }
    .search-result-img-placeholder {
      width: 72px;
      height: 72px;
      flex-shrink: 0;
      display: grid;
      place-items: center;
      border-radius: 12px;
      background: #f0f2f6;
      font-size: 28px;
    }
    .search-result-body { flex: 1; min-width: 0; }
    .search-result-title { margin: 0; font-size: 14px; font-weight: 800; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .search-result-meta { display: flex; gap: 6px; flex-wrap: wrap; margin-top: 6px; }
    .search-result-badge {
      padding: 2px 8px;
      border-radius: 6px;
      background: #f5f7fb;
      font-size: 11px;
      color: #6b7694;
    }
    .search-result-price { margin-top: 8px; font-size: 14px; font-weight: 900; color: #6557d8; }

    /* ─── Blog cards ─── */
    .search-results-list { display: flex; flex-direction: column; gap: 12px; }
    .search-blog-card {
      display: flex;
      gap: 16px;
      padding: 18px;
      border: 1px solid #eef1f6;
      border-radius: 16px;
      background: #fff;
      text-decoration: none;
      color: #1d2b49;
      transition: all .15s ease;
    }
    .search-blog-card:hover { border-color: #c8cfe0; box-shadow: 0 6px 20px rgba(0,0,0,.05); }
    .search-blog-img {
      width: 100px;
      height: 80px;
      flex-shrink: 0;
      border-radius: 12px;
      overflow: hidden;
      background: #f0f2f6;
    }
    .search-blog-img img { width: 100%; height: 100%; object-fit: cover; }
    .search-blog-body { flex: 1; min-width: 0; }
    .search-blog-title { margin: 0; font-size: 15px; font-weight: 800; }
    .search-blog-excerpt { margin-top: 4px; color: #6b7694; font-size: 12px; line-height: 1.7; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
    .search-blog-meta { display: flex; gap: 12px; margin-top: 8px; font-size: 11px; color: #8892a8; }

    /* ─── Supplier cards ─── */
    .search-supplier-card {
      display: flex;
      align-items: center;
      gap: 14px;
      padding: 16px;
      border: 1px solid #eef1f6;
      border-radius: 16px;
      background: #fff;
      text-decoration: none;
      color: #1d2b49;
      transition: all .15s ease;
    }
    .search-supplier-card:hover { border-color: #c8cfe0; box-shadow: 0 6px 20px rgba(0,0,0,.05); }
    .search-supplier-avatar {
      width: 48px;
      height: 48px;
      flex-shrink: 0;
      display: grid;
      place-items: center;
      border-radius: 14px;
      background: linear-gradient(135deg, #6557d8, #8c7cff);
      color: #fff;
      font-size: 18px;
      font-weight: 900;
    }
    .search-supplier-body { flex: 1; min-width: 0; }
    .search-supplier-name { margin: 0; font-size: 14px; font-weight: 800; }
    .search-supplier-meta { display: flex; gap: 12px; margin-top: 4px; font-size: 12px; color: #6b7694; }
    .search-supplier-arrow { color: #b4bdcd; font-size: 14px; }

    /* ─── Categories section ─── */
    .search-categories-section { margin-top: 32px; }
    .search-section-title { margin: 0 0 12px; font-size: 14px; color: #6b7694; }
    .search-categories-grid { display: flex; flex-wrap: wrap; gap: 8px; }
    .search-category-chip {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 8px 14px;
      border: 1px solid #e5eaf2;
      border-radius: 999px;
      background: #fff;
      text-decoration: none;
      color: #1d2b49;
      font-size: 12px;
      font-weight: 700;
      transition: all .15s;
    }
    .search-category-chip:hover { border-color: #8176e3; background: #f0eeff; color: #6557d8; }
    .search-category-chip small { color: #8892a8; font-weight: 400; }

    /* ─── Empty states ─── */
    .search-empty-state, .search-no-results {
      text-align: center;
      padding: 48px 20px;
      color: #8892a8;
    }
    .search-empty-icon, .search-no-results-icon { font-size: 48px; display: block; margin-bottom: 12px; }
    .search-no-results h3 { margin: 0; color: #1d2b49; font-size: 18px; }
    .search-no-results p { margin-top: 8px; font-size: 14px; }

    /* ─── Welcome ─── */
    .search-welcome {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 60vh;
      padding: 40px 20px;
    }
    .search-welcome-inner { text-align: center; }
    .search-welcome-icon { font-size: 56px; display: block; margin-bottom: 16px; }
    .search-welcome-inner h2 { margin: 0; font-size: 22px; color: #1d2b49; }
    .search-welcome-inner p { margin-top: 8px; color: #8892a8; font-size: 14px; }
    .search-suggestions {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-top: 20px;
      justify-content: center;
      flex-wrap: wrap;
    }
    .search-suggestions > span { color: #8892a8; font-size: 12px; }
    .search-suggestion-chip {
      padding: 6px 14px;
      border: 1px solid #e5eaf2;
      border-radius: 999px;
      background: #fff;
      color: #6557d8;
      font-size: 12px;
      font-weight: 700;
      cursor: pointer;
      transition: all .15s;
    }
    .search-suggestion-chip:hover { background: #f0eeff; border-color: #8176e3; }

    /* ─── Mobile ─── */
    @media (max-width: 640px) {
      .search-header-inner { gap: 12px; padding: 10px 14px; }
      .search-logo span:last-child { display: none; }
      .search-box-input { height: 44px; font-size: 14px; padding-right: 48px; padding-left: 80px; }
      .search-box-icon { right: 14px; width: 16px; height: 16px; }
      .search-tabs { padding: 0 14px; overflow-x: auto; -webkit-overflow-scrolling: touch; }
      .search-tab { padding: 10px 12px; font-size: 12px; }
      .search-results-wrap { padding: 14px; }
      .search-results-grid { grid-template-columns: 1fr; }
      .search-result-card { padding: 14px; }
      .search-blog-card { flex-direction: column; }
      .search-blog-img { width: 100%; height: 160px; }
    }
  `]
})
export class SearchPageComponent implements OnInit, OnDestroy {
  @ViewChild('searchInput') searchInput!: ElementRef<HTMLInputElement>;

  query = '';
  activeTab = 'products';
  loading = false;
  suggestions: SearchSuggestions | null = null;
  blogResults: BlogResult[] = [];

  tabs = [
    { id: 'products', label: 'محصولات', icon: '📦' },
    { id: 'blog', label: 'وبلاگ', icon: '📝' },
    { id: 'suppliers', label: 'تأمین‌کنندگان', icon: '🏭' },
  ];

  quickSuggestions = ['زیورآلات', 'نقره', 'سنگ قیمتی', 'ابزار معدن', 'پوشاک'];

  private searchSubject = new Subject<string>();
  private searchSub?: Subscription;
  private routeSub?: Subscription;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly productService: ProductService,
    private readonly api: ApiService
  ) {}

  ngOnInit(): void {
    // Read query from URL
    this.routeSub = this.route.queryParams.subscribe(params => {
      this.query = params['q'] ?? '';
      if (this.query.length >= 2) {
        this.doSearch();
      }
    });

    // Debounced search
    this.searchSub = this.searchSubject.pipe(
      debounceTime(350),
      distinctUntilChanged(),
      switchMap(term => {
        if (term.length < 2) {
          this.suggestions = null;
          this.blogResults = [];
          this.loading = false;
          return of(null);
        }
        this.loading = true;
        return this.productService.searchSuggestions(term).pipe(
          catchError(() => { this.loading = false; return of(null); })
        );
      })
    ).subscribe(result => {
      this.suggestions = result?.data ?? null;
      this.loading = false;
      // Also fetch blog results
      if (this.query.length >= 2) {
        this.fetchBlogResults();
      }
    });
  }

  ngOnDestroy(): void {
    this.searchSub?.unsubscribe();
    this.routeSub?.unsubscribe();
  }

  get hasAnyResults(): boolean {
    const s = this.suggestions;
    return (s?.products?.length ?? 0) > 0
        || (s?.categories?.length ?? 0) > 0
        || (s?.suppliers?.length ?? 0) > 0
        || this.blogResults.length > 0;
  }

  getTabCount(tabId: string): number {
    const s = this.suggestions;
    if (!s) return 0;
    switch (tabId) {
      case 'products': return s.products.length + s.categories.length;
      case 'blog': return this.blogResults.length;
      case 'suppliers': return s.suppliers.length;
      default: return 0;
    }
  }

  onInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.query = value;
    this.searchSubject.next(value);
    this.updateUrl();
  }

  search(): void {
    if (this.query.trim().length >= 2) {
      this.doSearch();
      this.updateUrl();
    }
  }

  setTab(tabId: string): void {
    this.activeTab = tabId;
  }

  clearQuery(): void {
    this.query = '';
    this.suggestions = null;
    this.blogResults = [];
    this.updateUrl();
    setTimeout(() => this.searchInput?.nativeElement?.focus(), 50);
  }

  quickSearch(term: string): void {
    this.query = term;
    this.searchSubject.next(term);
    this.updateUrl();
  }

  private doSearch(): void {
    this.loading = true;
    this.productService.searchSuggestions(this.query).pipe(
      catchError(() => { this.loading = false; return of(null); })
    ).subscribe(result => {
      this.suggestions = result?.data ?? null;
      this.loading = false;
    });
    this.fetchBlogResults();
  }

  private fetchBlogResults(): void {
    this.api.get<any>(`/v1/blog?search=${encodeURIComponent(this.query)}&pageSize=10`).pipe(
      catchError(() => of(null))
    ).subscribe(result => {
      if (result?.data?.items) {
        this.blogResults = result.data.items.map((b: any) => ({
          id: b.id,
          title: b.title,
          slug: b.slug,
          excerpt: b.excerpt ?? b.shortDescription,
          coverImageUrl: b.coverImageUrl,
          publishedAt: b.publishedAt,
          authorName: b.authorName
        }));
      } else {
        this.blogResults = [];
      }
    });
  }

  private updateUrl(): void {
    if (this.query.length >= 2) {
      this.router.navigate([], { queryParams: { q: this.query }, queryParamsHandling: 'merge' });
    } else {
      this.router.navigate([], { queryParams: { q: null }, queryParamsHandling: 'merge' });
    }
  }
}
