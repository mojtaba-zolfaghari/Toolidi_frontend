import { animate, style, transition, trigger } from '@angular/animations';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { ActivatedRoute, Router } from '@angular/router';
import { Subscription } from 'rxjs';

import { fadeIn, scaleUp, slideUp } from '../../shared/animations';
import { CartService } from '../../core/services/api/cart.service';
import {
  Product,
  ProductService,
  ProductVariation
} from '../../core/services/api/product.service';
import { AuthStateService } from '../../core/services/auth-state.service';
import { SeoService } from '../../core/services/seo.service';
import { CartButtonState } from '../../shared/components/add-to-cart-button/add-to-cart-button.component';

/** انیمیشن تعویض تصویر اصلی با محو شدن */
const imageSwap = trigger('imageSwap', [
  transition('* => *', [
    style({ opacity: 0, transform: 'scale(0.98)' }),
    animate('300ms ease-out', style({ opacity: 1, transform: 'scale(1)' }))
  ])
]);

/** گزینه‌ی تب‌های جزئیات محصول */
export type ProductTab = 'description' | 'specs' | 'reviews';

/** یک ردیف مشخصات فنی برای نمایش */
interface SpecRow {
  label: string;
  value: string;
}

/**
 * صفحه جزئیات محصول؛ گالری تصویر، تب‌های توضیحات/مشخصات/نظرات،
 * تنوع‌ها، افزودن به سبد و محصولات مرتبط.
 */
@Component({
  selector: 'app-product-detail',
  templateUrl: './product-detail.component.html',
  styleUrls: ['./product-detail.component.scss'],
  animations: [fadeIn, slideUp, scaleUp, imageSwap]
})
export class ProductDetailComponent implements OnInit, OnDestroy {
  product: Product | null = null;
  relatedProducts: Product[] = [];
  supplierStats: { totalSuppliers: number; citiesCount: number; cities: { city: string; count: number }[] } | null = null;
  loading = true;
  errorMessage = '';
  quantity = 1;
  activeTab: ProductTab = 'description';
  activeImageIndex = 0;
  selectedVariationId: string | null = null;
  isLoggedIn = false;
  /** وضعیت دکمه افزودن به سبد */
  cartState: CartButtonState = 'idle';

