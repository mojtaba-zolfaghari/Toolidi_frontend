import { Component, OnInit } from '@angular/core';
import { SupplierService, SupplierOrder } from '../../../core/services/api/supplier.service';
import { SharedModule } from '../../../shared/shared.module';

@Component({
  selector: 'app-supplier-orders',
  template: `
    <section class="space-y-6">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-extrabold text-secondary">سفارشات تأمین 🛒</h1>
          <p class="text-gray-500 mt-1">پیگیری و پردازش سفارشات فروشندگان</p>
        </div>
      </div>

      <!-- Status Tabs -->
      <div class="flex gap-2 flex-wrap">
        <button *ngFor="let tab of statusTabs" (click)="activeStatus = tab.value"
                class="px-4 py-2 rounded-xl text-sm font-medium transition-all"
                [class]="activeStatus === tab.value ? 'bg-green-600 text-white shadow-lg' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'">
          {{ tab.label }} ({{ getCountByStatus(tab.value) }})
        </button>
      </div>

      <!-- Orders List -->
      <div class="space-y-3">
        <div *ngFor="let order of filteredOrders" class="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-all">
          <div class="flex items-start justify-between gap-4">
            <div class="flex items-center gap-4">
              <div class="w-12 h-12 rounded-xl flex items-center justify-center text-xl"
                   [class]="order.status === 'Pending' ? 'bg-yellow-100' : order.status === 'Processing' ? 'bg-blue-100' : order.status === 'Shipped' ? 'bg-purple-100' : 'bg-green-100'">
                {{ order.status === 'Pending' ? '⏳' : order.status === 'Processing' ? '⚙️' : order.status === 'Shipped' ? '🚚' : '✅' }}
              </div>
              <div>
                <div class="flex items-center gap-2">
                  <span class="font-bold text-secondary">{{ order.orderNumber }}</span>
                  <span class="text-xs px-2 py-0.5 rounded-full" [ngClass]="getStatusColor(order.status)">
                    {{ getStatusLabel(order.status) }}
                  </span>
                </div>
                <p class="text-sm text-gray-500 mt-1">{{ order.customerName }} — {{ order.productName }}</p>
                <div class="flex items-center gap-3 mt-2 text-xs text-gray-400">
                  <span>📍 {{ order.city }}</span>
                  <span>📦 {{ order.quantity }} عدد</span>
                  <span>💰 {{ formatCurrency(order.totalAmount) }}</span>
                </div>
              </div>
            </div>
            <div class="flex gap-2 shrink-0">
              <button (click)="openChat(order.id)"
                      class="rounded-lg bg-teal-600 text-white px-3 py-1.5 text-xs font-bold hover:bg-teal-700">
                💬 چت با فروشنده
              </button>
              <button *ngIf="order.status === 'Pending'" (click)="updateStatus(order, 'Processing')"
                      class="rounded-lg bg-blue-600 text-white px-3 py-1.5 text-xs font-bold hover:bg-blue-700">
                شروع پردازش
              </button>
              <button *ngIf="order.status === 'Processing'" (click)="updateStatus(order, 'Shipped')"
                      class="rounded-lg bg-purple-600 text-white px-3 py-1.5 text-xs font-bold hover:bg-purple-700">
                ارسال
              </button>
              <button *ngIf="order.status === 'Shipped'" (click)="updateStatus(order, 'Delivered')"
                      class="rounded-lg bg-green-600 text-white px-3 py-1.5 text-xs font-bold hover:bg-green-700">
                تحویل شد
              </button>
            </div>
          </div>
        </div>
      </div>
      <p *ngIf="!filteredOrders.length" class="text-gray-400 text-center py-12">سفارشی در این وضعیت وجود ندارد</p>
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
export class SupplierOrdersComponent implements OnInit {
  orders: SupplierOrder[] = [];
  activeStatus = 'all';
  chatOrderId = '';

  statusTabs = [
    { value: 'all', label: 'همه' },
    { value: 'Pending', label: 'در انتظار' },
    { value: 'Processing', label: 'در حال پردازش' },
    { value: 'Shipped', label: 'ارسال شده' },
    { value: 'Delivered', label: 'تحویل شده' },
    { value: 'Cancelled', label: 'لغو شده' }
  ];

  constructor(private readonly supplierService: SupplierService) {}

  ngOnInit(): void {
    this.loadOrders();
  }

  loadOrders(): void {
    this.supplierService.getOrders().subscribe({
      next: (result) => { this.orders = result.data ?? []; },
      error: () => {
        this.orders = [
          { id: '1', orderNumber: 'ORD-1001', customerName: 'فروشنده اصفهان', productName: 'انگشتر نقره', quantity: 5, totalAmount: 2500000, status: 'Pending', createdAt: new Date().toISOString(), city: 'اصفهان' },
          { id: '2', orderNumber: 'ORD-1002', customerName: 'فروشنده تهران', productName: 'دستبند طلا', quantity: 3, totalAmount: 8400000, status: 'Processing', createdAt: new Date().toISOString(), city: 'تهران' },
          { id: '3', orderNumber: 'ORD-1003', customerName: 'فروشنده شیراز', productName: 'گردنبند زمرد', quantity: 2, totalAmount: 6200000, status: 'Shipped', createdAt: new Date().toISOString(), city: 'شیراز' },
          { id: '4', orderNumber: 'ORD-1004', customerName: 'فروشنده مشهد', productName: 'سرویس نقره', quantity: 1, totalAmount: 8500000, status: 'Delivered', createdAt: new Date().toISOString(), city: 'مشهد' },
          { id: '5', orderNumber: 'ORD-1005', customerName: 'فروشنده تبریز', productName: 'سنگ فیروزه', quantity: 10, totalAmount: 3000000, status: 'Cancelled', createdAt: new Date().toISOString(), city: 'تبریز' },
          { id: '6', orderNumber: 'ORD-1006', customerName: 'فروشنده کرج', productName: 'حلقه ازدواج', quantity: 4, totalAmount: 14000000, status: 'Pending', createdAt: new Date().toISOString(), city: 'کرج' },
        ];
      }
    });
  }

  get filteredOrders(): SupplierOrder[] {
    if (this.activeStatus === 'all') return this.orders;
    return this.orders.filter(o => o.status === this.activeStatus);
  }

  getCountByStatus(status: string): number {
    if (status === 'all') return this.orders.length;
    return this.orders.filter(o => o.status === status).length;
  }

  updateStatus(order: SupplierOrder, newStatus: string): void {
    order.status = newStatus;
  }

  openChat(orderId: string): void {
    this.chatOrderId = orderId;
  }

  closeChat(): void {
    this.chatOrderId = '';
  }

  getStatusLabel(status: string): string {
    const labels: { [key: string]: string } = {
      'Pending': 'در انتظار', 'Processing': 'در حال پردازش', 'Shipped': 'ارسال شده',
      'Delivered': 'تحویل شده', 'Cancelled': 'لغو شده', 'InTransit': 'در مسیر'
    };
    return labels[status] || status;
  }

  getStatusColor(status: string): string {
    const colors: { [key: string]: string } = {
      'Pending': 'bg-yellow-100 text-yellow-700', 'Processing': 'bg-blue-100 text-blue-700',
      'Shipped': 'bg-purple-100 text-purple-700', 'Delivered': 'bg-green-100 text-green-700',
      'Cancelled': 'bg-red-100 text-red-700'
    };
    return colors[status] || 'bg-gray-100 text-gray-600';
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('fa-IR').format(amount) + ' تومان';
  }
}
