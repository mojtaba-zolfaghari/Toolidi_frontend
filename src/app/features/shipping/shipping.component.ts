import { Component, OnInit } from '@angular/core';
import { ApiService } from '../../core/services/api.service';

/** اطلاعات یک روش ارسال */
interface ShippingOption {
  methodId: string;
  methodName: string;
  description: string;
  baseCost: number;
  zoneCost: number;
  extraCost: number;
  totalCost: number;
  preparationDays: number;
  shippingDays: number;
  totalDays: number;
  freeShipping: boolean;
  freeShippingThreshold: number;
  maxWeight: number | null;
}

/** اطلاعات ارسال برای هر فروشنده */
interface SellerShipping {
  sellerId: string;
  sellerName: string;
  sellerCity: string;
  sellerProvince: string;
  sellerRating: number;
  sellerVerified: boolean;
  sellerLogoUrl: string | null;
  cityDeliveryDays: number;
  nationwideDeliveryDays: number;
  shippingOptions: ShippingOption[];
}

/** پاسخ API */
interface ShippingResponse {
  methods: any[];
  zones: any[];
  sellerShipping: SellerShipping[];
}

/**
 * صفحه روش‌های ارسال؛ نمایش روش‌های ارسال به تفکیک فروشنده
 * با زمان تحویل، هزینه و جزئیات هر روش.
 */
@Component({
  selector: 'app-shipping',
  templateUrl: './shipping.component.html',
  styleUrls: ['./shipping.component.scss']
})
export class ShippingComponent implements OnInit {
  data: ShippingResponse | null = null;
  loading = true;
  selectedSellerId: string | null = null;

  constructor(private readonly api: ApiService) {}

  ngOnInit(): void {
    this.load();
  }

  /** بارگذاری اطلاعات روش‌های ارسال */
  load(): void {
    this.loading = true;
    this.api.get<{ isSuccess: boolean; data: ShippingResponse }>('/v1/public/shipping-by-seller').subscribe({
      next: (res) => {
        this.data = res.data ?? null;
        this.loading = false;
      },
      error: () => {
        this.data = null;
        this.loading = false;
      }
    });
  }

  /** فیلتر بر اساس فروشنده انتخاب شده */
  get filteredSellers(): SellerShipping[] {
    if (!this.data?.sellerShipping) return [];
    if (!this.selectedSellerId) return this.data.sellerShipping;
    return this.data.sellerShipping.filter(s => s.sellerId === this.selectedSellerId);
  }

  /** فرمت قیمت */
  formatPrice(price: number): string {
    return new Intl.NumberFormat('fa-IR').format(price);
  }

  /** آیا ارسال رایگان است */
  isFreeShipping(option: ShippingOption, orderAmount: number = 0): boolean {
    return option.freeShipping && orderAmount >= option.freeShippingThreshold;
  }

  /** متن زمان تحویل */
  getDeliveryText(option: ShippingOption): string {
    const days = option.totalDays;
    if (days <= 1) return 'تحویل فردا';
    if (days <= 2) return `تحویل طی ${days} روز`;
    return `تحویل طی ${days} روز`;
  }

  /** متن آماده‌سازی */
  getPreparationText(option: ShippingOption): string {
    if (option.preparationDays <= 1) return 'ارسال فوری';
    return `${option.preparationDays} روز آماده‌سازی`;
  }

  /** رنگ badge بر اساس زمان تحویل */
  getDeliveryBadgeClass(option: ShippingOption): string {
    if (option.totalDays <= 2) return 'badge-fast';
    if (option.totalDays <= 4) return 'badge-medium';
    return 'badge-slow';
  }

  /** آیکون روش ارسال */
  getMethodIcon(name: string): string {
    if (name.includes('موتوری')) return '🏍️';
    if (name.includes('پیشتاز') || name.includes('پست')) return '📦';
    if (name.includes('تیپاکس')) return '🚚';
    if (name.includes('باربری')) return '🚛';
    return '📮';
  }

  /** تعداد کل فروشندگان */
  get sellerCount(): number {
    return this.data?.sellerShipping?.length ?? 0;
  }

  /** بهترین زمان تحویل از بین همه فروشندگان */
  get fastestOverall(): number {
    if (!this.data?.sellerShipping) return 0;
    let min = 999;
    for (const seller of this.data.sellerShipping) {
      for (const opt of seller.shippingOptions) {
        if (opt.totalDays < min) min = opt.totalDays;
      }
    }
    return min === 999 ? 0 : min;
  }
}
