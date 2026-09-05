import { Component, EventEmitter, Input, OnDestroy, Output, ElementRef, ViewChild } from '@angular/core';
import { Subject, Subscription, debounceTime, distinctUntilChanged, switchMap, of, catchError } from 'rxjs';
import { Router } from '@angular/router';
import { ProductService, SearchSuggestions, SearchSuggestionProduct, SearchSuggestionCategory, SearchSuggestionSupplier } from '../../../core/services/api/product.service';

@Component({
  selector: 'app-search-autocomplete',
  template: `
    <div class="search-autocomplete" [class.search-open]="isOpen">
      <!-- Desktop -->
      <div class="hidden lg:block">
        <form (ngSubmit)="onSubmit()" class="relative">
          <div class="search-input-wrap">
            <svg class="search-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z"/>
            </svg>
            <input
              #desktopInput
              type="text"
              [(ngModel)]="query"
              name="desktopSearch"
              (input)="onInput($event)"
              (focus)="onFocus()"
              (keydown.escape)="close()"
              placeholder="جستجوی محصول، دسته‌بندی، تأمین‌کننده..."
              class="search-input"
              autocomplete="off"
            />
            <button *ngIf="query" type="button" (click)="clearQuery()" class="search-clear">✕</button>
          </div>
        </form>

        <!-- Desktop Dropdown -->
        <div *ngIf="isOpen && (loading || hasResults)" class="search-dropdown">
          <div *ngIf="loading" class="search-loading">
            <span class="search-spinner"></span>
            <span>در حال جستجو...</span>
          </div>

          <ng-container *ngIf="!loading && suggestions">
            <!-- Products -->
            <div *ngIf="suggestions.products.length" class="search-group">
              <div class="search-group-header">
                <span class="search-group-icon">📦</span>
                <span>محصولات</span>
                <span class="search-group-count">{{ suggestions.products.length }}</span>
              </div>
              <a *ngFor="let p of suggestions.products"
                 [routerLink]="['/product', 'slug', p.slug]"
                 (click)="close()"
                 class="search-item search-item-product">
                <div class="search-item-img" *ngIf="p.imageUrl">
                  <img [src]="p.imageUrl" [alt]="p.name" loading="lazy" />
                </div>
                <div *ngIf="!p.imageUrl" class="search-item-img-placeholder">📦</div>
                <div class="search-item-info">
                  <span class="search-item-name">{{ p.name }}</span>
                  <span class="search-item-meta">{{ p.categoryName }} · {{ p.supplierName }}</span>
                </div>
                <span class="search-item-price">{{ p.price | number:'1.0-0':'fa-IR' }} تومان</span>
              </a>
            </div>

            <!-- Categories -->
            <div *ngIf="suggestions.categories.length" class="search-group">
              <div class="search-group-header">
                <span class="search-group-icon">📂</span>
                <span>دسته‌بندی‌ها</span>
                <span class="search-group-count">{{ suggestions.categories.length }}</span>
              </div>
              <a *ngFor="let c of suggestions.categories"
                 [routerLink]="['/shop']"
                 [queryParams]="{ categoryId: c.id }"
                 (click)="close()"
                 class="search-item search-item-category">
                <div class="search-item-img-placeholder">📂</div>
                <div class="search-item-info">
                  <span class="search-item-name">{{ c.name }}</span>
                  <span class="search-item-meta">{{ c.productCount | number:'1.0-0':'fa-IR' }} محصول</span>
                </div>
                <span class="search-item-arrow">←</span>
              </a>
            </div>

            <!-- Suppliers -->
            <div *ngIf="suggestions.suppliers.length" class="search-group">
              <div class="search-group-header">
                <span class="search-group-icon">🏭</span>
                <span>تأمین‌کنندگان</span>
                <span class="search-group-count">{{ suggestions.suppliers.length }}</span>
              </div>
              <a *ngFor="let s of suggestions.suppliers"
                 [routerLink]="['/shop']"
                 [queryParams]="{ city: s.city }"
                 (click)="close()"
                 class="search-item search-item-supplier">
                <div class="search-item-img-placeholder">🏭</div>
                <div class="search-item-info">
                  <span class="search-item-name">{{ s.companyName }}</span>
                  <span class="search-item-meta">{{ s.city }}، {{ s.province }} · {{ s.productCount | number:'1.0-0':'fa-IR' }} محصول</span>
                </div>
                <span class="search-item-arrow">←</span>
              </a>
            </div>

            <!-- No results -->
            <div *ngIf="!hasResults && query.length >= 2" class="search-empty">
              <span>🔍</span>
              <span>نتیجه‌ای برای «{{ query }}» یافت نشد</span>
            </div>
          </ng-container>

          <!-- Footer -->
          <div *ngIf="hasResults && !loading" class="search-footer">
            <button type="button" (click)="onSubmit()" class="search-footer-link">
              مشاهده همه نتایج «{{ query }}» ←
            </button>
          </div>
        </div>
      </div>

      <!-- Mobile -->
      <div class="lg:hidden">
        <button type="button" (click)="openMobile()" class="search-mobile-trigger" aria-label="جستجو">
          <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z"/>
          </svg>
        </button>

        <!-- Mobile Overlay -->
        <div *ngIf="mobileOpen" class="search-mobile-overlay" (click)="closeMobile()">
          <div class="search-mobile-container" (click)="$event.stopPropagation()">
            <div class="search-mobile-bar">
              <div class="search-mobile-input-wrap">
                <svg class="search-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                  <path stroke-linecap="round" stroke-linejoin="round" d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z"/>
                </svg>
                <input
                  #mobileInput
                  type="text"
                  [(ngModel)]="query"
                  name="mobileSearch"
                  (input)="onInput($event)"
                  placeholder="جستجوی محصول، دسته‌بندی..."
                  class="search-mobile-input"
                  autocomplete="off"
                />
                <button *ngIf="query" type="button" (click)="clearQuery()" class="search-clear-mobile">✕</button>
              </div>
              <button type="button" (click)="closeMobile()" class="search-mobile-cancel">لغو</button>
            </div>

            <div class="search-mobile-results">
              <div *ngIf="loading" class="search-loading">
                <span class="search-spinner"></span>
                <span>در حال جستجو...</span>
              </div>

              <ng-container *ngIf="!loading && suggestions">
                <!-- Products -->
                <div *ngIf="suggestions.products.length" class="search-group">
                  <div class="search-group-header">
                    <span class="search-group-icon">📦</span>
                    <span>محصولات</span>
                  </div>
                  <a *ngFor="let p of suggestions.products"
                     [routerLink]="['/product', 'slug', p.slug]"
                     (click)="closeMobile()"
                     class="search-item search-item-product">
                    <div class="search-item-img" *ngIf="p.imageUrl">
                      <img [src]="p.imageUrl" [alt]="p.name" loading="lazy" />
                    </div>
                    <div *ngIf="!p.imageUrl" class="search-item-img-placeholder">📦</div>
                    <div class="search-item-info">
                      <span class="search-item-name">{{ p.name }}</span>
                      <span class="search-item-meta">{{ p.categoryName }} · {{ p.supplierName }}</span>
                    </div>
                    <span class="search-item-price">{{ p.price | number:'1.0-0':'fa-IR' }} ت</span>
                  </a>
                </div>

                <!-- Categories -->
                <div *ngIf="suggestions.categories.length" class="search-group">
                  <div class="search-group-header">
                    <span class="search-group-icon">📂</span>
                    <span>دسته‌بندی‌ها</span>
                  </div>
                  <a *ngFor="let c of suggestions.categories"
                     [routerLink]="['/shop']"
                     [queryParams]="{ categoryId: c.id }"
                     (click)="closeMobile()"
                     class="search-item search-item-category">
                    <div class="search-item-img-placeholder">📂</div>
                    <div class="search-item-info">
                      <span class="search-item-name">{{ c.name }}</span>
                      <span class="search-item-meta">{{ c.productCount | number:'1.0-0':'fa-IR' }} محصول</span>
                    </div>
                    <span class="search-item-arrow">←</span>
                  </a>
                </div>

                <!-- Suppliers -->
                <div *ngIf="suggestions.suppliers.length" class="search-group">
                  <div class="search-group-header">
                    <span class="search-group-icon">🏭</span>
                    <span>تأمین‌کنندگان</span>
                  </div>
                  <a *ngFor="let s of suggestions.suppliers"
                     [routerLink]="['/shop']"
                     [queryParams]="{ city: s.city }"
                     (click)="closeMobile()"
                     class="search-item search-item-supplier">
                    <div class="search-item-img-placeholder">🏭</div>
                    <div class="search-item-info">
                      <span class="search-item-name">{{ s.companyName }}</span>
                      <span class="search-item-meta">{{ s.city }}، {{ s.province }}</span>
                    </div>
                    <span class="search-item-arrow">←</span>
                  </a>
                </div>

                <div *ngIf="!hasResults && query.length >= 2" class="search-empty">
                  <span>🔍</span>
                  <span>نتیجه‌ای یافت نشد</span>
                </div>
              </ng-container>

              <div *ngIf="hasResults && !loading" class="search-footer">
                <button type="button" (click)="onSubmit(); closeMobile()" class="search-footer-link">
                  مشاهده همه نتایج ←
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host { display: inline-block; }

    /* ─── Desktop ─── */
    .search-input-wrap {
      position: relative;
      display: flex;
      align-items: center;
    }
    .search-icon {
      position: absolute;
      right: 14px;
      width: 16px;
      height: 16px;
      color: rgba(255,255,255,.45);
      pointer-events: none;
    }
    .search-input {
      width: 320px;
      height: 40px;
      border: 1px solid rgba(255,255,255,.15);
      border-radius: 12px;
      padding: 0 40px 0 14px;
      background: rgba(255,255,255,.08);
      color: #fff;
      font-size: 13px;
      outline: none;
      transition: all .2s ease;
    }
    .search-input::placeholder { color: rgba(255,255,255,.4); }
    .search-input:focus {
      background: rgba(255,255,255,.14);
      border-color: rgba(255,255,255,.3);
      box-shadow: 0 0 0 3px rgba(108,63,197,.2);
      width: 380px;
    }
    .search-clear {
      position: absolute;
      left: 10px;
      display: grid;
      place-items: center;
      width: 22px;
      height: 22px;
      border-radius: 50%;
      border: 0;
      background: rgba(255,255,255,.15);
      color: rgba(255,255,255,.6);
      font-size: 10px;
      cursor: pointer;
    }
    .search-clear:hover { background: rgba(255,255,255,.25); }

    /* ─── Dropdown ─── */
    .search-dropdown {
      position: absolute;
      top: calc(100% + 8px);
      right: 0;
      width: 420px;
      max-height: 480px;
      overflow-y: auto;
      border: 1px solid #e5eaf2;
      border-radius: 16px;
      background: #fff;
      box-shadow: 0 20px 50px rgba(0,0,0,.15);
      z-index: 100;
      animation: dropIn .15s ease;
    }
    @keyframes dropIn {
      from { opacity: 0; transform: translateY(-6px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .search-loading {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 16px 18px;
      color: #8892a8;
      font-size: 13px;
    }
    .search-spinner {
      width: 16px;
      height: 16px;
      border: 2px solid #e5eaf2;
      border-top-color: #6557d8;
      border-radius: 50%;
      animation: spin .6s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    .search-group { padding: 6px 0; }
    .search-group + .search-group { border-top: 1px solid #f0f2f6; }
    .search-group-header {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 8px 16px 4px;
      color: #6b7694;
      font-size: 11px;
      font-weight: 800;
    }
    .search-group-icon { font-size: 13px; }
    .search-group-count {
      margin-right: auto;
      padding: 1px 7px;
      border-radius: 999px;
      background: #f0f2f6;
      font-size: 10px;
      color: #8892a8;
    }

    .search-item {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 8px 16px;
      text-decoration: none;
      color: #1d2b49;
      transition: background .12s;
    }
    .search-item:hover { background: #f5f7fb; }

    .search-item-img {
      width: 40px;
      height: 40px;
      flex-shrink: 0;
      border-radius: 10px;
      overflow: hidden;
      background: #f0f2f6;
    }
    .search-item-img img { width: 100%; height: 100%; object-fit: cover; }
    .search-item-img-placeholder {
      width: 40px;
      height: 40px;
      flex-shrink: 0;
      display: grid;
      place-items: center;
      border-radius: 10px;
      background: #f0f2f6;
      font-size: 18px;
    }

    .search-item-info { flex: 1; min-width: 0; }
    .search-item-name { display: block; font-size: 13px; font-weight: 700; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .search-item-meta { display: block; font-size: 11px; color: #8892a8; margin-top: 1px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .search-item-price { flex-shrink: 0; font-size: 12px; font-weight: 800; color: #6557d8; white-space: nowrap; }
    .search-item-arrow { flex-shrink: 0; font-size: 12px; color: #b4bdcd; }

    .search-empty {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 24px 16px;
      color: #8892a8;
      font-size: 13px;
      text-align: center;
      justify-content: center;
    }

    .search-footer {
      border-top: 1px solid #f0f2f6;
      padding: 10px 16px;
    }
    .search-footer-link {
      display: block;
      width: 100%;
      text-align: center;
      border: 0;
      background: 0;
      color: #6557d8;
      font-size: 12px;
      font-weight: 800;
      cursor: pointer;
      padding: 8px;
      border-radius: 8px;
      transition: background .12s;
    }
    .search-footer-link:hover { background: #f0eeff; }

    /* ─── Mobile ─── */
    .search-mobile-trigger {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 40px;
      height: 40px;
      border: 1px solid rgba(255,255,255,.15);
      border-radius: 12px;
      background: transparent;
      color: #fff;
      cursor: pointer;
    }
    .search-mobile-trigger:hover { background: rgba(255,255,255,.1); }

    .search-mobile-overlay {
      position: fixed;
      inset: 0;
      z-index: 200;
      background: rgba(0,0,0,.5);
      backdrop-filter: blur(4px);
      animation: fadeIn .15s ease;
    }
    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

    .search-mobile-container {
      position: absolute;
      inset: 0;
      display: flex;
      flex-direction: column;
      background: #fff;
    }

    .search-mobile-bar {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px 14px;
      border-bottom: 1px solid #f0f2f6;
    }
    .search-mobile-input-wrap {
      flex: 1;
      position: relative;
      display: flex;
      align-items: center;
    }
    .search-mobile-input-wrap .search-icon {
      color: #b4bdcd;
    }
    .search-mobile-input {
      width: 100%;
      height: 44px;
      border: 1px solid #e5eaf2;
      border-radius: 12px;
      padding: 0 40px 0 40px;
      background: #f5f7fb;
      color: #1d2b49;
      font-size: 15px;
      outline: none;
      transition: border-color .2s;
    }
    .search-mobile-input:focus { border-color: #8176e3; background: #fff; }
    .search-mobile-input::placeholder { color: #b4bdcd; }
    .search-clear-mobile {
      position: absolute;
      left: 10px;
      display: grid;
      place-items: center;
      width: 24px;
      height: 24px;
      border-radius: 50%;
      border: 0;
      background: #e5eaf2;
      color: #6b7694;
      font-size: 11px;
      cursor: pointer;
    }
    .search-mobile-cancel {
      border: 0;
      background: 0;
      color: #6557d8;
      font-size: 14px;
      font-weight: 700;
      cursor: pointer;
      white-space: nowrap;
    }

    .search-mobile-results {
      flex: 1;
      overflow-y: auto;
      -webkit-overflow-scrolling: touch;
    }

    /* ─── Shared mobile groups ─── */
    .search-mobile-results .search-item {
      padding: 12px 16px;
    }
    .search-mobile-results .search-item-img,
    .search-mobile-results .search-item-img-placeholder {
      width: 46px;
      height: 46px;
    }
    .search-mobile-results .search-item-name { font-size: 14px; }
    .search-mobile-results .search-item-meta { font-size: 12px; }
    .search-mobile-results .search-item-price { font-size: 13px; }
  `]
})
export class SearchAutocompleteComponent implements OnDestroy {
  @Output() searchSubmitted = new EventEmitter<string>();
  @ViewChild('desktopInput') desktopInput!: ElementRef<HTMLInputElement>;
  @ViewChild('mobileInput') mobileInput!: ElementRef<HTMLInputElement>;

