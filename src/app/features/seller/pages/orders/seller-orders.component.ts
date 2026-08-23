import { Component, OnInit } from '@angular/core';
import { SellerService } from '../../../../core/services/api/seller.service';

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
          <p class="text-gray-500 mt-1">پیگیری و مدیریت سفارشات فروش</p>
        </div>
        <button (click)="loadOrders()" class="rounded-xl border border-gray-200 px-4 py-2 text-sm text-gray-600 hover:bg-gray-50">
          🔄 بروزرسانی
        </button>
      </div>

      <!-- Stats -->
      <div class="grid grid-cols-2 md:grid-cols-5 gap-3">
        <div class="bg-white rounded-xl p-4 shadow-sm border border-gray-100 text-center">
          <p class="text-2xl font-bold text-secondary">{{ orders.length }}</p>
          <p class="text-xs text-gray-500">کل</p>
        </div>
        <div class="bg-yellow-50 rounded-xl p-4 border border-yellow-100 text-center">
          <p class="text-2xl font-bold text-yellow-600">{{ getCount('Pending') }}</p>
          <p class="text-xs text-yellow-600">در انتظار</p>
        </div>
        <div class="bg-blue-50 rounded-xl p-4 border border-blue-100 text-center">
          <p class="text-2xl font-bold text-blue-600">{{ getCount('Processing') }}</p>
          <p class="text-xs text-blue-600">پردازش</p>
        </div>
        <div class="bg-purple-50 rounded-xl p-4 border border-purple-100 text-center">
          <p class="text-2xl font-bold text-purple-600">{{ getCount('Shipped') }}</p>
          <p class="text-xs text-purple-600">ارسال شده</p>
        </div>
        <div class="bg-green-50 rounded-xl p-4 border border-green-100 text-center">
          <p class="text-2xl font-bold text-green-600">{{ getCount('Delivered') }}</p>
          <p class="text-xs text-green-600">تحویل شده</p>
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
              <p class="text-sm text-gray-500">خریدار: {{ order.customerName }}</p>
              <div class="mt-2 space-y-1">
                <div *ngFor="let item of order.items" class="text-xs text-gray-400">
                  📦 {{ item.productName }} × {{ item.quantity }} — {{ formatCurrency(item.price * item.quantity) }}
                </div>
              </div>
            </div>
            <div class="text-left shrink-0">
              <p class="text-lg font-bold text-primary">{{ formatCurrency(order.totalAmount) }}</p>
              <p class="text-xs text-gray-400 mt-1">📍 {{ order.shippingCity }}</p>
              <p class="text-xs text-gray-400">{{ order.createdAt | persianDate:'yyyy/MM/dd HH:mm' }}</p>
            </div>
          </div>
          <div class="flex gap-2 mt-4 pt-3 border-t border-gray-100">
            <button *ngIf="order.status === 'Pending'" class="text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700">
              تأیید سفارش
            </button>
            <button *ngIf="order.status === 'Processing'" class="text-xs bg-purple-600 text-white px-3 py-1.5 rounded-lg hover:bg-purple-700">
              ارسال سفارش
            </button>
            <button class="text-xs text-gray-400 hover:text-gray-600 px-3 py-1.5 rounded-lg hover:bg-gray-50">
              جزئیات
            </button>
          </div>
        </div>
      </div>
      <p *ngIf="!filteredOrders.length" class="text-gray-400 text-center py-12">سفارشی یافت نشد</p>
    </section>
  `
})
export class SellerOrdersComponent implements OnInit {
  orders: SellerOrder[] = [];
  activeStatus = 'all';

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
    this.sellerService.getOrders({ page: 1, pageSize: 100 }).subscribe({
      next: (result: any) => {
        const items = result?.data?.items ?? result?.data ?? [];
        this.orders = Array.isArray(items) ? items : this.getMockOrders();
      },
      error: () => { this.orders = this.getMockOrders(); }
    });
  }

  private getMockOrders(): SellerOrder[] {
    return [
      { id: '1', orderNumber: 'ORD-2001', customerName: 'علی محمدی', items: [{ productName: 'انگشتر نقره', quantity: 3, price: 1200000 }], totalAmount: 3600000, status: 'Pending', createdAt: new Date().toISOString(), shippingCity: 'تهران' },
      { id: '2', orderNumber: 'ORD-2002', customerName: 'سارا احمدی', items: [{ productName: 'دستبند طلا', quantity: 1, price: 8500000 }], totalAmount: 8500000, status: 'Processing', createdAt: new Date().toISOString(), shippingCity: 'اصفهان' },
      { id: '3', orderNumber: 'ORD-2003', customerName: 'رضا کریمی', items: [{ productName: 'گردنبند زمرد', quantity: 2, price: 3100000 }], totalAmount: 6200000, status: 'Shipped', createdAt: new Date().toISOString(), shippingCity: 'شیراز' },
      { id: '4', orderNumber: 'ORD-2004', customerName: 'نیلوفر حسینی', items: [{ productName: 'سرویس نقره', quantity: 1, price: 8500000 }], totalAmount: 8500000, status: 'Delivered', createdAt: new Date().toISOString(), shippingCity: 'مشهد' },
      { id: '5', orderNumber: 'ORD-2005', customerName: 'امیر رضایی', items: [{ productName: 'سنگ فیروزه', quantity: 10, price: 300000 }], totalAmount: 3000000, status: 'Cancelled', createdAt: new Date().toISOString(), shippingCity: 'تبریز' },
    ];
  }

  get filteredOrders(): SellerOrder[] {
    if (this.activeStatus === 'all') return this.orders;
    return this.orders.filter(o => o.status === this.activeStatus);
  }

  getCount(status: string): number {
    return this.orders.filter(o => o.status === status).length;
  }

  getStatusLabel(status: string): string {
    const labels: { [k: string]: string } = { 'Pending': 'در انتظار', 'Processing': 'پردازش', 'Shipped': 'ارسال شده', 'Delivered': 'تحویل شده', 'Cancelled': 'لغوشده' };
    return labels[status] || status;
  }

  getStatusColor(status: string): string {
    const colors: { [k: string]: string } = { 'Pending': 'bg-yellow-100 text-yellow-700', 'Processing': 'bg-blue-100 text-blue-700', 'Shipped': 'bg-purple-100 text-purple-700', 'Delivered': 'bg-green-100 text-green-700', 'Cancelled': 'bg-red-100 text-red-700' };
    return colors[status] || 'bg-gray-100 text-gray-600';
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('fa-IR').format(amount) + ' تومان';
  }
}
