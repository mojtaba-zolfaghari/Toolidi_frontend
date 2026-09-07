import { Component, OnInit, ChangeDetectionStrategy } from '@angular/core';
import { SellerService, SellerOrderWithProfit } from '../../../../core/services/api/seller.service';

interface SellerOrder {
  id: string;
  orderNumber: string;
  customerName: string;
  items: { productName: string; quantity: number; price: number }[];
  totalAmount: number;
  status: string;
  createdAt: string;
  shippingCity: string;
}

/** سفارشات فروشنده با جزئیات سود — BEM + متریال (جانشین کلاس‌های Tailwind) */
@Component({
    selector: 'app-seller-orders',
    styleUrls: ['./seller-orders.component.scss'],
    template: `
    <section class="seller-orders" dir="rtl">
      <header class="seller-orders__header">
        <div>
          <h1 class="seller-orders__title">سفارشات من 🛒</h1>
          <p class="seller-orders__subtitle">پیگیری سفارشات، سود واقعی و گفتگو با تأمین‌کننده</p>
        </div>
        <button type="button" mat-stroked-button color="primary" (click)="loadOrders()">🔄 بروزرسانی</button>
      </header>
    
      <!-- کارت‌های آمار -->
      <div class="seller-orders__stats">
        <div class="seller-orders__stat">
          <p class="seller-orders__stat-value">{{ profitOrders.length | persianNumber }}</p>
          <p class="seller-orders__stat-label">کل سفارشات</p>
        </div>
        <div class="seller-orders__stat seller-orders__stat--info">
          <p class="seller-orders__stat-value">{{ formatCurrencyShort(totalRevenue) }}</p>
          <p class="seller-orders__stat-label">درآمد (بدون مالیات)</p>
        </div>
        <div class="seller-orders__stat seller-orders__stat--warn">
          <p class="seller-orders__stat-value">{{ formatCurrencyShort(totalCost) }}</p>
          <p class="seller-orders__stat-label">قیمت خرید از تأمین‌کننده</p>
        </div>
        <div class="seller-orders__stat seller-orders__stat--ok">
          <p class="seller-orders__stat-value">{{ formatCurrencyShort(totalProfit) }}</p>
          <p class="seller-orders__stat-label">سود ناخالص شما</p>
        </div>
      </div>
    
      <!-- فیلتر وضعیت -->
      <div class="seller-orders__tabs" role="tablist">
        @for (tab of statusTabs; track tab) {
          <button type="button" (click)="activeStatus = tab.value"
            class="seller-orders__tab" [class.seller-orders__tab--active]="activeStatus === tab.value">
            {{ tab.label }}
          </button>
        }
      </div>
    
      <!-- فهرست سفارش‌ها -->
      <div class="seller-orders__list">
        @for (order of filteredOrders; track order) {
          <article class="seller-orders__item">
            <div class="seller-orders__item-main">
              <div class="seller-orders__item-head">
                <span class="seller-orders__order-number">{{ order.orderNumber }}</span>
                <span class="seller-orders__badge" [ngClass]="getStatusColor(order.status)">
                  {{ getStatusLabel(order.status) }}
                </span>
              </div>
              <ul class="seller-orders__items">
                @for (item of order.items; track item) {
                  <li class="seller-orders__line">
                    📦 {{ item.productName }} × {{ item.quantity | persianNumber }}
                    <span class="seller-orders__line-muted">
                      — فروش: {{ formatCurrencyShort(item.unitPrice * item.quantity) }}
                    </span>
                    @if (item.supplierUnitCost > 0) {
                      <span class="seller-orders__line-cost">
                        | خرید: {{ formatCurrencyShort(item.supplierTotalCost) }}
                      </span>
                    }
                    @if (item.supplierUnitCost > 0) {
                      <span
                        class="seller-orders__line-profit"
                        [class.seller-orders__line-profit--neg]="item.grossProfit <= 0">
                        | سود: {{ formatCurrencyShort(item.grossProfit) }}
                      </span>
                    }
                  </li>
                }
              </ul>
            </div>
            <div class="seller-orders__item-side">
              <p class="seller-orders__revenue">{{ formatCurrencyShort(order.revenue) }}</p>
              @if (order.supplierCost > 0) {
                <p class="seller-orders__profit">
                  سود: {{ formatCurrencyShort(order.profit) }}
                </p>
              }
              <p class="seller-orders__date">{{ order.createdAt | persianDate:'yyyy/MM/dd HH:mm' }}</p>
              <button type="button" mat-flat-button class="seller-orders__chat-btn" (click)="openChat(order.orderId)">
                💬 چت سفارش
              </button>
            </div>
          </article>
        }
      </div>
      @if (!filteredOrders.length) {
        <p class="seller-orders__empty">سفارشی یافت نشد</p>
      }
    </section>
    
    <!-- مودال چت -->
    @if (chatOrderId) {
      <div class="seller-orders__modal-overlay" (click)="closeChat()">
        <div class="seller-orders__modal" (click)="$event.stopPropagation()">
          <app-order-chat [orderId]="chatOrderId" (closed)="closeChat()"></app-order-chat>
        </div>
      </div>
    }
    `,
    changeDetection: ChangeDetectionStrategy.Eager,
    standalone: false
})
export class SellerOrdersComponent implements OnInit {
  /** سفارشات با جزئیات سود (داده داخلی) */
  profitOrders: SellerOrderWithProfit[] = [];
  activeStatus = 'all';
  chatOrderId = '';

