import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { catchError } from 'rxjs/operators';
import { ApiService } from '../../core/services/api.service';
import { Product } from '../../core/services/api/product.service';

export interface DealProduct {
  id: string;
  name: string;
  sku: string;
  slug: string;
  unitPrice: number;
  comparePrice: number;
  discountPercent: number;
  discountAmount: number;
  sellerCity: string;
  cityDeliveryDays: number;
  nationwideDeliveryDays: number;
  shortDescription: string;
  ratingAverage: number;
  ratingCount: number;
  viewCount: number;
  categoryName: string;
  sellerId: string;
  images: { imageUrl: string; isPrimary: boolean }[];
  daysLeft: number;
}

export interface DealSupplier {
  supplierId: string;
  companyName: string;
  city: string;
  province: string;
  rating: number;
  isVerified: boolean;
  description: string;
  dealCount: number;
  maxDiscount: number;
  totalProducts: number;
}

@Component({
  selector: 'app-deals',
  templateUrl: './deals.component.html',
  styleUrls: ['./deals.component.scss']
})
export class DealsComponent implements OnInit {
  products: DealProduct[] = [];
  suppliers: DealSupplier[] = [];
  loading = true;
  countdown = { hours: 23, minutes: 59, seconds: 59 };
  private timer: any;

  constructor(private readonly api: ApiService, private readonly router: Router) {}

  ngOnInit(): void {
    this.loadDeals();
    this.loadSuppliers();
    this.startCountdown();
  }

  ngOnDestroy(): void {
    if (this.timer) clearInterval(this.timer);
  }

  loadDeals(): void {
    this.loading = true;
    this.api.get<any>('/v1/deals?page=1&pageSize=50').pipe(
      catchError(() => { this.loading = false; return []; })
    ).subscribe((result: any) => {
      this.products = result?.data?.items || [];
      this.loading = false;
    });
  }

  loadSuppliers(): void {
    this.api.get<any>('/v1/deals/suppliers').pipe(
      catchError(() => [])
    ).subscribe((result: any) => {
      this.suppliers = result?.data || [];
    });
  }

  startCountdown(): void {
    const now = new Date();
    const end = new Date(now);
    end.setHours(23, 59, 59, 999);

    this.timer = setInterval(() => {
      const diff = end.getTime() - Date.now();
      if (diff <= 0) {
        clearInterval(this.timer);
        this.countdown = { hours: 0, minutes: 0, seconds: 0 };
        return;
      }
      this.countdown = {
        hours: Math.floor(diff / 3600000),
        minutes: Math.floor((diff % 3600000) / 60000),
        seconds: Math.floor((diff % 60000) / 1000)
      };
    }, 1000);
  }

  getProductImage(p: DealProduct): string {
    const primary = p.images?.find(i => i.isPrimary);
    return primary?.imageUrl || p.images?.[0]?.imageUrl || '';
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat('fa-IR').format(price);
  }

  /** محاسبه درصد تخفیف معتبر برای داده‌های قدیمی API */
  discountPercentOf(product: DealProduct): number {
    if (product.discountPercent > 0) return product.discountPercent;
    return product.comparePrice > product.unitPrice
      ? Math.round((1 - product.unitPrice / product.comparePrice) * 100)
      : 0;
  }

  /** محاسبه مبلغ صرفه‌جویی برای داده‌های قدیمی API */
  discountAmountOf(product: DealProduct): number {
    if (product.discountAmount > 0) return product.discountAmount;
    return Math.max(0, product.comparePrice - product.unitPrice);
  }

  /** تبدیل پاسخ deals به قرارداد مشترک کارت محصول. */
  toProduct(product: DealProduct): Product {
    return {
      id: product.id,
      categoryId: '',
      name: product.name,
      sku: product.sku,
      slug: product.slug,
      unitPrice: product.unitPrice,
      comparePrice: product.comparePrice,
      imageUrl: this.getProductImage(product),
      shortDescription: product.shortDescription,
      isPhysical: true,
      isDigital: false,
      isFeatured: false,
      isNewArrival: false,
      isBestSeller: false,
      viewCount: product.viewCount,
      ratingAverage: product.ratingAverage,
      ratingCount: product.ratingCount,
      sellerCity: product.sellerCity,
      cityDeliveryDays: product.cityDeliveryDays,
      nationwideDeliveryDays: product.nationwideDeliveryDays,
      discountAmount: this.discountAmountOf(product),
      discountPercent: this.discountPercentOf(product),
      hasDiscount: true,
      images: product.images?.map((image, index) => ({
        id: `${product.id}-${index}`,
        imageUrl: image.imageUrl,
        altText: product.name,
        isPrimary: image.isPrimary,
        displayOrder: index
      })) ?? []
    };
  }
}