  query = '';
  isOpen = false;
  mobileOpen = false;
  loading = false;
  suggestions: SearchSuggestions | null = null;

  private searchSubject = new Subject<string>();
  private searchSub?: Subscription;

  constructor(
    private readonly productService: ProductService,
    private readonly router: Router
  ) {
    this.searchSub = this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(term => {
        if (term.length < 2) {
          this.suggestions = null;
          this.loading = false;
          return of(null);
        }
        this.loading = true;
        return this.productService.searchSuggestions(term).pipe(
          catchError(() => { this.loading = false; return of(null); })
        );
      })
    ).subscribe(result => {
      this.loading = false;
      this.suggestions = result?.data ?? null;
    });
  }

  ngOnDestroy(): void {
    this.searchSub?.unsubscribe();
  }

  get hasResults(): boolean {
    return !!this.suggestions && this.suggestions.totalResults > 0;
  }

  onInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.query = value;
    this.isOpen = value.length >= 1;
    this.searchSubject.next(value);
  }

  onFocus(): void {
    if (this.query.length >= 1) {
      this.isOpen = true;
      this.searchSubject.next(this.query);
    }
  }

  close(): void {
    this.isOpen = false;
  }

  clearQuery(): void {
    this.query = '';
    this.suggestions = null;
    this.isOpen = false;
  }

  onSubmit(): void {
    const term = this.query.trim();
    if (!term) return;
    this.router.navigate(['/search'], { queryParams: { q: term } });
    this.close();
    this.closeMobile();
  }

  openMobile(): void {
    this.mobileOpen = true;
    setTimeout(() => this.mobileInput?.nativeElement?.focus(), 100);
  }

  closeMobile(): void {
    this.mobileOpen = false;
    this.isOpen = false;
  }
}