  statusTabs = [
    { value: 'all', label: 'همه' },
    { value: 'Pending', label: 'در انتظار' },
    { value: 'Processing', label: 'در حال پردازش' },
    { value: 'Shipped', label: 'ارسال شده' },
    { value: 'Delivered', label: 'تحویل شده' },
    { value: 'Cancelled', label: 'لغوشده' }
  ];

  constructor(private readonly sellerService: SellerService) {}

  ngOnInit(): void {
    this.loadOrders();
  }

  loadOrders(): void {
    this.sellerService.getOrdersWithProfit().subscribe({
      next: (result) => {
        this.profitOrders = result.data ?? [];
      },
      error: () => { this.profitOrders = []; }
    });
  }

  get filteredOrders(): SellerOrderWithProfit[] {
    if (this.activeStatus === 'all') return this.profitOrders;
    return this.profitOrders.filter(o => o.status === this.activeStatus);
  }

  get totalRevenue(): number {
    return this.profitOrders.reduce((s, o) => s + o.revenue, 0);
  }

  get totalCost(): number {
    return this.profitOrders.reduce((s, o) => s + o.supplierCost, 0);
  }

  get totalProfit(): number {
    return this.profitOrders.reduce((s, o) => s + o.profit, 0);
  }

  openChat(orderId: string): void {
    this.chatOrderId = orderId;
  }

  closeChat(): void {
    this.chatOrderId = '';
  }

  getStatusLabel(status: string): string {
    const labels: { [k: string]: string } = { 'Pending': 'در انتظار', 'Processing': 'پردازش', 'Shipped': 'ارسال شده', 'Delivered': 'تحویل شده', 'Cancelled': 'لغوشده' };
    return labels[status] || status;
  }

  /** کلاس BEM نشانگر وضعیت (استایل در SCSS — بدون کلاس Tailwind) */
  getStatusColor(status: string): string {
    const colors: { [k: string]: string } = {
      'Pending': 'seller-orders__badge--pending',
      'Processing': 'seller-orders__badge--processing',
      'Shipped': 'seller-orders__badge--shipped',
      'Delivered': 'seller-orders__badge--delivered',
      'Cancelled': 'seller-orders__badge--cancelled'
    };
    return colors[status] || 'seller-orders__badge--default';
  }

  formatCurrencyShort(amount: number): string {
    return new Intl.NumberFormat('fa-IR').format(Math.round(amount));
  }
}