  private subscription?: Subscription;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly productService: ProductService,
    private readonly cartService: CartService,
    private readonly authState: AuthStateService,
    private readonly seo: SeoService
  ) {}

  ngOnInit(): void {
    this.subscription = this.authState.currentUser$.subscribe((user) => {
      this.isLoggedIn = !!user;
    });

    this.route.paramMap.subscribe((params) => {
      const id = params.get('id');
      const slug = params.get('slug');
      this.loading = true;
      this.errorMessage = '';
      this.activeImageIndex = 0;
      this.selectedVariationId = null;
      this.quantity = 1;

      const request = id
        ? this.productService.getProductById(id)
        : this.productService.getProductBySlug(slug ?? '');

      request.subscribe({
        next: (result) => {
          this.product = result.data ?? null;
          this.loading = false;
          this.autoSelectVariation();
          this.loadRelated();
          this.loadSupplierStats();
          this.applySeo();
        },
        error: (err: Error) => {
          this.errorMessage = err?.message ?? 'محصول یافت نشد.';
          this.loading = false;
        }
      });
    });
  }

  ngOnDestroy(): void {
    this.subscription?.unsubscribe();
    this.seo.removeJsonLd();
  }

  /** اعمال SEO: title, meta, OG, JSON-LD */
  private applySeo(): void {
    const p = this.product;
    if (!p) return;

    const url = `https://toolidi.ir/product/slug/${p.slug}`;
    const imageUrl = p.images?.length
      ? p.images.find(i => i.isPrimary)?.imageUrl || p.images[0].imageUrl
      : p.imageUrl || '';

    // Page title + meta
    this.seo.setPage({
      title: p.name,
      description: p.shortDescription || p.fullDescription || `${p.name} با قیمت ${new Intl.NumberFormat('fa-IR').format(p.unitPrice)} تومان از ${p.sellerCity || 'تولیدی'}`,
      image: imageUrl,
      url,
      type: 'product',
    });

    // JSON-LD Product schema
    this.seo.setJsonLd(this.seo.productJsonLd({
      name: p.name,
      description: p.shortDescription || p.fullDescription || p.name,
      image: imageUrl,
      price: p.unitPrice,
      currency: 'IRR',
      url,
      rating: p.ratingAverage ?? undefined,
      reviewCount: p.ratingCount || undefined,
      sku: p.sku,
      availability: (p.stockQuantity && p.stockQuantity > 0)
        ? 'https://schema.org/InStock'
        : 'https://schema.org/OutOfStock',
    }));
  }

  /** تصاویر گالری (در صورت وجود) */
  get galleryImages(): string[] {
    const images = this.product?.images ?? [];
    if (!images.length) {
      return [];
    }
    return [...images]
      .sort((a, b) => Number(b.isPrimary) - Number(a.isPrimary) || a.displayOrder - b.displayOrder)
      .map((image) => image.imageUrl);
  }

  /** نمایش گالری یا جای‌گذاری تصویر */
  get hasGallery(): boolean {
    return this.galleryImages.length > 0;
  }

  /** تنوع‌های محصول */
  get variations(): ProductVariation[] {
    return this.product?.variations ?? [];
  }

  /** تنوع انتخاب‌شده */
  get selectedVariation(): ProductVariation | null {
    return this.variations.find((variation) => variation.id === this.selectedVariationId) ?? null;
  }

  /** قیمت نهایی با احتساب تنوع */
  get effectivePrice(): number {
    return (this.product?.unitPrice ?? 0) + (this.selectedVariation?.priceAdjustment ?? 0);
  }

  /** درصد تخفیف معتبر محصول */
  get discountPercent(): number {
    if (!this.product) return 0;
    if (this.product.discountPercent && this.product.discountPercent > 0) return this.product.discountPercent;
    return this.product.comparePrice && this.product.comparePrice > this.product.unitPrice
      ? Math.round((1 - this.product.unitPrice / this.product.comparePrice) * 100)
      : 0;
  }

  /** مبلغ صرفه‌جویی محصول */
  get discountAmount(): number {
    if (!this.product) return 0;
    if (this.product.discountAmount && this.product.discountAmount > 0) return this.product.discountAmount;
    return this.product.comparePrice && this.product.comparePrice > this.product.unitPrice
      ? this.product.comparePrice - this.product.unitPrice
      : 0;
  }

  /** زمان‌های ارسال عمومی محصول */
  get deliveryInfo(): { city: string; cityDays: number; nationwideDays: number } {
    const city = this.product?.sellerCity?.trim() ?? '';
    return {
      city: !city || /^[?؟]+$/.test(city) ? 'نامشخص' : city,
      cityDays: Math.max(1, this.product?.cityDeliveryDays || 1),
      nationwideDays: Math.max(this.product?.cityDeliveryDays || 1, this.product?.nationwideDeliveryDays || 3)
    };
  }

  /** روزهای تولید (طولانی‌ترین زمان تأمین‌کننده) — ۰ یعنی آماده ارسال */
  get productionLeadDays(): number {
    return this.product?.productionLeadDays ?? 0;
  }

  /** تبدیل عدد روز به متن فارسی */
  daysText(days: number): string {
    if (days <= 0) return 'امروز';
    if (days === 1) return 'فردا';
    return `${days.toLocaleString('fa-IR', { maximumFractionDigits: 0 })} روز کاری`;
  }

  // ─── مقایسه محصولات ───

  /** حداکثر تعداد محصولات قابل مقایسه */
  readonly compareLimit = 4;

  /** حالت انتخاب برای مقایسه */
  compareMode = false;

  /** شناسه‌های انتخاب‌شده برای مقایسه (محصول جاری همیشه اول است) */
  compareIds: string[] = [];

  /** آیا محصول جاری در فهرست مقایسه است */
  get isComparing(): boolean {
    return !!this.product && this.compareIds.includes(this.product.id);
  }

  /** ستون‌های جدول مقایسه — محصول جاری + انتخاب‌شده‌ها به ترتیب */
  get compareColumns(): Product[] {
    const columns: Product[] = [];
    if (this.product) columns.push(this.product);
    for (const id of this.compareIds) {
      const related = this.relatedProducts.find((item) => item.id === id);
      if (related && related.id !== this.product?.id) columns.push(related);
    }
    return columns.slice(0, this.compareLimit);
  }

  /** ردیف‌های جدول مقایسه */
  get compareRows(): { label: string; values: string[] }[] {
    const columns = this.compareColumns;
    if (columns.length < 2) return [];

    const row = (label: string, extract: (p: Product) => string): { label: string; values: string[] } => ({
      label,
      values: columns.map(extract)
    });

    return [
      row('قیمت', (p) => `${p.unitPrice.toLocaleString('fa-IR')} تومان`),
      row('قیمت قبل', (p) =>
        p.comparePrice && p.comparePrice > p.unitPrice
          ? `${p.comparePrice.toLocaleString('fa-IR')} تومان`
          : '—'),
      row('امتیاز', (p) => (p.ratingCount > 0 ? `${(p.ratingAverage ?? 0).toLocaleString('fa-IR')} از ۵ (${p.ratingCount.toLocaleString('fa-IR')} نظر)` : 'بدون نظر')),
      row('موجودی', (p) => (p.stockQuantity === undefined || p.stockQuantity === null ? 'نامشخص' : p.stockQuantity > 0 ? 'موجود' : 'ناموجود')),
      row('شهر فروشنده', (p) => {
        const city = p.sellerCity?.trim() ?? '';
        return !city || /^[?؟]+$/.test(city) ? 'نامشخص' : city;
      }),
      row('ارسال محلی', (p) => this.daysText((p.productionLeadDays ?? 0) + Math.max(1, p.cityDeliveryDays ?? 1))),
      row('ارسال سراسری', (p) => this.daysText((p.productionLeadDays ?? 0) + Math.max(p.cityDeliveryDays ?? 1, p.nationwideDeliveryDays ?? 3))),
      row('دسته‌بندی', (p) => p.categoryName ?? '—'),
      row('کد کالا', (p) => p.sku || '—')
    ];
  }

  /** بازکردن حالت مقایسه — محصول جاری به‌صورت خودکار انتخاب می‌شود */
  openCompare(): void {
    this.compareMode = true;
    if (this.product && !this.compareIds.includes(this.product.id)) {
      this.compareIds = [this.product.id, ...this.compareIds];
    }
    setTimeout(() => {
      document.querySelector('.product-detail__related')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 50);
  }

  /** افزودن/حذف یک محصول از مقایسه */
  toggleCompare(id: string): void {
    if (this.compareIds.includes(id)) {
      this.compareIds = this.compareIds.filter((item) => item !== id);
      return;
    }
    if (this.compareColumns.length >= this.compareLimit) {
      return;
    }
    this.compareIds = [...this.compareIds, id];
  }

  /** بستن حالت مقایسه */
  closeCompare(): void {
    this.compareMode = false;
    this.compareIds = [];
  }

  /** انتخاب خودکار تنوع پیش‌فرض */
  private autoSelectVariation(): void {
    if (!this.variations.length) {
      return;
    }
    const defaultVariation = this.variations.find((variation) => variation.isDefault) ?? this.variations[0];
    this.selectedVariationId = defaultVariation.id;
  }

  /** انتخاب تصویر گالری */
  selectImage(index: number): void {
    this.activeImageIndex = index;
  }

  /** انتخاب تنوع */
  onVariationChange(variationId: string): void {
    this.selectedVariationId = variationId || null;
    const variation = this.selectedVariation;
    if (variation?.imageUrl && this.hasGallery) {
      const index = this.galleryImages.indexOf(variation.imageUrl);
      if (index >= 0) {
        this.activeImageIndex = index;
      }
    }
  }

  /** نظرات محصول (در حال حاضر خالی) */
  reviews: any[] = [];

  /** وضعیت موجودی کالا */
  get stockStatus(): { text: string; cssClass: string; inStock: boolean } {
    const stock = this.selectedVariation
      ? this.selectedVariation.stockQuantity
      : this.product?.stockQuantity;

    if (stock === undefined || stock === null) {
      return { text: 'موجود', cssClass: 'text-green-600', inStock: true };
    }
    if (stock <= 0) {
      return { text: 'ناموجود', cssClass: 'text-red-600', inStock: false };
    }
    if (stock < 10) {
      return { text: `تنها ${stock} عدد باقی مانده`, cssClass: 'text-orange-600', inStock: true };
    }
    return { text: 'موجود', cssClass: 'text-green-600', inStock: true };
  }

  /** مشخصات فنی استخراج‌شده از محصول */
  get specs(): SpecRow[] {
    const product = this.product;
    if (!product) {
      return [];
    }
    const rows: SpecRow[] = [
      { label: 'شناسه کالا', value: product.sku },
      { label: 'دسته‌بندی', value: product.categoryName ?? product.categoryId },
      { label: 'نوع کالا', value: product.isDigital ? 'دیجیتال' : 'فیزیکی' },
      { label: 'وضعیت نمایش', value: product.isFeatured ? 'محصول منتخب' : 'عادی' }
    ];
    if (product.weight !== undefined && product.weight !== null) {
      rows.push({ label: 'وزن', value: `${product.weight} گرم` });
    }
    if (product.length !== undefined && product.width !== undefined && product.height !== undefined) {
      rows.push({ label: 'ابعاد', value: `${product.length}×${product.width}×${product.height} سانتی‌متر` });
    }
    if (product.taxRate !== undefined && product.taxRate !== null) {
      rows.push({ label: 'نرخ مالیات', value: `${product.taxRate}٪` });
    }
    rows.push({ label: 'بازدید', value: `${product.viewCount} بار` });
    for (const attribute of product.attributes ?? []) {
      rows.push({ label: attribute.name, value: attribute.value });
    }
    return rows;
  }

  /** کم و زیاد کردن تعداد */
  changeQuantity(delta: number): void {
    this.quantity = Math.max(1, this.quantity + delta);
  }

  /** افزودن محصول به سبد خرید با انیمیشن */
  addToCart(): void {
    if (!this.product) {
      return;
    }
    if (this.cartState !== 'idle') {
      return;
    }

    this.cartState = 'adding';

    if (!this.isLoggedIn) {
      // کاربر مهمان — ذخیره در localStorage با اسنپ‌شات نمایشی
      const primaryImage = this.product.images?.find((image) => image.isPrimary)?.imageUrl;
      this.cartService.addGuestItem(this.product.id, this.selectedVariationId ?? undefined, this.quantity, {
        name: this.product.name,
        imageUrl: this.product.imageUrl ?? primaryImage,
        unitPrice: this.product.unitPrice,
        categoryName: this.product.categoryName,
        sellerCity: this.product.sellerCity,
        cityDeliveryDays: this.product.cityDeliveryDays,
        nationwideDeliveryDays: this.product.nationwideDeliveryDays
      });
      this.cartState = 'success';
      setTimeout(() => { this.cartState = 'idle'; }, 2000);
      return;
    }

    this.cartService
      .addItem(this.product.id, this.selectedVariationId ?? undefined, this.quantity)
      .subscribe({
        next: () => {
          this.cartState = 'success';
          setTimeout(() => { this.cartState = 'idle'; }, 2000);
        },
        error: () => { this.cartState = 'idle'; }
      });
  }

  /** دریافت محصولات مرتبط (یا از همان دسته‌بندی) */
  private loadRelated(): void {
    if (!this.product) {
      return;
    }
    const categoryId = this.product.categoryId;
    this.productService
      .getProducts({ categoryId, page: 1, pageSize: 12 })
      .subscribe({
        next: (result) => {
          const items = (result.data?.items ?? []).filter(
            (item) => item.id !== this.product?.id
          );
          this.relatedProducts = items.slice(0, 4);
        },
        error: () => (this.relatedProducts = [])
      });
  }

  /** دریافت آمار تأمین‌کنندگان */
  private loadSupplierStats(): void {
    if (!this.product) {
      return;
    }
    this.productService
      .getSuppliersByCity(this.product.categoryId)
      .subscribe({
        next: (result) => {
          this.supplierStats = result.data ?? null;
        },
        error: () => (this.supplierStats = null)
      });
  }
}
