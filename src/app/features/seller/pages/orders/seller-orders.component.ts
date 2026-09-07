import { Component, OnInit } from '@angular/core';
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

@Component({
  selector: 'app-seller-orders',
  template: `
    <section class="space-y-6">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-extrabold text-secondary">سفارشات من 🛒</h1>
          <p class="text-gray-500 mt-1">پیگیری سفارشات، سود واقعی و گفتگو با تأمین‌کننده</p>
        </div>
        <button (click)="loadOrders()" class="rounded-xl border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50">
          🔄 بروزرسانی
        </button>
      </div>

      <!-- Stats -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div class="bg-white rounded-xl p-4 shadow-sm border border-gray-100 text-center">
          <p class="text-2xl font-bold text-secondary">{{ profitOrders.length }}</p>
          <p class="text-xs text-gray-500">کل سفارشات</p>
        </div>
        <div class="bg-blue-50 rounded-xl p-4 border border-blue-100 text-center">
          <p class="text-2xl font-bold text-blue-600">{{ formatCurrencyShort(totalRevenue) }}</p>
          <p class="text-xs text-blue-600">درآمد (بدون مالیات)</p>
        </div>
        <div class="bg-yellow-50 rounded-xl p-4 border border-yellow-100 text-center">
          <p class="text-2xl font-bold text-yellow-600">{{ formatCurrencyShort(totalCost) }}</p>
          <p class="text-xs text-yellow-600">قیمت خرید از تأمین‌کننده</p>
        </div>
        <div class="bg-green-50 rounded-xl p-4 border border-green-100 text-center">
          <p class="text-2xl font-bold text-green-600">{{ formatCurrencyShort(totalProfit) }}</p>
          <p class="text-xs text-green-600">سود ناخالص شما</p>
        </div>
      </div>

      <!-- Filters -->
      <div class="flex gap-2 flex-wrap">
        <button *ngFor="let tab of statusTabs" (click)="activeStatus = tab.value"
                class="px-4 py-2 rounded-xl text-sm font-medium transition-all"
                [class]="activeStatus === tab.value ? 'bg-primary text-white shadow-lg' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'">
          {{ tab.label }}
        </button>
      </div>

      <!-- Orders -->
      <div class="space-y-3">
        <div *ngFor="let order of filteredOrders" class="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-all">
          <div class="flex items-start justify-between gap-4">
            <div class="flex-1">
              <div class="flex items-center gap-2 mb-2">
                <span class="font-mono text-xs bg-gray-100 px-2 py-0.5 rounded">{{ order.orderNumber }}</span>
                <span class="text-xs px-2 py-0.5 rounded-full font-medium" [ngClass]="getStatusColor(order.status)">
                  {{ getStatusLabel(order.status) }}
                </span>
              </div>
              <div class="mt-2 space-y-1">
                <div *ngFor="let item of order.items" class="text-xs">
                  📦 {{ item.productName }} × {{ item.quantity }}
                  <span class="text-gray-400">
                    — فروش: {{ formatCurrencyShort(item.unitPrice * item.quantity) }}
                  </span>
                  <span class="text-yellow-600" *ngIf="item.supplierUnitCost > 0">
                    | خرید: {{ formatCurrencyShort(item.supplierTotalCost) }}
                  </span>
                  <span class="font-bold" [class.text-green-600]="item.grossProfit > 0" [class.text-red-500]="item.grossProfit <= 0"
                        *ngIf="item.supplierUnitCost > 0">
                    | سود: {{ formatCurrencyShort(item.grossProfit) }}
                  </span>
                </div>
              </div>
            </div>
            <div class="text-left shrink-0">
              <p class="text-lg font-bold text-primary">{{ formatCurrencyShort(order.revenue) }}</p>
              <p *ngIf="order.supplierCost > 0" class="text-xs text-green-600 font-bold mt-1">
                سود: {{ formatCurrencyShort(order.profit) }}
              </p>
              <p class="text-xs text-gray-400 mt-1">{{ order.createdAt | persianDate:'yyyy/MM/dd HH:mm' }}</p>
              <button (click)="openChat(order.orderId)"
                      class="mt-2 text-xs bg-teal-600 text-white px-3 py-1.5 rounded-lg hover:bg-teal-700">
                💬 چت سفارش
              </button>
            </div>
          </div>
        </div>
      </div>
      <p *ngIf="!filteredOrders.length" class="text-gray-400 text-center py-12">سفارشی یافت نشد</p>
    </section>

    <!-- Chat Modal -->
    <div *ngIf="chatOrderId" class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div class="absolute inset-0 bg-black/40" (click)="closeChat()"></div>
      <div class="relative bg-gray-50 rounded-2xl shadow-2xl w-full max-w-lg h-[70vh] p-5 flex flex-col">
        <app-order-chat [orderId]="chatOrderId" (closed)="closeChat()"></app-order-chat>
      </div>
    </div>
  `
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

  getStatusColor(status: string): string {
    const colors: { [k: string]: string } = { 'Pending': 'bg-yellow-100 text-yellow-700', 'Processing': 'bg-blue-100 text-blue-700', 'Shipped': 'bg-purple-100 text-purple-700', 'Delivered': 'bg-green-100 text-green-700', 'Cancelled': 'bg-red-100 text-red-700' };
    return colors[status] || 'bg-gray-100 text-gray-600';
  }

  formatCurrencyShort(amount: number): string {
    return new Intl.NumberFormat('fa-IR').format(Math.round(amount));
  }
}
